import type { LanguageModel } from 'ai';
import { generateText } from 'ai';
import type { ComponentCatalog } from './component-discovery.js';

export interface NavigationEdge {
  fromPageId: string;
  toPageId: string;
  trigger: string;
  triggerComponentId?: string;
}

export interface DataDependency {
  pageId: string;
  requiredData: string;
  sourcePageId?: string;
  sourceRequest?: string;
}

export interface UserJourney {
  entryPageId: string;
  pages: Array<{ pageId: string; routePath: string; name: string; description: string }>;
  navigationEdges: NavigationEdge[];
  dataDependencies: DataDependency[];
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export function buildJourneySystemPrompt(): string {
  return [
    'You are a UX journey analyzer. Given a narrative model and the available component catalog from Storybook,',
    'determine the user journey through the application.',
    '',
    'The narrative model describes user stories, features, and flows. The component catalog shows what pages,',
    'templates, and UI components are available in Storybook. Use both to determine:',
    '',
    'Analyze:',
    '- Which pages should exist based on the narrative and available page/template components',
    '- Routes for each page',
    '- How users navigate between pages (buttons, links, form submissions)',
    '- Which components trigger navigation',
    '- What data each page needs and where it comes from',
    '- Which page is the entry point (typically "/" or the main landing page)',
    '- Primary vs secondary navigation (main nav bar vs contextual links within pages)',
    '- State management considerations: what data persists across pages (e.g. cart items, user session, search filters)',
    '- Loading and error state planning: for each page, what loading states are needed and how errors should be handled',
    '',
    'Respond with a single JSON object (no markdown fences) matching this schema:',
    '{',
    '  "entryPageId": "string",',
    '  "pages": [{ "pageId": "string", "routePath": "string", "name": "string", "description": "string" }],',
    '  "navigationEdges": [{ "fromPageId": "string", "toPageId": "string", "trigger": "string", "triggerComponentId": "string (optional)" }],',
    '  "dataDependencies": [{ "pageId": "string", "requiredData": "string", "sourcePageId": "string (optional)", "sourceRequest": "string (optional)" }]',
    '}',
  ].join('\n');
}

export function buildJourneyUserPrompt(narrative: unknown, catalog: ComponentCatalog): string {
  const lines: string[] = [
    'Narrative Model:',
    JSON.stringify(narrative, null, 2),
    '',
    'Available Components (from Storybook):',
    catalog.overview,
  ];

  return lines.join('\n');
}

export function parseJourneyResponse(text: string): UserJourney {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON object found in journey response');
  }
  const parsed: unknown = JSON.parse(jsonMatch[0]);
  return parsed as UserJourney;
}

export async function analyzeJourney(
  narrative: unknown,
  catalog: ComponentCatalog,
  model: LanguageModel,
): Promise<{ journey: UserJourney; usage: TokenUsage }> {
  const { text, usage } = await generateText({
    model,
    messages: [
      {
        role: 'system',
        content: buildJourneySystemPrompt(),
        providerOptions: { anthropic: { cacheControl: { type: 'ephemeral' } } },
      },
      { role: 'user', content: buildJourneyUserPrompt(narrative, catalog) },
    ],
  });
  const tokenUsage: TokenUsage = {
    inputTokens: usage?.promptTokens ?? 0,
    outputTokens: usage?.completionTokens ?? 0,
    totalTokens: (usage?.promptTokens ?? 0) + (usage?.completionTokens ?? 0),
  };
  return { journey: parseJourneyResponse(text), usage: tokenUsage };
}
