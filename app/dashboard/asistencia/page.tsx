"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  guardarAsistencia,
  listarAsistencia,
  type AsistenciaAlumno,
  type EstadoAsistencia,
} from "@/lib/apps-script-api";
import { eliminarSesion, obtenerToken } from "@/lib/session";

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

function fechaLocalHoy() {
  const ahora = new Date();
  const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
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

export default function AsistenciaPage() {
  const router = useRouter();
  const [fecha, setFecha] = useState(fechaLocalHoy);
  const [alumnos, setAlumnos] = useState<AsistenciaAlumno[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [hayCambiosLocales, setHayCambiosLocales] = useState(false);
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date | null>(null);
  const hayCambiosRef = useRef(false);
  const cargandoRef = useRef(false);
  const guardandoRef = useRef(false);

  useEffect(() => {
    hayCambiosRef.current = hayCambiosLocales;
  }, [hayCambiosLocales]);

  useEffect(() => {
    cargandoRef.current = cargando;
  }, [cargando]);

  useEffect(() => {
    guardandoRef.current = guardando;
  }, [guardando]);

  const cargarAsistencia = useCallback(async (
    fechaSeleccionada: string,
    silencioso = false
  ) => {
    const token = obtenerToken();
    if (!token) {
      eliminarSesion();
      router.replace("/");
      return;
    }

    if (!silencioso) {
      setCargando(true);
      setMensaje("");
    }

    try {
      const datos = await listarAsistencia(token, fechaSeleccionada);
      setAlumnos(datos);
      setHayCambiosLocales(false);
      setUltimaActualizacion(new Date());
    } catch (error) {
      if (!silencioso) {
        setMensaje(
          error instanceof Error
            ? error.message
            : "No se pudo cargar la asistencia."
        );
      }
    } finally {
      if (!silencioso) setCargando(false);
    }
  }, [router]);

  useEffect(() => {
    void cargarAsistencia(fecha);
  }, [fecha, cargarAsistencia]);

  useEffect(() => {
    const actualizarSiCorresponde = () => {
      if (
        document.visibilityState === "visible" &&
        !hayCambiosRef.current &&
        !cargandoRef.current &&
        !guardandoRef.current
      ) {
        void cargarAsistencia(fecha, true);
      }
    };

    const intervalo = window.setInterval(actualizarSiCorresponde, 10_000);
    window.addEventListener("focus", actualizarSiCorresponde);
    document.addEventListener("visibilitychange", actualizarSiCorresponde);

    return () => {
      window.clearInterval(intervalo);
      window.removeEventListener("focus", actualizarSiCorresponde);
      document.removeEventListener("visibilitychange", actualizarSiCorresponde);
    };
  }, [fecha, cargarAsistencia]);

  function cambiarEstado(idAlumno: string, estado: EstadoAsistencia) {
    setHayCambiosLocales(true);
    setAlumnos((actuales) =>
      actuales.map((alumno) =>
        alumno.idAlumno === idAlumno ? { ...alumno, estado } : alumno
      )
    );
  }

  function cambiarObservaciones(idAlumno: string, observaciones: string) {
    setHayCambiosLocales(true);
    setAlumnos((actuales) =>
      actuales.map((alumno) =>
        alumno.idAlumno === idAlumno
          ? { ...alumno, observaciones }
          : alumno
      )
    );
  }

  function marcarTodos(estado: Exclude<EstadoAsistencia, "">) {
    setHayCambiosLocales(true);
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
      setHayCambiosLocales(false);
      await cargarAsistencia(fecha);
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
          <span className="attendance-chip">Control diario</span>
          <h1>Asistencia 📋</h1>
          <p>Registra el estado de cada estudiante para el día seleccionado.</p>
        </div>

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
      </section>

      <section className="attendance-summary">
        <article className="attendance-summary-card present">
          <span>✅</span>
          <div><strong>{resumen.PRESENTE}</strong><small>Presentes</small></div>
        </article>
        <article className="attendance-summary-card absent">
          <span>❌</span>
          <div><strong>{resumen.AUSENTE}</strong><small>Ausentes</small></div>
        </article>
        <article className="attendance-summary-card late">
          <span>⏰</span>
          <div><strong>{resumen.TARDE}</strong><small>Tardanzas</small></div>
        </article>
        <article className="attendance-summary-card justified">
          <span>📄</span>
          <div><strong>{resumen.JUSTIFICADO}</strong><small>Justificados</small></div>
        </article>
        <article className="attendance-summary-card pending">
          <span>➖</span>
          <div><strong>{resumen.SIN_MARCAR}</strong><small>Sin marcar</small></div>
        </article>
      </section>

      <section className="attendance-toolbar">
        <div className="attendance-quick-actions">
          <button type="button" onClick={() => marcarTodos("PRESENTE")}>✅ Todos presentes</button>
          <button type="button" onClick={() => marcarTodos("AUSENTE")}>❌ Todos ausentes</button>
          <button
            type="button"
            onClick={() => void cargarAsistencia(fecha)}
            disabled={cargando || guardando}
            title="Traer los datos más recientes de Google Sheets"
          >
            🔄 Actualizar datos
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

      {ultimaActualizacion && !mensaje && (
        <div className="attendance-message">
          🔄 Sincronizado con Google Sheets a las{" "}
          {ultimaActualizacion.toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
          {hayCambiosLocales
            ? " · Hay cambios locales sin guardar."
            : " · Actualización automática activa."}
        </div>
      )}

      {mensaje && <div className="attendance-message">{mensaje}</div>}

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
            <article className="attendance-student-card" key={alumno.idAlumno}>
              <div className="attendance-student-info">
                <div className="attendance-avatar">
                  {alumno.sexo === "Femenino"
                    ? "👧"
                    : alumno.sexo === "Masculino"
                    ? "👦"
                    : "🧒"}
                </div>
                <div>
                  <h2>{alumno.nombre} {alumno.apellido}</h2>
                  <p>{alumno.grado || "Grado sin indicar"}{alumno.seccion ? ` · Sección ${alumno.seccion}` : ""}</p>
                </div>
              </div>

              <div className="attendance-statuses" role="group" aria-label={`Estado de ${alumno.nombre}`}>
                {ESTADOS.map((estado) => (
                  <button
                    type="button"
                    key={estado.valor}
                    className={alumno.estado === estado.valor ? `active ${estado.valor.toLowerCase()}` : ""}
                    onClick={() => cambiarEstado(alumno.idAlumno, estado.valor)}
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
                  onChange={(event) => cambiarObservaciones(alumno.idAlumno, event.target.value)}
                />
              </label>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
