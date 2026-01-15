import { describe, expect, it } from 'vitest';
import type { Model } from '../../index';
import { modelToNarrative } from './index';
import { throwOnValidationErrors, validateModules } from './validate-modules';

describe('module functionality', () => {
  describe('derived modules (from toModel)', () => {
    it('produces self-contained files with duplicated types for each sourceFile', async () => {
      const model: Model = {
        variant: 'specs',
        narratives: [
          {
            name: 'Orders',
            id: 'orders-flow',
            sourceFile: 'orders.narrative.ts',
            slices: [],
          },
          {
            name: 'Users',
            id: 'users-flow',
            sourceFile: 'users.narrative.ts',
            slices: [],
          },
        ],
        messages: [
          {
            type: 'event',
            source: 'internal',
            name: 'SharedEvent',
            fields: [{ name: 'id', type: 'string', required: true }],
          },
        ],
        integrations: [],
        modules: [
          {
            sourceFile: 'orders.narrative.ts',
            isDerived: true,
            contains: { narrativeIds: ['orders-flow'] },
            declares: { messages: [{ kind: 'event', name: 'SharedEvent' }] },
          },
          {
            sourceFile: 'users.narrative.ts',
            isDerived: true,
            contains: { narrativeIds: ['users-flow'] },
            declares: { messages: [{ kind: 'event', name: 'SharedEvent' }] },
          },
        ],
      };

      const result = await modelToNarrative(model);

      expect(result.files).toHaveLength(2);

      // Both files should have paths matching sourceFile
      const paths = result.files.map((f) => f.path);
      expect(paths).toContain('orders.narrative.ts');
      expect(paths).toContain('users.narrative.ts');

      // Both files should declare SharedEvent (type duplication for derived modules)
      for (const file of result.files) {
        expect(file.code).toContain('type SharedEvent = Event<');
        expect(file.code).toContain("'SharedEvent'");
      }

      // No cross-file imports for derived modules
      for (const file of result.files) {
        expect(file.code).not.toContain('import type { SharedEvent }');
      }
    });
  });

  describe('authored modules (hand-crafted)', () => {
    it('generates cross-module imports for types declared by other modules', async () => {
      const model: Model = {
        variant: 'specs',
        narratives: [
          {
            name: 'Shared Types',
            id: 'shared-types',
            slices: [],
          },
          {
            name: 'Orders',
            id: 'orders-flow',
            slices: [
              {
                name: 'create order',
                type: 'command',
                client: { specs: [] },
                server: {
                  description: 'Creates an order',
                  specs: [
                    {
                      type: 'gherkin',
                      feature: 'Order Creation',
                      rules: [
                        {
                          name: 'Valid order',
                          examples: [
                            {
                              name: 'Creates order',
                              steps: [
                                { keyword: 'When', text: 'CreateOrder' },
                                { keyword: 'Then', text: 'OrderCreated' },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
            ],
          },
        ],
        messages: [
          {
            type: 'command',
            name: 'CreateOrder',
            fields: [{ name: 'id', type: 'string', required: true }],
          },
          {
            type: 'event',
            source: 'internal',
            name: 'OrderCreated',
            fields: [{ name: 'orderId', type: 'string', required: true }],
          },
        ],
        integrations: [],
        modules: [
          {
            sourceFile: 'shared/types.narrative.ts',
            isDerived: false,
            contains: { narrativeIds: ['shared-types'] },
            declares: {
              messages: [{ kind: 'event', name: 'OrderCreated' }],
            },
          },
          {
            sourceFile: 'features/orders.narrative.ts',
            isDerived: false,
            contains: { narrativeIds: ['orders-flow'] },
            declares: {
              messages: [{ kind: 'command', name: 'CreateOrder' }],
            },
          },
        ],
      };

      const result = await modelToNarrative(model);

      expect(result.files).toHaveLength(2);

      // Find the orders file
      const ordersFile = result.files.find((f) => f.path.includes('orders'));
      expect(ordersFile).toBeDefined();

      // Orders file should import OrderCreated from shared
      expect(ordersFile!.code).toContain("import type { OrderCreated } from '../shared/types.narrative';");
    });
  });

  describe('validation', () => {
    it('detects duplicate sourceFiles', () => {
      const model: Model = {
        variant: 'specs',
        narratives: [],
        messages: [],
        modules: [
          {
            sourceFile: 'same-file.ts',
            isDerived: false,
            contains: { narrativeIds: [] },
            declares: { messages: [] },
          },
          {
            sourceFile: 'same-file.ts',
            isDerived: false,
            contains: { narrativeIds: [] },
            declares: { messages: [] },
          },
        ],
      };

      const errors = validateModules(model);

      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe('duplicate_sourceFile');
      expect(errors[0].message).toContain('same-file.ts');
    });

    it('detects narrative assigned to multiple authored modules', () => {
      const model: Model = {
        variant: 'specs',
        narratives: [{ name: 'Test', id: 'test-narrative', slices: [] }],
        messages: [],
        modules: [
          {
            sourceFile: 'a.ts',
            isDerived: false,
            contains: { narrativeIds: ['test-narrative'] },
            declares: { messages: [] },
          },
          {
            sourceFile: 'b.ts',
            isDerived: false,
            contains: { narrativeIds: ['test-narrative'] },
            declares: { messages: [] },
          },
        ],
      };

      const errors = validateModules(model);

      expect(errors.some((e) => e.type === 'narrative_multi_assigned')).toBe(true);
    });

    it('detects message declared by multiple authored modules', () => {
      const model: Model = {
        variant: 'specs',
        narratives: [],
        messages: [{ type: 'event', source: 'internal', name: 'SharedEvent', fields: [] }],
        modules: [
          {
            sourceFile: 'a.ts',
            isDerived: false,
            contains: { narrativeIds: [] },
            declares: { messages: [{ kind: 'event', name: 'SharedEvent' }] },
          },
          {
            sourceFile: 'b.ts',
            isDerived: false,
            contains: { narrativeIds: [] },
            declares: { messages: [{ kind: 'event', name: 'SharedEvent' }] },
          },
        ],
      };

      const errors = validateModules(model);

      expect(errors.some((e) => e.type === 'message_multi_declared')).toBe(true);
    });

    it('allows type duplication in derived modules', () => {
      const model: Model = {
        variant: 'specs',
        narratives: [],
        messages: [{ type: 'event', source: 'internal', name: 'SharedEvent', fields: [] }],
        modules: [
          {
            sourceFile: 'file1.ts',
            isDerived: true,
            contains: { narrativeIds: [] },
            declares: { messages: [{ kind: 'event', name: 'SharedEvent' }] },
          },
          {
            sourceFile: 'file2.ts',
            isDerived: true,
            contains: { narrativeIds: [] },
            declares: { messages: [{ kind: 'event', name: 'SharedEvent' }] },
          },
        ],
      };

      const errors = validateModules(model);

      expect(errors).toHaveLength(0);
    });

    it('returns no errors for empty modules array', () => {
      const model: Model = {
        variant: 'specs',
        narratives: [{ name: 'Test', id: 'test-1', slices: [] }],
        messages: [{ type: 'event', source: 'internal', name: 'TestEvent', fields: [] }],
        modules: [],
      };

      const errors = validateModules(model);

      expect(errors).toHaveLength(0);
    });

    it('detects narrative not found in model', () => {
      const model: Model = {
        variant: 'specs',
        narratives: [],
        messages: [],
        modules: [
          {
            sourceFile: 'a.ts',
            isDerived: false,
            contains: { narrativeIds: ['nonexistent-narrative'] },
            declares: { messages: [] },
          },
        ],
      };

      const errors = validateModules(model);

      expect(errors.some((e) => e.type === 'narrative_not_found')).toBe(true);
      expect(errors[0].message).toContain('nonexistent-narrative');
    });

    it('detects unassigned narratives', () => {
      const model: Model = {
        variant: 'specs',
        narratives: [{ name: 'Orphan', id: 'orphan-narrative', slices: [] }],
        messages: [],
        modules: [
          {
            sourceFile: 'a.ts',
            isDerived: false,
            contains: { narrativeIds: [] },
            declares: { messages: [] },
          },
        ],
      };

      const errors = validateModules(model);

      expect(errors.some((e) => e.type === 'narrative_unassigned')).toBe(true);
      expect(errors.find((e) => e.type === 'narrative_unassigned')!.message).toContain('orphan-narrative');
    });

    it('detects undeclared messages', () => {
      const model: Model = {
        variant: 'specs',
        narratives: [],
        messages: [{ type: 'event', source: 'internal', name: 'UndeclaredEvent', fields: [] }],
        modules: [
          {
            sourceFile: 'a.ts',
            isDerived: false,
            contains: { narrativeIds: [] },
            declares: { messages: [] },
          },
        ],
      };

      const errors = validateModules(model);

      expect(errors.some((e) => e.type === 'message_undeclared')).toBe(true);
      expect(errors.find((e) => e.type === 'message_undeclared')!.message).toContain('event:UndeclaredEvent');
    });

    it('throwOnValidationErrors throws when errors exist', () => {
      const errors = [{ type: 'duplicate_sourceFile' as const, message: 'Test error' }];

      expect(() => throwOnValidationErrors(errors)).toThrow('Module validation failed');
      expect(() => throwOnValidationErrors(errors)).toThrow('Test error');
    });

    it('throwOnValidationErrors does not throw for empty errors', () => {
      expect(() => throwOnValidationErrors([])).not.toThrow();
    });
  });

  describe('round-trip (model → narrative → model)', () => {
    it('generates separate files for each sourceFile in derived modules', async () => {
      const model: Model = {
        variant: 'specs',
        narratives: [
          {
            name: 'Orders',
            id: 'orders-flow',
            sourceFile: 'orders.narrative.ts',
            slices: [],
          },
          {
            name: 'Users',
            id: 'users-flow',
            sourceFile: 'users.narrative.ts',
            slices: [],
          },
        ],
        messages: [
          { type: 'command', name: 'CreateOrder', fields: [{ name: 'orderId', type: 'string', required: true }] },
          {
            type: 'event',
            source: 'internal',
            name: 'OrderCreated',
            fields: [{ name: 'orderId', type: 'string', required: true }],
          },
        ],
        integrations: [],
        modules: [
          {
            sourceFile: 'orders.narrative.ts',
            isDerived: true,
            contains: { narrativeIds: ['orders-flow'] },
            declares: {
              messages: [
                { kind: 'command', name: 'CreateOrder' },
                { kind: 'event', name: 'OrderCreated' },
              ],
            },
          },
          {
            sourceFile: 'users.narrative.ts',
            isDerived: true,
            contains: { narrativeIds: ['users-flow'] },
            declares: {
              messages: [
                { kind: 'command', name: 'CreateOrder' },
                { kind: 'event', name: 'OrderCreated' },
              ],
            },
          },
        ],
      };

      const result = await modelToNarrative(model);

      expect(result.files).toHaveLength(2);
      expect(result.files.map((f) => f.path).sort()).toEqual(['orders.narrative.ts', 'users.narrative.ts']);

      const ordersFile = result.files.find((f) => f.path === 'orders.narrative.ts');
      const usersFile = result.files.find((f) => f.path === 'users.narrative.ts');

      expect(ordersFile?.code).toContain("narrative('Orders'");
      expect(usersFile?.code).toContain("narrative('Users'");
    });

    it('duplicates types in each derived module file', async () => {
      const model: Model = {
        variant: 'specs',
        narratives: [
          { name: 'Flow A', id: 'flow-a', sourceFile: 'a.narrative.ts', slices: [] },
          { name: 'Flow B', id: 'flow-b', sourceFile: 'b.narrative.ts', slices: [] },
        ],
        messages: [
          {
            type: 'event',
            source: 'internal',
            name: 'SharedEvent',
            fields: [{ name: 'id', type: 'string', required: true }],
          },
        ],
        integrations: [],
        modules: [
          {
            sourceFile: 'a.narrative.ts',
            isDerived: true,
            contains: { narrativeIds: ['flow-a'] },
            declares: { messages: [{ kind: 'event', name: 'SharedEvent' }] },
          },
          {
            sourceFile: 'b.narrative.ts',
            isDerived: true,
            contains: { narrativeIds: ['flow-b'] },
            declares: { messages: [{ kind: 'event', name: 'SharedEvent' }] },
          },
        ],
      };

      const result = await modelToNarrative(model);

      for (const file of result.files) {
        expect(file.code).toContain('type SharedEvent = Event<');
      }
    });

    it('generates cross-module imports for authored modules', async () => {
      const model: Model = {
        variant: 'specs',
        narratives: [
          { name: 'Shared Types', id: 'shared-types', slices: [] },
          {
            name: 'Orders',
            id: 'orders-flow',
            slices: [
              {
                name: 'create order',
                type: 'command',
                client: { specs: [] },
                server: {
                  description: 'Creates an order',
                  specs: [
                    {
                      type: 'gherkin',
                      feature: 'Order Creation',
                      rules: [
                        {
                          name: 'Valid order',
                          examples: [
                            {
                              name: 'Creates order',
                              steps: [
                                { keyword: 'When', text: 'CreateOrder' },
                                { keyword: 'Then', text: 'OrderCreated' },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
            ],
          },
        ],
        messages: [
          { type: 'command', name: 'CreateOrder', fields: [{ name: 'id', type: 'string', required: true }] },
          {
            type: 'event',
            source: 'internal',
            name: 'OrderCreated',
            fields: [{ name: 'orderId', type: 'string', required: true }],
          },
        ],
        integrations: [],
        modules: [
          {
            sourceFile: 'shared/types.narrative.ts',
            isDerived: false,
            contains: { narrativeIds: ['shared-types'] },
            declares: { messages: [{ kind: 'event', name: 'OrderCreated' }] },
          },
          {
            sourceFile: 'features/orders.narrative.ts',
            isDerived: false,
            contains: { narrativeIds: ['orders-flow'] },
            declares: { messages: [{ kind: 'command', name: 'CreateOrder' }] },
          },
        ],
      };

      const result = await modelToNarrative(model);

      expect(result.files).toHaveLength(2);

      const ordersFile = result.files.find((f) => f.path.includes('orders'));
      expect(ordersFile).toBeDefined();
      expect(ordersFile!.code).toContain("import type { OrderCreated } from '../shared/types.narrative';");
      expect(ordersFile!.code).not.toContain('type OrderCreated = Event<');
    });
  });

  describe('file ordering', () => {
    it('sorts output files alphabetically by path', async () => {
      const model: Model = {
        variant: 'specs',
        narratives: [
          { name: 'Z', id: 'z', sourceFile: 'z.narrative.ts', slices: [] },
          { name: 'A', id: 'a', sourceFile: 'a.narrative.ts', slices: [] },
          { name: 'M', id: 'm', sourceFile: 'm.narrative.ts', slices: [] },
        ],
        messages: [],
        integrations: [],
        modules: [
          {
            sourceFile: 'z.narrative.ts',
            isDerived: true,
            contains: { narrativeIds: ['z'] },
            declares: { messages: [] },
          },
          {
            sourceFile: 'a.narrative.ts',
            isDerived: true,
            contains: { narrativeIds: ['a'] },
            declares: { messages: [] },
          },
          {
            sourceFile: 'm.narrative.ts',
            isDerived: true,
            contains: { narrativeIds: ['m'] },
            declares: { messages: [] },
          },
        ],
      };

      const result = await modelToNarrative(model);

      expect(result.files.map((f) => f.path)).toEqual(['a.narrative.ts', 'm.narrative.ts', 'z.narrative.ts']);
    });
  });
});
