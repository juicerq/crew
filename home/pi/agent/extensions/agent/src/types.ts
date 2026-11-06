import type { ThinkingLevel } from "@earendil-works/pi-agent-core"
import { type Static, Type } from "typebox"

export const SUBAGENT_STATES = [
	"queued",
	"running",
	"blocked",
	"completed",
	"failed",
	"interrupted",
] as const

export type SubagentState = (typeof SUBAGENT_STATES)[number]
export const MessageKindSchema = Type.Union([
	Type.Literal("blocked"),
	Type.Literal("question"),
	Type.Literal("alert"),
	Type.Literal("info"),
])

export const PermissionsSchema = Type.Object({
	allow: Type.Array(Type.String()),
	deny: Type.Array(Type.String()),
})

export const SubagentConfigSchema = Type.Object({
	objective: Type.String(),
	cwd: Type.String(),
	model: Type.String(),
	effort: Type.Union([
		Type.Literal("off"),
		Type.Literal("minimal"),
		Type.Literal("low"),
		Type.Literal("medium"),
		Type.Literal("high"),
		Type.Literal("xhigh"),
		Type.Literal("max"),
	]),
	tools: Type.Array(Type.String()),
	permissions: PermissionsSchema,
})

export const SubagentMessageSchema = Type.Object({
	id: Type.String(),
	kind: MessageKindSchema,
	message: Type.String(),
	createdAt: Type.String(),
	answeredAt: Type.Optional(Type.String()),
	answer: Type.Optional(Type.String()),
})

export const SubagentRecordSchema = Type.Object({
	id: Type.String(),
	state: Type.Union([
		Type.Literal(SUBAGENT_STATES[0]),
		Type.Literal(SUBAGENT_STATES[1]),
		Type.Literal(SUBAGENT_STATES[2]),
		Type.Literal(SUBAGENT_STATES[3]),
		Type.Literal(SUBAGENT_STATES[4]),
		Type.Literal(SUBAGENT_STATES[5]),
	]),
	config: SubagentConfigSchema,
	createdAt: Type.String(),
	updatedAt: Type.String(),
	result: Type.Optional(Type.String()),
	error: Type.Optional(Type.String()),
	transcript: Type.Optional(Type.String()),
	messages: Type.Array(SubagentMessageSchema),
})

export type MessageKind = Static<typeof MessageKindSchema>
export type Permissions = Static<typeof PermissionsSchema>
export type SubagentConfig = Static<typeof SubagentConfigSchema>
export type SubagentMessage = Static<typeof SubagentMessageSchema>
export type SubagentRecord = Static<typeof SubagentRecordSchema>

export interface SpawnInput {
	objective: string
	cwd?: string
	model?: string
	effort?: ThinkingLevel
	tools?: string[]
	permissions?: Partial<Permissions>
}

export interface FollowUpInput {
	objective: string
	cwd?: string
	model?: string
	effort?: ThinkingLevel
	tools?: string[]
	permissions?: Partial<Permissions>
}

export interface MainContext {
	cwd: string
	model: string
	effort: ThinkingLevel
	tools: string[]
	permissions: Permissions
}

export interface WorktreeRecord {
	path: string
	head: string
	branch?: string
	managed: boolean
}
