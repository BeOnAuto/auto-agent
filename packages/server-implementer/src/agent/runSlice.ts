import { access, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createModelFromEnv } from '@auto-engineer/model-factory';
import { generateText } from 'ai';
import { execa } from 'execa';
import fg from 'fast-glob';
import { SYSTEM_PROMPT } from '../prompts/systemPrompt';
import { extractCodeBlock } from '../utils/extractCodeBlock';
import { runTests } from './runTests';

type TestAndTypecheckResult = {
  success: boolean;
  failedTestFiles: string[];
  failedTypecheckFiles: string[];
  testErrors: string;
  typecheckErrors: string;
};

export type VitestAssertionResult = {
  status: string;
  fullName: string;
  failureMessages?: string[];
};

export type VitestTestResult = {
  file: string;
  name?: string;
  status: string;
  assertionResults: VitestAssertionResult[];
};

export async function runSlice(sliceDir: string, flow: string): Promise<void> {
  const sliceName = path.basename(sliceDir);
  console.log(`✏️ Implementing slice: ${sliceName} for flow: ${flow}`);
  const contextFiles = await loadContextFiles(sliceDir);
  const filesToImplement = findFilesToImplement(contextFiles);
  for (const [targetFile] of filesToImplement) {
    await implementFileFromAI(sliceDir, targetFile, contextFiles);
  }
  const result = await runTestsAndTypecheck(sliceDir);
  reportTestAndTypecheckResults(sliceDir, flow, result);
  if (result.success) {
    console.log(`✅ All tests and checks passed on first attempt.`);
    return;
  }
  await retryFailedFiles(sliceDir, flow, result);
  if (result.failedTestFiles.length > 0) {
    await retryFailedTests(sliceDir, flow, result);
  }
}

async function retryFailedFiles(
  sliceDir: string,
  flow: string,
  initialResult: TestAndTypecheckResult,
  depth = 0,
): Promise<TestAndTypecheckResult> {
  const MAX_RECURSION_DEPTH = 2;
  let contextFiles = await loadContextFiles(sliceDir);
  let result = initialResult;
  for (let attempt = 1; attempt <= 5; attempt++) {
    if (result.failedTypecheckFiles.length === 0) {
      console.log(`✅ Typecheck issues resolved after attempt ${attempt - 1}`);
      break;
    }
    console.log(`🔁 Typecheck retry attempt ${attempt} for ${result.failedTypecheckFiles.length} files...`);
    contextFiles = await loadContextFiles(sliceDir);
    for (const filePath of result.failedTypecheckFiles) {
      const fileName = path.basename(filePath);
      const retryPrompt = buildRetryPrompt(fileName, contextFiles, result.testErrors, result.typecheckErrors);
      console.log(`🔧 Retrying typecheck error in ${fileName} in flow ${flow}...`);
      const { text: aiOutput } = await generateText({ model: createModelFromEnv(), prompt: retryPrompt });
      const cleanedCode = extractCodeBlock(aiOutput);
      await writeFile(path.join(sliceDir, fileName), cleanedCode, 'utf-8');
      console.log(`♻️ Updated ${fileName} to fix typecheck errors`);
    }
    result = await runTestsAndTypecheck(sliceDir);
    reportTestAndTypecheckResults(sliceDir, flow, result);
  }
  if (result.failedTypecheckFiles.length > 0) {
    if (depth >= MAX_RECURSION_DEPTH) {
      console.error(`❌ Typecheck errors persist after ${MAX_RECURSION_DEPTH} recursive retry rounds. Giving up.`);
      return result;
    }
    console.log(`⚠️ Fixing tests caused typecheck errors. Retrying typecheck fixes...`);
    const typecheckOnlyResult = {
      ...result,
      testErrors: '', // Clear test errors since we're only fixing typecheck
      failedTestFiles: [], // Clear failed test files
    };
    result = await retryFailedFiles(sliceDir, path.basename(sliceDir), typecheckOnlyResult, depth + 1);
    // After fixing typecheck, re-run everything to get fresh results
    const freshResult = await runTestsAndTypecheck(sliceDir);
    reportTestAndTypecheckResults(sliceDir, flow, freshResult);
    result = freshResult;
    if (result.failedTestFiles.length === 0) {
      console.log(`✅ All test issues resolved after fixing type errors.`);
    }
  }
  return result;
}

async function loadContextFiles(sliceDir: string): Promise<Record<string, string>> {
  const files = await fg(['*.ts'], { cwd: sliceDir });
  const context: Record<string, string> = {};
  for (const file of files) {
    const absPath = path.join(sliceDir, file);
    context[file] = await readFile(absPath, 'utf-8');
  }
  return context;
}

function findFilesToImplement(contextFiles: Record<string, string>) {
  return Object.entries(contextFiles).filter(
    ([, content]) => content.includes('TODO:') || content.includes('IMPLEMENTATION INSTRUCTIONS'),
  );
}

function buildInitialPrompt(targetFile: string, context: Record<string, string>): string {
  return `
${SYSTEM_PROMPT}

---
📄 Target file to implement: ${targetFile}

${context[targetFile]}

---
🧠 Other files in the same slice:
${Object.entries(context)
  .filter(([name]) => name !== targetFile)
  .map(([name, content]) => `// File: ${name}\n${content}`)
  .join('\n\n')}

---
Return only the whole updated file of ${targetFile}. Do not remove existing imports or types that are still referenced or required in the file. The file returned has to be production ready.
`.trim();
}

function buildRetryPrompt(
  targetFile: string,
  context: Record<string, string>,
  testErrors: string,
  typeErrors: string,
): string {
  return `
${SYSTEM_PROMPT}

---
The previous implementation of ${targetFile} caused test or type-check failures.

📄 File to fix: ${targetFile}

${context[targetFile]}

🧠 Other files in the same slice:
${Object.entries(context)
  .filter(([name]) => name !== targetFile)
  .map(([name, content]) => `// File: ${name}\n${content}`)
  .join('\n\n')}

🧪 Test errors:
${testErrors || 'None'}

📐 Typecheck errors:
${typeErrors || 'None'}

---
Return only the corrected full contents of ${targetFile}, no commentary, no markdown.
`.trim();
}

async function implementFileFromAI(sliceDir: string, targetFile: string, contextFiles: Record<string, string>) {
  const filePath = path.join(sliceDir, targetFile);
  const prompt = buildInitialPrompt(targetFile, contextFiles);
  console.log(`🔮 Analysing and Implementing ${targetFile}`);
  const { text: aiOutput } = await generateText({ model: createModelFromEnv(), prompt });
  const cleanedCode = extractCodeBlock(aiOutput);
  await writeFile(filePath, cleanedCode, 'utf-8');

  console.log(`♻ Implemented ${targetFile}`);
}

export async function runTestsAndTypecheck(sliceDir: string): Promise<TestAndTypecheckResult> {
  const rootDir = await findProjectRoot(sliceDir);
  const testResult = await runTests(sliceDir, rootDir);
  const typecheckResult = await runTypecheck(sliceDir, rootDir);
  return {
    success: testResult.success && typecheckResult.success,
    failedTestFiles: testResult.failedTestFiles,
    failedTypecheckFiles: typecheckResult.failedTypecheckFiles,
    testErrors: testResult.testErrors,
    typecheckErrors: typecheckResult.typecheckErrors,
  };
}

async function retryFailedTests(sliceDir: string, flow: string, result: TestAndTypecheckResult) {
  let contextFiles = await loadContextFiles(sliceDir);
  for (let attempt = 1; attempt <= 5; attempt++) {
    if (result.failedTestFiles.length === 0) {
      console.log(`✅ Test failures resolved after attempt ${attempt - 1}`);
      break;
    }
    console.log(`🔁 Test retry attempt ${attempt} for ${result.failedTestFiles.length} files...`);
    const smartPrompt = `
${SYSTEM_PROMPT}
---
🧪 The current implementation has test failures.

📄 Test errors:
${result.testErrors || 'None'}

🧠 Full slice context:
${Object.entries(contextFiles)
  .map(([name, content]) => `// File: ${name}\n${content}`)
  .join('\n\n')}

---
Please return the full corrected content of a single file (not a test file) that should be updated to fix the failing tests.

Use this format:
\`\`\`ts
// File: <fileName>.ts
<corrected code>
\`\`\`

No commentary or markdown outside the code block.
`.trim();

    console.log('🔮 Asking AI to suggest a fix for test failures...');
    const { text: aiOutput } = await generateText({ model: createModelFromEnv(), prompt: smartPrompt });
    const cleaned = extractCodeBlock(aiOutput);
    const match = cleaned.match(/^\/\/ File: (.+?)\n([\s\S]*)/m);
    if (!match) {
      console.warn(`⚠️ Skipping retry. AI output didn't match expected format.`);
      break;
    }

    const [, fileName, code] = match;
    const absPath = path.join(sliceDir, fileName.trim());
    console.log('🔧 Applying AI fix to:', absPath);
    await writeFile(absPath, code.trim(), 'utf-8');
    console.log(`♻️ Updated ${fileName.trim()} to fix tests`);
    contextFiles = await loadContextFiles(sliceDir);
    result = await runTestsAndTypecheck(sliceDir);
    reportTestAndTypecheckResults(sliceDir, flow, result);
    // If test fix introduced a new type error, handle it before continuing
    if (result.failedTypecheckFiles.length > 0) {
      console.log(`⚠️ Fixing tests caused typecheck errors. Retrying typecheck fixes...`);
      result = await retryFailedFiles(sliceDir, flow, result);
      if (result.failedTestFiles.length === 0) {
        console.log(`✅ All test issues resolved after fixing type errors.`);
        break;
      }
    }
    contextFiles = await loadContextFiles(sliceDir);
  }

  if (result.failedTestFiles.length > 0) {
    console.error(`❌ Some test failures remain after retry attempts.`);
    for (const file of result.failedTestFiles) {
      console.log(`   - ${path.relative(sliceDir, file)}`);
    }
  }
}

async function runTypecheck(sliceDir: string, rootDir: string) {
  try {
    const result = await execa('npx', ['tsc', '--noEmit'], {
      cwd: rootDir,
      stdio: 'pipe',
      reject: false,
    });
    const output = (result.stdout ?? '') + (result.stderr ?? '');
    if (result.exitCode !== 0 || output.includes('error')) {
      return await processTypecheckOutput(output, sliceDir, rootDir);
    }
    return { success: true, typecheckErrors: '', failedTypecheckFiles: [] };
  } catch (err: unknown) {
    const execaErr = err as { stdout?: string; stderr?: string };
    const output = (execaErr.stdout ?? '') + (execaErr.stderr ?? '');
    console.error('TypeScript execution error:', output);
    const files = await fg(['*.ts'], { cwd: sliceDir, absolute: true });
    return { success: false, typecheckErrors: output, failedTypecheckFiles: files };
  }
}

function getTypecheckPatterns(): RegExp[] {
  return [
    /^([^:]+\.ts)\(\d+,\d+\): error/gm,
    /error TS\d+: (.+) '([^']+\.ts)'/gm,
    /^([^:]+\.ts):\d+:\d+\s+-\s+error/gm,
  ];
}

function extractFailedFiles(output: string, patterns: RegExp[], rootDir: string, sliceDir?: string): string[] {
  const failedFiles = new Set<string>();

  for (const pattern of patterns) {
    for (const match of output.matchAll(pattern)) {
      const filePath = match[1] ? path.resolve(rootDir, match[1]) : '';

      const notNodeModules = !filePath.includes('node_modules');
      const inSlice = sliceDir === undefined || filePath.startsWith(sliceDir);

      if (notNodeModules && inSlice) {
        failedFiles.add(filePath);
      }
    }
  }

  return Array.from(failedFiles);
}

async function processTypecheckOutput(output: string, sliceDir: string, rootDir: string) {
  const relativePath = path.relative(rootDir, sliceDir);
  const filtered = output
    .split('\n')
    .filter((line) => {
      const hasError = line.includes('error TS') || line.includes('): error');
      const notNodeModules = !line.includes('node_modules');
      const hasSlicePath = line.includes(relativePath) || line.includes(sliceDir);
      return hasError && notNodeModules && hasSlicePath;
    })
    .join('\n');

  if (filtered.trim() === '') {
    return { success: true, typecheckErrors: '', failedTypecheckFiles: [] };
  }

  const failedFiles = await processTypecheckFailure(filtered, rootDir, sliceDir);
  return {
    success: false,
    typecheckErrors: filtered,
    failedTypecheckFiles: failedFiles,
  };
}

async function processTypecheckFailure(output: string, rootDir: string, sliceDir: string): Promise<string[]> {
  const patterns = getTypecheckPatterns();
  let failed = extractFailedFiles(output, patterns, rootDir, sliceDir);

  if (failed.length === 0 && output.includes('error')) {
    failed = await fg(['*.ts'], { cwd: sliceDir, absolute: true });
  }

  return failed;
}

async function findProjectRoot(startDir: string): Promise<string> {
  let dir = startDir;
  while (dir !== path.dirname(dir)) {
    try {
      await access(path.join(dir, 'package.json'));
      return dir;
    } catch {
      dir = path.dirname(dir);
    }
  }
  throw new Error('❌ Could not find project root');
}

function reportTestAndTypecheckResults(sliceDir: string, flow: string, result: TestAndTypecheckResult) {
  const sliceName = path.basename(sliceDir);
  if (result.success) {
    console.log(`✅ All Tests and checks passed for: ${sliceName} in flow ${flow}`);
    return;
  }
  console.error(`❌ ${sliceName} in floe ${flow} failed tests or type-checks.`);
  if (result.failedTestFiles.length) {
    const files = result.failedTestFiles.map((f) => path.relative(sliceDir, f));
    console.log(`🧪 Failed test files: ${files.join(', ')}`);
    if (result.testErrors) {
      console.log(`📝 Test errors:\n${result.testErrors}`);
    }
  }
  if (result.failedTypecheckFiles.length) {
    const files = result.failedTypecheckFiles.map((f) => path.relative(sliceDir, f));
    console.log(`📐 Failed typecheck files: ${files.join(', ')}`);
    if (result.typecheckErrors) {
      console.log(`📝 Typecheck errors:\n${result.typecheckErrors}`);
    }
  }
}
