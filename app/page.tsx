"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import AppLogo from "@/components/AppLogo";
import ThemeToggle from "@/components/ThemeToggle";
import { iniciarSesion, registrarMaestra } from "@/lib/apps-script-api";
import { guardarSesion } from "@/lib/session";

export default function LoginPage() {
  const router = useRouter();
  const [register, setRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [grado, setGrado] = useState("");
  const [seccion, setSeccion] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mensaje, setMensaje] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setMensaje("Procesando...");

    try {
      if (register) {
        await registrarMaestra({
          nombre,
          apellido,
          correo,
          contrasena,
          grado,
          seccion,
        });
        setMensaje(
          "Cuenta creada correctamente. Ahora puedes iniciar sesión."
        );
        setRegister(false);
        setContrasena("");
      } else {
        const resultado = await iniciarSesion({ correo, contrasena });
        guardarSesion(resultado.token, resultado.maestra);
        router.push("/dashboard");
      }
    } catch (error) {
      setMensaje(
        error instanceof Error
          ? error.message
          : "No fue posible completar la operación."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-theme-control">
        <ThemeToggle />
      </div>

      <section className="login">
        <div className="login-art">
          <AppLogo href="" priority />
          <span className="login-badge">✨ Gestión docente inteligente</span>
          <h1 className="title">
            Tu Aula Mágica: todos tus registros en <span>un solo lugar</span>
          </h1>
          <p className="subtitle">
            Alumnos, asistencia, notas, planificación, agenda, Telegram y
            materiales digitales en una sola aplicación.
          </p>
          <div className="login-feature-cloud" aria-hidden="true">
            <span>👩‍🏫</span>
            <span>📚</span>
            <span>✏️</span>
            <span>🎂</span>
            <span>📊</span>
            <span>🧰</span>
          </div>
        </div>

        <div className="login-form">
          <span className="chip">Acceso seguro por maestra</span>
          <h2>{register ? "Crear cuenta" : "Bienvenida"}</h2>
          <p className="login-form-copy">
            {register
              ? "Crea tu espacio personal y comienza a organizar tu curso."
              : "Ingresa para continuar con tu jornada docente."}
          </p>

          <form onSubmit={submit}>
            {register && (
              <>
                <input
                  placeholder="Nombre"
                  value={nombre}
                  onChange={(event) => setNombre(event.target.value)}
                  required
                />
                <input
                  placeholder="Apellido"
                  value={apellido}
                  onChange={(event) => setApellido(event.target.value)}
                  required
                />
                <input
                  placeholder="Grado, por ejemplo: 1 grado"
                  value={grado}
                  onChange={(event) => setGrado(event.target.value)}
                />
                <input
                  placeholder="Sección, por ejemplo: A"
                  value={seccion}
                  onChange={(event) => setSeccion(event.target.value)}
                />
              </>
            )}

            <input
              type="email"
              placeholder="Correo electrónico"
              value={correo}
              onChange={(event) => setCorreo(event.target.value)}
              required
            />
            <input
              type="password"
              minLength={6}
              placeholder="Contraseña"
              value={contrasena}
              onChange={(event) => setContrasena(event.target.value)}
              required
            />

            <button className="btn" type="submit" disabled={loading}>
              {loading
                ? "Procesando..."
                : register
                  ? "Crear mi espacio"
                  : "Entrar a Aula Mágica"}
            </button>
          </form>

          {mensaje && <p className="notice">{mensaje}</p>}

          <button
            className="btn secondary"
            type="button"
            onClick={() => {
              setRegister((value) => !value);
              setMensaje("");
              setContrasena("");
            }}
            disabled={loading}
          >
            {register ? "Ya tengo una cuenta" : "Soy nueva, crear cuenta"}
          </button>

          {!register && (
            <section
              className="login-benefits"
              aria-label="Funciones de Aula Mágica"
            >
              <div className="login-benefits-heading">
                <span>✨</span>
                <div>
                  <strong>Todo organizado para tu jornada docente</strong>
                  <small>Continúa justo donde lo dejaste.</small>
                </div>
              </div>

              <div className="login-benefits-grid">
                <article>
                  <span>👩‍🎓</span>
                  <div>
                    <strong>Alumnos y asistencia</strong>
                    <small>Control diario en pocos pasos.</small>
                  </div>
                </article>

                <article>
                  <span>📝</span>
                  <div>
                    <strong>Notas y planificación</strong>
                    <small>Registros claros y disponibles.</small>
                  </div>
                </article>

                <article>
                  <span>📅</span>
                  <div>
                    <strong>Agenda y reuniones</strong>
                    <small>Organiza tus actividades escolares.</small>
                  </div>
                </article>

                <article>
                  <span>🧰</span>
                  <div>
                    <strong>Mi Baúl Digital</strong>
                    <small>Materiales y recursos en un solo lugar.</small>
                  </div>
                </article>
              </div>

              <div className="login-benefits-footer">
                🔐 Acceso protegido · 📱 Funciona en celular · ☁️ Datos sincronizados
              </div>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}
