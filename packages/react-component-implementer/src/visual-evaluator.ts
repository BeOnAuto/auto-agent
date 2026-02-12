import type { LanguageModel } from 'ai';
import { generateText } from 'ai';
import type { Browser } from 'playwright';

export interface VisualFeedback {
  score: number;
  passed: boolean;
  feedback: string;
}

export interface VisualComponentInfo {
  name: string;
  description: string;
}

export interface DesignReference {
  screenshots: Array<{ name: string; screenshot: Buffer }>;
  instructions: string;
}

export async function evaluateVisual(
  storyUrl: string,
  component: VisualComponentInfo,
  browser: Browser,
  model: LanguageModel,
  designReference?: DesignReference,
): Promise<VisualFeedback> {
  const page = await browser.newPage();
  await page.goto(storyUrl);
  await page.waitForSelector('#storybook-root');
  const screenshotBuffer = await page.screenshot();
  await page.close();

  const content: Array<{ type: 'image'; image: Buffer; mediaType: 'image/png' } | { type: 'text'; text: string }> = [];

  if (designReference) {
    for (const ref of designReference.screenshots) {
      content.push({ type: 'image', image: ref.screenshot, mediaType: 'image/png' });
      content.push({ type: 'text', text: `Reference component: ${ref.name}` });
    }
  }

  content.push({ type: 'image', image: screenshotBuffer, mediaType: 'image/png' });

  if (designReference) {
    content.push({
      type: 'text',
      text: `The images above are reference screenshots from the existing component library, followed by the component under review.

Design guidelines:
${designReference.instructions}

Evaluate this screenshot of a "${component.name}" component (${component.description}).

Rate on a scale of 1-10 how well it matches the design system shown in the reference components and follows the design guidelines.

Respond with JSON only: { "score": N, "feedback": "..." }`,
    });
  } else {
    content.push({
      type: 'text',
      text: `Evaluate this screenshot of a "${component.name}" component (${component.description}).

Rate the following on a scale of 1-10:
- Visual quality and aesthetics
- Layout correctness
- Consistency with modern design systems
- Component renders correctly and looks professional

Respond with JSON only: { "score": N, "feedback": "..." }`,
    });
  }

  const result = await generateText({
    model,
    messages: [
      {
        role: 'user',
        content,
      },
    ],
  });

  try {
    const parsed: { score: number; feedback: string } = JSON.parse(result.text);
    return {
      score: parsed.score,
      passed: parsed.score >= 7,
      feedback: parsed.feedback,
    };
  } catch {
    return {
      score: 5,
      passed: false,
      feedback: result.text,
    };
  }
}
