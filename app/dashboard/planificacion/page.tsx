"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  eliminarPlanificacion,
  guardarPlanificacion,
  listarPlanificaciones,
  type DatosPlanificacion,
  type Planificacion,
} from "@/lib/apps-script-api";
import { eliminarSesion, obtenerMaestra, obtenerToken } from "@/lib/session";

const hoyLocal = () => {
  const ahora = new Date();
  const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
};

const formularioInicial: DatosPlanificacion = {
  titulo: "",
  asignatura: "",
  grado: "",
  fecha: hoyLocal(),
  objetivo: "",
  contenido: "",
  actividades: "",
  recursos: "",
  evaluacion: "",
  estado: "PLANIFICADA",
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
  "Otra",
];

const ESTADOS = ["BORRADOR", "PLANIFICADA", "COMPLETADA"] as const;

function fechaLegible(fecha: string) {
  if (!fecha) return "Sin fecha";
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${fecha}T12:00:00`));
}

function claseEstado(estado: string) {
  return estado.toLowerCase().replace(/[^a-záéíóúñ]/g, "");
}

export default function PlanificacionPage() {
  const router = useRouter();
  const maestra = obtenerMaestra();

  const [planes, setPlanes] = useState<Planificacion[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroAsignatura, setFiltroAsignatura] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [idEditando, setIdEditando] = useState<string | null>(null);
  const [formulario, setFormulario] =
    useState<DatosPlanificacion>(formularioInicial);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    void cargarPlanes();
  }, []);

  async function cargarPlanes() {
    const token = obtenerToken();
    if (!token) {
      eliminarSesion();
      router.replace("/");
      return;
    }

    setCargando(true);
    try {
      setPlanes(await listarPlanificaciones(token));
    } catch (error) {
      setMensaje(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar las planificaciones."
      );
    } finally {
      setCargando(false);
    }
  }

  function abrirNueva() {
    setIdEditando(null);
    setFormulario({
      ...formularioInicial,
      grado: maestra?.grado || "",
      fecha: hoyLocal(),
    });
    setMensaje("");
    setMostrarFormulario(true);
  }

  function abrirEdicion(plan: Planificacion) {
    setIdEditando(plan.idPlanificacion);
    setFormulario({
      titulo: plan.titulo,
      asignatura: plan.asignatura,
      grado: plan.grado,
      fecha: plan.fecha,
      objetivo: plan.objetivo,
      contenido: plan.contenido,
      actividades: plan.actividades,
      recursos: plan.recursos,
      evaluacion: plan.evaluacion,
      estado: plan.estado,
    });
    setMensaje("");
    setMostrarFormulario(true);
  }

  function cerrarFormulario() {
    if (guardando) return;
    setMostrarFormulario(false);
    setIdEditando(null);
  }

  function actualizarCampo<K extends keyof DatosPlanificacion>(
    campo: K,
    valor: DatosPlanificacion[K]
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

    setGuardando(true);
    setMensaje("");

    try {
      await guardarPlanificacion(token, {
        ...formulario,
        idPlanificacion: idEditando || undefined,
      });
      setMostrarFormulario(false);
      setIdEditando(null);
      setMensaje(
        idEditando
          ? "Planificación actualizada correctamente."
          : "Planificación registrada correctamente."
      );
      await cargarPlanes();
    } catch (error) {
      setMensaje(
        error instanceof Error
          ? error.message
          : "No se pudo guardar la planificación."
      );
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarEliminar(plan: Planificacion) {
    const confirmado = window.confirm(
      `¿Deseas eliminar la planificación “${plan.titulo}”?`
    );
    if (!confirmado) return;

    const token = obtenerToken();
    if (!token) {
      eliminarSesion();
      router.replace("/");
      return;
    }

    try {
      await eliminarPlanificacion(token, plan.idPlanificacion);
      setMensaje("Planificación eliminada correctamente.");
      await cargarPlanes();
    } catch (error) {
      setMensaje(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar la planificación."
      );
    }
  }

  const asignaturasRegistradas = useMemo(
    () => Array.from(new Set(planes.map((plan) => plan.asignatura))).sort(),
    [planes]
  );

  const planesFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return planes.filter((plan) => {
      const coincideTexto =
        !texto ||
        [
          plan.titulo,
          plan.asignatura,
          plan.grado,
          plan.objetivo,
          plan.contenido,
        ]
          .join(" ")
          .toLowerCase()
          .includes(texto);
      const coincideEstado = !filtroEstado || plan.estado === filtroEstado;
      const coincideAsignatura =
        !filtroAsignatura || plan.asignatura === filtroAsignatura;
      return coincideTexto && coincideEstado && coincideAsignatura;
    });
  }, [busqueda, filtroAsignatura, filtroEstado, planes]);

  const resumen = useMemo(() => {
    const hoy = hoyLocal();
    return {
      total: planes.length,
      pendientes: planes.filter((plan) => plan.estado === "PLANIFICADA").length,
      completadas: planes.filter((plan) => plan.estado === "COMPLETADA").length,
      estaSemana: planes.filter((plan) => {
        const diferencia =
          (new Date(`${plan.fecha}T12:00:00`).getTime() -
            new Date(`${hoy}T12:00:00`).getTime()) /
          86_400_000;
        return diferencia >= 0 && diferencia <= 7;
      }).length,
    };
  }, [planes]);

  return (
    <main className="planning-page">
      <section className="planning-header">
        <div>
          <span className="planning-chip">Organización docente</span>
          <h1>Planificación 📚</h1>
          <p>Organiza objetivos, contenidos, actividades y evaluación de tus clases.</p>
        </div>
        <button
          type="button"
          className="planning-primary-button"
          onClick={abrirNueva}
        >
          + Nueva planificación
        </button>
      </section>

      <section className="planning-summary">
        <article>
          <span>📘</span>
          <div><strong>{resumen.total}</strong><small>Total</small></div>
        </article>
        <article>
          <span>🗓️</span>
          <div><strong>{resumen.pendientes}</strong><small>Planificadas</small></div>
        </article>
        <article>
          <span>✅</span>
          <div><strong>{resumen.completadas}</strong><small>Completadas</small></div>
        </article>
        <article>
          <span>⏰</span>
          <div><strong>{resumen.estaSemana}</strong><small>Próximos 7 días</small></div>
        </article>
      </section>

      <section className="planning-filters">
        <input
          type="search"
          placeholder="Buscar título, asignatura, objetivo o contenido..."
          value={busqueda}
          onChange={(event) => setBusqueda(event.target.value)}
        />
        <select
          value={filtroAsignatura}
          onChange={(event) => setFiltroAsignatura(event.target.value)}
        >
          <option value="">Todas las asignaturas</option>
          {asignaturasRegistradas.map((asignatura) => (
            <option key={asignatura} value={asignatura}>{asignatura}</option>
          ))}
        </select>
        <select
          value={filtroEstado}
          onChange={(event) => setFiltroEstado(event.target.value)}
        >
          <option value="">Todos los estados</option>
          {ESTADOS.map((estado) => (
            <option key={estado} value={estado}>{estado}</option>
          ))}
        </select>
      </section>

      {mensaje && <div className="planning-message">{mensaje}</div>}

      {cargando ? (
        <section className="planning-empty">
          <div>✨</div><h2>Cargando planificaciones...</h2>
        </section>
      ) : planesFiltrados.length === 0 ? (
        <section className="planning-empty">
          <div>📚</div>
          <h2>{planes.length ? "No hay coincidencias" : "Todavía no tienes planificaciones"}</h2>
          <p>
            {planes.length
              ? "Prueba con otros filtros o una búsqueda diferente."
              : "Pulsa «Nueva planificación» para organizar tu primera clase."}
          </p>
        </section>
      ) : (
        <section className="planning-list">
          {planesFiltrados.map((plan) => (
            <article className="planning-card" key={plan.idPlanificacion}>
              <div className="planning-card-top">
                <div className="planning-icon">📖</div>
                <div className="planning-card-heading">
                  <h2>{plan.titulo}</h2>
                  <p>{plan.asignatura} · {plan.grado || "Grado sin indicar"}</p>
                </div>
                <span className={`planning-status ${claseEstado(plan.estado)}`}>
                  {plan.estado}
                </span>
              </div>

              <div className="planning-meta">
                <span>📅 {fechaLegible(plan.fecha)}</span>
                <span>🎯 {plan.objetivo || "Objetivo sin indicar"}</span>
              </div>

              <div className="planning-preview-grid">
                <div><strong>Contenido</strong><p>{plan.contenido || "Sin contenido"}</p></div>
                <div><strong>Actividades</strong><p>{plan.actividades || "Sin actividades"}</p></div>
                <div><strong>Recursos</strong><p>{plan.recursos || "Sin recursos"}</p></div>
                <div><strong>Evaluación</strong><p>{plan.evaluacion || "Sin evaluación"}</p></div>
              </div>

              <div className="planning-actions">
                <button type="button" onClick={() => abrirEdicion(plan)}>Editar</button>
                <button
                  type="button"
                  className="delete"
                  onClick={() => confirmarEliminar(plan)}
                >
                  Eliminar
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      {mostrarFormulario && (
        <div
          className="planning-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) cerrarFormulario();
          }}
        >
          <section className="planning-modal">
            <div className="planning-modal-header">
              <div>
                <span className="planning-chip">
                  {idEditando ? "Actualizar clase" : "Nueva clase"}
                </span>
                <h2>{idEditando ? "Editar planificación" : "Crear planificación"}</h2>
              </div>
              <button type="button" className="planning-close" onClick={cerrarFormulario}>×</button>
            </div>

            <form onSubmit={enviarFormulario}>
              <div className="planning-form-grid">
                <label className="full">
                  Título de la clase *
                  <input
                    required
                    value={formulario.titulo}
                    onChange={(event) => actualizarCampo("titulo", event.target.value)}
                    placeholder="Ejemplo: Sumas con números naturales"
                  />
                </label>

                <label>
                  Asignatura *
                  <select
                    required
                    value={formulario.asignatura}
                    onChange={(event) => actualizarCampo("asignatura", event.target.value)}
                  >
                    <option value="">Seleccionar</option>
                    {ASIGNATURAS.map((asignatura) => (
                      <option key={asignatura} value={asignatura}>{asignatura}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Grado
                  <input
                    value={formulario.grado}
                    onChange={(event) => actualizarCampo("grado", event.target.value)}
                  />
                </label>

                <label>
                  Fecha *
                  <input
                    type="date"
                    required
                    value={formulario.fecha}
                    onChange={(event) => actualizarCampo("fecha", event.target.value)}
                  />
                </label>

                <label>
                  Estado
                  <select
                    value={formulario.estado}
                    onChange={(event) => actualizarCampo("estado", event.target.value)}
                  >
                    {ESTADOS.map((estado) => (
                      <option key={estado} value={estado}>{estado}</option>
                    ))}
                  </select>
                </label>

                <label className="full">
                  Objetivo de aprendizaje *
                  <textarea
                    required
                    rows={3}
                    value={formulario.objetivo}
                    onChange={(event) => actualizarCampo("objetivo", event.target.value)}
                    placeholder="¿Qué aprenderán los estudiantes?"
                  />
                </label>

                <label className="full">
                  Contenido *
                  <textarea
                    required
                    rows={4}
                    value={formulario.contenido}
                    onChange={(event) => actualizarCampo("contenido", event.target.value)}
                    placeholder="Temas, conceptos y conocimientos que se trabajarán"
                  />
                </label>

                <label className="full">
                  Actividades *
                  <textarea
                    required
                    rows={5}
                    value={formulario.actividades}
                    onChange={(event) => actualizarCampo("actividades", event.target.value)}
                    placeholder="Inicio, desarrollo y cierre de la clase"
                  />
                </label>

                <label>
                  Recursos
                  <textarea
                    rows={4}
                    value={formulario.recursos}
                    onChange={(event) => actualizarCampo("recursos", event.target.value)}
                    placeholder="Libros, láminas, videos, materiales..."
                  />
                </label>

                <label>
                  Evaluación
                  <textarea
                    rows={4}
                    value={formulario.evaluacion}
                    onChange={(event) => actualizarCampo("evaluacion", event.target.value)}
                    placeholder="Cómo comprobarás los aprendizajes"
                  />
                </label>
              </div>

              <div className="planning-form-actions">
                <button
                  type="button"
                  className="planning-secondary-button"
                  onClick={cerrarFormulario}
                  disabled={guardando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="planning-primary-button"
                  disabled={guardando}
                >
                  {guardando
                    ? "Guardando..."
                    : idEditando
                    ? "Guardar cambios"
                    : "Guardar planificación"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
