import type { Example, Slice } from '@auto-engineer/narrative';
import { describe, expect, it } from 'vitest';
import { isQueryAction, stepsToGwt } from './step-converter';

describe('step-converter', () => {
  describe('stepsToGwt with query slices', () => {
    const createQuerySlice = (request?: string): Slice =>
      ({
        type: 'query',
        name: 'View Workout Plan',
        request,
        client: { specs: [] },
        server: { description: '', specs: [] },
      }) as unknown as Slice;

    const createExample = (
      steps: Array<{ keyword: string; text: string; docString?: Record<string, unknown> }>,
    ): Example =>
      ({
        name: 'test example',
        steps: steps.map((s) => ({
          keyword: s.keyword as 'Given' | 'When' | 'Then',
          text: s.text,
          docString: s.docString ?? {},
        })),
      }) as Example;

    describe('Pattern 2: Query Action', () => {
      it('should produce QueryActionRef when When matches query name from request', () => {
        const slice = createQuerySlice('query ViewWorkoutPlan($workoutId: ID!) { workoutPlan { id } }');
        const example = createExample([
          { keyword: 'Given', text: 'WorkoutPlanCreated', docString: { workoutId: 'wrk_123' } },
          { keyword: 'When', text: 'ViewWorkoutPlan', docString: { workoutId: 'wrk_123' } },
          { keyword: 'Then', text: 'WorkoutPlanView', docString: { workoutId: 'wrk_123', name: 'My Plan' } },
        ]);

        const result = stepsToGwt(example, 'query', slice);

        expect(isQueryAction(result.when)).toBe(true);
        if (isQueryAction(result.when)) {
          expect(result.when.queryAction).toBe('ViewWorkoutPlan');
          expect(result.when.args).toEqual({ workoutId: 'wrk_123' });
        }
      });

      it('should produce QueryActionRef when When matches query name case-insensitively', () => {
        const slice = createQuerySlice('query viewWorkoutHistory { history { id } }');
        const example = createExample([
          { keyword: 'Given', text: 'WorkoutPlanCreated', docString: { workoutId: 'wrk_123' } },
          { keyword: 'When', text: 'ViewWorkoutHistory', docString: { userId: 'user_456' } },
          { keyword: 'Then', text: 'WorkoutHistoryView', docString: { userId: 'user_456' } },
        ]);

        const result = stepsToGwt(example, 'query', slice);

        expect(isQueryAction(result.when)).toBe(true);
        if (isQueryAction(result.when)) {
          expect(result.when.queryAction).toBe('ViewWorkoutHistory');
          expect(result.when.args).toEqual({ userId: 'user_456' });
        }
      });

      it('should produce EventRef[] when no request field is provided', () => {
        const slice = createQuerySlice(); // No request = cannot detect query action
        const example = createExample([
          { keyword: 'Given', text: 'UserCreated', docString: { userId: 'user_123' } },
          { keyword: 'When', text: 'GetUserProfile', docString: { userId: 'user_123' } },
          { keyword: 'Then', text: 'UserProfileView', docString: { userId: 'user_123' } },
        ]);

        const result = stepsToGwt(example, 'query', slice);

        // Without request, cannot determine if it's a query action - treats as event
        expect(isQueryAction(result.when)).toBe(false);
        expect(Array.isArray(result.when)).toBe(true);
      });
    });

    describe('Pattern 1: Event-based', () => {
      it('should produce EventRef[] when When contains event names', () => {
        const slice = createQuerySlice('query ViewWorkoutPlan { workoutPlan { id } }');
        const example = createExample([
          { keyword: 'Given', text: 'WorkoutPlanCreated', docString: { workoutId: 'wrk_123' } },
          { keyword: 'When', text: 'WorkoutPlanUpdated', docString: { workoutId: 'wrk_123', name: 'Updated Plan' } },
          { keyword: 'Then', text: 'WorkoutPlanView', docString: { workoutId: 'wrk_123', name: 'Updated Plan' } },
        ]);

        const result = stepsToGwt(example, 'query', slice);

        expect(isQueryAction(result.when)).toBe(false);
        expect(Array.isArray(result.when)).toBe(true);
        if (Array.isArray(result.when)) {
          expect(result.when).toHaveLength(1);
          expect(result.when[0].eventRef).toBe('WorkoutPlanUpdated');
        }
      });

      it('should produce EventRef[] when When does not match query action patterns', () => {
        const slice = createQuerySlice();
        const example = createExample([
          { keyword: 'Given', text: 'OrderCreated', docString: { orderId: 'ord_123' } },
          { keyword: 'When', text: 'OrderShipped', docString: { orderId: 'ord_123' } },
          { keyword: 'Then', text: 'OrderView', docString: { orderId: 'ord_123', status: 'shipped' } },
        ]);

        const result = stepsToGwt(example, 'query', slice);

        expect(isQueryAction(result.when)).toBe(false);
        expect(Array.isArray(result.when)).toBe(true);
      });

      it('should produce EventRef[] for multiple When events', () => {
        const slice = createQuerySlice();
        const example = createExample([
          { keyword: 'Given', text: 'AccountCreated', docString: { accountId: 'acc_123' } },
          { keyword: 'When', text: 'DepositMade', docString: { amount: 100 } },
          { keyword: 'And', text: 'WithdrawalMade', docString: { amount: 50 } },
          { keyword: 'Then', text: 'AccountBalanceView', docString: { balance: 50 } },
        ]);

        const result = stepsToGwt(example, 'query', slice);

        // Multiple When items should be treated as events
        expect(Array.isArray(result.when)).toBe(true);
        if (Array.isArray(result.when)) {
          expect(result.when).toHaveLength(2);
          expect(result.when[0].eventRef).toBe('DepositMade');
          expect(result.when[1].eventRef).toBe('WithdrawalMade');
        }
      });
    });

    describe('backward compatibility', () => {
      it('should work without slice parameter (defaults to event-based)', () => {
        const example = createExample([
          { keyword: 'Given', text: 'WorkoutPlanCreated', docString: { workoutId: 'wrk_123' } },
          { keyword: 'When', text: 'ViewWorkoutPlan', docString: { workoutId: 'wrk_123' } },
          { keyword: 'Then', text: 'WorkoutPlanView', docString: { workoutId: 'wrk_123' } },
        ]);

        // Without slice parameter, should treat as events (backward compatible)
        const result = stepsToGwt(example, 'query');

        expect(Array.isArray(result.when)).toBe(true);
      });
    });
  });

  describe('stepsToGwt with command slices', () => {
    it('should produce CommandRef for command slices', () => {
      const example: Example = {
        name: 'test command',
        steps: [
          { keyword: 'Given', text: 'UserExists', docString: { userId: 'user_123' } },
          { keyword: 'When', text: 'CreateWorkout', docString: { name: 'My Workout' } },
          { keyword: 'Then', text: 'WorkoutCreated', docString: { workoutId: 'wrk_123' } },
        ],
      } as Example;

      const result = stepsToGwt(example, 'command');

      expect('commandRef' in result.when).toBe(true);
      if ('commandRef' in result.when) {
        expect(result.when.commandRef).toBe('CreateWorkout');
      }
    });
  });
});
