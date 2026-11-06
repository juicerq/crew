import { mkdir } from "node:fs/promises"
import { join } from "node:path"
import {
	createAgentSession,
	DefaultResourceLoader,
	defineTool,
	type InlineExtension,
	type ModelRegistry,
	SessionManager,
	SettingsManager,
} from "@earendil-works/pi-coding-agent"
import { Type } from "typebox"
import type { MessageKind, SubagentConfig } from "./types.ts"

const SYSTEM_PROMPT = `Complete the objective you receive. Never address the user. Never invoke or create another subagent. Use report_to_main for relevant findings, questions, alerts, permission requests, or blockers. A blocked report pauses until the main agent answers. Respect the available tools and permissions. You remain responsible for completing the objective.`

interface SessionNotification {
	kind: MessageKind
	message: string
	waitForAnswer: boolean
}

interface SessionDependencies {
	modelRegistry: ModelRegistry
	agentDir: string
	onMessage: (notification: SessionNotification) => Promise<string | undefined>
}

export interface SessionResult {
	result?: string
	error?: string
	transcript?: string
}

export class SubagentSession {
	private session?: Awaited<ReturnType<typeof createAgentSession>>["session"]

	constructor(
		private config: SubagentConfig,
		private readonly dependencies: SessionDependencies,
	) {}

	async run(): Promise<SessionResult> {
		if (this.session) return this.prompt(this.config.objective)

		const model = this.resolveModel(this.config.model)
		const sessionDir = join(this.dependencies.agentDir, "subagents", "transcripts")
		await mkdir(sessionDir, { recursive: true })
		const sessionManager = SessionManager.create(this.config.cwd, sessionDir)
		const onMessage = this.dependencies.onMessage
		const reportTool = defineTool({
			name: "report_to_main",
			label: "Report to main",
			description: "Send a finding, question, alert, or blocker to the main agent.",
			parameters: Type.Object({
				kind: Type.Union([
					Type.Literal("info"),
					Type.Literal("question"),
					Type.Literal("alert"),
					Type.Literal("blocked"),
				]),
				message: Type.String(),
			}),
			async execute(_id, params) {
				const answer = await onMessage({
					kind: params.kind,
					message: params.message,
					waitForAnswer: params.kind === "blocked",
				})
				return {
					content: [{ type: "text", text: answer ? `Main agent answered: ${answer}` : "Message delivered." }],
					details: {},
				}
			},
		})
		const resourceLoader = new DefaultResourceLoader({
			cwd: this.config.cwd,
			agentDir: this.dependencies.agentDir,
			noExtensions: true,
			noSkills: true,
			noPromptTemplates: true,
			noThemes: true,
			noContextFiles: true,
			systemPrompt: SYSTEM_PROMPT,
			extensionFactories: [this.permissionGate()],
		})
		await resourceLoader.reload()
		const { session } = await createAgentSession({
			cwd: this.config.cwd,
			agentDir: this.dependencies.agentDir,
			authStorage: this.dependencies.modelRegistry.authStorage,
			modelRegistry: this.dependencies.modelRegistry,
			model,
			thinkingLevel: this.config.effort,
			tools: [...this.config.tools, "report_to_main"],
			customTools: [reportTool],
			resourceLoader,
			sessionManager,
			settingsManager: SettingsManager.inMemory(),
		})
		this.session = session
		if (!session.getAvailableThinkingLevels().includes(this.config.effort)) {
			session.dispose()
			this.session = undefined
			throw new Error(`Effort ${this.config.effort} is invalid for ${this.config.model}. Valid values: ${session.getAvailableThinkingLevels().join(", ")}`)
		}
		return this.prompt(this.config.objective)
	}

	async followUp(config: SubagentConfig): Promise<SessionResult> {
		if (!this.session) throw new Error("Subagent session is unavailable")
		if (config.cwd !== this.config.cwd) throw new Error("A follow-up cannot change cwd because the preserved Pi session is cwd-bound")
		const model = this.resolveModel(config.model)
		await this.session.setModel(model)
		if (!this.session.getAvailableThinkingLevels().includes(config.effort)) {
			throw new Error(`Effort ${config.effort} is invalid for ${config.model}. Valid values: ${this.session.getAvailableThinkingLevels().join(", ")}`)
		}
		this.config = config
		this.session.setThinkingLevel(config.effort)
		this.session.setActiveToolsByName([...config.tools, "report_to_main"])
		return this.prompt(config.objective)
	}

	private async prompt(objective: string): Promise<SessionResult> {
		const session = this.session!
		await session.prompt(objective, { expandPromptTemplates: false, source: "extension" })
		const last = [...session.messages].reverse().find((message) => message.role === "assistant")
		const transcript = session.sessionFile
		const result = session.getLastAssistantText()
		if (last?.role === "assistant" && (last.stopReason === "error" || last.stopReason === "aborted")) {
			return { result, error: last.errorMessage ?? last.stopReason, transcript }
		}
		return { result, transcript }
	}

	async send(message: string): Promise<void> {
		if (!this.session) throw new Error("Subagent is not running")
		await this.session.steer(message)
	}

	updatePermissions(permissions: SubagentConfig["permissions"]): void {
		this.config = { ...this.config, permissions }
	}

	async interrupt(): Promise<void> {
		await this.session?.abort()
	}

	dispose(): void {
		this.session?.dispose()
		this.session = undefined
	}

	private resolveModel(reference: string) {
		const separator = reference.indexOf("/")
		if (separator === -1) throw new Error(`Invalid model ${reference}. Use provider/model-id.`)
		const model = this.dependencies.modelRegistry.find(reference.slice(0, separator), reference.slice(separator + 1))
		if (!model) throw new Error(`Unknown model: ${reference}`)
		return model
	}

	private permissionGate(): InlineExtension {
		return {
			name: "subagent-permissions",
			factory: (pi) => {
				pi.on("tool_call", (event) => {
					if (event.toolName === "report_to_main") return
					const operation = `${event.toolName}:${JSON.stringify(event.input)}`
					if (this.isAllowed(event.toolName, operation)) return
					return {
						block: true,
						reason: `Permission denied for ${operation}. Use report_to_main with kind blocked to request permission elevation.`,
					}
				})
			},
		}
	}

	private isAllowed(tool: string, operation: string): boolean {
		if (this.config.permissions.deny.some((pattern) => this.matches(pattern, tool) || this.matches(pattern, operation))) return false
		return this.config.permissions.allow.some((pattern) => this.matches(pattern, tool) || this.matches(pattern, operation))
	}

	private matches(pattern: string, value: string): boolean {
		const expression = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replaceAll("*", ".*")
		return new RegExp(`^${expression}$`, "u").test(value)
	}
}
