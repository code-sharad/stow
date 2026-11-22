import type { Stack } from '../core/domain/types';
import { t } from './i18n';

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

const shortDate = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });

export function formatDate(ms: number): string {
  return dateFormatter.format(new Date(ms));
}

export function formatShortDate(ms: number): string {
  return shortDate.format(new Date(ms));
}

export function stackTitle(stack: Stack): string {
  return stack.title.trim() || formatDate(stack.createdAt);
}

export function tabCount(count: number): string {
  return t(count === 1 ? 'tabCountOne' : 'tabCountOther', { n: count });
}

export function relativeTime(ms: number): string {
  const diff = Date.now() - ms;
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} d ago`;
  return formatDate(ms);
}

export function escapeMarkdown(value: string): string {
  return value.replace(/([\\[\]()])/g, '\\$1');
}

export function stackAsMarkdown(title: string, tabs: { title: string; url: string }[]): string {
  const lines = [`## ${title}`, ''];
  for (const tab of tabs) lines.push(`- [${escapeMarkdown(tab.title || tab.url)}](${tab.url})`);
  return lines.join('\n');
}

export function stackAsText(tabs: { title: string; url: string }[]): string {
  return tabs.map((tab) => (tab.title ? `${tab.url} | ${tab.title}` : tab.url)).join('\n');
}
