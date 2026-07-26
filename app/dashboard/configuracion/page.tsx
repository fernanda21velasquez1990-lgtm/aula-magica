"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  actualizarPerfilMaestra,
  cambiarContrasenaMaestra,
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

  useEffect(() => {
    const token = obtenerToken();
    const actual = obtenerMaestra();
    if (!token || !actual) {
      eliminarSesion();
      router.replace("/");
      return;
    }
    setMaestra(actual);
    setPerfil({
      nombre: actual.nombre || "",
      apellido: actual.apellido || "",
      grado: actual.grado || "",
      seccion: actual.seccion || "",
    });
  }, [router]);

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
            <label>Nombre<input required value={perfil.nombre} onChange={(e)=>setPerfil({...perfil,nombre:e.target.value})}/></label>
            <label>Apellido<input required value={perfil.apellido} onChange={(e)=>setPerfil({...perfil,apellido:e.target.value})}/></label>
            <label>Grado<input value={perfil.grado} onChange={(e)=>setPerfil({...perfil,grado:e.target.value})}/></label>
            <label>Sección<input value={perfil.seccion} onChange={(e)=>setPerfil({...perfil,seccion:e.target.value})}/></label>
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
