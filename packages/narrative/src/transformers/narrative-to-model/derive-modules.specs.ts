import { describe, expect, it } from 'vitest';
import type { Message, Narrative } from '../../index';
import { deriveModules } from './derive-modules';

describe('deriveModules', () => {
  it('groups narratives by sourceFile into separate modules', () => {
    const narratives: Narrative[] = [
      { name: 'Orders', id: 'orders-1', sourceFile: 'orders.narrative.ts', slices: [] },
      { name: 'Users', id: 'users-1', sourceFile: 'users.narrative.ts', slices: [] },
    ];
    const messages: Message[] = [];

    const modules = deriveModules(narratives, messages);

    expect(modules).toHaveLength(2);
    expect(modules.map((m) => m.sourceFile).sort()).toEqual(['orders.narrative.ts', 'users.narrative.ts']);
  });

  it('uses default sourceFile when narrative has no sourceFile', () => {
    const narratives: Narrative[] = [{ name: 'Default', id: 'default-1', slices: [] }];
    const messages: Message[] = [];

    const modules = deriveModules(narratives, messages);

    expect(modules).toHaveLength(1);
    expect(modules[0].sourceFile).toBe('generated.narrative.ts');
  });

  it('generates synthetic narrative IDs when narratives have no ID', () => {
    const narratives: Narrative[] = [
      { name: 'First', slices: [] },
      { name: 'Second', slices: [] },
    ];
    const messages: Message[] = [];

    const modules = deriveModules(narratives, messages);

    expect(modules).toHaveLength(1);
    expect(modules[0].contains.narrativeIds).toEqual(['__derived_0_0_First', '__derived_0_1_Second']);
  });

  it('sets isDerived to true for all generated modules', () => {
    const narratives: Narrative[] = [{ name: 'Test', id: 'test-1', slices: [] }];
    const messages: Message[] = [];

    const modules = deriveModules(narratives, messages);

    expect(modules[0].isDerived).toBe(true);
  });

  it('includes all messages in declares for each module', () => {
    const narratives: Narrative[] = [
      { name: 'Orders', id: 'orders-1', sourceFile: 'orders.narrative.ts', slices: [] },
      { name: 'Users', id: 'users-1', sourceFile: 'users.narrative.ts', slices: [] },
    ];
    const messages: Message[] = [
      { type: 'command', name: 'CreateOrder', fields: [] },
      { type: 'event', source: 'internal', name: 'OrderCreated', fields: [] },
    ];

    const modules = deriveModules(narratives, messages);

    for (const mod of modules) {
      expect(mod.declares.messages).toEqual([
        { kind: 'command', name: 'CreateOrder' },
        { kind: 'event', name: 'OrderCreated' },
      ]);
    }
  });

  it('sorts declared messages by kind:name', () => {
    const narratives: Narrative[] = [{ name: 'Test', id: 'test-1', slices: [] }];
    const messages: Message[] = [
      { type: 'state', name: 'ZState', fields: [] },
      { type: 'command', name: 'ACommand', fields: [] },
      { type: 'event', source: 'internal', name: 'MEvent', fields: [] },
    ];

    const modules = deriveModules(narratives, messages);

    expect(modules[0].declares.messages).toEqual([
      { kind: 'command', name: 'ACommand' },
      { kind: 'event', name: 'MEvent' },
      { kind: 'state', name: 'ZState' },
    ]);
  });

  it('creates independent message arrays for each module', () => {
    const narratives: Narrative[] = [
      { name: 'A', id: 'a', sourceFile: 'a.ts', slices: [] },
      { name: 'B', id: 'b', sourceFile: 'b.ts', slices: [] },
    ];
    const messages: Message[] = [{ type: 'event', source: 'internal', name: 'SharedEvent', fields: [] }];

    const modules = deriveModules(narratives, messages);

    expect(modules[0].declares.messages).not.toBe(modules[1].declares.messages);
    expect(modules[0].declares.messages).toEqual(modules[1].declares.messages);
  });

  it('returns empty array when no narratives provided', () => {
    const modules = deriveModules([], []);

    expect(modules).toEqual([]);
  });

  it('groups multiple narratives with same sourceFile into one module', () => {
    const narratives: Narrative[] = [
      { name: 'Flow1', id: 'flow-1', sourceFile: 'shared.ts', slices: [] },
      { name: 'Flow2', id: 'flow-2', sourceFile: 'shared.ts', slices: [] },
      { name: 'Flow3', id: 'flow-3', sourceFile: 'shared.ts', slices: [] },
    ];
    const messages: Message[] = [];

    const modules = deriveModules(narratives, messages);

    expect(modules).toHaveLength(1);
    expect(modules[0].contains.narrativeIds).toEqual(['flow-1', 'flow-2', 'flow-3']);
  });
});
