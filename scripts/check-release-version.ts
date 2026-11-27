import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readTag(): string {
  const fromEnv = process.env.GITHUB_REF_NAME?.trim();
  if (fromEnv) return fromEnv;
  try {
    return execFileSync('git', ['describe', '--tags', '--exact-match'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

function fail(message: string): never {
  console.error(`check-release-version: ${message}`);
  process.exit(1);
}

const tag = readTag().replace(/^v/, '');
if (!tag) {
  fail('no release tag found (set GITHUB_REF_NAME or check out an exact tag)');
}

const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8')) as {
  version?: string;
};
const version = pkg.version ?? '';
if (!version) fail('package.json has no version');

const changelog = readFileSync(path.join(root, 'docs/CHANGELOG.md'), 'utf8');
const hasHeading = changelog.split('\n').some((line) => line.trim() === `## ${version}`);

if (tag !== version || !hasHeading) {
  fail(
    [
      `tag "${tag}" does not match package.json "${version}"${hasHeading ? '' : ` and docs/CHANGELOG.md has no "## ${version}" heading`}.`,
      'Bump the version, add the changelog heading, or retag before publishing.',
    ].join(' '),
  );
}

console.log(`check-release-version: ${tag} matches package.json and docs/CHANGELOG.md`);
