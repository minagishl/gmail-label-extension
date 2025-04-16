import { defineConfig } from "vite";
import { crx, defineManifest } from "@crxjs/vite-plugin";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const manifest = defineManifest({
  manifest_version: 3,
  name: "Gmail Label Extension",
  version: "1.0.0",
  description: "Automatically create Gmail labels based on custom rules",
  permissions: ["activeTab", "scripting", "storage"],
  host_permissions: ["https://mail.google.com/*"],
  action: {
    default_popup: "src/popup.html",
  },
  content_scripts: [
    {
      matches: ["https://mail.google.com/*"],
      js: ["src/content.ts"],
    },
  ],
  web_accessible_resources: [
    {
      resources: ["src/rules.html"],
      matches: ["https://mail.google.com/*"],
    },
  ],
});

export default defineConfig({
  plugins: [react(), tailwindcss(), crx({ manifest })],
  build: {
    rollupOptions: {
      input: {
        popup: "src/popup.html",
        rules: "src/rules.html",
      },
    },
  },
});
