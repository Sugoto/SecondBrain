import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import compression from "vite-plugin-compression";
import million from "million/compiler";

// React Compiler configuration
const ReactCompilerConfig = {
  target: "19", // Target React 19
};

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
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler", ReactCompilerConfig]],
      },
    }),
    tailwindcss(),

    // PWA configuration for offline support and app-like experience
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "robots.txt"],
      manifest: {
        name: "Second Brain",
        short_name: "SecondBrain",
        description: "Personal finance and health tracker",
        theme_color: "#D4EDDA",
        background_color: "#FDF6E3",
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
        manualChunks: {
          // Core React libraries
          "vendor-react": ["react", "react-dom"],
          // Animation library
          "vendor-motion": ["framer-motion"],
          // UI components from Radix
          "vendor-radix": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-popover",
            "@radix-ui/react-switch",
            "@radix-ui/react-label",
            "@radix-ui/react-slot",
          ],
          // Data fetching
          "vendor-query": ["@tanstack/react-query"],
          // Supabase
          "vendor-supabase": ["@supabase/supabase-js"],
          // Virtualization
          "vendor-virtual": ["@tanstack/react-virtual"],
          // Local caching
          "vendor-dexie": ["dexie"],
        },
      },
    },
  },
});
