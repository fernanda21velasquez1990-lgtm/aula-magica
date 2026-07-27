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
    estado?: string;
  }>;
  activo?: boolean;
  paso?: string;
  guardado?: boolean;
  cancelado?: boolean;
  tieneFecha?: boolean;
  eliminado?: boolean;
  asistencias?: Array<{
    idAsistencia: string;
    idAlumno: string;
    nombreAlumno: string;
    fecha: string;
    estado: string;
    observaciones?: string;
  }>;
  asistencia?: {
    idAsistencia: string;
    idAlumno: string;
    nombreAlumno: string;
    fecha: string;
    estado: string;
    observaciones?: string;
  };
  fecha?: string;
  alumno?: {
    idAlumno: string;
    nombre: string;
    apellido: string;
    documento?: string;
    fechaNacimiento?: string;
    sexo?: string;
    grado?: string;
    seccion?: string;
    representante?: string;
    telefono?: string;
    direccion?: string;
    observaciones?: string;
    estado: string;
  };
  calificaciones?: Array<{
    idCalificacion: string;
    idAlumno: string;
    nombreAlumno: string;
    asignatura: string;
    actividad: string;
    periodo: string;
    calificacion: number;
    calificacionMaxima: number;
    fecha: string;
    observaciones?: string;
  }>;
  calificacion?: {
    idCalificacion: string;
    idAlumno: string;
    nombreAlumno: string;
    asignatura: string;
    actividad: string;
    periodo: string;
    calificacion: number;
    calificacionMaxima: number;
    fecha: string;
    observaciones?: string;
  };
  planes?: Array<{
    idPlanificacion: string;
    titulo: string;
    asignatura: string;
    grado: string;
    fecha: string;
    objetivo?: string;
    contenido?: string;
    actividades?: string;
    recursos?: string;
    evaluacion?: string;
    estado: string;
  }>;
  plan?: {
    idPlanificacion: string;
    titulo: string;
    asignatura: string;
    grado: string;
    fecha: string;
    objetivo?: string;
    contenido?: string;
    actividades?: string;
    recursos?: string;
    evaluacion?: string;
    estado: string;
  };
  reuniones?: Array<{
    idReunion: string;
    titulo: string;
    tipo: string;
    fecha: string;
    hora: string;
    lugar?: string;
    descripcion?: string;
    estado: string;
  }>;
  reunion?: {
    idReunion: string;
    titulo: string;
    tipo: string;
    fecha: string;
    hora: string;
    lugar?: string;
    descripcion?: string;
    estado: string;
  };
  eventos?: Array<{
    idEvento: string;
    titulo: string;
    tipo: string;
    fecha: string;
    hora: string;
    descripcion?: string;
    estado: string;
  }>;
  evento?: {
    idEvento: string;
    titulo: string;
    tipo: string;
    fecha: string;
    hora: string;
    descripcion?: string;
    estado: string;
  };
  compras?: Array<{
    idCompra: string;
    idMaterial: string;
    titulo: string;
    precio: number;
    estado: string;
    archivoUrl?: string;
  }>;
  compra?: {
    idCompra: string;
    idMaterial: string;
    titulo: string;
    descripcion?: string;
    categoria?: string;
    nivel?: string;
    precio: number;
    estado: string;
    archivoUrl?: string;
    whatsapp?: string;
  };
  preferencias?: {
    reuniones: boolean;
    agenda: boolean;
    cumpleanos: boolean;
    planificaciones: boolean;
    asistencia: boolean;
  };
  enviados?: number;
  perfil?: {
    idMaestra: string;
    nombre: string;
    apellido: string;
    correo: string;
    usuario: string;
    grado?: string;
    seccion?: string;
  };
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
      [{ text: "⚙️ Administrar asistencia", callback_data: "attendance_manage" }],
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
      [{ text: "⚙️ Administrar eventos", callback_data: "agenda_manage" }],
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
      [{ text: "⚙️ Administrar reuniones", callback_data: "meeting_manage" }],
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
      [{ text: "⚙️ Administrar planes", callback_data: "plan_manage" }],
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
      [{ text: "⚙️ Administrar notas", callback_data: "grade_manage" }],
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
      [{ text: "⚙️ Administrar alumnos", callback_data: "student_manage" }],
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


function reportsMenuKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "📊 General", callback_data: "report:GENERAL" },
        { text: "✅ Asistencia", callback_data: "report:ASISTENCIA" },
      ],
      [
        { text: "📝 Calificaciones", callback_data: "report:CALIFICACIONES" },
        { text: "📌 Pendientes", callback_data: "report:PENDIENTES" },
      ],
      [{ text: "⬅️ Volver al menú", callback_data: "inicio" }],
    ],
  };
}


function settingsMenuKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "👤 Ver perfil", callback_data: "settings_view" },
        { text: "✏️ Editar perfil", callback_data: "settings_edit" },
      ],
      [{ text: "🔔 Configurar avisos", callback_data: "alerts_menu" }],
      [{ text: "⬅️ Volver al menú", callback_data: "inicio" }],
    ],
  };
}

function alertsKeyboard(preferences?: {
  reuniones: boolean;
  agenda: boolean;
  cumpleanos: boolean;
  planificaciones: boolean;
  asistencia: boolean;
}) {
  const prefs = preferences || {
    reuniones: true,
    agenda: true,
    cumpleanos: true,
    planificaciones: true,
    asistencia: true,
  };

  const icon = (active: boolean) => (active ? "✅" : "❌");

  return {
    inline_keyboard: [
      [
        {
          text: `${icon(prefs.reuniones)} Reuniones`,
          callback_data: "alert_toggle:reuniones",
        },
        {
          text: `${icon(prefs.agenda)} Agenda`,
          callback_data: "alert_toggle:agenda",
        },
      ],
      [
        {
          text: `${icon(prefs.cumpleanos)} Cumpleaños`,
          callback_data: "alert_toggle:cumpleanos",
        },
        {
          text: `${icon(prefs.planificaciones)} Planes`,
          callback_data: "alert_toggle:planificaciones",
        },
      ],
      [
        {
          text: `${icon(prefs.asistencia)} Asistencia`,
          callback_data: "alert_toggle:asistencia",
        },
      ],
      [
        { text: "🔔 Activar todos", callback_data: "alerts_all:on" },
        { text: "🔕 Desactivar todos", callback_data: "alerts_all:off" },
      ],
      [{ text: "🧪 Probar avisos", callback_data: "alerts_test" }],
      [{ text: "⬅️ Volver", callback_data: "settings_menu" }],
    ],
  };
}

function settingsCancelKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "❌ Cancelar", callback_data: "settings_cancel" }],
    ],
  };
}

function settingsConfirmKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "✅ Guardar cambios", callback_data: "settings_confirm" },
        { text: "❌ Cancelar", callback_data: "settings_cancel" },
      ],
    ],
  };
}

function keyboardForSettingsStep(step?: string) {
  return step === "CONFIRMAR"
    ? settingsConfirmKeyboard()
    : settingsCancelKeyboard();
}


function agendaManageListKeyboard(
  events: Array<{
    idEvento: string;
    titulo: string;
    fecha: string;
    hora: string;
    estado: string;
  }>
) {
  const rows = events.slice(0, 20).map((event) => [
    {
      text: `📅 ${event.fecha} ${event.hora} · ${event.titulo}`,
      callback_data: `agenda_item:${event.idEvento}`,
    },
  ]);

  rows.push([{ text: "⬅️ Volver", callback_data: "agenda_menu" }]);
  return { inline_keyboard: rows };
}

function agendaItemKeyboard(eventId: string, state: string) {
  const rows: Array<Array<{ text: string; callback_data: string }>> = [
    [
      {
        text: "✏️ Editar evento",
        callback_data: `agenda_edit:${eventId}`,
      },
    ],
  ];

  if (state !== "COMPLETADO") {
    rows.push([
      {
        text: "✅ Marcar completado",
        callback_data: `agenda_state:${eventId}:COMPLETADO`,
      },
    ]);
  }

  if (state !== "PENDIENTE") {
    rows.push([
      {
        text: "🕓 Marcar pendiente",
        callback_data: `agenda_state:${eventId}:PENDIENTE`,
      },
    ]);
  }

  if (state !== "CANCELADO") {
    rows.push([
      {
        text: "🚫 Cancelar evento",
        callback_data: `agenda_state:${eventId}:CANCELADO`,
      },
    ]);
  }

  rows.push([
    {
      text: "🗑️ Eliminar",
      callback_data: `agenda_delete_confirm:${eventId}`,
    },
  ]);

  rows.push([{ text: "⬅️ Volver", callback_data: "agenda_manage" }]);
  return { inline_keyboard: rows };
}

function agendaDeleteConfirmKeyboard(eventId: string) {
  return {
    inline_keyboard: [
      [
        {
          text: "Sí, eliminar",
          callback_data: `agenda_delete:${eventId}`,
        },
        {
          text: "No",
          callback_data: `agenda_item:${eventId}`,
        },
      ],
    ],
  };
}


function meetingsManageListKeyboard(
  meetings: Array<{
    idReunion: string;
    titulo: string;
    fecha: string;
    hora: string;
    estado: string;
  }>
) {
  const rows = meetings.slice(0, 20).map((meeting) => [
    {
      text: `🤝 ${meeting.fecha} ${meeting.hora} · ${meeting.titulo}`,
      callback_data: `meeting_item:${meeting.idReunion}`,
    },
  ]);

  rows.push([{ text: "⬅️ Volver", callback_data: "meetings_menu" }]);
  return { inline_keyboard: rows };
}

function meetingItemKeyboard(meetingId: string, state: string) {
  const rows: Array<Array<{ text: string; callback_data: string }>> = [
    [
      {
        text: "✏️ Editar reunión",
        callback_data: `meeting_edit:${meetingId}`,
      },
    ],
  ];

  if (state !== "REALIZADA") {
    rows.push([
      {
        text: "✅ Marcar realizada",
        callback_data: `meeting_state:${meetingId}:REALIZADA`,
      },
    ]);
  }

  if (state !== "PROGRAMADA") {
    rows.push([
      {
        text: "🕓 Marcar programada",
        callback_data: `meeting_state:${meetingId}:PROGRAMADA`,
      },
    ]);
  }

  if (state !== "CANCELADA") {
    rows.push([
      {
        text: "🚫 Cancelar reunión",
        callback_data: `meeting_state:${meetingId}:CANCELADA`,
      },
    ]);
  }

  rows.push([
    {
      text: "🗑️ Eliminar",
      callback_data: `meeting_delete_confirm:${meetingId}`,
    },
  ]);

  rows.push([{ text: "⬅️ Volver", callback_data: "meeting_manage" }]);
  return { inline_keyboard: rows };
}

function meetingDeleteConfirmKeyboard(meetingId: string) {
  return {
    inline_keyboard: [
      [
        {
          text: "Sí, eliminar",
          callback_data: `meeting_delete:${meetingId}`,
        },
        {
          text: "No",
          callback_data: `meeting_item:${meetingId}`,
        },
      ],
    ],
  };
}


function plansManageListKeyboard(
  plans: Array<{
    idPlanificacion: string;
    titulo: string;
    fecha: string;
    estado: string;
  }>
) {
  const rows = plans.slice(0, 20).map((plan) => [
    {
      text: `📚 ${plan.fecha} · ${plan.titulo}`,
      callback_data: `plan_item:${plan.idPlanificacion}`,
    },
  ]);

  rows.push([{ text: "⬅️ Volver", callback_data: "plans_menu" }]);
  return { inline_keyboard: rows };
}

function planItemKeyboard(planId: string, state: string) {
  const rows: Array<Array<{ text: string; callback_data: string }>> = [
    [
      {
        text: "✏️ Editar planificación",
        callback_data: `plan_edit:${planId}`,
      },
    ],
  ];

  if (state !== "COMPLETADA") {
    rows.push([
      {
        text: "✅ Marcar completada",
        callback_data: `plan_state:${planId}:COMPLETADA`,
      },
    ]);
  }

  if (state !== "PLANIFICADA") {
    rows.push([
      {
        text: "📅 Marcar planificada",
        callback_data: `plan_state:${planId}:PLANIFICADA`,
      },
    ]);
  }

  if (state !== "BORRADOR") {
    rows.push([
      {
        text: "📝 Marcar borrador",
        callback_data: `plan_state:${planId}:BORRADOR`,
      },
    ]);
  }

  rows.push([
    {
      text: "🗑️ Eliminar",
      callback_data: `plan_delete_confirm:${planId}`,
    },
  ]);

  rows.push([{ text: "⬅️ Volver", callback_data: "plan_manage" }]);
  return { inline_keyboard: rows };
}

function planDeleteConfirmKeyboard(planId: string) {
  return {
    inline_keyboard: [
      [
        {
          text: "Sí, eliminar",
          callback_data: `plan_delete:${planId}`,
        },
        {
          text: "No",
          callback_data: `plan_item:${planId}`,
        },
      ],
    ],
  };
}


function gradesManageListKeyboard(
  grades: Array<{
    idCalificacion: string;
    nombreAlumno: string;
    asignatura: string;
    actividad: string;
    calificacion: number;
    calificacionMaxima: number;
  }>
) {
  const rows = grades.slice(0, 20).map((grade) => [
    {
      text:
        `📝 ${grade.nombreAlumno} · ${grade.asignatura} · ` +
        `${grade.calificacion}/${grade.calificacionMaxima}`,
      callback_data: `grade_item:${grade.idCalificacion}`,
    },
  ]);

  rows.push([{ text: "⬅️ Volver", callback_data: "grades_menu" }]);
  return { inline_keyboard: rows };
}

function gradeItemKeyboard(gradeId: string) {
  return {
    inline_keyboard: [
      [
        {
          text: "✏️ Corregir nota",
          callback_data: `grade_edit:${gradeId}`,
        },
      ],
      [
        {
          text: "🗑️ Eliminar",
          callback_data: `grade_delete_confirm:${gradeId}`,
        },
      ],
      [{ text: "⬅️ Volver", callback_data: "grade_manage" }],
    ],
  };
}

function gradeEditKeyboard(step?: string) {
  if (step === "CONFIRMAR") {
    return {
      inline_keyboard: [
        [
          {
            text: "✅ Guardar corrección",
            callback_data: "grade_edit_confirm",
          },
          {
            text: "❌ Cancelar",
            callback_data: "grade_edit_cancel",
          },
        ],
      ],
    };
  }

  return {
    inline_keyboard: [
      [{ text: "❌ Cancelar", callback_data: "grade_edit_cancel" }],
    ],
  };
}

function gradeDeleteConfirmKeyboard(gradeId: string) {
  return {
    inline_keyboard: [
      [
        {
          text: "Sí, eliminar",
          callback_data: `grade_delete:${gradeId}`,
        },
        {
          text: "No",
          callback_data: `grade_item:${gradeId}`,
        },
      ],
    ],
  };
}


function studentsManageListKeyboard(
  students: Array<{
    idAlumno: string;
    nombre: string;
    grado?: string;
    seccion?: string;
    estado?: string;
  }>
) {
  const rows = students.slice(0, 30).map((student) => [
    {
      text:
        `👩‍🎓 ${student.nombre}` +
        `${student.grado ? ` · ${student.grado}` : ""}`,
      callback_data: `student_item:${student.idAlumno}`,
    },
  ]);

  rows.push([{ text: "⬅️ Volver", callback_data: "students_menu" }]);
  return { inline_keyboard: rows };
}

function studentItemManageKeyboard(studentId: string, state: string) {
  const rows: Array<Array<{ text: string; callback_data: string }>> = [
    [
      {
        text: "✏️ Editar datos",
        callback_data: `student_edit:${studentId}`,
      },
    ],
  ];

  if (state !== "INACTIVO") {
    rows.push([
      {
        text: "⏸️ Marcar inactivo",
        callback_data: `student_state:${studentId}:INACTIVO`,
      },
    ]);
  }

  if (state !== "ACTIVO") {
    rows.push([
      {
        text: "▶️ Marcar activo",
        callback_data: `student_state:${studentId}:ACTIVO`,
      },
    ]);
  }

  rows.push([
    {
      text: "🗑️ Eliminar",
      callback_data: `student_delete_confirm:${studentId}`,
    },
  ]);

  rows.push([{ text: "⬅️ Volver", callback_data: "student_manage" }]);
  return { inline_keyboard: rows };
}

function studentEditKeyboard(step?: string) {
  if (step === "CONFIRMAR") {
    return {
      inline_keyboard: [
        [
          {
            text: "✅ Guardar cambios",
            callback_data: "student_edit_confirm",
          },
          {
            text: "❌ Cancelar",
            callback_data: "student_edit_cancel",
          },
        ],
      ],
    };
  }

  return {
    inline_keyboard: [
      [{ text: "❌ Cancelar", callback_data: "student_edit_cancel" }],
    ],
  };
}

function studentDeleteConfirmKeyboard(studentId: string) {
  return {
    inline_keyboard: [
      [
        {
          text: "Sí, eliminar",
          callback_data: `student_delete:${studentId}`,
        },
        {
          text: "No",
          callback_data: `student_item:${studentId}`,
        },
      ],
    ],
  };
}


function attendanceManageRecordsKeyboard(
  records: Array<{
    idAsistencia: string;
    nombreAlumno: string;
    estado: string;
  }>
) {
  const rows = records.slice(0, 30).map((record) => [
    {
      text: `✅ ${record.nombreAlumno} · ${record.estado}`,
      callback_data: `attendance_item:${record.idAsistencia}`,
    },
  ]);

  rows.push([{ text: "⬅️ Volver", callback_data: "att_manage" }]);
  return { inline_keyboard: rows };
}

function attendanceRecordKeyboard(recordId: string, state: string) {
  const rows: Array<Array<{ text: string; callback_data: string }>> = [];

  const options = [
    ["PRESENTE", "🟢 Presente"],
    ["AUSENTE", "🔴 Ausente"],
    ["TARDE", "⏰ Tarde"],
    ["JUSTIFICADO", "📄 Justificado"],
  ] as const;

  for (const [value, label] of options) {
    if (state !== value) {
      rows.push([
        {
          text: label,
          callback_data: `attendance_state:${recordId}:${value}`,
        },
      ]);
    }
  }

  rows.push([
    {
      text: "🗑️ Eliminar registro",
      callback_data: `attendance_delete_confirm:${recordId}`,
    },
  ]);

  rows.push([{ text: "⬅️ Volver", callback_data: "attendance_manage" }]);
  return { inline_keyboard: rows };
}

function attendanceDeleteKeyboard(recordId: string) {
  return {
    inline_keyboard: [
      [
        {
          text: "Sí, eliminar",
          callback_data: `attendance_delete:${recordId}`,
        },
        {
          text: "No",
          callback_data: `attendance_item:${recordId}`,
        },
      ],
    ],
  };
}


function agendaEditKeyboard(step?: string) {
  if (step === "CONFIRMAR") {
    return {
      inline_keyboard: [
        [
          {
            text: "✅ Guardar cambios",
            callback_data: "agenda_edit_confirm",
          },
          {
            text: "❌ Cancelar",
            callback_data: "agenda_edit_cancel",
          },
        ],
      ],
    };
  }

  return {
    inline_keyboard: [
      [{ text: "❌ Cancelar", callback_data: "agenda_edit_cancel" }],
    ],
  };
}


function meetingEditKeyboard(step?: string) {
  if (step === "CONFIRMAR") {
    return {
      inline_keyboard: [
        [
          {
            text: "✅ Guardar cambios",
            callback_data: "meeting_edit_confirm",
          },
          {
            text: "❌ Cancelar",
            callback_data: "meeting_edit_cancel",
          },
        ],
      ],
    };
  }

  return {
    inline_keyboard: [
      [{ text: "❌ Cancelar", callback_data: "meeting_edit_cancel" }],
    ],
  };
}


function planEditKeyboard(step?: string) {
  if (step === "CONFIRMAR") {
    return {
      inline_keyboard: [
        [
          {
            text: "✅ Guardar cambios",
            callback_data: "plan_edit_confirm",
          },
          {
            text: "❌ Cancelar",
            callback_data: "plan_edit_cancel",
          },
        ],
      ],
    };
  }

  return {
    inline_keyboard: [
      [{ text: "❌ Cancelar", callback_data: "plan_edit_cancel" }],
    ],
  };
}


function aulaMagicaPageUrl(pathname: string) {
  const baseUrl = String(process.env.AULA_MAGICA_URL || "")
    .trim()
    .replace(/\/+$/, "");

  const cleanPath = pathname.startsWith("/")
    ? pathname
    : `/${pathname}`;

  return `${baseUrl}${cleanPath}`;
}

function vaultMenuKeyboard() {
  const rows: Array<
    Array<{ text: string; callback_data?: string; url?: string }>
  > = [
    [{ text: "🧰 Ver mis compras", callback_data: "vault_purchases" }],
  ];

  const vaultUrl = aulaMagicaPageUrl("/dashboard/baul");

  if (vaultUrl.startsWith("https://")) {
    rows.push([{ text: "🌐 Abrir Mi Baúl", url: vaultUrl }]);
  }

  rows.push([{ text: "⬅️ Volver al menú", callback_data: "inicio" }]);

  return { inline_keyboard: rows };
}

function vaultPurchasesKeyboard(
  purchases: Array<{
    idCompra: string;
    titulo: string;
    estado: string;
  }>
) {
  const rows = purchases.slice(0, 20).map((purchase) => [
    {
      text:
        `${purchase.estado === "PAGADO" ? "🔓" : "⏳"} ` +
        `${purchase.titulo}`,
      callback_data: `vault_purchase:${purchase.idCompra}`,
    },
  ]);

  rows.push([{ text: "⬅️ Volver", callback_data: "vault_menu" }]);
  return { inline_keyboard: rows };
}

function vaultPurchaseKeyboard(purchase?: {
  estado: string;
  archivoUrl?: string;
  whatsapp?: string;
  idCompra: string;
}) {
  const rows: Array<Array<{ text: string; callback_data?: string; url?: string }>> = [];

  if (purchase?.estado === "PAGADO" && purchase.archivoUrl) {
    rows.push([
      { text: "⬇️ Descargar material", url: purchase.archivoUrl },
    ]);
  }

  if (purchase?.estado === "PENDIENTE" && purchase.whatsapp) {
    const message = encodeURIComponent(
      `Hola, deseo completar la compra ${purchase.idCompra}.`
    );
    rows.push([
      {
        text: "💬 Enviar comprobante",
        url: `https://wa.me/${purchase.whatsapp.replace(/\D/g, "")}?text=${message}`,
      },
    ]);
  }

  rows.push([{ text: "⬅️ Volver", callback_data: "vault_purchases" }]);
  return { inline_keyboard: rows };
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
        [
          { text: "📊 Reportes", callback_data: "reports_menu" },
          { text: "🧰 Mi Baúl", callback_data: "vault_menu" },
        ],
        [
          { text: "⚙️ Configuración", callback_data: "settings_menu" },
          { text: "❓ Ayuda", callback_data: "ayuda" },
        ],
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

  if (command === "vault_menu") {
    await sendMessage(
      chatId,
      "🧰 <b>Mi Baúl Digital</b>\n\nConsulta tus compras o abre el catálogo.",
      true,
      vaultMenuKeyboard()
    );
    return;
  }

  if (command === "vault_purchases") {
    const result = await callAppsScript<BotResult>(
      "botListarComprasBaulTelegram",
      { chatId }
    );

    const purchases = result.compras || [];

    if (!purchases.length) {
      await sendMessage(
        chatId,
        escapeHtml(result.texto || "No tienes compras registradas."),
        true,
        vaultMenuKeyboard()
      );
      return;
    }

    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Selecciona una compra."),
      true,
      vaultPurchasesKeyboard(purchases)
    );
    return;
  }

  if (command.startsWith("vault_purchase:")) {
    const purchaseId = rawText.split(":")[1] || "";

    const result = await callAppsScript<BotResult>(
      "botObtenerMaterialBaulTelegram",
      { chatId, idCompra: purchaseId }
    );

    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Compra"),
      true,
      vaultPurchaseKeyboard(result.compra)
    );
    return;
  }

  if (command === "settings_menu") {
    await sendMessage(
      chatId,
      "⚙️ <b>Configuración</b>\n\nConsulta o actualiza el perfil de la maestra.",
      true,
      settingsMenuKeyboard()
    );
    return;
  }

  if (command === "alerts_menu") {
    const result = await callAppsScript<BotResult>(
      "botObtenerPreferenciasAvisosTelegram",
      { chatId }
    );

    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Configura tus avisos."),
      true,
      alertsKeyboard(result.preferencias)
    );
    return;
  }

  if (command.startsWith("alert_toggle:")) {
    const tipo = rawText.split(":")[1] || "";

    const result = await callAppsScript<BotResult>(
      "botCambiarPreferenciaAvisoTelegram",
      { chatId, tipo }
    );

    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Preferencia actualizada."),
      true,
      alertsKeyboard(result.preferencias)
    );
    return;
  }

  if (command.startsWith("alerts_all:")) {
    const value = rawText.split(":")[1] || "";
    const activo = value === "on";

    const result = await callAppsScript<BotResult>(
      "botCambiarTodosAvisosTelegram",
      { chatId, activo }
    );

    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Preferencias actualizadas."),
      true,
      alertsKeyboard(result.preferencias)
    );
    return;
  }

  if (command === "alerts_test") {
    const result = await callAppsScript<BotResult>(
      "botProbarAvisosTelegram",
      { chatId }
    );

    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Prueba terminada."),
      true
    );
    return;
  }

  if (command === "settings_view") {
    const result = await callAppsScript<BotResult>(
      "botObtenerPerfilTelegram",
      { chatId }
    );

    await sendMessage(
      chatId,
      escapeHtml(result.texto || "No hay información disponible."),
      true,
      settingsMenuKeyboard()
    );
    return;
  }

  if (command === "settings_edit") {
    const result = await callAppsScript<BotResult>(
      "botIniciarPerfilTelegram",
      { chatId }
    );

    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Escribe el nuevo nombre."),
      true,
      keyboardForSettingsStep(result.paso)
    );
    return;
  }

  if (command === "settings_confirm") {
    const result = await callAppsScript<BotResult>(
      "botConfirmarPerfilTelegram",
      { chatId }
    );

    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Perfil actualizado."),
      true,
      settingsMenuKeyboard()
    );
    return;
  }

  if (command === "settings_cancel") {
    const result = await callAppsScript<BotResult>(
      "botCancelarFlujoPerfilTelegram",
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
    const settingsFlow = await callAppsScript<BotResult>(
      "botProcesarFlujoPerfilTelegram",
      { chatId, texto: rawText }
    );

    if (settingsFlow.activo || settingsFlow.cancelado) {
      await sendMessage(
        chatId,
        escapeHtml(settingsFlow.texto || "Continúa con el siguiente paso."),
        true,
        settingsFlow.activo
          ? keyboardForSettingsStep(settingsFlow.paso)
          : mainMenuKeyboard(true)
      );
      return;
    }
  }

  if (command === "reports_menu") {
    await sendMessage(
      chatId,
      "📊 <b>Reportes</b>\n\nSelecciona el reporte que deseas consultar.",
      true,
      reportsMenuKeyboard()
    );
    return;
  }

  if (command.startsWith("report:")) {
    const tipo = rawText.split(":")[1] || "";

    const result = await callAppsScript<BotResult>(
      "botGenerarReporteTelegram",
      { chatId, tipo }
    );

    await sendMessage(
      chatId,
      escapeHtml(result.texto || "No hay información disponible."),
      true,
      reportsMenuKeyboard()
    );
    return;
  }

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

  if (command === "student_manage") {
    const result = await callAppsScript<BotResult>(
      "botListarAlumnosGestionTelegram",
      { chatId }
    );

    const students = result.alumnos || [];

    if (!students.length) {
      await sendMessage(
        chatId,
        "No tienes alumnos para administrar.",
        true,
        studentsMenuKeyboard()
      );
      return;
    }

    await sendMessage(
      chatId,
      "⚙️ <b>Administrar alumnos</b>\n\nSelecciona un alumno.",
      true,
      studentsManageListKeyboard(students)
    );
    return;
  }

  if (command.startsWith("student_item:")) {
    const studentId = rawText.split(":")[1] || "";

    const result = await callAppsScript<BotResult>(
      "botObtenerAlumnoGestionTelegram",
      { chatId, idAlumno: studentId }
    );

    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Alumno"),
      true,
      studentItemManageKeyboard(
        studentId,
        result.alumno?.estado || "ACTIVO"
      )
    );
    return;
  }

  if (command.startsWith("student_edit:")) {
    const studentId = rawText.split(":")[1] || "";

    const result = await callAppsScript<BotResult>(
      "botIniciarEdicionAlumnoTelegram",
      { chatId, idAlumno: studentId }
    );

    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Escribe el nuevo nombre."),
      true,
      studentEditKeyboard(result.paso)
    );
    return;
  }

  if (command === "student_edit_confirm") {
    const result = await callAppsScript<BotResult>(
      "botConfirmarEdicionAlumnoTelegram",
      { chatId }
    );

    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Alumno actualizado."),
      true,
      studentsMenuKeyboard()
    );
    return;
  }

  if (command === "student_edit_cancel") {
    const result = await callAppsScript<BotResult>(
      "botCancelarEdicionAlumnoTelegram",
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
    const studentEditFlow = await callAppsScript<BotResult>(
      "botProcesarEdicionAlumnoTelegram",
      { chatId, texto: rawText }
    );

    if (studentEditFlow.activo || studentEditFlow.cancelado) {
      await sendMessage(
        chatId,
        escapeHtml(
          studentEditFlow.texto || "Continúa con el siguiente paso."
        ),
        true,
        studentEditFlow.activo
          ? studentEditKeyboard(studentEditFlow.paso)
          : mainMenuKeyboard(true)
      );
      return;
    }
  }

  if (command.startsWith("student_state:")) {
    const [, studentId = "", state = ""] = rawText.split(":");

    const result = await callAppsScript<BotResult>(
      "botCambiarEstadoAlumnoTelegram",
      { chatId, idAlumno: studentId, estado: state }
    );

    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Alumno actualizado."),
      true,
      studentsMenuKeyboard()
    );
    return;
  }

  if (command.startsWith("student_delete_confirm:")) {
    const studentId = rawText.split(":")[1] || "";

    await sendMessage(
      chatId,
      "⚠️ ¿Seguro que deseas eliminar este alumno?",
      true,
      studentDeleteConfirmKeyboard(studentId)
    );
    return;
  }

  if (command.startsWith("student_delete:")) {
    const studentId = rawText.split(":")[1] || "";

    const result = await callAppsScript<BotResult>(
      "botEliminarAlumnoTelegram",
      { chatId, idAlumno: studentId }
    );

    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Alumno eliminado."),
      true,
      studentsMenuKeyboard()
    );
    return;
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

  if (command === "grade_manage") {
    const result = await callAppsScript<BotResult>(
      "botListarCalificacionesGestionTelegram",
      { chatId }
    );

    const grades = result.calificaciones || [];

    if (!grades.length) {
      await sendMessage(
        chatId,
        "No tienes calificaciones para administrar.",
        true,
        gradesMenuKeyboard()
      );
      return;
    }

    await sendMessage(
      chatId,
      "⚙️ <b>Administrar calificaciones</b>\n\nSelecciona una calificación.",
      true,
      gradesManageListKeyboard(grades)
    );
    return;
  }

  if (command.startsWith("grade_item:")) {
    const gradeId = rawText.split(":")[1] || "";

    const result = await callAppsScript<BotResult>(
      "botObtenerCalificacionGestionTelegram",
      { chatId, idCalificacion: gradeId }
    );

    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Calificación"),
      true,
      gradeItemKeyboard(gradeId)
    );
    return;
  }

  if (command.startsWith("grade_edit:")) {
    const gradeId = rawText.split(":")[1] || "";

    const result = await callAppsScript<BotResult>(
      "botIniciarEdicionCalificacionTelegram",
      { chatId, idCalificacion: gradeId }
    );

    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Escribe la nueva calificación."),
      true,
      gradeEditKeyboard(result.paso)
    );
    return;
  }

  if (command === "grade_edit_confirm") {
    const result = await callAppsScript<BotResult>(
      "botConfirmarEdicionCalificacionTelegram",
      { chatId }
    );

    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Calificación corregida."),
      true,
      gradesMenuKeyboard()
    );
    return;
  }

  if (command === "grade_edit_cancel") {
    const result = await callAppsScript<BotResult>(
      "botCancelarEdicionCalificacionTelegram",
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
    const gradeEditFlow = await callAppsScript<BotResult>(
      "botProcesarEdicionCalificacionTelegram",
      { chatId, texto: rawText }
    );

    if (gradeEditFlow.activo || gradeEditFlow.cancelado) {
      await sendMessage(
        chatId,
        escapeHtml(
          gradeEditFlow.texto || "Continúa con el siguiente paso."
        ),
        true,
        gradeEditFlow.activo
          ? gradeEditKeyboard(gradeEditFlow.paso)
          : mainMenuKeyboard(true)
      );
      return;
    }
  }

  if (command.startsWith("grade_delete_confirm:")) {
    const gradeId = rawText.split(":")[1] || "";

    await sendMessage(
      chatId,
      "⚠️ ¿Seguro que deseas eliminar esta calificación?",
      true,
      gradeDeleteConfirmKeyboard(gradeId)
    );
    return;
  }

  if (command.startsWith("grade_delete:")) {
    const gradeId = rawText.split(":")[1] || "";

    const result = await callAppsScript<BotResult>(
      "botEliminarCalificacionTelegram",
      { chatId, idCalificacion: gradeId }
    );

    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Calificación eliminada."),
      true,
      gradesMenuKeyboard()
    );
    return;
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

  if (command === "plan_manage") {
    const result = await callAppsScript<BotResult>(
      "botListarPlanesGestionTelegram",
      { chatId }
    );

    const plans = result.planes || [];

    if (!plans.length) {
      await sendMessage(
        chatId,
        "No tienes planificaciones para administrar.",
        true,
        plansMenuKeyboard()
      );
      return;
    }

    await sendMessage(
      chatId,
      "⚙️ <b>Administrar planificaciones</b>\n\nSelecciona una planificación.",
      true,
      plansManageListKeyboard(plans)
    );
    return;
  }

  if (command.startsWith("plan_item:")) {
    const planId = rawText.split(":")[1] || "";

    const result = await callAppsScript<BotResult>(
      "botObtenerPlanGestionTelegram",
      { chatId, idPlanificacion: planId }
    );

    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Planificación"),
      true,
      planItemKeyboard(
        planId,
        result.plan?.estado || "PLANIFICADA"
      )
    );
    return;
  }

  if (command.startsWith("plan_edit:")) {
    const planId = rawText.split(":")[1] || "";

    const result = await callAppsScript<BotResult>(
      "botIniciarEdicionPlanTelegram",
      { chatId, idPlanificacion: planId }
    );

    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Escribe el nuevo título."),
      true,
      planEditKeyboard(result.paso)
    );
    return;
  }

  if (command === "plan_edit_confirm") {
    const result = await callAppsScript<BotResult>(
      "botConfirmarEdicionPlanTelegram",
      { chatId }
    );

    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Planificación actualizada."),
      true,
      plansMenuKeyboard()
    );
    return;
  }

  if (command === "plan_edit_cancel") {
    const result = await callAppsScript<BotResult>(
      "botCancelarEdicionPlanTelegram",
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
    const planEditFlow = await callAppsScript<BotResult>(
      "botProcesarEdicionPlanTelegram",
      { chatId, texto: rawText }
    );

    if (planEditFlow.activo || planEditFlow.cancelado) {
      await sendMessage(
        chatId,
        escapeHtml(
          planEditFlow.texto || "Continúa con el siguiente paso."
        ),
        true,
        planEditFlow.activo
          ? planEditKeyboard(planEditFlow.paso)
          : mainMenuKeyboard(true)
      );
      return;
    }
  }

  if (command.startsWith("plan_state:")) {
    const [, planId = "", state = ""] = rawText.split(":");

    const result = await callAppsScript<BotResult>(
      "botCambiarEstadoPlanTelegram",
      { chatId, idPlanificacion: planId, estado: state }
    );

    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Planificación actualizada."),
      true,
      plansMenuKeyboard()
    );
    return;
  }

  if (command.startsWith("plan_delete_confirm:")) {
    const planId = rawText.split(":")[1] || "";

    await sendMessage(
      chatId,
      "⚠️ ¿Seguro que deseas eliminar esta planificación?",
      true,
      planDeleteConfirmKeyboard(planId)
    );
    return;
  }

  if (command.startsWith("plan_delete:")) {
    const planId = rawText.split(":")[1] || "";

    const result = await callAppsScript<BotResult>(
      "botEliminarPlanTelegram",
      { chatId, idPlanificacion: planId }
    );

    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Planificación eliminada."),
      true,
      plansMenuKeyboard()
    );
    return;
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

  if (command === "meeting_manage") {
    const result = await callAppsScript<BotResult>(
      "botListarReunionesGestionTelegram",
      { chatId }
    );

    const meetings = result.reuniones || [];

    if (!meetings.length) {
      await sendMessage(
        chatId,
        "No tienes reuniones próximas para administrar.",
        true,
        meetingsMenuKeyboard()
      );
      return;
    }

    await sendMessage(
      chatId,
      "⚙️ <b>Administrar reuniones</b>\n\nSelecciona una reunión.",
      true,
      meetingsManageListKeyboard(meetings)
    );
    return;
  }

  if (command.startsWith("meeting_item:")) {
    const meetingId = rawText.split(":")[1] || "";

    const result = await callAppsScript<BotResult>(
      "botObtenerReunionGestionTelegram",
      { chatId, idReunion: meetingId }
    );

    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Reunión"),
      true,
      meetingItemKeyboard(
        meetingId,
        result.reunion?.estado || "PROGRAMADA"
      )
    );
    return;
  }

  if (command.startsWith("meeting_edit:")) {
    const meetingId = rawText.split(":")[1] || "";

    const result = await callAppsScript<BotResult>(
      "botIniciarEdicionReunionTelegram",
      { chatId, idReunion: meetingId }
    );

    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Escribe el nuevo título."),
      true,
      meetingEditKeyboard(result.paso)
    );
    return;
  }

  if (command === "meeting_edit_confirm") {
    const result = await callAppsScript<BotResult>(
      "botConfirmarEdicionReunionTelegram",
      { chatId }
    );

    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Reunión actualizada."),
      true,
      meetingsMenuKeyboard()
    );
    return;
  }

  if (command === "meeting_edit_cancel") {
    const result = await callAppsScript<BotResult>(
      "botCancelarEdicionReunionTelegram",
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
    const meetingEditFlow = await callAppsScript<BotResult>(
      "botProcesarEdicionReunionTelegram",
      { chatId, texto: rawText }
    );

    if (meetingEditFlow.activo || meetingEditFlow.cancelado) {
      await sendMessage(
        chatId,
        escapeHtml(
          meetingEditFlow.texto || "Continúa con el siguiente paso."
        ),
        true,
        meetingEditFlow.activo
          ? meetingEditKeyboard(meetingEditFlow.paso)
          : mainMenuKeyboard(true)
      );
      return;
    }
  }

  if (command.startsWith("meeting_state:")) {
    const [, meetingId = "", state = ""] = rawText.split(":");

    const result = await callAppsScript<BotResult>(
      "botCambiarEstadoReunionTelegram",
      { chatId, idReunion: meetingId, estado: state }
    );

    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Reunión actualizada."),
      true,
      meetingsMenuKeyboard()
    );
    return;
  }

  if (command.startsWith("meeting_delete_confirm:")) {
    const meetingId = rawText.split(":")[1] || "";

    await sendMessage(
      chatId,
      "⚠️ ¿Seguro que deseas eliminar esta reunión?",
      true,
      meetingDeleteConfirmKeyboard(meetingId)
    );
    return;
  }

  if (command.startsWith("meeting_delete:")) {
    const meetingId = rawText.split(":")[1] || "";

    const result = await callAppsScript<BotResult>(
      "botEliminarReunionTelegram",
      { chatId, idReunion: meetingId }
    );

    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Reunión eliminada."),
      true,
      meetingsMenuKeyboard()
    );
    return;
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

  if (command === "agenda_manage") {
    const result = await callAppsScript<BotResult>(
      "botListarEventosGestionTelegram",
      { chatId }
    );

    const events = result.eventos || [];

    if (!events.length) {
      await sendMessage(
        chatId,
        "No tienes eventos próximos para administrar.",
        true,
        agendaMenuKeyboard()
      );
      return;
    }

    await sendMessage(
      chatId,
      "⚙️ <b>Administrar eventos</b>\n\nSelecciona un evento.",
      true,
      agendaManageListKeyboard(events)
    );
    return;
  }

  if (command.startsWith("agenda_item:")) {
    const eventId = rawText.split(":")[1] || "";

    const result = await callAppsScript<BotResult>(
      "botObtenerEventoGestionTelegram",
      { chatId, idEvento: eventId }
    );

    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Evento"),
      true,
      agendaItemKeyboard(
        eventId,
        result.evento?.estado || "PENDIENTE"
      )
    );
    return;
  }

  if (command.startsWith("agenda_edit:")) {
    const eventId = rawText.split(":")[1] || "";

    const result = await callAppsScript<BotResult>(
      "botIniciarEdicionEventoTelegram",
      { chatId, idEvento: eventId }
    );

    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Escribe el nuevo título."),
      true,
      agendaEditKeyboard(result.paso)
    );
    return;
  }

  if (command === "agenda_edit_confirm") {
    const result = await callAppsScript<BotResult>(
      "botConfirmarEdicionEventoTelegram",
      { chatId }
    );

    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Evento actualizado."),
      true,
      agendaMenuKeyboard()
    );
    return;
  }

  if (command === "agenda_edit_cancel") {
    const result = await callAppsScript<BotResult>(
      "botCancelarEdicionEventoTelegram",
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
    const agendaEditFlow = await callAppsScript<BotResult>(
      "botProcesarEdicionEventoTelegram",
      { chatId, texto: rawText }
    );

    if (agendaEditFlow.activo || agendaEditFlow.cancelado) {
      await sendMessage(
        chatId,
        escapeHtml(
          agendaEditFlow.texto || "Continúa con el siguiente paso."
        ),
        true,
        agendaEditFlow.activo
          ? agendaEditKeyboard(agendaEditFlow.paso)
          : mainMenuKeyboard(true)
      );
      return;
    }
  }

  if (command.startsWith("agenda_state:")) {
    const [, eventId = "", state = ""] = rawText.split(":");

    const result = await callAppsScript<BotResult>(
      "botCambiarEstadoEventoTelegram",
      { chatId, idEvento: eventId, estado: state }
    );

    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Evento actualizado."),
      true,
      agendaMenuKeyboard()
    );
    return;
  }

  if (command.startsWith("agenda_delete_confirm:")) {
    const eventId = rawText.split(":")[1] || "";

    await sendMessage(
      chatId,
      "⚠️ ¿Seguro que deseas eliminar este evento?",
      true,
      agendaDeleteConfirmKeyboard(eventId)
    );
    return;
  }

  if (command.startsWith("agenda_delete:")) {
    const eventId = rawText.split(":")[1] || "";

    const result = await callAppsScript<BotResult>(
      "botEliminarEventoTelegram",
      { chatId, idEvento: eventId }
    );

    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Evento eliminado."),
      true,
      agendaMenuKeyboard()
    );
    return;
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

  if (command === "attendance_manage") {
    const result = await callAppsScript<BotResult>(
      "botListarAsistenciaGestionTelegram",
      { chatId }
    );

    const records = result.asistencias || [];

    if (!records.length) {
      await sendMessage(
        chatId,
        "No hay registros de asistencia para hoy.",
        true,
        attendanceMenuKeyboard()
      );
      return;
    }

    await sendMessage(
      chatId,
      "⚙️ <b>Administrar asistencia</b>\n\nSelecciona un alumno.",
      true,
      attendanceManageRecordsKeyboard(records)
    );
    return;
  }

  if (command.startsWith("attendance_item:")) {
    const recordId = rawText.split(":")[1] || "";

    const result = await callAppsScript<BotResult>(
      "botObtenerAsistenciaGestionTelegram",
      { chatId, idAsistencia: recordId }
    );

    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Asistencia"),
      true,
      attendanceRecordKeyboard(
        recordId,
        result.asistencia?.estado || "PRESENTE"
      )
    );
    return;
  }

  if (command.startsWith("attendance_state:")) {
    const [, recordId = "", state = ""] = rawText.split(":");

    const result = await callAppsScript<BotResult>(
      "botCambiarEstadoAsistenciaTelegram",
      { chatId, idAsistencia: recordId, estado: state }
    );

    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Asistencia actualizada."),
      true,
      attendanceMenuKeyboard()
    );
    return;
  }

  if (command.startsWith("attendance_delete_confirm:")) {
    const recordId = rawText.split(":")[1] || "";

    await sendMessage(
      chatId,
      "⚠️ ¿Seguro que deseas eliminar este registro de asistencia?",
      true,
      attendanceDeleteKeyboard(recordId)
    );
    return;
  }

  if (command.startsWith("attendance_delete:")) {
    const recordId = rawText.split(":")[1] || "";

    const result = await callAppsScript<BotResult>(
      "botEliminarAsistenciaTelegram",
      { chatId, idAsistencia: recordId }
    );

    await sendMessage(
      chatId,
      escapeHtml(result.texto || "Registro eliminado."),
      true,
      attendanceMenuKeyboard()
    );
    return;
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
