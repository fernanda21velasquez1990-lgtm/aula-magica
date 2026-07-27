"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  guardarAsistencia,
  listarAsistencia,
  listarResumenMensualAsistencia,
  type AsistenciaAlumno,
  type EstadoAsistencia,
  type ResumenMensualAsistencia,
} from "@/lib/apps-script-api";
import { eliminarSesion, obtenerToken } from "@/lib/session";

type VistaAsistencia = "DIARIA" | "MENSUAL" | "INASISTENCIAS";

const ESTADOS: Array<{
  valor: Exclude<EstadoAsistencia, "">;
  etiqueta: string;
  icono: string;
}> = [
  { valor: "PRESENTE", etiqueta: "Presente", icono: "✅" },
  { valor: "AUSENTE", etiqueta: "Ausente", icono: "❌" },
  { valor: "TARDE", etiqueta: "Tarde", icono: "⏰" },
  { valor: "JUSTIFICADO", etiqueta: "Justificado", icono: "📄" },
];

const ABREVIATURAS: Record<string, string> = {
  PRESENTE: "P",
  AUSENTE: "A",
  TARDE: "T",
  JUSTIFICADO: "J",
};

function fechaLocalHoy() {
  const ahora = new Date();
  const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function mesLocalActual() {
  return fechaLocalHoy().slice(0, 7);
}

function fechaLegible(fecha: string) {
  if (!fecha) return "";
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${fecha}T12:00:00`));
}

function mesLegible(mes: string) {
  if (!mes) return "";
  return new Intl.DateTimeFormat("es-ES", {
    month: "long",
    year: "numeric",
  }).format(new Date(`${mes}-01T12:00:00`));
}

function estadoLegible(estado: string) {
  return (
    ESTADOS.find((item) => item.valor === estado)?.etiqueta ||
    "Sin marcar"
  );
}

export default function AsistenciaPage() {
  const router = useRouter();
  const [vista, setVista] = useState<VistaAsistencia>("DIARIA");
  const [fecha, setFecha] = useState(fechaLocalHoy);
  const [mes, setMes] = useState(mesLocalActual);
  const [alumnos, setAlumnos] = useState<AsistenciaAlumno[]>([]);
  const [resumenMensual, setResumenMensual] =
    useState<ResumenMensualAsistencia | null>(null);
  const [cargando, setCargando] = useState(true);
  const [cargandoMensual, setCargandoMensual] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    void cargarAsistencia(fecha);
  }, [fecha]);

  useEffect(() => {
    if (vista !== "DIARIA") {
      void cargarResumenMensual(mes);
    }
  }, [mes, vista]);

  async function cargarAsistencia(fechaSeleccionada: string) {
    const token = obtenerToken();
    if (!token) {
      eliminarSesion();
      router.replace("/");
      return;
    }

    setCargando(true);
    setMensaje("");

    try {
      const datos = await listarAsistencia(token, fechaSeleccionada);
      setAlumnos(datos);
    } catch (error) {
      setMensaje(
        error instanceof Error
          ? error.message
          : "No se pudo cargar la asistencia."
      );
    } finally {
      setCargando(false);
    }
  }

  async function cargarResumenMensual(mesSeleccionado: string) {
    const token = obtenerToken();
    if (!token) {
      eliminarSesion();
      router.replace("/");
      return;
    }

    setCargandoMensual(true);
    setMensaje("");

    try {
      setResumenMensual(
        await listarResumenMensualAsistencia(token, mesSeleccionado)
      );
    } catch (error) {
      setMensaje(
        error instanceof Error
          ? error.message
          : "No se pudo cargar el resumen mensual."
      );
    } finally {
      setCargandoMensual(false);
    }
  }

  function cambiarEstado(idAlumno: string, estado: EstadoAsistencia) {
    setAlumnos((actuales) =>
      actuales.map((alumno) =>
        alumno.idAlumno === idAlumno ? { ...alumno, estado } : alumno
      )
    );
  }

  function cambiarObservaciones(idAlumno: string, observaciones: string) {
    setAlumnos((actuales) =>
      actuales.map((alumno) =>
        alumno.idAlumno === idAlumno
          ? { ...alumno, observaciones }
          : alumno
      )
    );
  }

  function marcarTodos(estado: Exclude<EstadoAsistencia, "">) {
    setAlumnos((actuales) =>
      actuales.map((alumno) => ({ ...alumno, estado }))
    );
    setMensaje("");
  }

  async function guardar() {
    const token = obtenerToken();
    if (!token) {
      eliminarSesion();
      router.replace("/");
      return;
    }

    const marcados = alumnos.filter((alumno) => alumno.estado);
    if (marcados.length === 0) {
      setMensaje("Marca al menos un alumno antes de guardar.");
      return;
    }

    setGuardando(true);
    setMensaje("");

    try {
      const resultado = await guardarAsistencia(token, fecha, marcados);
      setMensaje(
        `Asistencia guardada correctamente: ${resultado.guardados} registro${
          resultado.guardados === 1 ? "" : "s"
        }.`
      );
      await cargarAsistencia(fecha);

      if (fecha.slice(0, 7) === mes) {
        await cargarResumenMensual(mes);
      }
    } catch (error) {
      setMensaje(
        error instanceof Error
          ? error.message
          : "No se pudo guardar la asistencia."
      );
    } finally {
      setGuardando(false);
    }
  }

  const resumen = useMemo(() => {
    return alumnos.reduce(
      (total, alumno) => {
        if (alumno.estado) total[alumno.estado] += 1;
        else total.SIN_MARCAR += 1;
        return total;
      },
      {
        PRESENTE: 0,
        AUSENTE: 0,
        TARDE: 0,
        JUSTIFICADO: 0,
        SIN_MARCAR: 0,
      }
    );
  }, [alumnos]);

  return (
    <main className="attendance-page">
      <section className="attendance-header">
        <div>
          <span className="attendance-chip">Registro de asistencia</span>
          <h1>Asistencia 📋</h1>
          <p>
            Control diario, resumen estadístico mensual y registro de
            inasistencias.
          </p>
        </div>

        {vista === "DIARIA" ? (
          <div className="attendance-date-box">
            <label htmlFor="attendance-date">Fecha</label>
            <input
              id="attendance-date"
              type="date"
              value={fecha}
              onChange={(event) => setFecha(event.target.value)}
            />
            <small>{fechaLegible(fecha)}</small>
          </div>
        ) : (
          <div className="attendance-date-box">
            <label htmlFor="attendance-month">Mes</label>
            <input
              id="attendance-month"
              type="month"
              value={mes}
              onChange={(event) => setMes(event.target.value)}
            />
            <small>{mesLegible(mes)}</small>
          </div>
        )}
      </section>

      <section className="attendance-tabs" aria-label="Vistas de asistencia">
        <button
          type="button"
          className={vista === "DIARIA" ? "active" : ""}
          onClick={() => setVista("DIARIA")}
        >
          📋 Registro diario
        </button>
        <button
          type="button"
          className={vista === "MENSUAL" ? "active" : ""}
          onClick={() => setVista("MENSUAL")}
        >
          📊 Resumen mensual
        </button>
        <button
          type="button"
          className={vista === "INASISTENCIAS" ? "active" : ""}
          onClick={() => setVista("INASISTENCIAS")}
        >
          📝 Inasistencias
        </button>
      </section>

      {mensaje && <div className="attendance-message">{mensaje}</div>}

      {vista === "DIARIA" && (
        <>
          <section className="attendance-summary">
            <article className="attendance-summary-card present">
              <span>✅</span>
              <div>
                <strong>{resumen.PRESENTE}</strong>
                <small>Presentes</small>
              </div>
            </article>
            <article className="attendance-summary-card absent">
              <span>❌</span>
              <div>
                <strong>{resumen.AUSENTE}</strong>
                <small>Ausentes</small>
              </div>
            </article>
            <article className="attendance-summary-card late">
              <span>⏰</span>
              <div>
                <strong>{resumen.TARDE}</strong>
                <small>Tardanzas</small>
              </div>
            </article>
            <article className="attendance-summary-card justified">
              <span>📄</span>
              <div>
                <strong>{resumen.JUSTIFICADO}</strong>
                <small>Justificados</small>
              </div>
            </article>
            <article className="attendance-summary-card pending">
              <span>➖</span>
              <div>
                <strong>{resumen.SIN_MARCAR}</strong>
                <small>Sin marcar</small>
              </div>
            </article>
          </section>

          <section className="attendance-toolbar">
            <div className="attendance-quick-actions">
              <button
                type="button"
                onClick={() => marcarTodos("PRESENTE")}
              >
                ✅ Todos presentes
              </button>
              <button
                type="button"
                onClick={() => marcarTodos("AUSENTE")}
              >
                ❌ Todos ausentes
              </button>
              <button
                type="button"
                onClick={() => void cargarAsistencia(fecha)}
              >
                🔄 Actualizar
              </button>
            </div>

            <button
              type="button"
              className="attendance-save-button"
              onClick={() => void guardar()}
              disabled={guardando || cargando || alumnos.length === 0}
            >
              {guardando ? "Guardando..." : "Guardar asistencia"}
            </button>
          </section>

          {cargando ? (
            <section className="attendance-empty">
              <div>✨</div>
              <h2>Cargando estudiantes...</h2>
            </section>
          ) : alumnos.length === 0 ? (
            <section className="attendance-empty">
              <div>👩‍🎓</div>
              <h2>No hay alumnos registrados</h2>
              <p>Primero agrega estudiantes desde el módulo Alumnos.</p>
            </section>
          ) : (
            <section className="attendance-list">
              {alumnos.map((alumno) => (
                <article
                  className="attendance-student-card"
                  key={alumno.idAlumno}
                >
                  <div className="attendance-student-info">
                    <div className="attendance-avatar">
                      {alumno.sexo === "Femenino"
                        ? "👧"
                        : alumno.sexo === "Masculino"
                        ? "👦"
                        : "🧒"}
                    </div>
                    <div>
                      <h2>
                        {alumno.nombre} {alumno.apellido}
                      </h2>
                      <p>
                        {alumno.grado || "Grado sin indicar"}
                        {alumno.seccion
                          ? ` · Sección ${alumno.seccion}`
                          : ""}
                      </p>
                    </div>
                  </div>

                  <div
                    className="attendance-statuses"
                    role="group"
                    aria-label={`Estado de ${alumno.nombre}`}
                  >
                    {ESTADOS.map((estado) => (
                      <button
                        type="button"
                        key={estado.valor}
                        className={
                          alumno.estado === estado.valor
                            ? `active ${estado.valor.toLowerCase()}`
                            : ""
                        }
                        onClick={() =>
                          cambiarEstado(alumno.idAlumno, estado.valor)
                        }
                      >
                        <span>{estado.icono}</span>
                        {estado.etiqueta}
                      </button>
                    ))}
                  </div>

                  <label className="attendance-observation">
                    Observación opcional
                    <input
                      type="text"
                      placeholder="Ejemplo: cita médica, llegó a las 8:15..."
                      value={alumno.observaciones}
                      onChange={(event) =>
                        cambiarObservaciones(
                          alumno.idAlumno,
                          event.target.value
                        )
                      }
                    />
                  </label>
                </article>
              ))}
            </section>
          )}
        </>
      )}

      {vista === "MENSUAL" && (
        <>
          {cargandoMensual ? (
            <section className="attendance-empty">
              <div>📊</div>
              <h2>Preparando el resumen mensual...</h2>
            </section>
          ) : !resumenMensual ? (
            <section className="attendance-empty">
              <div>📅</div>
              <h2>No hay información disponible</h2>
            </section>
          ) : (
            <>
              <section className="attendance-summary">
                <article className="attendance-summary-card present">
                  <span>✅</span>
                  <div>
                    <strong>{resumenMensual.totales.PRESENTE}</strong>
                    <small>Presentes</small>
                  </div>
                </article>
                <article className="attendance-summary-card absent">
                  <span>❌</span>
                  <div>
                    <strong>{resumenMensual.totales.AUSENTE}</strong>
                    <small>Ausentes</small>
                  </div>
                </article>
                <article className="attendance-summary-card late">
                  <span>⏰</span>
                  <div>
                    <strong>{resumenMensual.totales.TARDE}</strong>
                    <small>Tardanzas</small>
                  </div>
                </article>
                <article className="attendance-summary-card justified">
                  <span>📄</span>
                  <div>
                    <strong>{resumenMensual.totales.JUSTIFICADO}</strong>
                    <small>Justificados</small>
                  </div>
                </article>
                <article className="attendance-summary-card pending">
                  <span>➖</span>
                  <div>
                    <strong>{resumenMensual.totales.SIN_MARCAR}</strong>
                    <small>Sin registrar</small>
                  </div>
                </article>
              </section>

              <section className="attendance-monthly-card">
                <div className="attendance-monthly-heading">
                  <div>
                    <h2>Resumen estadístico mensual</h2>
                    <p>{mesLegible(resumenMensual.mes)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void cargarResumenMensual(mes)}
                  >
                    🔄 Actualizar
                  </button>
                </div>

                <div className="attendance-monthly-legend">
                  <span><b>P</b> Presente</span>
                  <span><b>A</b> Ausente</span>
                  <span><b>T</b> Tarde</span>
                  <span><b>J</b> Justificado</span>
                  <span><b>-</b> Sin marcar</span>
                </div>

                <div className="attendance-table-scroll">
                  <table className="attendance-monthly-table">
                    <thead>
                      <tr>
                        <th className="student-column">Estudiante</th>
                        {resumenMensual.dias.map((dia) => (
                          <th key={dia}>{dia}</th>
                        ))}
                        <th>P</th>
                        <th>A</th>
                        <th>T</th>
                        <th>J</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resumenMensual.alumnos.map((alumno) => (
                        <tr key={alumno.idAlumno}>
                          <th className="student-column">
                            {alumno.nombre} {alumno.apellido}
                          </th>
                          {resumenMensual.dias.map((dia) => {
                            const estado = alumno.estados[String(dia)] || "";
                            return (
                              <td
                                key={dia}
                                className={
                                  estado
                                    ? `status-${estado.toLowerCase()}`
                                    : "status-empty"
                                }
                                title={estadoLegible(estado)}
                              >
                                {ABREVIATURAS[estado] || "-"}
                              </td>
                            );
                          })}
                          <td>{alumno.resumen.PRESENTE}</td>
                          <td>{alumno.resumen.AUSENTE}</td>
                          <td>{alumno.resumen.TARDE}</td>
                          <td>{alumno.resumen.JUSTIFICADO}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </>
      )}

      {vista === "INASISTENCIAS" && (
        <section className="attendance-absence-card">
          <div className="attendance-monthly-heading">
            <div>
              <h2>Registro de inasistencias</h2>
              <p>
                Ausencias, tardanzas y justificaciones de {mesLegible(mes)}.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void cargarResumenMensual(mes)}
            >
              🔄 Actualizar
            </button>
          </div>

          {cargandoMensual ? (
            <div className="attendance-inline-empty">
              Cargando inasistencias...
            </div>
          ) : !resumenMensual?.inasistencias.length ? (
            <div className="attendance-inline-empty">
              ✨ No hay inasistencias registradas en este mes.
            </div>
          ) : (
            <div className="attendance-absence-list">
              {resumenMensual.inasistencias.map((registro) => (
                <article
                  key={`${registro.idAsistencia}-${registro.fecha}`}
                  className={`attendance-absence-item ${registro.estado.toLowerCase()}`}
                >
                  <div className="attendance-absence-icon">
                    {registro.estado === "AUSENTE"
                      ? "❌"
                      : registro.estado === "TARDE"
                      ? "⏰"
                      : "📄"}
                  </div>
                  <div className="attendance-absence-info">
                    <h3>{registro.nombreAlumno}</h3>
                    <p>
                      {fechaLegible(registro.fecha)} ·{" "}
                      <strong>{estadoLegible(registro.estado)}</strong>
                    </p>
                    <small>
                      {registro.observaciones || "Sin observaciones"}
                    </small>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
