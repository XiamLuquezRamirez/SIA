// ========================================
// PLANTILLAS DE DOCUMENTOS - JavaScript
// ========================================

let plantillas = [];
let plantillasFiltradas = [];
let vistaActual = 'cards'; // 'cards' o 'lista'
let archivoImportar = null;
let paginaActual = 1;
let filtrosActuales = {
    search: '',
    tipo: '',
    estado: ''
};

// ========================================
// INICIALIZACIÓN
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    cargarPlantillas();
    configurarEventListeners();
});

// ========================================
// CARGAR PLANTILLAS
// ========================================
async function cargarPlantillas() {
    try {
        mostrarLoader();

        const params = new URLSearchParams({
            page: paginaActual,
            ...filtrosActuales
        });

        const response = await fetch(`/admin/api/configuracion/plantillas-documentos?${params}`, {
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar plantillas');
        }

        const data = await response.json();
        
        // Si viene con paginación
        if (data.plantillas && data.plantillas.data) {
            plantillas = data.plantillas.data;
            plantillasFiltradas = plantillas;
            renderizarPlantillas();
            
            // Renderizar paginación si hay más de una página
            if (data.plantillas.last_page && data.plantillas.last_page > 1) {
                renderizarPaginacion(data.plantillas);
            } else {
                const paginacionContainer = document.getElementById('paginacionContainer');
                if (paginacionContainer) {
                    paginacionContainer.innerHTML = '';
                }
            }
        } else {
            // Formato antiguo sin paginación
            plantillas = data.plantillas || data.data || data;
            plantillasFiltradas = plantillas;
            renderizarPlantillas();
        }

        actualizarEstadisticas();

    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar las plantillas'
        });
        ocultarLoader();
    }
}

// ========================================
// RENDERIZAR PLANTILLAS
// ========================================
function renderizarPlantillas() {
    ocultarLoader();

    if (plantillasFiltradas.length === 0) {
        mostrarEmptyState();
        return;
    }

    ocultarEmptyState();

    if (vistaActual === 'cards') {
        renderizarCards();
    } else {
        renderizarLista();
    }
}

function renderizarCards() {
    const grid = document.getElementById('plantillasGrid');
    grid.classList.remove('hidden');
    document.getElementById('plantillasLista').classList.add('hidden');

    grid.innerHTML = plantillasFiltradas.map(plantilla => createCardHTML(plantilla)).join('');
}

function renderizarLista() {
    document.getElementById('plantillasGrid').classList.add('hidden');
    const lista = document.getElementById('plantillasLista');
    lista.classList.remove('hidden');

    const tbody = document.getElementById('plantillasListaBody');
    tbody.innerHTML = plantillasFiltradas.map(plantilla => createRowHTML(plantilla)).join('');
}

function createCardHTML(plantilla) {
    const tipoClases = {
        'certificado': 'certificado',
        'concepto': 'concepto',
        'acta': 'acta',
        'oficio': 'oficio'
    };

    const tipoNombres = {
        'certificado': 'Certificado',
        'concepto': 'Concepto',
        'acta': 'Acta',
        'oficio': 'Oficio'
    };

    const variables = plantilla.variables_usadas || [];
    const variablesHTML = variables.slice(0, 3).map(v =>
        `<span class="variable-badge">${v}</span>`
    ).join('');

    const masVariables = variables.length > 3 ?
        `<span class="text-xs text-gray-500">+${variables.length - 3} más</span>` : '';

    return `
        <div class="plantilla-card ${!plantilla.activo ? 'inactiva' : ''} fade-in">
            <div class="estado-badge ${plantilla.activo ? 'activo' : 'inactivo'}">
                ${plantilla.activo ? 'Activa' : 'Inactiva'}
            </div>

            <div class="plantilla-header">
                <div class="flex-1">
                    <h3 class="plantilla-nombre text-truncate">${plantilla.nombre}</h3>
                    <span class="plantilla-tipo ${tipoClases[plantilla.tipo_documento]}">
                        ${tipoNombres[plantilla.tipo_documento]}
                    </span>
                </div>
            </div>

            ${plantilla.descripcion ? `
                <p class="plantilla-descripcion">${plantilla.descripcion}</p>
            ` : ''}

            ${variables.length > 0 ? `
                <div class="plantilla-variables">
                    ${variablesHTML}
                    ${masVariables}
                </div>
            ` : ''}

            <div class="plantilla-meta">
                <div class="plantilla-meta-item">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    Usado ${plantilla.veces_usado || 0} veces
                </div>
                <div class="plantilla-meta-item">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                    </svg>
                    ${variables.length} variables
                </div>
            </div>

            <div class="plantilla-actions" style="position: relative;">
                <button onclick="verPlantilla(${plantilla.id})" class="plantilla-btn btn-primary">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                    Vista Previa
                </button>
                <button onclick="editarPlantilla(${plantilla.id})" class="plantilla-btn btn-secondary">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                    Editar
                </button>
                <div style="position: relative; display: inline-block;">
                    <button onclick="toggleMenuPlantilla(event, ${plantilla.id})" class="text-gray-400 hover:text-gray-600 p-1" style="display: inline-flex; align-items: center; justify-content: center;">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path>
                        </svg>
                    </button>
                    <div id="menu-${plantilla.id}" class="hidden" style="position: absolute; right: 0; bottom: 100%; margin-bottom: 0.5rem; width: 12rem; border-radius: 0.375rem; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); background-color: white; border: 1px solid rgba(0, 0, 0, 0.05); z-index: 9999;">
                        <div style="padding: 0.25rem 0;">
                            <a href="#" onclick="event.stopPropagation(); duplicarPlantilla(${plantilla.id}); return false;" style="display: flex; align-items: center; padding: 0.5rem 1rem; font-size: 0.875rem; color: #374151; text-decoration: none;" onmouseover="this.style.backgroundColor='#f3f4f6'" onmouseout="this.style.backgroundColor='transparent'">
                                <svg class="w-4 h-4" style="margin-right: 0.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                                </svg>
                                Duplicar
                            </a>
                            <a href="#" onclick="event.stopPropagation(); toggleEstadoPlantilla(${plantilla.id}); return false;" style="display: flex; align-items: center; padding: 0.5rem 1rem; font-size: 0.875rem; color: #374151; text-decoration: none;" onmouseover="this.style.backgroundColor='#f3f4f6'" onmouseout="this.style.backgroundColor='transparent'">
                                <svg class="w-4 h-4" style="margin-right: 0.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${plantilla.activo ? 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' : 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'}"></path>
                                </svg>
                                ${plantilla.activo ? 'Desactivar' : 'Activar'}
                            </a>
                            <a href="#" onclick="event.stopPropagation(); verEstadisticas(${plantilla.id}); return false;" style="display: flex; align-items: center; padding: 0.5rem 1rem; font-size: 0.875rem; color: #374151; text-decoration: none;" onmouseover="this.style.backgroundColor='#f3f4f6'" onmouseout="this.style.backgroundColor='transparent'">
                                <svg class="w-4 h-4" style="margin-right: 0.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                                </svg>
                                Estadísticas
                            </a>
                            <a href="#" onclick="event.stopPropagation(); eliminarPlantilla(${plantilla.id}); return false;" style="display: flex; align-items: center; padding: 0.5rem 1rem; font-size: 0.875rem; color: #dc2626; text-decoration: none;" onmouseover="this.style.backgroundColor='#f3f4f6'" onmouseout="this.style.backgroundColor='transparent'">
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

function createRowHTML(plantilla) {
    const tipoNombres = {
        'certificado': 'Certificado',
        'concepto': 'Concepto',
        'acta': 'Acta',
        'oficio': 'Oficio'
    };

    const variables = plantilla.variables_usadas || [];

    return `
        <tr class="${!plantilla.activo ? 'bg-gray-50' : ''}">
            <td class="px-6 py-4">
                <div class="font-medium text-gray-900">${plantilla.nombre}</div>
                ${plantilla.descripcion ? `<div class="text-sm text-gray-500 text-truncate">${plantilla.descripcion}</div>` : ''}
            </td>
            <td class="px-6 py-4">
                <span class="plantilla-tipo ${plantilla.tipo_documento}">
                    ${tipoNombres[plantilla.tipo_documento]}
                </span>
            </td>
            <td class="px-6 py-4">
                <span class="estado-badge ${plantilla.activo ? 'activo' : 'inactivo'}">
                    ${plantilla.activo ? 'Activa' : 'Inactiva'}
                </span>
            </td>
            <td class="px-6 py-4 text-sm text-gray-500">
                ${variables.length} variables
            </td>
            <td class="px-6 py-4 text-sm text-gray-500">
                ${plantilla.veces_usado || 0} veces
            </td>
            <td class="px-6 py-4 text-sm font-medium space-x-2">
                <button onclick="verPlantilla(${plantilla.id})" class="text-blue-600 hover:text-blue-900">Ver</button>
                <button onclick="editarPlantilla(${plantilla.id})" class="text-indigo-600 hover:text-indigo-900">Editar</button>
                <button onclick="eliminarPlantilla(${plantilla.id})" class="text-red-600 hover:text-red-900">Eliminar</button>
            </td>
        </tr>
    `;
}

// ========================================
// FILTROS
// ========================================
function aplicarFiltros() {
    filtrosActuales.search = document.getElementById('searchInput')?.value || '';
    filtrosActuales.tipo = document.getElementById('filterTipo')?.value || '';
    filtrosActuales.estado = document.getElementById('filterEstado')?.value || '';
    
    paginaActual = 1; // Reset a la primera página
    cargarPlantillas();
}

function configurarEventListeners() {
    // Filtros con debounce para búsqueda
    const searchInput = document.getElementById('searchInput');
    const filterTipo = document.getElementById('filterTipo');
    const filterEstado = document.getElementById('filterEstado');

    let searchTimeout;
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                aplicarFiltros();
            }, 500);
        });
    }
    if (filterTipo) filterTipo.addEventListener('change', aplicarFiltros);
    if (filterEstado) filterEstado.addEventListener('change', aplicarFiltros);

    // Cerrar dropdown al hacer clic fuera
    document.addEventListener('click', function(e) {
        if (!e.target.closest('[id^="menu-"]') && !e.target.closest('button[onclick^="toggleMenuPlantilla"]')) {
            cerrarTodosLosMenus();
        }
    });
}

// ========================================
// CAMBIAR VISTA
// ========================================
function cambiarVista(vista) {
    vistaActual = vista;

    const btnCards = document.getElementById('vistaCards');
    const btnLista = document.getElementById('vistaLista');

    // Solo actualizar botones si existen
    if (btnCards && btnLista) {
        if (vista === 'cards') {
            btnCards.classList.remove('bg-gray-200', 'text-gray-700');
            btnCards.classList.add('bg-blue-600', 'text-white');
            btnLista.classList.remove('bg-blue-600', 'text-white');
            btnLista.classList.add('bg-gray-200', 'text-gray-700');
        } else {
            btnLista.classList.remove('bg-gray-200', 'text-gray-700');
            btnLista.classList.add('bg-blue-600', 'text-white');
            btnCards.classList.remove('bg-blue-600', 'text-white');
            btnCards.classList.add('bg-gray-200', 'text-gray-700');
        }
    }

    renderizarPlantillas();
}

// ========================================
// ESTADÍSTICAS
// ========================================
function actualizarEstadisticas() {
    const total = plantillas.length;
    const activas = plantillas.filter(p => p.activo).length;
    const certificados = plantillas.filter(p => p.tipo_documento === 'certificado').length;
    const generados = plantillas.reduce((sum, p) => sum + (p.veces_usado || 0), 0);

    // Solo actualizar si los elementos existen
    const statTotal = document.getElementById('stat-total');
    const statActivas = document.getElementById('stat-activas');
    const statCertificados = document.getElementById('stat-certificados');
    const statGenerados = document.getElementById('stat-generados');

    if (statTotal) statTotal.textContent = total;
    if (statActivas) statActivas.textContent = activas;
    if (statCertificados) statCertificados.textContent = certificados;
    if (statGenerados) statGenerados.textContent = generados;
}

// ========================================
// ACCIONES DE PLANTILLA
// ========================================
function abrirModalNuevaPlantilla() {
    window.location.href = '/admin/configuracion/documentos/plantillas/crear';
}

function editarPlantilla(id) {
    window.location.href = `/admin/configuracion/documentos/plantillas/${id}/editar`;
}

async function verPlantilla(id) {
    try {
        const response = await fetch(`/admin/api/configuracion/plantillas-documentos/${id}/preview`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
            }
        });

        if (!response.ok) throw new Error('Error al generar vista previa');

        const data = await response.json();

        // Mostrar modal de preview
        const modal = document.getElementById('modalPreviewPDF');
        const content = document.getElementById('preview-pdf-content');
        const nombre = document.getElementById('preview-plantilla-nombre');

        if (modal && content && nombre) {
            const plantilla = plantillas.find(p => p.id === id);
            if (plantilla) {
                nombre.textContent = plantilla.nombre;
            }
            content.innerHTML = data.html;
            modal.classList.remove('hidden');
        }

    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo generar la vista previa'
        });
    }
}

function cerrarModalPreviewPDF() {
    const modal = document.getElementById('modalPreviewPDF');
    if (modal) modal.classList.add('hidden');
}

async function descargarPDFPreview() {
    // TODO: Implementar descarga de PDF
    Swal.fire({
        icon: 'info',
        title: 'Próximamente',
        text: 'La descarga de PDF estará disponible próximamente'
    });
}

async function duplicarPlantilla(id) {
    const plantilla = plantillas.find(p => p.id === id);

    const { value: nombre } = await Swal.fire({
        title: 'Duplicar Plantilla',
        html: `
            <p class="text-sm text-gray-600 mb-4">Se creará una copia de "${plantilla.nombre}"</p>
            <input id="swal-nombre" class="swal2-input" placeholder="Nombre de la nueva plantilla" value="${plantilla.nombre} (Copia)">
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Duplicar',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
            return document.getElementById('swal-nombre').value;
        }
    });

    if (nombre) {
        try {
            const response = await fetch(`/admin/api/configuracion/plantillas-documentos/${id}/duplicar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                },
                body: JSON.stringify({ nombre })
            });

            if (!response.ok) throw new Error('Error al duplicar');

            const data = await response.json();

            Swal.fire({
                icon: 'success',
                title: 'Plantilla Duplicada',
                text: data.message
            });

            cargarPlantillas();

        } catch (error) {
            console.error('Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo duplicar la plantilla'
            });
        }
    }
}

async function toggleEstadoPlantilla(id) {
    try {
        const response = await fetch(`/admin/api/configuracion/plantillas-documentos/${id}/toggle`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
            }
        });

        if (!response.ok) throw new Error('Error al cambiar estado');

        const data = await response.json();

        Swal.fire({
            icon: 'success',
            title: 'Estado Actualizado',
            text: data.message,
            timer: 2000,
            showConfirmButton: false
        });

        cargarPlantillas();

    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo cambiar el estado'
        });
    }
}

async function verEstadisticas(id) {
    try {
        const response = await fetch(`/admin/api/configuracion/plantillas-documentos/${id}/uso`);
        if (!response.ok) throw new Error('Error al cargar estadísticas');

        const data = await response.json();

        Swal.fire({
            title: 'Estadísticas de Uso',
            html: `
                <div class="text-left space-y-3">
                    <div class="flex justify-between">
                        <span class="font-medium">Veces usado:</span>
                        <span>${data.veces_usado}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="font-medium">Tipos de solicitud asociados:</span>
                        <span>${data.tipos_asociados}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="font-medium">Última generación:</span>
                        <span>${data.ultima_generacion || 'Nunca'}</span>
                    </div>
                </div>
            `,
            icon: 'info'
        });

    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar las estadísticas'
        });
    }
}

async function eliminarPlantilla(id) {
    const plantilla = plantillas.find(p => p.id === id);

    const result = await Swal.fire({
        title: '¿Eliminar Plantilla?',
        html: `
            <p class="text-sm text-gray-600 mb-2">¿Estás seguro de que deseas eliminar la plantilla "${plantilla.nombre}"?</p>
            <p class="text-xs text-red-600">Esta acción no se puede deshacer.</p>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        try {
            const response = await fetch(`/admin/api/configuracion/plantillas-documentos/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                }
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Error al eliminar');
            }

            const data = await response.json();

            Swal.fire({
                icon: 'success',
                title: 'Plantilla Eliminada',
                text: data.message,
                timer: 2000,
                showConfirmButton: false
            });

            cargarPlantillas();

        } catch (error) {
            console.error('Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message
            });
        }
    }
}

// ========================================
// MANEJO DE DROPDOWN
// ========================================
function toggleMenuPlantilla(event, id) {
    event.stopPropagation();
    const menu = document.getElementById(`menu-${id}`);
    
    if (!menu) return;
    
    const estaAbierto = !menu.classList.contains('hidden');
    
    // Cerrar todos los menús primero
    cerrarTodosLosMenus();
    
    // Si el menú estaba cerrado, abrirlo
    if (!estaAbierto) {
        menu.classList.remove('hidden');
    }
}

function cerrarTodosLosMenus() {
    document.querySelectorAll('[id^="menu-"]').forEach(menu => {
        menu.classList.add('hidden');
    });
}

// ========================================
// IMPORTAR / EXPORTAR
// ========================================
async function exportarPlantillas() {
    try {
        const response = await fetch('/admin/api/configuracion/plantillas-documentos/exportar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
            }
        });

        if (!response.ok) throw new Error('Error al exportar');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `plantillas-${new Date().getTime()}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        Swal.fire({
            icon: 'success',
            title: 'Exportación Exitosa',
            text: 'Las plantillas se han exportado correctamente',
            timer: 2000,
            showConfirmButton: false
        });

    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron exportar las plantillas'
        });
    }
}

function importarPlantillas() {
    const modal = document.getElementById('modalImportar');
    if (modal) modal.classList.remove('hidden');
}

function cerrarModalImportar() {
    const modal = document.getElementById('modalImportar');
    const fileUpload = document.getElementById('file-upload');
    const fileInfo = document.getElementById('file-info');
    const btnImportar = document.getElementById('btn-importar');
    
    if (modal) modal.classList.add('hidden');
    if (fileUpload) fileUpload.value = '';
    if (fileInfo) fileInfo.classList.add('hidden');
    if (btnImportar) btnImportar.disabled = true;
    archivoImportar = null;
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        if (file.type !== 'application/json') {
            Swal.fire({
                icon: 'error',
                title: 'Archivo Inválido',
                text: 'Por favor selecciona un archivo JSON válido'
            });
            return;
        }

        archivoImportar = file;
        const fileName = document.getElementById('file-name');
        const fileInfo = document.getElementById('file-info');
        const btnImportar = document.getElementById('btn-importar');
        
        if (fileName) fileName.textContent = file.name;
        if (fileInfo) fileInfo.classList.remove('hidden');
        if (btnImportar) btnImportar.disabled = false;
    }
}

async function procesarImportacion() {
    if (!archivoImportar) return;

    try {
        const formData = new FormData();
        formData.append('archivo', archivoImportar);

        const response = await fetch('/admin/api/configuracion/plantillas-documentos/importar', {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
            },
            body: formData
        });

        if (!response.ok) throw new Error('Error al importar');

        const data = await response.json();

        cerrarModalImportar();

        Swal.fire({
            icon: 'success',
            title: 'Importación Exitosa',
            text: data.message
        });

        cargarPlantillas();

    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron importar las plantillas'
        });
    }
}

// ========================================
// UTILIDADES
// ========================================
function mostrarLoader() {
    const loader = document.getElementById('skeletonLoader');
    const grid = document.getElementById('plantillasGrid');
    const lista = document.getElementById('plantillasLista');
    const empty = document.getElementById('emptyState');
    
    if (loader) loader.classList.remove('hidden');
    if (grid) grid.classList.add('hidden');
    if (lista) lista.classList.add('hidden');
    if (empty) empty.classList.add('hidden');
}

function ocultarLoader() {
    const loader = document.getElementById('skeletonLoader');
    if (loader) loader.classList.add('hidden');
}

function mostrarEmptyState() {
    const empty = document.getElementById('emptyState');
    const grid = document.getElementById('plantillasGrid');
    const lista = document.getElementById('plantillasLista');
    
    if (empty) empty.classList.remove('hidden');
    if (grid) grid.classList.add('hidden');
    if (lista) lista.classList.add('hidden');
}

function ocultarEmptyState() {
    const empty = document.getElementById('emptyState');
    if (empty) empty.classList.add('hidden');
}

// ========================================
// PAGINACIÓN
// ========================================
function renderizarPaginacion(data) {
    // Buscar o crear el contenedor de paginación
    let paginacionContainer = document.getElementById('paginacionContainer');
    
    if (!paginacionContainer) {
        // Crear el contenedor después del contenedor de plantillas
        const container = document.getElementById('plantillasGrid');
        paginacionContainer = document.createElement('div');
        paginacionContainer.id = 'paginacionContainer';
        paginacionContainer.className = 'mt-6';
        container.parentNode.insertBefore(paginacionContainer, container.nextSibling);
    }

    const { current_page, last_page, from, to, total } = data;

    // Generar botones de paginación
    let paginacionHTML = `
        <div class="bg-white rounded-lg shadow-sm p-4">
            <div class="flex items-center justify-between">
                <!-- Información de registros -->
                <div class="text-sm text-gray-700">
                    Mostrando <span class="font-medium">${from || 0}</span> a 
                    <span class="font-medium">${to || 0}</span> de 
                    <span class="font-medium">${total || 0}</span> resultados
                </div>

                <!-- Botones de navegación -->
                <div class="flex items-center space-x-2">
                    <!-- Botón Anterior -->
                    <button 
                        onclick="cambiarPagina(${current_page - 1})" 
                        ${current_page === 1 ? 'disabled' : ''}
                        class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Anterior
                    </button>

                    <!-- Números de página -->
                    <div class="hidden md:flex space-x-1">
                        ${generarBotonesPaginas(current_page, last_page)}
                    </div>

                    <!-- Botón Siguiente -->
                    <button 
                        onclick="cambiarPagina(${current_page + 1})" 
                        ${current_page === last_page ? 'disabled' : ''}
                        class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Siguiente
                    </button>
                </div>
            </div>
        </div>
    `;

    paginacionContainer.innerHTML = paginacionHTML;
}

function generarBotonesPaginas(paginaActualParam, ultimaPagina) {
    let botones = [];
    const rango = 2; // Cuántas páginas mostrar a cada lado de la actual

    // Primera página
    if (paginaActualParam > rango + 1) {
        botones.push(`
            <button 
                onclick="cambiarPagina(1)" 
                class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
                1
            </button>
        `);
        if (paginaActualParam > rango + 2) {
            botones.push('<span class="px-2 py-2 text-gray-500">...</span>');
        }
    }

    // Páginas alrededor de la actual
    for (let i = Math.max(1, paginaActualParam - rango); i <= Math.min(ultimaPagina, paginaActualParam + rango); i++) {
        botones.push(`
            <button 
                onclick="cambiarPagina(${i})" 
                class="px-3 py-2 text-sm font-medium ${
                    i === paginaActualParam 
                        ? 'text-white bg-blue-600 border border-blue-600' 
                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                } rounded-md"
            >
                ${i}
            </button>
        `);
    }

    // Última página
    if (paginaActualParam < ultimaPagina - rango) {
        if (paginaActualParam < ultimaPagina - rango - 1) {
            botones.push('<span class="px-2 py-2 text-gray-500">...</span>');
        }
        botones.push(`
            <button 
                onclick="cambiarPagina(${ultimaPagina})" 
                class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
                ${ultimaPagina}
            </button>
        `);
    }

    return botones.join('');
}

function cambiarPagina(nuevaPagina) {
    paginaActual = nuevaPagina;
    cargarPlantillas();
    // Scroll hacia arriba para ver los resultados
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
