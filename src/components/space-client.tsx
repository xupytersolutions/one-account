"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, Button, Checkbox, Dropdown, Separator } from "@heroui/react";
import { LockClosedIcon, EllipsisVerticalIcon, PencilSquareIcon, TrashIcon, ArrowsRightLeftIcon, ArrowUpTrayIcon, ArrowDownTrayIcon, ClipboardDocumentIcon, PlusIcon } from "@heroicons/react/24/outline";
import { AutoSkeleton } from "auto-skeleton-react";

import { StickyHeader } from "@/components/ui/sticky-header";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EntryCard } from "@/components/entries/entry-card";
import { EntryToolbar } from "@/components/entries/entry-toolbar";
import { EntryFormDialog } from "@/components/entries/entry-form-dialog";
import { TransferDialog } from "@/components/entries/transfer-dialog";
import { ImportDialog } from "@/components/entries/import-dialog";
import { ErrorState, EmptyState } from "@/components/ui/state";
import { useSpace } from "@/lib/query/use-space";
import { useCreateEntry, useUpdateEntry, useDeleteEntry, useTransferEntry, useBulkCreateEntries, useBulkDeleteEntries, useBulkTransferEntries } from "@/lib/query/use-entries";
import { useSelection } from "@/lib/hooks/use-selection";
import { useOutsideClick } from "@/lib/hooks/use-outside-click";
import { useViewMode } from "@/lib/hooks/use-view-mode";
import { usePersistedState } from "@/lib/hooks/use-persisted-state";
import { useEntryFilters } from "@/lib/hooks/use-entry-filters";
import { entrySchema } from "@/lib/validators";
import { parseImportText } from "@/lib/utils/csv";
import { exportEntriesToFile } from "@/lib/utils/export";
import { timeAgo } from "@/lib/utils/time";
import type { VaultEntry } from "@/lib/types";

export function SpaceClient({ spaceId }: { spaceId: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data, isLoading, isError, error, refetch, isFetching } = useSpace(spaceId);
  const space = data?.space;
  const entries = data?.entries ?? [];
  const allSpaces = data?.allSpaces ?? [];
  const allCategories = data?.allCategories ?? [];

  const createMut = useCreateEntry(spaceId);
  const updateMut = useUpdateEntry(spaceId);
  const deleteMut = useDeleteEntry(spaceId);
  const transferMut = useTransferEntry(spaceId);
  const bulkCreateMut = useBulkCreateEntries(spaceId);
  const bulkDeleteMut = useBulkDeleteEntries(spaceId);
  const bulkTransferMut = useBulkTransferEntries(spaceId);

  const { selected, toggle, clear, remove } = useSelection(entries.length, entries.map((e) => e.id));
  const [search, setSearch] = usePersistedState(`one-account:accountsFilters:${spaceId}:search`, "");
  const [filterOpen, setFilterOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = usePersistedState(`one-account:accountsFilters:${spaceId}:category`, "all");
  const [sortBy, setSortBy] = usePersistedState(`one-account:accountsFilters:${spaceId}:sort`, "updated");
  const [viewMode, setViewMode] = useViewMode("one-account:accountsView");
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editing, setEditing] = useState<VaultEntry | null>(null);
  const [entryCtx, setEntryCtx] = useState<{ id: string; x: number; y: number } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VaultEntry | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState<{ ids: string[] } | null>(null);
  const [transferTarget, setTransferTarget] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [importRows, setImportRows] = useState<import("@/lib/types").ImportRow[]>([]);
  const [importFileName, setImportFileName] = useState("");
  const [importError, setImportError] = useState("");
  const [genPassword, setGenPassword] = useState<string | null>(null);
  const [genCreate, setGenCreate] = useState(false);

  const { filteredEntries, activeFilterCount } = useEntryFilters(entries, search, categoryFilter, sortBy);

  useOutsideClick(filterOpen, () => setFilterOpen(false), "[data-filter-pane],[data-filter-trigger]");
  useOutsideClick(!!entryCtx, () => setEntryCtx(null), "[data-context-menu],[data-ctx-menu]");

  useEffect(() => {
    const create = searchParams.get("create") === "1" || searchParams.get("gen") === "1";
    let pwd = searchParams.get("password");
    if (!pwd) { try { const s = sessionStorage.getItem("one-account:genPassword"); if (s) pwd = s; } catch { } }
    if (create) {
      if (pwd) setGenPassword(pwd);
      setGenCreate(true);
      if (!isAddOpen && !editing) setIsAddOpen(true);
      const params = new URLSearchParams(searchParams.toString()); params.delete("create"); params.delete("gen"); params.delete("password");
      const qs = params.toString(); router.replace(qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
      try { if (pwd) sessionStorage.removeItem("one-account:genPassword"); } catch { }
    }
  }, [searchParams, router, isAddOpen, editing]);

  const fetchCredential = async (id: string) => {
    if (revealed[id]) return revealed[id];
    try {
      const res = await fetch(`/api/entries/${id}/credential`);
      if (!res.ok) throw new Error("Failed to reveal");
      const data = await res.json();
      const pwd = String(data.password ?? "");
      setRevealed((prev) => ({ ...prev, [id]: pwd }));
      return pwd;
    } catch {
      return "";
    }
  };
  const toggleShow = async (id: string) => {
    const willShow = !showPasswords[id];
    if (willShow && !revealed[id]) await fetchCredential(id);
    setShowPasswords((p) => ({ ...p, [id]: !p[id] }));
  };
  const handleCopy = async (id: string, pwd: string) => {
    let toCopy = pwd;
    if (!toCopy || toCopy === "••••••••••") toCopy = await fetchCredential(id);
    if (!toCopy) {
      const e = entries.find((x) => x.id === id);
      toCopy = (e as unknown as { password?: string })?.password ?? "";
      if (!toCopy || toCopy === "••••••••••") toCopy = await fetchCredential(id);
    }
    if (!toCopy) return;
    await navigator.clipboard.writeText(toCopy);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 1500);
  };
  const handleExport = async () => {
    if (!space) return;
    try {
      const res = await fetch(`/api/spaces/${spaceId}/export`);
      if (!res.ok) throw new Error("Export failed");
      const data = await res.json();
      const exportEntries = (data.entries ?? []) as VaultEntry[];
      exportEntriesToFile(exportEntries, space.name);
    } catch {
      // fallback to sanitized entries (without password) if explicit export fails
      exportEntriesToFile(entries, space.name);
    }
  };
  const handleFile = async (f: File | null) => {
    if (!f) return; setImportFileName(f.name); setImportError(""); const text = await f.text(); const rows = parseImportText(text);
    if (rows.length === 0) setImportError("No valid rows found. Expected txt with CSV/JSON: title,email,password,url,description or JSON array.");
    setImportRows(rows);
  };
  const confirmImport = async () => {
    const valid = importRows.filter((r) => r.email && r.password);
    if (valid.length === 0) { setImportError("Each row needs login and password"); return; }
    for (const r of valid) { const p = entrySchema.safeParse({ title: r.title || null, email: r.email, password: r.password, url: r.url || null, description: r.description || null, category: r.category || null }); if (!p.success) { setImportError(`Row "${r.title || r.email}": ${p.error?.issues?.[0]?.message || "Validation failed"}`); return; } }
    try { await bulkCreateMut.mutateAsync(valid.map((r) => ({ title: r.title || null, email: r.email, password: r.password, url: r.url || null, description: r.description || null, category: r.category || null }))); setImportOpen(false); setImportRows([]); setImportFileName(""); setImportError(""); } catch (e) { setImportError(e instanceof Error ? e.message : "Import failed"); }
  };
  const handleTransfer = async () => {
    if (!transferOpen || !transferTarget) return;
    if (transferOpen.ids.length === 1) await transferMut.mutateAsync({ entryId: transferOpen.ids[0], targetSpaceId: transferTarget });
    else await bulkTransferMut.mutateAsync({ entryIds: transferOpen.ids, targetSpaceId: transferTarget });
    setTransferOpen(null); setTransferTarget(""); clear();
  };
  const confirmSingleDelete = async () => { if (!deleteTarget) return; await deleteMut.mutateAsync(deleteTarget.id); setDeleteTarget(null); remove(deleteTarget.id); };
  const confirmBulkDelete = async () => { if (selected.size === 0) return; await bulkDeleteMut.mutateAsync(Array.from(selected)); setBulkDeleteOpen(false); clear(); };
  const entryCtxEntry = entryCtx ? entries.find((e) => e.id === entryCtx.id) ?? null : null;

  const isMutating = createMut.isPending || updateMut.isPending || deleteMut.isPending || bulkDeleteMut.isPending || transferMut.isPending || bulkTransferMut.isPending || bulkCreateMut.isPending;

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
        <StickyHeader title="Loading…" description=" " />
        <AutoSkeleton loading={true}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="rounded-2xl p-4"><Card.Content className="space-y-3"><div className="w-10 h-10 rounded-md bg-muted" /><div className="h-4 w-32 bg-muted rounded" /><div className="h-8 w-full bg-muted rounded" /></Card.Content></Card>
            ))}
          </div>
        </AutoSkeleton>
      </div>
    );
  }

  if (isError || !space) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
        <StickyHeader breadcrumbs={[{ label: "Spaces", href: "/dashboard" }, { label: "Space" }]} title="Space" description=" " />
        <ErrorState message={error instanceof Error ? error.message : "Failed to load space"} onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
      <StickyHeader
        breadcrumbs={[{ label: "Spaces", href: "/dashboard" }, { label: space.name }]}
        title={space.name}
        description={space.description?.trim() ? space.description : `Manage credentials in this ${space.type} space.`}
        badge={{ label: space.type }}
        action={
          <div className="flex items-center gap-2">
            <Button onPress={() => { setEditing(null); setIsAddOpen(true); }} isDisabled={isMutating} className="bg-primary hover:bg-primary-hover text-primary-foreground font-medium h-9">
              {isMutating ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null} + Account
            </Button>
            <Dropdown><Button isIconOnly variant="tertiary" size="sm" aria-label="Account actions" className="h-9 w-9 border border-border bg-card" isDisabled={isLoading}><EllipsisVerticalIcon className="w-5 h-5" /></Button>
              <Dropdown.Popover className="bg-popover border border-border shadow-sm rounded-xl min-w-[200px]"><Dropdown.Menu aria-label="Account actions" className="p-1" onAction={(k) => { if (k === "export") handleExport(); if (k === "import") setImportOpen(true); if (k === "bulk-transfer" && selected.size > 0) setTransferOpen({ ids: Array.from(selected) }); if (k === "bulk-delete" && selected.size > 0) setBulkDeleteOpen(true); }}>
                {selected.size > 0 && (<><Dropdown.Item id="bulk-transfer" textValue="Transfer selected" className="rounded-lg text-foreground data-[focused]:bg-muted"><div className="flex items-center gap-2"><ArrowsRightLeftIcon className="w-4 h-4" /><span>Transfer ({selected.size})</span></div></Dropdown.Item><Dropdown.Item id="bulk-delete" textValue="Delete selected" className="rounded-lg text-destructive data-[focused]:bg-destructive/10 data-[focused]:text-destructive"><div className="flex items-center gap-2"><TrashIcon className="w-4 h-4" /><span>Delete ({selected.size})</span></div></Dropdown.Item><Separator className="my-1 bg-border" /></>)}
                <Dropdown.Item id="export" textValue="Export txt" className="rounded-lg text-foreground data-[focused]:bg-muted"><div className="flex items-center gap-2"><ArrowDownTrayIcon className="w-4 h-4" /><span>Export txt</span></div></Dropdown.Item><Dropdown.Item id="import" textValue="Import txt" className="rounded-lg text-foreground data-[focused]:bg-muted"><div className="flex items-center gap-2"><ArrowUpTrayIcon className="w-4 h-4" /><span>Import txt</span></div></Dropdown.Item>
              </Dropdown.Menu></Dropdown.Popover></Dropdown>
          </div>
        }
        toolbar={<EntryToolbar search={search} onSearchChange={setSearch} viewMode={viewMode} onViewModeChange={setViewMode} categoryFilter={categoryFilter} onCategoryFilterChange={setCategoryFilter} sortBy={sortBy} onSortByChange={setSortBy} filterOpen={filterOpen} onFilterOpenChange={setFilterOpen} activeFilterCount={activeFilterCount} categories={allCategories} onClearFilters={() => { setCategoryFilter("all"); setSortBy("updated"); setSearch(""); }} />}
      />

      {isFetching && !isLoading && <div className="h-1 w-full bg-primary/20 rounded-full overflow-hidden mb-3"><div className="h-full bg-primary animate-pulse w-full" /></div>}

      {entries.length === 0 ? (
        <EmptyState icon={LockClosedIcon} title="No accounts yet" description="Add your first account to this space" action={<Button onPress={() => { setEditing(null); setIsAddOpen(true); }} className="bg-primary hover:bg-primary-hover text-primary-foreground font-medium h-9">+ Account</Button>} />
      ) : (
        <>
          <div className="flex items-center justify-between px-1 mb-3"><span className="text-sm text-muted-foreground">{search.trim() || categoryFilter !== "all" || sortBy !== "updated" ? `${filteredEntries.length} of ${entries.length} total` : `${entries.length} total`}</span><span className="text-xs text-muted-foreground hidden sm:inline">updated {space.updatedAt ? timeAgo(space.updatedAt) : ""}</span></div>
          <div className="flex items-center gap-2 px-1 mb-4"><Checkbox isSelected={filteredEntries.length > 0 && filteredEntries.every((e) => selected.has(e.id))} onChange={() => { const ids = filteredEntries.map((e) => e.id); const all = ids.every((id) => selected.has(id)); if (all) ids.forEach((id) => { if (selected.has(id)) toggle(id); }); else ids.forEach((id) => { if (!selected.has(id)) toggle(id); }); }} className="text-sm"><Checkbox.Content><Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>Select all</Checkbox.Content></Checkbox><span className="text-sm text-muted-foreground ml-auto">{selected.size} selected{filteredEntries.length !== entries.length ? ` • ${filteredEntries.length} shown` : ""}</span></div>
          <AutoSkeleton loading={false}>
            {filteredEntries.length === 0 ? (<div className="flex flex-col items-center justify-center py-12 border border-dashed border-border rounded-xl bg-muted/20"><p className="text-sm font-medium text-foreground mb-1">No matches</p><p className="text-sm text-muted-foreground mb-4">Try adjusting search or filters.</p><Button variant="tertiary" onPress={() => { setSearch(""); setCategoryFilter("all"); setSortBy("updated"); }}>Clear filters</Button></div>) : (
              <div className={`grid mb-8 ${viewMode === "compact" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"}`}>
                {filteredEntries.map((e) => {
                  const withPwd = { ...e, password: revealed[e.id] ?? (e as unknown as { password?: string }).password ?? "" } as typeof e & { password: string };
                  return <EntryCard key={e.id} entry={withPwd} viewMode={viewMode} isSelected={selected.has(e.id)} onToggleSelect={() => toggle(e.id)} onMenuAt={(x, y) => setEntryCtx({ id: e.id, x, y })} onContextMenu={(ev) => { ev.preventDefault(); setEntryCtx({ id: e.id, x: ev.clientX, y: ev.clientY }); }} showPasswordMap={showPasswords} onToggleShow={toggleShow} copiedId={copiedId} onCopy={handleCopy} />;
                })}
                <Card className={`border-2 border-dashed border-border bg-muted/20 hover:border-border-strong hover:bg-muted/30 transition-colors cursor-pointer shadow-none rounded-2xl flex flex-col justify-center h-full ${viewMode === "compact" ? "min-h-[52px]" : "min-h-[180px]"}`} onClick={() => { setEditing(null); setIsAddOpen(true); }}><Card.Content className={`flex flex-col items-center justify-center text-center ${viewMode === "compact" ? "px-2.5 py-1.5" : "p-6 py-8"}`}><div className={`${viewMode === "compact" ? "w-6 h-6 mb-1" : "w-12 h-12 mb-3"} rounded-xl bg-muted border border-border flex items-center justify-center`}><PlusIcon className={`${viewMode === "compact" ? "w-3.5 h-3.5" : "w-6 h-6"} text-muted-foreground`} /></div><p className={`${viewMode === "compact" ? "text-xs" : "text-sm"} font-semibold text-foreground ${viewMode === "compact" ? "" : "mb-1"}`}>Create a new account</p>{viewMode !== "compact" && <p className="text-sm text-muted-foreground">Add credentials to this space.</p>}</Card.Content></Card>
              </div>
            )}
          </AutoSkeleton>
          {entryCtx && entryCtxEntry && (<div data-context-menu className="fixed z-40 min-w-[180px] bg-popover border border-border shadow-sm rounded-xl p-1 flex flex-col" style={{ left: Math.min(entryCtx.x, typeof window !== "undefined" ? window.innerWidth - 190 : entryCtx.x), top: entryCtx.y }} onClick={(ev) => ev.stopPropagation()}><button className="text-left px-3 py-2 text-sm rounded-lg hover:bg-muted text-foreground flex items-center gap-2" onClick={() => { setEntryCtx(null); setEditing({ ...entryCtxEntry, password: revealed[entryCtxEntry.id] ?? (entryCtxEntry as unknown as { password?: string }).password ?? "" } as unknown as typeof entryCtxEntry); setIsAddOpen(true); }}><PencilSquareIcon className="w-4 h-4" />Edit</button><button className="text-left px-3 py-2 text-sm rounded-lg hover:bg-muted text-foreground flex items-center gap-2" onClick={async () => { const pwd = revealed[entryCtxEntry.id] ?? (entryCtxEntry as unknown as { password?: string }).password ?? (await fetchCredential(entryCtxEntry.id)); if (!pwd) return; await navigator.clipboard.writeText(pwd); setCopiedId(entryCtxEntry.id); window.setTimeout(() => setCopiedId((cur) => (cur === entryCtxEntry.id ? null : cur)), 1500); setEntryCtx(null); }}><ClipboardDocumentIcon className="w-4 h-4" />Copy password</button><button className="text-left px-3 py-2 text-sm rounded-lg hover:bg-muted text-foreground flex items-center gap-2" onClick={() => { setEntryCtx(null); setTransferOpen({ ids: [entryCtx.id] }); }}><ArrowsRightLeftIcon className="w-4 h-4" />Transfer</button><button className="text-left px-3 py-2 text-sm rounded-lg hover:bg-destructive/10 text-destructive flex items-center gap-2" onClick={() => { setEntryCtx(null); setDeleteTarget(entryCtxEntry); }}><TrashIcon className="w-4 h-4" />Delete</button></div>)}
        </>
      )}

      <EntryFormDialog isOpen={isAddOpen} onClose={() => { setIsAddOpen(false); setEditing(null); setGenPassword(null); setGenCreate(false); }} editing={editing} spaceId={spaceId} allCategories={allCategories} createEntry={(p) => createMut.mutateAsync(p).then(() => undefined)} updateEntry={(p) => updateMut.mutateAsync(p as never).then(() => undefined)} genPassword={genPassword} genCreate={genCreate} onGenConsumed={() => { setGenPassword(null); setGenCreate(false); }} isPending={createMut.isPending || updateMut.isPending} />
      <TransferDialog isOpen={!!transferOpen} onClose={() => setTransferOpen(null)} onTransfer={handleTransfer} spaces={allSpaces} currentSpaceId={spaceId} target={transferTarget} onTargetChange={setTransferTarget} isTransferring={transferMut.isPending || bulkTransferMut.isPending} count={transferOpen?.ids.length ?? 0} />
      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => !deleteMut.isPending && setDeleteTarget(null)} onConfirm={confirmSingleDelete} title="Delete account?" description={`This will permanently delete ${deleteTarget?.title ?? deleteTarget?.email}. This action cannot be undone.`} confirmText={deleteMut.isPending ? "Deleting…" : "Delete"} isLoading={deleteMut.isPending} variant="danger" />
      <ConfirmDialog isOpen={bulkDeleteOpen} onClose={() => !bulkDeleteMut.isPending && setBulkDeleteOpen(false)} onConfirm={confirmBulkDelete} title={`Delete ${selected.size} account(s)?`} description="This will permanently delete the selected accounts. This action cannot be undone." confirmText={bulkDeleteMut.isPending ? "Deleting…" : `Delete (${selected.size})`} isLoading={bulkDeleteMut.isPending} variant="danger" />
      <ImportDialog isOpen={importOpen} onClose={() => setImportOpen(false)} rows={importRows} onRowsChange={setImportRows} fileName={importFileName} onFile={handleFile} error={importError || (bulkCreateMut.error instanceof Error ? bulkCreateMut.error.message : "")} onConfirm={confirmImport} />
    </div>
  );
}
