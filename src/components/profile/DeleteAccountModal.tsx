import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { LOGIN_PATH } from "../../auth/PrivateRoute";
import { deleteAccount } from "../../services/userService";
import Button from "../ui/Button";
import Modal from "../ui/Modal";

const ERROR_MESSAGE = "No pudimos eliminar tu cuenta. Inténtalo de nuevo.";

interface DeleteAccountModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Confirm-first account deletion (US-04):
 * confirming ends the session and returns to the home; canceling just closes the window.
 */
function DeleteAccountModal({ open, onClose }: DeleteAccountModalProps) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  const handleConfirm = async () => {
    if (pending) return;
    setPending(true);
    setError(false);
    try {
      await deleteAccount();
      await signOut();
      onClose();
      navigate(LOGIN_PATH, { replace: true });
    } catch {
      setError(true);
      setPending(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Eliminar cuenta"
      description="Se eliminará tu cuenta de NEXORYX y tu nombre de usuario. Esta acción no se puede deshacer."
      onClose={onClose}
    >
      <div className="flex flex-col gap-5">
        {error && (
          <p role="alert" className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
            {ERROR_MESSAGE}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={pending} className="sm:w-auto">
            Cancelar
          </Button>
          <Button
            icon={Trash2}
            loading={pending}
            loadingLabel="Eliminando…"
            onClick={() => void handleConfirm()}
            className="sm:w-auto"
          >
            Eliminar cuenta
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default DeleteAccountModal;
