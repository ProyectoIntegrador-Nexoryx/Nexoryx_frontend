import { api } from "../lib/api";

export interface SystemStatus {
  message: string;
  updatedAt: string | null;
}

export async function getSystemStatus(): Promise<SystemStatus> {
  const { data } = await api.get<SystemStatus>("/system/status");
  // A misconfigured VITE_API_URL makes the host answer with index.html instead of JSON.
  if (typeof data !== "object" || data === null || typeof data.message !== "string") {
    throw new Error("Unexpected response from the API.");
  }
  return data;
}
