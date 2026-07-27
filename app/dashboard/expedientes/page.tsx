"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import SignaturePad from "@/components/SignaturePad";
import {
  guardarExpedienteAlumno,
  listarAlumnos,
  obtenerExpedienteAlumno,
  type Alumno,
  type DatosExpedienteAlumno,
} from "@/lib/apps-script-api";
import { eliminarSesion, obtenerMaestra, obtenerToken } from "@/lib/session";

const vacio: DatosExpedienteAlumno = {
  idAlumno: "",
  foto: "",
  firmaMaestra: "",
  firmaRepresentante: "",
  alergias: "",
  condicionesMedicas: "",
  contactoEmergencia: "",
  telefonoEmergencia: "",
  autorizaciones: "",
  notasPrivadas: "",
};

async function comprimirImagen(file: File) {
  return new Promise<string>((resolve, reject) => {
    const lector = new FileReader();
    lector.onerror = () => reject(new Error("No se pudo leer la fotografía."));
    lector.onload = () => {
      const imagen = new Image();
      imagen.onerror = () => reject(new Error("La imagen no es válida."));
      imagen.onload = () => {
        const maximo = 360;
        const escala = Math.min(1, maximo / Math.max(imagen.width, imagen.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(imagen.width * escala));
        canvas.height = Math.max(1, Math.round(imagen.height * escala));
        const contexto = canvas.getContext("2d");
        if (!contexto) return reject(new Error("No se pudo preparar la foto."));
        contexto.drawImage(imagen, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.58));
      };
      imagen.src = String(lector.result);
    };
    lector.readAsDataURL(file);
  });
}

export default function ExpedientesPage() {
  const router = useRouter();
  const maestra = obtenerMaestra();
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [seleccionado, setSeleccionado] = useState("");
  const [datos, setDatos] = useState<DatosExpedienteAlumno>(vacio);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    const token = obtenerToken();
    if (!token) {
      eliminarSesion();
      router.replace("/");
      return;
    }
    listarAlumnos(token)
      .then((lista) => setAlumnos(lista))
      .catch((error) => setMensaje(error instanceof Error ? error.message : "No se pudieron cargar los alumnos."))
      .finally(() => setCargando(false));
  }, [router]);

  async function abrir(idAlumno: string) {
    setSeleccionado(idAlumno);
    setMensaje("");
    const token = obtenerToken();
    if (!token) return;
    setCargando(true);
    try {
      const expediente = await obtenerExpedienteAlumno(token, idAlumno);
      setDatos({
        idAlumno,
        foto: expediente.foto,
        firmaMaestra: expediente.firmaMaestra,
        firmaRepresentante: expediente.firmaRepresentante,
        alergias: expediente.alergias,
        condicionesMedicas: expediente.condicionesMedicas,
        contactoEmergencia: expediente.contactoEmergencia,
        telefonoEmergencia: expediente.telefonoEmergencia,
        autorizaciones: expediente.autorizaciones,
        notasPrivadas: expediente.notasPrivadas,
      });
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : "No se pudo abrir el expediente.");
    } finally {
      setCargando(false);
    }
  }

  async function foto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMensaje("Selecciona una fotografía válida.");
      return;
    }
    try {
      const imagen = await comprimirImagen(file);
      setDatos((anterior) => ({ ...anterior, foto: imagen }));
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : "No se pudo procesar la foto.");
    }
  }

  async function guardar(event: FormEvent) {
    event.preventDefault();
    const token = obtenerToken();
    if (!token || !seleccionado) return;
    setGuardando(true);
    setMensaje("");
    try {
      await guardarExpedienteAlumno(token, datos);
      setMensaje("✅ Expediente guardado correctamente.");
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : "No se pudo guardar el expediente.");
    } finally {
      setGuardando(false);
    }
  }

  const alumno = alumnos.find((item) => item.idAlumno === seleccionado);
  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return alumnos;
    return alumnos.filter((item) =>
      `${item.nombre} ${item.apellido} ${item.documento}`.toLowerCase().includes(texto)
    );
  }, [alumnos, busqueda]);

  return (
    <main className="student-records-page">
      <section className="records-hero no-print">
        <div>
          <span>Versión 9.1 · Expediente individual</span>
          <h1>Expedientes de alumnos 📁</h1>
          <p>Fotografía, información médica, contactos, autorizaciones y firmas digitales.</p>
        </div>
      </section>

      {mensaje && <div className="school-message no-print">{mensaje}</div>}

      <div className="records-layout">
        <aside className="records-list no-print">
          <input
            type="search"
            placeholder="Buscar alumno..."
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
          />
          <div>
            {visibles.map((item) => (
              <button
                key={item.idAlumno}
                className={seleccionado === item.idAlumno ? "active" : ""}
                onClick={() => void abrir(item.idAlumno)}
              >
                <span>{item.foto ? "👤" : "🎓"}</span>
                <b>{item.nombre} {item.apellido}</b>
                <small>{item.grado} {item.seccion}</small>
              </button>
            ))}
          </div>
        </aside>

        {!alumno ? (
          <section className="records-empty">
            <span>📂</span>
            <h2>Selecciona un alumno</h2>
            <p>Abre su expediente para completar la información.</p>
          </section>
        ) : (
          <form className="student-record-document" onSubmit={guardar}>
            <header className="record-document-header">
              <div className="record-brand">
                <img src="/brand/aula-magica-logo.png" alt="Aula Mágica" />
                <div>
                  <strong>Aula Mágica</strong>
                  <span>Expediente individual del alumno</span>
                </div>
              </div>
              <button className="no-print" type="button" onClick={() => window.print()}>
                🖨️ Imprimir documento
              </button>
            </header>

            <section className="record-student-summary">
              <label className="record-photo no-print">
                {datos.foto ? <img src={datos.foto} alt="Foto del alumno" /> : <span>📷</span>}
                <input type="file" accept="image/*" onChange={foto} />
                <b>{datos.foto ? "Cambiar fotografía" : "Agregar fotografía"}</b>
              </label>
              <div className="record-photo print-only">
                {datos.foto ? <img src={datos.foto} alt="Foto del alumno" /> : <span>Sin fotografía</span>}
              </div>
              <div>
                <h2>{alumno.nombre} {alumno.apellido}</h2>
                <p><b>Documento:</b> {alumno.documento || "No registrado"}</p>
                <p><b>Nacimiento:</b> {alumno.fechaNacimiento || "No registrado"}</p>
                <p><b>Grado y sección:</b> {alumno.grado} {alumno.seccion}</p>
                <p><b>Representante:</b> {alumno.representante || "No registrado"}</p>
                <p><b>Teléfono:</b> {alumno.telefono || "No registrado"}</p>
              </div>
            </section>

            <section className="record-section">
              <h3>🩺 Información de salud</h3>
              <div className="record-grid">
                <label>Alergias<textarea rows={3} value={datos.alergias} onChange={(e) => setDatos({...datos, alergias:e.target.value})}/></label>
                <label>Condiciones médicas<textarea rows={3} value={datos.condicionesMedicas} onChange={(e) => setDatos({...datos, condicionesMedicas:e.target.value})}/></label>
                <label>Contacto de emergencia<input value={datos.contactoEmergencia} onChange={(e) => setDatos({...datos, contactoEmergencia:e.target.value})}/></label>
                <label>Teléfono de emergencia<input value={datos.telefonoEmergencia} onChange={(e) => setDatos({...datos, telefonoEmergencia:e.target.value})}/></label>
              </div>
            </section>

            <section className="record-section">
              <h3>✅ Autorizaciones y observaciones</h3>
              <div className="record-grid">
                <label>Autorizaciones<textarea rows={4} value={datos.autorizaciones} onChange={(e) => setDatos({...datos, autorizaciones:e.target.value})}/></label>
                <label>Notas privadas de la maestra<textarea rows={4} value={datos.notasPrivadas} onChange={(e) => setDatos({...datos, notasPrivadas:e.target.value})}/></label>
              </div>
            </section>

            <section className="record-section record-signatures">
              <h3>✍️ Firmas digitales</h3>
              <div className="record-grid">
                <SignaturePad label="Firma de la maestra" value={datos.firmaMaestra} onChange={(firmaMaestra) => setDatos({...datos, firmaMaestra})}/>
                <SignaturePad label="Firma del representante" value={datos.firmaRepresentante} onChange={(firmaRepresentante) => setDatos({...datos, firmaRepresentante})}/>
              </div>
            </section>

            <footer className="record-footer">
              <div>
                <b>Maestra responsable</b>
                <span>{maestra?.nombre} {maestra?.apellido}</span>
              </div>
              <button className="no-print" disabled={guardando}>
                {guardando ? "Guardando..." : "💾 Guardar expediente"}
              </button>
            </footer>
          </form>
        )}
      </div>
      {cargando && <div className="records-loading no-print">Cargando información...</div>}
    </main>
  );
}
