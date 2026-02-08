import { describe, expect, it } from 'vitest';
import { createMessageBus } from './message-bus';

describe('onCorrelation', () => {
  it('calls listener when event has matching correlationId', async () => {
    const bus = createMessageBus();
    const received: Array<{ type: string; data: Record<string, unknown> }> = [];

    bus.onCorrelation('corr-123', (event) => {
      received.push(event);
    });

    await bus.publishEvent({
      type: 'TestEvent',
      data: { value: 1 },
      correlationId: 'corr-123',
    });

    expect(received).toEqual([{ type: 'TestEvent', data: { value: 1 }, correlationId: 'corr-123' }]);
  });

  it('does not call listener for non-matching correlationId', async () => {
    const bus = createMessageBus();
    const received: Array<{ type: string; data: Record<string, unknown> }> = [];

    bus.onCorrelation('corr-123', (event) => {
      received.push(event);
    });

    await bus.publishEvent({
      type: 'TestEvent',
      data: { value: 1 },
      correlationId: 'corr-456',
    });

    expect(received).toEqual([]);
  });

  it('returns unsubscribe function that stops notifications', async () => {
    const bus = createMessageBus();
    const received: Array<{ type: string; data: Record<string, unknown> }> = [];

    const subscription = bus.onCorrelation('corr-123', (event) => {
      received.push(event);
    });

    await bus.publishEvent({
      type: 'First',
      data: {},
      correlationId: 'corr-123',
    });

    subscription.unsubscribe();

    await bus.publishEvent({
      type: 'Second',
      data: {},
      correlationId: 'corr-123',
    });

    expect(received).toEqual([{ type: 'First', data: {}, correlationId: 'corr-123' }]);
  });

  it('does not call listener for events without correlationId', async () => {
    const bus = createMessageBus();
    const received: Array<{ type: string; data: Record<string, unknown> }> = [];

    bus.onCorrelation('corr-123', (event) => {
      received.push(event);
    });

    await bus.publishEvent({
      type: 'TestEvent',
      data: { value: 1 },
    });

    expect(received).toEqual([]);
  });
});

describe('onCorrelationPrefix', () => {
  it('calls listener when correlationId starts with prefix', async () => {
    const bus = createMessageBus();
    const received: Array<{ type: string; data: Record<string, unknown> }> = [];

    bus.onCorrelationPrefix('graph:g1:', (event) => {
      received.push(event);
    });

    await bus.publishEvent({
      type: 'JobDone',
      data: { jobId: 'a' },
      correlationId: 'graph:g1:job-a',
    });

    expect(received).toEqual([{ type: 'JobDone', data: { jobId: 'a' }, correlationId: 'graph:g1:job-a' }]);
  });

  it('does not call listener when correlationId does not match prefix', async () => {
    const bus = createMessageBus();
    const received: Array<{ type: string; data: Record<string, unknown> }> = [];

    bus.onCorrelationPrefix('graph:g1:', (event) => {
      received.push(event);
    });

    await bus.publishEvent({
      type: 'JobDone',
      data: {},
      correlationId: 'graph:g2:job-a',
    });

    expect(received).toEqual([]);
  });

  it('returns unsubscribe function that stops notifications', async () => {
    const bus = createMessageBus();
    const received: Array<{ type: string; data: Record<string, unknown> }> = [];

    const subscription = bus.onCorrelationPrefix('graph:g1:', (event) => {
      received.push(event);
    });

    await bus.publishEvent({
      type: 'First',
      data: {},
      correlationId: 'graph:g1:job-a',
    });

    subscription.unsubscribe();

    await bus.publishEvent({
      type: 'Second',
      data: {},
      correlationId: 'graph:g1:job-b',
    });

    expect(received).toEqual([{ type: 'First', data: {}, correlationId: 'graph:g1:job-a' }]);
  });
});
