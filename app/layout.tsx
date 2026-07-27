import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Aula Mágica",
    template: "%s · Aula Mágica",
  },
  description:
    "Plataforma docente para alumnos, asistencia, notas, planificación, agenda, Telegram y materiales digitales.",
  applicationName: "Aula Mágica",
  keywords: [
    "gestión escolar",
    "maestras",
    "asistencia",
    "calificaciones",
    "planificación",
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fff8fc" },
    { media: "(prefers-color-scheme: dark)", color: "#17131f" },
  ],
};

const themeScript = `
(() => {
  try {
    const key = "aula_magica_theme";
    const stored = localStorage.getItem(key);
    const theme =
      stored === "light" || stored === "dark"
        ? stored
        : matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
