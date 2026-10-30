import { useEffect, useState } from "react";
import { isUsernameAvailable } from "../services/userService";
import { normalizeUsername, USERNAME_PATTERN } from "./validation";

export type Availability = "idle" | "checking" | "available" | "taken" | "error";

const DEBOUNCE_MS = 400;

/** Debounced GET /users/username-availability; only valid usernames are sent to the API. */
export function useUsernameAvailability(value: string): Availability {
  const [availability, setAvailability] = useState<Availability>("idle");
  const username = normalizeUsername(value);
  const isValid = USERNAME_PATTERN.test(username);

  useEffect(() => {
    if (!isValid) {
      setAvailability("idle");
      return;
    }
    let cancelled = false;
    setAvailability("checking");
    const timer = window.setTimeout(async () => {
      try {
        const available = await isUsernameAvailable(username);
        if (!cancelled) setAvailability(available ? "available" : "taken");
      } catch {
        if (!cancelled) setAvailability("error");
      }
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [username, isValid]);

  return availability;
}
