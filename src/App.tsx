import SystemStatusCard from "./components/SystemStatusCard";

function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded-lg focus:bg-sky-500 focus:px-4 focus:py-2 focus:text-slate-950"
      >
        Saltar al contenido
      </a>

      <header className="border-b border-slate-800 px-4 py-4">
        <p className="text-xl font-bold tracking-wide">NEXORYX</p>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-10 text-center"
      >
        <h1 className="text-3xl font-bold">NEXORYX</h1>
        <p className="text-slate-300">Beyond Connection.</p>
        <SystemStatusCard />
      </main>

      <footer className="border-t border-slate-800 px-4 py-4 text-center text-sm text-slate-400">
        NEXORYX — Proyecto Integrador, Univalle
      </footer>
    </div>
  );
}

export default App;
