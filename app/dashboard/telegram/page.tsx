"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  desvincularTelegram,
  enviarPruebaTelegram,
  generarCodigoTelegram,
  obtenerEstadoTelegram,
  type EstadoTelegram,
} from "@/lib/apps-script-api";
import { eliminarSesion, obtenerToken } from "@/lib/session";

const COMANDOS = [
  ["/inicio", "Muestra el estado de la vinculación."],
  ["/agenda", "Consulta los próximos eventos de la agenda."],
  ["/cumpleanos", "Muestra los próximos cumpleaños del curso."],
  ["/asistencia", "Consulta el resumen de asistencia de hoy."],
  ["/ayuda", "Muestra la lista de comandos disponibles."],
] as const;

function ocultarChatId(chatId: string) {
  if (!chatId) return "";
  if (chatId.length <= 5) return "•••••";
  return `${chatId.slice(0, 2)}••••${chatId.slice(-3)}`;
}

export default function TelegramPage() {
  const router = useRouter();
  const [estado, setEstado] = useState<EstadoTelegram | null>(null);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    cargarEstado();
  }, []);

  async function cargarEstado() {
    const token = obtenerToken();
    if (!token) {
      eliminarSesion();
      router.replace("/");
      return;
    }

    setCargando(true);
    try {
      setEstado(await obtenerEstadoTelegram(token));
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : "No se pudo consultar Telegram.");
    } finally {
      setCargando(false);
    }
  }

  async function crearCodigo() {
    const token = obtenerToken();
    if (!token) return;
    setProcesando(true);
    setMensaje("");
    try {
      const resultado = await generarCodigoTelegram(token);
      setEstado(resultado);
      setMensaje("Código generado. Envíalo al bot desde tu cuenta de Telegram.");
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : "No se pudo generar el código.");
    } finally {
      setProcesando(false);
    }
  }

  async function enviarPrueba() {
    const token = obtenerToken();
    if (!token) return;
    setProcesando(true);
    setMensaje("");
    try {
      await enviarPruebaTelegram(token);
      setMensaje("Mensaje de prueba enviado a Telegram.");
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : "No se pudo enviar el mensaje.");
    } finally {
      setProcesando(false);
    }
  }

  async function desvincular() {
    if (!window.confirm("¿Deseas desvincular esta cuenta de Telegram?")) return;
    const token = obtenerToken();
    if (!token) return;
    setProcesando(true);
    setMensaje("");
    try {
      setEstado(await desvincularTelegram(token));
      setMensaje("La cuenta de Telegram fue desvinculada.");
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : "No se pudo desvincular Telegram.");
    } finally {
      setProcesando(false);
    }
  }

  function abrirBot() {
    if (!estado?.botUsuario) return;
    window.open(`https://t.me/${estado.botUsuario.replace(/^@/, "")}`, "_blank", "noopener,noreferrer");
  }

  return (
    <main className="telegram-page">
      <section className="telegram-header">
        <div>
          <span className="telegram-chip">Comunicación y recordatorios</span>
          <h1>Telegram ✈️</h1>
          <p>Vincula tu cuenta para consultar agenda, asistencia y cumpleaños desde el bot.</p>
        </div>
        {estado?.botUsuario && (
          <button type="button" className="telegram-primary-button" onClick={abrirBot}>
            Abrir @{estado.botUsuario.replace(/^@/, "")}
          </button>
        )}
      </section>

      {mensaje && <div className="telegram-message">{mensaje}</div>}

      {cargando ? (
        <section className="telegram-empty"><div>✨</div><h2>Cargando Telegram...</h2></section>
      ) : !estado ? (
        <section className="telegram-empty"><div>⚠️</div><h2>No se pudo cargar el módulo</h2></section>
      ) : (
        <>
          <section className="telegram-summary">
            <article>
              <span>{estado.configurado ? "🤖" : "⚙️"}</span>
              <div><strong>{estado.configurado ? "Activo" : "Pendiente"}</strong><small>Bot configurado</small></div>
            </article>
            <article>
              <span>{estado.vinculado ? "🔗" : "🔓"}</span>
              <div><strong>{estado.vinculado ? "Sí" : "No"}</strong><small>Cuenta vinculada</small></div>
            </article>
            <article>
              <span>💬</span>
              <div><strong>{estado.vinculado ? ocultarChatId(estado.chatId) : "—"}</strong><small>Chat conectado</small></div>
            </article>
            <article>
              <span>📨</span>
              <div><strong>{COMANDOS.length}</strong><small>Comandos disponibles</small></div>
            </article>
          </section>

          {!estado.configurado ? (
            <section className="telegram-setup-card">
              <div className="telegram-big-icon">🤖</div>
              <div>
                <h2>El bot todavía no está configurado</h2>
                <p>La administradora debe abrir Google Sheets y usar el menú <strong>🎓 Aula Mágica → Configurar bot Telegram</strong>.</p>
                <p>Allí debe pegar el token entregado por BotFather y el nombre del bot.</p>
              </div>
            </section>
          ) : estado.vinculado ? (
            <section className="telegram-linked-card">
              <div className="telegram-linked-head">
                <div className="telegram-big-icon">✅</div>
                <div>
                  <span className="telegram-status-pill">CUENTA VINCULADA</span>
                  <h2>Telegram está listo</h2>
                  <p>Ya puedes escribirle al bot y usar los comandos del curso.</p>
                </div>
              </div>
              <div className="telegram-actions">
                <button type="button" className="telegram-primary-button" onClick={enviarPrueba} disabled={procesando}>
                  {procesando ? "Enviando..." : "Enviar mensaje de prueba"}
                </button>
                <button type="button" className="telegram-danger-button" onClick={desvincular} disabled={procesando}>
                  Desvincular cuenta
                </button>
              </div>
            </section>
          ) : (
            <section className="telegram-link-card">
              <div>
                <span className="telegram-step">PASO 1</span>
                <h2>Genera un código de vinculación</h2>
                <p>El código dura 30 minutos y solamente puede usarse una vez.</p>
              </div>

              {estado.codigo ? (
                <div className="telegram-code-box">
                  <span>Tu código</span>
                  <strong>{estado.codigo}</strong>
                  <p>Envía al bot:</p>
                  <code>/vincular {estado.codigo}</code>
                </div>
              ) : (
                <button type="button" className="telegram-primary-button" onClick={crearCodigo} disabled={procesando}>
                  {procesando ? "Generando..." : "Generar código"}
                </button>
              )}

              {estado.codigo && (
                <div className="telegram-link-actions">
                  <button type="button" className="telegram-primary-button" onClick={abrirBot}>Abrir Telegram</button>
                  <button type="button" className="telegram-secondary-button" onClick={crearCodigo} disabled={procesando}>Generar otro código</button>
                  <button type="button" className="telegram-secondary-button" onClick={cargarEstado}>Comprobar vinculación</button>
                </div>
              )}
            </section>
          )}

          <section className="telegram-commands">
            <div className="telegram-commands-title">
              <span>📱</span>
              <div><h2>Comandos del bot</h2><p>Disponibles después de vincular la cuenta.</p></div>
            </div>
            <div className="telegram-command-grid">
              {COMANDOS.map(([comando, descripcion]) => (
                <article key={comando}>
                  <code>{comando}</code>
                  <p>{descripcion}</p>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
