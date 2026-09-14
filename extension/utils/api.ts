import { DEFAULT_SITE_URL } from "./config";

export class ApiError extends Error {
  status: number;
  constructor(msg: string, status: number) {
    super(msg);
    this.status = status;
  }
}

async function authFetch(path: string, token: string, init?: RequestInit) {
  const base = DEFAULT_SITE_URL.replace(/\/$/, "");
  const url = `${base}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers as Record<string, string> | undefined),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = (body as { error?: string }).error || `Request failed ${res.status}`;
    throw new ApiError(msg, res.status);
  }
  return res.json();
}

export function listSpaces(token: string) {
  return authFetch("/api/extension/spaces", token) as Promise<{ spaces: Array<{ id: string; name: string; type: string; color?: string | null; icon?: string | null; _count?: { entries: number } }> }>;
}

export function searchEntries(token: string, opts: { host?: string; q?: string; spaceId?: string }) {
  const params = new URLSearchParams();
  if (opts.host) params.set("host", opts.host);
  if (opts.q) params.set("q", opts.q);
  if (opts.spaceId) params.set("spaceId", opts.spaceId);
  const qs = params.toString();
  return authFetch(`/api/extension/entries${qs ? `?${qs}` : ""}`, token) as Promise<{
    entries: Array<{ id: string; title: string | null; email: string; url: string | null; description: string | null; category: string | null; icon: string | null; color: string | null; spaceId: string; categoryRef?: unknown }>;
  }>;
}

export function getCredential(token: string, entryId: string) {
  return authFetch(`/api/entries/${entryId}/credential`, token) as Promise<{ id: string; email: string; password: string; title?: string | null; url?: string | null }>;
}

export function createEntry(token: string, spaceId: string, payload: { title?: string | null; email: string; password: string; url?: string | null; description?: string | null }) {
  return authFetch(`/api/extension/spaces/${spaceId}/entries`, token, {
    method: "POST",
    body: JSON.stringify(payload),
  }) as Promise<{ entry: unknown }>;
}
