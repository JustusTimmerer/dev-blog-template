export const locales = ['en', 'de'] as const;
export type Lang = (typeof locales)[number];
export const defaultLang: Lang = 'en';

export const langNames: Record<Lang, string> = { en: 'English', de: 'Deutsch' };

const dateLocales: Record<Lang, string> = { en: 'en-GB', de: 'de-DE' };

/** Route param for `[...lang]` pages: the default language has no URL prefix. */
export const langParam = (lang: Lang) => (lang === defaultLang ? undefined : lang);

export const localeStaticPaths = () => locales.map((lang) => ({ params: { lang: langParam(lang) }, props: { lang } }));

/** Prefix an absolute site path (starting with "/") with the language segment. */
export const url = (lang: Lang, path: string) => (lang === defaultLang ? path : `/${lang}${path}`);

/** Remove a language prefix from a pathname. */
export const stripLang = (pathname: string) => {
  for (const lang of locales) {
    if (lang !== defaultLang && (pathname === `/${lang}` || pathname.startsWith(`/${lang}/`))) {
      return pathname.slice(lang.length + 1) || '/';
    }
  }
  return pathname;
};

export const formatDate = (date: Date, lang: Lang) =>
  date.toLocaleDateString(dateLocales[lang], { day: 'numeric', month: 'short', year: 'numeric' });

const en = {
  navBlog: 'Blog',
  navSeries: 'Series',
  navAbout: 'About',
  legal: 'Legal notice',
  privacy: 'Privacy',
  start: 'Start',
  allPosts: 'All posts',
  allPostsLede: 'Everything I wrote, newest first.',
  latest: 'Latest',
  series: 'Series',
  seriesLede: 'One topic in many short posts. Each part appears after it is ready.',
  seriesHeading: 'Topics in parts',
  parts: (n: number) => (n === 1 ? '1 part' : `${n} parts`),
  part: (n: number) => `part ${n}`,
  latestPart: 'Latest',
  ongoing: 'ongoing',
  complete: 'complete',
  topics: 'Topics',
  topic: 'Topic',
  postsOnTopic: (n: number) => (n === 1 ? '1 post on this topic.' : `${n} posts on this topic.`),
  contents: 'Contents',
  introduction: 'Introduction',
  read: 'read',
  minRead: (n: number) => `${n} min read`,
  updated: 'updated',
  previousPart: '← Previous part',
  nextPart: 'Next part →',
  morePosts: 'More posts',
  draft: 'draft',
  note: 'Note',
  onlyIn: (name: string) => `This post is only available in ${name}.`,
  notFound: 'Page not found',
  backHome: 'Back to the start page',
  theme: 'Theme',
  themeSystem: 'System',
  themeLight: 'Light',
  themeDark: 'Dark',
  language: 'Language',
  reading: 'Reading',
  readingSettings: 'Reading settings',
  textSize: 'Text size',
  sizeS: 'Small text',
  sizeM: 'Medium text',
  sizeL: 'Large text',
  pageWidth: 'Page width',
  widthNarrow: 'Narrow page',
  widthMedium: 'Medium page',
  widthFull: 'Full width',
  font: 'Font',
  fontSans: 'Sans-serif font',
  fontSerif: 'Serif font',
  figure: 'Fig.',
  enlarge: 'Enlarge',
  close: 'Close',
  breadcrumb: 'Breadcrumb',
};

export type UI = typeof en;

const de: UI = {
  navBlog: 'Blog',
  navSeries: 'Serien',
  navAbout: 'Über mich',
  legal: 'Impressum',
  privacy: 'Datenschutz',
  start: 'Start',
  allPosts: 'Alle Beiträge',
  allPostsLede: 'Alles, was ich geschrieben habe, die neuesten zuerst.',
  latest: 'Neueste',
  series: 'Serien',
  seriesLede: 'Ein Thema in vielen kurzen Beiträgen. Jeder Teil erscheint, wenn er fertig ist.',
  seriesHeading: 'Themen in Teilen',
  parts: (n: number) => (n === 1 ? '1 Teil' : `${n} Teile`),
  part: (n: number) => `Teil ${n}`,
  latestPart: 'Neuester',
  ongoing: 'laufend',
  complete: 'abgeschlossen',
  topics: 'Themen',
  topic: 'Thema',
  postsOnTopic: (n: number) => (n === 1 ? '1 Beitrag zu diesem Thema.' : `${n} Beiträge zu diesem Thema.`),
  contents: 'Inhalt',
  introduction: 'Einleitung',
  read: 'gelesen',
  minRead: (n: number) => `${n} Min. Lesezeit`,
  updated: 'aktualisiert',
  previousPart: '← Vorheriger Teil',
  nextPart: 'Nächster Teil →',
  morePosts: 'Weitere Beiträge',
  draft: 'Entwurf',
  note: 'Hinweis',
  onlyIn: (name: string) => `Diesen Beitrag gibt es nur auf ${name}.`,
  notFound: 'Seite nicht gefunden',
  backHome: 'Zur Startseite',
  theme: 'Design',
  themeSystem: 'System',
  themeLight: 'Hell',
  themeDark: 'Dunkel',
  language: 'Sprache',
  reading: 'Lesen',
  readingSettings: 'Leseeinstellungen',
  textSize: 'Schriftgröße',
  sizeS: 'Kleine Schrift',
  sizeM: 'Mittlere Schrift',
  sizeL: 'Große Schrift',
  pageWidth: 'Seitenbreite',
  widthNarrow: 'Schmale Seite',
  widthMedium: 'Mittlere Seite',
  widthFull: 'Volle Breite',
  font: 'Schriftart',
  fontSans: 'Serifenlose Schrift',
  fontSerif: 'Serifenschrift',
  figure: 'Abb.',
  enlarge: 'Vergrößern',
  close: 'Schließen',
  breadcrumb: 'Brotkrümelnavigation',
};

const dictionaries: Record<Lang, UI> = { en, de };

export const t = (lang: Lang): UI => dictionaries[lang];

/** Language names written in the reader's language, for "only available in" notices. */
export const langNameIn: Record<Lang, Record<Lang, string>> = {
  en: { en: 'English', de: 'German' },
  de: { en: 'Englisch', de: 'Deutsch' },
};
