import type { Browser } from 'playwright';
import type { DesignReference } from './visual-evaluator.js';

export function parseComponentIds(existingComponents: string): string[] {
  const matches = existingComponents.matchAll(/\(([^)]+)\)/g);
  return Array.from(matches, (m) => m[1]);
}

export async function captureDesignReferences(
  browser: Browser,
  port: number,
  existingComponents: string,
  instructions: string,
): Promise<DesignReference> {
  const ids = parseComponentIds(existingComponents);
  const screenshots: Array<{ name: string; screenshot: Buffer }> = [];

  for (const id of ids) {
    const url = `http://localhost:${port}/iframe.html?id=${id}--default`;
    try {
      const page = await browser.newPage();
      await page.goto(url);
      await page.waitForSelector('#storybook-root');
      const screenshot = await page.screenshot();
      await page.close();
      screenshots.push({ name: id, screenshot });
    } catch {
      // skip components that fail to render
    }
  }

  return { screenshots, instructions };
}
