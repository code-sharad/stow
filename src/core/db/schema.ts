import Dexie, { type Table } from 'dexie';
import type { Id, LogRow, MetaRow, Operation, SavedTab, Stack } from '../domain/types';

export class StowDB extends Dexie {
  stacks!: Table<Stack, Id>;
  tabs!: Table<SavedTab, Id>;
  ops!: Table<Operation, Id>;
  meta!: Table<MetaRow, string>;
  logs!: Table<LogRow, number>;

  constructor(name = 'stow') {
    super(name);
    this.version(1).stores({
      stacks: 'id, deletedAt, deletedBy, [deletedAt+pinned+orderKey]',
      tabs: 'id, stackId, deletedAt, deletedBy, urlKey, [stackId+deletedAt+orderKey], [deletedAt+urlKey]',
      ops: 'id, createdAt',
      meta: 'key',
      logs: '++id, ts',
    });
  }
}

let instance: StowDB | null = null;

export function db(): StowDB {
  if (!instance) instance = new StowDB();
  return instance;
}

export function setDbForTests(next: StowDB | null): void {
  if (instance && instance !== next && instance.isOpen()) instance.close();
  instance = next;
}
