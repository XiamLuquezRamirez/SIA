/**
 * Estados de Solicitud - Gestión Frontend
 * Sistema de gestión de estados del ciclo de vida de solicitudes
 */

// Variables globales
let estadosData = [];
let estadoActual = null;
let pasoActual = 1;
let modoEdicion = false;
let rolesDisponibles = [];

// Objeto para almacenar datos del wizard
let wizardData = {
    codigo: '',
    nombre: '',
    descripcion: '',
    tipo: 'proceso',
    es_inicial: false,
    es_final: false,
    notifica_solicitante: true,
    permite_edicion: false,
    requiere_resolucion: false,
    genera_documento: false,
    pausa_sla: false,
    reinicia_sla: false,
    color: '#6B7280',
    icono: '',
    orden: 0,
    activo: true,
    roles: [],
    estados_siguientes: []
};

/**
 * Inicialización al cargar el documento
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando módulo de Estados de Solicitud...');

    // Cargar roles disponibles
    const rolesInput = document.getElementById('rolesDisponibles');
    if (rolesInput && rolesInput.value) {
        try {
            rolesDisponibles = JSON.parse(rolesInput.value);
        } catch (e) {
            console.error('Error al parsear roles:', e);
        }
    }

    // Cargar estados
    cargarEstados();
});

/**
 * Cargar lista de estados desde el servidor
 */
async function cargarEstados(filtros = {}) {
    try {
        const params = new URLSearchParams();

        if (filtros.tipo && filtros.tipo !== 'todos') {
            params.append('tipo', filtros.tipo);
        }

        if (filtros.buscar) {
            params.append('buscar', filtros.buscar);
        }

        const url = `/admin/api/configuracion/estados-solicitud?${params.toString()}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const permissions = data.permissions;
        window.userPermissions = permissions;

        estadosData = data.estados;
        renderizarEstados(estadosData);
    } catch (error) {
        console.error('Error al cargar estados:', error);
        mostrarError('Error al cargar estados: ' + error.message);
    }
}

/**
 * Renderizar lista de estados en el DOM
 */
function renderizarEstados(estados) {
    const container = document.getElementById('estadosContainer');

    if (!estados || estados.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
                </svg>
                <h3 class="mt-2 text-sm font-medium text-gray-900">No hay estados</h3>
                <p class="mt-1 text-sm text-gray-500">Comienza creando un nuevo estado.</p>
                <div class="mt-6">
                    <button onclick="abrirModalNuevoEstado()" class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                        Crear Estado
                    </button>
                </div>
            </div>
        `;
        return;
    }

    // Renderizar en grid de 3 columnas
    container.innerHTML = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">' +
        estados.map(estado => crearCardEstado(estado)).join('') +
        '</div>';
}

/**
 * Crear HTML para card de estado
 */
function crearCardEstado(estado) {
    const tipoClases = {
        'inicial': 'bg-blue-100 text-blue-800 border-blue-200',
        'proceso': 'bg-orange-100 text-orange-800 border-orange-200',
        'final': 'bg-green-100 text-green-800 border-green-200',
        'bloqueante': 'bg-gray-100 text-gray-800 border-gray-200'
    };

    const tipoClase = tipoClases[estado.tipo] || tipoClases['proceso'];

    return `
        <div class="estado-card bg-white rounded-lg shadow-sm border-2 ${estado.activo ? 'border-gray-200' : 'border-red-200 opacity-60'} hover:shadow-md transition-shadow" data-estado-id="${estado.id}">
            <div class="p-6">
                <!-- Header con menú dropdown -->
                <div class="flex items-start justify-between mb-4">
                    <div class="flex items-center gap-3">
                        ${estado.icono ? `<span class="text-2xl">${estado.icono}</span>` : ''}
                        <div>
                            <h3 class="text-lg font-bold text-gray-900">${estado.nombre}</h3>
                            <p class="text-sm text-gray-500 font-mono">${estado.codigo}</p>
                        </div>
                    </div>

                    <!-- Menú de acciones -->
                    <div class="relative">
                        <button onclick="toggleDropdown(event, ${estado.id})" class="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors">
                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path>
                            </svg>
                        </button>
                        <div id="dropdown-${estado.id}" class="hidden origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                            <div class="py-1">
                                ${window.userPermissions.canVer ? `
                                <a href="#" onclick="verDetallesEstado(${estado.id}); return false;" class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                    </svg>
                                    Ver Detalle
                                </a>
                                ` : ''}
                                ${!estado.es_sistema ? `
                                    ${window.userPermissions.canEdit ? `
                                    <a href="#" onclick="abrirModalEditarEstado(${estado.id}); return false;" class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                        </svg>
                                        Editar Estado
                                    </a>
                                    ` : ''}
                                    ${window.userPermissions.canDuplicate ? `
                                    <a href="#" onclick="duplicarEstado(${estado.id}); return false;" class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                                        </svg>
                                        Duplicar Estado
                                    </a>
                                    ` : ''}
                                    ${window.userPermissions.canActivate ? `
                                    <a href="#" onclick="toggleEstadoActivo(${estado.id}); return false;" class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${estado.activo ? 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' : 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'}"></path>
                                        </svg>
                                        ${estado.activo ? 'Desactivar' : 'Activar'}
                                    </a>
                                    ` : ''}
                                    ${window.userPermissions.canDelete ? `
                                        <a href="#" onclick="eliminarEstado(${estado.id}); return false;" class="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                            </svg>
                                            Eliminar
                                        </a>
                                    ` : ''}
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Descripción -->
                ${estado.descripcion ? `<p class="text-sm text-gray-600 mb-4">${estado.descripcion}</p>` : ''}

                <!-- Badges -->
                <div class="flex flex-wrap gap-2 mb-4">
                    <span class="px-3 py-1 rounded-full text-xs font-medium ${tipoClase}">
                        ${estado.tipo.charAt(0).toUpperCase() + estado.tipo.slice(1)}
                    </span>
                    ${estado.es_inicial ? '<span class="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-200">Estado Inicial</span>' : ''}
                    ${estado.es_final ? '<span class="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-200">Estado Final</span>' : ''}
                    ${estado.es_sistema ? '<span class="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium border border-purple-200">Sistema</span>' : ''}
                    ${!estado.activo ? '<span class="px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium border border-red-200">Inactivo</span>' : ''}
                </div>

                <!-- Detalles -->
                <div class="space-y-2 text-sm text-gray-600">
                    <div class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                        </svg>
                        <span class="font-medium">Estados siguientes:</span> ${estado.estados_siguientes_count || 0}
                    </div>
                    <div class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <span class="font-medium">Solicitudes:</span> ${estado.solicitudes_count || 0}
                    </div>
                    ${estado.notifica_solicitante ? '<div class="flex items-center gap-2"><svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"></path></svg> Notifica al solicitante</div>' : ''}
                </div>

                <!-- Toggle Estado -->
                <div class="flex items-center justify-between py-3 border-t border-gray-200 mt-4">
                    <span class="text-sm font-medium text-gray-700">Estado</span>
                    <button onclick="toggleEstadoActivo(${estado.id})" class="relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${estado.activo ? 'bg-green-500' : 'bg-gray-300'}">
                        <span class="sr-only">Toggle estado</span>
                        <span class="inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${estado.activo ? 'translate-x-6' : 'translate-x-1'}"></span>
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Toggle dropdown menu
 */
function toggleDropdown(event, estadoId) {
    event.stopPropagation();

    const dropdown = document.getElementById(`dropdown-${estadoId}`);
    const allDropdowns = document.querySelectorAll('[id^="dropdown-"]');

    // Cerrar todos los demás dropdowns
    allDropdowns.forEach(dd => {
        if (dd.id !== `dropdown-${estadoId}`) {
            dd.classList.add('hidden');
        }
    });

    // Toggle el dropdown actual
    dropdown.classList.toggle('hidden');
}

// Cerrar dropdown al hacer click fuera
document.addEventListener('click', function(event) {
    const allDropdowns = document.querySelectorAll('[id^="dropdown-"]');
    allDropdowns.forEach(dd => dd.classList.add('hidden'));
});

/**
 * Filtrar estados por tipo
 */
function filtrarPorTipo(tipo) {
    // Actualizar clases de pestañas
    document.querySelectorAll('.tab-filter').forEach(tab => {
        tab.classList.remove('active', 'border-blue-500', 'text-blue-600');
        tab.classList.add('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
    });

    event.target.classList.add('active', 'border-blue-500', 'text-blue-600');
    event.target.classList.remove('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');

    // Cargar estados con filtro
    cargarEstados({ tipo });
}

/**
 * Buscar estados
 */
function buscarEstados() {
    const buscar = document.getElementById('buscarEstado').value;
    const tipoActivo = document.querySelector('.tab-filter.active');
    const tipo = tipoActivo ? tipoActivo.textContent.trim().toLowerCase() : 'todos';

    cargarEstados({ tipo: tipo === 'todos' ? null : tipo, buscar });
}

/**
 * Abrir modal para nuevo estado
 */
function abrirModalNuevoEstado() {
    modoEdicion = false;
    estadoActual = null;
    pasoActual = 1;

    // Resetear wizardData
    wizardData = {
        codigo: '',
        nombre: '',
        descripcion: '',
        tipo: 'proceso',
        es_inicial: false,
        es_final: false,
        notifica_solicitante: true,
        permite_edicion: false,
        requiere_resolucion: false,
        genera_documento: false,
        pausa_sla: false,
        reinicia_sla: false,
        color: '#6B7280',
        icono: '',
        orden: 0,
        activo: true,
        roles: [],
        estados_siguientes: []
    };

    document.getElementById('wizardTitulo').textContent = 'Nuevo Estado';
    mostrarPasoWizard(1);
    document.getElementById('wizardModal').classList.remove('hidden');
}

/**
 * Abrir modal para editar estado
 */
async function abrirModalEditarEstado(id) {
    try {
        const response = await fetch(`/admin/api/configuracion/estados-solicitud/${id}`, {
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        const data = await response.json();

        if (data.success) {
            modoEdicion = true;
            estadoActual = data.estado;
            pasoActual = 1;

            // Cargar datos al wizard
            wizardData = {
                codigo: estadoActual.codigo,
                nombre: estadoActual.nombre,
                descripcion: estadoActual.descripcion || '',
                tipo: estadoActual.tipo,
                es_inicial: estadoActual.es_inicial,
                es_final: estadoActual.es_final,
                notifica_solicitante: estadoActual.notifica_solicitante,
                permite_edicion: estadoActual.permite_edicion,
                requiere_resolucion: estadoActual.requiere_resolucion,
                genera_documento: estadoActual.genera_documento,
                pausa_sla: estadoActual.pausa_sla,
                reinicia_sla: estadoActual.reinicia_sla,
                color: estadoActual.color,
                icono: estadoActual.icono || '',
                orden: estadoActual.orden,
                activo: estadoActual.activo,
                roles: estadoActual.roles?.map(r => r.id) || [],
                estados_siguientes: estadoActual.estados_siguientes?.map(e => e.id) || []
            };

            document.getElementById('wizardTitulo').textContent = 'Editar Estado: ' + estadoActual.nombre;
            mostrarPasoWizard(1);
            document.getElementById('wizardModal').classList.remove('hidden');
        } else {
            mostrarError('Error al cargar estado: ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al cargar estado');
    }
}

/**
 * Mostrar paso específico del wizard
 */
function mostrarPasoWizard(paso) {
    pasoActual = paso;

    // Actualizar indicador de pasos
    document.querySelectorAll('.wizard-step').forEach(step => {
        const stepNum = parseInt(step.dataset.step);
        if (stepNum < paso) {
            step.classList.add('completed');
            step.classList.remove('active');
        } else if (stepNum === paso) {
            step.classList.add('active');
            step.classList.remove('completed');
        } else {
            step.classList.remove('active', 'completed');
        }
    });

    // Actualizar botones
    const btnAnterior = document.getElementById('btnAnterior');
    const btnSiguiente = document.getElementById('btnSiguiente');
    const btnGuardar = document.getElementById('btnGuardar');

    if (paso === 1) {
        btnAnterior.classList.add('hidden');
    } else {
        btnAnterior.classList.remove('hidden');
    }

    if (paso === 5) {
        btnSiguiente.classList.add('hidden');
        btnGuardar.classList.remove('hidden');
    } else {
        btnSiguiente.classList.remove('hidden');
        btnGuardar.classList.add('hidden');
    }

    // Renderizar contenido del paso
    const content = document.getElementById('wizardContent');
    content.innerHTML = generarContenidoPaso(paso);
}

/**
 * Generar HTML para cada paso del wizard
 */
function generarContenidoPaso(paso) {
    switch(paso) {
        case 1:
            return generarPaso1();
        case 2:
            return generarPaso2();
        case 3:
            return generarPaso3();
        case 4:
            return generarPaso4();
        case 5:
            return generarPaso5();
        default:
            return '';
    }
}

/**
 * Paso 1: Información Básica
 */
function generarPaso1() {
    return `
        <div class="space-y-6">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                    Código <span class="text-red-500">*</span>
                </label>
                <input type="text" id="input_codigo" value="${wizardData.codigo}"
                    ${modoEdicion && estadoActual?.es_sistema ? 'disabled' : ''}
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                    placeholder="Ej: EN_REVISION" pattern="[A-Z0-9_\\-]+" maxlength="50">
                <p class="mt-1 text-sm text-gray-500">Solo mayúsculas, números, guiones y guiones bajos</p>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                    Nombre <span class="text-red-500">*</span>
                </label>
                <input type="text" id="input_nombre" value="${wizardData.nombre}"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: En Revisión" maxlength="100">
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                </label>
                <textarea id="input_descripcion" rows="3"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Descripción del estado...">${wizardData.descripcion}</textarea>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                    Tipo <span class="text-red-500">*</span>
                </label>
                <select id="input_tipo" ${modoEdicion && estadoActual?.es_sistema ? 'disabled' : ''}
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="inicial" ${wizardData.tipo === 'inicial' ? 'selected' : ''}>Inicial</option>
                    <option value="proceso" ${wizardData.tipo === 'proceso' ? 'selected' : ''}>En Proceso</option>
                    <option value="final" ${wizardData.tipo === 'final' ? 'selected' : ''}>Final</option>
                    <option value="bloqueante" ${wizardData.tipo === 'bloqueante' ? 'selected' : ''}>Bloqueante</option>
                </select>
            </div>
        </div>
    `;
}

/**
 * Paso 2: Comportamiento
 */
function generarPaso2() {
    return `
        <div class="space-y-6">
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 class="font-medium text-blue-900 mb-3">Notificaciones</h4>
                <div class="space-y-2">
                    <label class="flex items-center">
                        <input type="checkbox" id="input_notifica_solicitante" ${wizardData.notifica_solicitante ? 'checked' : ''}
                            class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
                        <span class="ml-2 text-sm text-gray-700">Notificar al solicitante cuando se asigne este estado</span>
                    </label>
                </div>
            </div>

            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 class="font-medium text-green-900 mb-3">Permisos de Edición</h4>
                <div class="space-y-2">
                    <label class="flex items-center">
                        <input type="checkbox" id="input_permite_edicion" ${wizardData.permite_edicion ? 'checked' : ''}
                            class="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500">
                        <span class="ml-2 text-sm text-gray-700">Permitir edición de la solicitud en este estado</span>
                    </label>
                </div>
            </div>

            <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 class="font-medium text-purple-900 mb-3">Generación de Documentos</h4>
                <div class="space-y-2">
                    <label class="flex items-center">
                        <input type="checkbox" id="input_requiere_resolucion" ${wizardData.requiere_resolucion ? 'checked' : ''}
                            class="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500">
                        <span class="ml-2 text-sm text-gray-700">Requiere resolución formal</span>
                    </label>
                    <label class="flex items-center">
                        <input type="checkbox" id="input_genera_documento" ${wizardData.genera_documento ? 'checked' : ''}
                            class="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500">
                        <span class="ml-2 text-sm text-gray-700">Generar documento automáticamente</span>
                    </label>
                </div>
            </div>

            <div class="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 class="font-medium text-orange-900 mb-3">Control de SLA</h4>
                <div class="space-y-2">
                    <label class="flex items-center">
                        <input type="checkbox" id="input_pausa_sla" ${wizardData.pausa_sla ? 'checked' : ''}
                            class="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500">
                        <span class="ml-2 text-sm text-gray-700">Pausar cálculo de SLA en este estado</span>
                    </label>
                    <label class="flex items-center">
                        <input type="checkbox" id="input_reinicia_sla" ${wizardData.reinicia_sla ? 'checked' : ''}
                            class="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500">
                        <span class="ml-2 text-sm text-gray-700">Reiniciar contador de SLA en este estado</span>
                    </label>
                </div>
            </div>

            <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 class="font-medium text-gray-900 mb-3">Roles con Permiso</h4>
                <div class="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    ${rolesDisponibles.map(rol => `
                        <label class="flex items-center">
                            <input type="checkbox" value="${rol.id}" ${wizardData.roles.includes(rol.id) ? 'checked' : ''}
                                class="input_roles w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
                            <span class="ml-2 text-sm text-gray-700">${rol.name}</span>
                        </label>
                    `).join('')}
                </div>
                <p class="mt-2 text-xs text-gray-500">Seleccione los roles que pueden asignar este estado</p>
            </div>
        </div>
    `;
}

/**
 * Paso 3: Configurar Flujo
 */
function generarPaso3() {
    const estadosDisponibles = estadosData.filter(e => {
        // No puede avanzar a sí mismo
        if (modoEdicion && e.id === estadoActual.id) return false;
        // Si este es estado final, no puede tener siguientes
        if (wizardData.es_final) return false;
        return true;
    });

    return `
        <div class="space-y-6">
            <div>
                <h4 class="font-medium text-gray-900 mb-2">Estados Siguientes Permitidos</h4>
                <p class="text-sm text-gray-600 mb-4">Seleccione a qué estados puede avanzar desde este estado</p>

                ${wizardData.es_final ? `
                    <div class="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                        <p class="text-green-800">Este es un estado final. No puede tener estados siguientes.</p>
                    </div>
                ` : estadosDisponibles.length === 0 ? `
                    <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                        <p class="text-gray-600">No hay estados disponibles. Cree estados primero.</p>
                    </div>
                ` : `
                    <div class="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                        ${estadosDisponibles.map(estado => `
                            <label class="flex items-start p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${wizardData.estados_siguientes.includes(estado.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}">
                                <input type="checkbox" value="${estado.id}" ${wizardData.estados_siguientes.includes(estado.id) ? 'checked' : ''}
                                    class="input_estados_siguientes w-4 h-4 mt-1 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
                                <div class="ml-3">
                                    <div class="flex items-center gap-2">
                                        ${estado.icono ? `<span>${estado.icono}</span>` : ''}
                                        <span class="font-medium text-gray-900">${estado.nombre}</span>
                                    </div>
                                    <span class="text-xs text-gray-500">${estado.codigo}</span>
                                </div>
                            </label>
                        `).join('')}
                    </div>
                `}
            </div>
        </div>
    `;
}

/**
 * Paso 4: Configuración Visual
 */
function generarPaso4() {
    const coloresSugeridos = [
        { color: '#3B82F6', nombre: 'Azul' },
        { color: '#10B981', nombre: 'Verde' },
        { color: '#F59E0B', nombre: 'Amarillo' },
        { color: '#F97316', nombre: 'Naranja' },
        { color: '#EF4444', nombre: 'Rojo' },
        { color: '#8B5CF6', nombre: 'Púrpura' },
        { color: '#EC4899', nombre: 'Rosa' },
        { color: '#6B7280', nombre: 'Gris' }
    ];

    const iconosSugeridos = ['📥', '🔍', '⚙️', '✅', '❌', '⚠️', '🚫', '📋', '📝', '✨', '⏳', '🔔'];

    return `
        <div class="space-y-6">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <div class="grid grid-cols-4 gap-3 mb-4">
                    ${coloresSugeridos.map(c => `
                        <button type="button" onclick="seleccionarColor('${c.color}')"
                            class="p-3 rounded-lg border-2 ${wizardData.color === c.color ? 'border-gray-800' : 'border-gray-200'} hover:border-gray-400 transition-colors"
                            style="background-color: ${c.color}20;">
                            <div class="w-8 h-8 rounded-full mx-auto" style="background-color: ${c.color};"></div>
                            <p class="text-xs mt-1 text-gray-700">${c.nombre}</p>
                        </button>
                    `).join('')}
                </div>
                <input type="color" id="input_color" value="${wizardData.color}"
                    class="w-full h-12 border border-gray-300 rounded-lg cursor-pointer">
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Icono (Emoji)</label>
                <div class="grid grid-cols-6 gap-2 mb-4">
                    ${iconosSugeridos.map(icono => `
                        <button type="button" onclick="seleccionarIcono('${icono}')"
                            class="p-3 text-2xl rounded-lg border-2 ${wizardData.icono === icono ? 'border-blue-500 bg-blue-50' : 'border-gray-200'} hover:border-blue-300 transition-colors">
                            ${icono}
                        </button>
                    `).join('')}
                </div>
                <input type="text" id="input_icono" value="${wizardData.icono}" maxlength="10"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Escriba un emoji">
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Orden</label>
                <input type="number" id="input_orden" value="${wizardData.orden}" min="0"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <p class="mt-1 text-sm text-gray-500">Define el orden de visualización</p>
            </div>

            <div>
                <label class="flex items-center">
                    <input type="checkbox" id="input_activo" ${wizardData.activo ? 'checked' : ''}
                        class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
                    <span class="ml-2 text-sm font-medium text-gray-700">Estado activo</span>
                </label>
            </div>

            <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 class="font-medium text-gray-900 mb-3">Vista Previa</h4>
                <div class="flex items-center gap-3 p-4 bg-white rounded-lg border-2" style="border-color: ${wizardData.color};">
                    ${wizardData.icono ? `<span class="text-3xl">${wizardData.icono}</span>` : ''}
                    <div>
                        <div class="font-bold text-lg">${wizardData.nombre || 'Nombre del Estado'}</div>
                        <div class="text-sm text-gray-500">${wizardData.codigo || 'CODIGO'}</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Paso 5: Resumen
 */
function generarPaso5() {
    const tipoNombres = {
        'inicial': 'Inicial',
        'proceso': 'En Proceso',
        'final': 'Final',
        'bloqueante': 'Bloqueante'
    };

    const estadosSiguientesSeleccionados = estadosData.filter(e => wizardData.estados_siguientes.includes(e.id));
    const rolesSeleccionados = rolesDisponibles.filter(r => wizardData.roles.includes(r.id));

    return `
        <div class="space-y-6">
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 class="font-medium text-blue-900 mb-3">Información Básica</h4>
                <dl class="grid grid-cols-2 gap-4">
                    <div>
                        <dt class="text-sm text-gray-600">Código:</dt>
                        <dd class="font-medium">${wizardData.codigo}</dd>
                    </div>
                    <div>
                        <dt class="text-sm text-gray-600">Nombre:</dt>
                        <dd class="font-medium">${wizardData.nombre}</dd>
                    </div>
                    <div class="col-span-2">
                        <dt class="text-sm text-gray-600">Descripción:</dt>
                        <dd class="font-medium">${wizardData.descripcion || '-'}</dd>
                    </div>
                    <div>
                        <dt class="text-sm text-gray-600">Tipo:</dt>
                        <dd class="font-medium">${tipoNombres[wizardData.tipo]}</dd>
                    </div>
                    <div>
                        <dt class="text-sm text-gray-600">Estado:</dt>
                        <dd class="font-medium">${wizardData.activo ? 'Activo' : 'Inactivo'}</dd>
                    </div>
                </dl>
            </div>

            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 class="font-medium text-green-900 mb-3">Comportamiento</h4>
                <div class="space-y-2 text-sm">
                    ${wizardData.notifica_solicitante ? '<div>✓ Notifica al solicitante</div>' : ''}
                    ${wizardData.permite_edicion ? '<div>✓ Permite edición</div>' : ''}
                    ${wizardData.requiere_resolucion ? '<div>✓ Requiere resolución</div>' : ''}
                    ${wizardData.genera_documento ? '<div>✓ Genera documento</div>' : ''}
                    ${wizardData.pausa_sla ? '<div>✓ Pausa SLA</div>' : ''}
                    ${wizardData.reinicia_sla ? '<div>✓ Reinicia SLA</div>' : ''}
                    ${!wizardData.notifica_solicitante && !wizardData.permite_edicion && !wizardData.requiere_resolucion && !wizardData.genera_documento && !wizardData.pausa_sla && !wizardData.reinicia_sla ? '<div class="text-gray-500">Sin configuraciones especiales</div>' : ''}
                </div>
            </div>

            <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 class="font-medium text-purple-900 mb-3">Flujo</h4>
                <div>
                    <dt class="text-sm text-gray-600 mb-2">Estados siguientes (${estadosSiguientesSeleccionados.length}):</dt>
                    <dd class="flex flex-wrap gap-2">
                        ${estadosSiguientesSeleccionados.length > 0 ? estadosSiguientesSeleccionados.map(e => `
                            <span class="px-3 py-1 bg-white border border-purple-300 rounded-full text-sm">
                                ${e.icono || ''} ${e.nombre}
                            </span>
                        `).join('') : '<span class="text-gray-500 text-sm">Sin estados siguientes</span>'}
                    </dd>
                </div>
            </div>

            <div class="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 class="font-medium text-orange-900 mb-3">Permisos</h4>
                <div>
                    <dt class="text-sm text-gray-600 mb-2">Roles autorizados (${rolesSeleccionados.length}):</dt>
                    <dd class="flex flex-wrap gap-2">
                        ${rolesSeleccionados.length > 0 ? rolesSeleccionados.map(r => `
                            <span class="px-3 py-1 bg-white border border-orange-300 rounded-full text-sm">${r.name}</span>
                        `).join('') : '<span class="text-gray-500 text-sm">Sin restricciones de rol</span>'}
                    </dd>
                </div>
            </div>

            <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 class="font-medium text-gray-900 mb-3">Vista Previa</h4>
                <div class="flex items-center gap-3 p-4 bg-white rounded-lg border-2" style="border-color: ${wizardData.color};">
                    ${wizardData.icono ? `<span class="text-3xl">${wizardData.icono}</span>` : ''}
                    <div>
                        <div class="font-bold text-lg">${wizardData.nombre}</div>
                        <div class="text-sm text-gray-500">${wizardData.codigo}</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Funciones auxiliares para el wizard
 */
function seleccionarColor(color) {
    wizardData.color = color;
    document.getElementById('input_color').value = color;
    mostrarPasoWizard(4); // Refrescar paso 4
}

function seleccionarIcono(icono) {
    wizardData.icono = icono;
    document.getElementById('input_icono').value = icono;
    mostrarPasoWizard(4); // Refrescar paso 4
}

/**
 * Navegar al siguiente paso
 */
function siguientePaso() {
    if (!guardarDatosPaso(pasoActual)) {
        return;
    }

    if (pasoActual < 5) {
        mostrarPasoWizard(pasoActual + 1);
    }
}

/**
 * Navegar al paso anterior
 */
function pasoAnterior() {
    if (pasoActual > 1) {
        guardarDatosPaso(pasoActual);
        mostrarPasoWizard(pasoActual - 1);
    }
}

/**
 * Guardar datos del paso actual
 */
function guardarDatosPaso(paso) {
    switch(paso) {
        case 1:
            const codigo = document.getElementById('input_codigo')?.value.trim().toUpperCase();
            const nombre = document.getElementById('input_nombre')?.value.trim();
            const descripcion = document.getElementById('input_descripcion')?.value.trim();
            const tipo = document.getElementById('input_tipo')?.value;

            if (!codigo || !nombre || !tipo) {
                mostrarError('Complete todos los campos obligatorios');
                return false;
            }

            if (!/^[A-Z0-9_\-]+$/.test(codigo)) {
                mostrarError('El código solo puede contener mayúsculas, números, guiones y guiones bajos');
                return false;
            }

            wizardData.codigo = codigo;
            wizardData.nombre = nombre;
            wizardData.descripcion = descripcion;
            wizardData.tipo = tipo;
            wizardData.es_inicial = tipo === 'inicial';
            wizardData.es_final = tipo === 'final';
            break;

        case 2:
            wizardData.notifica_solicitante = document.getElementById('input_notifica_solicitante')?.checked || false;
            wizardData.permite_edicion = document.getElementById('input_permite_edicion')?.checked || false;
            wizardData.requiere_resolucion = document.getElementById('input_requiere_resolucion')?.checked || false;
            wizardData.genera_documento = document.getElementById('input_genera_documento')?.checked || false;
            wizardData.pausa_sla = document.getElementById('input_pausa_sla')?.checked || false;
            wizardData.reinicia_sla = document.getElementById('input_reinicia_sla')?.checked || false;

            const rolesCheckboxes = document.querySelectorAll('.input_roles:checked');
            wizardData.roles = Array.from(rolesCheckboxes).map(cb => parseInt(cb.value));
            break;

        case 3:
            const estadosCheckboxes = document.querySelectorAll('.input_estados_siguientes:checked');
            wizardData.estados_siguientes = Array.from(estadosCheckboxes).map(cb => parseInt(cb.value));
            break;

        case 4:
            wizardData.color = document.getElementById('input_color')?.value || '#6B7280';
            wizardData.icono = document.getElementById('input_icono')?.value.trim() || '';
            wizardData.orden = parseInt(document.getElementById('input_orden')?.value) || 0;
            wizardData.activo = document.getElementById('input_activo')?.checked || false;
            break;
    }

    return true;
}

/**
 * Guardar estado (crear o actualizar)
 */
async function guardarEstado() {
    if (!guardarDatosPaso(5)) {
        return;
    }

    try {
        const url = modoEdicion
            ? `/admin/api/configuracion/estados-solicitud/${estadoActual.id}`
            : '/admin/api/configuracion/estados-solicitud';

        const method = modoEdicion ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
            },
            body: JSON.stringify(wizardData)
        });

        const data = await response.json();

        if (data.success) {
            mostrarExito(modoEdicion ? 'Estado actualizado exitosamente' : 'Estado creado exitosamente');
            cerrarWizard();
            cargarEstados();
        } else {
            mostrarError(data.message || 'Error al guardar estado');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al guardar estado: ' + error.message);
    }
}

/**
 * Cerrar wizard
 */
function cerrarWizard() {
    document.getElementById('wizardModal').classList.add('hidden');
}

/**
 * Toggle estado activo/inactivo
 */
async function toggleEstadoActivo(id) {
    const estado = estadosData.find(e => e.id === id);
    if (!estado) return;

    const accion = estado.activo ? 'desactivar' : 'activar';

    const confirmacion = await Swal.fire({
        title: `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} estado?`,
        text: `¿Está seguro que desea ${accion} el estado "${estado.nombre}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: estado.activo ? '#d33' : '#3085d6',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, ' + accion,
        cancelButtonText: 'Cancelar'
    });

    if (!confirmacion.isConfirmed) return;

    try {
        const response = await fetch(`/admin/api/configuracion/estados-solicitud/${id}/toggle`, {
            method: 'PATCH',
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
            }
        });

        const data = await response.json();

        if (data.success) {
            mostrarExito(data.message);
            cargarEstados();
        } else {
            mostrarError(data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al cambiar estado');
    }
}

/**
 * Eliminar estado
 */
async function eliminarEstado(id) {
    const estado = estadosData.find(e => e.id === id);
    if (!estado) return;

    const confirmacion = await Swal.fire({
        title: '¿Eliminar estado?',
        html: `¿Está seguro que desea eliminar el estado <strong>"${estado.nombre}"</strong>?<br><br>Esta acción no se puede deshacer.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (!confirmacion.isConfirmed) return;

    try {
        const response = await fetch(`/admin/api/configuracion/estados-solicitud/${id}`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
            }
        });

        const data = await response.json();

        if (data.success) {
            mostrarExito(data.message);
            cargarEstados();
        } else {
            mostrarError(data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al eliminar estado');
    }
}

/**
 * Duplicar estado
 */
async function duplicarEstado(id) {
    const estado = estadosData.find(e => e.id === id);
    if (!estado) return;

    const { value: formValues } = await Swal.fire({
        title: 'Duplicar Estado',
        html: `
            <div class="text-left space-y-4">
                <p class="text-sm text-gray-600 mb-4">Duplicando: <strong>${estado.nombre}</strong></p>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Nuevo Código</label>
                    <input id="swal-codigo" class="swal2-input mt-0" placeholder="Ej: NUEVO_CODIGO" value="${estado.codigo}_COPIA" style="text-transform: uppercase;">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Nuevo Nombre</label>
                    <input id="swal-nombre" class="swal2-input mt-0" placeholder="Ej: Nuevo Estado" value="${estado.nombre} (Copia)">
                </div>
                <div class="text-left">
                    <label class="flex items-center">
                        <input type="checkbox" id="swal-copiar-flujo" checked class="mr-2">
                        <span class="text-sm">Copiar configuración de flujo</span>
                    </label>
                    <label class="flex items-center mt-2">
                        <input type="checkbox" id="swal-copiar-roles" checked class="mr-2">
                        <span class="text-sm">Copiar roles asignados</span>
                    </label>
                </div>
            </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Duplicar',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
            const codigo = document.getElementById('swal-codigo').value.trim().toUpperCase();
            const nombre = document.getElementById('swal-nombre').value.trim();
            const copiarFlujo = document.getElementById('swal-copiar-flujo').checked;
            const copiarRoles = document.getElementById('swal-copiar-roles').checked;

            if (!codigo || !nombre) {
                Swal.showValidationMessage('Complete todos los campos');
                return false;
            }

            if (!/^[A-Z0-9_\-]+$/.test(codigo)) {
                Swal.showValidationMessage('El código solo puede contener mayúsculas, números, guiones y guiones bajos');
                return false;
            }

            return { codigo, nombre, copiarFlujo, copiarRoles };
        }
    });

    if (!formValues) return;

    try {
        const response = await fetch(`/admin/api/configuracion/estados-solicitud/${id}/duplicar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
            },
            body: JSON.stringify({
                codigo: formValues.codigo,
                nombre: formValues.nombre,
                copiar_flujo: formValues.copiarFlujo,
                copiar_roles: formValues.copiarRoles
            })
        });

        const data = await response.json();

        if (data.success) {
            mostrarExito('Estado duplicado exitosamente');
            cargarEstados();
        } else {
            mostrarError(data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al duplicar estado');
    }
}

/**
 * Ver detalles del estado
 */
async function verDetallesEstado(id) {
    try {
        const response = await fetch(`/admin/api/configuracion/estados-solicitud/${id}`, {
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        const data = await response.json();

        if (data.success) {
            mostrarPanelDetalles(data.estado);
        } else {
            mostrarError('Error al cargar detalles');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al cargar detalles');
    }
}

/**
 * Mostrar panel lateral de detalles
 */
function mostrarPanelDetalles(estado) {
    const panel = document.getElementById('panelDetalles');
    const contenido = document.getElementById('contenidoDetalles');

    const tipoNombres = {
        'inicial': 'Inicial',
        'proceso': 'En Proceso',
        'final': 'Final',
        'bloqueante': 'Bloqueante'
    };

    contenido.innerHTML = `
        <div class="space-y-6">
            <div class="text-center pb-4 border-b">
                ${estado.icono ? `<div class="text-5xl mb-2">${estado.icono}</div>` : ''}
                <h4 class="text-xl font-bold text-gray-900">${estado.nombre}</h4>
                <p class="text-sm text-gray-500 font-mono">${estado.codigo}</p>
            </div>

            <div>
                <h5 class="font-medium text-gray-900 mb-2">Descripción</h5>
                <p class="text-sm text-gray-600">${estado.descripcion || 'Sin descripción'}</p>
            </div>

            <div>
                <h5 class="font-medium text-gray-900 mb-2">Características</h5>
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                        <span class="text-gray-600">Tipo:</span>
                        <span class="font-medium">${tipoNombres[estado.tipo]}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">Estado:</span>
                        <span class="font-medium ${estado.activo ? 'text-green-600' : 'text-red-600'}">${estado.activo ? 'Activo' : 'Inactivo'}</span>
                    </div>
                    ${estado.es_sistema ? '<div class="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs">Estado del Sistema</div>' : ''}
                </div>
            </div>

            <div>
                <h5 class="font-medium text-gray-900 mb-2">Comportamiento</h5>
                <div class="space-y-1 text-sm">
                    ${estado.notifica_solicitante ? '<div class="flex items-center gap-2"><svg class="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg> Notifica solicitante</div>' : ''}
                    ${estado.permite_edicion ? '<div class="flex items-center gap-2"><svg class="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg> Permite edición</div>' : ''}
                    ${estado.requiere_resolucion ? '<div class="flex items-center gap-2"><svg class="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg> Requiere resolución</div>' : ''}
                    ${estado.genera_documento ? '<div class="flex items-center gap-2"><svg class="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg> Genera documento</div>' : ''}
                    ${estado.pausa_sla ? '<div class="flex items-center gap-2"><svg class="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clip-rule="evenodd"></path></svg> Pausa SLA</div>' : ''}
                    ${estado.reinicia_sla ? '<div class="flex items-center gap-2"><svg class="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"></path></svg> Reinicia SLA</div>' : ''}
                </div>
            </div>

            <div>
                <h5 class="font-medium text-gray-900 mb-2">Estados Siguientes (${estado.estados_siguientes?.length || 0})</h5>
                <div class="space-y-2">
                    ${estado.estados_siguientes && estado.estados_siguientes.length > 0 ? estado.estados_siguientes.map(e => `
                        <div class="flex items-center gap-2 p-2 bg-gray-50 rounded">
                            ${e.icono ? `<span>${e.icono}</span>` : ''}
                            <span class="text-sm">${e.nombre}</span>
                        </div>
                    `).join('') : '<p class="text-sm text-gray-500">Sin estados siguientes</p>'}
                </div>
            </div>

            <div>
                <h5 class="font-medium text-gray-900 mb-2">Roles Autorizados (${estado.roles?.length || 0})</h5>
                <div class="flex flex-wrap gap-2">
                    ${estado.roles && estado.roles.length > 0 ? estado.roles.map(r => `
                        <span class="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">${r.name}</span>
                    `).join('') : '<p class="text-sm text-gray-500">Sin restricciones de rol</p>'}
                </div>
            </div>

            <div>
                <h5 class="font-medium text-gray-900 mb-2">Estadísticas</h5>
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                        <span class="text-gray-600">Solicitudes:</span>
                        <span class="font-medium">${estado.solicitudes_count || 0}</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    panel.classList.remove('hidden');
}

/**
 * Cerrar panel de detalles
 */
function cerrarPanelDetalles() {
    document.getElementById('panelDetalles').classList.add('hidden');
}

/**
 * Ver diagrama de flujo
 */
async function verDiagramaFlujo() {
    try {
        const response = await fetch('/admin/api/configuracion/estados-solicitud/diagrama', {
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        const data = await response.json();

        if (data.success) {
            renderizarDiagrama(data.diagrama);
            document.getElementById('diagramaModal').classList.remove('hidden');
        } else {
            mostrarError('Error al cargar diagrama');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al cargar diagrama');
    }
}

/**
 * Renderizar diagrama de flujo
 */
function renderizarDiagrama(diagrama) {
    const container = document.getElementById('diagramaContainer');

    // Renderizado simple del diagrama
    let html = '<div class="space-y-8">';

    // Agrupar por tipo
    const estadosPorTipo = {
        inicial: diagrama.nodos.filter(n => n.tipo === 'inicial'),
        proceso: diagrama.nodos.filter(n => n.tipo === 'proceso'),
        bloqueante: diagrama.nodos.filter(n => n.tipo === 'bloqueante'),
        final: diagrama.nodos.filter(n => n.tipo === 'final')
    };

    const tipoNombres = {
        inicial: 'Estados Iniciales',
        proceso: 'Estados en Proceso',
        bloqueante: 'Estados Bloqueantes',
        final: 'Estados Finales'
    };

    for (const [tipo, estados] of Object.entries(estadosPorTipo)) {
        if (estados.length === 0) continue;

        html += `<div>`;
        html += `<h4 class="font-medium text-gray-700 mb-3">${tipoNombres[tipo]}</h4>`;
        html += `<div class="grid grid-cols-4 gap-4">`;

        estados.forEach(estado => {
            const siguientes = diagrama.aristas.filter(a => a.from === estado.id);

            html += `
                <div class="bg-white border-2 rounded-lg p-4 text-center" style="border-color: ${estado.color};">
                    ${estado.icono ? `<div class="text-3xl mb-2">${estado.icono}</div>` : ''}
                    <div class="font-medium text-sm">${estado.nombre}</div>
                    <div class="text-xs text-gray-500 mt-1">${estado.codigo}</div>
                    ${siguientes.length > 0 ? `<div class="text-xs text-gray-400 mt-2">${siguientes.length} transición(es)</div>` : ''}
                </div>
            `;
        });

        html += `</div></div>`;
    }

    html += '</div>';

    container.innerHTML = html;
}

/**
 * Cerrar modal de diagrama
 */
function cerrarDiagrama() {
    document.getElementById('diagramaModal').classList.add('hidden');
}

/**
 * Funciones de utilidad para mostrar mensajes
 */
function mostrarExito(mensaje) {
    Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: mensaje,
        timer: 3000,
        timerProgressBar: true,
        toast: true,
        position: 'top-end',
        showConfirmButton: false
    });
}

function mostrarError(mensaje) {
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: mensaje,
        confirmButtonText: 'Entendido'
    });
}

function mostrarAdvertencia(mensaje) {
    Swal.fire({
        icon: 'warning',
        title: 'Advertencia',
        text: mensaje,
        confirmButtonText: 'Entendido'
    });
}
