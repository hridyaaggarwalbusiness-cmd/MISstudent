import { useEffect, useRef, useState } from 'react';
import type { Unsubscribe } from 'firebase/firestore';

interface LiveResourceState<T> {
  data: T | null;
  loading: boolean;
  refreshing: boolean;
  error: Error | null;
}

// Same {data, loading, refreshing, error, refresh} shape as useAsyncResource,
// but backed by a live Firestore listener instead of a one-shot fetch - once
// subscribed, any write from another app (teacher publishing homework, admin
// editing the timetable, ...) pushes straight into state on its own, with no
// manual refresh or app reopen needed. Pull-to-refresh is kept only as a
// brief spinner for feel, since the listener already has the latest data.
export function useLiveResource<T>(
  subscribe: (cb: (value: T) => void) => Unsubscribe,
  deps: React.DependencyList = [],
) {
  const [state, setState] = useState<LiveResourceState<T>>({
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

  useEffect(() => {
    setState((s) => ({ ...s, loading: s.data === null, error: null }));
    const unsub = subscribe((value) => {
      if (mounted.current) setState({ data: value, loading: false, refreshing: false, error: null });
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const refresh = () => {
    setState((s) => ({ ...s, refreshing: true }));
    setTimeout(() => {
      if (mounted.current) setState((s) => ({ ...s, refreshing: false }));
    }, 300);
  };

  return { ...state, refresh };
}
