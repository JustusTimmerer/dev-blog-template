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
  navContact: 'Contact',
  contactLede: 'Have a question, a correction, or an idea to share? Send me a message.',
  contactLink: 'Write a message →',
  contactName: 'Name (optional)',
  contactEmail: 'Your email',
  contactMessage: 'Message',
  contactPrivacy: 'I use your details to reply to your message. More in the',
  contactSend: 'Send message',
  contactSending: 'Sending…',
  contactSuccess: 'Thank you. Your message has been accepted for delivery.',
  contactError: 'Your message could not be sent. Your text is still here; please try again later.',
  contactInvalid: 'Please check your email and message. Use at most 100 characters for your name and 5,000 for your message.',
  contactLimited: 'Too many messages have been sent recently. Please wait an hour before trying again.',
  contactUncertain: 'Delivery could not be confirmed. Your text is still here. Please wait before trying again to avoid sending twice.',
  contactJavascript: 'Please enable JavaScript to send this form.',
  legal: 'Legal notice',
  privacy: 'Privacy',
  start: 'Start',
  allPosts: 'All posts',
  allPostsLede: 'Everything I wrote, newest first.',
  navBites: 'Quick Bites',
  quickBite: 'Quick Bite',
  bitesTitle: 'Short and to the point',
  bitesLede: 'Short reads with one idea each. Every bite takes less than five minutes.',
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
  learnMore: 'Learn more',
  breadcrumb: 'Breadcrumb',
};

export type UI = typeof en;

const de: UI = {
  navBlog: 'Blog',
  navSeries: 'Serien',
  navAbout: 'Über mich',
  navContact: 'Kontakt',
  contactLede: 'Eine Frage, eine Korrektur oder eine Idee? Schreib mir eine Nachricht.',
  contactLink: 'Nachricht schreiben →',
  contactName: 'Name (optional)',
  contactEmail: 'Deine E-Mail-Adresse',
  contactMessage: 'Nachricht',
  contactPrivacy: 'Ich verwende deine Angaben, um deine Nachricht zu beantworten. Mehr dazu unter',
  contactSend: 'Nachricht senden',
  contactSending: 'Wird gesendet…',
  contactSuccess: 'Danke. Deine Nachricht wurde zum Versand angenommen.',
  contactError: 'Deine Nachricht konnte nicht gesendet werden. Dein Text bleibt erhalten. Bitte versuche es später erneut.',
  contactInvalid: 'Bitte prüfe deine E-Mail-Adresse und deine Nachricht. Dein Name darf höchstens 100 Zeichen und deine Nachricht höchstens 5.000 Zeichen lang sein.',
  contactLimited: 'In letzter Zeit wurden zu viele Nachrichten gesendet. Bitte warte eine Stunde, bevor du es erneut versuchst.',
  contactUncertain: 'Der Versand konnte nicht bestätigt werden. Dein Text bleibt erhalten. Bitte warte vor einem erneuten Versuch, damit die Nachricht nicht doppelt versendet wird.',
  contactJavascript: 'Bitte aktiviere JavaScript, um dieses Formular zu senden.',
  legal: 'Impressum',
  privacy: 'Datenschutz',
  start: 'Start',
  allPosts: 'Alle Beiträge',
  allPostsLede: 'Alles, was ich geschrieben habe, die neuesten zuerst.',
  navBites: 'Quick Bites',
  quickBite: 'Quick Bite',
  bitesTitle: 'Kurz und knapp',
  bitesLede: 'Kurze Texte mit je einer Idee. Jeder Bissen braucht weniger als fünf Minuten.',
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
  learnMore: 'Mehr erfahren',
  breadcrumb: 'Brotkrümelnavigation',
};

const dictionaries: Record<Lang, UI> = { en, de };

export const t = (lang: Lang): UI => dictionaries[lang];

/** Language names written in the reader's language, for "only available in" notices. */
export const langNameIn: Record<Lang, Record<Lang, string>> = {
  en: { en: 'English', de: 'German' },
  de: { en: 'Englisch', de: 'Deutsch' },
};
