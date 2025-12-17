import { describe, expect, it } from 'vitest';
import { hasAllIds, addAutoIds } from './index';
import type { Model } from '../index';

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
            client: { specs: [{ type: 'it', title: 'show active surveys summary' }] },
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
            client: { specs: [{ type: 'it', title: 'allow entering survey title' }] },
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
            client: { specs: [{ type: 'it', title: 'show daily response rate charts' }] },
          },
        ],
      },
    ],
    messages: [],
    integrations: [],
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
});
