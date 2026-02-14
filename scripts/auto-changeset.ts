#!/usr/bin/env tsx

import { execSync } from 'node:child_process';
import crypto from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

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
  bumpType: 'major' | 'minor' | 'patch';
  commits: ConventionalCommit[];
  description: string;
}

/**
 * Get all commits since the last changeset was created
 */
function getCommitsSinceLastChangeset(): string[] {
  try {
    // Get the most recent changeset file modification time
    const changesetDir = join(process.cwd(), '.changeset');
    const files = readdirSync(changesetDir).filter((f) => f.endsWith('.md') && f !== 'README.md');

    if (files.length === 0) {
      // No changesets exist, get all commits since last release tag
      try {
        const lastTag = execSync('git describe --tags --abbrev=0', {
          encoding: 'utf8',
        }).trim();
        const commits = execSync(`git log ${lastTag}..HEAD --format=%H`, {
          encoding: 'utf8',
        })
          .trim()
          .split('\n')
          .filter(Boolean);
        return commits;
      } catch {
        // No tags exist, get all commits
        const commits = execSync('git log --format=%H', { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
        return commits;
      }
    }

    // Get the most recent changeset file
    const latestChangeset = files
      .map((f) => ({
        file: f,
        time: execSync(`git log -1 --format=%ct -- .changeset/${f}`, {
          encoding: 'utf8',
        }).trim(),
      }))
      .sort((a, b) => Number(b.time) - Number(a.time))[0];

    // Get commits since that changeset was added
    const changesetCommit = execSync(`git log -1 --format=%H -- .changeset/${latestChangeset.file}`, {
      encoding: 'utf8',
    }).trim();

    const commits = execSync(`git log ${changesetCommit}..HEAD --format=%H`, {
      encoding: 'utf8',
    })
      .trim()
      .split('\n')
      .filter(Boolean);

    return commits;
  } catch (error) {
    console.error('Error getting commits:', error);
    return [];
  }
}

/**
 * Parse a conventional commit message
 */
function parseConventionalCommit(hash: string): ConventionalCommit | null {
  try {
    const fullMessage = execSync(`git log -1 --format=%B ${hash}`, {
      encoding: 'utf8',
    }).trim();

    // Parse conventional commit format: type(scope): subject
    const conventionalPattern = /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(([^)]+)\))?: (.+)/;
    const match = fullMessage.match(conventionalPattern);

    if (!match) {
      return null; // Not a conventional commit
    }

    const [, type, , scope, subject] = match;
    const body = fullMessage.split('\n').slice(1).join('\n').trim();
    const breaking = fullMessage.includes('BREAKING CHANGE:') || fullMessage.includes('!:');

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
function determineBumpType(commits: ConventionalCommit[]): 'major' | 'minor' | 'patch' {
  // Check for breaking changes
  if (commits.some((c) => c.breaking)) {
    return 'major';
  }

  // Check for features
  if (commits.some((c) => c.type === 'feat')) {
    return 'minor';
  }

  // Default to patch
  return 'patch';
}

/**
 * Check if Claude CLI is available
 */
function isClaudeCliAvailable(): boolean {
  try {
    execSync('which claude', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate changelog using Anthropic API
 */
async function generateChangelogWithAnthropicAPI(commits: ConventionalCommit[], apiKey: string): Promise<string> {
  const commitSummary = commits
    .map((c) => `- ${c.type}${c.scope ? `(${c.scope})` : ''}: ${c.subject}\n  ${c.body || '(no additional details)'}`)
    .join('\n\n');

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
  // Use node's https module to call Anthropic API
  const https = await import('node:https');

  const data = JSON.stringify({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }],
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.anthropic.com',
      port: 443,
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': data.length,
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        if (res.statusCode === 200) {
          const response = JSON.parse(body);
          resolve(response.content[0].text.trim());
        } else {
          reject(new Error(`API error: ${res.statusCode} ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

/**
 * Generate simple changelog from commit messages (fallback)
 */
function generateSimpleChangelog(commits: ConventionalCommit[]): string {
  // Group commits by type
  const features = commits.filter((c) => c.type === 'feat');
  const fixes = commits.filter((c) => c.type === 'fix');
  const others = commits.filter((c) => !['feat', 'fix'].includes(c.type));

  const lines: string[] = [];

  if (features.length > 0) {
    lines.push(...features.map((c) => `- ${c.scope ? `**${c.scope}**: ` : ''}${c.subject}`));
  }

  if (fixes.length > 0) {
    lines.push(...fixes.map((c) => `- ${c.scope ? `**${c.scope}**: ` : ''}${c.subject}`));
  }

  if (others.length > 0 && lines.length < 3) {
    lines.push(...others.map((c) => `- ${c.scope ? `**${c.scope}**: ` : ''}${c.subject}`).slice(0, 5 - lines.length));
  }

  return lines.slice(0, 5).join('\n');
}

/**
 * Use Claude CLI or API to generate a changelog description
 */
async function generateChangelog(commits: ConventionalCommit[]): Promise<string> {
  // Check for Claude CLI first (fastest)
  if (isClaudeCliAvailable()) {
    const commitSummary = commits
      .map((c) => `- ${c.type}${c.scope ? `(${c.scope})` : ''}: ${c.subject}\n  ${c.body || '(no additional details)'}`)
      .join('\n\n');

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
      const tempFile = join(process.cwd(), `.changeset-prompt-${Date.now()}.txt`);
      writeFileSync(tempFile, prompt);

      const result = execSync(`claude -p "$(cat ${tempFile})" --no-stream --output-only`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      execSync(`rm ${tempFile}`);
      console.log('✨ Generated changelog with Claude CLI');
      return result.trim();
    } catch (_error) {
      console.warn('⚠️  Claude CLI failed, trying API...');
    }
  }

  // Check for Anthropic API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    try {
      console.log('🔑 Using Anthropic API...');
      const result = await generateChangelogWithAnthropicAPI(commits, apiKey);
      console.log('✨ Generated changelog with Anthropic API');
      return result;
    } catch (_error) {
      console.warn('⚠️  Anthropic API failed, using fallback...');
    }
  }

  // Fallback to simple changelog
  console.log('📝 Using simple changelog generation (no AI available)');
  console.log('   Tip: Install Claude CLI or set ANTHROPIC_API_KEY for AI-generated changelogs');
  return generateSimpleChangelog(commits);
}

/**
 * Create a changeset file
 */
function createChangesetFile(data: ChangesetData): void {
  const changesetDir = join(process.cwd(), '.changeset');

  if (!existsSync(changesetDir)) {
    mkdirSync(changesetDir, { recursive: true });
  }

  // Generate a unique filename
  const hash = crypto.randomBytes(4).toString('hex');
  const filename = `auto-${hash}.md`;
  const filepath = join(changesetDir, filename);

  // Create the changeset content
  const content = `---
"@auto-engineer/cli": ${data.bumpType}
"@auto-engineer/server-generator-apollo-emmett": ${data.bumpType}
"@auto-engineer/server-generator-nestjs": ${data.bumpType}
"@auto-engineer/server-implementer": ${data.bumpType}
"@auto-engineer/information-architect": ${data.bumpType}
"@auto-engineer/generate-react-client": ${data.bumpType}
"@auto-engineer/react-component-implementer": ${data.bumpType}
"@auto-engineer/app-implementer": ${data.bumpType}
"@auto-engineer/pipeline": ${data.bumpType}
"@auto-engineer/message-bus": ${data.bumpType}
"@auto-engineer/message-store": ${data.bumpType}
"@auto-engineer/file-store": ${data.bumpType}
"@auto-engineer/narrative": ${data.bumpType}
"@auto-engineer/id": ${data.bumpType}
"@auto-engineer/dev-server": ${data.bumpType}
"@auto-engineer/server-checks": ${data.bumpType}
"@auto-engineer/model-factory": ${data.bumpType}
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
async function main() {
  console.log('🔍 Checking for commits that need changesets...');

  const commitHashes = getCommitsSinceLastChangeset();

  if (commitHashes.length === 0) {
    console.log('✨ No new commits found. Nothing to do.');
    return;
  }

  console.log(`📝 Found ${commitHashes.length} commit(s) to process`);

  // Parse conventional commits
  const commits = commitHashes.map(parseConventionalCommit).filter((c): c is ConventionalCommit => c !== null);

  if (commits.length === 0) {
    console.log('⚠️  No conventional commits found. Skipping changeset generation.');
    console.log('   (Commits must follow format: type(scope): subject, e.g., feat(cli): add new command)');
    return;
  }

  console.log(`✅ Found ${commits.length} valid conventional commit(s)`);

  // Determine bump type
  const bumpType = determineBumpType(commits);
  console.log(`📊 Determined version bump: ${bumpType}`);

  // Generate changelog
  console.log('🤖 Generating changelog...');
  const description = await generateChangelog(commits);

  // Create changeset
  createChangesetFile({
    bumpType,
    commits,
    description,
  });

  console.log('\n✨ Changeset generated successfully!');
  console.log('\nChangelog preview:');
  console.log('---');
  console.log(description);
  console.log('---');
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
