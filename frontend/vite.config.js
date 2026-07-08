import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/v1': {
        target: 'https://openapi.naver.com',
        changeOrigin: true,
        headers: {
          'X-Naver-Client-Id': '26SNbpvVlhJkhx694SgM',       
          'X-Naver-Client-Secret': 'Desn_4eKcC' 
        }
      }
    }
  }
});