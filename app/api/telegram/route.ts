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
  alumnos?: Array<{
    idAlumno: string;
    nombre: string;
    grado?: string;
    seccion?: string;
  }>;
  activo?: boolean;
  paso?: string;
  guardado?: boolean;
  cancelado?: boolean;
  tieneFecha?: boolean;
  eliminado?: boolean;
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


function attendanceMenuKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "✅ Todos presentes", callback_data: "att_all_present" }],
      [{ text: "👩‍🎓 Marcar alumno", callback_data: "att_students" }],
      [{ text: "⬅️ Volver al menú", callback_data: "inicio" }],
    ],
  };
}

function studentListKeyboard(
  students: Array<{ idAlumno: string; nombre: string }>
) {
  const rows = students.slice(0, 20).map((student) => [
    {
      text: `👩‍🎓 ${student.nombre}`,
      callback_data: `att_student:${student.idAlumno}`,
    },
  ]);
  rows.push([{ text: "⬅️ Volver", callback_data: "att_manage" }]);
  return { inline_keyboard: rows };
}

function attendanceStateKeyboard(studentId: string) {
  return {
    inline_keyboard: [
      [
        { text: "✅ Presente", callback_data: `att_set:${studentId}:PRESENTE` },
        { text: "❌ Ausente", callback_data: `att_set:${studentId}:AUSENTE` },
      ],
      [
        { text: "⏰ Tarde", callback_data: `att_set:${studentId}:TARDE` },
        {
          text: "📄 Justificado",
          callback_data: `att_set:${studentId}:JUSTIFICADO`,
        },
      ],
      [{ text: "⬅️ Elegir otro alumno", callback_data: "att_students" }],
    ],
  };
}


function agendaMenuKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "📋 Ver próximos", callback_data: "agenda" },
        { text: "➕ Crear evento", callback_data: "agenda_create" },
      ],
      [{ text: "⬅️ Volver al menú", callback_data: "inicio" }],
    ],
  };
}

function agendaCancelKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "❌ Cancelar", callback_data: "agenda_cancel" }],
    ],
  };
}

function agendaTypeKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "📚 Clase", callback_data: "agenda_type:CLASE" },
        { text: "🎨 Actividad", callback_data: "agenda_type:ACTIVIDAD" },
      ],
      [
        { text: "🔔 Recordatorio", callback_data: "agenda_type:RECORDATORIO" },
        { text: "📦 Entrega", callback_data: "agenda_type:ENTREGA" },
      ],
      [{ text: "📌 Otro", callback_data: "agenda_type:OTRO" }],
      [{ text: "❌ Cancelar", callback_data: "agenda_cancel" }],
    ],
  };
}

function agendaConfirmKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "✅ Guardar evento", callback_data: "agenda_confirm" },
        { text: "❌ Cancelar", callback_data: "agenda_cancel" },
      ],
    ],
  };
}

function keyboardForAgendaStep(step?: string) {
  if (step === "TIPO") return agendaTypeKeyboard();
  if (step === "CONFIRMAR") return agendaConfirmKeyboard();
  return agendaCancelKeyboard();
}


function meetingsMenuKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "📋 Ver próximas", callback_data: "reuniones" },
        { text: "➕ Crear reunión", callback_data: "meeting_create" },
      ],
      [{ text: "⬅️ Volver al menú", callback_data: "inicio" }],
    ],
  };
}

function meetingCancelKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "❌ Cancelar", callback_data: "meeting_cancel" }],
    ],
  };
}

function meetingConfirmKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "✅ Guardar reunión", callback_data: "meeting_confirm" },
        { text: "❌ Cancelar", callback_data: "meeting_cancel" },
      ],
    ],
  };
}

function keyboardForMeetingStep(step?: string) {
  if (step === "CONFIRMAR") return meetingConfirmKeyboard();
  return meetingCancelKeyboard();
}


function plansMenuKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "📋 Ver próximas", callback_data: "planes" },
        { text: "➕ Crear planificación", callback_data: "plan_create" },
      ],
      [{ text: "⬅️ Volver al menú", callback_data: "inicio" }],
    ],
  };
}

function planCancelKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "❌ Cancelar", callback_data: "plan_cancel" }],
    ],
  };
}

function planConfirmKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "✅ Guardar planificación", callback_data: "plan_confirm" },
        { text: "❌ Cancelar", callback_data: "plan_cancel" },
      ],
    ],
  };
}

function keyboardForPlanStep(step?: string) {
  return step === "CONFIRMAR"
    ? planConfirmKeyboard()
    : planCancelKeyboard();
}


function gradesMenuKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "📋 Ver resumen", callback_data: "notas" },
        { text: "➕ Registrar nota", callback_data: "grade_create" },
      ],
      [{ text: "⬅️ Volver al menú", callback_data: "inicio" }],
    ],
  };
}

function gradeStudentListKeyboard(
  students: Array<{ idAlumno: string; nombre: string }>
) {
  const rows = students.slice(0, 20).map((student) => [
    {
      text: `👩‍🎓 ${student.nombre}`,
      callback_data: `grade_student:${student.idAlumno}`,
    },
  ]);
  rows.push([{ text: "❌ Cancelar", callback_data: "grade_cancel" }]);
  return { inline_keyboard: rows };
}

function gradeSubjectKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "➗ Matemática", callback_data: "grade_subject:MATEMATICA" },
        { text: "📖 Lengua", callback_data: "grade_subject:LENGUA" },
      ],
      [
        { text: "🔬 Naturales", callback_data: "grade_subject:NATURALES" },
        { text: "🌎 Sociales", callback_data: "grade_subject:SOCIALES" },
      ],
      [
        { text: "🎨 Artística", callback_data: "grade_subject:ARTISTICA" },
        { text: "⚽ Educación Física", callback_data: "grade_subject:FISICA" },
      ],
      [
        { text: "🤝 Formación", callback_data: "grade_subject:FORMACION" },
        { text: "🇬🇧 Inglés", callback_data: "grade_subject:INGLES" },
      ],
      [{ text: "✍️ Otra asignatura", callback_data: "grade_subject:OTRA" }],
      [{ text: "❌ Cancelar", callback_data: "grade_cancel" }],
    ],
  };
}

function gradePeriodKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "1.er período", callback_data: "grade_period:P1" },
        { text: "2.º período", callback_data: "grade_period:P2" },
      ],
      [
        { text: "3.er período", callback_data: "grade_period:P3" },
        { text: "4.º período", callback_data: "grade_period:P4" },
      ],
      [{ text: "❌ Cancelar", callback_data: "grade_cancel" }],
    ],
  };
}

function gradeCancelKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "❌ Cancelar", callback_data: "grade_cancel" }],
    ],
  };
}

function gradeConfirmKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "✅ Guardar calificación", callback_data: "grade_confirm" },
        { text: "❌ Cancelar", callback_data: "grade_cancel" },
      ],
    ],
  };
}

function keyboardForGradeStep(step?: string) {
  if (step === "ASIGNATURA") return gradeSubjectKeyboard();
  if (step === "PERIODO") return gradePeriodKeyboard();
  if (step === "CONFIRMAR") return gradeConfirmKeyboard();
  return gradeCancelKeyboard();
}


function studentsMenuKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "📋 Ver resumen", callback_data: "alumnos" },
        { text: "➕ Registrar alumno", callback_data: "student_create" },
      ],
      [{ text: "⬅️ Volver al menú", callback_data: "inicio" }],
    ],
  };
}

function studentSexKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "👧 Femenino", callback_data: "student_sex:FEMENINO" },
        { text: "👦 Masculino", callback_data: "student_sex:MASCULINO" },
      ],
      [
        { text: "🧒 Otro", callback_data: "student_sex:OTRO" },
        { text: "➖ Omitir", callback_data: "student_sex:OMITIR" },
      ],
      [{ text: "❌ Cancelar", callback_data: "student_cancel" }],
    ],
  };
}

function studentCancelKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "❌ Cancelar", callback_data: "student_cancel" }],
    ],
  };
}

function studentConfirmKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "✅ Guardar alumno", callback_data: "student_confirm" },
        { text: "❌ Cancelar", callback_data: "student_cancel" },
      ],
    ],
  };
}

function keyboardForStudentStep(step?: string) {
  if (step === "SEXO") return studentSexKeyboard();
  if (step === "CONFIRMAR") return studentConfirmKeyboard();
  return studentCancelKeyboard();
}


function birthdaysMenuKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "📋 Ver próximos", callback_data: "cumpleanos" },
        { text: "⚙️ Configurar", callback_data: "birthday_manage" },
      ],
      [{ text: "⬅️ Volver al menú", callback_data: "inicio" }],
    ],
  };
}

function birthdayStudentKeyboard(
  students: Array<{ idAlumno: string; nombre: string }>
) {
  const rows = students.slice(0, 20).map((student) => [
    {
      text: `🎂 ${student.nombre}`,
      callback_data: `birthday_student:${student.idAlumno}`,
    },
  ]);

  rows.push([{ text: "❌ Cancelar", callback_data: "birthday_cancel" }]);
  return { inline_keyboard: rows };
}

function birthdayDateKeyboard(hasDate = false) {
  const rows: Array<Array<{ text: string; callback_data: string }>> = [];

  if (hasDate) {
    rows.push([
      { text: "🗑️ Quitar fecha", callback_data: "birthday_remove" },
    ]);
  }

  rows.push([
    { text: "❌ Cancelar", callback_data: "birthday_cancel" },
  ]);

  return { inline_keyboard: rows };
}

function birthdayCancelKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "❌ Cancelar", callback_data: "birthday_cancel" }],
    ],
  };
}

function birthdayConfirmKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "✅ Guardar cumpleaños", callback_data: "birthday_confirm" },
        { text: "❌ Cancelar", callback_data: "birthday_cancel" },
      ],
    ],
  };
}

function keyboardForBirthdayStep(step?: string, hasDate = false) {
  if (step === "FECHA_NACIMIENTO") return birthdayDateKeyboard(hasDate);
  if (step === "CONFIRMAR") return birthdayConfirmKeyboard();
  return birthdayCancelKeyboard();
}

function mainMenuKeyboard(linked = true) {
  const rows: InlineButton[][] = linked
    ? [
        [
          { text: "🏠 Inicio", callback_data: "inicio" },
          { text: "👩‍🎓 Alumnos", callback_data: "students_menu" },
        ],
        [
          { text: "✅ Asistencia", callback_data: "att_manage" },
          { text: "📝 Notas", callback_data: "grades_menu" },
        ],
        [
          { text: "📚 Planes", callback_data: "plans_menu" },
          { text: "🎂 Cumpleaños", callback_data: "birthdays_menu" },
        ],
        [
          { text: "🤝 Reuniones", callback_data: "meetings_menu" },
          { text: "📅 Agenda", callback_data: "agenda_menu" },
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
  linked = true,
  replyMarkup?: Record<string, unknown>
) {
  return telegramRequest("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: replyMarkup || mainMenuKeyboard(linked),
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

  if (command === "birthdays_menu") {
    await sendMessage(
      chatId,
      "🎂 <b>Cumpleaños</b>\n\nConsulta los próximos o configura la fecha de un alumno.",
      true,
      birthdaysMenuKeyboard()
    );
    return;
  }

  if (command === "birthday_manage") {
    const result = await callAppsScript<BotResult>(
      "botIniciarCumpleanosTelegram",
      { chatId }
    );

    const students = result.alumnos || [];

    if (!students.length) {
      await sendMessage(chatId, "No hay alumnos registrados.", true);
      return;
    }

    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Selecciona un alumno."),
      true,
      birthdayStudentKeyboard(students)
    );
    return;
  }

  if (command.startsWith("birthday_student:")) {
    const idAlumno = rawText.split(":")[1] || "";

    const result = await callAppsScript<BotResult>(
      "botSeleccionarAlumnoCumpleanosTelegram",
      { chatId, idAlumno }
    );

    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Escribe la fecha de nacimiento."),
      true,
      keyboardForBirthdayStep(result.paso, Boolean(result.tieneFecha))
    );
    return;
  }

  if (command === "birthday_remove") {
    const result = await callAppsScript<BotResult>(
      "botQuitarCumpleanosTelegram",
      { chatId }
    );

    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Fecha eliminada."),
      true
    );
    return;
  }

  if (command === "birthday_confirm") {
    const result = await callAppsScript<BotResult>(
      "botConfirmarCumpleanosTelegram",
      { chatId }
    );

    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Cumpleaños actualizado."),
      true
    );
    return;
  }

  if (command === "birthday_cancel") {
    const result = await callAppsScript<BotResult>(
      "botCancelarFlujoCumpleanosTelegram",
      { chatId }
    );

    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Operación cancelada."),
      true
    );
    return;
  }

  if (!callback && !rawText.startsWith("/")) {
    const birthdayFlow = await callAppsScript<BotResult>(
      "botProcesarFlujoCumpleanosTelegram",
      { chatId, texto: rawText }
    );

    if (birthdayFlow.activo || birthdayFlow.cancelado) {
      await sendMessage(
        chatId,
        escapeHtml(birthdayFlow.texto || "Continúa con el siguiente paso."),
        true,
        birthdayFlow.activo
          ? keyboardForBirthdayStep(birthdayFlow.paso)
          : mainMenuKeyboard(true)
      );
      return;
    }
  }

  if (command === "students_menu") {
    await sendMessage(
      chatId,
      "👩‍🎓 <b>Alumnos</b>\n\nConsulta el resumen o registra un alumno nuevo.",
      true,
      studentsMenuKeyboard()
    );
    return;
  }

  if (command === "student_create") {
    const result = await callAppsScript<BotResult>(
      "botIniciarAlumnoTelegram",
      { chatId }
    );

    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Escribe el nombre."),
      true,
      keyboardForStudentStep(result.paso)
    );
    return;
  }

  if (command.startsWith("student_sex:")) {
    const sexo = rawText.split(":")[1] || "";

    const result = await callAppsScript<BotResult>(
      "botSeleccionarSexoAlumnoTelegram",
      { chatId, sexo }
    );

    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Escribe el grado."),
      true,
      keyboardForStudentStep(result.paso)
    );
    return;
  }

  if (command === "student_confirm") {
    const result = await callAppsScript<BotResult>(
      "botConfirmarAlumnoTelegram",
      { chatId }
    );

    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Alumno guardado."),
      true
    );
    return;
  }

  if (command === "student_cancel") {
    const result = await callAppsScript<BotResult>(
      "botCancelarFlujoAlumnoTelegram",
      { chatId }
    );

    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Operación cancelada."),
      true
    );
    return;
  }

  if (!callback && !rawText.startsWith("/")) {
    const studentFlow = await callAppsScript<BotResult>(
      "botProcesarFlujoAlumnoTelegram",
      { chatId, texto: rawText }
    );

    if (studentFlow.activo || studentFlow.cancelado) {
      await sendMessage(
        chatId,
        escapeHtml(studentFlow.texto || "Continúa con el siguiente paso."),
        true,
        studentFlow.activo
          ? keyboardForStudentStep(studentFlow.paso)
          : mainMenuKeyboard(true)
      );
      return;
    }
  }

  if (command === "grades_menu") {
    await sendMessage(
      chatId,
      "📝 <b>Calificaciones</b>\n\nConsulta el resumen o registra una nota nueva.",
      true,
      gradesMenuKeyboard()
    );
    return;
  }

  if (command === "grade_create") {
    const result = await callAppsScript<BotResult>(
      "botIniciarCalificacionTelegram",
      { chatId }
    );
    const students = result.alumnos || [];

    if (!students.length) {
      await sendMessage(chatId, "No hay alumnos registrados.", true);
      return;
    }

    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Selecciona el alumno."),
      true,
      gradeStudentListKeyboard(students)
    );
    return;
  }

  if (command.startsWith("grade_student:")) {
    const studentId = rawText.split(":")[1] || "";
    if (!studentId) return;

    const result = await callAppsScript<BotResult>(
      "botSeleccionarAlumnoCalificacionTelegram",
      { chatId, idAlumno: studentId }
    );

    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Selecciona la asignatura."),
      true,
      keyboardForGradeStep(result.paso)
    );
    return;
  }

  if (command.startsWith("grade_subject:")) {
    const subject = rawText.split(":")[1] || "";
    if (!subject) return;

    const result = await callAppsScript<BotResult>(
      "botSeleccionarAsignaturaCalificacionTelegram",
      { chatId, asignatura: subject }
    );

    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Escribe la actividad."),
      true,
      keyboardForGradeStep(result.paso)
    );
    return;
  }

  if (command.startsWith("grade_period:")) {
    const period = rawText.split(":")[1] || "";
    if (!period) return;

    const result = await callAppsScript<BotResult>(
      "botSeleccionarPeriodoCalificacionTelegram",
      { chatId, periodo: period }
    );

    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Escribe la calificación."),
      true,
      keyboardForGradeStep(result.paso)
    );
    return;
  }

  if (command === "grade_confirm") {
    const result = await callAppsScript<BotResult>(
      "botConfirmarCalificacionTelegram",
      { chatId }
    );

    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Calificación guardada."),
      true
    );
    return;
  }

  if (command === "grade_cancel") {
    const result = await callAppsScript<BotResult>(
      "botCancelarFlujoCalificacionTelegram",
      { chatId }
    );

    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Operación cancelada."),
      true
    );
    return;
  }

  if (!callback && !rawText.startsWith("/")) {
    const gradeFlow = await callAppsScript<BotResult>(
      "botProcesarFlujoCalificacionTelegram",
      { chatId, texto: rawText }
    );

    if (gradeFlow.activo || gradeFlow.cancelado) {
      await sendMessage(
        chatId,
        escapeHtml(gradeFlow.texto || "Continúa con el siguiente paso."),
        true,
        gradeFlow.activo
          ? keyboardForGradeStep(gradeFlow.paso)
          : mainMenuKeyboard(true)
      );
      return;
    }
  }

  if (command === "plans_menu") {
    await sendMessage(
      chatId,
      "📚 <b>Planificaciones</b>\n\nConsulta las próximas o crea una nueva.",
      true,
      plansMenuKeyboard()
    );
    return;
  }

  if (command === "plan_create") {
    const result = await callAppsScript<BotResult>(
      "botIniciarPlanificacionTelegram",
      { chatId }
    );

    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Escribe el título."),
      true,
      keyboardForPlanStep(result.paso)
    );
    return;
  }

  if (command === "plan_confirm") {
    const result = await callAppsScript<BotResult>(
      "botConfirmarPlanificacionTelegram",
      { chatId }
    );

    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Planificación guardada."),
      true
    );
    return;
  }

  if (command === "plan_cancel") {
    const result = await callAppsScript<BotResult>(
      "botCancelarFlujoPlanificacionTelegram",
      { chatId }
    );

    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Operación cancelada."),
      true
    );
    return;
  }

  if (!callback && !rawText.startsWith("/")) {
    const planFlow = await callAppsScript<BotResult>(
      "botProcesarFlujoPlanificacionTelegram",
      { chatId, texto: rawText }
    );

    if (planFlow.activo || planFlow.cancelado) {
      await sendMessage(
        chatId,
        escapeHtml(planFlow.texto || "Continúa con el siguiente paso."),
        true,
        planFlow.activo
          ? keyboardForPlanStep(planFlow.paso)
          : mainMenuKeyboard(true)
      );
      return;
    }
  }

  if (command === "meetings_menu") {
    await sendMessage(
      chatId,
      "🤝 <b>Reuniones</b>\n\nConsulta las próximas reuniones o crea una nueva.",
      true,
      meetingsMenuKeyboard()
    );
    return;
  }

  if (command === "meeting_create") {
    const result = await callAppsScript<BotResult>(
      "botIniciarReunionTelegram",
      { chatId }
    );
    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Escribe el título de la reunión."),
      true,
      keyboardForMeetingStep(result.paso)
    );
    return;
  }

  if (command === "meeting_confirm") {
    const result = await callAppsScript<BotResult>(
      "botConfirmarReunionTelegram",
      { chatId }
    );
    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Reunión guardada."),
      true
    );
    return;
  }

  if (command === "meeting_cancel") {
    const result = await callAppsScript<BotResult>(
      "botCancelarFlujoReunionTelegram",
      { chatId }
    );
    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Operación cancelada."),
      true
    );
    return;
  }

  if (!callback && !rawText.startsWith("/")) {
    const meetingFlow = await callAppsScript<BotResult>(
      "botProcesarFlujoReunionTelegram",
      { chatId, texto: rawText }
    );

    if (meetingFlow.activo || meetingFlow.cancelado) {
      await sendMessage(
        chatId,
        escapeHtml(meetingFlow.texto || "Continúa con el siguiente paso."),
        true,
        meetingFlow.activo
          ? keyboardForMeetingStep(meetingFlow.paso)
          : mainMenuKeyboard(true)
      );
      return;
    }
  }

  if (command === "agenda_menu") {
    await sendMessage(
      chatId,
      "📅 <b>Agenda</b>\n\nConsulta tus próximos eventos o crea uno nuevo.",
      true,
      agendaMenuKeyboard()
    );
    return;
  }

  if (command === "agenda_create") {
    const result = await callAppsScript<BotResult>(
      "botIniciarAgendaTelegram",
      { chatId }
    );
    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Escribe el título del evento."),
      true,
      keyboardForAgendaStep(result.paso)
    );
    return;
  }

  if (command.startsWith("agenda_type:")) {
    const tipo = rawText.split(":")[1] || "";
    const result = await callAppsScript<BotResult>(
      "botSeleccionarTipoAgendaTelegram",
      { chatId, tipo }
    );
    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Escribe la descripción."),
      true,
      keyboardForAgendaStep(result.paso)
    );
    return;
  }

  if (command === "agenda_confirm") {
    const result = await callAppsScript<BotResult>(
      "botConfirmarAgendaTelegram",
      { chatId }
    );
    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Evento guardado."),
      true
    );
    return;
  }

  if (command === "agenda_cancel" || command === "cancelar") {
    const result = await callAppsScript<BotResult>(
      "botCancelarFlujoAgendaTelegram",
      { chatId }
    );
    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Operación cancelada."),
      true
    );
    return;
  }

  if (!callback && !rawText.startsWith("/")) {
    const flow = await callAppsScript<BotResult>(
      "botProcesarFlujoAgendaTelegram",
      { chatId, texto: rawText }
    );

    if (flow.activo || flow.cancelado) {
      await sendMessage(
        chatId,
        escapeHtml(flow.texto || "Continúa con el siguiente paso."),
        true,
        flow.activo ? keyboardForAgendaStep(flow.paso) : mainMenuKeyboard(true)
      );
      return;
    }
  }

  if (command === "att_manage") {
    await sendMessage(
      chatId,
      "✅ <b>Tomar asistencia de hoy</b>\n\nSelecciona una opción:",
      true,
      attendanceMenuKeyboard()
    );
    return;
  }

  if (command === "att_all_present") {
    const result = await callAppsScript<BotResult>(
      "botGuardarAsistenciaRapida",
      { chatId, modo: "TODOS_PRESENTES" }
    );
    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Asistencia guardada."),
      true
    );
    return;
  }

  if (command === "att_students") {
    const result = await callAppsScript<BotResult>(
      "botListarAlumnosAsistencia",
      { chatId }
    );
    const students = result.alumnos || [];
    if (!students.length) {
      await sendMessage(chatId, "No hay alumnos registrados.", true);
      return;
    }
    await sendMessage(
      chatId,
      "👩‍🎓 <b>Selecciona un alumno</b>",
      true,
      studentListKeyboard(students)
    );
    return;
  }

  if (command.startsWith("att_student:")) {
    const studentId = rawText.split(":")[1] || "";
    if (!studentId) return;
    await sendMessage(
      chatId,
      "Selecciona el estado de asistencia:",
      true,
      attendanceStateKeyboard(studentId)
    );
    return;
  }

  if (command.startsWith("att_set:")) {
    const [, studentId = "", state = ""] = rawText.split(":");
    if (!studentId || !state) return;
    const result = await callAppsScript<BotResult>(
      "botGuardarAsistenciaRapida",
      { chatId, modo: "INDIVIDUAL", idAlumno: studentId, estado: state }
    );
    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Asistencia actualizada."),
      true,
      attendanceMenuKeyboard()
    );
    return;
  }

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
