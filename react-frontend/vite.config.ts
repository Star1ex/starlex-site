import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const moduleId = id.replace(/\\/g, '/');

          if (
            moduleId.includes('vite/preload-helper') ||
            moduleId.includes('commonjsHelpers')
          ) {
            return 'runtime-vendor';
          }

          if (!moduleId.includes('node_modules')) return;

          if (
            moduleId.includes('/node_modules/@blocknote/') ||
            moduleId.includes('/node_modules/@tiptap/') ||
            moduleId.includes('/node_modules/prosemirror') ||
            moduleId.includes('/node_modules/yjs/') ||
            moduleId.includes('/node_modules/y-prosemirror/') ||
            moduleId.includes('/node_modules/y-protocols/') ||
            moduleId.includes('/node_modules/@tanstack/store/') ||
            moduleId.includes('/node_modules/@tanstack/react-store/')
          ) {
            return 'editor-vendor';
          }

          if (moduleId.includes('/node_modules/@floating-ui/')) {
            return 'floating-vendor';
          }

          if (
            moduleId.includes('/node_modules/react/') ||
            moduleId.includes('/node_modules/react-dom/') ||
            moduleId.includes('/node_modules/react-router/') ||
            moduleId.includes('/node_modules/react-router-dom/') ||
            moduleId.includes('/node_modules/scheduler/')
          ) {
            return 'react-vendor';
          }

          if (
            moduleId.includes('/node_modules/framer-motion/') ||
            moduleId.includes('/node_modules/motion-dom/') ||
            moduleId.includes('/node_modules/motion-utils/')
          ) {
            return 'motion-vendor';
          }

          if (
            moduleId.includes('/node_modules/react-markdown/') ||
            moduleId.includes('/node_modules/unified/') ||
            moduleId.includes('/node_modules/remark-') ||
            moduleId.includes('/node_modules/rehype-') ||
            moduleId.includes('/node_modules/highlight.js/') ||
            moduleId.includes('/node_modules/katex/') ||
            moduleId.includes('/node_modules/shiki')
          ) {
            return 'markdown-vendor';
          }

          if (moduleId.includes('/node_modules/react-virtuoso/')) return 'virtual-list-vendor';
          if (moduleId.includes('/node_modules/@dnd-kit/')) return 'dnd-vendor';
          if (moduleId.includes('/node_modules/@sentry/')) return 'sentry-vendor';
          if (moduleId.includes('/node_modules/axios/')) return 'http-vendor';
          if (
            moduleId.includes('/node_modules/lucide-react/') ||
            moduleId.includes('/node_modules/react-icons/')
          ) {
            return 'icons-vendor';
          }
        },
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
