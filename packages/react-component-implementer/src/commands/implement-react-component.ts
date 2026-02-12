import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { createAnthropic } from '@ai-sdk/anthropic';
import { type Command, defineCommandHandler, type Event } from '@auto-engineer/message-bus';
import type { LanguageModel } from 'ai';
import createDebug from 'debug';
import type { Browser } from 'playwright';
import { chromium } from 'playwright';
import type { GenerationContext, ValidationFeedback } from '../component-generator.js';
import { componentName, createComponentGenerator } from '../component-generator.js';
import { writeComponent, writeStory } from '../component-writer.js';
import { scanFileTree } from '../file-tree.js';
import type { FunctionalResult } from '../functional-validator.js';
import { validateFunctional } from '../functional-validator.js';
import { connectMcpClient } from '../mcp-client.js';
import type { TypeCheckResult } from '../type-checker.js';
import { checkTypes } from '../type-checker.js';
import type { ComponentTask, Job } from '../types.js';
import type { DesignReference, VisualFeedback } from '../visual-evaluator.js';
import { evaluateVisual } from '../visual-evaluator.js';

const debug = createDebug('auto:react-component-implementer:command');

const PORT = 6006;
const MAX_ITERATIONS = 3;

interface IterationLoopParams {
  task: ComponentTask;
  targetDir: string;
  outputDir: string;
  generator: ReturnType<typeof createComponentGenerator>;
  context: GenerationContext;
  mcpClient: Awaited<ReturnType<typeof connectMcpClient>>;
  browser: Browser;
  model: LanguageModel;
  designReference: DesignReference;
  initialCode: Awaited<ReturnType<ReturnType<typeof createComponentGenerator>['generate']>>;
}

interface IterationResult {
  success: boolean;
  componentPath: string;
  storyPath: string;
  iterations: number;
  lastFeedback?: ValidationFeedback;
}

async function runValidationLoop(params: IterationLoopParams): Promise<IterationResult> {
  const { task, targetDir, outputDir, generator, context, mcpClient, browser, model, designReference, initialCode } =
    params;
  const name = componentName(task.componentId);

  let { code, history } = initialCode;
  let componentPath = await writeComponent(name, code.componentCode, outputDir);
  let storyPath = await writeStory(name, code.storyCode, outputDir);
  let lastFeedback: ValidationFeedback | undefined;

  for (let iteration = 1; iteration <= MAX_ITERATIONS; iteration++) {
    console.log(`  Iteration ${iteration}/${MAX_ITERATIONS} for ${name}`);

    const typeResult = checkTypes([componentPath, storyPath], targetDir);

    if (!typeResult.passed) {
      console.log('    Type errors found, skipping functional/visual validation');
      lastFeedback = collectFeedback(typeResult, [], []);
      console.log(`  Errors: ${summarizeFeedback(lastFeedback)}`);
      if (iteration < MAX_ITERATIONS) {
        console.log(`  Refining ${name}...`);
        const refined = await generator.refine(lastFeedback, context, history);
        code = refined.code;
        history = refined.history;
        componentPath = await writeComponent(name, code.componentCode, outputDir);
        storyPath = await writeStory(name, code.storyCode, outputDir);
      }
      continue;
    }

    const storyExports = extractStoryExports(code.storyCode);
    if (storyExports.length === 0) {
      console.log(`  Warning: no named exports found in story for ${name}, skipping validation`);
      return { success: true, componentPath, storyPath, iterations: iteration };
    }

    const storyUrls = await waitForStoryUrls(mcpClient, storyExports, storyPath);

    const storyResults: Array<{ functionalResult: FunctionalResult; visualResult: VisualFeedback }> = [];
    console.log(storyUrls);
    for (const { exportName, url } of storyUrls) {
      console.log(`    Validating story ${exportName}...`);
      const [functionalResult, visualResult] = await Promise.all([
        validateFunctional(url, browser),
        evaluateVisual(url, { name, description: task.description }, browser, model, designReference),
      ]);
      storyResults.push({ functionalResult, visualResult });
    }

    const functionalResults = storyResults.map((r) => r.functionalResult);
    const visualResults = storyResults.map((r) => r.visualResult);

    if (isPassing(typeResult, functionalResults, visualResults)) {
      console.log(`  ${name} passed all validations on iteration ${iteration}`);
      return { success: true, componentPath, storyPath, iterations: iteration };
    }

    lastFeedback = collectFeedback(typeResult, functionalResults, visualResults);
    console.log(`  Errors: ${summarizeFeedback(lastFeedback)}`);

    if (iteration < MAX_ITERATIONS) {
      console.log(`  Refining ${name}...`);
      const refined = await generator.refine(lastFeedback, context, history);
      code = refined.code;
      history = refined.history;
      componentPath = await writeComponent(name, code.componentCode, outputDir);
      storyPath = await writeStory(name, code.storyCode, outputDir);
    }
  }

  console.log(`  ${name} failed after ${MAX_ITERATIONS} iterations`);
  return { success: false, componentPath, storyPath, iterations: MAX_ITERATIONS, lastFeedback };
}

async function checkStorybookRunning(): Promise<void> {
  try {
    const response = await fetch(`http://localhost:${PORT}`);
    if (!response.ok) {
      throw new Error('Storybook responded with non-OK status');
    }
  } catch {
    throw new Error(
      `Storybook is not running on port ${PORT}. Start it with \`pnpm storybook\` in the client directory before running this command.`,
    );
  }
}

export type ImplementReactComponentCommand = Command<
  'ImplementReactComponent',
  {
    targetDir: string;
    job: Job;
  }
>;

export type ReactComponentImplementedEvent = Event<
  'ReactComponentImplemented',
  {
    name: string;
    componentPath: string;
    storyPath: string;
    iterations: number;
  }
>;

export type ReactComponentImplementationFailedEvent = Event<
  'ReactComponentImplementationFailed',
  {
    error: string;
    name: string;
  }
>;

export type ImplementReactComponentEvents = ReactComponentImplementedEvent | ReactComponentImplementationFailedEvent;

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function collectFeedback(
  typeResult: TypeCheckResult,
  functionalResults: FunctionalResult[],
  visualResults: VisualFeedback[],
): ValidationFeedback {
  return {
    typeErrors: typeResult.errors,
    interactionErrors: functionalResults.flatMap((r) => r.interactionErrors),
    consoleErrors: functionalResults.flatMap((r) => r.consoleErrors),
    consoleWarnings: functionalResults.flatMap((r) => r.consoleWarnings),
    visualFeedback:
      visualResults
        .filter((r) => !r.passed)
        .map((r) => r.feedback)
        .join('\n') || undefined,
  };
}

function summarizeFeedback(feedback: ValidationFeedback): string {
  const parts: string[] = [];
  const typeErrors = feedback.typeErrors ?? [];
  const interactionErrors = feedback.interactionErrors ?? [];
  const consoleErrors = feedback.consoleErrors ?? [];
  const consoleWarnings = feedback.consoleWarnings ?? [];

  if (typeErrors.length > 0) {
    parts.push(`${typeErrors.length} type error(s): ${typeErrors[0]}`);
  }
  if (interactionErrors.length > 0) {
    parts.push(`${interactionErrors.length} interaction error(s): ${interactionErrors[0]}`);
  }
  if (consoleErrors.length > 0) {
    parts.push(`${consoleErrors.length} console error(s): ${consoleErrors[0]}`);
  }
  if (consoleWarnings.length > 0) {
    parts.push(`${consoleWarnings.length} console warning(s): ${consoleWarnings[0]}`);
  }
  if (feedback.visualFeedback) {
    parts.push(`visual: ${feedback.visualFeedback.split('\n')[0]}`);
  }
  return parts.join('; ');
}

function isPassing(
  typeResult: TypeCheckResult,
  functionalResults: FunctionalResult[],
  visualResults: VisualFeedback[],
): boolean {
  return typeResult.passed && functionalResults.every((r) => r.passed) && visualResults.every((r) => r.passed);
}

function extractStoryExports(storyCode: string): string[] {
  const results: string[] = [];
  const regex = /export\s+const\s+(\w+)/g;
  let match = regex.exec(storyCode);
  while (match) {
    results.push(match[1]);
    match = regex.exec(storyCode);
  }
  return results;
}

function toIframeUrl(url: string): string {
  const parsed = new URL(url);
  const pathParam = parsed.searchParams.get('path');
  if (pathParam && !parsed.pathname.includes('iframe.html')) {
    const storyId = pathParam.replace(/^\/story\//, '');
    parsed.pathname = '/iframe.html';
    parsed.searchParams.delete('path');
    parsed.searchParams.set('id', storyId);
    return parsed.toString();
  }
  return url;
}

async function waitForStoryUrls(
  mcpClient: { getStoryUrl: (exportName: string, filePath: string) => Promise<string> },
  exportNames: string[],
  storyPath: string,
  maxAttempts = 10,
  interval = 3000,
): Promise<Array<{ exportName: string; url: string }>> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = await mcpClient.getStoryUrl(exportNames[0], storyPath);
    if (result.startsWith('http')) break;
    console.log(result);
    console.log(`    Story not indexed yet, retrying (${attempt + 1}/${maxAttempts})...`);
    if (attempt === maxAttempts - 1) {
      throw new Error(`Story not found after ${maxAttempts} attempts: ${storyPath}`);
    }
    await delay(interval);
  }

  const results = await Promise.all(
    exportNames.map(async (exportName) => {
      const url = await mcpClient.getStoryUrl(exportName, storyPath);
      return { exportName, url: toIframeUrl(url) };
    }),
  );
  return results;
}

export const commandHandler = defineCommandHandler({
  name: 'ImplementReactComponent',
  displayName: 'Implement React Component',
  alias: 'implement:react-component',
  description:
    'Generate a React/shadcn component with Storybook story, validated through type-checking, functional testing, and visual evaluation',
  category: 'implement',
  icon: 'component',
  fields: {
    targetDir: {
      description: 'The client project root directory (components will be written to src/components/ui/)',
      required: true,
    },
    job: {
      description: 'Job object with payload containing component details (componentId, description, type, prompt)',
      required: true,
    },
  },
  examples: [
    '$ auto implement:react-component --target-dir=./client --job=\'{"id":"job_1","dependsOn":[],"target":"ImplementReactComponent","payload":{"componentId":"atom_button","description":"A button","type":"atom","prompt":"Create a Button"}}\'',
  ],
  events: [
    { name: 'ReactComponentImplemented', displayName: 'React Component Implemented' },
    { name: 'ReactComponentImplementationFailed', displayName: 'React Component Implementation Failed' },
  ],
  handle: async (command: Command): Promise<ImplementReactComponentEvents> => {
    const { targetDir, job } = (command as ImplementReactComponentCommand).data;
    const task = job.payload;
    const name = componentName(task.componentId);

    debug('Implementing React component: %s in %s', name, targetDir);

    let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
    let mcpClient: Awaited<ReturnType<typeof connectMcpClient>> | undefined;

    try {
      debug('Checking Storybook on port %d...', PORT);
      await checkStorybookRunning();

      debug('Connecting MCP client...');
      mcpClient = await connectMcpClient({ baseUrl: `http://localhost:${PORT}` });

      debug('Fetching generation context...');
      const outputDir = path.resolve(targetDir, 'src', 'components', 'ui');
      const [uiBuildingInstructions, existingComponents, fileTree] = await Promise.all([
        mcpClient.getUiBuildingInstructions(),
        mcpClient.listComponents(),
        scanFileTree(outputDir, { readdir }),
      ]);

      const context: GenerationContext = { uiBuildingInstructions, existingComponents, fileTree };

      const modelName = process.env.DEFAULT_AI_MODEL ?? 'claude-sonnet-4-20250514';
      debug('Using AI model: %s', modelName);
      const model = createAnthropic()(modelName);

      debug('Launching browser...');
      browser = await chromium.launch();

      debug('Capturing design references...');
      // const designReference = await captureDesignReferences(browser, PORT, existingComponents, uiBuildingInstructions);
      const designReference: DesignReference = {
        screenshots: [],
        instructions: '',
      };

      const generator = createComponentGenerator(model);
      debug('Generating component: %s', name);
      const initialCode = await generator.generate(task, context);

      const resolvedTargetDir = path.resolve(targetDir);
      const result = await runValidationLoop({
        task,
        targetDir: resolvedTargetDir,
        outputDir,
        generator,
        context,
        mcpClient,
        browser,
        model,
        designReference,
        initialCode,
      });

      if (result.success) {
        return {
          type: 'ReactComponentImplemented',
          data: {
            name,
            componentPath: result.componentPath,
            storyPath: result.storyPath,
            iterations: result.iterations,
          },
          timestamp: new Date(),
          requestId: command.requestId,
          correlationId: command.correlationId,
        };
      }

      return {
        type: 'ReactComponentImplementationFailed',
        data: {
          error: `Failed after ${MAX_ITERATIONS} iterations. Last feedback: ${result.lastFeedback ? summarizeFeedback(result.lastFeedback) : 'none'}`,
          name,
        },
        timestamp: new Date(),
        requestId: command.requestId,
        correlationId: command.correlationId,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      debug('Implementation failed: %s', errorMessage);

      return {
        type: 'ReactComponentImplementationFailed',
        data: { error: errorMessage, name },
        timestamp: new Date(),
        requestId: command.requestId,
        correlationId: command.correlationId,
      };
    } finally {
      if (browser) {
        await browser.close();
      }
      if (mcpClient) {
        await mcpClient.close();
      }
    }
  },
});

export default commandHandler;
