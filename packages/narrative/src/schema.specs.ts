import { describe, expect, it } from 'vitest';
import { CommandSliceSchema, QuerySliceSchema } from './schema';

describe('CommandSliceSchema', () => {
  it('should accept optional mappings field with structured entries', () => {
    const slice = {
      type: 'command' as const,
      name: 'Create User',
      client: { specs: [] },
      server: { description: 'Creates a user', specs: [] },
      mappings: [
        {
          source: { type: 'Command' as const, name: 'CreateUser', field: 'userId' },
          target: { type: 'Event' as const, name: 'UserCreated', field: 'id' },
        },
      ],
    };

    const result = CommandSliceSchema.safeParse(slice);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.mappings).toEqual([
        {
          source: { type: 'Command', name: 'CreateUser', field: 'userId' },
          target: { type: 'Event', name: 'UserCreated', field: 'id' },
        },
      ]);
    }
  });
});

describe('QuerySliceSchema', () => {
  it('should accept optional mappings field with structured entries', () => {
    const slice = {
      type: 'query' as const,
      name: 'Get Users',
      client: { specs: [] },
      server: { description: 'Gets users', specs: [] },
      mappings: [
        {
          source: { type: 'State' as const, name: 'UsersProjection', field: 'users' },
          target: { type: 'Query' as const, name: 'GetUsers', field: 'data' },
        },
      ],
    };

    const result = QuerySliceSchema.safeParse(slice);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.mappings).toEqual([
        {
          source: { type: 'State', name: 'UsersProjection', field: 'users' },
          target: { type: 'Query', name: 'GetUsers', field: 'data' },
        },
      ]);
    }
  });
});
