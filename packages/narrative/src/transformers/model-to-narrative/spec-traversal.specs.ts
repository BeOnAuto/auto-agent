import { describe, expect, it } from 'vitest';
import type { Narrative } from '../../index';
import { collectMessageKeysFromNarratives } from './spec-traversal';

describe('collectMessageKeysFromNarratives', () => {
  it('returns empty set for empty narratives array', () => {
    const keys = collectMessageKeysFromNarratives([]);

    expect(keys.size).toBe(0);
  });

  it('returns empty set for narratives with no slices', () => {
    const narratives: Narrative[] = [{ name: 'Empty', slices: [] }];

    const keys = collectMessageKeysFromNarratives(narratives);

    expect(keys.size).toBe(0);
  });

  it('ignores experience slices', () => {
    const narratives: Narrative[] = [
      {
        name: 'Test',
        slices: [
          {
            name: 'Homepage',
            type: 'experience',
            client: { specs: [] },
          },
        ],
      },
    ];

    const keys = collectMessageKeysFromNarratives(narratives);

    expect(keys.size).toBe(0);
  });

  it('collects command keys from When steps', () => {
    const narratives: Narrative[] = [
      {
        name: 'Test',
        slices: [
          {
            name: 'create order',
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
                      name: 'test rule',
                      examples: [
                        {
                          name: 'test example',
                          steps: [{ keyword: 'When', text: 'CreateOrder' }],
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
    ];

    const keys = collectMessageKeysFromNarratives(narratives);

    expect(keys.has('command:CreateOrder')).toBe(true);
  });

  it('collects event and state keys from Given steps', () => {
    const narratives: Narrative[] = [
      {
        name: 'Test',
        slices: [
          {
            name: 'view order',
            type: 'query',
            client: { specs: [] },
            server: {
              description: 'Test',
              specs: [
                {
                  type: 'gherkin',
                  feature: 'Test',
                  rules: [
                    {
                      name: 'test rule',
                      examples: [
                        {
                          name: 'test example',
                          steps: [{ keyword: 'Given', text: 'OrderCreated' }],
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
    ];

    const keys = collectMessageKeysFromNarratives(narratives);

    expect(keys.has('event:OrderCreated')).toBe(true);
    expect(keys.has('state:OrderCreated')).toBe(true);
  });

  it('collects event and state keys from And steps', () => {
    const narratives: Narrative[] = [
      {
        name: 'Test',
        slices: [
          {
            name: 'test',
            type: 'react',
            server: {
              description: 'Test',
              specs: [
                {
                  type: 'gherkin',
                  feature: 'Test',
                  rules: [
                    {
                      name: 'test rule',
                      examples: [
                        {
                          name: 'test example',
                          steps: [{ keyword: 'And', text: 'UserLoggedIn' }],
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
    ];

    const keys = collectMessageKeysFromNarratives(narratives);

    expect(keys.has('event:UserLoggedIn')).toBe(true);
    expect(keys.has('state:UserLoggedIn')).toBe(true);
  });

  it('collects event and state keys from Then steps', () => {
    const narratives: Narrative[] = [
      {
        name: 'Test',
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
                      name: 'test rule',
                      examples: [
                        {
                          name: 'test example',
                          steps: [{ keyword: 'Then', text: 'OrderCompleted' }],
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
    ];

    const keys = collectMessageKeysFromNarratives(narratives);

    expect(keys.has('event:OrderCompleted')).toBe(true);
    expect(keys.has('state:OrderCompleted')).toBe(true);
  });

  it('handles slices without server specs', () => {
    const narratives: Narrative[] = [
      {
        name: 'Test',
        slices: [
          {
            name: 'test',
            type: 'experience',
            client: { specs: [] },
          },
        ],
      },
    ];

    const keys = collectMessageKeysFromNarratives(narratives);

    expect(keys.size).toBe(0);
  });

  it('handles specs without rules', () => {
    const narratives: Narrative[] = [
      {
        name: 'Test',
        slices: [
          {
            name: 'test',
            type: 'command',
            client: { specs: [] },
            server: {
              description: 'Test',
              specs: [{ type: 'gherkin', feature: 'Test', rules: [] }],
            },
          },
        ],
      },
    ];

    const keys = collectMessageKeysFromNarratives(narratives);

    expect(keys.size).toBe(0);
  });

  it('handles rules without examples', () => {
    const narratives: Narrative[] = [
      {
        name: 'Test',
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
                  rules: [{ name: 'empty rule', examples: [] }],
                },
              ],
            },
          },
        ],
      },
    ];

    const keys = collectMessageKeysFromNarratives(narratives);

    expect(keys.size).toBe(0);
  });

  it('handles examples without steps', () => {
    const narratives: Narrative[] = [
      {
        name: 'Test',
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
                      examples: [{ name: 'empty example', steps: [] }],
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    ];

    const keys = collectMessageKeysFromNarratives(narratives);

    expect(keys.size).toBe(0);
  });

  it('handles steps with empty text', () => {
    const narratives: Narrative[] = [
      {
        name: 'Test',
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
                          steps: [{ keyword: 'When', text: '' }],
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
    ];

    const keys = collectMessageKeysFromNarratives(narratives);

    expect(keys.size).toBe(0);
  });

  it('collects keys from multiple narratives and slices', () => {
    const narratives: Narrative[] = [
      {
        name: 'Orders',
        slices: [
          {
            name: 'create',
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
      {
        name: 'Users',
        slices: [
          {
            name: 'register',
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
                            { keyword: 'When', text: 'RegisterUser' },
                            { keyword: 'Then', text: 'UserRegistered' },
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
    ];

    const keys = collectMessageKeysFromNarratives(narratives);

    expect(keys.has('command:CreateOrder')).toBe(true);
    expect(keys.has('event:OrderCreated')).toBe(true);
    expect(keys.has('command:RegisterUser')).toBe(true);
    expect(keys.has('event:UserRegistered')).toBe(true);
  });
});
