import path from "path";
import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import compression from "vite-plugin-compression";
import million from "million/compiler";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // Million.js - 70% faster React rendering via compilation
    million.vite({
      auto: {
        // Automatically optimize all components
        threshold: 0.05,
        // Skip components that use unsupported features
        skip: ["framer-motion"],
      },
    }),
    react(),
    // React Compiler, targeting React 19
    babel({ presets: [reactCompilerPreset({ target: "19" })] }),
    tailwindcss(),

    // PWA configuration for offline support and app-like experience
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "robots.txt"],
      manifest: {
        name: "Second Brain",
        short_name: "SecondBrain",
        description: "Personal finance and health tracker",
        theme_color: "#070709",
        background_color: "#070709",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
        ],
      },
      workbox: {
        // Cache strategies for different resource types
        runtimeCaching: [
          {
            // Cache API responses for mutual funds (stale-while-revalidate)
            urlPattern: /^https:\/\/api\.mfapi\.in\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "mf-api-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 30, // 30 minutes
              },
            },
          },
          {
            // Cache Google Fonts
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
        ],
      },
    }),

    // Brotli compression for smaller bundle sizes
    compression({
      algorithm: "brotliCompress",
      ext: ".br",
      threshold: 1024, // Only compress files > 1KB
    }),
    // Also generate gzip for broader compatibility
    compression({
      algorithm: "gzip",
      ext: ".gz",
      threshold: 1024,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("/react/") || id.includes("/react-dom/")) return "vendor-react";
          if (id.includes("/framer-motion/")) return "vendor-motion";
          if (
            id.includes("@radix-ui/react-dialog") ||
            id.includes("@radix-ui/react-dropdown-menu") ||
            id.includes("@radix-ui/react-select") ||
            id.includes("@radix-ui/react-tabs") ||
            id.includes("@radix-ui/react-popover") ||
            id.includes("@radix-ui/react-switch") ||
            id.includes("@radix-ui/react-label") ||
            id.includes("@radix-ui/react-slot")
          )
            return "vendor-radix";
          if (id.includes("@tanstack/react-query")) return "vendor-query";
          if (id.includes("@supabase/supabase-js")) return "vendor-supabase";
          if (id.includes("@tanstack/react-virtual")) return "vendor-virtual";
          if (id.includes("/dexie/")) return "vendor-dexie";
        },
      },
    },
  },
});
