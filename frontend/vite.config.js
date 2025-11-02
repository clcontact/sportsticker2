// /frontend/vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 🚨 Use ES Module 'import' for plugins 🚨
import tailwindcss from '@tailwindcss/postcss';
import autoprefixer from 'autoprefixer';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [
        // Reference the imported variables here
        tailwindcss(),
        autoprefixer(),
      ],
    },
  },
  server: {
    // Set your desired port here
    port: 3001, 
    // You can also change the host if needed
    // host: '0.0.0.0',
  },
});