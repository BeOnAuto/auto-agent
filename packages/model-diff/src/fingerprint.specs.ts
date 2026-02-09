import type { Model } from '@auto-engineer/narrative';
import { describe, expect, it } from 'vitest';
import {
  buildSliceSnapshot,
  computeAllFingerprints,
  computeAllSnapshots,
  computeFingerprintFromSnapshot,
} from './fingerprint';

const makeSpec = (steps: Array<{ keyword: 'Given' | 'When' | 'Then' | 'And'; text: string }>) => [
  {
    type: 'gherkin' as const,
    feature: 'test',
    rules: [{ name: 'r1', examples: [{ name: 'e1', steps }] }],
  },
];

const baseModel: Model = {
  variant: 'specs',
  narratives: [
    {
      name: 'TodoManagement',
      slices: [
        {
          name: 'AddTodo',
          type: 'command' as const,
          client: { specs: [] },
          server: {
            description: 'Add a todo item',
            specs: makeSpec([
              { keyword: 'When', text: 'AddTodo' },
              { keyword: 'Then', text: 'TodoAdded' },
            ]),
          },
        },
        {
          name: 'GetTodos',
          type: 'query' as const,
          client: { specs: [] },
          server: {
            description: 'Get all todos',
            specs: makeSpec([
              { keyword: 'Given', text: 'TodoAdded' },
              { keyword: 'When', text: 'GetTodos' },
              { keyword: 'Then', text: 'TodoList' },
            ]),
          },
        },
      ],
    },
  ],
  messages: [
    { name: 'AddTodo', type: 'command' as const, fields: [{ name: 'title', type: 'string', required: true }] },
    {
      name: 'TodoAdded',
      type: 'event' as const,
      fields: [
        { name: 'id', type: 'string', required: true },
        { name: 'title', type: 'string', required: true },
      ],
    },
    { name: 'GetTodos', type: 'query' as const, fields: [] },
    { name: 'TodoList', type: 'state' as const, fields: [{ name: 'items', type: 'array', required: true }] },
  ],
  modules: [],
};

describe('buildSliceSnapshot', () => {
  it('assembles snapshot with referenced messages sorted by name', () => {
    const slice = baseModel.narratives[0].slices[0];
    const snapshot = buildSliceSnapshot(slice, 'TodoManagement', baseModel);

    expect(snapshot).toEqual({
      slice,
      flowName: 'TodoManagement',
      referencedMessages: [
        { name: 'AddTodo', type: 'command', fields: [{ name: 'title', type: 'string', required: true }] },
        {
          name: 'TodoAdded',
          type: 'event',
          fields: [
            { name: 'id', type: 'string', required: true },
            { name: 'title', type: 'string', required: true },
          ],
        },
      ],
      eventSources: {},
      commandSources: {},
      referencedIntegrations: undefined,
    });
  });

  it('includes event sources for query slices', () => {
    const slice = baseModel.narratives[0].slices[1];
    const snapshot = buildSliceSnapshot(slice, 'TodoManagement', baseModel);

    expect(snapshot.eventSources).toEqual({
      TodoAdded: { flowName: 'TodoManagement', sliceName: 'AddTodo' },
    });
  });

  it('handles experience slices with empty dependencies', () => {
    const model: Model = {
      ...baseModel,
      narratives: [
        {
          name: 'UI',
          slices: [{ name: 'ViewTodos', type: 'experience' as const, client: { specs: [] } }],
        },
      ],
    };
    const snapshot = buildSliceSnapshot(model.narratives[0].slices[0], 'UI', model);

    expect(snapshot).toEqual({
      slice: model.narratives[0].slices[0],
      flowName: 'UI',
      referencedMessages: [],
      eventSources: {},
      commandSources: {},
      referencedIntegrations: undefined,
    });
  });

  it('includes referenced integrations when slice uses via', () => {
    const model: Model = {
      ...baseModel,
      integrations: [
        { name: 'MailChimp', source: '@auto-engineer/mailchimp' },
        { name: 'Twilio', source: '@auto-engineer/twilio' },
      ],
      narratives: [
        {
          name: 'Notifications',
          slices: [
            {
              name: 'NotifyUser',
              type: 'react' as const,
              via: ['MailChimp'],
              server: {
                specs: makeSpec([
                  { keyword: 'Given', text: 'TodoAdded' },
                  { keyword: 'When', text: 'TodoAdded' },
                  { keyword: 'Then', text: 'SendEmail' },
                ]),
              },
            },
          ],
        },
        ...baseModel.narratives,
      ],
    };
    const snapshot = buildSliceSnapshot(model.narratives[0].slices[0], 'Notifications', model);
    expect(snapshot.referencedIntegrations).toEqual([{ name: 'MailChimp', source: '@auto-engineer/mailchimp' }]);
  });
});

describe('computeFingerprintFromSnapshot', () => {
  it('returns a SHA-256 hex string', () => {
    const snapshot = buildSliceSnapshot(baseModel.narratives[0].slices[0], 'TodoManagement', baseModel);
    const fingerprint = computeFingerprintFromSnapshot(snapshot);
    expect(fingerprint).toMatch(/^[a-f0-9]{64}$/);
  });

  it('produces different fingerprints for different snapshots', () => {
    const snap1 = buildSliceSnapshot(baseModel.narratives[0].slices[0], 'TodoManagement', baseModel);
    const snap2 = buildSliceSnapshot(baseModel.narratives[0].slices[1], 'TodoManagement', baseModel);
    expect(computeFingerprintFromSnapshot(snap1)).not.toBe(computeFingerprintFromSnapshot(snap2));
  });

  it('produces same fingerprint for identical snapshots', () => {
    const snap1 = buildSliceSnapshot(baseModel.narratives[0].slices[0], 'TodoManagement', baseModel);
    const snap2 = buildSliceSnapshot(baseModel.narratives[0].slices[0], 'TodoManagement', baseModel);
    expect(computeFingerprintFromSnapshot(snap1)).toBe(computeFingerprintFromSnapshot(snap2));
  });
});

describe('computeAllSnapshots', () => {
  it('creates snapshots keyed by kebab-case sliceId', () => {
    const snapshots = computeAllSnapshots(baseModel);
    expect(Object.keys(snapshots)).toEqual(['todo-management/add-todo', 'todo-management/get-todos']);
  });

  it('includes experience slices', () => {
    const model: Model = {
      ...baseModel,
      narratives: [
        ...baseModel.narratives,
        { name: 'UI', slices: [{ name: 'ViewTodos', type: 'experience' as const, client: { specs: [] } }] },
      ],
    };
    const snapshots = computeAllSnapshots(model);
    const expSlice = model.narratives[1].slices[0];
    expect(snapshots['ui/view-todos']).toEqual({
      slice: expSlice,
      flowName: 'UI',
      referencedMessages: [],
      eventSources: {},
      commandSources: {},
      referencedIntegrations: undefined,
    });
  });
});

describe('computeAllFingerprints', () => {
  it('returns fingerprints for all snapshots', () => {
    const snapshots = computeAllSnapshots(baseModel);
    const fingerprints = computeAllFingerprints(snapshots);
    expect(Object.keys(fingerprints)).toEqual(['todo-management/add-todo', 'todo-management/get-todos']);
    for (const fp of Object.values(fingerprints)) {
      expect(fp).toMatch(/^[a-f0-9]{64}$/);
    }
  });
});
