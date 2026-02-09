import { describe, expect, it } from 'vitest';
import {
  computeSharedTypesHash,
  findCommandSource,
  findEventSource,
  getCommandSourceMap,
  getEventSourceMap,
  getReferencedIntegrations,
  getReferencedMessageNames,
  walkStepsByKeyword,
} from './model-dependencies';

const makeSpec = (steps: Array<{ keyword: 'Given' | 'When' | 'Then' | 'And'; text: string }>) => [
  {
    type: 'gherkin' as const,
    feature: 'test',
    rules: [{ name: 'r1', examples: [{ name: 'e1', steps }] }],
  },
];

describe('walkStepsByKeyword', () => {
  it('groups step texts by their keyword', () => {
    const specs = makeSpec([
      { keyword: 'Given', text: 'EventA' },
      { keyword: 'When', text: 'CommandB' },
      { keyword: 'Then', text: 'EventC' },
    ]);
    expect(walkStepsByKeyword(specs)).toEqual({
      given: ['EventA'],
      when: ['CommandB'],
      then: ['EventC'],
    });
  });

  it('resolves And to previous major keyword', () => {
    const specs = makeSpec([
      { keyword: 'Given', text: 'E1' },
      { keyword: 'And', text: 'E2' },
      { keyword: 'When', text: 'C1' },
      { keyword: 'Then', text: 'Ev1' },
      { keyword: 'And', text: 'Ev2' },
    ]);
    expect(walkStepsByKeyword(specs)).toEqual({
      given: ['E1', 'E2'],
      when: ['C1'],
      then: ['Ev1', 'Ev2'],
    });
  });

  it('skips error steps (no text property)', () => {
    const specs = [
      {
        type: 'gherkin' as const,
        feature: 'test',
        rules: [
          {
            name: 'r1',
            examples: [
              {
                name: 'e1',
                steps: [
                  { keyword: 'Given' as const, text: 'E1' },
                  { keyword: 'When' as const, text: 'C1' },
                  { keyword: 'Then' as const, error: { type: 'ValidationError' as const, message: 'bad' } },
                ],
              },
            ],
          },
        ],
      },
    ];
    expect(walkStepsByKeyword(specs)).toEqual({
      given: ['E1'],
      when: ['C1'],
      then: [],
    });
  });

  it('deduplicates step texts across examples', () => {
    const specs = [
      {
        type: 'gherkin' as const,
        feature: 'test',
        rules: [
          {
            name: 'r1',
            examples: [
              { name: 'e1', steps: [{ keyword: 'Given' as const, text: 'EventA' }] },
              { name: 'e2', steps: [{ keyword: 'Given' as const, text: 'EventA' }] },
            ],
          },
        ],
      },
    ];
    expect(walkStepsByKeyword(specs)).toEqual({ given: ['EventA'], when: [], then: [] });
  });

  it('returns empty buckets for empty specs', () => {
    expect(walkStepsByKeyword([])).toEqual({ given: [], when: [], then: [] });
  });
});

describe('getReferencedMessageNames', () => {
  it('extracts message names from server spec steps', () => {
    const slice = {
      name: 'AddTodo',
      type: 'command' as const,
      client: { specs: [] },
      server: {
        description: '',
        specs: makeSpec([
          { keyword: 'Given', text: 'TodoAdded' },
          { keyword: 'When', text: 'AddTodo' },
          { keyword: 'Then', text: 'TodoAdded' },
        ]),
      },
    };
    expect(getReferencedMessageNames(slice)).toEqual(['TodoAdded', 'AddTodo']);
  });

  it('includes data item target names', () => {
    const slice = {
      name: 'AddTodo',
      type: 'command' as const,
      client: { specs: [] },
      server: {
        description: '',
        specs: makeSpec([
          { keyword: 'When', text: 'AddTodo' },
          { keyword: 'Then', text: 'TodoAdded' },
        ]),
        data: {
          items: [
            {
              target: { type: 'Event' as const, name: 'TodoAdded' },
              destination: { type: 'stream' as const, pattern: 'todo-${id}' },
            },
            {
              target: { type: 'State' as const, name: 'TodoList' },
              origin: { type: 'projection' as const, name: 'todo-list' },
            },
          ],
        },
      },
    };
    const names = getReferencedMessageNames(slice);
    expect(names).toContain('AddTodo');
    expect(names).toContain('TodoAdded');
    expect(names).toContain('TodoList');
  });

  it('returns empty array for experience slices', () => {
    const slice = {
      name: 'ViewTodos',
      type: 'experience' as const,
      client: { specs: [] },
    };
    expect(getReferencedMessageNames(slice)).toEqual([]);
  });

  it('handles command slice with no data', () => {
    const slice = {
      name: 'DoThing',
      type: 'command' as const,
      client: { specs: [] },
      server: {
        description: '',
        specs: makeSpec([
          { keyword: 'When', text: 'DoThing' },
          { keyword: 'Then', text: 'ThingDone' },
        ]),
      },
    };
    expect(getReferencedMessageNames(slice)).toEqual(['DoThing', 'ThingDone']);
  });
});

describe('findEventSource', () => {
  const flows = [
    {
      name: 'TodoFlow',
      slices: [
        {
          name: 'AddTodo',
          type: 'command' as const,
          client: { specs: [] },
          server: {
            description: '',
            specs: makeSpec([
              { keyword: 'When', text: 'AddTodo' },
              { keyword: 'Then', text: 'TodoAdded' },
            ]),
          },
        },
        {
          name: 'NotifyUser',
          type: 'react' as const,
          server: {
            description: '',
            specs: makeSpec([
              { keyword: 'Given', text: 'TodoAdded' },
              { keyword: 'When', text: 'TodoAdded' },
              { keyword: 'Then', text: 'SendNotification' },
            ]),
          },
        },
      ],
    },
  ];

  it('finds event source from command slice Then steps', () => {
    expect(findEventSource(flows, 'TodoAdded')).toEqual({
      flowName: 'TodoFlow',
      sliceName: 'AddTodo',
    });
  });

  it('does not find events from react slice Then steps', () => {
    expect(findEventSource(flows, 'SendNotification')).toBeNull();
  });

  it('returns null for unknown event', () => {
    expect(findEventSource(flows, 'UnknownEvent')).toBeNull();
  });
});

describe('findCommandSource', () => {
  const flows = [
    {
      name: 'TodoFlow',
      slices: [
        {
          name: 'AddTodo',
          type: 'command' as const,
          client: { specs: [] },
          server: {
            description: '',
            specs: makeSpec([
              { keyword: 'When', text: 'AddTodo' },
              { keyword: 'Then', text: 'TodoAdded' },
            ]),
          },
        },
      ],
    },
  ];

  it('finds command source from command slice When steps', () => {
    expect(findCommandSource(flows, 'AddTodo')).toEqual({
      flowName: 'TodoFlow',
      sliceName: 'AddTodo',
    });
  });

  it('returns null for unknown command', () => {
    expect(findCommandSource(flows, 'UnknownCommand')).toBeNull();
  });
});

describe('getEventSourceMap', () => {
  const flows = [
    {
      name: 'TodoFlow',
      slices: [
        {
          name: 'AddTodo',
          type: 'command' as const,
          client: { specs: [] },
          server: {
            description: '',
            specs: makeSpec([
              { keyword: 'When', text: 'AddTodo' },
              { keyword: 'Then', text: 'TodoAdded' },
            ]),
          },
        },
        {
          name: 'RemoveTodo',
          type: 'command' as const,
          client: { specs: [] },
          server: {
            description: '',
            specs: makeSpec([
              { keyword: 'Given', text: 'TodoAdded' },
              { keyword: 'When', text: 'RemoveTodo' },
              { keyword: 'Then', text: 'TodoRemoved' },
            ]),
          },
        },
      ],
    },
  ];

  it('maps consumed Given events for command slices', () => {
    const slice = flows[0].slices[1];
    expect(getEventSourceMap(slice, flows)).toEqual({
      TodoAdded: { flowName: 'TodoFlow', sliceName: 'AddTodo' },
    });
  });

  it('maps consumed Given+When events for react slices', () => {
    const reactSlice = {
      name: 'Reactor',
      type: 'react' as const,
      server: {
        description: '',
        specs: makeSpec([
          { keyword: 'Given', text: 'TodoAdded' },
          { keyword: 'When', text: 'TodoRemoved' },
          { keyword: 'Then', text: 'SendNotification' },
        ]),
      },
    };
    expect(getEventSourceMap(reactSlice, flows)).toEqual({
      TodoAdded: { flowName: 'TodoFlow', sliceName: 'AddTodo' },
      TodoRemoved: { flowName: 'TodoFlow', sliceName: 'RemoveTodo' },
    });
  });

  it('returns empty map for experience slices', () => {
    const expSlice = { name: 'View', type: 'experience' as const, client: { specs: [] } };
    expect(getEventSourceMap(expSlice, flows)).toEqual({});
  });
});

describe('getCommandSourceMap', () => {
  const flows = [
    {
      name: 'TodoFlow',
      slices: [
        {
          name: 'AddTodo',
          type: 'command' as const,
          client: { specs: [] },
          server: {
            description: '',
            specs: makeSpec([
              { keyword: 'When', text: 'AddTodo' },
              { keyword: 'Then', text: 'TodoAdded' },
            ]),
          },
        },
      ],
    },
  ];

  it('maps produced commands for react slices', () => {
    const reactSlice = {
      name: 'AutoAdd',
      type: 'react' as const,
      server: {
        description: '',
        specs: makeSpec([
          { keyword: 'Given', text: 'TodoAdded' },
          { keyword: 'When', text: 'TodoAdded' },
          { keyword: 'Then', text: 'AddTodo' },
        ]),
      },
    };
    expect(getCommandSourceMap(reactSlice, flows)).toEqual({
      AddTodo: { flowName: 'TodoFlow', sliceName: 'AddTodo' },
    });
  });

  it('returns empty map for command slices', () => {
    expect(getCommandSourceMap(flows[0].slices[0], flows)).toEqual({});
  });

  it('returns empty map for experience slices', () => {
    const expSlice = { name: 'View', type: 'experience' as const, client: { specs: [] } };
    expect(getCommandSourceMap(expSlice, flows)).toEqual({});
  });

  it('returns empty map for query slices', () => {
    const querySlice = {
      name: 'GetTodos',
      type: 'query' as const,
      client: { specs: [] },
      server: {
        description: '',
        specs: makeSpec([
          { keyword: 'Given', text: 'TodoAdded' },
          { keyword: 'When', text: 'GetTodos' },
          { keyword: 'Then', text: 'TodoList' },
        ]),
      },
    };
    expect(getCommandSourceMap(querySlice, flows)).toEqual({});
  });
});

describe('getReferencedIntegrations', () => {
  const integrations = [
    { name: 'MailChimp', description: 'Email service', source: '@auto-engineer/mailchimp' },
    { name: 'Twilio', description: 'SMS service', source: '@auto-engineer/twilio' },
  ];

  it('filters integrations by slice.via names', () => {
    const slice = { name: 'Notify', type: 'react' as const, via: ['MailChimp'], server: { specs: [] } };
    expect(getReferencedIntegrations(slice, integrations)).toEqual([
      { name: 'MailChimp', description: 'Email service', source: '@auto-engineer/mailchimp' },
    ]);
  });

  it('returns undefined when slice has no via', () => {
    const slice = {
      name: 'AddTodo',
      type: 'command' as const,
      client: { specs: [] },
      server: { description: '', specs: [] },
    };
    expect(getReferencedIntegrations(slice, integrations)).toBeUndefined();
  });

  it('returns undefined when integrations is undefined', () => {
    const slice = { name: 'Notify', type: 'react' as const, via: ['MailChimp'], server: { specs: [] } };
    expect(getReferencedIntegrations(slice, undefined)).toBeUndefined();
  });

  it('returns undefined when no via names match', () => {
    const slice = { name: 'Notify', type: 'react' as const, via: ['Stripe'], server: { specs: [] } };
    expect(getReferencedIntegrations(slice, integrations)).toBeUndefined();
  });
});

describe('computeSharedTypesHash', () => {
  it('hashes string literal union fields from messages', () => {
    const messages = [
      {
        name: 'TodoAdded',
        type: 'event' as const,
        fields: [
          { name: 'status', type: "'active' | 'inactive'", required: true },
          { name: 'id', type: 'string', required: true },
        ],
      },
    ];
    expect(computeSharedTypesHash(messages)).toBe("TodoAdded.status:'active' | 'inactive'");
  });

  it('returns empty string when no union fields exist', () => {
    const messages = [
      { name: 'TodoAdded', type: 'event' as const, fields: [{ name: 'id', type: 'string', required: true }] },
    ];
    expect(computeSharedTypesHash(messages)).toBe('');
  });

  it('preserves model order for deterministic output', () => {
    const messages = [
      { name: 'A', type: 'event' as const, fields: [{ name: 'x', type: "'a' | 'b'", required: true }] },
      { name: 'B', type: 'event' as const, fields: [{ name: 'y', type: "'c' | 'd'", required: true }] },
    ];
    expect(computeSharedTypesHash(messages)).toBe("A.x:'a' | 'b'|B.y:'c' | 'd'");
  });
});
