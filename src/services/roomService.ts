import { isAxiosError } from "axios";
import { api } from "../lib/api";

/** Same shape as RoomDto in backend-api (src/rooms/dto/room.dto.ts). */
export interface Room {
  id: string;
  name: string;
  description: string | null;
  ownerUid: string;
  memberCount: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CreateRoomInput {
  name: string;
}

/** Mirrors ROOM_NAME_MAX_LENGTH in the API (src/rooms/rooms.constants.ts). */
export const ROOM_NAME_MAX_LENGTH = 60;

/** Client-side rules mirror the API so the error shows before any request (US-06). */
export function validateRoomName(value: string): string | undefined {
  const name = value.trim();
  if (!name) return "Escribe el nombre de tu sala para poder crearla.";
  if (name.length > ROOM_NAME_MAX_LENGTH) {
    const extra = name.length - ROOM_NAME_MAX_LENGTH;
    return `Usa ${ROOM_NAME_MAX_LENGTH} caracteres como máximo; quita ${extra}.`;
  }
  return undefined;
}

/**
 * Rooms the user owns or has joined, most recently updated first.
 * The backlog mentions GET /rooms/mine, but the API implements and documents GET /rooms,
 * so the frontend follows the real contract.
 */
export async function listMyRooms(): Promise<Room[]> {
  const { data } = await api.get<Room[]>("/rooms");
  // A misconfigured VITE_API_URL makes the host answer with index.html instead of JSON.
  if (!Array.isArray(data)) {
    throw new Error("Unexpected response from the API.");
  }
  return data;
}

/** Creates the room; the API makes the creator its owner and first participant. */
export async function createRoom(input: CreateRoomInput): Promise<Room> {
  const { data } = await api.post<Room>("/rooms", { name: input.name.trim() });
  if (typeof data !== "object" || data === null || typeof data.id !== "string") {
    throw new Error("Unexpected response from the API.");
  }
  return data;
}

/** Turns API and network failures into a message the user can act on. */
export function getRoomErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const code = (error.response?.data as { code?: string } | undefined)?.code;
    if (!error.response) {
      return "Sin conexión con el servidor. Revisa tu red e intenta de nuevo.";
    }
    if (error.response.status === 401) {
      return "Tu sesión expiró. Vuelve a iniciar sesión.";
    }
    if (code === "profile_incomplete") {
      return "Completa tu perfil antes de usar tus salas.";
    }
    if (error.response.status === 400) {
      return `Revisa el nombre de la sala: no puede quedar vacío ni superar los ${ROOM_NAME_MAX_LENGTH} caracteres.`;
    }
    if (error.response.status === 503) {
      return "El servidor no está disponible ahora. Intenta de nuevo en unos segundos.";
    }
  }
  return "No pudimos conectar con el servidor. Intenta de nuevo.";
}
