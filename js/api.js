/**
 * API PARA CONSULTAR EJECUTORAS Y GUARDAR TICKETS
 * Archivo: js/api.js
 * ✅ USA JSONP PARA EVITAR PROBLEMAS DE CORS
 * ✅ INCLUYE FUNCIÓN PARA GUARDAR TICKETS CON NÚMERO REAL
 */

// ===== CONFIGURACIÓN =====
const API_CONFIG = {
  // 🔴 PEGAR AQUÍ LA URL DEL WEB APP DE GOOGLE APPS SCRIPT
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
    
    // Cleanup function
    const cleanup = () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      delete window[callbackName];
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
    
    // Setup timeout
    timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error('Request timeout'));
    }, timeout);
    
    // Setup callback
    window[callbackName] = (data) => {
      cleanup();
      resolve(data);
    };
    
    // Setup error handler
    script.onerror = () => {
      cleanup();
      reject(new Error('Script load error'));
    };
    
    // Add callback parameter to URL
    const separator = url.includes('?') ? '&' : '?';
    script.src = `${url}${separator}callback=${callbackName}`;
    
    // Append script
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
    
    // Verificar cache
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
    
    // Guardar en cache
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
    
    // Verificar cache
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
    
    // Guardar en cache
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

// ===== 🆕 GUARDAR TICKET CON JSONP =====
async function guardarTicket(datosTicket) {
  try {
    console.log('💾 Guardando ticket...', datosTicket);
    
    // Construir URL con parámetros
    const params = new URLSearchParams({
      action: 'guardarTicket',
      codigoUE: datosTicket.codigoUE || '',
      nombreUE: datosTicket.nombreUE || '',
      coordinadorAbrev: datosTicket.coordinadorAbrev || '',
      nombreUsuario: datosTicket.nombreUsuario || '',
      cargoUsuario: datosTicket.cargoUsuario || '',
      correoUsuario: datosTicket.correoUsuario || '',
      celularUsuario: datosTicket.celularUsuario || '',
      modulo: datosTicket.modulo || '',
      submodulo: datosTicket.submodulo || '',
      descripcion: datosTicket.descripcion || ''
    });
    
    const url = `${API_CONFIG.URL}?${params.toString()}`;
    
    console.log('📡 Enviando ticket via JSONP...');
    
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
