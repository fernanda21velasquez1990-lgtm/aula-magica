"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  adminActualizarCompra,
  adminCambiarEstadoMaestra,
  adminCrearMaestra,
  adminCrearRespaldo,
  adminListarAuditoria,
  adminObtenerPanel,
  adminRestablecerContrasena,
  type AdminAuditoria,
  type AdminCompra,
  type AdminMaestra,
  type AdminPanel,
} from "@/lib/apps-script-api";
import {
  eliminarSesion,
  obtenerMaestra,
  obtenerToken,
} from "@/lib/session";

type SeccionAdmin = "RESUMEN" | "MAESTRAS" | "VENTAS" | "AUDITORIA";

const PANEL_VACIO: AdminPanel = {
  estadisticas: {
    maestras: 0,
    maestrasActivas: 0,
    maestrasBloqueadas: 0,
    alumnos: 0,
    asistencias: 0,
    calificaciones: 0,
    telegramVinculados: 0,
    ventasPendientes: 0,
    ventasPagadas: 0,
    ingresos: 0,
  },
  maestras: [],
  compras: [],
  telegram: [],
};

function dinero(valor: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(valor || 0);
}

export default function AdminPage() {
  const router = useRouter();
  const usuario = obtenerMaestra();

  const [seccion, setSeccion] = useState<SeccionAdmin>("RESUMEN");
  const [panel, setPanel] = useState<AdminPanel>(PANEL_VACIO);
  const [auditoria, setAuditoria] = useState<AdminAuditoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [mostrarCrear, setMostrarCrear] = useState(false);
  const [maestraClave, setMaestraClave] = useState<AdminMaestra | null>(null);
  const [nuevaClave, setNuevaClave] = useState("");

  const [formulario, setFormulario] = useState({
    nombre: "",
    apellido: "",
    correo: "",
    contrasena: "",
    grado: "",
    seccion: "",
  });

  const cargarPanel = useCallback(async () => {
    const token = obtenerToken();

    if (!token) {
      eliminarSesion();
      router.replace("/");
      return;
    }

    setCargando(true);
    setMensaje("");

    try {
      const resultado = await adminObtenerPanel(token);
      setPanel(resultado);
    } catch (error) {
      setMensaje(
        error instanceof Error
          ? error.message
          : "No se pudo abrir el Panel Administrador."
      );
    } finally {
      setCargando(false);
    }
  }, [router]);

  useEffect(() => {
    if (!usuario?.esAdmin) {
      router.replace("/dashboard");
      return;
    }

    void cargarPanel();
  }, [cargarPanel, router, usuario?.esAdmin]);

  async function cargarAuditoria() {
    const token = obtenerToken();
    if (!token) return;

    setProcesando("AUDITORIA");
    setMensaje("");

    try {
      setAuditoria(await adminListarAuditoria(token, 150));
      setSeccion("AUDITORIA");
    } catch (error) {
      setMensaje(
        error instanceof Error
          ? error.message
          : "No se pudo cargar la auditoría."
      );
    } finally {
      setProcesando("");
    }
  }

  async function crearMaestra(event: FormEvent) {
    event.preventDefault();
    const token = obtenerToken();
    if (!token) return;

    setProcesando("CREAR");
    setMensaje("");

    try {
      await adminCrearMaestra(token, formulario);
      setFormulario({
        nombre: "",
        apellido: "",
        correo: "",
        contrasena: "",
        grado: "",
        seccion: "",
      });
      setMostrarCrear(false);
      setMensaje("✅ Maestra creada correctamente.");
      await cargarPanel();
    } catch (error) {
      setMensaje(
        error instanceof Error
          ? error.message
          : "No se pudo crear la maestra."
      );
    } finally {
      setProcesando("");
    }
  }

  async function cambiarEstado(maestra: AdminMaestra) {
    const token = obtenerToken();
    if (!token) return;

    const nuevoEstado =
      maestra.estado === "ACTIVA" ? "BLOQUEADA" : "ACTIVA";

    setProcesando(maestra.idMaestra);
    setMensaje("");

    try {
      await adminCambiarEstadoMaestra(
        token,
        maestra.idMaestra,
        nuevoEstado
      );
      setMensaje(
        nuevoEstado === "ACTIVA"
          ? "✅ Cuenta activada correctamente."
          : "🔒 Cuenta bloqueada correctamente."
      );
      await cargarPanel();
    } catch (error) {
      setMensaje(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar la cuenta."
      );
    } finally {
      setProcesando("");
    }
  }

  async function restablecerClave(event: FormEvent) {
    event.preventDefault();
    const token = obtenerToken();

    if (!token || !maestraClave) return;

    setProcesando("CLAVE");
    setMensaje("");

    try {
      await adminRestablecerContrasena(
        token,
        maestraClave.idMaestra,
        nuevaClave
      );
      setMensaje("✅ Contraseña restablecida correctamente.");
      setMaestraClave(null);
      setNuevaClave("");
    } catch (error) {
      setMensaje(
        error instanceof Error
          ? error.message
          : "No se pudo restablecer la contraseña."
      );
    } finally {
      setProcesando("");
    }
  }

  async function crearRespaldo() {
    const token = obtenerToken();
    if (!token) return;

    setProcesando("RESPALDO");
    setMensaje("");

    try {
      const resultado = await adminCrearRespaldo(token);
      setMensaje(`✅ Respaldo creado: ${resultado.nombre}`);
      window.open(resultado.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      setMensaje(
        error instanceof Error
          ? error.message
          : "No se pudo crear el respaldo."
      );
    } finally {
      setProcesando("");
    }
  }

  async function actualizarCompra(
    compra: AdminCompra,
    estado: "PAGADO" | "CANCELADO" | "PENDIENTE"
  ) {
    const token = obtenerToken();
    if (!token) return;

    setProcesando(compra.idCompra);
    setMensaje("");

    try {
      await adminActualizarCompra(token, compra.idCompra, estado);
      setMensaje(`✅ Compra actualizada a ${estado.toLowerCase()}.`);
      await cargarPanel();
    } catch (error) {
      setMensaje(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar la compra."
      );
    } finally {
      setProcesando("");
    }
  }

  const maestrasVisibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) return panel.maestras;

    return panel.maestras.filter((maestra) =>
      [
        maestra.nombre,
        maestra.apellido,
        maestra.correo,
        maestra.usuario,
        maestra.grado,
        maestra.seccion,
      ]
        .join(" ")
        .toLowerCase()
        .includes(texto)
    );
  }, [busqueda, panel.maestras]);

  if (!usuario?.esAdmin) {
    return <div className="state-card">🔐 Verificando acceso administrativo...</div>;
  }

  if (cargando) {
    return <div className="state-card">🛡️ Preparando el Panel Administrador...</div>;
  }

  return (
    <main className="admin-pro-page">
      <section className="admin-pro-hero">
        <div>
          <span>Acceso privado · Versión 8.0</span>
          <h1>Panel Administrador 🛡️</h1>
          <p>
            Controla cuentas, ventas, respaldos, Telegram y auditoría desde
            un solo lugar seguro.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void crearRespaldo()}
          disabled={procesando === "RESPALDO"}
        >
          {procesando === "RESPALDO"
            ? "Creando respaldo..."
            : "💾 Crear respaldo"}
        </button>
      </section>

      <section className="admin-pro-tabs">
        <button
          className={seccion === "RESUMEN" ? "active" : ""}
          onClick={() => setSeccion("RESUMEN")}
        >
          📊 Resumen
        </button>
        <button
          className={seccion === "MAESTRAS" ? "active" : ""}
          onClick={() => setSeccion("MAESTRAS")}
        >
          👩‍🏫 Maestras
        </button>
        <button
          className={seccion === "VENTAS" ? "active" : ""}
          onClick={() => setSeccion("VENTAS")}
        >
          🧰 Ventas
        </button>
        <button
          className={seccion === "AUDITORIA" ? "active" : ""}
          onClick={() => void cargarAuditoria()}
        >
          🧾 Auditoría
        </button>
      </section>

      {mensaje && <div className="admin-pro-message">{mensaje}</div>}

      {seccion === "RESUMEN" && (
        <>
          <section className="admin-pro-kpis">
            <article><span>👩‍🏫</span><strong>{panel.estadisticas.maestras}</strong><small>Maestras</small></article>
            <article><span>✅</span><strong>{panel.estadisticas.maestrasActivas}</strong><small>Cuentas activas</small></article>
            <article><span>🔒</span><strong>{panel.estadisticas.maestrasBloqueadas}</strong><small>Bloqueadas</small></article>
            <article><span>👩‍🎓</span><strong>{panel.estadisticas.alumnos}</strong><small>Alumnos</small></article>
            <article><span>🤖</span><strong>{panel.estadisticas.telegramVinculados}</strong><small>Telegram vinculados</small></article>
            <article><span>⏳</span><strong>{panel.estadisticas.ventasPendientes}</strong><small>Ventas pendientes</small></article>
            <article><span>💳</span><strong>{panel.estadisticas.ventasPagadas}</strong><small>Ventas pagadas</small></article>
            <article className="income"><span>💰</span><strong>{dinero(panel.estadisticas.ingresos)}</strong><small>Ingresos confirmados</small></article>
          </section>

          <section className="admin-pro-dashboard-grid">
            <article className="admin-pro-card">
              <header>
                <div>
                  <h2>Estado de las cuentas</h2>
                  <p>Distribución actual de maestras.</p>
                </div>
              </header>

              <div className="admin-pro-account-chart">
                <div
                  className="active"
                  style={{
                    width: `${
                      panel.estadisticas.maestras
                        ? (panel.estadisticas.maestrasActivas /
                            panel.estadisticas.maestras) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>

              <div className="admin-pro-legend">
                <span>✅ Activas: {panel.estadisticas.maestrasActivas}</span>
                <span>🔒 Bloqueadas: {panel.estadisticas.maestrasBloqueadas}</span>
              </div>
            </article>

            <article className="admin-pro-card">
              <header>
                <div>
                  <h2>Actividad de la plataforma</h2>
                  <p>Registros acumulados.</p>
                </div>
              </header>

              <div className="admin-pro-activity-list">
                <div><span>📋 Asistencias</span><b>{panel.estadisticas.asistencias}</b></div>
                <div><span>📝 Calificaciones</span><b>{panel.estadisticas.calificaciones}</b></div>
                <div><span>🤖 Telegram</span><b>{panel.estadisticas.telegramVinculados}</b></div>
                <div><span>🛒 Ventas</span><b>{panel.estadisticas.ventasPagadas + panel.estadisticas.ventasPendientes}</b></div>
              </div>
            </article>
          </section>
        </>
      )}

      {seccion === "MAESTRAS" && (
        <section className="admin-pro-card">
          <header className="admin-pro-section-header">
            <div>
              <h2>Gestión de maestras</h2>
              <p>Crea, bloquea o restablece cuentas.</p>
            </div>
            <button onClick={() => setMostrarCrear(true)}>
              ➕ Crear maestra
            </button>
          </header>

          <label className="admin-pro-search">
            🔎
            <input
              type="search"
              placeholder="Buscar por nombre, correo, curso..."
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
            />
          </label>

          <div className="admin-pro-table-scroll">
            <table className="admin-pro-table">
              <thead>
                <tr>
                  <th>Maestra</th>
                  <th>Curso</th>
                  <th>Alumnos</th>
                  <th>Estado</th>
                  <th>Último acceso</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {maestrasVisibles.map((maestra) => (
                  <tr key={maestra.idMaestra}>
                    <td>
                      <strong>{maestra.nombre} {maestra.apellido}</strong>
                      <small>{maestra.correo}</small>
                    </td>
                    <td>{maestra.grado || "Sin grado"} {maestra.seccion ? `· ${maestra.seccion}` : ""}</td>
                    <td>{maestra.totalAlumnos}</td>
                    <td>
                      <span className={`admin-status ${maestra.estado.toLowerCase()}`}>
                        {maestra.estado}
                      </span>
                    </td>
                    <td>{maestra.ultimoAcceso || "Sin acceso"}</td>
                    <td>
                      <div className="admin-pro-actions">
                        <button
                          onClick={() => void cambiarEstado(maestra)}
                          disabled={procesando === maestra.idMaestra}
                        >
                          {maestra.estado === "ACTIVA" ? "🔒 Bloquear" : "✅ Activar"}
                        </button>
                        <button onClick={() => setMaestraClave(maestra)}>
                          🔑 Clave
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {seccion === "VENTAS" && (
        <section className="admin-pro-card">
          <header>
            <div>
              <h2>Ventas de Mi Baúl</h2>
              <p>Confirma pagos y desbloquea materiales.</p>
            </div>
          </header>

          <div className="admin-pro-table-scroll">
            <table className="admin-pro-table">
              <thead>
                <tr>
                  <th>Solicitud</th>
                  <th>Maestra</th>
                  <th>Fecha</th>
                  <th>Monto</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {panel.compras.map((compra) => (
                  <tr key={compra.idCompra}>
                    <td><strong>{compra.idCompra}</strong><small>{compra.idMaterial}</small></td>
                    <td>{compra.idMaestra}</td>
                    <td>{compra.fechaSolicitud}</td>
                    <td>{dinero(compra.monto)}</td>
                    <td><span className={`admin-status ${compra.estado.toLowerCase()}`}>{compra.estado}</span></td>
                    <td>
                      <div className="admin-pro-actions">
                        {compra.estado !== "PAGADO" && (
                          <button onClick={() => void actualizarCompra(compra, "PAGADO")}>✅ Pagar</button>
                        )}
                        {compra.estado !== "CANCELADO" && (
                          <button onClick={() => void actualizarCompra(compra, "CANCELADO")}>❌ Cancelar</button>
                        )}
                        {compra.estado !== "PENDIENTE" && (
                          <button onClick={() => void actualizarCompra(compra, "PENDIENTE")}>⏳ Pendiente</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {seccion === "AUDITORIA" && (
        <section className="admin-pro-card">
          <header>
            <div>
              <h2>Auditoría del sistema</h2>
              <p>Últimos movimientos registrados.</p>
            </div>
          </header>

          {procesando === "AUDITORIA" ? (
            <div className="admin-pro-empty">Cargando auditoría...</div>
          ) : (
            <div className="admin-pro-audit-list">
              {auditoria.map((item) => (
                <article key={item.id}>
                  <div>
                    <strong>{item.accion}</strong>
                    <span>{item.modulo}</span>
                  </div>
                  <p>{item.detalle}</p>
                  <time>{item.fecha}</time>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {mostrarCrear && (
        <div className="admin-pro-modal-backdrop">
          <form className="admin-pro-modal" onSubmit={crearMaestra}>
            <button type="button" className="close" onClick={() => setMostrarCrear(false)}>×</button>
            <span>👩‍🏫</span>
            <h2>Crear nueva maestra</h2>
            <div className="admin-pro-form-grid">
              <label>Nombre<input required value={formulario.nombre} onChange={(e) => setFormulario({...formulario, nombre:e.target.value})}/></label>
              <label>Apellido<input required value={formulario.apellido} onChange={(e) => setFormulario({...formulario, apellido:e.target.value})}/></label>
              <label className="wide">Correo<input type="email" required value={formulario.correo} onChange={(e) => setFormulario({...formulario, correo:e.target.value})}/></label>
              <label>Grado<input value={formulario.grado} onChange={(e) => setFormulario({...formulario, grado:e.target.value})}/></label>
              <label>Sección<input value={formulario.seccion} onChange={(e) => setFormulario({...formulario, seccion:e.target.value})}/></label>
              <label className="wide">Contraseña inicial<input type="password" minLength={6} required value={formulario.contrasena} onChange={(e) => setFormulario({...formulario, contrasena:e.target.value})}/></label>
            </div>
            <button className="primary" disabled={procesando === "CREAR"}>
              {procesando === "CREAR" ? "Creando..." : "Crear cuenta"}
            </button>
          </form>
        </div>
      )}

      {maestraClave && (
        <div className="admin-pro-modal-backdrop">
          <form className="admin-pro-modal compact" onSubmit={restablecerClave}>
            <button type="button" className="close" onClick={() => setMaestraClave(null)}>×</button>
            <span>🔑</span>
            <h2>Restablecer contraseña</h2>
            <p>{maestraClave.nombre} {maestraClave.apellido}</p>
            <label>Nueva contraseña<input type="password" minLength={6} required value={nuevaClave} onChange={(e) => setNuevaClave(e.target.value)}/></label>
            <button className="primary" disabled={procesando === "CLAVE"}>
              {procesando === "CLAVE" ? "Guardando..." : "Cambiar contraseña"}
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
