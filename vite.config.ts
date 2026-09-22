/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/*.svg"],
      manifest: {
        name: "Offline Runner",
        short_name: "Offline Runner",
        description: "An original offline mini-game that appears when your connection drops.",
        theme_color: "#0b0e14",
        background_color: "#0b0e14",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
          { src: "icons/icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
        ],
      },
      workbox: {
        cacheId: "offline-game-v1",
        globPatterns: ["**/*.{js,css,html,svg,woff2}"],
      },
    }),
  ],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    // Scoped to unit tests only — e2e/**/*.spec.ts are Playwright specs, run via
    // `npm run e2e`, and must never be picked up by Vitest's default glob.
    include: ["tests/**/*.test.ts"],
  },
});
