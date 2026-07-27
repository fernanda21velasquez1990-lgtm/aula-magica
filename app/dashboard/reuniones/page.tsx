"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  eliminarReunion,
  guardarReunion,
  listarReuniones,
  type DatosReunion,
  type Reunion,
} from "@/lib/apps-script-api";
import { eliminarSesion, obtenerToken } from "@/lib/session";

const ESTADOS = ["PROGRAMADA", "REALIZADA", "CANCELADA"] as const;

const formularioInicial: DatosReunion = {
  titulo: "",
  fecha: new Date().toISOString().slice(0, 10),
  hora: "08:00",
  lugar: "",
  participantes: "",
  temas: "",
  acuerdos: "",
  estado: "PROGRAMADA",
};

function fechaLegible(fecha: string) {
  if (!fecha) return "Fecha pendiente";
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${fecha}T12:00:00`));
}

function esHoy(fecha: string) {
  return fecha === new Date().toISOString().slice(0, 10);
}

function esProxima(reunion: Reunion) {
  const hoy = new Date().toISOString().slice(0, 10);
  return reunion.estado === "PROGRAMADA" && reunion.fecha >= hoy;
}

export default function ReunionesPage() {
  const router = useRouter();
  const [reuniones, setReuniones] = useState<Reunion[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formulario, setFormulario] = useState<DatosReunion>(formularioInicial);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date | null>(null);
  const [mostrarSincronizacion, setMostrarSincronizacion] = useState(false);
  const temporizadorSincronizacionRef = useRef<number | null>(null);
  const formularioRef = useRef(false);
  const guardandoRef = useRef(false);

  useEffect(() => {
    formularioRef.current = mostrarFormulario;
  }, [mostrarFormulario]);

  useEffect(() => {
    guardandoRef.current = guardando;
  }, [guardando]);

  useEffect(() => {
    return () => {
      if (temporizadorSincronizacionRef.current !== null) {
        window.clearTimeout(temporizadorSincronizacionRef.current);
      }
    };
  }, []);

  const cargarReuniones = useCallback(async (silencioso = false) => {
    const token = obtenerToken();
    if (!token) {
      eliminarSesion();
      router.replace("/");
      return;
    }

    if (!silencioso) setCargando(true);
    try {
      setReuniones(await listarReuniones(token));
      setUltimaActualizacion(new Date());

      if (!silencioso) {
        setMostrarSincronizacion(true);

        if (temporizadorSincronizacionRef.current !== null) {
          window.clearTimeout(temporizadorSincronizacionRef.current);
        }

        temporizadorSincronizacionRef.current = window.setTimeout(() => {
          setMostrarSincronizacion(false);
          temporizadorSincronizacionRef.current = null;
        }, 3000);
      }
    } catch (error) {
      if (!silencioso) {
        setMensaje(
          error instanceof Error ? error.message : "No se pudieron cargar las reuniones."
        );
      }
    } finally {
      if (!silencioso) setCargando(false);
    }
  }, [router]);

  useEffect(() => {
    void cargarReuniones();
  }, [cargarReuniones]);

  useEffect(() => {
    const actualizar = () => {
      if (
        document.visibilityState === "visible" &&
        !formularioRef.current &&
        !guardandoRef.current
      ) {
        void cargarReuniones(true);
      }
    };

    const intervalo = window.setInterval(actualizar, 10_000);
    window.addEventListener("focus", actualizar);
    document.addEventListener("visibilitychange", actualizar);

    return () => {
      window.clearInterval(intervalo);
      window.removeEventListener("focus", actualizar);
      document.removeEventListener("visibilitychange", actualizar);
    };
  }, [cargarReuniones]);

  function abrirNueva() {
    setFormulario({ ...formularioInicial, fecha: new Date().toISOString().slice(0, 10) });
    setMensaje("");
    setMostrarFormulario(true);
  }

  function abrirEdicion(reunion: Reunion) {
    setFormulario({
      idReunion: reunion.idReunion,
      titulo: reunion.titulo,
      fecha: reunion.fecha,
      hora: reunion.hora,
      lugar: reunion.lugar,
      participantes: reunion.participantes,
      temas: reunion.temas,
      acuerdos: reunion.acuerdos,
      estado: reunion.estado,
    });
    setMensaje("");
    setMostrarFormulario(true);
  }

  function actualizarCampo(campo: keyof DatosReunion, valor: string) {
    setFormulario((anterior) => ({ ...anterior, [campo]: valor }));
  }

  async function enviarFormulario(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = obtenerToken();
    if (!token) {
      eliminarSesion();
      router.replace("/");
      return;
    }

    setGuardando(true);
    setMensaje("");
    try {
      await guardarReunion(token, formulario);
      setMostrarFormulario(false);
      setMensaje(
        formulario.idReunion
          ? "Reunión actualizada correctamente."
          : "Reunión registrada correctamente."
      );
      await cargarReuniones();
    } catch (error) {
      setMensaje(
        error instanceof Error ? error.message : "No se pudo guardar la reunión."
      );
    } finally {
      setGuardando(false);
    }
  }

  async function borrarReunion(reunion: Reunion) {
    const confirmado = window.confirm(`¿Deseas eliminar la reunión “${reunion.titulo}”?`);
    if (!confirmado) return;

    const token = obtenerToken();
    if (!token) {
      eliminarSesion();
      router.replace("/");
      return;
    }

    try {
      await eliminarReunion(token, reunion.idReunion);
      setMensaje("Reunión eliminada correctamente.");
      await cargarReuniones();
    } catch (error) {
      setMensaje(
        error instanceof Error ? error.message : "No se pudo eliminar la reunión."
      );
    }
  }

  const reunionesFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return reuniones.filter((reunion) => {
      const coincideTexto =
        !texto ||
        [
          reunion.titulo,
          reunion.lugar,
          reunion.participantes,
          reunion.temas,
          reunion.acuerdos,
        ]
          .join(" ")
          .toLowerCase()
          .includes(texto);
      const coincideEstado = !estado || reunion.estado === estado;
      return coincideTexto && coincideEstado;
    });
  }, [busqueda, estado, reuniones]);

  const resumen = useMemo(
    () => ({
      total: reuniones.length,
      proximas: reuniones.filter(esProxima).length,
      realizadas: reuniones.filter((reunion) => reunion.estado === "REALIZADA").length,
      hoy: reuniones.filter((reunion) => esHoy(reunion.fecha)).length,
    }),
    [reuniones]
  );

  return (
    <main className="meetings-page">
      <section className="meetings-header">
        <div>
          <span className="meetings-chip">Organización y acuerdos</span>
          <h1>Reuniones 🤝</h1>
          <p>Registra encuentros, participantes, temas tratados y acuerdos.</p>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            type="button"
            className="meetings-primary-button"
            onClick={() => void cargarReuniones()}
            disabled={cargando || guardando}
          >
            🔄 Actualizar
          </button>
          <button type="button" className="meetings-primary-button" onClick={abrirNueva}>
            + Nueva reunión
          </button>
        </div>
      </section>

      <section className="meetings-summary">
        <article><span>📒</span><div><strong>{resumen.total}</strong><small>Total</small></div></article>
        <article><span>⏰</span><div><strong>{resumen.proximas}</strong><small>Próximas</small></div></article>
        <article><span>✅</span><div><strong>{resumen.realizadas}</strong><small>Realizadas</small></div></article>
        <article><span>📅</span><div><strong>{resumen.hoy}</strong><small>Para hoy</small></div></article>
      </section>

      <section className="meetings-filters">
        <input
          type="search"
          placeholder="Buscar título, participante, lugar o tema..."
          value={busqueda}
          onChange={(event) => setBusqueda(event.target.value)}
        />
        <select value={estado} onChange={(event) => setEstado(event.target.value)}>
          <option value="">Todos los estados</option>
          {ESTADOS.map((opcion) => <option key={opcion} value={opcion}>{opcion}</option>)}
        </select>
      </section>

      {mostrarSincronizacion && ultimaActualizacion && !mensaje && (
        <div className="meetings-message" role="status" aria-live="polite">
          ✅ Datos actualizados correctamente a las{" "}
          {ultimaActualizacion.toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </div>
      )}

      {mensaje && <div className="meetings-message">{mensaje}</div>}

      {cargando ? (
        <section className="meetings-empty"><div>✨</div><h2>Cargando reuniones...</h2></section>
      ) : reunionesFiltradas.length === 0 ? (
        <section className="meetings-empty">
          <div>🤝</div>
          <h2>{reuniones.length ? "No hay coincidencias" : "Todavía no tienes reuniones"}</h2>
          <p>{reuniones.length ? "Prueba otro término o estado." : "Pulsa «Nueva reunión» para crear la primera."}</p>
        </section>
      ) : (
        <section className="meetings-list">
          {reunionesFiltradas.map((reunion) => (
            <article className="meeting-card" key={reunion.idReunion}>
              <div className="meeting-card-head">
                <div className="meeting-icon">🤝</div>
                <div>
                  <h2>{reunion.titulo}</h2>
                  <p>📅 {fechaLegible(reunion.fecha)} · 🕐 {reunion.hora || "Sin hora"}</p>
                </div>
                <span className={`meeting-status ${reunion.estado.toLowerCase()}`}>
                  {reunion.estado}
                </span>
              </div>

              <div className="meeting-meta">
                <span>📍 {reunion.lugar || "Lugar sin indicar"}</span>
                <span>👥 {reunion.participantes || "Participantes sin indicar"}</span>
              </div>

              <div className="meeting-details">
                <div><strong>Temas</strong><p>{reunion.temas || "Sin temas registrados."}</p></div>
                <div><strong>Acuerdos</strong><p>{reunion.acuerdos || "Sin acuerdos registrados."}</p></div>
              </div>

              <div className="meeting-actions">
                <button type="button" onClick={() => abrirEdicion(reunion)}>Editar</button>
                <button type="button" className="delete" onClick={() => borrarReunion(reunion)}>Eliminar</button>
              </div>
            </article>
          ))}
        </section>
      )}

      {mostrarFormulario && (
        <div className="meetings-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !guardando) setMostrarFormulario(false);
        }}>
          <section className="meetings-modal">
            <div className="meetings-modal-header">
              <div>
                <span className="meetings-chip">Registro de encuentro</span>
                <h2>{formulario.idReunion ? "Editar reunión" : "Nueva reunión"}</h2>
              </div>
              <button type="button" className="meetings-close" onClick={() => setMostrarFormulario(false)} disabled={guardando}>×</button>
            </div>

            <form onSubmit={enviarFormulario}>
              <div className="meetings-form-grid">
                <label className="full">Título *
                  <input required value={formulario.titulo} onChange={(event) => actualizarCampo("titulo", event.target.value)} />
                </label>
                <label>Fecha *
                  <input type="date" required value={formulario.fecha} onChange={(event) => actualizarCampo("fecha", event.target.value)} />
                </label>
                <label>Hora *
                  <input type="time" required value={formulario.hora} onChange={(event) => actualizarCampo("hora", event.target.value)} />
                </label>
                <label>Lugar
                  <input value={formulario.lugar} onChange={(event) => actualizarCampo("lugar", event.target.value)} />
                </label>
                <label>Estado
                  <select value={formulario.estado} onChange={(event) => actualizarCampo("estado", event.target.value)}>
                    {ESTADOS.map((opcion) => <option key={opcion} value={opcion}>{opcion}</option>)}
                  </select>
                </label>
                <label className="full">Participantes *
                  <input required placeholder="Ejemplo: representantes de 1.º A" value={formulario.participantes} onChange={(event) => actualizarCampo("participantes", event.target.value)} />
                </label>
                <label className="full">Temas tratados *
                  <textarea required rows={4} value={formulario.temas} onChange={(event) => actualizarCampo("temas", event.target.value)} />
                </label>
                <label className="full">Acuerdos
                  <textarea rows={4} value={formulario.acuerdos} onChange={(event) => actualizarCampo("acuerdos", event.target.value)} />
                </label>
              </div>

              <div className="meetings-form-actions">
                <button type="button" className="meetings-secondary-button" onClick={() => setMostrarFormulario(false)} disabled={guardando}>Cancelar</button>
                <button type="submit" className="meetings-primary-button" disabled={guardando}>
                  {guardando ? "Guardando..." : formulario.idReunion ? "Guardar cambios" : "Registrar reunión"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
