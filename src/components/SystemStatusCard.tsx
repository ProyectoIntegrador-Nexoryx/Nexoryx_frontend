import { useCallback, useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { getSystemStatus, type SystemStatus } from "../services/systemService";

type RequestState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "success"; data: SystemStatus };

function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    if (!error.response) {
      return "No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.";
    }
    if (error.response.status === 404) {
      return "El servidor respondió, pero aún no hay un estado registrado en la base de datos.";
    }
    if (error.response.status === 503) {
      return "El servidor está activo, pero la base de datos no está configurada.";
    }
  }
  return "Ocurrió un error inesperado. Inténtalo de nuevo.";
}

function SystemStatusCard() {
  const [state, setState] = useState<RequestState>({ kind: "loading" });

  const loadStatus = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const data = await getSystemStatus();
      setState({ kind: "success", data });
    } catch (error) {
      setState({ kind: "error", message: getErrorMessage(error) });
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  return (
    <section
      aria-labelledby="system-status-title"
      aria-busy={state.kind === "loading"}
      className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-800/60 p-6"
    >
      <h2 id="system-status-title" className="text-lg font-semibold">
        Estado del sistema
      </h2>

      <div className="mt-4" role="status" aria-live="polite">
        {state.kind === "loading" && (
          <p className="text-slate-300">Consultando el estado del sistema…</p>
        )}

        {state.kind === "success" && (
          <>
            <p className="text-xl">{state.data.message}</p>
            {state.data.updatedAt && (
              <p className="mt-2 text-sm text-slate-300">
                Actualizado:{" "}
                <time dateTime={state.data.updatedAt}>
                  {new Date(state.data.updatedAt).toLocaleString("es-CO")}
                </time>
              </p>
            )}
          </>
        )}
      </div>

      {state.kind === "error" && (
        <div role="alert" className="mt-4">
          <p className="text-red-300">{state.message}</p>
        </div>
      )}

      {state.kind !== "loading" && (
        <button
          type="button"
          onClick={() => void loadStatus()}
          className="mt-4 rounded-lg bg-sky-500 px-4 py-2 font-medium text-slate-950 hover:bg-sky-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
        >
          {state.kind === "error" ? "Reintentar" : "Actualizar"}
        </button>
      )}
    </section>
  );
}

export default SystemStatusCard;
