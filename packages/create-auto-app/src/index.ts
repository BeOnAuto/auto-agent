#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateId } from '@auto-engineer/id';
import chalk from 'chalk';
import { program } from 'commander';
import { execa } from 'execa';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import ora from 'ora';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_TEMPLATE = 'kanban-todo';

interface ProjectOptions {
  name: string;
  template: string;
  packageManager: 'npm' | 'pnpm' | 'yarn';
  installDeps: boolean;
}

interface TemplateMetadata {
  name: string;
  displayName: string;
  description: string;
  type: 'template';
}

async function detectPackageManager(): Promise<'npm' | 'pnpm' | 'yarn'> {
  try {
    await execa('pnpm', ['--version']);
    return 'pnpm';
  } catch {
    try {
      await execa('yarn', ['--version']);
      return 'yarn';
    } catch {
      return 'npm';
    }
  }
}

async function getLatestVersion(packageName: string): Promise<string> {
  try {
    const { stdout } = await execa('npm', ['view', packageName, 'version']);
    return `^${stdout.trim()}`;
  } catch {
    return 'latest';
  }
}

function extractAutoEngineerPackages(pkg: Record<string, unknown>): string[] {
  const packages = new Set<string>();

  const deps = pkg.dependencies as Record<string, string> | undefined;
  const devDeps = pkg.devDependencies as Record<string, string> | undefined;

  if (deps !== undefined) {
    for (const name of Object.keys(deps)) {
      if (name.startsWith('@auto-engineer/')) {
        packages.add(name);
      }
    }
  }

  if (devDeps !== undefined) {
    for (const name of Object.keys(devDeps)) {
      if (name.startsWith('@auto-engineer/')) {
        packages.add(name);
      }
    }
  }

  return Array.from(packages);
}

async function collectAllAutoEngineerPackages(targetDir: string): Promise<string[]> {
  const packages = new Set<string>();

  const packageJsonPaths = [
    path.join(targetDir, 'package.json'),
    path.join(targetDir, 'client', 'package.json'),
    path.join(targetDir, 'server', 'package.json'),
  ];

  for (const pkgPath of packageJsonPaths) {
    if (await fs.pathExists(pkgPath)) {
      const pkg = (await fs.readJson(pkgPath)) as Record<string, unknown>;
      for (const name of extractAutoEngineerPackages(pkg)) {
        packages.add(name);
      }
    }
  }

  return Array.from(packages);
}

async function getLatestVersions(packages: string[]): Promise<Record<string, string>> {
  const spinner = ora('Fetching latest package versions...').start();
  const versions: Record<string, string> = {};

  await Promise.all(
    packages.map(async (pkg) => {
      versions[pkg] = await getLatestVersion(pkg);
    }),
  );

  spinner.succeed('Package versions fetched');
  return versions;
}

function applyVersionsToDeps(deps: Record<string, string> | undefined, versions: Record<string, string>): void {
  if (deps === undefined) {
    return;
  }
  for (const [pkg, version] of Object.entries(versions)) {
    if (deps[pkg] !== undefined) {
      deps[pkg] = version;
    }
  }
}

async function updatePackageJsonName(pkgPath: string, name: string): Promise<void> {
  if (!(await fs.pathExists(pkgPath))) {
    return;
  }
  const pkg = (await fs.readJson(pkgPath)) as Record<string, unknown>;
  pkg.name = name;
  await fs.writeJson(pkgPath, pkg, { spaces: 2 });
}

async function updatePackageVersions(targetDir: string, projectName: string, versions: Record<string, string>) {
  const rootPackageJsonPath = path.join(targetDir, 'package.json');

  if (await fs.pathExists(rootPackageJsonPath)) {
    const rootPkg = (await fs.readJson(rootPackageJsonPath)) as Record<string, unknown>;
    applyVersionsToDeps(rootPkg.dependencies as Record<string, string> | undefined, versions);
    applyVersionsToDeps(rootPkg.devDependencies as Record<string, string> | undefined, versions);
    rootPkg.name = projectName;
    await fs.writeJson(rootPackageJsonPath, rootPkg, { spaces: 2 });
  }

  await updatePackageJsonName(path.join(targetDir, 'client', 'package.json'), `${projectName}-client`);
  await updatePackageJsonName(path.join(targetDir, 'server', 'package.json'), `${projectName}-server`);
}

async function installDependencies(targetDir: string, packageManager: 'npm' | 'pnpm' | 'yarn') {
  const spinner = ora('Installing dependencies...').start();
  try {
    // Install root dependencies
    await execa(packageManager, ['install'], { cwd: targetDir });

    // If it's a monorepo (has workspaces), pnpm install at root handles everything
    const rootPkg = (await fs.readJson(path.join(targetDir, 'package.json'))) as Record<string, unknown>;
    if (rootPkg.workspaces === undefined && rootPkg['pnpm-workspace.yaml'] === undefined) {
      // Install client dependencies if exists
      const clientDir = path.join(targetDir, 'client');
      if (await fs.pathExists(clientDir)) {
        await execa(packageManager, ['install'], { cwd: clientDir });
      }

      // Install server dependencies if exists
      const serverDir = path.join(targetDir, 'server');
      if (await fs.pathExists(serverDir)) {
        await execa(packageManager, ['install'], { cwd: serverDir });
      }
    }

    spinner.succeed('Dependencies installed');
  } catch (error) {
    spinner.fail('Failed to install dependencies');
    console.error(error);
  }
}

async function replaceTemplateFileId(targetDir: string): Promise<void> {
  const autoConfigPath = path.join(targetDir, 'auto.config.ts');

  if (!(await fs.pathExists(autoConfigPath))) {
    return;
  }

  try {
    const content = await fs.readFile(autoConfigPath, 'utf8');

    const fileIdPattern = /fileId:\s*['"]([\w-]+)['"]/;
    const match = content.match(fileIdPattern);

    if (match !== null) {
      const oldFileId = match[1];
      const newFileId = generateId();

      const modifiedContent = content.replace(fileIdPattern, `fileId: '${newFileId}'`);

      await fs.writeFile(autoConfigPath, modifiedContent, 'utf8');
      console.log(chalk.blue(`Replaced fileId ${oldFileId} with ${newFileId} in auto.config.ts`));
    }
  } catch (error) {
    console.warn(chalk.yellow(`Warning: Could not process auto.config.ts fileId replacement:`, error));
  }
}

async function createFromTemplate(templatePath: string, targetDir: string, projectName: string, templateName: string) {
  console.log(chalk.cyan(`Using ${templateName} template...`));
  try {
    // Copy without filter first to ensure it works
    await fs.copy(templatePath, targetDir);
  } catch (error) {
    console.error(chalk.red('Failed to copy template:'), error);
    throw error;
  }

  // Create pnpm-workspace.yaml if it doesn't exist (needed for monorepo setup)
  const workspaceYamlPath = path.join(targetDir, 'pnpm-workspace.yaml');
  if (!(await fs.pathExists(workspaceYamlPath))) {
    await fs.writeFile(workspaceYamlPath, "packages:\n  - '*'\n");
  }

  // Scan template for all @auto-engineer packages and get their latest versions
  const packagesToCheck = await collectAllAutoEngineerPackages(targetDir);
  const versions = await getLatestVersions(packagesToCheck);

  await replaceTemplateFileId(targetDir);

  // Update package versions
  await updatePackageVersions(targetDir, projectName, versions);
}

async function prepareTargetDirectory(name: string, targetDir: string): Promise<boolean> {
  // Check if directory exists (unless it's current directory)
  if (name !== '.' && (await fs.pathExists(targetDir))) {
    const { overwrite } = (await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: `Directory ${name} already exists. Overwrite?`,
        default: false,
      },
    ])) as { overwrite: boolean };

    if (!overwrite) {
      console.log(chalk.yellow('Operation cancelled'));
      return false;
    }

    await fs.remove(targetDir);
  }

  // Create target directory
  try {
    await fs.ensureDir(targetDir);
    return true;
  } catch (error) {
    console.error(chalk.red('Failed to create directory:'), error);
    throw error;
  }
}

function printSuccessMessage(name: string, packageManager: string, installDeps: boolean) {
  console.log(chalk.green('\n✓ Project created successfully!\n'));
  console.log('Next steps:');
  if (name !== '.') {
    console.log(chalk.cyan(`  cd ${name}`));
  }
  if (!installDeps) {
    console.log(chalk.cyan(`  ${packageManager} install`));
  }
  console.log(chalk.cyan(`  auto (you may need to ${packageManager} install -g @auto-engineer/cli@latest)\n`));
}

async function getAvailableTemplates(): Promise<TemplateMetadata[]> {
  const templatesDir = path.join(__dirname, '../..', 'templates');
  const templates: TemplateMetadata[] = [];

  try {
    const entries = await fs.readdir(templatesDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const templateJsonPath = path.join(templatesDir, entry.name, 'template.json');

        if (await fs.pathExists(templateJsonPath)) {
          try {
            const metadata = (await fs.readJson(templateJsonPath)) as TemplateMetadata;
            templates.push(metadata);
          } catch (error) {
            console.warn(chalk.yellow(`Failed to read template.json for ${entry.name}:`, error));
          }
        }
      }
    }
  } catch (error) {
    console.warn(chalk.yellow('Failed to read templates directory:', error));
  }

  return templates;
}

async function createProject(options: ProjectOptions) {
  const { name, template, packageManager, installDeps } = options;
  const targetDir = path.resolve(process.cwd(), name === '.' ? process.cwd() : name);
  const projectName = name === '.' ? path.basename(process.cwd()) : name;

  // Prepare directory
  const shouldContinue = await prepareTargetDirectory(name, targetDir);
  if (!shouldContinue) {
    process.exit(0);
  }

  console.log(chalk.blue(`\nCreating Auto Engineer project in ${chalk.bold(targetDir)}\n`));

  // Create from template
  const templatePath = path.join(__dirname, '../..', 'templates', template);

  if (await fs.pathExists(templatePath)) {
    await createFromTemplate(templatePath, targetDir, projectName, template);
  } else {
    console.error(chalk.red(`Template "${template}" not found at ${templatePath}`));
    process.exit(1);
  }

  // Install dependencies if requested
  if (installDeps) {
    await installDependencies(targetDir, packageManager);
  }

  // Success message
  printSuccessMessage(name, packageManager, installDeps);
}

async function main() {
  // Get available templates for help text
  const availableTemplates = await getAvailableTemplates();
  const templateNames = availableTemplates.map((t) => t.name).join(', ');

  program
    .name('create-auto-app')
    .description('Create a new Auto Engineer application')
    .version('0.1.0')
    .argument('[project-name]', 'Name of the project (use "." for current directory)')
    .option('-t, --template <template>', `Project template (${templateNames})`, DEFAULT_TEMPLATE)
    .option('--no-install', 'Skip dependency installation')
    .option('--use-npm', 'Use npm as package manager')
    .option('--use-yarn', 'Use yarn as package manager')
    .option('--use-pnpm', 'Use pnpm as package manager')
    .parse(process.argv);

  const options = program.opts();
  let projectName = program.args[0];

  // Interactive mode if no project name provided
  if (!projectName) {
    // Build choices dynamically from available templates
    const templateChoices = availableTemplates.map((template) => ({
      name: `${template.displayName} - ${template.description}`,
      value: template.name,
    }));

    const answers = (await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Project name:',
        default: 'my-auto-app',
        validate: (input: unknown) => {
          if (input === '.') return true;
          if (typeof input !== 'string' || !input.trim()) return 'Project name is required';
          if (!/^[a-z0-9-_]+$/i.test(input)) {
            return 'Project name can only contain letters, numbers, hyphens, and underscores';
          }
          return true;
        },
      },
      // Only ask for template if there are multiple options
      ...(templateChoices.length > 1
        ? [
            {
              type: 'list',
              name: 'template',
              message: 'Which template would you like to use?',
              choices: templateChoices,
              default: DEFAULT_TEMPLATE,
            },
          ]
        : []),
      {
        type: 'confirm',
        name: 'installDeps',
        message: 'Install dependencies?',
        default: true,
      },
    ])) as {
      name: string;
      template?: string;
      installDeps: boolean;
    };

    projectName = answers.name;
    options.template = answers.template ?? DEFAULT_TEMPLATE;
    options.install = answers.installDeps;
  }

  // Detect package manager
  let packageManager: 'npm' | 'pnpm' | 'yarn';
  if (options.useNpm === true) {
    packageManager = 'npm';
  } else if (options.useYarn === true) {
    packageManager = 'yarn';
  } else if (options.usePnpm === true) {
    packageManager = 'pnpm';
  } else {
    packageManager = await detectPackageManager();
  }

  const projectOptions: ProjectOptions = {
    name: projectName,
    template: options.template as string,
    packageManager,
    installDeps: options.install !== false,
  };

  await createProject(projectOptions);
}

// Run main function when this module is executed directly (not during testing)
if (process.env.NODE_ENV !== 'test' && typeof process.env.VITEST === 'undefined') {
  main().catch((error) => {
    console.error(chalk.red('Error:'), error);
    process.exit(1);
  });
}

export { getAvailableTemplates, createFromTemplate, detectPackageManager, replaceTemplateFileId };
