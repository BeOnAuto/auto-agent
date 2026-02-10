import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { generateTextWithAI } from '@auto-engineer/ai-gateway';
import createDebug from 'debug';
import * as ts from 'typescript';

const debug = createDebug('auto:frontend-implementer:agent');
const debugPlan = createDebug('auto:frontend-implementer:agent:plan');

const HTML_ELEMENTS_PATH = path.join(import.meta.dirname, 'HTML_ELEMENTS.md');
let htmlElementsContent: string | null = null;

async function getHtmlElementsReference(): Promise<string> {
  if (htmlElementsContent === null) {
    try {
      htmlElementsContent = await fs.readFile(HTML_ELEMENTS_PATH, 'utf-8');
      debug('Loaded HTML_ELEMENTS.md, size: %d bytes', htmlElementsContent.length);
    } catch (error) {
      debug('Failed to load HTML_ELEMENTS.md: %O', error);
      htmlElementsContent = '';
    }
  }
  return htmlElementsContent;
}
// const debugErrors = createDebug('auto:frontend-implementer:agent:errors');
// const debugScreenshots = createDebug('auto:frontend-implementer:agent:screenshots');
// const debugFixes = createDebug('auto:frontend-implementer:agent:fixes');
const debugContext = createDebug('auto:frontend-implementer:agent:context');
const debugAI = createDebug('auto:frontend-implementer:agent:ai');
const debugFiles = createDebug('auto:frontend-implementer:agent:files');
const debugComponents = createDebug('auto:frontend-implementer:agent:components');

// Utility to extract props from interface
function extractPropsFromInterface(
  node: ts.InterfaceDeclaration,
  sourceFile: ts.SourceFile,
): { name: string; type: string }[] {
  debugComponents('Extracting props from interface: %s', node.name.text);
  const props = node.members.filter(ts.isPropertySignature).map((member) => {
    const name = member.name.getText(sourceFile);
    const type = member.type ? member.type.getText(sourceFile) : 'any';
    debugComponents('  Property: %s: %s', name, type);
    return { name, type };
  });
  debugComponents('Extracted %d props from interface', props.length);
  return props;
}

// Utility to extract props from type alias
function extractPropsFromTypeAlias(
  node: ts.TypeAliasDeclaration,
  sourceFile: ts.SourceFile,
): { name: string; type: string }[] {
  debugComponents('Extracting props from type alias: %s', node.name.text);
  if (!ts.isTypeLiteralNode(node.type)) {
    debugComponents('  Type alias is not a type literal, skipping');
    return [];
  }
  const props = node.type.members.filter(ts.isPropertySignature).map((member) => {
    const name = member.name.getText(sourceFile);
    const type = member.type ? member.type.getText(sourceFile) : 'any';
    debugComponents('  Property: %s: %s', name, type);
    return { name, type };
  });
  debugComponents('Extracted %d props from type alias', props.length);
  return props;
}

// Extract atoms and their props from src/components/atoms
async function getAtomsWithProps(
  projectDir: string,
): Promise<{ name: string; props: { name: string; type: string }[] }[]> {
  const atomsDir = path.join(projectDir, 'src/components/atoms');
  debugComponents('Getting atoms from: %s', atomsDir);
  let files: string[] = [];
  try {
    files = (await fs.readdir(atomsDir)).filter((f) => f.endsWith('.tsx'));
    debugComponents('Found %d atom files', files.length);
  } catch (error) {
    debugComponents('Error reading atoms directory: %O', error);
    return [];
  }
  const atoms: { name: string; props: { name: string; type: string }[] }[] = [];
  for (const file of files) {
    const filePath = path.join(atomsDir, file);
    debugComponents('Processing atom file: %s', file);
    const content = await fs.readFile(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true);
    let componentName = file.replace(/\.tsx$/, '');
    componentName = componentName.charAt(0).toUpperCase() + componentName.slice(1);
    debugComponents('Component name: %s', componentName);
    let props: { name: string; type: string }[] = [];
    ts.forEachChild(sourceFile, (node) => {
      if (
        ts.isInterfaceDeclaration(node) &&
        node.name.text.toLowerCase().includes(componentName.toLowerCase()) &&
        node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) === true
      ) {
        props = extractPropsFromInterface(node, sourceFile);
      }
      if (
        ts.isTypeAliasDeclaration(node) &&
        node.name.text.toLowerCase().includes(componentName.toLowerCase()) &&
        node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) === true
      ) {
        props = extractPropsFromTypeAlias(node, sourceFile);
      }
    });
    atoms.push({ name: componentName, props });
    debugComponents('Added atom %s with %d props', componentName, props.length);
  }
  debugComponents('Total atoms extracted: %d', atoms.length);
  return atoms;
}

const provider = undefined;

function extractJsonArray(text: string): string {
  debugAI('Extracting JSON array from text of length: %d', text.length);
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch?.[1]) {
    debugAI('Found JSON in code block');
    return codeBlockMatch[1].trim();
  }
  const arrayMatch = text.match(/(\[[\s\S]*\])/);
  if (arrayMatch) {
    debugAI('Found JSON array in text');
    return arrayMatch[0];
  }
  debugAI('No JSON array found, returning original text');
  return text;
}

async function callAI(prompt: string, options?: { temperature?: number; maxTokens?: number }) {
  const temperature = options?.temperature ?? 0.2;
  const maxTokens = options?.maxTokens ?? 4000 * 3;
  debugAI('Calling AI with prompt length: %d, temperature: %f, maxTokens: %d', prompt.length, temperature, maxTokens);
  const result = await generateTextWithAI(prompt, { provider, temperature, maxTokens });
  debugAI('AI response received, length: %d', result.length);
  return result.trim();
}

// Copy the Scheme type from index.ts for local use
export interface Scheme {
  generatedComponents?: { type: string; items?: Record<string, unknown> }[];
  atoms?: {
    description?: string;
    items?: Record<string, unknown>;
  };
  molecules?: {
    description?: string;
    items?: Record<string, unknown>;
  };
  organisms?: {
    description?: string;
    items?: Record<string, unknown>;
  };
  templates?: {
    description?: string;
    items?: Record<
      string,
      {
        description: string;
        layout?: {
          organisms: string[];
        };
        specs?: string[];
        [key: string]: unknown;
      }
    >;
  };
  pages?: {
    description?: string;
    items?: Record<
      string,
      {
        route: string;
        description: string;
        template: string;
        navigation?: unknown;
        specs?: string[];
        data_requirements?: unknown[];
        [key: string]: unknown;
      }
    >;
  };
}

interface ProjectContext {
  scheme: Scheme | undefined;
  files: string[];
  atoms: { name: string; props: { name: string; type: string }[] }[];
  keyFileContents: Record<string, string>;
  fileTreeSummary: string[];
  graphqlOperations: Record<string, string>;
  userPreferences: string;
  theme: string;
  failures: string[];
}

// eslint-disable-next-line complexity
async function loadScheme(iaSchemeDir: string): Promise<Scheme | undefined> {
  const schemePath = path.join(iaSchemeDir, 'auto-ia-scheme.json');
  debugContext('Loading IA scheme from: %s', schemePath);
  try {
    const content = await fs.readFile(schemePath, 'utf-8');
    const scheme = JSON.parse(content) as Scheme;
    debugContext('IA scheme loaded successfully');
    debugContext(
      'Scheme has %d pages, %d templates, %d organisms, %d molecules, %d atoms',
      Object.keys(scheme.pages?.items ?? {}).length,
      Object.keys(scheme.templates?.items ?? {}).length,
      Object.keys(scheme.organisms?.items ?? {}).length,
      Object.keys(scheme.molecules?.items ?? {}).length,
      Object.keys(scheme.atoms?.items ?? {}).length,
    );
    return scheme;
  } catch (err: unknown) {
    if (typeof err === 'object' && err !== null && 'code' in err && (err as { code?: string }).code !== 'ENOENT') {
      debugContext('Error loading scheme: %O', err);
      throw err;
    }
    debugContext('Scheme file not found');
    return undefined;
  }
}

async function getGraphqlOperations(projectDir: string, files: string[]): Promise<Record<string, string>> {
  const graphqlFiles = files.filter((f) => f.startsWith('src/graphql/') && f.endsWith('.ts'));
  debugContext('Found %d GraphQL files', graphqlFiles.length);
  const operations: Record<string, string> = {};
  for (const filePath of graphqlFiles) {
    try {
      debugContext('Reading GraphQL file: %s', filePath);
      const content = await fs.readFile(path.join(projectDir, filePath), 'utf-8');
      const operationName = path.basename(filePath, '.ts');
      operations[operationName] = content;
      debugContext('Loaded GraphQL operations from %s', operationName);
    } catch (error) {
      debugContext('Error reading GraphQL operations file %s: %O', filePath, error);
      console.error(`Error reading GraphQL operations file ${filePath}:`, error);
    }
  }
  debugContext('Total GraphQL operations loaded: %d', Object.keys(operations).length);
  return operations;
}

async function getKeyFileContents(projectDir: string, files: string[]): Promise<Record<string, string>> {
  const keyFiles = files.filter((f) => ['src/index.css', 'src/globals.css'].includes(f));
  debugContext('Getting key file contents for %d files', keyFiles.length);
  const contents: Record<string, string> = {};
  for (const file of keyFiles) {
    try {
      debugContext('Reading key file: %s', file);
      contents[file] = await fs.readFile(path.join(projectDir, file), 'utf-8');
      debugContext('Key file %s loaded, size: %d bytes', file, contents[file].length);
    } catch (error) {
      debugContext('Could not read key file %s: %O', file, error);
    }
  }
  debugContext('Loaded %d key files', Object.keys(contents).length);
  return contents;
}

function getFileTreeSummary(
  files: string[],
  atoms: { name: string; props: { name: string; type: string }[] }[],
  scheme: Scheme | undefined,
): string[] {
  const templateNames = Object.keys(scheme?.templates?.items ?? {});
  return [
    ...files.filter(
      (f) =>
        f.startsWith('src/pages/') ||
        f.startsWith('src/hooks/') ||
        f.startsWith('src/components/templates') ||
        f.startsWith('src/lib/') ||
        ['src/App.tsx', 'src/routes.tsx', 'src/main.tsx'].includes(f),
    ),
    `src/components/atoms/ (atoms: ${atoms.map((a) => a.name).join(', ')})`,
    templateNames.length > 0 ? `src/components/templates/ (templates: ${templateNames.join(', ')})` : '',
  ].filter(Boolean);
}

export interface ChildComponent {
  name: string;
  type: 'atoms' | 'molecules' | 'organisms' | 'templates';
}

const childTypeDirs: Record<string, string> = {
  atoms: 'src/components/atoms/',
  molecules: 'src/components/molecules/',
  organisms: 'src/components/organisms/',
  templates: 'src/components/templates/',
};

export function getChildrenFromScheme(filePath: string, scheme: Scheme | undefined): ChildComponent[] {
  if (!scheme) return [];

  const fileName = path.basename(filePath, '.tsx');

  if (filePath.includes('src/components/molecules/')) {
    const item = scheme.molecules?.items?.[fileName] as { composition?: { atoms?: string[] } } | undefined;
    if (item?.composition?.atoms) {
      return item.composition.atoms.map((name) => ({ name, type: 'atoms' as const }));
    }
  }

  if (filePath.includes('src/components/organisms/')) {
    const item = scheme.organisms?.items?.[fileName] as { composition?: { molecules?: string[] } } | undefined;
    if (item?.composition?.molecules) {
      return item.composition.molecules.map((name) => ({ name, type: 'molecules' as const }));
    }
  }

  if (filePath.includes('src/components/templates/')) {
    const item = scheme.templates?.items?.[fileName];
    if (item?.layout?.organisms) {
      return item.layout.organisms.map((name) => ({ name, type: 'organisms' as const }));
    }
  }

  if (filePath.includes('src/pages/')) {
    const item = scheme.pages?.items?.[fileName];
    if (item?.template) {
      return [{ name: item.template, type: 'templates' as const }];
    }
  }

  return [];
}

export async function readChildrenSources(children: ChildComponent[], projectDir: string): Promise<string> {
  const sources: string[] = [];

  for (const child of children) {
    const dir = childTypeDirs[child.type];
    if (!dir) continue;

    const filePath = path.join(projectDir, dir, `${child.name}.tsx`);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      sources.push(`--- ${dir}${child.name}.tsx ---\n${content}`);
      debugComponents('Read child component source: %s%s.tsx', dir, child.name);
    } catch {
      try {
        const dirPath = path.join(projectDir, dir);
        const dirFiles = await fs.readdir(dirPath);
        const match = dirFiles.find(
          (f) => f.endsWith('.tsx') && f.replace(/\.tsx$/, '').toLowerCase() === child.name.toLowerCase(),
        );
        if (match) {
          const content = await fs.readFile(path.join(dirPath, match), 'utf-8');
          sources.push(`--- ${dir}${match} ---\n${content}`);
          debugComponents('Read child component source (case-insensitive match): %s%s', dir, match);
        } else {
          debugComponents('Child component file not found: %s%s.tsx', dir, child.name);
        }
      } catch {
        debugComponents('Could not read directory for child component: %s', dir);
      }
    }
  }

  return sources.join('\n\n');
}

async function getTheme(designSystem: string): Promise<string> {
  debugContext('Extracting theme from design system, content length: %d', designSystem.length);
  try {
    const themeMatch = designSystem.match(/## Theme\s*\n([\s\S]*?)(?=\n## |\n# |\n*$)/);
    if (themeMatch?.[1]) {
      const theme = themeMatch[1].trim();
      debugContext('Theme extracted, length: %d', theme.length);
      return theme;
    }
    debugContext('No theme section found in design system');
    return '';
  } catch (error) {
    debugContext('Error extracting theme: %O', error);
    console.error(`Error reading design-system.md:`, error);
    return '';
  }
}

async function getProjectContext(
  projectDir: string,
  iaSchemeDir: string,
  userPreferences: string,
  designSystem: string,
  failures: string[],
): Promise<ProjectContext> {
  debugContext('Building project context for: %s', projectDir);
  debugContext('IA scheme directory: %s', iaSchemeDir);
  debugContext('User preferences length: %d', userPreferences.length);
  debugContext('Design system length: %d', designSystem.length);
  debugContext('Failures: %d', failures.length);

  const files = await listFiles(projectDir);
  debugContext('Found %d files in project', files.length);

  const [scheme, atoms, graphqlOperations, keyFileContents, theme] = await Promise.all([
    loadScheme(iaSchemeDir),
    getAtomsWithProps(projectDir),
    getGraphqlOperations(projectDir, files),
    getKeyFileContents(projectDir, files),
    getTheme(designSystem),
  ]);

  const fileTreeSummary = getFileTreeSummary(files, atoms, scheme);
  debugContext('File tree summary created with %d entries', fileTreeSummary.length);

  debugContext('Project context built successfully');
  return {
    scheme,
    files,
    atoms,
    keyFileContents,
    fileTreeSummary,
    graphqlOperations,
    userPreferences,
    theme,
    failures,
  };
}

async function listFiles(dir: string, base = dir): Promise<string[]> {
  debugFiles('Listing files in: %s', dir);
  const entries = await fs.readdir(dir, { withFileTypes: true });
  debugFiles('Found %d entries in directory', entries.length);

  const files = await Promise.all(
    entries.map(async (entry) => {
      if (entry.name === 'node_modules') {
        debugFiles('Skipping node_modules');
        return [];
      }

      const res = path.resolve(dir, entry.name);

      if (entry.isDirectory()) {
        debugFiles('Entering directory: %s', entry.name);
        return listFiles(res, base);
      } else {
        return [path.relative(base, res)];
      }
    }),
  );

  const flatFiles = files.flat();
  debugFiles('Total files found: %d', flatFiles.length);
  return flatFiles;
}

async function makeBasePrompt(ctx: ProjectContext): Promise<string> {
  const keyFileContents = Object.entries(ctx.keyFileContents)
    .map(([f, c]) => `--- ${f} ---\n${c}\n`)
    .join('\n');

  const graphqlDescriptions = Object.entries(ctx.graphqlOperations)
    .map(([f, c]) => `--- ${f} ---\n${c}\n`)
    .join('\n');

  const htmlElementsReference = await getHtmlElementsReference();

  return `
<ROLE>
You are Auto, a senior Frontend Engineer and Design Systems specialist. You build production-grade React applications that exhibit visual excellence, semantic correctness, and engineering rigor.
</ROLE>

<TASK>
Transform the Information Architecture (IA) schema into a complete, production-ready React application. Your implementation must be visually polished, semantically correct, and internally consistent.
</TASK>

<GOALS>
- Visual Excellence: Create interfaces that are aesthetically refined, with clear hierarchy, purposeful spacing, and meaningful motion.
- Semantic Correctness: Use HTML elements for their intended purpose. Structure conveys meaning.
- Engineering Rigor: No placeholders, no stubs, no undefined references, no dead code paths.
</GOALS>

<ATOMIC_DESIGN_METHODOLOGY>
You are implementing components following Atomic Design principles. Each level has a single responsibility:

**Atoms** are the foundational building blocks—basic UI elements that cannot be reduced further without losing function. They are context-agnostic and highly reusable. Examples: buttons, inputs, labels, icons.

**Molecules** are simple groups of atoms bonded together as a functional unit. Each molecule does one thing and does it well (Single Responsibility Principle). Examples: a search field (label + input + button), a form field (label + input + error message).

**Organisms** are relatively complex components composed of molecules and/or atoms, forming distinct interface sections. They have awareness of their data requirements and may fetch data. Examples: a header (logo + nav + search), a card grid, a data table with pagination.

**Templates** are page-level layout structures that define the skeletal framework—where organisms are placed spatially (header region, sidebar region, main content region, footer region). Templates have no real data; they establish structure and responsive behavior.

**Pages** are specific instances of templates populated with real content. Pages handle routing, data fetching, and state management. They pass data down to templates and organisms.

**Composition Rules:**
- Components at each level compose only from the levels below them
- Atoms are provided; reuse them before creating new ones
- Each component should have a clear, single purpose
- Props flow down; callbacks flow up
- When implementing a component, you will receive the source code of its children—use their actual exports and prop interfaces
</ATOMIC_DESIGN_METHODOLOGY>

<PROJECT_CONSTRAINTS>
**Icons:** Use lucide-react exclusively.
**Animation:** Use framer-motion. Respect prefers-reduced-motion.
**Data:** Use Apollo Client hooks with only the GraphQL documents in src/graphql/queries.ts and src/graphql/mutations.ts. Do not add, modify, or remove GraphQL documents—adapt the UI to the available data shape.
**Typing:** All components must be fully typed with explicit Props interfaces (<ComponentName>Props).
**Exports:** Named exports only. No default exports.
**Comments:** When updating an existing component, treat any comments in the code as specifications—follow them faithfully. Then strip ALL comments from your output. No inline comments, block comments, JSDoc, or TODO annotations. Code must be self-documenting through clear naming and structure.
</PROJECT_CONSTRAINTS>

<VISUAL_PRINCIPLES>
**Hierarchy:** Establish clear visual hierarchy through typography scale, weight contrast, and color intensity. Every screen needs a focal point.
**Spacing:** Use consistent spacing rhythm. Proximity groups related elements; whitespace separates distinct sections.
**Feedback:** Every interactive element must provide visual feedback—hover, focus, active, disabled states.
**Motion:** Animation should be purposeful, guiding attention and providing continuity. Entrances, exits, and state changes should feel natural.
**Accessibility:** Keyboard navigable, focus visible, ARIA labels where needed, sufficient color contrast.
</VISUAL_PRINCIPLES>

<INTEGRITY_CONTRACT>
- **No Partial Files:** Every file must be complete and functional—no TODOs, placeholders, or stubs.
- **No Undefined References:** Do not reference any component, hook, utility, or route that doesn't exist or isn't created in the same plan.
- **Route Reachability:** Every route must be navigable from at least one UI element. Remove unreachable routes.
- **Dependency Order:** Create files in dependency order: atoms → molecules → organisms → templates → pages → routing.
</INTEGRITY_CONTRACT>

${htmlElementsReference}

<OUTPUT_FORMAT>
Respond ONLY with a JSON array. No prose. No markdown fences. Each item:
- "action": "create" | "update"
- "file": relative path from project root
- "description": concise rationale for the change
</OUTPUT_FORMAT>

<PROJECT_CONTEXT>
Project Structure:
${JSON.stringify(ctx.fileTreeSummary, null, 2)}

Available Atoms (with their props):
${JSON.stringify(ctx.atoms, null, 2)}

Templates (from IA Schema):
${JSON.stringify(ctx.scheme?.templates?.items ?? {}, null, 2)}

Key Files:
${keyFileContents}

IA Schema:
${JSON.stringify(ctx.scheme, null, 2)}

GraphQL Operations:
${graphqlDescriptions}
</PROJECT_CONTEXT>
`;
}

interface Change {
  action: 'create' | 'update';
  file: string;
  description: string;
}

async function planProject(ctx: ProjectContext): Promise<Change[]> {
  debugPlan('Starting project planning');
  const prompt = await makeBasePrompt(ctx);
  debugPlan('Generated prompt with length: %d', prompt.length);

  const planText = await callAI(prompt);
  debugPlan('Received plan response, length: %d', planText.length);

  try {
    const changes = JSON.parse(extractJsonArray(planText)) as Change[];
    debugPlan('Successfully parsed plan with %d changes', changes.length);
    changes.forEach((change, idx) => {
      debugPlan('Change %d: %s %s - %s', idx + 1, change.action, change.file, change.description);
    });
    return changes;
  } catch (error) {
    debugPlan('Failed to parse plan: %O', error);
    console.error('Could not parse plan from LLM:', planText);
    return [];
  }
}

async function applyPlan(plan: Change[], ctx: ProjectContext, projectDir: string) {
  debugPlan('Applying plan with %d changes', plan.length);
  const basePrompt = await makeBasePrompt(ctx);

  for (const [index, change] of plan.entries()) {
    debugPlan('Applying change %d/%d: %s %s', index + 1, plan.length, change.action, change.file);

    let fileContent = '';
    if (change.action === 'update') {
      try {
        fileContent = await fs.readFile(path.join(projectDir, change.file), 'utf-8');
        debugPlan('Read existing file %s, size: %d bytes', change.file, fileContent.length);
      } catch {
        debugPlan('File %s does not exist, will create', change.file);
      }
    }

    const children = getChildrenFromScheme(change.file, ctx.scheme);
    let childrenSourcesText = '';
    if (children.length > 0) {
      debugPlan('Found %d children for %s: %s', children.length, change.file, children.map((c) => c.name).join(', '));
      childrenSourcesText = await readChildrenSources(children, projectDir);
    }

    const codePrompt = `${basePrompt}\nHere is the planned change:\n${JSON.stringify(change, null, 2)}\n${
      change.action === 'update' ? `Here is the current content of ${change.file}:\n${fileContent}\n` : ''
    }${childrenSourcesText ? `Here are the source files of the children components this component composes. Use their actual props, structure, and exports to correctly integrate them:\n${childrenSourcesText}\n\n` : ''}Please output ONLY the full new code for the file (no markdown, no triple backticks, just code, ready to write to disk).`;
    const code = await callAI(codePrompt);
    debugPlan('Generated code for %s, size: %d bytes', change.file, code.length);

    const outPath = path.join(projectDir, change.file);
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await fs.writeFile(outPath, code, 'utf-8');

    debugPlan('Successfully wrote file: %s', outPath);
    console.log(`${change.action === 'update' ? 'Updated' : 'Created'} ${change.file}`);
  }

  debugPlan('Plan application complete');
}

// interface Fix {
//   action: 'update';
//   file: string;
//   description: string;
//   content: string;
// }

// Removed fixTsErrors function - checks now handled by check:client command
/*
async function fixTsErrors(ctx: ProjectContext, projectDir: string): Promise<boolean> {
  debugErrors('Checking for TypeScript errors in: %s', projectDir);
  const tsErrors = await getTsErrors(projectDir);
  debugErrors('Found %d TypeScript errors', tsErrors.length);
  console.log('Found', tsErrors.length, 'TypeScript errors');

  if (tsErrors.length === 0) {
    debugErrors('No TypeScript errors to fix');
    return false;
  }

  debugErrors('TypeScript errors found:');
  tsErrors.forEach((error, idx) => {
    debugErrors('  Error %d: %s', idx + 1, error);
  });

  const errorFeedback = tsErrors.join('\n');
  const fixupPrompt = `${makeBasePrompt(ctx)}\n
After your previous changes, the application produced the following TypeScript errors:\n\n${errorFeedback}\n
You must now fix **every** error listed above. This is a critical pass: if any error remains after your fix, your output is rejected.

Before generating code, analyze and validate your solution against every error. Use existing type definitions, component props, GraphQL typings, and shared interfaces from the project. Do not invent new types or structures unless absolutely necessary.

Strict rules:
- Never use \`any\`, \`as any\`, or unsafe type assertions
- Do not silence errors — resolve them fully and correctly
- Fix all errors in each file in one go
- Reuse existing logic or types instead of re-creating similar ones
- Do not modify the GraphQL files
- Do not submit partial updates; provide the full updated content of the file

Output must be a **JSON array** only. Each item must include:
- \`action\`: "update"
- \`file\`: relative path to the updated file
- \`description\`: "Fix TypeScript errors"
- \`content\`: full new content of the file, as a string

Do not include explanations, markdown, or code blocks.
`;
  const fixupPlanText = await callAI(fixupPrompt);
  let fixupPlan: Fix[] = [];
  try {
    fixupPlan = JSON.parse(extractJsonArray(fixupPlanText)) as Fix[];
    debugFixes('Parsed TypeScript fixup plan with %d fixes', fixupPlan.length);
  } catch (e) {
    debugFixes('Failed to parse TypeScript fixup plan: %O', e);
    console.error('Could not parse TS fixup plan from LLM:', e instanceof Error ? e.message : String(e));
  }

  console.log('Fixup plan has', fixupPlan.length, 'items');

  for (const [index, fix] of fixupPlan.entries()) {
    debugFixes('Applying fix %d/%d: %s', index + 1, fixupPlan.length, fix.file);
    if (fix.action === 'update' && fix.file && fix.content) {
      const outPath = path.join(projectDir, fix.file);
      await fs.mkdir(path.dirname(outPath), { recursive: true });
      await fs.writeFile(outPath, fix.content, 'utf-8');
      debugFixes('Successfully fixed TypeScript errors in %s', fix.file);
      console.log(`Fixed TS errors in ${fix.file}`);
    }
  }

  debugFixes('TypeScript error fixing complete');
  return true;
}
*/

// Removed fixBuildErrors function - checks now handled by check:client command
/*
async function fixBuildErrors(ctx: ProjectContext, projectDir: string): Promise<boolean> {
  debugErrors('Checking for build errors in: %s', projectDir);
  const buildErrors = await getBuildErrors(projectDir);
  debugErrors('Found %d build errors', buildErrors.length);
  console.log('Found', buildErrors.length, 'build errors');

  if (buildErrors.length === 0) {
    debugErrors('No build errors to fix');
    return false;
  }

  debugErrors('Build errors found:');
  buildErrors.forEach((error, idx) => {
    debugErrors('  Error %d: %s', idx + 1, error);
  });

  const errorFeedback = buildErrors.join('\n');
  const fixupPrompt = `${makeBasePrompt(ctx)}\n
After your previous changes, the application produced the following build errors:\n\n${errorFeedback}\n
You must now fix **every** error listed above. This is a critical pass: if any error remains after your fix, your output is rejected.

Before generating code, analyze and validate your solution against every error. Use existing component props, imports, and shared interfaces from the project. Do not invent new structures unless absolutely necessary.

Strict rules:
- Never use unsafe imports or invalid module references
- Do not silence errors — resolve them fully and correctly
- Fix all errors in each file in one go
- Reuse existing logic instead of re-creating similar ones
- Do not modify the GraphQL files
- Do not submit partial updates; provide the full updated content of the file

Output must be a **JSON array** only. Each item must include:
- \`action\`: "update"
- \`file\`: relative path to the updated file
- \`description\`: "Fix build errors"
- \`content\`: full new content of the file, as a string

Do not include explanations, markdown, or code blocks.
`;
  const fixupPlanText = await callAI(fixupPrompt);
  let fixupPlan: Fix[] = [];
  try {
    fixupPlan = JSON.parse(extractJsonArray(fixupPlanText)) as Fix[];
    debugFixes('Parsed build fixup plan with %d fixes', fixupPlan.length);
  } catch (e) {
    debugFixes('Failed to parse build fixup plan: %O', e);
    console.error('Could not parse build fixup plan from LLM:', e instanceof Error ? e.message : String(e));
  }

  console.log('Fixup plan has', fixupPlan.length, 'items');

  for (const [index, fix] of fixupPlan.entries()) {
    debugFixes('Applying fix %d/%d: %s', index + 1, fixupPlan.length, fix.file);
    if (fix.action === 'update' && fix.file && fix.content) {
      const outPath = path.join(projectDir, fix.file);
      await fs.mkdir(path.dirname(outPath), { recursive: true });
      await fs.writeFile(outPath, fix.content, 'utf-8');
      debugFixes('Successfully fixed build errors in %s', fix.file);
      console.log(`Fixed build errors in ${fix.file}`);
    }
  }

  debugFixes('Build error fixing complete');
  return true;
}
*/

// Helper to extract all page routes from the IA scheme - kept for potential future use
// Currently not used as error checking has been removed
/*
function extractPageRoutesFromScheme(scheme: Scheme | undefined): string[] {
  debugContext('Extracting page routes from scheme');
  if (scheme?.pages?.items && typeof scheme.pages.items === 'object') {
    const routes = Object.values(scheme.pages.items)
      .map((page) =>
        typeof page === 'object' && 'route' in page && typeof page.route === 'string' ? page.route : undefined,
      )
      .filter((route): route is string => typeof route === 'string');
    debugContext('Extracted %d routes: %o', routes.length, routes);
    return routes;
  }
  debugContext('No page routes found in scheme');
  return [];
}
*/

// Removed checkRouteErrors function - checks now handled by check:client command
/*
async function checkRouteErrors(baseUrl: string, routes: string[]): Promise<string[]> {
  const allConsoleErrors: string[] = [];
  // Function removed - checks handled by check:client command
  return allConsoleErrors;
}
*/

// Removed applyFixes function - checks now handled by check:client command
/*
async function applyFixes(fixupPlan: any[], projectDir: string): Promise<void> {
  // Function removed - checks handled by check:client command
}
*/

// Removed fixConsoleErrors function - checks now handled by check:client command
/*
async function fixConsoleErrors(ctx: ProjectContext, projectDir: string): Promise<boolean> {
  // Function removed - checks handled by check:client command
  return false;
}
*/

// Visual error reporting removed - can be handled separately if needed
/*
async function checkVisualErrors(baseUrl: string, routes: string[], theme: string): Promise<string> {
  debugScreenshots('Checking visual errors for %d routes', routes.length);
  const screenshots = await getPageScreenshots(baseUrl, routes);
  debugScreenshots('Got %d screenshots', screenshots.length);

  let allVisualErrors: string = '';
  for (const [index, screenshot] of screenshots.entries()) {
    debugScreenshots('Analyzing screenshot %d/%d for route: %s', index + 1, screenshots.length, screenshot.route);
    console.log(`Checking visual errors for ${screenshot.route}`);
    const error = await generateTextWithImageAI(
      `
      This is the theme used: ${theme}. 
      When analyzing UI screenshots, only flag high-impact visual issues that significantly affect usability, accessibility, or user comprehension. Ignore minor spacing inconsistencies, slight misalignments, and non-critical aesthetic variations unless they create a clear functional or accessibility problem. Focus feedback on elements that:
      - Do not flag color or style choices that match the theme.
      - Do not critique placeholder contrast, alignment, or heading hierarchy unless the text is truly unreadable or confusing.
      - Ignore small alignment shifts, whitespace distribution, and center-aligned titles.
      - Only highlight contrast issues if they fail WCAG standards or make text functionally unreadable.
      - Do not mention the lack of loading indicators unless it causes a clear usability failure (e.g., users stuck or misled).
      - Focus only on issues that break flow, block interaction, or seriously reduce clarity.
      - Allow intentionally unique design elements like center-aligned titles.
      - Do not report white space as an issue when the layout is intentionally minimal.
      - Skip pixel-perfect feedback unless there’s a clear visual or structural flaw.
      - Focus on readability, navigability, accessibility, and broken UI flows.

      
      IMPORTANT: return in a nicely formatted markdown, easy to read for the user, not as array of markdown, pure markdown content! Include the route: ${screenshot.route} name, because I have multiple errors showing, and add an empty line at the end.
      IMPORTANT: don't overly nest the markdown sections, just one # Visual Report, below it the name of the route: ## Route: _route_name_, and ### _types_of_issues_ per route (can have multiple under same route) and bullet list after that
      IMPORTANT: return something only if you found valid errors, I don't want to show only the route name from the above request.
      `,
      screenshot.screenshot,
      undefined,
    );
    if (error) {
      debugScreenshots('Visual errors found on route %s', screenshot.route);
      allVisualErrors += error;
    } else {
      debugScreenshots('No visual errors on route %s', screenshot.route);
    }
  }

  debugScreenshots('Visual error check complete, total errors length: %d', allVisualErrors.length);
  return allVisualErrors;
}

async function getPageScreenshots(baseUrl: string, routes: string[]): Promise<{ route: string; screenshot: string }[]> {
  debugScreenshots('Taking screenshots for %d routes', routes.length);
  const pageScreenshots: { route: string; screenshot: string }[] = [];

  for (const [index, route] of routes.entries()) {
    const url = baseUrl + (route.startsWith('/') ? route : '/' + route);
    debugScreenshots('Taking screenshot %d/%d for: %s', index + 1, routes.length, url);
    console.log(`Taking screenshot for ${url}`);

    const screenshot = await getPageScreenshot(url);
    if (screenshot) {
      debugScreenshots('Screenshot captured for %s, size: %d bytes', route, screenshot.length);
      pageScreenshots.push({
        route: route,
        screenshot: screenshot,
      });
    } else {
      debugScreenshots('Failed to capture screenshot for %s', route);
    }
  }

  debugScreenshots('Closing browser after screenshots');
  await closeBrowser();
  debugScreenshots('Captured %d screenshots', pageScreenshots.length);
  return pageScreenshots;
}
*/

// Visual error reporting removed - can be handled separately if needed
/*
async function reportVisualErrors(ctx: ProjectContext): Promise<void> {
  debugScreenshots('Starting visual error report');
  const baseUrl = 'http://localhost:8080';

  let routes = extractPageRoutesFromScheme(ctx.scheme);
  if (routes.length === 0) {
    debugScreenshots('No routes found, defaulting to root');
    routes = ['/'];
  }
  debugScreenshots('Reporting visual errors for %d routes', routes.length);

  const allVisualErrors = await checkVisualErrors(baseUrl, routes, ctx.theme);

  if (allVisualErrors) {
    debugScreenshots('Visual errors report generated, length: %d', allVisualErrors.length);
  } else {
    debugScreenshots('No visual errors to report');
  }

  console.log(allVisualErrors);
}
*/

// async function fixVisualErrors(ctx: ProjectContext, projectDir: string): Promise<boolean> {
//   const baseUrl = 'http://localhost:8080';
//   let routes = extractPageRoutesFromScheme(ctx.scheme);
//   if (routes.length === 0) {
//     routes = ['/'];
//   }
//
//   const allVisualErrors = await checkVisualErrors(baseUrl, routes, ctx.theme);
//   console.log('Found', allVisualErrors, 'visual errors');
//   if (allVisualErrors.length === 0) {
//     await closeBrowser();
//     return false;
//   }
//
//   const fixupPrompt = `${makeBasePrompt(ctx)}\n
// After your previous changes, the application has the following visual errors:\n\n${allVisualErrors}\n
// You must now fix **every** error listed above. This is a critical pass: if any error remains after your fix, your output is rejected.
//
// Before generating code, analyze and validate your solution against every error. Use existing types, props, and logic from the project. Do not invent new structures unless absolutely necessary.
//
// Strict rules:
// - Ignore connection or network errors
// - Never use \`any\`, unsafe type assertions, or silence errors
// - Do not silence errors — resolve them fully and correctly
// - Fix all errors in each file in one go
// - Reuse existing logic or types instead of re-creating similar ones
// - Do not submit partial updates; provide the full updated content of the file
//
// Output must be a **JSON array** only. Each item must include:
// - \`action\`: "update"
// - \`file\`: relative path to the updated file
// - \`description\`: "Fix console errors"
// - \`content\`: full new content of the file, as a string
//
// Do not include explanations, markdown, or code blocks.
// `;
//   let fixupPlan: Fix[] = [];
//   try {
//     fixupPlan = JSON.parse(extractJsonArray(await callAI(fixupPrompt))) as Fix[];
//   } catch (e) {
//     console.error('Could not parse visual fixup plan from LLM:', e instanceof Error ? e.message : String(e));
//   }
//
//   console.log('Fixup plan has', fixupPlan.length, 'items');
//   await applyFixes(fixupPlan, projectDir);
//   await closeBrowser();
//   return true;
// }

// Removed fixErrorsLoop function - checks now handled by check:client command
/*
async function fixErrorsLoop(ctx: ProjectContext, projectDir: string) {
  // Function removed - checks handled by check:client command
}
*/

export async function runAIAgent(
  projectDir: string,
  iaSchemeDir: string,
  designSystemPath: string,
  failures: string[],
) {
  debug('='.repeat(80));
  debug('Starting FE implementer agent');
  debug('Project directory: %s', projectDir);
  debug('IA scheme directory: %s', iaSchemeDir);
  debug('Design system path: %s', designSystemPath);
  debug('='.repeat(80));

  const userPreferencesFile = path.resolve(projectDir, 'design-system-principles.md');
  debug('Loading user preferences from: %s', userPreferencesFile);
  const userPreferences = await fs.readFile(userPreferencesFile, 'utf-8');
  debug('User preferences loaded, size: %d bytes', userPreferences.length);

  debug('Loading design system from: %s', designSystemPath);
  const designSystem = await fs.readFile(designSystemPath, 'utf-8');
  debug('Design system loaded, size: %d bytes', designSystem.length);

  debug('Building project context...');
  const ctx = await getProjectContext(projectDir, iaSchemeDir, userPreferences, designSystem, failures);
  debug('Project context created successfully');

  debug('Planning project implementation...');
  const plan = await planProject(ctx);
  debugPlan('Generated plan with %d items', plan.length);

  debug('Applying implementation plan...');
  await applyPlan(plan, ctx, projectDir);
  debug('Plan applied successfully');

  // Error checking removed - now handled by separate check:client command
  debug('Skipping error correction phase - use check:client command for validation');

  // Visual error reporting removed - can be handled separately if needed
  debug('Skipping visual error report - use separate visual testing tools if needed');

  // Browser cleanup no longer needed as we don't run checks
  debug('Implementation complete - no browser cleanup needed');

  debug('='.repeat(80));
  console.log('AI project implementation complete!');
  debug('AI agent completed successfully');
  debug('='.repeat(80));
}
