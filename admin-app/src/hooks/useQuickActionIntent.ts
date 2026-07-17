import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// The Dashboard's Quick Action modal navigates to a page with
// `state: { openCreate: true }` so the admin lands with the create form
// already open instead of one more click. Consuming pages call this once
// their prerequisite data (if any) is ready; it clears the state after
// firing so back/forward navigation or a refresh doesn't reopen it.
export function useQuickActionIntent(ready: boolean, onOpen: () => void) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!ready) return;
    const state = location.state as { openCreate?: boolean } | null;
    if (state?.openCreate) {
      onOpen();
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, location.state]);
}
