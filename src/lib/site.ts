import type { Lang } from './i18n';

export const site = {
  name: 'Your Name',
  tagline: {
    en: 'Software developer. Notes on what I build, and why.',
    de: 'Softwareentwickler. Notizen dazu, was ich baue und warum.',
  } satisfies Record<Lang, string>,
  github: 'https://github.com/your-username',
};
