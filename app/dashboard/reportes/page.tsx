"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  listarAgenda,
  listarAlumnos,
  listarAsistencia,
  listarCalificaciones,
  listarCumpleanos,
  listarPlanificaciones,
  listarReuniones,
  type Alumno,
  type AsistenciaAlumno,
  type Calificacion,
  type CumpleanosAlumno,
  type EventoAgenda,
  type Planificacion,
  type Reunion,
} from "@/lib/apps-script-api";
import { eliminarSesion, obtenerMaestra, obtenerToken } from "@/lib/session";

type Datos = {
  alumnos: Alumno[];
  asistencia: AsistenciaAlumno[];
  calificaciones: Calificacion[];
  planificaciones: Planificacion[];
  cumpleanos: CumpleanosAlumno[];
  reuniones: Reunion[];
  agenda: EventoAgenda[];
};

const VACIO: Datos = {
  alumnos: [],
  asistencia: [],
  calificaciones: [],
  planificaciones: [],
  cumpleanos: [],
  reuniones: [],
  agenda: [],
};

function fechaHoy() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function escaparCsv(valor: unknown) {
  const texto = String(valor ?? "").replace(/"/g, '""');
  return `"${texto}"`;
}

function descargarCsv(nombre: string, encabezados: string[], filas: unknown[][]) {
  const contenido = [encabezados, ...filas]
    .map((fila) => fila.map(escaparCsv).join(","))
    .join("\r\n");
  const blob = new Blob(["\ufeff", contenido], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  enlace.click();
  URL.revokeObjectURL(url);
}

export default function ReportesPage() {
  const router = useRouter();
  const maestra = obtenerMaestra();
  const [datos, setDatos] = useState<Datos>(VACIO);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const hoy = fechaHoy();

  useEffect(() => {
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
        const [
          alumnos,
          asistencia,
          calificaciones,
          planificaciones,
          cumpleanos,
          reuniones,
          agenda,
        ] = await Promise.all([
          listarAlumnos(token),
          listarAsistencia(token, hoy),
          listarCalificaciones(token),
          listarPlanificaciones(token),
          listarCumpleanos(token),
          listarReuniones(token),
          listarAgenda(token),
        ]);
        setDatos({
          alumnos,
          asistencia,
          calificaciones,
          planificaciones,
          cumpleanos,
          reuniones,
          agenda,
        });
      } catch (error) {
        setMensaje(
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los reportes."
        );
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, [hoy, router]);

  const resumen = useMemo(() => {
    const presentes = datos.asistencia.filter(
      (item) => item.estado === "PRESENTE"
    ).length;
    const marcados = datos.asistencia.filter((item) => item.estado).length;
    const porcentajeAsistencia = marcados
      ? Math.round((presentes / marcados) * 100)
      : 0;

    const porcentajes = datos.calificaciones
      .filter((nota) => nota.calificacionMaxima > 0)
      .map((nota) => (nota.calificacion / nota.calificacionMaxima) * 100);
    const promedio = porcentajes.length
      ? Math.round(
          porcentajes.reduce((total, valor) => total + valor, 0) /
            porcentajes.length
        )
      : 0;

    const ahora = new Date();
    const proximasReuniones = datos.reuniones.filter((reunion) => {
      const fecha = new Date(`${reunion.fecha}T${reunion.hora || "00:00"}`);
      return !Number.isNaN(fecha.getTime()) && fecha >= ahora;
    }).length;

    return {
      presentes,
      marcados,
      porcentajeAsistencia,
      promedio,
      proximasReuniones,
    };
  }, [datos]);

  function exportarAlumnos() {
    descargarCsv(
      `alumnos-${hoy}.csv`,
      [
        "Nombre",
        "Apellido",
        "Documento",
        "Fecha de nacimiento",
        "Sexo",
        "Grado",
        "Sección",
        "Representante",
        "Teléfono",
        "Dirección",
        "Observaciones",
      ],
      datos.alumnos.map((a) => [
        a.nombre,
        a.apellido,
        a.documento,
        a.fechaNacimiento,
        a.sexo,
        a.grado,
        a.seccion,
        a.representante,
        a.telefono,
        a.direccion,
        a.observaciones,
      ])
    );
  }

  function exportarNotas() {
    descargarCsv(
      `calificaciones-${hoy}.csv`,
      [
        "Alumno",
        "Asignatura",
        "Actividad",
        "Periodo",
        "Calificación",
        "Máxima",
        "Porcentaje",
        "Fecha",
        "Observaciones",
      ],
      datos.calificaciones.map((n) => [
        n.nombreAlumno,
        n.asignatura,
        n.actividad,
        n.periodo,
        n.calificacion,
        n.calificacionMaxima,
        n.calificacionMaxima
          ? `${Math.round((n.calificacion / n.calificacionMaxima) * 100)}%`
          : "0%",
        n.fecha,
        n.observaciones,
      ])
    );
  }

  function exportarAsistencia() {
    descargarCsv(
      `asistencia-${hoy}.csv`,
      ["Fecha", "Alumno", "Grado", "Sección", "Estado", "Observaciones"],
      datos.asistencia.map((a) => [
        hoy,
        `${a.nombre} ${a.apellido}`,
        a.grado,
        a.seccion,
        a.estado || "SIN MARCAR",
        a.observaciones,
      ])
    );
  }

  if (cargando) {
    return <div className="state-card">📊 Preparando reportes...</div>;
  }

  return (
    <main className="reports-page">
      <section className="reports-header">
        <div>
          <span className="reports-chip">Resumen y exportación</span>
          <h1>Reportes 📊</h1>
          <p>
            Consulta los datos de {maestra?.nombre || "la maestra"}, imprime el
            resumen y descarga archivos CSV.
          </p>
        </div>
        <button className="reports-print-button" onClick={() => window.print()}>
          🖨️ Imprimir resumen
        </button>
      </section>

      {mensaje && <div className="reports-message">{mensaje}</div>}

      <section className="reports-summary">
        <article>
          <span>👩‍🎓</span>
          <div>
            <strong>{datos.alumnos.length}</strong>
            <small>Alumnos</small>
          </div>
        </article>
        <article>
          <span>✅</span>
          <div>
            <strong>{resumen.porcentajeAsistencia}%</strong>
            <small>Asistencia hoy</small>
          </div>
        </article>
        <article>
          <span>🏆</span>
          <div>
            <strong>{resumen.promedio}%</strong>
            <small>Promedio general</small>
          </div>
        </article>
        <article>
          <span>🤝</span>
          <div>
            <strong>{resumen.proximasReuniones}</strong>
            <small>Reuniones próximas</small>
          </div>
        </article>
      </section>

      <section className="reports-grid">
        <article className="reports-card">
          <div className="reports-card-icon">👩‍🎓</div>
          <h2>Listado de alumnos</h2>
          <p>Datos personales, representante, teléfono, grado y sección.</p>
          <strong>{datos.alumnos.length} registros</strong>
          <button onClick={exportarAlumnos}>Descargar CSV</button>
        </article>

        <article className="reports-card">
          <div className="reports-card-icon">✅</div>
          <h2>Asistencia de hoy</h2>
          <p>
            Presentes: {resumen.presentes} de {resumen.marcados} alumnos
            marcados.
          </p>
          <strong>{hoy}</strong>
          <button onClick={exportarAsistencia}>Descargar CSV</button>
        </article>

        <article className="reports-card">
          <div className="reports-card-icon">📝</div>
          <h2>Calificaciones</h2>
          <p>Notas, asignaturas, actividades, periodos y porcentajes.</p>
          <strong>{datos.calificaciones.length} registros</strong>
          <button onClick={exportarNotas}>Descargar CSV</button>
        </article>

        <article className="reports-card reports-card-info">
          <div className="reports-card-icon">📚</div>
          <h2>Actividad escolar</h2>
          <ul>
            <li>{datos.planificaciones.length} planificaciones</li>
            <li>{datos.cumpleanos.filter((c) => c.fechaNacimiento).length} cumpleaños configurados</li>
            <li>{datos.reuniones.length} reuniones</li>
            <li>{datos.agenda.length} eventos de agenda</li>
          </ul>
        </article>
      </section>

      <section className="reports-print-area">
        <h2>Resumen general</h2>
        <p>
          <strong>Maestra:</strong> {maestra?.nombre} {maestra?.apellido}
        </p>
        <p>
          <strong>Curso:</strong> {maestra?.grado || "Sin configurar"}
          {maestra?.seccion ? ` · Sección ${maestra.seccion}` : ""}
        </p>
        <p>
          <strong>Fecha del reporte:</strong> {hoy}
        </p>
        <div className="reports-mini-table">
          <span>Alumnos</span><b>{datos.alumnos.length}</b>
          <span>Asistencia de hoy</span><b>{resumen.porcentajeAsistencia}%</b>
          <span>Promedio general</span><b>{resumen.promedio}%</b>
          <span>Planificaciones</span><b>{datos.planificaciones.length}</b>
          <span>Reuniones</span><b>{datos.reuniones.length}</b>
          <span>Eventos de agenda</span><b>{datos.agenda.length}</b>
        </div>
      </section>
    </main>
  );
}
