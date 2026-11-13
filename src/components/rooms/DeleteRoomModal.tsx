import { useEffect, useState, type FormEvent } from "react";
import { Trash2 } from "lucide-react";
import { useAnnounce } from "../../a11y/LiveAnnouncer";
import { useRooms } from "../../rooms/RoomsProvider";
import { deleteRoom, getRoomErrorMessage } from "../../services/roomService";
import Button from "../ui/Button";
import Modal from "../ui/Modal";

/**
 * US-07 delete confirmation: explains that participants and messages go away too, and
 * requires an explicit submit (the destructive button is not the default focus target).
 * On success the room leaves the list immediately and everyone inside it gets room:deleted
 * from backend-realtime.
 */
function DeleteRoomModal() {
  const { deleting, closeDelete, removeRoom } = useRooms();
  const announce = useAnnounce();

  const [requestError, setRequestError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!deleting) {
      setRequestError(undefined);
      setPending(false);
    }
  }, [deleting]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!deleting || pending) return;

    setPending(true);
    try {
      await deleteRoom(deleting.id);
      const { name } = deleting;
      removeRoom(deleting.id);
      closeDelete();
      announce(`Sala «${name}» eliminada junto con sus mensajes y participantes.`);
    } catch (cause) {
      const message = getRoomErrorMessage(cause);
      setRequestError(message);
      setPending(false);
      announce(message, "assertive");
    }
  };

  return (
    <Modal
      open={deleting !== null}
      title="¿Eliminar esta sala?"
      description={
        deleting
          ? `«${deleting.name}» se borrará para siempre, junto con su chat y sus participantes.`
          : undefined
      }
      onClose={closeDelete}
    >
      <form onSubmit={(event) => void handleSubmit(event)} noValidate className="flex flex-col gap-5">
        <p className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm leading-5 text-danger">
          Esta acción no se puede deshacer. Quienes estén dentro de la sala verán un aviso y
          volverán al dashboard.
        </p>

        {requestError && (
          <p role="alert" className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm leading-5 text-danger">
            {requestError}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={closeDelete} disabled={pending} className="sm:w-auto">
            No, volver
          </Button>
          <Button
            type="submit"
            loading={pending}
            loadingLabel="Eliminando…"
            className="sm:w-auto"
            icon={Trash2}
          >
            Eliminar sala
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default DeleteRoomModal;
