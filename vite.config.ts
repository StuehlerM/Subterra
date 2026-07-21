import { defineConfig } from 'vitest/config';

// GitHub Pages serves a project site from /<repo>/, so the production build
// needs that base; the dev server stays at root.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/Subterra/' : '/',
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
}));
