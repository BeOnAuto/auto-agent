import { afterEach, describe, expect, it } from 'vitest';
import { AgentClient } from './client.js';

describe('AgentClient', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  function stubFetch(responseBody: unknown, status = 200, statusText = 'OK') {
    let capturedUrl = '';
    let capturedInit: RequestInit | undefined;

    globalThis.fetch = async (input: string | URL | Request, init?: RequestInit) => {
      capturedUrl = typeof input === 'string' ? input : input.toString();
      capturedInit = init;
      return new Response(JSON.stringify(responseBody), {
        status,
        statusText,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    return { getCapturedUrl: () => capturedUrl, getCapturedInit: () => capturedInit };
  }

  it('getModel calls the correct URL for the workspace', async () => {
    const captured = stubFetch({ model: {} });
    const client = new AgentClient('https://example.com', 'test-api-key');

    await client.getModel('ws-123');

    expect(captured.getCapturedUrl()).toBe('https://example.com/api/agent/model/ws-123');
  });

  it('getModel sends the api key as a Bearer token', async () => {
    const captured = stubFetch({ model: {} });
    const client = new AgentClient('https://example.com', 'test-api-key');

    await client.getModel('ws-123');

    expect(captured.getCapturedInit()?.headers).toEqual({ Authorization: 'Bearer test-api-key' });
  });

  it('getModel returns the model from the response', async () => {
    const expectedModel = { scenes: [] };
    stubFetch({ model: expectedModel });
    const client = new AgentClient('https://example.com', 'test-api-key');

    const model = await client.getModel('ws-123');

    expect(model).toEqual(expectedModel);
  });

  it('getModel throws on non-ok response', async () => {
    stubFetch({}, 401, 'Unauthorized');
    const client = new AgentClient('https://example.com', 'bad-key');

    await expect(client.getModel('ws-123')).rejects.toThrow('Failed to get model: 401 Unauthorized');
  });

  it('sendModel calls the correct URL for the workspace', async () => {
    const captured = stubFetch({ model: {}, corrections: [], correctionCount: 0 });
    const client = new AgentClient('https://example.com', 'test-api-key');

    await client.sendModel('ws-123', { entities: [{ name: 'user' }] });

    expect(captured.getCapturedUrl()).toBe('https://example.com/api/agent/model/ws-123');
  });

  it('sendModel sends a POST with auth headers and JSON body', async () => {
    const captured = stubFetch({ model: {}, corrections: [], correctionCount: 0 });
    const client = new AgentClient('https://example.com', 'test-api-key');

    await client.sendModel('ws-123', { entities: [{ name: 'user' }] });

    expect(captured.getCapturedInit()).toEqual({
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-api-key',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: { entities: [{ name: 'user' }] } }),
    });
  });

  it('sendModel returns the correction result from the server', async () => {
    const correctionResult = {
      model: { entities: [{ name: 'User' }] },
      corrections: ['Renamed entity from "user" to "User"'],
      correctionCount: 1,
    };
    stubFetch(correctionResult);
    const client = new AgentClient('https://example.com', 'test-api-key');

    const result = await client.sendModel('ws-123', { entities: [{ name: 'user' }] });

    expect(result).toEqual(correctionResult);
  });

  it('sendModel throws on non-ok response', async () => {
    stubFetch({}, 401, 'Unauthorized');
    const client = new AgentClient('https://example.com', 'bad-key');

    await expect(client.sendModel('ws-123', {})).rejects.toThrow('Failed to send model: 401 Unauthorized');
  });
});
