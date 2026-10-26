import { getCollection, type CollectionEntry } from 'astro:content';
import { defaultLang, locales, url, type Lang } from './i18n';

export type Post = CollectionEntry<'posts'>;
export type Series = CollectionEntry<'series'>;
export type Page = CollectionEntry<'pages'>;

/** An entry chosen for one reader language. `fallback` is true when no translation exists. */
export interface Localized<T> {
  key: string;
  entry: T;
  contentLang: Lang;
  fallback: boolean;
}

export type LocalPost = Localized<Post>;
export type LocalSeries = Localized<Series>;

function splitId(id: string): { lang: Lang; key: string } {
  const [lang, ...rest] = id.split('/');
  return { lang: lang as Lang, key: rest.join('/') };
}

function localize<T extends { id: string }>(entries: T[], lang: Lang): Localized<T>[] {
  const byKey = new Map<string, Map<Lang, T>>();
  for (const entry of entries) {
    const { lang: entryLang, key } = splitId(entry.id);
    if (!locales.includes(entryLang)) continue;
    if (!byKey.has(key)) byKey.set(key, new Map());
    byKey.get(key)!.set(entryLang, entry);
  }
  return [...byKey].map(([key, versions]) => {
    const contentLang = versions.has(lang) ? lang : versions.has(defaultLang) ? defaultLang : [...versions.keys()][0];
    return { key, entry: versions.get(contentLang)!, contentLang, fallback: contentLang !== lang };
  });
}

export async function getPosts(lang: Lang): Promise<LocalPost[]> {
  const all = await getCollection('posts', ({ data }) => import.meta.env.DEV || !data.draft);
  return localize(all, lang).sort((a, b) => b.entry.data.date.valueOf() - a.entry.data.date.valueOf());
}

export async function getSeries(lang: Lang): Promise<LocalSeries[]> {
  return localize(await getCollection('series'), lang);
}

export async function getSeriesMap(lang: Lang): Promise<Map<string, LocalSeries>> {
  return new Map((await getSeries(lang)).map((s) => [s.key, s]));
}

export async function getSeriesPosts(lang: Lang, seriesKey: string): Promise<LocalPost[]> {
  return (await getPosts(lang))
    .filter((p) => p.entry.data.series === seriesKey)
    .sort((a, b) => (a.entry.data.part ?? 0) - (b.entry.data.part ?? 0) || a.entry.data.date.valueOf() - b.entry.data.date.valueOf());
}

export async function getPages(lang: Lang): Promise<Localized<Page>[]> {
  return localize(await getCollection('pages'), lang);
}

export const postUrl = (lang: Lang, key: string) => url(lang, `/blog/${key}/`);
export const seriesUrl = (lang: Lang, key: string) => url(lang, `/series/${key}/`);
export const tagUrl = (lang: Lang, tag: string) => url(lang, `/tags/${tag}/`);

export function postLabel(post: LocalPost, seriesByKey: Map<string, LocalSeries>): string {
  const series = post.entry.data.series ? seriesByKey.get(post.entry.data.series) : undefined;
  return series ? series.entry.data.title : (post.entry.data.tags[0] ?? 'Note');
}

export function readingMinutes(body: string | undefined): number {
  const words = (body ?? '').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
