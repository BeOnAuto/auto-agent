import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { CommandSlice, Message, Narrative } from '@auto-engineer/narrative';
import { describe, expect, it } from 'vitest';
import { generateScaffoldFilePlans } from './scaffoldFromSchema';

const makeSlice = (name: string): CommandSlice => ({
  name,
  type: 'command',
  client: { specs: [] },
  server: {
    description: `Handle ${name}`,
    specs: [
      {
        type: 'gherkin',
        feature: name,
        rules: [
          {
            name: 'rule',
            examples: [
              {
                name: 'example',
                steps: [
                  { keyword: 'When', text: name },
                  { keyword: 'Then', text: `${name}Done` },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
});

const messages: Message[] = [
  { name: 'AddTodo', type: 'command', fields: [{ name: 'title', type: 'string', required: true }] },
  { name: 'AddTodoDone', type: 'event', fields: [{ name: 'id', type: 'string', required: true }] },
  { name: 'RemoveTodo', type: 'command', fields: [{ name: 'id', type: 'string', required: true }] },
  { name: 'RemoveTodoDone', type: 'event', fields: [{ name: 'id', type: 'string', required: true }] },
];

const flows: Narrative[] = [
  {
    name: 'Todo',
    slices: [makeSlice('AddTodo'), makeSlice('RemoveTodo')],
  },
];

describe('generateScaffoldFilePlans with affectedSliceIds filter', () => {
  const baseDir = join(tmpdir(), `scaffold-filter-test-${Date.now()}`);

  it('generates plans for all slices when no filter is provided', async () => {
    const plans = await generateScaffoldFilePlans(flows, messages, undefined, baseDir);
    const sliceDirs = new Set(plans.map((p) => p.outputPath.split('/').slice(-3, -1).join('/')));
    expect(sliceDirs.has('todo/add-todo')).toBe(true);
    expect(sliceDirs.has('todo/remove-todo')).toBe(true);
  });

  it('generates plans only for affected slices when filter is provided', async () => {
    const affectedSliceIds = new Set(['todo/add-todo']);
    const plans = await generateScaffoldFilePlans(flows, messages, undefined, baseDir, affectedSliceIds);
    const sliceDirs = new Set(plans.map((p) => p.outputPath.split('/').slice(-3, -1).join('/')));
    expect(sliceDirs.has('todo/add-todo')).toBe(true);
    expect(sliceDirs.has('todo/remove-todo')).toBe(false);
  });
});
