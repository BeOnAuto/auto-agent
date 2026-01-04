import { describe, expect, it } from 'vitest';
import type { Model } from '../index';
import { addAutoIds } from './';

describe('addAutoIds', () => {
  const flows: Model = {
    variant: 'specs',
    narratives: [
      {
        name: 'Test Flow',
        slices: [
          {
            type: 'command',
            name: 'Test Command Slice',
            client: { specs: [] },
            server: {
              description: 'Test server',
              specs: [
                {
                  type: 'gherkin',
                  feature: 'Test Specs',
                  rules: [
                    {
                      name: 'Test rule without ID',
                      examples: [],
                    },
                    {
                      id: 'EXISTING-RULE-001',
                      name: 'Test rule with existing ID',
                      examples: [],
                    },
                  ],
                },
              ],
            },
          },
          {
            type: 'query',
            name: 'Test Query Slice',
            id: 'EXISTING-SLICE-001',
            client: { specs: [] },
            server: {
              description: 'Test server',
              specs: [
                {
                  type: 'gherkin',
                  feature: 'Test Specs',
                  rules: [],
                },
              ],
            },
          },
        ],
      },
      {
        name: 'Flow with ID',
        id: 'EXISTING-FLOW-001',
        slices: [
          {
            type: 'react',
            name: 'React Slice',
            server: {
              specs: [
                {
                  type: 'gherkin',
                  feature: 'React Specs',
                  rules: [
                    {
                      name: 'React rule',
                      examples: [],
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    ],
    messages: [],
    integrations: [],
    modules: [],
  };

  const AUTO_ID_REGEX = /^[A-Za-z0-9_]{9}$/;

  it('should assign IDs to entities that do not have them', () => {
    const result = addAutoIds(flows);

    expect(result.narratives[0].id).toMatch(AUTO_ID_REGEX);
    expect(result.narratives[1].id).toBe('EXISTING-FLOW-001');
    expect(result.narratives[0].slices[0].id).toMatch(AUTO_ID_REGEX);
    expect(result.narratives[0].slices[1].id).toBe('EXISTING-SLICE-001');
    expect(result.narratives[1].slices[0].id).toMatch(AUTO_ID_REGEX);
    const slice0 = result.narratives[0].slices[0];
    const slice1 = result.narratives[1].slices[0];

    if ('server' in slice0 && slice0.server?.specs != null && Array.isArray(slice0.server.specs)) {
      expect(slice0.server.specs[0].rules[0].id).toMatch(AUTO_ID_REGEX);
      expect(slice0.server.specs[0].rules[1].id).toBe('EXISTING-RULE-001');
    }

    if ('server' in slice1 && slice1.server?.specs != null && Array.isArray(slice1.server.specs)) {
      expect(slice1.server.specs[0].rules[0].id).toMatch(AUTO_ID_REGEX);
    }
  });

  it('should not mutate the original flows', () => {
    const originalFlow = flows.narratives[0];
    const originalSlice = originalFlow.slices[0];

    addAutoIds(flows);

    expect(originalFlow.id).toBeUndefined();
    expect(originalSlice.id).toBeUndefined();
    if (
      'server' in originalSlice &&
      originalSlice.server?.specs !== undefined &&
      Array.isArray(originalSlice.server.specs) &&
      originalSlice.server.specs.length > 0
    ) {
      expect(originalSlice.server.specs[0].rules[0].id).toBeUndefined();
    }
  });

  it('should preserve existing IDs and not overwrite them', () => {
    const result = addAutoIds(flows);

    expect(result.narratives[1].id).toBe('EXISTING-FLOW-001');
    expect(result.narratives[0].slices[1].id).toBe('EXISTING-SLICE-001');

    const testSlice = result.narratives[0].slices[0];
    if ('server' in testSlice && testSlice.server?.specs != null && Array.isArray(testSlice.server.specs)) {
      expect(testSlice.server.specs[0].rules[1].id).toBe('EXISTING-RULE-001');
    }
  });

  it('should handle flows without server blocks', () => {
    const modelWithoutServer: Model = {
      variant: 'specs',
      narratives: [
        {
          name: 'Simple Flow',
          slices: [
            {
              type: 'command',
              name: 'Simple Command',
              client: { specs: [] },
              server: {
                description: 'Simple server',
                specs: [
                  {
                    type: 'gherkin',
                    feature: 'Simple specs',
                    rules: [],
                  },
                ],
              },
            },
          ],
        },
      ],
      messages: [],
      integrations: [],
      modules: [],
    };

    const result = addAutoIds(modelWithoutServer);

    expect(result.narratives[0].id).toMatch(AUTO_ID_REGEX);
    expect(result.narratives[0].slices[0].id).toMatch(AUTO_ID_REGEX);
  });

  it('should generate unique IDs for multiple calls', () => {
    const result1 = addAutoIds(flows);
    const result2 = addAutoIds(flows);

    expect(result1.narratives[0].id).not.toBe(result2.narratives[0].id);
    expect(result1.narratives[0].slices[0].id).not.toBe(result2.narratives[0].slices[0].id);
  });

  it('should assign IDs to experience slices', () => {
    const modelWithExperienceSlice: Model = {
      variant: 'specs',
      narratives: [
        {
          name: 'Experience Flow',
          slices: [
            {
              type: 'experience',
              name: 'User Onboarding Experience',
              client: {
                specs: [
                  { type: 'it', title: 'User should see welcome message' },
                  { type: 'it', title: 'User should complete profile setup' },
                ],
              },
            },
            {
              type: 'experience',
              name: 'Checkout Experience',
              id: 'EXISTING-EXPERIENCE-SLICE-001',
              client: {
                specs: [{ type: 'it', title: 'User should review cart items' }],
              },
            },
          ],
        },
      ],
      messages: [],
      integrations: [],
      modules: [],
    };

    const result = addAutoIds(modelWithExperienceSlice);

    expect(result.narratives[0].id).toMatch(AUTO_ID_REGEX);
    expect(result.narratives[0].slices[0].id).toMatch(AUTO_ID_REGEX);
    expect(result.narratives[0].slices[1].id).toBe('EXISTING-EXPERIENCE-SLICE-001');
  });

  it('should assign unique IDs to multiple flows with same sourceFile', () => {
    const modelWithMultipleFlowsSameSource: Model = {
      variant: 'specs',
      narratives: [
        {
          name: 'Home Screen',
          sourceFile: '/path/to/homepage.narrative.ts',
          slices: [
            {
              name: 'Active Surveys Summary',
              type: 'experience',
              client: {
                specs: [{ type: 'it', title: 'show active surveys summary' }],
              },
            },
          ],
        },
        {
          name: 'Create Survey',
          sourceFile: '/path/to/homepage.narrative.ts',
          slices: [
            {
              name: 'Create Survey Form',
              type: 'experience',
              client: {
                specs: [{ type: 'it', title: 'allow entering survey title' }],
              },
            },
          ],
        },
        {
          name: 'Response Analytics',
          sourceFile: '/path/to/homepage.narrative.ts',
          slices: [
            {
              name: 'Response Rate Charts',
              type: 'experience',
              client: {
                specs: [{ type: 'it', title: 'show daily response rate charts' }],
              },
            },
          ],
        },
      ],
      messages: [],
      integrations: [],
      modules: [],
    };

    const result = addAutoIds(modelWithMultipleFlowsSameSource);

    expect(result.narratives[0].id).toMatch(AUTO_ID_REGEX);
    expect(result.narratives[1].id).toMatch(AUTO_ID_REGEX);
    expect(result.narratives[2].id).toMatch(AUTO_ID_REGEX);

    expect(result.narratives[0].id).not.toBe(result.narratives[1].id);
    expect(result.narratives[0].id).not.toBe(result.narratives[2].id);
    expect(result.narratives[1].id).not.toBe(result.narratives[2].id);

    expect(result.narratives[0].slices[0].id).toMatch(AUTO_ID_REGEX);
    expect(result.narratives[1].slices[0].id).toMatch(AUTO_ID_REGEX);
    expect(result.narratives[2].slices[0].id).toMatch(AUTO_ID_REGEX);

    expect(result.narratives[0].slices[0].id).not.toBe(result.narratives[1].slices[0].id);
    expect(result.narratives[0].slices[0].id).not.toBe(result.narratives[2].slices[0].id);
    expect(result.narratives[1].slices[0].id).not.toBe(result.narratives[2].slices[0].id);

    expect(result.narratives[0].sourceFile).toBe('/path/to/homepage.narrative.ts');
    expect(result.narratives[1].sourceFile).toBe('/path/to/homepage.narrative.ts');
    expect(result.narratives[2].sourceFile).toBe('/path/to/homepage.narrative.ts');
  });

  it('should assign IDs to specs', () => {
    const modelWithSpecs: Model = {
      variant: 'specs',
      narratives: [
        {
          name: 'Test Flow',
          slices: [
            {
              type: 'command',
              name: 'Test Command',
              client: { specs: [] },
              server: {
                description: 'Test server',
                specs: [
                  {
                    type: 'gherkin',
                    feature: 'Test Feature',
                    rules: [],
                  },
                  {
                    id: 'EXISTING-SPEC-001',
                    type: 'gherkin',
                    feature: 'Existing Feature',
                    rules: [],
                  },
                ],
              },
            },
          ],
        },
      ],
      messages: [],
      integrations: [],
      modules: [],
    };

    const result = addAutoIds(modelWithSpecs);
    const slice = result.narratives[0].slices[0];

    if ('server' in slice && slice.server?.specs != null && Array.isArray(slice.server.specs)) {
      expect(slice.server.specs[0].id).toMatch(AUTO_ID_REGEX);
      expect(slice.server.specs[1].id).toBe('EXISTING-SPEC-001');
    }
  });

  it('should assign IDs to steps', () => {
    const modelWithSteps: Model = {
      variant: 'specs',
      narratives: [
        {
          name: 'Test Flow',
          slices: [
            {
              type: 'command',
              name: 'Test Command',
              client: { specs: [] },
              server: {
                description: 'Test server',
                specs: [
                  {
                    type: 'gherkin',
                    feature: 'Test Feature',
                    rules: [
                      {
                        name: 'Test Rule',
                        examples: [
                          {
                            name: 'Test Example',
                            steps: [
                              { keyword: 'Given', text: 'TestState', docString: { value: 'test' } },
                              { keyword: 'When', text: 'TestCommand' },
                              { id: 'EXISTING-STEP-001', keyword: 'Then', text: 'TestEvent' },
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
      messages: [],
      integrations: [],
      modules: [],
    };

    const result = addAutoIds(modelWithSteps);
    const slice = result.narratives[0].slices[0];

    if ('server' in slice && slice.server?.specs != null && Array.isArray(slice.server.specs)) {
      const steps = slice.server.specs[0].rules[0].examples[0].steps;
      expect(steps[0].id).toMatch(AUTO_ID_REGEX);
      expect(steps[1].id).toMatch(AUTO_ID_REGEX);
      expect(steps[2].id).toBe('EXISTING-STEP-001');
    }
  });

  it('should preserve existing example IDs', () => {
    const modelWithExistingExampleId: Model = {
      variant: 'specs',
      narratives: [
        {
          name: 'Test Flow',
          slices: [
            {
              type: 'command',
              name: 'Test Command',
              client: { specs: [] },
              server: {
                description: 'Test server',
                specs: [
                  {
                    type: 'gherkin',
                    feature: 'Test Feature',
                    rules: [
                      {
                        name: 'Test Rule',
                        examples: [
                          {
                            name: 'Example without id',
                            steps: [{ keyword: 'Given', text: 'TestState' }],
                          },
                          {
                            id: 'EXISTING-EXAMPLE-001',
                            name: 'Example with existing id',
                            steps: [{ keyword: 'Given', text: 'TestState' }],
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
      messages: [],
      integrations: [],
      modules: [],
    };

    const result = addAutoIds(modelWithExistingExampleId);
    const slice = result.narratives[0].slices[0];

    if ('server' in slice && slice.server?.specs != null && Array.isArray(slice.server.specs)) {
      const examples = slice.server.specs[0].rules[0].examples;
      expect(examples[0].id).toMatch(AUTO_ID_REGEX);
      expect(examples[1].id).toBe('EXISTING-EXAMPLE-001');
    }
  });

  it('should assign IDs to steps with errors', () => {
    const modelWithErrorSteps: Model = {
      variant: 'specs',
      narratives: [
        {
          name: 'Test Flow',
          slices: [
            {
              type: 'command',
              name: 'Test Command',
              client: { specs: [] },
              server: {
                description: 'Test server',
                specs: [
                  {
                    type: 'gherkin',
                    feature: 'Test Feature',
                    rules: [
                      {
                        name: 'Error Rule',
                        examples: [
                          {
                            name: 'Error Example',
                            steps: [
                              { keyword: 'Given', text: 'TestState' },
                              { keyword: 'When', text: 'InvalidCommand' },
                              { keyword: 'Then', error: { type: 'ValidationError', message: 'Invalid input' } },
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
      messages: [],
      integrations: [],
      modules: [],
    };

    const result = addAutoIds(modelWithErrorSteps);
    const slice = result.narratives[0].slices[0];

    if ('server' in slice && slice.server?.specs != null && Array.isArray(slice.server.specs)) {
      const steps = slice.server.specs[0].rules[0].examples[0].steps;
      expect(steps[0].id).toMatch(AUTO_ID_REGEX);
      expect(steps[1].id).toMatch(AUTO_ID_REGEX);
      expect(steps[2].id).toMatch(AUTO_ID_REGEX);
    }
  });

  it('should assign IDs to client it specs', () => {
    const modelWithClientSpecs: Model = {
      variant: 'specs',
      narratives: [
        {
          name: 'Test Flow',
          slices: [
            {
              type: 'experience',
              name: 'Test Experience',
              client: {
                specs: [
                  { type: 'it', title: 'first test' },
                  { type: 'it', id: 'EXISTING-IT-001', title: 'second test with id' },
                ],
              },
            },
          ],
        },
      ],
      messages: [],
      integrations: [],
      modules: [],
    };

    const result = addAutoIds(modelWithClientSpecs);
    const slice = result.narratives[0].slices[0];

    if ('client' in slice && slice.client?.specs != null) {
      expect(slice.client.specs[0].id).toMatch(AUTO_ID_REGEX);
      expect(slice.client.specs[1].id).toBe('EXISTING-IT-001');
    }
  });

  it('should assign IDs to client describe specs', () => {
    const modelWithDescribe: Model = {
      variant: 'specs',
      narratives: [
        {
          name: 'Test Flow',
          slices: [
            {
              type: 'experience',
              name: 'Test Experience',
              client: {
                specs: [
                  {
                    type: 'describe',
                    title: 'describe without id',
                    children: [{ type: 'it', title: 'nested it' }],
                  },
                  {
                    type: 'describe',
                    id: 'EXISTING-DESC-001',
                    title: 'describe with id',
                    children: [],
                  },
                ],
              },
            },
          ],
        },
      ],
      messages: [],
      integrations: [],
      modules: [],
    };

    const result = addAutoIds(modelWithDescribe);
    const slice = result.narratives[0].slices[0];

    if ('client' in slice && slice.client?.specs != null) {
      expect(slice.client.specs[0].id).toMatch(AUTO_ID_REGEX);
      expect(slice.client.specs[1].id).toBe('EXISTING-DESC-001');
    }
  });

  it('should assign IDs to nested client specs', () => {
    const modelWithNestedSpecs: Model = {
      variant: 'specs',
      narratives: [
        {
          name: 'Test Flow',
          slices: [
            {
              type: 'experience',
              name: 'Test Experience',
              client: {
                specs: [
                  {
                    type: 'describe',
                    title: 'outer describe',
                    children: [
                      { type: 'it', title: 'outer it' },
                      {
                        type: 'describe',
                        title: 'inner describe',
                        children: [
                          { type: 'it', title: 'inner it 1' },
                          { type: 'it', title: 'inner it 2' },
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
      messages: [],
      integrations: [],
      modules: [],
    };

    const result = addAutoIds(modelWithNestedSpecs);
    const slice = result.narratives[0].slices[0];

    if ('client' in slice && slice.client?.specs != null) {
      const outerDescribe = slice.client.specs[0];
      expect(outerDescribe.id).toMatch(AUTO_ID_REGEX);

      if (outerDescribe.type === 'describe' && outerDescribe.children) {
        expect(outerDescribe.children[0].id).toMatch(AUTO_ID_REGEX);

        const innerDescribe = outerDescribe.children[1];
        expect(innerDescribe.id).toMatch(AUTO_ID_REGEX);

        if (innerDescribe.type === 'describe' && innerDescribe.children) {
          expect(innerDescribe.children[0].id).toMatch(AUTO_ID_REGEX);
          expect(innerDescribe.children[1].id).toMatch(AUTO_ID_REGEX);

          expect(innerDescribe.children[0].id).not.toBe(innerDescribe.children[1].id);
        }
      }
    }
  });

  it('should not mutate original client specs', () => {
    const modelWithClientSpecs: Model = {
      variant: 'specs',
      narratives: [
        {
          name: 'Test Flow',
          slices: [
            {
              type: 'experience',
              name: 'Test Experience',
              client: {
                specs: [{ type: 'it', title: 'test' }],
              },
            },
          ],
        },
      ],
      messages: [],
      integrations: [],
      modules: [],
    };

    const originalSpec = modelWithClientSpecs.narratives[0].slices[0];
    addAutoIds(modelWithClientSpecs);

    if ('client' in originalSpec && originalSpec.client?.specs != null) {
      expect(originalSpec.client.specs[0].id).toBeUndefined();
    }
  });

  describe('module ID generation', () => {
    const AUTO_ID_REGEX = /^[A-Za-z0-9_]{9}$/;

    it('should assign ID to derived module equal to sourceFile', () => {
      const model: Model = {
        variant: 'specs',
        narratives: [],
        messages: [],
        integrations: [],
        modules: [
          {
            id: '',
            sourceFile: 'orders.narrative.ts',
            isDerived: true,
            contains: { narrativeIds: [] },
            declares: { messages: [] },
          },
        ],
      };

      const result = addAutoIds(model);

      expect(result.modules[0].id).toBe('orders.narrative.ts');
    });

    it('should generate auto ID for authored module without ID', () => {
      const model: Model = {
        variant: 'specs',
        narratives: [],
        messages: [],
        integrations: [],
        modules: [
          {
            id: '',
            sourceFile: 'features/orders.ts',
            isDerived: false,
            contains: { narrativeIds: [] },
            declares: { messages: [] },
          },
        ],
      };

      const result = addAutoIds(model);

      expect(result.modules[0].id).toMatch(AUTO_ID_REGEX);
    });

    it('should preserve existing ID for authored module', () => {
      const model: Model = {
        variant: 'specs',
        narratives: [],
        messages: [],
        integrations: [],
        modules: [
          {
            id: 'EXISTING-MODULE-001',
            sourceFile: 'features/orders.ts',
            isDerived: false,
            contains: { narrativeIds: [] },
            declares: { messages: [] },
          },
        ],
      };

      const result = addAutoIds(model);

      expect(result.modules[0].id).toBe('EXISTING-MODULE-001');
    });

    it('should not mutate original modules', () => {
      const model: Model = {
        variant: 'specs',
        narratives: [],
        messages: [],
        integrations: [],
        modules: [
          {
            id: '',
            sourceFile: 'test.ts',
            isDerived: false,
            contains: { narrativeIds: [] },
            declares: { messages: [] },
          },
        ],
      };

      const originalId = model.modules[0].id;
      addAutoIds(model);

      expect(model.modules[0].id).toBe(originalId);
    });

    it('should generate unique IDs for multiple authored modules', () => {
      const model: Model = {
        variant: 'specs',
        narratives: [],
        messages: [],
        integrations: [],
        modules: [
          {
            id: '',
            sourceFile: 'orders.ts',
            isDerived: false,
            contains: { narrativeIds: [] },
            declares: { messages: [] },
          },
          {
            id: '',
            sourceFile: 'users.ts',
            isDerived: false,
            contains: { narrativeIds: [] },
            declares: { messages: [] },
          },
        ],
      };

      const result = addAutoIds(model);

      expect(result.modules[0].id).toMatch(AUTO_ID_REGEX);
      expect(result.modules[1].id).toMatch(AUTO_ID_REGEX);
      expect(result.modules[0].id).not.toBe(result.modules[1].id);
    });

    it('should handle mixed derived and authored modules', () => {
      const model: Model = {
        variant: 'specs',
        narratives: [],
        messages: [],
        integrations: [],
        modules: [
          {
            id: '',
            sourceFile: 'derived.narrative.ts',
            isDerived: true,
            contains: { narrativeIds: [] },
            declares: { messages: [] },
          },
          {
            id: '',
            sourceFile: 'authored.ts',
            isDerived: false,
            contains: { narrativeIds: [] },
            declares: { messages: [] },
          },
        ],
      };

      const result = addAutoIds(model);

      expect(result.modules[0].id).toBe('derived.narrative.ts');
      expect(result.modules[1].id).toMatch(AUTO_ID_REGEX);
    });

    it('should handle empty modules array', () => {
      const model: Model = {
        variant: 'specs',
        narratives: [],
        messages: [],
        integrations: [],
        modules: [],
      };

      const result = addAutoIds(model);

      expect(result.modules).toEqual([]);
    });
  });
});
