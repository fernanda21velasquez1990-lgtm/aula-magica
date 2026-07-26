const APP_NAME = 'Aula Mágica';
const DURACION_SESION_HORAS = 24;

const SHEETS = {
  CONFIGURACION: ['CLAVE','VALOR','DESCRIPCION'],
  MAESTRAS: ['ID_MAESTRA','NOMBRE','APELLIDO','USUARIO','CORREO','CONTRASENA_HASH','GRADO','SECCION','ESTADO','FECHA_REGISTRO','ULTIMO_ACCESO'],
  SESIONES: ['TOKEN','ID_MAESTRA','FECHA_CREACION','FECHA_EXPIRACION','ESTADO'],
  ALUMNOS: ['ID_ALUMNO','ID_MAESTRA','NOMBRE','APELLIDO','DOCUMENTO','FECHA_NACIMIENTO','SEXO','GRADO','SECCION','REPRESENTANTE','TELEFONO','DIRECCION','OBSERVACIONES','ESTADO','FECHA_REGISTRO'],
  ASISTENCIA: ['ID_ASISTENCIA','ID_MAESTRA','ID_ALUMNO','FECHA','ESTADO','OBSERVACIONES','FECHA_REGISTRO'],
  CALIFICACIONES: ['ID_CALIFICACION','ID_MAESTRA','ID_ALUMNO','ASIGNATURA','ACTIVIDAD','PERIODO','CALIFICACION','CALIFICACION_MAXIMA','FECHA','OBSERVACIONES'],
  PLANIFICACION: ['ID_PLANIFICACION','ID_MAESTRA','TITULO','ASIGNATURA','GRADO','FECHA','OBJETIVO','CONTENIDO','ACTIVIDADES','RECURSOS','EVALUACION','ESTADO','FECHA_REGISTRO'],
  CUMPLEANOS: ['ID_CUMPLEANOS','ID_MAESTRA','ID_ALUMNO','NOMBRE','FECHA_NACIMIENTO','NOTAS'],
  REUNIONES: ['ID_REUNION','ID_MAESTRA','TITULO','FECHA','HORA','LUGAR','PARTICIPANTES','TEMAS','ACUERDOS','ESTADO'],
  AGENDA: ['ID_EVENTO','ID_MAESTRA','TITULO','TIPO','FECHA','HORA','DESCRIPCION','ESTADO','FECHA_REGISTRO'],
  TELEGRAM: ['ID_MAESTRA','CHAT_ID','CODIGO_VINCULACION','ESTADO','FECHA_VINCULACION'],
  AUDITORIA: ['ID','ID_MAESTRA','ACCION','MODULO','DETALLE','FECHA','IP']
};

function onOpen() {
  SpreadsheetApp.getUi().createMenu('🎓 Aula Mágica')
    .addItem('Crear o reparar estructura', 'crearEstructuraInicial')
    .addSeparator()
    .addItem('Agregar maestra', 'mostrarFormularioMaestra')
    .addItem('Ver resumen', 'mostrarResumen')
    .addSeparator()
    .addItem('Crear respaldo', 'crearRespaldo')
    .addToUi();
}

function crearEstructuraInicial() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(SHEETS).forEach(nombre => {
    let hoja = ss.getSheetByName(nombre);
    if (!hoja) hoja = ss.insertSheet(nombre);
    const encabezados = SHEETS[nombre];
    hoja.getRange(1,1,1,encabezados.length).setValues([encabezados]);
    hoja.setFrozenRows(1);
    hoja.getRange(1,1,1,encabezados.length).setFontWeight('bold').setHorizontalAlignment('center').setBackground('#f8c8dc').setFontColor('#352f44');
    hoja.autoResizeColumns(1, encabezados.length);
    for (let c=1;c<=encabezados.length;c++) if (hoja.getColumnWidth(c)<130) hoja.setColumnWidth(c,130);
  });
  const config = ss.getSheetByName('CONFIGURACION');
  if (config.getLastRow() < 2) config.getRange(2,1,5,3).setValues([
    ['NOMBRE_APLICACION',APP_NAME,'Nombre mostrado en la plataforma'],
    ['VERSION','2.2.0','Versión actual'],
    ['SESION_HORAS','24','Duración de sesión'],
    ['REGISTRO_PUBLICO','SI','Permitir registro'],
    ['TELEGRAM_ACTIVO','NO','Estado del bot']
  ]);
  SpreadsheetApp.getUi().alert('Aula Mágica','La estructura está lista.',SpreadsheetApp.getUi().ButtonSet.OK);
}

function doGet() { return responderJson({ok:true,aplicacion:APP_NAME,estado:'API funcionando'}); }
function doPost(e) {
  try {
    const s = obtenerSolicitud(e), accion=s.action, datos=s.data||{}, token=s.token||'';
    let resultado;
    switch (accion) {
      case 'registrarMaestra': resultado=registrarMaestra(datos); break;
      case 'iniciarSesion': resultado=iniciarSesion(datos); break;
      case 'verificarSesion': resultado=verificarSesion(token); break;
      case 'cerrarSesion': resultado=cerrarSesion(token); break;
      case 'crearAlumno': resultado=crearAlumno(token,datos); break;
      case 'listarAlumnos': resultado=listarAlumnos(token); break;
      case 'editarAlumno': resultado=editarAlumno(token,datos); break;
      case 'eliminarAlumno': resultado=eliminarAlumno(token,datos); break;
      case 'listarAsistencia': resultado=listarAsistencia(token,datos); break;
      case 'guardarAsistencia': resultado=guardarAsistencia(token,datos); break;
      case 'listarCalificaciones': resultado=listarCalificaciones(token); break;
      case 'guardarCalificacion': resultado=guardarCalificacion(token,datos); break;
      case 'eliminarCalificacion': resultado=eliminarCalificacion(token,datos); break;
      default: throw new Error('La acción "'+accion+'" no existe.');
    }
    return responderJson({ok:true,resultado});
  } catch (error) { return responderJson({ok:false,error:error.message||'Ocurrió un error.'}); }
}
function obtenerSolicitud(e){ if(!e||!e.postData||!e.postData.contents) throw new Error('La solicitud está vacía.'); try{return JSON.parse(e.postData.contents)}catch(_){throw new Error('El contenido no es JSON válido.')} }
function responderJson(c){ return ContentService.createTextOutput(JSON.stringify(c)).setMimeType(ContentService.MimeType.JSON); }

function registrarMaestra(datos){
  validarObjeto(datos,['nombre','apellido','correo','contrasena']);
  const nombre=limpiarTexto(datos.nombre), apellido=limpiarTexto(datos.apellido), correo=normalizarCorreo(datos.correo), contrasena=String(datos.contrasena||'');
  if(!esCorreoValido(correo)) throw new Error('El correo electrónico no es válido.');
  if(contrasena.length<6) throw new Error('La contraseña debe tener al menos seis caracteres.');
  const hoja=obtenerHoja('MAESTRAS'), registros=obtenerRegistros('MAESTRAS');
  if(registros.some(r=>normalizarCorreo(r.CORREO)===correo)) throw new Error('Ya existe una cuenta con ese correo.');
  const idMaestra=generarId('M'), usuario=generarUsuarioUnico(correo.split('@')[0],registros);
  hoja.appendRow([idMaestra,nombre,apellido,usuario,correo,crearHashContrasena(contrasena),limpiarTexto(datos.grado||''),limpiarTexto(datos.seccion||''),'ACTIVA',new Date(),'']);
  registrarAuditoria(idMaestra,'REGISTRO','MAESTRAS','Cuenta creada');
  return {idMaestra,nombre,apellido,correo,usuario,grado:limpiarTexto(datos.grado||''),seccion:limpiarTexto(datos.seccion||'')};
}
function iniciarSesion(datos){
  validarObjeto(datos,['correo','contrasena']);
  const correo=normalizarCorreo(datos.correo), registros=obtenerRegistros('MAESTRAS'), indice=registros.findIndex(r=>normalizarCorreo(r.CORREO)===correo);
  if(indice===-1) throw new Error('Correo o contraseña incorrectos.');
  const m=registros[indice]; if(String(m.ESTADO).toUpperCase()!=='ACTIVA') throw new Error('Esta cuenta está desactivada.');
  if(crearHashContrasena(String(datos.contrasena||''))!==String(m.CONTRASENA_HASH)) throw new Error('Correo o contraseña incorrectos.');
  const token=crearTokenSesion(), inicio=new Date(), fin=new Date(inicio.getTime()+DURACION_SESION_HORAS*3600000);
  obtenerHoja('SESIONES').appendRow([token,m.ID_MAESTRA,inicio,fin,'ACTIVA']);
  obtenerHoja('MAESTRAS').getRange(indice+2,11).setValue(new Date());
  registrarAuditoria(m.ID_MAESTRA,'INICIO_SESION','AUTENTICACION','Inicio correcto');
  return {token,maestra:maestraPublica(m)};
}
function verificarSesion(token){
  if(!token) throw new Error('Sesión no proporcionada.');
  const s=obtenerRegistros('SESIONES').find(r=>String(r.TOKEN)===String(token)&&String(r.ESTADO).toUpperCase()==='ACTIVA');
  if(!s) throw new Error('La sesión no es válida.');
  if(new Date(s.FECHA_EXPIRACION).getTime()<Date.now()){cerrarSesion(token);throw new Error('La sesión ha vencido.');}
  const m=obtenerRegistros('MAESTRAS').find(r=>String(r.ID_MAESTRA)===String(s.ID_MAESTRA));
  if(!m||String(m.ESTADO).toUpperCase()!=='ACTIVA') throw new Error('La cuenta no está disponible.');
  return maestraPublica(m);
}
function maestraPublica(m){return {idMaestra:String(m.ID_MAESTRA),nombre:String(m.NOMBRE),apellido:String(m.APELLIDO),correo:String(m.CORREO),usuario:String(m.USUARIO),grado:String(m.GRADO||''),seccion:String(m.SECCION||'')}}
function cerrarSesion(token){ const h=obtenerHoja('SESIONES'), r=obtenerRegistrosConFila('SESIONES').find(x=>String(x.TOKEN)===String(token)); if(r) h.getRange(r.__fila,5).setValue('CERRADA'); return {cerrado:true}; }

function crearAlumno(token,datos){
  const m=verificarSesion(token); validarObjeto(datos,['nombre','apellido']);
  const a={idAlumno:generarId('ALU'),idMaestra:m.idMaestra,nombre:limpiarTexto(datos.nombre),apellido:limpiarTexto(datos.apellido),documento:limpiarTexto(datos.documento||''),fechaNacimiento:limpiarTexto(datos.fechaNacimiento||''),sexo:limpiarTexto(datos.sexo||''),grado:limpiarTexto(datos.grado||m.grado||''),seccion:limpiarTexto(datos.seccion||m.seccion||''),representante:limpiarTexto(datos.representante||''),telefono:limpiarTexto(datos.telefono||''),direccion:limpiarTexto(datos.direccion||''),observaciones:limpiarTexto(datos.observaciones||''),estado:'ACTIVO',fechaRegistro:new Date()};
  obtenerHoja('ALUMNOS').appendRow([a.idAlumno,a.idMaestra,a.nombre,a.apellido,a.documento,a.fechaNacimiento,a.sexo,a.grado,a.seccion,a.representante,a.telefono,a.direccion,a.observaciones,a.estado,a.fechaRegistro]);
  registrarAuditoria(m.idMaestra,'CREAR','ALUMNOS','Alumno creado: '+a.nombre+' '+a.apellido); return a;
}
function listarAlumnos(token){ const m=verificarSesion(token); return obtenerRegistros('ALUMNOS').filter(r=>String(r.ID_MAESTRA)===String(m.idMaestra)&&String(r.ESTADO).toUpperCase()!=='ELIMINADO').map(convertirAlumno).sort((a,b)=>(a.nombre+' '+a.apellido).localeCompare(b.nombre+' '+b.apellido)); }
function editarAlumno(token,datos){
  const m=verificarSesion(token); validarObjeto(datos,['idAlumno','nombre','apellido']); const h=obtenerHoja('ALUMNOS');
  const r=obtenerRegistrosConFila('ALUMNOS').find(x=>String(x.ID_ALUMNO)===String(datos.idAlumno)&&String(x.ID_MAESTRA)===String(m.idMaestra)&&String(x.ESTADO).toUpperCase()!=='ELIMINADO');
  if(!r) throw new Error('No se encontró el alumno o no tienes permiso.');
  const a={idAlumno:r.ID_ALUMNO,idMaestra:m.idMaestra,nombre:limpiarTexto(datos.nombre),apellido:limpiarTexto(datos.apellido),documento:limpiarTexto(datos.documento||''),fechaNacimiento:limpiarTexto(datos.fechaNacimiento||''),sexo:limpiarTexto(datos.sexo||''),grado:limpiarTexto(datos.grado||''),seccion:limpiarTexto(datos.seccion||''),representante:limpiarTexto(datos.representante||''),telefono:limpiarTexto(datos.telefono||''),direccion:limpiarTexto(datos.direccion||''),observaciones:limpiarTexto(datos.observaciones||''),estado:'ACTIVO',fechaRegistro:r.FECHA_REGISTRO||new Date()};
  h.getRange(r.__fila,1,1,15).setValues([[a.idAlumno,a.idMaestra,a.nombre,a.apellido,a.documento,a.fechaNacimiento,a.sexo,a.grado,a.seccion,a.representante,a.telefono,a.direccion,a.observaciones,a.estado,a.fechaRegistro]]);
  registrarAuditoria(m.idMaestra,'EDITAR','ALUMNOS','Alumno editado: '+a.nombre+' '+a.apellido); return a;
}
function eliminarAlumno(token,datos){ const m=verificarSesion(token); validarObjeto(datos,['idAlumno']); const h=obtenerHoja('ALUMNOS'); const r=obtenerRegistrosConFila('ALUMNOS').find(x=>String(x.ID_ALUMNO)===String(datos.idAlumno)&&String(x.ID_MAESTRA)===String(m.idMaestra)&&String(x.ESTADO).toUpperCase()!=='ELIMINADO'); if(!r) throw new Error('No se encontró el alumno o no tienes permiso.'); h.getRange(r.__fila,14).setValue('ELIMINADO'); registrarAuditoria(m.idMaestra,'ELIMINAR','ALUMNOS','Alumno eliminado'); return {eliminado:true,idAlumno:datos.idAlumno}; }
function convertirAlumno(r){return {idAlumno:String(r.ID_ALUMNO||''),nombre:String(r.NOMBRE||''),apellido:String(r.APELLIDO||''),documento:String(r.DOCUMENTO||''),fechaNacimiento:formatearFechaParaFormulario(r.FECHA_NACIMIENTO),sexo:String(r.SEXO||''),grado:String(r.GRADO||''),seccion:String(r.SECCION||''),representante:String(r.REPRESENTANTE||''),telefono:String(r.TELEFONO||''),direccion:String(r.DIRECCION||''),observaciones:String(r.OBSERVACIONES||''),estado:String(r.ESTADO||'ACTIVO')}}


function listarAsistencia(token,datos){
  const m=verificarSesion(token); validarObjeto(datos,['fecha']);
  const fecha=normalizarFechaAsistencia(datos.fecha);
  const alumnos=obtenerRegistros('ALUMNOS')
    .filter(r=>String(r.ID_MAESTRA)===String(m.idMaestra)&&String(r.ESTADO).toUpperCase()!=='ELIMINADO');
  const registros=obtenerRegistros('ASISTENCIA')
    .filter(r=>String(r.ID_MAESTRA)===String(m.idMaestra)&&normalizarFechaAsistencia(r.FECHA)===fecha);
  const porAlumno={};
  registros.forEach(r=>{porAlumno[String(r.ID_ALUMNO)]={estado:String(r.ESTADO||'').toUpperCase(),observaciones:String(r.OBSERVACIONES||'')}});
  return alumnos.map(r=>{
    const existente=porAlumno[String(r.ID_ALUMNO)]||{};
    return {idAlumno:String(r.ID_ALUMNO||''),nombre:String(r.NOMBRE||''),apellido:String(r.APELLIDO||''),sexo:String(r.SEXO||''),grado:String(r.GRADO||''),seccion:String(r.SECCION||''),estado:existente.estado||'',observaciones:existente.observaciones||''};
  }).sort((a,b)=>(a.nombre+' '+a.apellido).localeCompare(b.nombre+' '+b.apellido));
}

function guardarAsistencia(token,datos){
  const m=verificarSesion(token); validarObjeto(datos,['fecha','registros']);
  if(!Array.isArray(datos.registros)) throw new Error('Los registros de asistencia no son válidos.');
  const fecha=normalizarFechaAsistencia(datos.fecha);
  const estadosPermitidos=['PRESENTE','AUSENTE','TARDE','JUSTIFICADO'];
  const alumnosValidos={};
  obtenerRegistros('ALUMNOS').forEach(r=>{
    if(String(r.ID_MAESTRA)===String(m.idMaestra)&&String(r.ESTADO).toUpperCase()!=='ELIMINADO') alumnosValidos[String(r.ID_ALUMNO)]=true;
  });
  const hoja=obtenerHoja('ASISTENCIA');
  const existentes={};
  obtenerRegistrosConFila('ASISTENCIA').forEach(r=>{
    if(String(r.ID_MAESTRA)===String(m.idMaestra)&&normalizarFechaAsistencia(r.FECHA)===fecha) existentes[String(r.ID_ALUMNO)]=r;
  });
  const lock=LockService.getScriptLock();
  lock.waitLock(20000);
  try{
    let guardados=0;
    datos.registros.forEach(item=>{
      const idAlumno=limpiarTexto(item.idAlumno), estado=limpiarTexto(item.estado).toUpperCase(), observaciones=limpiarTexto(item.observaciones||'');
      if(!idAlumno||!alumnosValidos[idAlumno]) throw new Error('Uno de los alumnos no pertenece a esta maestra.');
      if(!estadosPermitidos.includes(estado)) return;
      const existente=existentes[idAlumno];
      if(existente){
        hoja.getRange(existente.__fila,4,1,4).setValues([[fecha,estado,observaciones,new Date()]]);
      }else{
        hoja.appendRow([generarId('ASI'),m.idMaestra,idAlumno,fecha,estado,observaciones,new Date()]);
      }
      guardados++;
    });
    if(guardados===0) throw new Error('No hay alumnos marcados para guardar.');
    registrarAuditoria(m.idMaestra,'GUARDAR','ASISTENCIA','Asistencia del '+fecha+': '+guardados+' registros');
    return {guardados:guardados,fecha:fecha};
  }finally{
    lock.releaseLock();
  }
}

function normalizarFechaAsistencia(valor){
  if(!valor) throw new Error('La fecha es obligatoria.');
  if(Object.prototype.toString.call(valor)==='[object Date]'&&!Number.isNaN(valor.getTime())) return Utilities.formatDate(valor,Session.getScriptTimeZone(),'yyyy-MM-dd');
  const texto=String(valor).trim();
  if(/^\d{4}-\d{2}-\d{2}$/.test(texto)) return texto;
  const fecha=new Date(texto);
  if(Number.isNaN(fecha.getTime())) throw new Error('La fecha no es válida.');
  return Utilities.formatDate(fecha,Session.getScriptTimeZone(),'yyyy-MM-dd');
}


function listarCalificaciones(token){
  const m=verificarSesion(token);
  const alumnos={};
  obtenerRegistros('ALUMNOS').forEach(r=>{
    if(String(r.ID_MAESTRA)===String(m.idMaestra)&&String(r.ESTADO).toUpperCase()!=='ELIMINADO'){
      alumnos[String(r.ID_ALUMNO)]=String(r.NOMBRE||'')+' '+String(r.APELLIDO||'');
    }
  });
  return obtenerRegistros('CALIFICACIONES')
    .filter(r=>String(r.ID_MAESTRA)===String(m.idMaestra)&&alumnos[String(r.ID_ALUMNO)])
    .map(r=>({
      idCalificacion:String(r.ID_CALIFICACION||''),
      idAlumno:String(r.ID_ALUMNO||''),
      nombreAlumno:alumnos[String(r.ID_ALUMNO)]||'Alumno',
      asignatura:String(r.ASIGNATURA||''),
      actividad:String(r.ACTIVIDAD||''),
      periodo:String(r.PERIODO||''),
      calificacion:Number(r.CALIFICACION||0),
      calificacionMaxima:Number(r.CALIFICACION_MAXIMA||0),
      fecha:formatearFechaParaFormulario(r.FECHA),
      observaciones:String(r.OBSERVACIONES||'')
    }))
    .sort((a,b)=>String(b.fecha).localeCompare(String(a.fecha))||a.nombreAlumno.localeCompare(b.nombreAlumno));
}

function guardarCalificacion(token,datos){
  const m=verificarSesion(token);
  validarObjeto(datos,['idAlumno','asignatura','actividad','periodo','calificacion','calificacionMaxima','fecha']);
  const alumno=obtenerRegistros('ALUMNOS').find(r=>
    String(r.ID_ALUMNO)===String(datos.idAlumno)&&
    String(r.ID_MAESTRA)===String(m.idMaestra)&&
    String(r.ESTADO).toUpperCase()!=='ELIMINADO'
  );
  if(!alumno) throw new Error('El alumno no pertenece a esta maestra.');

  const calificacion=Number(datos.calificacion);
  const maxima=Number(datos.calificacionMaxima);
  if(!Number.isFinite(calificacion)||calificacion<0) throw new Error('La calificación no es válida.');
  if(!Number.isFinite(maxima)||maxima<=0) throw new Error('La calificación máxima debe ser mayor que cero.');
  if(calificacion>maxima) throw new Error('La calificación no puede superar la máxima.');

  const fecha=normalizarFechaCalificacion(datos.fecha);
  const hoja=obtenerHoja('CALIFICACIONES');
  const idSolicitado=limpiarTexto(datos.idCalificacion||'');
  const registro={
    idCalificacion:idSolicitado||generarId('CAL'),
    idAlumno:String(datos.idAlumno),
    nombreAlumno:String(alumno.NOMBRE||'')+' '+String(alumno.APELLIDO||''),
    asignatura:limpiarTexto(datos.asignatura),
    actividad:limpiarTexto(datos.actividad),
    periodo:limpiarTexto(datos.periodo),
    calificacion:calificacion,
    calificacionMaxima:maxima,
    fecha:fecha,
    observaciones:limpiarTexto(datos.observaciones||'')
  };

  const lock=LockService.getScriptLock();
  lock.waitLock(20000);
  try{
    if(idSolicitado){
      const existente=obtenerRegistrosConFila('CALIFICACIONES').find(r=>
        String(r.ID_CALIFICACION)===idSolicitado&&String(r.ID_MAESTRA)===String(m.idMaestra)
      );
      if(!existente) throw new Error('No se encontró la calificación o no tienes permiso.');
      hoja.getRange(existente.__fila,1,1,10).setValues([[
        registro.idCalificacion,m.idMaestra,registro.idAlumno,registro.asignatura,
        registro.actividad,registro.periodo,registro.calificacion,
        registro.calificacionMaxima,registro.fecha,registro.observaciones
      ]]);
      registrarAuditoria(m.idMaestra,'EDITAR','CALIFICACIONES','Calificación actualizada: '+registro.nombreAlumno);
    }else{
      hoja.appendRow([
        registro.idCalificacion,m.idMaestra,registro.idAlumno,registro.asignatura,
        registro.actividad,registro.periodo,registro.calificacion,
        registro.calificacionMaxima,registro.fecha,registro.observaciones
      ]);
      registrarAuditoria(m.idMaestra,'CREAR','CALIFICACIONES','Calificación creada: '+registro.nombreAlumno);
    }
  }finally{
    lock.releaseLock();
  }
  return registro;
}

function eliminarCalificacion(token,datos){
  const m=verificarSesion(token);
  validarObjeto(datos,['idCalificacion']);
  const hoja=obtenerHoja('CALIFICACIONES');
  const existente=obtenerRegistrosConFila('CALIFICACIONES').find(r=>
    String(r.ID_CALIFICACION)===String(datos.idCalificacion)&&
    String(r.ID_MAESTRA)===String(m.idMaestra)
  );
  if(!existente) throw new Error('No se encontró la calificación o no tienes permiso.');
  hoja.deleteRow(existente.__fila);
  registrarAuditoria(m.idMaestra,'ELIMINAR','CALIFICACIONES','Calificación eliminada');
  return {eliminado:true,idCalificacion:String(datos.idCalificacion)};
}

function normalizarFechaCalificacion(valor){
  if(!valor) throw new Error('La fecha es obligatoria.');
  if(Object.prototype.toString.call(valor)==='[object Date]'&&!Number.isNaN(valor.getTime())){
    return Utilities.formatDate(valor,Session.getScriptTimeZone(),'yyyy-MM-dd');
  }
  const texto=String(valor).trim();
  if(/^\d{4}-\d{2}-\d{2}$/.test(texto)) return texto;
  const fecha=new Date(texto);
  if(Number.isNaN(fecha.getTime())) throw new Error('La fecha no es válida.');
  return Utilities.formatDate(fecha,Session.getScriptTimeZone(),'yyyy-MM-dd');
}

function mostrarFormularioMaestra(){ SpreadsheetApp.getUi().alert('Las maestras pueden registrarse desde la plataforma web.'); }
function mostrarResumen(){ const ss=SpreadsheetApp.getActiveSpreadsheet(); SpreadsheetApp.getUi().alert('Resumen','Maestras: '+contarRegistros(ss,'MAESTRAS')+'\nAlumnos: '+contarRegistros(ss,'ALUMNOS'),SpreadsheetApp.getUi().ButtonSet.OK); }
function contarRegistros(ss,n){const h=ss.getSheetByName(n);return h?Math.max(h.getLastRow()-1,0):0}
function crearRespaldo(){const f=DriveApp.getFileById(SpreadsheetApp.getActiveSpreadsheet().getId());const fecha=Utilities.formatDate(new Date(),Session.getScriptTimeZone(),'yyyy-MM-dd_HH-mm');f.makeCopy('Respaldo Aula Mágica '+fecha);SpreadsheetApp.getUi().alert('Respaldo creado correctamente.');}
function generarId(p){return p+'-'+Utilities.getUuid().replace(/-/g,'').substring(0,10).toUpperCase()}
function crearHashContrasena(c){const bytes=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,obtenerSaltAplicacion()+':'+c,Utilities.Charset.UTF_8);return bytes.map(b=>{const v=b<0?b+256:b;return v.toString(16).padStart(2,'0')}).join('')}
function obtenerSaltAplicacion(){const p=PropertiesService.getScriptProperties();let s=p.getProperty('PASSWORD_SALT');if(!s){s=Utilities.getUuid()+Utilities.getUuid();p.setProperty('PASSWORD_SALT',s)}return s}
function crearTokenSesion(){return Utilities.base64EncodeWebSafe(Utilities.getUuid()+'-'+Date.now()+'-'+Math.random()).replace(/=+$/g,'')}
function generarUsuarioUnico(base,registros){let u=String(base).toLowerCase().replace(/[^a-z0-9._-]/g,'')||'maestra',c=u,n=1,us=registros.map(r=>String(r.USUARIO).toLowerCase());while(us.includes(c.toLowerCase()))c=u+(n++);return c}
function normalizarCorreo(v){return String(v||'').trim().toLowerCase()}
function esCorreoValido(v){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)}
function limpiarTexto(v){return String(v||'').trim()}
function validarObjeto(o,campos){if(!o||typeof o!=='object')throw new Error('Los datos enviados no son válidos.');campos.forEach(c=>{if(o[c]===undefined||o[c]===null||String(o[c]).trim()==='')throw new Error('El campo '+c+' es obligatorio.')})}
function obtenerHoja(n){const h=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(n);if(!h)throw new Error('No existe la hoja '+n+'. Ejecuta Crear estructura.');return h}
function obtenerRegistros(n){return obtenerRegistrosConFila(n).map(r=>{delete r.__fila;return r})}
function obtenerRegistrosConFila(n){const h=obtenerHoja(n),uf=h.getLastRow(),uc=h.getLastColumn();if(uf<2||uc<1)return[];const v=h.getRange(1,1,uf,uc).getValues(),e=v[0].map(x=>String(x).trim());return v.slice(1).map((fila,i)=>{const r={__fila:i+2};e.forEach((x,j)=>r[x]=fila[j]);return r}).filter(r=>e.some(x=>String(r[x]||'').trim()!==''))}
function registrarAuditoria(id,a,m,d){obtenerHoja('AUDITORIA').appendRow([generarId('AUD'),id||'',a,m,d,new Date(),''])}
function formatearFechaParaFormulario(v){if(!v)return'';if(Object.prototype.toString.call(v)==='[object Date]'&&!Number.isNaN(v.getTime()))return Utilities.formatDate(v,Session.getScriptTimeZone(),'yyyy-MM-dd');return String(v)}
