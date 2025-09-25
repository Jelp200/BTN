// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  outDir: '..//ControlPanel.API/ControlPanel.API/wwwroot',
  server: {
    port: 4321,
    host: true,
  },
  build: {
    format: 'file'
  },
  vite: {
    plugins: [tailwindcss()]
  }
});