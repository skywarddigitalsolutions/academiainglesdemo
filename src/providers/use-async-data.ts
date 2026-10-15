"use client";

import { useCallback, useEffect, useEffectEvent, useState } from "react";
import type { UseCases } from "@/application/use-cases";
import { errorMessage } from "@/lib/error-message";
import { getServices } from "./services";
import { useSession } from "./session-provider";

interface AsyncState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

/**
 * Loads data from the use cases on the client.
 * `key` identifies the request: when it changes, data is loaded again.
 */
export function useAsyncData<T>(
  key: string,
  load: (services: UseCases) => Promise<T>,
) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    error: null,
    loading: true,
  });
  const [version, setVersion] = useState(0);
  const { dataVersion } = useSession();
  const run = useEffectEvent(() => load(getServices()));

  useEffect(() => {
    let active = true;
    run().then(
      (data) => {
        if (active) setState({ data, error: null, loading: false });
      },
      (error: unknown) => {
        if (active) {
          setState({ data: null, error: errorMessage(error), loading: false });
        }
      },
    );
    return () => {
      active = false;
    };
  }, [key, version, dataVersion]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const setData = useCallback(
    (data: T) => setState({ data, error: null, loading: false }),
    [],
  );

  return { ...state, reload, setData };
}
