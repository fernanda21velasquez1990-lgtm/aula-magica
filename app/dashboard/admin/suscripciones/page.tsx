"use client";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  adminActivarSuscripcion, adminCambiarEstadoSuscripcion,
  adminObtenerSuscripciones, adminRegistrarPagoSuscripcion,
  type LicenciaAdministrador, type PanelSuscripciones
} from "@/lib/apps-script-api";
import { obtenerMaestra, obtenerToken } from "@/lib/session";

const VACIO:PanelSuscripciones={planes:[],licencias:[],pagos:[],resumen:{total:0,activas:0,porVencer:0,vencidas:0,suspendidas:0,ingresosUsd:0,ingresosVes:0}};
const dineroUsd=(v:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:2}).format(v||0);
const dineroVes=(v:number)=>new Intl.NumberFormat("es-VE",{style:"currency",currency:"VES",maximumFractionDigits:2}).format(v||0);
const hoy=()=>new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,10);

export default function SuscripcionesPage(){
  const router=useRouter(), usuario=obtenerMaestra();
  const [panel,setPanel]=useState(VACIO),[seleccionada,setSeleccionada]=useState<LicenciaAdministrador|null>(null);
  const [buscar,setBuscar]=useState(""),[filtro,setFiltro]=useState("TODAS"),[plan,setPlan]=useState("");
  const [mensaje,setMensaje]=useState(""),[cargando,setCargando]=useState(false);
  const [pago,setPago]=useState({monto:0,moneda:"USD",metodo:"TRANSFERENCIA",referencia:"",fechaPago:hoy(),notas:""});
  const admin=Boolean(usuario?.esAdmin)||String(usuario?.correo||"").toLowerCase()==="wilmarvelasquez1783@gmail.com";

  async function cargar(){
    const token=obtenerToken(); if(!token)return router.replace("/");
    setCargando(true);
    try{const r=await adminObtenerSuscripciones(token);setPanel(r);if(!plan&&r.planes[0])setPlan(r.planes[0].idPlan)}
    catch(e){setMensaje(e instanceof Error?e.message:"No se pudo cargar.")}finally{setCargando(false)}
  }
  useEffect(()=>{if(!admin)router.replace("/dashboard");else void cargar()},[]);

  const visibles=useMemo(()=>panel.licencias.filter(x=>
    (filtro==="TODAS"||x.estado===filtro)&&
    (!buscar||`${x.nombreMaestra} ${x.correo} ${x.plan}`.toLowerCase().includes(buscar.toLowerCase()))
  ),[panel,buscar,filtro]);

  async function activar(){if(!seleccionada||!plan)return;const token=obtenerToken();if(!token)return;
    await adminActivarSuscripcion(token,{idMaestra:seleccionada.idMaestra,idPlan:plan,extender:true});
    setMensaje("✅ Suscripción activada o renovada.");setSeleccionada(null);await cargar();
  }
  async function estado(valor:string){if(!seleccionada)return;const token=obtenerToken();if(!token)return;
    await adminCambiarEstadoSuscripcion(token,{idLicencia:seleccionada.idLicencia,estado:valor});
    setMensaje("✅ Estado actualizado.");setSeleccionada(null);await cargar();
  }
  async function registrar(event:FormEvent){event.preventDefault();if(!seleccionada)return;const token=obtenerToken();if(!token)return;
    await adminRegistrarPagoSuscripcion(token,{...pago,idMaestra:seleccionada.idMaestra,idLicencia:seleccionada.idLicencia,idPlan:plan||seleccionada.idPlan});
    setMensaje("✅ Pago registrado.");setPago({monto:0,moneda:"USD",metodo:"TRANSFERENCIA",referencia:"",fechaPago:hoy(),notas:""});await cargar();
  }

  if(!admin)return <div className="state-card">🔐 Verificando acceso...</div>;
  return <main className="subscriptions-page">
    <section className="subscriptions-hero"><div><span>VERSIÓN 10.0 · ACCESO PRIVADO</span><h1>Licencias y ventas 💳</h1><p>Administra vencimientos, renovaciones, bloqueos y pagos.</p></div><button onClick={()=>void cargar()}>🔄 Actualizar</button></section>
    <section className="subscription-stats">
      <article><span>👩‍🏫</span><strong>{panel.resumen.total}</strong><small>Cuentas</small></article>
      <article><span>✅</span><strong>{panel.resumen.activas}</strong><small>Activas</small></article>
      <article><span>⏳</span><strong>{panel.resumen.porVencer}</strong><small>Por vencer</small></article>
      <article><span>🔒</span><strong>{panel.resumen.vencidas+panel.resumen.suspendidas}</strong><small>Sin acceso</small></article>
      <article className="money"><span>💵</span><strong>{dineroUsd(panel.resumen.ingresosUsd)}</strong><small>Ingresos USD</small></article>
      <article className="money"><span>🇻🇪</span><strong>{dineroVes(panel.resumen.ingresosVes)}</strong><small>Ingresos VES</small></article>
    </section>
    {mensaje&&<div className="school-message">{mensaje}</div>}
    <section className="subscription-filters">
      <input placeholder="Buscar maestra..." value={buscar} onChange={e=>setBuscar(e.target.value)}/>
      <select value={filtro} onChange={e=>setFiltro(e.target.value)}><option value="TODAS">Todos los estados</option><option>ACTIVA</option><option>POR_VENCER</option><option>VENCIDA</option><option>SUSPENDIDA</option><option>BLOQUEADA</option></select>
    </section>
    <section className="licenses-table-card"><div className="licenses-table">
      <div className="licenses-row head"><span>Maestra</span><span>Plan</span><span>Vencimiento</span><span>Estado</span><span></span></div>
      {visibles.map(x=><div className="licenses-row" key={x.idLicencia}>
        <span><b>{x.nombreMaestra}</b><small>{x.correo}</small></span><span>{x.plan}</span>
        <span><b>{x.fechaVencimiento}</b><small>{x.diasRestantes} días</small></span>
        <span><i className={`license-status ${x.estado.toLowerCase()}`}>{x.estado}</i></span>
        <span><button onClick={()=>{setSeleccionada(x);setPlan(x.idPlan)}}>Administrar</button></span>
      </div>)}
    </div></section>
    {seleccionada&&<div className="subscription-modal-backdrop"><section className="subscription-modal">
      <header><div><h2>{seleccionada.nombreMaestra}</h2><p>{seleccionada.correo}</p></div><button onClick={()=>setSeleccionada(null)}>×</button></header>
      <label>Plan<select value={plan} onChange={e=>setPlan(e.target.value)}>{panel.planes.map(p=><option key={p.idPlan} value={p.idPlan}>{p.nombre} · {p.duracionDias} días · {dineroUsd(p.precioUsd)} / {dineroVes(p.precioVes)}</option>)}</select></label>
      <div className="dual-price-note">
        <b>Precios configurados</b>
        <span>USD: {dineroUsd(panel.planes.find(p=>p.idPlan===plan)?.precioUsd||0)}</span>
        <span>VES: {dineroVes(panel.planes.find(p=>p.idPlan===plan)?.precioVes||0)}</span>
      </div>
      <div className="subscription-actions"><button className="primary" onClick={()=>void activar()}>✅ Activar o renovar</button><button onClick={()=>void estado("SUSPENDIDA")}>⏸️ Suspender</button><button onClick={()=>void estado("BLOQUEADA")}>🔒 Bloquear</button><button onClick={()=>void estado("ACTIVA")}>🔓 Reactivar</button></div>
      <form className="payment-form" onSubmit={registrar}><h3>Registrar pago</h3><div>
        <label>Moneda<select value={pago.moneda} onChange={e=>setPago({...pago,moneda:e.target.value})}><option value="USD">Dólares (USD)</option><option value="VES">Bolívares (VES)</option></select></label>
        <label>Monto<input type="number" min="0" step="0.01" required value={pago.monto} onChange={e=>setPago({...pago,monto:Number(e.target.value)})}/></label>
        <label>Método<select value={pago.metodo} onChange={e=>setPago({...pago,metodo:e.target.value})}><option>TRANSFERENCIA</option><option>EFECTIVO</option><option>NEQUI</option><option>DAVIPLATA</option></select></label>
        <label>Referencia<input value={pago.referencia} onChange={e=>setPago({...pago,referencia:e.target.value})}/></label>
        <label>Fecha<input type="date" value={pago.fechaPago} onChange={e=>setPago({...pago,fechaPago:e.target.value})}/></label>
        <label className="wide">Notas<textarea value={pago.notas} onChange={e=>setPago({...pago,notas:e.target.value})}/></label>
      </div><button>💾 Registrar pago</button></form>
    </section></div>}
    {cargando&&<div className="records-loading">Cargando...</div>}
  </main>;
}
