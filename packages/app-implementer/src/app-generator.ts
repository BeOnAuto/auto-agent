import type { LanguageModel } from 'ai';
import { generateText } from 'ai';
import type { ComponentCatalog } from './component-discovery.js';
import type { UserJourney } from './journey-analyzer.js';

export interface GeneratedFile {
  path: string;
  content: string;
}

export interface GeneratedApp {
  files: GeneratedFile[];
}

export interface AppGenerationContext {
  journey: UserJourney;
  catalog: ComponentCatalog;
  fileTree: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface RefinementHistory {
  messages: Message[];
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export function buildAppSystemPrompt(catalog: ComponentCatalog, fileTree: string): string {
  const lines: string[] = [
    'You are a React app generator. Given a user journey and component catalog from Storybook,',
    'generate the complete app source files.',
    '',
    'Generate these files:',
    '- App.tsx: React Router routes for each page, wrapped in BrowserRouter + QueryClientProvider (already in starter)',
    '- pages/*.tsx: One page component per page, composing available components',
    '- layouts/*.tsx: Layout components for shared page structure',
    '',
    'Conventions:',
    '- Import components from "@/components/ui/{kebab-name}" (e.g. import { Button } from "@/components/ui/button")',
    '- Use React Router for navigation: import { Link, useNavigate } from "react-router-dom"',
    '- Use @tanstack/react-query for data fetching (QueryClient already provided in App.tsx)',
    '- Follow the navigation edges from the journey to wire up links/buttons between pages',
    '- Use Tailwind CSS for styling',
    '- Export page components as default exports',
    '- Export layout components as named exports',
    '',
    'UI Building Instructions:',
    catalog.instructions,
    '',
    'Available Components:',
    catalog.overview,
    '',
    'Component Documentation:',
    ...catalog.componentDocs.map((doc) => `[${doc.id}]: ${doc.documentation}`),
    '',
    'File Tree:',
    fileTree,
    'Use these exact file paths when constructing import statements. Do not guess or invent file paths.',
    '',
    'Layout Architecture Patterns:',
    '- Full-height layout: <div className="h-screen flex flex-col"><header className="flex-shrink-0">...</header><main className="flex-1 overflow-auto">...</main></div>',
    '- Sidebar + main: <div className="h-full flex"><aside className="w-64 flex-shrink-0 border-r">...</aside><main className="flex-1 overflow-auto">...</main></div>',
    '- Centered content: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
    '- Grid layouts: grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6',
    '',
    'Error Prevention Rules:',
    '- Zustand selectors: NEVER use object-literal selectors like useStore(s => ({ a: s.a, b: s.b })). Select primitives individually',
    '- Render loops: NEVER call setState during render. Use useEffect for side effects with stable dependency arrays',
    '- Import validation: Verify named vs default exports. import { Link } from "react-router-dom" (named), not import Link from "react-router-dom"',
    '- Only import packages available in the starter project: react, react-dom, react-router-dom, @tanstack/react-query, graphql-request',
    '',
    'Visual Quality:',
    '- The application must appear visually stunning, professionally crafted, and polished',
    '- Use proper spacing: space-y-16 between sections, space-y-6 between content blocks, space-y-3 between elements',
    '- Use responsive design: mobile-first with sm:, md:, lg: breakpoints',
    '- Include hover states, transitions (transition-all duration-200), and proper focus rings',
    '',
    'Implementation Mindset:',
    '- Generate complete, production-ready code in a single pass',
    '- Every page must render correctly without placeholder or TODO comments',
    '- Handle loading states (skeleton/spinner) and error states (user-friendly messages) for every data-fetching page',
    '',
    'Output format: For each file, output a header line followed by a tsx code block:',
    '<!-- file: path/to/File.tsx -->',
    '```tsx',
    '// file content',
    '```',
  ];

  return lines.join('\n');
}

export function buildAppUserPrompt(context: AppGenerationContext): string {
  const lines: string[] = [
    'User Journey:',
    `  Entry page: ${context.journey.entryPageId}`,
    '',
    '  Pages:',
    ...context.journey.pages.map((p) => `    - ${p.pageId}: "${p.name}" (${p.routePath}) — ${p.description}`),
    '',
    '  Navigation:',
    ...context.journey.navigationEdges.map((e) => `    - ${e.fromPageId} → ${e.toPageId}: ${e.trigger}`),
    '',
    '  Data Dependencies:',
    ...context.journey.dataDependencies.map(
      (d) => `    - ${d.pageId} needs "${d.requiredData}"${d.sourceRequest ? ` from ${d.sourceRequest}` : ''}`,
    ),
    '',
    'Available Components (from Storybook):',
    context.catalog.overview,
  ];

  return lines.join('\n');
}

export function parseGeneratedFiles(text: string): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const fileRegex = /<!--\s*file:\s*(.+?)\s*-->\s*```tsx\n([\s\S]*?)```/g;
  let match = fileRegex.exec(text);
  while (match) {
    files.push({ path: match[1].trim(), content: match[2].trim() });
    match = fileRegex.exec(text);
  }
  if (files.length === 0) {
    throw new Error('No generated files found in response');
  }
  return files;
}

export function extractErroredFiles(errors: string[], allFiles: GeneratedFile[]): GeneratedFile[] {
  const erroredPaths = new Set<string>();
  for (const error of errors) {
    const match = error.match(/^(.+?)\(\d+,\d+\)/);
    if (match) {
      erroredPaths.add(match[1]);
    }
  }
  if (erroredPaths.size === 0) {
    return allFiles;
  }
  return allFiles.filter((f) => erroredPaths.has(f.path));
}

function buildRefinementPrompt(erroredFiles: GeneratedFile[], allFileNames: string[], errors: string[]): string {
  const lines: string[] = [
    'The previous code had type errors. Here are the files with errors and the errors found.',
    '',
    'All files in the app:',
    ...allFileNames.map((name) => `  - ${name}`),
    '',
    'Files with errors:',
    '',
  ];

  for (const file of erroredFiles) {
    lines.push(`<!-- file: ${file.path} -->`);
    lines.push('```tsx');
    lines.push(file.content);
    lines.push('```');
    lines.push('');
  }

  lines.push('Type errors:');
  lines.push(...errors.map((e) => `  - ${e}`));
  lines.push('');
  lines.push('Fix all the type errors. Output all files again using the same format.');

  return lines.join('\n');
}

export async function generateApp(
  context: AppGenerationContext,
  model: LanguageModel,
): Promise<{ app: GeneratedApp; history: RefinementHistory; usage: TokenUsage }> {
  const system = buildAppSystemPrompt(context.catalog, context.fileTree);
  const prompt = buildAppUserPrompt(context);

  const { text, usage } = await generateText({
    model,
    messages: [
      {
        role: 'system',
        content: system,
      },
      { role: 'user', content: prompt },
    ],
  });
  const files = parseGeneratedFiles(text);
  const history: RefinementHistory = {
    messages: [
      { role: 'user', content: prompt },
      { role: 'assistant', content: text },
    ],
  };
  const tokenUsage: TokenUsage = {
    inputTokens: usage?.promptTokens ?? 0,
    outputTokens: usage?.completionTokens ?? 0,
    totalTokens: (usage?.promptTokens ?? 0) + (usage?.completionTokens ?? 0),
  };
  return { app: { files }, history, usage: tokenUsage };
}

export async function refineApp(
  app: GeneratedApp,
  errors: string[],
  catalog: ComponentCatalog,
  fileTree: string,
  history: RefinementHistory,
  model: LanguageModel,
): Promise<{ app: GeneratedApp; history: RefinementHistory; usage: TokenUsage }> {
  const system = buildAppSystemPrompt(catalog, fileTree);
  const erroredFiles = extractErroredFiles(errors, app.files);
  const allFileNames = app.files.map((f) => f.path);
  const refinementPrompt = buildRefinementPrompt(erroredFiles, allFileNames, errors);

  const { text, usage } = await generateText({
    model,
    messages: [
      {
        role: 'system',
        content: system,
      },
      ...history.messages,
      { role: 'user', content: refinementPrompt },
    ],
  });

  const files = parseGeneratedFiles(text);
  const newHistory: RefinementHistory = {
    messages: [...history.messages, { role: 'user', content: refinementPrompt }, { role: 'assistant', content: text }],
  };
  const tokenUsage: TokenUsage = {
    inputTokens: usage?.promptTokens ?? 0,
    outputTokens: usage?.completionTokens ?? 0,
    totalTokens: (usage?.promptTokens ?? 0) + (usage?.completionTokens ?? 0),
  };

  return { app: { files }, history: newHistory, usage: tokenUsage };
}
