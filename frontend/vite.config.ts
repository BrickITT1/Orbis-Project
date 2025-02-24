// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    
    build: {
      sourcemap: true,
      emptyOutDir: true,
    },
    server: {
        proxy: {
          '/api': 'http://localhost:8080', // Прокси для API
          '/chat-ws': {
            target: 'ws://localhost:8080',
            ws: true
          }
        }
      },
      css: {
        preprocessorOptions: {
          sass: {
            
          },
          scss: {

          }
        },
      },
});
