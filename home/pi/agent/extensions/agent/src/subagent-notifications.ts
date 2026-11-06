import type { SubagentMessage } from "./types.ts"

interface PendingNotification {
	id: string
	message: SubagentMessage
}

export class SubagentNotifications {
	private readonly pending: PendingNotification[] = []
	private readonly detachedSubagents = new Set<string>()
	private deliveryScheduled = false

	constructor(private readonly deliver: (id: string, message: SubagentMessage) => void) {}

	push(id: string, message: SubagentMessage): void {
		if (this.detachedSubagents.has(id)) return
		this.pending.push({ id, message })
		if (this.deliveryScheduled) return
		this.deliveryScheduled = true
		queueMicrotask(() => this.flush())
	}

	detach(ids: string[]): void {
		for (const id of ids) this.detachedSubagents.add(id)
	}

	attach(id: string): void {
		this.detachedSubagents.delete(id)
	}

	private flush(): void {
		this.deliveryScheduled = false
		const priority = { blocked: 0, question: 1, alert: 2, info: 3 }
		for (const notification of this.pending.splice(0).sort((left, right) => priority[left.message.kind] - priority[right.message.kind])) {
			if (!this.detachedSubagents.has(notification.id)) this.deliver(notification.id, notification.message)
		}
	}
}
