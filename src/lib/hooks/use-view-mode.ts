import { useCallback, useEffect, useState } from "react";
import type { ViewMode } from "@/lib/types";

function readViewMode(storageKey: string, defaultMode: ViewMode): ViewMode {
  if (typeof window === "undefined") return defaultMode;
  try {
    const stored = localStorage.getItem(storageKey) as ViewMode | null;
    if (stored === "compact" || stored === "comfortable") return stored;
  } catch {
    // ignore
  }
  return defaultMode;
}

export function useViewMode(storageKey: string, defaultMode: ViewMode = "comfortable") {
  const [viewMode, setViewModeState] = useState<ViewMode>(() => readViewMode(storageKey, defaultMode));

  // re-read when storageKey changes (e.g. spaceId)
  useEffect(() => {
    const stored = readViewMode(storageKey, defaultMode);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setViewModeState(stored);
  }, [storageKey, defaultMode]);

  const setViewMode = useCallback(
    (next: ViewMode | ((prev: ViewMode) => ViewMode)) => {
      setViewModeState((prev) => {
        const resolved = typeof next === "function" ? (next as (p: ViewMode) => ViewMode)(prev) : next;
        try {
          localStorage.setItem(storageKey, resolved);
        } catch {
          // ignore
        }
        return resolved;
      });
    },
    [storageKey],
  );

  return [viewMode, setViewMode] as const;
}
