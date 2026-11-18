import { copyFile, readFile, writeFile, unlink } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

/** Package the optional backend after Astro has generated the static site. */
export default function contactBuild(enabled) {
  const source = new URL('../../server/', import.meta.url);
  return {
    name: 'contact-build',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        for (const name of ['contact.php', 'contact-config.php', 'php.ini']) {
          const destination = new URL(name, dir);
          if (enabled) {
            await copyFile(new URL(name, source), destination);
          } else {
            await unlink(destination).catch((error) => { if (error.code !== 'ENOENT') throw error; });
          }
        }
        const htaccess = new URL('.htaccess', dir);
        const previous = await readFile(htaccess, 'utf8').catch((error) => {
          if (error.code !== 'ENOENT') throw error;
          return '';
        });
        const existing = previous.replace(/^# BEGIN CONTACT SECURITY\n[\s\S]*?^# END CONTACT SECURITY\n/gm, '');
        // Security rules go first, so existing redirects cannot bypass them.
        const contactRules = enabled ? await readFile(new URL('contact.htaccess', source), 'utf8') : '';
        const staticRules = await readFile(new URL('static.htaccess', source), 'utf8');
        await writeFile(htaccess, `# BEGIN CONTACT SECURITY\nRewriteEngine On\n${contactRules}\n${staticRules}\n# END CONTACT SECURITY\n${existing}`, 'utf8');
        if (!enabled) {
          console.info(`[contact] Backend omitted; upload ${fileURLToPath(htaccess)} and remove old PHP files from the host.`);
        }
      },
    },
  };
}
