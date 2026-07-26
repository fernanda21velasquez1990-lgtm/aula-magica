const API_URL = "/api/apps-script";

type ApiRequest = {
  action: string;
  token?: string;
  data?: Record<string, unknown>;
};

type ApiResponse<T> = {
  ok: boolean;
  resultado?: T;
  error?: string;
};

export async function llamarAppsScript<T>(solicitud: ApiRequest): Promise<T> {
  const respuesta = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(solicitud),
    cache: "no-store",
  });

  let contenido: ApiResponse<T>;

  try {
    contenido = (await respuesta.json()) as ApiResponse<T>;
  } catch {
    throw new Error("El servidor no devolvió una respuesta válida.");
  }

  if (!respuesta.ok || !contenido.ok) {
    throw new Error(
      contenido.error || `Error de conexión: ${respuesta.status}`
    );
  }

  if (contenido.resultado === undefined) {
    throw new Error("Apps Script no devolvió ningún resultado.");
  }

  return contenido.resultado;
}

export type Maestra = {
  idMaestra: string;
  nombre: string;
  apellido: string;
  correo: string;
  usuario: string;
  grado?: string;
  seccion?: string;
};

export type ResultadoLogin = {
  token: string;
  maestra: Maestra;
};

export async function registrarMaestra(datos: {
  nombre: string;
  apellido: string;
  correo: string;
  contrasena: string;
  grado?: string;
  seccion?: string;
}) {
  return llamarAppsScript<Maestra>({ action: "registrarMaestra", data: datos });
}

export async function iniciarSesion(datos: { correo: string; contrasena: string }) {
  return llamarAppsScript<ResultadoLogin>({ action: "iniciarSesion", data: datos });
}

export async function verificarSesion(token: string) {
  return llamarAppsScript<Maestra>({ action: "verificarSesion", token });
}

export async function cerrarSesion(token: string) {
  return llamarAppsScript<{ cerrado: boolean }>({ action: "cerrarSesion", token });
}

export type Alumno = {
  idAlumno: string;
  nombre: string;
  apellido: string;
  documento: string;
  fechaNacimiento: string;
  sexo: string;
  grado: string;
  seccion: string;
  representante: string;
  telefono: string;
  direccion: string;
  observaciones: string;
  estado: string;
};

export type DatosAlumno = Omit<Alumno, "idAlumno" | "estado"> & {
  idAlumno?: string;
  estado?: string;
};

export async function crearAlumno(token: string, datos: DatosAlumno) {
  return llamarAppsScript<Alumno>({ action: "crearAlumno", token, data: datos });
}

export async function listarAlumnos(token: string) {
  return llamarAppsScript<Alumno[]>({ action: "listarAlumnos", token });
}

export async function editarAlumno(token: string, datos: DatosAlumno & { idAlumno: string }) {
  return llamarAppsScript<Alumno>({ action: "editarAlumno", token, data: datos });
}

export async function eliminarAlumno(token: string, idAlumno: string) {
  return llamarAppsScript<{ eliminado: boolean; idAlumno: string }>({
    action: "eliminarAlumno",
    token,
    data: { idAlumno },
  });
}

export type EstadoAsistencia =
  | ""
  | "PRESENTE"
  | "AUSENTE"
  | "TARDE"
  | "JUSTIFICADO";

export type AsistenciaAlumno = {
  idAlumno: string;
  nombre: string;
  apellido: string;
  sexo: string;
  grado: string;
  seccion: string;
  estado: EstadoAsistencia;
  observaciones: string;
};

export async function listarAsistencia(token: string, fecha: string) {
  return llamarAppsScript<AsistenciaAlumno[]>({
    action: "listarAsistencia",
    token,
    data: { fecha },
  });
}

export async function guardarAsistencia(
  token: string,
  fecha: string,
  registros: AsistenciaAlumno[]
) {
  return llamarAppsScript<{ guardados: number; fecha: string }>({
    action: "guardarAsistencia",
    token,
    data: {
      fecha,
      registros: registros.map((registro) => ({
        idAlumno: registro.idAlumno,
        estado: registro.estado,
        observaciones: registro.observaciones,
      })),
    },
  });
}

export type Calificacion = {
  idCalificacion: string;
  idAlumno: string;
  nombreAlumno: string;
  asignatura: string;
  actividad: string;
  periodo: string;
  calificacion: number;
  calificacionMaxima: number;
  fecha: string;
  observaciones: string;
};

export type DatosCalificacion = {
  idCalificacion?: string;
  idAlumno: string;
  asignatura: string;
  actividad: string;
  periodo: string;
  calificacion: number;
  calificacionMaxima: number;
  fecha: string;
  observaciones: string;
};

export async function listarCalificaciones(token: string) {
  return llamarAppsScript<Calificacion[]>({
    action: "listarCalificaciones",
    token,
  });
}

export async function guardarCalificacion(
  token: string,
  datos: DatosCalificacion
) {
  return llamarAppsScript<Calificacion>({
    action: "guardarCalificacion",
    token,
    data: datos,
  });
}

export async function eliminarCalificacion(
  token: string,
  idCalificacion: string
) {
  return llamarAppsScript<{ eliminado: boolean; idCalificacion: string }>({
    action: "eliminarCalificacion",
    token,
    data: { idCalificacion },
  });
}


export type Planificacion = {
  idPlanificacion: string;
  titulo: string;
  asignatura: string;
  grado: string;
  fecha: string;
  objetivo: string;
  contenido: string;
  actividades: string;
  recursos: string;
  evaluacion: string;
  estado: string;
  fechaRegistro: string;
};

export type DatosPlanificacion = {
  idPlanificacion?: string;
  titulo: string;
  asignatura: string;
  grado: string;
  fecha: string;
  objetivo: string;
  contenido: string;
  actividades: string;
  recursos: string;
  evaluacion: string;
  estado: string;
};

export async function listarPlanificaciones(token: string) {
  return llamarAppsScript<Planificacion[]>({
    action: "listarPlanificaciones",
    token,
  });
}

export async function guardarPlanificacion(
  token: string,
  datos: DatosPlanificacion
) {
  return llamarAppsScript<Planificacion>({
    action: "guardarPlanificacion",
    token,
    data: datos,
  });
}

export async function eliminarPlanificacion(
  token: string,
  idPlanificacion: string
) {
  return llamarAppsScript<{ eliminado: boolean; idPlanificacion: string }>({
    action: "eliminarPlanificacion",
    token,
    data: { idPlanificacion },
  });
}
