"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import {
  adminObtenerSuscripciones,
  crearSolicitudPago,
  listarMisSolicitudesPago,
  type PlanPlataforma,
  type SolicitudPago,
} from "@/lib/apps-script-api";
import { obtenerToken } from "@/lib/session";

const dineroUsd=(v:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:2}).format(v||0);
const dineroVes=(v:number)=>new Intl.NumberFormat("es-VE",{style:"currency",currency:"VES",maximumFractionDigits:2}).format(v||0);

async function comprimirImagen(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });

  const max = 900;
  const scale = Math.min(1, max / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));

  const context = canvas.getContext("2d");
  if (!context) throw new Error("No se pudo procesar la imagen.");

  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  let quality = 0.72;
  let result = canvas.toDataURL("image/jpeg", quality);

  while (result.length > 47000 && quality > 0.25) {
    quality -= 0.08;
    result = canvas.toDataURL("image/jpeg", quality);
  }

  if (result.length > 48000) {
    throw new Error(
      "La imagen sigue siendo demasiado grande. Toma una foto más cercana al comprobante."
    );
  }

  return result;
}

export default function RenovarPage() {
  const [planes, setPlanes] = useState<PlanPlataforma[]>([]);
  const [solicitudes, setSolicitudes] = useState<SolicitudPago[]>([]);
  const [mensaje, setMensaje] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [formulario, setFormulario] = useState({
    idPlan: "",
    moneda: "USD",
    monto: 0,
    metodo: "TRANSFERENCIA",
    referencia: "",
    comprobante: "",
    notas: "",
  });

  async function cargar() {
    const token = obtenerToken();
    if (!token) return;

    const [panel, historial] = await Promise.all([
      adminObtenerSuscripciones(token),
      listarMisSolicitudesPago(token),
    ]);

    setPlanes(panel.planes);
    setSolicitudes(historial);

    if (!formulario.idPlan && panel.planes[0]) {
      setFormulario((actual) => ({
        ...actual,
        idPlan: panel.planes[0].idPlan,
        monto: panel.planes[0].precioUsd,
      }));
    }
  }

  useEffect(() => {
    void cargar().catch((error) =>
      setMensaje(
        error instanceof Error ? error.message : "No se pudo cargar."
      )
    );
  }, []);

  function cambiarPlan(idPlan: string) {
    const plan = planes.find((item) => item.idPlan === idPlan);
    setFormulario({
      ...formulario,
      idPlan,
      monto:
        formulario.moneda === "VES"
          ? Number(plan?.precioVes || 0)
          : Number(plan?.precioUsd || 0),
    });
  }

  function cambiarMoneda(moneda: string) {
    const plan = planes.find((item) => item.idPlan === formulario.idPlan);
    setFormulario({
      ...formulario,
      moneda,
      monto:
        moneda === "VES"
          ? Number(plan?.precioVes || 0)
          : Number(plan?.precioUsd || 0),
    });
  }

  async function seleccionarComprobante(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    setMensaje("Procesando comprobante...");

    try {
      const comprobante = await comprimirImagen(file);
      setFormulario({ ...formulario, comprobante });
      setMensaje("✅ Comprobante listo.");
    } catch (error) {
      setMensaje(
        error instanceof Error
          ? error.message
          : "No se pudo procesar la imagen."
      );
    }
  }

  async function enviar(event: FormEvent) {
    event.preventDefault();
    const token = obtenerToken();
    if (!token) return;

    if (!formulario.comprobante) {
      setMensaje("Debes agregar una imagen del comprobante.");
      return;
    }

    setProcesando(true);
    setMensaje("");

    try {
      await crearSolicitudPago(token, formulario);
      setMensaje(
        "✅ Comprobante enviado. El administrador revisará tu pago."
      );
      setFormulario({
        ...formulario,
        referencia: "",
        comprobante: "",
        notas: "",
      });
      await cargar();
    } catch (error) {
      setMensaje(
        error instanceof Error
          ? error.message
          : "No se pudo enviar la solicitud."
      );
    } finally {
      setProcesando(false);
    }
  }

  return (
    <main className="renew-page">
      <section className="renew-hero">
        <span>RENOVACIÓN DE SUSCRIPCIÓN</span>
        <h1>Renovar mi plan 💳</h1>
        <p>
          Selecciona tu plan, realiza el pago y envía el comprobante.
        </p>
      </section>

      {mensaje && <div className="school-message">{mensaje}</div>}

      <div className="renew-layout">
        <form className="renew-form" onSubmit={enviar}>
          <h2>Enviar comprobante</h2>

          <label>
            Plan
            <select
              value={formulario.idPlan}
              onChange={(event) => cambiarPlan(event.target.value)}
            >
              {planes.map((plan) => (
                <option value={plan.idPlan} key={plan.idPlan}>
                  {plan.nombre} · {plan.duracionDias} días
                </option>
              ))}
            </select>
          </label>

          <label>
            Moneda
            <select
              value={formulario.moneda}
              onChange={(event) => cambiarMoneda(event.target.value)}
            >
              <option value="USD">Dólares (USD)</option>
              <option value="VES">Bolívares (VES)</option>
            </select>
          </label>

          <label>
            Monto
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={formulario.monto}
              onChange={(event) =>
                setFormulario({
                  ...formulario,
                  monto: Number(event.target.value),
                })
              }
            />
          </label>

          <label>
            Método de pago
            <select
              value={formulario.metodo}
              onChange={(event) =>
                setFormulario({
                  ...formulario,
                  metodo: event.target.value,
                })
              }
            >
              <option>TRANSFERENCIA</option>
              <option>EFECTIVO</option>
              <option>NEQUI</option>
              <option>DAVIPLATA</option>
              <option>PAGO MÓVIL</option>
              <option>ZELLE</option>
              <option>OTRO</option>
            </select>
          </label>

          <label>
            Referencia
            <input
              value={formulario.referencia}
              onChange={(event) =>
                setFormulario({
                  ...formulario,
                  referencia: event.target.value,
                })
              }
            />
          </label>

          <label>
            Comprobante
            <input
              required
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={seleccionarComprobante}
            />
          </label>

          {formulario.comprobante && (
            <img
              className="payment-proof-preview"
              src={formulario.comprobante}
              alt="Vista previa del comprobante"
            />
          )}

          <label>
            Nota para el administrador
            <textarea
              rows={3}
              value={formulario.notas}
              onChange={(event) =>
                setFormulario({
                  ...formulario,
                  notas: event.target.value,
                })
              }
            />
          </label>

          <button disabled={procesando}>
            {procesando ? "Enviando..." : "📤 Enviar comprobante"}
          </button>
        </form>

        <section className="renew-plans">
          <h2>Planes disponibles</h2>
          {planes.map((plan) => (
            <article key={plan.idPlan}>
              <h3>{plan.nombre}</h3>
              <strong>{plan.duracionDias} días</strong>
              <span>{dineroUsd(plan.precioUsd)}</span>
              <span>{dineroVes(plan.precioVes)}</span>
              <small>
                {plan.limiteAlumnos < 0
                  ? "Alumnos ilimitados"
                  : `Hasta ${plan.limiteAlumnos} alumnos`}
              </small>
            </article>
          ))}
        </section>
      </div>

      <section className="payment-history">
        <h2>Mis solicitudes</h2>
        {solicitudes.length === 0 ? (
          <p>No has enviado comprobantes todavía.</p>
        ) : (
          solicitudes.map((solicitud) => (
            <article key={solicitud.idSolicitud}>
              <div>
                <strong>{solicitud.plan}</strong>
                <small>{solicitud.fechaSolicitud}</small>
              </div>
              <span>
                {solicitud.moneda === "VES"
                  ? dineroVes(solicitud.monto)
                  : dineroUsd(solicitud.monto)}
              </span>
              <i className={`payment-request-status ${solicitud.estado.toLowerCase()}`}>
                {solicitud.estado}
              </i>
              {solicitud.notasAdmin && (
                <p>{solicitud.notasAdmin}</p>
              )}
            </article>
          ))
        )}
      </section>
    </main>
  );
}
