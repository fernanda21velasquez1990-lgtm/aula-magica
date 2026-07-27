"use client";

import Link from "next/link";
import {
  BookOpenCheck,
  Bot,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileBarChart,
  FolderHeart,
  GraduationCap,
  Home,
  Laptop,
  Menu,
  MessageCircle,
  ReceiptText,
  Send,
  Settings,
  ShieldCheck,
  Smartphone,
  Users,
} from "lucide-react";

type Props = {
  insideDashboard?: boolean;
};

const pages = [
  {
    icon: Home,
    title: "Inicio",
    text: "Muestra un resumen rápido de tu trabajo: alumnos, pendientes, reuniones, cumpleaños y accesos principales.",
  },
  {
    icon: Users,
    title: "Alumnos",
    text: "Registra, busca, edita, activa o elimina alumnos. El número permitido depende del plan contratado.",
  },
  {
    icon: FolderHeart,
    title: "Expedientes",
    text: "Guarda fotografía, datos médicos, contacto de emergencia, autorizaciones, notas privadas y firmas digitales.",
  },
  {
    icon: ClipboardCheck,
    title: "Asistencia",
    text: "Marca presentes, ausentes, retardos y justificativos. Consulta el registro por fecha.",
  },
  {
    icon: GraduationCap,
    title: "Notas",
    text: "Registra calificaciones por alumno, materia y periodo. Mantiene el historial organizado.",
  },
  {
    icon: CalendarDays,
    title: "Planes",
    text: "Crea planificaciones docentes con objetivos, contenidos, actividades, recursos y evaluación.",
  },
  {
    icon: Clock3,
    title: "Horario",
    text: "Organiza las clases de cada día y consulta rápidamente qué corresponde impartir.",
  },
  {
    icon: CalendarDays,
    title: "Calendario escolar",
    text: "Registra evaluaciones, actos, reuniones, feriados y actividades importantes del colegio.",
  },
  {
    icon: MessageCircle,
    title: "Reuniones y agenda",
    text: "Programa compromisos y mantén visibles las tareas o actividades que requieren seguimiento.",
  },
  {
    icon: FolderHeart,
    title: "Mi Baúl Digital",
    text: "Guarda materiales, enlaces y recursos pedagógicos para encontrarlos cuando los necesites.",
  },
  {
    icon: FileBarChart,
    title: "Reportes",
    text: "Consulta información consolidada y prepara documentos para imprimir o guardar en PDF.",
  },
  {
    icon: ReceiptText,
    title: "Renovar plan",
    text: "Selecciona un plan, elige la moneda, adjunta el comprobante y revisa si fue aprobado o rechazado.",
  },
  {
    icon: Settings,
    title: "Configuración",
    text: "Ajusta los datos personales, preferencias y opciones disponibles para tu cuenta.",
  },
];

const telegramActions = [
  "Registrar y consultar alumnos.",
  "Tomar asistencia y consultar registros.",
  "Registrar calificaciones.",
  "Crear planificaciones.",
  "Consultar cumpleaños.",
  "Gestionar reuniones, agenda, horario y calendario escolar.",
  "Consultar materiales del Baúl Digital.",
  "Recibir recordatorios automáticos.",
];

export default function PlatformGuide({ insideDashboard = false }: Props) {
  return (
    <main className={`platform-guide ${insideDashboard ? "inside-dashboard" : "public"}`}>
      <section className="guide-hero">
        <div>
          <span>MANUAL OFICIAL DE USO</span>
          <h1>Aprende a usar Aula Mágica ✨</h1>
          <p>
            Una guía sencilla para conocer cada sección, instalar el acceso en
            tu dispositivo y trabajar también desde Telegram.
          </p>
          <div className="guide-hero-actions">
            <a href="#primeros-pasos">Comenzar la guía</a>
            <a href="#telegram">Ver Telegram</a>
          </div>
        </div>
        <div className="guide-hero-visual">
          <span>👩‍🏫</span>
          <b>Aula Mágica</b>
          <small>Tu asistente para organizar la jornada docente</small>
        </div>
      </section>

      <nav className="guide-index" aria-label="Contenido de la guía">
        <a href="#primeros-pasos">Primeros pasos</a>
        <a href="#paginas">Cada página</a>
        <a href="#telegram">Telegram</a>
        <a href="#instalacion">Instalar acceso</a>
        <a href="#pagos">Planes y pagos</a>
      </nav>

      <section className="guide-section" id="primeros-pasos">
        <header>
          <span>01</span>
          <div>
            <h2>Primeros pasos</h2>
            <p>Así comienzas a trabajar sin complicaciones.</p>
          </div>
        </header>

        <div className="guide-steps">
          <article>
            <b>1</b>
            <h3>Abre Aula Mágica</h3>
            <p>Entra desde el enlace entregado por el administrador.</p>
          </article>
          <article>
            <b>2</b>
            <h3>Inicia sesión</h3>
            <p>Escribe tu correo y contraseña. Si recibiste un código, pulsa “Tengo un código de activación”.</p>
          </article>
          <article>
            <b>3</b>
            <h3>Revisa el menú</h3>
            <p>En computadora aparece a la izquierda. En celular utiliza el botón del menú para mostrarlo.</p>
          </article>
          <article>
            <b>4</b>
            <h3>Registra tus alumnos</h3>
            <p>Comienza por Alumnos y después utiliza asistencia, notas, expedientes y planificaciones.</p>
          </article>
        </div>

        <div className="guide-tip">
          <CheckCircle2 size={24} />
          <div>
            <strong>Los datos de cada maestra están separados.</strong>
            <p>
              La plataforma identifica tu cuenta y solo presenta la información
              vinculada contigo.
            </p>
          </div>
        </div>
      </section>

      <section className="guide-section" id="paginas">
        <header>
          <span>02</span>
          <div>
            <h2>¿Qué encontrarás en cada página?</h2>
            <p>Conoce para qué sirve cada opción del menú.</p>
          </div>
        </header>

        <div className="guide-pages-grid">
          {pages.map((page) => {
            const Icon = page.icon;
            return (
              <article key={page.title}>
                <div><Icon size={25} /></div>
                <h3>{page.title}</h3>
                <p>{page.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="guide-section telegram-guide" id="telegram">
        <header>
          <span>03</span>
          <div>
            <h2>Bot de Telegram</h2>
            <p>Trabaja desde el chat sin abrir cada página.</p>
          </div>
        </header>

        <div className="telegram-guide-layout">
          <article className="telegram-main-card">
            <Bot size={48} />
            <span>NOMBRE DEL SERVICIO</span>
            <h3>Aula Mágica Bot</h3>
            <p>
              El bot no se descarga como una aplicación independiente. Primero
              instalas Telegram y luego abres el enlace o usuario del bot que te
              proporciona el administrador.
            </p>
            <div className="telegram-command">
              <code>/inicio</code>
              <span>Abre el menú principal del bot.</span>
            </div>
          </article>

          <div className="telegram-actions-list">
            <h3>Desde Telegram puedes:</h3>
            {telegramActions.map((action) => (
              <div key={action}>
                <CheckCircle2 size={18} />
                <span>{action}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="guide-steps telegram-steps">
          <article>
            <b>1</b>
            <h3>Instala Telegram</h3>
            <p>Descárgalo desde Google Play, App Store o la página oficial para computadora.</p>
          </article>
          <article>
            <b>2</b>
            <h3>Abre Aula Mágica Bot</h3>
            <p>Utiliza el enlace o nombre de usuario enviado por el administrador.</p>
          </article>
          <article>
            <b>3</b>
            <h3>Vincula tu cuenta</h3>
            <p>Sigue las instrucciones del bot para relacionar Telegram con tu cuenta de Aula Mágica.</p>
          </article>
          <article>
            <b>4</b>
            <h3>Escribe /inicio</h3>
            <p>El bot mostrará botones para elegir alumnos, asistencia, notas, agenda y otras funciones.</p>
          </article>
        </div>

        <div className="guide-warning">
          <ShieldCheck size={24} />
          <div>
            <strong>La misma licencia controla la web y Telegram.</strong>
            <p>
              Cuando el plan vence, ambas formas de acceso quedan suspendidas
              hasta que el pago sea aprobado.
            </p>
          </div>
        </div>
      </section>

      <section className="guide-section" id="instalacion">
        <header>
          <span>04</span>
          <div>
            <h2>Cómo instalar el acceso</h2>
            <p>Aula Mágica funciona desde el navegador y puede quedar como un icono.</p>
          </div>
        </header>

        <div className="device-guide-grid">
          <article>
            <Smartphone size={38} />
            <h3>Android</h3>
            <p>Abre Aula Mágica en Chrome.</p>
            <ol>
              <li>Pulsa los tres puntos.</li>
              <li>Selecciona “Agregar a pantalla principal” o “Instalar aplicación”.</li>
              <li>Confirma el nombre Aula Mágica.</li>
            </ol>
          </article>
          <article>
            <Smartphone size={38} />
            <h3>iPhone o iPad</h3>
            <p>Abre Aula Mágica usando Safari.</p>
            <ol>
              <li>Pulsa el botón Compartir.</li>
              <li>Selecciona “Agregar a inicio”.</li>
              <li>Pulsa Agregar.</li>
            </ol>
          </article>
          <article>
            <Laptop size={38} />
            <h3>Computadora</h3>
            <p>Abre Aula Mágica en Chrome o Edge.</p>
            <ol>
              <li>Busca el icono de instalación en la barra del navegador.</li>
              <li>Pulsa Instalar o crea un acceso directo.</li>
              <li>Déjalo visible en el escritorio.</li>
            </ol>
          </article>
        </div>

        <div className="guide-tip">
          <Menu size={24} />
          <div>
            <strong>En celular el menú se adapta automáticamente.</strong>
            <p>
              Utiliza el botón del menú para entrar en cualquier módulo y luego
              vuelve a ocultarlo para trabajar con más espacio.
            </p>
          </div>
        </div>
      </section>

      <section className="guide-section" id="pagos">
        <header>
          <span>05</span>
          <div>
            <h2>Planes, límites y pagos</h2>
            <p>Lo que debes conocer sobre tu suscripción.</p>
          </div>
        </header>

        <div className="guide-pages-grid compact">
          <article>
            <div><Users size={25} /></div>
            <h3>Límite de alumnos</h3>
            <p>Cada plan permite una cantidad determinada. Al alcanzar el máximo, el sistema impide registrar otro alumno.</p>
          </article>
          <article>
            <div><ReceiptText size={25} /></div>
            <h3>Enviar comprobante</h3>
            <p>En Renovar plan eliges moneda, método, referencia y adjuntas una fotografía del pago.</p>
          </article>
          <article>
            <div><ShieldCheck size={25} /></div>
            <h3>Aprobación</h3>
            <p>El administrador revisa el comprobante. Al aprobarlo se renueva la licencia y se actualiza el vencimiento.</p>
          </article>
          <article>
            <div><Send size={25} /></div>
            <h3>Estado de la solicitud</h3>
            <p>Puedes comprobar si está pendiente, aprobada o rechazada y leer las notas del administrador.</p>
          </article>
        </div>
      </section>

      <section className="guide-final-card">
        <BookOpenCheck size={42} />
        <div>
          <h2>Ya estás lista para comenzar</h2>
          <p>
            Registra tus alumnos, organiza tu jornada y utiliza Telegram para
            trabajar rápidamente desde cualquier lugar.
          </p>
        </div>
        <Link href={insideDashboard ? "/dashboard" : "/"}>
          {insideDashboard ? "Volver al inicio" : "Entrar a Aula Mágica"}
        </Link>
      </section>
    </main>
  );
}
