import React, {
    createContext,
    useCallback,
    useContext,
    useRef,
    useState,
} from 'react';
import { PageLoader } from '../components/ui/PageLoader';

// ─── Context ──────────────────────────────────────────────────────────────────

interface NavigationLoadingContextValue {
  /** Call before navigating. Automatically hides after `durationMs`. */
  showLoader: (message?: string, durationMs?: number) => void;
  hideLoader: () => void;
}

const NavigationLoadingContext = createContext<NavigationLoadingContextValue>({
  showLoader: () => {},
  hideLoader: () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function NavigationLoadingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('Loading...');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showLoader = useCallback(
    (msg = 'Loading...', durationMs = 600) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setMessage(msg);
      setVisible(true);
      timerRef.current = setTimeout(() => setVisible(false), durationMs);
    },
    [],
  );

  const hideLoader = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  }, []);

  return (
    <NavigationLoadingContext.Provider value={{ showLoader, hideLoader }}>
      {children}
      {/* Rendered on top of everything */}
      {visible && <PageLoader message={message} visible={visible} />}
    </NavigationLoadingContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useNavigationLoading() {
  return useContext(NavigationLoadingContext);
}
