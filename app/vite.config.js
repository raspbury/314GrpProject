import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'



// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: isProduction
            ? 'https://csit314-l8lmx.ondigitalocean.app'
            : 'http://localhost:5123',
          changeOrigin: true,
        }
      }
    }
  }
});