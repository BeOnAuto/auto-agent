import type { Slice } from '@auto-engineer/narrative';
import { describe, expect, it } from 'vitest';
import { detectQueryAction, extractQueryNameFromRequest, isQueryAction, type QueryActionRef } from './step-types';

describe('step-types', () => {
  describe('isQueryAction', () => {
    it('should return true for QueryActionRef', () => {
      const queryAction: QueryActionRef = {
        queryAction: 'ViewWorkoutPlan',
        args: { workoutId: 'wrk_123' },
      };
      expect(isQueryAction(queryAction)).toBe(true);
    });

    it('should return false for CommandRef', () => {
      const commandRef = {
        commandRef: 'CreateWorkout',
        exampleData: {},
      };
      expect(isQueryAction(commandRef)).toBe(false);
    });

    it('should return false for EventRef array', () => {
      const events = [{ eventRef: 'WorkoutCreated', exampleData: {} }];
      expect(isQueryAction(events)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isQueryAction(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isQueryAction(undefined)).toBe(false);
    });
  });

  describe('extractQueryNameFromRequest', () => {
    it('should extract query name from simple GraphQL query', () => {
      const request = 'query ViewWorkoutPlan { workoutPlan { id } }';
      expect(extractQueryNameFromRequest(request)).toBe('ViewWorkoutPlan');
    });

    it('should extract query name from GraphQL query with variables', () => {
      const request = 'query ViewWorkoutPlan($workoutId: ID!) { workoutPlan(id: $workoutId) { id name } }';
      expect(extractQueryNameFromRequest(request)).toBe('ViewWorkoutPlan');
    });

    it('should extract query name case-insensitively', () => {
      const request = 'QUERY GetUserProfile { user { id } }';
      expect(extractQueryNameFromRequest(request)).toBe('GetUserProfile');
    });

    it('should return null for undefined request', () => {
      expect(extractQueryNameFromRequest(undefined)).toBe(null);
    });

    it('should return null for empty string', () => {
      expect(extractQueryNameFromRequest('')).toBe(null);
    });

    it('should return null for mutation', () => {
      const request = 'mutation CreateWorkout { createWorkout { id } }';
      expect(extractQueryNameFromRequest(request)).toBe(null);
    });

    it('should extract query name from JSON AST format', () => {
      const ast = {
        kind: 'Document',
        definitions: [
          {
            kind: 'OperationDefinition',
            operation: 'query',
            name: { value: 'ListWorkouts' },
          },
        ],
      };
      expect(extractQueryNameFromRequest(JSON.stringify(ast))).toBe('ListWorkouts');
    });
  });

  describe('detectQueryAction', () => {
    const createQuerySlice = (request?: string): Slice =>
      ({
        type: 'query',
        name: 'View Workout Plan',
        request,
        client: { specs: [] },
        server: { description: '', specs: [] },
      }) as unknown as Slice;

    const createCommandSlice = (): Slice =>
      ({
        type: 'command',
        name: 'Create Workout',
        client: { specs: [] },
        server: { description: '', specs: [] },
      }) as unknown as Slice;

    it('should return true when whenText exactly matches query name from request', () => {
      const slice = createQuerySlice('query ViewWorkoutPlan($id: ID!) { workoutPlan { id } }');
      expect(detectQueryAction('ViewWorkoutPlan', slice)).toBe(true);
    });

    it('should return true when whenText matches query name case-insensitively', () => {
      const slice = createQuerySlice('query viewWorkoutPlan { workoutPlan { id } }');
      expect(detectQueryAction('ViewWorkoutPlan', slice)).toBe(true);
    });

    it('should return false for command slices', () => {
      const slice = createCommandSlice();
      expect(detectQueryAction('ViewWorkoutPlan', slice)).toBe(false);
    });

    it('should return false when no request field is provided', () => {
      const slice = createQuerySlice(); // No request
      expect(detectQueryAction('ViewWorkoutPlan', slice)).toBe(false);
    });

    it('should return false for event names that do not match query name', () => {
      const slice = createQuerySlice('query ViewWorkoutPlan { workoutPlan { id } }');
      expect(detectQueryAction('WorkoutPlanCreated', slice)).toBe(false);
    });

    it('should return false for empty whenText', () => {
      const slice = createQuerySlice('query ViewWorkoutPlan { workoutPlan { id } }');
      expect(detectQueryAction('', slice)).toBe(false);
    });

    it('should return false when request contains mutation instead of query', () => {
      const slice = createQuerySlice('mutation CreateWorkout { createWorkout { id } }');
      expect(detectQueryAction('CreateWorkout', slice)).toBe(false);
    });
  });
});
