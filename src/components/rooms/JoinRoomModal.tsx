import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useRooms } from "../../rooms/RoomsProvider";
import { getRoom, getRoomErrorMessage, validateRoomId } from "../../services/roomService";
import Button from "../ui/Button";
import FormField from "../ui/FormField";
import Modal from "../ui/Modal";

function JoinRoomModal() {
  const { joinOpen, closeJoin } = useRooms();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [roomId, setRoomId] = useState("");
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!joinOpen) {
      setRoomId("");
      setError(undefined);
      setPending(false);
      return;
    }
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [joinOpen]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    const id = roomId.trim();
    const validationError = validateRoomId(id);
    setError(validationError);
    if (validationError) {
      inputRef.current?.focus();
      return;
    }
    setPending(true);
    try {
      const room = await getRoom(id);
      closeJoin();
      navigate(`/rooms/${encodeURIComponent(id)}`, { state: { room } });
    } catch (cause) {
      setError(getRoomErrorMessage(cause));
      setPending(false);
      inputRef.current?.focus();
    }
  };

  return (
    <Modal open={joinOpen} title="Unirse a una sala" description="Pega el ID que te compartieron para comprobar la sala y entrar." onClose={() => !pending && closeJoin()}>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <FormField
          ref={inputRef}
          label="ID de la sala"
          required
          autoComplete="off"
          value={roomId}
          error={error}
          onChange={(event) => {
            setRoomId(event.target.value);
            setError(undefined);
          }}
        />
        <div className="flex justify-end">
          <Button type="submit" loading={pending} loadingLabel="Abriendo sala…" className="sm:w-auto">
            Continuar
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default JoinRoomModal;
