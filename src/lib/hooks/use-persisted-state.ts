import { useCallback, useEffect, useState } from "react";

function readStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return defaultValue;
    if (typeof defaultValue === "string") return raw as unknown as T;
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

export function usePersistedState<T>(key: string, defaultValue: T) {
  const [state, setStateInternal] = useState<T>(() => readStorage(key, defaultValue));

  useEffect(() => {
    const next = readStorage(key, defaultValue);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStateInternal(next);
  }, [key, defaultValue]);

  const setState = useCallback(
    (next: T | ((prev: T) => T)) => {
      setStateInternal((prev) => {
        const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        try {
          if (typeof resolved === "string") localStorage.setItem(key, resolved as string);
          else localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          // ignore quota errors
        }
        return resolved;
      });
    },
    [key],
  );

  return [state, setState] as const;
}
