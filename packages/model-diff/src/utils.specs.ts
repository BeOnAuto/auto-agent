import { describe, expect, it } from 'vitest';
import { toKebabCase } from './utils';

describe('toKebabCase', () => {
  it('converts PascalCase to kebab-case', () => {
    expect(toKebabCase('PropertyListing')).toBe('property-listing');
  });

  it('converts camelCase to kebab-case', () => {
    expect(toKebabCase('createUser')).toBe('create-user');
  });

  it('converts spaced strings to kebab-case', () => {
    expect(toKebabCase('Property Listing')).toBe('property-listing');
  });

  it('handles single word', () => {
    expect(toKebabCase('Todo')).toBe('todo');
  });

  it('handles already kebab-case', () => {
    expect(toKebabCase('property-listing')).toBe('property-listing');
  });
});
