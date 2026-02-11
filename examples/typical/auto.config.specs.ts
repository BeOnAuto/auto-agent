import type { Event } from '@auto-engineer/message-bus';
import type { SettledHandlerDescriptor } from '@auto-engineer/pipeline/src/core/descriptors';
import { describe, expect, it, beforeEach } from 'vitest';
import { pipeline, resetState } from './auto.config';

function getSettledHandler(): SettledHandlerDescriptor {
  const handler = pipeline.descriptor.handlers.find((h) => h.type === 'settled');
  return handler as SettledHandlerDescriptor;
}

function makeFailingCheckEvents(slicePath: string): Record<string, Event[]> {
  return {
    CheckTests: [{ type: 'TestsCheckFailed', data: { targetDirectory: slicePath, errors: 'test failed' } }],
    CheckTypes: [{ type: 'TypeCheckFailed', data: { targetDirectory: slicePath, errors: 'type error' } }],
    CheckLint: [{ type: 'LintCheckPassed', data: { targetDirectory: slicePath } }],
  };
}

describe('settled handler retry logic', () => {
  beforeEach(() => {
    resetState();
  });

  it('should not retry after max retries even when handler is called again for same slice', () => {
    const settled = getSettledHandler();
    const slicePath = '/some/slice/path';
    const events = makeFailingCheckEvents(slicePath);
    const dispatched: Array<{ type: string; data: unknown }> = [];
    const send = (type: string, data: unknown) => dispatched.push({ type, data });

    for (let i = 0; i < 4; i++) {
      settled.handler(events, send);
    }

    expect(dispatched).toHaveLength(4);

    dispatched.length = 0;
    settled.handler(events, send);

    expect(dispatched).toHaveLength(0);

    dispatched.length = 0;
    settled.handler(events, send);

    expect(dispatched).toHaveLength(0);
  });
});
