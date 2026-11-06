import { afterEach, describe, expect, test } from "bun:test"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { WorktreeManager } from "../src/worktree-manager.ts"

const roots: string[] = []

async function git(cwd: string, args: string[]): Promise<string> {
	const process = Bun.spawn(["git", ...args], { cwd, stdout: "pipe", stderr: "pipe" })
	const [stdout, stderr, exitCode] = await Promise.all([
		new Response(process.stdout).text(),
		new Response(process.stderr).text(),
		process.exited,
	])
	if (exitCode !== 0) throw new Error(stderr)
	return stdout.trim()
}

async function repository(): Promise<string> {
	const root = await mkdtemp(join(tmpdir(), "pi-worktree-test-"))
	roots.push(root)
	await git(root, ["init", "-b", "main"])
	await git(root, ["config", "user.email", "test@example.com"])
	await git(root, ["config", "user.name", "Test"])
	await writeFile(join(root, "tracked.txt"), "committed\n")
	await git(root, ["add", "."])
	await git(root, ["commit", "-m", "initial"])
	return root
}

afterEach(async () => {
	await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

describe("WorktreeManager", () => {
	test("creates from committed HEAD without uncommitted changes and preserves the branch on removal", async () => {
		const root = await repository()
		const path = join(root, "..", `isolated-${crypto.randomUUID()}`)
		roots.push(path)
		await writeFile(join(root, "tracked.txt"), "uncommitted\n")
		const manager = new WorktreeManager()
		const created = await manager.create({ cwd: root, task: "Implement queue", path })

		expect(created.branch).toMatch(/^pi\/implement-queue-[a-f0-9]{6}$/)
		expect(await readFile(join(path, "tracked.txt"), "utf8")).toBe("committed\n")
		expect((await manager.list(root)).find((item) => item.path === path)?.head).toBe(created.head)

		await manager.remove({ cwd: root, path })
		expect(await git(root, ["branch", "--list", created.branch!])).toContain(created.branch!)
	})

	test("requires force for dirty removal and deletes a branch only when requested", async () => {
		const root = await repository()
		const path = join(root, "..", `isolated-${crypto.randomUUID()}`)
		roots.push(path)
		const manager = new WorktreeManager()
		const created = await manager.create({ cwd: root, task: "Dirty work", path })
		await writeFile(join(path, "dirty.txt"), "dirty\n")

		await expect(manager.remove({ cwd: root, path })).rejects.toThrow()
		await manager.remove({ cwd: root, path, force: true, deleteBranch: true })
		expect(await git(root, ["branch", "--list", created.branch!])).toBe("")
	})

	test("supports existing branches and detached HEAD", async () => {
		const root = await repository()
		await git(root, ["branch", "existing"])
		const manager = new WorktreeManager()
		const existingPath = join(root, "..", `existing-${crypto.randomUUID()}`)
		const detachedPath = join(root, "..", `detached-${crypto.randomUUID()}`)
		roots.push(existingPath, detachedPath)

		const existing = await manager.create({ cwd: root, task: "ignored", existingBranch: "existing", path: existingPath })
		const detached = await manager.create({ cwd: root, task: "ignored", detached: true, path: detachedPath })

		expect(existing.branch).toBe("existing")
		expect(detached.branch).toBeUndefined()
		await manager.remove({ cwd: root, path: existingPath })
		await manager.remove({ cwd: root, path: detachedPath })
	})
})
