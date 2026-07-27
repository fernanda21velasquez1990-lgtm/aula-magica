"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cerrarSesion, verificarSesion, type Maestra } from "@/lib/apps-script-api";
import { eliminarSesion, obtenerMaestra, obtenerToken } from "@/lib/session";

const opciones = [
  ["Alumnos","Registrar y administrar estudiantes.","👩‍🎓","/dashboard/alumnos"],
  ["Asistencia","Control diario de asistencia.","✅","/dashboard/asistencia"],
  ["Calificaciones","Registrar notas y evaluaciones.","📝","/dashboard/calificaciones"],
  ["Planificación","Organizar clases y actividades.","📚","/dashboard/planificacion"],
  ["Cumpleaños","Consultar próximos cumpleaños.","🎂","/dashboard/cumpleanos"],
  ["Reuniones","Guardar reuniones y acuerdos.","🤝","/dashboard/reuniones"],
  ["Agenda","Organizar eventos y recordatorios.","📅","/dashboard/agenda"],
  ["Calendario escolar","Evaluaciones, feriados y actividades.","🏫","/dashboard/calendario-escolar"],
  ["Horario semanal","Organizar clases por día y hora.","🗓️","/dashboard/horario"],
  ["Telegram","Conectar el bot y consultar información.","✈️","/dashboard/telegram"],
  ["Reportes","Consultar resúmenes, imprimir y exportar datos.","📊","/dashboard/reportes"],
] as const;

export default function DashboardPage() {
  const router = useRouter();
  const [maestra, setMaestra] = useState<Maestra | null>(null);
  const [cargando, setCargando] = useState(true);
  useEffect(() => {
    (async () => {
      const token = obtenerToken();
      if (!token) { router.replace("/"); return; }
      setMaestra(obtenerMaestra());
      try { setMaestra(await verificarSesion(token)); }
      catch { eliminarSesion(); router.replace("/"); }
      finally { setCargando(false); }
    })();
  }, [router]);
  async function salir() {
    const token = obtenerToken();
    try { if (token) await cerrarSesion(token); } catch {}
    eliminarSesion(); router.replace("/");
  }
  if (cargando) return <div className="state-card">✨ Cargando Aula Mágica...</div>;
  if (!maestra) return null;
  return <>
    <section className="hero dashboard-hero"><div><span className="chip">Panel personal de la maestra</span><h1>¡Hola, {maestra.nombre}! 👋</h1><p>{maestra.grado || "Grado sin configurar"}{maestra.seccion ? ` · Sección ${maestra.seccion}` : ""}</p></div><button className="btn dark" onClick={salir}>Cerrar sesión</button></section>
    <section className="summary-grid"><article className="summary-card"><span>👩‍🏫</span><div><strong>{maestra.nombre} {maestra.apellido}</strong><p>{maestra.correo}</p></div></article><article className="summary-card"><span>🔐</span><div><strong>Espacio privado</strong><p>Tus datos están separados de los de las demás maestras.</p></div></article></section>
    <h2>¿Qué deseas hacer?</h2>
    <section className="tools-grid">{opciones.map(([titulo,descripcion,icono,ruta]) => <button className="tool-card" key={titulo} onClick={() => router.push(ruta)}><span className="tool-icon">{icono}</span><strong>{titulo}</strong><p>{descripcion}</p><b>Abrir sección →</b></button>)}</section>
  </>;
}
