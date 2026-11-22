import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const source = join(process.cwd(), 'assets/icon.svg');
const out = join(process.cwd(), 'public/icon');
if (!existsSync(source)) throw new Error(`Missing ${source}`);
mkdirSync(out, { recursive: true });
for (const size of [16, 32, 48, 128]) {
  execFileSync('rsvg-convert', [
    '-w',
    String(size),
    '-h',
    String(size),
    source,
    '-o',
    join(out, `${size}.png`),
  ]);
  console.log(`icon/${size}.png`);
}
