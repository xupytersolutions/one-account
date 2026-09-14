"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button } from "@heroui/react";
import { PlusIcon } from "@heroicons/react/24/solid";
import { PencilSquareIcon, TrashIcon, ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { AutoSkeleton } from "auto-skeleton-react";
import { StickyHeader } from "@/components/ui/sticky-header";
import { SpacesToolbar } from "@/components/spaces/spaces-toolbar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SpaceCard } from "@/components/spaces/space-card";
import { SpaceFormDialog } from "@/components/spaces/space-form-dialog";
import { ErrorState, EmptyState, FilterEmptyState } from "@/components/ui/state";
import { useSpaces, useCreateSpace, useDeleteSpace, useUpdateSpace } from "@/lib/query/use-spaces";
import { useViewMode } from "@/lib/hooks/use-view-mode";
import { usePersistedState } from "@/lib/hooks/use-persisted-state";
import { useSpaceFilters } from "@/lib/hooks/use-space-filters";
import { useOutsideClick } from "@/lib/hooks/use-outside-click";
import type { Space } from "@/lib/types";
import { ApiError } from "@/lib/api/client";

export function DashboardClient() {
  const router = useRouter();
  const { data: spaces, isLoading, isError, error, refetch, isFetching } = useSpaces();
  const createMut = useCreateSpace();
  const updateMut = useUpdateSpace();
  const deleteMut = useDeleteSpace();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Space | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [typeFilter, setTypeFilter] = usePersistedState("one-account:spacesFilters:type", "all");
  const [sortBy, setSortBy] = usePersistedState("one-account:spacesFilters:sort", "updated");
  const [search, setSearch] = usePersistedState("one-account:spacesFilters:search", "");
  const [viewMode, setViewMode] = useViewMode("one-account:spacesView");
  const [ctx, setCtx] = useState<{ id: string; x: number; y: number } | null>(null);
  const [formError, setFormError] = useState("");

  const list = spaces ?? [];
  const { filteredSpaces, activeFilterCount } = useSpaceFilters(list, search, typeFilter, sortBy);

  useOutsideClick(filterOpen, () => setFilterOpen(false), "[data-filter-pane],[data-filter-trigger]");
  useOutsideClick(!!ctx, () => setCtx(null), "[data-ctx-menu]");

  const handleCreate = async (payload: { name: string; type: string; description?: string | null; color?: string | null; icon?: string | null }) => {
    setFormError("");
    try { await createMut.mutateAsync(payload); } catch (e) { const msg = e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Failed to create"; setFormError(msg); throw e; }
  };
  const handleUpdate = async (payload: { name: string; type: string; description?: string | null; color?: string | null; icon?: string | null }) => {
    if (!editingSpace) return;
    setFormError("");
    try { await updateMut.mutateAsync({ id: editingSpace.id, ...payload }); } catch (e) { const msg = e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Failed to update"; setFormError(msg); throw e; }
  };

  if (isError) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
        <StickyHeader title="Spaces" description="Organize your credentials by personal, company or clients." />
        <ErrorState message={error instanceof Error ? error.message : "Failed to load spaces"} onRetry={() => refetch()} />
      </div>
    );
  }

  const showSkeleton = isLoading;
  // we render real layout wrapped in AutoSkeleton so it measures correctly
  const gridContent = (
    <div className={`grid mb-8 ${viewMode === "compact" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"}`}>
      {(showSkeleton ? Array.from({ length: 6 }).map((_, i) => ({ id: `skeleton-${i}`, name: "Loading space", type: "personal", description: "Loading description for skeleton placeholder", color: "#e5e7eb", icon: null, updatedAt: new Date().toISOString(), _count: { entries: 0 } } as unknown as Space)) : filteredSpaces).map((s) => (
        <SpaceCard key={s.id} space={s} viewMode={viewMode} onOpen={() => !showSkeleton && router.push(`/spaces/${s.id}`)} onEdit={() => !showSkeleton && setEditingSpace(s)} onDelete={() => !showSkeleton && setDeleteTarget(s)} onContextMenu={(x, y) => !showSkeleton && setCtx({ id: s.id, x, y })} />
      ))}
      {!showSkeleton && (
        <Card className={`border-2 border-dashed border-border bg-muted/20 hover:border-border-strong hover:bg-muted/30 transition-colors cursor-pointer shadow-none rounded-2xl flex flex-col justify-center h-full ${viewMode === "compact" ? "min-h-[48px]" : "min-h-[158px]"}`} onClick={() => setIsCreateOpen(true)}>
          <Card.Content className={`flex flex-col items-center justify-center text-center ${viewMode === "compact" ? "px-2.5 py-1.5" : "p-6 py-8"}`}>
            <div className={`${viewMode === "compact" ? "w-6 h-6 mb-1" : "w-12 h-12 mb-3"} rounded-xl bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center`}><PlusIcon className={`${viewMode === "compact" ? "w-3.5 h-3.5" : "w-6 h-6"} text-neutral-500`} /></div>
            <p className={`${viewMode === "compact" ? "text-xs" : "text-sm"} font-semibold text-neutral-900 dark:text-primary-foreground ${viewMode === "compact" ? "" : "mb-1"}`}>Create a new space</p>
            {viewMode !== "compact" && <p className="text-sm text-neutral-500 dark:text-neutral-400">Keep your credentials organized and secure.</p>}
          </Card.Content>
        </Card>
      )}
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
      <StickyHeader
        title="Spaces"
        description="Organize your credentials by personal, company or clients."
        action={
          <Button onPress={() => setIsCreateOpen(true)} isDisabled={showSkeleton} className="text-primary-foreground font-medium bg-primary hover:bg-primary-hover flex items-center gap-2">
            {isFetching && !showSkeleton ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <PlusIcon className="w-4 h-4" />}<span>Space</span>
          </Button>
        }
        toolbar={
          <SpacesToolbar
            search={search}
            onSearchChange={setSearch}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            filterOpen={filterOpen}
            onFilterOpenChange={setFilterOpen}
            activeFilterCount={activeFilterCount}
            onClearFilters={() => { setTypeFilter("all"); setSortBy("updated"); setSearch(""); }}
          />
        }
      />

      <AutoSkeleton loading={showSkeleton}>
        {list.length === 0 && !showSkeleton ? (
          <EmptyState title="No spaces yet" description="Create your first space to get started" action={<Button onPress={() => setIsCreateOpen(true)} className="text-primary-foreground font-medium bg-primary hover:bg-primary-hover flex items-center gap-2"><PlusIcon className="w-4 h-4" /><span>Space</span></Button>} />
        ) : filteredSpaces.length === 0 && !showSkeleton ? (
          <FilterEmptyState onClear={() => { setSearch(""); setTypeFilter("all"); setSortBy("updated"); }} />
        ) : (
          <>
            {gridContent}
            {ctx && !showSkeleton && (
              <div data-ctx-menu className="fixed z-40 min-w-[160px] bg-popover border border-border shadow-sm rounded-xl p-1 flex flex-col" style={{ left: Math.min(ctx.x, typeof window !== "undefined" ? window.innerWidth - 170 : ctx.x), top: ctx.y }} onClick={(e) => e.stopPropagation()}>
                <button className="text-left px-3 py-2 text-sm rounded-lg hover:bg-muted text-foreground flex items-center gap-2" onClick={() => { setCtx(null); router.push(`/spaces/${ctx.id}`); }}><ArrowTopRightOnSquareIcon className="w-4 h-4" />Open</button>
                <button className="text-left px-3 py-2 text-sm rounded-lg hover:bg-muted text-foreground flex items-center gap-2" onClick={() => { const sp = list.find((s) => s.id === ctx.id); if (sp) setEditingSpace(sp); setCtx(null); }}><PencilSquareIcon className="w-4 h-4" />Edit</button>
                <button className="text-left px-3 py-2 text-sm rounded-lg hover:bg-destructive/10 text-destructive flex items-center gap-2" onClick={() => { const sp = list.find((s) => s.id === ctx.id); if (sp) setDeleteTarget(sp); setCtx(null); }}><TrashIcon className="w-4 h-4" />Delete</button>
              </div>
            )}
          </>
        )}
      </AutoSkeleton>

      {formError && <p className="text-sm text-destructive mt-2">{formError}</p>}

      <SpaceFormDialog isOpen={isCreateOpen} onClose={() => { setIsCreateOpen(false); setFormError(""); }} onSubmit={handleCreate} title="Create space" submitLabel="Create space" isPending={createMut.isPending} />
      <SpaceFormDialog isOpen={!!editingSpace} onClose={() => { setEditingSpace(null); setFormError(""); }} onSubmit={handleUpdate} initialData={editingSpace} title="Edit space" submitLabel="Save changes" isPending={updateMut.isPending} />
      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => !deleteMut.isPending && setDeleteTarget(null)} onConfirm={async () => { if (!deleteTarget) return; await deleteMut.mutateAsync(deleteTarget.id); setDeleteTarget(null); }} title="Delete space?" description={`This will permanently delete ${deleteTarget?.name ?? ""} and all its accounts. This action cannot be undone.`} confirmText={deleteMut.isPending ? "Deleting…" : "Delete"} isLoading={deleteMut.isPending} variant="danger" />
    </div>
  );
}
