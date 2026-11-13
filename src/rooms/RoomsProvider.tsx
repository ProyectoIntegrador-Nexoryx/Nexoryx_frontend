import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getRoomErrorMessage, listMyRooms, type Room } from "../services/roomService";

/** US-06: the dashboard, the sidebar and the create dialog read the same room list. */
export type RoomsState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "success"; rooms: Room[] };

interface RoomsContextValue {
  state: RoomsState;
  reload: () => Promise<void>;
  /** Adds a room created in this session without refetching the list. */
  addRoom: (room: Room) => void;
  updateRoom: (room: Room) => void;
  removeRoom: (roomId: string) => void;
  createOpen: boolean;
  openCreate: () => void;
  closeCreate: () => void;
  joinOpen: boolean;
  openJoin: () => void;
  closeJoin: () => void;
}

const RoomsContext = createContext<RoomsContextValue | null>(null);

export function RoomsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<RoomsState>({ kind: "loading" });
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  const reload = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      setState({ kind: "success", rooms: await listMyRooms() });
    } catch (error) {
      setState({ kind: "error", message: getRoomErrorMessage(error) });
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  // The API sorts by last update; a new room goes first for this session.
  const addRoom = useCallback((room: Room) => {
    setState((current) => {
      if (current.kind !== "success") {
        return { kind: "success", rooms: [room] };
      }
      return { kind: "success", rooms: [room, ...current.rooms.filter(({ id }) => id !== room.id)] };
    });
  }, []);

  const updateRoom = useCallback((room: Room) => {
    setState((current) => current.kind === "success"
      ? { kind: "success", rooms: current.rooms.map((item) => item.id === room.id ? room : item) }
      : current);
  }, []);

  const removeRoom = useCallback((roomId: string) => {
    setState((current) => current.kind === "success"
      ? { kind: "success", rooms: current.rooms.filter(({ id }) => id !== roomId) }
      : current);
  }, []);

  const openCreate = useCallback(() => setCreateOpen(true), []);
  const closeCreate = useCallback(() => setCreateOpen(false), []);
  const openJoin = useCallback(() => setJoinOpen(true), []);
  const closeJoin = useCallback(() => setJoinOpen(false), []);

  const value = useMemo(
    () => ({ state, reload, addRoom, updateRoom, removeRoom, createOpen, openCreate, closeCreate, joinOpen, openJoin, closeJoin }),
    [state, reload, addRoom, updateRoom, removeRoom, createOpen, openCreate, closeCreate, joinOpen, openJoin, closeJoin],
  );

  return <RoomsContext.Provider value={value}>{children}</RoomsContext.Provider>;
}

export function useRooms(): RoomsContextValue {
  const context = useContext(RoomsContext);
  if (!context) {
    throw new Error("useRooms must be used inside <RoomsProvider>.");
  }
  return context;
}
