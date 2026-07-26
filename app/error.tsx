"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="system-state-page">
      <section className="system-state-card">
        <div className="system-state-icon">🪄</div>
        <h1>Ocurrió un error</h1>
        <p>La pantalla no pudo cargarse. Puedes intentarlo nuevamente.</p>
        <button type="button" onClick={reset}>
          Intentar de nuevo
        </button>
      </section>
    </main>
  );
}
