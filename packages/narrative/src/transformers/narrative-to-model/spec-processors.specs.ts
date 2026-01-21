import { describe, expect, it } from 'vitest';
import type { Message } from '../../index';
import type { ExampleShapeHints } from './example-shapes';
import { detectQueryAction, extractQueryNameFromRequest, processWhen } from './spec-processors';

describe('spec-processors', () => {
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
    it('should return true when whenText exactly matches query name from request', () => {
      const slice = { type: 'query', request: 'query ViewWorkoutPlan($id: ID!) { workoutPlan { id } }' };
      expect(detectQueryAction('ViewWorkoutPlan', slice)).toBe(true);
    });

    it('should return true when whenText matches query name case-insensitively', () => {
      const slice = { type: 'query', request: 'query viewWorkoutPlan { workoutPlan { id } }' };
      expect(detectQueryAction('ViewWorkoutPlan', slice)).toBe(true);
    });

    it('should return false for command slices', () => {
      const slice = { type: 'command', request: 'mutation CreateWorkout { createWorkout { id } }' };
      expect(detectQueryAction('ViewWorkoutPlan', slice)).toBe(false);
    });

    it('should return false when no request field is provided (no naming convention fallback)', () => {
      const slice = { type: 'query' };
      // Without request field, cannot determine if it's a query action
      expect(detectQueryAction('ViewWorkoutPlan', slice)).toBe(false);
      expect(detectQueryAction('GetUserProfile', slice)).toBe(false);
      expect(detectQueryAction('ListWorkouts', slice)).toBe(false);
      expect(detectQueryAction('FindUserById', slice)).toBe(false);
      expect(detectQueryAction('SearchProducts', slice)).toBe(false);
      expect(detectQueryAction('FetchOrders', slice)).toBe(false);
    });

    it('should return false for event names in query slices', () => {
      const slice = { type: 'query', request: 'query ViewWorkoutPlan { workoutPlan { id } }' };
      expect(detectQueryAction('WorkoutPlanCreated', slice)).toBe(false);
    });

    it('should return true for case-insensitive match to query name from request', () => {
      const slice = { type: 'query', request: 'query ViewWorkoutPlan { workoutPlan { id } }' };
      // Case-insensitive matching works when request field is present
      expect(detectQueryAction('viewWorkoutPlan', slice)).toBe(true);
    });

    it('should return false for empty whenText', () => {
      const slice = { type: 'query', request: 'query ViewWorkoutPlan { workoutPlan { id } }' };
      expect(detectQueryAction('', slice)).toBe(false);
    });
  });

  describe('processWhen', () => {
    const mockTypeResolver = (t: string) => ({
      resolvedName: t,
      typeInfo: undefined,
    });

    const createEmptyHints = (): ExampleShapeHints => new Map();

    describe('query action detection', () => {
      it('should create a query message when When is a query action matching request', () => {
        const messages: Map<string, Message> = new Map();
        const slice = { type: 'query', request: 'query ViewWorkoutPlan($id: ID!) { workoutPlan { id } }' };
        const when = { commandRef: 'ViewWorkoutPlan', exampleData: { workoutId: 'wrk_123' } };

        processWhen(when, slice, mockTypeResolver, messages, createEmptyHints());

        // Query message should be created for query actions
        expect(messages.size).toBe(1);
        expect(messages.has('ViewWorkoutPlan')).toBe(true);
        expect(messages.get('ViewWorkoutPlan')?.type).toBe('query');
      });

      it('should create a message when no request field (cannot detect query action)', () => {
        const messages: Map<string, Message> = new Map();
        const slice = { type: 'query' }; // No request field
        const when = { commandRef: 'ViewWorkoutHistory', exampleData: { userId: 'user_456' } };

        processWhen(when, slice, mockTypeResolver, messages, createEmptyHints());

        // Without request field, cannot detect query action - treats as event
        expect(messages.size).toBe(1);
        expect(messages.has('ViewWorkoutHistory')).toBe(true);
      });

      it('should create a query message when When matches query name from request', () => {
        const messages: Map<string, Message> = new Map();
        const slice = { type: 'query', request: 'query GetUserProfile { user { id } }' };
        const when = { commandRef: 'GetUserProfile', exampleData: { userId: 'user_123' } };

        processWhen(when, slice, mockTypeResolver, messages, createEmptyHints());

        // Query action detected via request field - query message created
        expect(messages.size).toBe(1);
        expect(messages.has('GetUserProfile')).toBe(true);
        expect(messages.get('GetUserProfile')?.type).toBe('query');
      });

      it('should create a message when When is an event name in query slice', () => {
        const messages: Map<string, Message> = new Map();
        const slice = { type: 'query', request: 'query ViewWorkoutPlan { workoutPlan { id } }' };
        const when = { commandRef: 'WorkoutPlanUpdated', exampleData: { workoutId: 'wrk_123' } };

        processWhen(when, slice, mockTypeResolver, messages, createEmptyHints());

        // Event messages SHOULD be created
        expect(messages.size).toBe(1);
        expect(messages.has('WorkoutPlanUpdated')).toBe(true);
      });

      it('should create a message for command slices regardless of naming', () => {
        const messages: Map<string, Message> = new Map();
        const slice = { type: 'command' };
        const when = { commandRef: 'ViewWorkoutPlan', exampleData: { workoutId: 'wrk_123' } };

        processWhen(when, slice, mockTypeResolver, messages, createEmptyHints());

        // Command messages SHOULD be created even if it looks like a query action name
        expect(messages.size).toBe(1);
        expect(messages.has('ViewWorkoutPlan')).toBe(true);
      });
    });

    describe('array of When items', () => {
      it('should create query messages for query action items matching request', () => {
        const messages: Map<string, Message> = new Map();
        const slice = { type: 'query', request: 'query ViewWorkoutPlan { workoutPlan { id } }' };
        const when = [{ commandRef: 'ViewWorkoutPlan', exampleData: { workoutId: 'wrk_123' } }];

        processWhen(when, slice, mockTypeResolver, messages, createEmptyHints());

        // Query action matches request - query message created
        expect(messages.size).toBe(1);
        expect(messages.has('ViewWorkoutPlan')).toBe(true);
        expect(messages.get('ViewWorkoutPlan')?.type).toBe('query');
      });

      it('should create messages when no request field (cannot detect query action)', () => {
        const messages: Map<string, Message> = new Map();
        const slice = { type: 'query' }; // No request field
        const when = [{ commandRef: 'ViewWorkoutPlan', exampleData: { workoutId: 'wrk_123' } }];

        processWhen(when, slice, mockTypeResolver, messages, createEmptyHints());

        // Without request field, cannot detect query action - message created
        expect(messages.size).toBe(1);
        expect(messages.has('ViewWorkoutPlan')).toBe(true);
      });

      it('should create messages for event items in array', () => {
        const messages: Map<string, Message> = new Map();
        const slice = { type: 'query', request: 'query ViewWorkoutPlan { workoutPlan { id } }' };
        const when = [
          { commandRef: 'WorkoutPlanCreated', exampleData: { workoutId: 'wrk_123' } },
          { commandRef: 'WorkoutPlanUpdated', exampleData: { workoutId: 'wrk_123' } },
        ];

        processWhen(when, slice, mockTypeResolver, messages, createEmptyHints());

        expect(messages.size).toBe(2);
        expect(messages.has('WorkoutPlanCreated')).toBe(true);
        expect(messages.has('WorkoutPlanUpdated')).toBe(true);
      });

      it('should create query message for query action and event message in mixed array', () => {
        const messages: Map<string, Message> = new Map();
        const slice = { type: 'query', request: 'query ViewWorkoutPlan { workoutPlan { id } }' };
        const when = [
          { commandRef: 'ViewWorkoutPlan', exampleData: { workoutId: 'wrk_123' } }, // Query action - create query message
          { commandRef: 'WorkoutPlanUpdated', exampleData: { workoutId: 'wrk_123' } }, // Event - create event message
        ];

        processWhen(when, slice, mockTypeResolver, messages, createEmptyHints());

        expect(messages.size).toBe(2);
        expect(messages.has('ViewWorkoutPlan')).toBe(true);
        expect(messages.get('ViewWorkoutPlan')?.type).toBe('query');
        expect(messages.has('WorkoutPlanUpdated')).toBe(true);
      });
    });

    describe('example shape hints collection', () => {
      it('should collect example hints for query actions', () => {
        const messages: Map<string, Message> = new Map();
        const slice = { type: 'query', request: 'query ViewWorkoutPlan { workoutPlan { id } }' };
        const when = { commandRef: 'ViewWorkoutPlan', exampleData: { workoutId: 'wrk_123', userId: 'user_456' } };
        const hints = createEmptyHints();

        processWhen(when, slice, mockTypeResolver, messages, hints);

        // Query message created and hints should be collected
        expect(messages.size).toBe(1);
        expect(messages.get('ViewWorkoutPlan')?.type).toBe('query');
        expect(hints.has('ViewWorkoutPlan')).toBe(true);
      });
    });
  });
});
