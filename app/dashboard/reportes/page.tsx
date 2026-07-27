"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

type TipoReporte = "GENERAL" | "ASISTENCIA" | "CALIFICACIONES" | "ALUMNO";

const VACIO: Datos = {
  alumnos: [],
  asistencia: [],
  calificaciones: [],
  planificaciones: [],
  cumpleanos: [],
  reuniones: [],
  agenda: [],
};

const ESTADOS_ASISTENCIA = [
  { clave: "PRESENTE", etiqueta: "Presentes", icono: "✅" },
  { clave: "AUSENTE", etiqueta: "Ausentes", icono: "❌" },
  { clave: "TARDE", etiqueta: "Tardanzas", icono: "⏰" },
  { clave: "JUSTIFICADO", etiqueta: "Justificados", icono: "📄" },
] as const;

function fechaLocalHoy() {
  const ahora = new Date();
  const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function fechaBonita(fecha: string) {
  if (!fecha) return "";
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${fecha}T12:00:00`));
}

function descargarBlob(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}

function porcentajeNota(nota: Calificacion) {
  return nota.calificacionMaxima > 0
    ? Math.round((nota.calificacion / nota.calificacionMaxima) * 100)
    : 0;
}



export default function ReportesPage() {
  const router = useRouter();
  const maestra = obtenerMaestra();
  const [datos, setDatos] = useState<Datos>(VACIO);
  const [fecha, setFecha] = useState(fechaLocalHoy);
  const [tipo, setTipo] = useState<TipoReporte>("GENERAL");
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState("");
  const [cargando, setCargando] = useState(true);
  const [exportando, setExportando] = useState("");
  const [mensaje, setMensaje] = useState("");

  const cargar = useCallback(async () => {
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
        listarAsistencia(token, fecha),
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

      if (!alumnoSeleccionado && alumnos.length) {
        setAlumnoSeleccionado(alumnos[0].idAlumno);
      }
    } catch (error) {
      setMensaje(
        error instanceof Error
          ? error.message
          : "No se pudieron preparar los reportes."
      );
    } finally {
      setCargando(false);
    }
  }, [alumnoSeleccionado, fecha, router]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const alumnoActual = useMemo(
    () =>
      datos.alumnos.find(
        (alumno) => alumno.idAlumno === alumnoSeleccionado
      ) || null,
    [alumnoSeleccionado, datos.alumnos]
  );

  const notasAlumno = useMemo(
    () =>
      datos.calificaciones.filter(
        (nota) => nota.idAlumno === alumnoSeleccionado
      ),
    [alumnoSeleccionado, datos.calificaciones]
  );

  const resumen = useMemo(() => {
    const conteoAsistencia = {
      PRESENTE: 0,
      AUSENTE: 0,
      TARDE: 0,
      JUSTIFICADO: 0,
      SIN_MARCAR: 0,
    };

    datos.asistencia.forEach((registro) => {
      if (registro.estado && registro.estado in conteoAsistencia) {
        conteoAsistencia[
          registro.estado as keyof typeof conteoAsistencia
        ] += 1;
      } else {
        conteoAsistencia.SIN_MARCAR += 1;
      }
    });

    const presentes = conteoAsistencia.PRESENTE;
    const marcados =
      datos.asistencia.length - conteoAsistencia.SIN_MARCAR;
    const porcentajeAsistencia = marcados
      ? Math.round((presentes / marcados) * 100)
      : 0;

    const porcentajes = datos.calificaciones.map(porcentajeNota);
    const promedio = porcentajes.length
      ? Math.round(
          porcentajes.reduce((total, valor) => total + valor, 0) /
            porcentajes.length
        )
      : 0;

    const porcentajesAlumno = notasAlumno.map(porcentajeNota);
    const promedioAlumno = porcentajesAlumno.length
      ? Math.round(
          porcentajesAlumno.reduce((total, valor) => total + valor, 0) /
            porcentajesAlumno.length
        )
      : 0;

    const ahora = new Date();
    const reunionesProximas = datos.reuniones.filter((reunion) => {
      const valor = new Date(
        `${reunion.fecha}T${reunion.hora || "00:00"}`
      );
      return (
        !Number.isNaN(valor.getTime()) &&
        valor >= ahora &&
        reunion.estado !== "CANCELADA"
      );
    }).length;

    const eventosPendientes = datos.agenda.filter(
      (evento) => evento.estado === "PENDIENTE"
    ).length;

    return {
      conteoAsistencia,
      porcentajeAsistencia,
      promedio,
      promedioAlumno,
      reunionesProximas,
      eventosPendientes,
    };
  }, [datos, notasAlumno]);

  const rendimientoAsignaturas = useMemo(() => {
    const grupos = new Map<string, number[]>();

    datos.calificaciones.forEach((nota) => {
      const clave = nota.asignatura || "Sin asignatura";
      const valores = grupos.get(clave) || [];
      valores.push(porcentajeNota(nota));
      grupos.set(clave, valores);
    });

    return Array.from(grupos.entries())
      .map(([asignatura, valores]) => ({
        asignatura,
        promedio: Math.round(
          valores.reduce((total, valor) => total + valor, 0) /
            valores.length
        ),
        registros: valores.length,
      }))
      .sort((a, b) => b.promedio - a.promedio);
  }, [datos.calificaciones]);

  function datosExcel() {
    const asistencia = datos.asistencia.map((registro) => ({
      Fecha: fecha,
      Alumno: `${registro.nombre} ${registro.apellido}`.trim(),
      Grado: registro.grado,
      Sección: registro.seccion,
      Estado: registro.estado || "SIN MARCAR",
      Observaciones: registro.observaciones,
    }));

    const calificaciones = datos.calificaciones.map((nota) => ({
      Alumno: nota.nombreAlumno,
      Asignatura: nota.asignatura,
      Actividad: nota.actividad,
      Período: nota.periodo,
      Calificación: nota.calificacion,
      Máxima: nota.calificacionMaxima,
      Porcentaje: porcentajeNota(nota) / 100,
      Fecha: nota.fecha,
      Observaciones: nota.observaciones,
    }));

    const alumnos = datos.alumnos.map((alumno) => ({
      Nombre: alumno.nombre,
      Apellido: alumno.apellido,
      Documento: alumno.documento,
      Nacimiento: alumno.fechaNacimiento,
      Sexo: alumno.sexo,
      Grado: alumno.grado,
      Sección: alumno.seccion,
      Representante: alumno.representante,
      Teléfono: alumno.telefono,
      Dirección: alumno.direccion,
      Observaciones: alumno.observaciones,
      Estado: alumno.estado,
    }));

    const actividad = [
      ...datos.planificaciones.map((plan) => ({
        Módulo: "Planificación",
        Título: plan.titulo,
        Fecha: plan.fecha,
        Estado: plan.estado,
        Detalle: plan.asignatura,
      })),
      ...datos.reuniones.map((reunion) => ({
        Módulo: "Reunión",
        Título: reunion.titulo,
        Fecha: reunion.fecha,
        Estado: reunion.estado,
        Detalle: reunion.lugar,
      })),
      ...datos.agenda.map((evento) => ({
        Módulo: "Agenda",
        Título: evento.titulo,
        Fecha: evento.fecha,
        Estado: evento.estado,
        Detalle: evento.tipo,
      })),
    ];

    return { asistencia, calificaciones, alumnos, actividad };
  }

  function exportarExcel() {
    setExportando("EXCEL");
    setMensaje("");

    try {
      const hojas = datosExcel();

      const escaparXml = (valor: unknown) =>
        String(valor ?? "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/\"/g, "&quot;");

      const tipoCelda = (valor: unknown) =>
        typeof valor === "number" ? "Number" : "String";

      const crearHoja = (
        nombre: string,
        encabezados: string[],
        filas: Array<Record<string, unknown>>
      ) => {
        const cabecera = encabezados
          .map(
            (encabezado) =>
              `<Cell ss:StyleID="Header"><Data ss:Type="String">${escaparXml(
                encabezado
              )}</Data></Cell>`
          )
          .join("");

        const contenido = filas
          .map((fila) => {
            const celdas = encabezados
              .map((encabezado) => {
                const valor = fila[encabezado];
                return `<Cell><Data ss:Type="${tipoCelda(
                  valor
                )}">${escaparXml(valor)}</Data></Cell>`;
              })
              .join("");
            return `<Row>${celdas}</Row>`;
          })
          .join("");

        return `<Worksheet ss:Name="${escaparXml(nombre)}"><Table><Row>${cabecera}</Row>${contenido}</Table><WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><FreezePanes/><FrozenNoSplit/><SplitHorizontal>1</SplitHorizontal><TopRowBottomPane>1</TopRowBottomPane></WorksheetOptions></Worksheet>`;
      };

      const resumenGeneral = [
        { Indicador: "Maestra", Resultado: `${maestra?.nombre || ""} ${maestra?.apellido || ""}` },
        { Indicador: "Curso", Resultado: `${maestra?.grado || "Sin configurar"}${maestra?.seccion ? ` - Sección ${maestra.seccion}` : ""}` },
        { Indicador: "Fecha", Resultado: fecha },
        { Indicador: "Alumnos", Resultado: datos.alumnos.length },
        { Indicador: "Asistencia (%)", Resultado: resumen.porcentajeAsistencia },
        { Indicador: "Promedio general (%)", Resultado: resumen.promedio },
        { Indicador: "Planificaciones", Resultado: datos.planificaciones.length },
        { Indicador: "Reuniones próximas", Resultado: resumen.reunionesProximas },
        { Indicador: "Eventos pendientes", Resultado: resumen.eventosPendientes },
      ];

      const xml = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Styles><Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Bottom"/><Borders/><Font ss:FontName="Arial"/><Interior/><NumberFormat/><Protection/></Style><Style ss:ID="Header"><Font ss:FontName="Arial" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#8F6CDF" ss:Pattern="Solid"/></Style></Styles>${crearHoja("Resumen", ["Indicador", "Resultado"], resumenGeneral)}${crearHoja("Alumnos", Object.keys(hojas.alumnos[0] || { Nombre: "" }), hojas.alumnos)}${crearHoja("Asistencia", Object.keys(hojas.asistencia[0] || { Fecha: "" }), hojas.asistencia)}${crearHoja("Calificaciones", Object.keys(hojas.calificaciones[0] || { Alumno: "" }), hojas.calificaciones)}${crearHoja("Actividad escolar", Object.keys(hojas.actividad[0] || { Módulo: "" }), hojas.actividad)}</Workbook>`;

      descargarBlob(
        new Blob(["\ufeff", xml], {
          type: "application/vnd.ms-excel;charset=utf-8",
        }),
        `aula-magica-reporte-${fecha}.xls`
      );

      setMensaje("✅ Archivo Excel generado correctamente.");
    } catch (error) {
      setMensaje(
        error instanceof Error
          ? error.message
          : "No se pudo generar el archivo Excel."
      );
    } finally {
      setExportando("");
    }
  }

  function exportarPdf() {
    setExportando("PDF");
    setMensaje(
      "En la ventana de impresión selecciona ‘Guardar como PDF’."
    );

    window.setTimeout(() => {
      window.print();
      setExportando("");
    }, 150);
  }

  if (cargando) {
    return <div className="state-card">📊 Preparando reportes profesionales...</div>;
  }

  return (
    <main className="reports-pro-page">
      <section className="reports-pro-hero">
        <div>
          <span className="reports-pro-kicker">Versión 7.0</span>
          <h1>Reportes profesionales 📄</h1>
          <p>
            Genera documentos con identidad de Aula Mágica, exporta todos los
            datos a Excel o imprime directamente desde cualquier dispositivo.
          </p>
        </div>
        <div className="reports-pro-hero-icon" aria-hidden="true">
          📊
        </div>
      </section>

      <section className="reports-pro-toolbar">
        <label>
          Tipo de reporte
          <select
            value={tipo}
            onChange={(event) =>
              setTipo(event.target.value as TipoReporte)
            }
          >
            <option value="GENERAL">Resumen general</option>
            <option value="ASISTENCIA">Asistencia del día</option>
            <option value="CALIFICACIONES">Calificaciones</option>
            <option value="ALUMNO">Reporte individual</option>
          </select>
        </label>

        <label>
          Fecha de asistencia
          <input
            type="date"
            value={fecha}
            onChange={(event) => setFecha(event.target.value)}
          />
        </label>

        {tipo === "ALUMNO" && (
          <label>
            Alumno
            <select
              value={alumnoSeleccionado}
              onChange={(event) =>
                setAlumnoSeleccionado(event.target.value)
              }
            >
              {datos.alumnos.map((alumno) => (
                <option key={alumno.idAlumno} value={alumno.idAlumno}>
                  {alumno.nombre} {alumno.apellido}
                </option>
              ))}
            </select>
          </label>
        )}

        <button
          type="button"
          className="reports-pro-refresh"
          onClick={() => void cargar()}
        >
          🔄 Actualizar
        </button>
      </section>

      {mensaje && <div className="reports-pro-message">{mensaje}</div>}

      <section className="reports-pro-actions">
        <button
          type="button"
          className="pdf"
          disabled={Boolean(exportando)}
          onClick={exportarPdf}
        >
          <span>📄</span>
          <div>
            <strong>{exportando === "PDF" ? "Generando..." : "Exportar PDF"}</strong>
            <small>Documento listo para compartir</small>
          </div>
        </button>

        <button
          type="button"
          className="excel"
          disabled={Boolean(exportando)}
          onClick={exportarExcel}
        >
          <span>📗</span>
          <div>
            <strong>
              {exportando === "EXCEL" ? "Generando..." : "Exportar Excel"}
            </strong>
            <small>Libro con varias hojas</small>
          </div>
        </button>

        <button
          type="button"
          className="print"
          onClick={() => window.print()}
        >
          <span>🖨️</span>
          <div>
            <strong>Imprimir</strong>
            <small>Formato adaptado al papel</small>
          </div>
        </button>
      </section>

      <section className="reports-pro-kpis">
        <article>
          <span>👩‍🎓</span>
          <strong>{datos.alumnos.length}</strong>
          <small>Alumnos activos</small>
        </article>
        <article>
          <span>✅</span>
          <strong>{resumen.porcentajeAsistencia}%</strong>
          <small>Asistencia del día</small>
        </article>
        <article>
          <span>🏆</span>
          <strong>{resumen.promedio}%</strong>
          <small>Promedio general</small>
        </article>
        <article>
          <span>📅</span>
          <strong>{resumen.eventosPendientes}</strong>
          <small>Eventos pendientes</small>
        </article>
      </section>

      <section className="reports-pro-content">
        <article className="reports-pro-panel">
          <div className="reports-pro-panel-heading">
            <div>
              <span>📈</span>
              <div>
                <h2>Rendimiento por asignatura</h2>
                <p>Promedio acumulado de todas las calificaciones.</p>
              </div>
            </div>
          </div>

          <div className="reports-pro-bars">
            {rendimientoAsignaturas.length ? (
              rendimientoAsignaturas.slice(0, 8).map((item) => (
                <div className="reports-pro-bar-row" key={item.asignatura}>
                  <div>
                    <strong>{item.asignatura}</strong>
                    <small>{item.registros} registros</small>
                  </div>
                  <div className="reports-pro-bar-track">
                    <span style={{ width: `${Math.min(item.promedio, 100)}%` }} />
                  </div>
                  <b>{item.promedio}%</b>
                </div>
              ))
            ) : (
              <div className="reports-pro-empty">
                No hay calificaciones para mostrar.
              </div>
            )}
          </div>
        </article>

        <article className="reports-pro-panel">
          <div className="reports-pro-panel-heading">
            <div>
              <span>✅</span>
              <div>
                <h2>Asistencia del {fechaBonita(fecha)}</h2>
                <p>Distribución de estados registrados.</p>
              </div>
            </div>
          </div>

          <div className="reports-pro-attendance">
            {ESTADOS_ASISTENCIA.map((estado) => {
              const cantidad =
                resumen.conteoAsistencia[
                  estado.clave as keyof typeof resumen.conteoAsistencia
                ];

              return (
                <div key={estado.clave}>
                  <span>{estado.icono}</span>
                  <strong>{cantidad}</strong>
                  <small>{estado.etiqueta}</small>
                </div>
              );
            })}
          </div>
        </article>
      </section>

      <section className="reports-pro-print-sheet">
        <header>
          <img src="/brand/aula-magica-logo.png" alt="Aula Mágica" />
          <div>
            <h2>
              {tipo === "GENERAL" && "Resumen general"}
              {tipo === "ASISTENCIA" && "Reporte de asistencia"}
              {tipo === "CALIFICACIONES" && "Reporte de calificaciones"}
              {tipo === "ALUMNO" && "Reporte individual del alumno"}
            </h2>
            <p>
              {maestra?.nombre} {maestra?.apellido} ·{" "}
              {maestra?.grado || "Curso sin configurar"}
              {maestra?.seccion ? ` · Sección ${maestra.seccion}` : ""}
            </p>
          </div>
          <time>{fechaBonita(fecha)}</time>
        </header>

        {tipo === "GENERAL" && (
          <div className="reports-pro-print-grid">
            <div><span>Alumnos</span><b>{datos.alumnos.length}</b></div>
            <div><span>Asistencia</span><b>{resumen.porcentajeAsistencia}%</b></div>
            <div><span>Promedio</span><b>{resumen.promedio}%</b></div>
            <div><span>Planificaciones</span><b>{datos.planificaciones.length}</b></div>
            <div><span>Reuniones próximas</span><b>{resumen.reunionesProximas}</b></div>
            <div><span>Eventos pendientes</span><b>{resumen.eventosPendientes}</b></div>
          </div>
        )}

        {tipo === "ASISTENCIA" && (
          <table className="reports-pro-print-table">
            <thead><tr><th>Alumno</th><th>Grado</th><th>Sección</th><th>Estado</th><th>Observaciones</th></tr></thead>
            <tbody>{datos.asistencia.map((registro) => (
              <tr key={registro.idAlumno}><td>{registro.nombre} {registro.apellido}</td><td>{registro.grado}</td><td>{registro.seccion}</td><td>{registro.estado || "SIN MARCAR"}</td><td>{registro.observaciones}</td></tr>
            ))}</tbody>
          </table>
        )}

        {tipo === "CALIFICACIONES" && (
          <table className="reports-pro-print-table">
            <thead><tr><th>Alumno</th><th>Asignatura</th><th>Actividad</th><th>Período</th><th>Nota</th><th>%</th></tr></thead>
            <tbody>{datos.calificaciones.map((nota) => (
              <tr key={nota.idCalificacion}><td>{nota.nombreAlumno}</td><td>{nota.asignatura}</td><td>{nota.actividad}</td><td>{nota.periodo}</td><td>{nota.calificacion}/{nota.calificacionMaxima}</td><td>{porcentajeNota(nota)}%</td></tr>
            ))}</tbody>
          </table>
        )}

        {tipo === "ALUMNO" && alumnoActual && (
          <>
            <div className="reports-pro-student-print">
              <h3>{alumnoActual.nombre} {alumnoActual.apellido}</h3>
              <p><strong>Grado:</strong> {alumnoActual.grado || "Sin indicar"} · <strong>Sección:</strong> {alumnoActual.seccion || "Sin indicar"}</p>
              <p><strong>Representante:</strong> {alumnoActual.representante || "Sin indicar"} · <strong>Promedio:</strong> {resumen.promedioAlumno}%</p>
            </div>
            <table className="reports-pro-print-table">
              <thead><tr><th>Asignatura</th><th>Actividad</th><th>Período</th><th>Nota</th><th>%</th><th>Fecha</th></tr></thead>
              <tbody>{notasAlumno.map((nota) => (
                <tr key={nota.idCalificacion}><td>{nota.asignatura}</td><td>{nota.actividad}</td><td>{nota.periodo}</td><td>{nota.calificacion}/{nota.calificacionMaxima}</td><td>{porcentajeNota(nota)}%</td><td>{nota.fecha}</td></tr>
              ))}</tbody>
            </table>
          </>
        )}

        <div className="reports-pro-signatures">
          <span>Firma de la maestra</span>
          <span>Firma del director o representante</span>
        </div>
      </section>
    </main>
  );
}
