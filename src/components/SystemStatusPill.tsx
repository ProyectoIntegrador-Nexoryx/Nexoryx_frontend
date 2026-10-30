import { useCallback, useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { RefreshCw } from "lucide-react";
import { getSystemStatus, type SystemStatus } from "../services/systemService";

type RequestState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "success"; data: SystemStatus };

function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    if (!error.response) return "Sin conexión con el servidor";
    if (error.response.status === 404) return "Estado del sistema sin registrar";
    if (error.response.status === 503) return "Base de datos no configurada";
  }
  return "No se pudo consultar el estado";
}

/**
 * TS-00 base check, now compact: reads system/status from Firestore through the API.
 * Loading, error (with "Reintentar") and success states; changes are announced politely.
 */
function SystemStatusPill() {
  const [state, setState] = useState<RequestState>({ kind: "loading" });

  const loadStatus = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      setState({ kind: "success", data: await getSystemStatus() });
    } catch (error) {
      setState({ kind: "error", message: getErrorMessage(error) });
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const dot =
    state.kind === "success" ? "bg-cyan" : state.kind === "error" ? "bg-danger" : "animate-pulse bg-ink-subtle";

  return (
    <div className="flex items-center gap-2">
      <p
        role="status"
        aria-busy={state.kind === "loading"}
        className="flex items-center gap-2 rounded-full border border-white/10 bg-surface-raised/70 px-3 py-1.5 text-[11px] leading-[14px] font-medium tracking-[0.02em] text-ink-muted"
      >
        <span aria-hidden="true" className={`size-1.5 shrink-0 rounded-full ${dot}`} />
        {state.kind === "loading" && "Consultando estado del sistema…"}
        {state.kind === "error" && state.message}
        {state.kind === "success" && (
          <span>
            {state.data.message}
            {state.data.updatedAt && (
              <span className="hidden sm:inline">
                {" · "}
                <time dateTime={state.data.updatedAt}>
                  {new Date(state.data.updatedAt).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })}
                </time>
              </span>
            )}
          </span>
        )}
      </p>
      {state.kind === "error" && (
        <button
          type="button"
          onClick={() => void loadStatus()}
          className="flex min-h-8 items-center gap-1.5 rounded-full border border-white/10 px-3 text-[11px] font-semibold text-violet-soft transition-colors duration-150 hover:bg-surface-raised"
        >
          <RefreshCw aria-hidden="true" className="size-3" />
          Reintentar
        </button>
      )}
    </div>
  );
}

export default SystemStatusPill;
