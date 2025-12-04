
  import { defineConfig } from 'vite';
  import { loadEnv } from 'vite';
  import react from '@vitejs/plugin-react-swc';
  import path from 'path';

  export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    return {
      plugins: [react()],
      resolve: {
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
        alias: {
          '@': path.resolve(__dirname, './src'),
        },
      },
      build: {
        target: 'esnext',
        outDir: 'build',
      },
      server: {
        host: true,
        port: 3000,
        open: true,
        proxy: {
          '/api': {
            target: env.VITE_BACKEND_TARGET || 'http://localhost:8080',
            changeOrigin: true,
            secure: false,
          },
        },
      },
    };
  });