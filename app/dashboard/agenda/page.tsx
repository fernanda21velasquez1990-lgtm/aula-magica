"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  eliminarEventoAgenda,
  guardarEventoAgenda,
  listarAgenda,
  type DatosEventoAgenda,
  type EventoAgenda,
} from "@/lib/apps-script-api";
import { eliminarSesion, obtenerToken } from "@/lib/session";

const TIPOS = ["CLASE", "ACTIVIDAD", "RECORDATORIO", "ENTREGA", "OTRO"] as const;
const ESTADOS = ["PENDIENTE", "COMPLETADO", "CANCELADO"] as const;

const formularioInicial: DatosEventoAgenda = {
  titulo: "",
  tipo: "ACTIVIDAD",
  fecha: new Date().toISOString().slice(0, 10),
  hora: "08:00",
  descripcion: "",
  estado: "PENDIENTE",
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

function iconoTipo(tipo: string) {
  const iconos: Record<string, string> = {
    CLASE: "📚",
    ACTIVIDAD: "🎨",
    RECORDATORIO: "🔔",
    ENTREGA: "📦",
    OTRO: "📌",
  };
  return iconos[tipo] || "📌";
}

function hoyTexto() {
  return new Date().toISOString().slice(0, 10);
}

function fechaDentroDeDias(fecha: string, dias: number) {
  const inicio = new Date(`${hoyTexto()}T00:00:00`);
  const fin = new Date(inicio);
  fin.setDate(fin.getDate() + dias);
  const valor = new Date(`${fecha}T00:00:00`);
  return valor >= inicio && valor <= fin;
}

export default function AgendaPage() {
  const router = useRouter();
  const [eventos, setEventos] = useState<EventoAgenda[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [tipo, setTipo] = useState("");
  const [estado, setEstado] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formulario, setFormulario] = useState<DatosEventoAgenda>(formularioInicial);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    cargarAgenda();
  }, []);

  async function cargarAgenda() {
    const token = obtenerToken();
    if (!token) {
      eliminarSesion();
      router.replace("/");
      return;
    }

    setCargando(true);
    try {
      setEventos(await listarAgenda(token));
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : "No se pudo cargar la agenda.");
    } finally {
      setCargando(false);
    }
  }

  function abrirNuevo() {
    setFormulario({ ...formularioInicial, fecha: hoyTexto() });
    setMensaje("");
    setMostrarFormulario(true);
  }

  function abrirEdicion(evento: EventoAgenda) {
    setFormulario({
      idEvento: evento.idEvento,
      titulo: evento.titulo,
      tipo: evento.tipo,
      fecha: evento.fecha,
      hora: evento.hora,
      descripcion: evento.descripcion,
      estado: evento.estado,
    });
    setMensaje("");
    setMostrarFormulario(true);
  }

  function actualizarCampo(campo: keyof DatosEventoAgenda, valor: string) {
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
      await guardarEventoAgenda(token, formulario);
      setMostrarFormulario(false);
      setMensaje(
        formulario.idEvento
          ? "Evento actualizado correctamente."
          : "Evento registrado correctamente."
      );
      await cargarAgenda();
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : "No se pudo guardar el evento.");
    } finally {
      setGuardando(false);
    }
  }

  async function borrarEvento(evento: EventoAgenda) {
    const confirmado = window.confirm(`¿Deseas eliminar “${evento.titulo}”?`);
    if (!confirmado) return;

    const token = obtenerToken();
    if (!token) {
      eliminarSesion();
      router.replace("/");
      return;
    }

    try {
      await eliminarEventoAgenda(token, evento.idEvento);
      setMensaje("Evento eliminado correctamente.");
      await cargarAgenda();
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : "No se pudo eliminar el evento.");
    }
  }

  const eventosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return eventos.filter((evento) => {
      const coincideTexto =
        !texto ||
        [evento.titulo, evento.tipo, evento.descripcion]
          .join(" ")
          .toLowerCase()
          .includes(texto);
      const coincideTipo = !tipo || evento.tipo === tipo;
      const coincideEstado = !estado || evento.estado === estado;
      return coincideTexto && coincideTipo && coincideEstado;
    });
  }, [busqueda, estado, eventos, tipo]);

  const resumen = useMemo(
    () => ({
      total: eventos.length,
      hoy: eventos.filter((evento) => evento.fecha === hoyTexto()).length,
      proximos: eventos.filter(
        (evento) => evento.estado === "PENDIENTE" && fechaDentroDeDias(evento.fecha, 7)
      ).length,
      completados: eventos.filter((evento) => evento.estado === "COMPLETADO").length,
    }),
    [eventos]
  );

  return (
    <main className="agenda-page">
      <section className="agenda-header">
        <div>
          <span className="agenda-chip">Organización diaria</span>
          <h1>Agenda 📅</h1>
          <p>Registra clases, actividades, entregas y recordatorios importantes.</p>
        </div>
        <button type="button" className="agenda-primary-button" onClick={abrirNuevo}>
          + Nuevo evento
        </button>
      </section>

      <section className="agenda-summary">
        <article><span>📒</span><div><strong>{resumen.total}</strong><small>Total</small></div></article>
        <article><span>📅</span><div><strong>{resumen.hoy}</strong><small>Para hoy</small></div></article>
        <article><span>⏰</span><div><strong>{resumen.proximos}</strong><small>Próximos 7 días</small></div></article>
        <article><span>✅</span><div><strong>{resumen.completados}</strong><small>Completados</small></div></article>
      </section>

      <section className="agenda-filters">
        <input
          type="search"
          placeholder="Buscar título, tipo o descripción..."
          value={busqueda}
          onChange={(event) => setBusqueda(event.target.value)}
        />
        <select value={tipo} onChange={(event) => setTipo(event.target.value)}>
          <option value="">Todos los tipos</option>
          {TIPOS.map((opcion) => <option key={opcion} value={opcion}>{opcion}</option>)}
        </select>
        <select value={estado} onChange={(event) => setEstado(event.target.value)}>
          <option value="">Todos los estados</option>
          {ESTADOS.map((opcion) => <option key={opcion} value={opcion}>{opcion}</option>)}
        </select>
      </section>

      {mensaje && <div className="agenda-message">{mensaje}</div>}

      {cargando ? (
        <section className="agenda-empty"><div>✨</div><h2>Cargando agenda...</h2></section>
      ) : eventosFiltrados.length === 0 ? (
        <section className="agenda-empty">
          <div>📅</div>
          <h2>{eventos.length ? "No hay coincidencias" : "Tu agenda está vacía"}</h2>
          <p>{eventos.length ? "Prueba otros filtros." : "Pulsa «Nuevo evento» para comenzar."}</p>
        </section>
      ) : (
        <section className="agenda-list">
          {eventosFiltrados.map((evento) => (
            <article className="agenda-card" key={evento.idEvento}>
              <div className="agenda-card-head">
                <div className="agenda-icon">{iconoTipo(evento.tipo)}</div>
                <div>
                  <h2>{evento.titulo}</h2>
                  <p>📅 {fechaLegible(evento.fecha)} · 🕐 {evento.hora || "Sin hora"}</p>
                </div>
                <span className={`agenda-status ${evento.estado.toLowerCase()}`}>
                  {evento.estado}
                </span>
              </div>

              <div className="agenda-meta">
                <span>{iconoTipo(evento.tipo)} {evento.tipo}</span>
              </div>

              <div className="agenda-description">
                <strong>Descripción</strong>
                <p>{evento.descripcion || "Sin descripción."}</p>
              </div>

              <div className="agenda-actions">
                <button type="button" onClick={() => abrirEdicion(evento)}>Editar</button>
                <button type="button" className="delete" onClick={() => borrarEvento(evento)}>Eliminar</button>
              </div>
            </article>
          ))}
        </section>
      )}

      {mostrarFormulario && (
        <div className="agenda-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !guardando) setMostrarFormulario(false);
        }}>
          <section className="agenda-modal">
            <div className="agenda-modal-header">
              <div>
                <span className="agenda-chip">Calendario escolar</span>
                <h2>{formulario.idEvento ? "Editar evento" : "Nuevo evento"}</h2>
              </div>
              <button type="button" className="agenda-close" onClick={() => setMostrarFormulario(false)} disabled={guardando}>×</button>
            </div>

            <form onSubmit={enviarFormulario}>
              <div className="agenda-form-grid">
                <label className="full">Título *
                  <input required value={formulario.titulo} onChange={(event) => actualizarCampo("titulo", event.target.value)} />
                </label>
                <label>Tipo *
                  <select required value={formulario.tipo} onChange={(event) => actualizarCampo("tipo", event.target.value)}>
                    {TIPOS.map((opcion) => <option key={opcion} value={opcion}>{opcion}</option>)}
                  </select>
                </label>
                <label>Estado *
                  <select required value={formulario.estado} onChange={(event) => actualizarCampo("estado", event.target.value)}>
                    {ESTADOS.map((opcion) => <option key={opcion} value={opcion}>{opcion}</option>)}
                  </select>
                </label>
                <label>Fecha *
                  <input type="date" required value={formulario.fecha} onChange={(event) => actualizarCampo("fecha", event.target.value)} />
                </label>
                <label>Hora *
                  <input type="time" required value={formulario.hora} onChange={(event) => actualizarCampo("hora", event.target.value)} />
                </label>
                <label className="full">Descripción
                  <textarea rows={5} value={formulario.descripcion} onChange={(event) => actualizarCampo("descripcion", event.target.value)} />
                </label>
              </div>

              <div className="agenda-form-actions">
                <button type="button" className="agenda-secondary-button" onClick={() => setMostrarFormulario(false)} disabled={guardando}>Cancelar</button>
                <button type="submit" className="agenda-primary-button" disabled={guardando}>
                  {guardando ? "Guardando..." : formulario.idEvento ? "Guardar cambios" : "Registrar evento"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
