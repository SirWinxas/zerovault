/// <reference types="vitest/config" />
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Dev: the browser calls same-origin `/api/...`; Vite strips `/api` and
// forwards to the API server (which serves `/auth` and `/vault`).
// Other setups: set VITE_API_URL (e.g. https://api.example.com) at build time.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // Resolve the crypto workspace package from source: its package.json
      // `main` points at an unbuilt dist/, and the web app needs no build step for it.
      "@zerovault/crypto": fileURLToPath(
        new URL("../../packages/crypto/src/index.ts", import.meta.url),
      ),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
  },
});
