"use client";

import { useCallback, useEffect, useEffectEvent, useState } from "react";
import type { UseCases } from "@/application/use-cases";
import { errorMessage } from "@/lib/error-message";
import { getServices } from "./services";
import { useSession } from "./session-provider";

interface AsyncState<T> {
  /** Request key the result belongs to. */
  key: string | null;
  data: T | null;
  error: string | null;
  loading: boolean;
}

/**
 * Loads data from the use cases on the client, once the session is known to
 * be authenticated. `key` identifies the request: when it changes, the hook
 * reports `loading` again until the new result arrives.
 */
export function useAsyncData<T>(
  key: string,
  load: (services: UseCases) => Promise<T>,
) {
  const [state, setState] = useState<AsyncState<T>>({
    key: null,
    data: null,
    error: null,
    loading: true,
  });
  const [version, setVersion] = useState(0);
  const { state: session, dataVersion } = useSession();
  const enabled = session.status === "authenticated";
  const run = useEffectEvent(() => load(getServices()));

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    run().then(
      (data) => {
        if (active) setState({ key, data, error: null, loading: false });
      },
      (error: unknown) => {
        if (active) {
          setState({ key, data: null, error: errorMessage(error), loading: false });
        }
      },
    );
    return () => {
      active = false;
    };
  }, [enabled, key, version, dataVersion]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const setData = useCallback(
    (data: T) => setState({ key, data, error: null, loading: false }),
    [key],
  );

  const stale = state.key !== key;
  return {
    data: stale ? null : state.data,
    error: stale ? null : state.error,
    loading: stale || state.loading,
    reload,
    setData,
  };
}
