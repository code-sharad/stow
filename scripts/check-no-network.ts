import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const files: string[] = [];
function walk(dir: string): void {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (/\.(ts|tsx|js|mjs|html|json|css)$/.test(name) && !/\.test\./.test(name))
      files.push(path);
  }
}
walk(join(root, 'src'));
walk(join(root, 'public'));

const forbidden = [
  /\bfetch\s*\(/,
  /\bXMLHttpRequest\b/,
  /\bWebSocket\b/,
  /navigator\.sendBeacon/,
  /dangerouslySetInnerHTML/,
  /\.innerHTML\s*=/,
  /\beval\s*\(/,
  /new\s+Function\s*\(/,
];
const offenders: string[] = [];
for (const file of files) {
  const rel = relative(root, file);
  const text = readFileSync(file, 'utf8');
  for (const pattern of forbidden) {
    if (pattern.test(text)) offenders.push(`${rel}: ${pattern}`);
  }
}
const config = readFileSync(join(root, 'wxt.config.ts'), 'utf8');
if (/host_permissions\s*:/.test(config))
  offenders.push('wxt.config.ts: host_permissions must stay absent');

if (offenders.length > 0) {
  console.error(`Network/safety check failed:\n${offenders.join('\n')}`);
  process.exit(1);
}
console.log(`No-network check passed across ${files.length} files.`);
