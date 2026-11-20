import { useEffect, useRef, useState, type FormEvent } from "react";
import { useAnnounce } from "../../a11y/LiveAnnouncer";
import { useRooms } from "../../rooms/RoomsProvider";
import { deleteRoom, getRoomErrorMessage, ROOM_NAME_MAX_LENGTH, updateRoom, validateRoomName, type Room } from "../../services/roomService";
import Button from "../ui/Button";
import FormField from "../ui/FormField";
import Modal from "../ui/Modal";

function ManageRoomModal({ room, action, onClose }: { room: Room | null; action: "edit" | "delete"; onClose: () => void }) {
  const { updateRoom: saveRoom, removeRoom } = useRooms();
  const announce = useAnnounce();
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string>();
  const [requestError, setRequestError] = useState<string>();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setName(room?.name ?? "");
    setError(undefined);
    setRequestError(undefined);
    setPending(false);
    if (room && action === "edit") {
      const frame = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(frame);
    }
  }, [room, action]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!room || pending) return;
    if (action === "edit") {
      const validation = validateRoomName(name);
      setError(validation);
      if (validation) {
        announce(validation, "assertive");
        inputRef.current?.focus();
        return;
      }
    }
    setPending(true);
    setRequestError(undefined);
    try {
      if (action === "edit") {
        const updated = await updateRoom(room.id, { name });
        saveRoom(updated);
        announce(`Sala actualizada a «${updated.name}».`);
      } else {
        await deleteRoom(room.id);
        removeRoom(room.id);
        announce(`Sala «${room.name}» eliminada.`);
      }
      onClose();
    } catch (cause) {
      const message = getRoomErrorMessage(cause);
      setRequestError(message);
      setPending(false);
      announce(message, "assertive");
    }
  };

  return (
    <Modal
      open={Boolean(room)}
      title={action === "edit" ? "Editar sala" : "Eliminar sala"}
      description={action === "edit" ? "Actualiza el nombre que verá tu grupo." : `¿Quieres eliminar «${room?.name ?? ""}»? También se eliminarán sus participantes y mensajes.`}
      onClose={() => !pending && onClose()}
    >
      <form onSubmit={(event) => void submit(event)} noValidate className="flex flex-col gap-5">
        {action === "edit" && <FormField ref={inputRef} label="Nombre de la sala" hint={`Hasta ${ROOM_NAME_MAX_LENGTH} caracteres.`} error={error} required name="roomName" autoComplete="off" maxLength={ROOM_NAME_MAX_LENGTH} value={name} onChange={(event) => { setName(event.target.value); setError(undefined); }} />}
        {requestError && <p role="alert" className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm leading-5 text-danger">{requestError}</p>}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={pending} className="sm:w-auto">Cancelar</Button>
          <Button type="submit" loading={pending} loadingLabel={action === "edit" ? "Guardando…" : "Eliminando…"} className="sm:w-auto">
            {action === "edit" ? "Guardar cambios" : "Eliminar sala"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default ManageRoomModal;
