import { Link } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";

function NotFoundPage() {
  usePageTitle("Página no encontrada");

  return (
    <>
      <h1 className="text-3xl font-bold">Página no encontrada</h1>
      <Link to="/" className="text-sky-300 underline">
        Volver al inicio
      </Link>
    </>
  );
}

export default NotFoundPage;
