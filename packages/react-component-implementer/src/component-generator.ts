import type { LanguageModel } from 'ai';
import { generateText } from 'ai';
import type { ComponentTask } from './types.js';

export interface GeneratedCode {
  componentCode: string;
  storyCode: string;
}

export interface GenerationContext {
  uiBuildingInstructions: string;
  existingComponents: string;
  fileTree: string;
}

export interface ValidationFeedback {
  typeErrors?: string[];
  interactionErrors?: string[];
  consoleErrors?: string[];
  consoleWarnings?: string[];
  visualFeedback?: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function buildSystemPrompt(context: GenerationContext): string {
  const lines: string[] = [
    'You are a React component generator for a shadcn/ui design system.',
    'Tech stack: React, react-router-dom, shadcn/ui, Tailwind CSS.',
    'Do not use Next.js or any Next.js-specific APIs (no next/link, next/image, next/router, useRouter from next/navigation, server components, etc.). Use react-router-dom for navigation (Link, useNavigate, useParams).',
    'Follow these conventions:',
    '- Use Tailwind CSS for styling',
    '- Use the data-slot pattern for component identification (e.g. data-slot="button")',
    '- Export components as named exports',
    '- Stories must use play functions for interaction testing',
    '- Use React.forwardRef where appropriate',
    '- Story titles must be just the component name (e.g. title: "Button"), never with folder prefixes',
    '- Import existing components from "@/components/ui/{kebab-name}" (e.g. import { Button } from "@/components/ui/button")',
    '- The parenthesized name in the existing components list is the file name for imports',
    '- In story files, import the component being tested using a relative path (e.g. import { BookCard } from "./book-card")',
    '- When a component would benefit from imagery (e.g. cards, lists, heroes, profiles, products), use Unsplash image URLs (e.g. "https://images.unsplash.com/photo-{id}?w=300&h=200&fit=crop") to make the component visually rich and realistic. Pick real Unsplash photo IDs that match the content (e.g. a food photo for a restaurant card, a book cover for a bookstore). Use a different photo per item for visual variety.',
    '',
    'UI Building Instructions:',
    context.uiBuildingInstructions,
    '',
    'Existing Components:',
    context.existingComponents,
    '',
    'File Tree:',
    context.fileTree,
    'Use these exact file paths when constructing import statements. Do not guess or invent file paths.',
    '',
    'GraphQL & Data Fetching (organisms only):',
    '- When an organism has GraphQL requests, use @tanstack/react-query with graphql-request',
    '- Import { useQuery, useMutation } from "@tanstack/react-query"',
    '- Import { request, gql } from "graphql-request"',
    '- Define the GraphQL document using gql`...` with the exact operation string provided',
    '- Use a queryFn that calls request(endpoint, document, variables)',
    '- Accept the GraphQL endpoint via props or use a default "/graphql"',
    '- Handle loading (isPending) and error (isError) states in the component',
    '',
    'Storybook MSW Mocking (for organisms with GraphQL requests):',
    '- Mock GraphQL operations in stories using MSW (Mock Service Worker) via msw-storybook-addon',
    '- Import { graphql, HttpResponse } from "msw"',
    '- Define handlers using graphql.query("OperationName", ...) or graphql.mutation("OperationName", ...)',
    '- Attach handlers to each story via parameters.msw.handlers',
    '- Provide realistic, visually rich mock data that matches the GraphQL response shape',
    '- Include Unsplash image URLs in mock data whenever the component displays images (e.g. cover art, thumbnails, avatars, product photos). Use real Unsplash photo IDs that are contextually relevant, and a different photo per item for visual variety.',
    '- Example:',
    '  export const Default: StoryObj = {',
    '    parameters: {',
    '      msw: {',
    '        handlers: [',
    '          graphql.query("SearchBooks", () => HttpResponse.json({',
    '            data: { searchBooks: { results: [',
    '              { bookId: "1", title: "The Great Gatsby", author: "F. Scott Fitzgerald", price: 12.99, coverUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=200&h=300&fit=crop" },',
    '              { bookId: "2", title: "To Kill a Mockingbird", author: "Harper Lee", price: 14.99, coverUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=200&h=300&fit=crop" },',
    '            ] } }',
    '          }))',
    '        ]',
    '      }',
    '    }',
    '  }',
    '- Each story variant should have its own handlers (e.g. loading, error, empty state)',
    '- For error stories, return errors: graphql.query("Op", () => HttpResponse.json({ errors: [{ message: "Failed" }] }))',
    '',
    'Visual Hierarchy & Typography:',
    '- Headlines: text-4xl or text-5xl font-bold tracking-tight',
    '- Subheadings: text-2xl font-semibold',
    '- Body text: text-base leading-relaxed',
    '- Captions/metadata: text-sm text-muted-foreground',
    '- Use consistent font weights: bold for emphasis, semibold for subheadings, normal for body',
    '',
    'Spacing Rhythm:',
    '- Section gaps: space-y-16 or py-16 between major page sections',
    '- Content block gaps: space-y-6 between related content groups',
    '- Element spacing: space-y-3 or gap-3 between individual elements',
    '- Use consistent padding: p-6 for cards, p-4 for compact elements, p-8 for spacious sections',
    '',
    'Interactive States:',
    '- Hover: hover:shadow-lg, hover:bg-accent, hover:scale-[1.02]',
    '- Focus: focus:ring-2 focus:ring-ring focus:ring-offset-2',
    '- Active: active:scale-95',
    '- Transitions: transition-all duration-200 for smooth state changes',
    '- Disabled: opacity-50 cursor-not-allowed',
    '',
    'Layout Architecture Patterns:',
    '- Full-height layout: <div className="h-screen flex flex-col"><header className="flex-shrink-0">...</header><main className="flex-1 overflow-auto">...</main></div>',
    '- Sidebar + main: <div className="h-full flex"><aside className="w-64 flex-shrink-0 border-r">...</aside><main className="flex-1 overflow-auto">...</main></div>',
    '- Scrollable content area: Use flex-1 overflow-auto on the scrollable container, flex-shrink-0 on fixed elements',
    '- Centered content: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
    '- Grid layouts: grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6',
    '',
    'Error Prevention Rules:',
    '- Zustand selectors: NEVER use object-literal selectors like useStore(s => ({ a: s.a, b: s.b })). Select primitives individually: const a = useStore(s => s.a)',
    '- Render loops: NEVER call setState during render. Use useEffect for side effects with stable dependency arrays',
    '- Import validation: Verify named vs default exports. Use correct import paths matching the file tree above',
    '- Dependency validation: Only import packages that are available. Do not import from packages not listed in the file tree or existing components',
    '',
    'BAD vs GOOD Examples:',
    '- BAD: const { a, b } = useStore(s => ({ a: s.a, b: s.b })) — creates new object every render, causes infinite re-renders',
    '- GOOD: const a = useStore(s => s.a); const b = useStore(s => s.b); — stable primitive selectors',
    '- BAD: import { Button } from "shadcn/ui" — wrong import path',
    '- GOOD: import { Button } from "@/components/ui/button" — correct shadcn/ui import path',
    '- BAD: import Link from "react-router-dom" — wrong, Link is a named export',
    '- GOOD: import { Link } from "react-router-dom" — correct named import',
    '',
    'Respond with exactly two tsx code blocks.',
    'The first code block is the component implementation.',
    'The second code block is the Storybook story.',
  ];

  return lines.join('\n');
}

function buildUserPrompt(task: ComponentTask): string {
  const lines: string[] = [
    `Component: ${task.name}`,
    `Description: ${task.description}`,
    `Level: ${task.level}`,
    '',
    'Props:',
    ...Object.entries(task.props).map(([key, value]) => `  ${key}: ${value}`),
  ];

  if (task.variants && task.variants.length > 0) {
    lines.push('', 'Variants:', ...task.variants.map((v) => `  - ${v}`));
  }

  if (task.state && task.state.length > 0) {
    lines.push('', 'State:', ...task.state.map((s) => `  - ${s}`));
  }

  if (task.requests && task.requests.length > 0) {
    lines.push('', 'GraphQL Requests:', ...task.requests.map((r) => `  ${r}`));
  }

  if (task.prompt) {
    lines.push('', 'Additional Instructions:', task.prompt);
  }

  return lines.join('\n');
}

function parseCodeBlocks(text: string): GeneratedCode {
  const codeBlockRegex = /```tsx\n([\s\S]*?)```/g;
  const matches: string[] = [];
  let match = codeBlockRegex.exec(text);
  while (match) {
    matches.push(match[1].trim());
    match = codeBlockRegex.exec(text);
  }

  if (matches.length < 2) {
    throw new Error(`Expected 2 tsx code blocks but found ${matches.length}`);
  }

  return {
    componentCode: matches[0],
    storyCode: matches[1],
  };
}

function buildFeedbackPrompt(feedback: ValidationFeedback): string {
  const lines: string[] = [
    'The component and story code you generated above had validation issues.',
    '',
    'Validation errors:',
  ];

  if (feedback.typeErrors && feedback.typeErrors.length > 0) {
    lines.push('', 'TypeScript errors:', ...feedback.typeErrors.map((e) => `  - ${e}`));
  }

  if (feedback.interactionErrors && feedback.interactionErrors.length > 0) {
    lines.push('', 'Interaction errors:', ...feedback.interactionErrors.map((e) => `  - ${e}`));
  }

  if (feedback.consoleErrors && feedback.consoleErrors.length > 0) {
    lines.push('', 'Console errors:', ...feedback.consoleErrors.map((e) => `  - ${e}`));
  }

  if (feedback.consoleWarnings && feedback.consoleWarnings.length > 0) {
    lines.push('', 'Console warnings:', ...feedback.consoleWarnings.map((e) => `  - ${e}`));
  }

  if (feedback.visualFeedback) {
    lines.push('', 'Visual feedback:', `  ${feedback.visualFeedback}`);
  }

  lines.push(
    '',
    'Fix all the issues above. Respond with exactly two tsx code blocks.',
    'The first code block is the fixed component implementation.',
    'The second code block is the fixed Storybook story.',
  );

  return lines.join('\n');
}

export interface RefinementHistory {
  messages: Message[];
}

export function createComponentGenerator(model: LanguageModel) {
  return {
    async generate(
      task: ComponentTask,
      context: GenerationContext,
    ): Promise<{ code: GeneratedCode; history: RefinementHistory }> {
      const system = buildSystemPrompt(context);
      const prompt = buildUserPrompt(task);

      const { text } = await generateText({
        model,
        messages: [
          {
            role: 'system',
            content: system,
            providerOptions: { anthropic: { cacheControl: { type: 'ephemeral' } } },
          },
          { role: 'user', content: prompt },
        ],
      });

      const code = parseCodeBlocks(text);
      const history: RefinementHistory = {
        messages: [
          { role: 'user', content: prompt },
          { role: 'assistant', content: text },
        ],
      };

      return { code, history };
    },

    async refine(
      feedback: ValidationFeedback,
      context: GenerationContext,
      history: RefinementHistory,
    ): Promise<{ code: GeneratedCode; history: RefinementHistory }> {
      const system = buildSystemPrompt(context);
      const feedbackPrompt = buildFeedbackPrompt(feedback);

      const { text } = await generateText({
        model,
        messages: [
          {
            role: 'system',
            content: system,
            providerOptions: { anthropic: { cacheControl: { type: 'ephemeral' } } },
          },
          ...history.messages,
          { role: 'user', content: feedbackPrompt },
        ],
      });

      const newCode = parseCodeBlocks(text);
      const newHistory: RefinementHistory = {
        messages: [
          ...history.messages,
          { role: 'user', content: feedbackPrompt },
          { role: 'assistant', content: text },
        ],
      };

      return { code: newCode, history: newHistory };
    },
  };
}
