import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Every collection is split by language folder: src/content/<collection>/<lang>/<key>.md.
// A file with the same key in another language folder is its translation.

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      date: z.coerce.date(),
      updated: z.coerce.date().optional(),
      tags: z.array(z.string()).default([]),
      featured: z.boolean().default(false),
      draft: z.boolean().default(false),
      series: z.string().optional(),
      part: z.number().int().positive().optional(),
      cover: image().optional(),
      coverAlt: z.string().default(''),
    }),
});

const series = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/series' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    featured: z.boolean().default(false),
    status: z.enum(['ongoing', 'complete']).default('ongoing'),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    noindex: z.boolean().default(false),
  }),
});

// A glossary term. The body is the explanation shown in the tooltip (plain text).
// The first use of the term or of an alias in a post becomes a tooltip.
const glossary = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/glossary' }),
  schema: z.object({
    term: z.string(),
    aliases: z.array(z.string()).default([]),
    link: z.string().url().optional(),
  }),
});

export const collections = { posts, series, pages, glossary };
