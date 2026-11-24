import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "../auth/AuthContext";
import { getRoomErrorMessage, listMyRooms, type Room } from "../services/roomService";

/** Last visit per room, remembered in this browser per user: { [roomId]: epoch ms }. */
type VisitedAt = Record<string, number>;

const visitsKey = (uid: string) => `nexoryx.roomVisits.${uid}`;

function readVisits(uid: string | undefined): VisitedAt {
  if (!uid) return {};
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(visitsKey(uid)) ?? "{}");
    return parsed && typeof parsed === "object" ? (parsed as VisitedAt) : {};
  } catch {
    return {};
  }
}

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
  /** Replaces a room in the list after the owner renames it (US-07). */
  updateRoomInList: (room: Room) => void;
  /** Drops a room from the list after it is deleted (US-07). */
  removeRoom: (roomId: string) => void;
  /** When the user last entered each room in this browser, to order "Salas a las que te uniste". */
  visitedAt: VisitedAt;
  /** Called once the user is inside a room: it shows up in the list right away and moves first. */
  markVisited: (room: Room) => void;
  createOpen: boolean;
  openCreate: () => void;
  closeCreate: () => void;
  /** Room being renamed, or null (US-07). */
  editing: Room | null;
  openEdit: (room: Room) => void;
  closeEdit: () => void;
  /** Room being deleted, or null (US-07). */
  deleting: Room | null;
  openDelete: (room: Room) => void;
  closeDelete: () => void;
  joinOpen: boolean;
  openJoin: () => void;
  closeJoin: () => void;
}

const RoomsContext = createContext<RoomsContextValue | null>(null);

export function RoomsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<RoomsState>({ kind: "loading" });
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [deleting, setDeleting] = useState<Room | null>(null);
  const [joinOpen, setJoinOpen] = useState(false);
  const uid = useAuth().profile?.uid;
  const [visits, setVisits] = useState<{ uid: string | undefined; visitedAt: VisitedAt }>(() => ({
    uid,
    visitedAt: readVisits(uid),
  }));
  // Another account signed in on this browser: its own visits (derived during render, no effect needed).
  const visitedAt = visits.uid === uid ? visits.visitedAt : readVisits(uid);

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

  // US-07: the renamed room keeps its position (the API re-sorts on updatedAt, next reload fixes it).
  const updateRoomInList = useCallback((room: Room) => {
    setState((current) =>
      current.kind === "success"
        ? { kind: "success", rooms: current.rooms.map((item) => (item.id === room.id ? room : item)) }
        : current,
    );
  }, []);

  const removeRoom = useCallback((roomId: string) => {
    setState((current) =>
      current.kind === "success"
        ? { kind: "success", rooms: current.rooms.filter(({ id }) => id !== roomId) }
        : current,
    );
  }, []);

  // Joining a room makes the user a member (realtime adds them to memberUids), so GET /rooms
  // already returns it on the next load; here it also appears at once, without refetching.
  const markVisited = useCallback(
    (room: Room) => {
      setState((current) =>
        current.kind !== "success"
          ? current
          : current.rooms.some(({ id }) => id === room.id)
            ? current
            : { kind: "success", rooms: [...current.rooms, room] },
      );
      const next = { ...readVisits(uid), [room.id]: Date.now() };
      setVisits({ uid, visitedAt: next });
      if (!uid) return;
      try {
        localStorage.setItem(visitsKey(uid), JSON.stringify(next));
      } catch {
        // Not remembered across reloads; the list still shows the room.
      }
    },
    [uid],
  );

  const openCreate = useCallback(() => setCreateOpen(true), []);
  const closeCreate = useCallback(() => setCreateOpen(false), []);
  const openEdit = useCallback((room: Room) => setEditing(room), []);
  const closeEdit = useCallback(() => setEditing(null), []);
  const openDelete = useCallback((room: Room) => setDeleting(room), []);
  const closeDelete = useCallback(() => setDeleting(null), []);
  const openJoin = useCallback(() => setJoinOpen(true), []);
  const closeJoin = useCallback(() => setJoinOpen(false), []);

  const value = useMemo(
    () => ({
      state,
      reload,
      addRoom,
      updateRoomInList,
      removeRoom,
      visitedAt,
      markVisited,
      createOpen,
      openCreate,
      closeCreate,
      editing,
      openEdit,
      closeEdit,
      deleting,
      openDelete,
      closeDelete,
      joinOpen,
      openJoin,
      closeJoin,
    }),
    [
      state,
      reload,
      addRoom,
      updateRoomInList,
      removeRoom,
      visitedAt,
      markVisited,
      createOpen,
      openCreate,
      closeCreate,
      editing,
      openEdit,
      closeEdit,
      deleting,
      openDelete,
      closeDelete,
      joinOpen,
      openJoin,
      closeJoin,
    ],
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
