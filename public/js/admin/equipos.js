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
    dependencia_id: '',
};
let selectedEquipos = [];
let debounceTimer = null;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    cargarEquipos();
    cargarDependencias();
    configurarEscuchadoresEventos();
});

// Cargar dependencias
async function cargarDependencias() {
    try {
        const response = await fetch('/admin/dependencias-select');
        const dependencias = await response.json();
        renderizarDependencias(dependencias);
    } catch (error) {
        console.error('Error:', error);
    }
}


function renderizarDependencias(dependencias) {
    const select = document.getElementById('filterDependencia');
    select.innerHTML = '<option value="">Todas las dependencias</option>';
    dependencias.forEach(dependencia => {
        select.innerHTML += `<option value="${dependencia.id}">${dependencia.nombre}</option>`;
    });
}


// Configurar event listeners
function configurarEscuchadoresEventos() {
    // Búsqueda con debounce
    document.getElementById('searchInput').addEventListener('input', function(e) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            currentFilters.search = e.target.value;
            currentPage = 1;
            cargarEquipos();
        }, 500);
    });

    // Filtros
    document.getElementById('filterEstado').addEventListener('change', function(e) {
        currentFilters.estado = e.target.value;
        currentPage = 1;
        cargarEquipos();
    });

    document.getElementById('filterDependencia').addEventListener('change', function(e) {
        currentFilters.dependencia_id = e.target.value;
        currentPage = 1;
        cargarEquipos();
    });


    // Items por página
    document.getElementById('perPageSelect').addEventListener('change', function(e) {
        currentPage = 1;
        cargarEquipos();
    });

    // Seleccionar todos
    document.getElementById('selectAll').addEventListener('change', function(e) {
        const checkboxes = document.querySelectorAll('.equipo-checkbox');
        checkboxes.forEach(cb => {
            cb.checked = e.target.checked;
            if (e.target.checked) {
                if (!selectedEquipos.includes(cb.value)) {
                    selectedEquipos.push(cb.value);
                }
            } else {
                selectedEquipos = [];
            }
        });
    });
}


// Cargar equipos
async function cargarEquipos() {
    try {
        mostrarCargadorEsqueleto();

        const perPage = document.getElementById('perPageSelect').value;
        const params = new URLSearchParams({
            page: currentPage,
            per_page: perPage,
            ...currentFilters
        });

        const response = await fetch(`/admin/equipos?${params}`, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json'
            }
        });

        // Manejar sesión expirada o errores de autenticación
        await manejarRespuestaFetch(response);

        if (!response.ok) throw new Error('Error al cargar equipos');

        const data = await response.json();
        renderizarEquipos(data.data);
        renderizarPaginacion(data);
        actualizarIndicadorFiltros();
        
    } catch (error) {
        console.error('Error:', error);
        if (error.message !== 'Sesión expirada' && error.message !== 'No encontrado - Redirigiendo') {
            mostrarToast('Error al cargar equipos', 'error');
        }
    }
}

function mostrarCargadorEsqueleto() {
    const tbody = document.getElementById('equiposTableBody');
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

function renderizarEquipos(equipos) {
    const tbody = document.getElementById('equiposTableBody');

    if (equipos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                    No se encontraron equipos  
                </td>
            </tr>
        `;
        return;
    }
    

    // Debug: verificar datos de fotos
    tbody.innerHTML = equipos.map(equipo => `
        <tr class="hover:bg-gray-50 ${selectedEquipos.includes(equipo.id.toString()) ? 'bg-blue-50' : ''}">
            <td class="px-6 py-4">
                <input type="checkbox" class="equipo-checkbox rounded border-gray-300"
                    value="${equipo.id}"
                    ${selectedEquipos.includes(equipo.id.toString()) ? 'checked' : ''}
                    onchange="alternarSeleccionEquipo(${equipo.id})"
                >
            </td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full">
                    ${equipo.nombre}
                </span>
            </td>
            <td class="px-6 py-4" style="max-width: 200px;">
                <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full">
                    ${equipo.area.nombre}
                </span>
            </td>
            <td class="px-6 py-4">
                <div class="flex items-center">
                ${equipo.lider ? `
                    <div class="flex-shrink-0 h-10 w-10">
                            ${equipo.lider.foto_url
                                ? `<img class="h-10 w-10 rounded-full" src="/storage/${equipo.lider.foto_url}" alt="${equipo.lider.nombre}">`
                                : `<div class="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                                    ${equipo.lider.nombre.charAt(0)}${equipo.lider.apellidos.charAt(0)}
                                </div>`
                            }
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">${equipo.lider.nombre} ${equipo.lider.apellidos}</div>
                            <div class="text-sm text-gray-500">${equipo.lider.email}</div>
                        </div>
                    </div>
                    ` : `
                        <div class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            <span class="text-xs">Sin líder</span>
                        </div>
                    `}
                </div>
            </td>
            <td class="px-6 py-4 text-sm text-gray-500 text-center">
                <div onclick="verMiembrosEquipo(${equipo.id})" style="cursor: pointer;" class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    <span class="text-xs">${equipo.miembros.length} miembros</span>
                </div>
            </td>
            <td class="px-6 py-4">
               <label class="relative inline-flex items-center cursor-pointer">
                    <input id="check_equipo_${equipo.id}" type="checkbox" class="sr-only peer" ${equipo.activo ? 'checked' : ''} onchange="alternarEstadoEquipo(${equipo.id}, this.checked)">
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
                            <a href="#" onclick="verEquipo(${equipo.id}); return false;" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Ver Detalle</a>
                            <a href="#" onclick="abrirModalEditarEquipo(${equipo.id}); return false;" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Editar</a>
                            <a href="#" onclick="eliminarEquipo(${equipo.id}); return false;" class="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100">Eliminar</a>
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
    document.getElementById('totalEquipos').textContent = data.total || 0;

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
    cargarEquipos();
}


// Actualizar badge de filtros
function actualizarIndicadorFiltros() {
    let count = 0;
    if (currentFilters.search) count++;
    if (currentFilters.estado) count++;
    if (currentFilters.dependencia_id) count++;

    const badge = document.getElementById('filterBadge');
    const countEl = document.getElementById('filterCount');

    if (count > 0) {
        badge.classList.remove('hidden');
        countEl.textContent = count;
    } else {
        badge.classList.add('hidden');
    }
}

// Limpiar filtros
function limpiarFiltros() {
    currentFilters = {
        search: '',
        estado: '',
        dependencia_id: '',
    };

    document.getElementById('searchInput').value = '';
    document.getElementById('filterEstado').value = '';
    document.getElementById('filterDependencia').value = '';
    currentPage = 1;
    cargarEquipos();
}


// Abrir modal de creación de equipo
function abrirModalCrearEquipo() {
    document.getElementById('modalTitle').textContent = 'Crear Nuevo Equipo';
    document.getElementById('equipoForm').reset();
    document.getElementById('equipoModal').classList.remove('hidden');
    document.getElementById('submitButton').classList.remove('hidden');
    formChanged = false;

    //cambiar el evento del formulario a POST
    const form = document.getElementById('equipoForm');
    //form.removeEventListener('submit', manejarEnvioFormularioEditarEquipo);
    form.addEventListener('submit', manejarEnvioFormulario);

    // Cargar datos necesarios
    cargarAreas();
    cargarRolesLiderEquipo();
    //cambiar el texto del botón
    document.getElementById('submitButton').textContent = 'Guardar Equipo';

    // Limpiar errores
    limpiarTodosLosErrores();

    // Listener para detectar cambios en el formulario
    document.getElementById('equipoForm').addEventListener('input', function() {
        formChanged = true;
    });
}


// Cargar áreas
async function cargarAreas() {
    const response = await fetch('/admin/dependencias-select');
    const areas = await response.json();
    renderizarAreas(areas);
}

function renderizarAreas(areas) {
    const select = document.getElementById('area_id');
    select.innerHTML = '<option value="">Seleccione una área</option>';
    areas.forEach(area => {
        select.innerHTML += `<option value="${area.id}">${area.nombre}</option>`;
    });
}

function limpiarTodosLosErrores() {
    document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('.error-message').forEach(el => {
        el.classList.add('hidden');
        el.textContent = '';
    });
}

function cerrarModalEquipo() {
    document.getElementById('equipoModal').classList.add('hidden');
    document.getElementById('nombre').value = '';
    document.getElementById('area_id').value = '';
    document.getElementById('lider_id').value = '';
    document.getElementById('funciones').value = '';
    document.getElementById('rol_id').value = '';
    document.getElementById('activo').checked = false;

    document.getElementById('lider_id').innerHTML = '<option value="">Seleccione un líder</option>';
    document.getElementById('submitButton').classList.add('hidden');

    if (isEditingModeEquipo) {
        isEditingModeEquipo = false;

        document.getElementById('danger-message-equipo').classList.add('hidden');
        document.getElementById('area_id').removeAttribute('disabled');
        esta_cambiando_lider = false;
        document.getElementById('motivo_cambio_lider').value = '';
    }
}

// Cargar usuarios por área
async function cargarUsuariosPorArea() {
    const areaId = document.getElementById('area_id').value;
    const response = await fetch(`/admin/usuarios-area-select?area_id=${areaId}`);
    const usuarios = await response.json();
    renderizarUsuarios(usuarios.usuarios);
}

async function cargarRolesLiderEquipo() {
    const response = await fetch('/admin/roles-lider-equipo');
    const roles = await response.json();
    renderizarRoles(roles.roles);
}

function renderizarUsuarios(usuarios) {
    const select = document.getElementById('lider_id');
    select.innerHTML = '<option value="">Seleccione un líder</option>';
    usuarios.forEach(usuario => {
        select.innerHTML += `<option value="${usuario.id}">${usuario.nombre} ${usuario.apellidos} -> ${usuario.equipo ? usuario.equipo.nombre : 'Sin equipo'}</option>`;
    });

    document.getElementById('lider_id').value = '';
    document.getElementById('rol_id').value = '';
}

var esta_cambiando_lider = false;
async function mostrarMensajeSiTieneEquipo(valor) {
    //consultar si es lider o miembro de otro equipo
    const id_usuario = valor.value;
    if (id_usuario === '') {
        if(isEditingModeEquipo) {
            if(originalEquipoData.lider_id != null) {
                esta_cambiando_lider = true;
                document.getElementById('notificar_anterior_lider').checked = true;
                document.getElementById('mantener_anterior_lider').checked = true;
                document.getElementById('danger-message-equipo').classList.remove('hidden');
                document.getElementById('danger-message-text').textContent = "Este equipo ya tiene un líder asignado, al no seleccionar un lider, el lider anterior quedara como miembro del equipo.";
                document.getElementById('rol_id').value = '';
            }
            else {
                esta_cambiando_lider = false;
                document.getElementById('danger-message-equipo').classList.add('hidden');
            }
        }
        return;
    }else{
        var ruta = '/admin/verificar-miembro-equipo';
        if(isEditingModeEquipo) {
            if(id_usuario != originalEquipoData.lider_id && originalEquipoData.lider_id != null) {
                esta_cambiando_lider = true;
                document.getElementById('notificar_anterior_lider').checked = true;
                document.getElementById('mantener_anterior_lider').checked = true;
                document.getElementById('danger-message-equipo').classList.remove('hidden');
                document.getElementById('danger-message-text').textContent = "Este equipo ya tiene un líder asignado, al continuar se asignara el nuevo lider, y el lider anterior quedara como miembro del equipo.";
            }
            else {
                esta_cambiando_lider = false;
                document.getElementById('danger-message-equipo').classList.add('hidden');
            }
            ruta = `${ruta}?id_equipo=${editingEquipoId}&id_usuario=${id_usuario}`;
        }else{
            ruta = `${ruta}?id_usuario=${id_usuario}`;
        }
    
        const response = await fetch(ruta);
        const data = await response.json();
        if (data.tipo === 'miembro') {
            mensajeImportante(data.mensaje);
        }
        if (data.tipo === 'lider') {
            mensajeImportante(data.mensaje);
        }
    }
}

function renderizarRoles(roles) {
    const select = document.getElementById('rol_id');
    select.innerHTML = '<option value="">Seleccione un rol</option>';
    roles.forEach(role => {
        select.innerHTML += `<option value="${role.id}">${role.name}</option>`;
    });
}

function mensajeImportante(mensaje) {
   Swal.fire({
    title: 'información importante',
    html: mensaje,
    icon: 'info',
    showCancelButton: false,
    showConfirmButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Continuar',
    allowOutsideClick: false,
   });
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
        const formData = new FormData(document.getElementById('equipoForm'));

        // Agregar activo
        const activo = document.getElementById('activo').checked;
        formData.append('activo', activo ? '1' : '0');

        // Enviar petición
        const response = await fetch('/admin/guardar-equipo', {
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
            if (data.type === 'success') {
                cerrarModalEquipo();

                // Recargar lista de equipos
                setTimeout(() => {
                    currentPage = 1;
                    cargarEquipos();
                }, 500);
            }
        } else if (response.status === 422) {
            // Errores de validación
            mostrarToast(data.message || 'Por favor corrija los errores en el formulario', 'error');

        } else {
            // Error del servidor
            mostrarToast(data.message || 'Error al crear equipo', 'error');
        }

    } catch (error) {
        mostrarToast(error.message || 'Error al guardar equipo', 'error');

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

    // Validar funciones
    const funciones = document.getElementById('funciones').value;
    if (!funciones) {
        mostrarError('funciones', 'Las funciones son obligatorias');
        isValid = false;
    }

    // si se asigna un lider, validar el rol
    const lider = document.getElementById('lider_id').value;
    if (lider !== '') {
        const rol = document.getElementById('rol_id').value;
        if (rol === '') {
            mostrarError('rol_id', 'El rol es obligatorio');
            isValid = false;
        }
    }

    // Validar área
    const area = document.getElementById('area_id').value;
    if (!area) {
        mostrarError('area_id', 'El área es obligatoria');
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
// EDITAR EQUIPO
// ========================================
// Abrir modal de edición de equipo
let editingEquipoId = null;
let originalEquipoData = null;
let isEditingModeEquipo = false;
async function abrirModalEditarEquipo(equipoId) {
    editingEquipoId = equipoId;
    isEditingModeEquipo = true;
    document.getElementById('modalTitle').textContent = 'Editar Equipo';
    document.getElementById('equipoModal').classList.remove('hidden');
    document.getElementById('submitButton').classList.remove('hidden');
    document.getElementById('area_id').setAttribute('disabled', true);
    currentTab = 1;
    formChanged = false;

    // Mostrar Swal de cargando
    mostrarSwalCargando('Cargando datos del equipo, por favor espere...');

    //cargar roles del lider
    await cargarRolesLiderEquipo();
    //cargar areas
    await cargarAreas();

    // Cargar datos del equipo
    try {
        const response = await fetch(`/admin/datos-equipo/${equipoId}`);
        if (!response.ok) throw new Error('Error al cargar equipo');

        const data = await response.json();
        originalEquipoData = JSON.parse(JSON.stringify(data.equipo)); // Deep clone
        Swal.close();
        // Actualizar título con nombre del equipo
        document.getElementById('modalTitle').textContent = `Editar Equipo: ${data.equipo.nombre}`;

        // Llenar formulario con datos
        await llenarFormularioConDatosEquipo(data.equipo);

        // Cambiar el evento del formulario a PUT
        const form = document.getElementById('equipoForm');
        form.removeEventListener('submit', manejarEnvioFormulario);
        form.addEventListener('submit', manejarEnvioFormularioEditarEquipo);

        // Cambiar texto del botón
        document.getElementById('submitButton').textContent = 'Guardar Cambios';
        limpiarTodosLosErrores();

    } catch (error) {
        console.error('Error:', error);
        mostrarToast('Error al cargar datos del equipo', 'error');
        cerrarModalEquipo();
    }
}

async function llenarFormularioConDatosEquipo(equipo) {
    document.getElementById('nombre').value = equipo.nombre;
    document.getElementById('area_id').value = equipo.area_id;
    document.getElementById('funciones').value = equipo.funciones;
    document.getElementById('activo').checked = equipo.activo;

    await cargarUsuariosPorArea();
    document.getElementById('lider_id').value = equipo.lider_id ? equipo.lider_id : "";
    document.getElementById('rol_id').value = equipo.rol_lider ? equipo.rol_lider.id : "";
}

async function manejarEnvioFormularioEditarEquipo(e) {
    e.preventDefault();

    // Validación final
    if (!validarFormularioFinalEditarEquipo()) {
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
        const formData = new FormData(document.getElementById('equipoForm'));

    
        // Agregar activo
        const activo = document.getElementById('activo').checked;
        formData.append('activo', activo ? '1' : '0');
        formData.append('area_id', document.getElementById('area_id').value);

        // si se esta cambiando de lider, agregar el motivo
        if (esta_cambiando_lider) {

            //agregar variable es_cambiando_lider
            formData.append('es_cambiando_lider', 1);

            const motivo = document.getElementById('motivo_cambio_lider').value;
            formData.append('motivo_cambio_lider', motivo);

            // si se esta notificando al anterior lider, agregar el checkbox
            if (document.getElementById('notificar_anterior_lider').checked) {
                formData.append('notificar_anterior_lider', 1);
            }else{
                formData.append('notificar_anterior_lider', 0);
            }

            // si se esta manteniendo al anterior lider como miembro del equipo, agregar el checkbox
            if (document.getElementById('mantener_anterior_lider').checked) {
                formData.append('mantener_anterior_lider', 1);
            }else{
                formData.append('mantener_anterior_lider', 0);
            }
        }else{
            formData.append('es_cambiando_lider', 0);
        }

        // Enviar petición
        const response = await fetch(`/admin/editar-equipo/${editingEquipoId}`, {
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
            cerrarModalEquipo();

            // Recargar lista después de un momento
            setTimeout(() => {
                consultarNuevasEquipos();
            }, 500);

        } else if (response.status === 422) {
            // Errores de validación o confirmaciones requeridas
            if (data.requires_confirmation) {
                handleConfirmationRequired(data);
            } else {
                mostrarToast(data.message || 'Por favor corrija los errores en el formulario', 'error');
            }

        } else {
            mostrarToast(data.message || 'Error al actualizar equipo', 'error');
        }

    } catch (error) {
        mostrarToast(error.message || 'Error al actualizar equipo', 'error');

    } finally {
        submitButton.disabled = false;
        submitButton.classList.remove('loading');
        submitButton.innerHTML = originalText;
    }
}

async function consultarNuevasEquipos() {
    var posicion_scroll = window.scrollY;
    await cargarEquipos();
    window.scrollTo(0, posicion_scroll);
}

function validarFormularioFinalEditarEquipo() {
    limpiarTodosLosErrores();
    let isValid = true;

    // Validar nombre
    const nombre = document.getElementById('nombre').value;
    if (!nombre) {
        mostrarError('nombre', 'El nombre es obligatorio');
        isValid = false;
    }

    // Validar área
    const area = document.getElementById('area_id').value;
    if (!area) {
        mostrarError('area_id', 'El área es obligatoria');
        isValid = false;
    }

    // Validar funciones
    const funciones = document.getElementById('funciones').value;
    if (!funciones) {
        mostrarError('funciones', 'Las funciones son obligatorias');
        isValid = false;
    }

    // si se asigna un lider, validar el rol
    const lider = document.getElementById('lider_id').value;
    if (lider !== '') {
        const rol = document.getElementById('rol_id').value;
        if (rol === '') {
            mostrarError('rol_id', 'El rol es obligatorio');
            isValid = false;
        }
    }

    // si se esta cambiando de lider, validar el motivo
    if (esta_cambiando_lider) {
        const motivo = document.getElementById('motivo_cambio_lider').value;
        if (!motivo) {
            mostrarError('motivo_cambio_lider', 'El motivo es obligatorio');
            isValid = false;
        }
    }

    return isValid;
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
// DESHABILITAR EQUIPO
// ========================================

let currentToggleEquipo = null;
let currentToggleEquipoId = null;
async function alternarEstadoEquipo(equipoId, checked) {
    currentToggleEquipoId = equipoId;
    // Cargar datos del equipo primero
    mostrarSwalCargando('Cargando datos del equipo, por favor espere...');
    try {
        const response = await fetch(`/admin/datos-equipo/${equipoId}`);
        if (!response.ok) throw new Error('Error al cargar equipo');
        Swal.close();

        const data = await response.json();
        currentToggleEquipo = data.equipo;

        // Abrir modal de confirmación
        if (checked) {
            abrirModalActivar();
        } else {
            abrirModalDesactivar();
        }

    } catch (error) {
        console.error('Error:', error);
        mostrarToast('Error al cargar información del equipo', 'error');

        // Revertir el toggle si hubo error
        const toggle = document.getElementById(`check_equipo_${currentToggleEquipoId}`);
        if (toggle) {
            checked = toggle.checked;
            toggle.checked = !checked;
        }
    }
}

function abrirModalActivar() {
    Swal.fire({
        title: '¿Estás seguro de querer activar el equipo ('+currentToggleEquipo.nombre+')?',
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
            var toggle = document.getElementById(`check_equipo_${currentToggleEquipoId}`);
            var checked = toggle.checked;
            cambiarEstadoEquipo(currentToggleEquipoId, checked);
        }else if (result.isDenied) {
            const toggle = document.getElementById(`check_equipo_${currentToggleEquipoId}`);
            if (toggle) {
                checked = toggle.checked;
                toggle.checked = !checked;
            }
        }
    });
}

function abrirModalDesactivar() {
    Swal.fire({
        title: '¿Estás seguro de querer desactivar el equipo ('+currentToggleEquipo.nombre+')?',
        html: currentToggleEquipo.miembros.length > 0 ? '<div class="danger-message"> <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4"><p class="text-red-500">Este equipo cuenta con <strong>'+currentToggleEquipo.miembros.length+'</strong> miembros, al desactivar el equipo se notificará a los miembros del equipo.</p></div></div>' : '',
        icon: 'warning',
        showConfirmButton: true,
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
            var toggle = document.getElementById(`check_equipo_${currentToggleEquipoId}`);
            var checked = toggle.checked;
            cambiarEstadoEquipo(currentToggleEquipoId, checked);
        }else if (result.isDenied) {
            const toggle = document.getElementById(`check_equipo_${currentToggleEquipoId}`);
            if (toggle) {
                checked = toggle.checked;
                toggle.checked = !checked;
            }
        }
    });
}

async function cambiarEstadoEquipo(equipoId, checked) {
    mostrarSwalCargando('Activando el equipo, por favor espere...');
    try {
        const formData = new FormData();
        formData.append('activo', checked ? '1' : '0');
        const response = await fetch(`/admin/alternar-estado-equipo/${equipoId}`, {
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
            mostrarToast('Equipo activado exitosamente', 'success');
            setTimeout(() => {
                consultarNuevasEquipos();
            }, 500);
        } else {
            const toggle = document.getElementById(`check_equipo_${currentToggleEquipoId}`);
            if (toggle) {
                checked = toggle.checked;
                toggle.checked = !checked;
            }
            mostrarToast(data.message || 'Error al activar el equipo', 'error');
        }
    } catch (error) {
        const toggle = document.getElementById(`check_equipo_${currentToggleEquipoId}`);
        if (toggle) {
            checked = toggle.checked;
            toggle.checked = !checked;
        }
        console.error('Error:', error);
        mostrarToast('Error al activar el equipo', 'error');
    }
}

// ========================================
// VER EQUIPO
// ========================================

var equipoVistaActual = null;
var tabActualVista = 'informacion';
async function verEquipo(equipoId, tab = 'informacion') {  
    const modal = document.getElementById('viewEquipoModal');
    modal.classList.remove('hidden');

    // Cargar datos del equipo
    try {
        mostrarSwalCargando('Cargando datos del equipo, por favor espere...');
        const response = await fetch(`/admin/informacion-equipo/${equipoId}`);
        Swal.close();
        if (!response.ok) throw new Error('Error al cargar equipo');

        const data = await response.json();
        equipoVistaActual = data.equipo;

        // Mostrar primer tab
        cambiarTabVista(tab);

        // Llenar información del modal
        llenarModalDetalleEquipo();
    } catch (error) {
        console.error('Error:', error);
        mostrarToast('Error al cargar datos del equipo', 'error');
        cerrarModalVerEquipo();
    }
}

function llenarModalDetalleEquipo() {
    // Nombre
    document.getElementById('viewEquipoNombre').value = equipoVistaActual.nombre;

    // Área
    document.getElementById('viewEquipoAreaNombre').value = equipoVistaActual.area.nombre;
    
    // Descripción
    document.getElementById('viewEquipoDescripcion').value = equipoVistaActual.funciones;
    
    // Coordinador
    if (equipoVistaActual.lider_id) {
        document.getElementById('viewEquipoLider').innerHTML = `<div class="flex-shrink-0 h-10 w-10">
                ${equipoVistaActual.lider.foto_url
                    ? `<img class="h-10 w-10 rounded-full" src="/storage/${equipoVistaActual.lider.foto_url}" alt="${equipoVistaActual.lider.nombre}">`
                    : `<div class="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                        ${equipoVistaActual.lider.nombre.charAt(0)}${equipoVistaActual.lider.apellidos.charAt(0)}
                    </div>`
                }
            </div>
            <div class="ml-4">
                <div class="text-sm font-medium text-gray-900">${equipoVistaActual.lider.nombre} ${equipoVistaActual.lider.apellidos}</div>
                <div class="text-sm text-gray-500">${equipoVistaActual.lider.email}</div>
                <div class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    <span class="font-bold mr-1">Rol: </span>${equipoVistaActual.rol_lider.name}
                </div>
            </div>
        </div>`;
    }else{
        document.getElementById('viewEquipoLider').innerHTML = `<div class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
            <span class="text-xs">Sin líder</span>
        </div>`;
    }

    // Miembros
    document.getElementById('viewEquipoMiembrosNombre').innerHTML = equipoVistaActual.nombre;
    document.getElementById('viewEquipoMiembrosCount').innerHTML = "Número de miembros: " + equipoVistaActual.miembros.length;
    document.getElementById('viewEquipoMiembros').innerHTML = equipoVistaActual.miembros.map(miembro => `
        <tr>
            <td class="px-6 py-4">
                ${miembro.foto_url
                    ? `<img class="h-10 w-10 rounded-full" src="/storage/${miembro.foto_url}" alt="${miembro.nombre}">`
                    : `<div class="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                        ${miembro.nombre.charAt(0)}${miembro.apellidos.charAt(0)}
                    </div>`
                }
            </td>
            <td class="px-6 py-4">${miembro.nombre} ${miembro.apellidos}</td>
            <td class="px-6 py-4">
                    ${miembro.tipo_miembro === 'lider' ? `<span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        <span class="font-bold mr-1">Líder</span>
                    </span>` : `<span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        <span class="text-xs">Miembro</span>
                    </span>`}
            </td>
            <td class="px-6 py-4">
                ${miembro.cargo ? `${miembro.cargo}` : `<div class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                    <span class="text-xs">Sin cargo</span>
                </div>`}
            </td>
            <td class="px-6 py-4">
                ${miembro.email
                    ? `<a href="mailto:${miembro.email}" class="text-blue-600 hover:underline">${miembro.email}</a>`
                    : `<div class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        <span class="text-xs">Sin email</span>
                    </div>`
                }
            </td>
            <td class="px-6 py-4">
                
            </td>
            <td class="px-6 py-4">
                ${miembro.id != equipoVistaActual.lider_id ? `<div class="flex items-center">
                    <button type="button" onclick="eliminarMiembroEquipo(${equipoVistaActual.id}, ${miembro.id}, '${miembro.nombre} ${miembro.apellidos}')" class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                        <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </div >` : ''}
            </td>
        </tr>
    `).join('');
    
    // Estado
    document.getElementById('viewEquipoEstado').checked = equipoVistaActual.activo ? true : false;
    

    // Botón Editar
    document.getElementById('BtnviewTab_editar').classList.remove('hidden');
    document.getElementById('BtnviewTab_editar').setAttribute('onclick', `editarEquipoDesdeModal(${equipoVistaActual.id})`);
}

function editarEquipoDesdeModal(equipoId) {
    abrirModalEditarEquipo(equipoId);
    cerrarModalVerEquipo();
}

function cerrarModalVerEquipo() {
    document.getElementById('viewEquipoModal').classList.add('hidden');
    document.getElementById('viewEquipoNombre').value = '';
    document.getElementById('viewEquipoAreaNombre').value = '';
    document.getElementById('viewEquipoDescripcion').value = '';
    document.getElementById('viewEquipoLider').innerHTML = '';
    document.getElementById('viewEquipoEstado').checked = false;

    document.getElementById('BtnviewTab_editar').classList.add('hidden');
    document.getElementById('BtnviewTab_editar').setAttribute('onclick', '');
    equipoVistaActual = null;
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
// eliminar equipo
// ========================================

var equipoEliminar = null;
async function eliminarEquipo(equipoId) {
    mostrarSwalCargando('Consultando datos para eliminar el equipo, por favor espere...');
    try {
        const response = await fetch(`/admin/datos-equipo/${equipoId}`);
        if (!response.ok) throw new Error('Error al consultar datos del equipo');
        const data = await response.json();
        equipoEliminar = data.equipo;
        
        if (equipoEliminar.miembros.length > 0) {
            Swal.fire({
                title: 'El equipo tiene miembros activos',
                text: 'Por favor antes de eliminar el equipo, reasignar estos miembros a otro equipo o elimínalos de este equipo',
                icon: 'warning',
                showConfirmButton: true,
                confirmButtonText: 'Ok, Entendido',
                confirmButtonColor: '#28a745',
                allowOutsideClick: false,
            });
            return;
        } 
    
        Swal.fire({
            title: '¿Estás seguro de querer eliminar el equipo ('+ equipoEliminar.nombre + ')?',
            html: '<p style="color:rgb(179, 2, 10); font-weight: bold;">Esta acción no se puede deshacer</p><p style="color:rgb(10, 10, 10); font-weight: bold;">Por favor ingrese el nombre del equipo para confirmar la eliminación</p>',
            icon: 'warning',
            showConfirmButton: true,
            showCancelButton: true,
            confirmButtonText: 'Eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#28a745',
            cancelButtonColor: '#dc3545',
            allowOutsideClick: false,
            input: 'text',
            inputPlaceholder: 'Ingrese el nombre del equipo',
            inputValidator: (value) => {
                if (value !== equipoEliminar.nombre) {
                    return 'El nombre ingresado no es correcto';
                }
            }
        }).then((result) => {
            if (result.isConfirmed) {
                confirmarEliminacionEquipo();
            }
        });
        
    } catch (error) {
        console.error('Error:', error);
        mostrarToast('Error al eliminar equipo', 'error');
    }
}

async function confirmarEliminacionEquipo() {
    try {
        mostrarSwalCargando('Eliminando equipo, por favor espere...');
        const response = await fetch(`/admin/eliminar-equipo/${equipoEliminar.id}`, {
            method: 'DELETE',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
            }
        });
        Swal.close();
        if (!response.ok) throw new Error('Error al eliminar equipo');
        const data = await response.json();
        if (response.ok) {
            var mensaje = data.message;
            var tipo = data.type;
            mostrarToast(mensaje, tipo);
            if (tipo == 'success') {
                setTimeout(() => {
                    consultarNuevasEquipos();
                }, 500);
            }
        } else {
            mostrarToast(data.message || 'Error al eliminar equipo', 'error');
        }
    } catch (error) {
        Swal.close();
        console.error('Error:', error);
        mostrarToast('Error al eliminar equipo', 'error');
    }
}

// ========================================
// abrir modal agregar miembro
// ========================================
var debounceTimerEmpleadosPorArea = null;

document.getElementById('buscar_empleado').addEventListener('keyup', () => {
    clearTimeout(debounceTimerEmpleadosPorArea);
    debounceTimerEmpleadosPorArea = setTimeout(() => {
        consultarEmpleadosPorArea();
    }, 500);
});

async function abrirModalAgregarMiembro() {    
    document.getElementById('viewEquipoModal').classList.add('hidden');
    document.getElementById('viewEquipoAgregarMiembroModal').classList.remove('hidden');
    document.getElementById('areaNombreAgregarMiembro').innerHTML = equipoVistaActual.area.nombre;
    await consultarEmpleadosPorArea();
}

function cerrarModalAgregarMiembro() {
    document.getElementById('viewEquipoAgregarMiembroModal').classList.add('hidden');
    document.getElementById('empleadosAgregarMiembro').innerHTML = '';
    empleadosSeleccionados = [];
    document.getElementById('cantidadEmpleadosSeleccionados').innerHTML = '0';
    document.getElementById('buscar_empleado').value = '';
    document.getElementById('checkbox_seleccionar_todos_empleados').checked = false;
    parametrosBusquedaEmpleadosPorArea = {
        id_equipo: null,
        id_area: null,
        texto_busqueda: '',
    };
}


var empleadosPorArea = [];
var parametrosBusquedaEmpleadosPorArea = {
   id_equipo: null,
   id_area: null,
   texto_busqueda: '',
};
async function consultarEmpleadosPorArea() {
    debugger;
    try {
        mostrarSwalCargando('Consultando empleados por área, por favor espere...');
        parametrosBusquedaEmpleadosPorArea.id_equipo = equipoVistaActual.id;
        parametrosBusquedaEmpleadosPorArea.id_area = equipoVistaActual.area.id;
        parametrosBusquedaEmpleadosPorArea.texto_busqueda = document.getElementById('buscar_empleado').value;
        const response = await fetch(`/admin/empleados-por-area-otros-equipos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
            },
            body: JSON.stringify(parametrosBusquedaEmpleadosPorArea)
        });

        Swal.close();
        if (!response.ok) {
            mostrarToast('Error al consultar empleados por área', 'error');
            return;
        }

        const data = await response.json();
        empleadosPorArea = data.empleados;
        renderizarEmpleadosAgregarMiembro(data.empleados);
    } catch (error) {
        console.error('Error:', error);
        mostrarToast('Error al consultar empleados por área', 'error');
    }
}

function renderizarEmpleadosAgregarMiembro() {
    const empleadosContainer = document.getElementById('empleadosAgregarMiembro');
    empleadosContainer.innerHTML = empleadosPorArea.map(empleado => `
        <tr>
            <td style="width: 8%; text-align: center;" class="px-6 py-4">
                <input ${empleadosSeleccionados.includes(empleado.id) ? 'checked' : ''} id="checkbox_empleado_${empleado.id}" onchange="seleccionarEmpleado(this)" type="checkbox" style="transform: scale(1.5);" name="empleado_id" value="${empleado.id}">
            </td>
            <td style="width: 10%; text-align: center;" class="px-6 py-4">
                ${empleado.foto_url
                    ? `<img class="h-10 w-10 rounded-full" src="/storage/${empleado.foto_url}" alt="${empleado.nombre}">`
                    : `<div class="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                        ${empleado.nombre.charAt(0)}${empleado.apellidos.charAt(0)}
                    </div>`
                }
            </td>
            <td class="px-6 py-4 text-center">${empleado.nombre} ${empleado.apellidos}</td>
            <td class="px-6 py-4 text-center">
                ${empleado.equipo ? `<span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 text-center">
                    <span class="font-bold mr-1">${empleado.equipo.nombre}</span>
                </span>` : `<div class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 text-center">
                    <span class="text-xs">Sin equipo</span>
                </div>`
                }
            </td>
            <td class="px-6 py-4 text-center">
                ${empleado.tipo_miembro == 'lider' ? `<span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 text-center">
                    <span class="font-bold mr-1">Líder</span>
                </span>` : empleado.tipo_miembro == 'miembro' ? `<span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 text-center">
                    <span class="font-bold mr-1">Miembro</span>
                </span>` : `<div class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 text-center">
                    <span class="text-xs">No tiene</span>
                </div>`
                }
            </td>
            <td class="px-6 py-4 text-center">
                ${empleado.cargo ? `<span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 text-center">
                    <span class="font-bold mr-1">${empleado.cargo}</span>
                </span>` : `<div class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 text-center">
                    <span class="text-xs">Sin cargo</span>
                </div>`
                }
            </td>
            <td class="px-6 py-4 text-center">
                ${empleado.email ? `<a href="mailto:${empleado.email}" class="text-blue-600 hover:underline">${empleado.email}</a>` : `<div class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 text-center">
                    <span class="text-xs">Sin email</span>
                </div>`
                }
            </td>
        </tr>
    `).join('');
}

var empleadosSeleccionados = [];
function seleccionarEmpleado(checkbox) {
    var value = parseInt(checkbox.value);
    if (checkbox.checked) {
        empleadosSeleccionados.push(value);
    } else {
        empleadosSeleccionados = empleadosSeleccionados.filter(id => id !== value);
    }

    document.getElementById('cantidadEmpleadosSeleccionados').innerHTML = empleadosSeleccionados.length;
}

function seleccionarTodosEmpleados(checkbox) {
    if (checkbox.checked) {
        empleadosPorArea.forEach(empleado => {
            document.getElementById(`checkbox_empleado_${empleado.id}`).checked = true;
            if (!empleadosSeleccionados.includes(empleado.id)) {
                empleadosSeleccionados.push(empleado.id);
            }
        });
    } else {
        empleadosPorArea.forEach(empleado => {
            document.getElementById(`checkbox_empleado_${empleado.id}`).checked = false;
        });
        empleadosSeleccionados = [];
    }

    document.getElementById('cantidadEmpleadosSeleccionados').innerHTML = empleadosSeleccionados.length;
}

async function agregarMiembrosAlEquipo() {
    if (empleadosSeleccionados.length == 0) {
        mostrarToast('No hay empleados seleccionados para agregar al equipo', 'error');
        return;
    }

    var result = await verificarSiHayEmpleadosSeleccionadosDeOtrosEquipos();
    if (result) {
        mostrarSwalCargando('Agregando miembros al equipo, por favor espere...');
        const response = await fetch(`/admin/agregar-miembros-equipo`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
            },
            body: JSON.stringify({
                id_equipo: equipoVistaActual.id,
                id_empleados: empleadosSeleccionados
            })
        });
        Swal.close();
        
        if (!response.ok) {
            mostrarToast("Error al agregar miembros al equipo", 'error');
            return;
        }

        const data = await response.json();
        if (data.type == 'success') {
            Swal.fire({
                title: data.message,
                icon: data.type,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false,
                timer: 1500,
            });

            setTimeout(() => {
                cerrarModalAgregarMiembro();
                empleadosSeleccionados = [];
                document.getElementById('cantidadEmpleadosSeleccionados').innerHTML = '0';
                document.getElementById('buscar_empleado').value = '';
                document.getElementById('checkbox_seleccionar_todos_empleados').checked = false;
                
                consultarNuevasEquipos();
                verEquipo(equipoVistaActual.id, 'miembros');
            }, 1500);
        } else {
            mostrarToast(data.message, data.type);
        }
    }
}

async function verificarSiHayEmpleadosSeleccionadosDeOtrosEquipos() {
    var empleadosSeleccionadosDeOtrosEquipos = [];
    var empleadosSeleccionadosLideresDeOtrosEquipos = [];
    empleadosSeleccionados.forEach(id_empleado => {
        var empleadoSeleccionado = empleadosPorArea.find(empleado => empleado.id == id_empleado);
        if (empleadoSeleccionado.equipo != null) {
            if (empleadoSeleccionado.equipo.id != equipoVistaActual.id) {
                empleadosSeleccionadosDeOtrosEquipos.push(empleadoSeleccionado);
            }

            if (empleadoSeleccionado.tipo_miembro == 'lider') {
                empleadosSeleccionadosLideresDeOtrosEquipos.push(empleadoSeleccionado);
            }
        }
    });

    if (empleadosSeleccionadosDeOtrosEquipos.length > 0) {
        var html = '<div class="danger-message"><div class="bg-yellow-100 border border-yellow-200 rounded-lg p-4 mb-4"><p class="text-yellow-700">Los siguientes empleados son <strong>miembros</strong> de otros equipos, al continuar, se transferiran a este equipo, siempre y cuando no tengan tareas pendientes.</p><br><ul>';
        empleadosSeleccionadosDeOtrosEquipos.forEach(empleado => {
            html += `<li style="margin-bottom: 10px;"><p class="text-yellow-700">${empleado.nombre} ${empleado.apellidos} - ${empleado.equipo.nombre}</p></li>`;
        });
        html += '</ul></div></div>';

        if (empleadosSeleccionadosLideresDeOtrosEquipos.length > 0) {
            html += '<div class="warning-message"><div class="bg-red-100 border border-red-200 rounded-lg p-4 mb-4"><p class="text-red-700">Los siguientes empleados son <strong>líderes</strong> de otros equipos, al continuar, se transferiran a este equipo y quedaran como <strong>miembros</strong>, siempre y cuando no tengan tareas pendientes.</p><br><ul>';
            if (empleadosSeleccionadosLideresDeOtrosEquipos.length > 0) {

                empleadosSeleccionadosLideresDeOtrosEquipos.forEach(empleado => {
                    html += `<li style="margin-bottom: 10px;"><p class="text-red-700">${empleado.nombre} ${empleado.apellidos} - ${empleado.equipo.nombre}</p></li>`;
                });
                html += '</ul></div></div>';
            }
        }


        var result = await Swal.fire({
            title: 'Información importante',
            html: html,
            showConfirmButton: true,
            confirmButtonText: 'Continuar',
            confirmButtonColor: '#28a745',
            allowOutsideClick: false,
            showCancelButton: true,
            cancelButtonText: 'Cancelar',
            cancelButtonColor: '#dc3545',
        });

        return result.isConfirmed ? true : false;
    }

    return true;
}

function verMiembrosEquipo(equipoId) {
    verEquipo(equipoId, 'miembros');
}

function eliminarMiembroEquipo(equipoId, miembroId, miembroNombre) {
    Swal.fire({
        title: '¿Estás seguro de querer eliminar a (' + miembroNombre + ') del equipo?',
        html: '<div class="danger-message"><div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4"><p class="text-red-500">Esta acción no se puede deshacer, se validara si el miembro tiene tareas pendientes antes de eliminarlo</p></div></div>',
        icon: 'warning',
        showConfirmButton: true,
        confirmButtonText: 'Si, Eliminar',
        confirmButtonColor: '#28a745',
        allowOutsideClick: false,
        showCancelButton: true,
        cancelButtonText: 'No, Cancelar',
        cancelButtonColor: '#dc3545',
    }).then((result) => {
        if (result.isConfirmed) {
            eliminarMiembro(miembroId, miembroNombre);
        }
    });
}

async function eliminarMiembro(miembroId, miembroNombre) {
    mostrarSwalCargando('Eliminando miembro del equipo, por favor espere...');
    const response = await fetch(`/admin/eliminar-miembro-equipo/${miembroId}`);
    Swal.close();
    if (!response.ok) {
        mostrarToast('Error al eliminar miembro del equipo', 'error');
        return;
    }
    const data = await response.json();
    if (data.type == 'success') {
        Swal.fire({
            title: data.message,
            icon: data.type,
            showConfirmButton: false,
            allowOutsideClick: false,
            allowEscapeKey: false,
            timer: 1500,
        });
        setTimeout(() => {
            consultarNuevasEquipos();
            verEquipo(equipoVistaActual.id, 'miembros');
        }, 1500);
    } else {
        mostrarToast(data.message, data.type);
    }
}