const container = document.getElementById('calendar');
const selectYear = document.getElementById('filterYear');

document.addEventListener('DOMContentLoaded', function () {
    var calendarEl = document.getElementById('calendar');
    for (let month = 0; month < 12; month++) {
        var div_month = document.createElement('div');
        div_month.id = `calendar-${month}`;
        div_month.style.border = '1px solid #ddd';
        div_month.style.borderRadius = '10px';
        div_month.style.padding = '10px';
        div_month.style.background = '#fff';
        div_month.style.height = '150px';
        div_month.style.width = '500px';

        container.appendChild(div_month);
        var calendar = new FullCalendar.Calendar(div_month, {
            initialView: 'dayGridMonth',
            headerToolbar: { left: '', center: 'title', right: '' },
            height: 'auto',
            locale: 'es',
            initialDate: new Date(selectYear.value, month, 1)
        });
        calendar.render();
    }
});

// ========================================
// MANEJO DE RESPUESTAS Y SESIÓN
// ========================================

/**
 * Verificar respuesta de fetch y manejar sesión expirada
 * @param {Response} response - Respuesta de fetch
 * @returns {Promise} - Promesa con datos JSON o redirección
 */

async function manejarRespuestaFetch(response) {
    // Verificar si la respuesta es HTML (indica redirección a login)
    const contentType = response.headers.get('content-type');
    const esHTML = contentType && contentType.includes('text/html');
    
    // Si recibimos HTML en lugar de JSON, probablemente es una redirección al login
    if (esHTML && (response.status === 200 || response.status === 302)) {
        const texto = await response.text();
        
        // Verificar si contiene el formulario de login
        if (texto.includes('login') || texto.includes('csrf') || texto.includes('password')) {
            mostrarToast('Su sesión ha expirado. Redirigiendo al login...', 'error');
            
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
            
            throw new Error('Sesión expirada');
        }
    }
    
    // Errores de autenticación (401, 405, 419)
    if (response.status === 401 || response.status === 419) {
        try {
            const data = await response.json();
            
            mostrarToast('Su sesión ha expirado. Redirigiendo al login...', 'error');
            
            setTimeout(() => {
                window.location.href = data.redirect || '/login';
            }, 2000);
        } catch {
            // Si no hay JSON, simplemente redirigir
            mostrarToast('Su sesión ha expirado. Redirigiendo al login...', 'error');
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
        }
        
        throw new Error('Sesión expirada');
    }
    
    // Error 404 en AJAX
    if (response.status === 404) {
        try {
            const data = await response.json();
            
            // Si la respuesta indica redirección al login
            if (data.redirect) {
                mostrarToast('Redirigiendo al login...', 'info');
                setTimeout(() => {
                    window.location.href = data.redirect;
                }, 1500);
                throw new Error('No encontrado - Redirigiendo');
            }
        } catch (error) {
            if (error.message === 'No encontrado - Redirigiendo') {
                throw error;
            }
            // Si no es JSON válido, continuar normalmente
        }
    }
    
    // Error 405 en AJAX
    if (response.status === 405) {
        try {
            const data = await response.json();
            
            if (data.redirect) {
                mostrarToast('Sesión expirada. Redirigiendo al login...', 'error');
                setTimeout(() => {
                    window.location.href = data.redirect;
                }, 2000);
                throw new Error('Sesión expirada');
            }
        } catch (error) {
            if (error.message === 'Sesión expirada') {
                throw error;
            }
            // Si no es JSON válido, puede ser que la sesión expiró
            mostrarToast('Error de conexión. Recargando página...', 'error');
            setTimeout(() => {
                window.location.reload();
            }, 2000);
            throw new Error('Error de conexión');
        }
    }
    
    return response;
}

// Estado global
let currentPage = 1;
let currentFilters = {
    search: '',
    year: '',
    tipo: '',
    estado: '',
};
let selectedFestivos = [];
let debounceTimer = null;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    cargarFestivos();
    configurarEscuchadoresEventos();
});

// Configurar event listeners
function configurarEscuchadoresEventos() {
    // Búsqueda con debounce
    document.getElementById('searchInput').addEventListener('input', function(e) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            currentFilters.search = e.target.value;
            currentPage = 1;
            cargarFestivos();
        }, 500);
    });

    // Filtros
    document.getElementById('filterYear').addEventListener('change', function(e) {
        currentFilters.year = e.target.value;
        currentPage = 1;
        cargarFestivos();
    });

    document.getElementById('filterTipo').addEventListener('change', function(e) {
        currentFilters.tipo = e.target.value;
        currentPage = 1;
        cargarFestivos();
    });

    // Items por página
    document.getElementById('perPageSelect').addEventListener('change', function(e) {
        currentPage = 1;
        cargarFestivos();
    });

    // Seleccionar todos
    document.getElementById('selectAll').addEventListener('change', function(e) {
        const checkboxes = document.querySelectorAll('.categoria-checkbox');
        checkboxes.forEach(cb => {
            cb.checked = e.target.checked;
            if (e.target.checked) {
                if (!selectedFestivos.includes(cb.value)) {
                    selectedFestivos.push(cb.value);
                }
            } else {
                selectedFestivos = [];
            }
        });
    });
}

// Cargar festivos
async function cargarFestivos() {
    try {
        mostrarCargadorEsqueleto();

        const perPage = document.getElementById('perPageSelect').value;
        const params = new URLSearchParams({
            page: currentPage,
            per_page: perPage,
            ...currentFilters
        });

        const response = await fetch(`/admin/configuracion/parametros/festivos?${params}`, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json'
            }
        });

        // Manejar sesión expirada o errores de autenticación
        await manejarRespuestaFetch(response);

        if (!response.ok) throw new Error('Error al cargar festivos');

        const data = await response.json();
        renderizarFestivos(data.data);
        renderizarPaginacion(data);
        actualizarIndicadorFiltros();
        
    } catch (error) {
        console.error('Error:', error);
        if (error.message !== 'Sesión expirada' && error.message !== 'No encontrado - Redirigiendo') {
            mostrarToast('Error al cargar festivos', 'error');
        }
    }
}

function renderizarFestivos(festivos) {
    const tbody = document.getElementById('festivosTableBody');

    if (festivos.length === 0) {
        tbody.innerHTML =  `
            <tr>
                <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                    No se encontraron festivos  
                </td>
            </tr>
        `;
        return;
    }
    

    // Debug: verificar datos de fotos
    var totalFestivosSLA = 0;
    for (let i = 0; i < festivos.length; i++) {
        if (festivos[i].aplica_sla) {
            totalFestivosSLA++;
        }
    }
    document.getElementById('totalFestivosSLA').textContent = totalFestivosSLA;

    tbody.innerHTML = festivos.map(festivo => `
        <tr class="hover:bg-gray-50 ${selectedFestivos.includes(festivo.id.toString()) ? 'bg-blue-50' : ''}">
            <td class="px-6 py-4">
                <input type="checkbox" class="categoria-checkbox rounded border-gray-300"
                       value="${festivo.id}"
                       ${selectedFestivos.includes(festivo.id.toString()) ? 'checked' : ''}
                       onchange="alternarSeleccionFestivo(${festivo.id})">
            </td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full">
                    ${festivo.fecha_formateada}
                </span>
            </td>
            <td class="px-6 py-4" style="max-width: 200px;">
                <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full">
                    ${festivo.dia_semana}
                </span>
            </td>
            <td class="px-6 py-4 text-center">
                <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full">
                    ${festivo.nombre}
                </span>
            </td>
            <td class="px-6 py-4 text-sm text-gray-500 text-center">
                <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full">
                    ${festivo.descripcion}
                </span>
            </td>
             <td class="px-6 py-4 text-sm text-gray-500 text-center">
                <div class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${festivo.tipo == 'Nacional' ? 'bg-red-100 text-red-800' :  festivo.tipo == 'Departamental' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                    <span class="text-xs">${festivo.tipo}</span>
                </div>
            </td>
            <td class="px-6 py-4 text-center">
                <label class="relative inline-flex items-center cursor-pointer">
                    <input id="check_festivo_${festivo.id}" type="checkbox" class="sr-only peer" ${festivo.aplica_sla ? 'checked' : ''} onchange="alternarAplicacionSLAFestivo(${festivo.id}, '${festivo.nombre}', this.checked)">
                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
            </td>
            <td class="px-6 py-4 text-center">
                <div class="relative inline-block text-left" x-data="{ open: false }">
                    <button @click="open = !open" class="text-gray-400 hover:text-gray-600">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path>
                        </svg>
                    </button>
                    <div x-show="open" @click.away="open = false" class="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                        <div class="py-1">
                            <a href="#" onclick="editarFestivo(${festivo.id}); return false;" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Editar</a>
                             <a href="#" onclick="eliminarFestivo(${festivo.id}); return false;" class="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100">Eliminar</a>
                        </div>
                    </div>
                </div>
            </td>
        </tr>
    `).join('');
}

// Renderizar paginación
function renderizarPaginacion(data) {
    document.getElementById('showingFrom').textContent = data.from || 0;
    document.getElementById('showingTo').textContent = data.to || 0;
    document.getElementById('totalFestivos').textContent = data.total || 0;
    document.getElementById('totalFestivosCard').textContent = data.total || 0;

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

// Cambiar página
function cambiarPagina(page) {
    currentPage = page;
    cargarFestivos();
}

// Actualizar badge de filtros
function actualizarIndicadorFiltros() {
    let count = 0;
    if (currentFilters.search) count++;
    if (currentFilters.year) count++;
    if (currentFilters.tipo) count++;
    if (currentFilters.estado) count++;

    const badge = document.getElementById('filterBadge');
    const countEl = document.getElementById('filterCount');

    if (count > 0) {
        badge.classList.remove('hidden');
        countEl.textContent = count;
    } else {
        badge.classList.add('hidden');
    }
}

function mostrarCargadorEsqueleto() {
    const tbody = document.getElementById('festivosTableBody');
    tbody.innerHTML = `
        <tr class="skeleton-row">
            <td colspan="7" class="px-6 py-4">
                <div class="animate-pulse space-y-4">
                    ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(() => `
                        <div class="flex space-x-4">
                            <div class="rounded-full bg-gray-200 h-10 w-10"></div>
                            <div class="flex-1 space-y-2 py-1">
                                <div class="h-4 bg-gray-200 rounded w-3/4"></div>
                                <div class="h-4 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </td>
        </tr>
    `;
}

// Limpiar filtros
function limpiarFiltros() {
    currentFilters = {
        search: '',
        estado: '',
        year: '',
        tipo: '',
    };

    document.getElementById('searchInput').value = '';
    document.getElementById('filterEstado').value = '';
    document.getElementById('filterYear').value = '';
    document.getElementById('filterTipo').value = '';
    currentPage = 1;
    cargarFestivos();
}

// Abrir modal de creación de area
function abrirModalCrearFestivo() {
    document.getElementById('modalTitle').textContent = 'Crear Nuevo Festivo';
    document.getElementById('festivoForm').reset();
    document.getElementById('festivoModal').classList.remove('hidden');
    document.getElementById('submitButton').classList.remove('hidden');
    formChanged = false;

    //cambiar el evento del formulario a POST
    const form = document.getElementById('festivoForm');
    form.removeEventListener('submit', manejarEnvioFormularioEditarFestivo);
    form.addEventListener('submit', manejarEnvioFormulario);

    //cambiar el texto del botón
    document.getElementById('submitButton').textContent = 'Guardar Festivo';

    // Limpiar errores
    limpiarTodosLosErrores();

    // Listener para detectar cambios en el formulario
    document.getElementById('festivoForm').addEventListener('input', function() {
        formChanged = true;
    });
}

async function consultarDisponibilidadFestivo() {
    const fecha = document.getElementById('fecha').value;
    const response = await fetch(`/admin/configuracion/parametros/festivos/consultar-disponibilidad/${fecha}`);
    const data = await response.json();
    if (!data.disponible) {
        Swal.fire({
            html: `<div class="message-error bg-red-100 p-2 rounded-md" style="text-align: left;">
                        <h3 class="font-bold text-red-500">Ya hay un festivo registrado para esta fecha: </h3>
                        <br>
                        <p class="font-bold text-red-500">Nombre: <span style="font-weight: bold; color:rgb(17, 17, 17);">${data.festivo.nombre}</span></p>    
                        <p class="font-bold text-red-500">Fecha: <span style="font-weight: bold; color:rgb(17, 17, 17);">${data.festivo.fecha}</span></p>
                        <p class="font-bold text-red-500">Tipo: <span style="font-weight: bold; color:rgb(17, 17, 17);">${data.festivo.tipo}</span></p>
                        <p class="font-bold text-red-500">Descripción: <span style="font-weight: bold; color:rgb(17, 17, 17);">${data.festivo.descripcion}</span></p>
                        <br>
                        <h3 style="text-align: left;" class="font-bold text-red-500">Al continuar, se sobreescribirá el festivo existente, con los datos proporcionados.</h3>
                    </div>`,
            icon: 'error',
            showConfirmButton: true,
            confirmButtonText: 'Ok, entendido',
            allowOutsideClick: false,
            allowEscapeKey: false,       
        });
    }
}

function limpiarTodosLosErrores() {
    document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('.error-message').forEach(el => {
        el.classList.add('hidden');
        el.textContent = '';
    });
}

function cerrarModalFestivo() {
    document.getElementById('festivoModal').classList.add('hidden');
    document.getElementById('nombre').value = '';
    document.getElementById('descripcion').value = '';
    document.getElementById('fecha').value = '';
    document.getElementById('tipo').value = '';
    document.getElementById('aplica_sla').checked = true;
    formChanged = false;
    document.getElementById('submitButton').classList.add('hidden');
}

// ========================================
// ENVÍO DEL FORMULARIO
// ========================================
async function manejarEnvioFormulario(e) {
    e.preventDefault();

    // Validación final
    if (!validarFormularioFinal()) {
        return;
    }

    const submitButton = document.getElementById('submitButton');
    const originalText = submitButton.innerHTML;

    try {
        // Deshabilitar botón y cambiar texto
        submitButton.disabled = true;
        submitButton.classList.add('loading');
        submitButton.innerHTML = '<span class="opacity-0">Guardando...</span>';

        // Preparar FormData
        const formData = new FormData(document.getElementById('festivoForm'));

        // Agregar activo
        const aplica_sla = document.getElementById('aplica_sla').checked;
        formData.append('aplica_sla', aplica_sla ? '1' : '0');

        // Enviar petición
        const response = await fetch('/admin/configuracion/parametros/festivos/guardar', {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
            },
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            // Éxito
            mostrarToast(data.message, data.type);
            if (data.type == 'success') {
                cerrarModalFestivo();
                // Recargar lista de festivos
                setTimeout(() => {
                    currentPage = 1;
                    cargarFestivos();
                }, 500);
            }
        } else if (response.status === 422) {
            // Errores de validación
            mostrarToast('Por favor corrija los errores en el formulario', 'error');

        } else {
            // Error del servidor
            mostrarToast(data.message || 'Error al crear festivo', 'error');
        }

    } catch (error) {
        mostrarToast(error.message || 'Error al guardar festivo', 'error');

    } finally {
        // Restaurar botón
        submitButton.disabled = false;
        submitButton.classList.remove('loading');
        submitButton.innerHTML = originalText;
    }
}

function validarFormularioFinal() {
    limpiarTodosLosErrores();
    let isValid = true;

    // Validar fecha
    const fecha = document.getElementById('fecha').value;
    if (!fecha) {
        mostrarError('fecha', 'La fecha es obligatoria');
        isValid = false;
    }

    // Validar descripción
    const descripcion = document.getElementById('descripcion').value;
    if (!descripcion) {
        mostrarError('descripcion', 'La descripción es obligatoria');
        isValid = false;
    }

    // Validar tipo
    const tipo = document.getElementById('tipo').value;
    if (!tipo) {
        mostrarError('tipo', 'El tipo es obligatorio');
        isValid = false;
    }

    // Validar nombre
    const nombre = document.getElementById('nombre').value;
    if (!nombre) {
        mostrarError('nombre', 'El nombre es obligatorio');
        isValid = false;
    }

    return isValid;
}

function mostrarError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorSpan = field.parentElement.querySelector('.error-message');

    field.classList.add('error');
    if (errorSpan) {
        errorSpan.textContent = message;
        errorSpan.classList.remove('hidden');
    }
}


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
// EDITAR FESTIVO
// ========================================
let editingFestivoId = null;
let originalFestivoData = null;

async function editarFestivo(festivoId) {
    editingFestivoId = festivoId;
    document.getElementById('modalTitle').textContent = 'Editar Festivo';
    document.getElementById('festivoModal').classList.remove('hidden');
    document.getElementById('submitButton').classList.remove('hidden');
    currentTab = 1;
    formChanged = false;

    // Mostrar Swal de cargando
    mostrarSwalCargando('Cargando datos del festivo, por favor espere...');

    // Cargar datos del área
    try {
        const response = await fetch(`/admin/configuracion/parametros/festivos/consultar/${festivoId}`);
        if (!response.ok) throw new Error('Error al cargar festivo');

        const data = await response.json();
        originalFestivoData = JSON.parse(JSON.stringify(data.festivo)); // Deep clone

        // Actualizar título con nombre del área
        document.getElementById('modalTitle').textContent = `Editar Festivo: ${data.festivo.nombre}`;

        // Llenar formulario con datos
        await llenarFormularioConDatosFestivo(data.festivo);

        // Cambiar el evento del formulario a PUT
        const form = document.getElementById('festivoForm');
        form.removeEventListener('submit', manejarEnvioFormulario);
        form.addEventListener('submit', manejarEnvioFormularioEditarFestivo);

        // Cambiar texto del botón
        document.getElementById('submitButton').textContent = 'Guardar Cambios';
        limpiarTodosLosErrores();

    } catch (error) {
        console.error('Error:', error);
        mostrarToast('Error al cargar datos del festivo', 'error');
        cerrarModalFestivo();
    }
}

async function llenarFormularioConDatosFestivo(festivo) {
    Swal.close();
    // Información del Festivo
    document.getElementById('nombre').value = festivo.nombre || '';
    document.getElementById('descripcion').value = festivo.descripcion || '';
    document.getElementById('tipo').value = festivo.tipo || '';
    document.getElementById('fecha').value = festivo.fecha || '';
    document.getElementById('aplica_sla').checked = festivo.aplica_sla ? true : false;
}

function mostrarSwalCargando(mensaje) {
    Swal.fire({
        title: mensaje,
        icon: 'info',
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false,
        allowClose: false,
        allowEscapeKey: false,
        progressBar: true,
        didOpen: () => {
            Swal.showLoading();
        }
    });
}

// ========================================
// MANEJAR ENVÍO DE FORMULARIO DE EDICIÓN DE FESTIVO
// ========================================

async function manejarEnvioFormularioEditarFestivo(e) {
    e.preventDefault();

    // Validación final
    if (!validarFormularioFinal()) {
        return;
    }

    const submitButton = document.getElementById('submitButton');
    const originalText = submitButton.innerHTML;

    try {
        submitButton.disabled = true;
        submitButton.classList.add('loading');
        submitButton.innerHTML = '<span class="opacity-0">Guardando...</span>';
        mostrarSwalCargando('Guardando cambios, por favor espere...');

        // Preparar FormData
        const formData = new FormData();
        // Agregar datos del formulario
        formData.append('nombre', document.getElementById('nombre').value);
        formData.append('descripcion', document.getElementById('descripcion').value);
        formData.append('tipo', document.getElementById('tipo').value);
        formData.append('fecha', document.getElementById('fecha').value);
        // Agregar aplican a SLA
        const aplica_sla = document.getElementById('aplica_sla').checked;
        formData.append('aplica_sla', aplica_sla ? '1' : '0');

        // Enviar petición
        const response = await fetch(`/admin/configuracion/parametros/festivos/editar/${editingFestivoId}`, {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
            },
            body: formData
        });

        const data = await response.json();
        Swal.close();
        if (response.ok) {
            // Éxito
            mostrarToast(data.message, 'success');
            cerrarModalFestivo();

            // Recargar lista después de un momento
            setTimeout(() => {
                consultarNuevosFestivos();
            }, 500);

        } else if (response.status === 422) {
            // Errores de validación o confirmaciones requeridas
            if (data.requires_confirmation) {
                handleConfirmationRequired(data);
            } else {
                mostrarToast('Por favor corrija los errores en el formulario', 'error');
            }

        } else {
            mostrarToast(data.message || 'Error al actualizar festivo', 'error');
        }

    } catch (error) {
        mostrarToast(error.message || 'Error al actualizar festivo', 'error');

    } finally {
        submitButton.disabled = false;
        submitButton.classList.remove('loading');
        submitButton.innerHTML = originalText;
    }
}

async function consultarNuevosFestivos() {
    var posicion_scroll = window.scrollY;
    await cargarFestivos();
    window.scrollTo(0, posicion_scroll);
}


// ========================================
// ACTIVAR/DESHABILITAR APLICACIÓN DE SLA FESTIVO
// ========================================

let currentToggleFestivoNombre = null;
let currentToggleFestivoId = null;
async function alternarAplicacionSLAFestivo(festivoId, festivoNombre, checked) {
    currentToggleFestivoId = festivoId;
    currentToggleFestivoNombre = festivoNombre;
    if (checked) {
        abrirModalActivar();
    } else {
        abrirModalDesactivar();
    }
}

// ========================================
// ACTIVAR APLICACIÓN DE SLA FESTIVO
// ========================================
function abrirModalActivar() {
    Swal.fire({
        title: '¿Estás seguro de querer activar la aplicación de SLA para el festivo ('+ currentToggleFestivoNombre + ')?',
        icon: 'warning',
        showConfirmButton: true,
        showCancelButton: true,
        confirmButtonText: 'Activar',
        denyButtonText: 'Cancelar',
        showDenyButton: true,
        showCancelButton: false,
        confirmButtonColor: '#28a745',
        denyButtonColor: '#dc3545',
        allowOutsideClick: false,
    }).then((result) => {
        if (result.isConfirmed) {
            var toggle = document.getElementById(`check_festivo_${currentToggleFestivoId}`);
            var checked = toggle.checked;
            cambiarAplicacionSLAFestivo(currentToggleFestivoId, checked);
        }else if (result.isDenied) {
            const toggle = document.getElementById(`check_festivo_${currentToggleFestivoId}`);
            if (toggle) {
                checked = toggle.checked;
                toggle.checked = !checked;
            }
        }
    });
}

// ========================================
// DESHABILITAR APLICACIÓN DE SLA FESTIVO
// ========================================
async function abrirModalDesactivar() {
    Swal.fire({
        title: '¿Estás seguro de querer desactivar la aplicación de SLA para el festivo ('+ currentToggleFestivoNombre + ')?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Desactivar',
        denyButtonText: 'Cancelar',
        showDenyButton: true,
        showCancelButton: false,
        confirmButtonColor: '#28a745',
        denyButtonColor: '#dc3545',
        allowOutsideClick: false,
    }).then((result) => {
        if (result.isConfirmed) {
            var toggle = document.getElementById(`check_festivo_${currentToggleFestivoId}`);
            var checked = toggle.checked;
            cambiarAplicacionSLAFestivo(currentToggleFestivoId, checked);
        }else if (result.isDenied) {
            const toggle = document.getElementById(`check_festivo_${currentToggleFestivoId}`);
            if (toggle) {
                checked = toggle.checked;
                toggle.checked = !checked;
            }
        }
    });
}

// ========================================
// CAMBIAR APLICACIÓN DE SLA FESTIVO
// ========================================
async function cambiarAplicacionSLAFestivo(festivoId, checked) {
    if (checked) {
        mostrarSwalCargando('Activando la aplicación de SLA para el festivo, por favor espere...');
    } else {
        mostrarSwalCargando('Desactivando la aplicación de SLA para el festivo, por favor espere...');
    }

    try {
        const formData = new FormData();
        formData.append('aplica_sla', checked ? '1' : '0');
        const response = await fetch(`/admin/configuracion/parametros/festivos/alternar-aplicacion-sla-festivo/${festivoId}`, {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
            },
            body: formData
        });

        const data = await response.json();
        Swal.close();
        if (response.ok) {
            // Éxito
            mostrarToast(data.message, data.type);
            setTimeout(() => {
                consultarNuevosFestivos();
            }, 500);
        } else {
            const toggle = document.getElementById(`check_festivo_${currentToggleFestivoId}`);
            if (toggle) {
                checked = toggle.checked;
                toggle.checked = !checked;
            }
            mostrarToast(data.message || 'Error al activar la aplicación de SLA para el festivo', 'error');
        }
    } catch (error) {
        const toggle = document.getElementById(`check_festivo_${currentToggleFestivoId}`);
        if (toggle) {
            checked = toggle.checked;
            toggle.checked = !checked;
        }
        console.error('Error:', error);
        mostrarToast('Error al activar la aplicación de SLA para el festivo', 'error');
    }
}


// ========================================
// IMPORTAR FESTIVOS
// ========================================
let festivosApi = [];
let festivosSeleccionados = [];
var dias_semana = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
function abrirModalImportarFestivos() {
    document.getElementById('importarFestivoModal').classList.remove('hidden');
    festivosApi = [];
    festivosSeleccionados = [];
    document.getElementById('anio_importar').value = new Date().getFullYear();
    var anio = document.getElementById('anio_importar').value;
    cargarFestivosApi(anio);
}


// ========================================
// CARGAR FESTIVOS DE LA API
// ========================================
async function cargarFestivosApi(anio) {
    mostrarSwalCargando('Consultando festivos en la API, por favor espere...');
    try {
        const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${anio}/CO`);
        if (!response.ok) throw new Error('Error al consultar festivos en la API');
        const data = await response.json();
        festivosApi = data;
        //quitar los repetidos
        festivosApi = festivosApi.filter((festivo, index, self) =>
            index === self.findIndex((t) => t.date === festivo.date)
        );
        await renderizarFestivosApi(festivosApi);
        document.getElementById('submitButtonImportarFestivos').classList.remove('hidden');
    } catch (error) {
        console.error('Error:', error);
        mostrarToast('Error al consultar festivos en la API', 'error');
    }
}


// ========================================
// RENDERIZAR FESTIVOS DE LA API
// ========================================
function renderizarFestivosApi(festivos) {
    Swal.close();
    const contenedorBody = document.getElementById('festivosTableBodyImportar');
    contenedorBody.innerHTML = '';
    festivos.forEach(festivo => {
        var dia_semana = new Date(festivo.date+'T00:00:00').getDay();
        var formateada = new Date(festivo.date+'T00:00:00').toLocaleDateString('es-ES'); 
        contenedorBody.innerHTML += `
            <tr>
                <td style="text-align: center; width: 10%;">
                    <input type="checkbox" id="check_festivo_importar_${festivo.date}" onchange="seleccionarFestivoImportar(this)" value="${festivo.date}">
                </td>
                <td style="text-align: left;">
                    <span>${festivo.localName}</span>
                </td>
                <td style="text-align: center;">
                    <span>${formateada}</span>
                </td>
                <td style="text-align: center;">
                    <span>${dias_semana[dia_semana]}</span>
                </td>
            </tr>
        `;
    });
}

// ========================================
// CERRAR MODAL DE IMPORTACIÓN DE FESTIVOS
// ========================================
function cerrarModalImportarFestivo() {
    document.getElementById('importarFestivoModal').classList.add('hidden');
    festivosApi = [];
    festivosSeleccionados = [];
    document.getElementById('submitButtonImportarFestivos').classList.add('hidden');
    document.getElementById('selectAllImportar').checked = false;
}

// ========================================
// SELECCIONAR FESTIVO DE IMPORTACIÓN
// ========================================
function seleccionarFestivoImportar(checkbox) {
    if (checkbox.checked) {
    var festivoId = checkbox.value;
        var festivo = festivosApi.find(f => f.date === festivoId);
        if (festivo) {
            festivosSeleccionados.push(festivo);
        }
    } else {
        var festivoId = checkbox.value;
        var festivo = festivosSeleccionados.find(f => f.date === festivoId);
        if (festivo) {
            festivosSeleccionados.splice(festivosSeleccionados.indexOf(festivo), 1);
        }
    }
}

// ========================================
// SELECCIONAR TODOS LOS FESTIVOS DE IMPORTACIÓN
// ========================================
function seleccionarTodosFestivosImportar(checkbox) {
    if (checkbox.checked) {
        for (var i = 0; i < festivosApi.length; i++) {
            var festivo = festivosApi[i];
            var checkbox = document.getElementById(`check_festivo_importar_${festivo.date}`);
            checkbox.checked = true;
        }
        festivosApi.forEach(festivo => {
            festivosSeleccionados.push(festivo);
        });
    } else {
        for (var i = 0; i < festivosApi.length; i++) {
            var festivo = festivosApi[i];
            var checkbox = document.getElementById(`check_festivo_importar_${festivo.date}`);
            checkbox.checked = false;
        }
        festivosSeleccionados = [];
    }
}