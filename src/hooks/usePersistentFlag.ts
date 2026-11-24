import { useCallback, useState } from "react";

function read(key: string, fallback: boolean): boolean {
  try {
    const stored = localStorage.getItem(key);
    return stored === null ? fallback : stored === "true";
  } catch {
    return fallback;
  }
}

/**
 * A boolean UI preference remembered in this browser (e.g. a collapsed panel). Storage may be
 * blocked (private mode, disabled site data): then it simply is not remembered.
 */
export function usePersistentFlag(key: string, fallback: boolean): [boolean, (value: boolean) => void] {
  const [value, setValue] = useState(() => read(key, fallback));
  const update = useCallback(
    (next: boolean) => {
      setValue(next);
      try {
        localStorage.setItem(key, String(next));
      } catch {
        // Not remembered; the panel still works.
      }
    },
    [key],
  );
  return [value, update];
}
