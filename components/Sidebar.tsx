"use client";

import {
  Cake,
  CalendarClock,
  CalendarDays,
  ClipboardCheck,
  FileBarChart,
  GraduationCap,
  Handshake,
  LayoutDashboard,
  PackageOpen,
  Send,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AppLogo from "./AppLogo";
import ThemeToggle from "./ThemeToggle";

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
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <AppLogo />
      </div>

      <nav className="nav" aria-label="Navegación principal">
        {items.map(([href, label, Icon]) => {
          const active =
            href === "/dashboard"
              ? pathname === href
              : pathname.startsWith(href);

          return (
            <Link
              href={href}
              key={href}
              className={active ? "active" : ""}
              aria-current={active ? "page" : undefined}
              title={label}
            >
              <Icon size={21} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <ThemeToggle />
        <small>Versión profesional 6.0.1</small>
      </div>
    </aside>
  );
}
