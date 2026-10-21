import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { visualizer } from 'rollup-plugin-visualizer'
import path from "path"

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    ...(process.env.ANALYZE === '1' || process.env.ANALYZE === 'true'
      ? [
          visualizer({
            filename: 'dist/bundle-analysis.html',
            template: 'treemap',
            gzipSize: true,
            brotliSize: true,
          }),
        ]
      : []),
  ],

  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "./src") },
      { find: /^html2canvas$/, replacement: "html2canvas-pro" },
    ],
  },

  build: {
    sourcemap: false,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "vendor-react",
              test: /node_modules[\\/](react|react-dom|scheduler)/,
              priority: 2,
            },
            {
              name: "vendor-router",
              test: /node_modules[\\/]react-router/,
              priority: 2,
            },
            {
              name: "vendor-query",
              test: /node_modules[\\/]@tanstack/,
              priority: 2,
            },
          ],
        },
      },
    },
  },

  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/storage": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
})