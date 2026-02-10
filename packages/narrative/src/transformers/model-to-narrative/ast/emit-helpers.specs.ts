import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { type FieldTypeInfo, jsonToExpr } from './emit-helpers';

function printNode(node: ts.Node): string {
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  const sourceFile = ts.createSourceFile('test.ts', '', ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);
  return printer.printNode(ts.EmitHint.Unspecified, node, sourceFile);
}

describe('jsonToExpr', () => {
  it('should use typeResolver for array elements with type alias containing Date fields', () => {
    const data = {
      memberId: 'mem_001',
      sessions: [{ savedAt: '2030-01-15T10:00:00.000Z', name: 'Morning workout' }],
    };

    const typeInfo: FieldTypeInfo = {
      memberId: 'string',
      sessions: 'Array<SessionData>',
    };

    const typeResolver = (typeName: string): FieldTypeInfo | undefined => {
      if (typeName === 'SessionData') {
        return { savedAt: 'Date', name: 'string' };
      }
      return undefined;
    };

    const result = jsonToExpr(ts, ts.factory, data, typeInfo, typeResolver);
    const code = printNode(result);

    expect(code).toEqual(
      `{ memberId: "mem_001", sessions: [{ savedAt: new Date("2030-01-15T10:00:00.000Z"), name: "Morning workout" }] }`,
    );
  });
});
