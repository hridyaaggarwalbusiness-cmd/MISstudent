import { useCallback, useEffect, useRef, useState } from 'react';

interface AsyncResourceState<T> {
  data: T | null;
  loading: boolean;
  refreshing: boolean;
  error: Error | null;
}

export function useAsyncResource<T>(
  fetcher: () => Promise<T>,
  deps: React.DependencyList = [],
) {
  const [state, setState] = useState<AsyncResourceState<T>>({
    data: null,
    loading: true,
    refreshing: false,
    error: null,
  });
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const load = useCallback(
    async (isRefresh = false) => {
      setState((s) => ({
        ...s,
        loading: !isRefresh && s.data === null,
        refreshing: isRefresh,
        error: null,
      }));
      try {
        const result = await fetcher();
        if (mounted.current) {
          setState({ data: result, loading: false, refreshing: false, error: null });
        }
      } catch (e) {
        if (mounted.current) {
          setState((s) => ({
            ...s,
            loading: false,
            refreshing: false,
            error: e instanceof Error ? e : new Error('Something went wrong'),
          }));
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps,
  );

  useEffect(() => {
    load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const refresh = useCallback(() => load(true), [load]);
  const reload = useCallback(() => load(false), [load]);

  return { ...state, refresh, reload };
}
