import { describe, expect, it } from 'vitest';
import { CommandSliceSchema, QuerySliceSchema } from './schema';

describe('CommandSliceSchema', () => {
  it('should accept optional mappings field', () => {
    const slice = {
      type: 'command' as const,
      name: 'Create User',
      client: { specs: [] },
      server: { description: 'Creates a user', specs: [] },
      mappings: 'userId -> user.id',
    };

    const result = CommandSliceSchema.safeParse(slice);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.mappings).toBe('userId -> user.id');
    }
  });
});

describe('QuerySliceSchema', () => {
  it('should accept optional mappings field', () => {
    const slice = {
      type: 'query' as const,
      name: 'Get Users',
      client: { specs: [] },
      server: { description: 'Gets users', specs: [] },
      mappings: 'users -> response.data',
    };

    const result = QuerySliceSchema.safeParse(slice);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.mappings).toBe('users -> response.data');
    }
  });
});
