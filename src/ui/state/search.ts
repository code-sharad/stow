import MiniSearch from 'minisearch';
import type { SavedTab, Stack } from '../../core/domain/types';
import { hostOf } from '../../core/domain/url';

export interface SearchDoc {
  id: string;
  title: string;
  url: string;
  stackTitle: string;
}

export class LibrarySearch {
  private index: MiniSearch<SearchDoc>;
  private docs = new Map<string, SearchDoc>();
  private built = false;

  constructor() {
    this.index = new MiniSearch<SearchDoc>({
      fields: ['title', 'url', 'stackTitle'],
      storeFields: ['id'],
      tokenize: (text) => text.split(/[\s/.\-_?=&]+/).filter(Boolean),
      searchOptions: { prefix: true, fuzzy: 0.2, boost: { title: 2, stackTitle: 1.2 } },
    });
  }

  rebuild(tabs: Record<string, SavedTab>, stacks: Stack[]): void {
    this.index.removeAll();
    this.docs.clear();
    const titleById = new Map(stacks.map((stack) => [stack.id, stack.title]));
    for (const tab of Object.values(tabs)) {
      if (tab.deletedAt !== 0) continue;
      const doc: SearchDoc = {
        id: tab.id,
        title: tab.title,
        url: tab.url,
        stackTitle: titleById.get(tab.stackId) ?? '',
      };
      this.docs.set(tab.id, doc);
      this.index.add(doc);
    }
    this.built = true;
  }

  search(query: string): Set<string> | null {
    const value = query.trim();
    if (!value) return null;
    if (!this.built) return new Set();
    const domainMatch = /^domain:(.+)$/i.exec(value);
    if (domainMatch) {
      const suffix = (domainMatch[1] ?? '').trim().toLowerCase();
      return new Set(
        [...this.docs.values()]
          .filter((doc) => hostOf(doc.url).toLowerCase().endsWith(suffix))
          .map((doc) => doc.id),
      );
    }
    return new Set(this.index.search(value).map((result) => String(result.id)));
  }
}
