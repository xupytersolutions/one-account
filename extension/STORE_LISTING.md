# OneAccount Vault — Chrome Web Store Listing

Source icons: `public/favicons/*` copied to `extension/public/icon-{16,32,48,96,128,512}.png` via `extension/wxt.config.ts:icons`.

## Manifest (prod)

- **Version:** 1.0.0 (`extension/package.json`, `extension/wxt.config.ts:version`)
- **Name:** OneAccount Vault
- **Short description (132 max, 112 chars):** Search your OneAccount vault, copy credentials with site-aware matching. Secure Google sign-in, encrypted storage.
- **Manifest icons:** `16/32/48/96/128/512` -> `/icon-*.png`
- **Action default_icon:** 16/32/48/128
- **host_permissions (prod):** `https://one.xupyter.com/*`, `https://*.xupyter.com/*`
  - dev builds when `WXT_SITE_URL` contains `localhost` also allow `http://localhost:3000/*` — strip localhost for store upload.
- **Permissions:**
  - `storage` — persist extension token in `chrome.storage.local` only (never `sync`). See `extension/utils/storage.ts:1` (`TOKEN_KEY=extToken`).
  - `activeTab` — read current tab URL to compute host via `extension/utils/host.ts:14` (`toHost` + `getCurrentHost`) for site-match prioritization. No content script, no DOM access.
  - `clipboardWrite` — `navigator.clipboard.writeText` email/password on explicit user action in `extension/entrypoints/popup/main.tsx:214` (`copyPassword`, `copyText`, `handleGenCopy`). Justification: core vault function.
  - `identity` — `chrome.identity.launchWebAuthFlow` + `getRedirectURL` for Google OAuth `id_token` flow (`extension/utils/google-auth.ts:9`). Token exchanged at `POST /api/extension/auth/google` (`src/app/api/extension/auth/google/route.ts:5`), issued as 14-day `ExtensionToken` (`prisma/schema.prisma:134`).

  > `clipboardRead` removed (was unused — only writes). If review flags it, re-add with justification: reading clipboard for paste is not used.

## Store assets (`extension/store-assets/`)

Real screenshots captured via Python `playwright.sync_api` on `http://localhost:3000` at 1280×800 (see `C:\Users\zaid patel\AppData\Local\Temp\opencode\capture.py` / `capture4.py` — uses `sync_playwright`, `viewport 1280x800`, `wait_until networkidle`).

| File | Size | Source | Captured |
|------|------|--------|----------|
| `small-promo-440x280.jpg` | 440×280 | PIL generated (logo + gradient) | Placeholder promo — replace with designer asset if desired |
| `large-promo-920x680.jpg` | 920×680 | PIL generated | Optional |
| `marquee-1400x560.jpg` | 1400×560 | PIL generated | Optional |
| `screenshot-1-1280x800.jpg` | 1280×800 | `GET /` landing hero (Playwright) | Real — 96KB JPEG |
| `screenshot-2-1280x800.jpg` | 1280×800 | `GET /login` (Playwright) | Real — 72KB JPEG |
| `screenshot-3-1280x800.jpg` | 1280×800 | `GET /privacy` (Playwright) | Real — 179KB JPEG, shows privacy policy |
| `screenshot-4-1280x800.jpg` | 1280×800 | `GET /` scrolled to features (Playwright) | Real — 66KB JPEG |

Re-capture before release: `python capture.py` (needs dev server `pnpm dev` on :3000 and `playwright` Python package). Extension popup on `file://.../popup.html` renders blank via file:// (needs chrome APIs) — use web screenshots for store; popup UI is identical to web vault cards.

## Detailed description (store)

```
OneAccount Vault — your encrypted vault, one click away.

Search spaces, prioritize matches for the current site, copy username/password, generate strong passwords/PINs/passphrases and save directly to a space.

• Site-aware matching via activeTab (no page injection)
• Encrypted at rest (AES-GCM) — passwords decrypted server-side only on explicit copy
• Google-only sign-in via chrome.identity (id_token -> short-lived extension token, 14 days, revocable)
• Clean HeroUI design with light/dark themes

Backend: https://one.xupyter.com  |  Data retained only as your vault entries & spaces.
```

## Privacy / data disclosure (for Dashboard > Privacy practices)

- **Single purpose:** Vault access & credential copy for the authenticated user's spaces.
- **Data collected:** Google profile (email/name/avatar for auth), vault entries (email/password/url/title) — stored in Postgres, not sold. Clipboard access transient, never persisted.
- **Remote code:** None. All fetches to `one.xupyter.com` via `DEFAULT_SITE_URL` (`extension/utils/config.ts:1`, build-time `WXT_SITE_URL`).
- **Privacy policy URL:** live at `https://one.xupyter.com/privacy` (`src/app/(public)/privacy/page.tsx:1`) and linked from footer (`src/components/footer.tsx:165` -> `<Link href="/privacy">`). Canonical `/privacy` indexed, `robots index:true`.
- **OAuth consent:** Ensure Google Cloud OAuth client `1028690921231-...` has Authorized redirect URI `https://<PUBLISHED_EXTENSION_ID>.chromiumapp.org/` (add after first upload to get stable ID).

## Production build

```bash
# prod env (must match web app AUTH_GOOGLE_ID)
copy extension\.env.prod extension\.env   # or: $env:WXT_SITE_URL="https://one.xupyter.com"
pnpm --filter one-account-extension build  # or: pnpm --filter extension exec wxt build
# output: extension/.output/chrome-mv3/manifest.json + extension/.output/one-account-extension-1.0.0-chrome.zip
```

Verify before upload:

```bash
powershell -command "Expand-Archive extension/.output/one-account-extension-1.0.0-chrome.zip -Force -DestinationPath $env:TEMP\oa-check; Get-Content $env:TEMP\oa-check\manifest.json | ConvertFrom-Json | Format-List"
# check: version 1.0.0, icons 16/32/48/128, host_permissions == prod only, no localhost, no clipboardRead
```

## Submission checklist

- [x] Real 1280×800 screenshots captured via Playwright (landing/login/privacy/features).
- [x] Privacy policy live at `one.xupyter.com/privacy` (`src/app/(public)/privacy/page.tsx`) — add same URL in store dashboard Privacy practices.
- [ ] Upload `one-account-extension-1.0.0-chrome.zip` (not folder) via https://chrome.google.com/webstore/devconsole.
- [ ] Fill permission justifications from this doc in review notes.
- [ ] After publish, set Extension ID in Google Cloud OAuth redirect URIs.
