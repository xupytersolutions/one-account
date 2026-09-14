import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";
import { loadEnv } from "vite";
import { existsSync } from "node:fs";

export default defineConfig(() => {
  // Vite loads .env, .env.local, .env.[mode], .env.[mode].local.
  // WXT passes --mode production; detect it from argv so manifest host_permissions reflects the correct backend.
  const modeArgIndex = process.argv.indexOf("--mode");
  const mode = modeArgIndex !== -1 ? process.argv[modeArgIndex + 1] : process.env.MODE ?? "development";
  // Support both `pnpm extension:build` (cwd = repo root) and `pnpm --filter one-account-extension build` (cwd = extension)
  const envDir = existsSync("extension/.env") ? "extension" : ".";
  const viteEnv = loadEnv(mode, envDir, "");
  const siteUrl = viteEnv.WXT_SITE_URL || process.env.WXT_SITE_URL || "";
  const isLocal = siteUrl.includes("localhost");

  return {
    srcDir: ".",
    manifest: {
      name: "OneAccount Vault",
      description:
        "Search your OneAccount vault, copy credentials with site-aware matching. Secure Google sign-in, encrypted storage.",
      version: "1.0.0",
      // Permissions — justification in extension/STORE_LISTING.md
      // storage: persist encrypted extension token (chrome.storage.local)
      // activeTab: detect current tab host for site-aware prioritization + autofill target tab resolution
      // clipboardWrite: copy email/password from vault on explicit user action
      // identity: Google OAuth via chrome.identity.launchWebAuthFlow (id_token -> backend /api/extension/auth/google)
      // scripting: reserved for autofill fallback via chrome.scripting (declarative content script is primary)
      permissions: ["storage", "activeTab", "clipboardWrite", "identity", "scripting"],
      // <all_urls> required so autofill.content.ts (matches <all_urls>) can run on any login page the user visits.
      // keep site origins explicit as well so WXT_SITE_URL API calls stay allowed after review trims.
      host_permissions: isLocal
        ? ["<all_urls>", "http://localhost:3000/*", "https://one.xupyter.com/*", "https://*.xupyter.com/*"]
        : ["<all_urls>", "https://one.xupyter.com/*", "https://*.xupyter.com/*"],
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
    },
    modules: ["@wxt-dev/module-react"],
    vite: () => ({
      plugins: [tailwindcss()],
    }),
  };
});
