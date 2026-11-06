import { afterEach, describe, expect, test } from "bun:test"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { AuthStorage, ModelRegistry } from "@earendil-works/pi-coding-agent"
import { SubagentManager, type SessionRunner } from "../src/subagent-manager.ts"
import type { MainContext, Permissions, SubagentConfig } from "../src/types.ts"

const roots: string[] = []

interface ControlledRunner extends SessionRunner {
	complete(result?: string): void
}

function controlledRunner(onStart: () => void): ControlledRunner {
	let complete!: (value: { result?: string }) => void
	return {
		run() {
			onStart()
			return new Promise((resolve) => { complete = resolve })
		},
		followUp() {
			onStart()
			return new Promise((resolve) => { complete = resolve })
		},
		async send() {},
		updatePermissions() {},
		async interrupt() { complete({}) },
		dispose() {},
		complete(result = "done") { complete({ result }) },
	}
}

async function setup(createSession: (config: SubagentConfig, onMessage: (kind: "blocked" | "question" | "alert" | "info", message: string, wait: boolean) => Promise<string | undefined>) => SessionRunner) {
	const root = await mkdtemp(join(tmpdir(), "pi-subagent-test-"))
	roots.push(root)
	const authStorage = AuthStorage.create(join(root, "auth.json"))
	const modelRegistry = ModelRegistry.inMemory(authStorage)
	const model = modelRegistry.getAll()[0]!
	authStorage.setRuntimeApiKey(model.provider, "test")
	authStorage.setRuntimeApiKey("openai-codex", "test")
	const notifications: string[] = []
	const manager = new SubagentManager({
		agentDir: root,
		modelRegistry,
		notify: (id, message) => notifications.push(`${id}:${message.kind}`),
		createSession,
	})
	const main: MainContext = {
		cwd: root,
		model: `${model.provider}/${model.id}`,
		effort: "medium",
		tools: ["read", "bash"],
		permissions: { allow: ["*"], deny: [] },
	}
	return { manager, main, notifications }
}

afterEach(async () => {
	await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

describe("SubagentManager", () => {
	test("runs ten sessions and queues excess work until capacity is released", async () => {
		let active = 0
		let peak = 0
		const runners: ControlledRunner[] = []
		const { manager, main } = await setup(() => {
			const runner = controlledRunner(() => {
				active++
				peak = Math.max(peak, active)
			})
			runners.push(runner)
			return runner
		})
		const records = await Promise.all(Array.from({ length: 12 }, (_, index) => manager.spawn({ objective: `task ${index}` }, main)))
		await Bun.sleep(10)

		expect(peak).toBe(10)
		expect((await manager.status()).filter((record) => record.state === "queued")).toHaveLength(2)

		active--
		runners[0]!.complete()
		await Bun.sleep(10)
		expect((await manager.status(records[10]!.id))[0]!.state).toBe("running")

		for (const runner of runners.slice(1)) runner.complete()
		await Promise.all(records.map((record) => manager.wait(record.id, 100)))
		await manager.shutdown()
	})

	test("blocked sessions release capacity and resume when the main agent answers", async () => {
		let blockedMessageId: string | undefined
		let firstOnMessage: Parameters<Parameters<typeof setup>[0]>[1] | undefined
		const runners: ControlledRunner[] = []
		const { manager, main } = await setup((_config, onMessage) => {
			firstOnMessage ??= onMessage
			const runner = controlledRunner(() => {})
			runners.push(runner)
			return runner
		})
		const records = await Promise.all(Array.from({ length: 11 }, (_, index) => manager.spawn({ objective: `task ${index}` }, main)))
		await Bun.sleep(10)
		const blocked = firstOnMessage!("blocked", "Need approval", true)
		await Bun.sleep(10)
		const first = (await manager.status()).find((record) => record.state === "blocked")!
		blockedMessageId = first.messages[0]!.id

		expect(first.state).toBe("blocked")
		expect((await manager.status(records[10]!.id))[0]!.state).toBe("running")

		await manager.message(first.id, "Approved", blockedMessageId)
		expect((await manager.status(first.id))[0]!.state).toBe("blocked")
		runners.find((runner) => runner !== runners[0])!.complete()
		await Bun.sleep(10)
		expect(await blocked).toBe("Approved")
		expect((await manager.status(first.id))[0]!.state).toBe("running")

		for (const runner of runners) runner.complete()
		await Promise.all(records.map((record) => manager.wait(record.id, 100)))
		await manager.shutdown()
	})

	test("inherits configuration, applies explicit overrides, and persists interrupted shutdown state", async () => {
		let observed: SubagentConfig | undefined
		const runner = controlledRunner(() => {})
		const { manager, main } = await setup((config) => {
			observed = config
			return runner
		})
		const permissions: Partial<Permissions> = { deny: ["bash"] }
		const record = await manager.spawn({ objective: "inspect", effort: "high", permissions }, main)
		await Bun.sleep(10)

		expect(observed).toEqual({ ...main, objective: "inspect", effort: "high", permissions: { allow: ["*"], deny: ["bash"] } })
		await manager.shutdown()
		expect((await manager.status(record.id))[0]!.state).toBe("interrupted")
	})

	test("resolves an unauthenticated provider guess to the unique authenticated model variant", async () => {
		let observed: SubagentConfig | undefined
		const runner = controlledRunner(() => {})
		const { manager, main } = await setup((config) => {
			observed = config
			return runner
		})

		const record = await manager.spawn({ objective: "calculate", model: "openai/gpt-5.6-luna" }, main)
		await Bun.sleep(10)

		expect(observed?.model).toBe("openai-codex/gpt-5.6-luna")
		expect((await manager.status(record.id))[0]!.config.model).toBe("openai-codex/gpt-5.6-luna")
		await manager.shutdown()
	})

	test("resolves an informal model nickname without asking for a provider or model ID", async () => {
		let observed: SubagentConfig | undefined
		const runner = controlledRunner(() => {})
		const { manager, main } = await setup((config) => {
			observed = config
			return runner
		})

		const record = await manager.spawn({ objective: "calculate", model: "luna" }, main)
		await Bun.sleep(10)

		expect(observed?.model).toBe("openai-codex/gpt-5.6-luna")
		expect((await manager.status(record.id))[0]!.config.model).toBe("openai-codex/gpt-5.6-luna")
		await manager.shutdown()
	})
})
