import { DEFAULT_SITE_URL } from "./config";

// Build-time env via WXT (vite). Set WXT_GOOGLE_CLIENT_ID in extension/.env
// Falls back to empty so we can throw a clear error at runtime instead of building with undefined.
const GOOGLE_CLIENT_ID = (import.meta.env.WXT_GOOGLE_CLIENT_ID as string | undefined)?.trim();

let pendingFlow: Promise<string> | null = null;

export async function signInWithGoogle(): Promise<string> {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error(
      "Missing WXT_GOOGLE_CLIENT_ID — add it to extension/.env (same value as AUTH_GOOGLE_ID in the web app) and rebuild the extension",
    );
  }
  if (pendingFlow) return pendingFlow;
  pendingFlow = (async () => {
    const redirectUri = chrome.identity.getRedirectURL();
  const nonce = crypto.randomUUID();
  const authUrl =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
    `&response_type=id_token` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent("openid email profile")}` +
    `&nonce=${encodeURIComponent(nonce)}` +
    `&prompt=select_account`;

  const redirect = await new Promise<string>((resolve, reject) => {
    chrome.identity.launchWebAuthFlow({ url: authUrl, interactive: true }, (url) => {
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
      else if (!url) reject(new Error("No redirect"));
      else resolve(url);
    });
  });

  // redirect URL is like https://<id>.chromiumapp.org/#id_token=xxx&...
  const hash = new URL(redirect).hash.substring(1);
  const params = new URLSearchParams(hash);
  let idToken = params.get("id_token");
  if (!idToken) {
    // fallback query
    const q = new URL(redirect).searchParams.get("id_token");
    idToken = q;
  }
  if (!idToken) throw new Error("No id_token in response");

  const siteUrl = DEFAULT_SITE_URL.replace(/\/$/, "");
  const res = await fetch(`${siteUrl}/api/extension/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_token: idToken }),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((j as { error?: string }).error || "Google auth failed");
  return (j as { token: string }).token;
  })();
  try {
    return await pendingFlow;
  } finally {
    pendingFlow = null;
  }
}
