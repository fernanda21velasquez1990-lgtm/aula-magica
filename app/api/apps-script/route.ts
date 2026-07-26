import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function obtenerUrlAppsScript() {
  return (
    process.env.APPS_SCRIPT_URL?.trim() ||
    process.env.NEXT_PUBLIC_APPS_SCRIPT_URL?.trim()
  );
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
      {
        ok: false,
        error: "La solicitud enviada no es válida.",
      },
      { status: 400 }
    );
  }

  try {
    const respuesta = await fetch(appsScriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(solicitud),
      redirect: "follow",
      cache: "no-store",
    });

    const texto = await respuesta.text();

    if (!respuesta.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: `Google Apps Script respondió con el estado ${respuesta.status}.`,
        },
        { status: 502 }
      );
    }

    try {
      const contenido = JSON.parse(texto);

      return NextResponse.json(contenido, {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      });
    } catch {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Google Apps Script no devolvió una respuesta válida. Revisa que la implementación permita el acceso a cualquier usuario.",
        },
        { status: 502 }
      );
    }
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : "Error de conexión desconocido.";

    return NextResponse.json(
      {
        ok: false,
        error: `No se pudo conectar con Google Apps Script: ${mensaje}`,
      },
      { status: 502 }
    );
  }
}
