import { generateKeyBetween, generateNKeysBetween } from 'fractional-indexing';

/** Fractional order keys: ascending = top → bottom. */
export function firstKey(): string {
  return generateKeyBetween(null, null);
}

export function keyBetween(a: string | null, b: string | null): string {
  return generateKeyBetween(a, b);
}

export function keysBetween(a: string | null, b: string | null, n: number): string[] {
  if (n <= 0) return [];
  return generateNKeysBetween(a, b, n);
}

/** Keys for `n` new items placed at the top, given the current first key. */
export function keysBefore(first: string | null, n: number): string[] {
  if (n <= 0) return [];
  const keys: string[] = [];
  let cursor = first;
  for (let i = 0; i < n; i++) {
    const key = generateKeyBetween(null, cursor);
    keys.unshift(key);
    cursor = key;
  }
  return keys;
}

export function keysAfter(last: string | null, n: number): string[] {
  if (n <= 0) return [];
  const keys: string[] = [];
  let cursor = last;
  for (let i = 0; i < n; i++) {
    cursor = generateKeyBetween(cursor, null);
    keys.push(cursor);
  }
  return keys;
}

export function sortByOrderKey<T extends { orderKey: string }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) =>
    a.orderKey < b.orderKey ? -1 : a.orderKey > b.orderKey ? 1 : 0,
  );
}
