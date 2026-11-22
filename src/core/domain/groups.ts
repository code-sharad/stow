import type { GroupColor } from './types';

/** A named, ordered list of tabs created by one stow. `GroupColor` mirrors native tab groups. */
export const GROUP_COLORS: readonly GroupColor[] = [
  'grey',
  'blue',
  'red',
  'yellow',
  'green',
  'pink',
  'purple',
  'cyan',
  'orange',
];

/** Used when a native group color is unknown. */
export const UNTITLED_STACK = '';
