import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const files: string[] = [];
function walk(dir: string): void {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (/\.(css|tsx|ts)$/.test(name) && !/\.test\./.test(name)) files.push(path);
  }
}
walk(join(root, 'src'));

const offenders: string[] = [];
for (const file of files) {
  const rel = relative(root, file);
  if (rel.endsWith('ui/styles/tokens.css') || rel === 'src/shared/constants.ts') continue;
  const text = readFileSync(file, 'utf8');
  for (const match of text.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
    offenders.push(`${rel}: ${match[0]}`);
  }
}
if (offenders.length > 0) {
  console.error(`Raw colours found outside tokens.css:\n${offenders.join('\n')}`);
  process.exit(1);
}
console.log(`Token check passed across ${files.length} files.`);
