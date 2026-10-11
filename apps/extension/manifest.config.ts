import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  manifest_version: 3,
  name: "ZeroVault",
  version: "0.1.0",
  description: "Zero-knowledge password manager: browse and autofill your vault.",
  action: { default_popup: "index.html", default_title: "ZeroVault" },
  background: { service_worker: "src/background.ts", type: "module" },
  content_scripts: [
    { matches: ["<all_urls>"], js: ["src/content.ts"], run_at: "document_idle" },
  ],
  permissions: ["storage", "activeTab", "scripting", "alarms"],
  host_permissions: [
    "https://zerovaultweb-production.up.railway.app/*",
    "http://localhost:3000/*",
  ],
});
