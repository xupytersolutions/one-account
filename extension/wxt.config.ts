import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  srcDir: ".",
  manifest: (() => {
    const siteUrl = process.env.WXT_SITE_URL || "";
    const isLocal = siteUrl.includes("localhost");
    return {
      name: "OneAccount Vault",
      description:
        "Search your OneAccount vault, copy credentials with site-aware matching. Secure Google sign-in, encrypted storage.",
      version: "1.0.0",
      // Permissions — justification in extension/STORE_LISTING.md
      // storage: persist encrypted extension token (chrome.storage.local)
      // activeTab: detect current tab host for site-aware prioritization (no content script)
      // clipboardWrite: copy email/password from vault on user action
      // identity: Google OAuth via chrome.identity.launchWebAuthFlow (id_token -> backend /api/extension/auth/google)
      permissions: ["storage", "activeTab", "clipboardWrite", "identity"],
      host_permissions: isLocal
        ? ["http://localhost:3000/*", "https://one.xupyter.com/*", "https://*.xupyter.com/*"]
        : ["https://one.xupyter.com/*", "https://*.xupyter.com/*"],
      icons: {
        16: "/icon-16.png",
        32: "/icon-32.png",
        48: "/icon-48.png",
        96: "/icon-96.png",
        128: "/icon-128.png",
        512: "/icon-512.png",
      },
      action: {
        default_title: "OneAccount Vault",
        default_icon: {
          16: "/icon-16.png",
          32: "/icon-32.png",
          48: "/icon-48.png",
          128: "/icon-128.png",
        },
      },
    };
  })(),
  modules: ["@wxt-dev/module-react"],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
});
