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

## Deployment

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
