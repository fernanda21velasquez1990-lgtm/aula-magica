import { request as httpsRequest } from "node:https";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MAX_REDIRECTS = 6;
const TIMEOUT_MS = 20_000;

type ResultadoHttp = {
  status: number;
  texto: string;
};

function obtenerUrlAppsScript() {
  return (
    process.env.APPS_SCRIPT_URL?.trim() ||
    process.env.NEXT_PUBLIC_APPS_SCRIPT_URL?.trim() ||
    ""
  );
}

function detalleError(error: unknown) {
  if (!(error instanceof Error)) return "Error de conexión desconocido";

  const causa = error.cause as
    | { code?: string; message?: string }
    | undefined;

  return [error.message, causa?.code, causa?.message]
    .filter(Boolean)
    .join(" · ");
}

function solicitarGoogle(
  direccion: string,
  metodo: "GET" | "POST",
  cuerpo = "",
  redirecciones = 0
): Promise<ResultadoHttp> {
  if (redirecciones > MAX_REDIRECTS) {
    return Promise.reject(
      new Error("Google Apps Script realizó demasiadas redirecciones.")
    );
  }

  return new Promise((resolve, reject) => {
    const url = new URL(direccion);
    const esPost = metodo === "POST";

    const solicitud = httpsRequest(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || 443,
        path: `${url.pathname}${url.search}`,
        method: metodo,
        family: 4,
        timeout: TIMEOUT_MS,
        headers: {
          Accept: "application/json,text/plain,*/*",
          "User-Agent": "Aula-Magica-Vercel/2.2.5",
          ...(esPost
            ? {
                "Content-Type": "text/plain;charset=utf-8",
                "Content-Length": Buffer.byteLength(cuerpo),
              }
            : {}),
        },
      },
      (respuesta) => {
        const status = respuesta.statusCode || 500;
        const ubicacion = respuesta.headers.location;

        if (
          ubicacion &&
          [301, 302, 303, 307, 308].includes(status)
        ) {
          respuesta.resume();

          const siguienteUrl = new URL(ubicacion, url).toString();
          const conservaPost = status === 307 || status === 308;

          solicitarGoogle(
            siguienteUrl,
            conservaPost ? metodo : "GET",
            conservaPost ? cuerpo : "",
            redirecciones + 1
          ).then(resolve, reject);
          return;
        }

        const fragmentos: Buffer[] = [];

        respuesta.on("data", (fragmento) => {
          fragmentos.push(Buffer.from(fragmento));
        });

        respuesta.on("end", () => {
          resolve({
            status,
            texto: Buffer.concat(fragmentos).toString("utf8"),
          });
        });
      }
    );

    solicitud.on("timeout", () => {
      solicitud.destroy(
        new Error("La conexión con Google Apps Script agotó el tiempo de espera.")
      );
    });

    solicitud.on("error", reject);

    if (esPost) solicitud.write(cuerpo);
    solicitud.end();
  });
}

export async function GET() {
  const appsScriptUrl = obtenerUrlAppsScript();

  if (!appsScriptUrl) {
    return NextResponse.json(
      {
        ok: false,
        error: "No está configurada la URL de Google Apps Script en Vercel.",
      },
      { status: 500 }
    );
  }

  try {
    const respuesta = await solicitarGoogle(appsScriptUrl, "GET");
    const contenido = JSON.parse(respuesta.texto) as Record<string, unknown>;

    return NextResponse.json(
      {
        ok: respuesta.status >= 200 && respuesta.status < 300,
        puente: "Aula Mágica → Vercel → Apps Script",
        appsScript: contenido,
      },
      { status: respuesta.status >= 200 && respuesta.status < 300 ? 200 : 502 }
    );
  } catch (error) {
    console.error("Prueba de Apps Script falló:", error);

    return NextResponse.json(
      {
        ok: false,
        error: `No se pudo probar Google Apps Script: ${detalleError(error)}`,
      },
      { status: 502 }
    );
  }
}

export async function POST(request: NextRequest) {
  const appsScriptUrl = obtenerUrlAppsScript();

  if (!appsScriptUrl) {
    return NextResponse.json(
      {
        ok: false,
        error: "No está configurada la URL de Google Apps Script en Vercel.",
      },
      { status: 500 }
    );
  }

  let solicitud: unknown;

  try {
    solicitud = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "La solicitud enviada no es válida." },
      { status: 400 }
    );
  }

  try {
    const respuesta = await solicitarGoogle(
      appsScriptUrl,
      "POST",
      JSON.stringify(solicitud)
    );

    if (respuesta.status < 200 || respuesta.status >= 300) {
      console.error("Apps Script devolvió estado:", respuesta.status);

      return NextResponse.json(
        {
          ok: false,
          error: `Google Apps Script respondió con el estado ${respuesta.status}.`,
        },
        { status: 502 }
      );
    }

    try {
      const contenido = JSON.parse(respuesta.texto);

      return NextResponse.json(contenido, {
        headers: { "Cache-Control": "no-store, max-age=0" },
      });
    } catch {
      console.error(
        "Respuesta no JSON de Apps Script:",
        respuesta.texto.slice(0, 300)
      );

      return NextResponse.json(
        {
          ok: false,
          error:
            "Google Apps Script no devolvió JSON. Comprueba que la implementación sea pública y termine en /exec.",
        },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error("Conexión con Apps Script falló:", error);

    return NextResponse.json(
      {
        ok: false,
        error: `No se pudo conectar con Google Apps Script: ${detalleError(error)}`,
      },
      { status: 502 }
    );
  }
}
