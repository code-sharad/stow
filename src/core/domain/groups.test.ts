import { describe, expect, it } from 'vitest';
import { GROUP_COLORS, UNTITLED_STACK } from './groups';

describe('groups', () => {
  it('has the nine spine colors', () => {
    expect(GROUP_COLORS).toEqual([
      'grey',
      'blue',
      'red',
      'yellow',
      'green',
      'pink',
      'purple',
      'cyan',
      'orange',
    ]);
  });

  it('names untitled stacks', () => {
    expect(UNTITLED_STACK).toBe('');
  });
});
