// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  vite: {
    server: {
      proxy: {
        '/api': 'http://localhost:5000'
      }
    },
    plugins: [tailwindcss()]
  }
});