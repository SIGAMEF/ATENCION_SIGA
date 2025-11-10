/**
 * API PARA CONSULTAR EJECUTORAS
 * Archivo: js/api.js
 * ✅ USA JSONP PARA EVITAR PROBLEMAS DE CORS
 */

// ===== CONFIGURACIÓN =====
const API_CONFIG = {
  // 🔴 PEGAR AQUÍ LA URL DEL WEB APP DE GOOGLE APPS SCRIPT
  URL: 'https://script.google.com/macros/s/AKfycbyuqmaQgpdyxwUXTveTrOailRcZb8y27beTU5Rz_3CsCZlT0y7rOLDAV4sEAeGmCO03/exec',
  TIMEOUT: 10000,
  CACHE_TIEMPO: 5 * 60 * 1000
};

// Cache simple
let cacheResultados = new Map();
let cacheTimestamps = new Map();

// ===== FUNCIÓN JSONP (SOLUCIÓN CORS) =====
function fetchJSONP(url, timeout = 10000) {
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

// ===== ESTADÍSTICAS DEL CACHE =====
function obtenerEstadisticasCache() {
  return {
    entradas: cacheResultados.size,
    tamano: new Blob([JSON.stringify([...cacheResultados])]).size + ' bytes',
    ultimaActualizacion: cacheTimestamps.size > 0 ? 
      new Date(Math.max(...cacheTimestamps.values())).toLocaleString('es-PE') : 'N/A'
  };
}

// ===== INICIALIZACIÓN =====
if (typeof window !== 'undefined') {
  window.addEventListener('load', function() {
    console.log('🚀 API de Ejecutoras cargada (JSONP Mode)');
    console.log('📍 URL configurada:', API_CONFIG.URL);
    console.log('✅ Sin problemas de CORS');
  });
  
  // Exponer funciones globalmente
  window.buscarEjecutoras = buscarEjecutoras;
  window.obtenerEjecutora = obtenerEjecutora;
  window.verificarConexion = verificarConexion;
  window.limpiarCache = limpiarCache;
  window.obtenerEstadisticasCache = obtenerEstadisticasCache;
}

console.log('✅ api.js cargado correctamente (JSONP Mode - Sin CORS)');