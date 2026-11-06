import { randomUUID } from "node:crypto"
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises"
import { join } from "node:path"
import type { ModelRegistry } from "@earendil-works/pi-coding-agent"
import { Type } from "typebox"
import { Value } from "typebox/value"
import { SubagentSession } from "./subagent-session.ts"
import type {
	FollowUpInput,
	MainContext,
	MessageKind,
	Permissions,
	SpawnInput,
	SubagentConfig,
	SubagentMessage,
	SubagentRecord,
} from "./types.ts"
import { SubagentRecordSchema } from "./types.ts"

const MAX_CONCURRENT = 10

interface ManagerDependencies {
	agentDir: string
	modelRegistry: ModelRegistry
	notify: (id: string, message: SubagentMessage) => void
	recordChanged?: (record: SubagentRecord) => void
	createSession?: (config: SubagentConfig, onMessage: (kind: MessageKind, message: string, waitForAnswer: boolean) => Promise<string | undefined>) => SessionRunner
}

interface Waiter {
	resolve: (record: SubagentRecord) => void
	timer?: ReturnType<typeof setTimeout>
}

export interface SessionRunner {
	run(): Promise<{ result?: string; error?: string; transcript?: string }>
	followUp(config: SubagentConfig): Promise<{ result?: string; error?: string; transcript?: string }>
	send(message: string): Promise<void>
	updatePermissions(permissions: Permissions): void
	interrupt(): Promise<void>
	dispose(): void
}

export class SubagentManager {
	private readonly records = new Map<string, SubagentRecord>()
	private readonly sessions = new Map<string, SessionRunner>()
	private readonly waiters = new Map<string, Waiter[]>()
	private readonly blockedAnswers = new Map<string, (answer: string) => void>()
	private readonly pendingResumes = new Map<string, string>()
	private readonly resumeQueue: Array<{ recordId: string; messageId: string }> = []
	private readonly executions = new Map<string, Promise<void>>()
	private readonly queue: string[] = []
	private loaded = false
	private persistence = Promise.resolve()

	constructor(private readonly dependencies: ManagerDependencies) {}

	async spawn(input: SpawnInput, main: MainContext): Promise<SubagentRecord> {
		await this.load()
		const config = this.resolveConfig(input, main)
		this.validateConfig(config)
		const now = new Date().toISOString()
		const record: SubagentRecord = {
			id: randomUUID(),
			state: "queued",
			config,
			createdAt: now,
			updatedAt: now,
			messages: [],
		}
		this.records.set(record.id, record)
		this.queue.push(record.id)
		await this.persist()
		this.pump()
		return structuredClone(record)
	}

	async status(id?: string): Promise<SubagentRecord[]> {
		await this.load()
		if (!id) return [...this.records.values()].map((record) => structuredClone(record))
		return [structuredClone(this.requireRecord(id))]
	}

	async wait(id: string, timeoutMs?: number): Promise<SubagentRecord> {
		await this.load()
		const record = this.requireRecord(id)
		if (this.isSettled(record)) return structuredClone(record)
		return new Promise((resolve) => {
			const waiter: Waiter = { resolve }
			if (timeoutMs) {
				waiter.timer = setTimeout(() => {
					this.removeWaiter(id, waiter)
					resolve(structuredClone(this.requireRecord(id)))
				}, timeoutMs)
			}
			this.waiters.set(id, [...(this.waiters.get(id) ?? []), waiter])
		})
	}

	async message(id: string, message: string, replyTo?: string): Promise<void> {
		await this.load()
		const record = this.requireRecord(id)
		if (replyTo) {
			const pending = record.messages.find((item) => item.id === replyTo && !item.answeredAt)
			if (!pending) throw new Error(`Unknown or answered message: ${replyTo}`)
			pending.answer = message
			pending.answeredAt = new Date().toISOString()
			if (pending.kind === "blocked") {
				this.pendingResumes.set(replyTo, message)
				this.resumeQueue.push({ recordId: record.id, messageId: replyTo })
			} else {
				await this.requireSession(id).send(`Main agent answered ${pending.kind} ${replyTo}: ${message}`)
			}
		} else {
			await this.requireSession(id).send(message)
		}
		await this.persist()
		this.pump()
	}

	async updatePermissions(id: string, patch: Partial<Permissions>): Promise<void> {
		await this.load()
		const record = this.requireRecord(id)
		record.config.permissions = this.mergePermissions(record.config.permissions, patch)
		this.requireSession(id).updatePermissions(record.config.permissions)
		this.touch(record)
		await this.persist()
	}

	async interrupt(id: string): Promise<void> {
		await this.load()
		const record = this.requireRecord(id)
		if (record.state === "queued") this.queue.splice(this.queue.indexOf(id), 1)
		else {
			for (const message of record.messages.filter((item) => item.kind === "blocked" && !item.answeredAt)) {
				this.blockedAnswers.get(message.id)?.("Subagent interrupted")
				this.blockedAnswers.delete(message.id)
			}
			await this.requireSession(id).interrupt()
		}
		this.transition(record, "interrupted")
		await this.persist()
		this.settle(record)
		this.pump()
	}

	async followUp(id: string, input: FollowUpInput): Promise<SubagentRecord> {
		await this.load()
		const record = this.requireRecord(id)
		if (record.state !== "completed" && record.state !== "failed") throw new Error(`Cannot follow up a ${record.state} subagent`)
		if (!this.sessions.has(id)) throw new Error("Subagent session is unavailable after Pi exits or discard")
		const config = this.resolveConfig(input, record.config)
		this.validateConfig(config)
		record.config = config
		record.result = undefined
		record.error = undefined
		this.transition(record, "queued")
		this.queue.push(id)
		await this.persist()
		this.pump()
		return structuredClone(record)
	}

	async transcript(id: string): Promise<string> {
		await this.load()
		const path = this.requireRecord(id).transcript
		if (!path) throw new Error("Transcript is not available")
		return readFile(path, "utf8")
	}

	async discard(id: string): Promise<void> {
		await this.load()
		const record = this.requireRecord(id)
		if (!this.isSettled(record)) throw new Error(`Cannot discard a ${record.state} subagent`)
		this.sessions.get(id)?.dispose()
		this.sessions.delete(id)
		this.records.delete(id)
		if (record.transcript) await rm(record.transcript, { force: true })
		await this.persist()
	}

	async shutdown(): Promise<void> {
		await this.load()
		for (const record of this.records.values()) {
			if (record.state === "running" || record.state === "blocked" || record.state === "queued") {
				this.transition(record, "interrupted")
				await this.sessions.get(record.id)?.interrupt()
				this.settle(record)
			}
		}
		await Promise.allSettled(this.executions.values())
		for (const session of this.sessions.values()) session.dispose()
		await this.persist()
	}

	private pump(): void {
		while (this.activeCount() < MAX_CONCURRENT && this.resumeQueue.length > 0) {
			const resume = this.resumeQueue.shift()!
			const record = this.requireRecord(resume.recordId)
			const answer = this.pendingResumes.get(resume.messageId)
			if (!answer || record.state !== "blocked") continue
			this.pendingResumes.delete(resume.messageId)
			this.transition(record, "running")
			this.blockedAnswers.get(resume.messageId)?.(answer)
			this.blockedAnswers.delete(resume.messageId)
		}
		while (this.activeCount() < MAX_CONCURRENT && this.queue.length > 0) {
			const id = this.queue.shift()!
			const record = this.requireRecord(id)
			this.transition(record, "running")
			const execution = this.execute(record).finally(() => {
				this.executions.delete(record.id)
				this.pump()
			})
			this.executions.set(record.id, execution)
		}
	}

	private async execute(record: SubagentRecord): Promise<void> {
		try {
			let session = this.sessions.get(record.id)
			if (!session) {
				const onMessage = (kind: MessageKind, message: string, waitForAnswer: boolean) => this.receive(record, kind, message, waitForAnswer)
				session = this.dependencies.createSession
					? this.dependencies.createSession(record.config, onMessage)
					: new SubagentSession(record.config, {
						agentDir: this.dependencies.agentDir,
						modelRegistry: this.dependencies.modelRegistry,
						onMessage: (notification) => onMessage(notification.kind, notification.message, notification.waitForAnswer),
					})
				this.sessions.set(record.id, session)
			}
			const result = this.sessions.has(record.id) && session === this.sessions.get(record.id) && record.transcript
				? await session.followUp(record.config)
				: await session.run()
			if (record.state === "interrupted") return
			record.result = result.result
			record.error = result.error
			record.transcript = result.transcript
			this.transition(record, result.error ? "failed" : "completed")
		} catch (err) {
			if (record.state === "interrupted") return
			record.error = err instanceof Error ? err.message : String(err)
			this.transition(record, "failed")
		}
		await this.persist()
		this.settle(record)
	}

	private async receive(record: SubagentRecord, kind: MessageKind, message: string, waitForAnswer: boolean): Promise<string | undefined> {
		const notification: SubagentMessage = {
			id: randomUUID(),
			kind,
			message,
			createdAt: new Date().toISOString(),
		}
		record.messages.push(notification)
		if (kind === "blocked") this.transition(record, "blocked")
		else this.touch(record)
		await this.persist()
		this.dependencies.notify(record.id, notification)
		this.pump()
		if (!waitForAnswer) return undefined
		return new Promise((resolve) => this.blockedAnswers.set(notification.id, resolve))
	}

	private resolveConfig(input: SpawnInput | FollowUpInput, inherited: MainContext | SubagentConfig): SubagentConfig {
		return {
			objective: input.objective,
			cwd: input.cwd ?? inherited.cwd,
			model: this.resolveModelReference(input.model ?? inherited.model),
			effort: input.effort ?? inherited.effort,
			tools: input.tools ?? inherited.tools,
			permissions: this.mergePermissions(inherited.permissions, input.permissions),
		}
	}

	private validateConfig(config: SubagentConfig): void {
		if (!config.objective.trim()) throw new Error("Objective is required")
		const model = this.dependencies.modelRegistry.find(...this.modelParts(config.model))
		if (!model) throw new Error(`Unknown model: ${config.model}`)
		if (!this.dependencies.modelRegistry.hasConfiguredAuth(model)) throw new Error(`Model provider is not authenticated: ${config.model}`)
	}

	private resolveModelReference(reference: string): string {
		const requestedId = reference.includes("/") ? reference.slice(reference.indexOf("/") + 1) : reference
		const exact = reference.includes("/") ? this.dependencies.modelRegistry.find(...this.modelParts(reference)) : undefined
		if (exact && this.dependencies.modelRegistry.hasConfiguredAuth(exact)) return `${exact.provider}/${exact.id}`
		const available = this.dependencies.modelRegistry.getAvailable()
		const exactId = available.filter((model) => model.id === requestedId)
		const authenticated = exactId.length > 0
			? exactId
			: available.filter((model) => model.id.toLowerCase().includes(requestedId.toLowerCase()) || model.name.toLowerCase().includes(requestedId.toLowerCase()))
		if (authenticated.length === 1) return `${authenticated[0]!.provider}/${authenticated[0]!.id}`
		if (authenticated.length === 0) throw new Error(`No authenticated model matches: ${reference}`)
		throw new Error(`Model name is ambiguous: ${requestedId}. Matches: ${authenticated.map((model) => `${model.provider}/${model.id}`).join(", ")}`)
	}

	private modelParts(model: string): [string, string] {
		const separator = model.indexOf("/")
		if (separator === -1) throw new Error(`Invalid model ${model}. Use provider/model-id.`)
		return [model.slice(0, separator), model.slice(separator + 1)]
	}

	private mergePermissions(base: Permissions, patch?: Partial<Permissions>): Permissions {
		return { allow: patch?.allow ?? base.allow, deny: patch?.deny ?? base.deny }
	}

	private activeCount(): number {
		return [...this.records.values()].filter((record) => record.state === "running").length
	}

	private isSettled(record: SubagentRecord): boolean {
		return record.state === "completed" || record.state === "failed" || record.state === "interrupted"
	}

	private requireRecord(id: string): SubagentRecord {
		const record = this.records.get(id)
		if (!record) throw new Error(`Unknown subagent: ${id}`)
		return record
	}

	private requireSession(id: string): SessionRunner {
		const session = this.sessions.get(id)
		if (!session) throw new Error(`Subagent session is unavailable: ${id}`)
		return session
	}

	private transition(record: SubagentRecord, state: SubagentRecord["state"]): void {
		record.state = state
		this.touch(record)
	}

	private touch(record: SubagentRecord): void {
		record.updatedAt = new Date().toISOString()
		this.dependencies.recordChanged?.(structuredClone(record))
	}

	private settle(record: SubagentRecord): void {
		for (const waiter of this.waiters.get(record.id) ?? []) {
			if (waiter.timer) clearTimeout(waiter.timer)
			waiter.resolve(structuredClone(record))
		}
		this.waiters.delete(record.id)
	}

	private removeWaiter(id: string, target: Waiter): void {
		this.waiters.set(id, (this.waiters.get(id) ?? []).filter((waiter) => waiter !== target))
	}

	private async load(): Promise<void> {
		if (this.loaded) return
		this.loaded = true
		const records = await readFile(this.metadataPath(), "utf8")
			.then((contents) => {
				const value: unknown = JSON.parse(contents)
				if (!Value.Check(Type.Array(SubagentRecordSchema), value)) throw new Error(`Invalid subagent metadata: ${this.metadataPath()}`)
				return value
			})
			.catch((err: NodeJS.ErrnoException) => {
				if (err.code === "ENOENT") return []
				throw err
			})
		for (const record of records) {
			if (record.state === "running" || record.state === "blocked" || record.state === "queued") record.state = "interrupted"
			this.records.set(record.id, record)
		}
		await this.persist()
	}

	private async persist(): Promise<void> {
		const contents = JSON.stringify([...this.records.values()], null, 2)
		const operation = this.persistence.then(async () => {
			const path = this.metadataPath()
			await mkdir(join(this.dependencies.agentDir, "subagents"), { recursive: true })
			await writeFile(`${path}.tmp`, contents)
			await rename(`${path}.tmp`, path)
		})
		this.persistence = operation.catch(() => {})
		await operation
	}

	private metadataPath(): string {
		return join(this.dependencies.agentDir, "subagents", "runs.json")
	}
}
