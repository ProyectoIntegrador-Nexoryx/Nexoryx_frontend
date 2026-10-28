import SystemStatusCard from "../components/SystemStatusCard";
import { usePageTitle } from "../hooks/usePageTitle";

function HomePage() {
  usePageTitle("Inicio");

  return (
    <>
      <h1 className="text-3xl font-bold">NEXORYX</h1>
      <p className="text-slate-300">Beyond Connection.</p>
      <SystemStatusCard />
    </>
  );
}

export default HomePage;
