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

        const response = await fetch(`/admin/api/tipos-solicitud?${params}`);
        const data = await response.json();

        if (data.data.length === 0) {
            mostrarEstadoVacio();
        } else {
            renderizarTipos(data.data);
        }
    } catch (error) {
        console.error('Error al cargar tipos:', error);
        mostrarToast('Error al cargar tipos de solicitud', 'error');
    }
}

async function cargarCategorias() {
    try {
        const response = await fetch('/admin/api/tipos-solicitud/categorias/lista');
        const data = await response.json();
        
        const select = document.getElementById('filterCategoria');
        data.categorias.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar categorías:', error);
    }
}

async function cargarAreas() {
    try {
        const response = await fetch('/admin/api/areas');
        const areas = await response.json();
        
        const select = document.getElementById('filterArea');
        areas.forEach(area => {
            const option = document.createElement('option');
            option.value = area.id;
            option.textContent = area.nombre;
            select.appendChild(option);
        });
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

function abrirModalNuevoTipo() {
    mostrarInfo('Modal de creación próximamente', 'En Desarrollo');
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
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                }
            });

            if (response.ok) {
                mostrarToast('Tipo de solicitud eliminado', 'success');
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
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            }
        });

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

