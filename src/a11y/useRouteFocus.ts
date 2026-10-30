import { useEffect, useRef, type RefObject } from "react";
import { useLocation } from "react-router-dom";
import { useAnnounce } from "./LiveAnnouncer";

/**
 * On client-side navigation, move focus to the new content and announce the page title
 * (pages set document.title in their own effects, which run before this one).
 * Comparing paths (not a "first render" flag) keeps initial load untouched, even when
 * React StrictMode runs effects twice in development.
 */
export function useRouteFocus(mainRef: RefObject<HTMLElement | null>) {
  const { pathname } = useLocation();
  const announce = useAnnounce();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    if (previousPathname.current === pathname) {
      return;
    }
    previousPathname.current = pathname;
    mainRef.current?.focus();
    announce(document.title);
  }, [pathname, announce, mainRef]);
}
