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
import {
  fetchIdentity,
  identityOrigin,
  isAbortError,
  logoutIdentity,
  type IdentitySnapshot,
  type IdentityUiStatus,
} from "./identityClient";

export interface IdentityContextValue {
  snapshot: IdentitySnapshot;
  status: IdentityUiStatus;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  origin?: string;
}

const IdentityContext = createContext<IdentityContextValue | null>(null);

/**
 * Single identity source for the whole app: the identity bar and the progress
 * layer read the same snapshot, so an owner change is observable centrally.
 */
export function IdentityProvider({
  children,
  originOverride,
  initialSnapshot,
}: {
  children: ReactNode;
  originOverride?: string;
  initialSnapshot?: IdentitySnapshot;
}) {
  const origin = originOverride ?? identityOrigin();
  const [liveSnapshot, setSnapshot] = useState<IdentitySnapshot>({
    authenticated: false,
  });
  const [liveStatus, setStatus] = useState<IdentityUiStatus>(
    origin && !initialSnapshot ? "loading" : "ready",
  );
  const snapshot = initialSnapshot ?? liveSnapshot;
  const status: IdentityUiStatus = initialSnapshot ? "ready" : liveStatus;

  const refresh = useCallback(async () => {
    if (!origin) {
      setSnapshot({ authenticated: false });
      setStatus("ready");
      return;
    }
    try {
      setSnapshot(await fetchIdentity(origin));
    } catch (error) {
      if (isAbortError(error)) {
        return;
      }
      setSnapshot({ authenticated: false });
    }
    setStatus("ready");
  }, [origin]);

  const logout = useCallback(async () => {
    try {
      await logoutIdentity(origin);
    } finally {
      setSnapshot({ authenticated: false });
      setStatus("ready");
    }
  }, [origin]);

  useEffect(() => {
    if (initialSnapshot || !origin) {
      return;
    }
    const controller = new AbortController();
    void fetchIdentity(origin, controller.signal)
      .then((next) => {
        if (controller.signal.aborted) {
          return;
        }
        setSnapshot(next);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || isAbortError(error)) {
          return;
        }
        setSnapshot({ authenticated: false });
        setStatus("ready");
      });
    const onFocus = () => {
      void refresh();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      controller.abort();
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [origin, refresh, initialSnapshot]);

  const value = useMemo(
    () => ({ snapshot, status, refresh, logout, origin }),
    [snapshot, status, refresh, logout, origin],
  );

  return <IdentityContext.Provider value={value}>{children}</IdentityContext.Provider>;
}

export function useIdentity(): IdentityContextValue {
  const value = useContext(IdentityContext);
  if (!value) {
    return {
      snapshot: { authenticated: false },
      status: "ready",
      refresh: async () => undefined,
      logout: async () => undefined,
    };
  }
  return value;
}
