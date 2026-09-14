// Never log tokens. Store only in chrome.storage.local (not sync).
const TOKEN_KEY = "extToken";

export async function getToken(): Promise<string | null> {
  const r = await browser.storage.local.get(TOKEN_KEY);
  return (r[TOKEN_KEY] as string | undefined) ?? null;
}
export async function setToken(token: string): Promise<void> {
  await browser.storage.local.set({ [TOKEN_KEY]: token });
}
export async function clearToken(): Promise<void> {
  await browser.storage.local.remove(TOKEN_KEY);
}
