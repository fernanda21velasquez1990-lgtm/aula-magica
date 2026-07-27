"use client";

import { useEffect, useMemo, useState } from "react";
import {
  adminListarSolicitudesPago,
  adminRevisarSolicitudPago,
  type SolicitudPago,
} from "@/lib/apps-script-api";
import { obtenerToken } from "@/lib/session";

const dineroUsd=(v:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:2}).format(v||0);
const dineroVes=(v:number)=>new Intl.NumberFormat("es-VE",{style:"currency",currency:"VES",maximumFractionDigits:2}).format(v||0);

export default function SolicitudesPagoAdminPage() {
  const [solicitudes, setSolicitudes] = useState<SolicitudPago[]>([]);
  const [seleccionada, setSeleccionada] = useState<SolicitudPago | null>(null);
  const [filtro, setFiltro] = useState("PENDIENTE");
  const [notas, setNotas] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [procesando, setProcesando] = useState(false);

  async function cargar() {
    const token = obtenerToken();
    if (!token) return;
    setSolicitudes(await adminListarSolicitudesPago(token));
  }

  useEffect(() => {
    void cargar().catch((error) =>
      setMensaje(
        error instanceof Error ? error.message : "No se pudo cargar."
      )
    );
  }, []);

  const visibles = useMemo(
    () =>
      solicitudes.filter(
        (item) => filtro === "TODAS" || item.estado === filtro
      ),
    [filtro, solicitudes]
  );

  async function revisar(decision: "APROBAR" | "RECHAZAR") {
    if (!seleccionada) return;
    const token = obtenerToken();
    if (!token) return;

    setProcesando(true);
    setMensaje("");

    try {
      const resultado = await adminRevisarSolicitudPago(token, {
        idSolicitud: seleccionada.idSolicitud,
        decision,
        notasAdmin: notas,
      });

      setMensaje(
        decision === "APROBAR"
          ? `✅ Pago aprobado y licencia renovada hasta ${resultado.vencimiento}.`
          : "✅ Solicitud rechazada."
      );
      setSeleccionada(null);
      setNotas("");
      await cargar();
    } catch (error) {
      setMensaje(
        error instanceof Error
          ? error.message
          : "No se pudo revisar la solicitud."
      );
    } finally {
      setProcesando(false);
    }
  }

  return (
    <main className="payment-admin-page">
      <section className="payment-admin-hero">
        <span>ADMINISTRACIÓN DE PAGOS</span>
        <h1>Comprobantes recibidos 🧾</h1>
        <p>
          Revisa cada comprobante antes de activar o renovar la licencia.
        </p>
      </section>

      {mensaje && <div className="school-message">{mensaje}</div>}

      <section className="payment-admin-filters">
        <select
          value={filtro}
          onChange={(event) => setFiltro(event.target.value)}
        >
          <option value="PENDIENTE">Pendientes</option>
          <option value="APROBADA">Aprobadas</option>
          <option value="RECHAZADA">Rechazadas</option>
          <option value="TODAS">Todas</option>
        </select>
        <button onClick={() => void cargar()}>🔄 Actualizar</button>
      </section>

      <section className="payment-requests-grid">
        {visibles.map((solicitud) => (
          <article key={solicitud.idSolicitud}>
            <header>
              <div>
                <h3>{solicitud.nombreMaestra}</h3>
                <small>{solicitud.correo}</small>
              </div>
              <i className={`payment-request-status ${solicitud.estado.toLowerCase()}`}>
                {solicitud.estado}
              </i>
            </header>

            <div className="payment-request-info">
              <span>Plan <b>{solicitud.plan}</b></span>
              <span>
                Monto{" "}
                <b>
                  {solicitud.moneda === "VES"
                    ? dineroVes(solicitud.monto)
                    : dineroUsd(solicitud.monto)}
                </b>
              </span>
              <span>Método <b>{solicitud.metodo}</b></span>
              <span>Referencia <b>{solicitud.referencia || "Sin referencia"}</b></span>
            </div>

            <button
              onClick={() => {
                setSeleccionada(solicitud);
                setNotas("");
              }}
            >
              Revisar comprobante
            </button>
          </article>
        ))}
      </section>

      {seleccionada && (
        <div className="subscription-modal-backdrop">
          <section className="payment-review-modal">
            <header>
              <div>
                <h2>{seleccionada.nombreMaestra}</h2>
                <p>{seleccionada.plan}</p>
              </div>
              <button onClick={() => setSeleccionada(null)}>×</button>
            </header>

            <img
              src={seleccionada.comprobante}
              alt="Comprobante enviado"
            />

            <div className="payment-review-summary">
              <span>
                Monto{" "}
                <b>
                  {seleccionada.moneda === "VES"
                    ? dineroVes(seleccionada.monto)
                    : dineroUsd(seleccionada.monto)}
                </b>
              </span>
              <span>Referencia <b>{seleccionada.referencia || "No indicada"}</b></span>
              <span>Método <b>{seleccionada.metodo}</b></span>
              <span>Fecha <b>{seleccionada.fechaSolicitud}</b></span>
            </div>

            {seleccionada.notasCliente && (
              <p className="payment-client-note">
                {seleccionada.notasCliente}
              </p>
            )}

            <label>
              Nota de revisión
              <textarea
                rows={3}
                value={notas}
                onChange={(event) => setNotas(event.target.value)}
              />
            </label>

            <div className="payment-review-actions">
              <button
                className="approve"
                disabled={procesando}
                onClick={() => void revisar("APROBAR")}
              >
                ✅ Aprobar y renovar
              </button>
              <button
                className="reject"
                disabled={procesando}
                onClick={() => void revisar("RECHAZAR")}
              >
                ❌ Rechazar
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
