import type { Maestra } from "./apps-script-api";

const TOKEN_KEY = "aula_magica_token";
const TEACHER_KEY = "aula_magica_maestra";

export function guardarSesion(token: string, maestra: Maestra) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(TEACHER_KEY, JSON.stringify(maestra));
}

export function obtenerToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function obtenerMaestra(): Maestra | null {
  if (typeof window === "undefined") return null;
  const contenido = localStorage.getItem(TEACHER_KEY);
  if (!contenido) return null;
  try {
    return JSON.parse(contenido) as Maestra;
  } catch {
    eliminarSesion();
    return null;
  }
}

export function eliminarSesion() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TEACHER_KEY);
}
