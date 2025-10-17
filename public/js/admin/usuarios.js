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
    tipo: '',
    area_id: '',
    equipo_id: '',
    rol: '',
    activo: 'true' // Por defecto mostrar solo activos
};
let selectedUsers = [];
let debounceTimer = null;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    cargarUsuarios();
    cargarAreas();
    cargarRoles();
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
            cargarUsuarios();
        }, 500);
    });

    // Filtros
    document.getElementById('filterArea').addEventListener('change', function(e) {
        currentFilters.area_id = e.target.value;
        currentPage = 1;
        cargarUsuarios();

        // Cargar equipos del área seleccionada
        if (e.target.value) {
            cargarEquipos(e.target.value);
        } else {
            document.getElementById('filterEquipo').innerHTML = '<option value="">Todos los equipos</option>';
        }
    });

    document.getElementById('filterEquipo').addEventListener('change', function(e) {
        currentFilters.equipo_id = e.target.value;
        currentPage = 1;
        cargarUsuarios();
    });

    document.getElementById('filterRol').addEventListener('change', function(e) {
        currentFilters.rol = e.target.value;
        currentPage = 1;
        cargarUsuarios();
    });

    // Items por página
    document.getElementById('perPageSelect').addEventListener('change', function(e) {
        currentPage = 1;
        cargarUsuarios();
    });

    // Seleccionar todos
    document.getElementById('selectAll').addEventListener('change', function(e) {
        const checkboxes = document.querySelectorAll('.user-checkbox');
        checkboxes.forEach(cb => {
            cb.checked = e.target.checked;
            if (e.target.checked) {
                if (!selectedUsers.includes(cb.value)) {
                    selectedUsers.push(cb.value);
                }
            } else {
                selectedUsers = [];
            }
        });
        actualizarBarraAccionesMasivas();
    });
}

// Cargar usuarios vía AJAX
async function cargarUsuarios() {
    try {
        mostrarCargadorEsqueleto();

        const perPage = document.getElementById('perPageSelect').value;
        const params = new URLSearchParams({
            page: currentPage,
            per_page: perPage,
            ...currentFilters
        });

        const response = await fetch(`/admin/usuarios?${params}`, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json'
            }
        });

        // Manejar sesión expirada o errores de autenticación
        await manejarRespuestaFetch(response);

        if (!response.ok) throw new Error('Error al cargar usuarios');

        const data = await response.json();
        renderizarUsuarios(data.data);
        renderizarPaginacion(data);
        actualizarIndicadorFiltros();

    } catch (error) {
        console.error('Error:', error);
        if (error.message !== 'Sesión expirada' && error.message !== 'No encontrado - Redirigiendo') {
            mostrarToast('Error al cargar usuarios', 'error');
        }
    }
}

// Renderizar usuarios en la tabla
function renderizarUsuarios(users) {
    const tbody = document.getElementById('usersTableBody');

    if (users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                    No se encontraron usuarios
                </td>
            </tr>
        `;
        return;
    }
    

    // Debug: verificar datos de fotos
    users.forEach(user => {
        if (user.foto_url) {
            console.log(`Usuario ${user.nombre}: foto_url = ${user.foto_url}`);
        }
    });

    tbody.innerHTML = users.map(user => `
        <tr class="hover:bg-gray-50 ${selectedUsers.includes(user.id.toString()) ? 'bg-blue-50' : ''}">
            <td class="px-6 py-4">
                <input type="checkbox" class="user-checkbox rounded border-gray-300"
                       value="${user.id}"
                       ${selectedUsers.includes(user.id.toString()) ? 'checked' : ''}
                       onchange="alternarSeleccionUsuario(${user.id})">
            </td>
            <td class="px-6 py-4">
                <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                        ${user.foto_url
                            ? `<img class="h-10 w-10 rounded-full" src="/storage/${user.foto_url}" alt="${user.nombre}">`
                            : `<div class="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                                ${user.nombre.charAt(0)}${user.apellidos.charAt(0)}
                               </div>`
                        }
                    </div>
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">${user.nombre} ${user.apellidos}</div>
                        <div class="text-sm text-gray-500">${user.email}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.tipo_usuario === 'interno'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                }">
                    ${user.tipo_usuario === 'interno' ? 'Funcionario' : 'Ciudadano'}
                </span>
            </td>
            <td class="px-6 py-4 text-sm text-gray-500">
                ${user.area ? `
                    <div>${user.area.nombre}</div>
                    ${user.equipo ? `<div class="text-xs text-gray-400">${user.equipo.nombre}</div>` : ''}
                ` : '-'}
            </td>
            <td class="px-6 py-4">
                <div class="flex flex-wrap gap-1">
                    ${user.roles.slice(0, 2).map(role => `
                        <span class="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                            ${role.name}
                        </span>
                    `).join('')}
                    ${user.roles.length > 2 ? `
                        <span class="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600" title="${user.roles.slice(2).map(r => r.name).join(', ')}">
                            +${user.roles.length - 2}
                        </span>
                    ` : ''}
                </div>
            </td>
            <td class="px-6 py-4">
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" class="sr-only peer" ${user.activo ? 'checked' : ''}
                           onchange="alternarEstadoUsuario(${user.id}, this.checked)">
                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
            </td>
            <td class="px-6 py-4 text-sm font-medium">
                <div class="relative inline-block text-left" x-data="{ open: false }">
                    <button @click="open = !open" class="text-gray-400 hover:text-gray-600">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path>
                        </svg>
                    </button>
                    <div x-show="open" @click.away="open = false" class="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                        <div class="py-1">
                            <a href="#" onclick="verUsuario(${user.id}); return false;" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Ver Detalle</a>
                            <a href="#" onclick="editarUsuario(${user.id}); return false;" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Editar</a>
                            <a href="#" onclick="gestionarRoles(${user.id}); return false;" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Gestionar Roles</a>
                            <a href="#" onclick="restablecerPassword(${user.id}); return false;" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Restablecer Contraseña</a>
                            <a href="#" onclick="verActividad(${user.id}); return false;" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Ver Actividad</a>
                            <a href="#" onclick="eliminarUsuario(${user.id}); return false;" class="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100">Eliminar</a>
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
    document.getElementById('totalUsers').textContent = data.total || 0;

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
    cargarUsuarios();
}

// Mostrar skeleton loader
function mostrarCargadorEsqueleto() {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = `
        <tr class="skeleton-row">
            <td colspan="7" class="px-6 py-4">
                <div class="animate-pulse space-y-4">
                    ${[1, 2, 3, 4, 5].map(() => `
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

// Cargar áreas
async function cargarAreas() {
    try {
        const response = await fetch('/admin/api/areas');
        const areas = await response.json();

        const select = document.getElementById('filterArea');
        select.innerHTML = '<option value="">Todas las áreas</option>' +
            areas.map(area => `<option value="${area.id}">${area.nombre}</option>`).join('');
    } catch (error) {
        console.error('Error loading areas:', error);
    }
}

// Cargar equipos por área
async function cargarEquipos(areaId) {
    try {
        const response = await fetch(`/admin/api/equipos?area_id=${areaId}`);
        const equipos = await response.json();

        const select = document.getElementById('filterEquipo');
        select.innerHTML = '<option value="">Todos los equipos</option>' +
            equipos.map(equipo => `<option value="${equipo.id}">${equipo.nombre}</option>`).join('');
    } catch (error) {
        console.error('Error loading equipos:', error);
    }
}

// Cargar roles
async function cargarRoles() {
    try {
        const response = await fetch('/admin/api/roles');
        const roles = await response.json();

        const select = document.getElementById('filterRol');
        select.innerHTML = '<option value="">Todos los roles</option>' +
            roles.map(role => `<option value="${role.name}">${role.name}</option>`).join('');
    } catch (error) {
        console.error('Error loading roles:', error);
    }
}

// Filtrar por tab
function filtrarPorTab(tab) {
    // Actualizar UI de tabs
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('border-blue-600', 'text-blue-600');
        btn.classList.add('border-transparent', 'text-gray-500');
    });
    event.target.classList.add('border-blue-600', 'text-blue-600', 'active');
    event.target.classList.remove('border-transparent', 'text-gray-500');

    // Aplicar filtro
    if (tab === 'todos') {
        currentFilters.tipo = '';
        currentFilters.activo = 'true'; // Mostrar solo activos
    } else if (tab === 'interno' || tab === 'externo') {
        currentFilters.tipo = tab;
        currentFilters.activo = 'true'; // Mostrar solo activos
    } else if (tab === 'inactivos') {
        currentFilters.tipo = '';
        currentFilters.activo = '0'; // Mostrar solo inactivos
    }

    currentPage = 1;
    cargarUsuarios();
}

// Limpiar filtros
function limpiarFiltros() {
    currentFilters = {
        search: '',
        tipo: '',
        area_id: '',
        equipo_id: '',
        rol: '',
        activo: 'true' // Mantener el filtro de activos al limpiar
    };

    document.getElementById('searchInput').value = '';
    document.getElementById('filterArea').value = '';
    document.getElementById('filterEquipo').value = '';
    document.getElementById('filterRol').value = '';

    currentPage = 1;
    cargarUsuarios();
}

// Actualizar badge de filtros
function actualizarIndicadorFiltros() {
    let count = 0;
    if (currentFilters.search) count++;
    if (currentFilters.area_id) count++;
    if (currentFilters.equipo_id) count++;
    if (currentFilters.rol) count++;

    const badge = document.getElementById('filterBadge');
    const countEl = document.getElementById('filterCount');

    if (count > 0) {
        badge.classList.remove('hidden');
        countEl.textContent = count;
    } else {
        badge.classList.add('hidden');
    }
}

// Toggle selección de usuario
function alternarSeleccionUsuario(userId) {
    const index = selectedUsers.indexOf(userId.toString());
    if (index > -1) {
        selectedUsers.splice(index, 1);
    } else {
        selectedUsers.push(userId.toString());
    }
    actualizarBarraAccionesMasivas();
}

// Actualizar barra de acciones múltiples
function actualizarBarraAccionesMasivas() {
    const bar = document.getElementById('bulkActionBar');
    const count = document.getElementById('selectedCount');

    if (selectedUsers.length > 0) {
        bar.classList.remove('hidden');
        count.textContent = `${selectedUsers.length} usuario${selectedUsers.length > 1 ? 's' : ''}`;
    } else {
        bar.classList.add('hidden');
    }
}

// Limpiar selección
function limpiarSeleccion() {
    selectedUsers = [];
    document.querySelectorAll('.user-checkbox').forEach(cb => cb.checked = false);
    document.getElementById('selectAll').checked = false;
    actualizarBarraAccionesMasivas();
}

// Mostrar toast
function mostrarToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white ${
        type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } z-50`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// ========================================
// MODAL DE CREACIÓN/EDICIÓN DE USUARIOS
// ========================================

let currentTab = 1;
let formChanged = false;
let selectedPhoto = null;
let availableRoles = [];
let availableAreas = [];
let availableEquipos = [];

// Abrir modal de creación
function abrirModalCrear() {
    document.getElementById('modalTitle').textContent = 'Crear Nuevo Usuario';
    document.getElementById('userForm').reset();
    document.getElementById('userModal').classList.remove('hidden');
    currentTab = 1;
    formChanged = false;
    selectedPhoto = null;

    // Resetear preview de foto
    document.getElementById('photoPreview').innerHTML = `
        <svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
        </svg>
    `;

    // Cargar datos necesarios
    cargarAreasForModal();
    cargarRolesForModal();

    // Mostrar tab 1
    mostrarTab(1);

    // Limpiar errores
    limpiarTodosLosErrores();

    // Listener para detectar cambios en el formulario
    document.getElementById('userForm').addEventListener('input', function() {
        formChanged = true;
    });
}

// Cerrar modal con confirmación
function cerrarModalConConfirmacion() {
    if (formChanged) {
        const confirmDialog = document.createElement('div');
        confirmDialog.innerHTML = `
            <div class="confirmation-overlay" id="confirmOverlay"></div>
            <div class="confirmation-dialog">
                <h3 class="text-lg font-semibold text-gray-900 mb-2">¿Descartar cambios?</h3>
                <p class="text-gray-600 mb-6">Hay cambios sin guardar. ¿Estás seguro de que deseas salir?</p>
                <div class="flex gap-3 justify-end">
                    <button onclick="cancelarCierre()" class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                        Continuar Editando
                    </button>
                    <button onclick="confirmarCierre()" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                        Descartar
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(confirmDialog);
    } else {
        cerrarModal();
    }
}

function cancelarCierre() {
    document.querySelector('.confirmation-overlay').parentElement.remove();
}

function confirmarCierre() {
    document.querySelector('.confirmation-overlay').parentElement.remove();
    cerrarModal();
}

function cerrarModal() {
    document.getElementById('userModal').classList.add('hidden');
    formChanged = false;
    currentTab = 1;
}

// Navegación entre tabs
function mostrarTab(tabNumber) {
    // Ocultar todos los tabs
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    document.querySelectorAll('.step-indicator').forEach(indicator => {
        indicator.classList.remove('active', 'completed');
    });

    // Mostrar tab actual
    document.getElementById(`tab${tabNumber}`).classList.remove('hidden');
    document.querySelector(`[data-step="${tabNumber}"]`).classList.add('active');

    // Marcar steps anteriores como completados
    for (let i = 1; i < tabNumber; i++) {
        document.querySelector(`[data-step="${i}"]`).classList.add('completed');
    }

    // Botones de navegación
    const prevButton = document.getElementById('prevButton');
    const nextButton = document.getElementById('nextButton');
    const submitButton = document.getElementById('submitButton');

    if (tabNumber === 1) {
        prevButton.classList.add('hidden');
        nextButton.classList.remove('hidden');
        submitButton.classList.add('hidden');
    } else if (tabNumber === 3) {
        prevButton.classList.remove('hidden');
        nextButton.classList.add('hidden');
        submitButton.classList.remove('hidden');
    } else {
        prevButton.classList.remove('hidden');
        nextButton.classList.remove('hidden');
        submitButton.classList.add('hidden');
    }

    currentTab = tabNumber;
}

function siguienteTab() {
    if (validarTabActual()) {
        mostrarTab(currentTab + 1);
    }
}

function anteriorTab() {
    mostrarTab(currentTab - 1);
}

// Validación de tab actual
function validarTabActual() {
    limpiarTodosLosErrores();
    let isValid = true;

    if (currentTab === 1) {
        // Validar Información Personal
        const tipoDoc = document.getElementById('tipo_documento').value;
        const cedula = document.getElementById('cedula').value;
        const nombre = document.getElementById('nombre').value;
        const apellidos = document.getElementById('apellidos').value;
        const email = document.getElementById('email').value;

        if (!tipoDoc) {
            mostrarError('tipo_documento', 'Debe seleccionar un tipo de documento');
            isValid = false;
        }

        if (!cedula) {
            mostrarError('cedula', 'El número de documento es obligatorio');
            isValid = false;
        }

        if (!nombre) {
            mostrarError('nombre', 'El nombre es obligatorio');
            isValid = false;
        }

        if (!apellidos) {
            mostrarError('apellidos', 'Los apellidos son obligatorios');
            isValid = false;
        }

        if (!email) {
            mostrarError('email', 'El email es obligatorio');
            isValid = false;
        } else if (!esEmailValido(email)) {
            mostrarError('email', 'El formato del email no es válido');
            isValid = false;
        }
    } else if (currentTab === 2) {
        // Validar Información Laboral
        const tipoUsuario = document.querySelector('input[name="tipo_usuario"]:checked').value;

        if (tipoUsuario === 'interno') {
            const areaId = document.getElementById('area_id').value;
            const equipoId = document.getElementById('equipo_id').value;
            const cargo = document.getElementById('cargo').value;

            if (!areaId) {
                mostrarError('area_id', 'Debe seleccionar un área');
                isValid = false;
            }

            if (!equipoId) {
                mostrarError('equipo_id', 'Debe seleccionar un equipo');
                isValid = false;
            }

            if (!cargo) {
                mostrarError('cargo', 'El cargo es obligatorio');
                isValid = false;
            }
        }
    }

    return isValid;
}

// Funciones de validación
function esEmailValido(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
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

function limpiarTodosLosErrores() {
    document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('.error-message').forEach(el => {
        el.classList.add('hidden');
        el.textContent = '';
    });
}

// Toggle tipo de usuario (Funcionario/Ciudadano)
function alternarTipoUsuario() {
    const tipoUsuario = document.querySelector('input[name="tipo_usuario"]:checked').value;
    const funcionarioFields = document.getElementById('funcionarioFields');
    const ciudadanoMessage = document.getElementById('ciudadanoMessage');

    if (tipoUsuario === 'interno') {
        funcionarioFields.classList.remove('hidden');
        ciudadanoMessage.classList.add('hidden');

        // Hacer campos obligatorios
        document.getElementById('area_id').required = true;
        document.getElementById('equipo_id').required = true;
        document.getElementById('cargo').required = true;
    } else {
        funcionarioFields.classList.add('hidden');
        ciudadanoMessage.classList.remove('hidden');

        // Quitar obligatoriedad
        document.getElementById('area_id').required = false;
        document.getElementById('equipo_id').required = false;
        document.getElementById('cargo').required = false;

        // Limpiar valores
        document.getElementById('area_id').value = '';
        document.getElementById('equipo_id').value = '';
        document.getElementById('cargo').value = '';
    }

    // Recargar roles según tipo de usuario
    cargarRolesForModal();
}

// Cargar áreas para el modal
async function cargarAreasForModal() {
    try {
        const response = await fetch('/admin/api/areas');
        const areas = await response.json();
        availableAreas = areas;

        const select = document.getElementById('area_id');
        select.innerHTML = '<option value="">Seleccione un área...</option>' +
            areas.map(area => `<option value="${area.id}">${area.nombre}</option>`).join('');
    } catch (error) {
        console.error('Error loading areas:', error);
        mostrarToast('Error al cargar áreas', 'error');
    }
}

// Cargar equipos por área
async function cargarEquiposByArea() {
    const areaId = document.getElementById('area_id').value;
    const equipoSelect = document.getElementById('equipo_id');

    if (!areaId) {
        equipoSelect.disabled = true;
        equipoSelect.innerHTML = '<option value="">Primero seleccione un área...</option>';
        document.getElementById('areaEquipoPreview').classList.add('hidden');
        return;
    }

    try {
        equipoSelect.disabled = true;
        equipoSelect.innerHTML = '<option value="">Cargando...</option>';

        const response = await fetch(`/admin/api/equipos?area_id=${areaId}`);
        const equipos = await response.json();
        availableEquipos = equipos;

        equipoSelect.disabled = false;
        equipoSelect.innerHTML = '<option value="">Seleccione un equipo...</option>' +
            equipos.map(equipo => `<option value="${equipo.id}">${equipo.nombre}</option>`).join('');

        // Mostrar información del área
        const area = availableAreas.find(a => a.id == areaId);
        if (area) {
            document.getElementById('previewCoordinador').textContent = area.coordinador_nombre || 'No asignado';
        }

    } catch (error) {
        console.error('Error loading equipos:', error);
        mostrarToast('Error al cargar equipos', 'error');
        equipoSelect.disabled = false;
        equipoSelect.innerHTML = '<option value="">Error al cargar equipos</option>';
    }
}

// ========================================
// EDITAR USUARIO
// ========================================

let editingUserId = null;
let originalUserData = null;
let userMetadata = null;

async function editarUsuario(id) {
    editingUserId = id;
    document.getElementById('modalTitle').textContent = 'Editar Usuario';
    document.getElementById('userModal').classList.remove('hidden');
    currentTab = 1;
    formChanged = false;

    // Mostrar skeleton loaders
    mostrarCargadorEsqueletos();

    // Cargar datos del usuario
    try {
        const response = await fetch(`/admin/usuarios/${id}`);
        if (!response.ok) throw new Error('Error al cargar usuario');

        const data = await response.json();
        originalUserData = JSON.parse(JSON.stringify(data.user)); // Deep clone
        userMetadata = data.metadata;

        // Actualizar título con nombre del usuario
        document.getElementById('modalTitle').textContent = `Editar Usuario: ${data.user.nombre} ${data.user.apellidos}`;

        // Llenar formulario con datos
        await llenarFormularioConDatosUsuario(data.user);

        // Deshabilitar campo de cédula (no se puede cambiar)
        document.getElementById('cedula').disabled = true;
        document.getElementById('cedula').classList.add('bg-gray-100', 'cursor-not-allowed');

        // Mostrar advertencias si es coordinador o líder
        mostrarAdvertenciasRol();

        // Cambiar el evento del formulario a PUT
        const form = document.getElementById('userForm');
        form.removeEventListener('submit', manejarEnvioFormulario);
        form.addEventListener('submit', manejarEnvioFormularioEditar);

        // Cambiar texto del botón
        document.getElementById('submitButton').textContent = 'Guardar Cambios';

        mostrarTab(1);
        limpiarTodosLosErrores();

    } catch (error) {
        console.error('Error:', error);
        mostrarToast('Error al cargar datos del usuario', 'error');
        cerrarModal();
    }
}

function mostrarCargadorEsqueletos() {
    // Mostrar loaders en lugar del contenido
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        const originalContent = tab.innerHTML;
        tab.dataset.originalContent = originalContent;
        tab.innerHTML = `
            <div class="space-y-4">
                ${[1, 2, 3, 4].map(() => `
                    <div class="animate-pulse">
                        <div class="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                        <div class="h-10 bg-gray-200 rounded w-full"></div>
                    </div>
                `).join('')}
            </div>
        `;
    });
}

async function llenarFormularioConDatosUsuario(user) {
    // Restaurar contenido original de los tabs
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        if (tab.dataset.originalContent) {
            tab.innerHTML = tab.dataset.originalContent;
            delete tab.dataset.originalContent;
        }
    });

    // Información Personal
    document.getElementById('tipo_documento').value = user.tipo_documento || '';
    document.getElementById('cedula').value = user.cedula || '';
    document.getElementById('nombre').value = user.nombre || '';
    document.getElementById('apellidos').value = user.apellidos || '';
    document.getElementById('email').value = user.email || '';
    document.getElementById('telefono').value = user.telefono || '';
    document.getElementById('celular').value = user.celular || '';
    document.getElementById('direccion').value = user.direccion || '';

    // Mostrar foto actual si existe
    if (user.foto_url) {
        document.getElementById('photoPreview').innerHTML = `
            <img src="/storage/${user.foto_url}" alt="Foto actual" class="w-full h-full object-cover">
        `;
    }else{
        document.getElementById('photoPreview').innerHTML = `
        <svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
        </svg>
    `;
    }

    // Información Laboral
    const tipoUsuarioRadio = document.querySelector(`input[name="tipo_usuario"][value="${user.tipo_usuario}"]`);
    if (tipoUsuarioRadio) {
        tipoUsuarioRadio.checked = true;
        alternarTipoUsuario();
    }

    // Cargar áreas y equipos
    await cargarAreasForModal();

    if (user.tipo_usuario === 'interno') {
        if (user.area_id) {
            document.getElementById('area_id').value = user.area_id;
            await cargarEquiposByArea();

            if (user.equipo_id) {
                document.getElementById('equipo_id').value = user.equipo_id;
            }
        }

        document.getElementById('cargo').value = user.cargo || '';
    }

    // Cargar y seleccionar roles
    await cargarRolesForModal();

    // Esperar un momento para que se rendericen los checkboxes
    setTimeout(() => {
        user.roles.forEach(role => {
            const checkbox = document.querySelector(`input[name="roles[]"][value="${role.name}"]`);
            if (checkbox) {
                checkbox.checked = true;
            }
        });
        actualizarVistaRol();
    }, 100);

    // Estado activo
    document.getElementById('activo').checked = user.activo;

    // No mostrar campos de contraseña en edición (opcional cambiarla después)
    document.getElementById('password').required = false;
    document.getElementById('password_confirmation').required = false;
    document.getElementById('password').placeholder = 'Dejar en blanco para mantener la actual';
    document.getElementById('password_confirmation').placeholder = 'Solo si cambia la contraseña';
}

function mostrarAdvertenciasRol() {
    // Remover advertencias anteriores
    const existingWarnings = document.querySelectorAll('.role-warning');
    existingWarnings.forEach(w => w.remove());

    if (!userMetadata) return;

    // Advertencia si es coordinador
    if (userMetadata.es_coordinador && userMetadata.area_coordinada) {
        const warning = document.createElement('div');
        warning.className = 'role-warning bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4';
        warning.innerHTML = `
            <div class="flex">
                <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                    </svg>
                </div>
                <div class="ml-3">
                    <p class="text-sm text-yellow-700">
                        <strong>Advertencia:</strong> Este usuario es Coordinador del área <strong>${userMetadata.area_coordinada.nombre}</strong>.
                        Si cambia el área, será removido automáticamente como coordinador.
                    </p>
                </div>
            </div>
        `;
        document.getElementById('tab2').insertBefore(warning, document.getElementById('tab2').firstChild);
    }

    // Advertencia si es líder
    if (userMetadata.es_lider && userMetadata.equipo_liderado) {
        const warning = document.createElement('div');
        warning.className = 'role-warning bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4';
        warning.innerHTML = `
            <div class="flex">
                <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                    </svg>
                </div>
                <div class="ml-3">
                    <p class="text-sm text-yellow-700">
                        <strong>Advertencia:</strong> Este usuario es Líder del equipo <strong>${userMetadata.equipo_liderado.nombre}</strong>.
                        Si cambia el equipo, será removido automáticamente como líder.
                    </p>
                </div>
            </div>
        `;
        document.getElementById('tab2').insertBefore(warning, document.getElementById('tab2').firstChild);
    }

    // Advertencia si tiene tareas activas
    if (userMetadata.tareas_activas > 0) {
        const warning = document.createElement('div');
        warning.className = 'role-warning bg-blue-50 border-l-4 border-blue-400 p-4 mb-4';
        warning.innerHTML = `
            <div class="flex">
                <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
                    </svg>
                </div>
                <div class="ml-3">
                    <p class="text-sm text-blue-700">
                        Este usuario tiene <strong>${userMetadata.tareas_activas} tareas activas</strong>.
                        Si cambia el área o equipo, deberá proporcionar un motivo.
                    </p>
                </div>
            </div>
        `;
        document.getElementById('tab2').insertBefore(warning, document.getElementById('tab2').firstChild);
    }
}

// ========================================
// MODAL VER DETALLE DE USUARIO
// ========================================

let idUsuarioVistaActual = null;
let tabVistaActual = 'personal';
let datosDetalleUsuario = null;

async function verUsuario(id) {
    idUsuarioVistaActual = id;
    tabVistaActual = 'personal';
    
    // Abrir modal
    const modal = document.getElementById('viewUserModal');
    if (!modal) {
        console.error('Modal viewUserModal no encontrado en el DOM');
        mostrarToast('Error: Modal no encontrado', 'error');
        return;
    }
    
    modal.classList.remove('hidden');
    
    // Esperar un momento para que el modal se renderice completamente
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Mostrar loader
    mostrarCargadorVista();
    
    try {
        // Cargar datos del usuario
        const response = await fetch(`/admin/usuarios/${id}/detalle`);
        
        // Manejar sesión expirada
        await manejarRespuestaFetch(response);
        
        if (!response.ok) throw new Error('Error al cargar detalles del usuario');
        
        const data = await response.json();
        datosDetalleUsuario = data;
        
        console.log('Datos del usuario cargados:', data);
        
        // Llenar información del modal
        llenarModalDetalleUsuario(data);
        
        // Mostrar primer tab
        cambiarTabVista('personal');
        
    } catch (error) {
        console.error('Error al cargar usuario:', error);
        if (error.message !== 'Sesión expirada' && error.message !== 'No encontrado - Redirigiendo') {
            mostrarToast('Error al cargar detalles del usuario', 'error');
        }
        cerrarModalVerUsuario();
    }
}

function mostrarCargadorVista() {
    // Solo mostrar loader en el tab activo (Personal)
    const personalTab = document.getElementById('viewTabPersonal');
    if (personalTab) {
        // Guardar el HTML original si no existe
        if (!personalTab.dataset.originalHtml) {
            personalTab.dataset.originalHtml = personalTab.innerHTML;
        }
        
        personalTab.innerHTML = `
            <div class="flex items-center justify-center py-12">
                <div class="animate-pulse space-y-4 w-full max-w-2xl">
                    <div class="flex items-center space-x-4">
                        <div class="rounded-full bg-gray-200 h-40 w-40"></div>
                        <div class="flex-1 space-y-3">
                            <div class="h-6 bg-gray-200 rounded w-3/4"></div>
                            <div class="h-4 bg-gray-200 rounded w-1/2"></div>
                            <div class="h-4 bg-gray-200 rounded w-2/3"></div>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4 mt-6">
                        ${[1, 2, 3, 4, 5, 6].map(() => `
                            <div class="h-20 bg-gray-200 rounded"></div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }
}

function llenarModalDetalleUsuario(data) {
    const usuario = data.user;
    
    console.log('Llenando modal con datos de usuario:', usuario.nombre_completo);
    
    // Restaurar HTML original del tab Personal si fue modificado por el loader
    const tabPersonal = document.getElementById('viewTabPersonal');
    if (tabPersonal && tabPersonal.dataset.originalHtml) {
        tabPersonal.innerHTML = tabPersonal.dataset.originalHtml;
        delete tabPersonal.dataset.originalHtml;
    }
    
    // Verificar elementos críticos
    const elementosCriticos = [
        'viewUserPhoto', 'viewUserName', 'viewUserEmail', 'viewUserStatus',
        'viewUserTipoDoc', 'viewUserCedula', 'viewUserTelefono'
    ];
    
    elementosCriticos.forEach(elementId => {
        const element = document.getElementById(elementId);
        if (!element) {
            console.warn(`Elemento ${elementId} no encontrado en el DOM`);
        }
    });
    
    // Foto
    const divFoto = document.getElementById('viewUserPhoto');
    if (divFoto) {
        if (usuario.foto_url) {
            divFoto.innerHTML = `<img src="/storage/${usuario.foto_url}" alt="${usuario.nombre_completo}" class="w-full h-full object-cover rounded-full">`;
        } else {
            const iniciales = usuario.nombre.charAt(0) + usuario.apellidos.charAt(0);
            divFoto.innerHTML = `
                <div class="w-full h-full rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-4xl">
                    ${iniciales}
                </div>
            `;
        }
    }
    
    // Nombre y email
    const elementoNombre = document.getElementById('viewUserName');
    const elementoEmail = document.getElementById('viewUserEmail');
    
    if (elementoNombre) elementoNombre.textContent = usuario.nombre_completo;
    if (elementoEmail) elementoEmail.textContent = usuario.email;
    
    // Estado
    const divEstado = document.getElementById('viewUserStatus');
    if (divEstado) {
        if (usuario.activo) {
            divEstado.innerHTML = '<span class="px-3 py-1 text-sm rounded-full bg-green-100 text-green-800 font-semibold">Activo</span>';
        } else {
            divEstado.innerHTML = '<span class="px-3 py-1 text-sm rounded-full bg-red-100 text-red-800 font-semibold">Inactivo</span>';
        }
    }
    
    // Información personal detallada
    const elementoTipoDoc = document.getElementById('viewUserTipoDoc');
    const elementoCedula = document.getElementById('viewUserCedula');
    const elementoTelefono = document.getElementById('viewUserTelefono');
    const elementoDireccion = document.getElementById('viewUserDireccion');
    const elementoFechaRegistro = document.getElementById('viewUserFechaRegistro');
    const elementoUltimoAcceso = document.getElementById('viewUserUltimoAcceso');
    
    if (elementoTipoDoc) elementoTipoDoc.textContent = usuario.tipo_documento || '-';
    if (elementoCedula) elementoCedula.textContent = usuario.cedula || '-';
    
    const enlaceEmail = document.querySelector('#viewUserEmailDetalle a');
    if (enlaceEmail) {
        enlaceEmail.textContent = usuario.email;
        enlaceEmail.href = `mailto:${usuario.email}`;
    }
    
    if (elementoTelefono) elementoTelefono.textContent = usuario.telefono || '-';
    
    const elementoCelular = document.getElementById('viewUserCelular');
    if (elementoCelular) {
        if (usuario.celular) {
            elementoCelular.innerHTML = `<a href="tel:${usuario.celular}" class="text-blue-600 hover:underline">${usuario.celular}</a>`;
        } else {
            elementoCelular.textContent = '-';
        }
    }
    
    if (elementoDireccion) elementoDireccion.textContent = usuario.direccion || '-';
    if (elementoFechaRegistro) elementoFechaRegistro.textContent = usuario.fecha_registro;
    if (elementoUltimoAcceso) elementoUltimoAcceso.textContent = usuario.ultimo_acceso;
    
    // Información laboral
    const infoLaboral = data.info_laboral;
    const laboralFuncionarioDiv = document.getElementById('viewLaboralFuncionario');
    const laboralCiudadanoDiv = document.getElementById('viewLaboralCiudadano');
    
    if (infoLaboral.es_ciudadano) {
        if (laboralFuncionarioDiv) laboralFuncionarioDiv.classList.add('hidden');
        if (laboralCiudadanoDiv) laboralCiudadanoDiv.classList.remove('hidden');
        
        const solicitudesElement = document.getElementById('viewLaboralSolicitudes');
        if (solicitudesElement) {
            solicitudesElement.textContent = infoLaboral.solicitudes_realizadas;
        }
    } else {
        if (laboralFuncionarioDiv) laboralFuncionarioDiv.classList.remove('hidden');
        if (laboralCiudadanoDiv) laboralCiudadanoDiv.classList.add('hidden');
        
        const areaElement = document.getElementById('viewLaboralArea');
        const coordinadorElement = document.getElementById('viewLaboralCoordinador');
        const equipoElement = document.getElementById('viewLaboralEquipo');
        const liderElement = document.getElementById('viewLaboralLider');
        const cargoElement = document.getElementById('viewLaboralCargo');
        const fechaIngresoElement = document.getElementById('viewLaboralFechaIngreso');
        const tiempoElement = document.getElementById('viewLaboralTiempo');
        
        if (areaElement) areaElement.textContent = infoLaboral.area.nombre;
        if (coordinadorElement) {
            coordinadorElement.textContent = infoLaboral.area.coordinador ? infoLaboral.area.coordinador.nombre : 'No asignado';
        }
        
        if (infoLaboral.equipo) {
            if (equipoElement) equipoElement.textContent = infoLaboral.equipo.nombre;
            if (liderElement) {
                liderElement.textContent = infoLaboral.equipo.lider ? infoLaboral.equipo.lider.nombre : 'No asignado';
            }
        } else {
            if (equipoElement) equipoElement.textContent = 'No asignado';
            if (liderElement) liderElement.textContent = '-';
        }
        
        if (cargoElement) cargoElement.textContent = infoLaboral.cargo || '-';
        if (fechaIngresoElement) fechaIngresoElement.textContent = `Desde: ${infoLaboral.fecha_ingreso}`;
        if (tiempoElement) tiempoElement.textContent = infoLaboral.tiempo_organizacion;
    }
    
    // Roles y permisos
    llenarRolesYPermisos(data);
    
    // Estadísticas
    llenarEstadisticas(data.estadisticas, data.metadata);
}

function llenarRolesYPermisos(data) {
    const contenedorRoles = document.getElementById('viewRolesList');
    const contenedorPermisos = document.getElementById('viewPermisosList');
    
    // Roles
    if (contenedorRoles) {
        if (data.roles_detalle && data.roles_detalle.length > 0) {
            contenedorRoles.innerHTML = data.roles_detalle.map(rol => `
                <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div class="flex items-center justify-between mb-2">
                        <h5 class="font-semibold text-purple-900">${rol.nombre}</h5>
                        <button onclick="removerRolUsuario('${rol.nombre}')" class="text-red-600 hover:text-red-800 text-sm">
                            Remover
                        </button>
                    </div>
                    <p class="text-sm text-gray-600">${rol.descripcion}</p>
                    <p class="text-xs text-gray-500 mt-2">Asignado: ${rol.fecha_asignacion}</p>
                </div>
            `).join('');
        } else {
            contenedorRoles.innerHTML = '<p class="text-gray-500">No tiene roles asignados</p>';
        }
    }
    
    // Permisos agrupados por módulo
    if (contenedorPermisos) {
        const permisosEfectivos = data.permisos_efectivos || {};
        if (Object.keys(permisosEfectivos).length > 0) {
            contenedorPermisos.innerHTML = Object.entries(permisosEfectivos).map(([modulo, permisos]) => `
                <div class="bg-white border border-gray-200 rounded-lg p-4">
                    <h5 class="font-semibold text-gray-900 mb-2 capitalize">${modulo}</h5>
                    <div class="flex flex-wrap gap-2">
                        ${permisos.map(permiso => `
                            <span class="px-2 py-1 text-xs rounded-full bg-blue-50 text-blue-700 border border-blue-200" title="Del rol: ${permiso.rol_origen}">
                                ${permiso.nombre}
                            </span>
                        `).join('')}
                    </div>
                </div>
            `).join('');
        } else {
            contenedorPermisos.innerHTML = '<p class="text-gray-500">No tiene permisos asignados</p>';
        }
    }
}

function llenarEstadisticas(estadisticas, metadata) {
    const elementoTareasMes = document.getElementById('viewStatTareasMes');
    const elementoTareasTotal = document.getElementById('viewStatTareasTotal');
    const elementoDocumentos = document.getElementById('viewStatDocumentos');
    const elementoUltimoAcceso = document.getElementById('viewStatUltimoAcceso');
    const elementoLiderazgo = document.getElementById('viewStatLiderazgo');
    
    if (elementoTareasMes) elementoTareasMes.textContent = estadisticas.tareas_completadas_mes || 0;
    if (elementoTareasTotal) elementoTareasTotal.textContent = estadisticas.tareas_completadas_total || 0;
    if (elementoDocumentos) elementoDocumentos.textContent = estadisticas.documentos_firmados || 0;
    if (elementoUltimoAcceso) elementoUltimoAcceso.textContent = estadisticas.dias_ultimo_acceso || 0;
    
    // Mostrar sección de liderazgo si aplica
    if (elementoLiderazgo) {
        if (estadisticas.es_lider_coordinador) {
            elementoLiderazgo.classList.remove('hidden');
        } else {
            elementoLiderazgo.classList.add('hidden');
        }
    }
}

function cambiarTabVista(nombreTab) {
    tabVistaActual = nombreTab;
    
    // Actualizar UI de tabs
    document.querySelectorAll('.view-tab-button').forEach(btn => {
        btn.classList.remove('border-blue-600', 'text-blue-600');
        btn.classList.add('border-transparent', 'text-gray-500');
    });
    
    const botonActivo = document.querySelector(`[onclick="cambiarTabVista('${nombreTab}')"]`);
    if (botonActivo) {
        botonActivo.classList.add('border-blue-600', 'text-blue-600');
        botonActivo.classList.remove('border-transparent', 'text-gray-500');
    }
    
    // Ocultar todos los contenidos
    document.querySelectorAll('.view-tab-content').forEach(contenido => {
        contenido.classList.add('hidden');
    });
    
    // Mostrar contenido activo
    const contenidoActivo = document.getElementById(`viewTab${nombreTab.charAt(0).toUpperCase() + nombreTab.slice(1)}`);
    if (contenidoActivo) {
        contenidoActivo.classList.remove('hidden');
    }
    
    // Cargar datos específicos del tab si es necesario
    if (nombreTab === 'actividad') {
        cargarActividadUsuario();
    }
}

async function cargarActividadUsuario() {
    const contenedor = document.getElementById('viewActividadList');
    
    if (!contenedor) {
        console.warn('Contenedor viewActividadList no encontrado');
        return;
    }
    
    // Mostrar loader
    contenedor.innerHTML = `
        <div class="animate-pulse space-y-4">
            ${[1, 2, 3].map(() => `
                <div class="flex gap-4">
                    <div class="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div class="flex-1 space-y-2">
                        <div class="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div class="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    try {
        const response = await fetch(`/admin/usuarios/${idUsuarioVistaActual}/actividad`);
        
        // Manejar sesión expirada
        await manejarRespuestaFetch(response);
        
        if (!response.ok) throw new Error('Error al cargar actividad');
        
        const data = await response.json();
        
        if (data.actividades && data.actividades.length > 0) {
            contenedor.innerHTML = `
                <div class="relative border-l-2 border-gray-200 ml-4">
                    ${data.actividades.map((actividad, indice) => `
                        <div class="mb-6 ml-6">
                            <div class="absolute w-8 h-8 bg-blue-100 rounded-full -left-4 flex items-center justify-center">
                                ${obtenerIconoActividad(actividad.tipo)}
                            </div>
                            <div class="bg-white border border-gray-200 rounded-lg p-4">
                                <div class="flex items-center justify-between mb-1">
                                    <h5 class="font-semibold text-gray-900">${actividad.descripcion}</h5>
                                    <span class="text-xs text-gray-500">${formatearFechaActividad(actividad.fecha)}</span>
                                </div>
                                <p class="text-sm text-gray-600">IP: ${actividad.ip}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            contenedor.innerHTML = '<p class="text-gray-500 text-center py-8">No hay actividad registrada</p>';
        }
        
    } catch (error) {
        console.error('Error al cargar actividad:', error);
        if (error.message !== 'Sesión expirada' && error.message !== 'No encontrado - Redirigiendo') {
            if (contenedor) {
                contenedor.innerHTML = '<p class="text-red-500 text-center py-8">Error al cargar actividad</p>';
            }
        }
    }
}

function obtenerIconoActividad(tipo) {
    const iconos = {
        'login': '<svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path></svg>',
        'logout': '<svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>',
        'update': '<svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>',
        'create': '<svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>',
    };
    return iconos[tipo] || iconos['update'];
}

function formatearFechaActividad(cadenaFecha) {
    const fecha = new Date(cadenaFecha);
    const ahora = new Date();
    const diferenciaMs = ahora - fecha;
    const diferenciaMinutos = Math.floor(diferenciaMs / 60000);
    const diferenciaHoras = Math.floor(diferenciaMs / 3600000);
    const diferenciaDias = Math.floor(diferenciaMs / 86400000);
    
    if (diferenciaMinutos < 5) return 'Hace unos momentos';
    if (diferenciaMinutos < 60) return `Hace ${diferenciaMinutos} minutos`;
    if (diferenciaHoras < 24) return `Hace ${diferenciaHoras} horas`;
    if (diferenciaDias < 7) return `Hace ${diferenciaDias} días`;
    
    return fecha.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function cerrarModalVerUsuario() {
    document.getElementById('viewUserModal').classList.add('hidden');
    idUsuarioVistaActual = null;
    tabVistaActual = 'personal';
    datosDetalleUsuario = null;
}

// Funciones auxiliares del modal

function editarUsuarioDesdeVista() {
    cerrarModalVerUsuario();
    editarUsuario(idUsuarioVistaActual);
}

function enviarEmailAUsuario() {
    if (datosDetalleUsuario && datosDetalleUsuario.user) {
        window.location.href = `mailto:${datosDetalleUsuario.user.email}`;
    }
}

function imprimirPerfilUsuario() {
    window.print();
}

function gestionarRolesUsuario() {
    cerrarModalVerUsuario();
    gestionarRoles(idUsuarioVistaActual);
}

function removerRolUsuario(nombreRol) {
    if (confirm(`¿Está seguro de remover el rol "${nombreRol}"?`)) {
        // TODO: Implementar remoción de rol
        mostrarToast('Funcionalidad próximamente', 'info');
    }
}

function verActividadCompleta() {
    // TODO: Implementar vista completa de actividad
    mostrarToast('Vista completa de actividad próximamente', 'info');
}

// ========================================
// ACTIVAR/DESACTIVAR USUARIO
// ========================================

let currentToggleUser = null;

async function alternarEstadoUsuario(id, checked) {
    // Cargar datos del usuario primero
    try {
        const response = await fetch(`/admin/usuarios/${id}`);
        if (!response.ok) throw new Error('Error al cargar usuario');

        const data = await response.json();
        currentToggleUser = data.user;
        currentToggleUser.metadata = data.metadata;

        // Abrir modal de confirmación
        if (checked) {
            abrirModalActivar();
        } else {
            abrirModalDesactivar();
        }

    } catch (error) {
        console.error('Error:', error);
        mostrarToast('Error al cargar información del usuario', 'error');

        // Revertir el toggle si hubo error
        const toggle = document.querySelector(`input[onchange="alternarEstadoUsuario(${id}, this.checked)"]`);
        if (toggle) {
            toggle.checked = !checked;
        }
    }
}

function abrirModalDesactivar() {
    const modal = document.getElementById('toggleStatusModal');
    const user = currentToggleUser;

    // Título
    document.getElementById('toggleModalTitle').textContent = '¿Desactivar Usuario?';
    document.getElementById('toggleModalHeader').className = 'px-6 py-4 border-b border-gray-200 bg-red-50';

    // Foto y nombre
    const photoDiv = document.getElementById('toggleUserPhoto');
    if (user.foto_url) {
        photoDiv.innerHTML = `<img src="/storage/${user.foto_url}" alt="${user.nombre}" class="w-full h-full object-cover rounded-full">`;
    } else {
        photoDiv.innerHTML = `
            <div class="w-full h-full rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-xl">
                ${user.nombre.charAt(0)}${user.apellidos.charAt(0)}
            </div>
        `;
    }

    document.getElementById('toggleUserName').textContent = `${user.nombre} ${user.apellidos}`;
    document.getElementById('toggleUserEmail').textContent = user.email;

    // Tipo de usuario
    const tipoHTML = user.tipo_usuario === 'interno'
        ? '<span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Funcionario</span>'
        : '<span class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Ciudadano</span>';
    document.getElementById('toggleUserType').innerHTML = tipoHTML;

    // Detalles del usuario
    let detailsHTML = '';
    if (user.area) {
        detailsHTML += `<p class="text-gray-700"><strong>Área:</strong> ${user.area.nombre}</p>`;
    }
    if (user.equipo) {
        detailsHTML += `<p class="text-gray-700"><strong>Equipo:</strong> ${user.equipo.nombre}</p>`;
    }
    if (user.metadata) {
        detailsHTML += `<p class="text-gray-700"><strong>Tareas activas:</strong> ${user.metadata.tareas_activas}</p>`;
    }
    detailsHTML += `<p class="text-gray-700"><strong>Último acceso:</strong> ${formatearFecha(user.updated_at)}</p>`;
    document.getElementById('toggleUserDetails').innerHTML = detailsHTML;

    // Advertencia
    document.getElementById('toggleWarningBox').innerHTML = `
        <div class="bg-red-50 border-l-4 border-red-400 p-4">
            <div class="flex">
                <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
                    </svg>
                </div>
                <div class="ml-3">
                    <h3 class="text-sm font-medium text-red-800">Al desactivar este usuario:</h3>
                    <div class="mt-2 text-sm text-red-700">
                        <ul class="list-disc list-inside space-y-1">
                            <li>No podrá iniciar sesión en el sistema</li>
                            <li>Sus sesiones activas serán cerradas</li>
                            ${user.metadata && user.metadata.tareas_activas > 0 ? '<li>Sus tareas activas deben ser reasignadas</li>' : ''}
                            <li>Permanecerá en el sistema (no se elimina)</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Mostrar sección de reasignación si tiene tareas activas
    if (user.metadata && user.metadata.tareas_activas > 0) {
        document.getElementById('reasignarTareasSection').classList.remove('hidden');
        cargarUsuariosParaReasignar(user.area_id);
    } else {
        document.getElementById('reasignarTareasSection').classList.add('hidden');
    }

    // Configurar botón
    const confirmButton = document.getElementById('confirmToggleButton');
    confirmButton.textContent = 'Confirmar Desactivación';
    confirmButton.className = 'px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition';

    // Limpiar campos
    document.getElementById('toggleMotivo').value = '';
    document.getElementById('toggleNotificar').checked = false;

    // Mostrar modal
    modal.classList.remove('hidden');
}

function abrirModalActivar() {
    const modal = document.getElementById('toggleStatusModal');
    const user = currentToggleUser;

    // Título
    document.getElementById('toggleModalTitle').textContent = '¿Activar Usuario?';
    document.getElementById('toggleModalHeader').className = 'px-6 py-4 border-b border-gray-200 bg-green-50';

    // Foto y nombre
    const photoDiv = document.getElementById('toggleUserPhoto');
    if (user.foto_url) {
        photoDiv.innerHTML = `<img src="/storage/${user.foto_url}" alt="${user.nombre}" class="w-full h-full object-cover rounded-full">`;
    } else {
        photoDiv.innerHTML = `
            <div class="w-full h-full rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-xl">
                ${user.nombre.charAt(0)}${user.apellidos.charAt(0)}
            </div>
        `;
    }

    document.getElementById('toggleUserName').textContent = `${user.nombre} ${user.apellidos}`;
    document.getElementById('toggleUserEmail').textContent = user.email;

    // Tipo de usuario
    const tipoHTML = user.tipo_usuario === 'interno'
        ? '<span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Funcionario</span>'
        : '<span class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Ciudadano</span>';
    document.getElementById('toggleUserType').innerHTML = tipoHTML;

    // Detalles del usuario
    let detailsHTML = '';
    if (user.area) {
        detailsHTML += `<p class="text-gray-700"><strong>Área:</strong> ${user.area.nombre}</p>`;
    }
    if (user.equipo) {
        detailsHTML += `<p class="text-gray-700"><strong>Equipo:</strong> ${user.equipo.nombre}</p>`;
    }
    document.getElementById('toggleUserDetails').innerHTML = detailsHTML;

    // Mensaje informativo
    document.getElementById('toggleWarningBox').innerHTML = `
        <div class="bg-green-50 border-l-4 border-green-400 p-4">
            <div class="flex">
                <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                    </svg>
                </div>
                <div class="ml-3">
                    <p class="text-sm text-green-700">
                        El usuario podrá volver a iniciar sesión en el sistema y retomar sus actividades.
                    </p>
                </div>
            </div>
        </div>
    `;

    // Ocultar sección de reasignación
    document.getElementById('reasignarTareasSection').classList.add('hidden');

    // Configurar botón
    const confirmButton = document.getElementById('confirmToggleButton');
    confirmButton.textContent = 'Confirmar Activación';
    confirmButton.className = 'px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition';

    // Limpiar campos
    document.getElementById('toggleMotivo').value = '';
    document.getElementById('toggleNotificar').checked = false;

    // Mostrar modal
    modal.classList.remove('hidden');
}

function cerrarModalAlternar() {
    // Revertir el toggle en la tabla ANTES de limpiar currentToggleUser
    if (currentToggleUser) {
        const toggle = document.querySelector(`input[onchange="alternarEstadoUsuario(${currentToggleUser.id}, this.checked)"]`);
        if (toggle) {
            toggle.checked = currentToggleUser.activo;
        }
    }

    document.getElementById('toggleStatusModal').classList.add('hidden');
    currentToggleUser = null;
}

async function confirmarAlternarEstado() {
    if (!currentToggleUser) return;

    const nuevoEstado = !currentToggleUser.activo;
    const motivo = document.getElementById('toggleMotivo').value.trim();
    const notificar = document.getElementById('toggleNotificar').checked;

    // Validar reasignación de tareas si es necesario
    let reasignarA = null;
    if (!nuevoEstado && currentToggleUser.metadata && currentToggleUser.metadata.tareas_activas > 0) {
        const reasignarSelect = document.getElementById('reasignarTareasSelect').value;
        if (!reasignarSelect) {
            mostrarToast('Debe seleccionar una opción para reasignar las tareas', 'error');
            return;
        }

        if (reasignarSelect === 'otro') {
            reasignarA = document.getElementById('otroUsuarioSelect').value;
            if (!reasignarA) {
                mostrarToast('Debe seleccionar un usuario para reasignar las tareas', 'error');
                return;
            }
        } else {
            reasignarA = reasignarSelect;
        }
    }

    const confirmButton = document.getElementById('confirmToggleButton');
    const originalText = confirmButton.textContent;

    try {
        confirmButton.disabled = true;
        confirmButton.textContent = 'Procesando...';

        const response = await fetch(`/admin/usuarios/${currentToggleUser.id}/toggle-estado`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({
                activo: nuevoEstado,
                motivo: motivo,
                reasignar_tareas_a: reasignarA,
                notificar: notificar
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Guardar el ID antes de cerrar el modal (que establece currentToggleUser a null)
            const userId = currentToggleUser.id;

            cerrarModalAlternar();
            mostrarToast(data.message, 'success');

            // Actualizar toggle en la tabla
            const toggle = document.querySelector(`input[onchange="alternarEstadoUsuario(${userId}, this.checked)"]`);
            if (toggle) {
                toggle.checked = nuevoEstado;
            }

            // Actualizar badge de estado en la tabla
            actualizarEstadoUsuarioEnTabla(userId, nuevoEstado);

            // Recargar la lista después de un momento
            setTimeout(() => {
                cargarUsuarios();
            }, 500);

        } else if (response.status === 403) {
            mostrarToast(data.message, 'error');
        } else {
            throw new Error(data.message || 'Error al cambiar estado del usuario');
        }

    } catch (error) {
        console.error('Error:', error);
        mostrarToast(error.message || 'Error al cambiar estado del usuario', 'error');

    } finally {
        confirmButton.disabled = false;
        confirmButton.textContent = originalText;
    }
}

async function cargarUsuariosParaReasignar(areaId) {
    try {
        const response = await fetch(`/admin/api/equipos?area_id=${areaId}`);
        const equipos = await response.json();

        const select = document.getElementById('otroUsuarioSelect');
        select.innerHTML = '<option value="">Seleccione un usuario...</option>';

        // TODO: Cargar usuarios del equipo/área
        // Por ahora dejamos vacío hasta implementar el módulo de usuarios por área

    } catch (error) {
        console.error('Error loading users:', error);
    }
}

function actualizarEstadoUsuarioEnTabla(userId, activo) {
    const row = document.querySelector(`tr input.user-checkbox[value="${userId}"]`)?.closest('tr');
    if (!row) return;

    // Agregar highlight temporal
    row.classList.add('highlight-new');

    // El toggle ya está actualizado, no hace falta hacer nada más
    // Los cambios se reflejarán al recargar la tabla
}

// Event listener para el select de reasignar tareas
document.addEventListener('DOMContentLoaded', function() {
    const reasignarSelect = document.getElementById('reasignarTareasSelect');
    if (reasignarSelect) {
        reasignarSelect.addEventListener('change', function() {
            const otroDiv = document.getElementById('selectOtroUsuario');
            if (this.value === 'otro') {
                otroDiv.classList.remove('hidden');
            } else {
                otroDiv.classList.add('hidden');
            }
        });
    }
});

// Helper para formatear fechas
function formatearFecha(dateString) {
    if (!dateString) return 'Nunca';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 5) return 'Hace unos momentos';
    if (diffMins < 60) return `Hace ${diffMins} minutos`;
    if (diffHours < 24) return `Hace ${diffHours} horas`;
    if (diffDays < 7) return `Hace ${diffDays} días`;

    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

async function eliminarUsuario(id) {
    // Obtener datos del usuario para mostrar en la confirmación
    let userName = 'este usuario';
    try {
        const userResponse = await fetch(`/admin/api/usuarios/${id}`);
        if (userResponse.ok) {
            const userData = await userResponse.json();
            userName = `${userData.user.nombre} ${userData.user.apellidos}`;
        }
    } catch (error) {
        console.error('Error al obtener datos del usuario:', error);
    }

    // Confirmar eliminación con SweetAlert2
    const result = await Swal.fire({
        title: '¿Eliminar usuario?',
        html: `
            <p style="color: #374151;">¿Estás seguro de eliminar a <strong>${userName}</strong>?</p>
            <p style="color: #dc2626; font-size: 0.875rem; margin-top: 0.5rem;">Esta acción no se puede deshacer.</p>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        reverseButtons: true,
        focusCancel: true
    });

    if (!result.isConfirmed) {
        return;
    }

    try {
        const response = await fetch(`/admin/usuarios/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            }
        });

        const responseData = await manejarRespuestaFetch(response);

        if (response.ok) {
            await Swal.fire({
                title: '¡Eliminado!',
                text: 'El usuario ha sido eliminado exitosamente',
                icon: 'success',
                confirmButtonColor: '#3b82f6'
            });

            // Recargar la tabla de usuarios
            await cargarUsuarios();
        } else {
            // Mostrar error específico según el tipo
            let errorMessage = '';
            let errorTitle = 'No se puede eliminar';

            if (responseData.tipo_error === 'es_coordinador') {
                errorMessage = `Este usuario es Coordinador del área "<strong>${responseData.area}</strong>".<br><br>Primero debe asignar otro coordinador o remover esta responsabilidad.`;
            } else if (responseData.tipo_error === 'es_lider') {
                errorMessage = `Este usuario es Líder del equipo "<strong>${responseData.equipo}</strong>".<br><br>Primero debe asignar otro líder o remover esta responsabilidad.`;
            } else if (responseData.tipo_error === 'tiene_tareas') {
                errorMessage = `Este usuario tiene <strong>${responseData.tareas_activas} tareas activas</strong>.<br><br>Primero debe reasignar o completar estas tareas.`;
            } else {
                errorMessage = responseData.message || 'Error al eliminar usuario';
            }

            await Swal.fire({
                title: errorTitle,
                html: errorMessage,
                icon: 'error',
                confirmButtonColor: '#3b82f6'
            });
        }
    } catch (error) {
        console.error('Error:', error);
        await Swal.fire({
            title: 'Error',
            text: 'Ocurrió un error al eliminar el usuario',
            icon: 'error',
            confirmButtonColor: '#3b82f6'
        });
    }
}

function gestionarRoles(id) {
    alert(`Gestionar roles usuario ${id} - Próximo paso`);
}

// ========================================
// RESTABLECER CONTRASEÑA
// ========================================

let resetPasswordUserId = null;

async function restablecerPassword(id) {
    resetPasswordUserId = id;

    try {
        const response = await fetch(`/admin/api/usuarios/${id}`);
        const data = await response.json();
        const user = data.user;

        // Llenar información del usuario
        document.getElementById('resetUserName').textContent = `${user.nombre} ${user.apellidos}`;
        document.getElementById('resetUserEmail').textContent = user.email;

        // Mostrar foto
        const photoDiv = document.getElementById('resetUserPhoto');
        if (user.foto_url) {
            photoDiv.innerHTML = `<img src="/storage/${user.foto_url}" alt="${user.nombre}" class="w-full h-full object-cover">`;
        } else {
            photoDiv.innerHTML = `
                <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
            `;
        }

        // Resetear el formulario
        document.querySelector('input[name="metodo_password"][value="automatica"]').checked = true;
        document.getElementById('passwordGenerada').value = '';
        document.getElementById('passwordManual').value = '';
        document.getElementById('passwordManualConfirm').value = '';
        document.getElementById('forzarCambio').checked = true;
        document.getElementById('enviarEmail').checked = true;
        document.getElementById('cerrarSesiones').checked = true;

        // Resetear indicadores de fortaleza
        resetearIndicadorFortaleza('reset');

        // Alternar vista inicial
        alternarMetodoPassword();

        // Generar contraseña automática inicial
        generarPasswordAutomatica();

        // TODO: Verificar si tiene sesiones activas (cuando se implemente el sistema de sesiones)
        // Por ahora ocultamos la advertencia
        document.getElementById('warningSessionActiva').classList.add('hidden');

        // Mostrar el modal
        document.getElementById('resetPasswordModal').classList.remove('hidden');

    } catch (error) {
        console.error('Error al cargar datos del usuario:', error);
        mostrarToast('Error al cargar datos del usuario', 'error');
    }
}

function cerrarModalRestablecerPassword() {
    document.getElementById('resetPasswordModal').classList.add('hidden');
    resetPasswordUserId = null;
}

function alternarMetodoPassword() {
    const metodo = document.querySelector('input[name="metodo_password"]:checked').value;
    const automaticaSection = document.getElementById('passwordAutomaticaSection');
    const manualSection = document.getElementById('passwordManualSection');
    const labelAutomatica = document.getElementById('labelAutomatica');
    const labelManual = document.getElementById('labelManual');

    if (metodo === 'automatica') {
        automaticaSection.classList.remove('hidden');
        manualSection.classList.add('hidden');
        labelAutomatica.classList.add('border-blue-500', 'bg-blue-50');
        labelAutomatica.classList.remove('border-gray-300');
        labelManual.classList.remove('border-blue-500', 'bg-blue-50');
        labelManual.classList.add('border-gray-300');
    } else {
        automaticaSection.classList.add('hidden');
        manualSection.classList.remove('hidden');
        labelManual.classList.add('border-blue-500', 'bg-blue-50');
        labelManual.classList.remove('border-gray-300');
        labelAutomatica.classList.remove('border-blue-500', 'bg-blue-50');
        labelAutomatica.classList.add('border-gray-300');
    }
}

function generarPasswordAutomatica() {
    // Caracteres permitidos (sin ambiguos: 0, O, l, 1, I)
    const mayusculas = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const minusculas = 'abcdefghijkmnopqrstuvwxyz';
    const numeros = '23456789';
    const simbolos = '!@#$%&*+=-_';

    let password = '';

    // Garantizar al menos 3 mayúsculas
    for (let i = 0; i < 3; i++) {
        password += mayusculas.charAt(Math.floor(Math.random() * mayusculas.length));
    }

    // Garantizar al menos 3 minúsculas
    for (let i = 0; i < 3; i++) {
        password += minusculas.charAt(Math.floor(Math.random() * minusculas.length));
    }

    // Garantizar al menos 3 números
    for (let i = 0; i < 3; i++) {
        password += numeros.charAt(Math.floor(Math.random() * numeros.length));
    }

    // Garantizar al menos 3 símbolos
    for (let i = 0; i < 3; i++) {
        password += simbolos.charAt(Math.floor(Math.random() * simbolos.length));
    }

    // Mezclar los caracteres de forma aleatoria
    password = password.split('').sort(() => Math.random() - 0.5).join('');

    // Mostrar contraseña
    const input = document.getElementById('passwordGenerada');
    input.value = password;
    input.type = 'password'; // Ocultarla por defecto

    // Actualizar indicador de fortaleza
    actualizarIndicadorFortaleza(password, 'reset');
}

function toggleVisibilidadPasswordGenerada() {
    const input = document.getElementById('passwordGenerada');
    const icono = document.getElementById('iconoOjoGenerada');

    if (input.type === 'password') {
        input.type = 'text';
        icono.innerHTML = `
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
        `;
    } else {
        input.type = 'password';
        icono.innerHTML = `
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
        `;
    }
}

async function copiarPasswordGenerada() {
    const password = document.getElementById('passwordGenerada').value;

    if (!password) {
        mostrarToast('Primero genera una contraseña', 'error');
        return;
    }

    try {
        await navigator.clipboard.writeText(password);
        mostrarToast('Contraseña copiada al portapapeles', 'success');
    } catch (error) {
        console.error('Error al copiar:', error);
        mostrarToast('Error al copiar la contraseña', 'error');
    }
}

function verificarFortalezaPasswordReset() {
    const password = document.getElementById('passwordManual').value;
    actualizarIndicadorFortaleza(password, 'reset');

    // Limpiar error si existe
    const errorSpan = document.getElementById('errorPasswordManual');
    errorSpan.classList.add('hidden');
    errorSpan.textContent = '';
}

function verificarCoincidenciaPasswordReset() {
    const password = document.getElementById('passwordManual').value;
    const confirmPassword = document.getElementById('passwordManualConfirm').value;
    const errorSpan = document.getElementById('errorPasswordManualConfirm');

    if (confirmPassword.length > 0) {
        if (password !== confirmPassword) {
            errorSpan.textContent = 'Las contraseñas no coinciden';
            errorSpan.classList.remove('hidden');
            return false;
        } else {
            errorSpan.textContent = 'Las contraseñas coinciden';
            errorSpan.classList.remove('hidden');
            errorSpan.classList.remove('text-red-500');
            errorSpan.classList.add('text-green-500');
            return true;
        }
    } else {
        errorSpan.classList.add('hidden');
        return false;
    }
}

function actualizarIndicadorFortaleza(password, prefijo = 'reset') {
    const bars = [
        document.getElementById(`${prefijo}Strength1`),
        document.getElementById(`${prefijo}Strength2`),
        document.getElementById(`${prefijo}Strength3`),
        document.getElementById(`${prefijo}Strength4`)
    ];
    const label = document.getElementById(`${prefijo}StrengthLabel`);

    // Resetear
    bars.forEach(bar => {
        bar.className = 'h-1 flex-1 bg-gray-200 rounded';
    });

    if (!password || password.length === 0) {
        label.textContent = 'Fortaleza de contraseña';
        label.className = 'text-xs text-gray-500 mt-1';
        return 0;
    }

    let fortaleza = 0;

    // Longitud
    if (password.length >= 8) fortaleza++;
    if (password.length >= 12) fortaleza++;

    // Mayúsculas
    if (/[A-Z]/.test(password)) fortaleza++;

    // Minúsculas
    if (/[a-z]/.test(password)) fortaleza++;

    // Números
    if (/[0-9]/.test(password)) fortaleza++;

    // Símbolos
    if (/[^A-Za-z0-9]/.test(password)) fortaleza++;

    // Ajustar fortaleza a escala 0-4
    fortaleza = Math.min(Math.floor(fortaleza / 1.5), 4);

    // Actualizar barras y etiqueta
    const colores = {
        0: { clase: 'bg-gray-200', texto: 'Muy débil', textoClase: 'text-gray-500' },
        1: { clase: 'bg-red-500', texto: 'Débil', textoClase: 'text-red-500' },
        2: { clase: 'bg-yellow-500', texto: 'Media', textoClase: 'text-yellow-600' },
        3: { clase: 'bg-blue-500', texto: 'Fuerte', textoClase: 'text-blue-600' },
        4: { clase: 'bg-green-500', texto: 'Muy fuerte', textoClase: 'text-green-600' }
    };

    for (let i = 0; i < fortaleza; i++) {
        bars[i].className = `h-1 flex-1 rounded ${colores[fortaleza].clase}`;
    }

    label.textContent = `Fortaleza: ${colores[fortaleza].texto}`;
    label.className = `text-xs mt-1 font-medium ${colores[fortaleza].textoClase}`;

    return fortaleza;
}

function resetearIndicadorFortaleza(prefijo = 'reset') {
    actualizarIndicadorFortaleza('', prefijo);
}

async function confirmarRestablecerPassword() {
    const metodo = document.querySelector('input[name="metodo_password"]:checked').value;
    let password = '';

    // Validar según el método
    if (metodo === 'automatica') {
        password = document.getElementById('passwordGenerada').value;

        if (!password) {
            mostrarToast('Debe generar una contraseña primero', 'error');
            return;
        }
    } else {
        password = document.getElementById('passwordManual').value;
        const passwordConfirm = document.getElementById('passwordManualConfirm').value;

        if (!password || !passwordConfirm) {
            mostrarToast('Debe completar ambos campos de contraseña', 'error');
            return;
        }

        if (password.length < 8) {
            document.getElementById('errorPasswordManual').textContent = 'La contraseña debe tener al menos 8 caracteres';
            document.getElementById('errorPasswordManual').classList.remove('hidden');
            return;
        }

        if (password !== passwordConfirm) {
            mostrarToast('Las contraseñas no coinciden', 'error');
            return;
        }
    }

    // Preparar datos
    const data = {
        password: password,
        forzar_cambio: document.getElementById('forzarCambio').checked,
        enviar_email: document.getElementById('enviarEmail').checked,
        cerrar_sesiones: document.getElementById('cerrarSesiones').checked
    };

    // Deshabilitar botón
    const btn = document.getElementById('btnRestablecerPassword');
    btn.disabled = true;
    btn.innerHTML = '<svg class="animate-spin h-5 w-5 mx-auto" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';

    try {
        const response = await fetch(`/admin/api/usuarios/${resetPasswordUserId}/restablecer-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            },
            body: JSON.stringify(data)
        });

        const result = await manejarRespuestaFetch(response);

        if (response.ok) {
            let mensaje = 'Contraseña restablecida exitosamente';

            if (data.enviar_email) {
                mensaje += '. Se ha enviado un email al usuario';
            }

            if (data.cerrar_sesiones) {
                mensaje += '. Se han cerrado las sesiones activas';
            }

            mostrarToast(mensaje, 'success');
            cerrarModalRestablecerPassword();

            // Recargar la tabla de usuarios
            await cargarUsuarios();
        } else {
            mostrarToast(result.message || 'Error al restablecer contraseña', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarToast('Error al restablecer contraseña', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Restablecer Contraseña';
    }
}

function verActividad(id) {
    alert(`Ver actividad usuario ${id} - Próximo paso`);
}

function exportarMasivo() {
    alert('Exportar seleccionados - Próximo paso');
}

function cambiarEstadoMasivo() {
    alert('Cambiar estado en lote - Próximo paso');
}

function asignarRolMasivo() {
    alert('Asignar rol en lote - Próximo paso');
}

// ========================================
// CARGA DE ROLES Y VALIDACIÓN
// ========================================

async function cargarRolesForModal() {
    const tipoUsuario = document.querySelector('input[name="tipo_usuario"]:checked')?.value || 'interno';
    const container = document.getElementById('rolesContainer');

    try {
        container.innerHTML = '<p class="text-gray-500 text-sm">Cargando roles...</p>';

        const response = await fetch(`/admin/api/roles?tipo_usuario=${tipoUsuario}`);
        const roles = await response.json();
        availableRoles = roles;

        if (roles.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-sm">No hay roles disponibles</p>';
            return;
        }

        container.innerHTML = roles.map(role => `
            <div class="role-checkbox-item">
                <input type="checkbox"
                       name="roles[]"
                       value="${role.name}"
                       id="role_${role.id}"
                       class="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
                       onchange="actualizarVistaRol()">
                <label for="role_${role.id}" class="ml-2 text-sm text-gray-700 cursor-pointer flex-1">
                    ${role.name}
                </label>
            </div>
        `).join('');

        // Si es ciudadano, auto-seleccionar rol "Ciudadano"
        if (tipoUsuario === 'externo') {
            const ciudadanoCheckbox = container.querySelector('input[value="Ciudadano"]');
            if (ciudadanoCheckbox) {
                ciudadanoCheckbox.checked = true;
                ciudadanoCheckbox.disabled = true;
            }
        }

    } catch (error) {
        console.error('Error loading roles:', error);
        container.innerHTML = '<p class="text-red-500 text-sm">Error al cargar roles</p>';
    }
}

function actualizarVistaRol() {
    const selectedRoles = Array.from(document.querySelectorAll('input[name="roles[]"]:checked'))
        .map(cb => cb.value);

    const preview = document.getElementById('permisosPreview');

    if (selectedRoles.length > 0) {
        preview.classList.remove('hidden');
        // Aquí podrías cargar los permisos específicos del rol si los tienes en la API
        document.getElementById('permisosLista').innerHTML = `
            <p class="text-sm text-gray-700">Roles seleccionados: <strong>${selectedRoles.join(', ')}</strong></p>
        `;
    } else {
        preview.classList.add('hidden');
    }
}

// ========================================
// UPLOAD Y PREVIEW DE FOTO
// ========================================

function manejarSubidaFoto(event) {
    const file = event.target.files[0];

    if (!file) return;

    // Validar tamaño (máx 2MB)
    if (file.size > 2 * 1024 * 1024) {
        mostrarToast('La imagen no debe superar 2MB', 'error');
        event.target.value = '';
        return;
    }

    // Validar tipo
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
        mostrarToast('Solo se permiten imágenes JPG y PNG', 'error');
        event.target.value = '';
        return;
    }

    // Mostrar preview
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('photoPreview').innerHTML = `
            <img src="${e.target.result}" alt="Preview" class="w-full h-full object-cover">
        `;
        selectedPhoto = file;
        formChanged = true;
    };
    reader.readAsDataURL(file);
}

// ========================================
// FORTALEZA DE CONTRASEÑA
// ========================================

function verificarFortalezaPassword() {
    const password = document.getElementById('password').value;
    const strengthBars = ['strength1', 'strength2', 'strength3', 'strength4'];
    const label = document.getElementById('strengthLabel');

    // Resetear
    strengthBars.forEach(id => {
        document.getElementById(id).style.backgroundColor = '#E5E7EB';
    });

    if (password.length === 0) {
        label.textContent = 'Fortaleza de contraseña';
        label.className = 'text-xs text-gray-500 mt-1';
        return;
    }

    let strength = 0;

    // Criterios de fortaleza
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/\d/)) strength++;
    if (password.match(/[^a-zA-Z\d]/)) strength++;

    const strengthLevels = [
        { level: 1, label: 'Débil', color: '#EF4444', bars: 1 },
        { level: 2, label: 'Media', color: '#F59E0B', bars: 2 },
        { level: 3, label: 'Buena', color: '#3B82F6', bars: 3 },
        { level: 4, label: 'Fuerte', color: '#10B981', bars: 4 }
    ];

    const currentLevel = strengthLevels[strength - 1];
    if (currentLevel) {
        label.textContent = `Fortaleza: ${currentLevel.label}`;
        label.style.color = currentLevel.color;

        for (let i = 0; i < currentLevel.bars; i++) {
            document.getElementById(strengthBars[i]).style.backgroundColor = currentLevel.color;
        }
    }

    verificarCoincidenciaPassword();
}

function verificarCoincidenciaPassword() {
    const password = document.getElementById('password').value;
    const confirmation = document.getElementById('password_confirmation').value;
    const message = document.getElementById('passwordMatchMessage');

    if (confirmation.length === 0) {
        message.classList.add('hidden');
        return;
    }

    message.classList.remove('hidden');

    if (password === confirmation) {
        message.textContent = '✓ Las contraseñas coinciden';
        message.className = 'text-xs text-green-600 mt-1';
        document.getElementById('password_confirmation').classList.remove('error');
    } else {
        message.textContent = '✗ Las contraseñas no coinciden';
        message.className = 'text-xs text-red-600 mt-1';
        document.getElementById('password_confirmation').classList.add('error');
    }
}

function alternarVisibilidadPassword(fieldId) {
    const field = document.getElementById(fieldId);
    field.type = field.type === 'password' ? 'text' : 'password';
}

// ========================================
// ENVÍO DEL FORMULARIO
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    const userForm = document.getElementById('userForm');
    if (userForm) {
        userForm.addEventListener('submit', manejarEnvioFormulario);
    }
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
        const formData = new FormData(document.getElementById('userForm'));

        // Agregar foto si existe
        if (selectedPhoto) {
            formData.append('foto', selectedPhoto);
        }

        // Agregar roles seleccionados
        const roles = Array.from(document.querySelectorAll('input[name="roles[]"]:checked'))
            .map(cb => cb.value);
        formData.delete('roles[]');
        roles.forEach(role => formData.append('roles[]', role));

        // Agregar activo
        const activo = document.getElementById('activo').checked;
        formData.append('activo', activo ? '1' : '0');

        // Enviar petición
        const response = await fetch('/admin/usuarios', {
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
            mostrarToast('Usuario creado exitosamente', 'success');
            cerrarModal();

            // Agregar nueva fila a la tabla
            agregarNuevoUsuarioATabla(data.user);

            // Recargar lista de usuarios
            setTimeout(() => {
                cargarUsuarios();
            }, 500);

        } else if (response.status === 422) {
            // Errores de validación
            manejarErroresValidacion(data.errors);
            mostrarToast('Por favor corrija los errores en el formulario', 'error');

        } else {
            // Error del servidor
            throw new Error(data.message || 'Error al crear usuario');
        }

    } catch (error) {
        console.error('Error:', error);
        mostrarToast(error.message || 'Error al guardar usuario', 'error');

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

    // Validar roles
    const rolesChecked = document.querySelectorAll('input[name="roles[]"]:checked').length;
    if (rolesChecked === 0) {
        mostrarToast('Debe seleccionar al menos un rol', 'error');
        isValid = false;
    }

    // Validar contraseña
    const password = document.getElementById('password').value;
    const confirmation = document.getElementById('password_confirmation').value;

    if (!password) {
        mostrarError('password', 'La contraseña es obligatoria');
        isValid = false;
    } else if (password.length < 8) {
        mostrarError('password', 'La contraseña debe tener al menos 8 caracteres');
        isValid = false;
    }

    if (password !== confirmation) {
        mostrarError('password_confirmation', 'Las contraseñas no coinciden');
        isValid = false;
    }

    return isValid;
}

function manejarErroresValidacion(errors) {
    // Mostrar errores en los campos correspondientes
    for (const [field, messages] of Object.entries(errors)) {
        const fieldElement = document.querySelector(`[name="${field}"]`);

        if (fieldElement) {
            const errorMessage = Array.isArray(messages) ? messages[0] : messages;

            // Detectar en qué tab está el campo y navegar a él
            let tabNumber = 1;
            if (['area_id', 'equipo_id', 'cargo', 'tipo_usuario'].includes(field)) {
                tabNumber = 2;
            } else if (['password', 'password_confirmation', 'roles'].includes(field)) {
                tabNumber = 3;
            }

            // Navegar al tab si no es el actual
            if (tabNumber !== currentTab) {
                mostrarTab(tabNumber);
            }

            // Mostrar error
            if (field === 'cedula' && errorMessage.includes('existe')) {
                mostrarError(field, errorMessage);
                // Agregar link para ver usuario existente
                const errorSpan = fieldElement.parentElement.querySelector('.error-message');
                if (errorSpan) {
                    errorSpan.innerHTML = `${errorMessage} <a href="#" class="underline hover:text-red-700" onclick="buscarUsuarioExistente('${fieldElement.value}'); return false;">Ver usuario existente</a>`;
                }
            } else if (field === 'email' && errorMessage.includes('registrado')) {
                mostrarError(field, errorMessage);
                const errorSpan = fieldElement.parentElement.querySelector('.error-message');
                if (errorSpan) {
                    errorSpan.innerHTML = `${errorMessage} <a href="#" class="underline hover:text-red-700" onclick="buscarUsuarioExistente('${fieldElement.value}'); return false;">¿Es el mismo usuario?</a>`;
                }
            } else {
                mostrarError(field, errorMessage);
            }
        }
    }

    // Focus en primer campo con error
    const firstError = document.querySelector('.error');
    if (firstError) {
        firstError.focus();
    }
}

function buscarUsuarioExistente(searchTerm) {
    cerrarModal();
    document.getElementById('searchInput').value = searchTerm;
    document.getElementById('searchInput').dispatchEvent(new Event('input'));
}

function agregarNuevoUsuarioATabla(user) {
    const tbody = document.getElementById('usersTableBody');

    // Crear nueva fila
    const newRow = document.createElement('tr');
    newRow.classList.add('highlight-new', 'hover:bg-gray-50');
    newRow.innerHTML = `
        <td class="px-6 py-4">
            <input type="checkbox" class="user-checkbox rounded border-gray-300" value="${user.id}">
        </td>
        <td class="px-6 py-4">
            <div class="flex items-center">
                <div class="flex-shrink-0 h-10 w-10">
                    ${user.foto_url
                        ? `<img class="h-10 w-10 rounded-full" src="/storage/${user.foto_url}" alt="${user.nombre}">`
                        : `<div class="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                            ${user.nombre.charAt(0)}${user.apellidos.charAt(0)}
                           </div>`
                    }
                </div>
                <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">${user.nombre} ${user.apellidos}</div>
                    <div class="text-sm text-gray-500">${user.email}</div>
                </div>
            </div>
        </td>
        <td class="px-6 py-4">
            <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                user.tipo_usuario === 'interno'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-blue-100 text-blue-800'
            }">
                ${user.tipo_usuario === 'interno' ? 'Funcionario' : 'Ciudadano'}
            </span>
        </td>
        <td class="px-6 py-4 text-sm text-gray-500">
            ${user.area ? `
                <div>${user.area.nombre}</div>
                ${user.equipo ? `<div class="text-xs text-gray-400">${user.equipo.nombre}</div>` : ''}
            ` : '-'}
        </td>
        <td class="px-6 py-4">
            <div class="flex flex-wrap gap-1">
                ${user.roles.slice(0, 2).map(role => `
                    <span class="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                        ${role.name}
                    </span>
                `).join('')}
                ${user.roles.length > 2 ? `
                    <span class="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                        +${user.roles.length - 2}
                    </span>
                ` : ''}
            </div>
        </td>
        <td class="px-6 py-4">
            <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" class="sr-only peer" ${user.activo ? 'checked' : ''}
                       onchange="alternarEstadoUsuario(${user.id}, this.checked)">
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
        </td>
        <td class="px-6 py-4 text-sm font-medium">
            <button onclick="verUsuario(${user.id})" class="text-blue-600 hover:text-blue-900 mr-3">Ver</button>
            <button onclick="editarUsuario(${user.id})" class="text-indigo-600 hover:text-indigo-900">Editar</button>
        </td>
    `;

    // Insertar al inicio de la tabla
    tbody.insertBefore(newRow, tbody.firstChild);

    // Scroll a la nueva fila
    newRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ========================================
// MANEJAR ENVÍO DE FORMULARIO DE EDICIÓN
// ========================================

async function manejarEnvioFormularioEditar(e) {
    e.preventDefault();

    // Validación final
    if (!validarFormularioFinalEdit()) {
        return;
    }

    // Verificar cambios en área o equipo
    const areaChanged = originalUserData.area_id != document.getElementById('area_id').value;
    const equipoChanged = originalUserData.equipo_id != document.getElementById('equipo_id').value;

    // Si cambió área o equipo y es coordinador/líder, solicitar confirmación
    if ((areaChanged || equipoChanged) && originalUserData.tipo_usuario === 'interno') {
        if (userMetadata.es_coordinador && areaChanged) {
            const confirmed = await mostrarConfirmacionCoordinador();
            if (!confirmed) return;
        }

        if (userMetadata.es_lider && equipoChanged) {
            const confirmed = await mostrarConfirmacionLider();
            if (!confirmed) return;
        }

        if (userMetadata.tareas_activas > 0 || areaChanged || equipoChanged) {
            const motivo = await mostrarDialogoCambioMotivo();
            if (!motivo) return;

            // Agregar motivo al formulario
            const motivoInput = document.createElement('input');
            motivoInput.type = 'hidden';
            motivoInput.name = 'motivo_cambio_area';
            motivoInput.value = motivo;
            document.getElementById('userForm').appendChild(motivoInput);
        }
    }

    const submitButton = document.getElementById('submitButton');
    const originalText = submitButton.innerHTML;

    try {
        submitButton.disabled = true;
        submitButton.classList.add('loading');
        submitButton.innerHTML = '<span class="opacity-0">Guardando...</span>';

        // Preparar FormData
        const formData = new FormData(document.getElementById('userForm'));

        // Agregar foto si existe
        if (selectedPhoto) {
            formData.append('foto', selectedPhoto);
        }

        // Agregar roles seleccionados
        const roles = Array.from(document.querySelectorAll('input[name="roles[]"]:checked'))
            .map(cb => cb.value);
        formData.delete('roles[]');
        roles.forEach(role => formData.append('roles[]', role));

        // Agregar activo
        const activo = document.getElementById('activo').checked;
        formData.append('activo', activo ? '1' : '0');

        // Agregar _method para PUT
        formData.append('_method', 'PUT');

        // Si cambió área y es coordinador, agregar flag
        if (areaChanged && userMetadata.es_coordinador) {
            formData.append('remover_como_coordinador', '1');
        }

        // Si cambió equipo y es líder, agregar flag
        if (equipoChanged && userMetadata.es_lider) {
            formData.append('remover_como_lider', '1');
        }

        // Enviar petición
        const response = await fetch(`/admin/usuarios/${editingUserId}`, {
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
            mostrarToast('Usuario actualizado exitosamente', 'success');
            cerrarModal();

            // Actualizar fila en la tabla
            actualizarFilaUsuario(data.user);

            // Recargar lista después de un momento
            setTimeout(() => {
                cargarUsuarios();
            }, 500);

        } else if (response.status === 422) {
            // Errores de validación o confirmaciones requeridas
            if (data.requires_confirmation) {
                handleConfirmationRequired(data);
            } else {
                manejarErroresValidacion(data.errors);
                mostrarToast('Por favor corrija los errores en el formulario', 'error');
            }

        } else {
            throw new Error(data.message || 'Error al actualizar usuario');
        }

    } catch (error) {
        console.error('Error:', error);
        mostrarToast(error.message || 'Error al actualizar usuario', 'error');

    } finally {
        submitButton.disabled = false;
        submitButton.classList.remove('loading');
        submitButton.innerHTML = originalText;
    }
}

function validarFormularioFinalEdit() {
    limpiarTodosLosErrores();
    let isValid = true;

    // Validar roles
    const rolesChecked = document.querySelectorAll('input[name="roles[]"]:checked').length;
    if (rolesChecked === 0) {
        mostrarToast('Debe seleccionar al menos un rol', 'error');
        isValid = false;
    }

    // Validar contraseña solo si se está cambiando
    const password = document.getElementById('password').value;
    const confirmation = document.getElementById('password_confirmation').value;

    if (password || confirmation) {
        if (password.length > 0 && password.length < 8) {
            mostrarError('password', 'La contraseña debe tener al menos 8 caracteres');
            isValid = false;
        }

        if (password !== confirmation) {
            mostrarError('password_confirmation', 'Las contraseñas no coinciden');
            isValid = false;
        }
    }

    return isValid;
}

function mostrarConfirmacionCoordinador() {
    return new Promise((resolve) => {
        const dialog = document.createElement('div');
        dialog.innerHTML = `
            <div class="confirmation-overlay"></div>
            <div class="confirmation-dialog">
                <div class="flex items-start mb-4">
                    <div class="flex-shrink-0">
                        <svg class="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                        </svg>
                    </div>
                    <div class="ml-3">
                        <h3 class="text-lg font-semibold text-gray-900">Usuario es Coordinador</h3>
                        <p class="text-sm text-gray-600 mt-2">
                            Este usuario es Coordinador del área <strong>${userMetadata.area_coordinada.nombre}</strong>.
                            Al cambiar el área, será removido automáticamente como coordinador.
                        </p>
                        <p class="text-sm text-gray-600 mt-2 font-semibold">
                            ¿Desea continuar con el cambio?
                        </p>
                    </div>
                </div>
                <div class="flex gap-3 justify-end">
                    <button onclick="this.closest('div').parentElement.remove(); window.confirmResult(false)"
                            class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                        Cancelar Cambio
                    </button>
                    <button onclick="this.closest('div').parentElement.remove(); window.confirmResult(true)"
                            class="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">
                        Remover y Continuar
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);

        window.confirmResult = (result) => {
            resolve(result);
            delete window.confirmResult;
        };
    });
}

function mostrarConfirmacionLider() {
    return new Promise((resolve) => {
        const dialog = document.createElement('div');
        dialog.innerHTML = `
            <div class="confirmation-overlay"></div>
            <div class="confirmation-dialog">
                <div class="flex items-start mb-4">
                    <div class="flex-shrink-0">
                        <svg class="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                        </svg>
                    </div>
                    <div class="ml-3">
                        <h3 class="text-lg font-semibold text-gray-900">Usuario es Líder</h3>
                        <p class="text-sm text-gray-600 mt-2">
                            Este usuario es Líder del equipo <strong>${userMetadata.equipo_liderado.nombre}</strong>.
                            Al cambiar el equipo, será removido automáticamente como líder.
                        </p>
                        <p class="text-sm text-gray-600 mt-2 font-semibold">
                            ¿Desea continuar con el cambio?
                        </p>
                    </div>
                </div>
                <div class="flex gap-3 justify-end">
                    <button onclick="this.closest('div').parentElement.remove(); window.confirmLiderResult(false)"
                            class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                        Cancelar Cambio
                    </button>
                    <button onclick="this.closest('div').parentElement.remove(); window.confirmLiderResult(true)"
                            class="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">
                        Remover y Continuar
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);

        window.confirmLiderResult = (result) => {
            resolve(result);
            delete window.confirmLiderResult;
        };
    });
}

function mostrarDialogoCambioMotivo() {
    return new Promise((resolve) => {
        const dialog = document.createElement('div');
        dialog.innerHTML = `
            <div class="confirmation-overlay"></div>
            <div class="confirmation-dialog">
                <div class="mb-4">
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">Motivo del Cambio</h3>
                    <p class="text-sm text-gray-600 mb-4">
                        Por favor, indique el motivo del cambio de área/equipo:
                    </p>
                    <textarea id="motivoCambio" rows="4"
                              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Ej: Reestructuración organizacional, cambio de funciones, etc."></textarea>
                    <p class="text-xs text-gray-500 mt-1">Este motivo quedará registrado en el historial de cambios</p>
                </div>
                <div class="flex gap-3 justify-end">
                    <button onclick="this.closest('div').parentElement.remove(); window.motivoResult(null)"
                            class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                        Cancelar
                    </button>
                    <button onclick="const motivo = document.getElementById('motivoCambio').value.trim(); if(!motivo) { alert('Debe ingresar un motivo'); return; } this.closest('div').parentElement.remove(); window.motivoResult(motivo)"
                            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Continuar
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);

        window.motivoResult = (result) => {
            resolve(result);
            delete window.motivoResult;
        };
    });
}

function actualizarFilaUsuario(user) {
    // Buscar la fila del usuario en la tabla
    const row = document.querySelector(`tr input.user-checkbox[value="${user.id}"]`)?.closest('tr');
    if (!row) return;

    // Agregar clase de highlight
    row.classList.add('highlight-new');

    // Actualizar contenido de la fila
    const cells = row.querySelectorAll('td');

    // Celda de usuario (nombre, email, foto)
    if (cells[1]) {
        cells[1].innerHTML = `
            <div class="flex items-center">
                <div class="flex-shrink-0 h-10 w-10">
                    ${user.foto_url
                        ? `<img class="h-10 w-10 rounded-full" src="/storage/${user.foto_url}" alt="${user.nombre}">`
                        : `<div class="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                            ${user.nombre.charAt(0)}${user.apellidos.charAt(0)}
                           </div>`
                    }
                </div>
                <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">${user.nombre} ${user.apellidos}</div>
                    <div class="text-sm text-gray-500">${user.email}</div>
                </div>
            </div>
        `;
    }

    // Celda de tipo
    if (cells[2]) {
        cells[2].innerHTML = `
            <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                user.tipo_usuario === 'interno'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-blue-100 text-blue-800'
            }">
                ${user.tipo_usuario === 'interno' ? 'Funcionario' : 'Ciudadano'}
            </span>
        `;
    }

    // Celda de área/equipo
    if (cells[3]) {
        cells[3].innerHTML = `
            <div class="text-sm text-gray-500">
                ${user.area ? `
                    <div>${user.area.nombre}</div>
                    ${user.equipo ? `<div class="text-xs text-gray-400">${user.equipo.nombre}</div>` : ''}
                ` : '-'}
            </div>
        `;
    }

    // Celda de roles
    if (cells[4]) {
        cells[4].innerHTML = `
            <div class="flex flex-wrap gap-1">
                ${user.roles.slice(0, 2).map(role => `
                    <span class="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                        ${role.name}
                    </span>
                `).join('')}
                ${user.roles.length > 2 ? `
                    <span class="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                        +${user.roles.length - 2}
                    </span>
                ` : ''}
            </div>
        `;
    }

    // Scroll a la fila actualizada
    row.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
