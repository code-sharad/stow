import { countLiveTabs } from '../core/db/repo';
import { BADGE_COLORS } from '../shared/constants';

let revertTimer: ReturnType<typeof setTimeout> | undefined;

async function apply(text: string, title: string): Promise<void> {
  await chrome.action.setBadgeText({ text });
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
    const count = await countLiveTabs();
    await apply('', `Stow: ${count} saved tabs`);
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
