"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  eliminarCumpleanos,
  guardarCumpleanos,
  listarCumpleanos,
  type CumpleanosAlumno,
  type DatosCumpleanos,
} from "@/lib/apps-script-api";
import { eliminarSesion, obtenerToken } from "@/lib/session";

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const formularioInicial: DatosCumpleanos = {
  idAlumno: "",
  fechaNacimiento: "",
  notas: "",
};

function parsearFecha(fecha: string) {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  if (!anio || !mes || !dia) return null;
  return { anio, mes, dia };
}

function datosProximoCumpleanos(fecha: string) {
  const partes = parsearFecha(fecha);
  if (!partes) return null;

  const hoy = new Date();
  const hoySinHora = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  let proximo = new Date(hoy.getFullYear(), partes.mes - 1, partes.dia);
  if (proximo.getTime() < hoySinHora.getTime()) {
    proximo = new Date(hoy.getFullYear() + 1, partes.mes - 1, partes.dia);
  }

  const diasFaltan = Math.round(
    (proximo.getTime() - hoySinHora.getTime()) / 86_400_000
  );
  const edadCumple = proximo.getFullYear() - partes.anio;

  return { proximo, diasFaltan, edadCumple, mes: partes.mes };
}

function fechaLegible(fecha: string) {
  if (!fecha) return "Fecha pendiente";
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${fecha}T12:00:00`));
}

function textoCuentaRegresiva(dias: number) {
  if (dias === 0) return "¡Es hoy! 🎉";
  if (dias === 1) return "Mañana";
  return `Faltan ${dias} días`;
}

export default function CumpleanosPage() {
  const router = useRouter();
  const [registros, setRegistros] = useState<CumpleanosAlumno[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [mes, setMes] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formulario, setFormulario] =
    useState<DatosCumpleanos>(formularioInicial);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    void cargarCumpleanos();
  }, []);

  async function cargarCumpleanos() {
    const token = obtenerToken();
    if (!token) {
      eliminarSesion();
      router.replace("/");
      return;
    }

    setCargando(true);
    try {
      setRegistros(await listarCumpleanos(token));
    } catch (error) {
      setMensaje(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar los cumpleaños."
      );
    } finally {
      setCargando(false);
    }
  }

  function abrirNuevo() {
    const primerSinFecha = registros.find((registro) => !registro.fechaNacimiento);
    setFormulario({
      idAlumno: primerSinFecha?.idAlumno || registros[0]?.idAlumno || "",
      fechaNacimiento: primerSinFecha?.fechaNacimiento || "",
      notas: primerSinFecha?.notas || "",
    });
    setMensaje("");
    setMostrarFormulario(true);
  }

  function abrirEdicion(registro: CumpleanosAlumno) {
    setFormulario({
      idAlumno: registro.idAlumno,
      fechaNacimiento: registro.fechaNacimiento,
      notas: registro.notas,
    });
    setMensaje("");
    setMostrarFormulario(true);
  }

  function cambiarAlumno(idAlumno: string) {
    const alumno = registros.find((registro) => registro.idAlumno === idAlumno);
    setFormulario({
      idAlumno,
      fechaNacimiento: alumno?.fechaNacimiento || "",
      notas: alumno?.notas || "",
    });
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
      await guardarCumpleanos(token, formulario);
      setMostrarFormulario(false);
      setMensaje("Cumpleaños guardado correctamente.");
      await cargarCumpleanos();
    } catch (error) {
      setMensaje(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el cumpleaños."
      );
    } finally {
      setGuardando(false);
    }
  }

  async function quitarFecha(registro: CumpleanosAlumno) {
    const confirmado = window.confirm(
      `¿Deseas quitar la fecha de cumpleaños de ${registro.nombre} ${registro.apellido}?`
    );
    if (!confirmado) return;

    const token = obtenerToken();
    if (!token) {
      eliminarSesion();
      router.replace("/");
      return;
    }

    try {
      await eliminarCumpleanos(token, registro.idAlumno);
      setMensaje("Fecha de cumpleaños eliminada correctamente.");
      await cargarCumpleanos();
    } catch (error) {
      setMensaje(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar la fecha."
      );
    }
  }

  const registrosCalculados = useMemo(
    () =>
      registros.map((registro) => ({
        ...registro,
        datos: datosProximoCumpleanos(registro.fechaNacimiento),
      })),
    [registros]
  );

  const registrosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    const mesNumero = Number(mes);

    return registrosCalculados
      .filter((registro) => {
        const coincideTexto =
          !texto ||
          [
            registro.nombre,
            registro.apellido,
            registro.grado,
            registro.seccion,
            registro.notas,
          ]
            .join(" ")
            .toLowerCase()
            .includes(texto);
        const coincideMes = !mesNumero || registro.datos?.mes === mesNumero;
        return coincideTexto && coincideMes;
      })
      .sort((a, b) => {
        const diasA = a.datos?.diasFaltan ?? 99_999;
        const diasB = b.datos?.diasFaltan ?? 99_999;
        return diasA - diasB || a.nombre.localeCompare(b.nombre);
      });
  }, [busqueda, mes, registrosCalculados]);

  const resumen = useMemo(() => {
    const mesActual = new Date().getMonth() + 1;
    return {
      registrados: registrosCalculados.filter((registro) => registro.datos).length,
      esteMes: registrosCalculados.filter(
        (registro) => registro.datos?.mes === mesActual
      ).length,
      proximos: registrosCalculados.filter(
        (registro) =>
          registro.datos && registro.datos.diasFaltan >= 0 && registro.datos.diasFaltan <= 30
      ).length,
      pendientes: registrosCalculados.filter((registro) => !registro.datos).length,
    };
  }, [registrosCalculados]);

  return (
    <main className="birthdays-page">
      <section className="birthdays-header">
        <div>
          <span className="birthdays-chip">Celebraciones del curso</span>
          <h1>Cumpleaños 🎂</h1>
          <p>Organiza las fechas y prepara cada celebración con tiempo.</p>
        </div>
        <button
          type="button"
          className="birthdays-primary-button"
          onClick={abrirNuevo}
          disabled={registros.length === 0}
        >
          + Configurar cumpleaños
        </button>
      </section>

      <section className="birthdays-summary">
        <article><span>🎈</span><div><strong>{resumen.registrados}</strong><small>Con fecha</small></div></article>
        <article><span>🗓️</span><div><strong>{resumen.esteMes}</strong><small>Este mes</small></div></article>
        <article><span>⏰</span><div><strong>{resumen.proximos}</strong><small>Próximos 30 días</small></div></article>
        <article><span>📝</span><div><strong>{resumen.pendientes}</strong><small>Sin fecha</small></div></article>
      </section>

      <section className="birthdays-filters">
        <input
          type="search"
          placeholder="Buscar alumno, grado o nota..."
          value={busqueda}
          onChange={(event) => setBusqueda(event.target.value)}
        />
        <select value={mes} onChange={(event) => setMes(event.target.value)}>
          <option value="">Todos los meses</option>
          {MESES.map((nombre, indice) => (
            <option key={nombre} value={indice + 1}>{nombre}</option>
          ))}
        </select>
      </section>

      {mensaje && <div className="birthdays-message">{mensaje}</div>}

      {cargando ? (
        <section className="birthdays-empty"><div>✨</div><h2>Cargando cumpleaños...</h2></section>
      ) : registros.length === 0 ? (
        <section className="birthdays-empty">
          <div>👩‍🎓</div>
          <h2>Primero registra alumnos</h2>
          <p>Los cumpleaños se vinculan automáticamente con tus estudiantes.</p>
        </section>
      ) : registrosFiltrados.length === 0 ? (
        <section className="birthdays-empty">
          <div>🔎</div><h2>No hay coincidencias</h2><p>Prueba otro nombre o mes.</p>
        </section>
      ) : (
        <section className="birthdays-list">
          {registrosFiltrados.map((registro) => (
            <article className="birthday-card" key={registro.idAlumno}>
              <div className="birthday-avatar">
                {registro.sexo === "Femenino" ? "👧" : registro.sexo === "Masculino" ? "👦" : "🧒"}
              </div>
              <div className="birthday-main">
                <h2>{registro.nombre} {registro.apellido}</h2>
                <p>{registro.grado || "Grado sin indicar"}{registro.seccion ? ` · Sección ${registro.seccion}` : ""}</p>
                {registro.fechaNacimiento ? (
                  <>
                    <strong>🎂 {fechaLegible(registro.fechaNacimiento)}</strong>
                    <span className={`birthday-countdown ${registro.datos?.diasFaltan === 0 ? "today" : ""}`}>
                      {textoCuentaRegresiva(registro.datos?.diasFaltan ?? 0)} · Cumple {registro.datos?.edadCumple} años
                    </span>
                  </>
                ) : (
                  <span className="birthday-missing">Fecha de nacimiento pendiente</span>
                )}
                {registro.notas && <p className="birthday-note">📝 {registro.notas}</p>}
              </div>
              <div className="birthday-actions">
                <button type="button" onClick={() => abrirEdicion(registro)}>
                  {registro.fechaNacimiento ? "Editar" : "Agregar fecha"}
                </button>
                {registro.fechaNacimiento && (
                  <button type="button" className="delete" onClick={() => quitarFecha(registro)}>
                    Quitar fecha
                  </button>
                )}
              </div>
            </article>
          ))}
        </section>
      )}

      {mostrarFormulario && (
        <div className="birthdays-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !guardando) setMostrarFormulario(false);
        }}>
          <section className="birthdays-modal">
            <div className="birthdays-modal-header">
              <div><span className="birthdays-chip">Datos de celebración</span><h2>Configurar cumpleaños</h2></div>
              <button type="button" className="birthdays-close" onClick={() => setMostrarFormulario(false)} disabled={guardando}>×</button>
            </div>
            <form onSubmit={enviarFormulario}>
              <div className="birthdays-form-grid">
                <label className="full">Alumno *
                  <select required value={formulario.idAlumno} onChange={(event) => cambiarAlumno(event.target.value)}>
                    <option value="">Seleccionar alumno</option>
                    {registros.map((registro) => (
                      <option key={registro.idAlumno} value={registro.idAlumno}>
                        {registro.nombre} {registro.apellido}
                      </option>
                    ))}
                  </select>
                </label>
                <label>Fecha de nacimiento *
                  <input type="date" required value={formulario.fechaNacimiento} onChange={(event) => setFormulario((actual) => ({ ...actual, fechaNacimiento: event.target.value }))} />
                </label>
                <label className="full">Nota para la celebración
                  <textarea rows={4} placeholder="Ejemplo: le gusta el color azul, preparar tarjeta..." value={formulario.notas} onChange={(event) => setFormulario((actual) => ({ ...actual, notas: event.target.value }))} />
                </label>
              </div>
              <div className="birthdays-form-actions">
                <button type="button" className="birthdays-secondary-button" onClick={() => setMostrarFormulario(false)} disabled={guardando}>Cancelar</button>
                <button type="submit" className="birthdays-primary-button" disabled={guardando}>{guardando ? "Guardando..." : "Guardar cumpleaños"}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
