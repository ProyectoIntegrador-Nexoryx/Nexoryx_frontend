import { useEffect, useRef, useState, type FormEvent } from "react";
import { useAnnounce } from "../../a11y/LiveAnnouncer";
import { useRooms } from "../../rooms/RoomsProvider";
import {
  getRoomErrorMessage,
  ROOM_NAME_MAX_LENGTH,
  updateRoom,
  validateRoomName,
} from "../../services/roomService";
import Button from "../ui/Button";
import FormField from "../ui/FormField";
import Modal from "../ui/Modal";

/**
 * US-07 rename dialog: validates like the create flow, PATCHes the room and updates the
 * list in place so the dashboard shows the new name immediately (owner only, the API
 * answers 403 not_room_owner otherwise).
 */
function EditRoomModal() {
  const { editing, closeEdit, updateRoomInList } = useRooms();
  const announce = useAnnounce();

  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [requestError, setRequestError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!editing) {
      setName("");
      setError(undefined);
      setRequestError(undefined);
      setPending(false);
      return;
    }
    setName(editing.name);
    // The dialog takes focus when it opens; move it to the field on the next frame.
    const frame = requestAnimationFrame(() => nameRef.current?.select());
    return () => cancelAnimationFrame(frame);
  }, [editing]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing || pending) return;

    const validationError = validateRoomName(name);
    setError(validationError);
    setRequestError(undefined);
    if (validationError) {
      announce(validationError, "assertive");
      nameRef.current?.focus();
      return;
    }
    if (name.trim() === editing.name) {
      closeEdit();
      return;
    }

    setPending(true);
    try {
      const room = await updateRoom(editing.id, { name });
      updateRoomInList(room);
      closeEdit();
      announce(`Sala renombrada a «${room.name}».`);
    } catch (cause) {
      const message = getRoomErrorMessage(cause);
      setRequestError(message);
      setPending(false);
      announce(message, "assertive");
    }
  };

  return (
    <Modal
      open={editing !== null}
      title="Editar sala"
      description="Cambia el nombre que tu grupo ve en el dashboard."
      onClose={closeEdit}
    >
      <form onSubmit={(event) => void handleSubmit(event)} noValidate className="flex flex-col gap-5">
        <FormField
          ref={nameRef}
          label="Nombre de la sala"
          hint={`Hasta ${ROOM_NAME_MAX_LENGTH} caracteres.`}
          labelAside={
            <span aria-hidden="true" className="text-xs text-ink-subtle">
              {name.trim().length}/{ROOM_NAME_MAX_LENGTH}
            </span>
          }
          error={error}
          required
          autoComplete="off"
          name="roomName"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            if (error) setError(undefined);
          }}
        />

        {requestError && (
          <p
            role="alert"
            className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm leading-5 text-danger"
          >
            {requestError}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={closeEdit} disabled={pending} className="sm:w-auto">
            Cancelar
          </Button>
          <Button type="submit" loading={pending} loadingLabel="Guardando…" className="sm:w-auto">
            Guardar cambios
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default EditRoomModal;
