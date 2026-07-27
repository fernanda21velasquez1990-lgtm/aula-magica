"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  actualizarPerfilMaestra,
  cambiarContrasenaMaestra,
  verificarSesion,
  type Maestra,
} from "@/lib/apps-script-api";
import {
  eliminarSesion,
  guardarSesion,
  obtenerMaestra,
  obtenerToken,
} from "@/lib/session";

export default function ConfiguracionPage() {
  const router = useRouter();
  const [maestra, setMaestra] = useState<Maestra | null>(null);
  const [perfil, setPerfil] = useState({ nombre: "", apellido: "", grado: "", seccion: "" });
  const [seguridad, setSeguridad] = useState({ contrasenaActual: "", contrasenaNueva: "", confirmar: "" });
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);
  const [guardandoClave, setGuardandoClave] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date | null>(null);
  const [mostrarSincronizacion, setMostrarSincronizacion] = useState(false);
  const temporizadorRef = useRef<number | null>(null);
  const editandoRef = useRef(false);

  useEffect(() => {
    return () => {
      if (temporizadorRef.current !== null) {
        window.clearTimeout(temporizadorRef.current);
      }
    };
  }, []);

  const cargarPerfil = useCallback(async (silencioso = false) => {
    const token = obtenerToken();
    const actual = obtenerMaestra();

    if (!token || !actual) {
      eliminarSesion();
      router.replace("/");
      return;
    }

    try {
      const actualizado = await verificarSesion(token);
      guardarSesion(token, actualizado);
      setMaestra(actualizado);

      if (!editandoRef.current) {
        setPerfil({
          nombre: actualizado.nombre || "",
          apellido: actualizado.apellido || "",
          grado: actualizado.grado || "",
          seccion: actualizado.seccion || "",
        });
      }

      setUltimaActualizacion(new Date());

      if (!silencioso) {
        setMostrarSincronizacion(true);

        if (temporizadorRef.current !== null) {
          window.clearTimeout(temporizadorRef.current);
        }

        temporizadorRef.current = window.setTimeout(() => {
          setMostrarSincronizacion(false);
          temporizadorRef.current = null;
        }, 3000);
      }
    } catch (error) {
      if (!silencioso) {
        setMensaje(
          error instanceof Error
            ? error.message
            : "No se pudo actualizar el perfil."
        );
      }
    }
  }, [router]);

  useEffect(() => {
    void cargarPerfil();
  }, [cargarPerfil]);

  useEffect(() => {
    const actualizar = () => {
      if (
        document.visibilityState === "visible" &&
        !editandoRef.current &&
        !guardandoPerfil &&
        !guardandoClave
      ) {
        void cargarPerfil(true);
      }
    };

    const intervalo = window.setInterval(actualizar, 10_000);
    window.addEventListener("focus", actualizar);
    document.addEventListener("visibilitychange", actualizar);

    return () => {
      window.clearInterval(intervalo);
      window.removeEventListener("focus", actualizar);
      document.removeEventListener("visibilitychange", actualizar);
    };
  }, [cargarPerfil, guardandoPerfil, guardandoClave]);

  async function guardarPerfilForm(event: FormEvent) {
    event.preventDefault();
    const token = obtenerToken();
    if (!token) return router.replace("/");
    setGuardandoPerfil(true);
    setMensaje("");
    try {
      const actualizada = await actualizarPerfilMaestra(token, perfil);
      guardarSesion(token, actualizada);
      setMaestra(actualizada);
      editandoRef.current = false;
      setMensaje("Perfil actualizado correctamente.");
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : "No se pudo actualizar el perfil.");
    } finally {
      setGuardandoPerfil(false);
    }
  }

  async function guardarClaveForm(event: FormEvent) {
    event.preventDefault();
    if (seguridad.contrasenaNueva !== seguridad.confirmar) {
      setMensaje("Las contraseñas nuevas no coinciden.");
      return;
    }
    const token = obtenerToken();
    if (!token) return router.replace("/");
    setGuardandoClave(true);
    setMensaje("");
    try {
      await cambiarContrasenaMaestra(token, {
        contrasenaActual: seguridad.contrasenaActual,
        contrasenaNueva: seguridad.contrasenaNueva,
      });
      setSeguridad({ contrasenaActual: "", contrasenaNueva: "", confirmar: "" });
      setMensaje("Contraseña actualizada correctamente.");
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : "No se pudo cambiar la contraseña.");
    } finally {
      setGuardandoClave(false);
    }
  }

  return (
    <main className="settings-page">
      <section className="settings-header">
        <div>
          <span className="settings-chip">Mi cuenta</span>
          <h1>Configuración ⚙️</h1>
          <p>Actualiza tus datos personales, curso y contraseña.</p>
        </div>
        <div className="settings-avatar">👩‍🏫</div>
      </section>

      {mostrarSincronizacion && ultimaActualizacion && !mensaje && (
        <div className="settings-message" role="status" aria-live="polite">
          ✅ Perfil actualizado a las{" "}
          {ultimaActualizacion.toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </div>
      )}

      {mensaje && <div className="settings-message">{mensaje}</div>}

      <section className="settings-grid">
        <article className="settings-card">
          <h2>Perfil de la maestra</h2>
          <p className="settings-help">El correo y el usuario permanecen protegidos.</p>
          <div className="settings-readonly">
            <div><span>Correo</span><strong>{maestra?.correo || "—"}</strong></div>
            <div><span>Usuario</span><strong>{maestra?.usuario || "—"}</strong></div>
          </div>
          <form className="settings-form" onSubmit={guardarPerfilForm}>
            <label>Nombre<input required value={perfil.nombre} onChange={(e)=>{ editandoRef.current = true; setPerfil({...perfil,nombre:e.target.value}); }}/></label>
            <label>Apellido<input required value={perfil.apellido} onChange={(e)=>{ editandoRef.current = true; setPerfil({...perfil,apellido:e.target.value}); }}/></label>
            <label>Grado<input value={perfil.grado} onChange={(e)=>{ editandoRef.current = true; setPerfil({...perfil,grado:e.target.value}); }}/></label>
            <label>Sección<input value={perfil.seccion} onChange={(e)=>{ editandoRef.current = true; setPerfil({...perfil,seccion:e.target.value}); }}/></label>
            <button className="settings-primary" disabled={guardandoPerfil}>{guardandoPerfil ? "Guardando..." : "Guardar perfil"}</button>
          </form>
        </article>

        <article className="settings-card">
          <h2>Seguridad</h2>
          <p className="settings-help">Usa una contraseña nueva de al menos 6 caracteres.</p>
          <form className="settings-form one" onSubmit={guardarClaveForm}>
            <label>Contraseña actual<input type="password" required value={seguridad.contrasenaActual} onChange={(e)=>setSeguridad({...seguridad,contrasenaActual:e.target.value})}/></label>
            <label>Nueva contraseña<input type="password" minLength={6} required value={seguridad.contrasenaNueva} onChange={(e)=>setSeguridad({...seguridad,contrasenaNueva:e.target.value})}/></label>
            <label>Confirmar nueva contraseña<input type="password" minLength={6} required value={seguridad.confirmar} onChange={(e)=>setSeguridad({...seguridad,confirmar:e.target.value})}/></label>
            <button className="settings-primary blue" disabled={guardandoClave}>{guardandoClave ? "Actualizando..." : "Cambiar contraseña"}</button>
          </form>
        </article>
      </section>
    </main>
  );
}
