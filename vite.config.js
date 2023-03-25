import { defineConfig } from 'vite';

export default defineConfig(({ command, mode }) => {
  if (mode === 'gh-pages') {
    return {
      base: 'unique-pfp',
    };
  } else return {};
});
