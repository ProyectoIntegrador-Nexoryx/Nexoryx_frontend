import { useEffect } from "react";

/** Sets a distinct document title per page (WCAG 2.4.2). */
export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = `${title} | NEXORYX`;
  }, [title]);
}
