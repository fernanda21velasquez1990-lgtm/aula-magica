"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { iniciarSesion, registrarMaestra } from "@/lib/apps-script-api";
import { guardarSesion } from "@/lib/session";

export default function LoginPage() {
  const router = useRouter();
  const [register, setRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [grado, setGrado] = useState("");
  const [seccion, setSeccion] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mensaje, setMensaje] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setMensaje("Procesando...");
    try {
      if (register) {
        await registrarMaestra({ nombre, apellido, correo, contrasena, grado, seccion });
        setMensaje("Cuenta creada correctamente. Ahora puedes iniciar sesión.");
        setRegister(false);
        setContrasena("");
      } else {
        const resultado = await iniciarSesion({ correo, contrasena });
        guardarSesion(resultado.token, resultado.maestra);
        router.push("/dashboard");
      }
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : "No fue posible completar la operación.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login">
        <div className="login-art">
          <h1 className="title">Aula <span>Mágica</span> ✨</h1>
          <p className="subtitle">Tu agenda escolar digital: alumnos, asistencia, notas, planificación, cumpleaños, reuniones y comunicación desde Telegram.</p>
          <div className="login-emoji">👩‍🏫📚✏️</div>
        </div>
        <div className="login-form">
          <span className="chip">Acceso seguro por maestra</span>
          <h2>{register ? "Crear cuenta" : "Bienvenida"}</h2>
          <form onSubmit={submit}>
            {register && <>
              <input placeholder="Nombre" value={nombre} onChange={e => setNombre(e.target.value)} required />
              <input placeholder="Apellido" value={apellido} onChange={e => setApellido(e.target.value)} required />
              <input placeholder="Grado, por ejemplo: 1 grado" value={grado} onChange={e => setGrado(e.target.value)} />
              <input placeholder="Sección, por ejemplo: A" value={seccion} onChange={e => setSeccion(e.target.value)} />
            </>}
            <input type="email" placeholder="Correo electrónico" value={correo} onChange={e => setCorreo(e.target.value)} required />
            <input type="password" minLength={6} placeholder="Contraseña" value={contrasena} onChange={e => setContrasena(e.target.value)} required />
            <button className="btn" type="submit" disabled={loading}>{loading ? "Procesando..." : register ? "Crear mi espacio" : "Entrar"}</button>
          </form>
          {mensaje && <p className="notice">{mensaje}</p>}
          <button className="btn secondary" type="button" onClick={() => { setRegister(v => !v); setMensaje(""); setContrasena(""); }} disabled={loading}>
            {register ? "Ya tengo una cuenta" : "Soy nueva, crear cuenta"}
          </button>
        </div>
      </section>
    </main>
  );
}
