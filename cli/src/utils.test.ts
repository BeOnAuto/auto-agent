import { describe, it, expect } from 'vitest';
import { parseApiKey } from './utils.js';

describe('parseApiKey', () => {
  it('parses a valid key and extracts workspaceId', () => {
    expect(parseApiKey('ak_ws123_secret')).toEqual({ workspaceId: 'ws123' });
  });

  it('returns null for a key without ak prefix', () => {
    expect(parseApiKey('bad_ws123_secret')).toBeNull();
  });

  it('returns null for a key with fewer than 3 parts', () => {
    expect(parseApiKey('ak_onlytwosegments')).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(parseApiKey('')).toBeNull();
  });

  it('handles keys with extra underscores in the secret portion', () => {
    expect(parseApiKey('ak_workspace1_secret_with_underscores')).toEqual({ workspaceId: 'workspace1' });
  });
});
