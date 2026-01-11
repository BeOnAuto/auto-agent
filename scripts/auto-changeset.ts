#!/usr/bin/env tsx

import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import crypto from "node:crypto";

interface ConventionalCommit {
	hash: string;
	type: string;
	scope?: string;
	subject: string;
	body: string;
	breaking: boolean;
	fullMessage: string;
}

interface ChangesetData {
	bumpType: "major" | "minor" | "patch";
	commits: ConventionalCommit[];
	description: string;
}

/**
 * Get all commits since the last changeset was created
 */
function getCommitsSinceLastChangeset(): string[] {
	try {
		// Get the most recent changeset file modification time
		const changesetDir = join(process.cwd(), ".changeset");
		const files = readdirSync(changesetDir).filter(
			(f) => f.endsWith(".md") && f !== "README.md",
		);

		if (files.length === 0) {
			// No changesets exist, get all commits since last release tag
			try {
				const lastTag = execSync("git describe --tags --abbrev=0", {
					encoding: "utf8",
				}).trim();
				const commits = execSync(`git log ${lastTag}..HEAD --format=%H`, {
					encoding: "utf8",
				})
					.trim()
					.split("\n")
					.filter(Boolean);
				return commits;
			} catch {
				// No tags exist, get all commits
				const commits = execSync("git log --format=%H", { encoding: "utf8" })
					.trim()
					.split("\n")
					.filter(Boolean);
				return commits;
			}
		}

		// Get the most recent changeset file
		const latestChangeset = files
			.map((f) => ({
				file: f,
				time: execSync(`git log -1 --format=%ct -- .changeset/${f}`, {
					encoding: "utf8",
				}).trim(),
			}))
			.sort((a, b) => Number(b.time) - Number(a.time))[0];

		// Get commits since that changeset was added
		const changesetCommit = execSync(
			`git log -1 --format=%H -- .changeset/${latestChangeset.file}`,
			{ encoding: "utf8" },
		).trim();

		const commits = execSync(`git log ${changesetCommit}..HEAD --format=%H`, {
			encoding: "utf8",
		})
			.trim()
			.split("\n")
			.filter(Boolean);

		return commits;
	} catch (error) {
		console.error("Error getting commits:", error);
		return [];
	}
}

/**
 * Parse a conventional commit message
 */
function parseConventionalCommit(hash: string): ConventionalCommit | null {
	try {
		const fullMessage = execSync(`git log -1 --format=%B ${hash}`, {
			encoding: "utf8",
		}).trim();

		// Parse conventional commit format: type(scope): subject
		const conventionalPattern =
			/^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(([^)]+)\))?: (.+)/;
		const match = fullMessage.match(conventionalPattern);

		if (!match) {
			return null; // Not a conventional commit
		}

		const [, type, , scope, subject] = match;
		const body = fullMessage.split("\n").slice(1).join("\n").trim();
		const breaking =
			fullMessage.includes("BREAKING CHANGE:") ||
			fullMessage.includes("!:");

		return {
			hash,
			type,
			scope,
			subject,
			body,
			breaking,
			fullMessage,
		};
	} catch (error) {
		console.error(`Error parsing commit ${hash}:`, error);
		return null;
	}
}

/**
 * Determine the semver bump type from commits
 */
function determineBumpType(
	commits: ConventionalCommit[],
): "major" | "minor" | "patch" {
	// Check for breaking changes
	if (commits.some((c) => c.breaking)) {
		return "major";
	}

	// Check for features
	if (commits.some((c) => c.type === "feat")) {
		return "minor";
	}

	// Default to patch
	return "patch";
}

/**
 * Use Claude CLI to generate a changelog description
 */
function generateChangelogWithClaude(
	commits: ConventionalCommit[],
): string {
	const commitSummary = commits
		.map(
			(c) =>
				`- ${c.type}${c.scope ? `(${c.scope})` : ""}: ${c.subject}\n  ${c.body || "(no additional details)"}`,
		)
		.join("\n\n");

	const prompt = `You are analyzing git commits to generate a changelog entry. Here are the commits:

${commitSummary}

Generate a concise changelog description as bullet points. Rules:
- Use 2-5 bullet points maximum
- Focus on user-facing changes and impact
- Group related changes together
- Use clear, non-technical language where possible
- Start each bullet with a dash and capitalize the first word
- Do NOT include commit hashes, types, or scopes
- Do NOT use markdown formatting besides the dashes

Example format:
- Added user authentication with OAuth support
- Fixed critical bug in data synchronization
- Improved performance of search queries by 50%

Now generate the changelog for the commits above:`;

	try {
		// Write prompt to a temporary file
		const tempFile = join(process.cwd(), `.changeset-prompt-${Date.now()}.txt`);
		writeFileSync(tempFile, prompt);

		// Call Claude CLI - it should be available in the environment
		const result = execSync(
			`claude -p "$(cat ${tempFile})" --no-stream --output-only`,
			{
				encoding: "utf8",
				stdio: ["pipe", "pipe", "pipe"],
			},
		);

		// Clean up temp file
		execSync(`rm ${tempFile}`);

		return result.trim();
	} catch (error) {
		console.error("Error calling Claude CLI:", error);
		// Fallback to simple bullet list
		return commits
			.map((c) => `- ${c.subject}`)
			.slice(0, 5)
			.join("\n");
	}
}

/**
 * Create a changeset file
 */
function createChangesetFile(data: ChangesetData): void {
	const changesetDir = join(process.cwd(), ".changeset");

	if (!existsSync(changesetDir)) {
		mkdirSync(changesetDir, { recursive: true });
	}

	// Generate a unique filename
	const hash = crypto.randomBytes(4).toString("hex");
	const filename = `auto-${hash}.md`;
	const filepath = join(changesetDir, filename);

	// Create the changeset content
	const content = `---
"@auto-engineer/cli": ${data.bumpType}
"@auto-engineer/server-generator-apollo-emmett": ${data.bumpType}
"@auto-engineer/server-generator-nestjs": ${data.bumpType}
"@auto-engineer/frontend-generator-react-graphql": ${data.bumpType}
"@auto-engineer/component-implementer": ${data.bumpType}
"@auto-engineer/server-implementer": ${data.bumpType}
"@auto-engineer/frontend-implementer": ${data.bumpType}
"@auto-engineer/information-architect": ${data.bumpType}
"@auto-engineer/design-system-importer": ${data.bumpType}
"@auto-engineer/pipeline": ${data.bumpType}
"@auto-engineer/message-bus": ${data.bumpType}
"@auto-engineer/message-store": ${data.bumpType}
"@auto-engineer/file-store": ${data.bumpType}
"@auto-engineer/narrative": ${data.bumpType}
"@auto-engineer/id": ${data.bumpType}
"@auto-engineer/dev-server": ${data.bumpType}
"@auto-engineer/server-checks": ${data.bumpType}
"@auto-engineer/frontend-checks": ${data.bumpType}
"@auto-engineer/ai-gateway": ${data.bumpType}
"create-auto-app": ${data.bumpType}
---

${data.description}
`;

	writeFileSync(filepath, content);
	console.log(`✅ Created changeset: ${filename}`);
	console.log(`   Bump type: ${data.bumpType}`);
	console.log(`   Commits: ${data.commits.length}`);
}

/**
 * Main function
 */
function main() {
	console.log("🔍 Checking for commits that need changesets...");

	const commitHashes = getCommitsSinceLastChangeset();

	if (commitHashes.length === 0) {
		console.log("✨ No new commits found. Nothing to do.");
		return;
	}

	console.log(`📝 Found ${commitHashes.length} commit(s) to process`);

	// Parse conventional commits
	const commits = commitHashes
		.map(parseConventionalCommit)
		.filter((c): c is ConventionalCommit => c !== null);

	if (commits.length === 0) {
		console.log(
			"⚠️  No conventional commits found. Skipping changeset generation.",
		);
		console.log(
			"   (Commits must follow format: type(scope): subject, e.g., feat(cli): add new command)",
		);
		return;
	}

	console.log(
		`✅ Found ${commits.length} valid conventional commit(s)`,
	);

	// Determine bump type
	const bumpType = determineBumpType(commits);
	console.log(`📊 Determined version bump: ${bumpType}`);

	// Generate changelog with Claude
	console.log("🤖 Generating changelog with Claude CLI...");
	const description = generateChangelogWithClaude(commits);

	// Create changeset
	createChangesetFile({
		bumpType,
		commits,
		description,
	});

	console.log("\n✨ Changeset generated successfully!");
	console.log("\nChangelog preview:");
	console.log("---");
	console.log(description);
	console.log("---");
}

main();
