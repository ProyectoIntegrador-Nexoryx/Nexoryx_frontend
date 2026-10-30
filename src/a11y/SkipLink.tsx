import type { RefObject } from "react";

/** First focusable element of every page (WCAG 2.4.1); focuses <main> without changing the URL. */
function SkipLink({ targetRef }: { targetRef: RefObject<HTMLElement | null> }) {
  return (
    <a
      href="#main-content"
      onClick={(event) => {
        event.preventDefault();
        targetRef.current?.focus();
      }}
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-cyan focus:px-4 focus:py-2 focus:font-semibold focus:text-canvas"
    >
      Saltar al contenido
    </a>
  );
}

export default SkipLink;
