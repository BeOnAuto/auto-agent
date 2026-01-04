import { describe, expect, it } from 'vitest';
import type { Model } from '../../index';
import { computeCrossModuleImports, resolveRelativeImport } from './cross-module-imports';

describe('resolveRelativeImport', () => {
  it('resolves same directory imports', () => {
    const result = resolveRelativeImport('src/orders.ts', 'src/types.ts');

    expect(result).toBe('./types');
  });

  it('resolves parent directory imports with ../', () => {
    const result = resolveRelativeImport('src/features/orders.ts', 'src/shared/types.ts');

    expect(result).toBe('../shared/types');
  });

  it('resolves deeply nested imports', () => {
    const result = resolveRelativeImport('src/a/b/c/file.ts', 'src/x/y/target.ts');

    expect(result).toBe('../../../x/y/target');
  });

  it('strips file extension from target', () => {
    const result = resolveRelativeImport('src/orders.narrative.ts', 'src/types.narrative.ts');

    expect(result).toBe('./types.narrative');
  });

  it('resolves from child to parent directory', () => {
    const result = resolveRelativeImport('src/features/orders.ts', 'src/types.ts');

    expect(result).toBe('../types');
  });

  it('resolves from root to nested directory', () => {
    const result = resolveRelativeImport('index.ts', 'src/types.ts');

    expect(result).toBe('./src/types');
  });
});

describe('computeCrossModuleImports', () => {
  it('returns empty array for derived modules', () => {
    const model: Model = {
      variant: 'specs',
      narratives: [],
      messages: [],
      integrations: [],
      modules: [
        {
          id: 'derived.ts',
          sourceFile: 'derived.ts',
          isDerived: true,
          contains: { narrativeIds: [] },
          declares: { messages: [] },
        },
      ],
    };

    const imports = computeCrossModuleImports(model.modules[0], model.modules, model);

    expect(imports).toEqual([]);
  });

  it('returns empty array when module declares all needed types', () => {
    const model: Model = {
      variant: 'specs',
      narratives: [
        {
          name: 'Test',
          id: 'test-1',
          slices: [
            {
              name: 'test',
              type: 'command',
              client: { specs: [] },
              server: {
                description: 'Test',
                specs: [
                  {
                    type: 'gherkin',
                    feature: 'Test',
                    rules: [
                      {
                        name: 'rule',
                        examples: [
                          {
                            name: 'example',
                            steps: [{ keyword: 'When', text: 'DoSomething' }],
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
      messages: [{ type: 'command', name: 'DoSomething', fields: [] }],
      integrations: [],
      modules: [
        {
          id: 'self-contained',
          sourceFile: 'self-contained.ts',
          isDerived: false,
          contains: { narrativeIds: ['test-1'] },
          declares: { messages: [{ kind: 'command', name: 'DoSomething' }] },
        },
      ],
    };

    const imports = computeCrossModuleImports(model.modules[0], model.modules, model);

    expect(imports).toEqual([]);
  });

  it('returns empty array when needed type is not declared by any module', () => {
    const model: Model = {
      variant: 'specs',
      narratives: [
        {
          name: 'Test',
          id: 'test-1',
          slices: [
            {
              name: 'test',
              type: 'command',
              client: { specs: [] },
              server: {
                description: 'Test',
                specs: [
                  {
                    type: 'gherkin',
                    feature: 'Test',
                    rules: [
                      {
                        name: 'rule',
                        examples: [
                          {
                            name: 'example',
                            steps: [{ keyword: 'When', text: 'MissingCommand' }],
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
      messages: [{ type: 'command', name: 'MissingCommand', fields: [] }],
      integrations: [],
      modules: [
        {
          id: 'consumer',
          sourceFile: 'consumer.ts',
          isDerived: false,
          contains: { narrativeIds: ['test-1'] },
          declares: { messages: [] },
        },
      ],
    };

    const imports = computeCrossModuleImports(model.modules[0], model.modules, model);

    expect(imports).toEqual([]);
  });

  it('generates import when type is declared by another authored module', () => {
    const model: Model = {
      variant: 'specs',
      narratives: [
        { name: 'Shared', id: 'shared-1', slices: [] },
        {
          name: 'Consumer',
          id: 'consumer-1',
          slices: [
            {
              name: 'test',
              type: 'command',
              client: { specs: [] },
              server: {
                description: 'Test',
                specs: [
                  {
                    type: 'gherkin',
                    feature: 'Test',
                    rules: [
                      {
                        name: 'rule',
                        examples: [
                          {
                            name: 'example',
                            steps: [{ keyword: 'Then', text: 'SharedEvent' }],
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
      messages: [{ type: 'event', source: 'internal', name: 'SharedEvent', fields: [] }],
      integrations: [],
      modules: [
        {
          id: 'shared',
          sourceFile: 'shared/types.ts',
          isDerived: false,
          contains: { narrativeIds: ['shared-1'] },
          declares: { messages: [{ kind: 'event', name: 'SharedEvent' }] },
        },
        {
          id: 'consumer',
          sourceFile: 'features/consumer.ts',
          isDerived: false,
          contains: { narrativeIds: ['consumer-1'] },
          declares: { messages: [] },
        },
      ],
    };

    const consumerModule = model.modules[1];
    const imports = computeCrossModuleImports(consumerModule, model.modules, model);

    expect(imports).toEqual([{ fromPath: '../shared/types', typeNames: ['SharedEvent'] }]);
  });

  it('groups multiple types from same module into single import', () => {
    const model: Model = {
      variant: 'specs',
      narratives: [
        { name: 'Shared', id: 'shared-1', slices: [] },
        {
          name: 'Consumer',
          id: 'consumer-1',
          slices: [
            {
              name: 'test',
              type: 'command',
              client: { specs: [] },
              server: {
                description: 'Test',
                specs: [
                  {
                    type: 'gherkin',
                    feature: 'Test',
                    rules: [
                      {
                        name: 'rule',
                        examples: [
                          {
                            name: 'example',
                            steps: [
                              { keyword: 'Given', text: 'EventA' },
                              { keyword: 'Then', text: 'EventB' },
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
        { type: 'event', source: 'internal', name: 'EventA', fields: [] },
        { type: 'event', source: 'internal', name: 'EventB', fields: [] },
      ],
      integrations: [],
      modules: [
        {
          id: 'shared',
          sourceFile: 'shared.ts',
          isDerived: false,
          contains: { narrativeIds: ['shared-1'] },
          declares: {
            messages: [
              { kind: 'event', name: 'EventA' },
              { kind: 'event', name: 'EventB' },
            ],
          },
        },
        {
          id: 'consumer',
          sourceFile: 'consumer.ts',
          isDerived: false,
          contains: { narrativeIds: ['consumer-1'] },
          declares: { messages: [] },
        },
      ],
    };

    const consumerModule = model.modules[1];
    const imports = computeCrossModuleImports(consumerModule, model.modules, model);

    expect(imports).toHaveLength(1);
    expect(imports[0].typeNames.sort()).toEqual(['EventA', 'EventB']);
  });

  it('ignores types declared by derived modules', () => {
    const model: Model = {
      variant: 'specs',
      narratives: [
        {
          name: 'Consumer',
          id: 'consumer-1',
          slices: [
            {
              name: 'test',
              type: 'command',
              client: { specs: [] },
              server: {
                description: 'Test',
                specs: [
                  {
                    type: 'gherkin',
                    feature: 'Test',
                    rules: [
                      {
                        name: 'rule',
                        examples: [
                          {
                            name: 'example',
                            steps: [{ keyword: 'Then', text: 'DerivedEvent' }],
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
      messages: [{ type: 'event', source: 'internal', name: 'DerivedEvent', fields: [] }],
      integrations: [],
      modules: [
        {
          id: 'derived.ts',
          sourceFile: 'derived.ts',
          isDerived: true,
          contains: { narrativeIds: [] },
          declares: { messages: [{ kind: 'event', name: 'DerivedEvent' }] },
        },
        {
          id: 'consumer',
          sourceFile: 'consumer.ts',
          isDerived: false,
          contains: { narrativeIds: ['consumer-1'] },
          declares: { messages: [] },
        },
      ],
    };

    const consumerModule = model.modules[1];
    const imports = computeCrossModuleImports(consumerModule, model.modules, model);

    expect(imports).toEqual([]);
  });

  it('sorts imports by source path', () => {
    const model: Model = {
      variant: 'specs',
      narratives: [
        { name: 'Types1', id: 'types-1', slices: [] },
        { name: 'Types2', id: 'types-2', slices: [] },
        {
          name: 'Consumer',
          id: 'consumer-1',
          slices: [
            {
              name: 'test',
              type: 'command',
              client: { specs: [] },
              server: {
                description: 'Test',
                specs: [
                  {
                    type: 'gherkin',
                    feature: 'Test',
                    rules: [
                      {
                        name: 'rule',
                        examples: [
                          {
                            name: 'example',
                            steps: [
                              { keyword: 'Given', text: 'ZEvent' },
                              { keyword: 'Then', text: 'AEvent' },
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
        { type: 'event', source: 'internal', name: 'ZEvent', fields: [] },
        { type: 'event', source: 'internal', name: 'AEvent', fields: [] },
      ],
      integrations: [],
      modules: [
        {
          id: 'z-types',
          sourceFile: 'z-types.ts',
          isDerived: false,
          contains: { narrativeIds: ['types-1'] },
          declares: { messages: [{ kind: 'event', name: 'ZEvent' }] },
        },
        {
          id: 'a-types',
          sourceFile: 'a-types.ts',
          isDerived: false,
          contains: { narrativeIds: ['types-2'] },
          declares: { messages: [{ kind: 'event', name: 'AEvent' }] },
        },
        {
          id: 'consumer',
          sourceFile: 'consumer.ts',
          isDerived: false,
          contains: { narrativeIds: ['consumer-1'] },
          declares: { messages: [] },
        },
      ],
    };

    const consumerModule = model.modules[2];
    const imports = computeCrossModuleImports(consumerModule, model.modules, model);

    expect(imports.map((i) => i.fromPath)).toEqual(['./a-types', './z-types']);
  });
});
