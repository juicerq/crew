import { homedir } from "node:os"
import { join } from "node:path"
import type { ExtensionAPI, ModelRegistry } from "@earendil-works/pi-coding-agent"
import { Type } from "typebox"
import { SubagentManager } from "./subagent-manager.ts"
import { SubagentNotifications } from "./subagent-notifications.ts"
import type { MainContext, SubagentMessage } from "./types.ts"
import { WorktreeManager } from "./worktree-manager.ts"

const permissionsSchema = Type.Object({
	allow: Type.Optional(Type.Array(Type.String({ description: "Allowed tool or operation glob, such as read, bash:*, or *" }))),
	deny: Type.Optional(Type.Array(Type.String({ description: "Denied tool or operation glob. Deny takes precedence over allow." }))),
})

const effortSchema = Type.Union([
	Type.Literal("off"),
	Type.Literal("minimal"),
	Type.Literal("low"),
	Type.Literal("medium"),
	Type.Literal("high"),
	Type.Literal("xhigh"),
	Type.Literal("max"),
])

const worktreeParameters = Type.Union([
	Type.Object({
		action: Type.Literal("create"),
		task: Type.String(),
		base: Type.Optional(Type.String()),
		branch: Type.Optional(Type.String()),
		existingBranch: Type.Optional(Type.String()),
		path: Type.Optional(Type.String()),
		detached: Type.Optional(Type.Boolean()),
	}),
	Type.Object({ action: Type.Literal("list") }),
	Type.Object({
		action: Type.Literal("remove"),
		path: Type.String(),
		force: Type.Optional(Type.Boolean()),
		deleteBranch: Type.Optional(Type.Boolean()),
	}),
])

function subagentParameters(models: string[]) {
	const spawnFields = {
		objective: Type.String(),
		cwd: Type.Optional(Type.String()),
		model: Type.Optional(Type.String({ enum: models, description: "Authenticated model. Informal aliases such as luna are valid when listed." })),
		effort: Type.Optional(effortSchema),
		tools: Type.Optional(Type.Array(Type.String())),
		permissions: Type.Optional(permissionsSchema),
	}
	return Type.Union([
		Type.Object({ action: Type.Literal("spawn"), ...spawnFields }),
		Type.Object({ action: Type.Literal("status"), id: Type.Optional(Type.String()) }),
		Type.Object({ action: Type.Literal("wait"), id: Type.String(), timeoutMs: Type.Optional(Type.Number({ minimum: 1 })) }),
		Type.Object({ action: Type.Literal("standby"), ids: Type.Optional(Type.Array(Type.String())) }),
		Type.Object({ action: Type.Literal("message"), id: Type.String(), message: Type.String(), replyTo: Type.Optional(Type.String()) }),
		Type.Object({ action: Type.Literal("permissions"), id: Type.String(), permissions: permissionsSchema }),
		Type.Object({ action: Type.Literal("interrupt"), id: Type.String() }),
		Type.Object({ action: Type.Literal("result"), id: Type.String() }),
		Type.Object({ action: Type.Literal("transcript"), id: Type.String() }),
		Type.Object({ action: Type.Literal("follow_up"), id: Type.String(), ...spawnFields }),
		Type.Object({ action: Type.Literal("discard"), id: Type.String() }),
	])
}

function authenticatedModelNames(registry: ModelRegistry): string[] {
	const models = registry.getAvailable()
	const candidates = models.flatMap((model) => {
		const alias = model.id.split("-").at(-1)!
		return [`${model.provider}/${model.id}`, model.id, alias]
	})
	return [...new Set(candidates)].filter((candidate) => {
		if (candidate.includes("/")) return true
		return candidates.filter((value) => value === candidate).length === 1
	})
}

function textResult(value: unknown) {
	return {
		content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
		details: {},
	}
}

export default function agentOrchestration(pi: ExtensionAPI) {
	const worktrees = new WorktreeManager()
	const watchedSettlements = new Set<string>()
	let subagents: SubagentManager | undefined
	let currentCwd = process.cwd()
	let currentModel: string | undefined
	let subagentToolRegistered = false
	let agentBusy = false

	const notifications = new SubagentNotifications((id, message) => {
		const wake = message.kind === "blocked" || message.kind === "question"

		if (!agentBusy && !wake) return

		pi.sendMessage({
			customType: "subagent-message",
			content: `[subagent ${id}] ${message.kind}: ${message.message}\nmessage_id: ${message.id}`,
			display: false,
			details: { subagentId: id, ...message },
		}, { deliverAs: "steer", triggerTurn: wake })
	})

	function watchSettlement(id: string) {
		if (watchedSettlements.has(id)) return

		watchedSettlements.add(id)
		requireManager().wait(id).then((record) => {
			watchedSettlements.delete(id)
			pi.sendMessage({
				customType: "subagent-message",
				content: `[subagent ${record.id}] ${record.state}: ${record.result ?? record.error ?? "no result"}`,
				display: false,
				details: { subagentId: record.id, state: record.state, result: record.result, error: record.error },
			}, { deliverAs: "steer", triggerTurn: true })
		})
	}

	function createManager(registry: ModelRegistry) {
		return new SubagentManager({
			agentDir: join(homedir(), ".pi", "agent"),
			modelRegistry: registry,
			notify(id: string, message: SubagentMessage) {
				notifications.push(id, message)
			},
		})
	}

	function requireManager() {
		if (!subagents) throw new Error("Subagent manager is unavailable before session start")
		return subagents
	}

	function mainContext(): MainContext {
		if (!currentModel) throw new Error("The main session has no active model")
		return {
			cwd: currentCwd,
			model: currentModel,
			effort: pi.getThinkingLevel(),
			tools: pi.getActiveTools().filter((tool) => tool !== "subagent" && tool !== "worktree"),
			permissions: { allow: ["*"], deny: [] },
		}
	}

	function registerSubagentTool(registry: ModelRegistry) {
		if (subagentToolRegistered) return
		subagentToolRegistered = true
		const models = authenticatedModelNames(registry)
		pi.registerTool({
			name: "subagent",
			label: "Subagent",
			description: `Spawn and control asynchronous subagents. Valid authenticated model values are exposed in the model schema, including aliases. Invoke directly; never ask the user for provider or model IDs. Available models: ${models.join(", ")}. Maximum active concurrency is 10.`,
			promptGuidelines: [
				"When the user requests a subagent model, select it from the model field's enumerated values and invoke immediately. Never ask the user for a provider or model ID.",
				"Omit model only when the user did not request a different model.",
				"When subagents are running and you have nothing left to do, call standby and end your turn. Each settling subagent wakes you with its result. Prefer standby over blocking wait or polling status.",
			],
			parameters: subagentParameters(models),
			async execute(_toolCallId, params) {
				const manager = requireManager()
				if (params.action === "spawn") {
					const record = await manager.spawn(params, mainContext())
					notifications.attach(record.id)
					return textResult(record)
				}
				if (params.action === "status") return textResult(await manager.status(params.id))
				if (params.action === "wait") return textResult(await manager.wait(params.id, params.timeoutMs))
				if (params.action === "standby") {
					const unsettled = (await manager.status()).filter((record) => record.state === "queued" || record.state === "running" || record.state === "blocked")
					const targets = params.ids ? unsettled.filter((record) => params.ids!.includes(record.id)) : unsettled

					for (const record of targets) watchSettlement(record.id)

					return textResult({
						watching: targets.map((record) => record.id),
						instruction: targets.length > 0
							? "End your turn now. Each subagent wakes you when it settles."
							: "No unsettled subagents to watch.",
					})
				}
				if (params.action === "message") {
					await manager.message(params.id, params.message, params.replyTo)
					return textResult({ delivered: true })
				}
				if (params.action === "permissions") {
					await manager.updatePermissions(params.id, params.permissions)
					return textResult({ updated: true })
				}
				if (params.action === "interrupt") {
					await manager.interrupt(params.id)
					return textResult({ interrupted: true })
				}
				if (params.action === "result") return textResult((await manager.status(params.id))[0]!)
				if (params.action === "transcript") return textResult({ transcript: await manager.transcript(params.id) })
				if (params.action === "follow_up") {
					notifications.attach(params.id)
					return textResult(await manager.followUp(params.id, params))
				}
				await manager.discard(params.id)
				return textResult({ discarded: true })
			},
		})
	}

	pi.on("session_start", (_event, ctx) => {
		currentCwd = ctx.cwd
		currentModel = ctx.model ? `${ctx.model.provider}/${ctx.model.id}` : undefined
		subagents ??= createManager(ctx.modelRegistry)
		registerSubagentTool(ctx.modelRegistry)
	})

	pi.on("session_tree", async () => {
		if (!subagents) return
		notifications.detach((await subagents.status()).map((record) => record.id))
	})

	pi.on("model_select", (event) => {
		currentModel = `${event.model.provider}/${event.model.id}`
	})

	pi.on("agent_start", () => {
		agentBusy = true
	})

	pi.on("agent_settled", (_event, ctx) => {
		agentBusy = !ctx.isIdle()
	})

	pi.on("session_shutdown", async () => {
		await subagents?.shutdown()
	})

	pi.registerTool({
		name: "worktree",
		label: "Worktree",
		description: "Create, list, or explicitly remove persistent Git worktrees independently from subagents.",
		parameters: worktreeParameters,
		async execute(_id, params) {
			if (params.action === "create") return textResult(await worktrees.create({ cwd: currentCwd, ...params }))
			if (params.action === "list") return textResult(await worktrees.list(currentCwd))
			await worktrees.remove({ cwd: currentCwd, ...params })
			return textResult({ removed: params.path, branchDeleted: params.deleteBranch ?? false })
		},
	})

}
