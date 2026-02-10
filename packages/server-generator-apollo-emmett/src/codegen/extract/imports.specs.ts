import { describe, expect, it } from 'vitest';
import type { Message } from '../types';
import { groupEventImports } from './imports';

describe('groupEventImports', () => {
  it('groups same-slice events as ./events', () => {
    const events: Message[] = [{ type: 'OrderCreated', fields: [], source: 'then' }];

    const result = groupEventImports({
      currentSliceName: 'create order',
      currentFlowName: 'order management',
      events,
    });

    expect(result).toEqual([{ importPath: './events', eventTypes: ['OrderCreated'] }]);
  });

  it('groups cross-slice same-flow events as ../other-slice/events', () => {
    const events: Message[] = [
      {
        type: 'OrderCreated',
        fields: [],
        source: 'when',
        sourceFlowName: 'order management',
        sourceSliceName: 'create order',
      },
    ];

    const result = groupEventImports({
      currentSliceName: 'notify customer',
      currentFlowName: 'order management',
      events,
    });

    expect(result).toEqual([{ importPath: '../create-order/events', eventTypes: ['OrderCreated'] }]);
  });

  it('groups cross-flow events as ../../other-flow/other-slice/events', () => {
    const events: Message[] = [
      {
        type: 'WorkoutCreated',
        fields: [],
        source: 'when',
        sourceFlowName: 'gym workout creation',
        sourceSliceName: 'create workout',
      },
    ];

    const result = groupEventImports({
      currentSliceName: 'view workout progress',
      currentFlowName: 'gym workout completion',
      events,
    });

    expect(result).toEqual([
      {
        importPath: '../../gym-workout-creation/create-workout/events',
        eventTypes: ['WorkoutCreated'],
      },
    ]);
  });

  it('handles mixed same-flow and cross-flow events', () => {
    const events: Message[] = [
      {
        type: 'WorkoutCompleted',
        fields: [],
        source: 'when',
        sourceFlowName: 'gym workout completion',
        sourceSliceName: 'complete workout',
      },
      {
        type: 'WorkoutCreated',
        fields: [],
        source: 'when',
        sourceFlowName: 'gym workout creation',
        sourceSliceName: 'create workout',
      },
    ];

    const result = groupEventImports({
      currentSliceName: 'view workout progress',
      currentFlowName: 'gym workout completion',
      events,
    });

    expect(result).toEqual([
      {
        importPath: '../complete-workout/events',
        eventTypes: ['WorkoutCompleted'],
      },
      {
        importPath: '../../gym-workout-creation/create-workout/events',
        eventTypes: ['WorkoutCreated'],
      },
    ]);
  });
});
