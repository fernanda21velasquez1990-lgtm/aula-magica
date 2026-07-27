"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  crearAlumno,
  editarAlumno,
  eliminarAlumno,
  listarAlumnos,
  type Alumno,
} from "@/lib/apps-script-api";
import {
  eliminarSesion,
  obtenerMaestra,
  obtenerToken,
} from "@/lib/session";

const formularioInicial = {
  nombre: "",
  apellido: "",
  documento: "",
  fechaNacimiento: "",
  sexo: "",
  grado: "",
  seccion: "",
  representante: "",
  telefono: "",
  direccion: "",
  observaciones: "",
};

export default function AlumnosPage() {
  const router = useRouter();
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [idEditando, setIdEditando] = useState<string | null>(null);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date | null>(null);
  const [mostrarSincronizacion, setMostrarSincronizacion] = useState(false);
  const temporizadorRef = useRef<number | null>(null);
  const formularioRef = useRef(false);
  const guardandoRef = useRef(false);
  const maestra = obtenerMaestra();

  useEffect(() => {
    formularioRef.current = mostrarFormulario;
  }, [mostrarFormulario]);

  useEffect(() => {
    guardandoRef.current = guardando;
  }, [guardando]);

  useEffect(() => {
    return () => {
      if (temporizadorRef.current !== null) {
        window.clearTimeout(temporizadorRef.current);
      }
    };
  }, []);

  const cargarAlumnos = useCallback(async (silencioso = false) => {
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
      setAlumnos(await listarAlumnos(token));
      setUltimaActualizacion(new Date());

      if (!silencioso) {
        setMostrarSincronizacion(true);

        if (temporizadorRef.current !== null) {
          window.clearTimeout(temporizadorRef.current);
        }

        temporizadorRef.current = window.setTimeout(() => {
          setMostrarSincronizacion(false);
          temporizadorRef.current = null;
        }, 3000);
      }
    } catch (error) {
      if (!silencioso) {
        setMensaje(
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los alumnos."
        );
      }
    } finally {
      if (!silencioso) setCargando(false);
    }
  }, [router]);

  useEffect(() => {
    void cargarAlumnos();
  }, [cargarAlumnos]);

  useEffect(() => {
    const actualizar = () => {
      if (
        document.visibilityState === "visible" &&
        !formularioRef.current &&
        !guardandoRef.current
      ) {
        void cargarAlumnos(true);
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
  }, [cargarAlumnos]);

  function actualizarCampo(campo: keyof typeof formulario, valor: string) {
    setFormulario((previo) => ({ ...previo, [campo]: valor }));
  }

  function abrirNuevoAlumno() {
    setIdEditando(null);
    setFormulario({
      ...formularioInicial,
      grado: maestra?.grado || "",
      seccion: maestra?.seccion || "",
    });
    setMensaje("");
    setMostrarFormulario(true);
  }

  function abrirEdicion(alumno: Alumno) {
    setIdEditando(alumno.idAlumno);
    setFormulario({
      nombre: alumno.nombre,
      apellido: alumno.apellido,
      documento: alumno.documento,
      fechaNacimiento: alumno.fechaNacimiento,
      sexo: alumno.sexo,
      grado: alumno.grado,
      seccion: alumno.seccion,
      representante: alumno.representante,
      telefono: alumno.telefono,
      direccion: alumno.direccion,
      observaciones: alumno.observaciones,
    });
    setMensaje("");
    setMostrarFormulario(true);
  }

  function cerrarFormulario() {
    if (guardando) return;
    setMostrarFormulario(false);
    setIdEditando(null);
    setFormulario(formularioInicial);
  }

  async function guardarAlumno(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = obtenerToken();
    if (!token) {
      router.replace("/");
      return;
    }

    setGuardando(true);
    setMensaje("");
    try {
      if (idEditando) {
        await editarAlumno(token, { idAlumno: idEditando, ...formulario });
        setMensaje("Los datos del alumno se actualizaron correctamente.");
      } else {
        await crearAlumno(token, formulario);
        setMensaje("El alumno fue registrado correctamente.");
      }
      setMostrarFormulario(false);
      setIdEditando(null);
      setFormulario(formularioInicial);
      await cargarAlumnos();
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : "No se pudo guardar el alumno.");
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarEliminacion(alumno: Alumno) {
    if (!window.confirm(`¿Deseas eliminar a ${alumno.nombre} ${alumno.apellido}?`)) return;
    const token = obtenerToken();
    if (!token) {
      router.replace("/");
      return;
    }
    try {
      await eliminarAlumno(token, alumno.idAlumno);
      setMensaje("El alumno fue eliminado correctamente.");
      await cargarAlumnos();
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : "No se pudo eliminar el alumno.");
    }
  }

  const alumnosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return alumnos;
    return alumnos.filter((alumno) =>
      [alumno.nombre, alumno.apellido, alumno.documento, alumno.representante, alumno.grado, alumno.seccion]
        .join(" ")
        .toLowerCase()
        .includes(texto)
    );
  }, [alumnos, busqueda]);

  return (
    <main className="students-page">
      <section className="students-header">
        <div>
          <span className="students-chip">Gestión de estudiantes</span>
          <h1>Mis alumnos 👩‍🎓</h1>
          <p>Registra y administra únicamente los estudiantes de tu curso.</p>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            type="button"
            className="students-primary-button"
            onClick={() => void cargarAlumnos()}
            disabled={cargando || guardando}
          >
            🔄 Actualizar
          </button>
          <button
            type="button"
            className="students-primary-button"
            onClick={abrirNuevoAlumno}
          >
            + Agregar alumno
          </button>
        </div>
      </section>

      <section className="students-toolbar">
        <input
          type="search"
          placeholder="Buscar por nombre, documento o representante..."
          value={busqueda}
          onChange={(event) => setBusqueda(event.target.value)}
        />
        <div className="students-counter">
          <strong>{alumnosFiltrados.length}</strong>
          <span>{alumnosFiltrados.length === 1 ? " alumno" : " alumnos"}</span>
        </div>
      </section>

      {mostrarSincronizacion && ultimaActualizacion && !mensaje && (
        <div className="students-message" role="status" aria-live="polite">
          ✅ Datos actualizados correctamente a las{" "}
          {ultimaActualizacion.toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </div>
      )}

      {mensaje && <div className="students-message">{mensaje}</div>}

      {cargando ? (
        <section className="students-empty"><div>✨</div><h2>Cargando alumnos...</h2></section>
      ) : alumnosFiltrados.length === 0 ? (
        <section className="students-empty">
          <div>🧒</div>
          <h2>{busqueda ? "No encontramos coincidencias" : "Todavía no tienes alumnos"}</h2>
          <p>{busqueda ? "Prueba con otro nombre o documento." : "Pulsa «Agregar alumno» para crear el primer registro."}</p>
        </section>
      ) : (
        <section className="students-grid">
          {alumnosFiltrados.map((alumno) => (
            <article className="student-card" key={alumno.idAlumno}>
              <div className="student-avatar">
                {alumno.sexo === "Femenino" ? "👧" : alumno.sexo === "Masculino" ? "👦" : "🧒"}
              </div>
              <div className="student-card-content">
                <h2>{alumno.nombre} {alumno.apellido}</h2>
                <p><strong>Grado:</strong> {alumno.grado || "Sin indicar"}{alumno.seccion ? ` · Sección ${alumno.seccion}` : ""}</p>
                <p><strong>Documento:</strong> {alumno.documento || "Sin indicar"}</p>
                <p><strong>Representante:</strong> {alumno.representante || "Sin indicar"}</p>
                <p><strong>Teléfono:</strong> {alumno.telefono || "Sin indicar"}</p>
              </div>
              <div className="student-actions">
                <button type="button" onClick={() => abrirEdicion(alumno)}>Editar</button>
                <button type="button" className="delete" onClick={() => void confirmarEliminacion(alumno)}>Eliminar</button>
              </div>
            </article>
          ))}
        </section>
      )}

      {mostrarFormulario && (
        <div className="students-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && cerrarFormulario()}>
          <section className="students-modal">
            <div className="students-modal-header">
              <div>
                <span className="students-chip">{idEditando ? "Actualizar información" : "Nuevo registro"}</span>
                <h2>{idEditando ? "Editar alumno" : "Agregar alumno"}</h2>
              </div>
              <button type="button" className="students-close" onClick={cerrarFormulario}>×</button>
            </div>

            <form onSubmit={guardarAlumno}>
              <div className="students-form-grid">
                <label>Nombre *<input required value={formulario.nombre} onChange={(e) => actualizarCampo("nombre", e.target.value)} /></label>
                <label>Apellido *<input required value={formulario.apellido} onChange={(e) => actualizarCampo("apellido", e.target.value)} /></label>
                <label>Documento<input value={formulario.documento} onChange={(e) => actualizarCampo("documento", e.target.value)} /></label>
                <label>Fecha de nacimiento<input type="date" value={formulario.fechaNacimiento} onChange={(e) => actualizarCampo("fechaNacimiento", e.target.value)} /></label>
                <label>Sexo<select value={formulario.sexo} onChange={(e) => actualizarCampo("sexo", e.target.value)}><option value="">Seleccionar</option><option value="Femenino">Femenino</option><option value="Masculino">Masculino</option><option value="Otro">Otro</option></select></label>
                <label>Grado<input value={formulario.grado} onChange={(e) => actualizarCampo("grado", e.target.value)} /></label>
                <label>Sección<input value={formulario.seccion} onChange={(e) => actualizarCampo("seccion", e.target.value)} /></label>
                <label>Representante<input value={formulario.representante} onChange={(e) => actualizarCampo("representante", e.target.value)} /></label>
                <label>Teléfono<input type="tel" value={formulario.telefono} onChange={(e) => actualizarCampo("telefono", e.target.value)} /></label>
                <label className="full">Dirección<input value={formulario.direccion} onChange={(e) => actualizarCampo("direccion", e.target.value)} /></label>
                <label className="full">Observaciones<textarea rows={4} value={formulario.observaciones} onChange={(e) => actualizarCampo("observaciones", e.target.value)} /></label>
              </div>
              <div className="students-form-actions">
                <button type="button" className="students-secondary-button" onClick={cerrarFormulario} disabled={guardando}>Cancelar</button>
                <button type="submit" className="students-primary-button" disabled={guardando}>{guardando ? "Guardando..." : idEditando ? "Guardar cambios" : "Registrar alumno"}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
