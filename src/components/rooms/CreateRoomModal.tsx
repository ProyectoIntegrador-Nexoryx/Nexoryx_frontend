import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAnnounce } from "../../a11y/LiveAnnouncer";
import { useRooms } from "../../rooms/RoomsProvider";
import {
  createRoom,
  getRoomErrorMessage,
  ROOM_NAME_MAX_LENGTH,
  validateRoomName,
} from "../../services/roomService";
import Button from "../ui/Button";
import FormField from "../ui/FormField";
import Modal from "../ui/Modal";

/**
 * US-06 create flow: validates the name, creates the room in the API and enters it as host.
 * Errors stay next to the field (WCAG 3.3.1/3.3.3) and every status change is announced.
 */
function CreateRoomModal() {
  const { createOpen, closeCreate, addRoom } = useRooms();
  const announce = useAnnounce();
  const navigate = useNavigate();

  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [requestError, setRequestError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!createOpen) {
      setName("");
      setError(undefined);
      setRequestError(undefined);
      setPending(false);
      return;
    }
    // The dialog takes focus when it opens; move it to the field on the next frame.
    const frame = requestAnimationFrame(() => nameRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [createOpen]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;

    const validationError = validateRoomName(name);
    setError(validationError);
    setRequestError(undefined);
    if (validationError) {
      announce(validationError, "assertive");
      nameRef.current?.focus();
      return;
    }

    setPending(true);
    try {
      const room = await createRoom({ name });
      addRoom(room);
      closeCreate();
      announce(`Sala «${room.name}» creada. Entraste como anfitrión.`);
      navigate(`/rooms/${room.id}`);
    } catch (cause) {
      const message = getRoomErrorMessage(cause);
      setRequestError(message);
      setPending(false);
      announce(message, "assertive");
    }
  };

  return (
    <Modal
      open={createOpen}
      title="Crear sala"
      description="Ponle un nombre que tu grupo reconozca: la materia y el tema, por ejemplo."
      onClose={closeCreate}
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
          <Button variant="secondary" onClick={closeCreate} disabled={pending} className="sm:w-auto">
            Cancelar
          </Button>
          <Button type="submit" loading={pending} loadingLabel="Creando sala…" className="sm:w-auto">
            Crear sala
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default CreateRoomModal;
