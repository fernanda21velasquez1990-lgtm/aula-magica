"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  eliminarCalendarioEscolar,
  guardarCalendarioEscolar,
  listarCalendarioEscolar,
  type CalendarioEscolar,
  type DatosCalendarioEscolar,
  type TipoCalendarioEscolar,
} from "@/lib/apps-script-api";
import { eliminarSesion, obtenerToken } from "@/lib/session";

const TIPOS: Array<{
  valor: TipoCalendarioEscolar;
  etiqueta: string;
  icono: string;
}> = [
  { valor: "CLASE", etiqueta: "Clase especial", icono: "📘" },
  { valor: "EVALUACION", etiqueta: "Evaluación", icono: "📝" },
  { valor: "REUNION", etiqueta: "Reunión", icono: "🤝" },
  { valor: "FERIADO", etiqueta: "Feriado", icono: "🎉" },
  { valor: "EVENTO", etiqueta: "Evento", icono: "🎪" },
  { valor: "ENTREGA", etiqueta: "Entrega", icono: "📦" },
];

function hoy() {
  const fecha = new Date();
  const local = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function formularioVacio(): DatosCalendarioEscolar {
  return {
    titulo: "",
    tipo: "EVENTO",
    fechaInicio: hoy(),
    fechaFin: hoy(),
    hora: "",
    lugar: "",
    descripcion: "",
    recordatorio: "1_DIA",
    estado: "ACTIVO",
  };
}

function fechaBonita(fecha: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${fecha}T12:00:00`));
}

export default function CalendarioEscolarPage() {
  const router = useRouter();
  const [eventos, setEventos] = useState<CalendarioEscolar[]>([]);
  const [formulario, setFormulario] =
    useState<DatosCalendarioEscolar>(formularioVacio);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mes, setMes] = useState(hoy().slice(0, 7));
  const [tipo, setTipo] = useState("TODOS");
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  async function cargar() {
    const token = obtenerToken();
    if (!token) {
      eliminarSesion();
      router.replace("/");
      return;
    }

    setCargando(true);
    setMensaje("");

    try {
      setEventos(await listarCalendarioEscolar(token));
    } catch (error) {
      setMensaje(
        error instanceof Error
          ? error.message
          : "No se pudo abrir el calendario escolar."
      );
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    void cargar();
  }, []);

  async function guardar(event: FormEvent) {
    event.preventDefault();
    const token = obtenerToken();
    if (!token) return;

    setGuardando(true);
    setMensaje("");

    try {
      await guardarCalendarioEscolar(token, formulario);
      setMensaje("✅ Actividad guardada correctamente.");
      setFormulario(formularioVacio());
      setMostrarFormulario(false);
      await cargar();
    } catch (error) {
      setMensaje(
        error instanceof Error
          ? error.message
          : "No se pudo guardar la actividad."
      );
    } finally {
      setGuardando(false);
    }
  }

  function editar(evento: CalendarioEscolar) {
    setFormulario(evento);
    setMostrarFormulario(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function eliminar(evento: CalendarioEscolar) {
    if (!window.confirm(`¿Eliminar "${evento.titulo}"?`)) return;

    const token = obtenerToken();
    if (!token) return;

    try {
      await eliminarCalendarioEscolar(token, evento.idCalendario);
      setMensaje("🗑️ Actividad eliminada.");
      await cargar();
    } catch (error) {
      setMensaje(
        error instanceof Error ? error.message : "No se pudo eliminar."
      );
    }
  }

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return eventos.filter((evento) => {
      if (!evento.fechaInicio.startsWith(mes)) return false;
      if (tipo !== "TODOS" && evento.tipo !== tipo) return false;

      if (!texto) return true;

      return [
        evento.titulo,
        evento.descripcion,
        evento.lugar,
        evento.tipo,
      ]
        .join(" ")
        .toLowerCase()
        .includes(texto);
    });
  }, [busqueda, eventos, mes, tipo]);

  const agrupados = useMemo(() => {
    return visibles.reduce<Record<string, CalendarioEscolar[]>>(
      (resultado, evento) => {
        const clave = evento.fechaInicio;
        resultado[clave] = resultado[clave] || [];
        resultado[clave].push(evento);
        return resultado;
      },
      {}
    );
  }, [visibles]);

  const proximos = eventos.filter(
    (evento) => evento.fechaInicio >= hoy()
  ).length;

  return (
    <main className="school-page">
      <section className="school-hero calendar">
        <div>
          <span className="school-chip">Organización escolar · Versión 9.0</span>
          <h1>Calendario escolar 🏫</h1>
          <p>
            Organiza evaluaciones, feriados, reuniones y actividades importantes.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setFormulario(formularioVacio());
            setMostrarFormulario(true);
          }}
        >
          ➕ Nueva actividad
        </button>
      </section>

      <section className="school-stats">
        <article><span>📅</span><strong>{eventos.length}</strong><small>Total</small></article>
        <article><span>🔔</span><strong>{proximos}</strong><small>Próximas</small></article>
        <article><span>📝</span><strong>{eventos.filter(e => e.tipo === "EVALUACION").length}</strong><small>Evaluaciones</small></article>
        <article><span>🎉</span><strong>{eventos.filter(e => e.tipo === "FERIADO").length}</strong><small>Feriados</small></article>
      </section>

      <section className="school-filters">
        <label>
          Mes
          <input type="month" value={mes} onChange={(e) => setMes(e.target.value)} />
        </label>
        <label>
          Categoría
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="TODOS">Todas</option>
            {TIPOS.map((item) => (
              <option key={item.valor} value={item.valor}>
                {item.etiqueta}
              </option>
            ))}
          </select>
        </label>
        <label className="wide">
          Buscar
          <input
            type="search"
            placeholder="Título, lugar o descripción..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </label>
        <button type="button" onClick={() => void cargar()}>🔄 Actualizar</button>
      </section>

      {mensaje && <div className="school-message">{mensaje}</div>}

      {mostrarFormulario && (
        <form className="school-form" onSubmit={guardar}>
          <header>
            <div>
              <h2>
                {formulario.idCalendario
                  ? "Editar actividad"
                  : "Nueva actividad escolar"}
              </h2>
              <p>Completa la información y guarda.</p>
            </div>
            <button type="button" onClick={() => setMostrarFormulario(false)}>
              ×
            </button>
          </header>

          <div className="school-form-grid">
            <label className="wide">
              Título
              <input
                required
                value={formulario.titulo}
                onChange={(e) =>
                  setFormulario({ ...formulario, titulo: e.target.value })
                }
              />
            </label>

            <label>
              Tipo
              <select
                value={formulario.tipo}
                onChange={(e) =>
                  setFormulario({
                    ...formulario,
                    tipo: e.target.value as TipoCalendarioEscolar,
                  })
                }
              >
                {TIPOS.map((item) => (
                  <option key={item.valor} value={item.valor}>
                    {item.icono} {item.etiqueta}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Hora
              <input
                type="time"
                value={formulario.hora}
                onChange={(e) =>
                  setFormulario({ ...formulario, hora: e.target.value })
                }
              />
            </label>

            <label>
              Fecha inicial
              <input
                required
                type="date"
                value={formulario.fechaInicio}
                onChange={(e) =>
                  setFormulario({
                    ...formulario,
                    fechaInicio: e.target.value,
                    fechaFin:
                      formulario.fechaFin < e.target.value
                        ? e.target.value
                        : formulario.fechaFin,
                  })
                }
              />
            </label>

            <label>
              Fecha final
              <input
                required
                type="date"
                min={formulario.fechaInicio}
                value={formulario.fechaFin}
                onChange={(e) =>
                  setFormulario({ ...formulario, fechaFin: e.target.value })
                }
              />
            </label>

            <label>
              Lugar
              <input
                value={formulario.lugar}
                onChange={(e) =>
                  setFormulario({ ...formulario, lugar: e.target.value })
                }
              />
            </label>

            <label>
              Recordatorio
              <select
                value={formulario.recordatorio}
                onChange={(e) =>
                  setFormulario({
                    ...formulario,
                    recordatorio: e.target.value,
                  })
                }
              >
                <option value="SIN_AVISO">Sin aviso</option>
                <option value="MISMO_DIA">El mismo día</option>
                <option value="1_DIA">1 día antes</option>
                <option value="3_DIAS">3 días antes</option>
                <option value="1_SEMANA">1 semana antes</option>
              </select>
            </label>

            <label className="wide">
              Descripción
              <textarea
                rows={3}
                value={formulario.descripcion}
                onChange={(e) =>
                  setFormulario({
                    ...formulario,
                    descripcion: e.target.value,
                  })
                }
              />
            </label>
          </div>

          <div className="school-form-actions">
            <button type="button" onClick={() => setMostrarFormulario(false)}>
              Cancelar
            </button>
            <button className="primary" disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar actividad"}
            </button>
          </div>
        </form>
      )}

      {cargando ? (
        <section className="school-empty">✨ Cargando calendario...</section>
      ) : Object.keys(agrupados).length === 0 ? (
        <section className="school-empty">
          <span>🏫</span>
          <h2>No hay actividades en este mes</h2>
          <p>Crea la primera actividad escolar.</p>
        </section>
      ) : (
        <section className="calendar-timeline">
          {Object.entries(agrupados).map(([fecha, items]) => (
            <article className="calendar-day" key={fecha}>
              <div className="calendar-date">
                <strong>
                  {new Date(`${fecha}T12:00:00`).getDate()}
                </strong>
                <span>{fechaBonita(fecha)}</span>
              </div>

              <div className="calendar-events">
                {items.map((evento) => {
                  const tipoInfo =
                    TIPOS.find((item) => item.valor === evento.tipo) ||
                    TIPOS[4];

                  return (
                    <div
                      className={`calendar-event type-${evento.tipo.toLowerCase()}`}
                      key={evento.idCalendario}
                    >
                      <span className="calendar-event-icon">
                        {tipoInfo.icono}
                      </span>
                      <div>
                        <small>
                          {tipoInfo.etiqueta}
                          {evento.hora ? ` · ${evento.hora}` : ""}
                        </small>
                        <h3>{evento.titulo}</h3>
                        <p>{evento.descripcion || "Sin descripción"}</p>
                        {evento.lugar && <b>📍 {evento.lugar}</b>}
                      </div>
                      <div className="calendar-event-actions">
                        <button onClick={() => editar(evento)}>✏️</button>
                        <button onClick={() => void eliminar(evento)}>🗑️</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
