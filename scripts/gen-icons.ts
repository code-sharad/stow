import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const source = join(process.cwd(), 'assets/icon.png');
if (!existsSync(source)) throw new Error(`Missing ${source}`);

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
render(128, join(landing, 'icon.png'));
render(32, join(landing, 'favicon.png'));
