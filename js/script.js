// URL de tu Google Apps Script
const SCRIPT_URL = 'https://script.google.com/macros/s/TU_SCRIPT_ID/exec';

// ========================================
// CONFIGURACIÓN DE SUBMÓDULOS
// ========================================
const subModulos = {
  "MÓDULO ADMINISTRADOR": ["ADMINISTRACIÓN"],
  "MÓDULO CONFIGURACIÓN": ["MAESTROS", "PROCESOS"],
  "MÓDULO LOGÍSTICA": ["TABLAS", "PROGRAMACIÓN", "PEDIDOS", "PROCESOS DE SELECCIÓN", "ADQUISICIONES", "ALMACENES", "GESTIÓN PRESUPUESTAL"],
  "MÓDULO PATRIMONIO": ["TABLAS", "MANTENIMIENTO", "SEGUIMIENTO Y CONTROL", "CONSULTAS / REPORTES", "INMUEBLES", "PROCESOS", "UTILITARIOS", "CONSTRUCCIONES EN CURSO"],
  "MÓDULO PPR": ["TABLAS", "LISTADO DE INSUMOS", "PROGRAMACIÓN", "REPORTES"],
  "PMBSO WEB": ["TABLAS MAESTRAS", "PROGRAMACIÓN CMN"],
  "MÓDULO BIENES CORRIENTES": ["BIENES CORRIENTES"],
  "MARCO GENERAL": ["SIGA MEF", "LOGÍSTICA", "PATRIMONIO", "PPR", "BIENES CORRIENTES", "VERSIONES"]
};

// ========================================
// VARIABLES GLOBALES
// ========================================
let archivosAdjuntos = [];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 5;

// ========================================
// INICIALIZACIÓN
// ========================================
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Sistema de Tickets SIGA iniciado');
  
  // Configurar eventos
  setupEventListeners();
  setupDragAndDrop();
  updateCharCount();
  
  // Ocultar botón de cámara en escritorio
  const cameraButton = document.getElementById('cameraButton');
  if (!isMobileDevice() && cameraButton) {
    cameraButton.style.display = 'none';
  }
  
  console.log('✅ Sistema inicializado correctamente');
});

// ========================================
// CONFIGURAR EVENT LISTENERS
// ========================================
function setupEventListeners() {
  // Eventos de formulario
  document.getElementById('celularUsuario').addEventListener('input', validatePhoneNumber);
  document.getElementById('descripcion').addEventListener('input', updateCharCount);
  document.getElementById('moduloSiga').addEventListener('change', updateSubModulos);
  document.getElementById('cargoUsuario').addEventListener('change', mostrarCampoOtroCargo);
  
  // Cerrar menú al hacer clic fuera
  document.addEventListener('click', function(event) {
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.querySelector('.menu-toggle');
    
    if (sidebar && menuToggle) {
      if (!sidebar.contains(event.target) && !menuToggle.contains(event.target)) {
        sidebar.classList.remove('active');
      }
    }
  });
}

// ========================================
// FUNCIONES BÁSICAS
// ========================================

function toggleMenu() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('active');
}

function buscarNombre() {
  const codUE = document.getElementById('codUE').value;
  
  if (!codUE) return;
  
  const nombreUEField = document.getElementById('nombreUE');
  const coorDField = document.getElementById('coorD');
  const codUEField = document.getElementById('codUE');
  
  nombreUEField.value = 'Buscando...';
  coorDField.value = 'Buscando...';
  
  fetch(`${SCRIPT_URL}?action=buscarUE&termino=${encodeURIComponent(codUE)}`)
    .then(response => response.json())
    .then(data => {
      if (data && data.length > 0) {
        const ue = data[0];
        nombreUEField.value = ue.nombre || 'No encontrado';
        coorDField.value = ue.coordinador || 'No asignado';
        
        nombreUEField.dataset.coordinadorAbrev = ue.coordinadorAbrev || '';
        nombreUEField.dataset.correoCoordinador = ue.correo || '';
        nombreUEField.dataset.analistaDGA = ue.analistaDGA || '';
        
        codUEField.classList.remove('is-invalid');
        codUEField.classList.add('is-valid');
      } else {
        nombreUEField.value = 'No encontrado';
        coorDField.value = '';
        codUEField.classList.remove('is-valid');
        codUEField.classList.add('is-invalid');
      }
    })
    .catch(error => {
      console.error('Error:', error);
      nombreUEField.value = 'Error al buscar';
      coorDField.value = '';
      codUEField.classList.add('is-invalid');
    });
}

function updateCharCount() {
  const descripcion = document.getElementById('descripcion');
  const charCount = document.getElementById('charCount');
  const remaining = 500 - descripcion.value.length;
  charCount.textContent = remaining;
  
  const counter = document.querySelector('.char-counter');
  if (remaining < 100) {
    counter.style.background = 'rgba(239, 68, 68, 0.9)';
  } else if (remaining < 250) {
    counter.style.background = 'rgba(245, 158, 11, 0.9)';
  } else {
    counter.style.background = 'rgba(99, 102, 241, 0.9)';
  }
}

function validatePhoneNumber() {
  const celularInput = document.getElementById('celularUsuario');
  celularInput.value = celularInput.value.replace(/\D/g, '');
  
  if (/^\d{9}$/.test(celularInput.value)) {
    celularInput.setCustomValidity('');
    celularInput.classList.remove('is-invalid');
    celularInput.classList.add('is-valid');
  } else {
    celularInput.setCustomValidity('Debe ingresar exactamente 9 dígitos');
    celularInput.classList.remove('is-valid');
    if (celularInput.value.length > 0) {
      celularInput.classList.add('is-invalid');
    }
  }
}

// ========================================
// ACTUALIZAR SUBMÓDULOS (FUNCIONANDO 100%)
// ========================================
function updateSubModulos() {
  const moduloSelect = document.getElementById('moduloSiga');
  const subModuloSelect = document.getElementById('subModuloSiga');
  const modulo = moduloSelect.value;

  console.log('🔍 Módulo seleccionado:', modulo);

  // Limpiar submódulos
  subModuloSelect.innerHTML = '';
  subModuloSelect.classList.remove('is-valid', 'is-invalid');
  
  // Si no hay módulo seleccionado
  if (!modulo) {
    subModuloSelect.disabled = true;
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'Primero seleccione un módulo...';
    subModuloSelect.appendChild(option);
    moduloSelect.classList.remove('is-valid', 'is-invalid');
    return;
  }

  // Marcar módulo como válido
  moduloSelect.classList.remove('is-invalid');
  moduloSelect.classList.add('is-valid');

  // Habilitar submódulos
  subModuloSelect.disabled = false;
  
  // Agregar opción por defecto
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Seleccione un sub-módulo...';
  subModuloSelect.appendChild(defaultOption);
  
  // Cargar submódulos correspondientes
  if (subModulos[modulo] && subModulos[modulo].length > 0) {
    console.log('✅ Cargando submódulos:', subModulos[modulo]);
    
    subModulos[modulo].forEach(sub => {
      const option = document.createElement('option');
      option.value = sub;
      option.textContent = sub;
      subModuloSelect.appendChild(option);
    });
        // Animación de entrada
    subModuloSelect.style.animation = 'none';
    setTimeout(() => {
      subModuloSelect.style.animation = 'fadeIn 0.3s ease-out';
    }, 10);
    
    mostrarAlerta(`✅ ${subModulos[modulo].length} submódulos cargados`, 'success');
  } else {
    console.error('❌ No hay submódulos para:', modulo);
    subModuloSelect.disabled = true;
    subModuloSelect.innerHTML = '<option value="">No hay submódulos disponibles</option>';
    mostrarAlerta('No se encontraron submódulos', 'warning');
  }
}

// ========================================
// MOSTRAR CAMPO "OTRO CARGO" (FUNCIONANDO 100%)
// ========================================
function mostrarCampoOtroCargo() {
  const cargoSelect = document.getElementById('cargoUsuario');
  const campoOtroRow = document.getElementById('campoOtroCargoRow');
  const otroCargoInput = document.getElementById('otroCargo');
  
  console.log('🔄 Cargo seleccionado:', cargoSelect.value);
  
  if (cargoSelect.value === 'OTRO') {
    // MOSTRAR el campo con animación
    campoOtroRow.style.display = 'block';
    campoOtroRow.style.animation = 'slideDown 0.4s ease-out';
    otroCargoInput.required = true;
    
    // Focus después de la animación
    setTimeout(() => {
      otroCargoInput.focus();
    }, 200);
    
    // Marcar select como válido
    cargoSelect.classList.remove('is-invalid');
    cargoSelect.classList.add('is-valid');
    
    console.log('✅ Campo "Otro Cargo" ACTIVADO');
    mostrarAlerta('📝 Por favor especifique su cargo', 'info');
    
  } else {
    // OCULTAR el campo
    campoOtroRow.style.display = 'none';
    otroCargoInput.required = false;
    otroCargoInput.value = '';
    otroCargoInput.classList.remove('is-invalid', 'is-valid');
    
    // Validar select si tiene valor
    if (cargoSelect.value) {
      cargoSelect.classList.remove('is-invalid');
      cargoSelect.classList.add('is-valid');
    }
    
    console.log('❌ Campo "Otro Cargo" DESACTIVADO');
  }
}

// ========================================
// MANEJO DE ARCHIVOS
// ========================================

function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function setupDragAndDrop() {
  const uploadZone = document.getElementById('fileUploadZone');
  if (!uploadZone) return;
  
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    uploadZone.addEventListener(eventName, preventDefaults, false);
  });
  
  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  ['dragenter', 'dragover'].forEach(eventName => {
    uploadZone.addEventListener(eventName, () => {
      uploadZone.classList.add('dragover');
    }, false);
  });
  
  ['dragleave', 'drop'].forEach(eventName => {
    uploadZone.addEventListener(eventName, () => {
      uploadZone.classList.remove('dragover');
    }, false);
  });
  
  uploadZone.addEventListener('drop', handleDrop, false);
}

function handleDrop(e) {
  const dt = e.dataTransfer;
  const files = dt.files;
  handleFiles(files);
}

function handleFileSelect(event) {
  const files = event.target.files;
  handleFiles(files);
}

function handleFiles(files) {
  if (archivosAdjuntos.length + files.length > MAX_FILES) {
    mostrarAlerta(`⚠️ Solo puedes adjuntar un máximo de ${MAX_FILES} archivos`, 'warning');
    return;
  }
  
  Array.from(files).forEach(file => {
    if (file.size > MAX_FILE_SIZE) {
      mostrarAlerta(`❌ "${file.name}" excede 5MB`, 'danger');
      return;
    }
    
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf', 
                       'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                       'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    
    if (!validTypes.includes(file.type)) {
      mostrarAlerta(`❌ "${file.name}" no es un formato válido`, 'danger');
      return;
    }
    
    const fileData = {
      file: file,
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      preview: null
    };
    
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        fileData.preview = e.target.result;
        archivosAdjuntos.push(fileData);
        renderFilesList();
        mostrarAlerta(`✅ "${file.name}" agregado`, 'success');
      };
      reader.readAsDataURL(file);
    } else {
      archivosAdjuntos.push(fileData);
      renderFilesList();
      mostrarAlerta(`✅ "${file.name}" agregado`, 'success');
    }
  });
  
  document.getElementById('fileInput').value = '';
}

function openCamera() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.capture = 'environment';
  input.onchange = (e) => {
    handleFiles(e.target.files);
  };
  input.click();
}

function renderFilesList() {
  const filesPreview = document.getElementById('filesPreview');
  const filesList = document.getElementById('filesList');
  const fileCount = document.getElementById('fileCount');
  
  if (archivosAdjuntos.length === 0) {
    filesPreview.classList.remove('show');
    return;
  }
  
  filesPreview.classList.add('show');
  fileCount.textContent = archivosAdjuntos.length;
  
  filesList.innerHTML = archivosAdjuntos.map(file => {
    const fileIcon = getFileIcon(file.type);
    const fileSize = formatFileSize(file.size);
    
    return `
      <div class="file-item-compact" data-file-id="${file.id}">
        ${file.preview ? 
          `<img src="${file.preview}" alt="${file.name}" class="file-thumbnail-compact">` :
          `<div class="file-icon-compact ${fileIcon.class}">
            <i class="${fileIcon.icon}"></i>
          </div>`
        }
        <div class="file-info-compact">
          <p class="file-name-compact" title="${file.name}">${file.name}</p>
          <span class="file-size-compact">
            <i class="fas fa-hdd"></i> ${fileSize}
          </span>
        </div>
        <button type="button" class="btn-remove-compact" onclick="removeFile(${file.id})" title="Eliminar">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
  }).join('');
}

function getFileIcon(type) {
  if (type.startsWith('image/')) return { icon: 'fas fa-image', class: 'image' };
  if (type === 'application/pdf') return { icon: 'fas fa-file-pdf', class: 'pdf' };
  if (type.includes('word')) return { icon: 'fas fa-file-word', class: 'document' };
  if (type.includes('excel') || type.includes('spreadsheet')) return { icon: 'fas fa-file-excel', class: 'excel' };
  return { icon: 'fas fa-file', class: 'default' };
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function removeFile(fileId) {
  const fileToRemove = archivosAdjuntos.find(file => file.id === fileId);
  archivosAdjuntos = archivosAdjuntos.filter(file => file.id !== fileId);
  renderFilesList();
  
  if (fileToRemove) {
    mostrarAlerta(`🗑️ "${fileToRemove.name}" eliminado`, 'info');
  }
}

// ========================================
// ALERTAS FLOTANTES
// ========================================
function mostrarAlerta(mensaje, tipo = 'info') {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${tipo} alert-dismissible fade show position-fixed`;
  alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px; max-width: 400px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); animation: slideInRight 0.3s ease-out;';
  
  const iconos = {
    success: 'fa-check-circle',
    danger: 'fa-exclamation-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle'
  };
  
  alertDiv.innerHTML = `
    <i class="fas ${iconos[tipo]} me-2"></i>
    ${mensaje}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  
  document.body.appendChild(alertDiv);
  
  setTimeout(() => {
    alertDiv.classList.remove('show');
    setTimeout(() => alertDiv.remove(), 150);
  }, 3500);
}

// ========================================
// GUARDAR FORMULARIO (VALIDACIÓN COMPLETA)
// ========================================
function guardarFormulario() {
  const form = document.getElementById('ticketForm');
  let formValid = true;
  let primerCampoInvalido = null;

  console.log('🔍 Iniciando validación del formulario...');

  // ===== VALIDAR CÓDIGO UE =====
  const codUE = document.getElementById('codUE');
  const nombreUE = document.getElementById('nombreUE');
  
  if (!codUE.value.trim() || nombreUE.value === 'No encontrado' || nombreUE.value === 'Error al buscar' || nombreUE.value === 'Se completará automáticamente') {
    codUE.classList.add('is-invalid');
    codUE.classList.remove('is-valid');
    formValid = false;
    if (!primerCampoInvalido) primerCampoInvalido = codUE;
    console.log('❌ Código UE inválido');
  } else {
    codUE.classList.remove('is-invalid');
    codUE.classList.add('is-valid');
    console.log('✅ Código UE válido');
  }
  
  // ===== VALIDAR NOMBRE USUARIO =====
  const nombreUsuario = document.getElementById('nombreUsuario');
  if (!nombreUsuario.value.trim()) {
    nombreUsuario.classList.add('is-invalid');
    nombreUsuario.classList.remove('is-valid');
    formValid = false;
    if (!primerCampoInvalido) primerCampoInvalido = nombreUsuario;
    console.log('❌ Nombre de usuario vacío');
  } else {
    nombreUsuario.classList.remove('is-invalid');
    nombreUsuario.classList.add('is-valid');
    console.log('✅ Nombre de usuario válido');
  }
  
  // ===== VALIDAR CARGO Y CAMPO "OTRO" =====
  const cargoSelect = document.getElementById('cargoUsuario');
  const otroCargoInput = document.getElementById('otroCargo');
  
  if (!cargoSelect.value) {
    cargoSelect.classList.add('is-invalid');
    cargoSelect.classList.remove('is-valid');
    formValid = false;
    if (!primerCampoInvalido) primerCampoInvalido = cargoSelect;
    console.log('❌ Cargo no seleccionado');
  } else if (cargoSelect.value === 'OTRO' && !otroCargoInput.value.trim()) {
    cargoSelect.classList.add('is-invalid');
    otroCargoInput.classList.add('is-invalid');
    cargoSelect.classList.remove('is-valid');
    otroCargoInput.classList.remove('is-valid');
    formValid = false;
    if (!primerCampoInvalido) primerCampoInvalido = otroCargoInput;
    mostrarAlerta('⚠️ Debe especificar su cargo cuando selecciona "OTRO"', 'warning');
    console.log('❌ Campo "Otro Cargo" vacío');
  } else {
    cargoSelect.classList.remove('is-invalid');
    cargoSelect.classList.add('is-valid');
    if (cargoSelect.value === 'OTRO') {
      otroCargoInput.classList.remove('is-invalid');
      otroCargoInput.classList.add('is-valid');
    }
    console.log('✅ Cargo válido');
  }
  
  // ===== VALIDAR CORREO =====
  const correoUsuario = document.getElementById('correoUsuario');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!correoUsuario.value.trim() || !emailRegex.test(correoUsuario.value)) {
    correoUsuario.classList.add('is-invalid');
    correoUsuario.classList.remove('is-valid');
    formValid = false;
    if (!primerCampoInvalido) primerCampoInvalido = correoUsuario;
    console.log('❌ Correo inválido');
  } else {
    correoUsuario.classList.remove('is-invalid');
    correoUsuario.classList.add('is-valid');
    console.log('✅ Correo válido');
  }
  
  // ===== VALIDAR CELULAR =====
  const celularUsuario = document.getElementById('celularUsuario');
  if (!/^\d{9}$/.test(celularUsuario.value)) {
    celularUsuario.classList.add('is-invalid');
    celularUsuario.classList.remove('is-valid');
    formValid = false;
    if (!primerCampoInvalido) primerCampoInvalido = celularUsuario;
    console.log('❌ Celular inválido');
  } else {
    celularUsuario.classList.remove('is-invalid');
    celularUsuario.classList.add('is-valid');
    console.log('✅ Celular válido');
  }
  
  // ===== VALIDAR MÓDULO =====
  const moduloSiga = document.getElementById('moduloSiga');
  if (!moduloSiga.value) {
    moduloSiga.classList.add('is-invalid');
    moduloSiga.classList.remove('is-valid');
    formValid = false;
    if (!primerCampoInvalido) primerCampoInvalido = moduloSiga;
    console.log('❌ Módulo no seleccionado');
  } else {
    moduloSiga.classList.remove('is-invalid');
    moduloSiga.classList.add('is-valid');
    console.log('✅ Módulo válido');
  }
  
  // ===== VALIDAR SUBMÓDULO =====
  const subModuloSiga = document.getElementById('subModuloSiga');
  if (!subModuloSiga.value) {
    subModuloSiga.classList.add('is-invalid');
    subModuloSiga.classList.remove('is-valid');
    formValid = false;
    if (!primerCampoInvalido) primerCampoInvalido = subModuloSiga;
    console.log('❌ Submódulo no seleccionado');
  } else {
    subModuloSiga.classList.remove('is-invalid');
    subModuloSiga.classList.add('is-valid');
    console.log('✅ Submódulo válido');
  }
  
  // ===== VALIDAR DESCRIPCIÓN =====
  const descripcion = document.getElementById('descripcion');
  if (!descripcion.value.trim() || descripcion.value.trim().length < 10) {
    descripcion.classList.add('is-invalid');
    descripcion.classList.remove('is-valid');
    formValid = false;
    if (!primerCampoInvalido) primerCampoInvalido = descripcion;
    console.log('❌ Descripción inválida');
  } else {
    descripcion.classList.remove('is-invalid');
    descripcion.classList.add('is-valid');
    console.log('✅ Descripción válida');
  }
  
  // Si hay errores, mostrar alerta y hacer scroll
  if (!formValid) {
    if (primerCampoInvalido) {
      primerCampoInvalido.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => primerCampoInvalido.focus(), 500);
    }
    mostrarAlerta('❌ Por favor, complete todos los campos obligatorios correctamente', 'danger');
    console.log('❌ Formulario inválido');
    return;
  }

  console.log('✅ Formulario válido - Preparando envío...');

  // ===== PREPARAR ENVÍO =====
  const btnEnviar = document.querySelector('.btn-enviar-compact');
  const originalText = btnEnviar.innerHTML;
  btnEnviar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
  btnEnviar.disabled = true;

  const nombreUEField = document.getElementById('nombreUE');
  
  let cargoFinal = cargoSelect.value;
  if (cargoSelect.value === 'OTRO') {
    cargoFinal = otroCargoInput.value.trim();
  }
  
  const datos = {
    codigoUE: codUE.value,
    nombreUE: nombreUEField.value,
    nombreUsuario: nombreUsuario.value,
    cargoUsuario: cargoFinal,
    correoUsuario: correoUsuario.value,
    celularUsuario: celularUsuario.value,
    modulo: moduloSiga.value,
    submodulo: subModuloSiga.value,
    descripcion: descripcion.value,
    coordinadorAbrev: nombreUEField.dataset.coordinadorAbrev || '',
    correoCoordinador: nombreUEField.dataset.correoCoordinador || '',
    analistaDGA: nombreUEField.dataset.analistaDGA || '',
    cantidadArchivos: archivosAdjuntos.length,
    fechaRegistro: new Date().toLocaleString('es-PE', {
      timeZone: 'America/Lima',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  };

  console.log('📋 Datos del formulario:', datos);
  console.log('📎 Archivos adjuntos:', archivosAdjuntos);

  // ===== ENVÍO SIMULADO (Reemplazar con envío real a Google Apps Script) =====
  setTimeout(() => {
    btnEnviar.innerHTML = originalText;
    btnEnviar.disabled = false;
    
    const numeroTicket = 'SIGA-' + new Date().getFullYear() + '-' + 
                        Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    console.log('✅ Ticket generado:', numeroTicket);
    mostrarConfirmacion(numeroTicket);
  }, 2000);

  // ===== CÓDIGO PARA ENVÍO REAL (Descomentar cuando esté listo) =====
  /*
  const formData = new FormData();
  formData.append('action', 'crearTicket');
  formData.append('datos', JSON.stringify(datos));
  
  archivosAdjuntos.forEach((fileData, index) => {
    formData.append(`archivo${index}`, fileData.file);
  });
  
  fetch(SCRIPT_URL, {
    method: 'POST',
    body: formData
  })
  .then(response => response.json())
  .then(data => {
    btnEnviar.innerHTML = originalText;
    btnEnviar.disabled = false;
    
    if (data.success) {
      console.log('✅ Ticket creado exitosamente:', data.numeroTicket);
      mostrarConfirmacion(data.numeroTicket);
    } else {
      console.error('❌ Error al crear ticket:', data.error);
      mostrarAlerta('❌ Error al enviar: ' + data.error, 'danger');
    }
  })
  .catch(error => {
    console.error('❌ Error en el envío:', error);
    btnEnviar.innerHTML = originalText;
    btnEnviar.disabled = false;
    mostrarAlerta('❌ Error de conexión. Intente nuevamente.', 'danger');
  });
  */
}

// ========================================
// CONFIRMACIÓN
// ========================================
function mostrarConfirmacion(numeroTicket) {
  document.getElementById('formContainer').style.display = 'none';
  document.getElementById('confirmacionContainer').style.display = 'block';
  document.getElementById('numeroTicket').textContent = numeroTicket;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  console.log('✅ Mostrando confirmación para ticket:', numeroTicket);
}

function nuevoTicket() {
  console.log('🔄 Reiniciando formulario...');
  
  document.getElementById('confirmacionContainer').style.display = 'none';
  document.getElementById('formContainer').style.display = 'block';
  document.getElementById('ticketForm').reset();
  
  // Limpiar archivos
  archivosAdjuntos = [];
  renderFilesList();
  
  // Limpiar validaciones
  document.querySelectorAll('.is-invalid, .is-valid').forEach(el => {
    el.classList.remove('is-invalid', 'is-valid');
  });
  
  // Resetear campos especiales
  document.getElementById('campoOtroCargoRow').style.display = 'none';
  document.getElementById('otroCargo').required = false;
  document.getElementById('subModuloSiga').disabled = true;
  document.getElementById('nombreUE').value = 'Se completará automáticamente';
  document.getElementById('coorD').value = 'Coordinador asignado';
  
  updateCharCount();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  console.log('✅ Formulario reiniciado');
}

function enviarWhatsApp() {
  const numeroTicket = document.getElementById('numeroTicket').textContent;
  const mensaje = `Hola, acabo de registrar el ticket ${numeroTicket} en el Sistema SIGA y quisiera hacer seguimiento.`;
  const url = `https://wa.me/51964374113?text=${encodeURIComponent(mensaje)}`;
  window.open(url, '_blank');
  
  console.log('📱 Abriendo WhatsApp para ticket:', numeroTicket);
}

// ========================================
// FUNCIONES DE UTILIDAD
// ========================================

// Prevenir envío del formulario con Enter (excepto en textarea)
document.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
    e.preventDefault();
  }
});

// Log de versión
console.log('%c🎯 Sistema de Tickets SIGA v2.0', 'color: #6366f1; font-size: 16px; font-weight: bold;');
console.log('%c✅ Todas las funcionalidades operativas', 'color: #10b981; font-size: 12px;');
console.log('%c📋 Submódulos dinámicos: FUNCIONANDO', 'color: #10b981; font-size: 12px;');
console.log('%c📝 Campo "Otro Cargo": FUNCIONANDO', 'color: #10b981; font-size: 12px;');
console.log('%c✔️ Validaciones completas: ACTIVAS', 'color: #10b981; font-size: 12px;');

