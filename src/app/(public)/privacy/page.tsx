import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy Policy for OneAccount Vault — how we collect, use and protect your data. Google sign-in, encrypted vault, local extension storage.",
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
};

const LAST_UPDATED = "September 14, 2026";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10 sm:py-14">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">
          OneAccount Vault by Xupyter Solutions Pvt Ltd · Last updated: {LAST_UPDATED}
        </p>
        <p className="text-sm text-muted-foreground">
          Contact: <a href="mailto:hello@xupyter.com" className="underline underline-offset-4 hover:text-foreground">hello@xupyter.com</a> ·{" "}
          <a href="https://www.xupyter.com" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-foreground">www.xupyter.com</a>
        </p>
      </div>

      {/* MD render — no @tailwindcss/typography plugin; styled via Tailwind arbitrary variants so code renders properly */}
      <article className="max-w-none text-sm leading-7 text-muted-foreground [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-foreground [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:scroll-mt-24 [&_h3]:text-[15px] [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:my-3 [&_p]:leading-7 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_a]:decoration-primary/30 hover:[&_a]:decoration-primary [&_strong]:text-foreground [&_strong]:font-semibold [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1.5 [&_li]:leading-7 [&_code]:bg-muted [&_code]:border [&_code]:border-border [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:font-mono [&_code]:text-[13px] [&_code]:font-medium [&_code]:text-foreground [&_hr]:my-8 [&_hr]:border-border">
        <p className="!text-base !leading-7 !text-muted-foreground !mt-0">
          OneAccount (“OneAccount Vault”) is a secure vault for account credentials. We collect only what is needed to provide the service,
          we never sell your data, and we do not run ads or trackers.
        </p>

        <h2>1. Who we are</h2>
        <p>
          OneAccount is operated by <strong>Xupyter Solutions Pvt Ltd</strong>, Bharuch, Gujarat, India. The web app runs at{" "}
          <a href="https://one.xupyter.com" target="_blank" rel="noopener noreferrer">one.xupyter.com</a> (and <code>one-account</code> environments).
          The Chrome extension “OneAccount Vault” is the companion client.
        </p>

        <h2>2. Data we collect</h2>
        <h3>2.1 Account &amp; authentication</h3>
        <ul>
          <li><strong>Google profile</strong> — email, name, avatar via Google OAuth (NextAuth). Stored in <code>users</code> / <code>accounts</code> tables (<code>prisma/schema.prisma</code>: <code>User</code>, <code>Account</code>).</li>
          <li><strong>Sessions</strong> — NextAuth sessions (<code>Session</code>) and <strong>Extension tokens</strong> (<code>ExtensionToken</code>: 14-day bearer token, hashed server-side, revocable from <code>/dashboard</code> / <code>/api/extension/tokens</code>).</li>
        </ul>
        <h3>2.2 Vault content (you provide)</h3>
        <ul>
          <li><strong>Spaces</strong> (<code>Space</code>) and <strong>Vault entries</strong> (<code>VaultEntry</code>): title, email, url, description, category/icon/color/logo, and <code>password</code> (encrypted at rest with AES-GCM; see Storage).</li>
          <li><strong>Categories</strong> (<code>Category</code>) when you create them.</li>
        </ul>
        <h3>2.3 Extension local data</h3>
        <ul>
          <li>Extension token in <code>chrome.storage.local</code> only (<code>extension/utils/storage.ts:TOKEN_KEY</code> = <code>extToken</code>). Never <code>storage.sync</code>.</li>
          <li>Current tab host (via <code>chrome.tabs.query</code> + <code>activeTab</code>) to prioritize site-matching entries — not persisted.</li>
        </ul>
        <p>No advertising IDs, no third-party analytics SDKs, no fingerprinting.</p>

        <h2>3. How we use data</h2>
        <ul>
          <li>Authenticate you (Google) and authorize vault/extension API calls.</li>
          <li>Store, list and decrypt vault entries only on your explicit “copy / reveal” action (<code>GET /api/entries/[id]/credential</code>, <code>GET /api/extension/entries</code>).</li>
          <li>Detect current site host to rank matching credentials first in the extension popup.</li>
          <li>Generate passwords/PINs/passphrases locally inside the extension (never sent to server until you save).</li>
        </ul>

        <h2>4. Chrome extension permissions — justifications</h2>
        <p>Declared in <code>extension/wxt.config.ts:manifest.permissions</code> and shown at install. Each has a narrow, user-visible purpose:</p>
        <ul>
          <li><code>storage</code> — persist the short-lived extension bearer token locally; no sync.</li>
          <li><code>activeTab</code> — read the active tab URL once to derive host for site-aware ranking. No content script, no DOM access, no history read.</li>
          <li><code>clipboardWrite</code> — write email/password to clipboard only when you click “Copy”. Used via <code>navigator.clipboard.writeText</code> in the popup.</li>
          <li><code>identity</code> — obtain Google <code>id_token</code> via <code>chrome.identity.launchWebAuthFlow</code> + <code>getRedirectURL</code>; exchanged at <code>POST /api/extension/auth/google</code> for an extension token (verified against <code>AUTH_GOOGLE_ID</code>).</li>
          <li><code>host_permissions</code> <code>https://one.xupyter.com/*</code> (and <code>https://*.xupyter.com/*</code>) — communicate only with our backend (<code>extension/utils/config.ts:WXT_SITE_URL</code>). localhost is allowed only in dev builds.</li>
        </ul>
        <p>No <code>&lt;all_urls&gt;</code>, no <code>tabs</code> history, no content-script injection, no remote code.</p>

        <h2>5. Storage &amp; security</h2>
        <ul>
          <li><strong>Passwords encrypted at rest</strong> with AES-GCM (<code>password</code> column is <code>@db.Text</code>, base64 iv+tag+cipher); legacy plaintext is migrated on read/write. Decrypted only on the server after authenticating the request, then transmitted over HTTPS to your authorized session.</li>
          <li>Extension tokens are hashed (<code>tokenHash unique</code>) and expire in 14 days; you can revoke them from the dashboard. Last-used timestamp is recorded.</li>
          <li>All transport is HTTPS. NextAuth sessions are httpOnly, secure cookies.</li>
          <li>Clipboard writes are transient; the popup holds a revealed password in memory for 60s then clears.</li>
        </ul>

        <h2>6. Sharing &amp; disclosure</h2>
        <p>
          We do not share your vault with third parties. We share data only with service providers needed to run the service
          (hosting Postgres/Next.js on your chosen deployment, email delivery if any) under confidentiality, or when required by law.
          We never use your data for ads or model training.
        </p>

        <h2>7. Data retention &amp; deletion</h2>
        <ul>
          <li>Vault data is retained while your account exists. Deleting a Space cascades its entries (<code>onDelete: Cascade</code>); clearing <code>ExtensionToken</code> logs you out of the extension.</li>
          <li>To delete your account and all data, contact <a href="mailto:hello@xupyter.com">hello@xupyter.com</a> with subject “Delete OneAccount data — your email”. We confirm via your Google account before deletion.</li>
        </ul>

        <h2>8. Your rights</h2>
        <p>Depending on your jurisdiction (e.g., GDPR, India DPDP), you may request access, correction, export or deletion of your data, or withdraw consent by deleting your account.</p>

        <h2>9. Children</h2>
        <p>OneAccount is not intended for children under 13. We do not knowingly collect data from children.</p>

        <h2>10. Cookies</h2>
        <p>The web app uses strictly necessary cookies for authentication (NextAuth) and theme preference (<code>heroui-theme</code> in <code>localStorage</code>). No analytics cookies.</p>

        <h2>11. Changes</h2>
        <p>We will update this page and the “Last updated” date when practices change. Material changes are notified via the app or email.</p>

        <h2>12. Contact</h2>
        <p>
          Xupyter Solutions Pvt Ltd — <a href="mailto:hello@xupyter.com">hello@xupyter.com</a> · <a href="tel:+919428714605">+91 94287-14605</a> · NARMADA COMMERCIAL COMPLEX, M G ROAD, Panch Batti Cir, Bharuch, Gujarat 392001.
          For the extension’s store privacy disclosure, see also <Link href="/" className="underline">one.xupyter.com</Link>.
        </p>

        <hr className="border-border" />
        <p className="!text-xs !text-muted-foreground !leading-5">
          This policy is published at <code>/privacy</code> (canonical <code>https://one.xupyter.com/privacy</code>) as required for Chrome Web Store privacy practices. Last updated: {LAST_UPDATED}.
        </p>
      </article>

      <div className="mt-8 flex gap-3">
        <Link href="/" className="text-sm underline underline-offset-4 hover:text-primary">← Back to OneAccount</Link>
        <span className="text-muted-foreground">·</span>
        <a href="https://www.xupyter.com/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-sm underline underline-offset-4 hover:text-primary">Xupyter Privacy →</a>
      </div>
    </div>
  );
}
