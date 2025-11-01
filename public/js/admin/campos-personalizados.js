// ========================================
// UTILIDADES
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

    const icons = {
        'success': 'success',
        'error': 'error',
        'warning': 'warning',
        'info': 'info'
    };

    Toast.fire({
        icon: icons[type] || 'success',
        title: message
    });
}

// ========================================
// ESTADO GLOBAL
// ========================================

let vistaActual = 'cards'; // cards, lista, categoria
let paginaActual = 1;
let filtrosActuales = {
    search: '',
    categoria: '',
    tipo: '',
    estado: 'activos'
};
let temporizadorBusqueda = null;

// Wizard
let pasoActualWizard = 1;
let campoIdEditando = null;
let datosWizardTemp = {};

// ========================================
// INICIALIZACIÓN
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    cargarCampos();
    cargarCategorias();
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
            cargarCampos();
        }, 500);
    });

    // Filtros
    document.getElementById('filterCategoria').addEventListener('change', function(e) {
        filtrosActuales.categoria = e.target.value;
        paginaActual = 1;
        cargarCampos();
    });

    document.getElementById('filterTipo').addEventListener('change', function(e) {
        filtrosActuales.tipo = e.target.value;
        paginaActual = 1;
        cargarCampos();
    });

    document.getElementById('filterEstado').addEventListener('change', function(e) {
        filtrosActuales.estado = e.target.value;
        paginaActual = 1;
        cargarCampos();
    });

    // Items por página
    const perPageSelect = document.getElementById('perPageSelect');
    if (perPageSelect) {
        perPageSelect.addEventListener('change', function(e) {
            paginaActual = 1;
            cargarCampos();
        });
    }

    // Cerrar dropdown al hacer clic fuera
    document.addEventListener('click', function(e) {
        if (!e.target.closest('[id^="menu-campo-"]') && !e.target.closest('button[onclick^="toggleMenuCampo"]')) {
            cerrarTodosLosMenusCampos();
        }
    });
}

// ========================================
// CARGAR DATOS
// ========================================

async function cargarCampos() {
    try {
        mostrarLoader();

        const perPageSelect = document.getElementById('perPageSelect');
        const perPage = perPageSelect ? perPageSelect.value : 6;
        const params = new URLSearchParams({
            page: paginaActual,
            per_page: perPage,
            ...filtrosActuales
        });

        const response = await fetch(`/admin/api/configuracion/campos-personalizados?${params}`, {
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
            }
        });

        if (!response.ok) {
            const text = await response.text();
            console.error('Error response:', text.substring(0, 200));
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const campos = data.campos.data || [];

        const permissions = data.permissions || {};
        window.userPermissions = permissions;

        if (!Array.isArray(campos) || campos.length === 0) {
            mostrarEstadoVacio();
        } else {
            renderizarCampos(campos);
            renderizarPaginacion(data.campos);
        }

        ocultarLoader();
    } catch (error) {
        console.error('Error al cargar campos:', error);
        mostrarToast('Error al cargar campos personalizados', 'error');
        mostrarEstadoVacio();
        ocultarLoader();
    }
}

async function cargarCategorias() {
    try {
        const response = await fetch('/admin/api/configuracion/campos-personalizados/categorias', {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
            }
        });

        if (response.ok) {
            const data = await response.json();
            const select = document.getElementById('filterCategoria');

            if (data.success && data.categorias) {
                window.categoriasDisponibles = data.categorias;

                // Agregar opciones al select
                Object.entries(data.categorias).forEach(([key, value]) => {
                    const option = document.createElement('option');
                    option.value = key;
                    option.textContent = value;
                    select.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error al cargar categorías:', error);
    }
}

// ========================================
// RENDERIZAR CAMPOS
// ========================================

function renderizarCampos(campos) {
    const container = document.getElementById('camposContainer');

    if (vistaActual === 'categoria') {
        renderizarPorCategoria(campos, container);
    } else if (vistaActual === 'lista') {
        renderizarEnLista(campos, container);
    } else {
        renderizarEnCards(campos, container);
    }
}

function renderizarPorCategoria(campos, container) {
    // Agrupar por categoría
    const camposPorCategoria = {};

    campos.forEach(campo => {
        const cat = campo.categoria || 'sin_categorizar';
        if (!camposPorCategoria[cat]) {
            camposPorCategoria[cat] = [];
        }
        camposPorCategoria[cat].push(campo);
    });

    let html = '';

    Object.entries(camposPorCategoria).forEach(([categoria, camposCategoria]) => {
        const nombreCategoria = window.categoriasDisponibles?.[categoria] || categoria;
        const cantidadCampos = camposCategoria.length;

        html += `
            <div class="mb-6">
                <div class="bg-white rounded-lg shadow-sm overflow-hidden">
                    <!-- Header de categoría -->
                    <button onclick="toggleCategoria('${categoria}')"
                        class="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition">
                        <div class="flex items-center gap-3">
                            <h3 class="text-lg font-semibold text-gray-900">${nombreCategoria}</h3>
                            <span class="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">${cantidadCampos} ${cantidadCampos === 1 ? 'campo' : 'campos'}</span>
                        </div>
                        <svg id="icon-${categoria}" class="w-5 h-5 text-gray-600 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                    </button>

                    <!-- Campos de la categoría -->
                    <div id="campos-${categoria}" class="divide-y divide-gray-200">
        `;

        camposCategoria.forEach(campo => {
            html += generarHTMLCampo(campo);
        });

        html += `
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function renderizarEnLista(campos, container) {
    let html = '<div class="bg-white rounded-lg shadow-sm overflow-hidden"><div class="divide-y divide-gray-200">';

    campos.forEach(campo => {
        html += generarHTMLCampo(campo);
    });

    html += '</div></div>';
    container.innerHTML = html;
}

function renderizarEnCards(campos, container) {
    let html = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">';
  console.log('campos', campos);
    campos.forEach(campo => {
        const estadoClass = campo.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700';
        const estadoTexto = campo.activo ? 'Activo' : 'Inactivo';
        const usos = campo.usos || 0;
        const tipoTexto = obtenerTextoTipo(campo.tipo);

        html += `
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition p-4">
                <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center gap-2">
                        <span class="text-3xl">${campo.icono || '📄'}</span>
                        <div>
                            <h4 class="font-semibold text-gray-900">${campo.nombre}</h4>
                            <span class="text-xs text-gray-500">${tipoTexto}</span>
                        </div>
                    </div>
                    <span class="px-2 py-1 ${estadoClass} text-xs font-medium rounded-full">${estadoTexto}</span>
                </div>

                <div class="mb-3">
                    <code class="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">${campo.variable}</code>
                </div>

                <div class="flex items-center text-sm text-gray-600 mb-4">
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    Usado en <strong class="ml-1">${usos} ${usos > 1 ?  ' tipos de solicitud' : ' tipo de solicitud'}</strong>
                </div>

                <div class="flex justify-end border-t border-gray-200 pt-3">
                    <div style="position: relative; z-index: 50; display: inline-block;">
                        <button onclick="toggleMenuCampo(event, ${campo.id})" class="text-gray-400 hover:text-gray-600 p-1" style="display: inline-flex; align-items: center; justify-content: center;">
                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path>
                            </svg>
                        </button>
                        <div id="menu-campo-${campo.id}" class="hidden" style="position: fixed; width: 12rem; border-radius: 0.375rem; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); background-color: white; border: 1px solid rgba(0, 0, 0, 0.05); z-index: 9999;">
                            <div style="padding: 0.25rem 0;">
                                ${window.userPermissions.canEdit ? `
                                <a href="#" onclick="event.stopPropagation(); editarCampo(${campo.id}); return false;" style="display: flex; align-items: center; padding: 0.5rem 1rem; font-size: 0.875rem; color: #374151; text-decoration: none;" onmouseover="this.style.backgroundColor='#f3f4f6'" onmouseout="this.style.backgroundColor='transparent'">
                                    <svg class="w-4 h-4" style="margin-right: 0.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                    </svg>
                                    Editar
                                </a>
                                ` : ''}
                                ${window.userPermissions.canDuplicate ? `
                                <a href="#" onclick="event.stopPropagation(); duplicarCampo(${campo.id}); return false;" style="display: flex; align-items: center; padding: 0.5rem 1rem; font-size: 0.875rem; color: #374151; text-decoration: none;" onmouseover="this.style.backgroundColor='#f3f4f6'" onmouseout="this.style.backgroundColor='transparent'">
                                    <svg class="w-4 h-4" style="margin-right: 0.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                                    </svg>
                                    Duplicar
                                </a>
                                ` : ''}
                                ${window.userPermissions.canVerUso ? `
                                <a href="#" onclick="event.stopPropagation(); verUsoCampo(${campo.id}); return false;" style="display: flex; align-items: center; padding: 0.5rem 1rem; font-size: 0.875rem; color: #374151; text-decoration: none;" onmouseover="this.style.backgroundColor='#f3f4f6'" onmouseout="this.style.backgroundColor='transparent'">
                                    <svg class="w-4 h-4" style="margin-right: 0.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                                    </svg>
                                    Ver uso
                                </a>
                                ` : ''}
                                ${window.userPermissions.canActivate ? `
                                <a href="#" onclick="event.stopPropagation(); toggleEstadoCampo(${campo.id}); return false;" style="display: flex; align-items: center; padding: 0.5rem 1rem; font-size: 0.875rem; color: #374151; text-decoration: none;" onmouseover="this.style.backgroundColor='#f3f4f6'" onmouseout="this.style.backgroundColor='transparent'">
                                    <svg class="w-4 h-4" style="margin-right: 0.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M${campo.activo ? '18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' : '9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'}"></path>
                                    </svg>
                                    ${campo.activo ? 'Desactivar' : 'Activar'}
                                </a>
                                ` : ''}
                                ${window.userPermissions.canDelete ? `
                                <a href="#" onclick="event.stopPropagation(); eliminarCampo(${campo.id}); return false;" style="display: flex; align-items: center; padding: 0.5rem 1rem; font-size: 0.875rem; color: #dc2626; text-decoration: none;" onmouseover="this.style.backgroundColor='#f3f4f6'" onmouseout="this.style.backgroundColor='transparent'">
                                    <svg class="w-4 h-4" style="margin-right: 0.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                    </svg>
                                    Eliminar
                                </a>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

function generarHTMLCampo(campo) {
    const estadoClass = campo.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700';
    const estadoTexto = campo.activo ? 'Activo' : 'Inactivo';
    const usos = campo.usos || 0;
    const tipoTexto = obtenerTextoTipo(campo.tipo);

    return `
        <div style="overflow: visible; position: relative;" class="p-4 hover:bg-gray-50 transition">
            <div class="flex items-start justify-between">
                <div class="flex items-start gap-3 flex-1">
                    <span class="text-2xl">${campo.icono || '📄'}</span>
                    <div class="flex-1">
                        <h4 class="font-semibold text-gray-900 mb-1">${campo.nombre}</h4>
                        <div class="flex flex-wrap gap-2 text-sm text-gray-600 mb-2">
                            <span class="flex items-center">
                                <span class="font-medium">Tipo:</span>
                                <span class="ml-1">${tipoTexto}</span>
                            </span>
                            <span class="text-gray-400">|</span>
                            <span class="flex items-center">
                                <span class="font-medium">Variable:</span>
                                <code class="ml-1 px-2 py-0.5 bg-gray-100 rounded text-xs">${campo.variable}</code>
                            </span>
                        </div>
                        <div class="flex items-center gap-3 text-sm">
                            <span class="text-gray-600">Usado en: <strong>${usos}</strong> tipo(s) de solicitud</span>
                            <span class="px-2 py-1 ${estadoClass} text-xs font-medium rounded-full">${estadoTexto}</span>
                        </div>
                    </div>
                </div>

                <!-- Menú de acciones -->
                <div style="position: relative; z-index: 50;" class="ml-4">
                    <button onclick="toggleMenuCampo(event, ${campo.id})" class="text-gray-400 hover:text-gray-600 p-1" style="display: inline-flex; align-items: center; justify-content: center;">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path>
                        </svg>
                    </button>
                    <div id="menu-campo-${campo.id}" class="hidden" style="position: fixed; width: 12rem; border-radius: 0.375rem; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); background-color: white; border: 1px solid rgba(0, 0, 0, 0.05); z-index: 9999;">
                        <div style="padding: 0.25rem 0;">
                            <a href="#" onclick="event.stopPropagation(); editarCampo(${campo.id}); return false;" style="display: flex; align-items: center; padding: 0.5rem 1rem; font-size: 0.875rem; color: #374151; text-decoration: none;" onmouseover="this.style.backgroundColor='#f3f4f6'" onmouseout="this.style.backgroundColor='transparent'">
                                <svg class="w-4 h-4" style="margin-right: 0.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                </svg>
                                Editar
                            </a>
                            <a href="#" onclick="event.stopPropagation(); duplicarCampo(${campo.id}); return false;" style="display: flex; align-items: center; padding: 0.5rem 1rem; font-size: 0.875rem; color: #374151; text-decoration: none;" onmouseover="this.style.backgroundColor='#f3f4f6'" onmouseout="this.style.backgroundColor='transparent'">
                                <svg class="w-4 h-4" style="margin-right: 0.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                                </svg>
                                Duplicar
                            </a>
                            <a href="#" onclick="event.stopPropagation(); verUsoCampo(${campo.id}); return false;" style="display: flex; align-items: center; padding: 0.5rem 1rem; font-size: 0.875rem; color: #374151; text-decoration: none;" onmouseover="this.style.backgroundColor='#f3f4f6'" onmouseout="this.style.backgroundColor='transparent'">
                                <svg class="w-4 h-4" style="margin-right: 0.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                                </svg>
                                Ver uso
                            </a>
                            <a href="#" onclick="event.stopPropagation(); toggleEstadoCampo(${campo.id}); return false;" style="display: flex; align-items: center; padding: 0.5rem 1rem; font-size: 0.875rem; color: #374151; text-decoration: none;" onmouseover="this.style.backgroundColor='#f3f4f6'" onmouseout="this.style.backgroundColor='transparent'">
                                <svg class="w-4 h-4" style="margin-right: 0.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M${campo.activo ? '18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' : '9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'}"></path>
                                </svg>
                                ${campo.activo ? 'Desactivar' : 'Activar'}
                            </a>
                            <a href="#" onclick="event.stopPropagation(); eliminarCampo(${campo.id}); return false;" style="display: flex; align-items: center; padding: 0.5rem 1rem; font-size: 0.875rem; color: #dc2626; text-decoration: none;" onmouseover="this.style.backgroundColor='#f3f4f6'" onmouseout="this.style.backgroundColor='transparent'">
                                <svg class="w-4 h-4" style="margin-right: 0.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                </svg>
                                Eliminar
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ========================================
// FUNCIONES DE VISTA
// ========================================

function cambiarVista(vista) {
    vistaActual = vista;

    // Actualizar botones
    ['cards', 'lista', 'categoria'].forEach(v => {
        const btn = document.getElementById(`btnVista${v.charAt(0).toUpperCase() + v.slice(1)}`);
        if (v === vista) {
            btn.className = 'px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium';
        } else {
            btn.className = 'px-3 py-1 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50';
        }
    });

    cargarCampos();
}

function toggleCategoria(categoria) {
    const campos = document.getElementById(`campos-${categoria}`);
    const icon = document.getElementById(`icon-${categoria}`);

    if (campos.classList.contains('hidden')) {
        campos.classList.remove('hidden');
        icon.classList.remove('rotate-180');
        
        // Habilitar overflow para campos-datos_generales cuando se despliega
        if (categoria === 'datos_generales') {
            campos.style.overflow = 'visible';
            campos.style.maxHeight = 'none';
        }
    } else {
        campos.classList.add('hidden');
        icon.classList.add('rotate-180');
        
        // Restaurar overflow cuando se contrae
        if (categoria === 'datos_generales') {
            campos.style.overflow = '';
            campos.style.maxHeight = '';
        }
    }
}

// ========================================
// PAGINACIÓN
// ========================================

function renderizarPaginacion(data) {
    // Actualizar información de registros
    document.getElementById('showingFrom').textContent = data.from || 0;
    document.getElementById('showingTo').textContent = data.to || 0;
    document.getElementById('totalCampos').textContent = data.total || 0;

    const pagination = document.getElementById('pagination');
    let html = '';

    // Botón anterior
    html += `
        <button onclick="cambiarPagina(${data.current_page - 1})"
                ${data.current_page === 1 ? 'disabled' : ''}
                class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${data.current_page === 1 ? 'cursor-not-allowed opacity-50' : ''}">
            Anterior
        </button>
    `;

    // Páginas
    for (let i = 1; i <= data.last_page; i++) {
        if (i === 1 || i === data.last_page || (i >= data.current_page - 2 && i <= data.current_page + 2)) {
            html += `
                <button onclick="cambiarPagina(${i})"
                        class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${
                            i === data.current_page
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white text-gray-500 hover:bg-gray-50'
                        }">
                    ${i}
                </button>
            `;
        } else if (i === data.current_page - 3 || i === data.current_page + 3) {
            html += '<span class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>';
        }
    }

    // Botón siguiente
    html += `
        <button onclick="cambiarPagina(${data.current_page + 1})"
                ${data.current_page === data.last_page ? 'disabled' : ''}
                class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${data.current_page === data.last_page ? 'cursor-not-allowed opacity-50' : ''}">
            Siguiente
        </button>
    `;

    pagination.innerHTML = html;
}

function cambiarPagina(page) {
    paginaActual = page;
    cargarCampos();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ========================================
// MANEJO DE DROPDOWN
// ========================================
function toggleMenuCampo(event, id) {
    event.stopPropagation();
    const button = event.currentTarget;
    const menu = document.getElementById(`menu-campo-${id}`);
    
    if (!menu) return;
    
    const estaAbierto = !menu.classList.contains('hidden');
    
    // Cerrar todos los menús primero
    cerrarTodosLosMenusCampos();
    
    // Si el menú estaba cerrado, abrirlo
    if (!estaAbierto) {
        // Obtener posición del botón
        const buttonRect = button.getBoundingClientRect();
        const menuHeight = 240; // Altura aproximada del menú
        const spaceBelow = window.innerHeight - buttonRect.bottom;
        const spaceAbove = buttonRect.top;
        
        // Decidir si abrir hacia arriba o hacia abajo
        if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
            // Abrir hacia arriba
            menu.style.top = '';
            menu.style.bottom = (window.innerHeight - buttonRect.top + 8) + 'px';
        } else {
            // Abrir hacia abajo
            menu.style.bottom = '';
            menu.style.top = (buttonRect.bottom + 8) + 'px';
        }
        
        // Posicionar a la derecha del botón
        menu.style.right = (window.innerWidth - buttonRect.right) + 'px';
        menu.style.left = '';
        
        menu.classList.remove('hidden');
    }
}

function cerrarTodosLosMenusCampos() {
    document.querySelectorAll('[id^="menu-campo-"]').forEach(menu => {
        menu.classList.add('hidden');
    });
}

// ========================================
// ACCIONES DE CAMPOS
// ========================================

async function editarCampo(id) {
    try {
        const response = await fetch(`/admin/api/configuracion/campos-personalizados/${id}`, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
            }
        });

        if (response.ok) {
            const data = await response.json();
            campoIdEditando = id;
            abrirModalEditarCampo(data.campo);
        }
    } catch (error) {
        console.error('Error al cargar campo:', error);
        mostrarToast('Error al cargar el campo', 'error');
    }
}

async function duplicarCampo(id) {
    try {
        const response = await fetch(`/admin/api/configuracion/campos-personalizados/${id}/duplicar`, {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
            }
        });

        if (response.ok) {
            const data = await response.json();
            mostrarToast(data.message || 'Campo duplicado exitosamente', 'success');
            cargarCampos();
        }
    } catch (error) {
        console.error('Error al duplicar campo:', error);
        mostrarToast('Error al duplicar el campo', 'error');
    }
}

async function verUsoCampo(id) {
    try {
        const response = await fetch(`/admin/api/configuracion/campos-personalizados/${id}/uso`, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
            }
        });

        if (response.ok) {
            const data = await response.json();
            mostrarModalUso(data);
        }
    } catch (error) {
        console.error('Error al ver uso:', error);
        mostrarToast('Error al cargar información de uso', 'error');
    }
}

function mostrarModalUso(data) {
    const tiposSolicitud = data.tipos_solicitud || [];
    const totalUsos = data.total_usos || 0;
    const nombreCampo = data.campo || 'Campo';

    let listaHTML = '';
    if (tiposSolicitud.length === 0) {
        listaHTML = '<p class="text-gray-600 text-center py-4">Este campo no está siendo usado en ningún tipo de solicitud</p>';
    } else {
        listaHTML = '<ul class="divide-y divide-gray-200">';
        tiposSolicitud.forEach(tipo => {
            listaHTML += `
                <li class="py-3 flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <span class="text-2xl">${tipo.icono || '📋'}</span>
                        <div>
                            <p class="font-medium text-gray-900">${tipo.nombre}</p>
                            <p class="text-sm text-gray-500">${tipo.descripcion || 'Sin descripción'}</p>
                        </div>
                    </div>
                    <span class="px-2 py-1 ${tipo.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'} text-xs font-medium rounded-full">
                        ${tipo.activo ? 'Activo' : 'Inactivo'}
                    </span>
                </li>
            `;
        });
        listaHTML += '</ul>';
    }

    Swal.fire({
        title: `Uso del Campo: ${nombreCampo}`,
        html: `
            <div class="text-left">
                <div class="mb-4 p-4 bg-blue-50 rounded-lg">
                    <p class="text-sm text-blue-800">
                        Este campo está siendo usado en <strong>${totalUsos}</strong> ${totalUsos === 1 ? 'tipo de solicitud' : 'tipos de solicitud'}
                    </p>
                </div>
                ${listaHTML}
            </div>
        `,
        width: '600px',
        showConfirmButton: true,
        confirmButtonText: 'Cerrar',
        confirmButtonColor: '#3b82f6'
    });
}

async function toggleEstadoCampo(id) {
    try {
        const response = await fetch(`/admin/api/configuracion/campos-personalizados/${id}/toggle`, {
            method: 'PATCH',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
            }
        });

        if (response.ok) {
            const data = await response.json();
            mostrarToast(data.message, 'success');
            cargarCampos();
        }
    } catch (error) {
        console.error('Error al cambiar estado:', error);
        mostrarToast('Error al cambiar el estado', 'error');
    }
}

async function eliminarCampo(id) {
    const result = await Swal.fire({
        title: '¿Eliminar campo?',
        text: 'Esta acción no se puede deshacer',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        try {
            const response = await fetch(`/admin/api/configuracion/campos-personalizados/${id}`, {
                method: 'DELETE',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                }
            });

            const data = await response.json();

            if (response.ok && data.success) {
                mostrarToast(data.message, 'success');
                cargarCampos();
            } else {
                mostrarToast(data.message || 'Error al eliminar', 'error');
            }
        } catch (error) {
            console.error('Error al eliminar:', error);
            mostrarToast('Error al eliminar el campo', 'error');
        }
    }
}

// ========================================
// WIZARD - MODAL
// ========================================

function abrirModalNuevoCampo() {
    pasoActualWizard = 1;
    campoIdEditando = null;
    datosWizardTemp = {};

    const modal = document.createElement('div');
    modal.id = 'wizardModal';
    modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50';
    modal.innerHTML = generarHTMLWizard('Crear Nuevo Campo Personalizado', false);

    document.body.appendChild(modal);
    mostrarPasoWizard(1);
}

function abrirModalEditarCampo(campo) {
    pasoActualWizard = 1;
    campoIdEditando = campo.id;
    datosWizardTemp = { datosOriginales: campo, modoEdicion: true };

    const modal = document.createElement('div');
    modal.id = 'wizardModal';
    modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50';
    modal.innerHTML = generarHTMLWizard(`Editar Campo: ${campo.nombre}`, true);

    document.body.appendChild(modal);
    mostrarPasoWizard(1);
}

function generarHTMLWizard(titulo, modoEdicion) {
    const colorGradient = modoEdicion ? 'from-green-600 to-green-700' : 'from-blue-600 to-blue-700';

    return `
        <div class="relative top-10 mx-auto p-0 border w-11/12 max-w-5xl shadow-lg bg-white rounded-2xl mb-10">
            <!-- Header -->
            <div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r ${colorGradient} rounded-t-2xl">
                <div class="flex items-center justify-between">
                    <h3 class="text-xl font-semibold text-white">${titulo}</h3>
                    <button type="button" onclick="cerrarWizard()" class="text-white hover:text-gray-200">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                <!-- Progress Bar -->
                <div class="mt-4">
                    <div class="flex items-center justify-between">
                        <!-- Paso 1 -->
                        <div class="flex flex-col items-center">
                            <div id="step1Indicator" class="flex items-center justify-center">
                                <div class="w-10 h-10 bg-white text-blue-600 rounded-full flex items-center justify-center font-bold text-lg shadow-lg ring-4 ring-blue-300">1</div>
                            </div>
                            <span class="mt-2 text-xs text-white font-medium text-center">Básico</span>
                        </div>

                        <div class="flex-1 h-1 bg-blue-400 mx-2 max-w-[60px]"></div>

                        <!-- Paso 2 -->
                        <div class="flex flex-col items-center">
                            <div id="step2Indicator" class="flex items-center justify-center">
                                <div class="w-10 h-10 bg-blue-400 text-white rounded-full flex items-center justify-center font-semibold text-lg">2</div>
                            </div>
                            <span class="mt-2 text-xs text-white font-medium text-center">Tipo</span>
                        </div>

                        <div class="flex-1 h-1 bg-blue-400 mx-2 max-w-[60px]"></div>

                        <!-- Paso 3 -->
                        <div class="flex flex-col items-center">
                            <div id="step3Indicator" class="flex items-center justify-center">
                                <div class="w-10 h-10 bg-blue-400 text-white rounded-full flex items-center justify-center font-semibold text-lg">3</div>
                            </div>
                            <span class="mt-2 text-xs text-white font-medium text-center">Validación</span>
                        </div>

                        <div class="flex-1 h-1 bg-blue-400 mx-2 max-w-[60px]"></div>

                        <!-- Paso 4 -->
                        <div class="flex flex-col items-center">
                            <div id="step4Indicator" class="flex items-center justify-center">
                                <div class="w-10 h-10 bg-blue-400 text-white rounded-full flex items-center justify-center font-semibold text-lg">4</div>
                            </div>
                            <span class="mt-2 text-xs text-white font-medium text-center">Visual</span>
                        </div>

                        <div class="flex-1 h-1 bg-blue-400 mx-2 max-w-[60px]"></div>

                        <!-- Paso 5 -->
                        <div class="flex flex-col items-center">
                            <div id="step5Indicator" class="flex items-center justify-center">
                                <div class="w-10 h-10 bg-blue-400 text-white rounded-full flex items-center justify-center font-semibold text-lg">5</div>
                            </div>
                            <span class="mt-2 text-xs text-white font-medium text-center">Avanzado</span>
                        </div>

                        <div class="flex-1 h-1 bg-blue-400 mx-2 max-w-[60px]"></div>

                        <!-- Paso 6 -->
                        <div class="flex flex-col items-center">
                            <div id="step6Indicator" class="flex items-center justify-center">
                                <div class="w-10 h-10 bg-blue-400 text-white rounded-full flex items-center justify-center font-semibold text-lg">6</div>
                            </div>
                            <span class="mt-2 text-xs text-white font-medium text-center">Resumen</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Body -->
            <div class="px-6 py-6">
                <div id="wizardContent" class="min-h-[400px]">
                    <!-- Contenido del paso -->
                </div>
            </div>

            <!-- Footer -->
            <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between rounded-b-2xl">
                <button type="button" onclick="cerrarWizard()" class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                 </svg>  Cancelar
                </button>
                <div class="flex gap-2">
                    <button type="button" id="btnAnterior" onclick="pasoAnteriorWizard()"
                        class="hidden px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                        </svg>  Anterior
                    </button>
                    <button type="button" id="btnSiguiente" onclick="pasoSiguienteWizard()"
                        class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                        </svg>  Siguiente
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ========================================
// WIZARD - NAVEGACIÓN Y PASOS
// ========================================

function mostrarPasoWizard(paso) {
    pasoActualWizard = paso;

    // Actualizar indicadores con el nuevo estilo
    for (let i = 1; i <= 6; i++) {
        const indicator = document.getElementById(`step${i}Indicator`);
        const circle = indicator.querySelector('div');

        if (i < paso) {
            // Paso completado - Verde con checkmark
            circle.className = 'w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg';
            circle.innerHTML = '✓';
        } else if (i === paso) {
            // Paso actual - Blanco con ring azul (efecto resaltado)
            circle.className = 'w-10 h-10 bg-white text-blue-600 rounded-full flex items-center justify-center font-bold text-lg shadow-lg ring-4 ring-blue-300';
            circle.innerHTML = i;
        } else {
            // Paso pendiente - Azul claro
            circle.className = 'w-10 h-10 bg-blue-400 text-white rounded-full flex items-center justify-center font-semibold text-lg';
            circle.innerHTML = i;
        }
    }

    // Actualizar las líneas conectoras
    const progressContainer = document.querySelector('#wizardModal .flex.items-center.justify-between');
    const lines = progressContainer ? progressContainer.querySelectorAll('.flex-1.h-1') : [];

    lines.forEach((line, index) => {
        const linePosition = index + 1; // La línea 0 está entre paso 1 y 2

        if (linePosition < pasoActualWizard) {
            // Línea completada - Verde
            line.className = 'flex-1 h-1 bg-green-500 mx-2 max-w-[60px]';
        } else {
            // Línea pendiente - Azul claro
            line.className = 'flex-1 h-1 bg-blue-400 mx-2 max-w-[60px]';
        }
    });

    // Actualizar botones
    const btnAnterior = document.getElementById('btnAnterior');
    const btnSiguiente = document.getElementById('btnSiguiente');

    if (paso === 1) {
        btnAnterior.classList.add('hidden');
    } else {
        btnAnterior.classList.remove('hidden');
    }

    if (paso === 6) {
        btnSiguiente.textContent = campoIdEditando ? 'Guardar Cambios' : 'Crear Campo';
        btnSiguiente.classList.remove('bg-blue-600', 'hover:bg-blue-700');
        btnSiguiente.classList.add('bg-green-600', 'hover:bg-green-700');
    } else {
        btnSiguiente.textContent = 'Siguiente →';
        btnSiguiente.classList.remove('bg-green-600', 'hover:bg-green-700');
        btnSiguiente.classList.add('bg-blue-600', 'hover:bg-blue-700');
    }

    // Renderizar contenido del paso
    const content = document.getElementById('wizardContent');

    switch(paso) {
        case 1:
            content.innerHTML = generarPaso1();
            setTimeout(() => {
                inicializarPaso1();
                restaurarDatosPaso1();
            }, 100);
            break;
        case 2:
            content.innerHTML = generarPaso2();
            setTimeout(() => {
                inicializarPaso2();
                restaurarDatosPaso2();
            }, 100);
            break;
        case 3:
            content.innerHTML = generarPaso3();
            setTimeout(() => {
                inicializarPaso3();
                restaurarDatosPaso3();
            }, 100);
            break;
        case 4:
            content.innerHTML = generarPaso4();
            setTimeout(() => {
                inicializarPaso4();
                restaurarDatosPaso4();
            }, 100);
            break;
        case 5:
            content.innerHTML = generarPaso5();
            setTimeout(() => {
                inicializarPaso5();
                restaurarDatosPaso5();
            }, 100);
            break;
        case 6:
            content.innerHTML = generarPaso6();
            setTimeout(() => inicializarPaso6(), 100);
            break;
    }
}

async function pasoSiguienteWizard() {
    // Guardar datos del paso actual
    if (!await guardarDatosPaso(pasoActualWizard)) {
        return; // No continuar si hay errores de validación
    }

    if (pasoActualWizard === 6) {
        await finalizarWizard();
    } else {
        mostrarPasoWizard(pasoActualWizard + 1);
    }
}

async function pasoAnteriorWizard() {
    if (pasoActualWizard > 1) {
        // Guardar datos del paso actual SIN validar (permitir retroceder incluso con errores)
        await guardarDatosPasoSinValidar(pasoActualWizard);
        mostrarPasoWizard(pasoActualWizard - 1);
    }
}

function cerrarWizard() {
    const modal = document.getElementById('wizardModal');
    if (modal) {
        modal.remove();
    }
    pasoActualWizard = 1;
    campoIdEditando = null;
    datosWizardTemp = {};
}

// ========================================
// WIZARD - PASO 1: INFORMACIÓN BÁSICA
// ========================================

function generarPaso1() {
    return `
        <div class="space-y-6">
            <div>
                <h3 class="text-lg font-semibold text-gray-900 mb-2">Información Básica</h3>
                <p class="text-sm text-gray-600">Defina la información fundamental del campo personalizado</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Nombre -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Nombre del Campo <span class="text-red-500">*</span>
                    </label>
                    <input type="text" id="campo_nombre" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="ej: Número de matrícula">
                    <p class="mt-1 text-xs text-gray-500">Nombre interno para identificar el campo</p>
                    <p id="campo_nombre_error" class="mt-1 text-xs text-red-500"></p>
                    </div>

                <!-- Etiqueta -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Etiqueta Visible <span class="text-red-500">*</span>
                    </label>
                    <input type="text" id="campo_etiqueta" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="ej: Número de Matrícula Inmobiliaria">
                    <p class="mt-1 text-xs text-gray-500">Texto que verá el usuario en el formulario</p>
                    <p id="campo_etiqueta_error" class="mt-1 text-xs text-red-500"></p>
                </div>

                <!-- Slug (generado automáticamente) -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Slug <span class="text-red-500">*</span>
                    </label>
                    <input type="text" id="campo_slug" readonly class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600" placeholder="Se genera automáticamente">
                    <p class="mt-1 text-xs text-gray-500">Identificador único del campo</p>
                    <p id="campo_slug_error" class="mt-1 text-xs text-red-500"></p>
                </div>

                <!-- Variable -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Variable para Plantillas
                    </label>
                    <input type="text" id="campo_variable" readonly class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 font-mono text-sm" placeholder="{{campo.slug}}">
                    <p class="mt-1 text-xs text-gray-500">Use esta variable en documentos y notificaciones</p>
                </div>

                <!-- Categoría -->
                <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Categoría <span class="text-red-500">*</span>
                    </label>
                    <select id="campo_categoria" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="">Seleccione una categoría</option>
                        <option value="datos_generales">Datos Generales</option>
                        <option value="datos_predio">Datos del Predio</option>
                        <option value="informacion_tecnica">Información Técnica</option>
                        <option value="archivos_documentos">Archivos y Documentos</option>
                        <option value="sin_categorizar">Sin Categorizar</option>
                    </select>
                    <p class="mt-1 text-xs text-gray-500">Agrupe campos relacionados en categorías</p>
                    <p id="campo_categoria_error" class="mt-1 text-xs text-red-500"></p>
                </div>

                <!-- Descripción -->
                <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Descripción
                    </label>
                    <textarea id="campo_descripcion" rows="3" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Descripción opcional del campo y su propósito"></textarea>
                    <p class="mt-1 text-xs text-gray-500">Ayuda a otros administradores a entender el propósito del campo</p>
                </div>
            </div>
        </div>
    `;
}

function inicializarPaso1() {
    const nombreInput = document.getElementById('campo_nombre');
    const etiquetaInput = document.getElementById('campo_etiqueta');
    const slugInput = document.getElementById('campo_slug');
    const variableInput = document.getElementById('campo_variable');

    // Auto-generar slug y variable desde el nombre
    nombreInput.addEventListener('input', async function() {
        const nombre = this.value.trim();

        if (nombre) {
            try {
                const response = await fetch('/admin/api/configuracion/campos-personalizados/generar-slug', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                    },
                    body: JSON.stringify({ nombre })
                });

                if (response.ok) {
                    const data = await response.json();
                    slugInput.value = data.slug;
                    variableInput.value = data.variable;
                }
            } catch (error) {
                console.error('Error al generar slug:', error);
            }
        } else {
            slugInput.value = '';
            variableInput.value = '';
        }
    });

    // Si es modo edición, cargar datos
    if (datosWizardTemp.modoEdicion && datosWizardTemp.datosOriginales) {
        const campo = datosWizardTemp.datosOriginales;
        nombreInput.value = campo.nombre || '';
        etiquetaInput.value = campo.etiqueta || '';
        slugInput.value = campo.slug || '';
        variableInput.value = campo.variable || '';
        document.getElementById('campo_categoria').value = campo.categoria || '';
        document.getElementById('campo_descripcion').value = campo.descripcion || '';
    }
}

async function guardarDatosPaso(paso) {
    switch(paso) {
        case 1:
            return validarPaso1();
        case 2:
            return validarPaso2();
        case 3:
            return validarPaso3();
        case 4:
            return validarPaso4();
        case 5:
            return validarPaso5();
        case 6:
            return true; // El paso 6 es solo resumen
        default:
            return true;
    }
}

/**
 * Guardar datos del paso actual SIN validar
 * Se usa al ir hacia atrás para no perder información
 */
async function guardarDatosPasoSinValidar(paso) {
    console.log('💾 Guardando datos del paso', paso, 'sin validar');

    switch(paso) {
        case 1:
            guardarDatosPaso1SinValidar();
            break;
        case 2:
            guardarDatosPaso2SinValidar();
            break;
        case 3:
            guardarDatosPaso3SinValidar();
            break;
        case 4:
            guardarDatosPaso4SinValidar();
            break;
        case 5:
            guardarDatosPaso5SinValidar();
            break;
        default:
            break;
    }
}

function guardarDatosPaso1SinValidar() {
    const nombre = document.getElementById('campo_nombre')?.value.trim() || '';
    const etiqueta = document.getElementById('campo_etiqueta')?.value.trim() || '';
    const slug = document.getElementById('campo_slug')?.value.trim() || '';
    const variable = document.getElementById('campo_variable')?.value.trim() || '';
    const categoria = document.getElementById('campo_categoria')?.value || '';
    const descripcion = document.getElementById('campo_descripcion')?.value.trim() || '';

    datosWizardTemp.paso1 = {
        nombre,
        etiqueta,
        slug,
        variable,
        categoria,
        descripcion
    };

    console.log('✅ Paso 1 guardado sin validar:', datosWizardTemp.paso1);
}

function guardarDatosPaso2SinValidar() {
    const tipoCampo = document.querySelector('input[name="campo_tipo"]:checked')?.value || '';

    datosWizardTemp.paso2 = {
        tipo: tipoCampo
    };

    console.log('✅ Paso 2 guardado sin validar:', datosWizardTemp.paso2);
}

function guardarDatosPaso3SinValidar() {
    const tipo = datosWizardTemp.paso2?.tipo || '';

    // Recopilar configuración según el tipo
    const configuracion = {};
    const validacion = {
        requerido: document.getElementById('campo_requerido')?.checked || false,
        readonly: document.getElementById('campo_readonly')?.checked || false,
        unico: document.getElementById('campo_unico')?.checked || false,
        indexable: document.getElementById('campo_indexable')?.checked || false
    };

    // Configuraciones específicas por tipo
    document.querySelectorAll('[id^="config_"]').forEach(input => {
        const key = input.id.replace('config_', '');
        if (input.type === 'checkbox') {
            configuracion[key] = input.checked;
        } else if (input.value) {
            configuracion[key] = input.value;
        }
    });

    // Guardar opciones para campos de selección (sin validar si están vacías)
    let opciones = [];
    if (['select', 'select_multiple', 'radio', 'checkbox'].includes(tipo)) {
        const opcionesContainer = document.getElementById('opciones_container');
        if (opcionesContainer) {
            const opcionDivs = opcionesContainer.children;
            for (let i = 0; i < opcionDivs.length; i++) {
                const valor = opcionDivs[i].querySelector('.opcion-valor')?.value.trim();
                const etiqueta = opcionDivs[i].querySelector('.opcion-etiqueta')?.value.trim();

                // Guardar incluso si están vacías para restaurarlas después
                opciones.push({ valor, etiqueta });
            }
        }
    }

    datosWizardTemp.paso3 = {
        validacion,
        configuracion,
        opciones
    };

    console.log('✅ Paso 3 guardado sin validar:', datosWizardTemp.paso3);
}

function guardarDatosPaso4SinValidar() {
    const ancho = document.getElementById('campo_ancho')?.value || '';
    const icono = document.getElementById('campo_icono')?.value.trim() || '';
    const clases_css = document.getElementById('campo_clases_css')?.value.trim() || '';
    const orden = parseInt(document.getElementById('campo_orden')?.value) || 0;
    const activo = document.getElementById('campo_activo')?.checked || false;

    datosWizardTemp.paso4 = {
        ancho,
        icono,
        clases_css,
        orden,
        activo
    };

    console.log('✅ Paso 4 guardado sin validar:', datosWizardTemp.paso4);
}

function guardarDatosPaso5SinValidar() {
    // Ayuda contextual
    const ayuda_contextual = {
        texto: document.getElementById('ayuda_texto')?.value.trim() || '',
        url: document.getElementById('ayuda_url')?.value.trim() || ''
    };

    // Lógica condicional
    let logica_condicional = null;
    if (document.getElementById('logica_habilitar')?.checked) {
        logica_condicional = {
            habilitado: true,
            campo: document.getElementById('logica_campo')?.value || '',
            operador: document.getElementById('logica_operador')?.value || 'igual',
            valor: document.getElementById('logica_valor')?.value || ''
        };
    }

    // Fórmula
    let formula = null;
    if (document.getElementById('formula_habilitar')?.checked) {
        formula = document.getElementById('campo_formula')?.value.trim() || '';
    }

    // Comportamiento
    const comportamiento = {
        autocompletar: document.getElementById('comportamiento_autocompletar')?.checked || false,
        copiar: document.getElementById('comportamiento_copiar')?.checked || false,
        mayusculas: document.getElementById('comportamiento_mayusculas')?.checked || false
    };

    datosWizardTemp.paso5 = {
        ayuda_contextual,
        logica_condicional,
        formula,
        comportamiento
    };

    console.log('✅ Paso 5 guardado sin validar:', datosWizardTemp.paso5);
}

// ========================================
// FUNCIONES DE RESTAURACIÓN DE DATOS
// ========================================

function restaurarDatosPaso1() {
    if (datosWizardTemp.paso1) {
        console.log('🔄 Restaurando datos del Paso 1:', datosWizardTemp.paso1);

        const nombreInput = document.getElementById('campo_nombre');
        const etiquetaInput = document.getElementById('campo_etiqueta');
        const slugInput = document.getElementById('campo_slug');
        const variableInput = document.getElementById('campo_variable');
        const categoriaSelect = document.getElementById('campo_categoria');
        const descripcionTextarea = document.getElementById('campo_descripcion');

        if (nombreInput) nombreInput.value = datosWizardTemp.paso1.nombre || '';
        if (etiquetaInput) etiquetaInput.value = datosWizardTemp.paso1.etiqueta || '';
        if (slugInput) slugInput.value = datosWizardTemp.paso1.slug || '';
        if (variableInput) variableInput.value = datosWizardTemp.paso1.variable || '';
        if (categoriaSelect) categoriaSelect.value = datosWizardTemp.paso1.categoria || '';
        if (descripcionTextarea) descripcionTextarea.value = datosWizardTemp.paso1.descripcion || '';

        console.log('✅ Datos del Paso 1 restaurados correctamente');
    }
}

function restaurarDatosPaso2() {
    if (datosWizardTemp.paso2) {
        console.log('🔄 Restaurando datos del Paso 2:', datosWizardTemp.paso2);

        // Restaurar tipo de campo seleccionado
        if (datosWizardTemp.paso2.tipo) {
            const radio = document.querySelector(`input[name="campo_tipo"][value="${datosWizardTemp.paso2.tipo}"]`);
            if (radio) {
                radio.checked = true;
                console.log(`✅ Tipo de campo "${datosWizardTemp.paso2.tipo}" seleccionado`);
            }
        }

        // Restaurar opciones si existen (para select, radio, checkbox)
        if (datosWizardTemp.paso2.opciones && Array.isArray(datosWizardTemp.paso2.opciones)) {
            window.opcionesCampo = [...datosWizardTemp.paso2.opciones];
            console.log('✅ Opciones restauradas:', window.opcionesCampo);
        }

        console.log('✅ Datos del Paso 2 restaurados correctamente');
    }
}

function restaurarDatosPaso3() {
    if (datosWizardTemp.paso3) {
        console.log('🔄 Restaurando datos del Paso 3:', datosWizardTemp.paso3);

        // Restaurar validaciones
        if (datosWizardTemp.paso3.validacion) {
            const requeridoCheckbox = document.getElementById('campo_requerido');
            if (requeridoCheckbox) {
                requeridoCheckbox.checked = datosWizardTemp.paso3.validacion.requerido || false;
            }

            const readonlyCheckbox = document.getElementById('campo_readonly');
            if (readonlyCheckbox) {
                readonlyCheckbox.checked = datosWizardTemp.paso3.validacion.readonly || false;
            }

            const unicoCheckbox = document.getElementById('campo_unico');
            if (unicoCheckbox) {
                unicoCheckbox.checked = datosWizardTemp.paso3.validacion.unico || false;
            }

            const indexableCheckbox = document.getElementById('campo_indexable');
            if (indexableCheckbox) {
                indexableCheckbox.checked = datosWizardTemp.paso3.validacion.indexable || false;
            }
        }

        // Restaurar configuraciones específicas por tipo
        if (datosWizardTemp.paso3.configuracion) {
            Object.keys(datosWizardTemp.paso3.configuracion).forEach(key => {
                const input = document.getElementById(`config_${key}`);
                if (input) {
                    if (input.type === 'checkbox') {
                        input.checked = datosWizardTemp.paso3.configuracion[key];
                    } else {
                        input.value = datosWizardTemp.paso3.configuracion[key];
                    }
                }
            });
        }

        // Restaurar opciones para campos de selección
        if (datosWizardTemp.paso3.opciones && Array.isArray(datosWizardTemp.paso3.opciones)) {
            const container = document.getElementById('opciones_container');
            if (container) {
                container.innerHTML = '';
                datosWizardTemp.paso3.opciones.forEach(opcion => {
                    agregarOpcionCampo(opcion.valor, opcion.etiqueta);
                });
            }
        }

        console.log('✅ Datos del Paso 3 restaurados correctamente');
    }
}

function restaurarDatosPaso4() {
    if (datosWizardTemp.paso4) {
        console.log('🔄 Restaurando datos del Paso 4:', datosWizardTemp.paso4);

        // Restaurar ancho
        const anchoSelect = document.getElementById('campo_ancho');
        if (anchoSelect) {
            anchoSelect.value = datosWizardTemp.paso4.ancho || '';
        }

        // Restaurar icono
        const iconoInput = document.getElementById('campo_icono');
        if (iconoInput) {
            iconoInput.value = datosWizardTemp.paso4.icono || '';
        }

        // Restaurar clases CSS
        const clasesCssInput = document.getElementById('campo_clases_css');
        if (clasesCssInput) {
            clasesCssInput.value = datosWizardTemp.paso4.clases_css || '';
        }

        // Restaurar orden
        const ordenInput = document.getElementById('campo_orden');
        if (ordenInput) {
            ordenInput.value = datosWizardTemp.paso4.orden || 0;
        }

        // Restaurar estado activo
        const activoCheckbox = document.getElementById('campo_activo');
        if (activoCheckbox) {
            activoCheckbox.checked = datosWizardTemp.paso4.activo || false;
        }

        console.log('✅ Datos del Paso 4 restaurados correctamente');
    }
}

function restaurarDatosPaso5() {
    if (datosWizardTemp.paso5) {
        console.log('🔄 Restaurando datos del Paso 5:', datosWizardTemp.paso5);

        // Restaurar ayuda contextual
        if (datosWizardTemp.paso5.ayuda_contextual) {
            const ayudaTextoTextarea = document.getElementById('ayuda_texto');
            if (ayudaTextoTextarea) {
                ayudaTextoTextarea.value = datosWizardTemp.paso5.ayuda_contextual.texto || '';
            }

            const ayudaUrlInput = document.getElementById('ayuda_url');
            if (ayudaUrlInput) {
                ayudaUrlInput.value = datosWizardTemp.paso5.ayuda_contextual.url || '';
            }
        }

        // Restaurar lógica condicional
        if (datosWizardTemp.paso5.logica_condicional) {
            const logicaHabilitarCheckbox = document.getElementById('logica_habilitar');
            if (logicaHabilitarCheckbox) {
                logicaHabilitarCheckbox.checked = datosWizardTemp.paso5.logica_condicional.habilitado || false;

                if (datosWizardTemp.paso5.logica_condicional.habilitado) {
                    const logicaConfig = document.getElementById('logica_config');
                    if (logicaConfig) {
                        logicaConfig.classList.remove('hidden');
                    }

                    const logicaCampoSelect = document.getElementById('logica_campo');
                    if (logicaCampoSelect) {
                        logicaCampoSelect.value = datosWizardTemp.paso5.logica_condicional.campo || '';
                    }

                    const logicaOperadorSelect = document.getElementById('logica_operador');
                    if (logicaOperadorSelect) {
                        logicaOperadorSelect.value = datosWizardTemp.paso5.logica_condicional.operador || 'igual';
                    }

                    const logicaValorInput = document.getElementById('logica_valor');
                    if (logicaValorInput) {
                        logicaValorInput.value = datosWizardTemp.paso5.logica_condicional.valor || '';
                    }
                }
            }
        }

        // Restaurar fórmula
        if (datosWizardTemp.paso5.formula) {
            const formulaHabilitarCheckbox = document.getElementById('formula_habilitar');
            if (formulaHabilitarCheckbox) {
                formulaHabilitarCheckbox.checked = true;

                const formulaConfig = document.getElementById('formula_config');
                if (formulaConfig) {
                    formulaConfig.classList.remove('hidden');
                }

                const campoFormulaTextarea = document.getElementById('campo_formula');
                if (campoFormulaTextarea) {
                    campoFormulaTextarea.value = datosWizardTemp.paso5.formula;
                }
            }
        }

        // Restaurar comportamiento
        if (datosWizardTemp.paso5.comportamiento) {
            const autocompletarCheckbox = document.getElementById('comportamiento_autocompletar');
            if (autocompletarCheckbox) {
                autocompletarCheckbox.checked = datosWizardTemp.paso5.comportamiento.autocompletar || false;
            }

            const copiarCheckbox = document.getElementById('comportamiento_copiar');
            if (copiarCheckbox) {
                copiarCheckbox.checked = datosWizardTemp.paso5.comportamiento.copiar || false;
            }

            const mayusculasCheckbox = document.getElementById('comportamiento_mayusculas');
            if (mayusculasCheckbox) {
                mayusculasCheckbox.checked = datosWizardTemp.paso5.comportamiento.mayusculas || false;
            }
        }

        console.log('✅ Datos del Paso 5 restaurados correctamente');
    }
}

function validarPaso1() {
    const nombre = document.getElementById('campo_nombre').value.trim();
    const etiqueta = document.getElementById('campo_etiqueta').value.trim();
    const slug = document.getElementById('campo_slug').value.trim();
    const variable = document.getElementById('campo_variable').value.trim();
    const categoria = document.getElementById('campo_categoria').value;
    const descripcion = document.getElementById('campo_descripcion').value.trim();


    const camposObligatorios = ['campo_nombre', 'campo_etiqueta', 'campo_slug', 'campo_categoria'];
    
    let todosValidos = true;
    camposObligatorios.forEach(campo => {
        if (!document.getElementById(campo).value.trim()) {
            document.getElementById(`${campo}_error`).textContent = `El ${campo.replace('campo_', '')} es requerido`;
            todosValidos = false;
        }else{
            document.getElementById(`${campo}_error`).textContent = '';
        }
    });

    if (!todosValidos) {
        mostrarToast('Por favor complete todos los campos obligatorios', 'error');
        return false;
    }

    datosWizardTemp.paso1 = {
        nombre,
        etiqueta,
        slug,
        variable,
        categoria,
        descripcion
    };

    return true;
}

// ========================================
// WIZARD - PASO 2: TIPO DE CAMPO
// ========================================

function generarPaso2() {
    return `
        <div class="space-y-6">
            <div>
                <h3 class="text-lg font-semibold text-gray-900 mb-2">Tipo de Campo</h3>
                <p class="text-sm text-gray-600">Seleccione el tipo de campo que mejor se ajuste a sus necesidades</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <!-- Campos de Texto -->
                <div class="bg-gray-50 p-4 rounded-lg">
                    <h4 class="font-semibold text-gray-900 mb-3 flex items-center">
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                        Campos de Texto
                    </h4>
                    <div class="space-y-2">
                        ${generarRadioTipoCampo('texto_corto', 'Texto corto', '📝', 'Una línea de texto')}
                        ${generarRadioTipoCampo('texto_largo', 'Texto largo', '📄', 'Múltiples líneas (textarea)')}
                        ${generarRadioTipoCampo('email', 'Email', '📧', 'Dirección de correo')}
                        ${generarRadioTipoCampo('telefono', 'Teléfono', '📞', 'Número telefónico')}
                        ${generarRadioTipoCampo('url', 'URL', '🔗', 'Dirección web')}
                    </div>
                </div>

                <!-- Campos Numéricos y Fecha -->
                <div class="bg-gray-50 p-4 rounded-lg">
                    <h4 class="font-semibold text-gray-900 mb-3 flex items-center">
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"></path>
                        </svg>
                        Números y Fechas
                    </h4>
                    <div class="space-y-2">
                        ${generarRadioTipoCampo('numero', 'Número', '🔢', 'Valor numérico')}
                        ${generarRadioTipoCampo('moneda', 'Moneda', '💰', 'Valor monetario')}
                        ${generarRadioTipoCampo('fecha', 'Fecha', '📅', 'Selector de fecha')}
                        ${generarRadioTipoCampo('hora', 'Hora', '🕐', 'Selector de hora')}
                        ${generarRadioTipoCampo('fecha_hora', 'Fecha y Hora', '📆', 'Fecha con hora')}
                    </div>
                </div>

                <!-- Campos de Selección -->
                <div class="bg-gray-50 p-4 rounded-lg">
                    <h4 class="font-semibold text-gray-900 mb-3 flex items-center">
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                        </svg>
                        Selección
                    </h4>
                    <div class="space-y-2">
                        ${generarRadioTipoCampo('select', 'Lista desplegable', '📋', 'Selección única')}
                        ${generarRadioTipoCampo('select_multiple', 'Select múltiple', '☑️', 'Selección múltiple')}
                        ${generarRadioTipoCampo('radio', 'Radio', '⭕', 'Opción única (radio)')}
                        ${generarRadioTipoCampo('checkbox', 'Casilla', '✅', 'Sí/No o múltiple')}
                    </div>
                </div>

                <!-- Archivos -->
                <div class="bg-gray-50 p-4 rounded-lg">
                    <h4 class="font-semibold text-gray-900 mb-3 flex items-center">
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                        </svg>
                        Archivos
                    </h4>
                    <div class="space-y-2">
                        ${generarRadioTipoCampo('archivo', 'Archivo', '📎', 'Cualquier archivo')}
                        ${generarRadioTipoCampo('imagen', 'Imagen', '🖼️', 'Solo imágenes')}
                    </div>
                </div>

                <!-- Especiales -->
                <div class="bg-gray-50 p-4 rounded-lg">
                    <h4 class="font-semibold text-gray-900 mb-3 flex items-center">
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
                        </svg>
                        Especiales
                    </h4>
                    <div class="space-y-2">
                        ${generarRadioTipoCampo('ubicacion', 'Ubicación', '📍', 'Mapa/coordenadas')}
                        ${generarRadioTipoCampo('firma', 'Firma digital', '✍️', 'Captura de firma')}
                        ${generarRadioTipoCampo('identificacion', 'Identificación', '🆔', 'NIT/Cédula')}
                    </div>
                </div>

                <!-- Diseño -->
                <div class="bg-gray-50 p-4 rounded-lg">
                    <h4 class="font-semibold text-gray-900 mb-3 flex items-center">
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"></path>
                        </svg>
                        Diseño
                    </h4>
                    <div class="space-y-2">
                        ${generarRadioTipoCampo('separador', 'Separador', '➖', 'Línea divisoria')}
                        ${generarRadioTipoCampo('texto_informativo', 'Texto informativo', 'ℹ️', 'Solo lectura')}
                    </div>
                </div>
            </div>

            <div id="campo_tipo_error" class="hidden mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
                Por favor seleccione un tipo de campo
            </div>
        </div>
    `;
}

function generarRadioTipoCampo(valor, etiqueta, icono, descripcion) {
    return `
        <label class="flex items-start p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-white hover:border-blue-300 transition group">
            <input type="radio" name="campo_tipo" value="${valor}" class="mt-1 mr-3 text-blue-600 focus:ring-blue-500">
            <div class="flex-1">
                <div class="flex items-center">
                    <span class="text-xl mr-2">${icono}</span>
                    <span class="font-medium text-gray-900 group-hover:text-blue-600">${etiqueta}</span>
                </div>
                <p class="text-xs text-gray-500 mt-1">${descripcion}</p>
            </div>
        </label>
    `;
}

function inicializarPaso2() {
    // Si es modo edición, seleccionar el tipo
    if (datosWizardTemp.modoEdicion && datosWizardTemp.datosOriginales) {
        const tipo = datosWizardTemp.datosOriginales.tipo;
        const radio = document.querySelector(`input[name="campo_tipo"][value="${tipo}"]`);
        if (radio) {
            radio.checked = true;
        }
    }

    // Listener para ocultar error al seleccionar
    document.querySelectorAll('input[name="campo_tipo"]').forEach(radio => {
        radio.addEventListener('change', function() {
            document.getElementById('campo_tipo_error').classList.add('hidden');
        });
    });
}

function validarPaso2() {
    const tipoSeleccionado = document.querySelector('input[name="campo_tipo"]:checked');

    if (!tipoSeleccionado) {
        document.getElementById('campo_tipo_error').classList.remove('hidden');
        const primerRadio = document.querySelector('input[name="campo_tipo"]');
        if (primerRadio) primerRadio.focus();
        mostrarToast('Seleccione un tipo de campo', 'error');
        return false;
    }

    datosWizardTemp.paso2 = {
        tipo: tipoSeleccionado.value
    };

    return true;
}

// ========================================
// WIZARD - PASO 3: CONFIGURACIÓN Y VALIDACIÓN
// ========================================

function generarPaso3() {
    const tipo = datosWizardTemp.paso2?.tipo || '';

    return `
        <div class="space-y-6">
            <div>
                <h3 class="text-lg font-semibold text-gray-900 mb-2">Configuración y Validación</h3>
                <p class="text-sm text-gray-600">Configure las opciones específicas del campo tipo: <strong>${obtenerTextoTipo(tipo)}</strong></p>
            </div>

            ${generarConfiguracionPorTipo(tipo)}

            <div class="border-t border-gray-200 pt-6">
                <h4 class="font-semibold text-gray-900 mb-4">Opciones de Validación</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label class="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input type="checkbox" id="campo_requerido" class="mr-3 text-blue-600 focus:ring-blue-500 h-5 w-5">
                        <div>
                            <span class="font-medium text-gray-900">Campo requerido</span>
                            <p class="text-xs text-gray-500">El usuario debe completar este campo</p>
                        </div>
                    </label>

                    <label class="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input type="checkbox" id="campo_readonly" class="mr-3 text-blue-600 focus:ring-blue-500 h-5 w-5">
                        <div>
                            <span class="font-medium text-gray-900">Solo lectura</span>
                            <p class="text-xs text-gray-500">No se puede editar después de crear</p>
                        </div>
                    </label>

                    <label class="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input type="checkbox" id="campo_unico" class="mr-3 text-blue-600 focus:ring-blue-500 h-5 w-5">
                        <div>
                            <span class="font-medium text-gray-900">Valor único</span>
                            <p class="text-xs text-gray-500">No se permiten valores duplicados</p>
                        </div>
                    </label>

                    <label class="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input type="checkbox" id="campo_indexable" class="mr-3 text-blue-600 focus:ring-blue-500 h-5 w-5">
                        <div>
                            <span class="font-medium text-gray-900">Indexable</span>
                            <p class="text-xs text-gray-500">Optimizado para búsquedas</p>
                        </div>
                    </label>
                </div>
            </div>
        </div>
    `;
}

function generarConfiguracionPorTipo(tipo) {
    switch(tipo) {
        case 'texto_corto':
        case 'email':
        case 'telefono':
        case 'url':
            return `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Longitud mínima</label>
                        <input type="number" id="config_min_length" min="0" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="ej: 3">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Longitud máxima</label>
                        <input type="number" id="config_max_length" min="0" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="ej: 100">
                    </div>
                    <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Patrón de validación (Regex)</label>
                        <input type="text" id="config_pattern" class="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm" placeholder="ej: ^[A-Z0-9]+$">
                        <p class="mt-1 text-xs text-gray-500">Expresión regular para validar el formato</p>
                    </div>
                    <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Valor por defecto</label>
                        <input type="text" id="config_default_value" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Valor inicial del campo">
                    </div>
                    <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Placeholder</label>
                        <input type="text" id="config_placeholder" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Texto de ayuda dentro del campo">
                    </div>
                </div>
            `;

        case 'texto_largo':
            return `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Filas visibles</label>
                        <input type="number" id="config_rows" min="2" max="20" value="4" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Longitud máxima</label>
                        <input type="number" id="config_max_length" min="0" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="ej: 500">
                    </div>
                    <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Placeholder</label>
                        <input type="text" id="config_placeholder" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Texto de ayuda">
                    </div>
                    <div class="md:col-span-2">
                        <label class="flex items-center">
                            <input type="checkbox" id="config_rich_text" class="mr-2 text-blue-600 focus:ring-blue-500">
                            <span class="text-sm font-medium text-gray-700">Habilitar editor de texto enriquecido</span>
                        </label>
                    </div>
                </div>
            `;

        case 'numero':
        case 'moneda':
            return `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Valor mínimo</label>
                        <input type="number" id="config_min_value" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="ej: 0">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Valor máximo</label>
                        <input type="number" id="config_max_value" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="ej: 999999">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Valor por defecto</label>
                        <input type="number" id="config_default_value" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Incremento (step)</label>
                        <input type="number" id="config_step" value="1" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                    </div>
                    ${tipo === 'moneda' ? `
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Moneda</label>
                        <select id="config_currency" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                            <option value="COP">COP - Peso Colombiano</option>
                            <option value="USD">USD - Dólar</option>
                            <option value="EUR">EUR - Euro</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Decimales</label>
                        <input type="number" id="config_decimals" min="0" max="4" value="2" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                    </div>
                    ` : ''}
                </div>
            `;

        case 'fecha':
        case 'hora':
        case 'fecha_hora':
            return `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Fecha mínima</label>
                        <input type="date" id="config_min_date" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Fecha máxima</label>
                        <input type="date" id="config_max_date" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                    </div>
                    <div class="md:col-span-2">
                        <label class="flex items-center">
                            <input type="checkbox" id="config_default_today" class="mr-2 text-blue-600 focus:ring-blue-500">
                            <span class="text-sm font-medium text-gray-700">Usar fecha actual por defecto</span>
                        </label>
                    </div>
                </div>
            `;

        case 'select':
        case 'select_multiple':
        case 'radio':
        case 'checkbox':
            return `
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Opciones <span class="text-red-500">*</span></label>
                    <div id="opciones_container" class="space-y-2 mb-3">
                        <!-- Opciones se agregarán aquí -->
                    </div>
                    <button type="button" onclick="agregarOpcionCampo()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                        + Agregar Opción
                    </button>
                    <p class="mt-2 text-xs text-gray-500">Define las opciones que podrá seleccionar el usuario</p>
                </div>
            `;

        case 'archivo':
        case 'imagen':
            return `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Tamaño máximo (MB)</label>
                        <input type="number" id="config_max_size" min="1" max="100" value="10" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Tipos de archivo permitidos</label>
                        <input type="text" id="config_allowed_types" class="w-full px-4 py-2 border border-gray-300 rounded-lg"
                            placeholder="${tipo === 'imagen' ? '.jpg,.png,.gif,.webp' : '.pdf,.doc,.docx,.xls,.xlsx'}"
                            value="${tipo === 'imagen' ? '.jpg,.png,.gif,.webp' : ''}">
                    </div>
                    <div class="md:col-span-2">
                        <label class="flex items-center">
                            <input type="checkbox" id="config_multiple_files" class="mr-2 text-blue-600 focus:ring-blue-500">
                            <span class="text-sm font-medium text-gray-700">Permitir múltiples archivos</span>
                        </label>
                    </div>
                </div>
            `;

        default:
            return `
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p class="text-sm text-blue-800">Este tipo de campo no requiere configuración adicional en este paso.</p>
                </div>
            `;
    }
}

function inicializarPaso3() {
    const tipo = datosWizardTemp.paso2?.tipo || '';

    // Si el tipo requiere opciones, inicializar el contenedor
    // Solo agregar opciones vacías si NO hay datos guardados para restaurar
    if (['select', 'select_multiple', 'radio', 'checkbox'].includes(tipo)) {
        const tieneOpcionesGuardadas = datosWizardTemp.paso3?.opciones && datosWizardTemp.paso3.opciones.length > 0;
        const tieneOpcionesEdicion = datosWizardTemp.modoEdicion && datosWizardTemp.datosOriginales?.opciones;

        if (!tieneOpcionesGuardadas && !tieneOpcionesEdicion) {
            // Solo agregar opciones iniciales si no hay datos para restaurar
            setTimeout(() => {
                agregarOpcionCampo();
                agregarOpcionCampo();
            }, 100);
        }
    }

    // Si es modo edición, cargar configuración
    if (datosWizardTemp.modoEdicion && datosWizardTemp.datosOriginales) {
        const campo = datosWizardTemp.datosOriginales;

        // Cargar validaciones generales
        if (campo.validacion) {
            document.getElementById('campo_requerido').checked = campo.validacion.requerido || false;
            document.getElementById('campo_readonly').checked = campo.validacion.readonly || false;
            document.getElementById('campo_unico').checked = campo.validacion.unico || false;
            document.getElementById('campo_indexable').checked = campo.validacion.indexable || false;
        }

        // Cargar configuración específica
        if (campo.configuracion) {
            const config = campo.configuracion;
            Object.keys(config).forEach(key => {
                const input = document.getElementById(`config_${key}`);
                if (input) {
                    if (input.type === 'checkbox') {
                        input.checked = config[key];
                    } else {
                        input.value = config[key];
                    }
                }
            });
        }

        // Cargar opciones si existen
        if (campo.opciones && Array.isArray(campo.opciones)) {
            const container = document.getElementById('opciones_container');
            if (container) {
                container.innerHTML = '';
                campo.opciones.forEach(opcion => {
                    agregarOpcionCampo(opcion.valor, opcion.etiqueta);
                });
            }
        }
    }
}

function agregarOpcionCampo(valor = '', etiqueta = '') {
    const container = document.getElementById('opciones_container');
    if (!container) return;

    const index = container.children.length;
    const div = document.createElement('div');
    div.className = 'flex gap-2';
    div.innerHTML = `
        <input type="text" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg opcion-valor"
            placeholder="Valor" value="${valor}">
        <input type="text" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg opcion-etiqueta"
            placeholder="Etiqueta visible" value="${etiqueta}">
        <button type="button" onclick="this.parentElement.remove()"
            class="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
        </button>
    `;
    container.appendChild(div);
}

function validarPaso3() {
    const tipo = datosWizardTemp.paso2?.tipo || '';

    // Recopilar configuración según el tipo
    const configuracion = {};
    const validacion = {
        requerido: document.getElementById('campo_requerido')?.checked || false,
        readonly: document.getElementById('campo_readonly')?.checked || false,
        unico: document.getElementById('campo_unico')?.checked || false,
        indexable: document.getElementById('campo_indexable')?.checked || false
    };

    // Configuraciones específicas por tipo
    document.querySelectorAll('[id^="config_"]').forEach(input => {
        const key = input.id.replace('config_', '');
        if (input.type === 'checkbox') {
            configuracion[key] = input.checked;
        } else if (input.value) {
            configuracion[key] = input.value;
        }
    });

    // Validar opciones para campos de selección
    let opciones = [];
    if (['select', 'select_multiple', 'radio', 'checkbox'].includes(tipo)) {
        const opcionesContainer = document.getElementById('opciones_container');
        if (opcionesContainer) {
            const opcionDivs = opcionesContainer.children;
            if (opcionDivs.length === 0) {
                mostrarToast('Debe agregar al menos una opción', 'error');
                return false;
            }

            for (let i = 0; i < opcionDivs.length; i++) {
                const valor = opcionDivs[i].querySelector('.opcion-valor')?.value.trim();
                const etiqueta = opcionDivs[i].querySelector('.opcion-etiqueta')?.value.trim();

                if (!valor || !etiqueta) {
                    mostrarToast('Complete todas las opciones o elimine las vacías', 'error');
                    return false;
                }

                opciones.push({ valor, etiqueta });
            }
        }
    }

    datosWizardTemp.paso3 = {
        configuracion,
        validacion,
        opciones: opciones.length > 0 ? opciones : null
    };

    return true;
}

// ========================================
// WIZARD - PASO 4: OPCIONES VISUALES
// ========================================

function generarPaso4() {
    return `
        <div class="space-y-6">
            <div>
                <h3 class="text-lg font-semibold text-gray-900 mb-2">Opciones Visuales</h3>
                <p class="text-sm text-gray-600">Personalice la apariencia del campo en el formulario</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Ancho del Campo -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Ancho del Campo</label>
                    <select id="campo_ancho" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="completo">Ancho completo (100%)</option>
                        <option value="medio" selected>Medio ancho (50%)</option>
                        <option value="tercio">Un tercio (33%)</option>
                        <option value="cuarto">Un cuarto (25%)</option>
                    </select>
                    <p class="mt-1 text-xs text-gray-500">Determina qué porción de la fila ocupa el campo</p>
                </div>

                <!-- Icono -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Icono (Emoji)</label>
                    <input type="text" id="campo_icono" maxlength="2" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-2xl text-center" placeholder="📝">
                    <p class="mt-1 text-xs text-gray-500">Emoji para identificar visualmente el campo</p>
                </div>

                <!-- Clases CSS Personalizadas -->
                <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Clases CSS Adicionales</label>
                    <input type="text" id="campo_clases_css" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm" placeholder="ej: border-2 shadow-md">
                    <p class="mt-1 text-xs text-gray-500">Clases de Tailwind CSS u otras para personalizar el estilo</p>
                </div>

                <!-- Orden -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Orden de Visualización</label>
                    <input type="number" id="campo_orden" min="0" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="0">
                    <p class="mt-1 text-xs text-gray-500">Menor número aparece primero (0 por defecto)</p>
                </div>

                <!-- Estado inicial -->
                <div class="flex items-center p-4 border border-gray-200 rounded-lg">
                    <input type="checkbox" id="campo_activo" checked class="mr-3 text-blue-600 focus:ring-blue-500 h-5 w-5">
                    <div>
                        <label for="campo_activo" class="font-medium text-gray-900 cursor-pointer">Campo activo</label>
                        <p class="text-xs text-gray-500">El campo estará disponible para usar inmediatamente</p>
                    </div>
                </div>
            </div>

            <!-- Vista Previa -->
            <div class="border-t border-gray-200 pt-6">
                <h4 class="font-semibold text-gray-900 mb-4">Vista Previa del Campo</h4>
                <div id="preview_container" class="bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-300">
                    <div class="flex items-center mb-2">
                        <span id="preview_icono" class="text-2xl mr-2">📝</span>
                        <label id="preview_etiqueta" class="font-medium text-gray-700">Etiqueta del Campo</label>
                        <span id="preview_requerido" class="hidden text-red-500 ml-1">*</span>
                    </div>
                    <div id="preview_campo"></div>
                    <p id="preview_descripcion" class="text-xs text-gray-500 mt-2"></p>
                </div>
            </div>
        </div>
    `;
}

function inicializarPaso4() {
    // Si es modo edición, cargar datos visuales
    if (datosWizardTemp.modoEdicion && datosWizardTemp.datosOriginales) {
        const campo = datosWizardTemp.datosOriginales;
        document.getElementById('campo_ancho').value = campo.ancho || 'medio';
        document.getElementById('campo_icono').value = campo.icono || '';
        document.getElementById('campo_clases_css').value = campo.clases_css || '';
        document.getElementById('campo_orden').value = campo.orden || 0;
        document.getElementById('campo_activo').checked = campo.activo !== false;
    }

    // Actualizar vista previa
    actualizarVistaPrevia();

    // Listeners para actualizar preview en tiempo real
    ['campo_icono', 'campo_ancho', 'campo_clases_css'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', actualizarVistaPrevia);
        }
    });
}

function actualizarVistaPrevia() {
    const etiqueta = datosWizardTemp.paso1?.etiqueta || 'Etiqueta del Campo';
    const descripcion = datosWizardTemp.paso1?.descripcion || '';
    const tipo = datosWizardTemp.paso2?.tipo || 'texto_corto';
    const icono = document.getElementById('campo_icono')?.value || '📝';
    const requerido = datosWizardTemp.paso3?.validacion?.requerido || false;

    // Actualizar elementos de preview
    document.getElementById('preview_icono').textContent = icono;
    document.getElementById('preview_etiqueta').textContent = etiqueta;
    document.getElementById('preview_requerido').classList.toggle('hidden', !requerido);
    document.getElementById('preview_descripcion').textContent = descripcion;

    // Generar campo según tipo
    const campoHTML = generarCampoPreview(tipo);
    document.getElementById('preview_campo').innerHTML = campoHTML;
}

function generarCampoPreview(tipo) {
    const placeholder = datosWizardTemp.paso3?.configuracion?.placeholder || 'Placeholder';

    switch(tipo) {
        case 'texto_corto':
        case 'email':
        case 'telefono':
        case 'url':
            return `<input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="${placeholder}" disabled>`;
        case 'texto_largo':
            return `<textarea rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="${placeholder}" disabled></textarea>`;
        case 'numero':
        case 'moneda':
            return `<input type="number" class="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="0" disabled>`;
        case 'fecha':
            return `<input type="date" class="w-full px-3 py-2 border border-gray-300 rounded-lg" disabled>`;
        case 'select':
            const opciones = datosWizardTemp.paso3?.opciones || [];
            return `<select class="w-full px-3 py-2 border border-gray-300 rounded-lg" disabled>
                <option>Seleccione...</option>
                ${opciones.map(op => `<option>${op.etiqueta}</option>`).join('')}
            </select>`;
        case 'checkbox':
            return `<input type="checkbox" class="mr-2" disabled> Opción de ejemplo`;
        default:
            return `<input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100" value="[Campo tipo: ${obtenerTextoTipo(tipo)}]" disabled>`;
    }
}

function validarPaso4() {
    const ancho = document.getElementById('campo_ancho').value;
    const icono = document.getElementById('campo_icono').value.trim();
    const clases_css = document.getElementById('campo_clases_css').value.trim();
    const orden = parseInt(document.getElementById('campo_orden').value) || 0;
    const activo = document.getElementById('campo_activo').checked;

    datosWizardTemp.paso4 = {
        ancho,
        icono,
        clases_css,
        orden,
        activo
    };

    return true;
}

// ========================================
// WIZARD - PASO 5: CONFIGURACIÓN AVANZADA
// ========================================

function generarPaso5() {
    return `
        <div class="space-y-6">
            <div>
                <h3 class="text-lg font-semibold text-gray-900 mb-2">Configuración Avanzada (Opcional)</h3>
                <p class="text-sm text-gray-600">Opciones avanzadas para usuarios expertos</p>
            </div>

            <!-- Texto de Ayuda Contextual -->
            <div>
                <h4 class="font-semibold text-gray-900 mb-3">Ayuda Contextual</h4>
                <div class="grid grid-cols-1 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Texto de Ayuda</label>
                        <textarea id="ayuda_texto" rows="2" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Texto explicativo para ayudar al usuario"></textarea>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Enlace de Ayuda (URL)</label>
                        <input type="url" id="ayuda_url" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="https://...">
                    </div>
                </div>
            </div>

            <!-- Lógica Condicional -->
            <div class="border-t border-gray-200 pt-6">
                <h4 class="font-semibold text-gray-900 mb-3">Lógica Condicional</h4>
                <p class="text-sm text-gray-600 mb-4">Mostrar u ocultar este campo según el valor de otros campos</p>

                <label class="flex items-center mb-3">
                    <input type="checkbox" id="logica_habilitar" class="mr-2 text-blue-600 focus:ring-blue-500">
                    <span class="text-sm font-medium text-gray-700">Habilitar lógica condicional</span>
                </label>

                <div id="logica_config" class="hidden space-y-3 bg-gray-50 p-4 rounded-lg">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Mostrar cuando</label>
                        <select id="logica_campo" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                            <option value="">Seleccione un campo...</option>
                        </select>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Operador</label>
                            <select id="logica_operador" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                                <option value="igual">Es igual a</option>
                                <option value="diferente">Es diferente de</option>
                                <option value="contiene">Contiene</option>
                                <option value="vacio">Está vacío</option>
                                <option value="no_vacio">No está vacío</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Valor</label>
                            <input type="text" id="logica_valor" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                        </div>
                    </div>
                </div>
            </div>

            <!-- Cálculos y Fórmulas -->
            <div class="border-t border-gray-200 pt-6">
                <h4 class="font-semibold text-gray-900 mb-3">Cálculos y Fórmulas</h4>
                <p class="text-sm text-gray-600 mb-4">Calcular el valor automáticamente basado en otros campos</p>

                <label class="flex items-center mb-3">
                    <input type="checkbox" id="formula_habilitar" class="mr-2 text-blue-600 focus:ring-blue-500">
                    <span class="text-sm font-medium text-gray-700">Este campo es calculado</span>
                </label>

                <div id="formula_config" class="hidden space-y-3 bg-gray-50 p-4 rounded-lg">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Fórmula</label>
                        <textarea id="campo_formula" rows="3" class="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                            placeholder="ej: {{campo.area}} * {{campo.valor_metro}}"></textarea>
                        <p class="mt-1 text-xs text-gray-500">Use {{campo.slug}} para referenciar otros campos. Operadores: +, -, *, /</p>
                    </div>
                </div>
            </div>

            <!-- Comportamiento -->
            <div class="border-t border-gray-200 pt-6">
                <h4 class="font-semibold text-gray-900 mb-3">Comportamiento Especial</h4>
                <div class="space-y-2">
                    <label class="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input type="checkbox" id="comportamiento_autocompletar" class="mr-3 text-blue-600 focus:ring-blue-500">
                        <div>
                            <span class="font-medium text-gray-900">Habilitar autocompletado</span>
                            <p class="text-xs text-gray-500">Sugerir valores basados en datos anteriores</p>
                        </div>
                    </label>
                    <label class="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input type="checkbox" id="comportamiento_copiar" class="mr-3 text-blue-600 focus:ring-blue-500">
                        <div>
                            <span class="font-medium text-gray-900">Permitir copiar valor</span>
                            <p class="text-xs text-gray-500">Mostrar botón para copiar el valor al portapapeles</p>
                        </div>
                    </label>
                    <label class="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input type="checkbox" id="comportamiento_mayusculas" class="mr-3 text-blue-600 focus:ring-blue-500">
                        <div>
                            <span class="font-medium text-gray-900">Convertir a mayúsculas</span>
                            <p class="text-xs text-gray-500">Automáticamente transformar el texto a mayúsculas</p>
                        </div>
                    </label>
                </div>
            </div>
        </div>
    `;
}

function inicializarPaso5() {
    // Toggle para mostrar/ocultar configuración de lógica
    document.getElementById('logica_habilitar').addEventListener('change', function() {
        document.getElementById('logica_config').classList.toggle('hidden', !this.checked);
    });

    // Toggle para mostrar/ocultar configuración de fórmula
    document.getElementById('formula_habilitar').addEventListener('change', function() {
        document.getElementById('formula_config').classList.toggle('hidden', !this.checked);
    });

    // Si es modo edición, cargar configuración avanzada
    if (datosWizardTemp.modoEdicion && datosWizardTemp.datosOriginales) {
        const campo = datosWizardTemp.datosOriginales;

        // Ayuda contextual
        if (campo.ayuda_contextual) {
            document.getElementById('ayuda_texto').value = campo.ayuda_contextual.texto || '';
            document.getElementById('ayuda_url').value = campo.ayuda_contextual.url || '';
        }

        // Lógica condicional
        if (campo.logica_condicional && campo.logica_condicional.habilitado) {
            document.getElementById('logica_habilitar').checked = true;
            document.getElementById('logica_config').classList.remove('hidden');
            document.getElementById('logica_campo').value = campo.logica_condicional.campo || '';
            document.getElementById('logica_operador').value = campo.logica_condicional.operador || 'igual';
            document.getElementById('logica_valor').value = campo.logica_condicional.valor || '';
        }

        // Fórmula
        if (campo.formula) {
            document.getElementById('formula_habilitar').checked = true;
            document.getElementById('formula_config').classList.remove('hidden');
            document.getElementById('campo_formula').value = campo.formula || '';
        }

        // Comportamiento
        if (campo.comportamiento) {
            document.getElementById('comportamiento_autocompletar').checked = campo.comportamiento.autocompletar || false;
            document.getElementById('comportamiento_copiar').checked = campo.comportamiento.copiar || false;
            document.getElementById('comportamiento_mayusculas').checked = campo.comportamiento.mayusculas || false;
        }
    }
}

function validarPaso5() {
    // Ayuda contextual
    const ayuda_contextual = {
        texto: document.getElementById('ayuda_texto').value.trim(),
        url: document.getElementById('ayuda_url').value.trim()
    };

    // Lógica condicional
    let logica_condicional = null;
    if (document.getElementById('logica_habilitar').checked) {
        logica_condicional = {
            habilitado: true,
            campo: document.getElementById('logica_campo').value,
            operador: document.getElementById('logica_operador').value,
            valor: document.getElementById('logica_valor').value
        };
    }

    // Fórmula
    let formula = null;
    if (document.getElementById('formula_habilitar').checked) {
        formula = document.getElementById('campo_formula').value.trim();
    }

    // Comportamiento
    const comportamiento = {
        autocompletar: document.getElementById('comportamiento_autocompletar').checked,
        copiar: document.getElementById('comportamiento_copiar').checked,
        mayusculas: document.getElementById('comportamiento_mayusculas').checked
    };

    datosWizardTemp.paso5 = {
        ayuda_contextual,
        logica_condicional,
        formula,
        comportamiento
    };

    return true;
}

// ========================================
// WIZARD - PASO 6: RESUMEN Y CONFIRMACIÓN
// ========================================

function generarPaso6() {
    const paso1 = datosWizardTemp.paso1 || {};
    const paso2 = datosWizardTemp.paso2 || {};
    const paso3 = datosWizardTemp.paso3 || {};
    const paso4 = datosWizardTemp.paso4 || {};
    const paso5 = datosWizardTemp.paso5 || {};

    return `
        <div class="space-y-6">
            <div>
                <h3 class="text-lg font-semibold text-gray-900 mb-2">Resumen del Campo Personalizado</h3>
                <p class="text-sm text-gray-600">Revise la configuración antes de ${campoIdEditando ? 'guardar los cambios' : 'crear el campo'}</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Información Básica -->
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 class="font-semibold text-blue-900 mb-3 flex items-center">
                        <span class="text-xl mr-2">${paso4.icono || '📝'}</span>
                        Información Básica
                    </h4>
                    <dl class="space-y-2 text-sm">
                        <div><dt class="font-medium text-blue-800">Nombre:</dt><dd class="text-blue-900">${paso1.nombre}</dd></div>
                        <div><dt class="font-medium text-blue-800">Etiqueta:</dt><dd class="text-blue-900">${paso1.etiqueta}</dd></div>
                        <div><dt class="font-medium text-blue-800">Slug:</dt><dd class="text-blue-900 font-mono text-xs">${paso1.slug}</dd></div>
                        <div><dt class="font-medium text-blue-800">Variable:</dt><dd class="text-blue-900 font-mono text-xs">${paso1.variable}</dd></div>
                        <div><dt class="font-medium text-blue-800">Categoría:</dt><dd class="text-blue-900">${window.categoriasDisponibles?.[paso1.categoria] || paso1.categoria}</dd></div>
                        ${paso1.descripcion ? `<div><dt class="font-medium text-blue-800">Descripción:</dt><dd class="text-blue-900">${paso1.descripcion}</dd></div>` : ''}
                    </dl>
                </div>

                <!-- Tipo y Configuración -->
                <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 class="font-semibold text-green-900 mb-3">Tipo y Configuración</h4>
                    <dl class="space-y-2 text-sm">
                        <div><dt class="font-medium text-green-800">Tipo:</dt><dd class="text-green-900">${obtenerTextoTipo(paso2.tipo)}</dd></div>
                        <div><dt class="font-medium text-green-800">Requerido:</dt><dd class="text-green-900">${paso3.validacion?.requerido ? 'Sí' : 'No'}</dd></div>
                        <div><dt class="font-medium text-green-800">Solo lectura:</dt><dd class="text-green-900">${paso3.validacion?.readonly ? 'Sí' : 'No'}</dd></div>
                        <div><dt class="font-medium text-green-800">Valor único:</dt><dd class="text-green-900">${paso3.validacion?.unico ? 'Sí' : 'No'}</dd></div>
                        ${paso3.opciones ? `<div><dt class="font-medium text-green-800">Opciones:</dt><dd class="text-green-900">${paso3.opciones.length} opciones definidas</dd></div>` : ''}
                    </dl>
                </div>

                <!-- Opciones Visuales -->
                <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h4 class="font-semibold text-purple-900 mb-3">Opciones Visuales</h4>
                    <dl class="space-y-2 text-sm">
                        <div><dt class="font-medium text-purple-800">Ancho:</dt><dd class="text-purple-900">${paso4.ancho}</dd></div>
                        <div><dt class="font-medium text-purple-800">Icono:</dt><dd class="text-purple-900 text-xl">${paso4.icono || 'Sin icono'}</dd></div>
                        <div><dt class="font-medium text-purple-800">Orden:</dt><dd class="text-purple-900">${paso4.orden}</dd></div>
                        <div><dt class="font-medium text-purple-800">Estado:</dt><dd class="text-purple-900">${paso4.activo ? '🟢 Activo' : '🔴 Inactivo'}</dd></div>
                        ${paso4.clases_css ? `<div><dt class="font-medium text-purple-800">Clases CSS:</dt><dd class="text-purple-900 font-mono text-xs">${paso4.clases_css}</dd></div>` : ''}
                    </dl>
                </div>

                <!-- Configuración Avanzada -->
                <div class="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h4 class="font-semibold text-orange-900 mb-3">Configuración Avanzada</h4>
                    <dl class="space-y-2 text-sm">
                        ${paso5.ayuda_contextual?.texto ? `<div><dt class="font-medium text-orange-800">Ayuda:</dt><dd class="text-orange-900">Sí</dd></div>` : ''}
                        ${paso5.logica_condicional ? `<div><dt class="font-medium text-orange-800">Lógica condicional:</dt><dd class="text-orange-900">Habilitada</dd></div>` : ''}
                        ${paso5.formula ? `<div><dt class="font-medium text-orange-800">Campo calculado:</dt><dd class="text-orange-900">Sí</dd></div>` : ''}
                        ${paso5.comportamiento?.autocompletar ? `<div><dt class="font-medium text-orange-800">Autocompletado:</dt><dd class="text-orange-900">Habilitado</dd></div>` : ''}
                        ${!paso5.ayuda_contextual?.texto && !paso5.logica_condicional && !paso5.formula && !paso5.comportamiento?.autocompletar ?
                            '<div class="text-orange-900 italic">Sin configuración avanzada</div>' : ''}
                    </dl>
                </div>
            </div>

            <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div class="flex">
                    <svg class="h-5 w-5 text-yellow-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                    </svg>
                    <div>
                        <h3 class="text-sm font-medium text-yellow-800">Importante</h3>
                        <p class="mt-1 text-sm text-yellow-700">
                            ${campoIdEditando ?
                                'Los cambios afectarán todas las solicitudes futuras que usen este tipo de solicitud.' :
                                'Una vez creado, podrá asignar este campo a uno o más tipos de solicitud desde la configuración de cada tipo.'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function inicializarPaso6() {
    // No requiere inicialización especial
}

function validarPaso6() {
    // El paso 6 es solo resumen, no requiere validación
    return true;
}

// ========================================
// FINALIZAR WIZARD
// ========================================

async function finalizarWizard() {
    try {
        // Mostrar loading
        Swal.fire({
            title: campoIdEditando ? 'Guardando cambios...' : 'Creando campo...',
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => { Swal.showLoading(); }
        });

        // Preparar datos completos
        const datosCompletos = {
            ...datosWizardTemp.paso1,
            tipo: datosWizardTemp.paso2.tipo,
            configuracion: datosWizardTemp.paso3.configuracion || {},
            validacion: datosWizardTemp.paso3.validacion || {},
            opciones: datosWizardTemp.paso3.opciones || null,
            ancho: datosWizardTemp.paso4.ancho || 'medio',
            icono: datosWizardTemp.paso4.icono || '',
            clases_css: datosWizardTemp.paso4.clases_css || '',
            orden: parseInt(datosWizardTemp.paso4.orden) || 0,
            activo: datosWizardTemp.paso4.activo === true || datosWizardTemp.paso4.activo === 'true',
            ayuda_contextual: datosWizardTemp.paso5.ayuda_contextual || {},
            logica_condicional: datosWizardTemp.paso5.logica_condicional || null,
            formula: datosWizardTemp.paso5.formula || null,
            comportamiento: datosWizardTemp.paso5.comportamiento || {}
        };

        console.log('📤 Enviando datos:', datosCompletos);

        // Determinar URL y método
        const url = campoIdEditando
            ? `/admin/api/configuracion/campos-personalizados/${campoIdEditando}`
            : '/admin/api/configuracion/campos-personalizados';
        const method = campoIdEditando ? 'PUT' : 'POST';

        console.log('🌐 URL:', url, '| Método:', method);

        // Enviar petición
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
            },
            body: JSON.stringify(datosCompletos)
        });

        console.log('📥 Response status:', response.status);

        // Intentar parsear la respuesta
        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            // Si no es JSON, obtener el texto para debug
            const text = await response.text();
            console.error('❌ Respuesta no JSON:', text.substring(0, 500));
            throw new Error('El servidor no devolvió una respuesta JSON válida. Verifique los logs del servidor.');
        }

        console.log('📦 Datos recibidos:', data);

        if (response.ok && data.success) {
            Swal.fire({
                icon: 'success',
                title: campoIdEditando ? 'Cambios guardados' : 'Campo creado',
                text: data.message,
                confirmButtonColor: '#10b981'
            }).then(() => {
                cerrarWizard();
                cargarCampos();
            });
        } else {
            // Mostrar errores de validación si existen
            let errorMessage = data.message || 'Error al procesar la solicitud';
            if (data.errors) {
                const errorList = Object.values(data.errors).flat().join('\n');
                errorMessage += '\n\n' + errorList;
            }
            throw new Error(errorMessage);
        }

    } catch (error) {
        console.error('❌ Error al finalizar wizard:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            html: error.message.replace(/\n/g, '<br>') || 'No se pudo completar la operación',
            confirmButtonColor: '#dc2626'
        });
    }
}

// ========================================
// UTILIDADES
// ========================================

function mostrarLoader() {
    document.getElementById('loader').classList.remove('hidden');
    document.getElementById('camposContainer').classList.add('hidden');
    document.getElementById('estadoVacio').classList.add('hidden');
}

function ocultarLoader() {
    document.getElementById('loader').classList.add('hidden');
    document.getElementById('camposContainer').classList.remove('hidden');
}

function mostrarEstadoVacio() {
    document.getElementById('camposContainer').classList.add('hidden');
    document.getElementById('estadoVacio').classList.remove('hidden');
}

function mostrarToast(mensaje, tipo = 'info') {
    Swal.fire({
        icon: tipo,
        title: mensaje,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
    });
}

function obtenerTextoTipo(tipo) {
    const tipos = {
        'texto_corto': 'Texto corto',
        'texto_largo': 'Texto largo',
        'numero': 'Número',
        'moneda': 'Moneda',
        'fecha': 'Fecha',
        'hora': 'Hora',
        'fecha_hora': 'Fecha y Hora',
        'email': 'Email',
        'telefono': 'Teléfono',
        'url': 'URL',
        'checkbox': 'Casilla',
        'radio': 'Radio',
        'select': 'Lista desplegable',
        'select_multiple': 'Select múltiple',
        'archivo': 'Archivo',
        'imagen': 'Imagen',
        'ubicacion': 'Ubicación',
        'firma': 'Firma digital',
        'identificacion': 'Identificación',
        'separador': 'Separador',
        'texto_informativo': 'Texto informativo'
    };

    return tipos[tipo] || tipo;
}

// ========================================
// FUNCIONES DE LOADER
// ========================================

function mostrarLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.classList.remove('hidden');
    }
}

function ocultarLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.classList.add('hidden');
    }
}

function mostrarEstadoVacio() {
    const emptyState = document.getElementById('emptyState');
    const camposContainer = document.getElementById('camposContainer');
    
    if (emptyState) {
        emptyState.classList.remove('hidden');
    }
    if (camposContainer) {
        camposContainer.innerHTML = '';
    }
}

