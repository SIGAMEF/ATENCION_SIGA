/**
 * API PARA CONSULTAR EJECUTORAS Y GUARDAR TICKETS
 * Archivo: js/api.js
 * ✅ USA JSONP PARA EVITAR PROBLEMAS DE CORS
 * ✅ CORREGIDO: Envío de correo coordinador
 */

// ===== CONFIGURACIÓN =====
const API_CONFIG = {
  URL: 'https://script.google.com/macros/s/AKfycbyuqmaQgpdyxwUXTveTrOailRcZb8y27beTU5Rz_3CsCZlT0y7rOLDAV4sEAeGmCO03/exec',
  TIMEOUT: 15000,
  CACHE_TIEMPO: 5 * 60 * 1000
};

// Cache simple
let cacheResultados = new Map();
let cacheTimestamps = new Map();

// ===== FUNCIÓN JSONP (SOLUCIÓN CORS) =====
function fetchJSONP(url, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const callbackName = 'jsonp_callback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const script = document.createElement('script');
    let timeoutId;
    
    const cleanup = () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      delete window[callbackName];
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
    
    timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error('Request timeout'));
    }, timeout);
    
    window[callbackName] = (data) => {
      cleanup();
      resolve(data);
    };
    
    script.onerror = () => {
      cleanup();
      reject(new Error('Script load error'));
    };
    
    const separator = url.includes('?') ? '&' : '?';
    script.src = `${url}${separator}callback=${callbackName}`;
    
    document.head.appendChild(script);
  });
}

// ===== BUSCAR EJECUTORAS =====
async function buscarEjecutoras(termino) {
  try {
    if (!termino || termino.trim().length < 2) {
      return { 
        success: true, 
        resultados: [],
        message: 'Ingrese al menos 2 caracteres'
      };
    }
    
    const terminoLimpio = termino.trim();
    
    const cacheKey = `buscar_${terminoLimpio.toLowerCase()}`;
    const ahora = Date.now();
    
    if (cacheResultados.has(cacheKey) && 
        cacheTimestamps.has(cacheKey) && 
        (ahora - cacheTimestamps.get(cacheKey)) < API_CONFIG.CACHE_TIEMPO) {
      console.log('📦 Usando resultado en cache para:', terminoLimpio);
      return cacheResultados.get(cacheKey);
    }
    
    const url = `${API_CONFIG.URL}?action=buscar&termino=${encodeURIComponent(terminoLimpio)}`;
    
    console.log('🔍 Buscando:', terminoLimpio);
    console.log('📡 URL:', url);
    
    const data = await fetchJSONP(url, API_CONFIG.TIMEOUT);
    
    console.log('✅ Respuesta recibida:', data);
    
    if (data.success && data.resultados && data.resultados.length > 0) {
      cacheResultados.set(cacheKey, data);
      cacheTimestamps.set(cacheKey, ahora);
    }
    
    return data;
    
  } catch (error) {
    console.error('❌ Error en buscarEjecutoras:', error);
    return {
      success: false,
      message: 'Error de conexión: ' + error.message,
      resultados: []
    };
  }
}

// ===== OBTENER EJECUTORA POR CÓDIGO =====
async function obtenerEjecutora(codigo) {
  try {
    if (!codigo) {
      return { success: false, message: 'Código no válido' };
    }
    
    const codigoLimpio = codigo.toString().trim();
    
    const cacheKey = `obtener_${codigoLimpio}`;
    const ahora = Date.now();
    
    if (cacheResultados.has(cacheKey) && 
        cacheTimestamps.has(cacheKey) && 
        (ahora - cacheTimestamps.get(cacheKey)) < API_CONFIG.CACHE_TIEMPO) {
      console.log('📦 Usando resultado en cache para código:', codigoLimpio);
      return cacheResultados.get(cacheKey);
    }
    
    const url = `${API_CONFIG.URL}?action=obtener&codigo=${encodeURIComponent(codigoLimpio)}`;
    
    console.log('🔍 Obteniendo ejecutora:', codigoLimpio);
    
    const data = await fetchJSONP(url, API_CONFIG.TIMEOUT);
    
    console.log('✅ Ejecutora obtenida:', data);
    
    if (data.success) {
      cacheResultados.set(cacheKey, data);
      cacheTimestamps.set(cacheKey, ahora);
    }
    
    return data;
    
  } catch (error) {
    console.error('❌ Error en obtenerEjecutora:', error);
    return {
      success: false,
      message: 'Error de conexión: ' + error.message
    };
  }
}

// ===== 🆕 GUARDAR TICKET CON JSONP - ✅ CORREGIDO =====
async function guardarTicket(datosTicket) {
  try {
    console.log('💾 Guardando ticket...', datosTicket);
    
    // ✅ CONSTRUIR URL CON TODOS LOS PARÁMETROS (INCLUYENDO CORREO COORDINADOR)
    const params = new URLSearchParams({
      action: 'guardarTicket',
      codigoUE: datosTicket.codigoUE || '',
      nombreUE: datosTicket.nombreUE || '',
      coordinadorAbrev: datosTicket.coordinadorAbrev || '',
      correoCoordinador: datosTicket.correoCoordinador || '',  // ✅ AGREGADO
      coordinador: datosTicket.coordinador || '',              // ✅ AGREGADO
      nombreUsuario: datosTicket.nombreUsuario || '',
      cargoUsuario: datosTicket.cargoUsuario || '',
      correoUsuario: datosTicket.correoUsuario || '',
      celularUsuario: datosTicket.celularUsuario || '',
      modulo: datosTicket.modulo || '',
      submodulo: datosTicket.submodulo || '',
      descripcion: datosTicket.descripcion || '',
      analistaDGA: datosTicket.analistaDGA || ''               // ✅ AGREGADO
    });
    
    const url = `${API_CONFIG.URL}?${params.toString()}`;
    
    console.log('📡 Enviando ticket via JSONP...');
    console.log('📧 Correo coordinador:', datosTicket.correoCoordinador);
    
    // ✅ USAR JSONP PARA OBTENER LA RESPUESTA REAL DEL SERVIDOR
    const data = await fetchJSONP(url, API_CONFIG.TIMEOUT);
    
    console.log('✅ Respuesta del servidor:', data);
    
    return data;
    
  } catch (error) {
    console.error('❌ Error en guardarTicket:', error);
    return {
      success: false,
      message: 'Error al guardar ticket: ' + error.message
    };
  }
}

// ===== VERIFICAR CONEXIÓN =====
async function verificarConexion() {
  try {
    console.log('🔌 Verificando conexión con Google Sheets...');
    
    const url = `${API_CONFIG.URL}?action=test`;
    
    const data = await fetchJSONP(url, API_CONFIG.TIMEOUT);
    
    console.log('✅ Conexión exitosa:', data);
    
    return data;
    
  } catch (error) {
    console.error('❌ Error de conexión:', error);
    return {
      success: false,
      message: 'No se pudo conectar con el servidor: ' + error.message
    };
  }
}

// ===== LIMPIAR CACHE =====
function limpiarCache() {
  cacheResultados.clear();
  cacheTimestamps.clear();
  console.log('🗑️ Cache limpiado');
}

// ===== ESTADÍSTICAS DE CACHE =====
function estadisticasCache() {
  return {
    totalEntradas: cacheResultados.size,
    entradas: Array.from(cacheResultados.keys())
  };
}