import type { Browser } from 'playwright';

export interface FunctionalResult {
  passed: boolean;
  interactionErrors: string[];
  consoleErrors: string[];
  consoleWarnings: string[];
}

export async function validateFunctional(storyUrl: string, browser: Browser): Promise<FunctionalResult> {
  const consoleErrors: string[] = [];
  const consoleWarnings: string[] = [];
  const interactionErrors: string[] = [];

  const page = await browser.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
    if (msg.type() === 'warning') {
      consoleWarnings.push(msg.text());
    }
  });

  await page.goto(storyUrl);
  await page.waitForSelector('#storybook-root', { state: 'attached', timeout: 10000 });

  const errorText = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="storybook-error"]');
    return el ? el.textContent : null;
  });

  if (typeof errorText === 'string' && errorText.length > 0) {
    interactionErrors.push(errorText);
  }

  await page.close();

  return {
    passed: interactionErrors.length === 0 && consoleErrors.length === 0,
    interactionErrors,
    consoleErrors,
    consoleWarnings,
  };
}
