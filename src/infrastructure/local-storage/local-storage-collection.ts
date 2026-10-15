import type { StorageLike } from "./storage";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/**
 * A JSON array of entities stored under one localStorage key.
 *
 * Every storage access is wrapped in try/catch: when storage is missing,
 * blocked, full or corrupt, the collection falls back to an in-memory copy
 * initialised from the seed, so the app keeps working.
 */
export class LocalStorageCollection<T extends { id: string }> {
  private memory: T[] | null = null;

  constructor(
    private readonly storage: StorageLike | null,
    private readonly key: string,
    private readonly seed: () => T[],
  ) {}

  all(): T[] {
    return clone(this.read());
  }

  find(predicate: (item: T) => boolean): T | null {
    const item = this.read().find(predicate);
    return item ? clone(item) : null;
  }

  filter(predicate: (item: T) => boolean): T[] {
    return clone(this.read().filter(predicate));
  }

  upsert(item: T): void {
    const items = this.read();
    const index = items.findIndex((existing) => existing.id === item.id);
    const next =
      index === -1
        ? [...items, clone(item)]
        : items.map((existing, i) => (i === index ? clone(item) : existing));
    this.write(next);
  }

  remove(id: string): void {
    this.write(this.read().filter((item) => item.id !== id));
  }

  removeWhere(predicate: (item: T) => boolean): void {
    this.write(this.read().filter((item) => !predicate(item)));
  }

  reset(): void {
    this.memory = null;
    try {
      this.storage?.removeItem(this.key);
    } catch {
      // Storage unavailable: memory reset is enough.
    }
    this.write(this.seed());
  }

  private read(): T[] {
    try {
      const raw = this.storage?.getItem(this.key) ?? null;
      if (raw === null) {
        const initial = this.memory ?? this.seed();
        this.write(initial);
        return initial;
      }
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new Error("Invalid collection data");
      this.memory = parsed as T[];
      return this.memory;
    } catch {
      if (this.memory === null) this.memory = this.seed();
      return this.memory;
    }
  }

  private write(items: T[]): void {
    this.memory = items;
    try {
      this.storage?.setItem(this.key, JSON.stringify(items));
    } catch {
      // Storage full or blocked: keep the in-memory copy.
    }
  }
}
