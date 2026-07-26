import Link from "next/link";

export default function NotFound() {
  return (
    <main className="system-state-page">
      <section className="system-state-card">
        <div className="system-state-icon">📚</div>
        <h1>Página no encontrada</h1>
        <p>La sección que buscas no existe o fue movida.</p>
        <Link href="/dashboard">Volver al inicio</Link>
      </section>
    </main>
  );
}
