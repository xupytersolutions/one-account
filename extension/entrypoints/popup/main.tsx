import React, { useEffect, useState, useCallback, useRef } from "react";
import ReactDOM from "react-dom/client";
import { Button, Input, Card, Dropdown, Chip, Select, Label, ListBox, Slider } from "@heroui/react";
import { EyeIcon, EyeSlashIcon, ClipboardDocumentIcon, CheckIcon, LinkIcon, ArrowTopRightOnSquareIcon, MoonIcon, SunIcon, ArrowRightStartOnRectangleIcon, XMarkIcon, KeyIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { generatePassword, generatePin, generatePassphrase, evaluateStrength } from "@repo/shared";
import type { Mode, Opts, PassphraseOpts } from "@repo/shared";
import { getToken, setToken, clearToken } from "../../utils/storage";
import { DEFAULT_SITE_URL } from "../../utils/config";
import { listSpaces, searchEntries, getCredential, createEntry, ApiError } from "../../utils/api";
import { getCurrentHost } from "../../utils/host";
import { isDomainMatch } from "../../utils/domain";
import { signInWithGoogle } from "../../utils/google-auth";
import { EntryCard, ViewToggle, SearchInput } from "@repo/ui";
import type { ViewMode } from "@repo/ui";
import "./style.css";

// -- types --
type Space = { id: string; name: string; type: string; color?: string | null; icon?: string | null; _count?: { entries: number } };
type Entry = { id: string; title: string | null; email: string; url: string | null; description: string | null; category: string | null; icon?: string | null; color?: string | null; logoUrl?: string | null; categoryRef?: unknown; spaceId: string; password: string; updatedAt?: string | Date };

function useDebounced<T>(v: T, ms = 300): T {
  const [d, setD] = useState(v);
  useEffect(() => { const t = setTimeout(() => setD(v), ms); return () => clearTimeout(t); }, [v, ms]);
  return d;
}

// -- shared theme logic (mirrors src/components/theme-switcher.tsx) --
function ThemeSwitcher() {
  const [theme, setThemeState] = useState<string>("light");
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("heroui-theme") || "light";
    const current = document.documentElement.classList.contains("dark") ? "dark" : saved;
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(current);
    document.documentElement.setAttribute("data-theme", current);
    setThemeState(current);
  }, []);
  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setThemeState(next);
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("heroui-theme", next);
  };
  if (!mounted) return <Button variant="ghost" size="sm" className="w-8 h-8 min-w-8 p-0" aria-label="Toggle theme" />;
  return (
    <Button variant="ghost" size="sm" className="w-8 h-8 min-w-8 p-0" onPress={toggle} aria-label="Toggle theme">
      {theme === "dark" ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
    </Button>
  );
}

function getSpaceColor(space: Space) {
  if (space.color) return space.color;
  const map: Record<string, string> = { personal: "rgb(59 130 246)", company: "rgb(16 185 129)", client: "rgb(245 158 11)" };
  return map[space.type] ?? map.personal;
}

// -- Header mirroring src/components/header.tsx + private-shell account popup --
function ExtensionHeader({ siteUrl, onLock, onGenerate }: { siteUrl: string; onLock: () => void; onGenerate?: () => void }) {
  const [theme, setTheme] = useState<string | null>(null);
  useEffect(() => {
    const getTheme = () => document.documentElement.classList.contains("dark") ? "dark" : "light";
    setTheme(getTheme());
    const obs = new MutationObserver(() => setTheme(getTheme()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  const logoSrc = theme === "dark" ? browser.runtime.getURL("/logo-dark.png") : browser.runtime.getURL("/logo-light.png");
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="flex h-14 items-center justify-between gap-3 px-3">
        <a href={siteUrl} target="_blank" rel="noopener" className="flex items-center shrink-0">
          {theme === null ? <span className="h-7 w-28 block" aria-hidden /> : <img src={logoSrc} alt="OneAccount" className="h-7 w-auto object-contain" width={120} height={28} />}
        </a>
        <div className="flex items-center gap-1 shrink-0">
          {onGenerate && (
            <Button variant="ghost" size="sm" className="w-8 h-8 min-w-8 p-0" aria-label="Generate password" onPress={onGenerate}>
              <KeyIcon className="w-4 h-4" />
            </Button>
          )}
          <ThemeSwitcher />
          <Dropdown>
            <Button variant="ghost" aria-label="Account" className="w-8 h-8 min-w-8 p-0 rounded-full bg-foreground text-background">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" /></svg>
            </Button>
            <Dropdown.Popover className="bg-popover border border-border shadow-sm rounded-xl min-w-[200px]">
              <Dropdown.Menu aria-label="Account" className="p-1" onAction={(k) => { if (k === "lock") onLock(); if (k === "open") browser.tabs.create({ url: siteUrl }); }}>
                <Dropdown.Item id="open" textValue="Open OneAccount"><span className="flex items-center gap-2 text-sm"><ArrowTopRightOnSquareIcon className="w-4 h-4" /> Open OneAccount</span></Dropdown.Item>
                <Dropdown.Item id="lock" textValue="Logout"><span className="flex items-center gap-2 text-sm"><ArrowRightStartOnRectangleIcon className="w-4 h-4" /> Logout</span></Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </div>
      </div>
    </header>
  );
}

function GenToggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between gap-4 py-1 cursor-pointer">
      <span className="text-sm text-foreground">{label}</span>
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors ${checked ? "bg-primary border-primary" : "bg-muted border-border"}`}>
        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
      </button>
    </label>
  );
}

function AuthGate({ onAuthed }: { onAuthed: (t: string) => void }) {
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const siteUrl = DEFAULT_SITE_URL.replace(/\/$/, "");
  const handleGoogle = async () => {
    setErr(null); setLoading(true);
    try {
      const t = await signInWithGoogle();
      await setToken(t);
      await listSpaces(t);
      onAuthed(t);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Google sign-in failed";
      if (msg.includes("redirect")) setErr(msg + " — add " + ((typeof chrome !== "undefined" && (chrome as unknown as { identity?: { getRedirectURL?: () => string } }).identity?.getRedirectURL?.() || "https://<id>.chromiumapp.org/") + " to Google Cloud Authorized redirect URIs"));
      else setErr(msg);
    } finally { setLoading(false); }
  };
  return (
    <div className="w-[400px] bg-background min-h-[400px] flex flex-col">
      <ExtensionHeader siteUrl={siteUrl} onLock={() => {}} onGenerate={() => {}} />
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4 text-center">
        <img src={browser.runtime.getURL("/logo-light.png")} alt="OneAccount" className="h-10 w-auto object-contain dark:hidden" />
        <img src={browser.runtime.getURL("/logo-dark.png")} alt="OneAccount" className="h-10 w-auto object-contain hidden dark:block" />
        <div>
          <h1 className="text-lg font-semibold">OneAccount Vault</h1>
          <p className="text-sm text-muted-foreground mt-1">Secure vault — sign in with Google to access your accounts.</p>
        </div>
        <Button onPress={handleGoogle} isDisabled={loading} className="w-full bg-primary text-primary-foreground font-medium">{loading ? "Signing in…" : "Sign in with Google"}</Button>
        {err && <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-2 w-full text-left">{err}</p>}
        <a href={siteUrl} target="_blank" rel="noopener" className="text-sm text-primary hover:underline underline-offset-4">Go to OneAccount →</a>
      </div>
    </div>
  );
}

export function PopupApp() {
  const [token, setTok] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const debQ = useDebounced(q, 300);
  const [host, setHost] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("comfortable");
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [showPwd, setShowPwd] = useState<Record<string, boolean>>({});
  const [pwdCache, setPwdCache] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [entryMenu, setEntryMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);
  const [showSpacePicker, setShowSpacePicker] = useState(false);
  // generator state (mirrors landing PasswordGenerator)
  const [genMode, setGenMode] = useState<Mode>("password");
  const [genOpts, setGenOpts] = useState<Opts>({ length: 16, uppercase: true, lowercase: true, numbers: true, symbols: true });
  const [genPinLength, setGenPinLength] = useState(6);
  const [genPpOpts, setGenPpOpts] = useState<PassphraseOpts>({ numWords: 4, separator: "-", capitalize: false, includeNumber: false });
  const [genPassword, setGenPassword] = useState("");
  const [genCopied, setGenCopied] = useState(false);
  const [genSpaceId, setGenSpaceId] = useState<string>("");
  const [genTitle, setGenTitle] = useState("");
  const [genEmail, setGenEmail] = useState("");
  const [genSaving, setGenSaving] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [loadingSpaces, setLoadingSpaces] = useState(false);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const timeoutRef = useRef<Record<string, number>>({});
  const siteUrl = DEFAULT_SITE_URL.replace(/\/$/, "");

  const init = useCallback(async () => {
    setChecking(true);
    const t = await getToken();
    if (!t) { setChecking(false); return; }
    setTok(t); setChecking(false);
  }, []);
  useEffect(() => { init(); }, [init]);

  const handle401 = async (e: unknown) => {
    if (e instanceof ApiError && e.status === 401) {
      await clearToken(); setLocked(true); setTok(null); setErr("Session expired. Please sign in again."); return true;
    }
    return false;
  };

  const loadSpaces = useCallback(async (tok: string) => {
    setLoadingSpaces(true); setErr(null);
    try { const r = await listSpaces(tok); setSpaces(r.spaces); } catch (e) { if (!(await handle401(e))) setErr(e instanceof Error ? e.message : "Network error"); } finally { setLoadingSpaces(false); }
  }, []);
  const loadEntries = useCallback(async (tok: string, spaceId: string | null, query: string) => {
    setLoadingEntries(true);
    try { const r = await searchEntries(tok, { q: query, spaceId: spaceId || undefined }); setEntries(r.entries as unknown as Entry[]); } catch (e) { if (!(await handle401(e))) setErr(e instanceof Error ? e.message : "Network error"); } finally { setLoadingEntries(false); }
  }, []);
  useEffect(() => { if (!token) return; getCurrentHost().then(setHost); loadSpaces(token); }, [token, loadSpaces]);
  useEffect(() => { if (!token) return; loadEntries(token, selectedSpace, debQ); }, [token, selectedSpace, debQ, loadEntries]);
  useEffect(() => () => { Object.values(timeoutRef.current).forEach((id) => clearTimeout(id)); }, []);

  const copyPassword = async (entry: Entry) => {
    if (!token) return;
    try {
      const r = await getCredential(token, entry.id);
      await navigator.clipboard.writeText(r.password);
      setPwdCache((p) => ({ ...p, [entry.id]: r.password }));
      setCopiedId(entry.id); setTimeout(() => setCopiedId(null), 1500);
      setShowPwd((p) => ({ ...p, [entry.id]: true }));
      const tid = window.setTimeout(() => setShowPwd((p) => { const n = { ...p }; delete n[entry.id]; return n; }), 60000);
      timeoutRef.current[entry.id] = tid as unknown as number;
    } catch (e) { if (!(await handle401(e))) setErr(e instanceof Error ? e.message : "Failed to copy"); }
  };
  const handleToggleShow = async (id: string) => {
    const isShowing = showPwd[id];
    if (!isShowing && !pwdCache[id] && token) {
      try {
        const r = await getCredential(token, id);
        setPwdCache((p) => ({ ...p, [id]: r.password }));
      } catch (e) { if (!(await handle401(e))) setErr(e instanceof Error ? e.message : "Failed to reveal"); return; }
    }
    setShowPwd((p) => ({ ...p, [id]: !p[id] }));
  };
  // generator: regenerate when mode/opts change while open
  useEffect(() => {
    if (!showGenerator) return;
    if (genMode === "pin") setGenPassword(generatePin(genPinLength));
    else if (genMode === "passphrase") setGenPassword(generatePassphrase(genPpOpts));
    else setGenPassword(generatePassword(genOpts));
    if (spaces.length > 0) setGenSpaceId((prev) => prev || selectedSpace || spaces[0].id);
  }, [showGenerator, genMode, genOpts, genPinLength, genPpOpts, spaces, selectedSpace]);
  const handleGenRegenerate = () => {
    if (genMode === "pin") setGenPassword(generatePin(genPinLength));
    else if (genMode === "passphrase") setGenPassword(generatePassphrase(genPpOpts));
    else setGenPassword(generatePassword(genOpts));
    setGenCopied(false);
  };
  const handleGenCopy = async () => {
    if (!genPassword) return;
    await navigator.clipboard.writeText(genPassword);
    setGenCopied(true); setTimeout(() => setGenCopied(false), 1500);
  };
  const handleGenSave = async () => {
    if (!token) return;
    if (!genSpaceId) { setGenError("Select a space"); return; }
    if (!genEmail.trim()) { setGenError("Email is required"); return; }
    setGenSaving(true); setGenError(null);
    try {
      await createEntry(token, genSpaceId, { title: genTitle.trim() || null, email: genEmail.trim(), password: genPassword, url: host ? `https://${host}` : null });
      setShowSpacePicker(false);
      setShowGenerator(false);
      setGenTitle(""); setGenEmail(""); setGenError(null);
      // refresh entries
      loadEntries(token, selectedSpace, debQ);
      if (genSpaceId !== selectedSpace) setSelectedSpace(genSpaceId);
    } catch (e) {
      if (!(await handle401(e))) setGenError(e instanceof Error ? e.message : "Failed to save");
    } finally { setGenSaving(false); }
  };
  const copyText = async (text: string, id: string) => { await navigator.clipboard.writeText(text); setCopiedId(id); setTimeout(() => setCopiedId(null), 1500); };
  const logout = async () => { await clearToken(); setTok(null); setLocked(false); setEntries([]); setSpaces([]); };

  const sorted = [...entries].sort((a, b) => {
    const ah = host ? isDomainMatch(a.url, host) : false;
    const bh = host ? isDomainMatch(b.url, host) : false;
    if (ah === bh) return 0; return ah ? -1 : 1;
  });

  if (checking) return <div className="w-[400px] p-6 text-sm bg-background min-h-[300px] flex items-center justify-center">Loading…</div>;
  if (!token || locked) {
    return (
        <div className="w-[400px] bg-background">
          {locked && <div className="bg-amber-50 border-b border-amber-200 px-3 py-2 text-xs text-amber-900">Locked — session expired. Sign in again.</div>}
          <AuthGate onAuthed={(t) => { setTok(t); setLocked(false); setErr(null); }} />
          {err && <p className="px-4 pb-2 text-xs text-destructive">{err}</p>}
        </div>
    );
  }

  // detail view — keep HeroUI card style
  if (selectedEntry) {
    const matched = host ? isDomainMatch(selectedEntry.url, host) : false;
    return (
        <div className="w-[400px] bg-background min-h-[400px] flex flex-col">
          <ExtensionHeader siteUrl={siteUrl} onLock={logout} onGenerate={() => setShowGenerator(true)} />
          <div className="p-4 flex flex-col gap-4">
            <Button variant="ghost" size="sm" className="self-start -ml-2" onPress={() => setSelectedEntry(null)}>← Back</Button>
            <Card className="shadow-none border border-border rounded-2xl">
              <Card.Content className="p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-semibold text-base">{selectedEntry.title || "Account"}</h2>
                    <p className="text-xs text-muted-foreground break-all">{selectedEntry.email}</p>
                  </div>
                  {matched && <Chip size="sm" className="bg-green-600 text-white shrink-0">Match</Chip>}
                </div>
                {selectedEntry.url && <a href={selectedEntry.url} target="_blank" rel="noopener" className="text-sm text-primary hover:underline break-all flex items-center gap-1"><LinkIcon className="w-4 h-4 shrink-0" />{selectedEntry.url}</a>}
                {selectedEntry.description && <p className="text-sm text-muted-foreground">{selectedEntry.description}</p>}
                <div className="flex gap-2">
                  <Button variant="tertiary" className="flex-1 border border-border" onPress={() => copyText(selectedEntry.email, "email")}>{copiedId === "email" ? <><CheckIcon className="w-4 h-4" /> Copied</> : "Copy username"}</Button>
                  <Button className="flex-1 bg-primary text-primary-foreground" onPress={() => copyPassword(selectedEntry)}>{copiedId === selectedEntry.id ? <><CheckIcon className="w-4 h-4" /> Copied</> : "Copy password"}</Button>
                </div>
                {host && matched && <span className="text-xs bg-green-50 border border-green-200 rounded-lg px-2 py-1.5 text-green-800">Matches current site: {host}</span>}
                {!host && <p className="text-xs text-muted-foreground">No site detected (chrome internal page)</p>}
              </Card.Content>
            </Card>
          </div>
        </div>
    );
  }

  return (
      <div className="w-[400px] bg-background flex flex-col max-h-[580px] min-h-[480px]">
        <ExtensionHeader siteUrl={siteUrl} onLock={logout} onGenerate={() => setShowGenerator(true)} />

        {err && <div className="mx-3 mt-3 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-800 flex items-center justify-between">{err}<button onClick={() => setErr(null)} className="ml-2 text-red-600 hover:underline"><XMarkIcon className="w-4 h-4" /></button></div>}

        {/* toolbar — reusing @repo/ui SearchInput + ViewToggle (same as site) */}
        <div className="p-3 border-b border-border bg-background sticky top-14 z-10">
          <div className="flex gap-2 items-center">
            <SearchInput value={q} onChange={setQ} placeholder="Search accounts..." />
            <ViewToggle value={viewMode} onChange={setViewMode} />
          </div>
          {/* spaces pills — same as site filter but inline */}
          <div className="flex gap-1.5 mt-3 overflow-x-auto pb-1 -mb-1 scrollbar-none">
            <button onClick={() => setSelectedSpace(null)} className={`shrink-0 text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${!selectedSpace ? "bg-foreground text-background border-foreground" : "bg-card border-border text-foreground hover:bg-muted"}`}>All</button>
            {loadingSpaces ? <span className="text-xs px-2 py-1.5 text-muted-foreground">Loading…</span> : spaces.map((s) => (
              <button key={s.id} onClick={() => setSelectedSpace(s.id)} className={`shrink-0 text-xs px-3 py-1.5 rounded-full border font-medium flex items-center gap-1.5 transition-colors ${selectedSpace === s.id ? "bg-foreground text-background border-foreground" : "bg-card border-border hover:bg-muted"}`}>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getSpaceColor(s) }} />
                {s.name}
              </button>
            ))}
          </div>
          {host && <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-600" /> Prioritizing matches for <span className="font-medium text-foreground">{host}</span></p>}
        </div>

        <div className="flex-1 overflow-auto bg-muted/30 p-3">
          {loadingEntries ? (
            <div className="grid gap-3"><div className="h-24 rounded-2xl bg-card border border-border animate-pulse" /><div className="h-24 rounded-2xl bg-card border border-border animate-pulse" /></div>
          ) : sorted.length === 0 ? (
            <Card className="shadow-none border-dashed border-2 rounded-2xl"><Card.Content className="p-8 text-center"><p className="text-sm font-medium">No accounts</p><p className="text-xs text-muted-foreground mt-1">{q ? `No match for "${q}"` : host ? `No accounts for ${host}` : "No accounts in this space"}</p></Card.Content></Card>
          ) : (
            <div className={viewMode === "compact" ? "flex flex-col gap-2" : "grid grid-cols-1 gap-3"}>
              {sorted.map((e) => {
                const vaultEntry = { ...e, password: pwdCache[e.id] ?? "" } as unknown as import("@repo/ui").VaultEntry;
                return (
                  <div key={e.id} onClick={() => setSelectedEntry(e)} className="rounded-2xl">
                    <EntryCard
                      entry={vaultEntry}
                      viewMode={viewMode}
                      isSelected={false}
                      onToggleSelect={() => {}}
                      onMenuAt={(x, y) => setEntryMenu({ id: e.id, x, y })}
                      onContextMenu={(ev) => { ev.preventDefault(); const r = (ev.target as HTMLElement).getBoundingClientRect(); setEntryMenu({ id: e.id, x: r.left, y: r.bottom + 8 }); }}
                      showPasswordMap={showPwd}
                      onToggleShow={handleToggleShow}
                      copiedId={copiedId}
                      onCopy={() => copyPassword(e)}
                    />
                  </div>
                );
              })}
            </div>
          )}
          {entryMenu && (
            <div data-entry-menu className="fixed z-40 min-w-[180px] bg-popover border border-border shadow-sm rounded-xl p-1 flex flex-col" style={{ left: Math.min(entryMenu.x, 220), top: entryMenu.y }} onClick={(e) => e.stopPropagation()}>
              <button className="text-left px-3 py-2 text-sm rounded-lg hover:bg-muted flex items-center gap-2" onClick={() => { const ent = entries.find((x) => x.id === entryMenu.id); if (ent) setSelectedEntry(ent); setEntryMenu(null); }}>Open</button>
              <button className="text-left px-3 py-2 text-sm rounded-lg hover:bg-muted flex items-center gap-2" onClick={async () => { const ent = entries.find((x) => x.id === entryMenu.id); if (ent) { await navigator.clipboard.writeText(ent.email); setCopiedId(ent.id + "-email"); setTimeout(() => setCopiedId(null), 1500); } setEntryMenu(null); }}>Copy email</button>
              <button className="text-left px-3 py-2 text-sm rounded-lg hover:bg-muted flex items-center gap-2" onClick={async () => { const ent = entries.find((x) => x.id === entryMenu.id); if (ent) await copyPassword(ent); setEntryMenu(null); }}>Copy password</button>
              {entries.find((x) => x.id === entryMenu.id)?.url && <button className="text-left px-3 py-2 text-sm rounded-lg hover:bg-muted flex items-center gap-2" onClick={() => { const ent = entries.find((x) => x.id === entryMenu.id); if (ent?.url) browser.tabs.create({ url: ent.url }); setEntryMenu(null); }}>Open URL</button>}
            </div>
          )}
        </div>

        {entryMenu && <div className="fixed inset-0 z-30" onClick={() => setEntryMenu(null)} aria-hidden />}

        <div className="p-2.5 border-t border-border bg-card flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">{sorted.length} accounts {host && "· prioritizing host"}</span>
          <a href={siteUrl} target="_blank" rel="noopener" className="text-xs font-medium text-primary hover:underline">Open OneAccount →</a>
        </div>

        {showGenerator && (
          <div className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-3" onClick={() => setShowGenerator(false)}>
            <div className="bg-card rounded-t-2xl sm:rounded-2xl border-t sm:border border-border w-full max-w-[400px] max-h-[90vh] overflow-auto flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-card border-b border-border p-3 flex items-center justify-between">
                <h3 className="font-semibold text-sm flex items-center gap-2"><KeyIcon className="w-4 h-4" /> Generate password</h3>
                <Button variant="ghost" size="sm" isIconOnly className="w-8 h-8" onPress={() => setShowGenerator(false)} aria-label="Close"><XMarkIcon className="w-4 h-4" /></Button>
              </div>
              <div className="p-3 flex flex-col gap-4">
                {/* display - mirrors landing PasswordDisplay */}
                <div className="rounded-xl bg-muted/40 p-3 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex-1 min-w-0 break-all font-mono text-sm font-medium select-all">{genPassword || "••••••••••••"}</span>
                    <Button size="sm" variant="ghost" isIconOnly className={`h-8 w-8 border ${genCopied ? "bg-green-50 border-green-200 text-green-600" : "bg-card border-border"}`} onPress={handleGenCopy} aria-label="Copy"><ClipboardDocumentIcon className="w-4 h-4" /></Button>
                    <Button size="sm" variant="ghost" isIconOnly className="h-8 w-8 border border-border bg-card" onPress={handleGenRegenerate} aria-label="Regenerate"><ArrowPathIcon className="w-4 h-4" /></Button>
                  </div>
                  {(() => { const s = evaluateStrength(genPassword, genMode, genOpts, genPpOpts, genPinLength); return <span className={`text-xs font-medium ${s.color}`}>{s.label} · {s.text}</span>; })()}
                </div>
                <div className="flex gap-1">
                  {(["password", "pin", "passphrase"] as Mode[]).map((m) => (
                    <button key={m} onClick={() => setGenMode(m)} className={`flex-1 rounded-full px-2 py-1.5 text-xs font-medium border capitalize ${genMode === m ? "bg-foreground text-background border-foreground" : "bg-card border-border"}`}>{m}</button>
                  ))}
                </div>
                {genMode === "password" && (
                  <div className="flex flex-col gap-3">
                    <Slider value={genOpts.length} minValue={8} maxValue={32} step={1} onChange={(v) => setGenOpts({ ...genOpts, length: typeof v === "number" ? v : Number((v as number[])[0]) })} className="w-full gap-1">
                      <div className="flex items-center justify-between w-full"><Label className="text-xs">Length</Label><Slider.Output className="text-xs font-semibold" /></div>
                      <Slider.Track><Slider.Fill /><Slider.Thumb /></Slider.Track>
                    </Slider>
                    <div className="flex flex-col gap-1">
                      <GenToggle checked={genOpts.uppercase} onChange={(v) => setGenOpts({ ...genOpts, uppercase: v })} label="Include Uppercase Letters" />
                      <GenToggle checked={genOpts.lowercase} onChange={(v) => setGenOpts({ ...genOpts, lowercase: v })} label="Include Lowercase Letters" />
                      <GenToggle checked={genOpts.numbers} onChange={(v) => setGenOpts({ ...genOpts, numbers: v })} label="Include Numbers" />
                      <GenToggle checked={genOpts.symbols} onChange={(v) => setGenOpts({ ...genOpts, symbols: v })} label="Include Symbols" />
                    </div>
                  </div>
                )}
                {genMode === "pin" && (
                  <Slider value={genPinLength} minValue={4} maxValue={12} step={1} onChange={(v) => setGenPinLength(typeof v === "number" ? v : Number((v as number[])[0]))} className="w-full gap-1">
                    <div className="flex items-center justify-between w-full"><Label className="text-xs">PIN length</Label><Slider.Output className="text-xs font-semibold" /></div>
                    <Slider.Track><Slider.Fill /><Slider.Thumb /></Slider.Track>
                  </Slider>
                )}
                {genMode === "passphrase" && (
                  <div className="flex flex-col gap-2">
                    <Slider value={genPpOpts.numWords} minValue={3} maxValue={7} step={1} onChange={(v) => setGenPpOpts({ ...genPpOpts, numWords: typeof v === "number" ? v : Number((v as number[])[0]) })} className="w-full gap-1">
                      <div className="flex items-center justify-between w-full"><Label className="text-xs">Words</Label><Slider.Output className="text-xs font-semibold" /></div>
                      <Slider.Track><Slider.Fill /><Slider.Thumb /></Slider.Track>
                    </Slider>
                    <div className="flex gap-1">
                      {["-", "_", ".", " "].map((s) => (
                        <button key={s} onClick={() => setGenPpOpts({ ...genPpOpts, separator: s })} className={`flex-1 h-7 rounded-md border text-xs ${genPpOpts.separator === s ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"}`}>{s === " " ? "␣" : s}</button>
                      ))}
                    </div>
                    <div className="flex flex-col gap-1">
                      <GenToggle checked={genPpOpts.capitalize} onChange={(v) => setGenPpOpts({ ...genPpOpts, capitalize: v })} label="Capitalize Words" />
                      <GenToggle checked={genPpOpts.includeNumber} onChange={(v) => setGenPpOpts({ ...genPpOpts, includeNumber: v })} label="Include Number" />
                    </div>
                  </div>
                )}
                <div className="border-t border-border pt-3 flex flex-col gap-2">
                  {genCopied && <p className="text-xs text-green-600 text-center">Copied to clipboard</p>}
                  <Button className="w-full bg-primary text-primary-foreground" onPress={async () => { await handleGenCopy(); setShowGenerator(false); setShowSpacePicker(true); setGenError(null); }}>Add to space</Button>
                  <button onClick={handleGenCopy} className="text-xs text-primary hover:underline text-center">Copy password only</button>
                </div>
              </div>
            </div>
          </div>
        )}
        {showSpacePicker && (
          <div className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-3" onClick={() => setShowSpacePicker(false)}>
            <div className="bg-card rounded-t-2xl sm:rounded-2xl border-t sm:border border-border w-full max-w-[400px] max-h-[90vh] overflow-auto flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-card border-b border-border p-3 flex items-center justify-between">
                <h3 className="font-semibold text-sm">Save to space</h3>
                <Button variant="ghost" size="sm" isIconOnly className="w-8 h-8" onPress={() => setShowSpacePicker(false)} aria-label="Close"><XMarkIcon className="w-4 h-4" /></Button>
              </div>
              <div className="p-3 flex flex-col gap-3">
                <p className="text-xs text-muted-foreground">Password copied. Choose a space and save.</p>
                <div className="rounded-xl bg-muted/20 border border-border p-2">
                  <p className="font-mono text-sm break-all select-all">{genPassword}</p>
                </div>
                <Select selectedKey={genSpaceId} onSelectionChange={(k) => setGenSpaceId(String(k || ""))} placeholder="Select space" className="w-full">
                  <Select.Trigger><Select.Value /></Select.Trigger>
                  <Select.Popover className="bg-popover border border-border"><ListBox className="p-1">{spaces.map((s) => (<ListBox.Item key={s.id} id={s.id} textValue={s.name}><div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: getSpaceColor(s) }} />{s.name} <span className="text-xs text-muted-foreground">· {s.type}</span></div></ListBox.Item>))}</ListBox></Select.Popover>
                </Select>
                <Input placeholder="Title (optional) — e.g. GitHub" value={genTitle} onChange={(e) => setGenTitle((e.target as HTMLInputElement).value)} aria-label="Title" />
                <Input placeholder="Email / username *" value={genEmail} onChange={(e) => setGenEmail((e.target as HTMLInputElement).value)} aria-label="Email" />
                {genError && <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-2">{genError}</p>}
                <div className="flex gap-2">
                  <Button variant="ghost" className="flex-1" onPress={() => setShowSpacePicker(false)}>Cancel</Button>
                  <Button className="flex-1 bg-primary text-primary-foreground" isDisabled={genSaving || !genPassword} onPress={handleGenSave}>{genSaving ? "Saving…" : "Save"}</Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<PopupApp />);
