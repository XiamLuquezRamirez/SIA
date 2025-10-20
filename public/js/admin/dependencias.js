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
    estado: '',
};
let selectedDependencias = [];
let debounceTimer = null;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    cargarDependencias();
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
            cargarDependencias();
        }, 500);
    });

    // Filtros
    document.getElementById('filterEstado').addEventListener('change', function(e) {
        currentFilters.estado = e.target.value;
        currentPage = 1;
        cargarDependencias();
    });


    // Items por página
    document.getElementById('perPageSelect').addEventListener('change', function(e) {
        currentPage = 1;
        cargarDependencias();
    });

    // Seleccionar todos
    document.getElementById('selectAll').addEventListener('change', function(e) {
        const checkboxes = document.querySelectorAll('.dependencia-checkbox');
        checkboxes.forEach(cb => {
            cb.checked = e.target.checked;
            if (e.target.checked) {
                if (!selectedDependencias.includes(cb.value)) {
                    selectedDependencias.push(cb.value);
                }
            } else {
                selectedDependencias = [];
            }
        });
    });
}

// Cargar dependencias
async function cargarDependencias() {
    try {
        mostrarCargadorEsqueleto();

        const perPage = document.getElementById('perPageSelect').value;
        const params = new URLSearchParams({
            page: currentPage,
            per_page: perPage,
            ...currentFilters
        });

        const response = await fetch(`/admin/dependencias?${params}`, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json'
            }
        });

        // Manejar sesión expirada o errores de autenticación
        await manejarRespuestaFetch(response);

        if (!response.ok) throw new Error('Error al cargar dependencias');

        const data = await response.json();
        renderizarDependencias(data.data);
        renderizarPaginacion(data);
        actualizarIndicadorFiltros();
        
    } catch (error) {
        console.error('Error:', error);
        if (error.message !== 'Sesión expirada' && error.message !== 'No encontrado - Redirigiendo') {
            mostrarToast('Error al cargar dependencias', 'error');
        }
    }
}

function renderizarDependencias(dependencias) {
    const tbody = document.getElementById('dependenciasTableBody');

    if (dependencias.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                    No se encontraron dependencias  
                </td>
            </tr>
        `;
        return;
    }
    

    // Debug: verificar datos de fotos
    tbody.innerHTML = dependencias.map(dependencia => `
        <tr class="hover:bg-gray-50 ${selectedDependencias.includes(dependencia.id.toString()) ? 'bg-blue-50' : ''}">
            <td class="px-6 py-4">
                <input type="checkbox" class="dependencia-checkbox rounded border-gray-300"
                       value="${dependencia.id}"
                       ${selectedDependencias.includes(dependencia.id.toString()) ? 'checked' : ''}
                       onchange="alternarSeleccionDependencia(${dependencia.id})">
            </td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full">
                    ${dependencia.nombre}
                </span>
            </td>
            <td class="px-6 py-4" style="max-width: 200px;">
                <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full">
                    ${dependencia.descripcion}
                </span>
            </td>
            <td class="px-6 py-4">
                <div class="flex items-center">
                ${dependencia.coordinador ? `
                    <div class="flex-shrink-0 h-10 w-10">
                            ${dependencia.coordinador.foto_url
                                ? `<img class="h-10 w-10 rounded-full" src="/storage/${dependencia.coordinador.foto_url}" alt="${dependencia.coordinador.nombre}">`
                                : `<div class="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                                    ${dependencia.coordinador.nombre.charAt(0)}${dependencia.coordinador.apellidos.charAt(0)}
                                </div>`
                            }
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">${dependencia.coordinador.nombre} ${dependencia.coordinador.apellidos}</div>
                            <div class="text-sm text-gray-500">${dependencia.coordinador.email}</div>
                        </div>
                    </div>
                    ` : `
                        <div class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            <span class="text-xs">Sin coordinador</span>
                        </div>
                    `}
                </div>
            </td>
            <td class="px-6 py-4 text-sm text-gray-500 text-center">
                <div class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    <span class="text-xs">${dependencia.equipos.length}</span>
                </div>
            </td>
            <td class="px-6 py-4 text-center">
                <div class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    <span class="text-xs">${dependencia.funcionarios.length}</span>
                </div>
            </td>
            <td class="px-6 py-4">
               <label class="relative inline-flex items-center cursor-pointer">
                    <input id="check_dependencia_${dependencia.id}" type="checkbox" class="sr-only peer" ${dependencia.activo ? 'checked' : ''} onchange="alternarEstadoDependencia(${dependencia.id}, this.checked)">
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
                            <a href="#" onclick="verDependencia(${dependencia.id}); return false;" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Ver Detalle</a>
                            <a href="#" onclick="editarDependencia(${dependencia.id}); return false;" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Editar</a>
                             <a href="#" onclick="eliminarDependencia(${dependencia.id}); return false;" class="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100">Eliminar</a>
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
    document.getElementById('totalDependencias').textContent = data.total || 0;

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
    cargarDependencias();
}


// Actualizar badge de filtros
function actualizarIndicadorFiltros() {
    let count = 0;
    if (currentFilters.search) count++;
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
    const tbody = document.getElementById('dependenciasTableBody');
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
    };

    document.getElementById('searchInput').value = '';
    document.getElementById('filterEstado').value = '';

    currentPage = 1;
    cargarDependencias();
}

// Abrir modal de creación de dependencia
function abrirModalCrearDependencia() {
    document.getElementById('modalTitle').textContent = 'Crear Nueva Dependencia';
    document.getElementById('dependenciaForm').reset();
    document.getElementById('dependenciaModal').classList.remove('hidden');
    document.getElementById('submitButton').classList.remove('hidden');
    formChanged = false;

    //cambiar el evento del formulario a POST
    const form = document.getElementById('dependenciaForm');
    form.removeEventListener('submit', manejarEnvioFormularioEditarDependencia);
    form.addEventListener('submit', manejarEnvioFormulario);

    //cambiar el texto del botón
    document.getElementById('submitButton').textContent = 'Guardar Dependencia';

    // Cargar datos necesarios
    cargarCoordinadores();

    // Limpiar errores
    limpiarTodosLosErrores();

    // Listener para detectar cambios en el formulario
    document.getElementById('dependenciaForm').addEventListener('input', function() {
        formChanged = true;
    });
}

async function cargarCoordinadores() {
    try {
        const response = await fetch('/admin/api/usuarios');
        var usuarios = await response.json();
        usuarios = usuarios.usuarios;

        const select = document.getElementById('coordinador_id');
        select.innerHTML = '<option value="">Seleccione un coordinador</option>' +
            usuarios.map(usuario => `<option value="${usuario.id}">${usuario.nombre} ${usuario.apellidos}</option>`).join('');
    } catch (error) {
        console.error('Error loading usuarios:', error);
    }
}

function limpiarTodosLosErrores() {
    document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('.error-message').forEach(el => {
        el.classList.add('hidden');
        el.textContent = '';
    });
}

function cerrarModalDependencia() {
    document.getElementById('dependenciaModal').classList.add('hidden');
    document.getElementById('nombre').value = '';
    document.getElementById('descripcion').value = '';
    document.getElementById('coordinador_id').value = '';
    document.getElementById('activo').checked = false;
    formChanged = false;
    document.getElementById('submitButton').classList.add('hidden');
}


// ========================================
// ENVÍO DEL FORMULARIO
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    const dependenciaForm = document.getElementById('dependenciaForm');
    dependenciaForm.addEventListener('submit', manejarEnvioFormulario);
});

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
        const formData = new FormData(document.getElementById('dependenciaForm'));

        // Agregar activo
        const activo = document.getElementById('activo').checked;
        formData.append('activo', activo ? '1' : '0');

        // Enviar petición
        const response = await fetch('/admin/guardar-dependencia', {
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
            mostrarToast('Dependencia creada exitosamente', 'success');
            cerrarModalDependencia();

            // Recargar lista de dependencias
            setTimeout(() => {
                currentPage = 1;
                cargarDependencias();
            }, 500);

        } else if (response.status === 422) {
            // Errores de validación
            mostrarToast('Por favor corrija los errores en el formulario', 'error');

        } else {
            // Error del servidor
            mostrarToast(data.message || 'Error al crear dependencia', 'error');
        }

    } catch (error) {
        mostrarToast(error.message || 'Error al guardar dependencia', 'error');

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

    // Validar nombre
    const nombre = document.getElementById('nombre').value;
    if (!nombre) {
        mostrarError('nombre', 'El nombre es obligatorio');
        isValid = false;
    }

    // Validar descripción
    const descripcion = document.getElementById('descripcion').value;
    if (!descripcion) {
        mostrarError('descripcion', 'La descripción es obligatoria');
        isValid = false;
    }

    // Validar coordinador
    const coordinador = document.getElementById('coordinador_id').value;
    if (!coordinador) {
        mostrarError('coordinador_id', 'El coordinador es obligatorio');
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
// EDITAR DEPENDENCIA
// ========================================
let editingDependenciaId = null;
let originalDependenciaData = null;

async function editarDependencia(dependenciaId) {
    editingDependenciaId = dependenciaId;
    document.getElementById('modalTitle').textContent = 'Editar Dependencia';
    document.getElementById('dependenciaModal').classList.remove('hidden');
    document.getElementById('submitButton').classList.remove('hidden');
    currentTab = 1;
    formChanged = false;

    // Mostrar Swal de cargando
    mostrarSwalCargando('Cargando datos de la dependencia, por favor espere...');

    // Cargar datos de la dependencia
    try {
        const response = await fetch(`/admin/dependencias/${dependenciaId}`);
        if (!response.ok) throw new Error('Error al cargar dependencia');

        const data = await response.json();
        originalDependenciaData = JSON.parse(JSON.stringify(data.dependencia)); // Deep clone

        // Actualizar título con nombre de la dependencia
        document.getElementById('modalTitle').textContent = `Editar Dependencia: ${data.dependencia.nombre}`;

        // Llenar formulario con datos
        await llenarFormularioConDatosDependencia(data.dependencia);

        // Cambiar el evento del formulario a PUT
        const form = document.getElementById('dependenciaForm');
        form.removeEventListener('submit', manejarEnvioFormulario);
        form.addEventListener('submit', manejarEnvioFormularioEditarDependencia);

        // Cambiar texto del botón
        document.getElementById('submitButton').textContent = 'Guardar Cambios';
        limpiarTodosLosErrores();

    } catch (error) {
        console.error('Error:', error);
        mostrarToast('Error al cargar datos de la dependencia', 'error');
        cerrarModalDependencia();
    }
}

async function llenarFormularioConDatosDependencia(dependencia) {
    Swal.close();
    // Información de la Dependencia
    document.getElementById('nombre').value = dependencia.nombre || '';
    document.getElementById('descripcion').value = dependencia.descripcion || '';
    document.getElementById('activo').checked = dependencia.activo ? true : false;
    // Cargar coordinadores
    await cargarCoordinadores();
    if (dependencia.coordinador_id) {
        document.getElementById('coordinador_id').value = dependencia.coordinador_id;
    }
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
// MANEJAR ENVÍO DE FORMULARIO DE EDICIÓN
// ========================================

async function manejarEnvioFormularioEditarDependencia(e) {
    e.preventDefault();

    // Validación final
    if (!validarFormularioFinalDependenciaEdit()) {
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
        const formData = new FormData(document.getElementById('dependenciaForm'));

    
        // Agregar activo
        const activo = document.getElementById('activo').checked;
        formData.append('activo', activo ? '1' : '0');

        // Enviar petición
        const response = await fetch(`/admin/editar-dependencia/${editingDependenciaId}`, {
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
            mostrarToast('Dependencia actualizada exitosamente', 'success');
            cerrarModalDependencia();

            // Recargar lista después de un momento
            setTimeout(() => {
                consultarNuevasDependencias();
            }, 500);

        } else if (response.status === 422) {
            // Errores de validación o confirmaciones requeridas
            if (data.requires_confirmation) {
                handleConfirmationRequired(data);
            } else {
                mostrarToast('Por favor corrija los errores en el formulario', 'error');
            }

        } else {
            mostrarToast(data.message || 'Error al actualizar dependencia', 'error');
        }

    } catch (error) {
        mostrarToast(error.message || 'Error al actualizar dependencia', 'error');

    } finally {
        submitButton.disabled = false;
        submitButton.classList.remove('loading');
        submitButton.innerHTML = originalText;
    }
}


async function consultarNuevasDependencias() {
    var posicion_scroll = window.scrollY;
    await cargarDependencias();
    window.scrollTo(0, posicion_scroll);
}

function validarFormularioFinalDependenciaEdit() {
    limpiarTodosLosErrores();
    let isValid = true;

    // Validar nombre
    const nombre = document.getElementById('nombre').value;
    if (!nombre) {
        mostrarError('nombre', 'El nombre es obligatorio');
        isValid = false;
    }

    // Validar descripción
    const descripcion = document.getElementById('descripcion').value;
    if (!descripcion) {
        mostrarError('descripcion', 'La descripción es obligatoria');
        isValid = false;
    }

    // Validar coordinador
    const coordinador = document.getElementById('coordinador_id').value;
    if (!coordinador) {
        mostrarError('coordinador_id', 'El coordinador es obligatorio');
        isValid = false;
    }

    return isValid;
}


// ========================================
// DESHABILITAR DEPENDENCIA
// ========================================

let currentToggleDependencia = null;
let currentToggleDependenciaId = null;
async function alternarEstadoDependencia(dependenciaId, checked) {
    currentToggleDependenciaId = dependenciaId;
    // Cargar datos de la dependencia primero
    try {
        const response = await fetch(`/admin/dependencias/${dependenciaId}`);
        if (!response.ok) throw new Error('Error al cargar dependencia');

        const data = await response.json();
        currentToggleDependencia = data.dependencia;

        // Abrir modal de confirmación
        if (checked) {
            abrirModalActivar();
        } else {
            abrirModalDesactivar();
        }

    } catch (error) {
        console.error('Error:', error);
        mostrarToast('Error al cargar información de la dependencia', 'error');

        // Revertir el toggle si hubo error
        const toggle = document.getElementById(`check_dependencia_${currentToggleDependenciaId}`);
        if (toggle) {
            checked = toggle.checked;
            toggle.checked = !checked;
        }
    }
}

function abrirModalActivar() {
    Swal.fire({
        title: '¿Estás seguro de querer activar la dependencia?',
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
            var toggle = document.getElementById(`check_dependencia_${currentToggleDependenciaId}`);
            var checked = toggle.checked;
            cambiarEstadoDependencia(currentToggleDependenciaId, checked);
        }else if (result.isDenied) {
            const toggle = document.getElementById(`check_dependencia_${currentToggleDependenciaId}`);
            if (toggle) {
                checked = toggle.checked;
                toggle.checked = !checked;
            }
        }
    });
}


async function cambiarEstadoDependencia(dependenciaId, checked) {
    mostrarSwalCargando('Activando la dependencia, por favor espere...');
    try {
        const formData = new FormData();
        formData.append('activo', checked ? '1' : '0');
        const response = await fetch(`/admin/alternar-estado-dependencia/${dependenciaId}`, {
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
            mostrarToast('Dependencia activada exitosamente', 'success');
            setTimeout(() => {
                cargarDependencias();
            }, 500);
        } else {
            const toggle = document.getElementById(`check_dependencia_${currentToggleDependenciaId}`);
            if (toggle) {
                checked = toggle.checked;
                toggle.checked = !checked;
            }
            mostrarToast(data.message || 'Error al activar la dependencia', 'error');
        }
    } catch (error) {
        const toggle = document.getElementById(`check_dependencia_${currentToggleDependenciaId}`);
        if (toggle) {
            checked = toggle.checked;
            toggle.checked = !checked;
        }
        console.error('Error:', error);
        mostrarToast('Error al activar la dependencia', 'error');
       
    }
}

// ========================================
// ACTIVAR/DESACTIVAR DEPENDENCIA
// ========================================

async function abrirModalDesactivar(dependenciaId, checked) {
    const modal = document.getElementById('toggleStatusDependenciaModal');
    modal.classList.remove('hidden');
    const dependencia = currentToggleDependencia;

    // Título
    document.getElementById('toggleDependenciaModalTitle').textContent = '¿Desea desactivar la dependencia '+ dependencia.nombre + '?';
    document.getElementById('toggleDependenciaModalHeader').className = 'px-6 py-4 border-b border-gray-200 bg-green-50';

    document.getElementById('toggleDependenciaModalInfo').innerHTML = `
        Esta dependencia cuenta con ${dependencia.equipos.length} equipos y ${dependencia.funcionarios.length} funcionarios.
    `;

    if (dependencia.equipos.length > 0 || dependencia.funcionarios.length > 0) {
        document.getElementById('toogleOpciones').classList.remove('hidden');
    } else {
        document.getElementById('toogleOpciones').classList.add('hidden');
    }
}

function cerrarModalDesactivar() {
    document.getElementById('toggleStatusDependenciaModal').classList.add('hidden');
    document.getElementById('toggleNotificar').checked = false;
    document.getElementById('toggleDesactivarEquipos').checked = false;
    const toggle = document.getElementById(`check_dependencia_${currentToggleDependenciaId}`);
    var checked = toggle.checked;
    toggle.checked = !checked;
    currentToggleDependencia = null;
    currentToggleDependenciaId = null;
}

async function confirmarDesactivarDependencia() {
    const toggleNotificar = document.getElementById('toggleNotificar').checked;
    const toggleDesactivarEquipos = document.getElementById('toggleDesactivarEquipos').checked;
    var checked = document.getElementById(`check_dependencia_${currentToggleDependenciaId}`).checked

    mostrarSwalCargando('Desactivando la dependencia, por favor espere...');
    try {
        const formData = new FormData();
        formData.append('activo', checked ? '1' : '0');
        formData.append('notificar', toggleNotificar ? '1' : '0');
        formData.append('desactivar_equipos', toggleDesactivarEquipos ? '1' : '0');
        const response = await fetch(`/admin/alternar-estado-dependencia/${currentToggleDependenciaId}`, {
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
            mostrarToast('Dependencia desactivada exitosamente', 'success');
            setTimeout(() => {
                document.getElementById('toggleStatusDependenciaModal').classList.add('hidden');
                cargarDependencias();
            }, 500);
        } else {
            const toggle = document.getElementById(`check_dependencia_${currentToggleDependenciaId}`);
            if (toggle) {
                checked = toggle.checked;
                toggle.checked = !checked;
            }
            mostrarToast(data.message || 'Error al desactivar la dependencia', 'error');
        }
    } catch (error) {
        const toggle = document.getElementById(`check_dependencia_${currentToggleDependenciaId}`);
        if (toggle) {
            checked = toggle.checked;
            toggle.checked = !checked;
        }
        console.error('Error:', error);
        mostrarToast('Error al desactivar la dependencia', 'error');
       
    }
}

var dependenciaVistaActual = null;
var tabActualVista = 'informacion';
async function verDependencia(dependenciaId) {  
    const modal = document.getElementById('viewDependenciaModal');
    modal.classList.remove('hidden');

    // Cargar datos de la dependencia
    try {
        mostrarSwalCargando('Cargando datos de la dependencia, por favor espere...');
        const response = await fetch(`/admin/dependencias/${dependenciaId}`);
        Swal.close();
        if (!response.ok) throw new Error('Error al cargar dependencia');

        const data = await response.json();
        dependenciaVistaActual = data.dependencia;

        // Mostrar primer tab
        cambiarTabVista('informacion');

        // Llenar información del modal
        llenarModalDetalleDependencia(data.dependencia);
    } catch (error) {
        console.error('Error:', error);
        mostrarToast('Error al cargar datos de la dependencia', 'error');
        cerrarModalVerDependencia();
    }
}

// ========================================
// LLENAR MODAL DETALLE DE DEPENDENCIA
// ========================================

function llenarModalDetalleDependencia() {
    // Nombre
    document.getElementById('viewDependenciaNombre').value = dependenciaVistaActual.nombre;
    
    // Descripción
    document.getElementById('viewDependenciaDescripcion').innerText = dependenciaVistaActual.descripcion;
    
    // Coordinador
    if (dependenciaVistaActual.coordinador_id) {
        document.getElementById('viewDependenciaCoordinador').innerHTML = `<div class="flex-shrink-0 h-10 w-10">
                ${dependenciaVistaActual.coordinador.foto_url
                    ? `<img class="h-10 w-10 rounded-full" src="/storage/${dependenciaVistaActual.coordinador.foto_url}" alt="${dependenciaVistaActual.coordinador.nombre}">`
                    : `<div class="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                        ${dependenciaVistaActual.coordinador.nombre.charAt(0)}${dependenciaVistaActual.coordinador.apellidos.charAt(0)}
                    </div>`
                }
            </div>
            <div class="ml-4">
                <div class="text-sm font-medium text-gray-900">${dependenciaVistaActual.coordinador.nombre} ${dependenciaVistaActual.coordinador.apellidos}</div>
                <div class="text-sm text-gray-500">${dependenciaVistaActual.coordinador.email}</div>
            </div>
        </div>`;
    }else{
        document.getElementById('viewDependenciaCoordinador').innerHTML = `<div class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
            <span class="text-xs">Sin coordinador</span>
        </div>`;
    }
    
    // Estado
    document.getElementById('viewDependenciaEstado').checked = dependenciaVistaActual.activo == 1 ? true : false;
    
    // Equipos
    document.getElementById('viewDependenciaEquipos').innerHTML = dependenciaVistaActual.equipos.map(equipo => `
        <tr>
            <td class="px-6 py-4">${equipo.nombre}</td>
            <td class="px-6 py-4">${equipo.funciones}</td>
        </tr>
    `).join('');

    // Funcionarios
    document.getElementById('viewDependenciaFuncionarios').innerHTML = dependenciaVistaActual.funcionarios.map(funcionario => `
        <tr>
            <td class="px-6 py-4">
                ${funcionario.foto_url
                    ? `<img class="h-10 w-10 rounded-full" src="/storage/${funcionario.foto_url}" alt="${funcionario.nombre}">`
                    : `<div class="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                        ${funcionario.nombre.charAt(0)}${funcionario.apellidos.charAt(0)}
                    </div>`
                }
            </td>
            <td class="px-6 py-4">${funcionario.nombre} ${funcionario.apellidos}</td>
            <td class="px-6 py-4">
                ${funcionario.cargo ? `<span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    <span class="text-xs">${funcionario.cargo}</span>
                </span>` : `<div class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                    <span class="text-xs">Sin cargo</span>
                </div>`}
            </td>
            <td class="px-6 py-4">${funcionario.email}</td>
            <td class="px-6 py-4">
                ${funcionario.celular
                    ? `<a href="tel:${funcionario.celular}" class="text-blue-600 hover:underline">${funcionario.celular}</a>`
                    : `<div class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        <span class="text-xs">Sin numero de celular</span>
                    </div>`
                }
            </td>
        </tr>
    `).join('');

    // Botón Editar
    document.getElementById('BtnviewTab_editar').classList.remove('hidden');
    document.getElementById('BtnviewTab_editar').setAttribute('onclick', `editarDependenciaDesdeModal(${dependenciaVistaActual.id})`);
}

function editarDependenciaDesdeModal(dependenciaId ) {
    editarDependencia(dependenciaId);
    cerrarModalVerDependencia();
}

function cerrarModalVerDependencia() {
    document.getElementById('viewDependenciaModal').classList.add('hidden');
    document.getElementById('viewDependenciaNombre').value = '';
    document.getElementById('viewDependenciaDescripcion').innerText = '';
    document.getElementById('viewDependenciaCoordinador').innerHTML = '';
    document.getElementById('viewDependenciaEstado').checked = false;
    document.getElementById('viewDependenciaEquipos').innerHTML = '';
    document.getElementById('viewDependenciaFuncionarios').innerHTML = '';

    document.getElementById('BtnviewTab_editar').classList.add('hidden');
    document.getElementById('BtnviewTab_editar').setAttribute('onclick', '');
    dependenciaVistaActual = null;
    tabActualVista = 'informacion';
}

function cambiarTabVista(nombreTab) {
    tabVistaActual = nombreTab;
    
    // Actualizar UI de tabs
    document.querySelectorAll('.view-tab-button').forEach(btn => {
        btn.classList.remove('border-blue-600', 'text-blue-600');
        btn.classList.add('border-transparent', 'text-gray-500');
        btn.classList.remove('active');
    });
    
    const botonActivo = document.getElementById(`BtnviewTab_${nombreTab}`);
    if (botonActivo) {
        botonActivo.classList.add('border-blue-600', 'text-blue-600');
        botonActivo.classList.remove('border-transparent', 'text-gray-500');
        botonActivo.classList.add('active');
    }
    
    // Ocultar todos los contenidos
    document.querySelectorAll('.view-tab-content').forEach(contenido => {
        contenido.classList.add('hidden');
    });
    
    // Mostrar contenido activo
    const contenidoActivo = document.getElementById(`viewTab_${nombreTab}`);
    if (contenidoActivo) {
        contenidoActivo.classList.remove('hidden');
    }
}

// ========================================
// eliminar dependencia
// ========================================

var dependenciaEliminar = null;
async function eliminarDependencia(dependenciaId) {
    mostrarSwalCargando('Consultando datos para eliminar la dependencia, por favor espere...');
    try {
        const response = await fetch(`/admin/dependencias/${dependenciaId}`, {
            method: 'GET',
        });
        if (!response.ok) throw new Error('Error al eliminar dependencia');
        const data = await response.json();
        dependenciaEliminar = data.dependencia;

        if (dependenciaEliminar.equipos.length > 0) {
            mostrarToast('La dependencia tiene equipos, por favor desactive los equipos antes de eliminar la dependencia', 'error');
            return;
        } 
        
        if (dependenciaEliminar.funcionarios.length > 0) {
            mostrarToast('La dependencia tiene funcionarios, por favor desactive los funcionarios antes de eliminar la dependencia', 'error');
            return;
        } 
    
        Swal.fire({
            title: '¿Estás seguro de querer eliminar la dependencia ('+ dependenciaEliminar.nombre + ')?',
            html: '<p style="color:rgb(179, 2, 10); font-weight: bold;">Esta acción no se puede deshacer</p><p style="color:rgb(10, 10, 10); font-weight: bold;">Por favor ingrese el nombre de la dependencia para confirmar la eliminación</p>',
            icon: 'warning',
            showConfirmButton: true,
            showCancelButton: true,
            confirmButtonText: 'Eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#28a745',
            cancelButtonColor: '#dc3545',
            allowOutsideClick: false,
            input: 'text',
            inputPlaceholder: 'Ingrese el nombre de la dependencia',
            inputValidator: (value) => {
                if (value !== dependenciaEliminar.nombre) {
                    return 'El nombre ingresado no es correcto';
                }
            }
        }).then((result) => {
            if (result.isConfirmed) {
                confirmarEliminacionDependencia();
            }
        });
        
    } catch (error) {
        console.error('Error:', error);
        mostrarToast('Error al eliminar dependencia', 'error');
    }
}

async function confirmarEliminacionDependencia() {
    try {
        mostrarSwalCargando('Eliminando dependencia, por favor espere...');
        const response = await fetch(`/admin/eliminar-dependencia/${dependenciaEliminar.id}`, {
            method: 'DELETE',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
            }
        });
        Swal.close();
        if (!response.ok) throw new Error('Error al eliminar dependencia');
        const data = await response.json();
        if (response.ok) {
            var mensaje = data.message;
            var icon = data.icon;
            mostrarToast(mensaje, icon);
            if (icon == 'success') {
                setTimeout(() => {
                    cargarDependencias();
                }, 500);
            }
        } else {
            mostrarToast(data.message || 'Error al eliminar dependencia', 'error');
        }
    } catch (error) {
        Swal.close();
        console.error('Error:', error);
        mostrarToast('Error al eliminar dependencia', 'error');
    }
}