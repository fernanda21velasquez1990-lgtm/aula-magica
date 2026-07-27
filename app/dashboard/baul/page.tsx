"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  listarMaterialesBaul,
  solicitarCompraBaul,
  type MaterialBaul,
  type PagoBaul,
} from "@/lib/apps-script-api";
import { eliminarSesion, obtenerMaestra, obtenerToken } from "@/lib/session";

function formatoPrecio(valor: number, moneda: string) {
  try {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: moneda || "COP",
      maximumFractionDigits: 0,
    }).format(valor);
  } catch {
    return `$ ${new Intl.NumberFormat("es-CO").format(valor)}`;
  }
}

function limpiarWhatsApp(valor: string) {
  return String(valor || "").replace(/\D/g, "");
}

export default function BaulPage() {
  const router = useRouter();
  const [materiales, setMateriales] = useState<MaterialBaul[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [pago, setPago] = useState<PagoBaul | null>(null);
  const [categoria, setCategoria] = useState("TODAS");
  const [busqueda, setBusqueda] = useState("");
  const [soloMios, setSoloMios] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [comprando, setComprando] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [materialCompra, setMaterialCompra] =
    useState<MaterialBaul | null>(null);
  const [idCompra, setIdCompra] = useState("");

  useEffect(() => {
    void cargar();
  }, []);

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
      const resultado = await listarMaterialesBaul(token);
      setMateriales(resultado.materiales);
      setCategorias(resultado.categorias);
      setPago(resultado.pago);
    } catch (error) {
      setMensaje(
        error instanceof Error
          ? error.message
          : "No se pudo abrir Mi Baúl."
      );
    } finally {
      setCargando(false);
    }
  }

  async function comprar(material: MaterialBaul) {
    const token = obtenerToken();
    if (!token) {
      eliminarSesion();
      router.replace("/");
      return;
    }

    setComprando(material.idMaterial);
    setMensaje("");

    try {
      const resultado = await solicitarCompraBaul(
        token,
        material.idMaterial
      );

      if (resultado.yaComprado) {
        setMensaje("Este material ya está desbloqueado.");
        await cargar();
        return;
      }

      setIdCompra(resultado.idCompra);
      setMaterialCompra(material);
      if (resultado.pago) setPago(resultado.pago);
    } catch (error) {
      setMensaje(
        error instanceof Error
          ? error.message
          : "No se pudo iniciar la compra."
      );
    } finally {
      setComprando("");
    }
  }

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return materiales.filter((material) => {
      if (soloMios && !material.desbloqueado) return false;
      if (categoria !== "TODAS" && material.categoria !== categoria) {
        return false;
      }

      if (!texto) return true;

      return [
        material.titulo,
        material.descripcion,
        material.categoria,
        material.nivel,
        material.etiqueta,
      ]
        .join(" ")
        .toLowerCase()
        .includes(texto);
    });
  }, [materiales, categoria, busqueda, soloMios]);

  const whatsappUrl = useMemo(() => {
    if (!materialCompra || !pago) return "";

    const maestra = obtenerMaestra();
    const nombre = maestra
      ? `${maestra.nombre} ${maestra.apellido}`.trim()
      : "Maestra";

    const texto = [
      "Hola, deseo completar una compra de Mi Baúl Digital.",
      "",
      `Material: ${materialCompra.titulo}`,
      `Precio: ${formatoPrecio(materialCompra.precio, pago.moneda)}`,
      `Solicitud: ${idCompra}`,
      `Maestra: ${nombre}`,
      "",
      "Adjunto mi comprobante de pago.",
    ].join("\n");

    return `https://wa.me/${limpiarWhatsApp(
      pago.whatsapp
    )}?text=${encodeURIComponent(texto)}`;
  }, [materialCompra, pago, idCompra]);

  return (
    <main className="vault-page">
      <section className="vault-hero">
        <div className="vault-hero-copy">
          <span className="vault-kicker">✨ Recursos que inspiran</span>
          <h1>Mi Baúl Digital 🧰</h1>
          <p>
            Descubre materiales educativos listos para usar. Compra una vez,
            desbloquea tu recurso y consérvalo siempre en tu baúl.
          </p>
          <div className="vault-hero-stats">
            <span>📚 {materiales.length} materiales</span>
            <span>
              🔓 {materiales.filter((item) => item.desbloqueado).length} tuyos
            </span>
            <span>⚡ Descarga inmediata al aprobar el pago</span>
          </div>
        </div>
        <div className="vault-hero-art" aria-hidden="true">
          <div className="vault-glow" />
          <div className="vault-chest">🧰</div>
          <span className="vault-float one">📘</span>
          <span className="vault-float two">🎨</span>
          <span className="vault-float three">✏️</span>
          <span className="vault-float four">⭐</span>
        </div>
      </section>

      <section className="vault-controls">
        <label className="vault-search">
          <span>🔎</span>
          <input
            type="search"
            placeholder="Buscar material, categoría o nivel..."
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
          />
        </label>

        <div className="vault-category-row">
          <button
            type="button"
            className={categoria === "TODAS" && !soloMios ? "active" : ""}
            onClick={() => {
              setCategoria("TODAS");
              setSoloMios(false);
            }}
          >
            Todos
          </button>

          {categorias.map((item) => (
            <button
              type="button"
              key={item}
              className={categoria === item && !soloMios ? "active" : ""}
              onClick={() => {
                setCategoria(item);
                setSoloMios(false);
              }}
            >
              {item}
            </button>
          ))}

          <button
            type="button"
            className={soloMios ? "active owned" : ""}
            onClick={() => setSoloMios(true)}
          >
            🔓 Mis materiales
          </button>
        </div>
      </section>

      {mensaje && <div className="vault-message">{mensaje}</div>}

      {cargando ? (
        <section className="vault-empty">
          <div>✨</div>
          <h2>Abriendo tu baúl...</h2>
        </section>
      ) : visibles.length === 0 ? (
        <section className="vault-empty">
          <div>🧰</div>
          <h2>No encontramos materiales</h2>
          <p>Prueba otra categoría o palabra de búsqueda.</p>
        </section>
      ) : (
        <section className="vault-grid">
          {visibles.map((material) => (
            <article
              key={material.idMaterial}
              className={`vault-card ${
                material.destacado ? "featured" : ""
              } ${material.desbloqueado ? "unlocked" : "locked"}`}
            >
              <div className="vault-cover">
                {material.imagenUrl ? (
                  <img
                    src={material.imagenUrl}
                    alt={`Portada de ${material.titulo}`}
                  />
                ) : (
                  <div className="vault-cover-placeholder">📚</div>
                )}

                <div className="vault-cover-shade" />

                {material.etiqueta && (
                  <span className="vault-label">{material.etiqueta}</span>
                )}

                <span
                  className={`vault-lock ${
                    material.desbloqueado ? "open" : ""
                  }`}
                >
                  {material.desbloqueado ? "🔓" : "🔒"}
                </span>
              </div>

              <div className="vault-card-body">
                <div className="vault-meta">
                  <span>{material.categoria}</span>
                  <span>{material.nivel}</span>
                </div>

                <h2>{material.titulo}</h2>
                <p>{material.descripcion}</p>

                <div className="vault-card-footer">
                  <strong>
                    {formatoPrecio(
                      material.precio,
                      pago?.moneda || "COP"
                    )}
                  </strong>

                  {material.desbloqueado ? (
                    <a
                      className="vault-download"
                      href={material.archivoUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      ⬇️ Descargar
                    </a>
                  ) : material.compraPendiente ? (
                    <button
                      type="button"
                      className="vault-pending"
                      onClick={() => comprar(material)}
                    >
                      ⏳ Pago pendiente
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="vault-buy"
                      disabled={comprando === material.idMaterial}
                      onClick={() => void comprar(material)}
                    >
                      {comprando === material.idMaterial
                        ? "Preparando..."
                        : "🛒 Comprar"}
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      {materialCompra && pago && (
        <div
          className="vault-modal-backdrop"
          role="presentation"
          onMouseDown={() => setMaterialCompra(null)}
        >
          <section
            className="vault-payment-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="vault-payment-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="vault-modal-close"
              aria-label="Cerrar"
              onClick={() => setMaterialCompra(null)}
            >
              ×
            </button>

            <div className="vault-payment-icon">📲</div>
            <span className="vault-kicker">Completar compra</span>
            <h2 id="vault-payment-title">{materialCompra.titulo}</h2>
            <p className="vault-payment-price">
              {formatoPrecio(materialCompra.precio, pago.moneda)}
            </p>

            <div className="vault-payment-data">
              <div>
                <small>Banco</small>
                <strong>{pago.banco}</strong>
              </div>
              <div>
                <small>Teléfono</small>
                <strong>{pago.telefono}</strong>
              </div>
              <div>
                <small>Documento</small>
                <strong>{pago.documento}</strong>
              </div>
              <div>
                <small>Titular</small>
                <strong>{pago.titular}</strong>
              </div>
            </div>

            <div className="vault-order-code">
              Solicitud: <strong>{idCompra}</strong>
            </div>

            <p className="vault-payment-help">
              Realiza el pago, pulsa el botón de WhatsApp y envía el
              comprobante. Cuando la compra sea marcada como PAGADO en
              Google Sheets, el material se desbloqueará automáticamente.
            </p>

            <a
              className="vault-whatsapp"
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
            >
              💬 Enviar comprobante por WhatsApp
            </a>
          </section>
        </div>
      )}
    </main>
  );
}
