import { api } from "../lib/api";

export interface SystemStatus {
  message: string;
  updatedAt: string | null;
}

export async function getSystemStatus(): Promise<SystemStatus> {
  const { data } = await api.get<SystemStatus>("/system/status");
  return data;
}
