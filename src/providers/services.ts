import { createUseCases, type UseCases } from "@/application/use-cases";
import { createLocalStorageRepositories } from "@/infrastructure/local-storage/repositories";
import { getBrowserStorage } from "@/infrastructure/local-storage/storage";

let instance: UseCases | null = null;

/**
 * Composition root for the browser.
 *
 * To move to a real database, replace `createLocalStorageRepositories`
 * with an adapter factory implementing the same ports (e.g. HTTP client
 * to an API backed by Postgres). The UI only talks to `UseCases`.
 *
 * Call it from effects or event handlers only (never during render), so
 * prerendering never touches the clock or the browser storage.
 */
export function getServices(): UseCases {
  if (instance) return instance;
  const year = new Date().getFullYear();
  instance = createUseCases({
    repositories: createLocalStorageRepositories(getBrowserStorage(), year),
    clock: { now: () => new Date() },
    ids: {
      next: (prefix) =>
        `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    },
    year,
  });
  return instance;
}
