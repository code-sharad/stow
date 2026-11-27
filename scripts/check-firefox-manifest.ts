import { readFileSync } from 'node:fs';
import path from 'node:path';

const manifestPath = path.join(process.cwd(), '.output/firefox-mv3/manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
  manifest_version?: number;
  permissions?: string[];
  optional_permissions?: string[];
  browser_specific_settings?: { gecko?: { id?: string } };
};

const required = ['tabs', 'tabGroups', 'storage', 'unlimitedStorage', 'contextMenus', 'alarms'];
const problems: string[] = [];

if (manifest.manifest_version !== 3) problems.push('manifest_version must be 3');
if (manifest.permissions?.includes('favicon')) {
  problems.push('Firefox must not request the Chromium-only "favicon" permission');
}
for (const permission of required) {
  if (!manifest.permissions?.includes(permission))
    problems.push(`missing permission: ${permission}`);
}
if (!manifest.optional_permissions?.includes('downloads')) {
  problems.push('downloads must remain optional');
}
if (manifest.browser_specific_settings?.gecko?.id !== 'stow-tabs@code-sharad.github.io') {
  problems.push('unexpected Gecko id; signed updates would break');
}

if (problems.length > 0) {
  console.error('Firefox manifest check failed:');
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log('Firefox manifest check passed.');
