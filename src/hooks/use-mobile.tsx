import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  // Initialize with actual value to prevent flash of wrong layout
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < MOBILE_BREAKPOINT;
    }
    return false;
  });

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    const update = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);

    // Some embedded/preview environments don't reliably fire matchMedia events,
    // so we also listen to resize to ensure the layout switches immediately.
    mql.addEventListener?.("change", update);
    window.addEventListener("resize", update);

    update();

    return () => {
      mql.removeEventListener?.("change", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return isMobile;
}
