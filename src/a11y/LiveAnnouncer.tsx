import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

export type Politeness = "polite" | "assertive";

type Announce = (message: string, politeness?: Politeness) => void;

const LiveAnnouncerContext = createContext<Announce | null>(null);

// Delay between clearing and setting the text so screen readers re-announce repeated messages.
const ANNOUNCE_DELAY_MS = 100;

/**
 * Shared aria-live regions (WCAG 4.1.3 Status Messages).
 * Components call `announce()` instead of rendering their own live regions, so focus never moves.
 */
export function LiveAnnouncerProvider({ children }: { children: ReactNode }) {
  const [polite, setPolite] = useState("");
  const [assertive, setAssertive] = useState("");
  const timers = useRef<Record<Politeness, number | undefined>>({ polite: undefined, assertive: undefined });

  const announce = useCallback<Announce>((message, politeness = "polite") => {
    const setText = politeness === "assertive" ? setAssertive : setPolite;
    window.clearTimeout(timers.current[politeness]);
    setText("");
    timers.current[politeness] = window.setTimeout(() => setText(message), ANNOUNCE_DELAY_MS);
  }, []);

  return (
    <LiveAnnouncerContext.Provider value={announce}>
      {children}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {polite}
      </div>
      <div className="sr-only" role="alert" aria-live="assertive" aria-atomic="true">
        {assertive}
      </div>
    </LiveAnnouncerContext.Provider>
  );
}

export function useAnnounce(): Announce {
  const context = useContext(LiveAnnouncerContext);
  if (!context) {
    throw new Error("useAnnounce must be used inside <LiveAnnouncerProvider>.");
  }
  return context;
}
