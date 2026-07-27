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
  MATERIALES_BAUL: ['ID_MATERIAL','TITULO','DESCRIPCION','CATEGORIA','NIVEL','PRECIO','IMAGEN_URL','ARCHIVO_URL','ETIQUETA','DESTACADO','ESTADO','FECHA_PUBLICACION'],
  COMPRAS_BAUL: ['ID_COMPRA','ID_MATERIAL','ID_MAESTRA','FECHA_SOLICITUD','MONTO','ESTADO','REFERENCIA','FECHA_PAGO'],
  CALENDARIO_ESCOLAR: ['ID_CALENDARIO','ID_MAESTRA','TITULO','TIPO','FECHA_INICIO','FECHA_FIN','HORA','LUGAR','DESCRIPCION','RECORDATORIO','ESTADO','FECHA_REGISTRO'],
  HORARIO_SEMANAL: ['ID_HORARIO','ID_MAESTRA','DIA','HORA_INICIO','HORA_FIN','ASIGNATURA','GRADO','SECCION','AULA','COLOR','NOTAS','ESTADO'],
  EXPEDIENTES_ALUMNOS: ['ID_EXPEDIENTE','ID_MAESTRA','ID_ALUMNO','FOTO','FIRMA_MAESTRA','FIRMA_REPRESENTANTE','ALERGIAS','CONDICIONES_MEDICAS','CONTACTO_EMERGENCIA','TELEFONO_EMERGENCIA','AUTORIZACIONES','NOTAS_PRIVADAS','FECHA_ACTUALIZACION'],
  PLANES_PLATAFORMA: ['ID_PLAN','NOMBRE','DURACION_DIAS','PRECIO_USD','PRECIO_VES','LIMITE_ALUMNOS','ESTADO','DESCRIPCION'],
  LICENCIAS: ['ID_LICENCIA','ID_MAESTRA','ID_PLAN','FECHA_INICIO','FECHA_VENCIMIENTO','ESTADO','FECHA_ACTUALIZACION'],
  PAGOS_SUSCRIPCIONES: ['ID_PAGO','ID_MAESTRA','ID_LICENCIA','ID_PLAN','MONTO','MONEDA','METODO','REFERENCIA','ESTADO','FECHA_PAGO','NOTAS'],
  ACTIVACIONES_CUENTAS: ['ID_ACTIVACION','ID_MAESTRA','CODIGO','ID_PLAN','ESTADO','FECHA_CREACION','FECHA_EXPIRACION','FECHA_ACTIVACION'],
  SOLICITUDES_PAGO: ['ID_SOLICITUD','ID_MAESTRA','ID_PLAN','MONTO','MONEDA','METODO','REFERENCIA','COMPROBANTE','ESTADO','FECHA_SOLICITUD','FECHA_REVISION','REVISADO_POR','NOTAS_CLIENTE','NOTAS_ADMIN'],
  AUDITORIA: ['ID','ID_MAESTRA','ACCION','MODULO','DETALLE','FECHA','IP']
};

function onOpen() {
  SpreadsheetApp.getUi().createMenu('🎓 Aula Mágica')
    .addItem('Crear o reparar estructura', 'crearEstructuraInicial')
    .addSeparator()
    .addItem('Agregar maestra', 'mostrarFormularioMaestra')
    .addItem('Ver resumen', 'mostrarResumen')
    .addItem('Preparar Mi Baúl Digital', 'configurarBaulDigital')
    .addSeparator()
    .addItem('Configurar bot Telegram', 'configurarBotTelegram')
    .addItem('Reactivar webhook Telegram', 'reactivarWebhookTelegram')
    .addSeparator()
    .addItem('Activar recordatorios automáticos', 'activarRecordatoriosAutomaticos')
    .addItem('Probar recordatorios ahora', 'probarRecordatoriosAutomaticos')
    .addItem('Desactivar recordatorios', 'desactivarRecordatoriosAutomaticos')
    .addSeparator()
    .addItem('Crear respaldo ahora', 'crearRespaldo')
    .addItem('Activar respaldo semanal', 'activarRespaldoSemanal')
    .addItem('Desactivar respaldo automático', 'desactivarRespaldoAutomatico')
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
  if (config.getLastRow() < 2) config.getRange(2,1,11,3).setValues([
    ['NOMBRE_APLICACION',APP_NAME,'Nombre mostrado en la plataforma'],
    ['VERSION','6.0.0','Versión actual'],
    ['SESION_HORAS','24','Duración de sesión'],
    ['REGISTRO_PUBLICO','SI','Permitir registro'],
    ['TELEGRAM_ACTIVO','NO','Estado del bot'],
    ['BAUL_WHATSAPP','573000000000','WhatsApp de ventas con código de país'],
    ['BAUL_BANCO','Configurar banco','Banco para pago móvil'],
    ['BAUL_TELEFONO','3000000000','Teléfono del pago móvil'],
    ['BAUL_DOCUMENTO','Configurar documento','Documento del titular'],
    ['BAUL_TITULAR','Configurar titular','Nombre del titular'],
    ['BAUL_MONEDA','COP','Moneda mostrada en Mi Baúl'],
    ['ADMIN_CORREO','','Correo autorizado para Panel Administrador']
  ]);

  const registrosConfig=obtenerRegistrosConFila('CONFIGURACION');
  const filaVersion=registrosConfig.find(r=>
    String(r.CLAVE||'').trim()==='VERSION'
  );

  if(filaVersion){
    config.getRange(filaVersion.__fila,2).setValue('10.3.0');
  }

  SpreadsheetApp.getUi().alert(
    'Aula Mágica',
    'La estructura está lista y actualizada a la versión 9.0.0.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function doGet() {
  return responderJson({
    ok: true,
    aplicacion: APP_NAME,
    estado: 'API funcionando',
    version: '10.3.0'
  });
}
function doPost(e) {
  try {
    const s = obtenerSolicitud(e);
    if(s && (s.message || s.callback_query)){
      procesarActualizacionTelegram(s);
      return responderJson({ok:true});
    }
    const accion=s.action, datos=s.data||{}, token=s.token||'';
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
      case 'listarResumenMensualAsistencia': resultado=listarResumenMensualAsistencia(token,datos); break;
      case 'listarMaterialesBaul': resultado=listarMaterialesBaul(token,datos); break;
      case 'solicitarCompraBaul': resultado=solicitarCompraBaul(token,datos); break;
      case 'botObtenerPreferenciasAvisosTelegram': resultado=botObtenerPreferenciasAvisosTelegram(datos); break;
      case 'botCambiarPreferenciaAvisoTelegram': resultado=botCambiarPreferenciaAvisoTelegram(datos); break;
      case 'botCambiarTodosAvisosTelegram': resultado=botCambiarTodosAvisosTelegram(datos); break;
      case 'botProbarAvisosTelegram': resultado=botProbarAvisosTelegram(datos); break;
      case 'botListarComprasBaulTelegram': resultado=botListarComprasBaulTelegram(datos); break;
      case 'botObtenerMaterialBaulTelegram': resultado=botObtenerMaterialBaulTelegram(datos); break;
      case 'adminObtenerPanel': resultado=adminObtenerPanel(token); break;
      case 'adminCrearMaestra': resultado=adminCrearMaestra(token,datos); break;
      case 'adminCambiarEstadoMaestra': resultado=adminCambiarEstadoMaestra(token,datos); break;
      case 'adminRestablecerContrasena': resultado=adminRestablecerContrasena(token,datos); break;
      case 'adminListarAuditoria': resultado=adminListarAuditoria(token,datos); break;
      case 'adminCrearRespaldo': resultado=adminCrearRespaldo(token); break;
      case 'adminActualizarCompra': resultado=adminActualizarCompra(token,datos); break;
      case 'listarCalendarioEscolar': resultado=listarCalendarioEscolar(token); break;
      case 'guardarCalendarioEscolar': resultado=guardarCalendarioEscolar(token,datos); break;
      case 'eliminarCalendarioEscolar': resultado=eliminarCalendarioEscolar(token,datos); break;
      case 'listarHorarioSemanal': resultado=listarHorarioSemanal(token); break;
      case 'guardarHorarioSemanal': resultado=guardarHorarioSemanal(token,datos); break;
      case 'eliminarHorarioSemanal': resultado=eliminarHorarioSemanal(token,datos); break;
      case 'obtenerExpedienteAlumno': resultado=obtenerExpedienteAlumno(token,datos); break;
      case 'guardarExpedienteAlumno': resultado=guardarExpedienteAlumno(token,datos); break;
      case 'adminObtenerSuscripciones': resultado=adminObtenerSuscripciones(token); break;
      case 'adminActivarSuscripcion': resultado=adminActivarSuscripcion(token,datos); break;
      case 'adminCambiarEstadoSuscripcion': resultado=adminCambiarEstadoSuscripcion(token,datos); break;
      case 'adminRegistrarPagoSuscripcion': resultado=adminRegistrarPagoSuscripcion(token,datos); break;
      case 'adminGuardarLimitesPlan': resultado=adminGuardarLimitesPlan(token,datos); break;
      case 'adminGenerarActivacionCuenta': resultado=adminGenerarActivacionCuenta(token,datos); break;
      case 'activarCuentaConCodigo': resultado=activarCuentaConCodigo(datos); break;
      case 'crearSolicitudPago': resultado=crearSolicitudPago(token,datos); break;
      case 'listarMisSolicitudesPago': resultado=listarMisSolicitudesPago(token); break;
      case 'adminListarSolicitudesPago': resultado=adminListarSolicitudesPago(token); break;
      case 'adminRevisarSolicitudPago': resultado=adminRevisarSolicitudPago(token,datos); break;
      case 'listarCalificaciones': resultado=listarCalificaciones(token); break;
      case 'guardarCalificacion': resultado=guardarCalificacion(token,datos); break;
      case 'eliminarCalificacion': resultado=eliminarCalificacion(token,datos); break;
      case 'listarPlanificaciones': resultado=listarPlanificaciones(token); break;
      case 'guardarPlanificacion': resultado=guardarPlanificacion(token,datos); break;
      case 'eliminarPlanificacion': resultado=eliminarPlanificacion(token,datos); break;
      case 'listarCumpleanos': resultado=listarCumpleanos(token); break;
      case 'guardarCumpleanos': resultado=guardarCumpleanos(token,datos); break;
      case 'eliminarCumpleanos': resultado=eliminarCumpleanos(token,datos); break;
      case 'listarReuniones': resultado=listarReuniones(token); break;
      case 'guardarReunion': resultado=guardarReunion(token,datos); break;
      case 'eliminarReunion': resultado=eliminarReunion(token,datos); break;
      case 'listarAgenda': resultado=listarAgenda(token); break;
      case 'guardarEventoAgenda': resultado=guardarEventoAgenda(token,datos); break;
      case 'eliminarEventoAgenda': resultado=eliminarEventoAgenda(token,datos); break;
      case 'obtenerEstadoTelegram': resultado=obtenerEstadoTelegram(token); break;
      case 'generarCodigoTelegram': resultado=generarCodigoTelegram(token); break;
      case 'desvincularTelegram': resultado=desvincularTelegram(token); break;
      case 'enviarPruebaTelegram': resultado=enviarPruebaTelegram(token); break;
      case 'actualizarPerfilMaestra': resultado=actualizarPerfilMaestra(token,datos); break;
      case 'cambiarContrasenaMaestra': resultado=cambiarContrasenaMaestra(token,datos); break;
      case 'botVincularTelegramVercel': resultado=botVincularTelegramVercel(datos); break;
      case 'botComandoTelegramVercel': resultado=botComandoTelegramVercel(datos); break;
      case 'botGuardarCalendarioTelegram': resultado=botGuardarCalendarioTelegram(datos); break;
      case 'botEliminarCalendarioTelegram': resultado=botEliminarCalendarioTelegram(datos); break;
      case 'botGuardarHorarioTelegram': resultado=botGuardarHorarioTelegram(datos); break;
      case 'botEliminarHorarioTelegram': resultado=botEliminarHorarioTelegram(datos); break;
      case 'botListarAlumnosAsistencia': resultado=botListarAlumnosAsistencia(datos); break;
      case 'botGuardarAsistenciaRapida': resultado=botGuardarAsistenciaRapida(datos); break;
      case 'botIniciarAgendaTelegram': resultado=botIniciarAgendaTelegram(datos); break;
      case 'botProcesarFlujoAgendaTelegram': resultado=botProcesarFlujoAgendaTelegram(datos); break;
      case 'botSeleccionarTipoAgendaTelegram': resultado=botSeleccionarTipoAgendaTelegram(datos); break;
      case 'botConfirmarAgendaTelegram': resultado=botConfirmarAgendaTelegram(datos); break;
      case 'botCancelarFlujoAgendaTelegram': resultado=botCancelarFlujoAgendaTelegram(datos); break;
      case 'botIniciarReunionTelegram': resultado=botIniciarReunionTelegram(datos); break;
      case 'botProcesarFlujoReunionTelegram': resultado=botProcesarFlujoReunionTelegram(datos); break;
      case 'botConfirmarReunionTelegram': resultado=botConfirmarReunionTelegram(datos); break;
      case 'botCancelarFlujoReunionTelegram': resultado=botCancelarFlujoReunionTelegram(datos); break;
      case 'botIniciarPlanificacionTelegram': resultado=botIniciarPlanificacionTelegram(datos); break;
      case 'botProcesarFlujoPlanificacionTelegram': resultado=botProcesarFlujoPlanificacionTelegram(datos); break;
      case 'botConfirmarPlanificacionTelegram': resultado=botConfirmarPlanificacionTelegram(datos); break;
      case 'botCancelarFlujoPlanificacionTelegram': resultado=botCancelarFlujoPlanificacionTelegram(datos); break;
      case 'botIniciarCalificacionTelegram': resultado=botIniciarCalificacionTelegram(datos); break;
      case 'botSeleccionarAlumnoCalificacionTelegram': resultado=botSeleccionarAlumnoCalificacionTelegram(datos); break;
      case 'botSeleccionarAsignaturaCalificacionTelegram': resultado=botSeleccionarAsignaturaCalificacionTelegram(datos); break;
      case 'botSeleccionarPeriodoCalificacionTelegram': resultado=botSeleccionarPeriodoCalificacionTelegram(datos); break;
      case 'botProcesarFlujoCalificacionTelegram': resultado=botProcesarFlujoCalificacionTelegram(datos); break;
      case 'botConfirmarCalificacionTelegram': resultado=botConfirmarCalificacionTelegram(datos); break;
      case 'botCancelarFlujoCalificacionTelegram': resultado=botCancelarFlujoCalificacionTelegram(datos); break;
      case 'botIniciarAlumnoTelegram': resultado=botIniciarAlumnoTelegram(datos); break;
      case 'botSeleccionarSexoAlumnoTelegram': resultado=botSeleccionarSexoAlumnoTelegram(datos); break;
      case 'botProcesarFlujoAlumnoTelegram': resultado=botProcesarFlujoAlumnoTelegram(datos); break;
      case 'botConfirmarAlumnoTelegram': resultado=botConfirmarAlumnoTelegram(datos); break;
      case 'botCancelarFlujoAlumnoTelegram': resultado=botCancelarFlujoAlumnoTelegram(datos); break;
      case 'botIniciarCumpleanosTelegram': resultado=botIniciarCumpleanosTelegram(datos); break;
      case 'botSeleccionarAlumnoCumpleanosTelegram': resultado=botSeleccionarAlumnoCumpleanosTelegram(datos); break;
      case 'botProcesarFlujoCumpleanosTelegram': resultado=botProcesarFlujoCumpleanosTelegram(datos); break;
      case 'botConfirmarCumpleanosTelegram': resultado=botConfirmarCumpleanosTelegram(datos); break;
      case 'botQuitarCumpleanosTelegram': resultado=botQuitarCumpleanosTelegram(datos); break;
      case 'botCancelarFlujoCumpleanosTelegram': resultado=botCancelarFlujoCumpleanosTelegram(datos); break;
      case 'botGenerarReporteTelegram': resultado=botGenerarReporteTelegram(datos); break;
      case 'botObtenerPerfilTelegram': resultado=botObtenerPerfilTelegram(datos); break;
      case 'botIniciarPerfilTelegram': resultado=botIniciarPerfilTelegram(datos); break;
      case 'botProcesarFlujoPerfilTelegram': resultado=botProcesarFlujoPerfilTelegram(datos); break;
      case 'botConfirmarPerfilTelegram': resultado=botConfirmarPerfilTelegram(datos); break;
      case 'botCancelarFlujoPerfilTelegram': resultado=botCancelarFlujoPerfilTelegram(datos); break;
      case 'botListarEventosGestionTelegram': resultado=botListarEventosGestionTelegram(datos); break;
      case 'botObtenerEventoGestionTelegram': resultado=botObtenerEventoGestionTelegram(datos); break;
      case 'botCambiarEstadoEventoTelegram': resultado=botCambiarEstadoEventoTelegram(datos); break;
      case 'botEliminarEventoTelegram': resultado=botEliminarEventoTelegram(datos); break;
      case 'botListarReunionesGestionTelegram': resultado=botListarReunionesGestionTelegram(datos); break;
      case 'botObtenerReunionGestionTelegram': resultado=botObtenerReunionGestionTelegram(datos); break;
      case 'botCambiarEstadoReunionTelegram': resultado=botCambiarEstadoReunionTelegram(datos); break;
      case 'botEliminarReunionTelegram': resultado=botEliminarReunionTelegram(datos); break;
      case 'botListarPlanesGestionTelegram': resultado=botListarPlanesGestionTelegram(datos); break;
      case 'botObtenerPlanGestionTelegram': resultado=botObtenerPlanGestionTelegram(datos); break;
      case 'botCambiarEstadoPlanTelegram': resultado=botCambiarEstadoPlanTelegram(datos); break;
      case 'botEliminarPlanTelegram': resultado=botEliminarPlanTelegram(datos); break;
      case 'botListarCalificacionesGestionTelegram': resultado=botListarCalificacionesGestionTelegram(datos); break;
      case 'botObtenerCalificacionGestionTelegram': resultado=botObtenerCalificacionGestionTelegram(datos); break;
      case 'botIniciarEdicionCalificacionTelegram': resultado=botIniciarEdicionCalificacionTelegram(datos); break;
      case 'botProcesarEdicionCalificacionTelegram': resultado=botProcesarEdicionCalificacionTelegram(datos); break;
      case 'botConfirmarEdicionCalificacionTelegram': resultado=botConfirmarEdicionCalificacionTelegram(datos); break;
      case 'botCancelarEdicionCalificacionTelegram': resultado=botCancelarEdicionCalificacionTelegram(datos); break;
      case 'botEliminarCalificacionTelegram': resultado=botEliminarCalificacionTelegram(datos); break;
      case 'botListarAlumnosGestionTelegram': resultado=botListarAlumnosGestionTelegram(datos); break;
      case 'botObtenerAlumnoGestionTelegram': resultado=botObtenerAlumnoGestionTelegram(datos); break;
      case 'botIniciarEdicionAlumnoTelegram': resultado=botIniciarEdicionAlumnoTelegram(datos); break;
      case 'botProcesarEdicionAlumnoTelegram': resultado=botProcesarEdicionAlumnoTelegram(datos); break;
      case 'botConfirmarEdicionAlumnoTelegram': resultado=botConfirmarEdicionAlumnoTelegram(datos); break;
      case 'botCancelarEdicionAlumnoTelegram': resultado=botCancelarEdicionAlumnoTelegram(datos); break;
      case 'botCambiarEstadoAlumnoTelegram': resultado=botCambiarEstadoAlumnoTelegram(datos); break;
      case 'botEliminarAlumnoTelegram': resultado=botEliminarAlumnoTelegram(datos); break;
      case 'botListarAsistenciaGestionTelegram': resultado=botListarAsistenciaGestionTelegram(datos); break;
      case 'botObtenerAsistenciaGestionTelegram': resultado=botObtenerAsistenciaGestionTelegram(datos); break;
      case 'botCambiarEstadoAsistenciaTelegram': resultado=botCambiarEstadoAsistenciaTelegram(datos); break;
      case 'botEliminarAsistenciaTelegram': resultado=botEliminarAsistenciaTelegram(datos); break;
      case 'botIniciarEdicionEventoTelegram': resultado=botIniciarEdicionEventoTelegram(datos); break;
      case 'botProcesarEdicionEventoTelegram': resultado=botProcesarEdicionEventoTelegram(datos); break;
      case 'botConfirmarEdicionEventoTelegram': resultado=botConfirmarEdicionEventoTelegram(datos); break;
      case 'botCancelarEdicionEventoTelegram': resultado=botCancelarEdicionEventoTelegram(datos); break;
      case 'botIniciarEdicionReunionTelegram': resultado=botIniciarEdicionReunionTelegram(datos); break;
      case 'botProcesarEdicionReunionTelegram': resultado=botProcesarEdicionReunionTelegram(datos); break;
      case 'botConfirmarEdicionReunionTelegram': resultado=botConfirmarEdicionReunionTelegram(datos); break;
      case 'botCancelarEdicionReunionTelegram': resultado=botCancelarEdicionReunionTelegram(datos); break;
      case 'botIniciarEdicionPlanTelegram': resultado=botIniciarEdicionPlanTelegram(datos); break;
      case 'botProcesarEdicionPlanTelegram': resultado=botProcesarEdicionPlanTelegram(datos); break;
      case 'botConfirmarEdicionPlanTelegram': resultado=botConfirmarEdicionPlanTelegram(datos); break;
      case 'botCancelarEdicionPlanTelegram': resultado=botCancelarEdicionPlanTelegram(datos); break;
      default: throw new Error('La acción "'+accion+'" no existe.');
    }
    return responderJson({ok:true,resultado});
  } catch (error) { return responderJson({ok:false,error:error.message||'Ocurrió un error.'}); }
}
function obtenerSolicitud(e){ if(!e||!e.postData||!e.postData.contents) throw new Error('La solicitud está vacía.'); try{return JSON.parse(e.postData.contents)}catch(_){throw new Error('El contenido no es JSON válido.')} }
function responderJson(c){ return ContentService.createTextOutput(JSON.stringify(c)).setMimeType(ContentService.MimeType.JSON); }


function obtenerConfiguracionValor(clave,valorPorDefecto){
  const registro=obtenerRegistros('CONFIGURACION').find(r=>
    String(r.CLAVE||'').trim()===String(clave||'').trim()
  );

  return registro
    ?String(registro.VALOR||valorPorDefecto||'').trim()
    :String(valorPorDefecto||'').trim();
}

function verificarAdministrador(token){
  const maestra=verificarSesion(token);
  const correoPropietario='wilmarvelasquez1783@gmail.com';
  const correoConfigurado=obtenerConfiguracionValor(
    'ADMIN_CORREO',
    correoPropietario
  );

  const correoActual=normalizarCorreo(maestra.correo);
  const permitido=
    correoActual===normalizarCorreo(correoPropietario)||
    correoActual===normalizarCorreo(correoConfigurado);

  if(!permitido){
    throw new Error('No tienes permiso para acceder al Panel Administrador.');
  }

  return maestra;
}

function adminResumenPorEstado(registros,campo){
  const resultado={};

  registros.forEach(r=>{
    const valor=String(r[campo]||'SIN DEFINIR').trim().toUpperCase();
    resultado[valor]=(resultado[valor]||0)+1;
  });

  return resultado;
}

function adminObtenerPanel(token){
  verificarAdministrador(token);

  const maestras=obtenerRegistros('MAESTRAS').map(r=>({
    idMaestra:String(r.ID_MAESTRA||''),
    nombre:String(r.NOMBRE||''),
    apellido:String(r.APELLIDO||''),
    correo:String(r.CORREO||''),
    usuario:String(r.USUARIO||''),
    grado:String(r.GRADO||''),
    seccion:String(r.SECCION||''),
    estado:String(r.ESTADO||'ACTIVA').toUpperCase(),
    fechaRegistro:formatearFechaParaFormulario(r.FECHA_REGISTRO),
    ultimoAcceso:r.ULTIMO_ACCESO
      ?Utilities.formatDate(
        new Date(r.ULTIMO_ACCESO),
        obtenerZonaHorariaAulaMagica(),
        'yyyy-MM-dd HH:mm'
      )
      :''
  })).sort((a,b)=>
    (a.nombre+' '+a.apellido).localeCompare(b.nombre+' '+b.apellido)
  );

  const alumnos=obtenerRegistros('ALUMNOS');
  const asistencia=obtenerRegistros('ASISTENCIA');
  const calificaciones=obtenerRegistros('CALIFICACIONES');
  const compras=obtenerRegistros('COMPRAS_BAUL');
  const telegram=obtenerRegistros('TELEGRAM');

  const alumnosPorMaestra={};
  alumnos.forEach(r=>{
    const id=String(r.ID_MAESTRA||'').trim();
    if(String(r.ESTADO||'').trim().toUpperCase()==='ELIMINADO')return;
    alumnosPorMaestra[id]=(alumnosPorMaestra[id]||0)+1;
  });

  const maestrasConTotales=maestras.map(m=>Object.assign({},m,{
    totalAlumnos:Number(alumnosPorMaestra[m.idMaestra]||0)
  }));

  const comprasDetalle=compras.map(r=>({
    idCompra:String(r.ID_COMPRA||''),
    idMaterial:String(r.ID_MATERIAL||''),
    idMaestra:String(r.ID_MAESTRA||''),
    fechaSolicitud:r.FECHA_SOLICITUD
      ?Utilities.formatDate(
        new Date(r.FECHA_SOLICITUD),
        obtenerZonaHorariaAulaMagica(),
        'yyyy-MM-dd HH:mm'
      )
      :'',
    monto:Number(r.MONTO||0),
    estado:String(r.ESTADO||'PENDIENTE').toUpperCase(),
    referencia:String(r.REFERENCIA||''),
    fechaPago:r.FECHA_PAGO
      ?Utilities.formatDate(
        new Date(r.FECHA_PAGO),
        obtenerZonaHorariaAulaMagica(),
        'yyyy-MM-dd HH:mm'
      )
      :''
  })).sort((a,b)=>b.fechaSolicitud.localeCompare(a.fechaSolicitud));

  return {
    estadisticas:{
      maestras:maestras.length,
      maestrasActivas:maestras.filter(m=>m.estado==='ACTIVA').length,
      maestrasBloqueadas:maestras.filter(m=>m.estado!=='ACTIVA').length,
      alumnos:alumnos.filter(r=>
        String(r.ESTADO||'').trim().toUpperCase()!=='ELIMINADO'
      ).length,
      asistencias:asistencia.length,
      calificaciones:calificaciones.length,
      telegramVinculados:telegram.filter(r=>
        String(r.ESTADO||'').trim().toUpperCase()==='VINCULADO'
      ).length,
      ventasPendientes:comprasDetalle.filter(c=>c.estado==='PENDIENTE').length,
      ventasPagadas:comprasDetalle.filter(c=>c.estado==='PAGADO').length,
      ingresos:comprasDetalle
        .filter(c=>c.estado==='PAGADO')
        .reduce((total,c)=>total+Number(c.monto||0),0)
    },
    maestras:maestrasConTotales,
    compras:comprasDetalle.slice(0,100),
    telegram:telegram.map(r=>({
      idMaestra:String(r.ID_MAESTRA||''),
      chatId:String(r.CHAT_ID||''),
      estado:String(r.ESTADO||'').toUpperCase(),
      fechaVinculacion:r.FECHA_VINCULACION
        ?Utilities.formatDate(
          new Date(r.FECHA_VINCULACION),
          obtenerZonaHorariaAulaMagica(),
          'yyyy-MM-dd HH:mm'
        )
        :''
    }))
  };
}

function adminCrearMaestra(token,datos){
  const admin=verificarAdministrador(token);
  validarObjeto(datos,['nombre','apellido','correo','contrasena']);

  const creada=registrarMaestra(datos);

  registrarAuditoria(
    admin.idMaestra,
    'CREAR',
    'ADMINISTRACION',
    'Maestra creada desde Panel Administrador: '+creada.correo
  );

  return creada;
}

function adminCambiarEstadoMaestra(token,datos){
  const admin=verificarAdministrador(token);
  validarObjeto(datos,['idMaestra','estado']);

  const estado=String(datos.estado||'').trim().toUpperCase();

  if(!['ACTIVA','BLOQUEADA'].includes(estado)){
    throw new Error('El estado solicitado no es válido.');
  }

  if(String(datos.idMaestra||'')===String(admin.idMaestra||'')){
    throw new Error('No puedes bloquear tu propia cuenta administradora.');
  }

  const registro=obtenerRegistrosConFila('MAESTRAS').find(r=>
    String(r.ID_MAESTRA||'').trim()===
    String(datos.idMaestra||'').trim()
  );

  if(!registro)throw new Error('No se encontró la maestra.');

  obtenerHoja('MAESTRAS')
    .getRange(registro.__fila,9)
    .setValue(estado);

  if(estado!=='ACTIVA'){
    const hojaSesiones=obtenerHoja('SESIONES');
    obtenerRegistrosConFila('SESIONES')
      .filter(r=>
        String(r.ID_MAESTRA||'').trim()===
        String(datos.idMaestra||'').trim()&&
        String(r.ESTADO||'').trim().toUpperCase()==='ACTIVA'
      )
      .forEach(r=>hojaSesiones.getRange(r.__fila,5).setValue('CERRADA'));
  }

  registrarAuditoria(
    admin.idMaestra,
    'EDITAR',
    'ADMINISTRACION',
    'Estado de maestra actualizado a '+estado
  );

  return {actualizado:true,estado:estado};
}

function adminRestablecerContrasena(token,datos){
  const admin=verificarAdministrador(token);
  validarObjeto(datos,['idMaestra','nuevaContrasena']);

  const nueva=String(datos.nuevaContrasena||'');

  if(nueva.length<6){
    throw new Error('La contraseña debe tener al menos 6 caracteres.');
  }

  const registro=obtenerRegistrosConFila('MAESTRAS').find(r=>
    String(r.ID_MAESTRA||'').trim()===
    String(datos.idMaestra||'').trim()
  );

  if(!registro)throw new Error('No se encontró la maestra.');

  obtenerHoja('MAESTRAS')
    .getRange(registro.__fila,6)
    .setValue(crearHashContrasena(nueva));

  registrarAuditoria(
    admin.idMaestra,
    'EDITAR',
    'ADMINISTRACION',
    'Contraseña restablecida para '+String(registro.CORREO||'')
  );

  return {actualizado:true};
}

function adminListarAuditoria(token,datos){
  verificarAdministrador(token);

  const limite=Math.min(
    300,
    Math.max(20,Number(datos&&datos.limite||100))
  );

  return obtenerRegistros('AUDITORIA')
    .map(r=>({
      id:String(r.ID||''),
      idMaestra:String(r.ID_MAESTRA||''),
      accion:String(r.ACCION||''),
      modulo:String(r.MODULO||''),
      detalle:String(r.DETALLE||''),
      fecha:r.FECHA
        ?Utilities.formatDate(
          new Date(r.FECHA),
          obtenerZonaHorariaAulaMagica(),
          'yyyy-MM-dd HH:mm:ss'
        )
        :'',
      ip:String(r.IP||'')
    }))
    .sort((a,b)=>b.fecha.localeCompare(a.fecha))
    .slice(0,limite);
}

function adminCrearRespaldo(token){
  const admin=verificarAdministrador(token);
  const copia=crearCopiaRespaldoAulaMagica();

  registrarAuditoria(
    admin.idMaestra,
    'CREAR',
    'RESPALDO',
    'Respaldo creado desde Panel Administrador: '+copia.getName()
  );

  return {
    creado:true,
    nombre:copia.getName(),
    id:copia.getId(),
    url:copia.getUrl()
  };
}

function adminActualizarCompra(token,datos){
  const admin=verificarAdministrador(token);
  validarObjeto(datos,['idCompra','estado']);

  const estado=String(datos.estado||'').trim().toUpperCase();

  if(!['PENDIENTE','PAGADO','CANCELADO'].includes(estado)){
    throw new Error('El estado de compra no es válido.');
  }

  const compra=obtenerRegistrosConFila('COMPRAS_BAUL').find(r=>
    String(r.ID_COMPRA||'').trim()===
    String(datos.idCompra||'').trim()
  );

  if(!compra)throw new Error('No se encontró la compra.');

  const hoja=obtenerHoja('COMPRAS_BAUL');

  hoja.getRange(compra.__fila,6).setValue(estado);
  hoja.getRange(compra.__fila,7).setValue(
    limpiarTexto(datos.referencia||compra.REFERENCIA||'')
  );
  hoja.getRange(compra.__fila,8).setValue(
    estado==='PAGADO'?new Date():''
  );

  registrarAuditoria(
    admin.idMaestra,
    'EDITAR',
    'VENTAS',
    'Compra '+String(compra.ID_COMPRA||'')+' actualizada a '+estado
  );

  return {actualizado:true,estado:estado};
}


function fechaTextoOrganizacionEscolar(valor){
  if(!valor)return '';

  if(valor instanceof Date&&!isNaN(valor.getTime())){
    return Utilities.formatDate(
      valor,
      obtenerZonaHorariaAulaMagica(),
      'yyyy-MM-dd'
    );
  }

  const texto=String(valor).trim();
  const iso=texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if(iso)return iso[1]+'-'+iso[2]+'-'+iso[3];

  const latino=texto.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if(latino){
    return [
      latino[3],
      String(latino[2]).padStart(2,'0'),
      String(latino[1]).padStart(2,'0')
    ].join('-');
  }

  return texto;
}

function horaTextoOrganizacionEscolar(valor){
  if(!valor)return '';

  if(valor instanceof Date&&!isNaN(valor.getTime())){
    return Utilities.formatDate(
      valor,
      obtenerZonaHorariaAulaMagica(),
      'HH:mm'
    );
  }

  const texto=String(valor).trim();
  const coincidencia=texto.match(/^(\d{1,2}):(\d{2})/);

  if(!coincidencia)return texto;

  return String(coincidencia[1]).padStart(2,'0')+':'+coincidencia[2];
}

function listarCalendarioEscolar(token){
  const maestra=verificarSesion(token);

  return obtenerRegistros('CALENDARIO_ESCOLAR')
    .filter(r=>
      String(r.ID_MAESTRA||'').trim()===
      String(maestra.idMaestra||'').trim()&&
      String(r.ESTADO||'ACTIVO').trim().toUpperCase()!=='ELIMINADO'
    )
    .map(r=>({
      idCalendario:String(r.ID_CALENDARIO||''),
      titulo:String(r.TITULO||''),
      tipo:String(r.TIPO||'EVENTO').toUpperCase(),
      fechaInicio:fechaTextoOrganizacionEscolar(r.FECHA_INICIO),
      fechaFin:fechaTextoOrganizacionEscolar(r.FECHA_FIN),
      hora:horaTextoOrganizacionEscolar(r.HORA),
      lugar:String(r.LUGAR||''),
      descripcion:String(r.DESCRIPCION||''),
      recordatorio:String(r.RECORDATORIO||'1_DIA').toUpperCase(),
      estado:String(r.ESTADO||'ACTIVO').toUpperCase()
    }))
    .sort((a,b)=>
      (a.fechaInicio+' '+a.hora).localeCompare(
        b.fechaInicio+' '+b.hora
      )
    );
}

function guardarCalendarioEscolar(token,datos){
  const maestra=verificarSesion(token);
  validarObjeto(datos,['titulo','tipo','fechaInicio']);

  const id=String(datos.idCalendario||'').trim()||
    generarId('CAL');

  const registro={
    idCalendario:id,
    titulo:limpiarTexto(datos.titulo),
    tipo:String(datos.tipo||'EVENTO').trim().toUpperCase(),
    fechaInicio:fechaTextoOrganizacionEscolar(datos.fechaInicio),
    fechaFin:fechaTextoOrganizacionEscolar(
      datos.fechaFin||datos.fechaInicio
    ),
    hora:horaTextoOrganizacionEscolar(datos.hora||''),
    lugar:limpiarTexto(datos.lugar||''),
    descripcion:limpiarTexto(datos.descripcion||''),
    recordatorio:String(datos.recordatorio||'1_DIA')
      .trim().toUpperCase(),
    estado:String(datos.estado||'ACTIVO').trim().toUpperCase()
  };

  const permitidos=[
    'CLASE',
    'EVALUACION',
    'REUNION',
    'FERIADO',
    'EVENTO',
    'ENTREGA'
  ];

  if(!permitidos.includes(registro.tipo)){
    throw new Error('El tipo del calendario no es válido.');
  }

  if(registro.fechaFin<registro.fechaInicio){
    throw new Error('La fecha final no puede ser anterior a la inicial.');
  }

  const hoja=obtenerHoja('CALENDARIO_ESCOLAR');
  const existente=obtenerRegistrosConFila('CALENDARIO_ESCOLAR').find(r=>
    String(r.ID_CALENDARIO||'').trim()===id&&
    String(r.ID_MAESTRA||'').trim()===
      String(maestra.idMaestra||'').trim()
  );

  const fila=[
    id,
    maestra.idMaestra,
    registro.titulo,
    registro.tipo,
    registro.fechaInicio,
    registro.fechaFin,
    registro.hora,
    registro.lugar,
    registro.descripcion,
    registro.recordatorio,
    registro.estado,
    existente?existente.FECHA_REGISTRO||new Date():new Date()
  ];

  if(existente){
    hoja.getRange(existente.__fila,1,1,fila.length).setValues([fila]);
    registrarAuditoria(
      maestra.idMaestra,
      'EDITAR',
      'CALENDARIO_ESCOLAR',
      'Actividad actualizada: '+registro.titulo
    );
  }else{
    hoja.appendRow(fila);
    registrarAuditoria(
      maestra.idMaestra,
      'CREAR',
      'CALENDARIO_ESCOLAR',
      'Actividad creada: '+registro.titulo
    );
  }

  hoja.getRange(
    existente?existente.__fila:hoja.getLastRow(),
    5,
    1,
    3
  ).setNumberFormat('@');

  return registro;
}

function eliminarCalendarioEscolar(token,datos){
  const maestra=verificarSesion(token);
  validarObjeto(datos,['idCalendario']);

  const registro=obtenerRegistrosConFila('CALENDARIO_ESCOLAR').find(r=>
    String(r.ID_CALENDARIO||'').trim()===
      String(datos.idCalendario||'').trim()&&
    String(r.ID_MAESTRA||'').trim()===
      String(maestra.idMaestra||'').trim()
  );

  if(!registro)throw new Error('No se encontró la actividad.');

  obtenerHoja('CALENDARIO_ESCOLAR').deleteRow(registro.__fila);

  registrarAuditoria(
    maestra.idMaestra,
    'ELIMINAR',
    'CALENDARIO_ESCOLAR',
    'Actividad eliminada: '+String(registro.TITULO||'')
  );

  return {eliminado:true,idCalendario:String(datos.idCalendario)};
}

function ordenarDiaHorario(dia){
  const orden={
    LUNES:1,
    MARTES:2,
    MIERCOLES:3,
    JUEVES:4,
    VIERNES:5,
    SABADO:6,
    DOMINGO:7
  };

  return orden[String(dia||'').toUpperCase()]||99;
}

function listarHorarioSemanal(token){
  const maestra=verificarSesion(token);

  return obtenerRegistros('HORARIO_SEMANAL')
    .filter(r=>
      String(r.ID_MAESTRA||'').trim()===
        String(maestra.idMaestra||'').trim()&&
      String(r.ESTADO||'ACTIVO').trim().toUpperCase()!=='ELIMINADO'
    )
    .map(r=>({
      idHorario:String(r.ID_HORARIO||''),
      dia:String(r.DIA||'LUNES').toUpperCase(),
      horaInicio:horaTextoOrganizacionEscolar(r.HORA_INICIO),
      horaFin:horaTextoOrganizacionEscolar(r.HORA_FIN),
      asignatura:String(r.ASIGNATURA||''),
      grado:String(r.GRADO||''),
      seccion:String(r.SECCION||''),
      aula:String(r.AULA||''),
      color:String(r.COLOR||'#ff8fc7'),
      notas:String(r.NOTAS||''),
      estado:String(r.ESTADO||'ACTIVO').toUpperCase()
    }))
    .sort((a,b)=>
      ordenarDiaHorario(a.dia)-ordenarDiaHorario(b.dia)||
      a.horaInicio.localeCompare(b.horaInicio)
    );
}

function guardarHorarioSemanal(token,datos){
  const maestra=verificarSesion(token);
  validarObjeto(
    datos,
    ['dia','horaInicio','horaFin','asignatura']
  );

  const id=String(datos.idHorario||'').trim()||
    generarId('HOR');

  const dia=String(datos.dia||'').trim().toUpperCase();
  const dias=[
    'LUNES',
    'MARTES',
    'MIERCOLES',
    'JUEVES',
    'VIERNES',
    'SABADO',
    'DOMINGO'
  ];

  if(!dias.includes(dia)){
    throw new Error('El día seleccionado no es válido.');
  }

  const horaInicio=horaTextoOrganizacionEscolar(datos.horaInicio);
  const horaFin=horaTextoOrganizacionEscolar(datos.horaFin);

  if(horaFin<=horaInicio){
    throw new Error('La hora final debe ser posterior a la inicial.');
  }

  const hoja=obtenerHoja('HORARIO_SEMANAL');
  const existente=obtenerRegistrosConFila('HORARIO_SEMANAL').find(r=>
    String(r.ID_HORARIO||'').trim()===id&&
    String(r.ID_MAESTRA||'').trim()===
      String(maestra.idMaestra||'').trim()
  );

  const fila=[
    id,
    maestra.idMaestra,
    dia,
    horaInicio,
    horaFin,
    limpiarTexto(datos.asignatura),
    limpiarTexto(datos.grado||maestra.grado||''),
    limpiarTexto(datos.seccion||maestra.seccion||''),
    limpiarTexto(datos.aula||''),
    String(datos.color||'#ff8fc7').trim(),
    limpiarTexto(datos.notas||''),
    String(datos.estado||'ACTIVO').trim().toUpperCase()
  ];

  if(existente){
    hoja.getRange(existente.__fila,1,1,fila.length).setValues([fila]);
    registrarAuditoria(
      maestra.idMaestra,
      'EDITAR',
      'HORARIO_SEMANAL',
      'Clase actualizada: '+String(datos.asignatura||'')
    );
  }else{
    hoja.appendRow(fila);
    registrarAuditoria(
      maestra.idMaestra,
      'CREAR',
      'HORARIO_SEMANAL',
      'Clase creada: '+String(datos.asignatura||'')
    );
  }

  hoja.getRange(
    existente?existente.__fila:hoja.getLastRow(),
    4,
    1,
    2
  ).setNumberFormat('@');

  return {
    idHorario:id,
    dia:dia,
    horaInicio:horaInicio,
    horaFin:horaFin,
    asignatura:limpiarTexto(datos.asignatura),
    grado:limpiarTexto(datos.grado||maestra.grado||''),
    seccion:limpiarTexto(datos.seccion||maestra.seccion||''),
    aula:limpiarTexto(datos.aula||''),
    color:String(datos.color||'#ff8fc7'),
    notas:limpiarTexto(datos.notas||''),
    estado:String(datos.estado||'ACTIVO').toUpperCase()
  };
}

function eliminarHorarioSemanal(token,datos){
  const maestra=verificarSesion(token);
  validarObjeto(datos,['idHorario']);

  const registro=obtenerRegistrosConFila('HORARIO_SEMANAL').find(r=>
    String(r.ID_HORARIO||'').trim()===
      String(datos.idHorario||'').trim()&&
    String(r.ID_MAESTRA||'').trim()===
      String(maestra.idMaestra||'').trim()
  );

  if(!registro)throw new Error('No se encontró la clase.');

  obtenerHoja('HORARIO_SEMANAL').deleteRow(registro.__fila);

  registrarAuditoria(
    maestra.idMaestra,
    'ELIMINAR',
    'HORARIO_SEMANAL',
    'Clase eliminada: '+String(registro.ASIGNATURA||'')
  );

  return {eliminado:true,idHorario:String(datos.idHorario)};
}


function obtenerAlumnoPropioExpediente(idMaestra,idAlumno){
  const alumno=obtenerRegistros('ALUMNOS').find(r=>
    String(r.ID_ALUMNO||'').trim()===String(idAlumno||'').trim()&&
    String(r.ID_MAESTRA||'').trim()===String(idMaestra||'').trim()&&
    String(r.ESTADO||'ACTIVO').trim().toUpperCase()!=='ELIMINADO'
  );

  if(!alumno){
    throw new Error('No se encontró el alumno o no tienes permiso.');
  }

  return alumno;
}

function obtenerExpedienteAlumno(token,datos){
  const maestra=verificarSesion(token);
  validarObjeto(datos,['idAlumno']);
  const alumno=obtenerAlumnoPropioExpediente(
    maestra.idMaestra,
    datos.idAlumno
  );

  const registro=obtenerRegistros('EXPEDIENTES_ALUMNOS').find(r=>
    String(r.ID_ALUMNO||'').trim()===String(datos.idAlumno||'').trim()&&
    String(r.ID_MAESTRA||'').trim()===String(maestra.idMaestra||'').trim()
  );

  return {
    idExpediente:registro?String(registro.ID_EXPEDIENTE||''):'',
    idAlumno:String(alumno.ID_ALUMNO||''),
    foto:registro?String(registro.FOTO||''):'',
    firmaMaestra:registro?String(registro.FIRMA_MAESTRA||''):'',
    firmaRepresentante:registro?String(registro.FIRMA_REPRESENTANTE||''):'',
    alergias:registro?String(registro.ALERGIAS||''):'',
    condicionesMedicas:registro?String(registro.CONDICIONES_MEDICAS||''):'',
    contactoEmergencia:registro?String(registro.CONTACTO_EMERGENCIA||''):'',
    telefonoEmergencia:registro?String(registro.TELEFONO_EMERGENCIA||''):'',
    autorizaciones:registro?String(registro.AUTORIZACIONES||''):'',
    notasPrivadas:registro?String(registro.NOTAS_PRIVADAS||''):'',
    fechaActualizacion:registro&&registro.FECHA_ACTUALIZACION
      ?formatearFechaHora(registro.FECHA_ACTUALIZACION)
      :''
  };
}

function validarImagenExpediente(valor,nombre,maximo){
  const texto=String(valor||'');
  if(!texto)return '';
  if(!texto.startsWith('data:image/')){
    throw new Error(nombre+' no tiene un formato de imagen válido.');
  }
  if(texto.length>maximo){
    throw new Error(
      nombre+' es demasiado grande. Usa una imagen más pequeña.'
    );
  }
  return texto;
}

function guardarExpedienteAlumno(token,datos){
  const maestra=verificarSesion(token);
  validarObjeto(datos,['idAlumno']);
  const alumno=obtenerAlumnoPropioExpediente(
    maestra.idMaestra,
    datos.idAlumno
  );

  const hoja=obtenerHoja('EXPEDIENTES_ALUMNOS');
  const existente=obtenerRegistrosConFila('EXPEDIENTES_ALUMNOS').find(r=>
    String(r.ID_ALUMNO||'').trim()===String(datos.idAlumno||'').trim()&&
    String(r.ID_MAESTRA||'').trim()===String(maestra.idMaestra||'').trim()
  );

  const id=existente
    ?String(existente.ID_EXPEDIENTE||'')
    :generarId('EXP');

  const foto=validarImagenExpediente(
    datos.foto,
    'La foto',
    45000
  );
  const firmaMaestra=validarImagenExpediente(
    datos.firmaMaestra,
    'La firma de la maestra',
    30000
  );
  const firmaRepresentante=validarImagenExpediente(
    datos.firmaRepresentante,
    'La firma del representante',
    30000
  );

  const fila=[
    id,
    maestra.idMaestra,
    String(datos.idAlumno),
    foto,
    firmaMaestra,
    firmaRepresentante,
    limpiarTexto(datos.alergias||''),
    limpiarTexto(datos.condicionesMedicas||''),
    limpiarTexto(datos.contactoEmergencia||''),
    limpiarTexto(datos.telefonoEmergencia||''),
    limpiarTexto(datos.autorizaciones||''),
    limpiarTexto(datos.notasPrivadas||''),
    new Date()
  ];

  if(existente){
    hoja.getRange(existente.__fila,1,1,fila.length).setValues([fila]);
  }else{
    hoja.appendRow(fila);
  }

  registrarAuditoria(
    maestra.idMaestra,
    existente?'EDITAR':'CREAR',
    'EXPEDIENTES_ALUMNOS',
    'Expediente actualizado: '+
      String(alumno.NOMBRE||'')+' '+String(alumno.APELLIDO||'')
  );

  return obtenerExpedienteAlumno(token,{idAlumno:String(datos.idAlumno)});
}


function fechaSuscripcion(valor){
  if(!valor)return '';
  if(valor instanceof Date&&!isNaN(valor.getTime())){
    return Utilities.formatDate(valor,obtenerZonaHorariaAulaMagica(),'yyyy-MM-dd');
  }
  const texto=String(valor).trim();
  const m=texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m?m[1]+'-'+m[2]+'-'+m[3]:texto;
}

function sumarDiasSuscripcion(fecha,dias){
  const d=new Date(fechaSuscripcion(fecha)+'T12:00:00');
  d.setDate(d.getDate()+Number(dias||0));
  return Utilities.formatDate(d,obtenerZonaHorariaAulaMagica(),'yyyy-MM-dd');
}

function diasRestantesSuscripcion(fecha){
  const hoy=Utilities.formatDate(new Date(),obtenerZonaHorariaAulaMagica(),'yyyy-MM-dd');
  return Math.ceil(
    (new Date(fechaSuscripcion(fecha)+'T12:00:00').getTime()-
     new Date(hoy+'T12:00:00').getTime())/86400000
  );
}

function asegurarPlanesPlataforma(){
  const hoja=obtenerHoja('PLANES_PLATAFORMA');
  const encabezados=[
    'ID_PLAN','NOMBRE','DURACION_DIAS','PRECIO_USD',
    'PRECIO_VES','LIMITE_ALUMNOS','ESTADO','DESCRIPCION'
  ];

  hoja.getRange(1,1,1,encabezados.length).setValues([encabezados]);

  if(hoja.getLastRow()===1){
    hoja.getRange(2,1,4,8).setValues([
      ['PLAN_MENSUAL','Mensual',30,10,0,40,'ACTIVO','Acceso por 30 días'],
      ['PLAN_TRIMESTRAL','Trimestral',90,25,0,80,'ACTIVO','Acceso por 90 días'],
      ['PLAN_ANUAL','Anual',365,80,0,120,'ACTIVO','Acceso por 365 días'],
      ['PLAN_PRUEBA','Prueba',30,0,0,10,'ACTIVO','Prueba inicial']
    ]);
    return;
  }

  const ultimaFila=hoja.getLastRow();
  const registros=hoja.getRange(2,1,ultimaFila-1,8).getValues();

  registros.forEach((fila,indice)=>{
    const id=String(fila[0]||'').trim();
    const limiteActual=fila[5];

    if(
      limiteActual===''||
      limiteActual===null||
      typeof limiteActual==='undefined'
    ){
      const limite=
        id==='PLAN_PRUEBA'?10:
        id==='PLAN_MENSUAL'?40:
        id==='PLAN_TRIMESTRAL'?80:
        id==='PLAN_ANUAL'?120:
        40;

      hoja.getRange(indice+2,6).setValue(limite);
    }

    if(!fila[6])hoja.getRange(indice+2,7).setValue('ACTIVO');
  });
}

function asegurarLicencia(idMaestra){
  asegurarPlanesPlataforma();
  let licencia=obtenerRegistrosConFila('LICENCIAS').find(r=>
    String(r.ID_MAESTRA||'')===String(idMaestra)
  );
  if(licencia)return licencia;

  const inicio=Utilities.formatDate(new Date(),obtenerZonaHorariaAulaMagica(),'yyyy-MM-dd');
  const id=generarId('LIC');
  obtenerHoja('LICENCIAS').appendRow([
    id,String(idMaestra),'PLAN_PRUEBA',inicio,
    sumarDiasSuscripcion(inicio,30),'ACTIVA',new Date()
  ]);
  return obtenerRegistrosConFila('LICENCIAS').find(r=>
    String(r.ID_LICENCIA||'')===id
  );
}

function licenciaPublica(r){
  const plan=obtenerRegistros('PLANES_PLATAFORMA').find(p=>
    String(p.ID_PLAN||'')===String(r.ID_PLAN||'')
  )||{};
  const dias=diasRestantesSuscripcion(r.FECHA_VENCIMIENTO);
  let estado=String(r.ESTADO||'ACTIVA').toUpperCase();
  if(estado==='ACTIVA'&&dias<0)estado='VENCIDA';
  else if(estado==='ACTIVA'&&dias<=7)estado='POR_VENCER';
  return {
    idLicencia:String(r.ID_LICENCIA||''),
    idMaestra:String(r.ID_MAESTRA||''),
    idPlan:String(r.ID_PLAN||''),
    plan:String(plan.NOMBRE||r.ID_PLAN||''),
    precioUsd:Number(plan.PRECIO_USD||0),
    precioVes:Number(plan.PRECIO_VES||0),
    fechaInicio:fechaSuscripcion(r.FECHA_INICIO),
    fechaVencimiento:fechaSuscripcion(r.FECHA_VENCIMIENTO),
    estado:estado,
    diasRestantes:dias
  };
}


function obtenerLicenciaMaestraPorId(idMaestra){
  asegurarPlanesPlataforma();
  return asegurarLicencia(idMaestra);
}

function obtenerEstadoAccesoSuscripcion(idMaestra){
  const licencia=obtenerLicenciaMaestraPorId(idMaestra);
  const informacion=licenciaPublica(licencia);

  return {
    permitido:informacion.estado==='ACTIVA'||
      informacion.estado==='POR_VENCER',
    licencia:informacion
  };
}

function mensajePagoSuscripcion(idMaestra){
  const acceso=obtenerEstadoAccesoSuscripcion(idMaestra);
  const licencia=acceso.licencia;
  const plan=obtenerRegistros('PLANES_PLATAFORMA').find(r=>
    String(r.ID_PLAN||'')===String(licencia.idPlan||'')
  )||{};

  const precioUsd=Number(plan.PRECIO_USD||0);
  const precioVes=Number(plan.PRECIO_VES||0);

  return [
    '🔒 SUSCRIPCIÓN VENCIDA',
    '',
    'Tu plan '+String(licencia.plan||'')+
      ' venció el '+String(licencia.fechaVencimiento||'')+'.',
    '',
    'Para continuar usando Aula Mágica debes renovar tu suscripción.',
    '',
    'Precio del plan:',
    '💵 USD: '+precioUsd,
    '🇻🇪 VES: '+precioVes,
    '',
    'Comunícate con el administrador y envía el comprobante de pago.',
    '',
    'Mientras la suscripción esté vencida no podrás usar la plataforma ni el bot de Telegram.'
  ].join('\n');
}

function validarAccesoPorSuscripcion(registroMaestra){
  const correoPropietario='wilmarvelasquez1783@gmail.com';
  const correo=normalizarCorreo(registroMaestra.CORREO);

  if(correo===normalizarCorreo(correoPropietario)){
    return true;
  }

  const acceso=obtenerEstadoAccesoSuscripcion(
    registroMaestra.ID_MAESTRA
  );

  if(!acceso.permitido){
    throw new Error(
      'SUSCRIPCION_REQUERIDA:'+
      mensajePagoSuscripcion(registroMaestra.ID_MAESTRA)
    );
  }

  return true;
}

function validarAccesoTelegramPorSuscripcion(idMaestra){
  const maestra=obtenerRegistros('MAESTRAS').find(r=>
    String(r.ID_MAESTRA||'')===String(idMaestra||'')
  );

  if(!maestra){
    throw new Error('No se encontró la cuenta vinculada.');
  }

  validarAccesoPorSuscripcion(maestra);
  return true;
}


function obtenerLimiteAlumnosMaestra(idMaestra){
  const licencia=asegurarLicencia(idMaestra);
  const plan=obtenerRegistros('PLANES_PLATAFORMA').find(r=>
    String(r.ID_PLAN||'')===String(licencia.ID_PLAN||'')
  );

  if(!plan){
    throw new Error('No se encontró el plan asignado a la cuenta.');
  }

  const limite=Number(plan.LIMITE_ALUMNOS||0);

  return {
    idPlan:String(plan.ID_PLAN||''),
    nombrePlan:String(plan.NOMBRE||'Plan'),
    limite:limite,
    ilimitado:limite<0
  };
}

function contarAlumnosActivosMaestra(idMaestra){
  return obtenerRegistros('ALUMNOS').filter(r=>
    String(r.ID_MAESTRA||'')===String(idMaestra||'')&&
    String(r.ESTADO||'ACTIVO').toUpperCase()!=='ELIMINADO'
  ).length;
}

function validarLimiteAlumnosPlan(idMaestra){
  const configuracion=obtenerLimiteAlumnosMaestra(idMaestra);
  const usados=contarAlumnosActivosMaestra(idMaestra);

  if(configuracion.ilimitado){
    return {
      permitido:true,
      usados:usados,
      limite:-1,
      nombrePlan:configuracion.nombrePlan
    };
  }

  if(usados>=configuracion.limite){
    throw new Error(
      'LIMITE_PLAN:Has alcanzado el límite de '+
      configuracion.limite+' alumnos permitido por tu plan '+
      configuracion.nombrePlan+'. Actualmente tienes '+
      usados+' alumnos registrados. Para agregar otro alumno, debes cambiar a un plan con mayor capacidad. Comunícate con el administrador.'
    );
  }

  return {
    permitido:true,
    usados:usados,
    limite:configuracion.limite,
    disponibles:configuracion.limite-usados,
    nombrePlan:configuracion.nombrePlan
  };
}

function adminGuardarLimitesPlan(token,datos){
  const admin=verificarAdministrador(token);
  validarObjeto(datos,['idPlan','limiteAlumnos']);

  const plan=obtenerRegistrosConFila('PLANES_PLATAFORMA').find(r=>
    String(r.ID_PLAN||'')===String(datos.idPlan||'')
  );

  if(!plan)throw new Error('No se encontró el plan.');

  const limite=Number(datos.limiteAlumnos);

  if(!Number.isFinite(limite)||limite===0||limite<-1){
    throw new Error(
      'El límite debe ser un número mayor que 0, o -1 para ilimitado.'
    );
  }

  obtenerHoja('PLANES_PLATAFORMA')
    .getRange(plan.__fila,6)
    .setValue(limite);

  registrarAuditoria(
    admin.idMaestra,
    'CONFIGURAR_LIMITE',
    'PLANES_PLATAFORMA',
    String(plan.NOMBRE||plan.ID_PLAN)+
      ': '+(limite<0?'Ilimitado':limite+' alumnos')
  );

  return {
    guardado:true,
    idPlan:String(datos.idPlan),
    limiteAlumnos:limite
  };
}


function generarCodigoActivacion(){
  return String(Math.floor(100000+Math.random()*900000));
}

function adminGenerarActivacionCuenta(token,datos){
  const admin=verificarAdministrador(token);
  validarObjeto(datos,['idMaestra','idPlan']);

  const maestra=obtenerRegistrosConFila('MAESTRAS').find(r=>
    String(r.ID_MAESTRA||'')===String(datos.idMaestra||'')
  );

  if(!maestra)throw new Error('No se encontró la maestra.');

  const plan=obtenerRegistros('PLANES_PLATAFORMA').find(r=>
    String(r.ID_PLAN||'')===String(datos.idPlan||'')&&
    String(r.ESTADO||'ACTIVO').toUpperCase()==='ACTIVO'
  );

  if(!plan)throw new Error('No se encontró el plan seleccionado.');

  const codigo=generarCodigoActivacion();
  const fechaCreacion=new Date();
  const fechaExpiracion=new Date(fechaCreacion.getTime()+72*3600000);
  const id=generarId('ACT');

  obtenerRegistrosConFila('ACTIVACIONES_CUENTAS')
    .filter(r=>
      String(r.ID_MAESTRA||'')===String(datos.idMaestra||'')&&
      String(r.ESTADO||'').toUpperCase()==='PENDIENTE'
    )
    .reverse()
    .forEach(r=>
      obtenerHoja('ACTIVACIONES_CUENTAS')
        .getRange(r.__fila,5)
        .setValue('REEMPLAZADA')
    );

  obtenerHoja('ACTIVACIONES_CUENTAS').appendRow([
    id,
    String(datos.idMaestra),
    codigo,
    String(datos.idPlan),
    'PENDIENTE',
    fechaCreacion,
    fechaExpiracion,
    ''
  ]);

  obtenerHoja('MAESTRAS')
    .getRange(maestra.__fila,9)
    .setValue('PENDIENTE');

  registrarAuditoria(
    admin.idMaestra,
    'GENERAR_ACTIVACION',
    'ACTIVACIONES_CUENTAS',
    'Código generado para '+String(maestra.CORREO||'')
  );

  return {
    idActivacion:id,
    codigo:codigo,
    correo:String(maestra.CORREO||''),
    nombre:(
      String(maestra.NOMBRE||'')+' '+String(maestra.APELLIDO||'')
    ).trim(),
    plan:String(plan.NOMBRE||''),
    venceEnHoras:72
  };
}

function activarCuentaConCodigo(datos){
  validarObjeto(datos,['correo','codigo','contrasena']);

  const correo=normalizarCorreo(datos.correo);
  const codigo=String(datos.codigo||'').trim();
  const contrasena=String(datos.contrasena||'');

  if(contrasena.length<6){
    throw new Error('La contraseña debe tener al menos seis caracteres.');
  }

  const maestra=obtenerRegistrosConFila('MAESTRAS').find(r=>
    normalizarCorreo(r.CORREO)===correo
  );

  if(!maestra){
    throw new Error('No se encontró una cuenta con ese correo.');
  }

  const activacion=obtenerRegistrosConFila('ACTIVACIONES_CUENTAS')
    .filter(r=>
      String(r.ID_MAESTRA||'')===String(maestra.ID_MAESTRA||'')&&
      String(r.CODIGO||'').trim()===codigo&&
      String(r.ESTADO||'').toUpperCase()==='PENDIENTE'
    )
    .sort((a,b)=>b.__fila-a.__fila)[0];

  if(!activacion){
    throw new Error('El código es incorrecto o ya fue utilizado.');
  }

  if(new Date(activacion.FECHA_EXPIRACION).getTime()<Date.now()){
    obtenerHoja('ACTIVACIONES_CUENTAS')
      .getRange(activacion.__fila,5)
      .setValue('VENCIDA');
    throw new Error(
      'El código venció. Solicita uno nuevo al administrador.'
    );
  }

  const plan=obtenerRegistros('PLANES_PLATAFORMA').find(r=>
    String(r.ID_PLAN||'')===String(activacion.ID_PLAN||'')
  );

  if(!plan)throw new Error('El plan de activación no está disponible.');

  const inicio=Utilities.formatDate(
    new Date(),
    obtenerZonaHorariaAulaMagica(),
    'yyyy-MM-dd'
  );
  const vencimiento=sumarDiasSuscripcion(
    inicio,
    Number(plan.DURACION_DIAS||30)
  );

  obtenerHoja('MAESTRAS').getRange(
    maestra.__fila,
    6,
    1,
    4
  ).setValues([[
    crearHashContrasena(contrasena),
    String(maestra.GRADO||''),
    String(maestra.SECCION||''),
    'ACTIVA'
  ]]);

  const licencia=asegurarLicencia(maestra.ID_MAESTRA);
  obtenerHoja('LICENCIAS').getRange(
    licencia.__fila,
    1,
    1,
    7
  ).setValues([[
    String(licencia.ID_LICENCIA),
    String(maestra.ID_MAESTRA),
    String(plan.ID_PLAN),
    inicio,
    vencimiento,
    'ACTIVA',
    new Date()
  ]]);

  obtenerHoja('ACTIVACIONES_CUENTAS').getRange(
    activacion.__fila,
    5,
    1,
    4
  ).setValues([[
    'UTILIZADA',
    activacion.FECHA_CREACION,
    activacion.FECHA_EXPIRACION,
    new Date()
  ]]);

  registrarAuditoria(
    maestra.ID_MAESTRA,
    'ACTIVAR_CUENTA',
    'ACTIVACIONES_CUENTAS',
    'Cuenta activada con plan '+String(plan.NOMBRE||plan.ID_PLAN)
  );

  return {
    activada:true,
    plan:String(plan.NOMBRE||''),
    fechaVencimiento:vencimiento
  };
}


function limpiarComprobantePago(valor){
  const texto=String(valor||'').trim();
  if(!texto)return '';

  if(texto.length>48000){
    throw new Error(
      'El comprobante es demasiado grande. Selecciona una imagen más pequeña.'
    );
  }

  if(
    !texto.startsWith('data:image/jpeg;base64,')&&
    !texto.startsWith('data:image/png;base64,')&&
    !texto.startsWith('data:image/webp;base64,')
  ){
    throw new Error('El formato del comprobante no es válido.');
  }

  return texto;
}

function solicitudPagoPublica(r){
  const plan=obtenerRegistros('PLANES_PLATAFORMA').find(p=>
    String(p.ID_PLAN||'')===String(r.ID_PLAN||'')
  )||{};

  const maestra=obtenerRegistros('MAESTRAS').find(m=>
    String(m.ID_MAESTRA||'')===String(r.ID_MAESTRA||'')
  )||{};

  return {
    idSolicitud:String(r.ID_SOLICITUD||''),
    idMaestra:String(r.ID_MAESTRA||''),
    nombreMaestra:(
      String(maestra.NOMBRE||'')+' '+String(maestra.APELLIDO||'')
    ).trim(),
    correo:String(maestra.CORREO||''),
    idPlan:String(r.ID_PLAN||''),
    plan:String(plan.NOMBRE||r.ID_PLAN||''),
    monto:Number(r.MONTO||0),
    moneda:String(r.MONEDA||'USD').toUpperCase(),
    metodo:String(r.METODO||''),
    referencia:String(r.REFERENCIA||''),
    comprobante:String(r.COMPROBANTE||''),
    estado:String(r.ESTADO||'PENDIENTE').toUpperCase(),
    fechaSolicitud:fechaSuscripcion(r.FECHA_SOLICITUD),
    fechaRevision:fechaSuscripcion(r.FECHA_REVISION),
    notasCliente:String(r.NOTAS_CLIENTE||''),
    notasAdmin:String(r.NOTAS_ADMIN||'')
  };
}

function crearSolicitudPago(token,datos){
  const maestra=verificarSesion(token);
  validarObjeto(datos,['idPlan','monto','moneda','metodo','comprobante']);

  const plan=obtenerRegistros('PLANES_PLATAFORMA').find(r=>
    String(r.ID_PLAN||'')===String(datos.idPlan||'')&&
    String(r.ESTADO||'ACTIVO').toUpperCase()==='ACTIVO'
  );

  if(!plan)throw new Error('No se encontró el plan seleccionado.');

  const pendiente=obtenerRegistros('SOLICITUDES_PAGO').find(r=>
    String(r.ID_MAESTRA||'')===String(maestra.idMaestra||'')&&
    String(r.ESTADO||'').toUpperCase()==='PENDIENTE'
  );

  if(pendiente){
    throw new Error(
      'Ya tienes una solicitud de pago pendiente de revisión.'
    );
  }

  const id=generarId('SOLPAG');
  obtenerHoja('SOLICITUDES_PAGO').appendRow([
    id,
    String(maestra.idMaestra),
    String(datos.idPlan),
    Number(datos.monto||0),
    String(datos.moneda||'USD').toUpperCase(),
    limpiarTexto(datos.metodo||''),
    limpiarTexto(datos.referencia||''),
    limpiarComprobantePago(datos.comprobante),
    'PENDIENTE',
    new Date(),
    '',
    '',
    limpiarTexto(datos.notas||''),
    ''
  ]);

  registrarAuditoria(
    maestra.idMaestra,
    'CREAR',
    'SOLICITUDES_PAGO',
    'Solicitud de pago enviada: '+id
  );

  return {
    guardado:true,
    idSolicitud:id,
    estado:'PENDIENTE'
  };
}

function listarMisSolicitudesPago(token){
  const maestra=verificarSesion(token);
  return obtenerRegistros('SOLICITUDES_PAGO')
    .filter(r=>
      String(r.ID_MAESTRA||'')===String(maestra.idMaestra||'')
    )
    .map(solicitudPagoPublica)
    .sort((a,b)=>b.fechaSolicitud.localeCompare(a.fechaSolicitud));
}

function adminListarSolicitudesPago(token){
  verificarAdministrador(token);

  return obtenerRegistros('SOLICITUDES_PAGO')
    .map(solicitudPagoPublica)
    .sort((a,b)=>{
      if(a.estado==='PENDIENTE'&&b.estado!=='PENDIENTE')return -1;
      if(a.estado!=='PENDIENTE'&&b.estado==='PENDIENTE')return 1;
      return b.fechaSolicitud.localeCompare(a.fechaSolicitud);
    });
}

function adminRevisarSolicitudPago(token,datos){
  const admin=verificarAdministrador(token);
  validarObjeto(datos,['idSolicitud','decision']);

  const decision=String(datos.decision||'').toUpperCase();
  if(!['APROBAR','RECHAZAR'].includes(decision)){
    throw new Error('La decisión no es válida.');
  }

  const solicitud=obtenerRegistrosConFila('SOLICITUDES_PAGO').find(r=>
    String(r.ID_SOLICITUD||'')===String(datos.idSolicitud||'')
  );

  if(!solicitud)throw new Error('No se encontró la solicitud.');

  if(String(solicitud.ESTADO||'').toUpperCase()!=='PENDIENTE'){
    throw new Error('Esta solicitud ya fue revisada.');
  }

  const nuevoEstado=decision==='APROBAR'?'APROBADA':'RECHAZADA';

  obtenerHoja('SOLICITUDES_PAGO').getRange(
    solicitud.__fila,
    9,
    1,
    6
  ).setValues([[
    nuevoEstado,
    solicitud.FECHA_SOLICITUD,
    new Date(),
    String(admin.idMaestra),
    String(solicitud.NOTAS_CLIENTE||''),
    limpiarTexto(datos.notasAdmin||'')
  ]]);

  let vencimiento='';

  if(decision==='APROBAR'){
    const licencia=asegurarLicencia(solicitud.ID_MAESTRA);

    const pago=adminRegistrarPagoSuscripcion(token,{
      idMaestra:String(solicitud.ID_MAESTRA),
      idLicencia:String(licencia.ID_LICENCIA),
      idPlan:String(solicitud.ID_PLAN),
      monto:Number(solicitud.MONTO||0),
      moneda:String(solicitud.MONEDA||'USD'),
      metodo:String(solicitud.METODO||''),
      referencia:String(solicitud.REFERENCIA||''),
      fechaPago:fechaSuscripcion(new Date()),
      notas:
        'Pago aprobado desde solicitud '+
        String(solicitud.ID_SOLICITUD),
      renovarLicencia:true
    });

    vencimiento=String(pago.vencimiento||'');
  }

  registrarAuditoria(
    admin.idMaestra,
    decision,
    'SOLICITUDES_PAGO',
    'Solicitud '+String(solicitud.ID_SOLICITUD)
  );

  return {
    actualizado:true,
    estado:nuevoEstado,
    vencimiento:vencimiento
  };
}

function adminObtenerSuscripciones(token){
  verificarAdministrador(token);
  asegurarPlanesPlataforma();
  const maestras=obtenerRegistros('MAESTRAS');
  maestras.forEach(m=>asegurarLicencia(m.ID_MAESTRA));

  const licencias=obtenerRegistros('LICENCIAS').map(r=>{
    const m=maestras.find(x=>String(x.ID_MAESTRA)===String(r.ID_MAESTRA))||{};
    return Object.assign(licenciaPublica(r),{
      nombreMaestra:(String(m.NOMBRE||'')+' '+String(m.APELLIDO||'')).trim(),
      correo:String(m.CORREO||'')
    });
  });

  const planes=obtenerRegistros('PLANES_PLATAFORMA').map(r=>({
    idPlan:String(r.ID_PLAN||''),
    nombre:String(r.NOMBRE||''),
    duracionDias:Number(r.DURACION_DIAS||0),
    precioUsd:Number(r.PRECIO_USD||0),
    precioVes:Number(r.PRECIO_VES||0),
    limiteAlumnos:Number(r.LIMITE_ALUMNOS||0),
    estado:String(r.ESTADO||'ACTIVO'),
    descripcion:String(r.DESCRIPCION||'')
  }));

  const pagos=obtenerRegistros('PAGOS_SUSCRIPCIONES').map(r=>({
    idPago:String(r.ID_PAGO||''),
    idMaestra:String(r.ID_MAESTRA||''),
    monto:Number(r.MONTO||0),
    moneda:String(r.MONEDA||'USD').toUpperCase(),
    fechaPago:fechaSuscripcion(r.FECHA_PAGO),
    estado:String(r.ESTADO||'CONFIRMADO')
  }));

  return {
    planes:planes,
    licencias:licencias,
    pagos:pagos,
    resumen:{
      total:licencias.length,
      activas:licencias.filter(x=>x.estado==='ACTIVA').length,
      porVencer:licencias.filter(x=>x.estado==='POR_VENCER').length,
      vencidas:licencias.filter(x=>x.estado==='VENCIDA').length,
      suspendidas:licencias.filter(x=>['SUSPENDIDA','BLOQUEADA'].includes(x.estado)).length,
      ingresosUsd:pagos
        .filter(x=>x.estado==='CONFIRMADO'&&x.moneda==='USD')
        .reduce((s,x)=>s+x.monto,0),
      ingresosVes:pagos
        .filter(x=>x.estado==='CONFIRMADO'&&x.moneda==='VES')
        .reduce((s,x)=>s+x.monto,0)
    }
  };
}

function adminActivarSuscripcion(token,datos){
  const admin=verificarAdministrador(token);
  validarObjeto(datos,['idMaestra','idPlan']);
  const plan=obtenerRegistros('PLANES_PLATAFORMA').find(r=>
    String(r.ID_PLAN||'')===String(datos.idPlan)
  );
  if(!plan)throw new Error('No se encontró el plan.');

  const licencia=asegurarLicencia(datos.idMaestra);
  const hoy=Utilities.formatDate(new Date(),obtenerZonaHorariaAulaMagica(),'yyyy-MM-dd');
  const base=Boolean(datos.extender)&&diasRestantesSuscripcion(licencia.FECHA_VENCIMIENTO)>=0
    ?fechaSuscripcion(licencia.FECHA_VENCIMIENTO):hoy;
  const vencimiento=sumarDiasSuscripcion(base,Number(plan.DURACION_DIAS||30));

  obtenerHoja('LICENCIAS').getRange(licencia.__fila,1,1,7).setValues([[
    String(licencia.ID_LICENCIA),String(datos.idMaestra),String(datos.idPlan),
    hoy,vencimiento,'ACTIVA',new Date()
  ]]);

  registrarAuditoria(admin.idMaestra,'ACTIVAR','LICENCIAS',
    'Suscripción activada hasta '+vencimiento);

  return {guardado:true,vencimiento:vencimiento};
}

function adminCambiarEstadoSuscripcion(token,datos){
  const admin=verificarAdministrador(token);
  validarObjeto(datos,['idLicencia','estado']);
  const estado=String(datos.estado).toUpperCase();
  if(!['ACTIVA','SUSPENDIDA','BLOQUEADA','CANCELADA'].includes(estado)){
    throw new Error('Estado no válido.');
  }
  const r=obtenerRegistrosConFila('LICENCIAS').find(x=>
    String(x.ID_LICENCIA||'')===String(datos.idLicencia)
  );
  if(!r)throw new Error('No se encontró la licencia.');
  obtenerHoja('LICENCIAS').getRange(r.__fila,6,1,2).setValues([[estado,new Date()]]);
  registrarAuditoria(admin.idMaestra,'CAMBIAR_ESTADO','LICENCIAS',estado);
  return {actualizado:true};
}

function adminRegistrarPagoSuscripcion(token,datos){
  const admin=verificarAdministrador(token);
  validarObjeto(datos,['idMaestra','idLicencia','idPlan','monto']);
  const id=generarId('PAG');
  obtenerHoja('PAGOS_SUSCRIPCIONES').appendRow([
    id,String(datos.idMaestra),String(datos.idLicencia),String(datos.idPlan),
    Number(datos.monto||0),
    String(datos.moneda||'USD').toUpperCase(),
    limpiarTexto(datos.metodo||''),
    limpiarTexto(datos.referencia||''),'CONFIRMADO',
    fechaSuscripcion(datos.fechaPago)||fechaSuscripcion(new Date()),
    limpiarTexto(datos.notas||'')
  ]);

  let renovacion=null;

  if(datos.renovarLicencia!==false){
    renovacion=adminActivarSuscripcion(token,{
      idMaestra:String(datos.idMaestra),
      idPlan:String(datos.idPlan),
      extender:true
    });
  }

  registrarAuditoria(admin.idMaestra,'REGISTRAR_PAGO','PAGOS_SUSCRIPCIONES',
    'Pago '+String(datos.monto));

  return {
    guardado:true,
    idPago:id,
    renovada:Boolean(renovacion),
    vencimiento:renovacion?String(renovacion.vencimiento||''):''
  };
}

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
  validarAccesoPorSuscripcion(m);
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
  validarAccesoPorSuscripcion(m);
  return maestraPublica(m);
}
function maestraPublica(m){
  const correoPropietario='wilmarvelasquez1783@gmail.com';
  const correoAdmin=obtenerConfiguracionValor(
    'ADMIN_CORREO',
    correoPropietario
  );
  const correoMaestra=normalizarCorreo(m.CORREO);

  return {
    idMaestra:String(m.ID_MAESTRA),
    nombre:String(m.NOMBRE),
    apellido:String(m.APELLIDO),
    correo:String(m.CORREO),
    usuario:String(m.USUARIO),
    grado:String(m.GRADO||''),
    seccion:String(m.SECCION||''),
    esAdmin:Boolean(
      correoMaestra===normalizarCorreo(correoPropietario)||
      correoMaestra===normalizarCorreo(correoAdmin)
    )
  };
}
function cerrarSesion(token){ const h=obtenerHoja('SESIONES'), r=obtenerRegistrosConFila('SESIONES').find(x=>String(x.TOKEN)===String(token)); if(r) h.getRange(r.__fila,5).setValue('CERRADA'); return {cerrado:true}; }

function crearAlumno(token,datos){
  const m=verificarSesion(token);
  validarObjeto(datos,['nombre','apellido']);
  validarLimiteAlumnosPlan(m.idMaestra);
  const a={idAlumno:generarId('ALU'),idMaestra:m.idMaestra,nombre:limpiarTexto(datos.nombre),apellido:limpiarTexto(datos.apellido),documento:limpiarTexto(datos.documento||''),fechaNacimiento:limpiarTexto(datos.fechaNacimiento||''),sexo:limpiarTexto(datos.sexo||''),grado:limpiarTexto(datos.grado||m.grado||''),seccion:limpiarTexto(datos.seccion||m.seccion||''),representante:limpiarTexto(datos.representante||''),telefono:limpiarTexto(datos.telefono||''),direccion:limpiarTexto(datos.direccion||''),observaciones:limpiarTexto(datos.observaciones||''),estado:'ACTIVO',fechaRegistro:new Date()};
  obtenerHoja('ALUMNOS').appendRow([a.idAlumno,a.idMaestra,a.nombre,a.apellido,a.documento,a.fechaNacimiento,a.sexo,a.grado,a.seccion,a.representante,a.telefono,a.direccion,a.observaciones,a.estado,a.fechaRegistro]);
  registrarAuditoria(m.idMaestra,'CREAR','ALUMNOS','Alumno creado: '+a.nombre+' '+a.apellido); return a;
}
function listarAlumnos(token){ const m=verificarSesion(token); return obtenerRegistros('ALUMNOS').filter(r=>String(r.ID_MAESTRA||'').trim()===String(m.idMaestra||'').trim()&&String(r.ESTADO).toUpperCase()!=='ELIMINADO').map(convertirAlumno).sort((a,b)=>(a.nombre+' '+a.apellido).localeCompare(b.nombre+' '+b.apellido)); }
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
  const m=verificarSesion(token);
  validarObjeto(datos,['fecha']);

  const fecha=normalizarFechaAsistencia(datos.fecha);
  const alumnos=obtenerRegistros('ALUMNOS')
    .filter(r=>
      String(r.ID_MAESTRA||'').trim()===String(m.idMaestra||'').trim()&&
      String(r.ESTADO).toUpperCase()!=='ELIMINADO'
    );

  const registros=obtenerRegistrosConFila('ASISTENCIA')
    .filter(r=>
      String(r.ID_MAESTRA||'').trim()===String(m.idMaestra||'').trim()&&
      normalizarFechaAsistencia(r.FECHA)===fecha
    );

  // Para cada alumno usamos siempre el registro más reciente.
  // Esto evita que filas antiguas o duplicadas oculten el cambio hecho desde Telegram.
  const porAlumno={};
  registros.forEach(r=>{
    const idAlumno=String(r.ID_ALUMNO||'').trim();
    if(!idAlumno)return;

    const fechaRegistro=obtenerTimestampAsistencia(r.FECHA_REGISTRO);
    const existente=porAlumno[idAlumno];

    if(
      !existente||
      fechaRegistro>existente.__timestamp||
      (
        fechaRegistro===existente.__timestamp&&
        Number(r.__fila||0)>Number(existente.__fila||0)
      )
    ){
      porAlumno[idAlumno]={
        estado:String(r.ESTADO||'').trim().toUpperCase(),
        observaciones:String(r.OBSERVACIONES||''),
        __timestamp:fechaRegistro,
        __fila:Number(r.__fila||0)
      };
    }
  });

  return alumnos.map(r=>{
    const existente=porAlumno[String(r.ID_ALUMNO||'').trim()]||{};
    return {
      idAlumno:String(r.ID_ALUMNO||''),
      nombre:String(r.NOMBRE||''),
      apellido:String(r.APELLIDO||''),
      sexo:String(r.SEXO||''),
      grado:String(r.GRADO||''),
      seccion:String(r.SECCION||''),
      estado:existente.estado||'',
      observaciones:existente.observaciones||''
    };
  }).sort((a,b)=>
    (a.nombre+' '+a.apellido).localeCompare(b.nombre+' '+b.apellido)
  );
}

function listarResumenMensualAsistencia(token,datos){
  const maestra=verificarSesion(token);
  validarObjeto(datos,['mes']);

  const mes=String(datos.mes||'').trim();
  if(!/^\d{4}-\d{2}$/.test(mes)){
    throw new Error('El mes debe tener el formato AAAA-MM.');
  }

  const partes=mes.split('-').map(Number);
  const totalDias=new Date(partes[0],partes[1],0).getDate();
  const dias=Array.from({length:totalDias},(_,indice)=>indice+1);

  const alumnos=obtenerRegistros('ALUMNOS')
    .filter(r=>
      String(r.ID_MAESTRA||'').trim()===String(maestra.idMaestra||'').trim()&&
      String(r.ESTADO||'').trim().toUpperCase()!=='ELIMINADO'
    )
    .map(r=>({
      idAlumno:String(r.ID_ALUMNO||''),
      nombre:String(r.NOMBRE||''),
      apellido:String(r.APELLIDO||''),
      grado:String(r.GRADO||''),
      seccion:String(r.SECCION||'')
    }))
    .sort((a,b)=>
      (a.nombre+' '+a.apellido).localeCompare(b.nombre+' '+b.apellido)
    );

  const registros=obtenerRegistrosConFila('ASISTENCIA')
    .filter(r=>
      String(r.ID_MAESTRA||'').trim()===String(maestra.idMaestra||'').trim()&&
      normalizarFechaAsistencia(r.FECHA).slice(0,7)===mes
    );

  const ultimos={};

  registros.forEach(r=>{
    const idAlumno=String(r.ID_ALUMNO||'').trim();
    const fecha=normalizarFechaAsistencia(r.FECHA);
    const clave=idAlumno+'|'+fecha;
    const timestamp=obtenerTimestampAsistencia(r.FECHA_REGISTRO);
    const actual=ultimos[clave];

    if(
      !actual||
      timestamp>actual.__timestamp||
      (
        timestamp===actual.__timestamp&&
        Number(r.__fila||0)>Number(actual.__fila||0)
      )
    ){
      ultimos[clave]={
        idAsistencia:String(r.ID_ASISTENCIA||''),
        idAlumno:idAlumno,
        fecha:fecha,
        estado:String(r.ESTADO||'').trim().toUpperCase(),
        observaciones:String(r.OBSERVACIONES||''),
        __timestamp:timestamp,
        __fila:Number(r.__fila||0)
      };
    }
  });

  const totales={
    PRESENTE:0,
    AUSENTE:0,
    TARDE:0,
    JUSTIFICADO:0,
    SIN_MARCAR:0
  };

  const filas=alumnos.map(alumno=>{
    const estados={};
    const resumen={
      PRESENTE:0,
      AUSENTE:0,
      TARDE:0,
      JUSTIFICADO:0,
      SIN_MARCAR:0
    };

    dias.forEach(dia=>{
      const fecha=mes+'-'+String(dia).padStart(2,'0');
      const registro=ultimos[alumno.idAlumno+'|'+fecha];
      const estado=registro?registro.estado:'';

      estados[String(dia)]=estado;

      if(estado&&Object.prototype.hasOwnProperty.call(resumen,estado)){
        resumen[estado]++;
        totales[estado]++;
      }else{
        resumen.SIN_MARCAR++;
        totales.SIN_MARCAR++;
      }
    });

    return Object.assign({},alumno,{
      estados:estados,
      resumen:resumen
    });
  });

  const nombrePorId={};
  alumnos.forEach(a=>{
    nombrePorId[a.idAlumno]=(a.nombre+' '+a.apellido).trim();
  });

  const inasistencias=Object.keys(ultimos)
    .map(clave=>ultimos[clave])
    .filter(r=>['AUSENTE','TARDE','JUSTIFICADO'].includes(r.estado))
    .map(r=>({
      idAsistencia:r.idAsistencia,
      idAlumno:r.idAlumno,
      nombreAlumno:nombrePorId[r.idAlumno]||'Alumno',
      fecha:r.fecha,
      estado:r.estado,
      observaciones:r.observaciones
    }))
    .sort((a,b)=>
      b.fecha.localeCompare(a.fecha)||
      a.nombreAlumno.localeCompare(b.nombreAlumno)
    );

  return {
    mes:mes,
    dias:dias,
    alumnos:filas,
    totales:totales,
    inasistencias:inasistencias
  };
}


function configurarBaulDigital(){
  crearEstructuraInicial();

  const configuraciones=[
    ['BAUL_WHATSAPP','573000000000','WhatsApp de ventas con código de país'],
    ['BAUL_BANCO','Configurar banco','Banco para pago móvil'],
    ['BAUL_TELEFONO','3000000000','Teléfono del pago móvil'],
    ['BAUL_DOCUMENTO','Configurar documento','Documento del titular'],
    ['BAUL_TITULAR','Configurar titular','Nombre del titular'],
    ['BAUL_MONEDA','COP','Moneda mostrada en Mi Baúl']
  ];

  const hoja=obtenerHoja('CONFIGURACION');
  const existentes=obtenerRegistrosConFila('CONFIGURACION');

  configuraciones.forEach(fila=>{
    const actual=existentes.find(r=>
      String(r.CLAVE||'').trim()===fila[0]
    );

    if(!actual){
      hoja.appendRow(fila);
    }
  });

  const materiales=obtenerHoja('MATERIALES_BAUL');
  materiales.setTabColor('#b779ff');
  materiales.getRange('F:F').setNumberFormat('#,##0');
  materiales.getRange('K:K').setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(['ACTIVO','OCULTO'],true)
      .build()
  );
  materiales.getRange('J:J').setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(['SI','NO'],true)
      .build()
  );

  const compras=obtenerHoja('COMPRAS_BAUL');
  compras.setTabColor('#ff8fc7');
  compras.getRange('E:E').setNumberFormat('#,##0');
  compras.getRange('F:F').setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(['PENDIENTE','PAGADO','CANCELADO'],true)
      .build()
  );

  SpreadsheetApp.getUi().alert(
    'Mi Baúl Digital',
    'Se crearon MATERIALES_BAUL y COMPRAS_BAUL. '+
    'Completa los datos de pago en CONFIGURACION y publica tus materiales.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function obtenerConfiguracionValorBaul(clave,valorPorDefecto){
  const registro=obtenerRegistros('CONFIGURACION').find(r=>
    String(r.CLAVE||'').trim()===String(clave||'').trim()
  );

  return registro
    ?String(registro.VALOR||valorPorDefecto||'').trim()
    :String(valorPorDefecto||'').trim();
}

function obtenerConfiguracionBaul(){
  return {
    whatsapp:obtenerConfiguracionValorBaul(
      'BAUL_WHATSAPP',
      '573000000000'
    ),
    banco:obtenerConfiguracionValorBaul(
      'BAUL_BANCO',
      'Configurar banco'
    ),
    telefono:obtenerConfiguracionValorBaul(
      'BAUL_TELEFONO',
      '3000000000'
    ),
    documento:obtenerConfiguracionValorBaul(
      'BAUL_DOCUMENTO',
      'Configurar documento'
    ),
    titular:obtenerConfiguracionValorBaul(
      'BAUL_TITULAR',
      'Configurar titular'
    ),
    moneda:obtenerConfiguracionValorBaul('BAUL_MONEDA','COP')
  };
}

function normalizarBooleanoBaul(valor){
  return ['SI','SÍ','TRUE','1','YES'].includes(
    String(valor||'').trim().toUpperCase()
  );
}

function listarMaterialesBaul(token,datos){
  const maestra=verificarSesion(token);
  const idMaestra=String(maestra.idMaestra||'').trim();

  const compras=obtenerRegistros('COMPRAS_BAUL').filter(r=>
    String(r.ID_MAESTRA||'').trim()===idMaestra
  );

  const materiales=obtenerRegistros('MATERIALES_BAUL')
    .filter(r=>
      String(r.ESTADO||'ACTIVO').trim().toUpperCase()==='ACTIVO'
    )
    .map(r=>{
      const idMaterial=String(r.ID_MATERIAL||'').trim();
      const comprasMaterial=compras.filter(c=>
        String(c.ID_MATERIAL||'').trim()===idMaterial
      );

      const pagada=comprasMaterial.find(c=>
        String(c.ESTADO||'').trim().toUpperCase()==='PAGADO'
      );

      const pendiente=comprasMaterial.find(c=>
        String(c.ESTADO||'').trim().toUpperCase()==='PENDIENTE'
      );

      return {
        idMaterial:idMaterial,
        titulo:String(r.TITULO||''),
        descripcion:String(r.DESCRIPCION||''),
        categoria:String(r.CATEGORIA||'Otros'),
        nivel:String(r.NIVEL||'Todos'),
        precio:Number(r.PRECIO||0),
        imagenUrl:String(r.IMAGEN_URL||''),
        etiqueta:String(r.ETIQUETA||''),
        destacado:normalizarBooleanoBaul(r.DESTACADO),
        desbloqueado:Boolean(pagada),
        compraPendiente:Boolean(pendiente),
        archivoUrl:pagada?String(r.ARCHIVO_URL||''):'',
        fechaPublicacion:formatearFechaParaFormulario(
          r.FECHA_PUBLICACION
        )
      };
    })
    .sort((a,b)=>
      Number(b.destacado)-Number(a.destacado)||
      a.categoria.localeCompare(b.categoria)||
      a.titulo.localeCompare(b.titulo)
    );

  const categorias=[...new Set(
    materiales.map(m=>m.categoria).filter(Boolean)
  )].sort();

  return {
    materiales:materiales,
    categorias:categorias,
    pago:obtenerConfiguracionBaul()
  };
}

function solicitarCompraBaul(token,datos){
  const maestra=verificarSesion(token);
  validarObjeto(datos,['idMaterial']);

  const idMaestra=String(maestra.idMaestra||'').trim();
  const idMaterial=String(datos.idMaterial||'').trim();

  const material=obtenerRegistros('MATERIALES_BAUL').find(r=>
    String(r.ID_MATERIAL||'').trim()===idMaterial&&
    String(r.ESTADO||'ACTIVO').trim().toUpperCase()==='ACTIVO'
  );

  if(!material){
    throw new Error('El material ya no está disponible.');
  }

  const compras=obtenerRegistrosConFila('COMPRAS_BAUL').filter(r=>
    String(r.ID_MATERIAL||'').trim()===idMaterial&&
    String(r.ID_MAESTRA||'').trim()===idMaestra
  );

  const pagada=compras.find(r=>
    String(r.ESTADO||'').trim().toUpperCase()==='PAGADO'
  );

  if(pagada){
    return {
      yaComprado:true,
      idCompra:String(pagada.ID_COMPRA||''),
      mensaje:'Este material ya está desbloqueado.'
    };
  }

  let pendiente=compras.find(r=>
    String(r.ESTADO||'').trim().toUpperCase()==='PENDIENTE'
  );

  if(!pendiente){
    const idCompra=generarId('COM');
    obtenerHoja('COMPRAS_BAUL').appendRow([
      idCompra,
      idMaterial,
      idMaestra,
      new Date(),
      Number(material.PRECIO||0),
      'PENDIENTE',
      '',
      ''
    ]);

    pendiente={ID_COMPRA:idCompra};
  }

  registrarAuditoria(
    idMaestra,
    'SOLICITAR',
    'MI_BAUL',
    'Solicitud de compra: '+String(material.TITULO||'Material')
  );

  return {
    yaComprado:false,
    idCompra:String(pendiente.ID_COMPRA||''),
    titulo:String(material.TITULO||''),
    precio:Number(material.PRECIO||0),
    pago:obtenerConfiguracionBaul(),
    mensaje:'Solicitud creada. Envía el comprobante por WhatsApp.'
  };
}


function obtenerTimestampAsistencia(valor){
  if(!valor)return 0;
  if(
    Object.prototype.toString.call(valor)==='[object Date]'&&
    !Number.isNaN(valor.getTime())
  ){
    return valor.getTime();
  }

  const texto=String(valor).trim();

  // Formato habitual de Google Sheets: dd/MM/yyyy HH:mm:ss
  const coincidencia=texto.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );
  if(coincidencia){
    return new Date(
      Number(coincidencia[3]),
      Number(coincidencia[2])-1,
      Number(coincidencia[1]),
      Number(coincidencia[4]||0),
      Number(coincidencia[5]||0),
      Number(coincidencia[6]||0)
    ).getTime();
  }

  const fecha=new Date(texto);
  return Number.isNaN(fecha.getTime())?0:fecha.getTime();
}


function guardarAsistencia(token,datos){
  const m=verificarSesion(token); validarObjeto(datos,['fecha','registros']);
  if(!Array.isArray(datos.registros)) throw new Error('Los registros de asistencia no son válidos.');
  const fecha=normalizarFechaAsistencia(datos.fecha);
  const estadosPermitidos=['PRESENTE','AUSENTE','TARDE','JUSTIFICADO'];
  const alumnosValidos={};
  obtenerRegistros('ALUMNOS').forEach(r=>{
    if(String(r.ID_MAESTRA||'').trim()===String(m.idMaestra||'').trim()&&String(r.ESTADO).toUpperCase()!=='ELIMINADO') alumnosValidos[String(r.ID_ALUMNO)]=true;
  });
  const hoja=obtenerHoja('ASISTENCIA');
  const existentes={};
  obtenerRegistrosConFila('ASISTENCIA').forEach(r=>{
    if(String(r.ID_MAESTRA||'').trim()===String(m.idMaestra||'').trim()&&normalizarFechaAsistencia(r.FECHA)===fecha) existentes[String(r.ID_ALUMNO)]=r;
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

function obtenerZonaHorariaAulaMagica(){
  try{
    const zona=SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
    return zona||Session.getScriptTimeZone()||'America/Bogota';
  }catch(_){
    return Session.getScriptTimeZone()||'America/Bogota';
  }
}

function normalizarFechaAsistencia(valor){
  if(!valor) throw new Error('La fecha es obligatoria.');

  const zona=obtenerZonaHorariaAulaMagica();

  if(
    Object.prototype.toString.call(valor)==='[object Date]'&&
    !Number.isNaN(valor.getTime())
  ){
    return Utilities.formatDate(valor,zona,'yyyy-MM-dd');
  }

  const texto=String(valor).trim();

  if(/^\d{4}-\d{2}-\d{2}$/.test(texto)) return texto;

  const formatoLatino=texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if(formatoLatino){
    return [
      formatoLatino[3],
      String(formatoLatino[2]).padStart(2,'0'),
      String(formatoLatino[1]).padStart(2,'0')
    ].join('-');
  }

  const fecha=new Date(texto);
  if(Number.isNaN(fecha.getTime())) throw new Error('La fecha no es válida.');

  return Utilities.formatDate(fecha,zona,'yyyy-MM-dd');
}


function listarCalificaciones(token){
  const m=verificarSesion(token);
  const alumnos={};
  obtenerRegistros('ALUMNOS').forEach(r=>{
    if(String(r.ID_MAESTRA||'').trim()===String(m.idMaestra||'').trim()&&String(r.ESTADO).toUpperCase()!=='ELIMINADO'){
      alumnos[String(r.ID_ALUMNO)]=String(r.NOMBRE||'')+' '+String(r.APELLIDO||'');
    }
  });
  return obtenerRegistros('CALIFICACIONES')
    .filter(r=>String(r.ID_MAESTRA||'').trim()===String(m.idMaestra||'').trim()&&alumnos[String(r.ID_ALUMNO)])
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
    String(r.ID_MAESTRA||'').trim()===String(m.idMaestra||'').trim()&&
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
function obtenerCarpetaRespaldosAulaMagica(){
  const propiedades=PropertiesService.getScriptProperties();
  const idGuardado=propiedades.getProperty('CARPETA_RESPALDOS_AULA_MAGICA');

  if(idGuardado){
    try{
      return DriveApp.getFolderById(idGuardado);
    }catch(_){
      propiedades.deleteProperty('CARPETA_RESPALDOS_AULA_MAGICA');
    }
  }

  const carpeta=DriveApp.createFolder('Respaldos Aula Mágica');
  propiedades.setProperty(
    'CARPETA_RESPALDOS_AULA_MAGICA',
    carpeta.getId()
  );

  return carpeta;
}

function crearCopiaRespaldoAulaMagica(){
  const archivo=DriveApp.getFileById(
    SpreadsheetApp.getActiveSpreadsheet().getId()
  );

  const fecha=Utilities.formatDate(
    new Date(),
    obtenerZonaHorariaAulaMagica(),
    'yyyy-MM-dd_HH-mm'
  );

  return archivo.makeCopy(
    'Respaldo Aula Mágica '+fecha,
    obtenerCarpetaRespaldosAulaMagica()
  );
}

function crearRespaldo(){
  const copia=crearCopiaRespaldoAulaMagica();

  SpreadsheetApp.getUi().alert(
    'Respaldo creado',
    'Se guardó correctamente: '+copia.getName(),
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function crearRespaldoAutomatico(){
  const copia=crearCopiaRespaldoAulaMagica();

  console.log('Respaldo automático creado: '+copia.getName());

  return {
    creado:true,
    nombre:copia.getName(),
    id:copia.getId()
  };
}

function activarRespaldoSemanal(){
  const funcion='crearRespaldoAutomatico';

  ScriptApp.getProjectTriggers()
    .filter(trigger=>trigger.getHandlerFunction()===funcion)
    .forEach(trigger=>ScriptApp.deleteTrigger(trigger));

  ScriptApp.newTrigger(funcion)
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(2)
    .create();

  SpreadsheetApp.getUi().alert(
    'Respaldo semanal activado',
    'Cada lunes se creará automáticamente una copia en la carpeta Respaldos Aula Mágica.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function desactivarRespaldoAutomatico(){
  const funcion='crearRespaldoAutomatico';

  ScriptApp.getProjectTriggers()
    .filter(trigger=>trigger.getHandlerFunction()===funcion)
    .forEach(trigger=>ScriptApp.deleteTrigger(trigger));

  SpreadsheetApp.getUi().alert(
    'Respaldo automático desactivado',
    'No se crearán nuevas copias semanales.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}
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


function listarPlanificaciones(token){
  const m=verificarSesion(token);
  return obtenerRegistros('PLANIFICACION')
    .filter(r=>String(r.ID_MAESTRA)===String(m.idMaestra))
    .map(r=>({
      idPlanificacion:String(r.ID_PLANIFICACION||''),
      titulo:String(r.TITULO||''),
      asignatura:String(r.ASIGNATURA||''),
      grado:String(r.GRADO||''),
      fecha:formatearFechaParaFormulario(r.FECHA),
      objetivo:String(r.OBJETIVO||''),
      contenido:String(r.CONTENIDO||''),
      actividades:String(r.ACTIVIDADES||''),
      recursos:String(r.RECURSOS||''),
      evaluacion:String(r.EVALUACION||''),
      estado:String(r.ESTADO||'PLANIFICADA').toUpperCase(),
      fechaRegistro:formatearFechaHoraPlanificacion(r.FECHA_REGISTRO)
    }))
    .sort((a,b)=>String(b.fecha).localeCompare(String(a.fecha))||a.titulo.localeCompare(b.titulo));
}

function guardarPlanificacion(token,datos){
  const m=verificarSesion(token);
  validarObjeto(datos,['titulo','asignatura','fecha','objetivo','contenido','actividades']);

  const estadosPermitidos=['BORRADOR','PLANIFICADA','COMPLETADA'];
  const estado=limpiarTexto(datos.estado||'PLANIFICADA').toUpperCase();
  if(!estadosPermitidos.includes(estado)) throw new Error('El estado de la planificación no es válido.');

  const fecha=normalizarFechaPlanificacion(datos.fecha);
  const hoja=obtenerHoja('PLANIFICACION');
  const idSolicitado=limpiarTexto(datos.idPlanificacion||'');
  const registro={
    idPlanificacion:idSolicitado||generarId('PLA'),
    titulo:limpiarTexto(datos.titulo),
    asignatura:limpiarTexto(datos.asignatura),
    grado:limpiarTexto(datos.grado||m.grado||''),
    fecha:fecha,
    objetivo:limpiarTexto(datos.objetivo),
    contenido:limpiarTexto(datos.contenido),
    actividades:limpiarTexto(datos.actividades),
    recursos:limpiarTexto(datos.recursos||''),
    evaluacion:limpiarTexto(datos.evaluacion||''),
    estado:estado,
    fechaRegistro:new Date()
  };

  const lock=LockService.getScriptLock();
  lock.waitLock(20000);
  try{
    if(idSolicitado){
      const existente=obtenerRegistrosConFila('PLANIFICACION').find(r=>
        String(r.ID_PLANIFICACION)===idSolicitado&&
        String(r.ID_MAESTRA)===String(m.idMaestra)
      );
      if(!existente) throw new Error('No se encontró la planificación o no tienes permiso.');
      registro.fechaRegistro=existente.FECHA_REGISTRO||new Date();
      hoja.getRange(existente.__fila,1,1,13).setValues([[
        registro.idPlanificacion,m.idMaestra,registro.titulo,registro.asignatura,
        registro.grado,registro.fecha,registro.objetivo,registro.contenido,
        registro.actividades,registro.recursos,registro.evaluacion,
        registro.estado,registro.fechaRegistro
      ]]);
      registrarAuditoria(m.idMaestra,'EDITAR','PLANIFICACION','Planificación actualizada: '+registro.titulo);
    }else{
      hoja.appendRow([
        registro.idPlanificacion,m.idMaestra,registro.titulo,registro.asignatura,
        registro.grado,registro.fecha,registro.objetivo,registro.contenido,
        registro.actividades,registro.recursos,registro.evaluacion,
        registro.estado,registro.fechaRegistro
      ]);
      registrarAuditoria(m.idMaestra,'CREAR','PLANIFICACION','Planificación creada: '+registro.titulo);
    }
  }finally{
    lock.releaseLock();
  }

  return {
    idPlanificacion:registro.idPlanificacion,
    titulo:registro.titulo,
    asignatura:registro.asignatura,
    grado:registro.grado,
    fecha:registro.fecha,
    objetivo:registro.objetivo,
    contenido:registro.contenido,
    actividades:registro.actividades,
    recursos:registro.recursos,
    evaluacion:registro.evaluacion,
    estado:registro.estado,
    fechaRegistro:formatearFechaHoraPlanificacion(registro.fechaRegistro)
  };
}

function eliminarPlanificacion(token,datos){
  const m=verificarSesion(token);
  validarObjeto(datos,['idPlanificacion']);
  const hoja=obtenerHoja('PLANIFICACION');
  const existente=obtenerRegistrosConFila('PLANIFICACION').find(r=>
    String(r.ID_PLANIFICACION)===String(datos.idPlanificacion)&&
    String(r.ID_MAESTRA)===String(m.idMaestra)
  );
  if(!existente) throw new Error('No se encontró la planificación o no tienes permiso.');
  hoja.deleteRow(existente.__fila);
  registrarAuditoria(m.idMaestra,'ELIMINAR','PLANIFICACION','Planificación eliminada');
  return {eliminado:true,idPlanificacion:String(datos.idPlanificacion)};
}

function normalizarFechaPlanificacion(valor){
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

function formatearFechaHoraPlanificacion(valor){
  if(!valor) return '';
  if(Object.prototype.toString.call(valor)==='[object Date]'&&!Number.isNaN(valor.getTime())){
    return Utilities.formatDate(valor,Session.getScriptTimeZone(),'yyyy-MM-dd HH:mm:ss');
  }
  return String(valor);
}


function listarCumpleanos(token){
  const m=verificarSesion(token);
  const notas={};
  obtenerRegistros('CUMPLEANOS').forEach(r=>{
    if(String(r.ID_MAESTRA)===String(m.idMaestra)){
      notas[String(r.ID_ALUMNO)]={
        fechaNacimiento:formatearFechaParaFormulario(r.FECHA_NACIMIENTO),
        notas:String(r.NOTAS||'')
      };
    }
  });

  return obtenerRegistros('ALUMNOS')
    .filter(r=>String(r.ID_MAESTRA||'').trim()===String(m.idMaestra||'').trim()&&String(r.ESTADO).toUpperCase()!=='ELIMINADO')
    .map(r=>{
      const guardado=notas[String(r.ID_ALUMNO)]||{};
      return {
        idAlumno:String(r.ID_ALUMNO||''),
        nombre:String(r.NOMBRE||''),
        apellido:String(r.APELLIDO||''),
        sexo:String(r.SEXO||''),
        grado:String(r.GRADO||''),
        seccion:String(r.SECCION||''),
        fechaNacimiento:formatearFechaParaFormulario(r.FECHA_NACIMIENTO)||guardado.fechaNacimiento||'',
        notas:guardado.notas||''
      };
    })
    .sort((a,b)=>(a.nombre+' '+a.apellido).localeCompare(b.nombre+' '+b.apellido));
}

function guardarCumpleanos(token,datos){
  const m=verificarSesion(token);
  validarObjeto(datos,['idAlumno','fechaNacimiento']);
  const fecha=normalizarFechaCumpleanos(datos.fechaNacimiento);
  const alumno=obtenerRegistrosConFila('ALUMNOS').find(r=>
    String(r.ID_ALUMNO)===String(datos.idAlumno)&&
    String(r.ID_MAESTRA||'').trim()===String(m.idMaestra||'').trim()&&
    String(r.ESTADO).toUpperCase()!=='ELIMINADO'
  );
  if(!alumno) throw new Error('El alumno no pertenece a esta maestra.');

  const notas=limpiarTexto(datos.notas||'');
  const nombre=String(alumno.NOMBRE||'')+' '+String(alumno.APELLIDO||'');
  const hojaAlumnos=obtenerHoja('ALUMNOS');
  const hojaCumpleanos=obtenerHoja('CUMPLEANOS');
  const existente=obtenerRegistrosConFila('CUMPLEANOS').find(r=>
    String(r.ID_ALUMNO)===String(datos.idAlumno)&&
    String(r.ID_MAESTRA)===String(m.idMaestra)
  );

  const lock=LockService.getScriptLock();
  lock.waitLock(20000);
  try{
    hojaAlumnos.getRange(alumno.__fila,6).setValue(fecha);
    if(existente){
      hojaCumpleanos.getRange(existente.__fila,1,1,6).setValues([[
        existente.ID_CUMPLEANOS||generarId('CUM'),
        m.idMaestra,
        String(datos.idAlumno),
        nombre,
        fecha,
        notas
      ]]);
    }else{
      hojaCumpleanos.appendRow([
        generarId('CUM'),m.idMaestra,String(datos.idAlumno),nombre,fecha,notas
      ]);
    }
  }finally{
    lock.releaseLock();
  }

  registrarAuditoria(m.idMaestra,'GUARDAR','CUMPLEANOS','Cumpleaños configurado: '+nombre);
  return {
    idAlumno:String(datos.idAlumno),
    nombre:String(alumno.NOMBRE||''),
    apellido:String(alumno.APELLIDO||''),
    sexo:String(alumno.SEXO||''),
    grado:String(alumno.GRADO||''),
    seccion:String(alumno.SECCION||''),
    fechaNacimiento:fecha,
    notas:notas
  };
}

function eliminarCumpleanos(token,datos){
  const m=verificarSesion(token);
  validarObjeto(datos,['idAlumno']);
  const alumno=obtenerRegistrosConFila('ALUMNOS').find(r=>
    String(r.ID_ALUMNO)===String(datos.idAlumno)&&
    String(r.ID_MAESTRA||'').trim()===String(m.idMaestra||'').trim()&&
    String(r.ESTADO).toUpperCase()!=='ELIMINADO'
  );
  if(!alumno) throw new Error('El alumno no pertenece a esta maestra.');

  const hojaCumpleanos=obtenerHoja('CUMPLEANOS');
  const filas=obtenerRegistrosConFila('CUMPLEANOS')
    .filter(r=>String(r.ID_ALUMNO)===String(datos.idAlumno)&&String(r.ID_MAESTRA)===String(m.idMaestra))
    .map(r=>r.__fila)
    .sort((a,b)=>b-a);

  const lock=LockService.getScriptLock();
  lock.waitLock(20000);
  try{
    obtenerHoja('ALUMNOS').getRange(alumno.__fila,6).clearContent();
    filas.forEach(fila=>hojaCumpleanos.deleteRow(fila));
  }finally{
    lock.releaseLock();
  }

  registrarAuditoria(m.idMaestra,'ELIMINAR','CUMPLEANOS','Fecha de cumpleaños eliminada');
  return {eliminado:true,idAlumno:String(datos.idAlumno)};
}

function normalizarFechaCumpleanos(valor){
  if(!valor) throw new Error('La fecha de nacimiento es obligatoria.');
  if(Object.prototype.toString.call(valor)==='[object Date]'&&!Number.isNaN(valor.getTime())){
    return Utilities.formatDate(valor,Session.getScriptTimeZone(),'yyyy-MM-dd');
  }
  const texto=String(valor).trim();
  if(!/^\d{4}-\d{2}-\d{2}$/.test(texto)) throw new Error('La fecha de nacimiento no es válida.');
  const partes=texto.split('-').map(Number);
  const fecha=new Date(partes[0],partes[1]-1,partes[2]);
  if(
    fecha.getFullYear()!==partes[0]||
    fecha.getMonth()!==partes[1]-1||
    fecha.getDate()!==partes[2]
  ) throw new Error('La fecha de nacimiento no es válida.');
  if(fecha.getTime()>Date.now()) throw new Error('La fecha de nacimiento no puede estar en el futuro.');
  return texto;
}


function listarReuniones(token){
  const m=verificarSesion(token);
  return obtenerRegistros('REUNIONES')
    .filter(r=>String(r.ID_MAESTRA)===String(m.idMaestra))
    .map(r=>({
      idReunion:String(r.ID_REUNION||''),
      titulo:String(r.TITULO||''),
      fecha:formatearFechaParaFormulario(r.FECHA),
      hora:formatearHoraReunion(r.HORA),
      lugar:String(r.LUGAR||''),
      participantes:String(r.PARTICIPANTES||''),
      temas:String(r.TEMAS||''),
      acuerdos:String(r.ACUERDOS||''),
      estado:String(r.ESTADO||'PROGRAMADA').toUpperCase()
    }))
    .sort((a,b)=>{
      const fechaA=String(a.fecha)+' '+String(a.hora);
      const fechaB=String(b.fecha)+' '+String(b.hora);
      return fechaB.localeCompare(fechaA)||a.titulo.localeCompare(b.titulo);
    });
}

function guardarReunion(token,datos){
  const m=verificarSesion(token);
  validarObjeto(datos,['titulo','fecha','hora','participantes','temas']);
  const estadosPermitidos=['PROGRAMADA','REALIZADA','CANCELADA'];
  const estado=limpiarTexto(datos.estado||'PROGRAMADA').toUpperCase();
  if(!estadosPermitidos.includes(estado)) throw new Error('El estado de la reunión no es válido.');

  const fecha=normalizarFechaReunion(datos.fecha);
  const hora=normalizarHoraReunion(datos.hora);
  const hoja=obtenerHoja('REUNIONES');
  const idSolicitado=limpiarTexto(datos.idReunion||'');
  const registro={
    idReunion:idSolicitado||generarId('REU'),
    titulo:limpiarTexto(datos.titulo),
    fecha:fecha,
    hora:hora,
    lugar:limpiarTexto(datos.lugar||''),
    participantes:limpiarTexto(datos.participantes),
    temas:limpiarTexto(datos.temas),
    acuerdos:limpiarTexto(datos.acuerdos||''),
    estado:estado
  };

  const lock=LockService.getScriptLock();
  lock.waitLock(20000);
  try{
    if(idSolicitado){
      const existente=obtenerRegistrosConFila('REUNIONES').find(r=>
        String(r.ID_REUNION)===idSolicitado&&String(r.ID_MAESTRA)===String(m.idMaestra)
      );
      if(!existente) throw new Error('No se encontró la reunión o no tienes permiso.');
      hoja.getRange(existente.__fila,1,1,10).setValues([[
        registro.idReunion,m.idMaestra,registro.titulo,registro.fecha,registro.hora,
        registro.lugar,registro.participantes,registro.temas,registro.acuerdos,registro.estado
      ]]);
      registrarAuditoria(m.idMaestra,'EDITAR','REUNIONES','Reunión actualizada: '+registro.titulo);
    }else{
      hoja.appendRow([
        registro.idReunion,m.idMaestra,registro.titulo,registro.fecha,registro.hora,
        registro.lugar,registro.participantes,registro.temas,registro.acuerdos,registro.estado
      ]);
      registrarAuditoria(m.idMaestra,'CREAR','REUNIONES','Reunión creada: '+registro.titulo);
    }
  }finally{
    lock.releaseLock();
  }
  return registro;
}

function eliminarReunion(token,datos){
  const m=verificarSesion(token);
  validarObjeto(datos,['idReunion']);
  const hoja=obtenerHoja('REUNIONES');
  const existente=obtenerRegistrosConFila('REUNIONES').find(r=>
    String(r.ID_REUNION)===String(datos.idReunion)&&String(r.ID_MAESTRA)===String(m.idMaestra)
  );
  if(!existente) throw new Error('No se encontró la reunión o no tienes permiso.');
  hoja.deleteRow(existente.__fila);
  registrarAuditoria(m.idMaestra,'ELIMINAR','REUNIONES','Reunión eliminada');
  return {eliminado:true,idReunion:String(datos.idReunion)};
}

function normalizarFechaReunion(valor){
  if(!valor) throw new Error('La fecha es obligatoria.');
  if(Object.prototype.toString.call(valor)==='[object Date]'&&!Number.isNaN(valor.getTime())){
    return Utilities.formatDate(valor,Session.getScriptTimeZone(),'yyyy-MM-dd');
  }
  const texto=String(valor).trim();
  if(!/^\d{4}-\d{2}-\d{2}$/.test(texto)) throw new Error('La fecha no es válida.');
  const partes=texto.split('-').map(Number);
  const fecha=new Date(partes[0],partes[1]-1,partes[2]);
  if(fecha.getFullYear()!==partes[0]||fecha.getMonth()!==partes[1]-1||fecha.getDate()!==partes[2]){
    throw new Error('La fecha no es válida.');
  }
  return texto;
}

function normalizarHoraReunion(valor){
  const texto=String(valor||'').trim();
  if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(texto)) throw new Error('La hora no es válida.');
  return texto;
}

function formatearHoraReunion(valor){
  if(!valor) return '';
  if(Object.prototype.toString.call(valor)==='[object Date]'&&!Number.isNaN(valor.getTime())){
    return Utilities.formatDate(valor,Session.getScriptTimeZone(),'HH:mm');
  }
  const texto=String(valor).trim();
  const coincidencia=texto.match(/(?:T|\s)(\d{2}:\d{2})/);
  return coincidencia?coincidencia[1]:texto.slice(0,5);
}


function obtenerRegistrosAgenda(){
  const hoja=obtenerHoja('AGENDA');
  const ultimaFila=hoja.getLastRow();
  const ultimaColumna=hoja.getLastColumn();

  if(ultimaFila<2||ultimaColumna<1)return[];

  const valores=hoja.getRange(1,1,ultimaFila,ultimaColumna).getValues();
  const visibles=hoja.getRange(1,1,ultimaFila,ultimaColumna).getDisplayValues();
  const encabezados=valores[0].map(x=>String(x).trim());

  return valores.slice(1).map((fila,i)=>{
    const registro={__fila:i+2};
    encabezados.forEach((encabezado,j)=>{
      if(encabezado==='FECHA'||encabezado==='HORA'){
        registro[encabezado]=String(visibles[i+1][j]||'').trim();
      }else{
        registro[encabezado]=fila[j];
      }
    });
    return registro;
  }).filter(registro=>
    encabezados.some(encabezado=>String(registro[encabezado]||'').trim()!=='')
  );
}

function guardarFilaAgendaComoTexto(hoja,fila,valores){
  hoja.getRange(fila,1,1,9).setValues([valores]);
  hoja.getRange(fila,5,1,2).setNumberFormat('@');
  hoja.getRange(fila,5).setValue(String(valores[4]||''));
  hoja.getRange(fila,6).setValue(String(valores[5]||''));
}


function listarAgenda(token){
  const m=verificarSesion(token);
  return obtenerRegistrosAgenda()
    .filter(r=>String(r.ID_MAESTRA||'').trim()===String(m.idMaestra||'').trim())
    .map(r=>({
      idEvento:String(r.ID_EVENTO||''),
      titulo:String(r.TITULO||''),
      tipo:String(r.TIPO||'OTRO').toUpperCase(),
      fecha:normalizarFechaVisibleAgenda(r.FECHA),
      hora:normalizarHoraVisibleAgenda(r.HORA),
      descripcion:String(r.DESCRIPCION||''),
      estado:String(r.ESTADO||'PENDIENTE').toUpperCase(),
      fechaRegistro:formatearFechaParaFormulario(r.FECHA_REGISTRO)
    }))
    .sort((a,b)=>{
      const fechaA=String(a.fecha)+' '+String(a.hora);
      const fechaB=String(b.fecha)+' '+String(b.hora);
      return fechaA.localeCompare(fechaB)||a.titulo.localeCompare(b.titulo);
    });
}

function guardarEventoAgenda(token,datos){
  const m=verificarSesion(token);
  validarObjeto(datos,['titulo','tipo','fecha','hora','estado']);
  const tiposPermitidos=['CLASE','ACTIVIDAD','RECORDATORIO','ENTREGA','OTRO'];
  const estadosPermitidos=['PENDIENTE','COMPLETADO','CANCELADO'];
  const tipo=limpiarTexto(datos.tipo).toUpperCase();
  const estado=limpiarTexto(datos.estado).toUpperCase();
  if(!tiposPermitidos.includes(tipo)) throw new Error('El tipo de evento no es válido.');
  if(!estadosPermitidos.includes(estado)) throw new Error('El estado del evento no es válido.');

  const fecha=normalizarFechaAgenda(datos.fecha);
  const hora=normalizarHoraAgenda(datos.hora);
  const hoja=obtenerHoja('AGENDA');
  const idSolicitado=limpiarTexto(datos.idEvento||'');
  const registro={
    idEvento:idSolicitado||generarId('AGE'),
    titulo:limpiarTexto(datos.titulo),
    tipo:tipo,
    fecha:fecha,
    hora:hora,
    descripcion:limpiarTexto(datos.descripcion||''),
    estado:estado,
    fechaRegistro:new Date()
  };

  const lock=LockService.getScriptLock();
  lock.waitLock(20000);
  try{
    if(idSolicitado){
      const existente=obtenerRegistrosConFila('AGENDA').find(r=>
        String(r.ID_EVENTO)===idSolicitado&&String(r.ID_MAESTRA)===String(m.idMaestra)
      );
      if(!existente) throw new Error('No se encontró el evento o no tienes permiso.');
      registro.fechaRegistro=existente.FECHA_REGISTRO||new Date();
      guardarFilaAgendaComoTexto(hoja,existente.__fila,[
        registro.idEvento,m.idMaestra,registro.titulo,registro.tipo,registro.fecha,
        registro.hora,registro.descripcion,registro.estado,registro.fechaRegistro
      ]);
      registrarAuditoria(m.idMaestra,'EDITAR','AGENDA','Evento actualizado: '+registro.titulo);
    }else{
      const nuevaFila=hoja.getLastRow()+1;
      guardarFilaAgendaComoTexto(hoja,nuevaFila,[
        registro.idEvento,m.idMaestra,registro.titulo,registro.tipo,registro.fecha,
        registro.hora,registro.descripcion,registro.estado,registro.fechaRegistro
      ]);
      registrarAuditoria(m.idMaestra,'CREAR','AGENDA','Evento creado: '+registro.titulo);
    }
  }finally{
    lock.releaseLock();
  }
  return {
    idEvento:registro.idEvento,
    titulo:registro.titulo,
    tipo:registro.tipo,
    fecha:registro.fecha,
    hora:registro.hora,
    descripcion:registro.descripcion,
    estado:registro.estado,
    fechaRegistro:formatearFechaParaFormulario(registro.fechaRegistro)
  };
}

function eliminarEventoAgenda(token,datos){
  const m=verificarSesion(token);
  validarObjeto(datos,['idEvento']);
  const hoja=obtenerHoja('AGENDA');
  const existente=obtenerRegistrosConFila('AGENDA').find(r=>
    String(r.ID_EVENTO)===String(datos.idEvento)&&String(r.ID_MAESTRA)===String(m.idMaestra)
  );
  if(!existente) throw new Error('No se encontró el evento o no tienes permiso.');
  hoja.deleteRow(existente.__fila);
  registrarAuditoria(m.idMaestra,'ELIMINAR','AGENDA','Evento eliminado');
  return {eliminado:true,idEvento:String(datos.idEvento)};
}

function normalizarFechaVisibleAgenda(valor){
  const texto=String(valor||'').trim();
  if(!texto)return '';

  if(/^\d{4}-\d{2}-\d{2}$/.test(texto))return texto;

  const latino=texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if(latino){
    return [
      latino[3],
      String(latino[2]).padStart(2,'0'),
      String(latino[1]).padStart(2,'0')
    ].join('-');
  }

  return normalizarFechaAgenda(texto);
}

function normalizarHoraVisibleAgenda(valor){
  const texto=String(valor||'').trim();
  if(!texto)return '';

  const coincidencia=texto.match(/(\d{1,2}):(\d{2})/);
  if(!coincidencia)return texto;

  return String(coincidencia[1]).padStart(2,'0')+':'+coincidencia[2];
}


function normalizarFechaAgenda(valor){
  if(!valor) throw new Error('La fecha es obligatoria.');
  if(Object.prototype.toString.call(valor)==='[object Date]'&&!Number.isNaN(valor.getTime())){
    return Utilities.formatDate(valor,Session.getScriptTimeZone(),'yyyy-MM-dd');
  }
  const texto=String(valor).trim();
  if(!/^\d{4}-\d{2}-\d{2}$/.test(texto)) throw new Error('La fecha no es válida.');
  const partes=texto.split('-').map(Number);
  const fecha=new Date(partes[0],partes[1]-1,partes[2]);
  if(fecha.getFullYear()!==partes[0]||fecha.getMonth()!==partes[1]-1||fecha.getDate()!==partes[2]){
    throw new Error('La fecha no es válida.');
  }
  return texto;
}

function normalizarHoraAgenda(valor){
  const texto=String(valor||'').trim();
  if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(texto)) throw new Error('La hora no es válida.');
  return texto;
}

function formatearHoraAgenda(valor){
  if(!valor) return '';
  if(Object.prototype.toString.call(valor)==='[object Date]'&&!Number.isNaN(valor.getTime())){
    return Utilities.formatDate(valor,Session.getScriptTimeZone(),'HH:mm');
  }
  const texto=String(valor).trim();
  const coincidencia=texto.match(/(?:T|\s)(\d{2}:\d{2})/);
  return coincidencia?coincidencia[1]:texto.slice(0,5);
}

function configurarBotTelegram(){
  const ui=SpreadsheetApp.getUi();
  const tokenRespuesta=ui.prompt('Configurar bot Telegram','Pega el token entregado por BotFather:',ui.ButtonSet.OK_CANCEL);
  if(tokenRespuesta.getSelectedButton()!==ui.Button.OK)return;
  const token=String(tokenRespuesta.getResponseText()||'').trim();
  if(!/^\d+:[A-Za-z0-9_-]{20,}$/.test(token)){
    ui.alert('El token no parece válido. Cópialo completo desde BotFather.');
    return;
  }

  const usuarioRespuesta=ui.prompt('Configurar bot Telegram','Escribe el usuario del bot, por ejemplo: AulaMagicaBot',ui.ButtonSet.OK_CANCEL);
  if(usuarioRespuesta.getSelectedButton()!==ui.Button.OK)return;
  const usuario=normalizarUsuarioTelegram(usuarioRespuesta.getResponseText());
  if(!usuario){
    ui.alert('El nombre de usuario del bot es obligatorio.');
    return;
  }

  const propiedades=PropertiesService.getScriptProperties();
  propiedades.setProperty('TELEGRAM_BOT_TOKEN',token);
  propiedades.setProperty('TELEGRAM_BOT_USERNAME',usuario);

  try{
    const resultado=registrarWebhookTelegram();
    establecerConfiguracion('TELEGRAM_ACTIVO','SI');
    ui.alert('Telegram configurado','Bot @'+usuario+' conectado correctamente.\nWebhook: '+resultado.webhookUrl,ui.ButtonSet.OK);
  }catch(error){
    establecerConfiguracion('TELEGRAM_ACTIVO','NO');
    ui.alert('El token se guardó, pero no se pudo activar el webhook: '+(error.message||error));
  }
}

function reactivarWebhookTelegram(){
  const ui=SpreadsheetApp.getUi();
  try{
    const resultado=registrarWebhookTelegram();
    establecerConfiguracion('TELEGRAM_ACTIVO','SI');
    ui.alert('Webhook activado correctamente:\n'+resultado.webhookUrl);
  }catch(error){
    ui.alert('No se pudo activar el webhook: '+(error.message||error));
  }
}

function registrarWebhookTelegram(){
  const token=obtenerTokenBotTelegram();
  let webhookUrl=ScriptApp.getService().getUrl()||'';
  if(!webhookUrl)throw new Error('Primero publica Apps Script como aplicación web.');
  webhookUrl=webhookUrl.replace(/\/dev$/,'/exec');

  const respuesta=UrlFetchApp.fetch('https://api.telegram.org/bot'+token+'/setWebhook',{
    method:'post',
    contentType:'application/json',
    payload:JSON.stringify({url:webhookUrl,drop_pending_updates:true}),
    muteHttpExceptions:true
  });
  const contenido=JSON.parse(respuesta.getContentText()||'{}');
  if(!contenido.ok)throw new Error(contenido.description||'Telegram rechazó el webhook.');
  configurarComandosTelegram();
  return {webhookUrl:webhookUrl};
}

function establecerConfiguracion(clave,valor){
  const hoja=obtenerHoja('CONFIGURACION');
  const registros=obtenerRegistrosConFila('CONFIGURACION');
  const existente=registros.find(r=>String(r.CLAVE)===String(clave));
  if(existente)hoja.getRange(existente.__fila,2).setValue(valor);
  else hoja.appendRow([clave,valor,'Configuración de Aula Mágica']);
}

function obtenerEstadoTelegram(token){
  const m=verificarSesion(token);
  return construirEstadoTelegram(m.idMaestra);
}

function construirEstadoTelegram(idMaestra){
  const propiedades=PropertiesService.getScriptProperties();
  const botToken=propiedades.getProperty('TELEGRAM_BOT_TOKEN')||'';
  const botUsuario=normalizarUsuarioTelegram(propiedades.getProperty('TELEGRAM_BOT_USERNAME')||'');
  const fila=obtenerRegistrosConFila('TELEGRAM').find(r=>String(r.ID_MAESTRA)===String(idMaestra));
  const vinculado=Boolean(fila&&String(fila.ESTADO).toUpperCase()==='VINCULADO'&&String(fila.CHAT_ID||'').trim());
  let codigo='';
  let codigoExpira='';

  if(fila&&String(fila.ESTADO).toUpperCase()==='PENDIENTE'){
    const creado=new Date(fila.FECHA_VINCULACION);
    const expira=new Date(creado.getTime()+30*60*1000);
    if(!Number.isNaN(expira.getTime())&&expira.getTime()>Date.now()){
      codigo=String(fila.CODIGO_VINCULACION||'');
      codigoExpira=expira.toISOString();
    }
  }

  return {
    configurado:Boolean(botToken&&botUsuario),
    botUsuario:botUsuario,
    vinculado:vinculado,
    chatId:vinculado?String(fila.CHAT_ID):'',
    codigo:codigo,
    codigoExpira:codigoExpira
  };
}

function generarCodigoTelegram(token){
  const m=verificarSesion(token);
  const propiedades=PropertiesService.getScriptProperties();
  if(!propiedades.getProperty('TELEGRAM_BOT_TOKEN')||!propiedades.getProperty('TELEGRAM_BOT_USERNAME')){
    throw new Error('El bot todavía no está configurado por la administradora.');
  }

  const hoja=obtenerHoja('TELEGRAM');
  const registros=obtenerRegistrosConFila('TELEGRAM');
  const existente=registros.find(r=>String(r.ID_MAESTRA)===String(m.idMaestra));
  const codigo=crearCodigoVinculacionTelegram(registros);
  const ahora=new Date();

  if(existente){
    hoja.getRange(existente.__fila,1,1,5).setValues([[m.idMaestra,'',codigo,'PENDIENTE',ahora]]);
  }else{
    hoja.appendRow([m.idMaestra,'',codigo,'PENDIENTE',ahora]);
  }

  registrarAuditoria(m.idMaestra,'GENERAR','TELEGRAM','Código de vinculación generado');
  return construirEstadoTelegram(m.idMaestra);
}

function crearCodigoVinculacionTelegram(registros){
  const usados=registros.map(r=>String(r.CODIGO_VINCULACION||'').toUpperCase());
  const caracteres='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let codigo='';
  do{
    codigo='';
    for(let i=0;i<6;i++)codigo+=caracteres.charAt(Math.floor(Math.random()*caracteres.length));
  }while(usados.includes(codigo));
  return codigo;
}

function desvincularTelegram(token){
  const m=verificarSesion(token);
  const hoja=obtenerHoja('TELEGRAM');
  const existente=obtenerRegistrosConFila('TELEGRAM').find(r=>String(r.ID_MAESTRA)===String(m.idMaestra));
  if(existente)hoja.getRange(existente.__fila,1,1,5).setValues([[m.idMaestra,'','','DESVINCULADO',new Date()]]);
  registrarAuditoria(m.idMaestra,'DESVINCULAR','TELEGRAM','Cuenta de Telegram desvinculada');
  return construirEstadoTelegram(m.idMaestra);
}

function enviarPruebaTelegram(token){
  const m=verificarSesion(token);
  const registro=obtenerRegistros('TELEGRAM').find(r=>
    String(r.ID_MAESTRA||'').trim()===String(m.idMaestra||'').trim()&&
    String(r.ESTADO).toUpperCase()==='VINCULADO'&&
    String(r.CHAT_ID||'').trim()
  );
  if(!registro)throw new Error('Primero debes vincular tu cuenta de Telegram.');
  enviarMensajeTelegram(String(registro.CHAT_ID),'✨ Aula Mágica está conectada correctamente.\n\nYa puedes usar /agenda, /cumpleanos y /asistencia.');
  return {enviado:true};
}

function procesarActualizacionTelegram(actualizacion){
  const mensaje=actualizacion.message||(actualizacion.callback_query&&actualizacion.callback_query.message);
  if(!mensaje||!mensaje.chat)return;
  const chatId=String(mensaje.chat.id);
  const textoOriginal=String(mensaje.text||'').trim();
  if(!textoOriginal)return;

  const texto=normalizarBotonTelegram(textoOriginal);
  const partes=texto.split(/\s+/);
  const comando=String(partes[0]||'').split('@')[0].toLowerCase();

  if(comando==='/start'){
    enviarMensajeTelegram(chatId,'👋 Bienvenida a Aula Mágica.\n\nPara vincular tu cuenta, genera un código en la plataforma y envía:\n/vincular CODIGO\n\nDespués podrás usar los botones del menú.',true);
    return;
  }

  if(comando==='/vincular'){
    vincularChatTelegram(chatId,String(partes[1]||'').toUpperCase());
    return;
  }

  const enlace=obtenerRegistros('TELEGRAM').find(r=>
    String(r.CHAT_ID)===chatId&&String(r.ESTADO).toUpperCase()==='VINCULADO'
  );
  if(!enlace){
    enviarMensajeTelegram(chatId,'🔒 Esta cuenta no está vinculada. Abre Aula Mágica, entra en Telegram y genera un código.');
    return;
  }

  const idMaestra=String(enlace.ID_MAESTRA);
  if(comando==='/inicio'){
    const maestra=obtenerRegistros('MAESTRAS').find(r=>String(r.ID_MAESTRA)===idMaestra);
    enviarMensajeTelegram(chatId,'✨ Aula Mágica conectada\nMaestra: '+(maestra?String(maestra.NOMBRE)+' '+String(maestra.APELLIDO):'Cuenta vinculada')+'\n\nElige una opción del menú.',true);
  }else if(comando==='/alumnos'){
    enviarMensajeTelegram(chatId,crearResumenAlumnosTelegram(idMaestra),true);
  }else if(comando==='/agenda'){
    enviarMensajeTelegram(chatId,crearResumenAgendaTelegram(idMaestra),true);
  }else if(comando==='/cumpleanos'){
    enviarMensajeTelegram(chatId,crearResumenCumpleanosTelegram(idMaestra),true);
  }else if(comando==='/asistencia'){
    enviarMensajeTelegram(chatId,crearResumenAsistenciaTelegram(idMaestra),true);
  }else if(comando==='/notas'){
    enviarMensajeTelegram(chatId,crearResumenCalificacionesTelegram(idMaestra),true);
  }else if(comando==='/planes'){
    enviarMensajeTelegram(chatId,crearResumenPlanificacionesTelegram(idMaestra),true);
  }else if(comando==='/reuniones'){
    enviarMensajeTelegram(chatId,crearResumenReunionesTelegram(idMaestra),true);
  }else if(comando==='/ayuda'){
    enviarMensajeTelegram(chatId,'📱 Opciones de Aula Mágica\n\n/alumnos — Total de estudiantes\n/asistencia — Resumen de hoy\n/notas — Resumen de calificaciones\n/planes — Próximas planificaciones\n/cumpleanos — Próximos cumpleaños\n/reuniones — Próximas reuniones\n/agenda — Próximos eventos\n/calendario — Calendario escolar\n/horario — Horario de hoy\n/inicio — Estado de la cuenta',true);
  }else{
    enviarMensajeTelegram(chatId,'No reconozco esa opción. Usa los botones o escribe /ayuda.',true);
  }
}

function normalizarBotonTelegram(texto){
  const limpio=String(texto||'').trim().toLowerCase();
  const mapa={
    '🏠 inicio':'/inicio',
    '👩‍🎓 alumnos':'/alumnos',
    '✅ asistencia':'/asistencia',
    '📝 notas':'/notas',
    '📚 planes':'/planes',
    '🎂 cumpleaños':'/cumpleanos',
    '🤝 reuniones':'/reuniones',
    '📅 agenda':'/agenda',
    '❓ ayuda':'/ayuda'
  };
  return mapa[limpio]||String(texto||'').trim();
}

function vincularChatTelegram(chatId,codigo){
  if(!codigo){
    enviarMensajeTelegram(chatId,'Debes enviar el código así:\n/vincular ABC123');
    return;
  }
  const hoja=obtenerHoja('TELEGRAM');
  const registro=obtenerRegistrosConFila('TELEGRAM').find(r=>
    String(r.CODIGO_VINCULACION||'').toUpperCase()===codigo&&String(r.ESTADO).toUpperCase()==='PENDIENTE'
  );
  if(!registro){
    enviarMensajeTelegram(chatId,'❌ El código no existe o ya fue utilizado. Genera uno nuevo en Aula Mágica.');
    return;
  }
  const creado=new Date(registro.FECHA_VINCULACION);
  if(Number.isNaN(creado.getTime())||Date.now()-creado.getTime()>30*60*1000){
    enviarMensajeTelegram(chatId,'⌛ El código venció. Genera uno nuevo en Aula Mágica.');
    return;
  }

  const otro=obtenerRegistrosConFila('TELEGRAM').find(r=>
    String(r.CHAT_ID)===chatId&&String(r.ID_MAESTRA)!==String(registro.ID_MAESTRA)
  );
  if(otro)hoja.getRange(otro.__fila,2,1,4).setValues([['','','DESVINCULADO',new Date()]]);

  hoja.getRange(registro.__fila,1,1,5).setValues([[
    registro.ID_MAESTRA,chatId,'','VINCULADO',new Date()
  ]]);
  registrarAuditoria(String(registro.ID_MAESTRA),'VINCULAR','TELEGRAM','Cuenta de Telegram vinculada');
  enviarMensajeTelegram(chatId,'✅ Cuenta vinculada correctamente con Aula Mágica.\n\nYa puedes usar los botones del menú.',true);
}

function crearResumenAlumnosTelegram(idMaestra){
  const alumnos=obtenerRegistros('ALUMNOS').filter(r=>
    String(r.ID_MAESTRA)===String(idMaestra)&&
    String(r.ESTADO).toUpperCase()!=='ELIMINADO'
  );

  if(!alumnos.length)return '👩‍🎓 Todavía no tienes alumnos registrados.';

  const ninas=alumnos.filter(r=>String(r.SEXO||'').toLowerCase()==='femenino').length;
  const ninos=alumnos.filter(r=>String(r.SEXO||'').toLowerCase()==='masculino').length;
  const sinDefinir=alumnos.length-ninas-ninos;

  const lista=alumnos
    .slice()
    .sort((a,b)=>(String(a.NOMBRE||'')+' '+String(a.APELLIDO||'')).localeCompare(
      String(b.NOMBRE||'')+' '+String(b.APELLIDO||'')
    ))
    .slice(0,10)
    .map((r,i)=>
      (i+1)+'. '+String(r.NOMBRE||'')+' '+String(r.APELLIDO||'')+
      (r.GRADO?' · '+String(r.GRADO):'')+
      (r.SECCION?' '+String(r.SECCION):'')
    );

  const extra=alumnos.length>10?'\n\n…y '+(alumnos.length-10)+' alumno(s) más.':'';

  return [
    '👩‍🎓 Alumnos del curso',
    '',
    'Total: '+alumnos.length,
    '👧 Niñas: '+ninas,
    '👦 Niños: '+ninos,
    sinDefinir>0?'❔ Sin definir: '+sinDefinir:'',
    '',
    lista.join('\n')
  ].filter(Boolean).join('\n')+extra;
}

function crearResumenCalificacionesTelegram(idMaestra){
  const registros=obtenerRegistros('CALIFICACIONES').filter(r=>
    String(r.ID_MAESTRA)===String(idMaestra)
  );

  if(!registros.length)return '📝 Todavía no hay calificaciones registradas.';

  const porcentajes=registros.map(r=>{
    const nota=Number(r.CALIFICACION||0);
    const maxima=Number(r.CALIFICACION_MAXIMA||0);
    return maxima>0?(nota/maxima)*100:null;
  }).filter(v=>v!==null&&Number.isFinite(v));

  const promedio=porcentajes.length
    ?Math.round(porcentajes.reduce((a,b)=>a+b,0)/porcentajes.length)
    :0;

  const materias={};
  registros.forEach(r=>{
    const materia=String(r.ASIGNATURA||'Sin asignatura');
    materias[materia]=(materias[materia]||0)+1;
  });

  const principales=Object.keys(materias)
    .sort((a,b)=>materias[b]-materias[a])
    .slice(0,5);

  const alumnos={};
  obtenerRegistros('ALUMNOS').forEach(r=>{
    if(String(r.ID_MAESTRA)===String(idMaestra)){
      alumnos[String(r.ID_ALUMNO)]=(String(r.NOMBRE||'')+' '+String(r.APELLIDO||'')).trim();
    }
  });

  const ultimas=registros
    .slice()
    .sort((a,b)=>normalizarFechaTextoTelegram(b.FECHA).localeCompare(normalizarFechaTextoTelegram(a.FECHA)))
    .slice(0,5)
    .map(r=>{
      const nota=Number(r.CALIFICACION||0);
      const maxima=Number(r.CALIFICACION_MAXIMA||0);
      const porcentaje=maxima>0?Math.round((nota/maxima)*100):0;
      return '• '+(alumnos[String(r.ID_ALUMNO)]||'Alumno')+
        ' · '+String(r.ASIGNATURA||'Sin asignatura')+
        ' · '+nota+'/'+maxima+' ('+porcentaje+'%)';
    });

  return [
    '📝 Calificaciones',
    '',
    'Registros: '+registros.length,
    'Promedio general: '+promedio+'%',
    'Materias: '+(principales.join(', ')||'—'),
    '',
    'Últimas calificaciones:',
    ultimas.join('\n')
  ].join('\n');
}

function crearResumenPlanificacionesTelegram(idMaestra){
  const hoy=Utilities.formatDate(new Date(),obtenerZonaHorariaAulaMagica(),'yyyy-MM-dd');
  const planes=obtenerRegistros('PLANIFICACION')
    .filter(r=>
      String(r.ID_MAESTRA)===String(idMaestra)&&
      String(r.ESTADO).toUpperCase()!=='COMPLETADA'&&
      normalizarFechaTextoTelegram(r.FECHA)>=hoy
    )
    .map(r=>({
      titulo:String(r.TITULO||''),
      asignatura:String(r.ASIGNATURA||''),
      grado:String(r.GRADO||''),
      objetivo:String(r.OBJETIVO||''),
      fecha:normalizarFechaTextoTelegram(r.FECHA)
    }))
    .sort((a,b)=>a.fecha.localeCompare(b.fecha))
    .slice(0,5);

  if(!planes.length)return '📚 No tienes planificaciones próximas pendientes.';

  return '📚 Próximas planificaciones\n\n'+planes.map(p=>{
    const partes=[
      '• '+formatearFechaTelegram(p.fecha)+' — '+p.titulo,
      p.asignatura?'  📘 '+p.asignatura:'',
      p.grado?'  🎓 '+p.grado:'',
      p.objetivo?'  🎯 '+recortarTextoTelegram(p.objetivo,90):''
    ].filter(Boolean);
    return partes.join('\n');
  }).join('\n\n');
}

function crearResumenReunionesTelegram(idMaestra){
  const hoy=Utilities.formatDate(new Date(),obtenerZonaHorariaAulaMagica(),'yyyy-MM-dd');
  const reuniones=obtenerRegistros('REUNIONES')
    .filter(r=>
      String(r.ID_MAESTRA)===String(idMaestra)&&
      String(r.ESTADO).toUpperCase()!=='REALIZADA'&&
      String(r.ESTADO).toUpperCase()!=='CANCELADA'&&
      normalizarFechaTextoTelegram(r.FECHA)>=hoy
    )
    .map(r=>({
      titulo:String(r.TITULO||''),
      fecha:normalizarFechaTextoTelegram(r.FECHA),
      hora:formatearHoraAgenda(r.HORA),
      lugar:String(r.LUGAR||''),
      participantes:String(r.PARTICIPANTES||''),
      temas:String(r.TEMAS||'')
    }))
    .sort((a,b)=>(a.fecha+' '+a.hora).localeCompare(b.fecha+' '+b.hora))
    .slice(0,5);

  if(!reuniones.length)return '🤝 No tienes reuniones próximas.';

  return '🤝 Próximas reuniones\n\n'+reuniones.map(r=>{
    const lineas=[
      '• '+formatearFechaTelegram(r.fecha)+' '+(r.hora||'')+' — '+r.titulo,
      r.lugar?'  📍 '+r.lugar:'',
      r.participantes?'  👥 '+recortarTextoTelegram(r.participantes,80):'',
      r.temas?'  📝 '+recortarTextoTelegram(r.temas,100):''
    ].filter(Boolean);
    return lineas.join('\n');
  }).join('\n\n');
}

function crearResumenAgendaTelegram(idMaestra){
  const hoy=Utilities.formatDate(new Date(),obtenerZonaHorariaAulaMagica(),'yyyy-MM-dd');
  const eventos=obtenerRegistros('AGENDA')
    .filter(r=>
      String(r.ID_MAESTRA)===String(idMaestra)&&
      String(r.ESTADO).toUpperCase()==='PENDIENTE'&&
      normalizarFechaTextoTelegram(r.FECHA)>=hoy
    )
    .map(r=>({
      titulo:String(r.TITULO||''),
      tipo:String(r.TIPO||'OTRO'),
      fecha:normalizarFechaTextoTelegram(r.FECHA),
      hora:formatearHoraAgenda(r.HORA),
      descripcion:String(r.DESCRIPCION||'')
    }))
    .sort((a,b)=>(a.fecha+' '+a.hora).localeCompare(b.fecha+' '+b.hora))
    .slice(0,5);

  if(!eventos.length)return '📅 No tienes eventos pendientes en la agenda.';

  return '📅 Próximos eventos\n\n'+eventos.map(e=>{
    const lineas=[
      '• '+formatearFechaTelegram(e.fecha)+' '+(e.hora||'')+' — '+e.titulo,
      e.tipo?'  🏷️ '+capitalizarTelegram(e.tipo):'',
      e.descripcion?'  📝 '+recortarTextoTelegram(e.descripcion,110):''
    ].filter(Boolean);
    return lineas.join('\n');
  }).join('\n\n');
}

function crearResumenCumpleanosTelegram(idMaestra){
  const hoy=new Date();
  hoy.setHours(0,0,0,0);

  const alumnos=obtenerRegistros('ALUMNOS')
    .filter(r=>
      String(r.ID_MAESTRA)===String(idMaestra)&&
      String(r.ESTADO).toUpperCase()!=='ELIMINADO'&&
      r.FECHA_NACIMIENTO
    )
    .map(r=>{
      const texto=formatearFechaParaFormulario(r.FECHA_NACIMIENTO);
      const p=texto.split('-').map(Number);
      let proximo=new Date(hoy.getFullYear(),p[1]-1,p[2]);
      if(proximo<hoy)proximo=new Date(hoy.getFullYear()+1,p[1]-1,p[2]);
      const dias=Math.round((proximo.getTime()-hoy.getTime())/86400000);
      return {
        nombre:String(r.NOMBRE||'')+' '+String(r.APELLIDO||''),
        proximo:proximo,
        dias:dias,
        edad:proximo.getFullYear()-p[0]
      };
    })
    .filter(x=>!Number.isNaN(x.proximo.getTime()))
    .sort((a,b)=>a.proximo.getTime()-b.proximo.getTime())
    .slice(0,5);

  if(!alumnos.length)return '🎂 No hay cumpleaños configurados.';

  return '🎂 Próximos cumpleaños\n\n'+alumnos.map(a=>{
    const cuando=a.dias===0?'hoy':(a.dias===1?'mañana':'en '+a.dias+' días');
    return '• '+Utilities.formatDate(a.proximo,Session.getScriptTimeZone(),'dd/MM')+
      ' — '+a.nombre+'\n  🎈 '+capitalizarTelegram(cuando)+' · Cumple '+a.edad+' años';
  }).join('\n\n');
}

function crearResumenAsistenciaTelegram(idMaestra){
  const hoy=Utilities.formatDate(new Date(),obtenerZonaHorariaAulaMagica(),'yyyy-MM-dd');
  const registros=obtenerRegistros('ASISTENCIA').filter(r=>
    String(r.ID_MAESTRA)===String(idMaestra)&&
    normalizarFechaTextoTelegram(r.FECHA)===hoy
  );

  if(!registros.length)return '📋 Todavía no se ha guardado la asistencia de hoy.';

  const conteo={PRESENTE:0,AUSENTE:0,TARDE:0,JUSTIFICADO:0};
  registros.forEach(r=>{
    const estado=String(r.ESTADO||'').toUpperCase();
    if(conteo[estado]!==undefined)conteo[estado]++;
  });

  const alumnos={};
  obtenerRegistros('ALUMNOS').forEach(r=>{
    if(String(r.ID_MAESTRA)===String(idMaestra)){
      alumnos[String(r.ID_ALUMNO)]=(String(r.NOMBRE||'')+' '+String(r.APELLIDO||'')).trim();
    }
  });

  const ausentes=registros
    .filter(r=>String(r.ESTADO||'').toUpperCase()==='AUSENTE')
    .map(r=>alumnos[String(r.ID_ALUMNO)]||'Alumno')
    .slice(0,5);

  const tardanzas=registros
    .filter(r=>String(r.ESTADO||'').toUpperCase()==='TARDE')
    .map(r=>alumnos[String(r.ID_ALUMNO)]||'Alumno')
    .slice(0,5);

  const detalle=[];
  if(ausentes.length)detalle.push('Ausentes: '+ausentes.join(', '));
  if(tardanzas.length)detalle.push('Tardanzas: '+tardanzas.join(', '));

  return [
    '✅ Asistencia de hoy',
    '',
    '🟢 Presentes: '+conteo.PRESENTE,
    '🔴 Ausentes: '+conteo.AUSENTE,
    '⏰ Tardanzas: '+conteo.TARDE,
    '📄 Justificados: '+conteo.JUSTIFICADO,
    '',
    detalle.join('\n')
  ].filter(Boolean).join('\n');
}


function formatearFechaTelegram(valor){
  const normalizada=normalizarFechaTextoTelegram(valor);
  if(!normalizada)return 'Sin fecha';
  const partes=normalizada.split('-');
  if(partes.length!==3)return normalizada;
  return partes[2]+'/'+partes[1]+'/'+partes[0];
}

function recortarTextoTelegram(valor,maximo){
  const texto=String(valor||'').trim();
  const limite=Number(maximo||100);
  if(texto.length<=limite)return texto;
  return texto.slice(0,Math.max(0,limite-1)).trim()+'…';
}

function capitalizarTelegram(valor){
  const texto=String(valor||'').trim().toLowerCase();
  return texto?texto.charAt(0).toUpperCase()+texto.slice(1):'';
}

function normalizarFechaTextoTelegram(valor){
  if(!valor)return '';
  if(Object.prototype.toString.call(valor)==='[object Date]'&&!Number.isNaN(valor.getTime()))return Utilities.formatDate(valor,Session.getScriptTimeZone(),'yyyy-MM-dd');
  const texto=String(valor).trim();
  if(/^\d{4}-\d{2}-\d{2}$/.test(texto))return texto;
  const fecha=new Date(texto);
  return Number.isNaN(fecha.getTime())?'':Utilities.formatDate(fecha,Session.getScriptTimeZone(),'yyyy-MM-dd');
}

function enviarMensajeTelegram(chatId,texto,mostrarMenu){
  const token=obtenerTokenBotTelegram();
  const payload={chat_id:chatId,text:String(texto||'')};
  if(mostrarMenu)payload.reply_markup=crearTecladoTelegram();
  const respuesta=UrlFetchApp.fetch('https://api.telegram.org/bot'+token+'/sendMessage',{
    method:'post',
    contentType:'application/json',
    payload:JSON.stringify(payload),
    muteHttpExceptions:true
  });
  const contenido=JSON.parse(respuesta.getContentText()||'{}');
  if(!contenido.ok)throw new Error(contenido.description||'Telegram no pudo enviar el mensaje.');
  return contenido.result;
}

function crearTecladoTelegram(){
  return {
    keyboard:[
      [{text:'🏠 Inicio'},{text:'👩‍🎓 Alumnos'}],
      [{text:'✅ Asistencia'},{text:'📝 Notas'}],
      [{text:'📚 Planes'},{text:'🎂 Cumpleaños'}],
      [{text:'🤝 Reuniones'},{text:'📅 Agenda'}],
      [{text:'❓ Ayuda'}]
    ],
    resize_keyboard:true,
    is_persistent:true,
    input_field_placeholder:'Elige una opción de Aula Mágica'
  };
}

function configurarComandosTelegram(){
  const token=obtenerTokenBotTelegram();
  const comandos=[
    {command:'inicio',description:'Estado de la cuenta'},
    {command:'alumnos',description:'Resumen de estudiantes'},
    {command:'asistencia',description:'Asistencia de hoy'},
    {command:'notas',description:'Resumen de calificaciones'},
    {command:'planes',description:'Próximas planificaciones'},
    {command:'cumpleanos',description:'Próximos cumpleaños'},
    {command:'reuniones',description:'Próximas reuniones'},
    {command:'agenda',description:'Próximos eventos'},
    {command:'ayuda',description:'Mostrar opciones'}
  ];
  const respuesta=UrlFetchApp.fetch('https://api.telegram.org/bot'+token+'/setMyCommands',{
    method:'post',contentType:'application/json',payload:JSON.stringify({commands:comandos}),muteHttpExceptions:true
  });
  const contenido=JSON.parse(respuesta.getContentText()||'{}');
  if(!contenido.ok)throw new Error(contenido.description||'No se pudieron registrar los comandos de Telegram.');
  return contenido.result;
}

function obtenerTokenBotTelegram(){
  const token=PropertiesService.getScriptProperties().getProperty('TELEGRAM_BOT_TOKEN')||'';
  if(!token)throw new Error('El bot de Telegram no está configurado.');
  return token;
}

function normalizarUsuarioTelegram(valor){
  return String(valor||'').trim().replace(/^@/,'').replace(/\s+/g,'');
}


/**
 * Funciones usadas exclusivamente por el webhook de Telegram alojado en Vercel.
 * Vercel se autentica con AULA_MAGICA_BOT_SECRET, guardado en Propiedades del script.
 */
function validarSecretoBotVercel(datos){
  const esperado=String(
    PropertiesService.getScriptProperties().getProperty('AULA_MAGICA_BOT_SECRET')||''
  ).trim();
  const recibido=String((datos&&datos.botSecret)||'').trim();

  if(!esperado){
    throw new Error('Falta configurar AULA_MAGICA_BOT_SECRET en Propiedades del script.');
  }
  if(!recibido||recibido!==esperado){
    throw new Error('Solicitud del bot no autorizada.');
  }
}

function botVincularTelegramVercel(datos){
  validarSecretoBotVercel(datos);
  validarObjeto(datos,['chatId','codigo']);

  const chatId=String(datos.chatId).trim();
  const codigo=String(datos.codigo).trim().toUpperCase();
  const hoja=obtenerHoja('TELEGRAM');

  const registro=obtenerRegistrosConFila('TELEGRAM').find(r=>
    String(r.CODIGO_VINCULACION||'').trim().toUpperCase()===codigo&&
    String(r.ESTADO||'').trim().toUpperCase()==='PENDIENTE'
  );

  if(!registro){
    return {
      ok:false,
      vinculado:false,
      texto:'❌ El código no existe, ya fue utilizado o no corresponde a una cuenta pendiente.'
    };
  }

  const creado=new Date(registro.FECHA_VINCULACION);
  if(Number.isNaN(creado.getTime())||Date.now()-creado.getTime()>30*60*1000){
    return {
      ok:false,
      vinculado:false,
      texto:'⌛ El código venció. Genera uno nuevo en Aula Mágica.'
    };
  }

  const filas=obtenerRegistrosConFila('TELEGRAM');
  const otro=filas.find(r=>
    String(r.CHAT_ID||'').trim()===chatId&&
    String(r.ID_MAESTRA)!==String(registro.ID_MAESTRA)
  );

  const lock=LockService.getScriptLock();
  lock.waitLock(20000);
  try{
    if(otro){
      hoja.getRange(otro.__fila,2,1,4).setValues([['','','DESVINCULADO',new Date()]]);
    }
    hoja.getRange(registro.__fila,1,1,5).setValues([[
      registro.ID_MAESTRA,
      chatId,
      '',
      'VINCULADO',
      new Date()
    ]]);
  }finally{
    lock.releaseLock();
  }

  const maestra=obtenerRegistros('MAESTRAS').find(r=>
    String(r.ID_MAESTRA)===String(registro.ID_MAESTRA)
  );
  const nombre=maestra
    ? (String(maestra.NOMBRE||'')+' '+String(maestra.APELLIDO||'')).trim()
    : 'Maestra';

  registrarAuditoria(
    String(registro.ID_MAESTRA),
    'VINCULAR',
    'TELEGRAM',
    'Cuenta vinculada mediante webhook de Vercel'
  );

  return {
    ok:true,
    vinculado:true,
    idMaestra:String(registro.ID_MAESTRA),
    nombre:nombre,
    texto:'✅ Cuenta vinculada correctamente con Aula Mágica.\n\nMaestra: '+nombre
  };
}


function obtenerMaestraTelegramVercel(datos){
  validarSecretoBotVercel(datos);
  validarObjeto(datos,['chatId']);

  const chatId=String(datos.chatId).trim();
  const enlace=obtenerRegistros('TELEGRAM').find(r=>
    String(r.CHAT_ID||'').trim()===chatId&&
    String(r.ESTADO||'').trim().toUpperCase()==='VINCULADO'
  );

  if(!enlace){
    throw new Error(
      'Esta cuenta de Telegram no está vinculada con Aula Mágica.'
    );
  }

  validarAccesoTelegramPorSuscripcion(enlace.ID_MAESTRA);

  return {
    chatId:chatId,
    idMaestra:String(enlace.ID_MAESTRA)
  };
}

function crearResumenCalendarioEscolarTelegram(idMaestra,modo){
  const hoy=Utilities.formatDate(
    new Date(),
    obtenerZonaHorariaAulaMagica(),
    'yyyy-MM-dd'
  );
  const manana=Utilities.formatDate(
    new Date(Date.now()+24*60*60*1000),
    obtenerZonaHorariaAulaMagica(),
    'yyyy-MM-dd'
  );

  let registros=obtenerRegistros('CALENDARIO_ESCOLAR')
    .filter(r=>
      String(r.ID_MAESTRA||'').trim()===String(idMaestra)&&
      String(r.ESTADO||'ACTIVO').trim().toUpperCase()!=='ELIMINADO'
    )
    .map(r=>({
      id:String(r.ID_CALENDARIO||''),
      titulo:String(r.TITULO||'Actividad'),
      tipo:String(r.TIPO||'EVENTO'),
      fecha:fechaTextoOrganizacionEscolar(r.FECHA_INICIO),
      hora:horaTextoOrganizacionEscolar(r.HORA),
      lugar:String(r.LUGAR||'')
    }))
    .sort((a,b)=>
      (a.fecha+' '+a.hora).localeCompare(b.fecha+' '+b.hora)
    );

  const filtro=String(modo||'PROXIMOS').toUpperCase();

  if(filtro==='HOY')registros=registros.filter(r=>r.fecha===hoy);
  else if(filtro==='MANANA')registros=registros.filter(r=>r.fecha===manana);
  else registros=registros.filter(r=>r.fecha>=hoy).slice(0,12);

  if(!registros.length){
    return '🏫 No hay actividades escolares para '+(
      filtro==='HOY'?'hoy':
      filtro==='MANANA'?'mañana':
      'los próximos días'
    )+'.';
  }

  const lineas=registros.map(r=>
    '• '+r.fecha+
    (r.hora?' · '+r.hora:'')+
    '\n  '+r.titulo+
    ' ['+r.tipo+']'+
    (r.lugar?'\n  📍 '+r.lugar:'')+
    '\n  ID: '+r.id
  );

  return [
    '🏫 Calendario escolar',
    '',
    lineas.join('\n\n'),
    '',
    'Crear:',
    '/crear_evento Título | TIPO | AAAA-MM-DD | HH:MM | Lugar',
    '',
    'Editar:',
    '/editar_evento ID | Título | TIPO | AAAA-MM-DD | HH:MM | Lugar',
    '',
    'Eliminar:',
    '/eliminar_evento ID'
  ].join('\n');
}

function crearResumenHorarioTelegram(idMaestra,diaSolicitado){
  const dias=[
    'DOMINGO',
    'LUNES',
    'MARTES',
    'MIERCOLES',
    'JUEVES',
    'VIERNES',
    'SABADO'
  ];

  const hoy=dias[new Date().getDay()];
  const dia=String(diaSolicitado||hoy)
    .trim()
    .toUpperCase()
    .replace('MIÉRCOLES','MIERCOLES')
    .replace('SÁBADO','SABADO');

  const registros=obtenerRegistros('HORARIO_SEMANAL')
    .filter(r=>
      String(r.ID_MAESTRA||'').trim()===String(idMaestra)&&
      String(r.DIA||'').trim().toUpperCase()===dia&&
      String(r.ESTADO||'ACTIVO').trim().toUpperCase()!=='ELIMINADO'
    )
    .sort((a,b)=>
      horaTextoOrganizacionEscolar(a.HORA_INICIO)
        .localeCompare(horaTextoOrganizacionEscolar(b.HORA_INICIO))
    );

  if(!registros.length){
    return '🗓️ No hay clases registradas para '+dia+'.\n\n'+
      'Consulta otro día con:\n/horario LUNES';
  }

  const lineas=registros.map(r=>
    '• '+horaTextoOrganizacionEscolar(r.HORA_INICIO)+
    '–'+horaTextoOrganizacionEscolar(r.HORA_FIN)+
    ' · '+String(r.ASIGNATURA||'Clase')+
    (r.GRADO?' · '+String(r.GRADO):'')+
    (r.SECCION?' '+String(r.SECCION):'')+
    (r.AULA?'\n  📍 '+String(r.AULA):'')+
    '\n  ID: '+String(r.ID_HORARIO||'')
  );

  return [
    '🗓️ Horario semanal · '+dia,
    '',
    lineas.join('\n\n'),
    '',
    'Crear:',
    '/crear_clase DIA | HH:MM | HH:MM | Asignatura | Grado | Sección | Aula',
    '',
    'Editar:',
    '/editar_clase ID | DIA | HH:MM | HH:MM | Asignatura | Grado | Sección | Aula',
    '',
    'Eliminar:',
    '/eliminar_clase ID'
  ].join('\n');
}

function dividirCamposTelegram(valor){
  return String(valor||'')
    .split('|')
    .map(x=>String(x||'').trim());
}

function botGuardarCalendarioTelegram(datos){
  const acceso=obtenerMaestraTelegramVercel(datos);
  const campos=dividirCamposTelegram(datos.argumento);

  const editar=Boolean(datos.editar);
  const minimo=editar?6:5;

  if(campos.length<minimo){
    throw new Error(
      editar
        ? 'Formato: /editar_evento ID | Título | TIPO | AAAA-MM-DD | HH:MM | Lugar'
        : 'Formato: /crear_evento Título | TIPO | AAAA-MM-DD | HH:MM | Lugar'
    );
  }

  const desplazamiento=editar?1:0;
  const id=editar?campos[0]:'';
  const titulo=campos[desplazamiento];
  const tipo=String(campos[desplazamiento+1]||'EVENTO').toUpperCase();
  const fecha=campos[desplazamiento+2];
  const hora=campos[desplazamiento+3]||'';
  const lugar=campos.slice(desplazamiento+4).join(' | ');

  const permitidos=[
    'CLASE',
    'EVALUACION',
    'REUNION',
    'FERIADO',
    'EVENTO',
    'ENTREGA'
  ];

  if(!permitidos.includes(tipo)){
    throw new Error(
      'TIPO debe ser: CLASE, EVALUACION, REUNION, FERIADO, EVENTO o ENTREGA.'
    );
  }

  if(!/^\d{4}-\d{2}-\d{2}$/.test(fecha)){
    throw new Error('La fecha debe tener formato AAAA-MM-DD.');
  }

  if(hora&&!/^\d{2}:\d{2}$/.test(hora)){
    throw new Error('La hora debe tener formato HH:MM.');
  }

  const hoja=obtenerHoja('CALENDARIO_ESCOLAR');
  const registros=obtenerRegistrosConFila('CALENDARIO_ESCOLAR');
  const existente=id
    ?registros.find(r=>
      String(r.ID_CALENDARIO||'').trim()===id&&
      String(r.ID_MAESTRA||'').trim()===acceso.idMaestra
    )
    :null;

  if(editar&&!existente){
    throw new Error('No se encontró ese evento o no tienes permiso.');
  }

  const idFinal=id||generarId('CAL');
  const fila=[
    idFinal,
    acceso.idMaestra,
    limpiarTexto(titulo),
    tipo,
    fecha,
    fecha,
    hora,
    limpiarTexto(lugar),
    '',
    '1_DIA',
    'ACTIVO',
    existente?existente.FECHA_REGISTRO||new Date():new Date()
  ];

  if(existente){
    hoja.getRange(existente.__fila,1,1,fila.length).setValues([fila]);
  }else{
    hoja.appendRow(fila);
  }

  registrarAuditoria(
    acceso.idMaestra,
    existente?'EDITAR':'CREAR',
    'CALENDARIO_ESCOLAR',
    (existente?'Evento editado: ':'Evento creado: ')+titulo
  );

  return {
    vinculado:true,
    guardado:true,
    texto:'✅ Actividad '+(existente?'actualizada':'creada')+
      ' correctamente.\n\n'+
      titulo+'\n'+fecha+(hora?' · '+hora:'')+
      '\nID: '+idFinal
  };
}

function botEliminarCalendarioTelegram(datos){
  const acceso=obtenerMaestraTelegramVercel(datos);
  const id=String(datos.id||'').trim();

  if(!id)throw new Error('Formato: /eliminar_evento ID');

  const registro=obtenerRegistrosConFila('CALENDARIO_ESCOLAR').find(r=>
    String(r.ID_CALENDARIO||'').trim()===id&&
    String(r.ID_MAESTRA||'').trim()===acceso.idMaestra
  );

  if(!registro){
    throw new Error('No se encontró ese evento o no tienes permiso.');
  }

  obtenerHoja('CALENDARIO_ESCOLAR').deleteRow(registro.__fila);

  registrarAuditoria(
    acceso.idMaestra,
    'ELIMINAR',
    'CALENDARIO_ESCOLAR',
    'Evento eliminado desde Telegram: '+String(registro.TITULO||'')
  );

  return {
    vinculado:true,
    eliminado:true,
    texto:'🗑️ Actividad eliminada correctamente.'
  };
}

function botGuardarHorarioTelegram(datos){
  const acceso=obtenerMaestraTelegramVercel(datos);
  const campos=dividirCamposTelegram(datos.argumento);

  const editar=Boolean(datos.editar);
  const minimo=editar?8:7;

  if(campos.length<minimo){
    throw new Error(
      editar
        ? 'Formato: /editar_clase ID | DIA | HH:MM | HH:MM | Asignatura | Grado | Sección | Aula'
        : 'Formato: /crear_clase DIA | HH:MM | HH:MM | Asignatura | Grado | Sección | Aula'
    );
  }

  const desplazamiento=editar?1:0;
  const id=editar?campos[0]:'';
  const dia=String(campos[desplazamiento]||'').toUpperCase()
    .replace('MIÉRCOLES','MIERCOLES')
    .replace('SÁBADO','SABADO');
  const inicio=campos[desplazamiento+1];
  const fin=campos[desplazamiento+2];
  const asignatura=campos[desplazamiento+3];
  const grado=campos[desplazamiento+4];
  const seccion=campos[desplazamiento+5];
  const aula=campos.slice(desplazamiento+6).join(' | ');

  const dias=[
    'LUNES','MARTES','MIERCOLES','JUEVES',
    'VIERNES','SABADO','DOMINGO'
  ];

  if(!dias.includes(dia)){
    throw new Error('El día no es válido.');
  }

  if(
    !/^\d{2}:\d{2}$/.test(inicio)||
    !/^\d{2}:\d{2}$/.test(fin)
  ){
    throw new Error('Las horas deben tener formato HH:MM.');
  }

  if(fin<=inicio){
    throw new Error('La hora final debe ser posterior a la inicial.');
  }

  const hoja=obtenerHoja('HORARIO_SEMANAL');
  const registros=obtenerRegistrosConFila('HORARIO_SEMANAL');
  const existente=id
    ?registros.find(r=>
      String(r.ID_HORARIO||'').trim()===id&&
      String(r.ID_MAESTRA||'').trim()===acceso.idMaestra
    )
    :null;

  if(editar&&!existente){
    throw new Error('No se encontró esa clase o no tienes permiso.');
  }

  const idFinal=id||generarId('HOR');
  const fila=[
    idFinal,
    acceso.idMaestra,
    dia,
    inicio,
    fin,
    limpiarTexto(asignatura),
    limpiarTexto(grado),
    limpiarTexto(seccion),
    limpiarTexto(aula),
    existente?String(existente.COLOR||'#ff8fc7'):'#ff8fc7',
    '',
    'ACTIVO'
  ];

  if(existente){
    hoja.getRange(existente.__fila,1,1,fila.length).setValues([fila]);
  }else{
    hoja.appendRow(fila);
  }

  registrarAuditoria(
    acceso.idMaestra,
    existente?'EDITAR':'CREAR',
    'HORARIO_SEMANAL',
    (existente?'Clase editada: ':'Clase creada: ')+asignatura
  );

  return {
    vinculado:true,
    guardado:true,
    texto:'✅ Clase '+(existente?'actualizada':'creada')+
      ' correctamente.\n\n'+
      dia+' · '+inicio+'–'+fin+
      '\n'+asignatura+
      '\nID: '+idFinal
  };
}

function botEliminarHorarioTelegram(datos){
  const acceso=obtenerMaestraTelegramVercel(datos);
  const id=String(datos.id||'').trim();

  if(!id)throw new Error('Formato: /eliminar_clase ID');

  const registro=obtenerRegistrosConFila('HORARIO_SEMANAL').find(r=>
    String(r.ID_HORARIO||'').trim()===id&&
    String(r.ID_MAESTRA||'').trim()===acceso.idMaestra
  );

  if(!registro){
    throw new Error('No se encontró esa clase o no tienes permiso.');
  }

  obtenerHoja('HORARIO_SEMANAL').deleteRow(registro.__fila);

  registrarAuditoria(
    acceso.idMaestra,
    'ELIMINAR',
    'HORARIO_SEMANAL',
    'Clase eliminada desde Telegram: '+String(registro.ASIGNATURA||'')
  );

  return {
    vinculado:true,
    eliminado:true,
    texto:'🗑️ Clase eliminada correctamente.'
  };
}

function botComandoTelegramVercel(datos){
  validarSecretoBotVercel(datos);
  validarObjeto(datos,['chatId','comando']);

  const chatId=String(datos.chatId).trim();
  const comando=String(datos.comando).trim().toLowerCase().replace(/^\//,'');
  const enlace=obtenerRegistros('TELEGRAM').find(r=>
    String(r.CHAT_ID||'').trim()===chatId&&
    String(r.ESTADO||'').trim().toUpperCase()==='VINCULADO'
  );

  if(!enlace){
    return {
      vinculado:false,
      texto:'🔒 Esta cuenta de Telegram no está vinculada.\n\nAbre Aula Mágica → Telegram, genera un código nuevo y envía:\n/vincular CODIGO'
    };
  }

  const idMaestra=String(enlace.ID_MAESTRA);

  const maestraTelegram=obtenerRegistros('MAESTRAS').find(r=>
    String(r.ID_MAESTRA||'')===idMaestra
  );

  if(!maestraTelegram){
    return {
      vinculado:false,
      texto:'No se encontró la cuenta vinculada.'
    };
  }

  try{
    validarAccesoPorSuscripcion(maestraTelegram);
  }catch(error){
    const mensaje=String(
      error&&error.message?error.message:error
    ).replace(/^SUSCRIPCION_REQUERIDA:/,'');

    return {
      vinculado:true,
      suscripcionVencida:true,
      texto:mensaje
    };
  }

  let texto='';

  if(comando==='inicio'||comando==='start'||comando==='estado'){
    const maestra=obtenerRegistros('MAESTRAS').find(r=>
      String(r.ID_MAESTRA)===idMaestra
    );
    const nombre=maestra
      ? (String(maestra.NOMBRE||'')+' '+String(maestra.APELLIDO||'')).trim()
      : 'Cuenta vinculada';
    const grado=maestra?String(maestra.GRADO||''):'';
    const seccion=maestra?String(maestra.SECCION||''):'';
    const hoy=Utilities.formatDate(new Date(),obtenerZonaHorariaAulaMagica(),'yyyy-MM-dd');
    const totalAlumnos=obtenerRegistros('ALUMNOS').filter(r=>
      String(r.ID_MAESTRA)===idMaestra&&String(r.ESTADO).toUpperCase()!=='ELIMINADO'
    ).length;
    const asistenciaHoy=obtenerRegistros('ASISTENCIA').filter(r=>
      String(r.ID_MAESTRA)===idMaestra&&normalizarFechaTextoTelegram(r.FECHA)===hoy
    ).length;
    const eventosHoy=obtenerRegistros('AGENDA').filter(r=>
      String(r.ID_MAESTRA)===idMaestra&&
      normalizarFechaTextoTelegram(r.FECHA)===hoy&&
      String(r.ESTADO).toUpperCase()==='PENDIENTE'
    ).length;

    texto=[
      '✨ Aula Mágica conectada',
      '',
      'Maestra: '+nombre,
      grado||seccion?'Curso: '+[grado,seccion?'Sección '+seccion:''].filter(Boolean).join(' · '):'',
      '',
      '👩‍🎓 Alumnos: '+totalAlumnos,
      asistenciaHoy?'✅ Asistencia de hoy guardada':'📋 Asistencia de hoy pendiente',
      '📅 Eventos pendientes hoy: '+eventosHoy,
      '',
      'Selecciona una opción del menú.'
    ].filter(Boolean).join('\n');
  }else if(comando==='alumnos'){
    texto=crearResumenAlumnosTelegram(idMaestra);
  }else if(comando==='asistencia'){
    texto=crearResumenAsistenciaTelegram(idMaestra);
  }else if(comando==='notas'||comando==='calificaciones'){
    texto=crearResumenCalificacionesTelegram(idMaestra);
  }else if(comando==='planes'||comando==='planificacion'){
    texto=crearResumenPlanificacionesTelegram(idMaestra);
  }else if(comando==='cumpleanos'){
    texto=crearResumenCumpleanosTelegram(idMaestra);
  }else if(comando==='reuniones'){
    texto=crearResumenReunionesTelegram(idMaestra);
  }else if(comando==='agenda'){
    texto=crearResumenAgendaTelegram(idMaestra);
  }else if(
    comando==='calendario'||
    comando==='calendario_hoy'||
    comando==='calendario_manana'
  ){
    const modo=
      comando==='calendario_hoy'?'HOY':
      comando==='calendario_manana'?'MANANA':
      'PROXIMOS';
    texto=crearResumenCalendarioEscolarTelegram(idMaestra,modo);
  }else if(comando.indexOf('horario')===0){
    const partes=comando.split(':');
    texto=crearResumenHorarioTelegram(idMaestra,partes[1]||'');
  }else if(comando==='ayuda'){
    texto=[
      '📱 Comandos de Aula Mágica',
      '',
      '/inicio — Estado de la cuenta',
      '/alumnos — Resumen de estudiantes',
      '/asistencia — Resumen de hoy',
      '/notas — Resumen de calificaciones',
      '/planes — Próximas planificaciones',
      '/cumpleanos — Próximos cumpleaños',
      '/reuniones — Próximas reuniones',
      '/agenda — Próximos eventos',
      '/ayuda — Mostrar esta ayuda'
    ].join('\n');
  }else{
    texto='No reconozco esa opción. Usa los botones o escribe /ayuda.';
  }

  return {
    vinculado:true,
    idMaestra:idMaestra,
    texto:String(texto||'No hay información disponible.')
  };
}


function obtenerMaestraTelegramPorChat(datos){
  validarSecretoBotVercel(datos);
  validarObjeto(datos,['chatId']);
  const chatId=String(datos.chatId).trim();
  const enlace=obtenerRegistros('TELEGRAM').find(r=>
    String(r.CHAT_ID||'').trim()===chatId&&
    String(r.ESTADO||'').trim().toUpperCase()==='VINCULADO'
  );
  if(!enlace)throw new Error('Esta cuenta de Telegram no está vinculada.');
  return {
    chatId:chatId,
    idMaestra:String(enlace.ID_MAESTRA)
  };
}

function botListarAlumnosAsistencia(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  const alumnos=obtenerRegistros('ALUMNOS')
    .filter(r=>
      String(r.ID_MAESTRA)===enlace.idMaestra&&
      String(r.ESTADO).toUpperCase()!=='ELIMINADO'
    )
    .map(r=>({
      idAlumno:String(r.ID_ALUMNO||''),
      nombre:(String(r.NOMBRE||'')+' '+String(r.APELLIDO||'')).trim(),
      grado:String(r.GRADO||''),
      seccion:String(r.SECCION||'')
    }))
    .sort((a,b)=>a.nombre.localeCompare(b.nombre));

  return {
    vinculado:true,
    idMaestra:enlace.idMaestra,
    alumnos:alumnos
  };
}

function botGuardarAsistenciaRapida(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  validarObjeto(datos,['modo']);

  const modo=String(datos.modo||'').trim().toUpperCase();
  const fecha=Utilities.formatDate(new Date(),obtenerZonaHorariaAulaMagica(),'yyyy-MM-dd');
  const alumnos=obtenerRegistros('ALUMNOS').filter(r=>
    String(r.ID_MAESTRA)===enlace.idMaestra&&
    String(r.ESTADO).toUpperCase()!=='ELIMINADO'
  );

  if(!alumnos.length)throw new Error('No hay alumnos registrados.');

  const hoja=obtenerHoja('ASISTENCIA');
  const registrosHoy=obtenerRegistrosConFila('ASISTENCIA').filter(r=>
    String(r.ID_MAESTRA)===enlace.idMaestra&&
    normalizarFechaAsistencia(r.FECHA)===fecha
  );

  function guardarUnico(idAlumno,estado,observaciones){
    const coincidencias=registrosHoy
      .filter(r=>String(r.ID_ALUMNO)===String(idAlumno))
      .sort((a,b)=>a.__fila-b.__fila);

    if(coincidencias.length){
      const principal=coincidencias[0];
      hoja.getRange(principal.__fila,1,1,7).setValues([[
        principal.ID_ASISTENCIA||generarId('ASI'),
        enlace.idMaestra,
        String(idAlumno),
        fecha,
        estado,
        observaciones,
        new Date()
      ]]);

      // Elimina duplicados antiguos de abajo hacia arriba.
      coincidencias
        .slice(1)
        .map(r=>r.__fila)
        .sort((a,b)=>b-a)
        .forEach(fila=>hoja.deleteRow(fila));
    }else{
      hoja.appendRow([
        generarId('ASI'),
        enlace.idMaestra,
        String(idAlumno),
        fecha,
        estado,
        observaciones,
        new Date()
      ]);
    }
  }

  const lock=LockService.getScriptLock();
  lock.waitLock(20000);
  try{
    if(modo==='TODOS_PRESENTES'){
      alumnos.forEach(a=>{
        guardarUnico(
          String(a.ID_ALUMNO),
          'PRESENTE',
          'Marcado desde Telegram'
        );
      });

      registrarAuditoria(
        enlace.idMaestra,
        'GUARDAR',
        'ASISTENCIA',
        'Todos presentes desde Telegram: '+alumnos.length+' alumnos'
      );

      return {
        guardados:alumnos.length,
        fecha:fecha,
        texto:'✅ Asistencia guardada.\n\nTodos los alumnos quedaron marcados como presentes.'
      };
    }

    validarObjeto(datos,['idAlumno','estado']);
    const idAlumno=String(datos.idAlumno).trim();
    const estado=String(datos.estado).trim().toUpperCase();
    const permitidos=['PRESENTE','AUSENTE','TARDE','JUSTIFICADO'];

    if(!permitidos.includes(estado))throw new Error('Estado de asistencia no válido.');

    const alumno=alumnos.find(a=>String(a.ID_ALUMNO)===idAlumno);
    if(!alumno)throw new Error('El alumno no pertenece a esta maestra.');

    guardarUnico(
      idAlumno,
      estado,
      'Marcado desde Telegram'
    );

    const nombre=(String(alumno.NOMBRE||'')+' '+String(alumno.APELLIDO||'')).trim();
    registrarAuditoria(
      enlace.idMaestra,
      'GUARDAR',
      'ASISTENCIA',
      nombre+' marcado '+estado+' desde Telegram'
    );

    return {
      guardados:1,
      fecha:fecha,
      idAlumno:idAlumno,
      estado:estado,
      nombre:nombre,
      texto:'✅ '+nombre+' quedó marcado como '+estado.toLowerCase()+'.'
    };
  }finally{
    lock.releaseLock();
  }
}


function claveFlujoAgendaTelegram(chatId){
  return 'TELEGRAM_AGENDA_FLUJO_'+String(chatId).trim();
}

function guardarFlujoAgendaTelegram(chatId,flujo){
  const contenido=Object.assign({},flujo,{actualizado:Date.now()});
  PropertiesService.getScriptProperties().setProperty(
    claveFlujoAgendaTelegram(chatId),
    JSON.stringify(contenido)
  );
  return contenido;
}

function obtenerFlujoAgendaTelegram(chatId){
  const clave=claveFlujoAgendaTelegram(chatId);
  const valor=PropertiesService.getScriptProperties().getProperty(clave);
  if(!valor)return null;

  try{
    const flujo=JSON.parse(valor);
    if(Date.now()-Number(flujo.actualizado||0)>60*60*1000){
      PropertiesService.getScriptProperties().deleteProperty(clave);
      return null;
    }
    return flujo;
  }catch(_){
    PropertiesService.getScriptProperties().deleteProperty(clave);
    return null;
  }
}

function borrarFlujoAgendaTelegram(chatId){
  PropertiesService.getScriptProperties().deleteProperty(
    claveFlujoAgendaTelegram(chatId)
  );
}

function normalizarFechaEntradaAgendaTelegram(valor){
  const texto=String(valor||'').trim().toLowerCase();
  const zona=obtenerZonaHorariaAulaMagica();
  const hoy=new Date();

  if(texto==='hoy'){
    return Utilities.formatDate(hoy,zona,'yyyy-MM-dd');
  }

  if(texto==='mañana'||texto==='manana'){
    const manana=new Date(hoy.getTime());
    manana.setDate(manana.getDate()+1);
    return Utilities.formatDate(manana,zona,'yyyy-MM-dd');
  }

  let ano,mes,dia;
  let m=texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if(m){
    dia=Number(m[1]); mes=Number(m[2]); ano=Number(m[3]);
  }else{
    m=texto.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if(!m)throw new Error('Escribe la fecha como DD/MM/AAAA, por ejemplo 30/07/2026.');
    ano=Number(m[1]); mes=Number(m[2]); dia=Number(m[3]);
  }

  const fecha=new Date(ano,mes-1,dia,12,0,0);
  if(
    fecha.getFullYear()!==ano||
    fecha.getMonth()!==mes-1||
    fecha.getDate()!==dia
  ){
    throw new Error('La fecha no es válida.');
  }

  return [
    String(ano).padStart(4,'0'),
    String(mes).padStart(2,'0'),
    String(dia).padStart(2,'0')
  ].join('-');
}

function normalizarHoraEntradaAgendaTelegram(valor){
  const texto=String(valor||'').trim();
  const m=texto.match(/^(\d{1,2}):(\d{2})$/);
  if(!m)throw new Error('Escribe la hora como HH:MM, por ejemplo 08:30.');

  const hora=Number(m[1]);
  const minuto=Number(m[2]);
  if(hora<0||hora>23||minuto<0||minuto>59){
    throw new Error('La hora no es válida.');
  }

  return String(hora).padStart(2,'0')+':'+String(minuto).padStart(2,'0');
}

function resumenBorradorAgendaTelegram(datos){
  return [
    '📅 Revisa el evento',
    '',
    'Título: '+String(datos.titulo||''),
    'Fecha: '+formatearFechaTelegram(datos.fecha),
    'Hora: '+String(datos.hora||''),
    'Tipo: '+capitalizarTelegram(datos.tipo||'OTRO'),
    'Descripción: '+(String(datos.descripcion||'').trim()||'Sin descripción')
  ].join('\n');
}

function botIniciarAgendaTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  guardarFlujoAgendaTelegram(enlace.chatId,{
    idMaestra:enlace.idMaestra,
    paso:'TITULO',
    datos:{}
  });

  return {
    activo:true,
    paso:'TITULO',
    texto:'➕ Nuevo evento\n\nEscribe el título del evento.\n\nPuedes cancelar en cualquier momento con /cancelar.'
  };
}

function botProcesarFlujoAgendaTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  validarObjeto(datos,['texto']);

  const texto=String(datos.texto||'').trim();
  const flujo=obtenerFlujoAgendaTelegram(enlace.chatId);
  if(!flujo)return {activo:false};

  if(texto.toLowerCase()==='/cancelar'){
    borrarFlujoAgendaTelegram(enlace.chatId);
    return {
      activo:false,
      cancelado:true,
      texto:'❌ Creación del evento cancelada.'
    };
  }

  flujo.datos=flujo.datos||{};

  if(flujo.paso==='TITULO'){
    if(texto.length<2)throw new Error('El título debe tener al menos 2 caracteres.');
    if(texto.length>120)throw new Error('El título es demasiado largo.');
    flujo.datos.titulo=texto;
    flujo.paso='FECHA';
    guardarFlujoAgendaTelegram(enlace.chatId,flujo);
    return {
      activo:true,
      paso:'FECHA',
      texto:'📅 Escribe la fecha como DD/MM/AAAA.\n\nTambién puedes escribir hoy o mañana.'
    };
  }

  if(flujo.paso==='FECHA'){
    flujo.datos.fecha=normalizarFechaEntradaAgendaTelegram(texto);
    flujo.paso='HORA';
    guardarFlujoAgendaTelegram(enlace.chatId,flujo);
    return {
      activo:true,
      paso:'HORA',
      texto:'🕐 Escribe la hora como HH:MM.\n\nEjemplo: 08:30'
    };
  }

  if(flujo.paso==='HORA'){
    flujo.datos.hora=normalizarHoraEntradaAgendaTelegram(texto);
    flujo.paso='TIPO';
    guardarFlujoAgendaTelegram(enlace.chatId,flujo);
    return {
      activo:true,
      paso:'TIPO',
      texto:'🏷️ Selecciona el tipo de evento.'
    };
  }

  if(flujo.paso==='DESCRIPCION'){
    if(texto.length>500)throw new Error('La descripción es demasiado larga.');
    flujo.datos.descripcion=texto==='-'?'':texto;
    flujo.paso='CONFIRMAR';
    guardarFlujoAgendaTelegram(enlace.chatId,flujo);
    return {
      activo:true,
      paso:'CONFIRMAR',
      texto:resumenBorradorAgendaTelegram(flujo.datos)
    };
  }

  return {
    activo:true,
    paso:String(flujo.paso||''),
    texto:'Continúa usando los botones mostrados o escribe /cancelar.'
  };
}

function botSeleccionarTipoAgendaTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  validarObjeto(datos,['tipo']);

  const flujo=obtenerFlujoAgendaTelegram(enlace.chatId);
  if(!flujo||flujo.paso!=='TIPO'){
    throw new Error('No hay un evento esperando el tipo.');
  }

  const tipo=String(datos.tipo||'').trim().toUpperCase();
  const permitidos=['CLASE','ACTIVIDAD','RECORDATORIO','ENTREGA','OTRO'];
  if(!permitidos.includes(tipo))throw new Error('Tipo de evento no válido.');

  flujo.datos=flujo.datos||{};
  flujo.datos.tipo=tipo;
  flujo.paso='DESCRIPCION';
  guardarFlujoAgendaTelegram(enlace.chatId,flujo);

  return {
    activo:true,
    paso:'DESCRIPCION',
    texto:'📝 Escribe una descripción.\n\nEscribe un guion - para dejarla vacía.'
  };
}

function botConfirmarAgendaTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  const flujo=obtenerFlujoAgendaTelegram(enlace.chatId);

  if(!flujo||flujo.paso!=='CONFIRMAR'){
    throw new Error('No hay un evento pendiente de confirmación.');
  }

  const d=flujo.datos||{};
  if(!d.titulo||!d.fecha||!d.hora||!d.tipo){
    throw new Error('Faltan datos del evento.');
  }

  const idEvento=generarId('EVE');
  const hojaAgenda=obtenerHoja('AGENDA');
  const nuevaFila=hojaAgenda.getLastRow()+1;
  guardarFilaAgendaComoTexto(hojaAgenda,nuevaFila,[
    idEvento,
    enlace.idMaestra,
    String(d.titulo),
    String(d.tipo),
    String(d.fecha),
    String(d.hora),
    String(d.descripcion||''),
    'PENDIENTE',
    new Date()
  ]);

  registrarAuditoria(
    enlace.idMaestra,
    'CREAR',
    'AGENDA',
    'Evento creado desde Telegram: '+String(d.titulo)
  );

  borrarFlujoAgendaTelegram(enlace.chatId);

  return {
    activo:false,
    guardado:true,
    idEvento:idEvento,
    texto:'✅ Evento guardado correctamente.\n\n'+resumenBorradorAgendaTelegram(d)
  };
}

function botCancelarFlujoAgendaTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  borrarFlujoAgendaTelegram(enlace.chatId);
  return {
    activo:false,
    cancelado:true,
    texto:'❌ Creación del evento cancelada.'
  };
}


function claveFlujoReunionTelegram(chatId){
  return 'TELEGRAM_REUNION_FLUJO_'+String(chatId).trim();
}

function guardarFlujoReunionTelegram(chatId,flujo){
  const contenido=Object.assign({},flujo,{actualizado:Date.now()});
  PropertiesService.getScriptProperties().setProperty(
    claveFlujoReunionTelegram(chatId),
    JSON.stringify(contenido)
  );
  return contenido;
}

function obtenerFlujoReunionTelegram(chatId){
  const clave=claveFlujoReunionTelegram(chatId);
  const valor=PropertiesService.getScriptProperties().getProperty(clave);
  if(!valor)return null;

  try{
    const flujo=JSON.parse(valor);
    if(Date.now()-Number(flujo.actualizado||0)>60*60*1000){
      PropertiesService.getScriptProperties().deleteProperty(clave);
      return null;
    }
    return flujo;
  }catch(_){
    PropertiesService.getScriptProperties().deleteProperty(clave);
    return null;
  }
}

function borrarFlujoReunionTelegram(chatId){
  PropertiesService.getScriptProperties().deleteProperty(
    claveFlujoReunionTelegram(chatId)
  );
}

function resumenBorradorReunionTelegram(datos){
  return [
    '🤝 Revisa la reunión',
    '',
    'Título: '+String(datos.titulo||''),
    'Fecha: '+formatearFechaTelegram(datos.fecha),
    'Hora: '+String(datos.hora||''),
    'Lugar: '+(String(datos.lugar||'').trim()||'Sin lugar'),
    'Participantes: '+(String(datos.participantes||'').trim()||'Sin participantes'),
    'Temas: '+(String(datos.temas||'').trim()||'Sin temas')
  ].join('\n');
}

function botIniciarReunionTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  guardarFlujoReunionTelegram(enlace.chatId,{
    idMaestra:enlace.idMaestra,
    paso:'TITULO',
    datos:{}
  });

  return {
    activo:true,
    paso:'TITULO',
    texto:'➕ Nueva reunión\n\nEscribe el título de la reunión.\n\nPuedes cancelar con /cancelar.'
  };
}

function botProcesarFlujoReunionTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  validarObjeto(datos,['texto']);

  const texto=String(datos.texto||'').trim();
  const flujo=obtenerFlujoReunionTelegram(enlace.chatId);
  if(!flujo)return {activo:false};

  if(texto.toLowerCase()==='/cancelar'){
    borrarFlujoReunionTelegram(enlace.chatId);
    return {activo:false,cancelado:true,texto:'❌ Creación de reunión cancelada.'};
  }

  flujo.datos=flujo.datos||{};

  if(flujo.paso==='TITULO'){
    if(texto.length<2)throw new Error('El título debe tener al menos 2 caracteres.');
    flujo.datos.titulo=texto;
    flujo.paso='FECHA';
    guardarFlujoReunionTelegram(enlace.chatId,flujo);
    return {
      activo:true,
      paso:'FECHA',
      texto:'📅 Escribe la fecha como DD/MM/AAAA.\n\nTambién puedes escribir hoy o mañana.'
    };
  }

  if(flujo.paso==='FECHA'){
    flujo.datos.fecha=normalizarFechaEntradaAgendaTelegram(texto);
    flujo.paso='HORA';
    guardarFlujoReunionTelegram(enlace.chatId,flujo);
    return {
      activo:true,
      paso:'HORA',
      texto:'🕐 Escribe la hora como HH:MM.\n\nEjemplo: 09:00'
    };
  }

  if(flujo.paso==='HORA'){
    flujo.datos.hora=normalizarHoraEntradaAgendaTelegram(texto);
    flujo.paso='LUGAR';
    guardarFlujoReunionTelegram(enlace.chatId,flujo);
    return {
      activo:true,
      paso:'LUGAR',
      texto:'📍 Escribe el lugar de la reunión.\n\nEscribe un guion - para dejarlo vacío.'
    };
  }

  if(flujo.paso==='LUGAR'){
    flujo.datos.lugar=texto==='-'?'':texto;
    flujo.paso='PARTICIPANTES';
    guardarFlujoReunionTelegram(enlace.chatId,flujo);
    return {
      activo:true,
      paso:'PARTICIPANTES',
      texto:'👥 Escribe los participantes.\n\nEjemplo: representantes y docentes'
    };
  }

  if(flujo.paso==='PARTICIPANTES'){
    flujo.datos.participantes=texto==='-'?'':texto;
    flujo.paso='TEMAS';
    guardarFlujoReunionTelegram(enlace.chatId,flujo);
    return {
      activo:true,
      paso:'TEMAS',
      texto:'📝 Escribe los temas a tratar.\n\nEscribe un guion - para dejarlo vacío.'
    };
  }

  if(flujo.paso==='TEMAS'){
    flujo.datos.temas=texto==='-'?'':texto;
    flujo.paso='CONFIRMAR';
    guardarFlujoReunionTelegram(enlace.chatId,flujo);
    return {
      activo:true,
      paso:'CONFIRMAR',
      texto:resumenBorradorReunionTelegram(flujo.datos)
    };
  }

  return {
    activo:true,
    paso:String(flujo.paso||''),
    texto:'Continúa con el siguiente paso o escribe /cancelar.'
  };
}

function botConfirmarReunionTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  const flujo=obtenerFlujoReunionTelegram(enlace.chatId);

  if(!flujo||flujo.paso!=='CONFIRMAR'){
    throw new Error('No hay una reunión pendiente de confirmación.');
  }

  const d=flujo.datos||{};
  if(!d.titulo||!d.fecha||!d.hora){
    throw new Error('Faltan datos de la reunión.');
  }

  const idReunion=generarId('REU');
  const hoja=obtenerHoja('REUNIONES');
  const fila=hoja.getLastRow()+1;
  hoja.getRange(fila,1,1,12).setValues([[
    idReunion,
    enlace.idMaestra,
    String(d.titulo),
    String(d.fecha),
    String(d.hora),
    String(d.lugar||''),
    String(d.participantes||''),
    String(d.temas||''),
    '',
    'PROGRAMADA',
    new Date(),
    new Date()
  ]]);
  hoja.getRange(fila,4,1,2).setNumberFormat('@');
  hoja.getRange(fila,4).setValue(String(d.fecha));
  hoja.getRange(fila,5).setValue(String(d.hora));

  registrarAuditoria(
    enlace.idMaestra,
    'CREAR',
    'REUNIONES',
    'Reunión creada desde Telegram: '+String(d.titulo)
  );

  borrarFlujoReunionTelegram(enlace.chatId);

  return {
    activo:false,
    guardado:true,
    idReunion:idReunion,
    texto:'✅ Reunión guardada correctamente.\n\n'+resumenBorradorReunionTelegram(d)
  };
}

function botCancelarFlujoReunionTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  borrarFlujoReunionTelegram(enlace.chatId);
  return {
    activo:false,
    cancelado:true,
    texto:'❌ Creación de reunión cancelada.'
  };
}


function claveFlujoPlanificacionTelegram(chatId){
  return 'TELEGRAM_PLANIFICACION_FLUJO_'+String(chatId).trim();
}

function guardarFlujoPlanificacionTelegram(chatId,flujo){
  const contenido=Object.assign({},flujo,{actualizado:Date.now()});
  PropertiesService.getScriptProperties().setProperty(
    claveFlujoPlanificacionTelegram(chatId),
    JSON.stringify(contenido)
  );
  return contenido;
}

function obtenerFlujoPlanificacionTelegram(chatId){
  const clave=claveFlujoPlanificacionTelegram(chatId);
  const valor=PropertiesService.getScriptProperties().getProperty(clave);
  if(!valor)return null;

  try{
    const flujo=JSON.parse(valor);
    if(Date.now()-Number(flujo.actualizado||0)>60*60*1000){
      PropertiesService.getScriptProperties().deleteProperty(clave);
      return null;
    }
    return flujo;
  }catch(_){
    PropertiesService.getScriptProperties().deleteProperty(clave);
    return null;
  }
}

function borrarFlujoPlanificacionTelegram(chatId){
  PropertiesService.getScriptProperties().deleteProperty(
    claveFlujoPlanificacionTelegram(chatId)
  );
}

function resumenBorradorPlanificacionTelegram(datos){
  return [
    '📚 Revisa la planificación',
    '',
    'Título: '+String(datos.titulo||''),
    'Asignatura: '+String(datos.asignatura||''),
    'Grado: '+String(datos.grado||''),
    'Fecha: '+formatearFechaTelegram(datos.fecha),
    'Objetivo: '+String(datos.objetivo||''),
    'Contenido: '+String(datos.contenido||''),
    'Actividades: '+String(datos.actividades||''),
    'Recursos: '+(String(datos.recursos||'').trim()||'Sin recursos'),
    'Evaluación: '+(String(datos.evaluacion||'').trim()||'Sin evaluación')
  ].join('\n');
}

function botIniciarPlanificacionTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);

  guardarFlujoPlanificacionTelegram(enlace.chatId,{
    idMaestra:enlace.idMaestra,
    paso:'TITULO',
    datos:{}
  });

  return {
    activo:true,
    paso:'TITULO',
    texto:'➕ Nueva planificación\n\nEscribe el título.\n\nPuedes cancelar con /cancelar.'
  };
}

function botProcesarFlujoPlanificacionTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  validarObjeto(datos,['texto']);

  const texto=String(datos.texto||'').trim();
  const flujo=obtenerFlujoPlanificacionTelegram(enlace.chatId);

  if(!flujo)return {activo:false};

  if(texto.toLowerCase()==='/cancelar'){
    borrarFlujoPlanificacionTelegram(enlace.chatId);
    return {
      activo:false,
      cancelado:true,
      texto:'❌ Creación de planificación cancelada.'
    };
  }

  flujo.datos=flujo.datos||{};

  if(flujo.paso==='TITULO'){
    if(texto.length<2)throw new Error('El título debe tener al menos 2 caracteres.');
    flujo.datos.titulo=texto;
    flujo.paso='ASIGNATURA';
    guardarFlujoPlanificacionTelegram(enlace.chatId,flujo);
    return {activo:true,paso:'ASIGNATURA',texto:'📘 Escribe la asignatura.'};
  }

  if(flujo.paso==='ASIGNATURA'){
    flujo.datos.asignatura=texto;
    flujo.paso='GRADO';
    guardarFlujoPlanificacionTelegram(enlace.chatId,flujo);
    return {
      activo:true,
      paso:'GRADO',
      texto:'🎓 Escribe el grado.\n\nEjemplo: 1 grado'
    };
  }

  if(flujo.paso==='GRADO'){
    flujo.datos.grado=texto;
    flujo.paso='FECHA';
    guardarFlujoPlanificacionTelegram(enlace.chatId,flujo);
    return {
      activo:true,
      paso:'FECHA',
      texto:'📅 Escribe la fecha como DD/MM/AAAA.\n\nTambién puedes escribir hoy o mañana.'
    };
  }

  if(flujo.paso==='FECHA'){
    flujo.datos.fecha=normalizarFechaEntradaAgendaTelegram(texto);
    flujo.paso='OBJETIVO';
    guardarFlujoPlanificacionTelegram(enlace.chatId,flujo);
    return {activo:true,paso:'OBJETIVO',texto:'🎯 Escribe el objetivo de la clase.'};
  }

  if(flujo.paso==='OBJETIVO'){
    flujo.datos.objetivo=texto;
    flujo.paso='CONTENIDO';
    guardarFlujoPlanificacionTelegram(enlace.chatId,flujo);
    return {activo:true,paso:'CONTENIDO',texto:'📖 Escribe el contenido.'};
  }

  if(flujo.paso==='CONTENIDO'){
    flujo.datos.contenido=texto;
    flujo.paso='ACTIVIDADES';
    guardarFlujoPlanificacionTelegram(enlace.chatId,flujo);
    return {activo:true,paso:'ACTIVIDADES',texto:'✏️ Escribe las actividades.'};
  }

  if(flujo.paso==='ACTIVIDADES'){
    flujo.datos.actividades=texto;
    flujo.paso='RECURSOS';
    guardarFlujoPlanificacionTelegram(enlace.chatId,flujo);
    return {
      activo:true,
      paso:'RECURSOS',
      texto:'🧰 Escribe los recursos.\n\nEscribe un guion - para dejarlo vacío.'
    };
  }

  if(flujo.paso==='RECURSOS'){
    flujo.datos.recursos=texto==='-'?'':texto;
    flujo.paso='EVALUACION';
    guardarFlujoPlanificacionTelegram(enlace.chatId,flujo);
    return {
      activo:true,
      paso:'EVALUACION',
      texto:'📝 Escribe la evaluación.\n\nEscribe un guion - para dejarla vacía.'
    };
  }

  if(flujo.paso==='EVALUACION'){
    flujo.datos.evaluacion=texto==='-'?'':texto;
    flujo.paso='CONFIRMAR';
    guardarFlujoPlanificacionTelegram(enlace.chatId,flujo);
    return {
      activo:true,
      paso:'CONFIRMAR',
      texto:resumenBorradorPlanificacionTelegram(flujo.datos)
    };
  }

  return {
    activo:true,
    paso:String(flujo.paso||''),
    texto:'Continúa con el siguiente paso o escribe /cancelar.'
  };
}

function botConfirmarPlanificacionTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  const flujo=obtenerFlujoPlanificacionTelegram(enlace.chatId);

  if(!flujo||flujo.paso!=='CONFIRMAR'){
    throw new Error('No hay una planificación pendiente de confirmación.');
  }

  const d=flujo.datos||{};
  if(!d.titulo||!d.asignatura||!d.grado||!d.fecha){
    throw new Error('Faltan datos obligatorios.');
  }

  const idPlanificacion=generarId('PLA');
  const hoja=obtenerHoja('PLANIFICACION');
  const fila=hoja.getLastRow()+1;

  hoja.getRange(fila,1,1,13).setValues([[
    idPlanificacion,
    enlace.idMaestra,
    String(d.titulo),
    String(d.asignatura),
    String(d.grado),
    String(d.fecha),
    String(d.objetivo||''),
    String(d.contenido||''),
    String(d.actividades||''),
    String(d.recursos||''),
    String(d.evaluacion||''),
    'PLANIFICADA',
    new Date()
  ]]);

  hoja.getRange(fila,6).setNumberFormat('@');
  hoja.getRange(fila,6).setValue(String(d.fecha));

  registrarAuditoria(
    enlace.idMaestra,
    'CREAR',
    'PLANIFICACION',
    'Planificación creada desde Telegram: '+String(d.titulo)
  );

  borrarFlujoPlanificacionTelegram(enlace.chatId);

  return {
    activo:false,
    guardado:true,
    idPlanificacion:idPlanificacion,
    texto:'✅ Planificación guardada correctamente.\n\n'+
      resumenBorradorPlanificacionTelegram(d)
  };
}

function botCancelarFlujoPlanificacionTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  borrarFlujoPlanificacionTelegram(enlace.chatId);

  return {
    activo:false,
    cancelado:true,
    texto:'❌ Creación de planificación cancelada.'
  };
}


function claveFlujoCalificacionTelegram(chatId){
  return 'TELEGRAM_CALIFICACION_FLUJO_'+String(chatId).trim();
}

function guardarFlujoCalificacionTelegram(chatId,flujo){
  const contenido=Object.assign({},flujo,{actualizado:Date.now()});
  PropertiesService.getScriptProperties().setProperty(
    claveFlujoCalificacionTelegram(chatId),
    JSON.stringify(contenido)
  );
  return contenido;
}

function obtenerFlujoCalificacionTelegram(chatId){
  const clave=claveFlujoCalificacionTelegram(chatId);
  const valor=PropertiesService.getScriptProperties().getProperty(clave);
  if(!valor)return null;
  try{
    const flujo=JSON.parse(valor);
    if(Date.now()-Number(flujo.actualizado||0)>60*60*1000){
      PropertiesService.getScriptProperties().deleteProperty(clave);
      return null;
    }
    return flujo;
  }catch(_){
    PropertiesService.getScriptProperties().deleteProperty(clave);
    return null;
  }
}

function borrarFlujoCalificacionTelegram(chatId){
  PropertiesService.getScriptProperties().deleteProperty(
    claveFlujoCalificacionTelegram(chatId)
  );
}

function obtenerAsignaturaCalificacionTelegram(codigo){
  const asignaturas={
    MATEMATICA:'Matemática',
    LENGUA:'Lengua Española',
    NATURALES:'Ciencias Naturales',
    SOCIALES:'Ciencias Sociales',
    ARTISTICA:'Educación Artística',
    FISICA:'Educación Física',
    FORMACION:'Formación Integral',
    INGLES:'Inglés'
  };
  return asignaturas[String(codigo||'').trim().toUpperCase()]||'';
}

function obtenerPeriodoCalificacionTelegram(codigo){
  const periodos={
    P1:'Primer período',
    P2:'Segundo período',
    P3:'Tercer período',
    P4:'Cuarto período'
  };
  return periodos[String(codigo||'').trim().toUpperCase()]||'';
}

function normalizarNumeroCalificacionTelegram(valor,nombreCampo){
  const texto=String(valor||'').trim().replace(',','.');
  const numero=Number(texto);
  if(!Number.isFinite(numero))throw new Error(nombreCampo+' no es válida.');
  return numero;
}

function resumenBorradorCalificacionTelegram(datos){
  const maxima=Number(datos.calificacionMaxima||0);
  const nota=Number(datos.calificacion||0);
  const porcentaje=maxima>0?Math.round((nota/maxima)*100):0;
  return [
    '📝 Revisa la calificación','',
    'Alumno: '+String(datos.nombreAlumno||''),
    'Asignatura: '+String(datos.asignatura||''),
    'Período: '+String(datos.periodo||''),
    'Actividad: '+String(datos.actividad||''),
    'Calificación: '+nota+'/'+maxima+' ('+porcentaje+'%)',
    'Fecha: '+formatearFechaTelegram(datos.fecha),
    'Observaciones: '+(String(datos.observaciones||'').trim()||'Sin observaciones')
  ].join('\n');
}

function botIniciarCalificacionTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  const alumnos=obtenerRegistros('ALUMNOS')
    .filter(r=>String(r.ID_MAESTRA||'').trim()===enlace.idMaestra&&String(r.ESTADO||'').trim().toUpperCase()!=='ELIMINADO')
    .map(r=>({
      idAlumno:String(r.ID_ALUMNO||''),
      nombre:(String(r.NOMBRE||'')+' '+String(r.APELLIDO||'')).trim(),
      grado:String(r.GRADO||''),
      seccion:String(r.SECCION||'')
    }))
    .sort((a,b)=>a.nombre.localeCompare(b.nombre));
  guardarFlujoCalificacionTelegram(enlace.chatId,{idMaestra:enlace.idMaestra,paso:'ALUMNO',datos:{}});
  return {activo:true,paso:'ALUMNO',alumnos:alumnos,texto:'👩‍🎓 Selecciona el alumno que recibirá la calificación.'};
}

function botSeleccionarAlumnoCalificacionTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  validarObjeto(datos,['idAlumno']);
  const flujo=obtenerFlujoCalificacionTelegram(enlace.chatId);
  if(!flujo)throw new Error('No hay un registro de calificación activo. Pulsa Registrar nota nuevamente.');
  const alumno=obtenerRegistros('ALUMNOS').find(r=>
    String(r.ID_ALUMNO||'').trim()===String(datos.idAlumno||'').trim()&&
    String(r.ID_MAESTRA||'').trim()===enlace.idMaestra&&
    String(r.ESTADO||'').trim().toUpperCase()!=='ELIMINADO'
  );
  if(!alumno)throw new Error('El alumno no pertenece a esta maestra.');
  flujo.datos=flujo.datos||{};
  flujo.datos.idAlumno=String(alumno.ID_ALUMNO||'');
  flujo.datos.nombreAlumno=(String(alumno.NOMBRE||'')+' '+String(alumno.APELLIDO||'')).trim();
  flujo.paso='ASIGNATURA';
  guardarFlujoCalificacionTelegram(enlace.chatId,flujo);
  return {activo:true,paso:'ASIGNATURA',texto:'📘 Selecciona la asignatura.'};
}

function botSeleccionarAsignaturaCalificacionTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  validarObjeto(datos,['asignatura']);
  const flujo=obtenerFlujoCalificacionTelegram(enlace.chatId);
  if(!flujo||!flujo.datos||!flujo.datos.idAlumno)throw new Error('Primero debes seleccionar un alumno.');
  const codigo=String(datos.asignatura||'').trim().toUpperCase();
  if(codigo==='OTRA'){
    flujo.paso='ASIGNATURA_OTRA';
    guardarFlujoCalificacionTelegram(enlace.chatId,flujo);
    return {activo:true,paso:'ASIGNATURA_OTRA',texto:'✍️ Escribe el nombre de la asignatura.'};
  }
  const asignatura=obtenerAsignaturaCalificacionTelegram(codigo);
  if(!asignatura)throw new Error('La asignatura seleccionada no es válida.');
  flujo.datos.asignatura=asignatura;
  flujo.paso='PERIODO';
  guardarFlujoCalificacionTelegram(enlace.chatId,flujo);
  return {activo:true,paso:'PERIODO',texto:'📆 Selecciona el período.'};
}

function botSeleccionarPeriodoCalificacionTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  validarObjeto(datos,['periodo']);
  const flujo=obtenerFlujoCalificacionTelegram(enlace.chatId);
  if(!flujo||!flujo.datos||!flujo.datos.asignatura)throw new Error('Primero debes seleccionar una asignatura.');
  const periodo=obtenerPeriodoCalificacionTelegram(datos.periodo);
  if(!periodo)throw new Error('El período seleccionado no es válido.');
  flujo.datos.periodo=periodo;
  flujo.paso='ACTIVIDAD';
  guardarFlujoCalificacionTelegram(enlace.chatId,flujo);
  return {activo:true,paso:'ACTIVIDAD',texto:'✏️ Escribe el nombre de la actividad o evaluación.'};
}

function botProcesarFlujoCalificacionTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  validarObjeto(datos,['texto']);
  const texto=String(datos.texto||'').trim();
  const flujo=obtenerFlujoCalificacionTelegram(enlace.chatId);
  if(!flujo)return {activo:false};
  if(texto.toLowerCase()==='/cancelar'){
    borrarFlujoCalificacionTelegram(enlace.chatId);
    return {activo:false,cancelado:true,texto:'❌ Registro de calificación cancelado.'};
  }
  flujo.datos=flujo.datos||{};
  if(flujo.paso==='ASIGNATURA_OTRA'){
    if(texto.length<2)throw new Error('La asignatura debe tener al menos 2 caracteres.');
    flujo.datos.asignatura=texto; flujo.paso='PERIODO'; guardarFlujoCalificacionTelegram(enlace.chatId,flujo);
    return {activo:true,paso:'PERIODO',texto:'📆 Selecciona el período.'};
  }
  if(flujo.paso==='ACTIVIDAD'){
    if(texto.length<2)throw new Error('La actividad debe tener al menos 2 caracteres.');
    flujo.datos.actividad=texto; flujo.paso='CALIFICACION'; guardarFlujoCalificacionTelegram(enlace.chatId,flujo);
    return {activo:true,paso:'CALIFICACION',texto:'🔢 Escribe la calificación obtenida.\n\nEjemplo: 15'};
  }
  if(flujo.paso==='CALIFICACION'){
    const calificacion=normalizarNumeroCalificacionTelegram(texto,'La calificación');
    if(calificacion<0)throw new Error('La calificación no puede ser negativa.');
    flujo.datos.calificacion=calificacion; flujo.paso='MAXIMA'; guardarFlujoCalificacionTelegram(enlace.chatId,flujo);
    return {activo:true,paso:'MAXIMA',texto:'🏆 Escribe la calificación máxima.\n\nEjemplo: 20'};
  }
  if(flujo.paso==='MAXIMA'){
    const maxima=normalizarNumeroCalificacionTelegram(texto,'La calificación máxima');
    if(maxima<=0)throw new Error('La calificación máxima debe ser mayor que cero.');
    if(Number(flujo.datos.calificacion)>maxima)throw new Error('La calificación no puede superar la máxima.');
    flujo.datos.calificacionMaxima=maxima; flujo.paso='FECHA'; guardarFlujoCalificacionTelegram(enlace.chatId,flujo);
    return {activo:true,paso:'FECHA',texto:'📅 Escribe la fecha como DD/MM/AAAA.\n\nTambién puedes escribir hoy o mañana.'};
  }
  if(flujo.paso==='FECHA'){
    flujo.datos.fecha=normalizarFechaEntradaAgendaTelegram(texto); flujo.paso='OBSERVACIONES'; guardarFlujoCalificacionTelegram(enlace.chatId,flujo);
    return {activo:true,paso:'OBSERVACIONES',texto:'🗒️ Escribe las observaciones.\n\nEscribe un guion - para dejarlas vacías.'};
  }
  if(flujo.paso==='OBSERVACIONES'){
    flujo.datos.observaciones=texto==='-'?'':texto; flujo.paso='CONFIRMAR'; guardarFlujoCalificacionTelegram(enlace.chatId,flujo);
    return {activo:true,paso:'CONFIRMAR',texto:resumenBorradorCalificacionTelegram(flujo.datos)};
  }
  return {activo:true,paso:String(flujo.paso||''),texto:'Continúa con los botones mostrados o escribe /cancelar.'};
}

function botConfirmarCalificacionTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  const flujo=obtenerFlujoCalificacionTelegram(enlace.chatId);
  if(!flujo||flujo.paso!=='CONFIRMAR')throw new Error('No hay una calificación pendiente de confirmación.');
  const d=flujo.datos||{};
  if(!d.idAlumno||!d.asignatura||!d.actividad||!d.periodo||d.calificacion===undefined||d.calificacionMaxima===undefined||!d.fecha){
    throw new Error('Faltan datos obligatorios de la calificación.');
  }
  const alumno=obtenerRegistros('ALUMNOS').find(r=>
    String(r.ID_ALUMNO||'').trim()===String(d.idAlumno||'').trim()&&
    String(r.ID_MAESTRA||'').trim()===enlace.idMaestra&&
    String(r.ESTADO||'').trim().toUpperCase()!=='ELIMINADO'
  );
  if(!alumno)throw new Error('El alumno ya no está disponible.');
  const calificacion=Number(d.calificacion), maxima=Number(d.calificacionMaxima);
  if(!Number.isFinite(calificacion)||calificacion<0)throw new Error('La calificación no es válida.');
  if(!Number.isFinite(maxima)||maxima<=0)throw new Error('La calificación máxima no es válida.');
  if(calificacion>maxima)throw new Error('La calificación no puede superar la máxima.');
  const idCalificacion=generarId('CAL');
  const hoja=obtenerHoja('CALIFICACIONES');
  const fila=hoja.getLastRow()+1;
  hoja.getRange(fila,1,1,10).setValues([[
    idCalificacion,enlace.idMaestra,String(d.idAlumno),String(d.asignatura),String(d.actividad),String(d.periodo),
    calificacion,maxima,String(d.fecha),String(d.observaciones||'')
  ]]);
  hoja.getRange(fila,9).setNumberFormat('@');
  hoja.getRange(fila,9).setValue(String(d.fecha));
  registrarAuditoria(enlace.idMaestra,'CREAR','CALIFICACIONES','Calificación creada desde Telegram: '+String(d.nombreAlumno||'Alumno'));
  borrarFlujoCalificacionTelegram(enlace.chatId);
  return {activo:false,guardado:true,idCalificacion:idCalificacion,texto:'✅ Calificación guardada correctamente.\n\n'+resumenBorradorCalificacionTelegram(d)};
}

function botCancelarFlujoCalificacionTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  borrarFlujoCalificacionTelegram(enlace.chatId);
  return {activo:false,cancelado:true,texto:'❌ Registro de calificación cancelado.'};
}


function claveFlujoAlumnoTelegram(chatId){
  return 'TELEGRAM_ALUMNO_FLUJO_'+String(chatId).trim();
}

function guardarFlujoAlumnoTelegram(chatId,flujo){
  const contenido=Object.assign({},flujo,{actualizado:Date.now()});
  PropertiesService.getScriptProperties().setProperty(
    claveFlujoAlumnoTelegram(chatId),
    JSON.stringify(contenido)
  );
  return contenido;
}

function obtenerFlujoAlumnoTelegram(chatId){
  const clave=claveFlujoAlumnoTelegram(chatId);
  const valor=PropertiesService.getScriptProperties().getProperty(clave);

  if(!valor)return null;

  try{
    const flujo=JSON.parse(valor);

    if(Date.now()-Number(flujo.actualizado||0)>60*60*1000){
      PropertiesService.getScriptProperties().deleteProperty(clave);
      return null;
    }

    return flujo;
  }catch(_){
    PropertiesService.getScriptProperties().deleteProperty(clave);
    return null;
  }
}

function borrarFlujoAlumnoTelegram(chatId){
  PropertiesService.getScriptProperties().deleteProperty(
    claveFlujoAlumnoTelegram(chatId)
  );
}

function resumenBorradorAlumnoTelegram(datos){
  return [
    '👩‍🎓 Revisa el alumno',
    '',
    'Nombre: '+String(datos.nombre||'')+' '+String(datos.apellido||''),
    'Documento: '+(String(datos.documento||'').trim()||'Sin documento'),
    'Fecha de nacimiento: '+(
      String(datos.fechaNacimiento||'').trim()
        ? formatearFechaTelegram(datos.fechaNacimiento)
        : 'Sin fecha'
    ),
    'Sexo: '+(String(datos.sexo||'').trim()||'Sin indicar'),
    'Grado: '+(String(datos.grado||'').trim()||'Sin indicar'),
    'Sección: '+(String(datos.seccion||'').trim()||'Sin indicar'),
    'Representante: '+(String(datos.representante||'').trim()||'Sin indicar'),
    'Teléfono: '+(String(datos.telefono||'').trim()||'Sin indicar'),
    'Dirección: '+(String(datos.direccion||'').trim()||'Sin indicar'),
    'Observaciones: '+(String(datos.observaciones||'').trim()||'Sin observaciones')
  ].join('\n');
}

function botIniciarAlumnoTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);

  const maestra=obtenerRegistros('MAESTRAS').find(r=>
    String(r.ID_MAESTRA||'').trim()===enlace.idMaestra
  );

  guardarFlujoAlumnoTelegram(enlace.chatId,{
    idMaestra:enlace.idMaestra,
    paso:'NOMBRE',
    datos:{
      grado:String(maestra&&maestra.GRADO||''),
      seccion:String(maestra&&maestra.SECCION||'')
    }
  });

  return {
    activo:true,
    paso:'NOMBRE',
    texto:'➕ Nuevo alumno\n\nEscribe el nombre.\n\nPuedes cancelar con /cancelar.'
  };
}

function botSeleccionarSexoAlumnoTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  validarObjeto(datos,['sexo']);

  const flujo=obtenerFlujoAlumnoTelegram(enlace.chatId);
  if(!flujo||flujo.paso!=='SEXO'){
    throw new Error('No hay un alumno esperando la selección de sexo.');
  }

  const codigo=String(datos.sexo||'').trim().toUpperCase();
  const opciones={
    FEMENINO:'Femenino',
    MASCULINO:'Masculino',
    OTRO:'Otro',
    OMITIR:''
  };

  if(!(codigo in opciones)){
    throw new Error('La opción de sexo no es válida.');
  }

  flujo.datos=flujo.datos||{};
  flujo.datos.sexo=opciones[codigo];
  flujo.paso='GRADO';
  guardarFlujoAlumnoTelegram(enlace.chatId,flujo);

  return {
    activo:true,
    paso:'GRADO',
    texto:'🎓 Escribe el grado.\n\nActualmente: '+
      (String(flujo.datos.grado||'').trim()||'Sin indicar')+
      '\n\nEscribe un guion - para conservar ese valor.'
  };
}

function botProcesarFlujoAlumnoTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  validarObjeto(datos,['texto']);

  const texto=String(datos.texto||'').trim();
  const flujo=obtenerFlujoAlumnoTelegram(enlace.chatId);

  if(!flujo)return {activo:false};

  if(texto.toLowerCase()==='/cancelar'){
    borrarFlujoAlumnoTelegram(enlace.chatId);

    return {
      activo:false,
      cancelado:true,
      texto:'❌ Registro de alumno cancelado.'
    };
  }

  flujo.datos=flujo.datos||{};

  if(flujo.paso==='NOMBRE'){
    if(texto.length<2){
      throw new Error('El nombre debe tener al menos 2 caracteres.');
    }

    flujo.datos.nombre=texto;
    flujo.paso='APELLIDO';
    guardarFlujoAlumnoTelegram(enlace.chatId,flujo);

    return {
      activo:true,
      paso:'APELLIDO',
      texto:'✍️ Escribe el apellido.'
    };
  }

  if(flujo.paso==='APELLIDO'){
    if(texto.length<2){
      throw new Error('El apellido debe tener al menos 2 caracteres.');
    }

    flujo.datos.apellido=texto;
    flujo.paso='DOCUMENTO';
    guardarFlujoAlumnoTelegram(enlace.chatId,flujo);

    return {
      activo:true,
      paso:'DOCUMENTO',
      texto:'🪪 Escribe el documento.\n\nEscribe un guion - para dejarlo vacío.'
    };
  }

  if(flujo.paso==='DOCUMENTO'){
    flujo.datos.documento=texto==='-'?'':texto;
    flujo.paso='FECHA_NACIMIENTO';
    guardarFlujoAlumnoTelegram(enlace.chatId,flujo);

    return {
      activo:true,
      paso:'FECHA_NACIMIENTO',
      texto:'🎂 Escribe la fecha de nacimiento como DD/MM/AAAA.\n\nEscribe un guion - para dejarla vacía.'
    };
  }

  if(flujo.paso==='FECHA_NACIMIENTO'){
    flujo.datos.fechaNacimiento=
      texto==='-'?'':normalizarFechaEntradaAgendaTelegram(texto);
    flujo.paso='SEXO';
    guardarFlujoAlumnoTelegram(enlace.chatId,flujo);

    return {
      activo:true,
      paso:'SEXO',
      texto:'👧👦 Selecciona el sexo.'
    };
  }

  if(flujo.paso==='GRADO'){
    if(texto!=='-')flujo.datos.grado=texto;
    flujo.paso='SECCION';
    guardarFlujoAlumnoTelegram(enlace.chatId,flujo);

    return {
      activo:true,
      paso:'SECCION',
      texto:'🏫 Escribe la sección.\n\nActualmente: '+
        (String(flujo.datos.seccion||'').trim()||'Sin indicar')+
        '\n\nEscribe un guion - para conservar ese valor.'
    };
  }

  if(flujo.paso==='SECCION'){
    if(texto!=='-')flujo.datos.seccion=texto;
    flujo.paso='REPRESENTANTE';
    guardarFlujoAlumnoTelegram(enlace.chatId,flujo);

    return {
      activo:true,
      paso:'REPRESENTANTE',
      texto:'👤 Escribe el nombre del representante.\n\nEscribe un guion - para dejarlo vacío.'
    };
  }

  if(flujo.paso==='REPRESENTANTE'){
    flujo.datos.representante=texto==='-'?'':texto;
    flujo.paso='TELEFONO';
    guardarFlujoAlumnoTelegram(enlace.chatId,flujo);

    return {
      activo:true,
      paso:'TELEFONO',
      texto:'📞 Escribe el teléfono.\n\nEscribe un guion - para dejarlo vacío.'
    };
  }

  if(flujo.paso==='TELEFONO'){
    flujo.datos.telefono=texto==='-'?'':texto;
    flujo.paso='DIRECCION';
    guardarFlujoAlumnoTelegram(enlace.chatId,flujo);

    return {
      activo:true,
      paso:'DIRECCION',
      texto:'📍 Escribe la dirección.\n\nEscribe un guion - para dejarla vacía.'
    };
  }

  if(flujo.paso==='DIRECCION'){
    flujo.datos.direccion=texto==='-'?'':texto;
    flujo.paso='OBSERVACIONES';
    guardarFlujoAlumnoTelegram(enlace.chatId,flujo);

    return {
      activo:true,
      paso:'OBSERVACIONES',
      texto:'📝 Escribe las observaciones.\n\nEscribe un guion - para dejarlas vacías.'
    };
  }

  if(flujo.paso==='OBSERVACIONES'){
    flujo.datos.observaciones=texto==='-'?'':texto;
    flujo.paso='CONFIRMAR';
    guardarFlujoAlumnoTelegram(enlace.chatId,flujo);

    return {
      activo:true,
      paso:'CONFIRMAR',
      texto:resumenBorradorAlumnoTelegram(flujo.datos)
    };
  }

  return {
    activo:true,
    paso:String(flujo.paso||''),
    texto:'Continúa con los botones mostrados o escribe /cancelar.'
  };
}

function botConfirmarAlumnoTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  const flujo=obtenerFlujoAlumnoTelegram(enlace.chatId);

  if(!flujo||flujo.paso!=='CONFIRMAR'){
    throw new Error('No hay un alumno pendiente de confirmación.');
  }

  const d=flujo.datos||{};

  if(!d.nombre||!d.apellido){
    throw new Error('Faltan el nombre o el apellido.');
  }

  validarLimiteAlumnosPlan(enlace.idMaestra);

  const idAlumno=generarId('ALU');
  const hoja=obtenerHoja('ALUMNOS');
  const fila=hoja.getLastRow()+1;

  hoja.getRange(fila,1,1,15).setValues([[
    idAlumno,
    enlace.idMaestra,
    limpiarTexto(d.nombre),
    limpiarTexto(d.apellido),
    limpiarTexto(d.documento||''),
    limpiarTexto(d.fechaNacimiento||''),
    limpiarTexto(d.sexo||''),
    limpiarTexto(d.grado||''),
    limpiarTexto(d.seccion||''),
    limpiarTexto(d.representante||''),
    limpiarTexto(d.telefono||''),
    limpiarTexto(d.direccion||''),
    limpiarTexto(d.observaciones||''),
    'ACTIVO',
    new Date()
  ]]);

  if(d.fechaNacimiento){
    hoja.getRange(fila,6).setNumberFormat('@');
    hoja.getRange(fila,6).setValue(String(d.fechaNacimiento));
  }

  registrarAuditoria(
    enlace.idMaestra,
    'CREAR',
    'ALUMNOS',
    'Alumno creado desde Telegram: '+
      limpiarTexto(d.nombre)+' '+limpiarTexto(d.apellido)
  );

  borrarFlujoAlumnoTelegram(enlace.chatId);

  return {
    activo:false,
    guardado:true,
    idAlumno:idAlumno,
    texto:'✅ Alumno guardado correctamente.\n\n'+
      resumenBorradorAlumnoTelegram(d)
  };
}

function botCancelarFlujoAlumnoTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  borrarFlujoAlumnoTelegram(enlace.chatId);

  return {
    activo:false,
    cancelado:true,
    texto:'❌ Registro de alumno cancelado.'
  };
}


function claveFlujoCumpleanosTelegram(chatId){
  return 'TELEGRAM_CUMPLEANOS_FLUJO_'+String(chatId).trim();
}

function guardarFlujoCumpleanosTelegram(chatId,flujo){
  const contenido=Object.assign({},flujo,{actualizado:Date.now()});
  PropertiesService.getScriptProperties().setProperty(
    claveFlujoCumpleanosTelegram(chatId),
    JSON.stringify(contenido)
  );
  return contenido;
}

function obtenerFlujoCumpleanosTelegram(chatId){
  const clave=claveFlujoCumpleanosTelegram(chatId);
  const valor=PropertiesService.getScriptProperties().getProperty(clave);

  if(!valor)return null;

  try{
    const flujo=JSON.parse(valor);

    if(Date.now()-Number(flujo.actualizado||0)>60*60*1000){
      PropertiesService.getScriptProperties().deleteProperty(clave);
      return null;
    }

    return flujo;
  }catch(_){
    PropertiesService.getScriptProperties().deleteProperty(clave);
    return null;
  }
}

function borrarFlujoCumpleanosTelegram(chatId){
  PropertiesService.getScriptProperties().deleteProperty(
    claveFlujoCumpleanosTelegram(chatId)
  );
}

function resumenBorradorCumpleanosTelegram(datos){
  return [
    '🎂 Revisa el cumpleaños',
    '',
    'Alumno: '+String(datos.nombreAlumno||''),
    'Fecha de nacimiento: '+formatearFechaTelegram(datos.fechaNacimiento),
    'Notas: '+(String(datos.notas||'').trim()||'Sin notas')
  ].join('\n');
}

function botIniciarCumpleanosTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);

  const alumnos=obtenerRegistrosConFila('ALUMNOS')
    .filter(r=>
      String(r.ID_MAESTRA||'').trim()===enlace.idMaestra&&
      String(r.ESTADO||'').trim().toUpperCase()!=='ELIMINADO'
    )
    .map(r=>({
      idAlumno:String(r.ID_ALUMNO||''),
      nombre:(String(r.NOMBRE||'')+' '+String(r.APELLIDO||'')).trim(),
      grado:String(r.GRADO||''),
      seccion:String(r.SECCION||''),
      fechaNacimiento:formatearFechaParaFormulario(r.FECHA_NACIMIENTO),
      notas:String(r.OBSERVACIONES||'')
    }))
    .sort((a,b)=>a.nombre.localeCompare(b.nombre));

  guardarFlujoCumpleanosTelegram(enlace.chatId,{
    idMaestra:enlace.idMaestra,
    paso:'ALUMNO',
    datos:{}
  });

  return {
    activo:true,
    paso:'ALUMNO',
    alumnos:alumnos,
    texto:'🎂 Selecciona el alumno cuyo cumpleaños deseas configurar.'
  };
}

function botSeleccionarAlumnoCumpleanosTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  validarObjeto(datos,['idAlumno']);

  const flujo=obtenerFlujoCumpleanosTelegram(enlace.chatId);
  if(!flujo){
    throw new Error('No hay una configuración de cumpleaños activa.');
  }

  const alumno=obtenerRegistrosConFila('ALUMNOS').find(r=>
    String(r.ID_ALUMNO||'').trim()===String(datos.idAlumno||'').trim()&&
    String(r.ID_MAESTRA||'').trim()===enlace.idMaestra&&
    String(r.ESTADO||'').trim().toUpperCase()!=='ELIMINADO'
  );

  if(!alumno){
    throw new Error('El alumno no pertenece a esta maestra.');
  }

  flujo.datos=flujo.datos||{};
  flujo.datos.idAlumno=String(alumno.ID_ALUMNO||'');
  flujo.datos.nombreAlumno=(
    String(alumno.NOMBRE||'')+' '+String(alumno.APELLIDO||'')
  ).trim();
  flujo.datos.fechaActual=formatearFechaParaFormulario(alumno.FECHA_NACIMIENTO);
  flujo.datos.notasActuales=String(alumno.OBSERVACIONES||'');
  flujo.paso='FECHA_NACIMIENTO';

  guardarFlujoCumpleanosTelegram(enlace.chatId,flujo);

  return {
    activo:true,
    paso:'FECHA_NACIMIENTO',
    tieneFecha:Boolean(flujo.datos.fechaActual),
    texto:[
      '📅 Escribe la fecha de nacimiento como DD/MM/AAAA.',
      flujo.datos.fechaActual
        ? '\nFecha actual: '+formatearFechaTelegram(flujo.datos.fechaActual)
        : '',
      '\nTambién puedes pulsar Quitar fecha.'
    ].join('')
  };
}

function botProcesarFlujoCumpleanosTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  validarObjeto(datos,['texto']);

  const texto=String(datos.texto||'').trim();
  const flujo=obtenerFlujoCumpleanosTelegram(enlace.chatId);

  if(!flujo)return {activo:false};

  if(texto.toLowerCase()==='/cancelar'){
    borrarFlujoCumpleanosTelegram(enlace.chatId);

    return {
      activo:false,
      cancelado:true,
      texto:'❌ Configuración de cumpleaños cancelada.'
    };
  }

  flujo.datos=flujo.datos||{};

  if(flujo.paso==='FECHA_NACIMIENTO'){
    flujo.datos.fechaNacimiento=normalizarFechaEntradaAgendaTelegram(texto);
    flujo.paso='NOTAS';
    guardarFlujoCumpleanosTelegram(enlace.chatId,flujo);

    return {
      activo:true,
      paso:'NOTAS',
      texto:'📝 Escribe una nota para el cumpleaños.\n\nEscribe un guion - para conservar las notas actuales.'
    };
  }

  if(flujo.paso==='NOTAS'){
    flujo.datos.notas=
      texto==='-'
        ?String(flujo.datos.notasActuales||'')
        :texto;

    flujo.paso='CONFIRMAR';
    guardarFlujoCumpleanosTelegram(enlace.chatId,flujo);

    return {
      activo:true,
      paso:'CONFIRMAR',
      texto:resumenBorradorCumpleanosTelegram(flujo.datos)
    };
  }

  return {
    activo:true,
    paso:String(flujo.paso||''),
    texto:'Continúa con los botones mostrados o escribe /cancelar.'
  };
}

function botConfirmarCumpleanosTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  const flujo=obtenerFlujoCumpleanosTelegram(enlace.chatId);

  if(!flujo||flujo.paso!=='CONFIRMAR'){
    throw new Error('No hay un cumpleaños pendiente de confirmación.');
  }

  const d=flujo.datos||{};
  if(!d.idAlumno||!d.fechaNacimiento){
    throw new Error('Faltan datos del cumpleaños.');
  }

  const hoja=obtenerHoja('ALUMNOS');
  const alumno=obtenerRegistrosConFila('ALUMNOS').find(r=>
    String(r.ID_ALUMNO||'').trim()===String(d.idAlumno||'').trim()&&
    String(r.ID_MAESTRA||'').trim()===enlace.idMaestra
  );

  if(!alumno){
    throw new Error('El alumno ya no está disponible.');
  }

  hoja.getRange(alumno.__fila,6).setNumberFormat('@');
  hoja.getRange(alumno.__fila,6).setValue(String(d.fechaNacimiento));
  hoja.getRange(alumno.__fila,13).setValue(String(d.notas||''));

  registrarAuditoria(
    enlace.idMaestra,
    'EDITAR',
    'CUMPLEANOS',
    'Cumpleaños actualizado desde Telegram: '+String(d.nombreAlumno||'Alumno')
  );

  borrarFlujoCumpleanosTelegram(enlace.chatId);

  return {
    activo:false,
    guardado:true,
    texto:'✅ Cumpleaños actualizado correctamente.\n\n'+
      resumenBorradorCumpleanosTelegram(d)
  };
}

function botQuitarCumpleanosTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  const flujo=obtenerFlujoCumpleanosTelegram(enlace.chatId);

  if(!flujo||!flujo.datos||!flujo.datos.idAlumno){
    throw new Error('Primero debes seleccionar un alumno.');
  }

  const alumno=obtenerRegistrosConFila('ALUMNOS').find(r=>
    String(r.ID_ALUMNO||'').trim()===String(flujo.datos.idAlumno||'').trim()&&
    String(r.ID_MAESTRA||'').trim()===enlace.idMaestra
  );

  if(!alumno){
    throw new Error('El alumno ya no está disponible.');
  }

  const hoja=obtenerHoja('ALUMNOS');
  hoja.getRange(alumno.__fila,6).clearContent();

  registrarAuditoria(
    enlace.idMaestra,
    'EDITAR',
    'CUMPLEANOS',
    'Fecha de cumpleaños eliminada desde Telegram: '+
      String(flujo.datos.nombreAlumno||'Alumno')
  );

  borrarFlujoCumpleanosTelegram(enlace.chatId);

  return {
    activo:false,
    eliminado:true,
    texto:'✅ Fecha de cumpleaños eliminada correctamente.'
  };
}

function botCancelarFlujoCumpleanosTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  borrarFlujoCumpleanosTelegram(enlace.chatId);

  return {
    activo:false,
    cancelado:true,
    texto:'❌ Configuración de cumpleaños cancelada.'
  };
}


function contarPorEstadoTelegram(registros,campo){
  const conteo={};

  registros.forEach(r=>{
    const valor=String(r[campo]||'SIN DEFINIR').trim().toUpperCase()||'SIN DEFINIR';
    conteo[valor]=(conteo[valor]||0)+1;
  });

  return conteo;
}

function porcentajeTelegram(parte,total){
  if(!total)return 0;
  return Math.round((Number(parte||0)/Number(total))*100);
}

function botGenerarReporteTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  validarObjeto(datos,['tipo']);

  const tipo=String(datos.tipo||'').trim().toUpperCase();
  const zona=obtenerZonaHorariaAulaMagica();
  const hoy=Utilities.formatDate(new Date(),zona,'yyyy-MM-dd');
  const idMaestra=enlace.idMaestra;

  const alumnos=obtenerRegistros('ALUMNOS').filter(r=>
    String(r.ID_MAESTRA||'').trim()===idMaestra&&
    String(r.ESTADO||'').trim().toUpperCase()!=='ELIMINADO'
  );

  if(tipo==='GENERAL'){
    const asistencia=obtenerRegistros('ASISTENCIA').filter(r=>
      String(r.ID_MAESTRA||'').trim()===idMaestra&&
      normalizarFechaAsistencia(r.FECHA)===hoy
    );

    const calificaciones=obtenerRegistros('CALIFICACIONES').filter(r=>
      String(r.ID_MAESTRA||'').trim()===idMaestra
    );

    const planesPendientes=obtenerRegistros('PLANIFICACION').filter(r=>
      String(r.ID_MAESTRA||'').trim()===idMaestra&&
      String(r.ESTADO||'').trim().toUpperCase()!=='COMPLETADA'&&
      normalizarFechaTextoTelegram(r.FECHA)>=hoy
    ).length;

    const reunionesPendientes=obtenerRegistros('REUNIONES').filter(r=>
      String(r.ID_MAESTRA||'').trim()===idMaestra&&
      !['REALIZADA','CANCELADA'].includes(
        String(r.ESTADO||'').trim().toUpperCase()
      )&&
      normalizarFechaTextoTelegram(r.FECHA)>=hoy
    ).length;

    const eventosPendientes=obtenerRegistrosAgenda().filter(r=>
      String(r.ID_MAESTRA||'').trim()===idMaestra&&
      String(r.ESTADO||'').trim().toUpperCase()==='PENDIENTE'&&
      normalizarFechaVisibleAgenda(r.FECHA)>=hoy
    ).length;

    const estados=contarPorEstadoTelegram(asistencia,'ESTADO');
    const promedios=calificaciones.map(r=>{
      const nota=Number(r.CALIFICACION||0);
      const maxima=Number(r.CALIFICACION_MAXIMA||0);
      return maxima>0?(nota/maxima)*100:null;
    }).filter(v=>v!==null&&Number.isFinite(v));

    const promedio=promedios.length
      ?Math.round(promedios.reduce((a,b)=>a+b,0)/promedios.length)
      :0;

    return {
      texto:[
        '📊 Reporte general',
        '',
        'Fecha: '+formatearFechaTelegram(hoy),
        '👩‍🎓 Alumnos activos: '+alumnos.length,
        '',
        '✅ Asistencia de hoy',
        'Presentes: '+Number(estados.PRESENTE||0),
        'Ausentes: '+Number(estados.AUSENTE||0),
        'Tardanzas: '+Number(estados.TARDE||0),
        'Justificados: '+Number(estados.JUSTIFICADO||0),
        'Sin registrar: '+Math.max(0,alumnos.length-asistencia.length),
        '',
        '📝 Calificaciones',
        'Registros: '+calificaciones.length,
        'Promedio general: '+promedio+'%',
        '',
        '📚 Planificaciones próximas: '+planesPendientes,
        '🤝 Reuniones próximas: '+reunionesPendientes,
        '📅 Eventos pendientes: '+eventosPendientes
      ].join('\n')
    };
  }

  if(tipo==='ASISTENCIA'){
    const registros=obtenerRegistros('ASISTENCIA').filter(r=>
      String(r.ID_MAESTRA||'').trim()===idMaestra&&
      normalizarFechaAsistencia(r.FECHA)===hoy
    );

    const estados=contarPorEstadoTelegram(registros,'ESTADO');
    const presentes=Number(estados.PRESENTE||0);
    const ausentes=Number(estados.AUSENTE||0);
    const tarde=Number(estados.TARDE||0);
    const justificados=Number(estados.JUSTIFICADO||0);

    return {
      texto:[
        '✅ Reporte de asistencia',
        '',
        'Fecha: '+formatearFechaTelegram(hoy),
        'Alumnos activos: '+alumnos.length,
        'Registros guardados: '+registros.length,
        '',
        '🟢 Presentes: '+presentes,
        '🔴 Ausentes: '+ausentes,
        '⏰ Tardanzas: '+tarde,
        '📄 Justificados: '+justificados,
        '➖ Sin registrar: '+Math.max(0,alumnos.length-registros.length),
        '',
        'Porcentaje de presencia: '+
          porcentajeTelegram(presentes,alumnos.length)+'%'
      ].join('\n')
    };
  }

  if(tipo==='CALIFICACIONES'){
    const registros=obtenerRegistros('CALIFICACIONES').filter(r=>
      String(r.ID_MAESTRA||'').trim()===idMaestra
    );

    const materias={};
    const porcentajes=[];

    registros.forEach(r=>{
      const materia=String(r.ASIGNATURA||'Sin asignatura').trim();
      materias[materia]=(materias[materia]||0)+1;

      const nota=Number(r.CALIFICACION||0);
      const maxima=Number(r.CALIFICACION_MAXIMA||0);

      if(maxima>0){
        porcentajes.push((nota/maxima)*100);
      }
    });

    const promedio=porcentajes.length
      ?Math.round(porcentajes.reduce((a,b)=>a+b,0)/porcentajes.length)
      :0;

    const principales=Object.keys(materias)
      .sort((a,b)=>materias[b]-materias[a])
      .slice(0,5)
      .map(materia=>'• '+materia+': '+materias[materia])
      .join('\n');

    return {
      texto:[
        '📝 Reporte de calificaciones',
        '',
        'Registros: '+registros.length,
        'Promedio general: '+promedio+'%',
        '',
        'Materias:',
        principales||'Sin registros'
      ].join('\n')
    };
  }

  if(tipo==='PENDIENTES'){
    const planes=obtenerRegistros('PLANIFICACION').filter(r=>
      String(r.ID_MAESTRA||'').trim()===idMaestra&&
      String(r.ESTADO||'').trim().toUpperCase()!=='COMPLETADA'&&
      normalizarFechaTextoTelegram(r.FECHA)>=hoy
    );

    const reuniones=obtenerRegistros('REUNIONES').filter(r=>
      String(r.ID_MAESTRA||'').trim()===idMaestra&&
      !['REALIZADA','CANCELADA'].includes(
        String(r.ESTADO||'').trim().toUpperCase()
      )&&
      normalizarFechaTextoTelegram(r.FECHA)>=hoy
    );

    const agenda=obtenerRegistrosAgenda().filter(r=>
      String(r.ID_MAESTRA||'').trim()===idMaestra&&
      String(r.ESTADO||'').trim().toUpperCase()==='PENDIENTE'&&
      normalizarFechaVisibleAgenda(r.FECHA)>=hoy
    );

    return {
      texto:[
        '📌 Reporte de pendientes',
        '',
        '📚 Planificaciones: '+planes.length,
        '🤝 Reuniones: '+reuniones.length,
        '📅 Eventos de agenda: '+agenda.length,
        '',
        'Total pendiente: '+(planes.length+reuniones.length+agenda.length)
      ].join('\n')
    };
  }

  throw new Error('El tipo de reporte no es válido.');
}


function claveFlujoPerfilTelegram(chatId){
  return 'TELEGRAM_PERFIL_FLUJO_'+String(chatId).trim();
}

function guardarFlujoPerfilTelegram(chatId,flujo){
  const contenido=Object.assign({},flujo,{actualizado:Date.now()});
  PropertiesService.getScriptProperties().setProperty(
    claveFlujoPerfilTelegram(chatId),
    JSON.stringify(contenido)
  );
  return contenido;
}

function obtenerFlujoPerfilTelegram(chatId){
  const clave=claveFlujoPerfilTelegram(chatId);
  const valor=PropertiesService.getScriptProperties().getProperty(clave);

  if(!valor)return null;

  try{
    const flujo=JSON.parse(valor);

    if(Date.now()-Number(flujo.actualizado||0)>60*60*1000){
      PropertiesService.getScriptProperties().deleteProperty(clave);
      return null;
    }

    return flujo;
  }catch(_){
    PropertiesService.getScriptProperties().deleteProperty(clave);
    return null;
  }
}

function borrarFlujoPerfilTelegram(chatId){
  PropertiesService.getScriptProperties().deleteProperty(
    claveFlujoPerfilTelegram(chatId)
  );
}

function obtenerPerfilMaestraPorIdTelegram(idMaestra){
  const registro=obtenerRegistrosConFila('MAESTRAS').find(r=>
    String(r.ID_MAESTRA||'').trim()===String(idMaestra||'').trim()
  );

  if(!registro){
    throw new Error('No se encontró el perfil de la maestra.');
  }

  return {
    idMaestra:String(registro.ID_MAESTRA||''),
    nombre:String(registro.NOMBRE||''),
    apellido:String(registro.APELLIDO||''),
    correo:String(registro.CORREO||''),
    usuario:String(registro.USUARIO||''),
    grado:String(registro.GRADO||''),
    seccion:String(registro.SECCION||''),
    __fila:Number(registro.__fila||0)
  };
}

function textoPerfilTelegram(perfil){
  return [
    '⚙️ Perfil de la maestra',
    '',
    'Nombre: '+String(perfil.nombre||'')+' '+String(perfil.apellido||''),
    'Correo: '+String(perfil.correo||''),
    'Usuario: '+String(perfil.usuario||''),
    'Grado: '+(String(perfil.grado||'').trim()||'Sin indicar'),
    'Sección: '+(String(perfil.seccion||'').trim()||'Sin indicar')
  ].join('\n');
}

function botObtenerPerfilTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  const perfil=obtenerPerfilMaestraPorIdTelegram(enlace.idMaestra);

  return {
    perfil:perfil,
    texto:textoPerfilTelegram(perfil)
  };
}

function botIniciarPerfilTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  const perfil=obtenerPerfilMaestraPorIdTelegram(enlace.idMaestra);

  guardarFlujoPerfilTelegram(enlace.chatId,{
    idMaestra:enlace.idMaestra,
    paso:'NOMBRE',
    datos:{
      nombre:perfil.nombre,
      apellido:perfil.apellido,
      grado:perfil.grado,
      seccion:perfil.seccion
    }
  });

  return {
    activo:true,
    paso:'NOMBRE',
    texto:[
      '✏️ Editar perfil',
      '',
      'Nombre actual: '+perfil.nombre,
      '',
      'Escribe el nuevo nombre.',
      'Escribe un guion - para conservarlo.',
      '',
      'Puedes cancelar con /cancelar.'
    ].join('\n')
  };
}

function botProcesarFlujoPerfilTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  validarObjeto(datos,['texto']);

  const texto=String(datos.texto||'').trim();
  const flujo=obtenerFlujoPerfilTelegram(enlace.chatId);

  if(!flujo)return {activo:false};

  if(texto.toLowerCase()==='/cancelar'){
    borrarFlujoPerfilTelegram(enlace.chatId);

    return {
      activo:false,
      cancelado:true,
      texto:'❌ Edición del perfil cancelada.'
    };
  }

  flujo.datos=flujo.datos||{};

  if(flujo.paso==='NOMBRE'){
    if(texto!=='-'){
      if(texto.length<2)throw new Error('El nombre debe tener al menos 2 caracteres.');
      flujo.datos.nombre=texto;
    }

    flujo.paso='APELLIDO';
    guardarFlujoPerfilTelegram(enlace.chatId,flujo);

    return {
      activo:true,
      paso:'APELLIDO',
      texto:[
        'Apellido actual: '+String(flujo.datos.apellido||''),
        '',
        'Escribe el nuevo apellido.',
        'Escribe un guion - para conservarlo.'
      ].join('\n')
    };
  }

  if(flujo.paso==='APELLIDO'){
    if(texto!=='-'){
      if(texto.length<2)throw new Error('El apellido debe tener al menos 2 caracteres.');
      flujo.datos.apellido=texto;
    }

    flujo.paso='GRADO';
    guardarFlujoPerfilTelegram(enlace.chatId,flujo);

    return {
      activo:true,
      paso:'GRADO',
      texto:[
        'Grado actual: '+(String(flujo.datos.grado||'').trim()||'Sin indicar'),
        '',
        'Escribe el nuevo grado.',
        'Escribe un guion - para conservarlo.'
      ].join('\n')
    };
  }

  if(flujo.paso==='GRADO'){
    if(texto!=='-')flujo.datos.grado=texto;

    flujo.paso='SECCION';
    guardarFlujoPerfilTelegram(enlace.chatId,flujo);

    return {
      activo:true,
      paso:'SECCION',
      texto:[
        'Sección actual: '+(String(flujo.datos.seccion||'').trim()||'Sin indicar'),
        '',
        'Escribe la nueva sección.',
        'Escribe un guion - para conservarla.'
      ].join('\n')
    };
  }

  if(flujo.paso==='SECCION'){
    if(texto!=='-')flujo.datos.seccion=texto;

    flujo.paso='CONFIRMAR';
    guardarFlujoPerfilTelegram(enlace.chatId,flujo);

    return {
      activo:true,
      paso:'CONFIRMAR',
      texto:[
        '⚙️ Revisa el perfil',
        '',
        'Nombre: '+String(flujo.datos.nombre||'')+' '+String(flujo.datos.apellido||''),
        'Grado: '+(String(flujo.datos.grado||'').trim()||'Sin indicar'),
        'Sección: '+(String(flujo.datos.seccion||'').trim()||'Sin indicar')
      ].join('\n')
    };
  }

  return {
    activo:true,
    paso:String(flujo.paso||''),
    texto:'Continúa con los botones mostrados o escribe /cancelar.'
  };
}

function botConfirmarPerfilTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  const flujo=obtenerFlujoPerfilTelegram(enlace.chatId);

  if(!flujo||flujo.paso!=='CONFIRMAR'){
    throw new Error('No hay un perfil pendiente de confirmación.');
  }

  const d=flujo.datos||{};

  if(!d.nombre||!d.apellido){
    throw new Error('Faltan el nombre o el apellido.');
  }

  const perfil=obtenerPerfilMaestraPorIdTelegram(enlace.idMaestra);
  const hoja=obtenerHoja('MAESTRAS');

  hoja.getRange(perfil.__fila,2,1,2).setValues([[
    limpiarTexto(d.nombre),
    limpiarTexto(d.apellido)
  ]]);

  hoja.getRange(perfil.__fila,7,1,2).setValues([[
    limpiarTexto(d.grado||''),
    limpiarTexto(d.seccion||'')
  ]]);

  registrarAuditoria(
    enlace.idMaestra,
    'EDITAR',
    'PERFIL',
    'Perfil actualizado desde Telegram'
  );

  borrarFlujoPerfilTelegram(enlace.chatId);

  const actualizado=obtenerPerfilMaestraPorIdTelegram(enlace.idMaestra);

  return {
    activo:false,
    guardado:true,
    perfil:actualizado,
    texto:'✅ Perfil actualizado correctamente.\n\n'+textoPerfilTelegram(actualizado)
  };
}

function botCancelarFlujoPerfilTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  borrarFlujoPerfilTelegram(enlace.chatId);

  return {
    activo:false,
    cancelado:true,
    texto:'❌ Edición del perfil cancelada.'
  };
}


function botListarEventosGestionTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  const hoy=Utilities.formatDate(
    new Date(),
    obtenerZonaHorariaAulaMagica(),
    'yyyy-MM-dd'
  );

  const eventos=obtenerRegistrosAgenda()
    .filter(r=>
      String(r.ID_MAESTRA||'').trim()===enlace.idMaestra&&
      normalizarFechaVisibleAgenda(r.FECHA)>=hoy
    )
    .map(r=>({
      idEvento:String(r.ID_EVENTO||''),
      titulo:String(r.TITULO||''),
      tipo:String(r.TIPO||'OTRO').toUpperCase(),
      fecha:normalizarFechaVisibleAgenda(r.FECHA),
      hora:normalizarHoraVisibleAgenda(r.HORA),
      descripcion:String(r.DESCRIPCION||''),
      estado:String(r.ESTADO||'PENDIENTE').toUpperCase()
    }))
    .sort((a,b)=>
      (a.fecha+' '+a.hora).localeCompare(b.fecha+' '+b.hora)
    )
    .slice(0,20);

  return {eventos:eventos};
}

function botObtenerEventoGestionTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  validarObjeto(datos,['idEvento']);

  const evento=obtenerRegistrosAgenda().find(r=>
    String(r.ID_EVENTO||'').trim()===String(datos.idEvento||'').trim()&&
    String(r.ID_MAESTRA||'').trim()===enlace.idMaestra
  );

  if(!evento)throw new Error('No se encontró el evento.');

  const resultado={
    idEvento:String(evento.ID_EVENTO||''),
    titulo:String(evento.TITULO||''),
    tipo:String(evento.TIPO||'OTRO').toUpperCase(),
    fecha:normalizarFechaVisibleAgenda(evento.FECHA),
    hora:normalizarHoraVisibleAgenda(evento.HORA),
    descripcion:String(evento.DESCRIPCION||''),
    estado:String(evento.ESTADO||'PENDIENTE').toUpperCase()
  };

  return {
    evento:resultado,
    texto:[
      '📅 Evento',
      '',
      'Título: '+resultado.titulo,
      'Fecha: '+formatearFechaTelegram(resultado.fecha),
      'Hora: '+resultado.hora,
      'Tipo: '+capitalizarTelegram(resultado.tipo),
      'Estado: '+capitalizarTelegram(resultado.estado),
      'Descripción: '+(resultado.descripcion||'Sin descripción')
    ].join('\n')
  };
}

function botCambiarEstadoEventoTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  validarObjeto(datos,['idEvento','estado']);

  const estado=String(datos.estado||'').trim().toUpperCase();
  const permitidos=['PENDIENTE','COMPLETADO','CANCELADO'];
  if(!permitidos.includes(estado)){
    throw new Error('El estado del evento no es válido.');
  }

  const hoja=obtenerHoja('AGENDA');
  const evento=obtenerRegistrosAgenda().find(r=>
    String(r.ID_EVENTO||'').trim()===String(datos.idEvento||'').trim()&&
    String(r.ID_MAESTRA||'').trim()===enlace.idMaestra
  );

  if(!evento)throw new Error('No se encontró el evento.');

  hoja.getRange(evento.__fila,8).setValue(estado);

  registrarAuditoria(
    enlace.idMaestra,
    'EDITAR',
    'AGENDA',
    'Evento '+String(evento.TITULO||'')+' cambiado a '+estado+' desde Telegram'
  );

  return {
    actualizado:true,
    texto:'✅ El evento "'+String(evento.TITULO||'')+
      '" quedó como '+estado.toLowerCase()+'.'
  };
}

function botEliminarEventoTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  validarObjeto(datos,['idEvento']);

  const hoja=obtenerHoja('AGENDA');
  const evento=obtenerRegistrosAgenda().find(r=>
    String(r.ID_EVENTO||'').trim()===String(datos.idEvento||'').trim()&&
    String(r.ID_MAESTRA||'').trim()===enlace.idMaestra
  );

  if(!evento)throw new Error('No se encontró el evento.');

  const titulo=String(evento.TITULO||'');
  hoja.deleteRow(evento.__fila);

  registrarAuditoria(
    enlace.idMaestra,
    'ELIMINAR',
    'AGENDA',
    'Evento eliminado desde Telegram: '+titulo
  );

  return {
    eliminado:true,
    texto:'🗑️ Evento eliminado correctamente: '+titulo
  };
}


function botListarReunionesGestionTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  const hoy=Utilities.formatDate(
    new Date(),
    obtenerZonaHorariaAulaMagica(),
    'yyyy-MM-dd'
  );

  const reuniones=obtenerRegistrosConFila('REUNIONES')
    .filter(r=>
      String(r.ID_MAESTRA||'').trim()===enlace.idMaestra&&
      normalizarFechaTextoTelegram(r.FECHA)>=hoy
    )
    .map(r=>({
      idReunion:String(r.ID_REUNION||''),
      titulo:String(r.TITULO||''),
      tipo:String(r.TIPO||'OTRA').toUpperCase(),
      fecha:normalizarFechaTextoTelegram(r.FECHA),
      hora:normalizarHoraVisibleAgenda(r.HORA),
      lugar:String(r.LUGAR||''),
      descripcion:String(r.DESCRIPCION||''),
      estado:String(r.ESTADO||'PROGRAMADA').toUpperCase()
    }))
    .sort((a,b)=>
      (a.fecha+' '+a.hora).localeCompare(b.fecha+' '+b.hora)
    )
    .slice(0,20);

  return {reuniones:reuniones};
}

function botObtenerReunionGestionTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  validarObjeto(datos,['idReunion']);

  const reunion=obtenerRegistrosConFila('REUNIONES').find(r=>
    String(r.ID_REUNION||'').trim()===String(datos.idReunion||'').trim()&&
    String(r.ID_MAESTRA||'').trim()===enlace.idMaestra
  );

  if(!reunion)throw new Error('No se encontró la reunión.');

  const resultado={
    idReunion:String(reunion.ID_REUNION||''),
    titulo:String(reunion.TITULO||''),
    tipo:String(reunion.TIPO||'OTRA').toUpperCase(),
    fecha:normalizarFechaTextoTelegram(reunion.FECHA),
    hora:normalizarHoraVisibleAgenda(reunion.HORA),
    lugar:String(reunion.LUGAR||''),
    descripcion:String(reunion.DESCRIPCION||''),
    estado:String(reunion.ESTADO||'PROGRAMADA').toUpperCase()
  };

  return {
    reunion:resultado,
    texto:[
      '🤝 Reunión',
      '',
      'Título: '+resultado.titulo,
      'Fecha: '+formatearFechaTelegram(resultado.fecha),
      'Hora: '+resultado.hora,
      'Tipo: '+capitalizarTelegram(resultado.tipo),
      'Lugar: '+(resultado.lugar||'Sin indicar'),
      'Estado: '+capitalizarTelegram(resultado.estado),
      'Descripción: '+(resultado.descripcion||'Sin descripción')
    ].join('\n')
  };
}

function botCambiarEstadoReunionTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  validarObjeto(datos,['idReunion','estado']);

  const estado=String(datos.estado||'').trim().toUpperCase();
  const permitidos=['PROGRAMADA','REALIZADA','CANCELADA'];

  if(!permitidos.includes(estado)){
    throw new Error('El estado de la reunión no es válido.');
  }

  const hoja=obtenerHoja('REUNIONES');
  const reunion=obtenerRegistrosConFila('REUNIONES').find(r=>
    String(r.ID_REUNION||'').trim()===String(datos.idReunion||'').trim()&&
    String(r.ID_MAESTRA||'').trim()===enlace.idMaestra
  );

  if(!reunion)throw new Error('No se encontró la reunión.');

  // La columna 9 es ACUERDOS y la columna 10 es ESTADO.
  // La versión 4.2.0 escribía por error el estado dentro de ACUERDOS.
  hoja.getRange(reunion.__fila,10).setValue(estado);

  // Repara automáticamente el dato incorrecto dejado por la versión anterior.
  const acuerdoActual=String(
    hoja.getRange(reunion.__fila,9).getDisplayValue()||''
  ).trim().toUpperCase();

  if(acuerdoActual===estado){
    hoja.getRange(reunion.__fila,9).clearContent();
  }

  registrarAuditoria(
    enlace.idMaestra,
    'EDITAR',
    'REUNIONES',
    'Reunión '+String(reunion.TITULO||'')+' cambiada a '+estado+' desde Telegram'
  );

  return {
    actualizado:true,
    texto:'✅ La reunión "'+String(reunion.TITULO||'')+
      '" quedó como '+estado.toLowerCase()+'.'
  };
}

function botEliminarReunionTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  validarObjeto(datos,['idReunion']);

  const hoja=obtenerHoja('REUNIONES');
  const reunion=obtenerRegistrosConFila('REUNIONES').find(r=>
    String(r.ID_REUNION||'').trim()===String(datos.idReunion||'').trim()&&
    String(r.ID_MAESTRA||'').trim()===enlace.idMaestra
  );

  if(!reunion)throw new Error('No se encontró la reunión.');

  const titulo=String(reunion.TITULO||'');
  hoja.deleteRow(reunion.__fila);

  registrarAuditoria(
    enlace.idMaestra,
    'ELIMINAR',
    'REUNIONES',
    'Reunión eliminada desde Telegram: '+titulo
  );

  return {
    eliminado:true,
    texto:'🗑️ Reunión eliminada correctamente: '+titulo
  };
}


function botListarPlanesGestionTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);

  const planes=obtenerRegistrosConFila('PLANIFICACION')
    .filter(r=>
      String(r.ID_MAESTRA||'').trim()===enlace.idMaestra
    )
    .map(r=>({
      idPlanificacion:String(r.ID_PLANIFICACION||''),
      titulo:String(r.TITULO||''),
      asignatura:String(r.ASIGNATURA||''),
      grado:String(r.GRADO||''),
      fecha:normalizarFechaTextoTelegram(r.FECHA),
      objetivo:String(r.OBJETIVO||''),
      contenido:String(r.CONTENIDO||''),
      actividades:String(r.ACTIVIDADES||''),
      recursos:String(r.RECURSOS||''),
      evaluacion:String(r.EVALUACION||''),
      estado:String(r.ESTADO||'PLANIFICADA').toUpperCase()
    }))
    .sort((a,b)=>b.fecha.localeCompare(a.fecha))
    .slice(0,20);

  return {planes:planes};
}

function botObtenerPlanGestionTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  validarObjeto(datos,['idPlanificacion']);

  const plan=obtenerRegistrosConFila('PLANIFICACION').find(r=>
    String(r.ID_PLANIFICACION||'').trim()===
      String(datos.idPlanificacion||'').trim()&&
    String(r.ID_MAESTRA||'').trim()===enlace.idMaestra
  );

  if(!plan)throw new Error('No se encontró la planificación.');

  const resultado={
    idPlanificacion:String(plan.ID_PLANIFICACION||''),
    titulo:String(plan.TITULO||''),
    asignatura:String(plan.ASIGNATURA||''),
    grado:String(plan.GRADO||''),
    fecha:normalizarFechaTextoTelegram(plan.FECHA),
    objetivo:String(plan.OBJETIVO||''),
    contenido:String(plan.CONTENIDO||''),
    actividades:String(plan.ACTIVIDADES||''),
    recursos:String(plan.RECURSOS||''),
    evaluacion:String(plan.EVALUACION||''),
    estado:String(plan.ESTADO||'PLANIFICADA').toUpperCase()
  };

  return {
    plan:resultado,
    texto:[
      '📚 Planificación',
      '',
      'Título: '+resultado.titulo,
      'Asignatura: '+resultado.asignatura,
      'Grado: '+(resultado.grado||'Sin indicar'),
      'Fecha: '+formatearFechaTelegram(resultado.fecha),
      'Estado: '+capitalizarTelegram(resultado.estado),
      'Objetivo: '+(resultado.objetivo||'Sin objetivo'),
      'Contenido: '+(resultado.contenido||'Sin contenido'),
      'Actividades: '+(resultado.actividades||'Sin actividades'),
      'Recursos: '+(resultado.recursos||'Sin recursos'),
      'Evaluación: '+(resultado.evaluacion||'Sin evaluación')
    ].join('\n')
  };
}

function botCambiarEstadoPlanTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  validarObjeto(datos,['idPlanificacion','estado']);

  const estado=String(datos.estado||'').trim().toUpperCase();
  const permitidos=['BORRADOR','PLANIFICADA','COMPLETADA'];

  if(!permitidos.includes(estado)){
    throw new Error('El estado de la planificación no es válido.');
  }

  const hoja=obtenerHoja('PLANIFICACION');
  const plan=obtenerRegistrosConFila('PLANIFICACION').find(r=>
    String(r.ID_PLANIFICACION||'').trim()===
      String(datos.idPlanificacion||'').trim()&&
    String(r.ID_MAESTRA||'').trim()===enlace.idMaestra
  );

  if(!plan)throw new Error('No se encontró la planificación.');

  // La columna 12 corresponde a ESTADO.
  hoja.getRange(plan.__fila,12).setValue(estado);

  registrarAuditoria(
    enlace.idMaestra,
    'EDITAR',
    'PLANIFICACION',
    'Planificación '+String(plan.TITULO||'')+
      ' cambiada a '+estado+' desde Telegram'
  );

  return {
    actualizado:true,
    texto:'✅ La planificación "'+String(plan.TITULO||'')+
      '" quedó como '+estado.toLowerCase()+'.'
  };
}

function botEliminarPlanTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  validarObjeto(datos,['idPlanificacion']);

  const hoja=obtenerHoja('PLANIFICACION');
  const plan=obtenerRegistrosConFila('PLANIFICACION').find(r=>
    String(r.ID_PLANIFICACION||'').trim()===
      String(datos.idPlanificacion||'').trim()&&
    String(r.ID_MAESTRA||'').trim()===enlace.idMaestra
  );

  if(!plan)throw new Error('No se encontró la planificación.');

  const titulo=String(plan.TITULO||'');
  hoja.deleteRow(plan.__fila);

  registrarAuditoria(
    enlace.idMaestra,
    'ELIMINAR',
    'PLANIFICACION',
    'Planificación eliminada desde Telegram: '+titulo
  );

  return {
    eliminado:true,
    texto:'🗑️ Planificación eliminada correctamente: '+titulo
  };
}


function claveEdicionCalificacionTelegram(chatId){
  return 'TELEGRAM_CALIFICACION_EDICION_'+String(chatId).trim();
}

function guardarEdicionCalificacionTelegram(chatId,flujo){
  const contenido=Object.assign({},flujo,{actualizado:Date.now()});
  PropertiesService.getScriptProperties().setProperty(
    claveEdicionCalificacionTelegram(chatId),
    JSON.stringify(contenido)
  );
  return contenido;
}

function obtenerEdicionCalificacionTelegram(chatId){
  const clave=claveEdicionCalificacionTelegram(chatId);
  const valor=PropertiesService.getScriptProperties().getProperty(clave);

  if(!valor)return null;

  try{
    const flujo=JSON.parse(valor);

    if(Date.now()-Number(flujo.actualizado||0)>60*60*1000){
      PropertiesService.getScriptProperties().deleteProperty(clave);
      return null;
    }

    return flujo;
  }catch(_){
    PropertiesService.getScriptProperties().deleteProperty(clave);
    return null;
  }
}

function borrarEdicionCalificacionTelegram(chatId){
  PropertiesService.getScriptProperties().deleteProperty(
    claveEdicionCalificacionTelegram(chatId)
  );
}

function nombreAlumnoCalificacionTelegram(idAlumno,alumnos){
  const alumno=alumnos.find(r=>
    String(r.ID_ALUMNO||'').trim()===String(idAlumno||'').trim()
  );

  if(!alumno)return 'Alumno';

  return (
    String(alumno.NOMBRE||'')+' '+String(alumno.APELLIDO||'')
  ).trim();
}

function botListarCalificacionesGestionTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);

  const alumnos=obtenerRegistros('ALUMNOS').filter(r=>
    String(r.ID_MAESTRA||'').trim()===enlace.idMaestra
  );

  const calificaciones=obtenerRegistrosConFila('CALIFICACIONES')
    .filter(r=>
      String(r.ID_MAESTRA||'').trim()===enlace.idMaestra
    )
    .map(r=>({
      idCalificacion:String(r.ID_CALIFICACION||''),
      idAlumno:String(r.ID_ALUMNO||''),
      nombreAlumno:nombreAlumnoCalificacionTelegram(r.ID_ALUMNO,alumnos),
      asignatura:String(r.ASIGNATURA||''),
      actividad:String(r.ACTIVIDAD||''),
      periodo:String(r.PERIODO||''),
      calificacion:Number(r.CALIFICACION||0),
      calificacionMaxima:Number(r.CALIFICACION_MAXIMA||0),
      fecha:normalizarFechaTextoTelegram(r.FECHA),
      observaciones:String(r.OBSERVACIONES||'')
    }))
    .sort((a,b)=>b.fecha.localeCompare(a.fecha))
    .slice(0,20);

  return {calificaciones:calificaciones};
}

function botObtenerCalificacionGestionTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  validarObjeto(datos,['idCalificacion']);

  const alumnos=obtenerRegistros('ALUMNOS').filter(r=>
    String(r.ID_MAESTRA||'').trim()===enlace.idMaestra
  );

  const registro=obtenerRegistrosConFila('CALIFICACIONES').find(r=>
    String(r.ID_CALIFICACION||'').trim()===
      String(datos.idCalificacion||'').trim()&&
    String(r.ID_MAESTRA||'').trim()===enlace.idMaestra
  );

  if(!registro)throw new Error('No se encontró la calificación.');

  const resultado={
    idCalificacion:String(registro.ID_CALIFICACION||''),
    idAlumno:String(registro.ID_ALUMNO||''),
    nombreAlumno:nombreAlumnoCalificacionTelegram(
      registro.ID_ALUMNO,
      alumnos
    ),
    asignatura:String(registro.ASIGNATURA||''),
    actividad:String(registro.ACTIVIDAD||''),
    periodo:String(registro.PERIODO||''),
    calificacion:Number(registro.CALIFICACION||0),
    calificacionMaxima:Number(registro.CALIFICACION_MAXIMA||0),
    fecha:normalizarFechaTextoTelegram(registro.FECHA),
    observaciones:String(registro.OBSERVACIONES||'')
  };

  const porcentaje=resultado.calificacionMaxima>0
    ?Math.round(
      resultado.calificacion/resultado.calificacionMaxima*100
    )
    :0;

  return {
    calificacion:resultado,
    texto:[
      '📝 Calificación',
      '',
      'Alumno: '+resultado.nombreAlumno,
      'Asignatura: '+resultado.asignatura,
      'Actividad: '+resultado.actividad,
      'Período: '+resultado.periodo,
      'Nota: '+resultado.calificacion+'/'+resultado.calificacionMaxima+
        ' ('+porcentaje+'%)',
      'Fecha: '+formatearFechaTelegram(resultado.fecha),
      'Observaciones: '+(
        resultado.observaciones||'Sin observaciones'
      )
    ].join('\n')
  };
}

function botIniciarEdicionCalificacionTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  validarObjeto(datos,['idCalificacion']);

  const registro=obtenerRegistrosConFila('CALIFICACIONES').find(r=>
    String(r.ID_CALIFICACION||'').trim()===
      String(datos.idCalificacion||'').trim()&&
    String(r.ID_MAESTRA||'').trim()===enlace.idMaestra
  );

  if(!registro)throw new Error('No se encontró la calificación.');

  guardarEdicionCalificacionTelegram(enlace.chatId,{
    idMaestra:enlace.idMaestra,
    idCalificacion:String(registro.ID_CALIFICACION||''),
    paso:'CALIFICACION',
    datos:{
      calificacion:Number(registro.CALIFICACION||0),
      calificacionMaxima:Number(registro.CALIFICACION_MAXIMA||0),
      observaciones:String(registro.OBSERVACIONES||'')
    }
  });

  return {
    activo:true,
    paso:'CALIFICACION',
    texto:[
      '✏️ Corregir calificación',
      '',
      'Nota actual: '+Number(registro.CALIFICACION||0),
      '',
      'Escribe la nueva calificación.'
    ].join('\n')
  };
}

function botProcesarEdicionCalificacionTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  validarObjeto(datos,['texto']);

  const texto=String(datos.texto||'').trim();
  const flujo=obtenerEdicionCalificacionTelegram(enlace.chatId);

  if(!flujo)return {activo:false};

  if(texto.toLowerCase()==='/cancelar'){
    borrarEdicionCalificacionTelegram(enlace.chatId);

    return {
      activo:false,
      cancelado:true,
      texto:'❌ Corrección de calificación cancelada.'
    };
  }

  flujo.datos=flujo.datos||{};

  if(flujo.paso==='CALIFICACION'){
    const nota=normalizarNumeroCalificacionTelegram(
      texto,
      'La calificación'
    );

    if(nota<0)throw new Error('La calificación no puede ser negativa.');

    flujo.datos.calificacion=nota;
    flujo.paso='MAXIMA';
    guardarEdicionCalificacionTelegram(enlace.chatId,flujo);

    return {
      activo:true,
      paso:'MAXIMA',
      texto:[
        'Calificación máxima actual: '+
          Number(flujo.datos.calificacionMaxima||0),
        '',
        'Escribe la nueva calificación máxima.',
        'Escribe un guion - para conservarla.'
      ].join('\n')
    };
  }

  if(flujo.paso==='MAXIMA'){
    if(texto!=='-'){
      const maxima=normalizarNumeroCalificacionTelegram(
        texto,
        'La calificación máxima'
      );

      if(maxima<=0){
        throw new Error(
          'La calificación máxima debe ser mayor que cero.'
        );
      }

      flujo.datos.calificacionMaxima=maxima;
    }

    if(
      Number(flujo.datos.calificacion)>
      Number(flujo.datos.calificacionMaxima)
    ){
      throw new Error(
        'La calificación no puede superar la máxima.'
      );
    }

    flujo.paso='OBSERVACIONES';
    guardarEdicionCalificacionTelegram(enlace.chatId,flujo);

    return {
      activo:true,
      paso:'OBSERVACIONES',
      texto:[
        'Observaciones actuales: '+
          (String(flujo.datos.observaciones||'').trim()||
            'Sin observaciones'),
        '',
        'Escribe las nuevas observaciones.',
        'Escribe un guion - para conservarlas.'
      ].join('\n')
    };
  }

  if(flujo.paso==='OBSERVACIONES'){
    if(texto!=='-')flujo.datos.observaciones=texto;

    flujo.paso='CONFIRMAR';
    guardarEdicionCalificacionTelegram(enlace.chatId,flujo);

    const nota=Number(flujo.datos.calificacion||0);
    const maxima=Number(flujo.datos.calificacionMaxima||0);
    const porcentaje=maxima>0?Math.round(nota/maxima*100):0;

    return {
      activo:true,
      paso:'CONFIRMAR',
      texto:[
        '📝 Revisa la corrección',
        '',
        'Nueva nota: '+nota+'/'+maxima+' ('+porcentaje+'%)',
        'Observaciones: '+(
          String(flujo.datos.observaciones||'').trim()||
          'Sin observaciones'
        )
      ].join('\n')
    };
  }

  return {
    activo:true,
    paso:String(flujo.paso||''),
    texto:'Continúa con los botones mostrados o escribe /cancelar.'
  };
}

function botConfirmarEdicionCalificacionTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  const flujo=obtenerEdicionCalificacionTelegram(enlace.chatId);

  if(!flujo||flujo.paso!=='CONFIRMAR'){
    throw new Error(
      'No hay una corrección pendiente de confirmación.'
    );
  }

  const registro=obtenerRegistrosConFila('CALIFICACIONES').find(r=>
    String(r.ID_CALIFICACION||'').trim()===
      String(flujo.idCalificacion||'').trim()&&
    String(r.ID_MAESTRA||'').trim()===enlace.idMaestra
  );

  if(!registro)throw new Error('La calificación ya no está disponible.');

  const nota=Number(flujo.datos.calificacion);
  const maxima=Number(flujo.datos.calificacionMaxima);

  if(!Number.isFinite(nota)||nota<0){
    throw new Error('La calificación no es válida.');
  }

  if(!Number.isFinite(maxima)||maxima<=0){
    throw new Error('La calificación máxima no es válida.');
  }

  if(nota>maxima){
    throw new Error('La calificación no puede superar la máxima.');
  }

  const hoja=obtenerHoja('CALIFICACIONES');

  hoja.getRange(registro.__fila,7,1,2).setValues([[
    nota,
    maxima
  ]]);

  hoja.getRange(registro.__fila,10).setValue(
    String(flujo.datos.observaciones||'')
  );

  registrarAuditoria(
    enlace.idMaestra,
    'EDITAR',
    'CALIFICACIONES',
    'Calificación corregida desde Telegram: '+
      String(registro.ACTIVIDAD||'Actividad')
  );

  borrarEdicionCalificacionTelegram(enlace.chatId);

  return {
    activo:false,
    guardado:true,
    texto:'✅ Calificación corregida correctamente: '+
      nota+'/'+maxima
  };
}

function botCancelarEdicionCalificacionTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  borrarEdicionCalificacionTelegram(enlace.chatId);

  return {
    activo:false,
    cancelado:true,
    texto:'❌ Corrección de calificación cancelada.'
  };
}

function botEliminarCalificacionTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  validarObjeto(datos,['idCalificacion']);

  const registro=obtenerRegistrosConFila('CALIFICACIONES').find(r=>
    String(r.ID_CALIFICACION||'').trim()===
      String(datos.idCalificacion||'').trim()&&
    String(r.ID_MAESTRA||'').trim()===enlace.idMaestra
  );

  if(!registro)throw new Error('No se encontró la calificación.');

  const hoja=obtenerHoja('CALIFICACIONES');
  const actividad=String(registro.ACTIVIDAD||'');
  hoja.deleteRow(registro.__fila);

  registrarAuditoria(
    enlace.idMaestra,
    'ELIMINAR',
    'CALIFICACIONES',
    'Calificación eliminada desde Telegram: '+actividad
  );

  return {
    eliminado:true,
    texto:'🗑️ Calificación eliminada correctamente: '+actividad
  };
}


function claveEdicionAlumnoTelegram(chatId){
  return 'TELEGRAM_ALUMNO_EDICION_'+String(chatId).trim();
}

function guardarEdicionAlumnoTelegram(chatId,flujo){
  const contenido=Object.assign({},flujo,{actualizado:Date.now()});
  PropertiesService.getScriptProperties().setProperty(
    claveEdicionAlumnoTelegram(chatId),
    JSON.stringify(contenido)
  );
  return contenido;
}

function obtenerEdicionAlumnoTelegram(chatId){
  const clave=claveEdicionAlumnoTelegram(chatId);
  const valor=PropertiesService.getScriptProperties().getProperty(clave);

  if(!valor)return null;

  try{
    const flujo=JSON.parse(valor);

    if(Date.now()-Number(flujo.actualizado||0)>60*60*1000){
      PropertiesService.getScriptProperties().deleteProperty(clave);
      return null;
    }

    return flujo;
  }catch(_){
    PropertiesService.getScriptProperties().deleteProperty(clave);
    return null;
  }
}

function borrarEdicionAlumnoTelegram(chatId){
  PropertiesService.getScriptProperties().deleteProperty(
    claveEdicionAlumnoTelegram(chatId)
  );
}

function botListarAlumnosGestionTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);

  const alumnos=obtenerRegistrosConFila('ALUMNOS')
    .filter(r=>
      String(r.ID_MAESTRA||'').trim()===enlace.idMaestra&&
      String(r.ESTADO||'').trim().toUpperCase()!=='ELIMINADO'
    )
    .map(r=>({
      idAlumno:String(r.ID_ALUMNO||''),
      nombre:(String(r.NOMBRE||'')+' '+String(r.APELLIDO||'')).trim(),
      grado:String(r.GRADO||''),
      seccion:String(r.SECCION||''),
      estado:String(r.ESTADO||'ACTIVO').toUpperCase()
    }))
    .sort((a,b)=>a.nombre.localeCompare(b.nombre))
    .slice(0,30);

  return {alumnos:alumnos};
}

function botObtenerAlumnoGestionTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  validarObjeto(datos,['idAlumno']);

  const alumno=obtenerRegistrosConFila('ALUMNOS').find(r=>
    String(r.ID_ALUMNO||'').trim()===String(datos.idAlumno||'').trim()&&
    String(r.ID_MAESTRA||'').trim()===enlace.idMaestra&&
    String(r.ESTADO||'').trim().toUpperCase()!=='ELIMINADO'
  );

  if(!alumno)throw new Error('No se encontró el alumno.');

  const resultado={
    idAlumno:String(alumno.ID_ALUMNO||''),
    nombre:String(alumno.NOMBRE||''),
    apellido:String(alumno.APELLIDO||''),
    documento:String(alumno.DOCUMENTO||''),
    fechaNacimiento:formatearFechaParaFormulario(alumno.FECHA_NACIMIENTO),
    sexo:String(alumno.SEXO||''),
    grado:String(alumno.GRADO||''),
    seccion:String(alumno.SECCION||''),
    representante:String(alumno.REPRESENTANTE||''),
    telefono:String(alumno.TELEFONO||''),
    direccion:String(alumno.DIRECCION||''),
    observaciones:String(alumno.OBSERVACIONES||''),
    estado:String(alumno.ESTADO||'ACTIVO').toUpperCase()
  };

  return {
    alumno:resultado,
    texto:[
      '👩‍🎓 Alumno',
      '',
      'Nombre: '+resultado.nombre+' '+resultado.apellido,
      'Documento: '+(resultado.documento||'Sin documento'),
      'Nacimiento: '+(
        resultado.fechaNacimiento
          ?formatearFechaTelegram(resultado.fechaNacimiento)
          :'Sin fecha'
      ),
      'Sexo: '+(resultado.sexo||'Sin indicar'),
      'Grado: '+(resultado.grado||'Sin indicar'),
      'Sección: '+(resultado.seccion||'Sin indicar'),
      'Representante: '+(resultado.representante||'Sin indicar'),
      'Teléfono: '+(resultado.telefono||'Sin indicar'),
      'Estado: '+capitalizarTelegram(resultado.estado),
      'Observaciones: '+(resultado.observaciones||'Sin observaciones')
    ].join('\n')
  };
}

function botIniciarEdicionAlumnoTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  validarObjeto(datos,['idAlumno']);

  const alumno=obtenerRegistrosConFila('ALUMNOS').find(r=>
    String(r.ID_ALUMNO||'').trim()===String(datos.idAlumno||'').trim()&&
    String(r.ID_MAESTRA||'').trim()===enlace.idMaestra&&
    String(r.ESTADO||'').trim().toUpperCase()!=='ELIMINADO'
  );

  if(!alumno)throw new Error('No se encontró el alumno.');

  guardarEdicionAlumnoTelegram(enlace.chatId,{
    idMaestra:enlace.idMaestra,
    idAlumno:String(alumno.ID_ALUMNO||''),
    paso:'NOMBRE',
    datos:{
      nombre:String(alumno.NOMBRE||''),
      apellido:String(alumno.APELLIDO||''),
      grado:String(alumno.GRADO||''),
      seccion:String(alumno.SECCION||''),
      representante:String(alumno.REPRESENTANTE||''),
      telefono:String(alumno.TELEFONO||''),
      observaciones:String(alumno.OBSERVACIONES||'')
    }
  });

  return {
    activo:true,
    paso:'NOMBRE',
    texto:[
      '✏️ Editar alumno',
      '',
      'Nombre actual: '+String(alumno.NOMBRE||''),
      '',
      'Escribe el nuevo nombre.',
      'Escribe un guion - para conservarlo.'
    ].join('\n')
  };
}

function botProcesarEdicionAlumnoTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  validarObjeto(datos,['texto']);

  const texto=String(datos.texto||'').trim();
  const flujo=obtenerEdicionAlumnoTelegram(enlace.chatId);

  if(!flujo)return {activo:false};

  if(texto.toLowerCase()==='/cancelar'){
    borrarEdicionAlumnoTelegram(enlace.chatId);

    return {
      activo:false,
      cancelado:true,
      texto:'❌ Edición del alumno cancelada.'
    };
  }

  flujo.datos=flujo.datos||{};

  if(flujo.paso==='NOMBRE'){
    if(texto!=='-'){
      if(texto.length<2)throw new Error('El nombre debe tener al menos 2 caracteres.');
      flujo.datos.nombre=texto;
    }

    flujo.paso='APELLIDO';
    guardarEdicionAlumnoTelegram(enlace.chatId,flujo);

    return {
      activo:true,
      paso:'APELLIDO',
      texto:'Escribe el nuevo apellido.\n\nEscribe un guion - para conservarlo.'
    };
  }

  if(flujo.paso==='APELLIDO'){
    if(texto!=='-'){
      if(texto.length<2)throw new Error('El apellido debe tener al menos 2 caracteres.');
      flujo.datos.apellido=texto;
    }

    flujo.paso='GRADO';
    guardarEdicionAlumnoTelegram(enlace.chatId,flujo);

    return {
      activo:true,
      paso:'GRADO',
      texto:'Escribe el nuevo grado.\n\nEscribe un guion - para conservarlo.'
    };
  }

  if(flujo.paso==='GRADO'){
    if(texto!=='-')flujo.datos.grado=texto;

    flujo.paso='SECCION';
    guardarEdicionAlumnoTelegram(enlace.chatId,flujo);

    return {
      activo:true,
      paso:'SECCION',
      texto:'Escribe la nueva sección.\n\nEscribe un guion - para conservarla.'
    };
  }

  if(flujo.paso==='SECCION'){
    if(texto!=='-')flujo.datos.seccion=texto;

    flujo.paso='REPRESENTANTE';
    guardarEdicionAlumnoTelegram(enlace.chatId,flujo);

    return {
      activo:true,
      paso:'REPRESENTANTE',
      texto:'Escribe el representante.\n\nEscribe un guion - para conservarlo.'
    };
  }

  if(flujo.paso==='REPRESENTANTE'){
    if(texto!=='-')flujo.datos.representante=texto;

    flujo.paso='TELEFONO';
    guardarEdicionAlumnoTelegram(enlace.chatId,flujo);

    return {
      activo:true,
      paso:'TELEFONO',
      texto:'Escribe el teléfono.\n\nEscribe un guion - para conservarlo.'
    };
  }

  if(flujo.paso==='TELEFONO'){
    if(texto!=='-')flujo.datos.telefono=texto;

    flujo.paso='OBSERVACIONES';
    guardarEdicionAlumnoTelegram(enlace.chatId,flujo);

    return {
      activo:true,
      paso:'OBSERVACIONES',
      texto:'Escribe las observaciones.\n\nEscribe un guion - para conservarlas.'
    };
  }

  if(flujo.paso==='OBSERVACIONES'){
    if(texto!=='-')flujo.datos.observaciones=texto;

    flujo.paso='CONFIRMAR';
    guardarEdicionAlumnoTelegram(enlace.chatId,flujo);

    return {
      activo:true,
      paso:'CONFIRMAR',
      texto:[
        '👩‍🎓 Revisa los cambios',
        '',
        'Nombre: '+String(flujo.datos.nombre||'')+' '+
          String(flujo.datos.apellido||''),
        'Grado: '+(String(flujo.datos.grado||'').trim()||'Sin indicar'),
        'Sección: '+(String(flujo.datos.seccion||'').trim()||'Sin indicar'),
        'Representante: '+(
          String(flujo.datos.representante||'').trim()||'Sin indicar'
        ),
        'Teléfono: '+(
          String(flujo.datos.telefono||'').trim()||'Sin indicar'
        ),
        'Observaciones: '+(
          String(flujo.datos.observaciones||'').trim()||'Sin observaciones'
        )
      ].join('\n')
    };
  }

  return {
    activo:true,
    paso:String(flujo.paso||''),
    texto:'Continúa con los botones mostrados o escribe /cancelar.'
  };
}

function botConfirmarEdicionAlumnoTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  const flujo=obtenerEdicionAlumnoTelegram(enlace.chatId);

  if(!flujo||flujo.paso!=='CONFIRMAR'){
    throw new Error('No hay una edición pendiente de confirmación.');
  }

  const alumno=obtenerRegistrosConFila('ALUMNOS').find(r=>
    String(r.ID_ALUMNO||'').trim()===String(flujo.idAlumno||'').trim()&&
    String(r.ID_MAESTRA||'').trim()===enlace.idMaestra&&
    String(r.ESTADO||'').trim().toUpperCase()!=='ELIMINADO'
  );

  if(!alumno)throw new Error('El alumno ya no está disponible.');

  const d=flujo.datos||{};
  if(!d.nombre||!d.apellido){
    throw new Error('Faltan el nombre o el apellido.');
  }

  const hoja=obtenerHoja('ALUMNOS');

  hoja.getRange(alumno.__fila,3,1,2).setValues([[
    limpiarTexto(d.nombre),
    limpiarTexto(d.apellido)
  ]]);

  hoja.getRange(alumno.__fila,8,1,5).setValues([[
    limpiarTexto(d.grado||''),
    limpiarTexto(d.seccion||''),
    limpiarTexto(d.representante||''),
    limpiarTexto(d.telefono||''),
    limpiarTexto(alumno.DIRECCION||'')
  ]]);

  hoja.getRange(alumno.__fila,13).setValue(
    limpiarTexto(d.observaciones||'')
  );

  registrarAuditoria(
    enlace.idMaestra,
    'EDITAR',
    'ALUMNOS',
    'Alumno actualizado desde Telegram: '+
      limpiarTexto(d.nombre)+' '+limpiarTexto(d.apellido)
  );

  borrarEdicionAlumnoTelegram(enlace.chatId);

  return {
    activo:false,
    guardado:true,
    texto:'✅ Alumno actualizado correctamente: '+
      limpiarTexto(d.nombre)+' '+limpiarTexto(d.apellido)
  };
}

function botCambiarEstadoAlumnoTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  validarObjeto(datos,['idAlumno','estado']);

  const estado=String(datos.estado||'').trim().toUpperCase();
  if(!['ACTIVO','INACTIVO'].includes(estado)){
    throw new Error('El estado del alumno no es válido.');
  }

  const alumno=obtenerRegistrosConFila('ALUMNOS').find(r=>
    String(r.ID_ALUMNO||'').trim()===String(datos.idAlumno||'').trim()&&
    String(r.ID_MAESTRA||'').trim()===enlace.idMaestra&&
    String(r.ESTADO||'').trim().toUpperCase()!=='ELIMINADO'
  );

  if(!alumno)throw new Error('No se encontró el alumno.');

  const hoja=obtenerHoja('ALUMNOS');
  hoja.getRange(alumno.__fila,14).setValue(estado);

  registrarAuditoria(
    enlace.idMaestra,
    'EDITAR',
    'ALUMNOS',
    'Alumno '+String(alumno.NOMBRE||'')+' cambiado a '+estado+
      ' desde Telegram'
  );

  return {
    actualizado:true,
    texto:'✅ El alumno quedó como '+estado.toLowerCase()+'.'
  };
}

function botEliminarAlumnoTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  validarObjeto(datos,['idAlumno']);

  const alumno=obtenerRegistrosConFila('ALUMNOS').find(r=>
    String(r.ID_ALUMNO||'').trim()===String(datos.idAlumno||'').trim()&&
    String(r.ID_MAESTRA||'').trim()===enlace.idMaestra&&
    String(r.ESTADO||'').trim().toUpperCase()!=='ELIMINADO'
  );

  if(!alumno)throw new Error('No se encontró el alumno.');

  const hoja=obtenerHoja('ALUMNOS');
  hoja.getRange(alumno.__fila,14).setValue('ELIMINADO');

  const nombre=(
    String(alumno.NOMBRE||'')+' '+String(alumno.APELLIDO||'')
  ).trim();

  registrarAuditoria(
    enlace.idMaestra,
    'ELIMINAR',
    'ALUMNOS',
    'Alumno eliminado desde Telegram: '+nombre
  );

  return {
    eliminado:true,
    texto:'🗑️ Alumno eliminado correctamente: '+nombre
  };
}


function nombreAlumnoAsistenciaTelegram(idAlumno,alumnos){
  const alumno=alumnos.find(r=>
    String(r.ID_ALUMNO||'').trim()===String(idAlumno||'').trim()
  );

  if(!alumno)return 'Alumno';

  return (
    String(alumno.NOMBRE||'')+' '+String(alumno.APELLIDO||'')
  ).trim();
}

function botListarAsistenciaGestionTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  const fecha=Utilities.formatDate(
    new Date(),
    obtenerZonaHorariaAulaMagica(),
    'yyyy-MM-dd'
  );

  const alumnos=obtenerRegistros('ALUMNOS').filter(r=>
    String(r.ID_MAESTRA||'').trim()===enlace.idMaestra
  );

  const asistencias=obtenerRegistrosConFila('ASISTENCIA')
    .filter(r=>
      String(r.ID_MAESTRA||'').trim()===enlace.idMaestra&&
      normalizarFechaAsistencia(r.FECHA)===fecha
    )
    .map(r=>({
      idAsistencia:String(r.ID_ASISTENCIA||''),
      idAlumno:String(r.ID_ALUMNO||''),
      nombreAlumno:nombreAlumnoAsistenciaTelegram(r.ID_ALUMNO,alumnos),
      fecha:normalizarFechaAsistencia(r.FECHA),
      estado:String(r.ESTADO||'PRESENTE').toUpperCase(),
      observaciones:String(r.OBSERVACIONES||'')
    }))
    .sort((a,b)=>a.nombreAlumno.localeCompare(b.nombreAlumno));

  return {
    fecha:fecha,
    asistencias:asistencias
  };
}

function botObtenerAsistenciaGestionTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  validarObjeto(datos,['idAsistencia']);

  const alumnos=obtenerRegistros('ALUMNOS').filter(r=>
    String(r.ID_MAESTRA||'').trim()===enlace.idMaestra
  );

  const registro=obtenerRegistrosConFila('ASISTENCIA').find(r=>
    String(r.ID_ASISTENCIA||'').trim()===
      String(datos.idAsistencia||'').trim()&&
    String(r.ID_MAESTRA||'').trim()===enlace.idMaestra
  );

  if(!registro)throw new Error('No se encontró el registro de asistencia.');

  const asistencia={
    idAsistencia:String(registro.ID_ASISTENCIA||''),
    idAlumno:String(registro.ID_ALUMNO||''),
    nombreAlumno:nombreAlumnoAsistenciaTelegram(
      registro.ID_ALUMNO,
      alumnos
    ),
    fecha:normalizarFechaAsistencia(registro.FECHA),
    estado:String(registro.ESTADO||'PRESENTE').toUpperCase(),
    observaciones:String(registro.OBSERVACIONES||'')
  };

  return {
    asistencia:asistencia,
    texto:[
      '✅ Asistencia',
      '',
      'Alumno: '+asistencia.nombreAlumno,
      'Fecha: '+formatearFechaTelegram(asistencia.fecha),
      'Estado: '+capitalizarTelegram(asistencia.estado),
      'Observaciones: '+(
        asistencia.observaciones||'Sin observaciones'
      )
    ].join('\n')
  };
}

function botCambiarEstadoAsistenciaTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  validarObjeto(datos,['idAsistencia','estado']);

  const estado=String(datos.estado||'').trim().toUpperCase();
  const permitidos=['PRESENTE','AUSENTE','TARDE','JUSTIFICADO'];

  if(!permitidos.includes(estado)){
    throw new Error('El estado de asistencia no es válido.');
  }

  const registro=obtenerRegistrosConFila('ASISTENCIA').find(r=>
    String(r.ID_ASISTENCIA||'').trim()===
      String(datos.idAsistencia||'').trim()&&
    String(r.ID_MAESTRA||'').trim()===enlace.idMaestra
  );

  if(!registro)throw new Error('No se encontró el registro de asistencia.');

  const hoja=obtenerHoja('ASISTENCIA');
  hoja.getRange(registro.__fila,5).setValue(estado);

  registrarAuditoria(
    enlace.idMaestra,
    'EDITAR',
    'ASISTENCIA',
    'Asistencia cambiada a '+estado+' desde Telegram'
  );

  return {
    actualizado:true,
    texto:'✅ La asistencia quedó como '+estado.toLowerCase()+'.'
  };
}

function botEliminarAsistenciaTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  validarObjeto(datos,['idAsistencia']);

  const registro=obtenerRegistrosConFila('ASISTENCIA').find(r=>
    String(r.ID_ASISTENCIA||'').trim()===
      String(datos.idAsistencia||'').trim()&&
    String(r.ID_MAESTRA||'').trim()===enlace.idMaestra
  );

  if(!registro)throw new Error('No se encontró el registro de asistencia.');

  obtenerHoja('ASISTENCIA').deleteRow(registro.__fila);

  registrarAuditoria(
    enlace.idMaestra,
    'ELIMINAR',
    'ASISTENCIA',
    'Registro de asistencia eliminado desde Telegram'
  );

  return {
    eliminado:true,
    texto:'🗑️ Registro de asistencia eliminado correctamente.'
  };
}


function claveEdicionEventoTelegram(chatId){
  return 'TELEGRAM_EVENTO_EDICION_'+String(chatId).trim();
}

function guardarEdicionEventoTelegram(chatId,flujo){
  const contenido=Object.assign({},flujo,{actualizado:Date.now()});
  PropertiesService.getScriptProperties().setProperty(
    claveEdicionEventoTelegram(chatId),
    JSON.stringify(contenido)
  );
  return contenido;
}

function obtenerEdicionEventoTelegram(chatId){
  const clave=claveEdicionEventoTelegram(chatId);
  const valor=PropertiesService.getScriptProperties().getProperty(clave);

  if(!valor)return null;

  try{
    const flujo=JSON.parse(valor);

    if(Date.now()-Number(flujo.actualizado||0)>60*60*1000){
      PropertiesService.getScriptProperties().deleteProperty(clave);
      return null;
    }

    return flujo;
  }catch(_){
    PropertiesService.getScriptProperties().deleteProperty(clave);
    return null;
  }
}

function borrarEdicionEventoTelegram(chatId){
  PropertiesService.getScriptProperties().deleteProperty(
    claveEdicionEventoTelegram(chatId)
  );
}

function botIniciarEdicionEventoTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  validarObjeto(datos,['idEvento']);

  const evento=obtenerRegistrosAgenda().find(r=>
    String(r.ID_EVENTO||'').trim()===String(datos.idEvento||'').trim()&&
    String(r.ID_MAESTRA||'').trim()===enlace.idMaestra
  );

  if(!evento)throw new Error('No se encontró el evento.');

  guardarEdicionEventoTelegram(enlace.chatId,{
    idMaestra:enlace.idMaestra,
    idEvento:String(evento.ID_EVENTO||''),
    paso:'TITULO',
    datos:{
      titulo:String(evento.TITULO||''),
      tipo:String(evento.TIPO||'OTRO').toUpperCase(),
      fecha:normalizarFechaVisibleAgenda(evento.FECHA),
      hora:normalizarHoraVisibleAgenda(evento.HORA),
      descripcion:String(evento.DESCRIPCION||'')
    }
  });

  return {
    activo:true,
    paso:'TITULO',
    texto:[
      '✏️ Editar evento',
      '',
      'Título actual: '+String(evento.TITULO||''),
      '',
      'Escribe el nuevo título.',
      'Escribe un guion - para conservarlo.'
    ].join('\n')
  };
}

function botProcesarEdicionEventoTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  validarObjeto(datos,['texto']);

  const texto=String(datos.texto||'').trim();
  const flujo=obtenerEdicionEventoTelegram(enlace.chatId);

  if(!flujo)return {activo:false};

  if(texto.toLowerCase()==='/cancelar'){
    borrarEdicionEventoTelegram(enlace.chatId);

    return {
      activo:false,
      cancelado:true,
      texto:'❌ Edición del evento cancelada.'
    };
  }

  flujo.datos=flujo.datos||{};

  if(flujo.paso==='TITULO'){
    if(texto!=='-'){
      if(texto.length<2)throw new Error('El título debe tener al menos 2 caracteres.');
      flujo.datos.titulo=texto;
    }

    flujo.paso='FECHA';
    guardarEdicionEventoTelegram(enlace.chatId,flujo);

    return {
      activo:true,
      paso:'FECHA',
      texto:[
        'Fecha actual: '+formatearFechaTelegram(flujo.datos.fecha),
        '',
        'Escribe la nueva fecha como DD/MM/AAAA.',
        'Escribe un guion - para conservarla.'
      ].join('\n')
    };
  }

  if(flujo.paso==='FECHA'){
    if(texto!=='-'){
      flujo.datos.fecha=normalizarFechaEntradaAgendaTelegram(texto);
    }

    flujo.paso='HORA';
    guardarEdicionEventoTelegram(enlace.chatId,flujo);

    return {
      activo:true,
      paso:'HORA',
      texto:[
        'Hora actual: '+String(flujo.datos.hora||''),
        '',
        'Escribe la nueva hora como HH:MM.',
        'Escribe un guion - para conservarla.'
      ].join('\n')
    };
  }

  if(flujo.paso==='HORA'){
    if(texto!=='-'){
      flujo.datos.hora=normalizarHoraEntradaTelegram(texto);
    }

    flujo.paso='DESCRIPCION';
    guardarEdicionEventoTelegram(enlace.chatId,flujo);

    return {
      activo:true,
      paso:'DESCRIPCION',
      texto:[
        'Descripción actual: '+(
          String(flujo.datos.descripcion||'').trim()||'Sin descripción'
        ),
        '',
        'Escribe la nueva descripción.',
        'Escribe un guion - para conservarla.'
      ].join('\n')
    };
  }

  if(flujo.paso==='DESCRIPCION'){
    if(texto!=='-')flujo.datos.descripcion=texto;

    flujo.paso='CONFIRMAR';
    guardarEdicionEventoTelegram(enlace.chatId,flujo);

    return {
      activo:true,
      paso:'CONFIRMAR',
      texto:[
        '📅 Revisa los cambios',
        '',
        'Título: '+String(flujo.datos.titulo||''),
        'Fecha: '+formatearFechaTelegram(flujo.datos.fecha),
        'Hora: '+String(flujo.datos.hora||''),
        'Descripción: '+(
          String(flujo.datos.descripcion||'').trim()||'Sin descripción'
        )
      ].join('\n')
    };
  }

  return {
    activo:true,
    paso:String(flujo.paso||''),
    texto:'Continúa con el siguiente paso o escribe /cancelar.'
  };
}

function botConfirmarEdicionEventoTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  const flujo=obtenerEdicionEventoTelegram(enlace.chatId);

  if(!flujo||flujo.paso!=='CONFIRMAR'){
    throw new Error('No hay una edición pendiente de confirmación.');
  }

  const evento=obtenerRegistrosAgenda().find(r=>
    String(r.ID_EVENTO||'').trim()===String(flujo.idEvento||'').trim()&&
    String(r.ID_MAESTRA||'').trim()===enlace.idMaestra
  );

  if(!evento)throw new Error('El evento ya no está disponible.');

  const d=flujo.datos||{};
  if(!d.titulo||!d.fecha||!d.hora){
    throw new Error('Faltan datos obligatorios del evento.');
  }

  const hoja=obtenerHoja('AGENDA');

  hoja.getRange(evento.__fila,3).setValue(limpiarTexto(d.titulo));
  hoja.getRange(evento.__fila,5).setNumberFormat('@');
  hoja.getRange(evento.__fila,5).setValue(String(d.fecha));
  hoja.getRange(evento.__fila,6).setNumberFormat('@');
  hoja.getRange(evento.__fila,6).setValue(String(d.hora));
  hoja.getRange(evento.__fila,7).setValue(
    limpiarTexto(d.descripcion||'')
  );

  registrarAuditoria(
    enlace.idMaestra,
    'EDITAR',
    'AGENDA',
    'Evento editado desde Telegram: '+limpiarTexto(d.titulo)
  );

  borrarEdicionEventoTelegram(enlace.chatId);

  return {
    activo:false,
    guardado:true,
    texto:'✅ Evento actualizado correctamente.'
  };
}

function botCancelarEdicionEventoTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  borrarEdicionEventoTelegram(enlace.chatId);

  return {
    activo:false,
    cancelado:true,
    texto:'❌ Edición del evento cancelada.'
  };
}


function claveEdicionReunionTelegram(chatId){
  return 'TELEGRAM_REUNION_EDICION_'+String(chatId).trim();
}

function guardarEdicionReunionTelegram(chatId,flujo){
  const contenido=Object.assign({},flujo,{actualizado:Date.now()});
  PropertiesService.getScriptProperties().setProperty(
    claveEdicionReunionTelegram(chatId),
    JSON.stringify(contenido)
  );
  return contenido;
}

function obtenerEdicionReunionTelegram(chatId){
  const clave=claveEdicionReunionTelegram(chatId);
  const valor=PropertiesService.getScriptProperties().getProperty(clave);

  if(!valor)return null;

  try{
    const flujo=JSON.parse(valor);

    if(Date.now()-Number(flujo.actualizado||0)>60*60*1000){
      PropertiesService.getScriptProperties().deleteProperty(clave);
      return null;
    }

    return flujo;
  }catch(_){
    PropertiesService.getScriptProperties().deleteProperty(clave);
    return null;
  }
}

function borrarEdicionReunionTelegram(chatId){
  PropertiesService.getScriptProperties().deleteProperty(
    claveEdicionReunionTelegram(chatId)
  );
}

function resumenEdicionReunionTelegram(datos){
  return [
    '🤝 Revisa los cambios',
    '',
    'Título: '+String(datos.titulo||''),
    'Fecha: '+formatearFechaTelegram(datos.fecha),
    'Hora: '+String(datos.hora||''),
    'Lugar: '+(String(datos.lugar||'').trim()||'Sin indicar'),
    'Participantes: '+(
      String(datos.participantes||'').trim()||'Sin indicar'
    ),
    'Tema: '+(String(datos.tema||'').trim()||'Sin tema'),
    'Acuerdos: '+(String(datos.acuerdos||'').trim()||'Sin acuerdos')
  ].join('\n');
}

function botIniciarEdicionReunionTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  validarObjeto(datos,['idReunion']);

  const reunion=obtenerRegistrosConFila('REUNIONES').find(r=>
    String(r.ID_REUNION||'').trim()===String(datos.idReunion||'').trim()&&
    String(r.ID_MAESTRA||'').trim()===enlace.idMaestra
  );

  if(!reunion)throw new Error('No se encontró la reunión.');

  guardarEdicionReunionTelegram(enlace.chatId,{
    idMaestra:enlace.idMaestra,
    idReunion:String(reunion.ID_REUNION||''),
    paso:'TITULO',
    datos:{
      titulo:String(reunion.TITULO||''),
      tipo:String(reunion.TIPO||'OTRA').toUpperCase(),
      fecha:normalizarFechaTextoTelegram(reunion.FECHA),
      hora:normalizarHoraVisibleAgenda(reunion.HORA),
      lugar:String(reunion.LUGAR||''),
      participantes:String(reunion.PARTICIPANTES||''),
      tema:String(reunion.TEMAS||''),
      acuerdos:String(reunion.ACUERDOS||'')
    }
  });

  return {
    activo:true,
    paso:'TITULO',
    texto:[
      '✏️ Editar reunión',
      '',
      'Título actual: '+String(reunion.TITULO||''),
      '',
      'Escribe el nuevo título.',
      'Escribe un guion - para conservarlo.'
    ].join('\n')
  };
}

function botProcesarEdicionReunionTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  validarObjeto(datos,['texto']);

  const texto=String(datos.texto||'').trim();
  const flujo=obtenerEdicionReunionTelegram(enlace.chatId);

  if(!flujo)return {activo:false};

  if(texto.toLowerCase()==='/cancelar'){
    borrarEdicionReunionTelegram(enlace.chatId);

    return {
      activo:false,
      cancelado:true,
      texto:'❌ Edición de la reunión cancelada.'
    };
  }

  flujo.datos=flujo.datos||{};

  if(flujo.paso==='TITULO'){
    if(texto!=='-'){
      if(texto.length<2){
        throw new Error('El título debe tener al menos 2 caracteres.');
      }
      flujo.datos.titulo=texto;
    }

    flujo.paso='FECHA';
    guardarEdicionReunionTelegram(enlace.chatId,flujo);

    return {
      activo:true,
      paso:'FECHA',
      texto:[
        'Fecha actual: '+formatearFechaTelegram(flujo.datos.fecha),
        '',
        'Escribe la nueva fecha como DD/MM/AAAA.',
        'Escribe un guion - para conservarla.'
      ].join('\n')
    };
  }

  if(flujo.paso==='FECHA'){
    if(texto!=='-'){
      flujo.datos.fecha=normalizarFechaEntradaAgendaTelegram(texto);
    }

    flujo.paso='HORA';
    guardarEdicionReunionTelegram(enlace.chatId,flujo);

    return {
      activo:true,
      paso:'HORA',
      texto:[
        'Hora actual: '+String(flujo.datos.hora||''),
        '',
        'Escribe la nueva hora como HH:MM.',
        'Escribe un guion - para conservarla.'
      ].join('\n')
    };
  }

  if(flujo.paso==='HORA'){
    if(texto!=='-'){
      flujo.datos.hora=normalizarHoraEntradaTelegram(texto);
    }

    flujo.paso='LUGAR';
    guardarEdicionReunionTelegram(enlace.chatId,flujo);

    return {
      activo:true,
      paso:'LUGAR',
      texto:[
        'Lugar actual: '+(
          String(flujo.datos.lugar||'').trim()||'Sin indicar'
        ),
        '',
        'Escribe el nuevo lugar.',
        'Escribe un guion - para conservarlo.'
      ].join('\n')
    };
  }

  if(flujo.paso==='LUGAR'){
    if(texto!=='-')flujo.datos.lugar=texto;

    flujo.paso='PARTICIPANTES';
    guardarEdicionReunionTelegram(enlace.chatId,flujo);

    return {
      activo:true,
      paso:'PARTICIPANTES',
      texto:[
        'Participantes actuales: '+(
          String(flujo.datos.participantes||'').trim()||'Sin indicar'
        ),
        '',
        'Escribe los nuevos participantes.',
        'Escribe un guion - para conservarlos.'
      ].join('\n')
    };
  }

  if(flujo.paso==='PARTICIPANTES'){
    if(texto!=='-')flujo.datos.participantes=texto;

    flujo.paso='TEMA';
    guardarEdicionReunionTelegram(enlace.chatId,flujo);

    return {
      activo:true,
      paso:'TEMA',
      texto:[
        'Tema actual: '+(
          String(flujo.datos.tema||'').trim()||'Sin tema'
        ),
        '',
        'Escribe el nuevo tema.',
        'Escribe un guion - para conservarlo.'
      ].join('\n')
    };
  }

  if(flujo.paso==='TEMA'){
    if(texto!=='-')flujo.datos.tema=texto;

    flujo.paso='ACUERDOS';
    guardarEdicionReunionTelegram(enlace.chatId,flujo);

    return {
      activo:true,
      paso:'ACUERDOS',
      texto:[
        'Acuerdos actuales: '+(
          String(flujo.datos.acuerdos||'').trim()||'Sin acuerdos'
        ),
        '',
        'Escribe los nuevos acuerdos.',
        'Escribe un guion - para conservarlos.'
      ].join('\n')
    };
  }

  if(flujo.paso==='ACUERDOS'){
    if(texto!=='-')flujo.datos.acuerdos=texto;

    flujo.paso='CONFIRMAR';
    guardarEdicionReunionTelegram(enlace.chatId,flujo);

    return {
      activo:true,
      paso:'CONFIRMAR',
      texto:resumenEdicionReunionTelegram(flujo.datos)
    };
  }

  return {
    activo:true,
    paso:String(flujo.paso||''),
    texto:'Continúa con el siguiente paso o escribe /cancelar.'
  };
}

function botConfirmarEdicionReunionTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  const flujo=obtenerEdicionReunionTelegram(enlace.chatId);

  if(!flujo||flujo.paso!=='CONFIRMAR'){
    throw new Error('No hay una edición pendiente de confirmación.');
  }

  const reunion=obtenerRegistrosConFila('REUNIONES').find(r=>
    String(r.ID_REUNION||'').trim()===String(flujo.idReunion||'').trim()&&
    String(r.ID_MAESTRA||'').trim()===enlace.idMaestra
  );

  if(!reunion)throw new Error('La reunión ya no está disponible.');

  const d=flujo.datos||{};

  if(!d.titulo||!d.fecha||!d.hora){
    throw new Error('Faltan datos obligatorios de la reunión.');
  }

  const hoja=obtenerHoja('REUNIONES');

  // Columnas:
  // 3 TITULO, 5 FECHA, 6 HORA, 7 LUGAR,
  // 8 PARTICIPANTES, 9 TEMAS, 10 ACUERDOS, 11 ESTADO.
  hoja.getRange(reunion.__fila,3).setValue(limpiarTexto(d.titulo));

  hoja.getRange(reunion.__fila,5).setNumberFormat('@');
  hoja.getRange(reunion.__fila,5).setValue(String(d.fecha));

  hoja.getRange(reunion.__fila,6).setNumberFormat('@');
  hoja.getRange(reunion.__fila,6).setValue(String(d.hora));

  hoja.getRange(reunion.__fila,7,1,4).setValues([[
    limpiarTexto(d.lugar||''),
    limpiarTexto(d.participantes||''),
    limpiarTexto(d.tema||''),
    limpiarTexto(d.acuerdos||'')
  ]]);

  registrarAuditoria(
    enlace.idMaestra,
    'EDITAR',
    'REUNIONES',
    'Reunión editada desde Telegram: '+limpiarTexto(d.titulo)
  );

  borrarEdicionReunionTelegram(enlace.chatId);

  return {
    activo:false,
    guardado:true,
    texto:'✅ Reunión actualizada correctamente.\n\n'+
      resumenEdicionReunionTelegram(d)
  };
}

function botCancelarEdicionReunionTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  borrarEdicionReunionTelegram(enlace.chatId);

  return {
    activo:false,
    cancelado:true,
    texto:'❌ Edición de la reunión cancelada.'
  };
}


function claveEdicionPlanTelegram(chatId){
  return 'TELEGRAM_PLAN_EDICION_'+String(chatId).trim();
}

function guardarEdicionPlanTelegram(chatId,flujo){
  const contenido=Object.assign({},flujo,{actualizado:Date.now()});
  PropertiesService.getScriptProperties().setProperty(
    claveEdicionPlanTelegram(chatId),
    JSON.stringify(contenido)
  );
  return contenido;
}

function obtenerEdicionPlanTelegram(chatId){
  const clave=claveEdicionPlanTelegram(chatId);
  const valor=PropertiesService.getScriptProperties().getProperty(clave);

  if(!valor)return null;

  try{
    const flujo=JSON.parse(valor);

    if(Date.now()-Number(flujo.actualizado||0)>60*60*1000){
      PropertiesService.getScriptProperties().deleteProperty(clave);
      return null;
    }

    return flujo;
  }catch(_){
    PropertiesService.getScriptProperties().deleteProperty(clave);
    return null;
  }
}

function borrarEdicionPlanTelegram(chatId){
  PropertiesService.getScriptProperties().deleteProperty(
    claveEdicionPlanTelegram(chatId)
  );
}

function resumenEdicionPlanTelegram(datos){
  return [
    '📚 Revisa los cambios',
    '',
    'Título: '+String(datos.titulo||''),
    'Asignatura: '+String(datos.asignatura||''),
    'Grado: '+(String(datos.grado||'').trim()||'Sin indicar'),
    'Fecha: '+formatearFechaTelegram(datos.fecha),
    'Objetivo: '+(String(datos.objetivo||'').trim()||'Sin objetivo'),
    'Contenido: '+(String(datos.contenido||'').trim()||'Sin contenido'),
    'Actividades: '+(String(datos.actividades||'').trim()||'Sin actividades'),
    'Recursos: '+(String(datos.recursos||'').trim()||'Sin recursos'),
    'Evaluación: '+(String(datos.evaluacion||'').trim()||'Sin evaluación')
  ].join('\n');
}

function botIniciarEdicionPlanTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  validarObjeto(datos,['idPlanificacion']);

  const plan=obtenerRegistrosConFila('PLANIFICACION').find(r=>
    String(r.ID_PLANIFICACION||'').trim()===
      String(datos.idPlanificacion||'').trim()&&
    String(r.ID_MAESTRA||'').trim()===enlace.idMaestra
  );

  if(!plan)throw new Error('No se encontró la planificación.');

  guardarEdicionPlanTelegram(enlace.chatId,{
    idMaestra:enlace.idMaestra,
    idPlanificacion:String(plan.ID_PLANIFICACION||''),
    paso:'TITULO',
    datos:{
      titulo:String(plan.TITULO||''),
      asignatura:String(plan.ASIGNATURA||''),
      grado:String(plan.GRADO||''),
      fecha:normalizarFechaTextoTelegram(plan.FECHA),
      objetivo:String(plan.OBJETIVO||''),
      contenido:String(plan.CONTENIDO||''),
      actividades:String(plan.ACTIVIDADES||''),
      recursos:String(plan.RECURSOS||''),
      evaluacion:String(plan.EVALUACION||'')
    }
  });

  return {
    activo:true,
    paso:'TITULO',
    texto:[
      '✏️ Editar planificación',
      '',
      'Título actual: '+String(plan.TITULO||''),
      '',
      'Escribe el nuevo título.',
      'Escribe un guion - para conservarlo.'
    ].join('\n')
  };
}

function botProcesarEdicionPlanTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  validarObjeto(datos,['texto']);

  const texto=String(datos.texto||'').trim();
  const flujo=obtenerEdicionPlanTelegram(enlace.chatId);

  if(!flujo)return {activo:false};

  if(texto.toLowerCase()==='/cancelar'){
    borrarEdicionPlanTelegram(enlace.chatId);
    return {
      activo:false,
      cancelado:true,
      texto:'❌ Edición de la planificación cancelada.'
    };
  }

  flujo.datos=flujo.datos||{};

  if(flujo.paso==='TITULO'){
    if(texto!=='-'){
      if(texto.length<2){
        throw new Error('El título debe tener al menos 2 caracteres.');
      }
      flujo.datos.titulo=texto;
    }
    flujo.paso='ASIGNATURA';
    guardarEdicionPlanTelegram(enlace.chatId,flujo);
    return {
      activo:true,
      paso:'ASIGNATURA',
      texto:'Escribe la nueva asignatura.\n\nEscribe un guion - para conservarla.'
    };
  }

  if(flujo.paso==='ASIGNATURA'){
    if(texto!=='-')flujo.datos.asignatura=texto;
    flujo.paso='GRADO';
    guardarEdicionPlanTelegram(enlace.chatId,flujo);
    return {
      activo:true,
      paso:'GRADO',
      texto:'Escribe el nuevo grado.\n\nEscribe un guion - para conservarlo.'
    };
  }

  if(flujo.paso==='GRADO'){
    if(texto!=='-')flujo.datos.grado=texto;
    flujo.paso='FECHA';
    guardarEdicionPlanTelegram(enlace.chatId,flujo);
    return {
      activo:true,
      paso:'FECHA',
      texto:[
        'Fecha actual: '+formatearFechaTelegram(flujo.datos.fecha),
        '',
        'Escribe la nueva fecha como DD/MM/AAAA.',
        'Escribe un guion - para conservarla.'
      ].join('\n')
    };
  }

  if(flujo.paso==='FECHA'){
    if(texto!=='-'){
      flujo.datos.fecha=normalizarFechaEntradaAgendaTelegram(texto);
    }
    flujo.paso='OBJETIVO';
    guardarEdicionPlanTelegram(enlace.chatId,flujo);
    return {
      activo:true,
      paso:'OBJETIVO',
      texto:'Escribe el nuevo objetivo.\n\nEscribe un guion - para conservarlo.'
    };
  }

  if(flujo.paso==='OBJETIVO'){
    if(texto!=='-')flujo.datos.objetivo=texto;
    flujo.paso='CONTENIDO';
    guardarEdicionPlanTelegram(enlace.chatId,flujo);
    return {
      activo:true,
      paso:'CONTENIDO',
      texto:'Escribe el nuevo contenido.\n\nEscribe un guion - para conservarlo.'
    };
  }

  if(flujo.paso==='CONTENIDO'){
    if(texto!=='-')flujo.datos.contenido=texto;
    flujo.paso='ACTIVIDADES';
    guardarEdicionPlanTelegram(enlace.chatId,flujo);
    return {
      activo:true,
      paso:'ACTIVIDADES',
      texto:'Escribe las nuevas actividades.\n\nEscribe un guion - para conservarlas.'
    };
  }

  if(flujo.paso==='ACTIVIDADES'){
    if(texto!=='-')flujo.datos.actividades=texto;
    flujo.paso='RECURSOS';
    guardarEdicionPlanTelegram(enlace.chatId,flujo);
    return {
      activo:true,
      paso:'RECURSOS',
      texto:'Escribe los nuevos recursos.\n\nEscribe un guion - para conservarlos.'
    };
  }

  if(flujo.paso==='RECURSOS'){
    if(texto!=='-')flujo.datos.recursos=texto;
    flujo.paso='EVALUACION';
    guardarEdicionPlanTelegram(enlace.chatId,flujo);
    return {
      activo:true,
      paso:'EVALUACION',
      texto:'Escribe la nueva evaluación.\n\nEscribe un guion - para conservarla.'
    };
  }

  if(flujo.paso==='EVALUACION'){
    if(texto!=='-')flujo.datos.evaluacion=texto;
    flujo.paso='CONFIRMAR';
    guardarEdicionPlanTelegram(enlace.chatId,flujo);
    return {
      activo:true,
      paso:'CONFIRMAR',
      texto:resumenEdicionPlanTelegram(flujo.datos)
    };
  }

  return {
    activo:true,
    paso:String(flujo.paso||''),
    texto:'Continúa con el siguiente paso o escribe /cancelar.'
  };
}

function botConfirmarEdicionPlanTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  const flujo=obtenerEdicionPlanTelegram(enlace.chatId);

  if(!flujo||flujo.paso!=='CONFIRMAR'){
    throw new Error('No hay una edición pendiente de confirmación.');
  }

  const plan=obtenerRegistrosConFila('PLANIFICACION').find(r=>
    String(r.ID_PLANIFICACION||'').trim()===
      String(flujo.idPlanificacion||'').trim()&&
    String(r.ID_MAESTRA||'').trim()===enlace.idMaestra
  );

  if(!plan)throw new Error('La planificación ya no está disponible.');

  const d=flujo.datos||{};

  if(!d.titulo||!d.asignatura||!d.fecha){
    throw new Error('Faltan datos obligatorios de la planificación.');
  }

  const hoja=obtenerHoja('PLANIFICACION');

  // Columnas 3 a 11:
  // TITULO, ASIGNATURA, GRADO, FECHA, OBJETIVO,
  // CONTENIDO, ACTIVIDADES, RECURSOS, EVALUACION.
  hoja.getRange(plan.__fila,3,1,9).setValues([[
    limpiarTexto(d.titulo),
    limpiarTexto(d.asignatura),
    limpiarTexto(d.grado||''),
    String(d.fecha),
    limpiarTexto(d.objetivo||''),
    limpiarTexto(d.contenido||''),
    limpiarTexto(d.actividades||''),
    limpiarTexto(d.recursos||''),
    limpiarTexto(d.evaluacion||'')
  ]]);

  hoja.getRange(plan.__fila,6).setNumberFormat('@');
  hoja.getRange(plan.__fila,6).setValue(String(d.fecha));

  registrarAuditoria(
    enlace.idMaestra,
    'EDITAR',
    'PLANIFICACION',
    'Planificación editada desde Telegram: '+limpiarTexto(d.titulo)
  );

  borrarEdicionPlanTelegram(enlace.chatId);

  return {
    activo:false,
    guardado:true,
    texto:'✅ Planificación actualizada correctamente.\n\n'+
      resumenEdicionPlanTelegram(d)
  };
}

function botCancelarEdicionPlanTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  borrarEdicionPlanTelegram(enlace.chatId);

  return {
    activo:false,
    cancelado:true,
    texto:'❌ Edición de la planificación cancelada.'
  };
}


function activarRecordatoriosAutomaticos(){
  const funcion='procesarRecordatoriosAutomaticos';

  ScriptApp.getProjectTriggers()
    .filter(t=>t.getHandlerFunction()===funcion)
    .forEach(t=>ScriptApp.deleteTrigger(t));

  ScriptApp.newTrigger(funcion)
    .timeBased()
    .everyHours(1)
    .create();

  PropertiesService.getScriptProperties()
    .setProperty('RECORDATORIOS_AUTOMATICOS','SI');

  SpreadsheetApp.getUi().alert(
    'Recordatorios activados',
    'Aula Mágica revisará cada hora y enviará cada aviso una sola vez.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function desactivarRecordatoriosAutomaticos(){
  const funcion='procesarRecordatoriosAutomaticos';

  ScriptApp.getProjectTriggers()
    .filter(t=>t.getHandlerFunction()===funcion)
    .forEach(t=>ScriptApp.deleteTrigger(t));

  PropertiesService.getScriptProperties()
    .setProperty('RECORDATORIOS_AUTOMATICOS','NO');

  SpreadsheetApp.getUi().alert(
    'Recordatorios desactivados',
    'No se enviarán nuevos avisos automáticos.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function probarRecordatoriosAutomaticos(){
  const resultado=procesarRecordatoriosAutomaticos(true);

  SpreadsheetApp.getUi().alert(
    'Prueba terminada',
    'Mensajes enviados: '+Number(resultado.enviados||0),
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function obtenerEnlacesTelegramActivosRecordatorios(){
  return obtenerRegistros('TELEGRAM')
    .filter(r=>
      String(r.ESTADO||'').trim().toUpperCase()==='VINCULADO'&&
      String(r.ID_MAESTRA||'').trim()&&
      String(r.CHAT_ID||'').trim()
    )
    .map(r=>({
      idMaestra:String(r.ID_MAESTRA||'').trim(),
      chatId:String(r.CHAT_ID||'').trim()
    }));
}

function sumarDiasFechaTelegram(fecha,cantidad){
  const partes=String(fecha||'').split('-').map(Number);
  const valor=new Date(
    Date.UTC(
      Number(partes[0]||0),
      Number(partes[1]||1)-1,
      Number(partes[2]||1)
    )
  );

  valor.setUTCDate(valor.getUTCDate()+Number(cantidad||0));

  return [
    valor.getUTCFullYear(),
    String(valor.getUTCMonth()+1).padStart(2,'0'),
    String(valor.getUTCDate()).padStart(2,'0')
  ].join('-');
}

function claveAvisoAutomaticoTelegram(tipo,idMaestra,fecha){
  return [
    'AVISO_TELEGRAM',
    String(tipo||''),
    String(idMaestra||''),
    String(fecha||'')
  ].join('_');
}

function avisoAutomaticoYaEnviadoTelegram(tipo,idMaestra,fecha){
  return PropertiesService.getScriptProperties().getProperty(
    claveAvisoAutomaticoTelegram(tipo,idMaestra,fecha)
  )==='SI';
}

function marcarAvisoAutomaticoTelegram(tipo,idMaestra,fecha){
  PropertiesService.getScriptProperties().setProperty(
    claveAvisoAutomaticoTelegram(tipo,idMaestra,fecha),
    'SI'
  );
}

function nombreMaestraRecordatorioTelegram(idMaestra){
  const maestra=obtenerRegistros('MAESTRAS').find(r=>
    String(r.ID_MAESTRA||'').trim()===String(idMaestra||'').trim()
  );

  if(!maestra)return 'Maestra';

  return (
    String(maestra.NOMBRE||'')+' '+String(maestra.APELLIDO||'')
  ).trim()||'Maestra';
}

function clavePreferenciasAvisosTelegram(idMaestra){
  return 'PREFERENCIAS_AVISOS_TELEGRAM_'+String(idMaestra||'').trim();
}

function preferenciasAvisosPorDefectoTelegram(){
  return {
    reuniones:true,
    agenda:true,
    cumpleanos:true,
    planificaciones:true,
    asistencia:true
  };
}

function obtenerPreferenciasAvisosTelegram(idMaestra){
  const clave=clavePreferenciasAvisosTelegram(idMaestra);
  const valor=PropertiesService.getScriptProperties().getProperty(clave);
  const defecto=preferenciasAvisosPorDefectoTelegram();

  if(!valor)return defecto;

  try{
    const guardadas=JSON.parse(valor);
    return {
      reuniones:guardadas.reuniones!==false,
      agenda:guardadas.agenda!==false,
      cumpleanos:guardadas.cumpleanos!==false,
      planificaciones:guardadas.planificaciones!==false,
      asistencia:guardadas.asistencia!==false
    };
  }catch(_){
    return defecto;
  }
}

function guardarPreferenciasAvisosTelegram(idMaestra,preferencias){
  const limpias={
    reuniones:Boolean(preferencias.reuniones),
    agenda:Boolean(preferencias.agenda),
    cumpleanos:Boolean(preferencias.cumpleanos),
    planificaciones:Boolean(preferencias.planificaciones),
    asistencia:Boolean(preferencias.asistencia)
  };

  PropertiesService.getScriptProperties().setProperty(
    clavePreferenciasAvisosTelegram(idMaestra),
    JSON.stringify(limpias)
  );

  return limpias;
}

function textoPreferenciasAvisosTelegram(preferencias){
  function estado(valor){
    return valor?'✅ Activado':'❌ Desactivado';
  }

  return [
    '🔔 Avisos automáticos',
    '',
    'Configura cuáles recordatorios deseas recibir:',
    '',
    '🤝 Reuniones: '+estado(preferencias.reuniones),
    '📅 Agenda: '+estado(preferencias.agenda),
    '🎂 Cumpleaños: '+estado(preferencias.cumpleanos),
    '📚 Planificaciones: '+estado(preferencias.planificaciones),
    '✅ Resumen de asistencia: '+estado(preferencias.asistencia)
  ].join('\n');
}

function botObtenerPreferenciasAvisosTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  const preferencias=obtenerPreferenciasAvisosTelegram(enlace.idMaestra);

  return {
    preferencias:preferencias,
    texto:textoPreferenciasAvisosTelegram(preferencias)
  };
}

function botCambiarPreferenciaAvisoTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  validarObjeto(datos,['tipo']);

  const tipo=String(datos.tipo||'').trim().toLowerCase();
  const permitidos=[
    'reuniones',
    'agenda',
    'cumpleanos',
    'planificaciones',
    'asistencia'
  ];

  if(!permitidos.includes(tipo)){
    throw new Error('El tipo de aviso no es válido.');
  }

  const preferencias=obtenerPreferenciasAvisosTelegram(enlace.idMaestra);
  preferencias[tipo]=!Boolean(preferencias[tipo]);

  const guardadas=guardarPreferenciasAvisosTelegram(
    enlace.idMaestra,
    preferencias
  );

  registrarAuditoria(
    enlace.idMaestra,
    'EDITAR',
    'TELEGRAM',
    'Preferencia de aviso cambiada: '+tipo
  );

  return {
    preferencias:guardadas,
    texto:textoPreferenciasAvisosTelegram(guardadas)
  };
}

function botCambiarTodosAvisosTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  validarObjeto(datos,['activo']);

  const activo=Boolean(datos.activo);
  const preferencias=guardarPreferenciasAvisosTelegram(
    enlace.idMaestra,
    {
      reuniones:activo,
      agenda:activo,
      cumpleanos:activo,
      planificaciones:activo,
      asistencia:activo
    }
  );

  registrarAuditoria(
    enlace.idMaestra,
    'EDITAR',
    'TELEGRAM',
    activo?'Todos los avisos activados':'Todos los avisos desactivados'
  );

  return {
    preferencias:preferencias,
    texto:textoPreferenciasAvisosTelegram(preferencias)
  };
}

function botProbarAvisosTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  const zona=obtenerZonaHorariaAulaMagica();
  const hoy=Utilities.formatDate(new Date(),zona,'yyyy-MM-dd');
  const manana=sumarDiasFechaTelegram(hoy,1);
  const preferencias=obtenerPreferenciasAvisosTelegram(enlace.idMaestra);
  const mensajes=[];

  const mananaTexto=construirRecordatorioMananaTelegram(
    enlace.idMaestra,
    hoy,
    manana,
    preferencias
  );

  if(mananaTexto)mensajes.push(mananaTexto);

  if(preferencias.asistencia){
    mensajes.push(
      construirResumenAsistenciaTelegram(enlace.idMaestra,hoy)
    );
  }

  if(!mensajes.length){
    return {
      enviados:0,
      texto:'🔕 Todos los avisos están desactivados.'
    };
  }

  mensajes.forEach(texto=>{
    enviarMensajeTelegram(enlace.chatId,texto,false);
  });

  return {
    enviados:mensajes.length,
    texto:'✅ Prueba enviada correctamente.'
  };
}


function botListarComprasBaulTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  const idMaestra=enlace.idMaestra;

  const materiales=obtenerRegistros('MATERIALES_BAUL');
  const materialPorId={};

  materiales.forEach(r=>{
    materialPorId[String(r.ID_MATERIAL||'').trim()]=r;
  });

  const compras=obtenerRegistros('COMPRAS_BAUL')
    .filter(r=>
      String(r.ID_MAESTRA||'').trim()===idMaestra
    )
    .map(r=>{
      const material=materialPorId[String(r.ID_MATERIAL||'').trim()]||{};
      return {
        idCompra:String(r.ID_COMPRA||''),
        idMaterial:String(r.ID_MATERIAL||''),
        titulo:String(material.TITULO||'Material'),
        precio:Number(r.MONTO||material.PRECIO||0),
        estado:String(r.ESTADO||'PENDIENTE').toUpperCase(),
        archivoUrl:
          String(r.ESTADO||'').trim().toUpperCase()==='PAGADO'
            ?String(material.ARCHIVO_URL||'')
            :''
      };
    })
    .sort((a,b)=>
      a.estado.localeCompare(b.estado)||
      a.titulo.localeCompare(b.titulo)
    );

  const pendientes=compras.filter(c=>c.estado==='PENDIENTE');
  const desbloqueadas=compras.filter(c=>c.estado==='PAGADO');

  return {
    compras:compras,
    texto:[
      '🧰 Mi Baúl Digital',
      '',
      '🔓 Materiales desbloqueados: '+desbloqueadas.length,
      '⏳ Compras pendientes: '+pendientes.length,
      '',
      compras.length
        ?'Selecciona un material para ver los detalles.'
        :'Todavía no tienes compras registradas.'
    ].join('\n')
  };
}

function botObtenerMaterialBaulTelegram(datos){
  const enlace=obtenerMaestraTelegramPorChat(datos);
  validarObjeto(datos,['idCompra']);

  const compra=obtenerRegistros('COMPRAS_BAUL').find(r=>
    String(r.ID_COMPRA||'').trim()===String(datos.idCompra||'').trim()&&
    String(r.ID_MAESTRA||'').trim()===enlace.idMaestra
  );

  if(!compra)throw new Error('No se encontró la compra.');

  const material=obtenerRegistros('MATERIALES_BAUL').find(r=>
    String(r.ID_MATERIAL||'').trim()===
      String(compra.ID_MATERIAL||'').trim()
  );

  if(!material)throw new Error('No se encontró el material.');

  const estado=String(compra.ESTADO||'PENDIENTE').toUpperCase();
  const pago=obtenerConfiguracionBaul();

  return {
    compra:{
      idCompra:String(compra.ID_COMPRA||''),
      idMaterial:String(compra.ID_MATERIAL||''),
      titulo:String(material.TITULO||'Material'),
      descripcion:String(material.DESCRIPCION||''),
      categoria:String(material.CATEGORIA||'Otros'),
      nivel:String(material.NIVEL||'Todos'),
      precio:Number(compra.MONTO||material.PRECIO||0),
      estado:estado,
      archivoUrl:estado==='PAGADO'?String(material.ARCHIVO_URL||''):'',
      whatsapp:pago.whatsapp
    },
    texto:[
      estado==='PAGADO'?'🔓 Material desbloqueado':'⏳ Compra pendiente',
      '',
      'Material: '+String(material.TITULO||'Material'),
      'Categoría: '+String(material.CATEGORIA||'Otros'),
      'Nivel: '+String(material.NIVEL||'Todos'),
      'Estado: '+capitalizarTelegram(estado),
      'Solicitud: '+String(compra.ID_COMPRA||'')
    ].join('\n')
  };
}

function procesarNotificacionesComprasBaulTelegram(){
  const enlaces=obtenerEnlacesTelegramActivosRecordatorios();
  const chatPorMaestra={};

  enlaces.forEach(enlace=>{
    chatPorMaestra[enlace.idMaestra]=enlace.chatId;
  });

  const propiedades=PropertiesService.getScriptProperties();
  const materiales=obtenerRegistros('MATERIALES_BAUL');
  const materialPorId={};

  materiales.forEach(r=>{
    materialPorId[String(r.ID_MATERIAL||'').trim()]=r;
  });

  let enviados=0;

  obtenerRegistros('COMPRAS_BAUL')
    .filter(r=>
      String(r.ESTADO||'').trim().toUpperCase()==='PAGADO'
    )
    .forEach(compra=>{
      const idCompra=String(compra.ID_COMPRA||'').trim();
      const idMaestra=String(compra.ID_MAESTRA||'').trim();
      const chatId=chatPorMaestra[idMaestra];
      const clave='BAUL_PAGO_NOTIFICADO_'+idCompra;

      if(!chatId||propiedades.getProperty(clave)==='SI')return;

      const material=materialPorId[
        String(compra.ID_MATERIAL||'').trim()
      ];

      if(!material)return;

      const archivo=String(material.ARCHIVO_URL||'').trim();

      const texto=[
        '🎉 ¡Tu material fue desbloqueado!',
        '',
        '📚 '+String(material.TITULO||'Material'),
        '✅ Pago confirmado',
        '',
        archivo
          ?'⬇️ Descargar: '+archivo
          :'Abre Mi Baúl en la plataforma para descargarlo.'
      ].join('\n');

      enviarMensajeTelegram(chatId,texto,false);
      propiedades.setProperty(clave,'SI');
      enviados++;
    });

  return enviados;
}


function construirRecordatorioMananaTelegram(
  idMaestra,
  hoy,
  manana,
  preferencias
){
  const prefs=preferencias||obtenerPreferenciasAvisosTelegram(idMaestra);
  const lineas=[
    '🌅 Buenos días, '+nombreMaestraRecordatorioTelegram(idMaestra),
    '',
    'Este es tu resumen personalizado de Aula Mágica.'
  ];

  let secciones=0;
  let totalPendientes=0;

  if(prefs.reuniones){
    const reuniones=obtenerRegistros('REUNIONES')
      .filter(r=>
        String(r.ID_MAESTRA||'').trim()===idMaestra&&
        !['REALIZADA','CANCELADA'].includes(
          String(r.ESTADO||'').trim().toUpperCase()
        )&&
        [hoy,manana].includes(normalizarFechaTextoTelegram(r.FECHA))
      )
      .sort((a,b)=>
        (
          normalizarFechaTextoTelegram(a.FECHA)+' '+
          normalizarHoraVisibleAgenda(a.HORA)
        ).localeCompare(
          normalizarFechaTextoTelegram(b.FECHA)+' '+
          normalizarHoraVisibleAgenda(b.HORA)
        )
      );

    lineas.push('');
    lineas.push('🤝 Reuniones de hoy y mañana: '+reuniones.length);

    reuniones.slice(0,5).forEach(r=>{
      const fecha=normalizarFechaTextoTelegram(r.FECHA);
      const cuando=fecha===hoy?'Hoy':'Mañana';

      lineas.push(
        '• '+cuando+' '+normalizarHoraVisibleAgenda(r.HORA)+
        ' · '+String(r.TITULO||'Reunión')
      );
    });

    totalPendientes+=reuniones.length;
    secciones++;
  }

  if(prefs.agenda){
    const eventos=obtenerRegistrosAgenda()
      .filter(r=>
        String(r.ID_MAESTRA||'').trim()===idMaestra&&
        String(r.ESTADO||'').trim().toUpperCase()==='PENDIENTE'&&
        [hoy,manana].includes(normalizarFechaVisibleAgenda(r.FECHA))
      )
      .sort((a,b)=>
        (
          normalizarFechaVisibleAgenda(a.FECHA)+' '+
          normalizarHoraVisibleAgenda(a.HORA)
        ).localeCompare(
          normalizarFechaVisibleAgenda(b.FECHA)+' '+
          normalizarHoraVisibleAgenda(b.HORA)
        )
      );

    lineas.push('');
    lineas.push('📅 Eventos de hoy y mañana: '+eventos.length);

    eventos.slice(0,5).forEach(r=>{
      const fecha=normalizarFechaVisibleAgenda(r.FECHA);
      const cuando=fecha===hoy?'Hoy':'Mañana';

      lineas.push(
        '• '+cuando+' '+normalizarHoraVisibleAgenda(r.HORA)+
        ' · '+String(r.TITULO||'Evento')
      );
    });

    totalPendientes+=eventos.length;
    secciones++;
  }

  if(prefs.cumpleanos){
    const mesDiaHoy=hoy.slice(5);

    const cumpleanos=obtenerRegistros('ALUMNOS')
      .filter(r=>
        String(r.ID_MAESTRA||'').trim()===idMaestra&&
        String(r.ESTADO||'').trim().toUpperCase()==='ACTIVO'
      )
      .filter(r=>{
        const fecha=formatearFechaParaFormulario(r.FECHA_NACIMIENTO);
        return fecha&&fecha.slice(5)===mesDiaHoy;
      })
      .map(r=>(
        String(r.NOMBRE||'')+' '+String(r.APELLIDO||'')
      ).trim());

    lineas.push('');
    lineas.push('🎂 Cumpleaños de hoy: '+cumpleanos.length);

    cumpleanos.slice(0,8).forEach(nombre=>{
      lineas.push('• '+nombre);
    });

    totalPendientes+=cumpleanos.length;
    secciones++;
  }

  if(prefs.agenda){
    const calendario=obtenerRegistros('CALENDARIO_ESCOLAR')
      .filter(r=>
        String(r.ID_MAESTRA||'').trim()===idMaestra&&
        String(r.ESTADO||'ACTIVO').trim().toUpperCase()==='ACTIVO'&&
        [hoy,manana].includes(
          fechaTextoOrganizacionEscolar(r.FECHA_INICIO)
        )
      )
      .sort((a,b)=>
        (
          fechaTextoOrganizacionEscolar(a.FECHA_INICIO)+' '+
          horaTextoOrganizacionEscolar(a.HORA)
        ).localeCompare(
          fechaTextoOrganizacionEscolar(b.FECHA_INICIO)+' '+
          horaTextoOrganizacionEscolar(b.HORA)
        )
      );

    lineas.push('');
    lineas.push('🏫 Calendario escolar: '+calendario.length);

    calendario.slice(0,5).forEach(r=>{
      const fecha=fechaTextoOrganizacionEscolar(r.FECHA_INICIO);
      const cuando=fecha===hoy?'Hoy':'Mañana';

      lineas.push(
        '• '+cuando+
        (r.HORA?' '+horaTextoOrganizacionEscolar(r.HORA):'')+
        ' · '+String(r.TITULO||'Actividad')
      );
    });

    totalPendientes+=calendario.length;

    const diaSemana=[
      'DOMINGO',
      'LUNES',
      'MARTES',
      'MIERCOLES',
      'JUEVES',
      'VIERNES',
      'SABADO'
    ][new Date(hoy+'T12:00:00').getDay()];

    const clases=obtenerRegistros('HORARIO_SEMANAL')
      .filter(r=>
        String(r.ID_MAESTRA||'').trim()===idMaestra&&
        String(r.DIA||'').trim().toUpperCase()===diaSemana&&
        String(r.ESTADO||'ACTIVO').trim().toUpperCase()==='ACTIVO'
      )
      .sort((a,b)=>
        horaTextoOrganizacionEscolar(a.HORA_INICIO)
          .localeCompare(horaTextoOrganizacionEscolar(b.HORA_INICIO))
      );

    lineas.push('');
    lineas.push('🗓️ Clases de hoy: '+clases.length);

    clases.slice(0,8).forEach(r=>{
      lineas.push(
        '• '+horaTextoOrganizacionEscolar(r.HORA_INICIO)+
        '–'+horaTextoOrganizacionEscolar(r.HORA_FIN)+
        ' · '+String(r.ASIGNATURA||'Clase')
      );
    });
  }

  if(prefs.planificaciones){
    const planes=obtenerRegistros('PLANIFICACION')
      .filter(r=>{
        if(String(r.ID_MAESTRA||'').trim()!==idMaestra)return false;
        if(
          String(r.ESTADO||'').trim().toUpperCase()==='COMPLETADA'
        )return false;

        const fecha=normalizarFechaTextoTelegram(r.FECHA);
        return fecha&&fecha<=manana;
      })
      .sort((a,b)=>
        normalizarFechaTextoTelegram(a.FECHA)
          .localeCompare(normalizarFechaTextoTelegram(b.FECHA))
      )
      .slice(0,8);

    lineas.push('');
    lineas.push('📚 Planificaciones pendientes: '+planes.length);

    planes.slice(0,5).forEach(r=>{
      const fecha=normalizarFechaTextoTelegram(r.FECHA);
      const etiqueta=fecha<hoy?'Vencida':(fecha===hoy?'Hoy':'Mañana');

      lineas.push(
        '• '+etiqueta+' · '+String(r.TITULO||'Planificación')
      );
    });

    totalPendientes+=planes.length;
    secciones++;
  }

  if(!secciones)return '';

  if(!totalPendientes){
    lineas.push('');
    lineas.push('✨ No tienes pendientes importantes para hoy.');
  }

  return lineas.join('\n');
}

function construirResumenAsistenciaTelegram(idMaestra,hoy){
  const alumnos=obtenerRegistros('ALUMNOS').filter(r=>
    String(r.ID_MAESTRA||'').trim()===idMaestra&&
    String(r.ESTADO||'').trim().toUpperCase()==='ACTIVO'
  );

  const registros=obtenerRegistros('ASISTENCIA').filter(r=>
    String(r.ID_MAESTRA||'').trim()===idMaestra&&
    normalizarFechaAsistencia(r.FECHA)===hoy
  );

  const conteo={
    PRESENTE:0,
    AUSENTE:0,
    TARDE:0,
    JUSTIFICADO:0
  };

  registros.forEach(r=>{
    const estado=String(r.ESTADO||'').trim().toUpperCase();

    if(Object.prototype.hasOwnProperty.call(conteo,estado)){
      conteo[estado]++;
    }
  });

  return [
    '🌙 Resumen de asistencia',
    '',
    'Fecha: '+formatearFechaTelegram(hoy),
    'Alumnos activos: '+alumnos.length,
    '🟢 Presentes: '+conteo.PRESENTE,
    '🔴 Ausentes: '+conteo.AUSENTE,
    '⏰ Tardanzas: '+conteo.TARDE,
    '📄 Justificados: '+conteo.JUSTIFICADO,
    '➖ Sin registrar: '+Math.max(0,alumnos.length-registros.length)
  ].join('\n');
}

function procesarRecordatoriosAutomaticos(forzarPrueba){
  const propiedades=PropertiesService.getScriptProperties();

  if(
    !forzarPrueba&&
    propiedades.getProperty('RECORDATORIOS_AUTOMATICOS')!=='SI'
  ){
    return {enviados:0,activo:false};
  }

  const zona=obtenerZonaHorariaAulaMagica();
  const ahora=new Date();
  const hoy=Utilities.formatDate(ahora,zona,'yyyy-MM-dd');
  const hora=Number(Utilities.formatDate(ahora,zona,'H'));
  const manana=sumarDiasFechaTelegram(hoy,1);
  const enlaces=obtenerEnlacesTelegramActivosRecordatorios();
  let enviados=procesarNotificacionesComprasBaulTelegram();

  enlaces.forEach(enlace=>{
    try{
      const preferencias=obtenerPreferenciasAvisosTelegram(
        enlace.idMaestra
      );

      const tieneAvisoManana=
        preferencias.reuniones||
        preferencias.agenda||
        preferencias.cumpleanos||
        preferencias.planificaciones;

      const enviarManana=
        tieneAvisoManana&&
        (
          Boolean(forzarPrueba)||
          (
            hora>=7&&
            hora<=10&&
            !avisoAutomaticoYaEnviadoTelegram(
              'MANANA',
              enlace.idMaestra,
              hoy
            )
          )
        );

      if(enviarManana){
        const texto=construirRecordatorioMananaTelegram(
          enlace.idMaestra,
          hoy,
          manana,
          preferencias
        );

        if(texto){
          enviarMensajeTelegram(enlace.chatId,texto,false);
          enviados++;
        }

        if(!forzarPrueba){
          marcarAvisoAutomaticoTelegram(
            'MANANA',
            enlace.idMaestra,
            hoy
          );
        }
      }

      const enviarAsistencia=
        preferencias.asistencia&&
        !forzarPrueba&&
        hora>=17&&
        hora<=20&&
        !avisoAutomaticoYaEnviadoTelegram(
          'ASISTENCIA',
          enlace.idMaestra,
          hoy
        );

      if(enviarAsistencia){
        enviarMensajeTelegram(
          enlace.chatId,
          construirResumenAsistenciaTelegram(
            enlace.idMaestra,
            hoy
          ),
          false
        );

        marcarAvisoAutomaticoTelegram(
          'ASISTENCIA',
          enlace.idMaestra,
          hoy
        );

        enviados++;
      }
    }catch(error){
      console.error(
        'Error enviando recordatorio a '+enlace.chatId+': '+
        String(error&&error.message||error)
      );
    }
  });

  return {
    enviados:enviados,
    activo:true,
    fecha:hoy,
    hora:hora
  };
}


function actualizarPerfilMaestra(token,datos){
  const actual=verificarSesion(token);
  validarObjeto(datos,['nombre','apellido']);
  const hoja=obtenerHoja('MAESTRAS');
  const registro=obtenerRegistrosConFila('MAESTRAS').find(r=>String(r.ID_MAESTRA)===String(actual.idMaestra));
  if(!registro) throw new Error('No se encontró la cuenta de la maestra.');
  const nombre=limpiarTexto(datos.nombre);
  const apellido=limpiarTexto(datos.apellido);
  const grado=limpiarTexto(datos.grado||'');
  const seccion=limpiarTexto(datos.seccion||'');
  if(nombre.length<2) throw new Error('El nombre debe tener al menos dos caracteres.');
  if(apellido.length<2) throw new Error('El apellido debe tener al menos dos caracteres.');
  hoja.getRange(registro.__fila,2,1,2).setValues([[nombre,apellido]]);
  hoja.getRange(registro.__fila,7,1,2).setValues([[grado,seccion]]);
  registrarAuditoria(actual.idMaestra,'EDITAR','PERFIL','Perfil de maestra actualizado');
  return {
    idMaestra:String(actual.idMaestra),nombre:nombre,apellido:apellido,
    correo:String(registro.CORREO||''),usuario:String(registro.USUARIO||''),
    grado:grado,seccion:seccion
  };
}

function cambiarContrasenaMaestra(token,datos){
  const actual=verificarSesion(token);
  validarObjeto(datos,['contrasenaActual','contrasenaNueva']);
  const nueva=String(datos.contrasenaNueva||'');
  if(nueva.length<6) throw new Error('La nueva contraseña debe tener al menos seis caracteres.');
  const hoja=obtenerHoja('MAESTRAS');
  const registro=obtenerRegistrosConFila('MAESTRAS').find(r=>String(r.ID_MAESTRA)===String(actual.idMaestra));
  if(!registro) throw new Error('No se encontró la cuenta de la maestra.');
  if(crearHashContrasena(String(datos.contrasenaActual||''))!==String(registro.CONTRASENA_HASH||''))
    throw new Error('La contraseña actual no es correcta.');
  hoja.getRange(registro.__fila,6).setValue(crearHashContrasena(nueva));
  registrarAuditoria(actual.idMaestra,'EDITAR','SEGURIDAD','Contraseña actualizada');
  return {actualizado:true};
}
