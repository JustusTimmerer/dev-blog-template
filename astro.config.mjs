import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import intellijDark from './shiki-intellij.mjs';
import codeStructure from './src/lib/code-structure.mjs';

export default defineConfig({
  output: 'static',
  markdown: {
    processor: satteri({ hastPlugins: [codeStructure] }),
    shikiConfig: {
      themes: {
        base: 'github-dark-high-contrast',
        vs: 'dark-plus',
        idea: intellijDark,
      },
      defaultColor: 'base',
    },
  },
});
