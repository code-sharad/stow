import { describe, expect, it } from 'vitest';
import { firstKey, keyBetween, keysAfter, keysBefore, keysBetween, sortByOrderKey } from './order';

const keyed = (key: string) => ({ orderKey: key });

describe('fractional order keys', () => {
  it('generates strictly increasing keys', () => {
    const keys = keysAfter(null, 5);
    expect(keys).toHaveLength(5);
    expect(keys).toEqual([...keys].sort());
    expect(new Set(keys).size).toBe(5);
  });

  it('generates keys before an existing key', () => {
    const keys = keysBefore('a5', 3);
    expect(keys).toHaveLength(3);
    expect([...keys, 'a5']).toEqual([...keys, 'a5'].sort());
  });

  it('places a key between neighbours', () => {
    const key = keyBetween('a1', 'a2');
    expect(key > 'a1').toBe(true);
    expect(key < 'a2').toBe(true);
    expect(firstKey()).toBeTruthy();
  });

  it('creates keys between two keys or open ends', () => {
    expect(keysBetween('a1', 'a2', 1)[0]).toBeTruthy();
    expect(keysBetween(null, null, 2)).toHaveLength(2);
  });

  it('sorts by orderKey without mutating input', () => {
    const input = [keyed('a2'), keyed('a1'), keyed('a3')];
    const sorted = sortByOrderKey(input);
    expect(sorted.map((item) => item.orderKey)).toEqual(['a1', 'a2', 'a3']);
    expect(input[0]?.orderKey).toBe('a2');
  });
});
