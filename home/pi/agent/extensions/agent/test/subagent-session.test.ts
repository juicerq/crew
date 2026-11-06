import { afterEach, describe, expect, test } from "bun:test"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fauxAssistantMessage, fauxToolCall, registerFauxProvider } from "@earendil-works/pi-ai/compat"
import { AuthStorage, ModelRegistry } from "@earendil-works/pi-coding-agent"
import { SubagentSession } from "../src/subagent-session.ts"

const roots: string[] = []

afterEach(async () => {
	await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

async function setup(permissions: { allow: string[]; deny: string[] }, reasoning = true) {
	const root = await mkdtemp(join(tmpdir(), "pi-session-test-"))
	roots.push(root)
	const faux = registerFauxProvider({
		api: "openai-completions",
		provider: `faux-${crypto.randomUUID()}`,
		models: [{ id: "worker", reasoning }],
		tokensPerSecond: 100_000,
	})
	const authStorage = AuthStorage.create(join(root, "auth.json"))
	authStorage.setRuntimeApiKey(faux.getModel().provider, "test")
	const modelRegistry = ModelRegistry.inMemory(authStorage)
	const model = faux.getModel()
	modelRegistry.registerProvider(model.provider, {
		api: "openai-completions",
		apiKey: "test",
		baseUrl: "http://faux.invalid",
		models: [{
			id: model.id,
			name: model.name,
			reasoning: model.reasoning,
			input: model.input,
			cost: model.cost,
			contextWindow: model.contextWindow,
			maxTokens: model.maxTokens,
		}],
	})
	const messages: Array<{ kind: string; message: string }> = []
	const session = new SubagentSession({
		objective: "Run the requested operation.",
		cwd: root,
		model: `${model.provider}/${model.id}`,
		effort: "medium",
		tools: ["bash"],
		permissions,
	}, {
		agentDir: root,
		modelRegistry,
		onMessage: async (message) => {
			messages.push(message)
			return "approved"
		},
	})
	return { faux, session, messages }
}

describe("SubagentSession", () => {
	test("keeps a denied tool available while blocking its operation", async () => {
		const { faux, session } = await setup({ allow: ["*"], deny: ["bash:*rm -rf*"] })
		faux.setResponses([
			fauxAssistantMessage(fauxToolCall("bash", { command: "rm -rf target" })),
			fauxAssistantMessage("Operation was denied."),
		])

		const result = await session.run()

		expect(result.error).toBeUndefined()
		expect(result.result).toBe("Operation was denied.")
		expect(faux.state.callCount).toBe(2)
		session.dispose()
		faux.unregister()
	})

	test("preserves conversation context across follow-up", async () => {
		const { faux, session } = await setup({ allow: ["*"], deny: [] })
		faux.setResponses([
			fauxAssistantMessage("First result."),
			(context) => fauxAssistantMessage(`Messages seen: ${context.messages.length}`),
		])

		await session.run()
		const result = await session.followUp({
			objective: "Continue.",
			cwd: roots[0]!,
			model: `${faux.getModel().provider}/${faux.getModel().id}`,
			effort: "medium",
			tools: ["bash"],
			permissions: { allow: ["*"], deny: [] },
		})

		expect(result.result).toMatch(/^Messages seen: [3-9]/)
		session.dispose()
		faux.unregister()
	})

	test("uses only the dedicated system prompt and selected tools", async () => {
		const { faux, session } = await setup({ allow: ["*"], deny: [] })
		faux.setResponses([(context) => {
			expect(context.systemPrompt).toContain("Never address the user")
			expect(context.systemPrompt).toContain("Never invoke or create another subagent")
			expect(context.systemPrompt).not.toContain("AGENTS.md")
			expect(context.tools?.map((tool) => tool.name).sort()).toEqual(["bash", "report_to_main"])
			return fauxAssistantMessage("Minimal context confirmed.")
		}])

		await session.run()
		session.dispose()
		faux.unregister()
	})

	test("rejects unsupported effort before the first model request", async () => {
		const { faux, session } = await setup({ allow: ["*"], deny: [] }, false)
		faux.setResponses([fauxAssistantMessage("must not run")])

		await expect(session.run()).rejects.toThrow(/Effort medium is invalid/)
		expect(faux.state.callCount).toBe(0)
		faux.unregister()
	})
})
