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
    cargarCategorias('filterCategoria');
    cargarAreas('filterArea');
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

        const response = await fetch(`/admin/solicitudes/api/tipos?${params}`, {
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

async function cargarCategorias(id_select) {
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

            // Guardar en variable global para usar en resumen
            if (data.success && data.categorias) {
                window.categoriasDisponibles = data.categorias;
            }

            const select = document.getElementById(id_select);
            if (select && data.success && data.categorias) {
                data.categorias.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat.id;
                    option.textContent = `${cat.icono} ${cat.nombre}`;
                    option.dataset.color = cat.color;
                    option.dataset.slug = cat.slug;
                    select.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error al cargar categorías:', error);
    }
}

async function cargarAreas(id_select) {
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
            const data = await response.json();

            // Manejar diferentes formatos de respuesta
            const areas = data.areas || data;

            // Guardar en variable global para usar en resumen
            if (Array.isArray(areas)) {
                window.areasDisponibles = areas;
            }

            const select = document.getElementById(id_select);
            if (select) {
                if (Array.isArray(areas)) {
                    areas.forEach(area => {
                        const option = document.createElement('option');
                        option.value = area.id;
                        option.textContent = area.nombre;
                        select.appendChild(option);
                    });
                }
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
let datosWizardTemp = {}; // Almacenar datos temporalmente entre pasos

function abrirModalNuevoTipo() {
    pasoActualWizard = 1;
    tipoIdCreado = null;
    camposSeleccionados = [];
    datosWizardTemp = {}; // Limpiar datos temporales
    
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
                    </div>
                    <div class="mt-3 flex justify-between text-xs text-white font-medium">
                        <span class="w-1/4 text-center">Información<br>Básica</span>
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
    cargarCategorias('wizard_categoria_id');
    cargarAreas('wizard_area_responsable_id');
    mostrarPasoWizard(1);
    
    // Agregar contador de caracteres para instrucciones
    document.getElementById('wizard_instrucciones')?.addEventListener('input', function() {
        document.getElementById('contador_instrucciones').textContent = this.value.length;
    });
}

async function mostrarPasoWizard(paso) {
    // Guardar datos del paso actual antes de cambiar
    guardarDatosPasoActual();
    
    // Restaurar tipoIdCreado si existe en memoria temporal
    if (datosWizardTemp.tipoIdCreado && !tipoIdCreado) {
        tipoIdCreado = datosWizardTemp.tipoIdCreado;
        console.log('🔄 Restaurando tipoIdCreado:', tipoIdCreado);
    }
    
    pasoActualWizard = paso;
    actualizarProgressBar();
    actualizarBotonesWizard();
    
    const content = document.getElementById('wizardContent');
    
    switch(paso) {
        case 1:
            content.innerHTML = generarPaso1();
            await inicializarPaso1(); // Esperar a que se carguen los selects
            restaurarDatosPaso1();
            break;
        case 2:
            content.innerHTML = generarPaso2();
            inicializarPaso2();
            break;
        case 3:
            content.innerHTML = generarPaso3();
            await inicializarPaso3();
            break;
        case 4:
            content.innerHTML = generarPaso4();
            break;
    }
}

/**
 * Inicializar paso 3 - Plantillas
 */
async function inicializarPaso3() {
    // Cargar plantillas disponibles
    await cargarPlantillasDisponibles();

    // Configurar listeners de filtros
    const buscar = document.getElementById('buscarPlantilla');
    const filtroTipo = document.getElementById('filtroTipoDocumento');

    if (buscar) {
        buscar.addEventListener('input', debounce(cargarPlantillasDisponibles, 500));
    }

    if (filtroTipo) {
        filtroTipo.addEventListener('change', cargarPlantillasDisponibles);
    }
}

/**
 * Función debounce para búsqueda
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Guardar datos del paso actual en memoria temporal
 */
function guardarDatosPasoActual() {
    // Siempre guardar el tipoIdCreado
    datosWizardTemp.tipoIdCreado = tipoIdCreado;
    console.log('💾 Guardando tipoIdCreado:', tipoIdCreado);
    
    if (pasoActualWizard === 1) {
        // Guardar todos los campos del paso 1
        const campos = [
            'wizard_codigo', 'wizard_nombre', 'wizard_slug', 'wizard_descripcion',
            'wizard_instrucciones', 'wizard_categoria_id', 'wizard_area_responsable_id',
            'wizard_requiere_pago', 'wizard_valor_tramite', 'wizard_dias_respuesta',
            'wizard_dias_alerta', 'wizard_color', 'wizard_color_text', 'wizard_icono',
            'wizard_requiere_documentos', 'wizard_activo'
        ];
        
        datosWizardTemp.paso1 = {};
        
        campos.forEach(campo => {
            const elemento = document.getElementById(campo);
            if (elemento) {
                if (elemento.type === 'checkbox') {
                    datosWizardTemp.paso1[campo] = elemento.checked;
                } else {
                    datosWizardTemp.paso1[campo] = elemento.value;
                }
            }
        });
        
        console.log('📦 Datos del Paso 1 guardados:', datosWizardTemp.paso1);
    }
}

/**
 * Restaurar datos del paso 1 desde memoria temporal
 */
function restaurarDatosPaso1() {
    if (datosWizardTemp.paso1) {
        console.log('📥 Restaurando datos del Paso 1:', datosWizardTemp.paso1);
        
        // Los selects ya están cargados (await en inicializarPaso1)
        Object.keys(datosWizardTemp.paso1).forEach(campo => {
            const elemento = document.getElementById(campo);
            if (elemento) {
                const valorGuardado = datosWizardTemp.paso1[campo];
                
                if (elemento.type === 'checkbox') {
                    elemento.checked = valorGuardado;
                    // Disparar evento change para checkboxes
                    elemento.dispatchEvent(new Event('change'));
                } else {
                    elemento.value = valorGuardado;
                    // Disparar evento input
                    elemento.dispatchEvent(new Event('input'));
                }
                
                // Verificar que el select tenga el valor (si es select)
                if (elemento.tagName === 'SELECT' && valorGuardado) {
                    console.log(`🔍 Select ${campo}: Valor guardado=${valorGuardado}, Valor actual=${elemento.value}`);
                    if (elemento.value !== valorGuardado) {
                        console.warn(`⚠️ El select ${campo} no pudo restaurar el valor ${valorGuardado}`);
                    }
                }
            } else {
                console.warn(`⚠️ No se encontró el elemento: ${campo}`);
            }
        });
        
        // Mostrar campo de valor_tramite si requiere_pago está marcado
        const requierePago = document.getElementById('wizard_requiere_pago');
        const campoValorTramite = document.getElementById('campo_valor_tramite');
        if (requierePago && campoValorTramite) {
            if (requierePago.checked) {
                campoValorTramite.classList.remove('hidden');
            } else {
                campoValorTramite.classList.add('hidden');
            }
        }
        
        // Actualizar contadores
        const descripcion = document.getElementById('wizard_descripcion');
        const contador = document.getElementById('contador_descripcion');
        if (descripcion && contador) {
            contador.textContent = descripcion.value.length;
        }
        
        console.log('✅ Datos del Paso 1 restaurados completamente');
    }
}

function actualizarProgressBar() {
    console.log('🔄 Actualizando progress bar para paso:', pasoActualWizard);
    
    // Actualizar indicadores específicos por ID
    const step1 = document.getElementById('step1Indicator');
    const step2 = document.getElementById('step2Indicator');
    const step3 = document.getElementById('step3Indicator');
    
    if (!step1 || !step2 || !step3) {
        console.error('❌ No se encontraron los indicadores de paso');
        return;
    }
    
    const steps = [
        { element: step1, num: 1 },
        { element: step2, num: 2 },
        { element: step3, num: 3 }
    ];
    
    steps.forEach(({ element, num }) => {
        const circle = element.querySelector('div');
        if (!circle) return;
        
        if (num < pasoActualWizard) {
            // Paso completado - Verde con checkmark
            circle.className = 'w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg';
            circle.innerHTML = '✓';
            console.log(`✅ Paso ${num}: Completado`);
        } else if (num === pasoActualWizard) {
            // Paso actual - Blanco con ring azul
            circle.className = 'w-10 h-10 bg-white text-blue-600 rounded-full flex items-center justify-center font-bold text-lg shadow-lg ring-4 ring-blue-300';
            circle.textContent = num;
            console.log(`🎯 Paso ${num}: Activo`);
        } else {
            // Paso pendiente - Azul claro
            circle.className = 'w-10 h-10 bg-blue-400 text-white rounded-full flex items-center justify-center font-semibold text-lg';
            circle.textContent = num;
            console.log(`⏳ Paso ${num}: Pendiente`);
        }
    });
    
    // Actualizar las líneas conectoras
    const progressContainer = document.querySelector('#wizardModal .flex.items-center.justify-between');
    const lines = progressContainer ? progressContainer.querySelectorAll('.flex-1.h-1') : [];
    
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
    
    console.log('✅ Progress bar actualizado');
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
        const result = await Swal.fire({
            title: '¿Descartar configuración?',
            text: 'Has comenzado a crear un tipo. ¿Qué deseas hacer?',
            icon: 'warning',
            showDenyButton: true,
            showCancelButton: true,
            confirmButtonText: 'Guardar como borrador',
            denyButtonText: 'Descartar todo',
            cancelButtonText: 'Continuar editando',
            confirmButtonColor: '#2563eb',
            denyButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            reverseButtons: true
        });

        if (result.isConfirmed) {
            // Guardar como borrador (inactivo)
            document.getElementById('wizardModal').remove();
            mostrarToast('Tipo guardado como borrador', 'info');
            cargarTiposSolicitud();
            limpiarEstadoWizard();
        } else if (result.isDenied) {
            // Descartar todo: eliminar tipo y transiciones creadas
            await descartarTodoWizard();
        }
        // Si result.isDismissed (Cancelar), no hacer nada y mantener el wizard abierto
    } else {
        document.getElementById('wizardModal').remove();
        limpiarEstadoWizard();
    }
}

/**
 * Descartar todo: eliminar el tipo de solicitud y sus transiciones
 */
async function descartarTodoWizard() {
    if (!tipoIdCreado) {
        document.getElementById('wizardModal')?.remove();
        limpiarEstadoWizard();
        return;
    }

    try {
        // Mostrar loading
        Swal.fire({
            title: 'Descartando...',
            text: 'Eliminando tipo de solicitud y transiciones',
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // 1. Eliminar todas las transiciones específicas del tipo
        const responseTransiciones = await fetch(
            `/admin/api/configuracion/flujos-transiciones?tipo_solicitud_id=${tipoIdCreado}&solo_especificas=true`,
            {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                }
            }
        );

        if (responseTransiciones.ok) {
            const dataTransiciones = await responseTransiciones.json();
            if (dataTransiciones.success && dataTransiciones.transiciones.length > 0) {
                // Eliminar cada transición
                const deletePromises = dataTransiciones.transiciones.map(trans =>
                    fetch(`/admin/api/configuracion/flujos-transiciones/${trans.id}`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                            'Content-Type': 'application/json'
                        }
                    })
                );

                await Promise.all(deletePromises);
                console.log(`${dataTransiciones.transiciones.length} transiciones eliminadas`);
            }
        }

        // 2. Eliminar el tipo de solicitud
        const responseTipo = await fetch(`/admin/api/tipos-solicitud/${tipoIdCreado}`, {
            method: 'DELETE',
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                'Content-Type': 'application/json'
            }
        });

        if (!responseTipo.ok) {
            throw new Error('No se pudo eliminar el tipo de solicitud');
        }

        // Cerrar el wizard y limpiar
        document.getElementById('wizardModal')?.remove();
        limpiarEstadoWizard();

        // Recargar la lista de tipos
        cargarTiposSolicitud();

        // Mostrar mensaje de éxito
        Swal.fire({
            icon: 'success',
            title: 'Descartado exitosamente',
            text: 'El tipo de solicitud y sus transiciones fueron eliminados',
            timer: 2000,
            showConfirmButton: false
        });

    } catch (error) {
        console.error('Error al descartar:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error al descartar',
            text: error.message || 'No se pudo eliminar completamente. Por favor, revisa manualmente.',
            confirmButtonColor: '#dc2626'
        });

        // Aun con error, cerrar el wizard
        document.getElementById('wizardModal')?.remove();
        limpiarEstadoWizard();
        cargarTiposSolicitud();
    }
}

/**
 * Limpiar estado del wizard (variables globales)
 */
function limpiarEstadoWizard() {
    // Limpiar variables globales
    tipoIdCreado = null;
    pasoActualWizard = 1;
    window.estadosDisponibles = [];
    window.transicionesConfiguradas = [];
    window.transicionesTodas = [];
    window.categoriasDisponibles = [];
    window.areasDisponibles = [];
    window.rolesDisponibles = [];
    window.plantillasSeleccionadas = [];
    window.todasLasPlantillas = [];

    console.log('Estado del wizard limpiado');
}

// ========================================
// GENERACIÓN DE PASOS DEL WIZARD
// ========================================

function generarPaso1() {
    return `
        <div class="space-y-6">
            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                <p class="text-sm text-blue-700">
                    <strong>Paso 1 de 3:</strong> Configura la información básica del tipo de solicitud.
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
                        placeholder="Ej: CERT-NOM-001"
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
                        placeholder="Ej: Certificado de Nomenclatura"
                        maxlength="255"
                        oninput="generarSlugTipoSolicitud()">
                    <p id="error_nombre" class="mt-1 text-xs text-red-600 hidden"></p>
                </div>
            </div>

            <!-- Slug -->
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                    Slug (Identificador URL) <span class="text-red-500">*</span>
                    <button type="button" onclick="regenerarSlugTipo()" 
                        class="ml-2 text-xs text-blue-600 hover:text-blue-800"
                        title="Regenerar desde el nombre">
                        <svg class="w-3 h-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                        </svg>
                    </button>
                </label>
                <input type="text" id="wizard_slug" required
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    placeholder="ej: certificado-nomenclatura"
                    pattern="[-a-z0-9]+"
                    title="Solo letras minúsculas, números y guiones">
                <p class="mt-1 text-xs text-gray-500">Se genera automáticamente del nombre. Debe ser único.</p>
                <p id="error_slug" class="mt-1 text-xs text-red-600 hidden"></p>
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

            <!-- Instrucciones -->
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                    Instrucciones para el Solicitante
                </label>
                <textarea id="wizard_instrucciones" rows="4"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Pasos detallados que debe seguir el usuario para presentar esta solicitud..."
                    maxlength="1000"></textarea>
                <p class="mt-1 text-xs text-gray-500">
                    <span id="contador_instrucciones">0</span>/1000 caracteres
                </p>
            </div>

            <!-- Categoría y Área -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Categoría <span class="text-red-500">*</span>
                    </label>
                    <select id="wizard_categoria_id" 
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="">Seleccione una categoría</option>
                    </select>
                    <p id="error_categoria" class="mt-1 text-xs text-red-600 hidden"></p>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Área Responsable <span class="text-red-500">*</span>
                    </label>
                    <select id="wizard_area_responsable_id" 
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="">Seleccione un área</option>
                    </select>
                    <p id="error_area" class="mt-1 text-xs text-red-600 hidden"></p>
                </div>
            </div>

            <!-- Tiempos -->
            <div class="bg-gray-50 p-4 rounded-lg">
                <h4 class="text-sm font-semibold text-gray-700 mb-4">⏱️ Tiempos de Gestión</h4>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Días de Respuesta <span class="text-red-500">*</span>
                        </label>
                        <input type="number" id="wizard_dias_respuesta" min="1" max="365"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="5" value="5">
                        <p class="mt-1 text-xs text-gray-500">Días hábiles para responder</p>
                        <p id="error_dias_respuesta" class="mt-1 text-xs text-red-600 hidden"></p>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Días de Alerta <span class="text-red-500">*</span>
                        </label>
                        <input type="number" id="wizard_dias_alerta" min="1" max="30"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="2" value="2">
                        <p class="mt-1 text-xs text-gray-500">Días antes del vencimiento</p>
                        <p id="error_dias_alerta" class="mt-1 text-xs text-red-600 hidden"></p>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            SLA (días)
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
                    
                    <div id="campo_valor_tramite" class="ml-8 hidden">
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Valor del Trámite ($)
                        </label>
                        <input type="number" id="wizard_valor_tramite" min="0" step="0.01"
                            class="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0.00">
                    </div>

                    <label class="flex items-center cursor-pointer">
                        <input type="checkbox" id="wizard_requiere_documentos" 
                            class="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500">
                        <span class="ml-3 text-sm text-gray-700">Requiere adjuntar documentos</span>
                    </label>
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

async function inicializarPaso1() {
    console.log('🔄 Inicializando Paso 1...');
    
    // Cargar categorías y áreas en paralelo y ESPERAR
    await Promise.all([
        cargarCategorias('wizard_categoria_id'),
        cargarAreas('wizard_area_responsable_id')
    ]);
    
    console.log('✅ Categorías y áreas cargadas');
    
    // Contador de descripción
    const descripcion = document.getElementById('wizard_descripcion');
    const contador = document.getElementById('contador_descripcion');
    if (descripcion && contador) {
        descripcion.addEventListener('input', () => {
            contador.textContent = descripcion.value.length;
        });
    }
    
    // Sincronizar color picker con input text
    const colorPicker = document.getElementById('wizard_color');
    const colorText = document.getElementById('wizard_color_text');
    
    if (colorPicker && colorText) {
        colorPicker.addEventListener('input', (e) => {
            colorText.value = e.target.value.toUpperCase();
        });
        
        colorText.addEventListener('input', (e) => {
            const valor = e.target.value;
            if (/^#[0-9A-Fa-f]{6}$/.test(valor)) {
                colorPicker.value = valor;
            }
        });
    }
    
    // Mostrar/ocultar campo de valor_tramite
    const requierePago = document.getElementById('wizard_requiere_pago');
    const campoValorTramite = document.getElementById('campo_valor_tramite');
    
    if (requierePago && campoValorTramite) {
        requierePago.addEventListener('change', (e) => {
            if (e.target.checked) {
                campoValorTramite.classList.remove('hidden');
            } else {
                campoValorTramite.classList.add('hidden');
                document.getElementById('wizard_valor_tramite').value = '';
            }
        });
    }
    
    // Validación en tiempo real
    agregarValidacionTiempoReal();
    
    console.log('✅ Paso 1 inicializado completamente');
}

/**
 * Inicializar Paso 2 - Flujos de Aprobación
 */
function inicializarPaso2() {
    // Toggle entre flujo básico y personalizado
    const radios = document.querySelectorAll('input[name="tipo_flujo"]');
    const contenedorPersonalizado = document.getElementById('flujo_personalizado_container');
    const infoBasico = document.getElementById('flujo_basico_info');
    
    radios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'personalizado') {
                contenedorPersonalizado.classList.remove('hidden');
                infoBasico.classList.add('hidden');
                cargarEstadosDisponibles();
                cargarTransicionesConfiguradas();
            } else {
                contenedorPersonalizado.classList.add('hidden');
                infoBasico.classList.remove('hidden');
            }
        });
    });
}

/**
 * Cargar estados disponibles del sistema
 */
async function cargarEstadosDisponibles() {
    try {
        console.log('Cargando estados disponibles...');
        const response = await fetch('/admin/api/configuracion/estados', {
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('Estados recibidos:', data);
            if (data.success && data.estados) {
                window.estadosDisponibles = data.estados;
                console.log('Estados guardados en window:', window.estadosDisponibles.length);
                renderizarDiagramaFlujo();
            } else {
                console.error('Respuesta sin estados:', data);
            }
        } else {
            console.error('Error HTTP:', response.status);
        }
    } catch (error) {
        console.error('Error al cargar estados:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar los estados del sistema. Verifica que la tabla estados_solicitud tenga datos.'
        });
    }
}

/**
 * Cargar transiciones configuradas
 */
async function cargarTransicionesConfiguradas() {
    try {
        const tipoSolicitudId = tipoIdCreado; // ID del tipo en creación
        console.log('Cargando transiciones para tipo:', tipoSolicitudId);

        if (!tipoSolicitudId) {
            console.warn('No hay tipoIdCreado, cargando transiciones básicas');
            // Si no hay tipo, solo cargar flujo básico
            const url = '/admin/api/configuracion/flujos-transiciones';
            const response = await fetch(url, {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    window.transicionesConfiguradas = data.transiciones || [];
                    window.transicionesTodas = data.transiciones || [];
                    renderizarListaTransiciones();
                    renderizarDiagramaFlujo();
                }
            }
            return;
        }

        // Cargar transiciones en paralelo:
        // 1. Todas las transiciones (básicas + específicas) para el diagrama
        // 2. Solo transiciones específicas para la lista
        const [responseTodasTrans, responseEspecificas] = await Promise.all([
            fetch(`/admin/api/configuracion/flujos-transiciones?tipo_solicitud_id=${tipoSolicitudId}`, {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                }
            }),
            fetch(`/admin/api/configuracion/flujos-transiciones?tipo_solicitud_id=${tipoSolicitudId}&solo_especificas=true`, {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                }
            })
        ]);

        if (responseTodasTrans.ok && responseEspecificas.ok) {
            const dataTodasTrans = await responseTodasTrans.json();
            const dataEspecificas = await responseEspecificas.json();

            console.log('Todas las transiciones (diagrama):', dataTodasTrans);
            console.log('Transiciones específicas (lista):', dataEspecificas);

            if (dataTodasTrans.success && dataEspecificas.success) {
                // Para el diagrama: usar TODAS las transiciones (básicas + específicas)
                window.transicionesTodas = dataTodasTrans.transiciones || [];

                // Para la lista: usar SOLO las transiciones específicas del tipo
                window.transicionesConfiguradas = dataEspecificas.transiciones || [];

                console.log('Total transiciones para diagrama:', window.transicionesTodas.length);
                console.log('Total transiciones configuradas (lista):', window.transicionesConfiguradas.length);

                renderizarListaTransiciones();
                renderizarDiagramaFlujo();
            }
        } else {
            console.error('Error HTTP al cargar transiciones');
        }
    } catch (error) {
        console.error('Error al cargar transiciones:', error);
    }
}

/**
 * Renderizar diagrama de flujo (versión simplificada con divs)
 */
function renderizarDiagramaFlujo() {
    const diagrama = document.getElementById('diagrama_flujo');
    if (!diagrama) {
        console.error('No se encontró el elemento diagrama_flujo');
        return;
    }
    
    if (!window.estadosDisponibles || window.estadosDisponibles.length === 0) {
        console.warn('No hay estados disponibles para mostrar');
        diagrama.innerHTML = `
            <div class="absolute inset-0 flex items-center justify-center">
                <div class="text-center text-gray-500">
                    <svg class="w-16 h-16 mx-auto mb-2 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p>Cargando estados...</p>
                </div>
            </div>
        `;
        return;
    }
    
    console.log('Renderizando diagrama con', window.estadosDisponibles.length, 'estados');

    const estados = window.estadosDisponibles || [];
    // Usar TODAS las transiciones (básicas + específicas) para el diagrama
    const transiciones = window.transicionesTodas || window.transicionesConfiguradas || [];
    
    let html = '<div class="p-8 min-h-[400px]">';
    html += '<div class="flex flex-wrap gap-6 justify-center">';
    
    estados.forEach((estado, index) => {
        const tieneTransiciones = transiciones.some(t => t.estado_origen.id === estado.id);
        
        html += `
            <div class="relative">
                <div class="flex flex-col items-center">
                    <div class="px-6 py-4 rounded-lg shadow-md text-center min-w-[150px] cursor-pointer hover:shadow-lg transition"
                        style="background-color: ${estado.color}; color: white;"
                        onclick="verDetallesEstado(${estado.id})">
                        <div class="text-3xl mb-2">${estado.icono}</div>
                        <div class="font-semibold text-sm">${estado.nombre}</div>
                        ${estado.tipo === 'inicial' ? '<div class="text-xs mt-1 opacity-80">INICIAL</div>' : ''}
                        ${estado.tipo === 'final' ? '<div class="text-xs mt-1 opacity-80">FINAL</div>' : ''}
                    </div>
                    ${!tieneTransiciones && estado.tipo !== 'final' ? `
                        <div class="text-xs text-red-600 mt-2 font-medium">⚠️ Sin salidas</div>
                    ` : ''}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    
    // Mostrar transiciones como lista debajo
    if (transiciones.length > 0) {
        html += '<div class="mt-8 space-y-2">';
        html += '<h5 class="text-sm font-semibold text-gray-700 mb-3">Transiciones:</h5>';
        transiciones.forEach(trans => {
            html += `
                <div class="flex items-center gap-3 bg-white p-3 rounded border border-gray-200">
                    <span class="px-3 py-1 rounded text-sm" style="background-color: ${trans.estado_origen.color}20; color: ${trans.estado_origen.color}">
                        ${trans.estado_origen.nombre}
                    </span>
                    <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                    </svg>
                    <span class="px-3 py-1 rounded text-sm" style="background-color: ${trans.estado_destino.color}20; color: ${trans.estado_destino.color}">
                        ${trans.estado_destino.nombre}
                    </span>
                    <span class="flex-1 text-sm text-gray-600">${trans.nombre || 'Sin nombre'}</span>
                    <button onclick="editarTransicion(${trans.id})" class="text-blue-600 hover:text-blue-800 p-1">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                    </button>
                    <button onclick="eliminarTransicion(${trans.id})" class="text-red-600 hover:text-red-800 p-1">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>
                </div>
            `;
        });
        html += '</div>';
    }
    
    html += '</div>';
    diagrama.innerHTML = html;
}

/**
 * Renderizar lista de transiciones
 */
function renderizarListaTransiciones() {
    const lista = document.getElementById('lista_transiciones');
    if (!lista) return;
    
    const transiciones = window.transicionesConfiguradas || [];
    
    if (transiciones.length === 0) {
        lista.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <p>No hay transiciones configuradas</p>
                <p class="text-sm mt-2">Haz clic en "Nueva Transición" para agregar una</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    transiciones.forEach((trans, index) => {
        html += `
            <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                <div class="flex items-center justify-between">
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-2">
                            <span class="text-sm font-medium text-gray-900">${index + 1}. ${trans.nombre || 'Transición'}</span>
                            ${trans.es_flujo_basico ? '<span class="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">Flujo Básico</span>' : ''}
                        </div>
                        <div class="flex items-center gap-2 text-sm text-gray-600">
                            <span class="font-medium" style="color: ${trans.estado_origen.color}">${trans.estado_origen.nombre}</span>
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                            </svg>
                            <span class="font-medium" style="color: ${trans.estado_destino.color}">${trans.estado_destino.nombre}</span>
                        </div>
                        ${trans.descripcion ? `<p class="text-xs text-gray-500 mt-1">${trans.descripcion}</p>` : ''}
                        <div class="flex gap-2 mt-2">
                            ${trans.tiene_condiciones ? '<span class="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">Con condiciones</span>' : ''}
                            ${trans.tiene_acciones ? '<span class="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Con acciones</span>' : ''}
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="editarTransicion(${trans.id})" 
                            class="p-2 text-blue-600 hover:bg-blue-50 rounded transition">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                        </button>
                        <button onclick="eliminarTransicion(${trans.id})"
                            class="p-2 text-red-600 hover:bg-red-50 rounded transition">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    lista.innerHTML = html;
}

/**
 * Normalizar texto a formato slug
 * Convierte texto a minúsculas, elimina acentos y caracteres especiales
 */
function normalizarSlug(texto) {
    if (!texto) return '';
    
    // Mapa de caracteres con acentos y sus equivalentes sin acentos
    const acentos = {
        'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
        'Á': 'a', 'É': 'e', 'Í': 'i', 'Ó': 'o', 'Ú': 'u',
        'à': 'a', 'è': 'e', 'ì': 'i', 'ò': 'o', 'ù': 'u',
        'À': 'a', 'È': 'e', 'Ì': 'i', 'Ò': 'o', 'Ù': 'u',
        'ä': 'a', 'ë': 'e', 'ï': 'i', 'ö': 'o', 'ü': 'u',
        'Ä': 'a', 'Ë': 'e', 'Ï': 'i', 'Ö': 'o', 'Ü': 'u',
        'â': 'a', 'ê': 'e', 'î': 'i', 'ô': 'o', 'û': 'u',
        'Â': 'a', 'Ê': 'e', 'Î': 'i', 'Ô': 'o', 'Û': 'u',
        'ã': 'a', 'õ': 'o', 'ñ': 'n',
        'Ã': 'a', 'Õ': 'o', 'Ñ': 'n',
        'ç': 'c', 'Ç': 'c'
    };
    
    // Convertir a minúsculas
    let slug = texto.toLowerCase();
    
    // Reemplazar caracteres con acentos
    slug = slug.split('').map(char => acentos[char] || char).join('');
    
    // Reemplazar espacios y caracteres especiales por guiones
    slug = slug
        .replace(/[^a-z0-9]+/g, '-')  // Reemplazar caracteres no alfanuméricos por guiones
        .replace(/^-+|-+$/g, '')       // Eliminar guiones al inicio y final
        .replace(/-+/g, '-');          // Reemplazar múltiples guiones por uno solo
    
    return slug;
}

/**
 * Generar slug automáticamente desde el nombre del tipo de solicitud
 */
function generarSlugTipoSolicitud() {
    const nombreInput = document.getElementById('wizard_nombre');
    const slugInput = document.getElementById('wizard_slug');
    
    if (!nombreInput || !slugInput) return;
    
    // Solo generar si el slug está vacío o no ha sido modificado manualmente
    if (!slugInput.dataset.manuallyEdited) {
        const slug = normalizarSlug(nombreInput.value);
        slugInput.value = slug;
    }
}

/**
 * Regenerar slug manualmente desde el nombre
 */
function regenerarSlugTipo() {
    const nombreInput = document.getElementById('wizard_nombre');
    const slugInput = document.getElementById('wizard_slug');
    
    if (!nombreInput || !slugInput) return;
    
    const slug = normalizarSlug(nombreInput.value);
    slugInput.value = slug;
    delete slugInput.dataset.manuallyEdited;
}

function agregarValidacionTiempoReal() {
    const campos = ['codigo', 'nombre', 'slug', 'descripcion', 'categoria_id', 'area_responsable_id', 'dias_respuesta', 'dias_alerta'];
    
    // Detectar edición manual del slug
    const slugInput = document.getElementById('wizard_slug');
    if (slugInput) {
        slugInput.addEventListener('input', function() {
            this.dataset.manuallyEdited = 'true';
            const slug = normalizarSlug(this.value);
            this.value = slug;
        });
    }
    
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
            
        case 'slug':
            if (!input.value) {
                esValido = false;
                mensaje = 'Este campo es obligatorio';
            } else if (!/^[a-z0-9-]+$/.test(input.value)) {
                esValido = false;
                mensaje = 'Solo letras minúsculas, números y guiones';
            }
            break;

        case 'categoria_id':
        case 'area_responsable_id':
            if (!input.value) {
                esValido = false;
                mensaje = 'Este campo es obligatorio';
            }
            break;
            
        case 'dias_respuesta':
        case 'dias_alerta':
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
        <div class="space-y-6">
            <!-- Header Info -->
            <div class="bg-blue-50 border-l-4 border-blue-500 p-4">
                <p class="text-sm text-blue-700">
                    <strong>Paso 2 de 3:</strong> Configura el flujo de aprobación para este tipo de solicitud.
                    Define los estados y transiciones permitidas.
                </p>
            </div>

            <!-- Selector de Flujo -->
            <div class="bg-white border border-gray-200 rounded-lg p-4">
                <h4 class="text-lg font-semibold text-gray-800 mb-4">🔄 Tipo de Flujo</h4>
                <div class="space-y-3">
                    <label class="flex items-center cursor-pointer">
                        <input type="radio" name="tipo_flujo" value="basico" checked
                            class="w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500">
                        <div class="ml-3">
                            <span class="text-sm font-medium text-gray-900">Flujo Básico (Por Defecto)</span>
                            <p class="text-xs text-gray-500">Utilizar el flujo estándar configurado en el sistema</p>
                        </div>
                    </label>
                    <label class="flex items-center cursor-pointer">
                        <input type="radio" name="tipo_flujo" value="personalizado"
                            class="w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500">
                        <div class="ml-3">
                            <span class="text-sm font-medium text-gray-900">Flujo Personalizado</span>
                            <p class="text-xs text-gray-500">Crear transiciones específicas para este tipo</p>
                        </div>
                    </label>
                </div>
            </div>

            <!-- Contenedor de Flujo Personalizado (oculto inicialmente) -->
            <div id="flujo_personalizado_container" class="hidden space-y-6">
                <!-- Diagrama Visual -->
                <div class="bg-white border border-gray-200 rounded-lg p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h4 class="text-lg font-semibold text-gray-800">📊 Diagrama de Flujo</h4>
                        <button type="button" onclick="abrirModalNuevaTransicion()"
                            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center text-sm transition">
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                            </svg>
                            Nueva Transición
                        </button>
                    </div>
                    
                    <!-- Canvas para el diagrama -->
                    <div id="diagrama_flujo" class="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 min-h-[400px] relative overflow-auto">
                        <div class="absolute inset-0 flex items-center justify-center text-gray-400">
                            <div class="text-center">
                                <svg class="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                                </svg>
                                <p>El diagrama se cargará aquí</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Lista de Transiciones Configuradas -->
                <div class="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 class="text-lg font-semibold text-gray-800 mb-4">📋 Transiciones Configuradas</h4>
                    <div id="lista_transiciones" class="space-y-2">
                        <div class="text-center text-gray-500 py-8">
                            <p>No hay transiciones configuradas</p>
                            <p class="text-sm mt-2">Haz clic en "Nueva Transición" para agregar una</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Info del Flujo Básico -->
            <div id="flujo_basico_info" class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                <div class="flex items-start">
                    <svg class="w-8 h-8 text-blue-600 mt-1 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <div>
                        <h5 class="font-semibold text-blue-900 text-lg mb-2">Flujo Básico del Sistema</h5>
                        <p class="text-blue-700 text-sm mb-3">
                            Este tipo de solicitud utilizará el flujo estándar configurado en el sistema:
                        </p>
                        <div class="flex items-center space-x-2 text-sm">
                            <span class="px-3 py-1 bg-blue-600 text-white rounded-full">📥 Radicada</span>
                            <span>→</span>
                            <span class="px-3 py-1 bg-yellow-600 text-white rounded-full">🔍 En Revisión</span>
                            <span>→</span>
                            <span class="px-3 py-1 bg-purple-600 text-white rounded-full">✅ En Aprobación</span>
                            <span>→</span>
                            <span class="px-3 py-1 bg-green-600 text-white rounded-full">✓ Aprobada</span>
                        </div>
                        <p class="text-xs text-blue-600 mt-3">
                            Puedes personalizar el flujo después de crear el tipo de solicitud.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function generarPaso3() {
    return `
        <div class="space-y-6">
            <div class="bg-blue-50 border-l-4 border-blue-500 p-4">
                <p class="text-sm text-blue-700">
                    <strong>Paso 3 de 3:</strong> Selecciona las plantillas de documentos que se generarán para este tipo de solicitud.
                </p>
            </div>

            <!-- Filtros de búsqueda -->
            <div class="bg-white border border-gray-200 rounded-lg p-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Buscar Plantilla</label>
                        <input type="text" id="buscarPlantilla" placeholder="Buscar por nombre..."
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Tipo de Documento</label>
                        <select id="filtroTipoDocumento"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            <option value="">Todos los tipos</option>
                            <option value="certificado">Certificado</option>
                            <option value="concepto_tecnico">Concepto Técnico</option>
                            <option value="acta">Acta</option>
                            <option value="resolucion">Resolución</option>
                            <option value="oficio">Oficio</option>
                            <option value="otro">Otro</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Plantillas Seleccionadas -->
            <div id="plantillasSeleccionadas" class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 class="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    📋 Plantillas Seleccionadas
                    <span id="contadorPlantillas" class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">0</span>
                </h4>
                <div id="listaPlantillasSeleccionadas" class="space-y-2">
                    <p class="text-sm text-gray-500 italic">No hay plantillas seleccionadas aún</p>
                </div>
            </div>

            <!-- Lista de Plantillas Disponibles -->
            <div class="border border-gray-200 rounded-lg p-4">
                <h4 class="text-md font-semibold text-gray-800 mb-4">Plantillas Disponibles</h4>
                <div id="listaPlantillasDisponibles" class="space-y-3">
                    <div class="flex justify-center py-8">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                </div>
            </div>

            <!-- Información adicional -->
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p class="text-sm text-yellow-800">
                    <strong>💡 Nota:</strong> Puedes seleccionar múltiples plantillas. Cada plantilla se puede configurar
                    para generarse automáticamente al aprobar o completar la solicitud, o generarse manualmente.
                </p>
            </div>
        </div>
    `;
}

function generarPaso4() {
    // Generar resumen con los datos guardados del paso 1
    const datos = datosWizardTemp.paso1 || {};

    const codigo = datos.wizard_codigo || '';
    const nombre = datos.wizard_nombre || '';
    const slug = datos.wizard_slug || '';
    const descripcion = datos.wizard_descripcion || '';
    const instrucciones = datos.wizard_instrucciones || '';
    const diasRespuesta = datos.wizard_dias_respuesta || '';
    const diasAlerta = datos.wizard_dias_alerta || '';
    const sla = datos.wizard_sla || '';
    const requiereAprobacion = datos.wizard_requiere_aprobacion || false;
    const requierePago = datos.wizard_requiere_pago || false;
    const requiereDocumentos = datos.wizard_requiere_documentos || false;
    const valorTramite = datos.wizard_valor_tramite || '0.00';
    const icono = datos.wizard_icono || '📄';
    const color = datos.wizard_color || '#3B82F6';

    // Buscar los textos de categoría y área en los arrays guardados
    const categoriaId = datos.wizard_categoria_id;
    const areaId = datos.wizard_area_responsable_id;

    const categoriaTexto = window.categoriasDisponibles?.find(c => c.id == categoriaId)?.nombre || '';
    const areaTexto = window.areasDisponibles?.find(a => a.id == areaId)?.nombre || '';
    
    return `
        <div class="space-y-6">
            <div class="bg-blue-50 border-l-4 border-blue-500 p-4">
                <p class="text-sm text-blue-700">
                    <strong>Paso 3 de 3:</strong> Revisa la configuración antes de crear el tipo de solicitud.
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
                            <span class="text-gray-500">Slug:</span>
                            <span class="font-mono text-xs font-medium ml-2 text-blue-600">${slug}</span>
                        </div>
                        <div>
                            <span class="text-gray-500">Categoría:</span>
                            <span class="font-medium ml-2">${categoriaTexto}</span>
                        </div>
                        <div>
                            <span class="text-gray-500">Área Responsable:</span>
                            <span class="font-medium ml-2">${areaTexto}</span>
                        </div>
                        <div class="col-span-2">
                            <span class="text-gray-500">Descripción:</span>
                            <p class="text-gray-700 mt-1">${descripcion}</p>
                        </div>
                        ${instrucciones ? `<div class="col-span-2">
                            <span class="text-gray-500">Instrucciones:</span>
                            <p class="text-gray-700 mt-1 text-sm">${instrucciones}</p>
                        </div>` : ''}
                    </div>
                </div>
                
                <!-- Tiempos y Configuración -->
                <div class="border border-gray-200 rounded-lg p-4">
                    <h5 class="font-semibold text-gray-800 mb-2">⏱️ Tiempos de Gestión</h5>
                    <div class="grid grid-cols-3 gap-3 text-sm">
                        <div>
                            <span class="text-gray-500">Días de Respuesta:</span>
                            <span class="font-medium ml-2">${diasRespuesta} días</span>
                        </div>
                        <div>
                            <span class="text-gray-500">Días de Alerta:</span>
                            <span class="font-medium ml-2">${diasAlerta} días</span>
                        </div>
                        ${sla ? `<div>
                            <span class="text-gray-500">SLA:</span>
                            <span class="font-medium ml-2">${sla} días</span>
                        </div>` : '<div></div>'}
                        <div>
                            <span class="text-gray-500">Color:</span>
                            <span class="inline-block w-6 h-6 rounded ml-2 border border-gray-300" style="background-color: ${color};"></span>
                            <span class="ml-1 text-xs">${color}</span>
                        </div>
                        <div>
                            <span class="text-gray-500">Icono:</span>
                            <span class="text-2xl ml-2">${icono}</span>
                        </div>
                    </div>
                </div>
                
                <!-- Opciones -->
                <div class="border border-gray-200 rounded-lg p-4">
                    <h5 class="font-semibold text-gray-800 mb-2">✓ Opciones Activas</h5>
                    <div class="flex flex-wrap gap-2">
                        ${requiereAprobacion ? '<span class="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">Requiere Aprobación</span>' : ''}
                        ${requierePago ? `<span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Requiere Pago ($${valorTramite})</span>` : ''}
                        ${requiereDocumentos ? '<span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">Requiere Documentos</span>' : ''}
                        ${!requiereAprobacion && !requierePago && !requiereDocumentos ? '<span class="text-gray-500 text-sm">Sin opciones adicionales</span>' : ''}
                    </div>
                </div>
                
                <!-- Plantillas Configuradas -->
                ${generarResumenPlantillas()}
            </div>
        </div>
    `;
}

/**
 * Generar resumen de plantillas seleccionadas
 */
function generarResumenPlantillas() {
    if (!window.plantillasSeleccionadas || window.plantillasSeleccionadas.length === 0) {
        return `
            <div class="border border-gray-200 rounded-lg p-4">
                <h5 class="font-semibold text-gray-800 mb-2">📄 Plantillas de Documentos</h5>
                <p class="text-sm text-gray-500 italic">No se seleccionaron plantillas para este tipo de solicitud</p>
            </div>
        `;
    }

    const plantillasHTML = window.plantillasSeleccionadas.map((plantilla, index) => {
        const tipoLabel = obtenerLabelTipoDocumento(plantilla.tipo_documento);
        const momentoLabel = {
            'al_aprobar': 'Al Aprobar',
            'al_completar': 'Al Completar',
            'manual': 'Manual'
        }[plantilla.momento_generacion] || plantilla.momento_generacion;

        return `
            <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div class="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center font-semibold text-sm">
                    ${index + 1}
                </div>
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                        <h6 class="font-medium text-gray-800">${plantilla.nombre}</h6>
                        ${plantilla.es_principal ? '<span class="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-medium">Principal</span>' : ''}
                        ${plantilla.generar_automatico ? '<span class="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">Auto</span>' : ''}
                    </div>
                    <div class="flex items-center gap-3 text-xs text-gray-600">
                        <span>📋 ${tipoLabel}</span>
                        <span>⏱️ ${momentoLabel}</span>
                        <span>🔧 ${plantilla.total_variables || 0} variables</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    return `
        <div class="border border-gray-200 rounded-lg p-4">
            <h5 class="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                📄 Plantillas de Documentos
                <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    ${window.plantillasSeleccionadas.length}
                </span>
            </h5>
            <div class="space-y-2">
                ${plantillasHTML}
            </div>
        </div>
    `;
}

// ========================================
// GESTIÓN DE TRANSICIONES
// ========================================

/**
 * Abrir modal para crear nueva transición
 */
function abrirModalNuevaTransicion() {
    if (!window.estadosDisponibles || window.estadosDisponibles.length === 0) {
        Swal.fire({
            icon: 'warning',
            title: 'Sin estados disponibles',
            text: 'No hay estados configurados en el sistema'
        });
        return;
    }
    
    const modalHTML = crearModalTransicion();
    
    // Convertir string HTML a nodo DOM
    const div = document.createElement('div');
    div.innerHTML = modalHTML;
    const modalNode = div.firstElementChild;
    
    document.body.appendChild(modalNode);
    cargarEstadosEnModal();
}

/**
 * Crear modal de transición
 */
function crearModalTransicion(transicion = null) {
    const esEdicion = transicion !== null;
    const estados = window.estadosDisponibles || [];
    
    return `
        <div id="modalTransicion" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div class="relative bg-white rounded-lg shadow-xl w-11/12 max-w-4xl max-h-[90vh] overflow-hidden">
                <!-- Header -->
                <div class="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                    <div class="flex items-center justify-between">
                        <h3 class="text-xl font-semibold">${esEdicion ? 'Editar Transición' : '+ Nueva Transición'}</h3>
                        <button onclick="cerrarModalTransicion()" class="text-white hover:text-gray-200">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <!-- Body -->
                <div class="px-6 py-4 overflow-y-auto" style="max-height: calc(90vh - 140px);">
                    <form id="formTransicion" class="space-y-6">
                        <!-- Estados -->
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                    Estado Origen <span class="text-red-500">*</span>
                                </label>
                                <select id="trans_estado_origen" required
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                    <option value="">Seleccione estado origen</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                    Estado Destino <span class="text-red-500">*</span>
                                </label>
                                <select id="trans_estado_destino" required
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                    <option value="">Seleccione estado destino</option>
                                </select>
                            </div>
                        </div>
                        
                        <!-- Nombre y Descripción -->
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                    Nombre de la Transición
                                </label>
                                <input type="text" id="trans_nombre" 
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Ej: Aprobar, Rechazar, Revisar">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                    Texto del Botón
                                </label>
                                <input type="text" id="trans_texto_boton" 
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Ej: Aprobar Solicitud">
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Descripción
                            </label>
                            <textarea id="trans_descripcion" rows="2"
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Descripción de cuándo y cómo usar esta transición"></textarea>
                        </div>
                        
                        <!-- Quién puede ejecutar -->
                        <div class="border border-gray-200 rounded-lg p-4">
                            <h4 class="text-sm font-semibold text-gray-800 mb-3">👥 Quién Puede Ejecutar</h4>
                            <div class="space-y-2">
                                <label class="flex items-center cursor-pointer">
                                    <input type="checkbox" value="Super Administrador" class="rol-permitido w-4 h-4 text-blue-600 rounded">
                                    <span class="ml-2 text-sm">Super Administrador</span>
                                </label>
                                <label class="flex items-center cursor-pointer">
                                    <input type="checkbox" value="Director OAPM" class="rol-permitido w-4 h-4 text-blue-600 rounded">
                                    <span class="ml-2 text-sm">Director OAPM</span>
                                </label>
                                <label class="flex items-center cursor-pointer">
                                    <input type="checkbox" value="Coordinador de Área" class="rol-permitido w-4 h-4 text-blue-600 rounded">
                                    <span class="ml-2 text-sm">Coordinador del Área</span>
                                </label>
                                <label class="flex items-center cursor-pointer">
                                    <input type="checkbox" value="Líder de Equipo" class="rol-permitido w-4 h-4 text-blue-600 rounded">
                                    <span class="ml-2 text-sm">Líder del Equipo</span>
                                </label>
                                <label class="flex items-center cursor-pointer">
                                    <input type="checkbox" value="Funcionario" class="rol-permitido w-4 h-4 text-blue-600 rounded">
                                    <span class="ml-2 text-sm">Cualquier Funcionario</span>
                                </label>
                            </div>
                            <div class="mt-3 pt-3 border-t border-gray-200">
                                <label class="flex items-center cursor-pointer">
                                    <input type="checkbox" id="trans_solo_asignado" class="w-4 h-4 text-blue-600 rounded">
                                    <span class="ml-2 text-sm font-medium text-gray-700">Solo funcionario asignado</span>
                                </label>
                            </div>
                        </div>
                        
                        <!-- Condiciones -->
                        <div class="border border-gray-200 rounded-lg p-4">
                            <h4 class="text-sm font-semibold text-gray-800 mb-3">⚙️ Condiciones</h4>
                            <div class="space-y-2">
                                <label class="flex items-center cursor-pointer">
                                    <input type="checkbox" id="trans_requiere_comentario" class="w-4 h-4 text-blue-600 rounded">
                                    <span class="ml-2 text-sm">Requiere comentario obligatorio</span>
                                </label>
                                <label class="flex items-center cursor-pointer">
                                    <input type="checkbox" id="trans_requiere_documento" class="w-4 h-4 text-blue-600 rounded">
                                    <span class="ml-2 text-sm">Requiere adjuntar documento</span>
                                </label>
                                <label class="flex items-center cursor-pointer">
                                    <input type="checkbox" id="trans_requiere_aprobacion" class="w-4 h-4 text-blue-600 rounded">
                                    <span class="ml-2 text-sm">Requiere aprobación previa</span>
                                </label>
                                <div class="flex items-center gap-2">
                                    <input type="checkbox" id="trans_check_dias" class="w-4 h-4 text-blue-600 rounded">
                                    <span class="text-sm">Solo si han pasado</span>
                                    <input type="number" id="trans_minimo_dias" min="1" max="365"
                                        class="w-20 px-2 py-1 border border-gray-300 rounded text-sm" placeholder="0">
                                    <span class="text-sm">días</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Acciones Automáticas -->
                        <div class="border border-gray-200 rounded-lg p-4">
                            <h4 class="text-sm font-semibold text-gray-800 mb-3">🤖 Acciones Automáticas</h4>
                            <div class="grid grid-cols-2 gap-3">
                                <label class="flex items-center cursor-pointer">
                                    <input type="checkbox" id="trans_reasignar" class="w-4 h-4 text-blue-600 rounded">
                                    <span class="ml-2 text-sm">Reasignar funcionario</span>
                                </label>
                                <label class="flex items-center cursor-pointer">
                                    <input type="checkbox" id="trans_cambiar_prioridad" class="w-4 h-4 text-blue-600 rounded">
                                    <span class="ml-2 text-sm">Cambiar prioridad</span>
                                </label>
                                <label class="flex items-center cursor-pointer">
                                    <input type="checkbox" id="trans_recalcular_fecha" class="w-4 h-4 text-blue-600 rounded">
                                    <span class="ml-2 text-sm">Recalcular fecha</span>
                                </label>
                                <label class="flex items-center cursor-pointer">
                                    <input type="checkbox" id="trans_generar_doc" class="w-4 h-4 text-blue-600 rounded">
                                    <span class="ml-2 text-sm">Generar documento</span>
                                </label>
                                <label class="flex items-center cursor-pointer">
                                    <input type="checkbox" id="trans_enviar_notif" class="w-4 h-4 text-blue-600 rounded" checked>
                                    <span class="ml-2 text-sm">Enviar notificaciones</span>
                                </label>
                                <label class="flex items-center cursor-pointer">
                                    <input type="checkbox" id="trans_registrar_audit" class="w-4 h-4 text-blue-600 rounded" checked>
                                    <span class="ml-2 text-sm">Registrar en auditoría</span>
                                </label>
                            </div>
                        </div>
                        
                        <!-- Confirmación -->
                        <div class="border border-gray-200 rounded-lg p-4">
                            <label class="flex items-center cursor-pointer">
                                <input type="checkbox" id="trans_requiere_confirmacion" class="w-4 h-4 text-blue-600 rounded" checked>
                                <span class="ml-2 text-sm font-medium">Requiere confirmación antes de ejecutar</span>
                            </label>
                            <div id="campo_mensaje_confirmacion" class="mt-3">
                                <input type="text" id="trans_mensaje_confirmacion" 
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                                    placeholder="¿Está seguro de aprobar esta solicitud?">
                            </div>
                        </div>
                    </form>
                </div>
                
                <!-- Footer -->
                <div class="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
                    <button type="button" onclick="cerrarModalTransicion()"
                        class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition">
                        Cancelar
                    </button>
                    <button type="button" onclick="guardarTransicion()"
                        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
                        ${esEdicion ? 'Actualizar' : 'Crear'} Transición
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Cargar estados en el modal
 */
function cargarEstadosEnModal() {
    const estados = window.estadosDisponibles || [];
    
    const selectOrigen = document.getElementById('trans_estado_origen');
    const selectDestino = document.getElementById('trans_estado_destino');
    
    estados.forEach(estado => {
        const optionOrigen = document.createElement('option');
        optionOrigen.value = estado.id;
        optionOrigen.textContent = `${estado.icono} ${estado.nombre}`;
        selectOrigen.appendChild(optionOrigen);
        
        const optionDestino = document.createElement('option');
        optionDestino.value = estado.id;
        optionDestino.textContent = `${estado.icono} ${estado.nombre}`;
        selectDestino.appendChild(optionDestino);
    });
}

/**
 * Cerrar modal de transición
 */
function cerrarModalTransicion() {
    const modal = document.getElementById('modalTransicion');
    if (modal) {
        modal.remove();
    }
}

/**
 * Guardar transición (crear o actualizar)
 */
async function guardarTransicion() {
    const form = document.getElementById('formTransicion');
    const transicionId = form?.dataset.transicionId; // Si existe, es edición
    const esEdicion = !!transicionId;
    
    const estadoOrigen = document.getElementById('trans_estado_origen').value;
    const estadoDestino = document.getElementById('trans_estado_destino').value;
    
    if (!estadoOrigen || !estadoDestino) {
        Swal.fire({
            icon: 'warning',
            title: 'Campos incompletos',
            text: 'Debe seleccionar estado origen y destino'
        });
        return;
    }
    
    if (estadoOrigen === estadoDestino) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'El estado origen y destino no pueden ser el mismo'
        });
        return;
    }
    
    // Obtener roles permitidos
    const rolesPermitidos = Array.from(document.querySelectorAll('.rol-permitido:checked'))
        .map(cb => cb.value);
    
    const datos = {
        tipo_solicitud_id: tipoIdCreado,
        estado_origen_id: parseInt(estadoOrigen),
        estado_destino_id: parseInt(estadoDestino),
        nombre: document.getElementById('trans_nombre').value || null,
        descripcion: document.getElementById('trans_descripcion').value || null,
        roles_permitidos: rolesPermitidos.length > 0 ? rolesPermitidos : null,
        solo_funcionario_asignado: document.getElementById('trans_solo_asignado').checked,
        requiere_comentario: document.getElementById('trans_requiere_comentario').checked,
        requiere_documento: document.getElementById('trans_requiere_documento').checked,
        requiere_aprobacion_previa: document.getElementById('trans_requiere_aprobacion').checked,
        minimo_dias_transcurridos: document.getElementById('trans_check_dias').checked 
            ? parseInt(document.getElementById('trans_minimo_dias').value) 
            : null,
        reasignar_funcionario: document.getElementById('trans_reasignar').checked,
        recalcular_fecha_vencimiento: document.getElementById('trans_recalcular_fecha').checked,
        generar_documento: document.getElementById('trans_generar_doc').checked,
        enviar_notificaciones: document.getElementById('trans_enviar_notif').checked,
        registrar_auditoria: document.getElementById('trans_registrar_audit').checked,
        requiere_confirmacion: document.getElementById('trans_requiere_confirmacion').checked,
        mensaje_confirmacion: document.getElementById('trans_mensaje_confirmacion').value || null,
        texto_boton: document.getElementById('trans_texto_boton').value || null,
        activo: true
    };
    
    try {
        // Determinar URL y método según sea creación o edición
        const url = esEdicion 
            ? `/admin/api/configuracion/flujos-transiciones/${transicionId}`
            : '/admin/api/configuracion/flujos-transiciones';
        
        const method = esEdicion ? 'PUT' : 'POST';
        
        console.log(`${method} ${url}`, datos);
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
            },
            body: JSON.stringify(datos)
        });
        
        const result = await response.json();
        
        if (result.success) {
            Swal.fire({
                icon: 'success',
                title: '¡Éxito!',
                text: esEdicion ? 'Transición actualizada exitosamente' : 'Transición creada exitosamente',
                timer: 2000,
                showConfirmButton: false
            });
            
            cerrarModalTransicion();
            cargarTransicionesConfiguradas();
        } else {
            throw new Error(result.message || 'Error al guardar');
        }
    } catch (error) {
        console.error('Error al guardar transición:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message || 'No se pudo guardar la transición'
        });
    }
}

/**
 * Editar transición existente
 */
async function editarTransicion(id) {
    try {
        console.log('Cargando transición para editar:', id);
        
        // Cargar datos de la transición
        const response = await fetch(`/admin/api/configuracion/flujos-transiciones/${id}`, {
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
            }
        });
        
        if (!response.ok) {
            throw new Error('No se pudo cargar la transición');
        }
        
        const data = await response.json();
        console.log('Transición cargada:', data);
        
        if (!data.success) {
            throw new Error(data.message || 'Error al cargar transición');
        }
        
        const transicion = data.transicion;
        
        // Abrir modal
        const modalHTML = crearModalTransicion(transicion);
        const div = document.createElement('div');
        div.innerHTML = modalHTML;
        const modalNode = div.firstElementChild;
        
        document.body.appendChild(modalNode);
        
        // Poblar estados
        cargarEstadosEnModal();
        
        // Esperar un poco para que se carguen los selects
        setTimeout(() => {
            poblarDatosTransicion(transicion);
        }, 100);
        
    } catch (error) {
        console.error('Error al editar transición:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message || 'No se pudo cargar la transición'
        });
    }
}

/**
 * Poblar datos de transición en el modal (para edición)
 */
function poblarDatosTransicion(transicion) {
    console.log('Poblando datos en modal:', transicion);
    
    // Estados
    const selectOrigen = document.getElementById('trans_estado_origen');
    const selectDestino = document.getElementById('trans_estado_destino');
    
    if (selectOrigen && transicion.estado_origen_id) {
        selectOrigen.value = transicion.estado_origen_id;
        selectOrigen.disabled = true; // No permitir cambiar en edición
        selectOrigen.classList.add('bg-gray-100', 'cursor-not-allowed');
    }
    
    if (selectDestino && transicion.estado_destino_id) {
        selectDestino.value = transicion.estado_destino_id;
        selectDestino.disabled = true; // No permitir cambiar en edición
        selectDestino.classList.add('bg-gray-100', 'cursor-not-allowed');
    }
    
    // Agregar mensaje informativo de edición
    const form = document.getElementById('formTransicion');
    if (form && !document.getElementById('mensaje_edicion')) {
        const mensajeEdicion = document.createElement('div');
        mensajeEdicion.id = 'mensaje_edicion';
        mensajeEdicion.className = 'bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4';
        mensajeEdicion.innerHTML = `
            <div class="flex items-start">
                <svg class="w-5 h-5 text-yellow-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                </svg>
                <div>
                    <p class="text-sm font-medium text-yellow-800">Editando Transición</p>
                    <p class="text-xs text-yellow-700 mt-1">Los estados origen y destino no se pueden modificar. Para cambiarlos, elimina esta transición y crea una nueva.</p>
                </div>
            </div>
        `;
        form.insertBefore(mensajeEdicion, form.firstChild);
    }
    
    // Textos
    if (transicion.nombre) {
        document.getElementById('trans_nombre').value = transicion.nombre;
    }
    
    if (transicion.texto_boton) {
        document.getElementById('trans_texto_boton').value = transicion.texto_boton;
    }
    
    if (transicion.descripcion) {
        document.getElementById('trans_descripcion').value = transicion.descripcion;
    }
    
    // Roles permitidos
    if (transicion.roles_permitidos && Array.isArray(transicion.roles_permitidos)) {
        document.querySelectorAll('.rol-permitido').forEach(checkbox => {
            if (transicion.roles_permitidos.includes(checkbox.value)) {
                checkbox.checked = true;
            }
        });
    }
    
    // Solo funcionario asignado
    if (transicion.solo_funcionario_asignado) {
        document.getElementById('trans_solo_asignado').checked = true;
    }
    
    // Condiciones
    document.getElementById('trans_requiere_comentario').checked = transicion.requiere_comentario || false;
    document.getElementById('trans_requiere_documento').checked = transicion.requiere_documento || false;
    document.getElementById('trans_requiere_aprobacion').checked = transicion.requiere_aprobacion_previa || false;
    
    if (transicion.minimo_dias_transcurridos) {
        document.getElementById('trans_check_dias').checked = true;
        document.getElementById('trans_minimo_dias').value = transicion.minimo_dias_transcurridos;
    }
    
    // Acciones automáticas
    document.getElementById('trans_reasignar').checked = transicion.reasignar_funcionario || false;
    document.getElementById('trans_cambiar_prioridad').checked = !!transicion.cambiar_prioridad_a;
    document.getElementById('trans_recalcular_fecha').checked = transicion.recalcular_fecha_vencimiento || false;
    document.getElementById('trans_generar_doc').checked = transicion.generar_documento || false;
    document.getElementById('trans_enviar_notif').checked = transicion.enviar_notificaciones !== false;
    document.getElementById('trans_registrar_audit').checked = transicion.registrar_auditoria !== false;
    
    // Confirmación
    document.getElementById('trans_requiere_confirmacion').checked = transicion.requiere_confirmacion !== false;
    
    if (transicion.mensaje_confirmacion) {
        document.getElementById('trans_mensaje_confirmacion').value = transicion.mensaje_confirmacion;
    }
    
    // Guardar ID para actualización
    document.getElementById('formTransicion').dataset.transicionId = transicion.id;
}

/**
 * Eliminar transición
 */
async function eliminarTransicion(id) {
    const confirmado = await Swal.fire({
        title: '¿Eliminar transición?',
        text: 'Esta acción no se puede deshacer',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#DC2626',
        cancelButtonColor: '#6B7280',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });
    
    if (confirmado.isConfirmed) {
        try {
            const response = await fetch(`/admin/api/configuracion/flujos-transiciones/${id}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Eliminada',
                    text: 'Transición eliminada exitosamente',
                    timer: 2000,
                    showConfirmButton: false
                });
                
                cargarTransicionesConfiguradas();
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo eliminar la transición'
            });
        }
    }
}

/**
 * Ver detalles de un estado
 */
function verDetallesEstado(id) {
    const estado = window.estadosDisponibles.find(e => e.id === id);
    if (!estado) return;
    
    Swal.fire({
        title: `${estado.icono} ${estado.nombre}`,
        html: `
            <div class="text-left space-y-2">
                <p class="text-sm text-gray-600">${estado.descripcion || 'Sin descripción'}</p>
                <div class="border-t pt-2 mt-2">
                    <div class="grid grid-cols-2 gap-2 text-sm">
                        <div><span class="font-medium">Tipo:</span> ${estado.tipo}</div>
                        <div><span class="font-medium">Color:</span> <span class="inline-block w-4 h-4 rounded" style="background:${estado.color}"></span></div>
                    </div>
                </div>
            </div>
        `,
        icon: 'info',
        confirmButtonText: 'Cerrar'
    });
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
    console.log('========================================');
    console.log('🔍 VALIDANDO Y GUARDANDO PASO 1');
    console.log('========================================');
    console.log('📌 tipoIdCreado actual:', tipoIdCreado);
    console.log('📌 datosWizardTemp.tipoIdCreado:', datosWizardTemp.tipoIdCreado);
    
    // Asegurar que tipoIdCreado esté actualizado
    if (!tipoIdCreado && datosWizardTemp.tipoIdCreado) {
        tipoIdCreado = datosWizardTemp.tipoIdCreado;
        console.log('🔄 Restaurado tipoIdCreado de datosWizardTemp:', tipoIdCreado);
    }
    
    console.log('📌 tipoIdCreado FINAL a usar:', tipoIdCreado);
    
    // Validar todos los campos obligatorios
    const camposObligatorios = ['codigo', 'nombre', 'slug', 'descripcion', 'categoria_id', 'area_responsable_id', 'dias_respuesta', 'dias_alerta'];
    let todosValidos = true;
    
    for (const campo of camposObligatorios) {
        const esValido = validarCampoPaso1(campo);
        if (!esValido) {
            todosValidos = false;
            console.error(`❌ Campo inválido: ${campo}`);
        }
    }
    
    if (!todosValidos) {
        mostrarAdvertencia('Por favor, completa todos los campos obligatorios correctamente');
        return false;
    }
    
    // Preparar datos del paso 1
    const diasRespuesta = parseInt(document.getElementById('wizard_dias_respuesta').value);
    const diasAlerta = parseInt(document.getElementById('wizard_dias_alerta').value);
    
    // Validar área antes de preparar datos
    const areaSelect = document.getElementById('wizard_area_responsable_id');
    const areaValue = areaSelect ? areaSelect.value : null;
    
    console.log('🔍 Área responsable:', {
        select: areaSelect,
        value: areaValue,
        options: areaSelect ? areaSelect.options.length : 0
    });
    
    if (!areaValue || areaValue === '') {
        console.error('❌ Área responsable no seleccionada');
        mostrarAdvertencia('Debe seleccionar un área responsable');
        return false;
    }
    
    const datos = {
        codigo: document.getElementById('wizard_codigo').value.trim(),
        nombre: document.getElementById('wizard_nombre').value.trim(),
        slug: document.getElementById('wizard_slug').value.trim(),
        descripcion: document.getElementById('wizard_descripcion').value.trim(),
        instrucciones: document.getElementById('wizard_instrucciones').value.trim() || null,
        categoria_id: parseInt(document.getElementById('wizard_categoria_id').value),
        area_responsable_id: parseInt(areaValue),
        dias_respuesta: diasRespuesta,
        dias_alerta: diasAlerta,
        // Campos obligatorios por constraints de BD
        dias_alerta_amarilla: Math.max(diasAlerta + 1, Math.floor(diasRespuesta * 0.6)),
        dias_alerta_roja: Math.max(1, Math.floor(diasRespuesta * 0.2)),
        tipo_dias: 'habiles',
        iniciar_conteo_desde: 'radicacion',
        sla_dias: document.getElementById('wizard_sla').value ? parseInt(document.getElementById('wizard_sla').value) : null,
        requiere_aprobacion: document.getElementById('wizard_requiere_aprobacion').checked,
        requiere_pago: document.getElementById('wizard_requiere_pago').checked,
        valor_tramite: document.getElementById('wizard_requiere_pago').checked ? parseFloat(document.getElementById('wizard_valor_tramite').value || 0) : null,
        tipo_valor: 'fijo',
        requiere_documentos: document.getElementById('wizard_requiere_documentos').checked,
        prioridad_defecto: 'normal',
        momento_generacion: 'al_aprobar',
        icono: document.getElementById('wizard_icono').value,
        color: document.getElementById('wizard_color').value,
        visible_portal: true,
        solo_usuarios_registrados: true,
        activo: false // Inactivo hasta finalizar
    };
    
    console.log('📦 Datos a enviar:', datos);
    console.log('========================================');
    
    try {
        // Si ya hay un tipo creado, actualizar; si no, crear
        let response;
        let method;
        let url;
        
        if (tipoIdCreado) {
            method = 'PUT';
            url = `/admin/api/tipos-solicitud/${tipoIdCreado}`;
            console.log('🔄🔄🔄 ACTUALIZANDO TIPO EXISTENTE 🔄🔄🔄');
            console.log(`   Método: ${method}`);
            console.log(`   URL: ${url}`);
            console.log(`   ID del tipo: ${tipoIdCreado}`);
            console.log(`   Código: ${datos.codigo}`);
            console.log(`   Slug: ${datos.slug}`);
            console.log('========================================');
            
            response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify(datos)
            });
        } else {
            method = 'POST';
            url = '/admin/api/tipos-solicitud';
            console.log('✨✨✨ CREANDO NUEVO TIPO ✨✨✨');
            console.log(`   Método: ${method}`);
            console.log(`   URL: ${url}`);
            console.log(`   Código: ${datos.codigo}`);
            console.log(`   Slug: ${datos.slug}`);
            console.log('========================================');
            
            response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify(datos)
            });
        }
        
        console.log(`📡 RESPUESTA: ${method} ${url} - Status: ${response.status}`);
        console.log('========================================');

        
        if (response.ok) {
            const jsonData = await response.json();
            console.log('✅ Respuesta exitosa COMPLETA:', jsonData);
            console.log('✅ Estructura de respuesta:', JSON.stringify(jsonData, null, 2));
            
            // Extraer el ID de diferentes formatos de respuesta
            const nuevoId = jsonData.id || jsonData.data?.id || jsonData.tipo?.id || jsonData.tipoSolicitud?.id;
            
            console.log('🔍 ID extraído de respuesta:', nuevoId);
            console.log('🔍 tipoIdCreado ANTES:', tipoIdCreado);
            
            // Guardar el ID del tipo creado o actualizado
            if (!tipoIdCreado && nuevoId) {
                tipoIdCreado = nuevoId;
                datosWizardTemp.tipoIdCreado = nuevoId; // Guardar inmediatamente
                console.log(`✅✅✅ TIPO CREADO CON ID: ${tipoIdCreado} ✅✅✅`);
                console.log('💾 Guardado en datosWizardTemp:', datosWizardTemp.tipoIdCreado);
            } else if (tipoIdCreado) {
                console.log(`✅✅✅ TIPO ACTUALIZADO ID: ${tipoIdCreado} ✅✅✅`);
            } else {
                console.error('⚠️⚠️⚠️ NO SE PUDO OBTENER EL ID DE LA RESPUESTA ⚠️⚠️⚠️');
                console.error('Respuesta completa:', jsonData);
            }
            
            console.log('🔍 tipoIdCreado DESPUÉS:', tipoIdCreado);
            console.log('========================================');
            
            return true;
        } else {
            // Manejar errores de validación
            const errorData = await response.json();
            console.error('❌❌❌ ERROR DEL SERVIDOR ❌❌❌');
            console.error('   Método usado:', method);
            console.error('   URL:', url);
            console.error('   tipoIdCreado:', tipoIdCreado);
            console.error('   Status:', response.status);
            console.error('   Error data:', errorData);
            console.error('========================================');
            
            if (errorData.errors) {
                console.error('❌ Errores de validación:', errorData.errors);
                
                // Mostrar errores específicos con contexto
                let mensajeError = method === 'PUT' 
                    ? `Errores al ACTUALIZAR tipo (ID: ${tipoIdCreado}):\n\n`
                    : 'Errores al CREAR nuevo tipo:\n\n';
                
                for (const [campo, errores] of Object.entries(errorData.errors)) {
                    mensajeError += `• ${campo}: ${errores.join(', ')}\n`;
                }
                
                // Si son errores de unique en PUT, agregar ayuda
                if (method === 'PUT' && (errorData.errors.codigo || errorData.errors.slug)) {
                    mensajeError += '\n⚠️ NOTA: Esto NO debería pasar en modo UPDATE.\n';
                    mensajeError += `El backend debería ignorar el registro con ID ${tipoIdCreado}.\n`;
                    mensajeError += 'Verifica que la ruta PUT esté configurada correctamente.';
                }
                
                mostrarErrorAlerta('Error de Validación', mensajeError);
            } else {
                mostrarErrorAlerta('Error al guardar', errorData.message || 'No se pudo guardar la información básica');
            }
            
            return false;
        }
    } catch (error) {
        console.error('❌ Error al guardar paso 1:', error);
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
        // Mostrar loading
        Swal.fire({
            title: 'Finalizando configuración...',
            text: 'Guardando plantillas y activando tipo de solicitud',
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // 1. Guardar plantillas seleccionadas
        if (window.plantillasSeleccionadas && window.plantillasSeleccionadas.length > 0) {
            await guardarPlantillasDelTipo();
        }

        // 2. Activar el tipo de solicitud
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
            document.getElementById('wizardModal')?.remove();

            // Limpiar estado
            limpiarEstadoWizard();

            // Mostrar éxito
            await mostrarExito('¡Tipo de Solicitud Creado!',
                `El tipo se ha configurado correctamente con ${window.plantillasSeleccionadas?.length || 0} plantilla(s) y está activo`);

            // Recargar lista
            cargarTiposSolicitud();
        } else {
            throw new Error('Error al activar el tipo');
        }

    } catch (error) {
        console.error('Error al finalizar:', error);
        Swal.close();
        mostrarErrorAlerta('Error al finalizar', error.message || 'No se pudo activar el tipo de solicitud');
    }
}

/**
 * Guardar las plantillas asociadas al tipo de solicitud
 */
async function guardarPlantillasDelTipo() {
    if (!tipoIdCreado || !window.plantillasSeleccionadas || window.plantillasSeleccionadas.length === 0) {
        console.log('⚠️ No hay plantillas para guardar o no hay tipoIdCreado');
        return;
    }

    console.log('💾 Guardando plantillas para tipo:', tipoIdCreado);
    console.log('📋 Plantillas seleccionadas:', window.plantillasSeleccionadas);

    const plantillasParaGuardar = window.plantillasSeleccionadas.map(plantilla => ({
        plantilla_documento_id: plantilla.id,
        generar_automatico: plantilla.generar_automatico ?? true,
        momento_generacion: plantilla.momento_generacion || 'al_aprobar',
        es_principal: plantilla.es_principal ?? false,
        orden: plantilla.orden || 1
    }));

    console.log('📤 Datos a enviar:', { plantillas: plantillasParaGuardar });

    try {
        const url = `/admin/api/tipos-solicitud/${tipoIdCreado}/plantillas`;
        console.log('🌐 URL:', url);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
            },
            body: JSON.stringify({ plantillas: plantillasParaGuardar })
        });

        console.log('📡 Respuesta status:', response.status);

        await manejarRespuestaFetch(response);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ Error del servidor:', errorData);
            throw new Error(errorData.message || 'Error al guardar plantillas');
        }

        const data = await response.json();
        console.log('✅ Plantillas guardadas exitosamente:', data);

    } catch (error) {
        console.error('❌ Error al guardar plantillas:', error);
        throw error;
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

function mostrarExito(titulo, mensaje) {
    return Swal.fire({
        icon: 'success',
        title: titulo,
        text: mensaje,
        confirmButtonColor: '#10B981',
        confirmButtonText: 'Aceptar',
        timer: 3000,
        timerProgressBar: true
    });
}

// ========================================
// GESTIÓN DE PLANTILLAS (PASO 3)
// ========================================

// Variable global para almacenar plantillas seleccionadas
window.plantillasSeleccionadas = window.plantillasSeleccionadas || [];
window.todasLasPlantillas = window.todasLasPlantillas || [];

/**
 * Cargar plantillas disponibles
 */
async function cargarPlantillasDisponibles() {
    try {
        const busqueda = document.getElementById('buscarPlantilla')?.value || '';
        const tipoDocumento = document.getElementById('filtroTipoDocumento')?.value || '';

        const params = new URLSearchParams();
        if (busqueda) params.append('search', busqueda);
        if (tipoDocumento) params.append('tipo_documento', tipoDocumento);

        const response = await fetch(`/admin/api/configuracion/plantillas?${params.toString()}`, {
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
            }
        });

        await manejarRespuestaFetch(response);

        if (!response.ok) {
            throw new Error('Error al cargar plantillas');
        }

        const data = await response.json();

        if (data.success) {
            window.todasLasPlantillas = data.plantillas;
            renderizarPlantillasDisponibles(data.plantillas);
        } else {
            throw new Error(data.message || 'Error al cargar plantillas');
        }
    } catch (error) {
        console.error('Error al cargar plantillas:', error);
        const container = document.getElementById('listaPlantillasDisponibles');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <p class="text-red-600">Error al cargar plantillas</p>
                    <button onclick="cargarPlantillasDisponibles()"
                        class="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Reintentar
                    </button>
                </div>
            `;
        }
    }
}

/**
 * Renderizar lista de plantillas disponibles
 */
function renderizarPlantillasDisponibles(plantillas) {
    const container = document.getElementById('listaPlantillasDisponibles');

    if (!container) return;

    if (!plantillas || plantillas.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8">
                <p class="text-gray-500">No se encontraron plantillas disponibles</p>
            </div>
        `;
        return;
    }

    const plantillasHTML = plantillas.map(plantilla => {
        const estaSeleccionada = window.plantillasSeleccionadas.some(p => p.id === plantilla.id);
        const tipoDocumentoLabel = obtenerLabelTipoDocumento(plantilla.tipo_documento);
        const colorTipo = obtenerColorTipoDocumento(plantilla.tipo_documento);

        return `
            <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow ${estaSeleccionada ? 'bg-blue-50 border-blue-300' : 'bg-white'}">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-2">
                            <h5 class="font-semibold text-gray-800">${plantilla.nombre}</h5>
                            <span class="px-2 py-1 ${colorTipo} rounded-full text-xs font-medium">
                                ${tipoDocumentoLabel}
                            </span>
                        </div>
                        <p class="text-sm text-gray-600 mb-2">${plantilla.descripcion || 'Sin descripción'}</p>
                        <div class="flex items-center gap-4 text-xs text-gray-500 mb-3">
                            <span>📄 ${plantilla.tamano_pagina || 'carta'} - ${plantilla.orientacion || 'vertical'}</span>
                            <span>🔧 ${plantilla.total_variables || 0} variables</span>
                        </div>
                        <button onclick="verVistaPrevia(${plantilla.id})"
                            class="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                            </svg>
                            Ver Vista Previa
                        </button>
                    </div>
                    <div class="ml-4 flex flex-col gap-2">
                        ${estaSeleccionada
                            ? `<button onclick="quitarPlantilla(${plantilla.id})"
                                class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm whitespace-nowrap">
                                Quitar
                            </button>`
                            : `<button onclick="agregarPlantilla(${plantilla.id})"
                                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm whitespace-nowrap">
                                + Agregar
                            </button>`
                        }
                    </div>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = plantillasHTML;
}

/**
 * Agregar plantilla a la selección
 */
function agregarPlantilla(plantillaId) {
    const plantilla = window.todasLasPlantillas.find(p => p.id === plantillaId);

    if (!plantilla) {
        mostrarToast('Plantilla no encontrada', 'error');
        return;
    }

    // Verificar si ya está seleccionada
    if (window.plantillasSeleccionadas.some(p => p.id === plantillaId)) {
        mostrarToast('Esta plantilla ya está seleccionada', 'warning');
        return;
    }

    // Agregar configuración por defecto
    const plantillaConConfig = {
        ...plantilla,
        generar_automatico: true,
        momento_generacion: 'al_aprobar',
        es_principal: window.plantillasSeleccionadas.length === 0,
        orden: window.plantillasSeleccionadas.length + 1
    };

    window.plantillasSeleccionadas.push(plantillaConConfig);

    // Re-renderizar ambas listas
    renderizarPlantillasDisponibles(window.todasLasPlantillas);
    renderizarPlantillasSeleccionadas();

    mostrarToast('Plantilla agregada correctamente', 'success');
}

/**
 * Quitar plantilla de la selección
 */
function quitarPlantilla(plantillaId) {
    const index = window.plantillasSeleccionadas.findIndex(p => p.id === plantillaId);

    if (index === -1) {
        return;
    }

    window.plantillasSeleccionadas.splice(index, 1);

    // Reordenar
    window.plantillasSeleccionadas.forEach((p, i) => {
        p.orden = i + 1;
    });

    // Re-renderizar ambas listas
    renderizarPlantillasDisponibles(window.todasLasPlantillas);
    renderizarPlantillasSeleccionadas();

    mostrarToast('Plantilla eliminada', 'info');
}

/**
 * Renderizar plantillas seleccionadas
 */
function renderizarPlantillasSeleccionadas() {
    const container = document.getElementById('listaPlantillasSeleccionadas');
    const contador = document.getElementById('contadorPlantillas');

    if (contador) {
        contador.textContent = window.plantillasSeleccionadas.length;
    }

    if (!container) return;

    if (window.plantillasSeleccionadas.length === 0) {
        container.innerHTML = '<p class="text-sm text-gray-500 italic">No hay plantillas seleccionadas aún</p>';
        return;
    }

    const plantillasHTML = window.plantillasSeleccionadas.map((plantilla, index) => {
        const tipoDocumentoLabel = obtenerLabelTipoDocumento(plantilla.tipo_documento);

        return `
            <div class="bg-white border border-gray-300 rounded-lg p-3">
                <div class="flex items-start justify-between mb-2">
                    <div class="flex-1">
                        <div class="flex items-center gap-2">
                            <span class="text-gray-500 font-mono text-xs">#${plantilla.orden}</span>
                            <h6 class="font-medium text-gray-800">${plantilla.nombre}</h6>
                            ${plantilla.es_principal ? '<span class="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs">Principal</span>' : ''}
                        </div>
                    </div>
                    <button onclick="quitarPlantilla(${plantilla.id})"
                        class="text-red-600 hover:text-red-800">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                <div class="grid grid-cols-2 gap-2 text-xs">
                    <div>
                        <label class="block text-gray-600 mb-1">Generación</label>
                        <select onchange="actualizarConfigPlantilla(${plantilla.id}, 'momento_generacion', this.value)"
                            class="w-full px-2 py-1 border border-gray-300 rounded text-xs">
                            <option value="al_aprobar" ${plantilla.momento_generacion === 'al_aprobar' ? 'selected' : ''}>Al Aprobar</option>
                            <option value="al_completar" ${plantilla.momento_generacion === 'al_completar' ? 'selected' : ''}>Al Completar</option>
                            <option value="manual" ${plantilla.momento_generacion === 'manual' ? 'selected' : ''}>Manual</option>
                        </select>
                    </div>
                    <div class="flex items-end">
                        <label class="flex items-center gap-1 cursor-pointer">
                            <input type="checkbox"
                                ${plantilla.generar_automatico ? 'checked' : ''}
                                onchange="actualizarConfigPlantilla(${plantilla.id}, 'generar_automatico', this.checked)"
                                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                            <span class="text-gray-700">Auto-generar</span>
                        </label>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = plantillasHTML;
}

/**
 * Actualizar configuración de una plantilla
 */
function actualizarConfigPlantilla(plantillaId, campo, valor) {
    const plantilla = window.plantillasSeleccionadas.find(p => p.id === plantillaId);

    if (plantilla) {
        plantilla[campo] = valor;
    }
}

/**
 * Obtener label de tipo de documento
 */
function obtenerLabelTipoDocumento(tipo) {
    const labels = {
        'certificado': 'Certificado',
        'concepto_tecnico': 'Concepto Técnico',
        'acta': 'Acta',
        'resolucion': 'Resolución',
        'oficio': 'Oficio',
        'otro': 'Otro'
    };
    return labels[tipo] || tipo;
}

/**
 * Obtener color para tipo de documento
 */
function obtenerColorTipoDocumento(tipo) {
    const colores = {
        'certificado': 'bg-blue-100 text-blue-800',
        'concepto_tecnico': 'bg-green-100 text-green-800',
        'acta': 'bg-purple-100 text-purple-800',
        'resolucion': 'bg-orange-100 text-orange-800',
        'oficio': 'bg-yellow-100 text-yellow-800',
        'otro': 'bg-gray-100 text-gray-800'
    };
    return colores[tipo] || 'bg-gray-100 text-gray-800';
}

/**
 * Ver vista previa de una plantilla
 */
async function verVistaPrevia(plantillaId) {
    try {
        // Buscar la plantilla en el array
        const plantilla = window.todasLasPlantillas.find(p => p.id === plantillaId);

        if (!plantilla) {
            mostrarToast('Plantilla no encontrada', 'error');
            return;
        }

        // Parsear variables si están en JSON
        let variables = [];
        if (plantilla.variables_usadas) {
            try {
                variables = typeof plantilla.variables_usadas === 'string'
                    ? JSON.parse(plantilla.variables_usadas)
                    : plantilla.variables_usadas;
            } catch (e) {
                console.error('Error al parsear variables:', e);
            }
        }

        // Crear HTML de vista previa
        const variablesHTML = variables && variables.length > 0
            ? `<div class="mt-4">
                <h4 class="font-semibold text-gray-700 mb-2">Variables disponibles:</h4>
                <div class="flex flex-wrap gap-2">
                    ${variables.map(v => `
                        <span class="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-mono">${v}</span>
                    `).join('')}
                </div>
            </div>`
            : '<p class="text-sm text-gray-500 mt-4">No hay variables configuradas</p>';

        const htmlContent = plantilla.contenido_html || '<p class="text-gray-500">Sin contenido HTML</p>';
        const cssContent = plantilla.contenido_css || '';
        const encabezadoHTML = plantilla.encabezado_html || '';
        const pieHTML = plantilla.pie_pagina_html || '';

        Swal.fire({
            title: `Vista Previa: ${plantilla.nombre}`,
            width: '90%',
            html: `
                <div class="text-left">
                    <!-- Información de la plantilla -->
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <div class="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <span class="text-gray-600">Tipo:</span>
                                <span class="ml-2 font-medium">${obtenerLabelTipoDocumento(plantilla.tipo_documento)}</span>
                            </div>
                            <div>
                                <span class="text-gray-600">Tamaño:</span>
                                <span class="ml-2 font-medium">${plantilla.tamano_pagina || 'carta'}</span>
                            </div>
                            <div>
                                <span class="text-gray-600">Orientación:</span>
                                <span class="ml-2 font-medium">${plantilla.orientacion || 'vertical'}</span>
                            </div>
                            <div>
                                <span class="text-gray-600">Variables:</span>
                                <span class="ml-2 font-medium">${plantilla.total_variables || 0}</span>
                            </div>
                        </div>
                        ${plantilla.descripcion ? `<p class="text-sm text-gray-600 mt-2">${plantilla.descripcion}</p>` : ''}
                    </div>

                    ${variablesHTML}

                    <!-- Vista previa del documento -->
                    <div class="mt-6">
                        <h4 class="font-semibold text-gray-700 mb-3">Previsualización del Documento:</h4>
                        <div class="border border-gray-300 rounded-lg p-4 bg-white shadow-inner max-h-96 overflow-y-auto">
                            <style>${cssContent}</style>
                            ${encabezadoHTML}
                            ${htmlContent}
                            ${pieHTML}
                        </div>
                    </div>

                    <div class="mt-4 text-xs text-gray-500">
                        <strong>Nota:</strong> Esta es una vista previa con variables sin reemplazar.
                        El documento final mostrará los valores reales cuando se genere.
                    </div>
                </div>
            `,
            showCancelButton: false,
            confirmButtonText: 'Cerrar',
            confirmButtonColor: '#2563eb',
            customClass: {
                popup: 'swal-wide',
                htmlContainer: 'swal-html-container-custom'
            }
        });

    } catch (error) {
        console.error('Error al mostrar vista previa:', error);
        mostrarToast('Error al cargar la vista previa', 'error');
    }
}

