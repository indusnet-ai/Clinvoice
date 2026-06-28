import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export const useRecordingNavigationGuard = ({
  when,
  onConfirmStop,
}: {
  when: boolean;
  onConfirmStop: (nextPath: string) => void;
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const pendingPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!when) return;

    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      pendingPathRef.current = window.location.pathname + window.location.search;
      window.history.pushState(null, "", location.pathname);
      onConfirmStop(pendingPathRef.current);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [when, location.pathname]);

  return {
    confirmAndNavigate: (path: string) => {
      if (!when) {
        navigate(path);
        return;
      }
      pendingPathRef.current = path;
      onConfirmStop(path);
    },
  };
};
