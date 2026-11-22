import { countLiveTabs } from '../core/db/repo';
import { getSettings } from '../core/settings/store';
import { BADGE_COLORS } from '../shared/constants';

export function formatBadge(count: number): string {
  if (count <= 0) return '';
  if (count < 1000) return String(count);
  if (count < 10_000) return `${(count / 1000).toFixed(1)}k`;
  if (count < 1_000_000) return `${Math.floor(count / 1000)}k`;
  return '1M+';
}

let revertTimer: ReturnType<typeof setTimeout> | undefined;
let lastCount = 0;

async function apply(text: string, title: string): Promise<void> {
  const settings = await getSettings();
  await chrome.action.setBadgeText({ text: settings.showBadge ? text : '' });
  await chrome.action.setTitle({ title });
  try {
    await chrome.action.setBadgeBackgroundColor({ color: BADGE_COLORS.background });
    await chrome.action.setBadgeTextColor({ color: BADGE_COLORS.text });
  } catch {
    // Older Chromium builds may not support text color.
  }
}

export async function refresh(): Promise<void> {
  try {
    lastCount = await countLiveTabs();
    await apply(formatBadge(lastCount), `Stow: ${lastCount} saved tabs`);
  } catch {
    await apply('', 'Stow');
  }
}

function transient(text: string, ms: number): void {
  if (revertTimer) clearTimeout(revertTimer);
  void apply(text, text === '!' ? 'Stow: something went wrong' : 'Stow: saved');
  revertTimer = setTimeout(() => {
    revertTimer = undefined;
    void refresh();
  }, ms);
}

export function flashSuccess(): void {
  transient('✓', 1200);
}

export function flashError(): void {
  transient('!', 10_000);
}
