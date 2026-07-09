import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
    include: ['src/__tests__/**/*.test.ts', 'src/__tests__/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      include: ['src/modules/bkg/**'],
      exclude: ['src/modules/bkg/types/mockData.ts'],
    },
  },
  resolve: {
    alias: { '@': '/src' },
  },
});
