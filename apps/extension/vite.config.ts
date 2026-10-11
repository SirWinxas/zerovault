import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.config";

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  resolve: {
    alias: {
      // Resolve the crypto workspace package from source (its `main` points at an unbuilt dist/).
      "@zerovault/crypto": fileURLToPath(
        new URL("../../packages/crypto/src/index.ts", import.meta.url),
      ),
    },
  },
  server: { port: 5174, strictPort: true, cors: true },
});
