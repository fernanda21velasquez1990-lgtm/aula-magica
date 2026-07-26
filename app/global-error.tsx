"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body>
        <main
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: 24,
            background: "#fff8fc",
            color: "#352f44",
            fontFamily: "Arial, sans-serif",
          }}
        >
          <section
            style={{
              width: "min(460px, 100%)",
              padding: 32,
              borderRadius: 24,
              background: "white",
              textAlign: "center",
              boxShadow: "0 18px 50px rgba(53,47,68,.14)",
            }}
          >
            <div style={{ fontSize: 52 }}>✨</div>
            <h1>Aula Mágica necesita recargarse</h1>
            <p>La aplicación encontró un problema temporal.</p>
            <button
              type="button"
              onClick={reset}
              style={{
                border: 0,
                borderRadius: 14,
                padding: "12px 18px",
                background: "#ff67a5",
                color: "white",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Recargar aplicación
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
