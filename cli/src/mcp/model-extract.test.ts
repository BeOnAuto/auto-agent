import { describe, expect, it } from 'vitest';
import { extractOverview, extractSceneDetail, extractDesign } from './model-extract.js';

const fixture = {
  variant: 'full',
  requirements: 'A role-based timesheet prototype',
  assumptions: ['No real authentication needed', 'Member names are fixed per team'],
  actors: [
    { name: 'Submitter', kind: 'person', description: 'Creates timesheets' },
    { name: 'Controller', kind: 'person', description: 'Validates entries' },
  ],
  entities: [
    { name: 'Team', description: 'Group of members', attributes: ['name', 'members'] },
    { name: 'Timesheet', description: 'Daily record', attributes: ['team', 'date', 'version', 'status'] },
  ],
  narratives: [
    {
      id: 'n1',
      name: 'Submit Daily Timesheets',
      description: 'Submitter creates or edits a daily timesheet',
      outcome: 'Timesheet submitted with status Submitted',
      requirements: 'Select team, enter hours, submit',
      sceneIds: ['s1', 's2'],
      actors: ['Submitter'],
      impact: 'critical',
      design: { imageAsset: { url: 'data:...' } },
    },
  ],
  scenes: [
    {
      id: 's1',
      name: 'Select Team and Date',
      description: 'Submitter chooses a team and date',
      moments: [
        {
          id: 'm1',
          name: 'Choose Team',
          type: 'experience',
          description: 'Submitter selects a team from a list',
          initiator: 'Submitter',
          client: {
            specs: [{ title: 'Team selection' }],
            ui: { spec: { root: 'sidebar_1', elements: { sidebar_1: { type: 'Sidebar' } } } },
          },
        },
        {
          id: 'm2',
          name: 'View Timesheet',
          type: 'query',
          description: 'System displays the existing timesheet',
          initiator: 'Submitter',
          server: { description: 'Timesheet lookup', data: { items: [] } },
          messages: [{ messageId: 'msg1' }],
        },
      ],
    },
    {
      id: 's2',
      name: 'Edit and Submit',
      description: 'Submitter edits hours and submits',
      moments: [
        {
          id: 'm3',
          name: 'Enter Hours',
          type: 'experience',
          description: 'Enter hours per member',
          initiator: 'Submitter',
          client: { ui: { spec: { root: 'layout', elements: {} } } },
        },
      ],
    },
  ],
  messages: [
    { id: 'msg1', type: 'state', name: 'TimesheetSummary', fields: [{ name: 'timesheetId', type: 'string' }, { name: 'status', type: 'string' }] },
    { id: 'msg2', type: 'command', name: 'SubmitTimesheet', fields: [{ name: 'timesheetId', type: 'string' }] },
  ],
  design: {
    brief: 'A clean dashboard layout',
    appShell: { name: 'left-nav-two-pane', chrome: 'Fixed sidebar 240px' },
    theme: {
      colors: { light: { primary: 'oklch(48% 0.22 248)' } },
      font: { sans: 'Inter, system-ui' },
      radius: { md: '8px' },
    },
    themeVersion: 'v1',
  },
};

describe('extractOverview', () => {
  it('returns compact overview without UI specs', () => {
    const result = extractOverview(fixture);

    expect(result.requirements).toBe('A role-based timesheet prototype');
    expect(result.assumptions).toEqual(fixture.assumptions);
    expect(result.actors).toEqual(fixture.actors);
    expect(result.entities).toEqual(fixture.entities);
  });

  it('strips narratives of design assets', () => {
    const result = extractOverview(fixture);
    const narratives = result.narratives as Record<string, unknown>[];

    expect(narratives).toHaveLength(1);
    expect(narratives[0].name).toBe('Submit Daily Timesheets');
    expect(narratives[0].sceneIds).toEqual(['s1', 's2']);
    expect(narratives[0]).not.toHaveProperty('design');
  });

  it('strips scenes of client/server data', () => {
    const result = extractOverview(fixture);
    const scenes = result.scenes as Record<string, unknown>[];

    expect(scenes).toHaveLength(2);
    expect(scenes[0].name).toBe('Select Team and Date');
    const moments = scenes[0].moments as Record<string, unknown>[];
    expect(moments).toHaveLength(2);
    expect(moments[0].name).toBe('Choose Team');
    expect(moments[0].type).toBe('experience');
    expect(moments[0]).not.toHaveProperty('client');
    expect(moments[0]).not.toHaveProperty('server');
  });

  it('returns message names and field names only', () => {
    const result = extractOverview(fixture);
    const messages = result.messages as Record<string, unknown>[];

    expect(messages).toHaveLength(2);
    expect(messages[0]).toEqual({ id: 'msg1', type: 'state', name: 'TimesheetSummary', fields: ['timesheetId', 'status'] });
  });

  it('includes design brief and appShell but not theme', () => {
    const result = extractOverview(fixture);
    const design = result.design as Record<string, unknown>;

    expect(design.brief).toBe('A clean dashboard layout');
    expect(design.appShell).toEqual({ name: 'left-nav-two-pane', chrome: 'Fixed sidebar 240px' });
    expect(design).not.toHaveProperty('theme');
  });

  it('handles empty/null model gracefully', () => {
    const result = extractOverview(null);
    expect(result.requirements).toBe('');
    expect(result.scenes).toEqual([]);
    expect(result.narratives).toEqual([]);
  });
});

describe('extractSceneDetail', () => {
  it('finds scene by name (case insensitive)', () => {
    const result = extractSceneDetail(fixture, 'select team and date');
    expect(result).not.toBeNull();
    expect((result!.scene as ModelScene).name).toBe('Select Team and Date');
  });

  it('finds scene by id', () => {
    const result = extractSceneDetail(fixture, 's1');
    expect(result).not.toBeNull();
    expect((result!.scene as ModelScene).name).toBe('Select Team and Date');
  });

  it('returns full scene with client/server data', () => {
    const result = extractSceneDetail(fixture, 's1');
    const scene = result!.scene as ModelScene;
    expect(scene.moments![0].client).toBeDefined();
    expect(scene.moments![0].client!.ui).toBeDefined();
    expect(scene.moments![1].server).toBeDefined();
  });

  it('returns related messages', () => {
    const result = extractSceneDetail(fixture, 's1');
    const messages = result!.relatedMessages as ModelMessage[];
    expect(messages).toHaveLength(1);
    expect(messages[0].name).toBe('TimesheetSummary');
  });

  it('omits relatedMessages when none match', () => {
    const result = extractSceneDetail(fixture, 's2');
    expect(result!.relatedMessages).toBeUndefined();
  });

  it('returns null for unknown scene', () => {
    expect(extractSceneDetail(fixture, 'nonexistent')).toBeNull();
  });

  it('handles null model', () => {
    expect(extractSceneDetail(null, 's1')).toBeNull();
  });
});

describe('extractDesign', () => {
  it('returns the full design object', () => {
    const result = extractDesign(fixture);
    expect(result.brief).toBe('A clean dashboard layout');
    expect(result.theme).toBeDefined();
    expect((result.theme as Record<string, unknown>).font).toEqual({ sans: 'Inter, system-ui' });
  });

  it('returns empty object when no design', () => {
    expect(extractDesign({})).toEqual({});
  });

  it('handles null model', () => {
    expect(extractDesign(null)).toEqual({});
  });
});

interface ModelScene {
  id?: string;
  name?: string;
  moments?: ModelMoment[];
}

interface ModelMoment {
  client?: Record<string, unknown>;
  server?: Record<string, unknown>;
}

interface ModelMessage {
  name?: string;
}
