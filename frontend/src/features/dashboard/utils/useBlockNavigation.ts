import { useContext, useEffect } from "react";
import { UNSAFE_NavigationContext } from "react-router-dom";

export function useBlockNavigation(when: boolean, onBlock: () => void) {
  const { navigator } = useContext(UNSAFE_NavigationContext);

  useEffect(() => {
    if (!when) return;

    const unblock = navigator.block((tx: any) => {
      onBlock();
      return false; // ⛔ BLOCK navigation
    });

    return unblock;
  }, [when, navigator, onBlock]);
}
