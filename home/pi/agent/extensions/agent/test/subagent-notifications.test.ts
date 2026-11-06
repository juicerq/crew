import { describe, expect, test } from "bun:test"
import { SubagentNotifications } from "../src/subagent-notifications.ts"
import type { MessageKind, SubagentMessage } from "../src/types.ts"

function message(id: string, kind: MessageKind = "info"): SubagentMessage {
	return { id, kind, message: id, createdAt: new Date().toISOString() }
}

describe("SubagentNotifications", () => {
	test("does not deliver messages from a subagent after tree navigation detaches it", async () => {
		const delivered: string[] = []
		const notifications = new SubagentNotifications((_id, item) => delivered.push(item.id))

		notifications.push("old", message("already-queued"))
		notifications.detach(["old"])
		notifications.push("old", message("arrived-later"))
		await Promise.resolve()

		expect(delivered).toEqual([])
	})

	test("delivers messages again when the detached subagent receives a follow-up", async () => {
		const delivered: string[] = []
		const notifications = new SubagentNotifications((_id, item) => delivered.push(item.id))
		notifications.detach(["agent"])

		notifications.attach("agent")
		notifications.push("agent", message("follow-up"))
		await Promise.resolve()

		expect(delivered).toEqual(["follow-up"])
	})

	test("prioritizes actionable messages delivered in the same batch", async () => {
		const delivered: string[] = []
		const notifications = new SubagentNotifications((_id, item) => delivered.push(item.kind))

		notifications.push("agent", message("info", "info"))
		notifications.push("agent", message("blocked", "blocked"))
		await Promise.resolve()

		expect(delivered).toEqual(["blocked", "info"])
	})
})
