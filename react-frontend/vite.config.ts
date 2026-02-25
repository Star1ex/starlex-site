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
          if (!id.includes('node_modules')) return;

          if (
            id.includes('@blocknote/') ||
            id.includes('@tiptap/') ||
            id.includes('prosemirror') ||
            id.includes('yjs') ||
            id.includes('unified') ||
            id.includes('remark-') ||
            id.includes('rehype-') ||
            id.includes('shiki')
          ) {
            return 'editor-vendor';
          }

          if (id.includes('react-router-dom')) return 'router-vendor';
          if (id.includes('axios')) return 'http-vendor';
          if (id.includes('lucide-react') || id.includes('react-icons')) return 'icons-vendor';
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
