import { usePageTitle } from "../hooks/usePageTitle";

// Placeholder: the username form for Google sign-ups is implemented in US-02.
function CompleteProfilePage() {
  usePageTitle("Completar perfil");

  return (
    <>
      <h1 className="text-3xl font-bold">Completa tu perfil</h1>
      <p className="text-slate-300">El formulario para elegir tu username se implementa en US-02.</p>
    </>
  );
}

export default CompleteProfilePage;
