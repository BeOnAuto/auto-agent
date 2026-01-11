import type { ChangelogProvider, ConventionalCommit } from '../../../types/index.js';

export class AnthropicApiProvider implements ChangelogProvider {
  name = 'anthropic-api';

  constructor(private apiKey?: string) {}

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey || !!process.env.ANTHROPIC_API_KEY;
  }

  async generate(commits: ConventionalCommit[]): Promise<string> {
    const apiKey = this.apiKey || process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not provided');
    }

    const prompt = buildPrompt(commits);

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
}

function buildPrompt(commits: ConventionalCommit[]): string {
  const commitSummary = commits
    .map((c) => `- ${c.type}${c.scope ? `(${c.scope})` : ''}: ${c.subject}\n  ${c.body || '(no additional details)'}`)
    .join('\n\n');

  return `You are analyzing git commits to generate a changelog entry. Here are the commits:

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
}
