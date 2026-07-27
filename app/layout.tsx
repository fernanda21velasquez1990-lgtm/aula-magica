import type { Metadata, Viewport } from "next";
import AppBoot from "@/components/AppBoot";
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
  openGraph: {
    title: "Aula Mágica",
    description:
      "Organiza alumnos, asistencia, notas, planificación y materiales en un solo espacio mágico.",
    type: "website",
    locale: "es_ES",
    images: [
      {
        url: "/brand/aula-magica-social.jpg",
        width: 1200,
        height: 630,
        alt: "Logo de Aula Mágica",
      },
    ],
  },
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
      <body>
        <AppBoot />
        {children}
      </body>
    </html>
  );
}
