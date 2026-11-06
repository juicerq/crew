import { randomBytes } from "node:crypto"
import { mkdir, rm } from "node:fs/promises"
import { homedir } from "node:os"
import { basename, dirname, join, resolve } from "node:path"
import type { WorktreeRecord } from "./types.ts"

interface CreateWorktreeInput {
	cwd: string
	task: string
	base?: string
	branch?: string
	existingBranch?: string
	path?: string
	detached?: boolean
}

interface RemoveWorktreeInput {
	cwd: string
	path: string
	force?: boolean
	deleteBranch?: boolean
}

export class WorktreeManager {
	async create(input: CreateWorktreeInput): Promise<WorktreeRecord> {
		if (input.detached && (input.branch || input.existingBranch)) throw new Error("Detached worktrees cannot select a branch")
		if (input.branch && input.existingBranch) throw new Error("Choose a new branch or an existing branch, not both")
		const repository = await this.repositoryRoot(input.cwd)
		const head = input.base ?? (await this.git(repository, ["rev-parse", "HEAD"])).trim()
		const branch = input.detached
			? undefined
			: input.existingBranch ?? input.branch ?? `pi/${this.slug(input.task)}-${randomBytes(3).toString("hex")}`
		const path = resolve(input.path ?? join(homedir(), ".pi", "agent", "worktrees", basename(repository), branch ?? `detached-${head.slice(0, 7)}`))

		await mkdir(dirname(path), { recursive: true })
		if (input.detached) await this.git(repository, ["worktree", "add", "--detach", path, head])
		else if (input.existingBranch) await this.git(repository, ["worktree", "add", path, input.existingBranch])
		else await this.git(repository, ["worktree", "add", "-b", branch!, path, head])

		return { path, head, branch, managed: this.isManaged(path) }
	}

	async list(cwd: string): Promise<WorktreeRecord[]> {
		const repository = await this.repositoryRoot(cwd)
		const output = await this.git(repository, ["worktree", "list", "--porcelain"])
		return output
			.trim()
			.split("\n\n")
			.filter(Boolean)
			.map((block) => {
				const fields = new Map(block.split("\n").map((line) => {
					const separator = line.indexOf(" ")
					return separator === -1 ? [line, ""] : [line.slice(0, separator), line.slice(separator + 1)]
				}))
				const path = fields.get("worktree")!
				const branchRef = fields.get("branch")
				return {
					path,
					head: fields.get("HEAD")!,
					branch: branchRef?.replace("refs/heads/", ""),
					managed: this.isManaged(path),
				}
			})
	}

	async remove(input: RemoveWorktreeInput): Promise<void> {
		const repository = await this.repositoryRoot(input.cwd)
		const record = (await this.list(repository)).find((worktree) => resolve(worktree.path) === resolve(input.path))
		if (!record) throw new Error(`Unknown worktree: ${input.path}`)

		await this.git(repository, ["worktree", "remove", ...(input.force ? ["--force"] : []), record.path])
		if (input.deleteBranch && record.branch) await this.git(repository, ["branch", "-D", record.branch])
		if (this.isManaged(record.path)) await rm(record.path, { recursive: true, force: true })
	}

	private async repositoryRoot(cwd: string): Promise<string> {
		return (await this.git(cwd, ["rev-parse", "--show-toplevel"])).trim()
	}

	private async git(cwd: string, args: string[]): Promise<string> {
		const process = Bun.spawn(["git", ...args], { cwd, stdout: "pipe", stderr: "pipe" })
		const [stdout, stderr, exitCode] = await Promise.all([
			new Response(process.stdout).text(),
			new Response(process.stderr).text(),
			process.exited,
		])
		if (exitCode !== 0) throw new Error(stderr.trim() || `git ${args.join(" ")} failed`)
		return stdout
	}

	private slug(value: string): string {
		const slug = value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48)
		return slug || "task"
	}

	private isManaged(path: string): boolean {
		return resolve(path).startsWith(resolve(homedir(), ".pi", "agent", "worktrees") + "/")
	}
}
