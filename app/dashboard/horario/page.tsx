"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  eliminarHorarioSemanal,
  guardarHorarioSemanal,
  listarHorarioSemanal,
  type DatosHorarioSemanal,
  type DiaHorario,
  type HorarioSemanal,
} from "@/lib/apps-script-api";
import { eliminarSesion, obtenerMaestra, obtenerToken } from "@/lib/session";

const DIAS: Array<{ valor: DiaHorario; etiqueta: string }> = [
  { valor: "LUNES", etiqueta: "Lunes" },
  { valor: "MARTES", etiqueta: "Martes" },
  { valor: "MIERCOLES", etiqueta: "Miércoles" },
  { valor: "JUEVES", etiqueta: "Jueves" },
  { valor: "VIERNES", etiqueta: "Viernes" },
  { valor: "SABADO", etiqueta: "Sábado" },
  { valor: "DOMINGO", etiqueta: "Domingo" },
];

const COLORES = [
  "#ff8fc7",
  "#8d78ef",
  "#49b8d1",
  "#4fc890",
  "#f6b84b",
  "#f17b72",
  "#7aa7ff",
];

function formularioVacio(): DatosHorarioSemanal {
  const maestra = obtenerMaestra();

  return {
    dia: "LUNES",
    horaInicio: "08:00",
    horaFin: "09:00",
    asignatura: "",
    grado: maestra?.grado || "",
    seccion: maestra?.seccion || "",
    aula: "",
    color: COLORES[0],
    notas: "",
    estado: "ACTIVO",
  };
}

export default function HorarioSemanalPage() {
  const router = useRouter();
  const [clases, setClases] = useState<HorarioSemanal[]>([]);
  const [formulario, setFormulario] =
    useState<DatosHorarioSemanal>(formularioVacio);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
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
      setClases(await listarHorarioSemanal(token));
    } catch (error) {
      setMensaje(
        error instanceof Error
          ? error.message
          : "No se pudo abrir el horario semanal."
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
      await guardarHorarioSemanal(token, formulario);
      setMensaje("✅ Clase guardada correctamente.");
      setFormulario(formularioVacio());
      setMostrarFormulario(false);
      await cargar();
    } catch (error) {
      setMensaje(
        error instanceof Error
          ? error.message
          : "No se pudo guardar la clase."
      );
    } finally {
      setGuardando(false);
    }
  }

  function editar(clase: HorarioSemanal) {
    setFormulario(clase);
    setMostrarFormulario(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function eliminar(clase: HorarioSemanal) {
    if (!window.confirm(`¿Eliminar la clase de ${clase.asignatura}?`)) {
      return;
    }

    const token = obtenerToken();
    if (!token) return;

    try {
      await eliminarHorarioSemanal(token, clase.idHorario);
      setMensaje("🗑️ Clase eliminada.");
      await cargar();
    } catch (error) {
      setMensaje(
        error instanceof Error ? error.message : "No se pudo eliminar."
      );
    }
  }

  const porDia = useMemo(() => {
    const resultado: Record<DiaHorario, HorarioSemanal[]> = {
      LUNES: [],
      MARTES: [],
      MIERCOLES: [],
      JUEVES: [],
      VIERNES: [],
      SABADO: [],
      DOMINGO: [],
    };

    clases.forEach((clase) => resultado[clase.dia].push(clase));
    return resultado;
  }, [clases]);

  const horasTotales = useMemo(() => {
    return clases.reduce((total, clase) => {
      const [hi, mi] = clase.horaInicio.split(":").map(Number);
      const [hf, mf] = clase.horaFin.split(":").map(Number);
      return total + Math.max(0, hf + mf / 60 - hi - mi / 60);
    }, 0);
  }, [clases]);

  return (
    <main className="school-page">
      <section className="school-hero schedule">
        <div>
          <span className="school-chip">Organización escolar · Versión 9.0</span>
          <h1>Horario semanal 🗓️</h1>
          <p>
            Distribuye tus asignaturas por día y hora con una vista clara.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setFormulario(formularioVacio());
            setMostrarFormulario(true);
          }}
        >
          ➕ Nueva clase
        </button>
      </section>

      <section className="school-stats">
        <article><span>📚</span><strong>{clases.length}</strong><small>Clases</small></article>
        <article><span>⏱️</span><strong>{horasTotales.toFixed(1)}</strong><small>Horas semanales</small></article>
        <article><span>🎨</span><strong>{new Set(clases.map(c => c.asignatura)).size}</strong><small>Asignaturas</small></article>
        <article><span>🏫</span><strong>{new Set(clases.map(c => c.aula).filter(Boolean)).size}</strong><small>Aulas</small></article>
      </section>

      {mensaje && <div className="school-message">{mensaje}</div>}

      {mostrarFormulario && (
        <form className="school-form" onSubmit={guardar}>
          <header>
            <div>
              <h2>
                {formulario.idHorario ? "Editar clase" : "Nueva clase"}
              </h2>
              <p>Define el día, horario y asignatura.</p>
            </div>
            <button type="button" onClick={() => setMostrarFormulario(false)}>
              ×
            </button>
          </header>

          <div className="school-form-grid">
            <label>
              Día
              <select
                value={formulario.dia}
                onChange={(e) =>
                  setFormulario({
                    ...formulario,
                    dia: e.target.value as DiaHorario,
                  })
                }
              >
                {DIAS.map((dia) => (
                  <option key={dia.valor} value={dia.valor}>
                    {dia.etiqueta}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Asignatura
              <input
                required
                value={formulario.asignatura}
                onChange={(e) =>
                  setFormulario({
                    ...formulario,
                    asignatura: e.target.value,
                  })
                }
              />
            </label>

            <label>
              Hora inicial
              <input
                required
                type="time"
                value={formulario.horaInicio}
                onChange={(e) =>
                  setFormulario({
                    ...formulario,
                    horaInicio: e.target.value,
                  })
                }
              />
            </label>

            <label>
              Hora final
              <input
                required
                type="time"
                value={formulario.horaFin}
                onChange={(e) =>
                  setFormulario({ ...formulario, horaFin: e.target.value })
                }
              />
            </label>

            <label>
              Grado
              <input
                value={formulario.grado}
                onChange={(e) =>
                  setFormulario({ ...formulario, grado: e.target.value })
                }
              />
            </label>

            <label>
              Sección
              <input
                value={formulario.seccion}
                onChange={(e) =>
                  setFormulario({ ...formulario, seccion: e.target.value })
                }
              />
            </label>

            <label>
              Aula
              <input
                value={formulario.aula}
                onChange={(e) =>
                  setFormulario({ ...formulario, aula: e.target.value })
                }
              />
            </label>

            <label>
              Color
              <div className="schedule-colors">
                {COLORES.map((color) => (
                  <button
                    type="button"
                    key={color}
                    aria-label={`Color ${color}`}
                    className={formulario.color === color ? "active" : ""}
                    style={{ background: color }}
                    onClick={() =>
                      setFormulario({ ...formulario, color })
                    }
                  />
                ))}
              </div>
            </label>

            <label className="wide">
              Notas
              <textarea
                rows={3}
                value={formulario.notas}
                onChange={(e) =>
                  setFormulario({ ...formulario, notas: e.target.value })
                }
              />
            </label>
          </div>

          <div className="school-form-actions">
            <button type="button" onClick={() => setMostrarFormulario(false)}>
              Cancelar
            </button>
            <button className="primary" disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar clase"}
            </button>
          </div>
        </form>
      )}

      {cargando ? (
        <section className="school-empty">✨ Cargando horario...</section>
      ) : (
        <section className="schedule-week">
          {DIAS.map((dia) => (
            <article className="schedule-day" key={dia.valor}>
              <header>
                <span>{dia.etiqueta.slice(0, 3)}</span>
                <h2>{dia.etiqueta}</h2>
                <b>{porDia[dia.valor].length}</b>
              </header>

              <div className="schedule-classes">
                {porDia[dia.valor].length ? (
                  porDia[dia.valor].map((clase) => (
                    <div
                      className="schedule-class"
                      key={clase.idHorario}
                      style={{ borderLeftColor: clase.color }}
                    >
                      <div className="schedule-class-time">
                        <strong>{clase.horaInicio}</strong>
                        <span>{clase.horaFin}</span>
                      </div>
                      <div>
                        <h3>{clase.asignatura}</h3>
                        <p>
                          {clase.grado}
                          {clase.seccion ? ` · ${clase.seccion}` : ""}
                        </p>
                        {clase.aula && <small>📍 {clase.aula}</small>}
                      </div>
                      <div className="schedule-class-actions">
                        <button onClick={() => editar(clase)}>✏️</button>
                        <button onClick={() => void eliminar(clase)}>🗑️</button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="schedule-day-empty">Sin clases</div>
                )}
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
