// ========================================
// MANEJO DE RESPUESTAS
// ========================================

async function manejarRespuestaFetch(response) {
    const contentType = response.headers.get('content-type');
    const esHTML = contentType && contentType.includes('text/html');
    
    if (esHTML && (response.status === 200 || response.status === 302)) {
        const texto = await response.text();
        
        if (texto.includes('login') || texto.includes('csrf')) {
            mostrarToast('Su sesión ha expirado. Redirigiendo al login...', 'error');
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
            throw new Error('Sesión expirada');
        }
    }
    
    if (response.status === 401 || response.status === 419) {
        mostrarToast('Su sesión ha expirado. Redirigiendo al login...', 'error');
        setTimeout(() => {
            window.location.href = '/login';
        }, 2000);
        throw new Error('Sesión expirada');
    }
    
    return response;
}

// ========================================
// ESTADO GLOBAL
// ========================================

let paginaActual = 1;
let filtrosActuales = {
    search: '',
    categoria: '',
    estado: '',
    area_id: ''
};
let temporizadorBusqueda = null;

// ========================================
// INICIALIZACIÓN
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    cargarTiposSolicitud();
    cargarCategorias();
    cargarAreas();
    configurarEscuchadores();
});

// ========================================
// CONFIGURAR EVENT LISTENERS
// ========================================

function configurarEscuchadores() {
    // Búsqueda con debounce
    document.getElementById('searchInput').addEventListener('input', function(e) {
        clearTimeout(temporizadorBusqueda);
        temporizadorBusqueda = setTimeout(() => {
            filtrosActuales.search = e.target.value;
            paginaActual = 1;
            cargarTiposSolicitud();
        }, 500);
    });

    // Filtros
    document.getElementById('filterCategoria').addEventListener('change', function(e) {
        filtrosActuales.categoria = e.target.value;
        paginaActual = 1;
        cargarTiposSolicitud();
        actualizarIndicadorFiltros();
    });

    document.getElementById('filterEstado').addEventListener('change', function(e) {
        filtrosActuales.estado = e.target.value;
        paginaActual = 1;
        cargarTiposSolicitud();
        actualizarIndicadorFiltros();
    });

    document.getElementById('filterArea').addEventListener('change', function(e) {
        filtrosActuales.area_id = e.target.value;
        paginaActual = 1;
        cargarTiposSolicitud();
        actualizarIndicadorFiltros();
    });
}

// ========================================
// CARGAR DATOS
// ========================================

async function cargarTiposSolicitud() {
    try {
        mostrarCargador();

        const params = new URLSearchParams({
            page: paginaActual,
            ...filtrosActuales
        });

        const response = await fetch(`/admin/api/tipos-solicitud?${params}`, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
            }
        });
        
        console.log('Response status:', response.status);
        console.log('Response content-type:', response.headers.get('content-type'));
        
        await manejarRespuestaFetch(response);
        
        if (!response.ok) {
            console.error('Response not OK:', response.status);
            throw new Error(`Error ${response.status}`);
        }

        const data = await response.json();
        console.log('Data recibida:', data);

        // Verificar estructura
        const tipos = data.data || data;

        if (!Array.isArray(tipos)) {
            console.error('Tipos no es array:', tipos);
            mostrarEstadoVacio();
            return;
        }

        if (tipos.length === 0) {
            console.log('No hay tipos de solicitud en BD');
            mostrarEstadoVacio();
        } else {
            console.log('Renderizando', tipos.length, 'tipos');
            renderizarTipos(tipos);
        }
    } catch (error) {
        console.error('Error completo:', error);
        console.error('Stack:', error.stack);
        mostrarToast('Error al cargar: ' + error.message, 'error');
        mostrarEstadoVacio();
    }
}

async function cargarCategorias() {
    try {
        const response = await fetch('/admin/api/tipos-solicitud/categorias', {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
            }
        });
        await manejarRespuestaFetch(response);
        
        if (response.ok) {
            const data = await response.json();
            
            const select = document.getElementById('filterCategoria');
            if (data.categorias) {
                data.categorias.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat;
                    option.textContent = cat;
                    select.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error al cargar categorías:', error);
    }
}

async function cargarAreas() {
    try {
        const response = await fetch('/admin/api/areas', {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
            }
        });
        await manejarRespuestaFetch(response);
       
        if (response.ok) {
            const areas = await response.json();
           debugger;
            
            const select = document.getElementById('filterArea');
            if (Array.isArray(areas.areas)) {
                areas.areas.forEach(area => {
                    const option = document.createElement('option');
                    option.value = area.id;
                    option.textContent = area.nombre;
                    select.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error al cargar áreas:', error);
    }
}

// ========================================
// RENDERIZAR UI
// ========================================

function renderizarTipos(tipos) {
    const grid = document.getElementById('tiposGrid');
    document.getElementById('emptyState').classList.add('hidden');
    document.getElementById('skeletonLoader').classList.add('hidden');
    grid.classList.remove('hidden');

    grid.innerHTML = tipos.map(tipo => crearCard(tipo)).join('');
}

function crearCard(tipo) {
    const colorClasses = {
        blue: 'bg-blue-100 text-blue-800 border-blue-300',
        green: 'bg-green-100 text-green-800 border-green-300',
        purple: 'bg-purple-100 text-purple-800 border-purple-300',
        orange: 'bg-orange-100 text-orange-800 border-orange-300',
        red: 'bg-red-100 text-red-800 border-red-300'
    };

    const colorClass = colorClasses[tipo.color] || colorClasses.blue;

    return `
        <div class="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-200">
            <!-- Header del Card -->
            <div class="flex items-start justify-between mb-4">
                <div class="flex items-center gap-2">
                    <span class="text-2xl">${tipo.icono || '📄'}</span>
                    <h3 class="font-semibold text-gray-900">${tipo.nombre}</h3>
                </div>
                
                <!-- Menú de acciones -->
                <div class="relative" x-data="{ open: false }">
                    <button @click="open = !open" class="text-gray-400 hover:text-gray-600 p-1">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path>
                        </svg>
                    </button>
                    <div x-show="open" @click.away="open = false" 
                        class="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                        <div class="py-1">
                            <a href="#" onclick="verDetalleTipo(${tipo.id}); return false;" class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                </svg>
                                Ver Detalle
                            </a>
                            <a href="#" onclick="editarTipo(${tipo.id}); return false;" class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                </svg>
                                Editar Información
                            </a>
                            <a href="#" onclick="configurarFormulario(${tipo.id}); return false;" class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                </svg>
                                Configurar Formulario
                            </a>
                            <a href="#" onclick="clonarTipo(${tipo.id}); return false;" class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                                </svg>
                                Clonar Tipo
                            </a>
                            <a href="#" onclick="eliminarTipo(${tipo.id}, '${tipo.codigo}'); return false;" class="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                </svg>
                                Eliminar
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Información -->
            <div class="space-y-2 mb-4">
                <p class="text-sm text-gray-600">
                    <span class="font-medium">Código:</span> ${tipo.codigo}
                </p>
                <p class="text-sm">
                    <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium ${colorClass}">
                        ${tipo.categoria}
                    </span>
                </p>
            </div>

            <!-- Detalles -->
            <div class="space-y-2 mb-4 text-sm text-gray-600">
                <div class="flex items-center gap-2">
                    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                    </svg>
                    <span class="font-medium">Área:</span> ${tipo.area?.nombre || 'Sin área'}
                </div>
                <div class="flex items-center gap-2">
                    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span class="font-medium">Tiempo:</span> ${tipo.tiempo_respuesta_dias} días hábiles
                </div>
                <div class="flex items-center gap-2">
                    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <span class="font-medium">Campos:</span> ${tipo.campos_formulario?.length || 0} configurados
                </div>
            </div>

            <!-- Toggle Estado -->
            <div class="flex items-center justify-between py-3 border-t border-b border-gray-200 mb-4">
                <span class="text-sm font-medium text-gray-700">Estado:</span>
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" class="sr-only peer" ${tipo.activo ? 'checked' : ''}
                           onchange="alternarEstadoTipo(${tipo.id}, this.checked)">
                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    <span class="ml-3 text-sm font-medium ${tipo.activo ? 'text-green-600' : 'text-gray-400'}">
                        ${tipo.activo ? 'Activo' : 'Inactivo'}
                    </span>
                </label>
            </div>

            <!-- Estadísticas (simuladas) -->
            <div class="mb-4">
                <p class="text-xs font-medium text-gray-500 mb-2">Estadísticas (este mes):</p>
                <div class="grid grid-cols-3 gap-2 text-center">
                    <div class="bg-blue-50 rounded p-2">
                        <p class="text-lg font-bold text-blue-600">0</p>
                        <p class="text-xs text-gray-600">Radicadas</p>
                    </div>
                    <div class="bg-yellow-50 rounded p-2">
                        <p class="text-lg font-bold text-yellow-600">0</p>
                        <p class="text-xs text-gray-600">En proceso</p>
                    </div>
                    <div class="bg-green-50 rounded p-2">
                        <p class="text-lg font-bold text-green-600">0</p>
                        <p class="text-xs text-gray-600">Completadas</p>
                    </div>
                </div>
            </div>

            <!-- Botón Ver Detalle -->
            <button onclick="verDetalleTipo(${tipo.id})" 
                class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition">
                Ver Detalle
            </button>
        </div>
    `;
}

function mostrarCargador() {
    document.getElementById('tiposGrid').classList.add('hidden');
    document.getElementById('emptyState').classList.add('hidden');
    document.getElementById('skeletonLoader').classList.remove('hidden');
}

function mostrarEstadoVacio() {
    document.getElementById('tiposGrid').classList.add('hidden');
    document.getElementById('skeletonLoader').classList.add('hidden');
    document.getElementById('emptyState').classList.remove('hidden');
}

// ========================================
// ACCIONES DE TIPOS
// ========================================

function verDetalleTipo(id) {
    window.location.href = `/admin/tipos-solicitud/${id}`;
}

// ========================================
// WIZARD DE CREACIÓN
// ========================================

let pasoActualWizard = 1;
let tipoIdCreado = null;
let camposSeleccionados = [];

function abrirModalNuevoTipo() {
    pasoActualWizard = 1;
    tipoIdCreado = null;
    camposSeleccionados = [];
    
    const modal = document.createElement('div');
    modal.id = 'wizardModal';
    modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50';
    modal.innerHTML = `
        <div class="relative top-10 mx-auto p-0 border w-11/12 max-w-4xl shadow-lg bg-white rounded-2xl mb-10">
            <!-- Header -->
            <div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-2xl">
                <div class="flex items-center justify-between">
                    <h3 class="text-xl font-semibold text-white">Crear Nuevo Tipo de Solicitud</h3>
                    <button type="button" onclick="cerrarWizard()" class="text-white hover:text-gray-200">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                
                <!-- Progress Bar -->
                <div class="mt-4">
                    <div class="flex items-center justify-between">
                        <div id="step1Indicator" class="flex items-center justify-center w-1/4">
                            <div class="w-10 h-10 bg-white text-blue-600 rounded-full flex items-center justify-center font-bold text-lg shadow-md">1</div>
                        </div>
                        <div class="flex-1 h-1 bg-blue-400 -mx-2"></div>
                        <div id="step2Indicator" class="flex items-center justify-center w-1/4">
                            <div class="w-10 h-10 bg-blue-400 text-white rounded-full flex items-center justify-center font-semibold text-lg">2</div>
                        </div>
                        <div class="flex-1 h-1 bg-blue-400 -mx-2"></div>
                        <div id="step3Indicator" class="flex items-center justify-center w-1/4">
                            <div class="w-10 h-10 bg-blue-400 text-white rounded-full flex items-center justify-center font-semibold text-lg">3</div>
                        </div>
                        <div class="flex-1 h-1 bg-blue-400 -mx-2"></div>
                        <div id="step4Indicator" class="flex items-center justify-center w-1/4">
                            <div class="w-10 h-10 bg-blue-400 text-white rounded-full flex items-center justify-center font-semibold text-lg">4</div>
                        </div>
                    </div>
                    <div class="mt-3 flex justify-between text-xs text-white font-medium">
                        <span class="w-1/4 text-center">Información<br>Básica</span>
                        <span class="w-1/4 text-center">Configurar<br>Campos</span>
                        <span class="w-1/4 text-center">Flujo de<br>Aprobación</span>
                        <span class="w-1/4 text-center">Plantillas y<br>Finalización</span>
                    </div>
                </div>
            </div>

            <!-- Body con los pasos -->
            <div class="px-6 py-6">
                <div id="wizardContent">
                    <!-- El contenido del paso actual se cargará aquí -->
                </div>
            </div>

            <!-- Footer con botones -->
            <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between rounded-b-2xl">
                <button type="button" onclick="cerrarWizard()" class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                    Cancelar
                </button>
                <div class="flex gap-2">
                    <button type="button" id="btnAnterior" onclick="pasoAnteriorWizard()" 
                        class="hidden px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                        ← Anterior
                    </button>
                    <button type="button" id="btnSiguiente" onclick="pasoSiguienteWizard()" 
                        class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Siguiente →
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    mostrarPasoWizard(1);
}

function mostrarPasoWizard(paso) {
    pasoActualWizard = paso;
    actualizarProgressBar();
    actualizarBotonesWizard();
    
    const content = document.getElementById('wizardContent');
    
    switch(paso) {
        case 1:
            content.innerHTML = generarPaso1();
            inicializarPaso1();
            break;
        case 2:
            content.innerHTML = generarPaso2();
            break;
        case 3:
            content.innerHTML = generarPaso3();
            break;
        case 4:
            content.innerHTML = generarPaso4();
            break;
    }
}

function actualizarProgressBar() {
    const progressContainer = document.querySelector('#wizardModal .flex.items-center.justify-between');
    const circles = progressContainer.querySelectorAll('[id^="step"]');
    const lines = progressContainer.querySelectorAll('.flex-1.h-1');
    
    circles.forEach((stepIndicator, index) => {
        const stepNum = index + 1;
        const circle = stepIndicator.querySelector('div');
        
        if (stepNum < pasoActualWizard) {
            // Paso completado - Verde con checkmark
            circle.className = 'w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg';
            circle.innerHTML = '✓';
        } else if (stepNum === pasoActualWizard) {
            // Paso actual - Blanco con número
            circle.className = 'w-10 h-10 bg-white text-blue-600 rounded-full flex items-center justify-center font-bold text-lg shadow-lg ring-4 ring-blue-300';
            circle.textContent = stepNum;
        } else {
            // Paso pendiente - Azul claro
            circle.className = 'w-10 h-10 bg-blue-400 text-white rounded-full flex items-center justify-center font-semibold text-lg';
            circle.textContent = stepNum;
        }
    });
    
    // Actualizar las líneas conectoras (hay 3 líneas entre 4 pasos)
    lines.forEach((line, index) => {
        const linePosition = index + 1; // La línea 0 está entre paso 1 y 2
        
        if (linePosition < pasoActualWizard) {
            // Línea completada - Verde
            line.className = 'flex-1 h-1 bg-green-500 -mx-2';
        } else {
            // Línea pendiente - Azul claro
            line.className = 'flex-1 h-1 bg-blue-400 -mx-2';
        }
    });
}

function actualizarBotonesWizard() {
    const btnAnterior = document.getElementById('btnAnterior');
    const btnSiguiente = document.getElementById('btnSiguiente');
    
    // Botón anterior
    if (pasoActualWizard === 1) {
        btnAnterior.classList.add('hidden');
    } else {
        btnAnterior.classList.remove('hidden');
    }
    
    // Botón siguiente/finalizar
    if (pasoActualWizard === 4) {
        btnSiguiente.textContent = 'Finalizar Configuración';
    } else {
        btnSiguiente.textContent = 'Siguiente →';
    }
}

function pasoAnteriorWizard() {
    if (pasoActualWizard > 1) {
        mostrarPasoWizard(pasoActualWizard - 1);
    }
}

async function pasoSiguienteWizard() {
    // Validar y guardar paso actual
    const validado = await validarYGuardarPaso(pasoActualWizard);
    
    if (validado) {
        if (pasoActualWizard < 4) {
            mostrarPasoWizard(pasoActualWizard + 1);
        } else {
            // Finalizar
            await finalizarWizard();
        }
    }
}

async function cerrarWizard() {
    if (tipoIdCreado) {
        const confirmado = await mostrarConfirmacion({
            title: '¿Descartar configuración?',
            text: 'Has comenzado a crear un tipo. ¿Qué deseas hacer?',
            showDenyButton: true,
            showCancelButton: true,
            confirmButtonText: 'Guardar como borrador',
            denyButtonText: 'Descartar todo',
            cancelButtonText: 'Continuar editando',
            confirmButtonColor: '#2563eb',
            denyButtonColor: '#dc2626'
        });
        
        if (confirmado) {
            // Guardar como borrador (inactivo)
            document.getElementById('wizardModal').remove();
            mostrarToast('Tipo guardado como borrador', 'info');
            cargarTiposSolicitud();
        }
    } else {
        document.getElementById('wizardModal').remove();
    }
}

// ========================================
// GENERACIÓN DE PASOS DEL WIZARD
// ========================================

function generarPaso1() {
    return `
        <div class="space-y-6">
            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                <p class="text-sm text-blue-700">
                    <strong>Paso 1 de 4:</strong> Configura la información básica del tipo de solicitud.
                    Todos los campos marcados con <span class="text-red-500">*</span> son obligatorios.
                </p>
            </div>

            <!-- Código y Nombre -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Código <span class="text-red-500">*</span>
                    </label>
                    <input type="text" id="wizard_codigo" 
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ej: SOL-TI-001"
                        maxlength="50">
                    <p class="mt-1 text-xs text-gray-500">Identificador único del tipo</p>
                    <p id="error_codigo" class="mt-1 text-xs text-red-600 hidden"></p>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Nombre <span class="text-red-500">*</span>
                    </label>
                    <input type="text" id="wizard_nombre" 
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ej: Solicitud de Acceso"
                        maxlength="100">
                    <p id="error_nombre" class="mt-1 text-xs text-red-600 hidden"></p>
                </div>
            </div>

            <!-- Descripción -->
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                    Descripción <span class="text-red-500">*</span>
                </label>
                <textarea id="wizard_descripcion" rows="3"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe el propósito y uso de este tipo de solicitud..."
                    maxlength="500"></textarea>
                <p class="mt-1 text-xs text-gray-500">
                    <span id="contador_descripcion">0</span>/500 caracteres
                </p>
                <p id="error_descripcion" class="mt-1 text-xs text-red-600 hidden"></p>
            </div>

            <!-- Categoría y Área -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Categoría <span class="text-red-500">*</span>
                    </label>
                    <select id="wizard_categoria" 
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="">Seleccione una categoría</option>
                    </select>
                    <p id="error_categoria" class="mt-1 text-xs text-red-600 hidden"></p>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Área Responsable <span class="text-red-500">*</span>
                    </label>
                    <select id="wizard_area_id" 
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="">Seleccione un área</option>
                    </select>
                    <p id="error_area" class="mt-1 text-xs text-red-600 hidden"></p>
                </div>
            </div>

            <!-- Tiempos -->
            <div class="bg-gray-50 p-4 rounded-lg">
                <h4 class="text-sm font-semibold text-gray-700 mb-4">⏱️ Tiempos de Gestión</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Tiempo de Respuesta (días) <span class="text-red-500">*</span>
                        </label>
                        <input type="number" id="wizard_tiempo_respuesta" min="1" max="365"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="15">
                        <p class="mt-1 text-xs text-gray-500">Días hábiles para responder</p>
                        <p id="error_tiempo_respuesta" class="mt-1 text-xs text-red-600 hidden"></p>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            SLA - Acuerdo de Nivel (días)
                        </label>
                        <input type="number" id="wizard_sla" min="1" max="365"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="30">
                        <p class="mt-1 text-xs text-gray-500">Tiempo máximo de resolución</p>
                    </div>
                </div>
            </div>

            <!-- Opciones Adicionales -->
            <div class="bg-gray-50 p-4 rounded-lg">
                <h4 class="text-sm font-semibold text-gray-700 mb-4">⚙️ Configuración Adicional</h4>
                <div class="space-y-3">
                    <label class="flex items-center cursor-pointer">
                        <input type="checkbox" id="wizard_requiere_aprobacion" 
                            class="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500">
                        <span class="ml-3 text-sm text-gray-700">Requiere aprobación previa</span>
                    </label>
                    
                    <label class="flex items-center cursor-pointer">
                        <input type="checkbox" id="wizard_requiere_pago" 
                            class="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500">
                        <span class="ml-3 text-sm text-gray-700">Requiere pago</span>
                    </label>
                    
                    <div id="campo_costo" class="ml-8 hidden">
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Costo (USD)
                        </label>
                        <input type="number" id="wizard_costo" min="0" step="0.01"
                            class="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0.00">
                    </div>
                </div>
            </div>

            <!-- Icono y Color -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Icono
                    </label>
                    <select id="wizard_icono" 
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="📄">📄 Documento</option>
                        <option value="📝">📝 Formulario</option>
                        <option value="💼">💼 Trabajo</option>
                        <option value="🔧">🔧 Servicio</option>
                        <option value="📋">📋 Checklist</option>
                        <option value="🎯">🎯 Objetivo</option>
                        <option value="⚡">⚡ Urgente</option>
                        <option value="🔒">🔒 Seguridad</option>
                    </select>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Color
                    </label>
                    <div class="flex gap-2">
                        <input type="color" id="wizard_color" value="#3B82F6"
                            class="w-16 h-10 border border-gray-300 rounded cursor-pointer">
                        <input type="text" id="wizard_color_text" value="#3B82F6"
                            class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="#3B82F6" maxlength="7">
                    </div>
                </div>
            </div>
        </div>
    `;
}

function inicializarPaso1() {
    // Cargar categorías
    cargarCategoriasWizard();
    
    // Cargar áreas
    cargarAreasWizard();
    
    // Contador de descripción
    const descripcion = document.getElementById('wizard_descripcion');
    const contador = document.getElementById('contador_descripcion');
    descripcion.addEventListener('input', () => {
        contador.textContent = descripcion.value.length;
    });
    
    // Sincronizar color picker con input text
    const colorPicker = document.getElementById('wizard_color');
    const colorText = document.getElementById('wizard_color_text');
    
    colorPicker.addEventListener('input', (e) => {
        colorText.value = e.target.value.toUpperCase();
    });
    
    colorText.addEventListener('input', (e) => {
        const valor = e.target.value;
        if (/^#[0-9A-Fa-f]{6}$/.test(valor)) {
            colorPicker.value = valor;
        }
    });
    
    // Mostrar/ocultar campo de costo
    const requierePago = document.getElementById('wizard_requiere_pago');
    const campoCosto = document.getElementById('campo_costo');
    
    requierePago.addEventListener('change', (e) => {
        if (e.target.checked) {
            campoCosto.classList.remove('hidden');
        } else {
            campoCosto.classList.add('hidden');
            document.getElementById('wizard_costo').value = '';
        }
    });
    
    // Validación en tiempo real
    agregarValidacionTiempoReal();
}

async function cargarCategoriasWizard() {
    try {
        const response = await fetch('/admin/api/tipos-solicitud/categorias', {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
            }
        });
        
        const data = await manejarRespuestaFetch(response);
        if (response.ok) {
            const select = document.getElementById('wizard_categoria');
            
            data.categorias.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.valor;
                option.textContent = cat.texto;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error al cargar categorías:', error);
    }
}

async function cargarAreasWizard() {
    try {
        const response = await fetch('/admin/api/areas', {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
            }
        });
        
        const data = await manejarRespuestaFetch(response);
        if (response.ok) {
            const select = document.getElementById('wizard_area_id');
            
            data.forEach(area => {
                const option = document.createElement('option');
                option.value = area.id;
                option.textContent = area.nombre;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error al cargar áreas:', error);
    }
}

function agregarValidacionTiempoReal() {
    const campos = ['codigo', 'nombre', 'descripcion', 'categoria', 'area_id', 'tiempo_respuesta'];
    
    campos.forEach(campo => {
        const input = document.getElementById(`wizard_${campo}`);
        if (input) {
            input.addEventListener('blur', () => validarCampoPaso1(campo));
            input.addEventListener('input', () => {
                // Limpiar error al empezar a escribir
                const error = document.getElementById(`error_${campo}`);
                if (error) {
                    error.classList.add('hidden');
                    input.classList.remove('border-red-500');
                }
            });
        }
    });
}

function validarCampoPaso1(campo) {
    const input = document.getElementById(`wizard_${campo}`);
    const error = document.getElementById(`error_${campo}`);
    
    if (!input || !error) return true;
    
    let esValido = true;
    let mensaje = '';
    
    switch(campo) {
        case 'codigo':
            if (!input.value.trim()) {
                esValido = false;
                mensaje = 'El código es obligatorio';
            } else if (!/^[A-Z0-9\-]+$/i.test(input.value)) {
                esValido = false;
                mensaje = 'Solo letras, números y guiones';
            }
            break;
            
        case 'nombre':
            if (!input.value.trim()) {
                esValido = false;
                mensaje = 'El nombre es obligatorio';
            } else if (input.value.trim().length < 3) {
                esValido = false;
                mensaje = 'Mínimo 3 caracteres';
            }
            break;
            
        case 'descripcion':
            if (!input.value.trim()) {
                esValido = false;
                mensaje = 'La descripción es obligatoria';
            } else if (input.value.trim().length < 10) {
                esValido = false;
                mensaje = 'Mínimo 10 caracteres';
            }
            break;
            
        case 'categoria':
        case 'area_id':
            if (!input.value) {
                esValido = false;
                mensaje = 'Este campo es obligatorio';
            }
            break;
            
        case 'tiempo_respuesta':
            if (!input.value || input.value < 1) {
                esValido = false;
                mensaje = 'Debe ser al menos 1 día';
            }
            break;
    }
    
    if (!esValido) {
        error.textContent = mensaje;
        error.classList.remove('hidden');
        input.classList.add('border-red-500');
    } else {
        error.classList.add('hidden');
        input.classList.remove('border-red-500');
    }
    
    return esValido;
}

function generarPaso2() {
    return `
        <div class="text-center py-12">
            <div class="text-6xl mb-4">🚧</div>
            <h3 class="text-xl font-semibold text-gray-700 mb-2">Configuración de Campos</h3>
            <p class="text-gray-500 mb-6">Esta funcionalidad estará disponible próximamente</p>
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                <p class="text-sm text-blue-700">
                    Por ahora, los tipos de solicitud se crearán con campos predeterminados básicos.
                </p>
            </div>
        </div>
    `;
}

function generarPaso3() {
    return `
        <div class="text-center py-12">
            <div class="text-6xl mb-4">🚧</div>
            <h3 class="text-xl font-semibold text-gray-700 mb-2">Configuración de Flujo</h3>
            <p class="text-gray-500 mb-6">Esta funcionalidad estará disponible próximamente</p>
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                <p class="text-sm text-blue-700">
                    Por ahora, las solicitudes seguirán un flujo de aprobación estándar.
                </p>
            </div>
        </div>
    `;
}

function generarPaso4() {
    // Generar resumen con los datos del paso 1
    const codigo = document.getElementById('wizard_codigo')?.value || '';
    const nombre = document.getElementById('wizard_nombre')?.value || '';
    const descripcion = document.getElementById('wizard_descripcion')?.value || '';
    const categoria = document.getElementById('wizard_categoria');
    const area = document.getElementById('wizard_area_id');
    const tiempoRespuesta = document.getElementById('wizard_tiempo_respuesta')?.value || '';
    const sla = document.getElementById('wizard_sla')?.value || '';
    const requiereAprobacion = document.getElementById('wizard_requiere_aprobacion')?.checked || false;
    const requierePago = document.getElementById('wizard_requiere_pago')?.checked || false;
    const costo = document.getElementById('wizard_costo')?.value || '0.00';
    const icono = document.getElementById('wizard_icono')?.value || '📄';
    const color = document.getElementById('wizard_color')?.value || '#3B82F6';
    
    const categoriaTexto = categoria?.selectedOptions[0]?.text || '';
    const areaTexto = area?.selectedOptions[0]?.text || '';
    
    return `
        <div class="space-y-6">
            <div class="bg-blue-50 border-l-4 border-blue-500 p-4">
                <p class="text-sm text-blue-700">
                    <strong>Paso 4 de 4:</strong> Revisa la configuración antes de crear el tipo de solicitud.
                </p>
            </div>
            
            <div id="resumenTipo" class="space-y-4">
                <!-- Información Básica -->
                <div class="border border-gray-200 rounded-lg p-4">
                    <h4 class="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <span style="font-size: 2rem;">${icono}</span>
                        ${nombre}
                    </h4>
                    <div class="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <span class="text-gray-500">Código:</span>
                            <span class="font-medium ml-2">${codigo}</span>
                        </div>
                        <div>
                            <span class="text-gray-500">Categoría:</span>
                            <span class="font-medium ml-2">${categoriaTexto}</span>
                        </div>
                        <div class="col-span-2">
                            <span class="text-gray-500">Descripción:</span>
                            <p class="text-gray-700 mt-1">${descripcion}</p>
                        </div>
                    </div>
                </div>
                
                <!-- Área y Tiempos -->
                <div class="border border-gray-200 rounded-lg p-4">
                    <h5 class="font-semibold text-gray-800 mb-2">⚙️ Configuración Operativa</h5>
                    <div class="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <span class="text-gray-500">Área Responsable:</span>
                            <span class="font-medium ml-2">${areaTexto}</span>
                        </div>
                        <div>
                            <span class="text-gray-500">Tiempo de Respuesta:</span>
                            <span class="font-medium ml-2">${tiempoRespuesta} días</span>
                        </div>
                        ${sla ? `<div>
                            <span class="text-gray-500">SLA:</span>
                            <span class="font-medium ml-2">${sla} días</span>
                        </div>` : ''}
                        <div>
                            <span class="text-gray-500">Color:</span>
                            <span class="inline-block w-6 h-6 rounded ml-2 border border-gray-300" style="background-color: ${color};"></span>
                            <span class="ml-1 text-xs">${color}</span>
                        </div>
                    </div>
                </div>
                
                <!-- Opciones -->
                <div class="border border-gray-200 rounded-lg p-4">
                    <h5 class="font-semibold text-gray-800 mb-2">✓ Opciones Activas</h5>
                    <div class="flex flex-wrap gap-2">
                        ${requiereAprobacion ? '<span class="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">Requiere Aprobación</span>' : ''}
                        ${requierePago ? `<span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Requiere Pago ($${costo})</span>` : ''}
                        ${!requiereAprobacion && !requierePago ? '<span class="text-gray-500 text-sm">Sin opciones adicionales</span>' : ''}
                    </div>
                </div>
                
                <!-- Advertencia pasos pendientes -->
                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p class="text-sm text-yellow-800">
                        <strong>⚠️ Nota:</strong> La configuración de campos personalizados, flujo de aprobación y plantillas
                        estará disponible próximamente. Por ahora se creará con valores predeterminados.
                    </p>
                </div>
            </div>
        </div>
    `;
}

// ========================================
// VALIDACIÓN Y GUARDADO
// ========================================

async function validarYGuardarPaso(paso) {
    switch(paso) {
        case 1:
            return await validarYGuardarPaso1();
        case 2:
            return true; // Placeholder - pasar automáticamente
        case 3:
            return true; // Placeholder - pasar automáticamente
        case 4:
            return true; // En el paso 4 solo se revisa, el guardado final es con finalizarWizard
        default:
            return false;
    }
}

async function validarYGuardarPaso1() {
    // Validar todos los campos obligatorios
    const camposObligatorios = ['codigo', 'nombre', 'descripcion', 'categoria', 'area_id', 'tiempo_respuesta'];
    let todosValidos = true;
    
    for (const campo of camposObligatorios) {
        const esValido = validarCampoPaso1(campo);
        if (!esValido) {
            todosValidos = false;
        }
    }
    
    if (!todosValidos) {
        mostrarAdvertencia('Por favor, completa todos los campos obligatorios correctamente');
        return false;
    }
    
    // Preparar datos del paso 1
    const datos = {
        codigo: document.getElementById('wizard_codigo').value.trim(),
        nombre: document.getElementById('wizard_nombre').value.trim(),
        descripcion: document.getElementById('wizard_descripcion').value.trim(),
        categoria: document.getElementById('wizard_categoria').value,
        area_id: document.getElementById('wizard_area_id').value,
        tiempo_respuesta_dias: parseInt(document.getElementById('wizard_tiempo_respuesta').value),
        sla_dias: document.getElementById('wizard_sla').value ? parseInt(document.getElementById('wizard_sla').value) : null,
        requiere_aprobacion: document.getElementById('wizard_requiere_aprobacion').checked,
        requiere_pago: document.getElementById('wizard_requiere_pago').checked,
        costo: document.getElementById('wizard_requiere_pago').checked ? parseFloat(document.getElementById('wizard_costo').value || 0) : null,
        icono: document.getElementById('wizard_icono').value,
        color: document.getElementById('wizard_color').value,
        activo: false // Inactivo hasta finalizar
    };
    
    try {
        // Si ya hay un tipo creado, actualizar; si no, crear
        let response;
        if (tipoIdCreado) {
            response = await fetch(`/admin/api/tipos-solicitud/${tipoIdCreado}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify(datos)
            });
        } else {
            response = await fetch('/admin/api/tipos-solicitud', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify(datos)
            });
        }
        
        const data = await manejarRespuestaFetch(response);
        
        if (response.ok) {
            const jsonData = await response.json();
            // Guardar el ID del tipo creado
            if (!tipoIdCreado) {
                tipoIdCreado = jsonData.id;
            }
            return true;
        } else {
            throw new Error('Error en la respuesta del servidor');
        }
    } catch (error) {
        console.error('Error al guardar paso 1:', error);
        mostrarErrorAlerta('Error al guardar', error.message || 'No se pudo guardar la información básica');
        return false;
    }
}

async function finalizarWizard() {
    if (!tipoIdCreado) {
        mostrarErrorAlerta('Error', 'No se ha creado el tipo de solicitud');
        return;
    }
    
    try {
        // Activar el tipo de solicitud
        const response = await fetch(`/admin/api/tipos-solicitud/${tipoIdCreado}/toggle`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
            },
            body: JSON.stringify({ activo: true })
        });
        
        await manejarRespuestaFetch(response);
        
        if (response.ok) {
            // Cerrar modal
            document.getElementById('wizardModal').remove();
            
            // Mostrar éxito
            await mostrarExito('¡Tipo de Solicitud Creado!', 'El tipo se ha configurado correctamente y está activo');
            
            // Recargar lista
            cargarTiposSolicitud();
        } else {
            throw new Error('Error al activar el tipo');
        }
        
    } catch (error) {
        console.error('Error al finalizar:', error);
        mostrarErrorAlerta('Error al finalizar', error.message || 'No se pudo activar el tipo de solicitud');
    }
}

function editarTipo(id) {
    mostrarInfo('Modal de edición próximamente', 'En Desarrollo');
}

function configurarFormulario(id) {
    mostrarInfo('Configuración de formulario próximamente', 'En Desarrollo');
}

async function clonarTipo(id) {
    const confirmado = await mostrarConfirmacion({
        title: '¿Clonar Tipo de Solicitud?',
        text: 'Se creará una copia de este tipo con los mismos campos y configuración',
        confirmButtonText: 'Sí, clonar',
        confirmButtonColor: '#2563eb'
    });

    if (confirmado) {
        mostrarInfo('Función de clonado próximamente', 'En Desarrollo');
    }
}

async function eliminarTipo(id, codigo) {
    const confirmado = await mostrarConfirmacion({
        title: '¿Eliminar Tipo de Solicitud?',
        html: `
            <p class="mb-4">Esta acción no se puede deshacer.</p>
            <p class="text-sm text-gray-600">Para confirmar, escriba el código del tipo:</p>
            <p class="font-mono font-bold text-lg mt-2">${codigo}</p>
        `,
        input: 'text',
        inputPlaceholder: 'Ingrese el código...',
        confirmButtonText: 'Eliminar',
        confirmButtonColor: '#dc2626',
        showCancelButton: true,
        inputValidator: (value) => {
            if (value !== codigo) {
                return 'El código no coincide';
            }
        }
    });

    if (confirmado) {
        try {
            const response = await fetch(`/admin/api/tipos-solicitud/${id}`, {
                method: 'DELETE',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                }
            });

            await manejarRespuestaFetch(response);

            if (response.ok) {
                const data = await response.json();
                mostrarToast(data.message || 'Tipo de solicitud eliminado', 'success');
                cargarTiposSolicitud();
            } else {
                const data = await response.json();
                mostrarErrorAlerta(data.message || 'Error al eliminar');
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarErrorAlerta('Error al eliminar tipo de solicitud');
        }
    }
}

async function alternarEstadoTipo(id, nuevoEstado) {
    try {
        const response = await fetch(`/admin/api/tipos-solicitud/${id}/toggle`, {
            method: 'PATCH',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            }
        });

        await manejarRespuestaFetch(response);

        if (response.ok) {
            const data = await response.json();
            mostrarToast(data.message, 'success');
        } else {
            // Revertir toggle
            const toggle = document.querySelector(`input[onchange="alternarEstadoTipo(${id}, this.checked)"]`);
            if (toggle) toggle.checked = !nuevoEstado;
            mostrarErrorAlerta('Error al cambiar estado');
        }
    } catch (error) {
        console.error('Error:', error);
        const toggle = document.querySelector(`input[onchange="alternarEstadoTipo(${id}, this.checked)"]`);
        if (toggle) toggle.checked = !nuevoEstado;
        mostrarErrorAlerta('Error al cambiar estado');
    }
}

// ========================================
// FILTROS
// ========================================

function limpiarFiltros() {
    filtrosActuales = {
        search: '',
        categoria: '',
        estado: '',
        area_id: ''
    };

    document.getElementById('searchInput').value = '';
    document.getElementById('filterCategoria').value = '';
    document.getElementById('filterEstado').value = '';
    document.getElementById('filterArea').value = '';

    paginaActual = 1;
    cargarTiposSolicitud();
    actualizarIndicadorFiltros();
}

function actualizarIndicadorFiltros() {
    let count = 0;
    if (filtrosActuales.search) count++;
    if (filtrosActuales.categoria) count++;
    if (filtrosActuales.estado) count++;
    if (filtrosActuales.area_id) count++;

    const badge = document.getElementById('filterBadge');
    const filterCount = document.getElementById('filterCount');

    if (count > 0) {
        badge.classList.remove('hidden');
        filterCount.textContent = count;
    } else {
        badge.classList.add('hidden');
    }
}

// ========================================
// HELPERS DE SWEETALERT2
// (Reutilizar del archivo usuarios.js o definir aquí)
// ========================================

function mostrarToast(message, type = 'success') {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer)
            toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
    });

    Toast.fire({
        icon: type,
        title: message
    });
}

async function mostrarConfirmacion(opciones = {}) {
    const defaultOptions = {
        title: '¿Está seguro?',
        text: "Esta acción no se puede deshacer",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#2563eb',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Sí, confirmar',
        cancelButtonText: 'Cancelar',
        reverseButtons: true
    };

    const result = await Swal.fire({...defaultOptions, ...opciones});
    return result.isConfirmed;
}

function mostrarErrorAlerta(mensaje, titulo = 'Error') {
    return Swal.fire({
        icon: 'error',
        title: titulo,
        text: mensaje,
        confirmButtonColor: '#dc2626',
        confirmButtonText: 'Aceptar'
    });
}

function mostrarInfo(mensaje, titulo = 'Información') {
    return Swal.fire({
        icon: 'info',
        title: titulo,
        text: mensaje,
        confirmButtonColor: '#2563eb',
        confirmButtonText: 'Aceptar'
    });
}

