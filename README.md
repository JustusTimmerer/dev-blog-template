# dev-blog-template

A reading-first blog template for [Astro](https://astro.build). It builds a static site that any web space can host. It comes with editor-style themes, reading settings, series and English/German content.

## Features

- **Reading layout.** A sticky contents list shows the current section and the read progress. A breadcrumb bar carries a progress line. Figures get captions and a zoom view.
- **Five themes.** System, light, dark, Visual Studio and IntelliJ. In the two editor themes, an article renders like a class. The lede is a doc comment, the date is an attribute and the title is a class declaration. Each section is a method with braces, indentation, indent guides and line numbers.
- **Reading settings.** A round button in the bottom right corner opens settings for text size, page width and serif or sans-serif text.
- **Two languages.** English at `/` and German at `/de/`. The first visit follows the browser language, and a menu in the header switches it. A post without a translation shows the original text with a note.
- **Series, featured posts and topics.** A series groups short posts about one topic. Each part links to the other parts.
- **Measured contrast.** Body text reaches 12:1 or more in every theme, and secondary text 5:1 or more.
- **No tracking.** No cookies, no third-party requests and self-hosted fonts. Reader settings stay in the browser's local storage.

## Quick start

You need Node.js 22.23.4 or later.

```bash
npm install
```

```bash
npm run dev
```

The development server runs at `http://localhost:4321`. To make the production build in `dist/`, run:

```bash
npm run build
```

## Configuration

Put your name, tagline and GitHub link in `src/lib/site.ts`.

The interface texts for both languages are in `src/lib/i18n.ts`. To add a language, add it to `locales`, add a dictionary and create the matching content folders.

Colors, fonts and widths are CSS variables at the top of `src/styles/global.css`. Each theme has its own block of tokens.

## Content

Every collection has one folder per language. A file with the same name in another language folder is its translation.

```text
src/content/
  posts/en/hello-world.md     -> /blog/hello-world/
  posts/de/hello-world.md     -> /de/blog/hello-world/
  series/en/example-series.md -> /series/example-series/
  pages/en/about.md           -> /about/
  pages/de/legal.md           -> /de/legal/
```

### Post fields

| Field | Required | Meaning |
| --- | --- | --- |
| `title` | yes | Title of the post |
| `description` | yes | One sentence for lists, the lede and search engines |
| `date` | yes | Publication date, for example `2026-10-26` |
| `updated` | no | Date of the last change |
| `tags` | no | Topics, for example `[tooling, astro]` |
| `featured` | no | `true` shows the post in a large card on the start page |
| `draft` | no | `true` hides the post from the production build |
| `series` | no | File name of a series, for example `example-series` |
| `part` | no | Number of the post in its series |
| `cover` | no | Relative path to a cover image |
| `coverAlt` | no | Alternative text for the cover image |

### Series and pages

A series file has `title`, `description`, `featured` and `status` (`ongoing` or `complete`). Its text appears on the series page.

The `pages` collection holds simple pages such as About, Legal notice and Privacy. Each file becomes a page at `/<file name>/`. Set `noindex: true` to keep a page out of search engines.

### Code blocks

If you add `title="..."` after the language of a code block, the title shows above the block. Use it for a file path or a class name.

````text
```json title="~/.config/app/settings.json"
{ "theme": "dark" }
```
````

## Deployment

### Optional contact form

Set `contact: true` in `src/lib/site.ts` to add a homepage contact section, navigation links and English/German contact pages. Set `recipient` and `sender` in `server/contact-config.php`; use a real mailbox on your hosting account as sender. Keep personal configuration in your own site repository. Backend sources live in `server/`, and the build copies them into `dist/` only when contact is enabled.

The form needs JavaScript, Apache 2.4 with `mod_rewrite` and permission to apply the generated `.htaccess`, and the latest patched PHP 8.4 or 8.5 with `mail()` and a writable private system temporary directory. The handler rejects PHP older than 8.4.27 / 8.5.12, other branches and prerelease builds. These are minimum PHP2Shell patch floors, not a claim that those versions contain every subsequent security fix; keep installing current patches. Astro dev/preview does not execute PHP or apply Apache rules. Static-only deployments do not need PHP.

### Hardened deployment on STRATO

Use a dedicated static-site web root. The supplied configuration disables PHP features a CMS might need; do not apply it to an unrelated WordPress installation or other application.

1. In STRATO's PHP settings, select the latest supported, patched PHP 8.4 or 8.5 version. The provider is responsible for updating and restarting the runtime. [STRATO's PHP2Shell notice](https://www.strato.de/faq/hosting/php-sicherheitsluecke-php2shell-wichtige-informationen/) describes its platform fixes; the PHP version floor in this handler does not replace patch management.
2. Build and upload the **complete** `dist/`, including hidden `.htaccess`, `php.ini`, `contact.php` and `contact-config.php`. The generated security block must precede existing rewrite rules. Back up and merge any hosting-only `.htaccess` settings instead of silently losing them. Remove old `public/contact.php` and `public/contact-config.php` from your source checkout when upgrading from 1.1.0; the new source configuration is `server/contact-config.php`.
3. STRATO reads `php.ini` from the domain's web root, including when PHP Boost is enabled; cached settings can take time to apply. Other hosts may need these directives applied by their administrator rather than by uploading this file. See [STRATO's configuration instructions](https://www.strato.de/faq/hosting/wie-aendere-ich-meine-php-einstellungen-im-hosting-paket/).
4. Run `python scripts/check-contact-host.py https://example.com` with your actual HTTPS origin. It checks readiness and denial rules without sending a message. GET `/contact.php` must return HTTP 405 JSON with `X-Contact-Policy: 2`; this means the runtime branch and required startup-setting checks passed. HTTP 503 means the checks did not pass. Configuration files must return HTTP 403, and multipart/query-string requests must be rejected before the PHP readiness marker is added. If source code is returned, remove the PHP files and correct hosting configuration before enabling the form.
5. Send a real test message and check inbox/spam: acceptance by `mail()` is not proof of delivery. The public readiness check cannot verify provider patch backports, filesystem isolation, or inbox delivery.

`php.ini` disables automatic POST parsing, uploads, session upload progress, session auto-start, URL file access and error display. Only the server superglobal is populated; the handler manually decodes at most four flat form fields. Apache rejects unused request methods, query strings, encoded bodies and multipart payloads, denies other PHP entry points and configuration-file access, and enforces a 64 KiB request-body limit. The handler also bounds its own reads. Missing required PHP settings cause HTTP 503; these application checks execute after PHP startup and cannot repair an unpatched interpreter.

Use least-privilege hosting: the PHP worker should only need to read the site, create its private temporary rate-limit directory, and use the local mail service. Keep credentials for other applications out of its account. STRATO's account-level filesystem permissions and server-side connection/rate limits must be verified separately. A separate subdomain under the same filesystem account is not process isolation. If the hosting plan cannot isolate the handler sufficiently, use a separately isolated backend. The application limits reduce mail abuse but cannot stop all bot traffic or denial of service; an attacker can exhaust the shared sending allowance.

### Disabling contact and removing old deployments

Set `contact: false` and rebuild. The output contains no contact PHP files or `php.ini`, and its `.htaccess` denies PHP URLs, including old scripts accidentally left on the host. **FTP upload does not delete old files:** upload the new `.htaccess` first, then remove remote `contact.php`, `contact-config.php`, `php.ini`, `contact/index.html` and `de/contact/index.html` belonging to the old deployment. Preserve unrelated hosting configuration. Verify the PHP endpoints are inaccessible. On non-Apache hosts, configure equivalent server-side denial rules or remove the old scripts before uploading. Hiding the form alone does not disable a previously deployed backend.

The handler uses a fixed recipient and sender, validates input, rejects browser cross-origin submissions and traps a hidden spam field. It limits attempts to one per minute and five per hour per IP, plus thirty per hour across the site. It ignores forwarded IP headers. Rate-limit storage contains a random key, keyed IP hashes, counts and timestamps for the current one-hour window; the previous window is discarded on the next valid submission. Its directory is private (0700), its file is private (0600), and reads are bounded. Lock contention fails promptly instead of tying up a PHP worker. Storage failure disables sending. These measures reduce abuse but do not block every bot.

Adapt your privacy page for the submitted name, reply address and message and the abuse-prevention state before enabling the form. No cookies, external form providers or automatic replies are used. No message is stored in the website's rate-limit file. Run `node tests/contact-build.mjs` for packaging checks and `python tests/contact-handler.py` with Docker available for Apache/PHP integration tests. The latter uses a read-only site mount and a container-local mail sink; it never sends real email. It verifies rejection before PHP startup, chunked body limits, flat field parsing, sending, failure handling, configuration checks and disabled-backend rules. CI runs both checks before attaching release assets.

The build output in `dist/` is plain HTML, CSS, JavaScript, fonts and images. Upload the content of the folder to the root of your web space, for example by FTP.

On Apache hosts, add this line to a `.htaccess` file to show the custom 404 page:

```apacheconf
ErrorDocument 404 /404.html
```

The GitHub workflow in `.github/workflows/build.yml` builds every push. If you push a tag such as `v1.0.0`, it also creates a release with a zip of the site.

## Legal pages

The sample Legal notice and Privacy pages are placeholders. Some countries require them, for example Germany. Fill them in with your own details and a reviewed text before you publish.

## License

The template is licensed under [MIT No Attribution](LICENSE). You can use, change and publish it without credit.

The bundled fonts keep their own license, the SIL Open Font License 1.1. These fonts are:

- [Inter](https://github.com/rsms/inter)
- [Newsreader](https://github.com/productiontype/Newsreader)
- [Cascadia Mono](https://github.com/microsoft/cascadia-code)
- [JetBrains Mono](https://github.com/JetBrains/JetBrainsMono)
 The Visual Studio and IntelliJ themes reuse the default dark color schemes of those editors. The names belong to their owners, and this project has no connection to Microsoft or JetBrains.
