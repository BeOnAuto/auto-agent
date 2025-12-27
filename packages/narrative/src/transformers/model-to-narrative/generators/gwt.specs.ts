import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { buildConsolidatedGwtSpecBlock, buildGwtSpecBlock, type GWTBlock } from './gwt';

function printNode(node: ts.Node): string {
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  const sourceFile = ts.createSourceFile('test.ts', '', ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);
  return printer.printNode(ts.EmitHint.Unspecified, node, sourceFile);
}

describe('buildGwtSpecBlock', () => {
  it('generates builder chain pattern for when+then (no given)', () => {
    const gwtBlock: GWTBlock & { ruleDescription: string; exampleDescription: string; ruleId: string } = {
      when: { commandRef: 'AddTodo', exampleData: { todoId: 'todo-001', description: 'Buy groceries' } },
      then: [
        {
          eventRef: 'TodoAdded',
          exampleData: {
            todoId: 'todo-001',
            description: 'Buy groceries',
            status: 'pending',
            addedAt: '2030-01-01T09:00:00.000Z',
          },
        },
      ],
      ruleDescription: 'todos can be added to the list',
      exampleDescription: 'adds a new todo successfully',
      ruleId: 'r1B2Cp8Y',
    };

    const result = buildGwtSpecBlock(ts, ts.factory, gwtBlock, 'command');
    const code = printNode(result);

    expect(code).toContain('rule("todos can be added to the list"');
    expect(code).toContain('"r1B2Cp8Y"');
    expect(code).toContain('example("adds a new todo successfully")');
    expect(code).toContain('.when<AddTodo>');
    expect(code).toContain('.then<TodoAdded>');
    expect(code).not.toMatch(/example\("[^"]+",\s*\(\)/);
  });

  it('generates builder chain pattern for given+when+then', () => {
    const gwtBlock: GWTBlock & { ruleDescription: string; exampleDescription: string; ruleId: string } = {
      given: [
        {
          eventRef: 'TodoAdded',
          exampleData: {
            todoId: 'todo-001',
            description: 'Buy groceries',
            status: 'pending',
            addedAt: '2030-01-01T09:00:00.000Z',
          },
        },
      ],
      when: { commandRef: 'MarkTodoInProgress', exampleData: { todoId: 'todo-001' } },
      then: [
        {
          eventRef: 'TodoMarkedInProgress',
          exampleData: { todoId: 'todo-001', markedAt: '2030-01-01T10:00:00.000Z' },
        },
      ],
      ruleDescription: 'todos can be moved to in progress',
      exampleDescription: 'moves a pending todo to in progress',
      ruleId: 'r2C3Dq9Z',
    };

    const result = buildGwtSpecBlock(ts, ts.factory, gwtBlock, 'command');
    const code = printNode(result);

    expect(code).toContain('example("moves a pending todo to in progress")');
    expect(code).toContain('.given<TodoAdded>');
    expect(code).toContain('.when<MarkTodoInProgress>');
    expect(code).toContain('.then<TodoMarkedInProgress>');
    expect(code).not.toMatch(/example\("[^"]+",\s*\(\)/);
  });

  it('generates builder chain with .and() for multiple given events', () => {
    const gwtBlock: GWTBlock & { ruleDescription: string; exampleDescription: string; ruleId: string } = {
      given: [
        {
          eventRef: 'TodoAdded',
          exampleData: { todoId: 'todo-001', description: 'Buy groceries', status: 'pending' },
        },
        {
          eventRef: 'TodoMarkedInProgress',
          exampleData: { todoId: 'todo-001', markedAt: '2030-01-01T10:00:00.000Z' },
        },
      ],
      when: { commandRef: 'MarkTodoComplete', exampleData: { todoId: 'todo-001' } },
      then: [
        {
          eventRef: 'TodoMarkedComplete',
          exampleData: { todoId: 'todo-001', completedAt: '2030-01-01T11:00:00.000Z' },
        },
      ],
      ruleDescription: 'todos can be marked as complete',
      exampleDescription: 'marks an in-progress todo as complete',
      ruleId: 'r3D4Eq0A',
    };

    const result = buildGwtSpecBlock(ts, ts.factory, gwtBlock, 'command');
    const code = printNode(result);

    expect(code).toContain('.given<TodoAdded>');
    expect(code).toContain('.and<TodoMarkedInProgress>');
    expect(code).toContain('.when<MarkTodoComplete>');
    expect(code).toContain('.then<TodoMarkedComplete>');
    expect(code).not.toMatch(/example\("[^"]+",\s*\(\)/);
  });

  it('still wraps example in rule callback', () => {
    const gwtBlock: GWTBlock & { ruleDescription: string; exampleDescription: string; ruleId: string } = {
      when: { commandRef: 'AddTodo', exampleData: { todoId: 'todo-001' } },
      then: [{ eventRef: 'TodoAdded', exampleData: { todoId: 'todo-001' } }],
      ruleDescription: 'test rule',
      exampleDescription: 'test example',
      ruleId: 'testId',
    };

    const result = buildGwtSpecBlock(ts, ts.factory, gwtBlock, 'command');
    const code = printNode(result);

    expect(code).toMatch(/rule\([^)]+\)\s*=>/);
  });
});

describe('buildConsolidatedGwtSpecBlock', () => {
  it('generates multiple examples with builder chain pattern', () => {
    const rule = { id: 'r3D4Eq0A', description: 'todos can be marked as complete' };
    const gwtBlocks: Array<GWTBlock & { exampleDescription: string }> = [
      {
        given: [{ eventRef: 'TodoAdded', exampleData: { todoId: 'todo-001' } }],
        when: { commandRef: 'MarkTodoComplete', exampleData: { todoId: 'todo-001' } },
        then: [{ eventRef: 'TodoMarkedComplete', exampleData: { todoId: 'todo-001' } }],
        exampleDescription: 'marks an in-progress todo as complete',
      },
      {
        given: [{ eventRef: 'TodoAdded', exampleData: { todoId: 'todo-002' } }],
        when: { commandRef: 'MarkTodoComplete', exampleData: { todoId: 'todo-002' } },
        then: [{ eventRef: 'TodoMarkedComplete', exampleData: { todoId: 'todo-002' } }],
        exampleDescription: 'marks a pending todo directly as complete',
      },
    ];

    const result = buildConsolidatedGwtSpecBlock(ts, ts.factory, rule, gwtBlocks, 'command');
    const code = printNode(result);

    expect(code).toContain('rule("todos can be marked as complete"');
    expect(code).toContain('"r3D4Eq0A"');
    expect(code).toContain('example("marks an in-progress todo as complete")');
    expect(code).toContain('example("marks a pending todo directly as complete")');
    expect(code).toContain('.given<TodoAdded>');
    expect(code).toContain('.when<MarkTodoComplete>');
    expect(code).toContain('.then<TodoMarkedComplete>');
    expect(code).not.toMatch(/example\("[^"]+",\s*\(\)/);
  });
});
