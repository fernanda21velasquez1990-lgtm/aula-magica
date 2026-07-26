"use client";

import { useEffect } from "react";

export default function DashboardError({
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
    <section className="system-state-card dashboard-error-card">
      <div className="system-state-icon">🧩</div>
      <h1>No se pudo abrir esta sección</h1>
      <p>Intenta cargarla nuevamente.</p>
      <button type="button" onClick={reset}>
        Reintentar
      </button>
    </section>
  );
}
