import chalk from 'chalk';

export function logSuccess(message: string): void {
  console.log(chalk.green(`✅ ${message}`));
}

export function logError(message: string): void {
  console.error(chalk.red(`❌ ${message}`));
}

export function logWarning(message: string): void {
  console.warn(chalk.yellow(`⚠️  ${message}`));
}

export function logInfo(message: string): void {
  console.log(chalk.cyan(`ℹ️  ${message}`));
}

export function logStep(message: string): void {
  console.log(chalk.gray(`🔄 ${message}`));
}
