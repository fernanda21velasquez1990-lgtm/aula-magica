"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  eliminarCalificacion,
  guardarCalificacion,
  listarAlumnos,
  listarCalificaciones,
  type Alumno,
  type Calificacion,
  type DatosCalificacion,
} from "@/lib/apps-script-api";
import { eliminarSesion, obtenerToken } from "@/lib/session";

const hoyLocal = () => {
  const ahora = new Date();
  const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
};

const formularioInicial: DatosCalificacion = {
  idAlumno: "",
  asignatura: "",
  actividad: "",
  periodo: "Primer período",
  calificacion: 0,
  calificacionMaxima: 20,
  fecha: hoyLocal(),
  observaciones: "",
};

const ASIGNATURAS = [
  "Lengua Española",
  "Matemática",
  "Ciencias Naturales",
  "Ciencias Sociales",
  "Educación Artística",
  "Educación Física",
  "Formación Integral",
  "Inglés",
];

function porcentajeDe(registro: Calificacion) {
  if (!registro.calificacionMaxima) return 0;
  return Math.round((registro.calificacion / registro.calificacionMaxima) * 100);
}

function fechaLegible(fecha: string) {
  if (!fecha) return "Sin fecha";
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${fecha}T12:00:00`));
}

export default function CalificacionesPage() {
  const router = useRouter();
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [calificaciones, setCalificaciones] = useState<Calificacion[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroAsignatura, setFiltroAsignatura] = useState("");
  const [filtroPeriodo, setFiltroPeriodo] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [idEditando, setIdEditando] = useState<string | null>(null);
  const [formulario, setFormulario] = useState<DatosCalificacion>(formularioInicial);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    void cargarDatos();
  }, []);

  async function cargarDatos() {
    const token = obtenerToken();
    if (!token) {
      eliminarSesion();
      router.replace("/");
      return;
    }

    setCargando(true);
    try {
      const [listaAlumnos, listaCalificaciones] = await Promise.all([
        listarAlumnos(token),
        listarCalificaciones(token),
      ]);
      setAlumnos(listaAlumnos);
      setCalificaciones(listaCalificaciones);
    } catch (error) {
      setMensaje(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar las calificaciones."
      );
    } finally {
      setCargando(false);
    }
  }

  function abrirNueva() {
    setIdEditando(null);
    setFormulario({
      ...formularioInicial,
      idAlumno: alumnos[0]?.idAlumno || "",
      fecha: hoyLocal(),
    });
    setMensaje("");
    setMostrarFormulario(true);
  }

  function abrirEdicion(registro: Calificacion) {
    setIdEditando(registro.idCalificacion);
    setFormulario({
      idAlumno: registro.idAlumno,
      asignatura: registro.asignatura,
      actividad: registro.actividad,
      periodo: registro.periodo,
      calificacion: registro.calificacion,
      calificacionMaxima: registro.calificacionMaxima,
      fecha: registro.fecha,
      observaciones: registro.observaciones,
    });
    setMensaje("");
    setMostrarFormulario(true);
  }

  function cerrarFormulario() {
    if (guardando) return;
    setMostrarFormulario(false);
    setIdEditando(null);
  }

  function actualizarCampo<K extends keyof DatosCalificacion>(
    campo: K,
    valor: DatosCalificacion[K]
  ) {
    setFormulario((actual) => ({ ...actual, [campo]: valor }));
  }

  async function enviarFormulario(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = obtenerToken();
    if (!token) {
      eliminarSesion();
      router.replace("/");
      return;
    }

    if (Number(formulario.calificacion) > Number(formulario.calificacionMaxima)) {
      setMensaje("La calificación no puede superar la calificación máxima.");
      return;
    }

    setGuardando(true);
    setMensaje("");
    try {
      await guardarCalificacion(token, {
        ...formulario,
        idCalificacion: idEditando || undefined,
        calificacion: Number(formulario.calificacion),
        calificacionMaxima: Number(formulario.calificacionMaxima),
      });
      setMostrarFormulario(false);
      setIdEditando(null);
      setMensaje(
        idEditando
          ? "Calificación actualizada correctamente."
          : "Calificación registrada correctamente."
      );
      await cargarDatos();
    } catch (error) {
      setMensaje(
        error instanceof Error
          ? error.message
          : "No se pudo guardar la calificación."
      );
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarEliminar(registro: Calificacion) {
    const confirmado = window.confirm(
      `¿Deseas eliminar la calificación de ${registro.nombreAlumno}?`
    );
    if (!confirmado) return;

    const token = obtenerToken();
    if (!token) {
      eliminarSesion();
      router.replace("/");
      return;
    }

    try {
      await eliminarCalificacion(token, registro.idCalificacion);
      setMensaje("Calificación eliminada correctamente.");
      await cargarDatos();
    } catch (error) {
      setMensaje(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar la calificación."
      );
    }
  }

  const asignaturasRegistradas = useMemo(
    () =>
      Array.from(new Set(calificaciones.map((item) => item.asignatura))).sort(),
    [calificaciones]
  );

  const registrosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return calificaciones.filter((registro) => {
      const coincideTexto =
        !texto ||
        [
          registro.nombreAlumno,
          registro.asignatura,
          registro.actividad,
          registro.periodo,
        ]
          .join(" ")
          .toLowerCase()
          .includes(texto);
      const coincideAsignatura =
        !filtroAsignatura || registro.asignatura === filtroAsignatura;
      const coincidePeriodo = !filtroPeriodo || registro.periodo === filtroPeriodo;
      return coincideTexto && coincideAsignatura && coincidePeriodo;
    });
  }, [busqueda, calificaciones, filtroAsignatura, filtroPeriodo]);

  const resumen = useMemo(() => {
    const total = registrosFiltrados.length;
    const porcentajes = registrosFiltrados.map(porcentajeDe);
    const promedio = total
      ? Math.round(porcentajes.reduce((suma, valor) => suma + valor, 0) / total)
      : 0;
    const mayor = total ? Math.max(...porcentajes) : 0;
    const alumnosEvaluados = new Set(
      registrosFiltrados.map((registro) => registro.idAlumno)
    ).size;
    return { total, promedio, mayor, alumnosEvaluados };
  }, [registrosFiltrados]);

  return (
    <main className="grades-page">
      <section className="grades-header">
        <div>
          <span className="grades-chip">Evaluación escolar</span>
          <h1>Calificaciones 📝</h1>
          <p>Registra notas, actividades y períodos de cada estudiante.</p>
        </div>
        <button
          type="button"
          className="grades-primary-button"
          onClick={abrirNueva}
          disabled={alumnos.length === 0}
        >
          + Agregar calificación
        </button>
      </section>

      <section className="grades-summary">
        <article><span>📚</span><div><strong>{resumen.total}</strong><small>Registros</small></div></article>
        <article><span>📊</span><div><strong>{resumen.promedio}%</strong><small>Promedio</small></div></article>
        <article><span>🏆</span><div><strong>{resumen.mayor}%</strong><small>Nota mayor</small></div></article>
        <article><span>👩‍🎓</span><div><strong>{resumen.alumnosEvaluados}</strong><small>Evaluados</small></div></article>
      </section>

      <section className="grades-filters">
        <input
          type="search"
          placeholder="Buscar alumno, asignatura o actividad..."
          value={busqueda}
          onChange={(event) => setBusqueda(event.target.value)}
        />
        <select
          value={filtroAsignatura}
          onChange={(event) => setFiltroAsignatura(event.target.value)}
        >
          <option value="">Todas las asignaturas</option>
          {asignaturasRegistradas.map((asignatura) => (
            <option value={asignatura} key={asignatura}>{asignatura}</option>
          ))}
        </select>
        <select
          value={filtroPeriodo}
          onChange={(event) => setFiltroPeriodo(event.target.value)}
        >
          <option value="">Todos los períodos</option>
          <option>Primer período</option>
          <option>Segundo período</option>
          <option>Tercer período</option>
          <option>Cuarto período</option>
        </select>
      </section>

      {mensaje && <div className="grades-message">{mensaje}</div>}

      {cargando ? (
        <section className="grades-empty"><div>✨</div><h2>Cargando calificaciones...</h2></section>
      ) : alumnos.length === 0 ? (
        <section className="grades-empty"><div>👩‍🎓</div><h2>No hay alumnos registrados</h2><p>Agrega estudiantes antes de registrar calificaciones.</p></section>
      ) : registrosFiltrados.length === 0 ? (
        <section className="grades-empty"><div>📝</div><h2>No hay calificaciones</h2><p>Pulsa «Agregar calificación» para crear el primer registro.</p></section>
      ) : (
        <section className="grades-list">
          {registrosFiltrados.map((registro) => {
            const porcentaje = porcentajeDe(registro);
            const nivel = porcentaje >= 80 ? "high" : porcentaje >= 60 ? "medium" : "low";
            return (
              <article className="grade-card" key={registro.idCalificacion}>
                <div className="grade-main">
                  <div className="grade-avatar">🎓</div>
                  <div>
                    <h2>{registro.nombreAlumno}</h2>
                    <p>{registro.asignatura} · {registro.periodo}</p>
                    <strong>{registro.actividad}</strong>
                  </div>
                </div>

                <div className={`grade-score ${nivel}`}>
                  <strong>{registro.calificacion}/{registro.calificacionMaxima}</strong>
                  <span>{porcentaje}%</span>
                </div>

                <div className="grade-details">
                  <span>📅 {fechaLegible(registro.fecha)}</span>
                  {registro.observaciones && <span>💬 {registro.observaciones}</span>}
                </div>

                <div className="grade-actions">
                  <button type="button" onClick={() => abrirEdicion(registro)}>Editar</button>
                  <button type="button" className="delete" onClick={() => void confirmarEliminar(registro)}>Eliminar</button>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {mostrarFormulario && (
        <div
          className="grades-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) cerrarFormulario();
          }}
        >
          <section className="grades-modal">
            <div className="grades-modal-header">
              <div>
                <span className="grades-chip">{idEditando ? "Actualizar registro" : "Nueva evaluación"}</span>
                <h2>{idEditando ? "Editar calificación" : "Agregar calificación"}</h2>
              </div>
              <button type="button" className="grades-close" onClick={cerrarFormulario}>×</button>
            </div>

            <form onSubmit={enviarFormulario}>
              <div className="grades-form-grid">
                <label className="full">
                  Alumno *
                  <select
                    required
                    value={formulario.idAlumno}
                    onChange={(event) => actualizarCampo("idAlumno", event.target.value)}
                  >
                    <option value="">Seleccionar alumno</option>
                    {alumnos.map((alumno) => (
                      <option value={alumno.idAlumno} key={alumno.idAlumno}>
                        {alumno.nombre} {alumno.apellido}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Asignatura *
                  <input
                    required
                    list="lista-asignaturas"
                    value={formulario.asignatura}
                    onChange={(event) => actualizarCampo("asignatura", event.target.value)}
                  />
                  <datalist id="lista-asignaturas">
                    {ASIGNATURAS.map((asignatura) => <option value={asignatura} key={asignatura} />)}
                  </datalist>
                </label>

                <label>
                  Actividad *
                  <input
                    required
                    placeholder="Ejemplo: Examen de fracciones"
                    value={formulario.actividad}
                    onChange={(event) => actualizarCampo("actividad", event.target.value)}
                  />
                </label>

                <label>
                  Período *
                  <select
                    required
                    value={formulario.periodo}
                    onChange={(event) => actualizarCampo("periodo", event.target.value)}
                  >
                    <option>Primer período</option>
                    <option>Segundo período</option>
                    <option>Tercer período</option>
                    <option>Cuarto período</option>
                  </select>
                </label>

                <label>
                  Fecha *
                  <input
                    required
                    type="date"
                    value={formulario.fecha}
                    onChange={(event) => actualizarCampo("fecha", event.target.value)}
                  />
                </label>

                <label>
                  Calificación *
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={formulario.calificacion}
                    onChange={(event) => actualizarCampo("calificacion", Number(event.target.value))}
                  />
                </label>

                <label>
                  Calificación máxima *
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={formulario.calificacionMaxima}
                    onChange={(event) => actualizarCampo("calificacionMaxima", Number(event.target.value))}
                  />
                </label>

                <label className="full">
                  Observaciones
                  <textarea
                    rows={3}
                    placeholder="Comentario opcional sobre el desempeño..."
                    value={formulario.observaciones}
                    onChange={(event) => actualizarCampo("observaciones", event.target.value)}
                  />
                </label>
              </div>

              <div className="grades-form-actions">
                <button type="button" className="grades-secondary-button" onClick={cerrarFormulario} disabled={guardando}>Cancelar</button>
                <button type="submit" className="grades-primary-button" disabled={guardando}>
                  {guardando ? "Guardando..." : idEditando ? "Guardar cambios" : "Registrar calificación"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
