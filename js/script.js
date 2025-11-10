// ========================================
// AUTOCOMPLETADO DE EJECUTORAS - CORREGIDO
// ========================================

let timeoutBusqueda = null;
let sugerenciasDiv = null;
let busquedaActiva = false;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(() => {
    inicializarAutocompletadoEjecutoras();
  }, 500);
});

function inicializarAutocompletadoEjecutoras() {
  console.log('🚀 Inicializando autocompletado de ejecutoras...');
  
  const inputCodigoUE = document.getElementById('codigoUE');
  const inputNombreUE = document.getElementById('nombreUE');
  const inputCoordinador = document.getElementById('coorD');
  
  if (!inputCodigoUE) {
    console.error('❌ No se encontró el input codigoUE');
    return;
  }
  
  // Asegurar que el input permita texto
  inputCodigoUE.setAttribute('type', 'text');
  inputCodigoUE.setAttribute('autocomplete', 'off');
  
  // Crear contenedor de sugerencias
  sugerenciasDiv = document.createElement('div');
  sugerenciasDiv.id = 'sugerencias-ejecutoras';
  sugerenciasDiv.className = 'sugerencias-ejecutoras';
  
  const parent = inputCodigoUE.parentElement;
  parent.style.position = 'relative';
  parent.appendChild(sugerenciasDiv);
  
  // EVENTO PRINCIPAL: Input
  inputCodigoUE.addEventListener('input', function(e) {
    const termino = this.value.trim();
    
    console.log('🔍 Input detectado:', termino);
    
    clearTimeout(timeoutBusqueda);
    
    if (termino.length === 0) {
      inputNombreUE.value = '';
      inputCoordinador.value = '';
      ocultarSugerencias();
      limpiarValidacion(inputCodigoUE);
      limpiarValidacion(inputNombreUE);
      limpiarValidacion(inputCoordinador);
      return;
    }
    
    if (termino.length < 2) {
      mostrarMensajeSugerencias('keyboard', 'Escriba al menos 2 caracteres...', 'info');
      return;
    }
    
    mostrarMensajeSugerencias('spinner fa-spin', 'Buscando...', 'loading');
    busquedaActiva = true;
    
    timeoutBusqueda = setTimeout(async () => {
      try {
        console.log('🔍 Iniciando búsqueda para:', termino);
        
        const resultado = await buscarEjecutoras(termino);
        
        console.log('📦 Resultado recibido:', resultado);
        
        if (!busquedaActiva) return;
        
        if (resultado.success && resultado.resultados && resultado.resultados.length > 0) {
          mostrarSugerenciasEjecutoras(resultado.resultados);
        } else if (resultado.success && resultado.resultados.length === 0) {
          mostrarMensajeSugerencias('search', 'No se encontraron resultados', 'empty');
          marcarComoInvalido(inputCodigoUE, 'No se encontró la ejecutora');
        } else {
          mostrarMensajeSugerencias('exclamation-triangle', resultado.message || 'Error al buscar', 'error');
          marcarComoInvalido(inputCodigoUE, 'Error al buscar');
        }
      } catch (error) {
        console.error('❌ Error en búsqueda:', error);
        mostrarMensajeSugerencias('exclamation-triangle', 'Error de conexión', 'error');
        marcarComoInvalido(inputCodigoUE, 'Error de conexión');
      }
    }, 300);
  });
  
  inputCodigoUE.addEventListener('focus', function() {
    if (this.value.trim().length >= 2 && sugerenciasDiv.children.length > 0) {
      sugerenciasDiv.style.display = 'block';
    }
  });
  
  document.addEventListener('click', function(e) {
    if (!inputCodigoUE.contains(e.target) && !sugerenciasDiv.contains(e.target)) {
      ocultarSugerencias();
    }
  });
  
  console.log('✅ Autocompletado inicializado correctamente');
}

function mostrarMensajeSugerencias(icono, texto, tipo) {
  const colores = {
    info: '#6b7280',
    loading: '#1e3a8a',
    empty: '#6b7280',
    error: '#dc2626'
  };
  
  sugerenciasDiv.innerHTML = `
    <div style="padding: 20px; text-align: center; color: ${colores[tipo] || colores.info};">
      <i class="fas fa-${icono}" style="font-size: 1.5rem; margin-bottom: 10px;"></i>
      <p style="margin: 0; font-weight: 600; font-size: 0.9rem;">${texto}</p>
    </div>
  `;
  sugerenciasDiv.style.display = 'block';
}

function mostrarSugerenciasEjecutoras(resultados) {
  console.log('📋 Mostrando', resultados.length, 'sugerencias');
  
  sugerenciasDiv.innerHTML = '';
  
  const header = document.createElement('div');
  header.style.cssText = `
    background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
    color: white;
    padding: 12px 14px;
    font-weight: 600;
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    gap: 8px;
    border-radius: 6px 6px 0 0;
  `;
  header.innerHTML = `
    <i class="fas fa-building"></i>
    ${resultados.length} ejecutora${resultados.length !== 1 ? 's' : ''} encontrada${resultados.length !== 1 ? 's' : ''}
  `;
  sugerenciasDiv.appendChild(header);
  
  resultados.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'sugerencia-item';
    div.style.cssText = `
      padding: 14px;
      cursor: pointer;
      border-bottom: 1px solid #f3f4f6;
      transition: all 0.2s ease;
      background: white;
    `;
    
    div.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
        <span style="
          background: #1e3a8a; 
          color: white; 
          padding: 4px 12px; 
          border-radius: 5px; 
          font-size: 0.8rem; 
          font-weight: 700;
          min-width: 60px;
          text-align: center;
        ">
          ${item.codigo}
        </span>
        <span style="font-weight: 600; color: #1f2937; flex: 1; font-size: 0.9rem; line-height: 1.4;">
          ${item.nombre}
        </span>
      </div>
      <div style="
        font-size: 0.85rem; 
        color: #6b7280; 
        padding-left: 70px; 
        display: flex; 
        align-items: center; 
        gap: 6px;
      ">
        <i class="fas fa-user-tie"></i>
        <span>${item.coordinador}</span>
      </div>
    `;
    
    div.addEventListener('mouseenter', function() {
      this.style.background = '#eff6ff';
      this.style.borderLeft = '4px solid #1e3a8a';
      this.style.paddingLeft = '10px';
      this.style.transform = 'translateX(2px)';
    });
    
    div.addEventListener('mouseleave', function() {
      this.style.background = 'white';
      this.style.borderLeft = 'none';
      this.style.paddingLeft = '14px';
      this.style.transform = 'translateX(0)';
    });
    
    div.addEventListener('click', function() {
      seleccionarEjecutora(item);
    });
    
    sugerenciasDiv.appendChild(div);
  });
  
  sugerenciasDiv.style.display = 'block';
  busquedaActiva = false;
}

function seleccionarEjecutora(item) {
  console.log('✅ Ejecutora seleccionada:', item);
  
  const inputCodigo = document.getElementById('codigoUE');
  const inputNombre = document.getElementById('nombreUE');
  const inputCoordinador = document.getElementById('coorD');
  
  // Rellenar los campos
  inputCodigo.value = item.codigo;
  inputNombre.value = item.nombre;
  inputCoordinador.value = item.coordinador;
  
  // Guardar datos adicionales en dataset
  inputNombre.dataset.coordinadorAbrev = item.coordinadorAbrev || '';
  inputNombre.dataset.correoCoordinador = item.correo || '';
  inputNombre.dataset.analistaDGA = item.analistaDGA || '';
  
  // Ocultar sugerencias
  ocultarSugerencias();
  
  // Marcar como válidos
  marcarComoValido(inputCodigo);
  marcarComoValido(inputNombre);
  marcarComoValido(inputCoordinador);
  
  // Mostrar notificación
  mostrarNotificacionEjecutora('✅ Ejecutora seleccionada correctamente', 'success');
  
  busquedaActiva = false;
}

function marcarComoValido(input) {
  input.classList.remove('is-invalid');
  input.classList.add('is-valid');
  
  const feedback = input.parentElement.querySelector('.invalid-feedback');
  if (feedback) {
    feedback.style.display = 'none';
  }
}

function marcarComoInvalido(input, mensaje) {
  input.classList.remove('is-valid');
  input.classList.add('is-invalid');
  
  let feedback = input.parentElement.querySelector('.invalid-feedback');
  if (!feedback) {
    feedback = document.createElement('div');
    feedback.className = 'invalid-feedback';
    input.parentElement.appendChild(feedback);
  }
  feedback.textContent = mensaje;
  feedback.style.display = 'block';
}

function limpiarValidacion(input) {
  input.classList.remove('is-valid', 'is-invalid');
  const feedback = input.parentElement.querySelector('.invalid-feedback');
  if (feedback) {
    feedback.style.display = 'none';
  }
}

function ocultarSugerencias() {
  if (sugerenciasDiv) {
    sugerenciasDiv.style.display = 'none';
    sugerenciasDiv.innerHTML = '';
  }
  busquedaActiva = false;
}

function mostrarNotificacionEjecutora(mensaje, tipo = 'info') {
  const colores = {
    success: { bg: '#f0fdf4', border: '#059669', text: '#065f46', icon: 'fa-check-circle' },
    error: { bg: '#fef2f2', border: '#dc2626', text: '#991b1b', icon: 'fa-exclamation-circle' },
    info: { bg: '#eff6ff', border: '#0284c7', text: '#1e3a8a', icon: 'fa-info-circle' }
  };
  
  const color = colores[tipo] || colores.info;
  
  const notif = document.createElement('div');
  notif.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${color.bg};
    border: 2px solid ${color.border};
    border-left: 5px solid ${color.border};
    color: ${color.text};
    padding: 16px 20px;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.15);
    z-index: 10000;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 12px;
    animation: slideInRight 0.3s ease-out;
    min-width: 300px;
  `;
  
  notif.innerHTML = `
    <i class="fas ${color.icon}" style="font-size: 1.3rem;"></i>
    <span style="flex: 1;">${mensaje}</span>
  `;
  
  document.body.appendChild(notif);
  
  setTimeout(() => {
    notif.style.animation = 'slideOutRight 0.3s ease-out';
    setTimeout(() => notif.remove(), 300);
  }, 3000);
}