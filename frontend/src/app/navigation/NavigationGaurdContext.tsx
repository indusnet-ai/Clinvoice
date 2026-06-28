import React, { createContext, useContext, useEffect, useRef, useState } from "react";

type NavigationRequest = () => void;

export type NavigationReason = "navigation" | "manual" | "dental-form" | "manual-form";

export interface NavigationDialogConfig {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  reason: NavigationReason;
}

interface NavigationGuardContextType {
  isBlocked: boolean;
  block: (config?: Partial<NavigationDialogConfig>) => void;
  unblock: () => void;
  requestNavigation: (navigateFn: () => void) => void;
  confirmNavigation: () => void;
  cancelNavigation: () => void;
  isDialogOpen: boolean;
  dialogConfig: NavigationDialogConfig;
}
const DEFAULT_DIALOG: NavigationDialogConfig = {
  title: "Leave this page?",
  message: "You have unsaved changes.",
  confirmText: "Leave",
  cancelText: "Stay",
  reason: "navigation",
};

const NavigationGuardContext = createContext<NavigationGuardContextType | null>(null);

export const NavigationGuardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isBlocked, setIsBlocked] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<NavigationDialogConfig>(DEFAULT_DIALOG);

  const pendingNavigationRef = useRef<NavigationRequest | null>(null);
  const popStateTriggeredRef = useRef(false);

  const pushGuardState = () => {
    const fullUrl = window.location.pathname + window.location.search + window.location.hash;
    window.history.pushState({ guard: true }, "", fullUrl);
  };

  // ---- Browser back / reload ----
  useEffect(() => {
    if (!isBlocked) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    const handlePopState = () => {
      popStateTriggeredRef.current = true;
      setIsDialogOpen(true);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isBlocked]);

  // ---- API ----
  const block = (config?: Partial<NavigationDialogConfig>) => {
    if (!isBlocked) {
      pushGuardState();
    }

    setDialogConfig({
      ...DEFAULT_DIALOG,
      ...config,
    });

    setIsBlocked(true);
  };

  const unblock = () => {
    setIsBlocked(false);
    setDialogConfig(DEFAULT_DIALOG);
  };

  const requestNavigation = (fn: NavigationRequest) => {
    if (!isBlocked) {
      fn();
      return;
    }
    pendingNavigationRef.current = fn;
    setIsDialogOpen(true);
  };

  const confirmNavigation = () => {
    setIsDialogOpen(false);
    setIsBlocked(false);

    if (pendingNavigationRef.current) {
      pendingNavigationRef.current();
      pendingNavigationRef.current = null;
      return;
    }

    if (popStateTriggeredRef.current) {
      popStateTriggeredRef.current = false;
      window.history.back();
    }
  };

  const cancelNavigation = () => {
    setIsDialogOpen(false);
    pendingNavigationRef.current = null;
    if (popStateTriggeredRef.current && isBlocked) {
      popStateTriggeredRef.current = false;
      pushGuardState();
    }
  };

  return (
    <NavigationGuardContext.Provider
      value={{
        block,
        unblock,
        requestNavigation,
        confirmNavigation,
        cancelNavigation,
        isDialogOpen,
        dialogConfig,
        isBlocked,
      }}
    >
      {children}
    </NavigationGuardContext.Provider>
  );
};

export const useNavigationGuard = () => {
  const ctx = useContext(NavigationGuardContext);
  if (!ctx) throw new Error("useNavigationGuard must be used inside provider");
  return ctx;
};
