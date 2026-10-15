import { DomainError } from "@/domain/errors";
import { displayName, type Session } from "@/domain/user";
import type { UseCaseDeps } from "./shared";

export function createAuthUseCases(deps: UseCaseDeps) {
  const { users, session } = deps.repositories;

  return {
    async login(username: string, password: string): Promise<Session> {
      const user = await users.findByUsername(username);
      if (!user || user.password !== password) {
        throw new DomainError(
          "invalid-credentials",
          "Usuario o contraseña incorrectos.",
        );
      }
      const created: Session = {
        userId: user.id,
        role: user.role,
        displayName: displayName(user),
        startedAt: deps.clock.now().toISOString(),
      };
      await session.set(created);
      return created;
    },

    async logout(): Promise<void> {
      await session.clear();
    },

    /** Returns the current session, discarding it if the user no longer exists. */
    async getSession(): Promise<Session | null> {
      const current = await session.get();
      if (!current) return null;
      const user = await users.getById(current.userId);
      if (!user || user.role !== current.role) {
        await session.clear();
        return null;
      }
      return current;
    },
  };
}

export type AuthUseCases = ReturnType<typeof createAuthUseCases>;
