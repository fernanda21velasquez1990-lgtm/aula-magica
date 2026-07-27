"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { activarCuentaConCodigo } from "@/lib/apps-script-api";

export default function ActivarCuentaPage() {
  const [formulario, setFormulario] = useState({
    correo: "",
    codigo: "",
    contrasena: "",
    confirmar: "",
  });
  const [mensaje, setMensaje] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [activada, setActivada] = useState(false);

  async function activar(event: FormEvent) {
    event.preventDefault();
    setMensaje("");

    if (formulario.contrasena !== formulario.confirmar) {
      setMensaje("Las contraseñas no coinciden.");
      return;
    }

    setProcesando(true);

    try {
      const resultado = await activarCuentaConCodigo({
        correo: formulario.correo,
        codigo: formulario.codigo,
        contrasena: formulario.contrasena,
      });

      setActivada(true);
      setMensaje(
        `✅ Cuenta activada con el plan ${resultado.plan}. ` +
          `Vence el ${resultado.fechaVencimiento}.`
      );
    } catch (error) {
      setMensaje(
        error instanceof Error
          ? error.message
          : "No se pudo activar la cuenta."
      );
    } finally {
      setProcesando(false);
    }
  }

  return (
    <main className="activation-page">
      <section className="activation-card">
        <div className="activation-brand">
          <img src="/brand/aula-magica-logo.png" alt="Aula Mágica" />
          <span>ACTIVACIÓN DE CUENTA</span>
          <h1>Bienvenida a Aula Mágica ✨</h1>
          <p>
            Ingresa el código recibido y crea tu contraseña personal.
            La duración de tu plan comenzará al completar la activación.
          </p>
        </div>

        {!activada ? (
          <form onSubmit={activar}>
            <label>
              Correo electrónico
              <input
                required
                type="email"
                value={formulario.correo}
                onChange={(event) =>
                  setFormulario({
                    ...formulario,
                    correo: event.target.value,
                  })
                }
              />
            </label>

            <label>
              Código de activación
              <input
                required
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={formulario.codigo}
                onChange={(event) =>
                  setFormulario({
                    ...formulario,
                    codigo: event.target.value.replace(/\D/g, ""),
                  })
                }
              />
            </label>

            <label>
              Nueva contraseña
              <input
                required
                type="password"
                minLength={6}
                value={formulario.contrasena}
                onChange={(event) =>
                  setFormulario({
                    ...formulario,
                    contrasena: event.target.value,
                  })
                }
              />
            </label>

            <label>
              Confirmar contraseña
              <input
                required
                type="password"
                minLength={6}
                value={formulario.confirmar}
                onChange={(event) =>
                  setFormulario({
                    ...formulario,
                    confirmar: event.target.value,
                  })
                }
              />
            </label>

            {mensaje && <div className="activation-message">{mensaje}</div>}

            <button disabled={procesando}>
              {procesando ? "Activando..." : "🔑 Activar mi cuenta"}
            </button>
          </form>
        ) : (
          <div className="activation-success">
            <span>✅</span>
            <h2>Tu cuenta está lista</h2>
            <p>{mensaje}</p>
            <Link href="/">Entrar a Aula Mágica</Link>
          </div>
        )}

        <Link className="activation-back" href="/">
          ← Volver al inicio de sesión
        </Link>
      </section>
    </main>
  );
}
