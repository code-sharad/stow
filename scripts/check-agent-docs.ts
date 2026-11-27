import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const root = process.cwd();
const failures: string[] = [];
const agentDocs = [
  'AGENTS.md',
  'CLAUDE.md',
  '.github/copilot-instructions.md',
  ...readdirSync('docs/agents')
    .filter((name) => name.endsWith('.md'))
    .map((name) => `docs/agents/${name}`),
];

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  version: string;
  scripts: Record<string, string>;
};

const scriptNames = new Set(Object.keys(packageJson.scripts));
const pnpmBuiltins = new Set([
  'add',
  'audit',
  'approve-builds',
  'dlx',
  'exec',
  'install',
  'outdated',
  'publish',
  'rebuild',
  'remove',
  'store',
  'version',
  'why',
]);

const pathPattern = /(?:src|docs|scripts|e2e|e2e-firefox|\.github)\/[A-Za-z0-9_./-]+/g;
const commandPattern = /\bpnpm ([a-z][a-z0-9:-]*)/g;
const linkPattern = /\[[^\]]*\]\(([^)]+)\)/g;

let pathCount = 0;
let commandCount = 0;

for (const file of agentDocs) {
  if (!existsSync(file)) {
    failures.push(`${file}: document does not exist`);
    continue;
  }
  const text = readFileSync(file, 'utf8');

  for (const match of text.matchAll(pathPattern)) {
    const raw = match[0];
    const path = raw.replace(/[.,;:)\]]+$/u, '');
    if (path.includes('*') || path.includes('<') || path.includes('...')) continue;
    // Shorthand such as `docs/00`–`05` refers to the numbered historical documents.
    if (/^docs\/\d{2}$/u.test(path)) continue;
    pathCount += 1;
    if (!existsSync(resolve(root, path))) {
      failures.push(`${file}: referenced path does not exist: ${path}`);
    }
  }

  for (const match of text.matchAll(commandPattern)) {
    const command = match[1];
    if (!command) continue;
    commandCount += 1;
    if (!scriptNames.has(command) && !pnpmBuiltins.has(command)) {
      failures.push(`${file}: unknown pnpm script: ${command}`);
    }
  }

  for (const match of text.matchAll(linkPattern)) {
    const target = match[1];
    if (!target) continue;
    if (
      target.startsWith('http://') ||
      target.startsWith('https://') ||
      target.startsWith('mailto:') ||
      target.startsWith('#') ||
      target.startsWith('/')
    ) {
      continue;
    }
    const [withoutHash] = target.split('#');
    const [path] = (withoutHash ?? '').split('?');
    if (!path) continue;
    const resolved = resolve(root, dirname(file), path);
    if (!existsSync(resolved)) {
      failures.push(`${file}: broken markdown link: ${target}`);
    }
  }
}

const versionPattern = /stow-(\d+\.\d+\.\d+)-(?:chrome|firefox|sources)\.zip/g;
for (const file of ['README.md', 'BUILD.md']) {
  const text = readFileSync(file, 'utf8');
  for (const match of text.matchAll(versionPattern)) {
    const version = match[1];
    if (version && version !== packageJson.version) {
      failures.push(
        `${file}: artifact version ${version} does not match package.json ${packageJson.version}`,
      );
    }
  }
}

const listing = readFileSync('docs/STORE_LISTING.md', 'utf8');
for (const match of listing.matchAll(
  /docs\/store-screenshots\/[A-Za-z0-9_.-]+\.(?:png|webp|jpg)/g,
)) {
  if (!existsSync(match[0])) {
    failures.push(`docs/STORE_LISTING.md: missing screenshot ${match[0]}`);
  }
}

if (failures.length > 0) {
  console.error('Agent documentation check failed:\n');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(
    `Agent documentation check passed: ${agentDocs.length} files, ${pathCount} paths, ${commandCount} pnpm commands, version ${packageJson.version}.`,
  );
}
