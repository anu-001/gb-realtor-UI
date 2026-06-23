import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    visualizer({
      filename: "dist/stats.html",
      gzipSize: true,
      brotliSize: true,
      open: false,
    }),
  ],
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("@tiptap")) return "vendor-tiptap";
            if (id.includes("recharts")) return "vendor-recharts";
            if (id.includes("mapbox-gl")) return "vendor-mapbox";
            if (id.includes("@reduxjs/toolkit") || id.includes("react-redux")) return "vendor-redux";
            if (id.includes("@tanstack/react-query") || id.includes("@tanstack/react-table") || id.includes("@tanstack/react-virtual")) {
              return "vendor-tanstack";
            }
            if (id.includes("react-router-dom")) return "vendor-router";
            if (id.includes("dompurify")) return "vendor-dompurify";
          }
          return undefined;
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@/app": fileURLToPath(new URL("./src/app", import.meta.url)),
      "@/features": fileURLToPath(new URL("./src/features", import.meta.url)),
      "@/components": fileURLToPath(new URL("./src/components", import.meta.url)),
      "@/hooks": fileURLToPath(new URL("./src/hooks", import.meta.url)),
      "@/services": fileURLToPath(new URL("./src/services", import.meta.url)),
      "@/store": fileURLToPath(new URL("./src/store", import.meta.url)),
      "@/types": fileURLToPath(new URL("./src/types", import.meta.url)),
      "@/constants": fileURLToPath(new URL("./src/constants", import.meta.url)),
      "@/utils": fileURLToPath(new URL("./src/utils", import.meta.url)),
    },
  },
});
