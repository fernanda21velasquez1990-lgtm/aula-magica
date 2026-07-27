"use client";

import {
  Cake,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  Clock3,
  ClipboardCheck,
  FileBarChart,
  FolderHeart,
  GraduationCap,
  Handshake,
  LayoutDashboard,
  PackageOpen,
  Send,
  Settings,
  ShieldCheck,
  BadgeDollarSign,
  ReceiptText,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AppLogo from "./AppLogo";
import ThemeToggle from "./ThemeToggle";
import { obtenerMaestra } from "@/lib/session";

const items = [
  ["/dashboard", "Inicio", LayoutDashboard],
  ["/dashboard/alumnos", "Alumnos", Users],
  ["/dashboard/expedientes", "Expedientes", FolderHeart],
  ["/dashboard/asistencia", "Asistencia", ClipboardCheck],
  ["/dashboard/calificaciones", "Notas", GraduationCap],
  ["/dashboard/planificacion", "Planes", CalendarDays],
  ["/dashboard/cumpleanos", "Cumpleaños", Cake],
  ["/dashboard/reuniones", "Reuniones", Handshake],
  ["/dashboard/agenda", "Agenda", CalendarClock],
  ["/dashboard/calendario-escolar", "Calendario escolar", CalendarRange],
  ["/dashboard/horario", "Horario semanal", Clock3],
  ["/dashboard/baul", "Mi Baúl", PackageOpen],
  ["/dashboard/telegram", "Telegram", Send],
  ["/dashboard/reportes", "Reportes", FileBarChart],
  ["/dashboard/configuracion", "Configuración", Settings],
] as const;

export default function Sidebar() {
  const pathname = usePathname();
  const maestra = obtenerMaestra();

  const correoAdministrador = "wilmarvelasquez1783@gmail.com";
  const esAdministrador =
    Boolean(maestra?.esAdmin) ||
    String(maestra?.correo || "").trim().toLowerCase() ===
      correoAdministrador;

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <AppLogo compact priority />
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

        <Link
          href="/dashboard/renovar"
          className={pathname === "/dashboard/renovar" ? "active" : ""}
          title="Renovar plan"
        >
          <ReceiptText size={21} aria-hidden="true" />
          <span>Renovar plan</span>
        </Link>

        {esAdministrador && (
          <Link
            href="/dashboard/admin"
            className={
              pathname.startsWith("/dashboard/admin")
                ? "active admin-link"
                : "admin-link"
            }
            aria-current={
              pathname.startsWith("/dashboard/admin") ? "page" : undefined
            }
            title="Panel Administrador"
          >
            <ShieldCheck size={21} aria-hidden="true" />
            <span>Administrador</span>
          </Link>
        )}
        {esAdministrador && (
          <Link
            href="/dashboard/admin/suscripciones"
            className={pathname.startsWith("/dashboard/admin/suscripciones") ? "active admin-link" : "admin-link"}
            title="Licencias y ventas"
          >
            <BadgeDollarSign size={21} aria-hidden="true" />
            <span>Licencias y ventas</span>
          </Link>
        )}

        {esAdministrador && (
          <Link
            href="/dashboard/admin/solicitudes-pago"
            className={
              pathname === "/dashboard/admin/solicitudes-pago"
                ? "active admin-link"
                : "admin-link"
            }
            title="Comprobantes"
          >
            <ReceiptText size={21} aria-hidden="true" />
            <span>Comprobantes</span>
          </Link>
        )}
      </nav>

      <div className="sidebar-footer">
        <ThemeToggle />
        <small>Versión profesional 10.3</small>
      </div>
    </aside>
  );
}
