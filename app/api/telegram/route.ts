import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

type TelegramUpdate = {
  message?: {
    text?: string;
    chat?: { id?: number | string };
    from?: { first_name?: string; last_name?: string };
  };
  edited_message?: {
    text?: string;
    chat?: { id?: number | string };
  };
  callback_query?: {
    id?: string;
    data?: string;
    message?: { chat?: { id?: number | string } };
  };
};

type AppsScriptResponse<T = unknown> = {
  ok: boolean;
  resultado?: T;
  error?: string;
};

type BotResult = {
  vinculado?: boolean;
  texto?: string;
  nombre?: string;
};

const BOT_API = "https://api.telegram.org";
const TIMEOUT_MS = 20_000;

function requiredEnv(name: string): string {
  const value = String(process.env[name] || "").trim();
  if (!value) throw new Error(`Falta la variable de entorno ${name}`);
  return value;
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function telegramRequest(
  method: string,
  payload: Record<string, unknown>
) {
  const token = requiredEnv("TELEGRAM_BOT_TOKEN");
  const response = await fetch(`${BOT_API}/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const data = (await response.json().catch(() => ({}))) as {
    ok?: boolean;
    description?: string;
  };

  if (!response.ok || data.ok === false) {
    throw new Error(
      data.description || `Telegram respondió con estado ${response.status}`
    );
  }

  return data;
}

async function callAppsScript<T>(
  action: string,
  data: Record<string, unknown>
): Promise<T> {
  const url = requiredEnv("APPS_SCRIPT_URL");
  const botSecret = requiredEnv("AULA_MAGICA_BOT_SECRET");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
        Accept: "application/json",
      },
      body: JSON.stringify({
        action,
        token: "",
        data: { ...data, botSecret },
      }),
      redirect: "follow",
      cache: "no-store",
      signal: controller.signal,
    });

    const text = await response.text();
    let parsed: AppsScriptResponse<T>;

    try {
      parsed = JSON.parse(text) as AppsScriptResponse<T>;
    } catch {
      throw new Error(
        "Apps Script no devolvió JSON. Revisa que la URL termine en /exec."
      );
    }

    if (!response.ok || !parsed.ok) {
      throw new Error(
        parsed.error || `Apps Script respondió con estado ${response.status}`
      );
    }

    return parsed.resultado as T;
  } finally {
    clearTimeout(timer);
  }
}

type InlineButton = {
  text: string;
  callback_data?: string;
  url?: string;
};

function mainMenuKeyboard(linked = true) {
  const rows: InlineButton[][] = linked
    ? [
        [
          { text: "🏠 Inicio", callback_data: "inicio" },
          { text: "👩‍🎓 Alumnos", callback_data: "alumnos" },
        ],
        [
          { text: "✅ Asistencia", callback_data: "asistencia" },
          { text: "📝 Notas", callback_data: "notas" },
        ],
        [
          { text: "📚 Planes", callback_data: "planes" },
          { text: "🎂 Cumpleaños", callback_data: "cumpleanos" },
        ],
        [
          { text: "🤝 Reuniones", callback_data: "reuniones" },
          { text: "📅 Agenda", callback_data: "agenda" },
        ],
        [{ text: "❓ Ayuda", callback_data: "ayuda" }],
      ]
    : [[{ text: "❓ Cómo vincular", callback_data: "ayuda_vincular" }]];

  const appUrl = String(process.env.AULA_MAGICA_URL || "").trim();
  if (appUrl) {
    rows.push([{ text: "🌐 Abrir Aula Mágica", url: appUrl }]);
  }

  return { inline_keyboard: rows };
}

async function sendMessage(
  chatId: string,
  text: string,
  linked = true
) {
  return telegramRequest("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: mainMenuKeyboard(linked),
  });
}

async function answerCallback(callbackId?: string) {
  if (!callbackId) return;
  await telegramRequest("answerCallbackQuery", {
    callback_query_id: callbackId,
  }).catch(() => undefined);
}

function commandFromText(text: string): { command: string; argument: string } {
  const trimmed = String(text || "").trim();
  const [first = "", ...rest] = trimmed.split(/\s+/);
  return {
    command: first.split("@")[0].replace(/^\//, "").toLowerCase(),
    argument: rest.join(" ").trim(),
  };
}

async function handleUpdate(update: TelegramUpdate) {
  const callback = update.callback_query;
  const message = update.message || update.edited_message;
  const chatId = String(
    message?.chat?.id || callback?.message?.chat?.id || ""
  );

  if (!chatId) return;

  const rawText = String(callback?.data || message?.text || "").trim();
  if (!rawText) return;

  await answerCallback(callback?.id);

  const { command, argument } = commandFromText(rawText);

  if (command === "start") {
    await sendMessage(
      chatId,
      [
        "👋 <b>Bienvenida a Aula Mágica</b>",
        "",
        "Para vincular tu cuenta:",
        "1. Abre Aula Mágica → Telegram.",
        "2. Genera un código nuevo.",
        "3. Envíalo así:",
        "<code>/vincular CODIGO</code>",
      ].join("\n"),
      false
    );
    return;
  }

  if (command === "ayuda_vincular") {
    await sendMessage(
      chatId,
      "Abre Aula Mágica → Telegram, genera un código y envía <code>/vincular CODIGO</code>.",
      false
    );
    return;
  }

  if (command === "vincular") {
    if (!argument) {
      await sendMessage(
        chatId,
        "Escribe el código así:\n<code>/vincular ABC123</code>",
        false
      );
      return;
    }

    const result = await callAppsScript<BotResult>(
      "botVincularTelegramVercel",
      { chatId, codigo: argument.toUpperCase() }
    );

    await sendMessage(
      chatId,
      escapeHtml(result.texto || "No se pudo completar la vinculación."),
      Boolean(result.vinculado)
    );
    return;
  }

  const result = await callAppsScript<BotResult>(
    "botComandoTelegramVercel",
    { chatId, comando: command || "inicio" }
  );

  await sendMessage(
    chatId,
    escapeHtml(result.texto || "No hay información disponible."),
    result.vinculado !== false
  );
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "Aula Mágica Telegram webhook",
    mode: "Vercel → Apps Script → Google Sheets",
  });
}

export async function POST(request: NextRequest) {
  const expectedSecret = requiredEnv("TELEGRAM_WEBHOOK_SECRET");
  const receivedSecret =
    request.headers.get("x-telegram-bot-api-secret-token") || "";

  if (receivedSecret !== expectedSecret) {
    return NextResponse.json(
      { ok: false, error: "Webhook no autorizado" },
      { status: 401 }
    );
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Actualización inválida" },
      { status: 400 }
    );
  }

  try {
    await handleUpdate(update);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error procesando Telegram:", error);

    const chatId = String(
      update.message?.chat?.id ||
        update.edited_message?.chat?.id ||
        update.callback_query?.message?.chat?.id ||
        ""
    );

    if (chatId) {
      await sendMessage(
        chatId,
        `⚠️ No se pudo completar la operación.\n\n${escapeHtml(
          error instanceof Error ? error.message : "Error desconocido"
        )}`,
        false
      ).catch(() => undefined);
    }

    // Telegram receives 200 so it does not retry the same update forever.
    return NextResponse.json({ ok: true, handled: false });
  }
}
