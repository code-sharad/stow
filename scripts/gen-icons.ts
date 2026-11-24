import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const source = join(process.cwd(), 'assets/icon.png');
if (!existsSync(source)) throw new Error(`Missing ${source}`);

/**
 * The landing page uses a glossier render than the extension: a 3D archive box
 * photographed on a near-black backdrop. Key that backdrop out so the inline
 * header/footer marks and the favicon sit on the page instead of inside a dark
 * tile, then inset it slightly so it balances the wordmark next to it.
 */
const glossySource = join(process.cwd(), 'assets/icon-glossy.png');
if (!existsSync(glossySource)) throw new Error(`Missing ${glossySource}`);

const renderGlossy = (size: number, file: string) => {
  const [width, height] = execFileSync('magick', [glossySource, '-format', '%w %h', 'info:'])
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
    glossySource,
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

/**
 * Trim the master to its ink, then centre it in a square. The master has
 * transparent rounded corners and a few pixels of slack on each side, so a
 * plain resize would leave a mark that drifts off-centre and shrinks at 16 px.
 */
const render = (size: number, file: string) => {
  execFileSync('magick', [
    source,
    '-trim',
    '+repage',
    '-filter',
    'Lanczos',
    '-resize',
    `${size}x${size}`,
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
renderGlossy(128, join(landing, 'icon.png'));
renderGlossy(32, join(landing, 'favicon.png'));
