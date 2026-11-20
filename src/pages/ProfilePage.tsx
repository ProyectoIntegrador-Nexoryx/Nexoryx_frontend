import { useNavigate } from "react-router-dom";
import ProfileModal from "../components/profile/ProfileModal";

/** Keeps old profile links working with the editable profile modal. */
function ProfilePage() {
  const navigate = useNavigate();
  return <ProfileModal open onClose={() => navigate("/dashboard", { replace: true })} />;
}

export default ProfilePage;
