"use client";
import { useState, useEffect } from "react";
import { Card, Button, Checkbox, InputGroup } from "@heroui/react";
import {
  EllipsisVerticalIcon,
  EyeIcon,
  EyeSlashIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  LinkIcon,
  ArrowTopRightOnSquareIcon,
  ChatBubbleLeftEllipsisIcon,
  BoltIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { Icon } from "./icon";
import { timeAgo } from "../utils/time";
import { COLORS } from "../constants/icons";
import type { VaultEntry, Category, ViewMode } from "../types";

type EntryCardProps = {
  entry: VaultEntry;
  viewMode: ViewMode;
  isSelected: boolean;
  onToggleSelect: () => void;
  onMenuAt: (x: number, y: number) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  showPasswordMap: Record<string, boolean>;
  onToggleShow: (id: string) => void;
  copiedId: string | null;
  onCopy: (id: string, pwd: string) => void;
  onAutofill?: (id: string) => void;
  autofillingId?: string | null;
  revealingIds?: Record<string, boolean>;
  hideSelect?: boolean;
};

function isLightColor(hex: string) {
  try {
    const c = hex.replace("#", "");
    const r = parseInt(c.slice(0, 2), 16) / 255;
    const g = parseInt(c.slice(2, 4), 16) / 255;
    const b = parseInt(c.slice(4, 6), 16) / 255;
    const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return l > 0.65;
  } catch { return false; }
}

function useIsDark() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return isDark;
}

export function EntryCard({ entry, viewMode, isSelected, onToggleSelect, onMenuAt, onContextMenu, showPasswordMap, onToggleShow, copiedId, onCopy, onAutofill, autofillingId, revealingIds, hideSelect }: EntryCardProps) {
  const displayCat: Category | { name: string; icon: string | null; color: string | null; logoUrl: string | null } | null =
    (entry as unknown as { categoryRef?: Category | null }).categoryRef ??
    (entry.category ? { name: entry.category, icon: entry.icon, color: entry.color, logoUrl: (entry as unknown as { logoUrl?: string | null }).logoUrl ?? null } : null);
  const catColor = displayCat?.color || COLORS[0];
  const catIcon = displayCat?.icon || null;
  const catLogo = (displayCat as unknown as { logoUrl?: string | null })?.logoUrl || null;
  const isCompact = viewMode === "compact";
  const [logoError, setLogoError] = useState(false);
  // reset error when logo changes (space/category switch)
  const [prevLogo, setPrevLogo] = useState<string | null>(null);
  if (prevLogo !== catLogo) { setPrevLogo(catLogo); if (logoError) setLogoError(false); }
  const needsInvert = !!catLogo && /jsdelivr|unpkg/.test(catLogo);
  const isLight = isLightColor(catColor);
  const isDark = useIsDark();
  // theme-oriented: in dark mode force white for contrast, even on light category colors add drop-shadow
  const iconFg = isDark ? "text-white" : isLight ? "text-black" : "text-white";
  const logoFilter = needsInvert ? (isDark || !isLight ? "brightness-0 invert" : "") : "";
  const ringClass = isDark ? "ring-white/20" : "ring-black/10";

  return (
    <Card className="w-full shadow-none hover:scale-[1.02] duration-300 transition-transform rounded-2xl group cursor-pointer" onContextMenu={onContextMenu}>
      <Card.Content className={isCompact ? "px-2.5 py-1.5 flex flex-col gap-1.5" : "p-2 flex flex-col gap-3"}>
        {isCompact ? (
          <>
            <div className="flex items-center gap-2">
              {!hideSelect && (
                <Checkbox isSelected={isSelected} onChange={onToggleSelect} aria-label="Select account"  variant="secondary" onClick={(ev) => ev.stopPropagation()}>
                  <Checkbox.Content>
                    <Checkbox.Control>
                      <Checkbox.Indicator />
                    </Checkbox.Control>
                  </Checkbox.Content>
                </Checkbox>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-foreground truncate leading-tight">{entry.title ?? displayCat?.name ?? "Account"}</h3>
                <span className="text-xs text-muted-foreground truncate block">{entry.email}</span>
              </div>
              <Button
                isIconOnly
                variant="tertiary"
                size="sm"
                aria-label="Account menu"
                className="h-7 w-7 shrink-0"
                onPress={(ev: unknown) => {
                  const anyEv = ev as { currentTarget?: Element };
                  const raw = anyEv?.currentTarget as HTMLElement | undefined;
                  const target = (raw?.closest?.("button") as HTMLElement | null) ?? raw ?? null;
                  if (!target?.getBoundingClientRect) {
                    onMenuAt(window.innerWidth / 2, window.innerHeight / 2);
                    return;
                  }
                  const r = target.getBoundingClientRect();
                  const x = Math.min(r.right - 160, window.innerWidth - 180);
                  const y = r.bottom + 8;
                  onMenuAt(x, y);
                }}
              >
                <EllipsisVerticalIcon className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
            <div className="relative w-full" onClick={(ev) => ev.stopPropagation()}>
              {copiedId === entry.id && <span className="absolute -top-7 right-0 z-10 text-xs font-medium bg-foreground text-background px-2 py-1 rounded-md shadow-sm pointer-events-none">Copied</span>}
              <InputGroup fullWidth>
                <InputGroup.Input readOnly value={showPasswordMap[entry.id] ? entry.password : "••••••••••"} aria-label="Password" className="w-full font-mono text-sm" />
                <InputGroup.Suffix className="pe-0">
                  <Button isIconOnly size="sm" variant="ghost" aria-label={revealingIds?.[entry.id] ? "Loading…" : showPasswordMap[entry.id] ? "Hide password" : "Show password"} onPress={() => onToggleShow(entry.id)} isDisabled={!!revealingIds?.[entry.id]} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                    {revealingIds?.[entry.id] ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : showPasswordMap[entry.id] ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </Button>
                  {onAutofill && (
                    <Button isIconOnly size="sm" variant="ghost" aria-label={autofillingId === entry.id ? "Filling…" : "Autofill on this page"} onPress={() => onAutofill(entry.id)} isDisabled={autofillingId === entry.id || !!revealingIds?.[entry.id]} className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10">
                      {autofillingId === entry.id ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <BoltIcon className="w-4 h-4" />}
                    </Button>
                  )}
                  <Button isIconOnly size="sm" variant="ghost" aria-label={copiedId === entry.id ? "Copied" : "Copy password"} onPress={() => onCopy(entry.id, entry.password)} className={`h-8 w-8 ${copiedId === entry.id ? "text-success" : "text-muted-foreground hover:text-foreground"}`}>
                    {copiedId === entry.id ? <CheckIcon className="w-4 h-4" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
                  </Button>
                </InputGroup.Suffix>
              </InputGroup>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2" onClick={(ev) => ev.stopPropagation()}>
                {!hideSelect && (
                  <Checkbox isSelected={isSelected} onChange={onToggleSelect} variant="secondary" aria-label="Select account">
                    <Checkbox.Content>
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                    </Checkbox.Content>
                  </Checkbox>
                )}
                <div className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 ring-1 ${ringClass} shadow-sm ${iconFg}`} style={{ backgroundColor: catColor }}>
                  {catLogo && !logoError ? (
                    <img src={catLogo} alt={displayCat!.name} className={`w-5 h-5 object-contain ${logoFilter} ${isDark ? "drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" : ""}`} onError={() => setLogoError(true)} />
                  ) : catIcon ? (
                    <Icon icon={catIcon} className={`w-5 h-5 ${iconFg} ${isDark ? "drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]" : ""}`} />
                  ) : (
                    <span className={`font-bold text-sm ${iconFg} ${isDark ? "drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]" : ""}`}>{(entry.title ?? entry.email).charAt(0).toUpperCase()}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5" onClick={(ev) => ev.stopPropagation()}>
                <Button
                  isIconOnly
                  variant="tertiary"
                  size="sm"
                  aria-label="Account menu"
                  className="opacity-60 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity h-7 w-7 min-w-7"
                  onPress={(ev: unknown) => {
                    const anyEv = ev as { currentTarget?: Element };
                    const raw = anyEv?.currentTarget as HTMLElement | undefined;
                    const target = (raw?.closest?.("button") as HTMLElement | null) ?? raw ?? null;
                    if (!target?.getBoundingClientRect) {
                      onMenuAt(window.innerWidth / 2, window.innerHeight / 2);
                      return;
                    }
                    const r = target.getBoundingClientRect();
                    const x = Math.min(r.right - 160, window.innerWidth - 180);
                    const y = r.bottom + 8;
                    onMenuAt(x, y);
                  }}
                >
                  <EllipsisVerticalIcon className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground truncate leading-5">{entry.title ?? displayCat?.name ?? "Account"}</h3>
              <span className="text-xs text-primary truncate block">{displayCat?.name ?? entry.email}</span>
            </div>
            {entry.url && (
              <div className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-primary shrink-0" />
                <a href={entry.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate flex-1 min-w-0" onClick={(ev) => ev.stopPropagation()}>
                  {entry.url}
                </a>
                <ArrowTopRightOnSquareIcon className="w-4 h-4 text-muted-foreground shrink-0" />
              </div>
            )}
            <div className="relative w-full" onClick={(ev) => ev.stopPropagation()}>
              {copiedId === entry.id && <span className="absolute -top-7 right-0 z-10 text-xs font-medium bg-foreground text-background px-2 py-1 rounded-md shadow-sm pointer-events-none">Copied</span>}
              <InputGroup fullWidth>
                <InputGroup.Input readOnly value={showPasswordMap[entry.id] ? entry.password : "••••••••••"} aria-label="Password" className="w-full font-mono text-sm" />
                <InputGroup.Suffix className="pe-0">
                  <Button isIconOnly size="sm" variant="ghost" aria-label={revealingIds?.[entry.id] ? "Loading…" : showPasswordMap[entry.id] ? "Hide password" : "Show password"} onPress={() => onToggleShow(entry.id)} isDisabled={!!revealingIds?.[entry.id]} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                    {revealingIds?.[entry.id] ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : showPasswordMap[entry.id] ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </Button>
                  {onAutofill && (
                    <Button isIconOnly size="sm" variant="ghost" aria-label={autofillingId === entry.id ? "Filling…" : "Autofill on this page"} onPress={() => onAutofill(entry.id)} isDisabled={autofillingId === entry.id || !!revealingIds?.[entry.id]} className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10">
                      {autofillingId === entry.id ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <BoltIcon className="w-4 h-4" />}
                    </Button>
                  )}
                  <Button isIconOnly size="sm" variant="ghost" aria-label={copiedId === entry.id ? "Copied" : "Copy password"} onPress={() => onCopy(entry.id, entry.password)} className={`h-8 w-8 ${copiedId === entry.id ? "text-success" : "text-muted-foreground hover:text-foreground"}`}>
                    {copiedId === entry.id ? <CheckIcon className="w-4 h-4" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
                  </Button>
                </InputGroup.Suffix>
              </InputGroup>
            </div>
            <div className="flex gap-6 flex-wrap items-center justify-between">
              <p className="text-xs text-muted-foreground line-clamp-2 max-w-[60%] flex items-center gap-1.5">
                <ChatBubbleLeftEllipsisIcon className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                <span className="line-clamp-2">{entry.description?.trim() ? entry.description : "no description"}</span>
              </p>
              <div className="flex items-end justify-end flex-col text-[11px] text-muted-foreground">
                <span className="truncate max-w-[140px]">{entry.email}</span>
                <span>updated {timeAgo(entry.updatedAt)}</span>
              </div>
            </div>
          </>
        )}
      </Card.Content>
    </Card>
  );
}
