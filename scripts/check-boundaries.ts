import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';

const root = process.cwd();
const failures: string[] = [];

interface Rule {
  name: string;
  dirs: string[];
  forbidden: RegExp[];
}

const rules: Rule[] = [
  {
    name: 'core (domain, io, db)',
    dirs: ['src/core/domain', 'src/core/io', 'src/core/db'],
    forbidden: [/^react(?:\/|$)/, /^chrome$/, /\/(?:platform|services|ui)\//],
  },
  {
    name: 'core settings',
    dirs: ['src/core/settings'],
    forbidden: [/^react(?:\/|$)/, /^chrome$/, /\/(?:platform|services|ui)\//],
  },
  {
    name: 'platform',
    dirs: ['src/platform'],
    forbidden: [/^react(?:\/|$)/, /\/(?:services|ui)\//],
  },
  {
    name: 'services',
    dirs: ['src/services'],
    forbidden: [/^react(?:\/|$)/, /\/(?:ui)\//],
  },
];

const importPattern = /(?:from\s+|import\s*\()\s*['"]([^'"]+)['"]/g;

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      files.push(...walk(path));
    } else if (['.ts', '.tsx'].includes(extname(path)) && !path.includes('.test.')) {
      files.push(path);
    }
  }
  return files;
}

for (const rule of rules) {
  for (const dir of rule.dirs) {
    for (const file of walk(dir)) {
      const text = readFileSync(file, 'utf8');
      for (const match of text.matchAll(importPattern)) {
        const specifier = match[1];
        if (!specifier) continue;
        const resolved = specifier.startsWith('.')
          ? relative(root, resolve(root, dirname(file), specifier)).replaceAll('\\', '/')
          : specifier;
        for (const pattern of rule.forbidden) {
          if (pattern.test(resolved)) {
            failures.push(`${relative(root, file)}: ${rule.name} may not import ${specifier}`);
            break;
          }
        }
      }
    }
  }
}

if (failures.length > 0) {
  console.error('Import boundary check failed:\n');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Import boundary check passed: ${rules.length} layer rules.`);
}
