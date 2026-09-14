"use client";
import { Squares2X2Icon, ListBulletIcon } from "@heroicons/react/24/outline";
import type { ViewMode } from "../types";

type ViewToggleProps = {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
};

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div className="flex items-center rounded-xl border border-border bg-card p-1 shrink-0">
      <button
        aria-label="Comfortable view"
        aria-pressed={value === "comfortable"}
        onClick={() => onChange("comfortable")}
        className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${value === "comfortable" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
        title="Comfortable"
      >
        <Squares2X2Icon className="w-4 h-4" />
      </button>
      <button
        aria-label="Compact view"
        aria-pressed={value === "compact"}
        onClick={() => onChange("compact")}
        className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${value === "compact" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
        title="Compact"
      >
        <ListBulletIcon className="w-4 h-4" />
      </button>
    </div>
  );
}
