/** Minimal subset of the Web Storage API used by the adapters. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** Namespace for every key written by this app. */
export const STORAGE_PREFIX = "iic-boletin:";

/**
 * Returns window.localStorage when available, or null (SSR, privacy mode,
 * blocked storage). Callers must handle null by falling back to memory.
 */
export function getBrowserStorage(): StorageLike | null {
  try {
    if (typeof window === "undefined") return null;
    const storage = window.localStorage;
    const probe = `${STORAGE_PREFIX}probe`;
    storage.setItem(probe, "1");
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}
