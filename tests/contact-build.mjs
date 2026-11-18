import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import contactBuild from '../src/lib/contact-build.mjs';

const directory = await mkdtemp(join(tmpdir(), 'contact-build-'));
const dir = pathToFileURL(directory + '/');
try {
  await writeFile(join(directory, '.htaccess'), 'ErrorDocument 404 /404.html\n');
  await contactBuild(true).hooks['astro:build:done']({ dir });
  const enabled = await readdir(directory);
  for (const name of ['contact.php', 'contact-config.php', 'php.ini', '.htaccess']) assert(enabled.includes(name));
  const rules = await readFile(join(directory, '.htaccess'), 'utf8');
  assert(rules.includes('LimitRequestBody 65536'));
  assert(rules.includes('ErrorDocument 404 /404.html'));
  // Astro normally clears its output, but a stale contact block must not survive
  // even when the packaging hook is applied to an existing output directory.
  await contactBuild(false).hooks['astro:build:done']({ dir });
  const disabled = await readdir(directory);
  for (const name of ['contact.php', 'contact-config.php', 'php.ini']) assert(!disabled.includes(name));
  const disabledRules = await readFile(join(directory, '.htaccess'), 'utf8');
  assert(!disabledRules.includes('RewriteRule ^contact\\.php$ - [END]'));
  assert(disabledRules.includes('ErrorDocument 404 /404.html'));
  console.log('PASS: enabled packaging, disabled cleanup, no stale PHP allow rule, existing rules preserved.');
} finally {
  assert.equal(dirname(resolve(directory)), resolve(tmpdir()));
  assert(directory.includes('contact-build-'));
  await rm(directory, { recursive: true, force: true });
}
