import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * One master for every surface: a glossy 3D archive box rendered against a
 * near-black backdrop. It arrives photographed rather than cut out, so a plain
 * downscale would carry a dark tile onto the page and into the toolbar. Key the
 * backdrop out first, then inset the subject slightly so a mark this dense does
 * not crowd the wordmark it sits next to.
 *
 * `assets/icon.png` is the retired flat master. It stays in the repository as
 * the previous mark; nothing renders from it.
 */
const master = join(process.cwd(), 'assets/icon-glossy.png');
if (!existsSync(master)) throw new Error(`Missing ${master}`);

const render = (size: number, file: string) => {
  const [width, height] = execFileSync('magick', [master, '-format', '%w %h', 'info:'])
    .toString()
    .trim()
    .split(' ')
    .map(Number) as [number, number];
  const edges = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
    [Math.floor(width / 2), 0],
    [0, Math.floor(height / 2)],
    [width - 1, Math.floor(height / 2)],
    [Math.floor(width / 2), height - 1],
  ];
  const inset = Math.round(size * 0.96);
  execFileSync('magick', [
    master,
    '-background',
    'black',
    '-alpha',
    'remove',
    '-alpha',
    'off',
    '-fuzz',
    '14%',
    '-fill',
    'none',
    ...edges.flatMap(([x, y]) => ['-draw', `color ${x},${y} floodfill`]),
    '-channel',
    'A',
    '-morphology',
    'Erode',
    'Disk:2',
    '+channel',
    '-channel',
    'A',
    '-blur',
    '0x1.5',
    '+channel',
    '-trim',
    '+repage',
    '-filter',
    'Lanczos',
    '-resize',
    `${inset}x${inset}`,
    '-unsharp',
    '0x0.75+0.6+0.02',
    '-background',
    'none',
    '-gravity',
    'center',
    '-extent',
    `${size}x${size}`,
    '-strip',
    file,
  ]);
  console.log(`${file.slice(process.cwd().length + 1)}`);
};

const out = join(process.cwd(), 'public/icon');
mkdirSync(out, { recursive: true });
for (const size of [16, 32, 48, 64, 128]) render(size, join(out, `${size}.png`));

const landing = join(process.cwd(), 'landing/assets');
mkdirSync(landing, { recursive: true });
render(128, join(landing, 'icon.png'));
render(32, join(landing, 'favicon.png'));
