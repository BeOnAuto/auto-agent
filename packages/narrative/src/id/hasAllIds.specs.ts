import { describe, expect, it } from 'vitest';
import type { Model } from '../index';
import { addAutoIds, hasAllIds } from './index';

describe('hasAllIds', () => {
  const createModelWithoutIds = (): Model => ({
    variant: 'specs',
    narratives: [
      {
        name: 'Test Flow Without IDs',
        slices: [
          {
            type: 'command',
            name: 'Test slice without ID',
            client: { specs: [] },
            server: {
              description: 'Test server',
              specs: [
                {
                  type: 'gherkin',
                  feature: 'Test specs',
                  rules: [
                    {
                      name: 'Test rule without ID',
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
  });

  const createModelWithIds = (): Model => ({
    variant: 'specs',
    narratives: [
      {
        name: 'Test Flow with IDs',
        id: 'FLOW-001',
        slices: [
          {
            type: 'command',
            name: 'Test slice with ID',
            id: 'SLICE-001',
            client: { specs: [] },
            server: {
              description: 'Test server',
              specs: [
                {
                  id: 'SPEC-001',
                  type: 'gherkin',
                  feature: 'Test specs',
                  rules: [
                    {
                      id: 'RULE-001',
                      name: 'Test rule with ID',
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
  });

  const createModelWithFullIds = (): Model => ({
    variant: 'specs',
    narratives: [
      {
        name: 'Test Flow with Full IDs',
        id: 'FLOW-001',
        slices: [
          {
            type: 'command',
            name: 'Test slice with ID',
            id: 'SLICE-001',
            client: { specs: [] },
            server: {
              description: 'Test server',
              specs: [
                {
                  id: 'SPEC-001',
                  type: 'gherkin',
                  feature: 'Test specs',
                  rules: [
                    {
                      id: 'RULE-001',
                      name: 'Test rule with ID',
                      examples: [
                        {
                          id: 'EXAMPLE-001',
                          name: 'Test example',
                          steps: [
                            {
                              id: 'STEP-001',
                              keyword: 'Given',
                              text: 'TestState',
                              docString: { value: 'test' },
                            },
                            {
                              id: 'STEP-002',
                              keyword: 'When',
                              text: 'TestCommand',
                            },
                            {
                              id: 'STEP-003',
                              keyword: 'Then',
                              text: 'TestEvent',
                            },
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
  });

  const createMultipleFlowsModel = (includeAllIds: boolean, includeAllSliceIds: boolean): Model => ({
    variant: 'specs',
    narratives: [
      {
        name: 'Home Screen',
        id: 'aifPcU3hw',
        sourceFile: '/path/to/homepage.narrative.ts',
        slices: [
          {
            name: 'Active Surveys Summary',
            id: 'slice1',
            type: 'experience',
            client: { specs: [{ type: 'it', id: 'it1', title: 'show active surveys summary' }] },
          },
        ],
      },
      {
        name: 'Create Survey',
        id: includeAllIds ? 'MPviTMrQC' : undefined,
        sourceFile: '/path/to/homepage.narrative.ts',
        slices: [
          {
            name: 'Create Survey Form',
            id: includeAllSliceIds ? 'slice2' : undefined,
            type: 'experience',
            client: { specs: [{ type: 'it', id: 'it2', title: 'allow entering survey title' }] },
          },
        ],
      },
      {
        name: 'Response Analytics',
        id: 'eME978Euk',
        sourceFile: '/path/to/homepage.narrative.ts',
        slices: [
          {
            name: 'Response Rate Charts',
            id: 'slice3',
            type: 'experience',
            client: { specs: [{ type: 'it', id: 'it3', title: 'show daily response rate charts' }] },
          },
        ],
      },
    ],
    messages: [],
    integrations: [],
    modules: [],
  });

  it('should return false for models without IDs', () => {
    const model = createModelWithoutIds();
    expect(hasAllIds(model)).toBe(false);
  });

  it('should return true for models with complete IDs', () => {
    const model = createModelWithoutIds();
    const modelWithIds = addAutoIds(model);
    expect(hasAllIds(modelWithIds)).toBe(true);
  });

  it('should return true for flows that already have IDs', () => {
    const model = createModelWithIds();
    expect(hasAllIds(model)).toBe(true);
  });

  it('should return false if any slice is missing an ID', () => {
    const model = createModelWithIds();
    const modifiedModel = structuredClone(model);
    modifiedModel.narratives[0].slices[0].id = '';
    expect(hasAllIds(modifiedModel)).toBe(false);
  });

  it('should return false if any rule is missing an ID', () => {
    const model = createModelWithIds();
    const modifiedModel = structuredClone(model);
    const slice = modifiedModel.narratives[0].slices[0];
    if ('server' in slice && slice.server?.specs !== undefined && Array.isArray(slice.server.specs)) {
      slice.server.specs[0].rules[0].id = '';
    }
    expect(hasAllIds(modifiedModel)).toBe(false);
  });

  it('should return true when multiple flows with same sourceFile all have IDs', () => {
    const model = createMultipleFlowsModel(true, true);
    expect(hasAllIds(model)).toBe(true);
  });

  it('should return false when any flow in multiple flows with same sourceFile is missing ID', () => {
    const model = createMultipleFlowsModel(false, true);
    expect(hasAllIds(model)).toBe(false);
  });

  it('should return false when any slice in multiple flows with same sourceFile is missing ID', () => {
    const model = createMultipleFlowsModel(true, false);
    expect(hasAllIds(model)).toBe(false);
  });

  it('should return false if any spec is missing an ID', () => {
    const model = createModelWithFullIds();
    const modifiedModel = structuredClone(model);
    const slice = modifiedModel.narratives[0].slices[0];
    if ('server' in slice && slice.server?.specs !== undefined && Array.isArray(slice.server.specs)) {
      slice.server.specs[0].id = '';
    }
    expect(hasAllIds(modifiedModel)).toBe(false);
  });

  it('should return false if any example is missing an ID', () => {
    const model = createModelWithFullIds();
    const modifiedModel = structuredClone(model);
    const slice = modifiedModel.narratives[0].slices[0];
    if ('server' in slice && slice.server?.specs !== undefined && Array.isArray(slice.server.specs)) {
      slice.server.specs[0].rules[0].examples[0].id = '';
    }
    expect(hasAllIds(modifiedModel)).toBe(false);
  });

  it('should return false if any step is missing an ID', () => {
    const model = createModelWithFullIds();
    const modifiedModel = structuredClone(model);
    const slice = modifiedModel.narratives[0].slices[0];
    if ('server' in slice && slice.server?.specs !== undefined && Array.isArray(slice.server.specs)) {
      slice.server.specs[0].rules[0].examples[0].steps[0].id = '';
    }
    expect(hasAllIds(modifiedModel)).toBe(false);
  });

  it('should return false if step with error is missing an ID', () => {
    const model: Model = {
      variant: 'specs',
      narratives: [
        {
          name: 'Test Flow',
          id: 'FLOW-001',
          slices: [
            {
              type: 'command',
              name: 'Test slice',
              id: 'SLICE-001',
              client: { specs: [] },
              server: {
                description: 'Test server',
                specs: [
                  {
                    id: 'SPEC-001',
                    type: 'gherkin',
                    feature: 'Test specs',
                    rules: [
                      {
                        id: 'RULE-001',
                        name: 'Test rule',
                        examples: [
                          {
                            id: 'EXAMPLE-001',
                            name: 'Error example',
                            steps: [
                              {
                                id: 'STEP-001',
                                keyword: 'Given',
                                text: 'TestState',
                              },
                              {
                                keyword: 'Then',
                                error: { type: 'ValidationError', message: 'Invalid input' },
                              },
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
    expect(hasAllIds(model)).toBe(false);
  });

  it('should return false if client it spec is missing an ID', () => {
    const model: Model = {
      variant: 'specs',
      narratives: [
        {
          name: 'Test Flow',
          id: 'FLOW-001',
          slices: [
            {
              name: 'Test slice',
              id: 'SLICE-001',
              type: 'experience',
              client: {
                specs: [{ type: 'it', title: 'test without id' }],
              },
            },
          ],
        },
      ],
      messages: [],
      integrations: [],
      modules: [],
    };
    expect(hasAllIds(model)).toBe(false);
  });

  it('should return false if client describe spec is missing an ID', () => {
    const model: Model = {
      variant: 'specs',
      narratives: [
        {
          name: 'Test Flow',
          id: 'FLOW-001',
          slices: [
            {
              name: 'Test slice',
              id: 'SLICE-001',
              type: 'experience',
              client: {
                specs: [
                  {
                    type: 'describe',
                    title: 'test describe without id',
                    children: [{ type: 'it', id: 'IT-001', title: 'nested it with id' }],
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
    expect(hasAllIds(model)).toBe(false);
  });

  it('should return false if nested client it spec is missing an ID', () => {
    const model: Model = {
      variant: 'specs',
      narratives: [
        {
          name: 'Test Flow',
          id: 'FLOW-001',
          slices: [
            {
              name: 'Test slice',
              id: 'SLICE-001',
              type: 'experience',
              client: {
                specs: [
                  {
                    type: 'describe',
                    id: 'DESC-001',
                    title: 'test describe with id',
                    children: [{ type: 'it', title: 'nested it without id' }],
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
    expect(hasAllIds(model)).toBe(false);
  });

  it('should return true for client specs with all IDs', () => {
    const model: Model = {
      variant: 'specs',
      narratives: [
        {
          name: 'Test Flow',
          id: 'FLOW-001',
          slices: [
            {
              name: 'Test slice',
              id: 'SLICE-001',
              type: 'experience',
              client: {
                specs: [
                  {
                    type: 'describe',
                    id: 'DESC-001',
                    title: 'test describe',
                    children: [
                      { type: 'it', id: 'IT-001', title: 'first it' },
                      {
                        type: 'describe',
                        id: 'DESC-002',
                        title: 'nested describe',
                        children: [{ type: 'it', id: 'IT-002', title: 'nested it' }],
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
    expect(hasAllIds(model)).toBe(true);
  });

  describe('data item ID validation', () => {
    it('should return false when data wrapper is missing an ID', () => {
      const model: Model = {
        variant: 'specs',
        narratives: [
          {
            name: 'Test Flow',
            id: 'FLOW-001',
            slices: [
              {
                type: 'command',
                name: 'Test slice',
                id: 'SLICE-001',
                client: { specs: [] },
                server: {
                  description: 'Test server',
                  specs: [],
                  data: {
                    items: [
                      {
                        id: 'SINK-001',
                        target: { type: 'Event', name: 'TestEvent' },
                        destination: { type: 'stream', pattern: 'test-stream' },
                      },
                    ],
                  },
                },
              },
            ],
          },
        ],
        messages: [],
        integrations: [],
        modules: [],
      };
      expect(hasAllIds(model)).toBe(false);
    });

    it('should return false when data sink item is missing an ID', () => {
      const model: Model = {
        variant: 'specs',
        narratives: [
          {
            name: 'Test Flow',
            id: 'FLOW-001',
            slices: [
              {
                type: 'command',
                name: 'Test slice',
                id: 'SLICE-001',
                client: { specs: [] },
                server: {
                  description: 'Test server',
                  specs: [],
                  data: {
                    id: 'DATA-001',
                    items: [
                      {
                        target: { type: 'Event', name: 'TestEvent' },
                        destination: { type: 'stream', pattern: 'test-stream' },
                      },
                    ],
                  },
                },
              },
            ],
          },
        ],
        messages: [],
        integrations: [],
        modules: [],
      };
      expect(hasAllIds(model)).toBe(false);
    });

    it('should return false when data source item is missing an ID', () => {
      const model: Model = {
        variant: 'specs',
        narratives: [
          {
            name: 'Test Flow',
            id: 'FLOW-001',
            slices: [
              {
                type: 'query',
                name: 'Test slice',
                id: 'SLICE-001',
                client: { specs: [] },
                server: {
                  description: 'Test server',
                  specs: [],
                  data: {
                    id: 'DATA-001',
                    items: [
                      {
                        target: { type: 'State', name: 'TestState' },
                        origin: { type: 'projection', name: 'TestProjection' },
                      },
                    ],
                  },
                },
              },
            ],
          },
        ],
        messages: [],
        integrations: [],
        modules: [],
      };
      expect(hasAllIds(model)).toBe(false);
    });

    it('should return false when nested _withState source is missing an ID', () => {
      const model: Model = {
        variant: 'specs',
        narratives: [
          {
            name: 'Test Flow',
            id: 'FLOW-001',
            slices: [
              {
                type: 'command',
                name: 'Test slice',
                id: 'SLICE-001',
                client: { specs: [] },
                server: {
                  description: 'Test server',
                  specs: [],
                  data: {
                    id: 'DATA-001',
                    items: [
                      {
                        id: 'SINK-001',
                        target: { type: 'Command', name: 'TestCommand' },
                        destination: { type: 'stream', pattern: 'test-stream' },
                        _withState: {
                          target: { type: 'State', name: 'TestState' },
                          origin: { type: 'projection', name: 'TestProjection' },
                        },
                      },
                    ],
                  },
                },
              },
            ],
          },
        ],
        messages: [],
        integrations: [],
        modules: [],
      };
      expect(hasAllIds(model)).toBe(false);
    });

    it('should return true when all data items have IDs', () => {
      const model: Model = {
        variant: 'specs',
        narratives: [
          {
            name: 'Test Flow',
            id: 'FLOW-001',
            slices: [
              {
                type: 'command',
                name: 'Test slice',
                id: 'SLICE-001',
                client: { specs: [] },
                server: {
                  description: 'Test server',
                  specs: [],
                  data: {
                    id: 'DATA-001',
                    items: [
                      {
                        id: 'SINK-001',
                        target: { type: 'Event', name: 'TestEvent' },
                        destination: { type: 'stream', pattern: 'test-stream' },
                      },
                      {
                        id: 'SOURCE-001',
                        target: { type: 'State', name: 'TestState' },
                        origin: { type: 'projection', name: 'TestProjection' },
                      },
                    ],
                  },
                },
              },
            ],
          },
        ],
        messages: [],
        integrations: [],
        modules: [],
      };
      expect(hasAllIds(model)).toBe(true);
    });

    it('should return true when sink with _withState both have IDs', () => {
      const model: Model = {
        variant: 'specs',
        narratives: [
          {
            name: 'Test Flow',
            id: 'FLOW-001',
            slices: [
              {
                type: 'command',
                name: 'Test slice',
                id: 'SLICE-001',
                client: { specs: [] },
                server: {
                  description: 'Test server',
                  specs: [],
                  data: {
                    id: 'DATA-001',
                    items: [
                      {
                        id: 'SINK-001',
                        target: { type: 'Command', name: 'TestCommand' },
                        destination: { type: 'stream', pattern: 'test-stream' },
                        _withState: {
                          id: 'SOURCE-001',
                          target: { type: 'State', name: 'TestState' },
                          origin: { type: 'projection', name: 'TestProjection' },
                        },
                      },
                    ],
                  },
                },
              },
            ],
          },
        ],
        messages: [],
        integrations: [],
        modules: [],
      };
      expect(hasAllIds(model)).toBe(true);
    });

    it('should return true when slice has no data', () => {
      const model: Model = {
        variant: 'specs',
        narratives: [
          {
            name: 'Test Flow',
            id: 'FLOW-001',
            slices: [
              {
                type: 'command',
                name: 'Test slice',
                id: 'SLICE-001',
                client: { specs: [] },
                server: {
                  description: 'Test server',
                  specs: [],
                },
              },
            ],
          },
        ],
        messages: [],
        integrations: [],
        modules: [],
      };
      expect(hasAllIds(model)).toBe(true);
    });
  });
});
