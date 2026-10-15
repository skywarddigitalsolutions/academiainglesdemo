import { describe, expect, it } from "vitest";
import { LocalStorageCollection } from "./local-storage-collection";
import { MemoryStorage } from "./memory-storage";
import type { StorageLike } from "./storage";

interface Item {
  id: string;
  name: string;
}

const seed = (): Item[] => [
  { id: "1", name: "uno" },
  { id: "2", name: "dos" },
];

class ThrowingStorage implements StorageLike {
  getItem(): string | null {
    throw new Error("blocked");
  }
  setItem(): void {
    throw new Error("quota");
  }
  removeItem(): void {
    throw new Error("blocked");
  }
}

describe("LocalStorageCollection", () => {
  it("returns and persists the seed when storage is empty", () => {
    const storage = new MemoryStorage();
    const collection = new LocalStorageCollection(storage, "items", seed);
    expect(collection.all()).toEqual(seed());
    expect(JSON.parse(storage.getItem("items")!)).toEqual(seed());
  });

  it("reads previously stored data", () => {
    const storage = new MemoryStorage();
    storage.setItem("items", JSON.stringify([{ id: "9", name: "nueve" }]));
    const collection = new LocalStorageCollection(storage, "items", seed);
    expect(collection.all()).toEqual([{ id: "9", name: "nueve" }]);
  });

  it("upserts and removes items", () => {
    const collection = new LocalStorageCollection(
      new MemoryStorage(),
      "items",
      seed,
    );
    collection.upsert({ id: "2", name: "DOS" });
    collection.upsert({ id: "3", name: "tres" });
    collection.remove("1");
    expect(collection.all()).toEqual([
      { id: "2", name: "DOS" },
      { id: "3", name: "tres" },
    ]);
  });

  it("falls back to the seed when stored JSON is corrupt", () => {
    const storage = new MemoryStorage();
    storage.setItem("items", "{not json");
    const collection = new LocalStorageCollection(storage, "items", seed);
    expect(collection.all()).toEqual(seed());
  });

  it("falls back to the seed when stored data is not an array", () => {
    const storage = new MemoryStorage();
    storage.setItem("items", JSON.stringify({ id: "x" }));
    const collection = new LocalStorageCollection(storage, "items", seed);
    expect(collection.all()).toEqual(seed());
  });

  it("keeps working in memory when storage throws", () => {
    const collection = new LocalStorageCollection(
      new ThrowingStorage(),
      "items",
      seed,
    );
    expect(collection.all()).toEqual(seed());
    collection.upsert({ id: "3", name: "tres" });
    expect(collection.all()).toHaveLength(3);
  });

  it("keeps working in memory when storage is unavailable", () => {
    const collection = new LocalStorageCollection(null, "items", seed);
    collection.remove("1");
    expect(collection.all()).toEqual([{ id: "2", name: "dos" }]);
  });

  it("returns copies so callers cannot mutate stored state", () => {
    const collection = new LocalStorageCollection(
      new MemoryStorage(),
      "items",
      seed,
    );
    collection.all()[0].name = "mutated";
    expect(collection.all()[0].name).toBe("uno");
  });

  it("resets to the seed", () => {
    const collection = new LocalStorageCollection(
      new MemoryStorage(),
      "items",
      seed,
    );
    collection.remove("1");
    collection.reset();
    expect(collection.all()).toEqual(seed());
  });
});
