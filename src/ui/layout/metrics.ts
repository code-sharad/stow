export const METRICS = {
  comfortable: {
    row: 38,
    stackHead: 42,
    stackGap: 16,
    topBar: 48,
    control: 30,
    rail: 240,
    status: 28,
  },
  compact: {
    row: 32,
    stackHead: 36,
    stackGap: 10,
    topBar: 44,
    control: 27,
    rail: 210,
    status: 26,
  },
} as const;

export type Density = keyof typeof METRICS;

export const RAIL_WIDTH = 220;
export const RAIL_WIDTH_NARROW = 190;
export const CONTENT_MAX = 860;
export const SPINE_WIDTH = 3;
export const POPUP_WIDTH = 360;

export function applyMetrics(density: Density): void {
  const metrics = METRICS[density];
  const root = document.documentElement;
  root.style.setProperty('--row-h', `${metrics.row}px`);
  root.style.setProperty('--stack-head-h', `${metrics.stackHead}px`);
  root.style.setProperty('--stack-gap', `${metrics.stackGap}px`);
  root.style.setProperty('--topbar-h', `${metrics.topBar}px`);
  root.style.setProperty('--control-h', `${metrics.control}px`);
  root.style.setProperty('--rail-w', `${metrics.rail}px`);
  root.style.setProperty('--status-h', `${metrics.status}px`);
  root.dataset.density = density;
}
