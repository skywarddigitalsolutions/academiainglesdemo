"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@/domain/user";
import { getServices } from "./services";

type SessionState =
  | { status: "loading"; session: null }
  | { status: "anonymous"; session: null }
  | { status: "authenticated"; session: Session };

interface SessionContextValue {
  state: SessionState;
  login(username: string, password: string): Promise<Session>;
  logout(): Promise<void>;
  refresh(): Promise<void>;
  /** Increments whenever demo data is reset, so views reload. */
  dataVersion: number;
  resetDemo(): Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

function toState(session: Session | null): SessionState {
  return session
    ? { status: "authenticated", session }
    : { status: "anonymous", session: null };
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({
    status: "loading",
    session: null,
  });

  const [dataVersion, setDataVersion] = useState(0);

  const refresh = useCallback(async () => {
    const session = await getServices().auth.getSession();
    setState(toState(session));
  }, []);

  useEffect(() => {
    let active = true;
    getServices()
      .auth.getSession()
      .then((session) => {
        if (active) setState(toState(session));
      });
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      state,
      refresh,
      dataVersion,
      async resetDemo() {
        await getServices().demo.reset();
        setState(toState(await getServices().auth.getSession()));
        setDataVersion((v) => v + 1);
      },
      async login(username, password) {
        const session = await getServices().auth.login(username, password);
        setState(toState(session));
        return session;
      },
      async logout() {
        await getServices().auth.logout();
        setState(toState(null));
      },
    }),
    [state, refresh, dataVersion],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside SessionProvider");
  return value;
}
