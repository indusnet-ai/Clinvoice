import { useEffect, useRef, useState } from "react";

export function useAutoCollapse(open: boolean, deps: any[] = []) {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (open && ref.current) {
      setHeight(ref.current.scrollHeight);
    } else {
      setHeight(0);
    }
  }, [open, ...deps]);

  return { ref, height };
}
