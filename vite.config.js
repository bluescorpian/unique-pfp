import { defineConfig } from 'vite';

export default defineConfig(({ command, mode }) => {
  const baseConfig = {};

  if (mode === 'gh-pages') {
    return {
      baseConfig
    };
  } else return baseConfig;
});
