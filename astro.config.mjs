import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import intellijDark from './shiki-intellij.mjs';
import codeStructure from './src/lib/code-structure.mjs';
import codeTitle from './src/lib/code-title.mjs';
import externalLinks from './src/lib/external-links.mjs';
import stripComments from './src/lib/strip-comments.mjs';

export default defineConfig({
  output: 'static',
  markdown: {
    processor: satteri({ hastPlugins: [codeStructure, externalLinks, stripComments] }),
    shikiConfig: {
      themes: {
        base: 'github-dark-high-contrast',
        vs: 'dark-plus',
        idea: intellijDark,
      },
      defaultColor: 'base',
      transformers: [codeTitle()],
    },
  },
});
