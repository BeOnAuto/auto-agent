import { describe, expect, it } from 'vitest';
import type { Model } from '../../index';
import {
  computeAllCrossModuleDependencies,
  computeCrossModuleImports,
  resolveRelativeImport,
} from './cross-module-imports';

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
          sourceFile: 'shared/types.ts',
          isDerived: false,
          contains: { narrativeIds: ['shared-1'] },
          declares: { messages: [{ kind: 'event', name: 'SharedEvent' }] },
        },
        {
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
          sourceFile: 'derived.ts',
          isDerived: true,
          contains: { narrativeIds: [] },
          declares: { messages: [{ kind: 'event', name: 'DerivedEvent' }] },
        },
        {
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
          sourceFile: 'z-types.ts',
          isDerived: false,
          contains: { narrativeIds: ['types-1'] },
          declares: { messages: [{ kind: 'event', name: 'ZEvent' }] },
        },
        {
          sourceFile: 'a-types.ts',
          isDerived: false,
          contains: { narrativeIds: ['types-2'] },
          declares: { messages: [{ kind: 'event', name: 'AEvent' }] },
        },
        {
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

describe('computeAllCrossModuleDependencies', () => {
  it('returns empty maps when no cross-module imports exist', () => {
    const model: Model = {
      variant: 'specs',
      narratives: [{ name: 'Test', id: 'test-1', slices: [] }],
      messages: [{ type: 'event', source: 'internal', name: 'LocalEvent', fields: [] }],
      integrations: [],
      modules: [
        {
          sourceFile: 'self-contained.ts',
          isDerived: false,
          contains: { narrativeIds: ['test-1'] },
          declares: { messages: [{ kind: 'event', name: 'LocalEvent' }] },
        },
      ],
    };

    const { importsPerModule, exportsPerModule } = computeAllCrossModuleDependencies(model.modules, model);

    expect(importsPerModule.get('self-contained.ts')).toEqual([]);
    expect(exportsPerModule.size).toBe(0);
  });

  it('computes imports and exports in a single pass', () => {
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
          sourceFile: 'shared/types.ts',
          isDerived: false,
          contains: { narrativeIds: ['shared-1'] },
          declares: { messages: [{ kind: 'event', name: 'SharedEvent' }] },
        },
        {
          sourceFile: 'features/consumer.ts',
          isDerived: false,
          contains: { narrativeIds: ['consumer-1'] },
          declares: { messages: [] },
        },
      ],
    };

    const { importsPerModule, exportsPerModule } = computeAllCrossModuleDependencies(model.modules, model);

    // Consumer should import SharedEvent
    expect(importsPerModule.get('features/consumer.ts')).toEqual([
      { fromPath: '../shared/types', typeNames: ['SharedEvent'] },
    ]);

    // Shared module should export SharedEvent
    expect(exportsPerModule.get('shared/types.ts')).toEqual(new Set(['SharedEvent']));
    expect(exportsPerModule.has('features/consumer.ts')).toBe(false);
  });

  it('aggregates exports from multiple importing modules', () => {
    const model: Model = {
      variant: 'specs',
      narratives: [
        { name: 'Shared', id: 'shared-1', slices: [] },
        {
          name: 'Consumer1',
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
                        examples: [{ name: 'ex', steps: [{ keyword: 'Then', text: 'EventA' }] }],
                      },
                    ],
                  },
                ],
              },
            },
          ],
        },
        {
          name: 'Consumer2',
          id: 'consumer-2',
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
                        examples: [{ name: 'ex', steps: [{ keyword: 'Then', text: 'EventB' }] }],
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
          sourceFile: 'consumer1.ts',
          isDerived: false,
          contains: { narrativeIds: ['consumer-1'] },
          declares: { messages: [] },
        },
        {
          sourceFile: 'consumer2.ts',
          isDerived: false,
          contains: { narrativeIds: ['consumer-2'] },
          declares: { messages: [] },
        },
      ],
    };

    const { exportsPerModule } = computeAllCrossModuleDependencies(model.modules, model);

    expect(exportsPerModule.get('shared.ts')).toEqual(new Set(['EventA', 'EventB']));
  });
});
