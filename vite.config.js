import { defineConfig } from 'vite';

export default defineConfig(({ command, mode }) => {
  const baseConfig = {};

  if (mode === 'gh-pages') {
    return {
      ...baseConfig,
      base: 'unique-pfp',
    };
  } else return baseConfig;
});
