import { createAdminUseCases } from "./admin-use-cases";
import { createAuthUseCases } from "./auth-use-cases";
import { createParentUseCases } from "./parent-use-cases";
import type { UseCaseDeps } from "./shared";
import { createTeacherUseCases } from "./teacher-use-cases";

export type { UseCaseDeps } from "./shared";

/** Entry point of the application layer, consumed by the UI. */
export function createUseCases(deps: UseCaseDeps) {
  const auth = createAuthUseCases(deps);
  return {
    auth,
    teacher: createTeacherUseCases(deps),
    admin: createAdminUseCases(deps),
    parent: createParentUseCases(deps),
    demo: {
      /** Restores seed data; keeps the session only if its user still exists. */
      async reset(): Promise<void> {
        await deps.repositories.demoData.reset();
        await auth.getSession();
      },
    },
  };
}

export type UseCases = ReturnType<typeof createUseCases>;
