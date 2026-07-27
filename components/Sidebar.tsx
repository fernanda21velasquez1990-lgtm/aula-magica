"use client";
import Link from "next/link";
import { LayoutDashboard, Users, ClipboardCheck, GraduationCap, CalendarDays, Cake, Handshake, CalendarClock, Send, FileBarChart, Settings, PackageOpen } from "lucide-react";
const items = [
  ["/dashboard", "Inicio", LayoutDashboard],
  ["/dashboard/alumnos", "Alumnos", Users],
  ["/dashboard/asistencia", "Asistencia", ClipboardCheck],
  ["/dashboard/calificaciones", "Notas", GraduationCap],
  ["/dashboard/planificacion", "Planes", CalendarDays],
  ["/dashboard/cumpleanos", "Cumpleaños", Cake],
  ["/dashboard/reuniones", "Reuniones", Handshake],
  ["/dashboard/agenda", "Agenda", CalendarClock],
  ["/dashboard/baul", "Mi Baúl", PackageOpen],
  ["/dashboard/telegram", "Telegram", Send],
  ["/dashboard/reportes", "Reportes", FileBarChart],
  ["/dashboard/configuracion", "Configuración", Settings],
] as const;
export default function Sidebar() {
  return <aside className="sidebar"><div className="brand">Aula <span>Mágica</span> ✨</div><nav className="nav">{items.map(([href,label,Icon]) => <Link href={href} key={href}><Icon size={21}/><span>{label}</span></Link>)}</nav></aside>;
}
