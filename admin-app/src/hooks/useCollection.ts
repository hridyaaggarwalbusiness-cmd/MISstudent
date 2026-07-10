import { useEffect, useState } from 'react';
import type { Unsubscribe } from 'firebase/firestore';

export function useCollection<T>(
  subscribe: (cb: (items: T[]) => void) => Unsubscribe,
  deps: unknown[] = [],
): { data: T[]; loading: boolean } {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribe((items) => {
      setData(items);
      setLoading(false);
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading };
}
