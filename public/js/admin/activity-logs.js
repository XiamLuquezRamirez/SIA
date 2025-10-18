// Estado de la aplicación
let currentOffset = 0;
let currentLimit = 50;
let totalActivities = 0;
let currentFilters = {};

// Cargar estadísticas y actividades al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si hay parámetros en la URL
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('user_id');

    // Si hay user_id en la URL, agregarlo a los filtros
    if (userId) {
        currentFilters.user_id = userId;
        mostrarAvisoFiltroUsuario(userId);
    }

    cargarEstadisticas();
    cargarActividades();

    // Configurar debounce para búsqueda
    const searchInput = document.getElementById('searchActivity');
    let searchTimeout;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            aplicarFiltros();
        }, 500);
    });
});

/**
 * Cargar estadísticas del sistema
 */
async function cargarEstadisticas() {
    try {
        const params = new URLSearchParams();
        if (currentFilters.start_date) params.append('start_date', currentFilters.start_date);
        if (currentFilters.end_date) params.append('end_date', currentFilters.end_date);

        const response = await fetch(`/admin/activity-logs/stats?${params.toString()}`);
        const data = await response.json();

        if (data.success) {
            document.getElementById('statTotal').textContent = formatNumber(data.stats.total);
            document.getElementById('statInfo').textContent = formatNumber(data.stats.por_severidad.info || 0);
            document.getElementById('statWarning').textContent = formatNumber(data.stats.por_severidad.warning || 0);
            document.getElementById('statError').textContent = formatNumber(data.stats.por_severidad.error + data.stats.por_severidad.critical || 0);
            document.getElementById('statActiveUsers').textContent = formatNumber(data.stats.usuarios_activos || 0);
        }
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
    }
}

/**
 * Cargar actividades con filtros
 */
async function cargarActividades() {
    try {
        const params = new URLSearchParams({
            limit: currentLimit,
            offset: currentOffset,
            ...currentFilters
        });

        const response = await fetch(`/admin/activity-logs/activities?${params.toString()}`);
        const data = await response.json();

        if (data.success) {
            totalActivities = data.total;
            renderActivities(data.activities);
            updatePagination();
        }
    } catch (error) {
        console.error('Error al cargar actividades:', error);
        mostrarError('Error al cargar las actividades');
    }
}

/**
 * Renderizar tabla de actividades
 */
function renderActivities(activities) {
    const tbody = document.getElementById('activityTableBody');

    if (!activities || activities.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="px-6 py-12 text-center text-gray-500">
                    <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <p class="mt-2 text-sm">No se encontraron actividades</p>
                </td>
            </tr>
        `;
        document.getElementById('activityCount').textContent = 'No hay actividades para mostrar';
        return;
    }

    tbody.innerHTML = activities.map(activity => {
        const severityBadge = getSeverityBadge(activity.severity);
        const categoryBadge = getCategoryBadge(activity.log_name);

        return `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                            <div class="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <svg class="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                </svg>
                            </div>
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">${escapeHtml(activity.user_name || 'Sistema')}</div>
                            <div class="text-sm text-gray-500">${escapeHtml(activity.user_email || '-')}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm text-gray-900">${escapeHtml(activity.description)}</div>
                    <div class="text-sm text-gray-500">${escapeHtml(activity.event)}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    ${categoryBadge}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    ${severityBadge}
                    ${activity.is_important ? '<span class="ml-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">Importante</span>' : ''}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${escapeHtml(activity.ip_address || '-')}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${activity.created_at_relative}</div>
                    <div class="text-xs text-gray-500">${activity.created_at}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick='verDetalle(${JSON.stringify(activity).replace(/'/g, "&apos;")})'
                            class="text-blue-600 hover:text-blue-900">
                        Ver detalles
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    const from = currentOffset + 1;
    const to = Math.min(currentOffset + activities.length, totalActivities);
    document.getElementById('activityCount').textContent = `Mostrando ${from} - ${to} de ${formatNumber(totalActivities)} actividades`;
}

/**
 * Mostrar detalles de actividad
 */
function verDetalle(activity) {
    const content = document.getElementById('detailModalContent');

    let changesHtml = '';
    if (activity.changes && activity.changes.length > 0) {
        changesHtml = `
            <div>
                <h4 class="text-sm font-medium text-gray-900 mb-2">Cambios Realizados</h4>
                <div class="bg-gray-50 rounded-md p-3 space-y-2">
                    ${activity.changes.map(change => `
                        <div class="text-sm">
                            <span class="font-medium text-gray-700">${escapeHtml(change.field)}:</span>
                            <div class="ml-4 mt-1">
                                <div class="text-red-600">- ${escapeHtml(String(change.old))}</div>
                                <div class="text-green-600">+ ${escapeHtml(String(change.new))}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    let propertiesHtml = '';
    if (activity.properties && Object.keys(activity.properties).length > 0) {
        propertiesHtml = `
            <div>
                <h4 class="text-sm font-medium text-gray-900 mb-2">Propiedades Adicionales</h4>
                <div class="bg-gray-50 rounded-md p-3">
                    <pre class="text-xs text-gray-700 whitespace-pre-wrap">${JSON.stringify(activity.properties, null, 2)}</pre>
                </div>
            </div>
        `;
    }

    content.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <h4 class="text-sm font-medium text-gray-700">Usuario</h4>
                <p class="text-sm text-gray-900 mt-1">${escapeHtml(activity.user_name || 'Sistema')}</p>
                <p class="text-sm text-gray-500">${escapeHtml(activity.user_email || '-')}</p>
            </div>

            <div>
                <h4 class="text-sm font-medium text-gray-700">Fecha y Hora</h4>
                <p class="text-sm text-gray-900 mt-1">${activity.created_at}</p>
                <p class="text-sm text-gray-500">${activity.created_at_relative}</p>
            </div>

            <div>
                <h4 class="text-sm font-medium text-gray-700">Categoría</h4>
                <p class="text-sm text-gray-900 mt-1">${getCategoryBadge(activity.log_name)}</p>
            </div>

            <div>
                <h4 class="text-sm font-medium text-gray-700">Evento</h4>
                <p class="text-sm text-gray-900 mt-1">${escapeHtml(activity.event)}</p>
            </div>

            <div>
                <h4 class="text-sm font-medium text-gray-700">Severidad</h4>
                <p class="text-sm text-gray-900 mt-1">${getSeverityBadge(activity.severity)}</p>
            </div>

            <div>
                <h4 class="text-sm font-medium text-gray-700">IP</h4>
                <p class="text-sm text-gray-900 mt-1">${escapeHtml(activity.ip_address || '-')}</p>
            </div>

            <div class="md:col-span-2">
                <h4 class="text-sm font-medium text-gray-700">Descripción</h4>
                <p class="text-sm text-gray-900 mt-1">${escapeHtml(activity.description)}</p>
            </div>

            ${activity.url ? `
                <div class="md:col-span-2">
                    <h4 class="text-sm font-medium text-gray-700">URL</h4>
                    <p class="text-sm text-gray-900 mt-1 break-all">${escapeHtml(activity.url)}</p>
                </div>
            ` : ''}

            ${activity.method ? `
                <div>
                    <h4 class="text-sm font-medium text-gray-700">Método HTTP</h4>
                    <p class="text-sm text-gray-900 mt-1">${escapeHtml(activity.method)}</p>
                </div>
            ` : ''}

            ${activity.user_agent ? `
                <div class="md:col-span-2">
                    <h4 class="text-sm font-medium text-gray-700">User Agent</h4>
                    <p class="text-sm text-gray-900 mt-1 break-all">${escapeHtml(activity.user_agent)}</p>
                </div>
            ` : ''}
        </div>

        ${changesHtml}
        ${propertiesHtml}
    `;

    document.getElementById('detailModal').classList.remove('hidden');
}

/**
 * Cerrar modal de detalles
 */
function cerrarDetalleModal() {
    document.getElementById('detailModal').classList.add('hidden');
}

/**
 * Aplicar filtros
 */
function aplicarFiltros() {
    currentOffset = 0;
    currentFilters = {};

    const search = document.getElementById('searchActivity').value.trim();
    const logName = document.getElementById('filterLogName').value;
    const event = document.getElementById('filterEvent').value;
    const severity = document.getElementById('filterSeverity').value;
    const startDate = document.getElementById('filterStartDate').value;
    const endDate = document.getElementById('filterEndDate').value;
    const important = document.getElementById('filterImportant').checked;

    if (search) currentFilters.search = search;
    if (logName) currentFilters.log_name = logName;
    if (event) currentFilters.event = event;
    if (severity) currentFilters.severity = severity;
    if (startDate) currentFilters.start_date = startDate;
    if (endDate) currentFilters.end_date = endDate;
    if (important) currentFilters.important = 'true';

    cargarActividades();
    cargarEstadisticas();
}

/**
 * Limpiar filtros
 */
function limpiarFiltros() {
    document.getElementById('searchActivity').value = '';
    document.getElementById('filterLogName').value = '';
    document.getElementById('filterEvent').value = '';
    document.getElementById('filterSeverity').value = '';
    document.getElementById('filterStartDate').value = '';
    document.getElementById('filterEndDate').value = '';
    document.getElementById('filterImportant').checked = false;

    currentFilters = {};
    currentOffset = 0;

    cargarActividades();
    cargarEstadisticas();
}

/**
 * Paginación
 */
function cargarPaginaAnterior() {
    if (currentOffset > 0) {
        currentOffset = Math.max(0, currentOffset - currentLimit);
        cargarActividades();
    }
}

function cargarPaginaSiguiente() {
    if (currentOffset + currentLimit < totalActivities) {
        currentOffset += currentLimit;
        cargarActividades();
    }
}

function updatePagination() {
    const from = currentOffset + 1;
    const to = Math.min(currentOffset + currentLimit, totalActivities);
    const currentPage = Math.floor(currentOffset / currentLimit) + 1;
    const totalPages = Math.ceil(totalActivities / currentLimit);

    document.getElementById('paginationFrom').textContent = formatNumber(from);
    document.getElementById('paginationTo').textContent = formatNumber(to);
    document.getElementById('paginationTotal').textContent = formatNumber(totalActivities);
    document.getElementById('paginationInfo').textContent = `Página ${currentPage} de ${totalPages}`;

    // Deshabilitar botones según corresponda
    const btnPrev = document.getElementById('btnPrev');
    const btnNext = document.getElementById('btnNext');
    const btnPrevMobile = document.getElementById('btnPrevMobile');
    const btnNextMobile = document.getElementById('btnNextMobile');

    if (currentOffset === 0) {
        btnPrev.disabled = true;
        btnPrev.classList.add('opacity-50', 'cursor-not-allowed');
        btnPrevMobile.disabled = true;
        btnPrevMobile.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
        btnPrev.disabled = false;
        btnPrev.classList.remove('opacity-50', 'cursor-not-allowed');
        btnPrevMobile.disabled = false;
        btnPrevMobile.classList.remove('opacity-50', 'cursor-not-allowed');
    }

    if (currentOffset + currentLimit >= totalActivities) {
        btnNext.disabled = true;
        btnNext.classList.add('opacity-50', 'cursor-not-allowed');
        btnNextMobile.disabled = true;
        btnNextMobile.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
        btnNext.disabled = false;
        btnNext.classList.remove('opacity-50', 'cursor-not-allowed');
        btnNextMobile.disabled = false;
        btnNextMobile.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}

/**
 * Utilidades
 */
function getSeverityBadge(severity) {
    const badges = {
        'info': '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Info</span>',
        'warning': '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Advertencia</span>',
        'error': '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Error</span>',
        'critical': '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-200 text-red-900">Crítico</span>',
    };
    return badges[severity] || badges['info'];
}

function getCategoryBadge(logName) {
    const badges = {
        'auth': '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Autenticación</span>',
        'user_management': '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Usuarios</span>',
        'role_management': '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">Roles</span>',
        'permission_management': '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">Permisos</span>',
        'area_management': '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Áreas</span>',
        'team_management': '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">Equipos</span>',
        'general': '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">General</span>',
    };
    return badges[logName] || badges['general'];
}

function formatNumber(num) {
    return new Intl.NumberFormat('es-ES').format(num);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function mostrarError(mensaje) {
    // Podrías implementar una notificación toast aquí
    console.error(mensaje);
}

/**
 * Mostrar aviso de filtro por usuario
 */
async function mostrarAvisoFiltroUsuario(userId) {
    try {
        const response = await fetch(`/admin/api/usuarios/${userId}`);
        if (response.ok) {
            const data = await response.json();
            const userName = data.usuario ? `${data.usuario.nombre} ${data.usuario.apellidos}` : `Usuario #${userId}`;

            document.getElementById('userFilterName').textContent = userName;
            document.getElementById('userFilterNotice').classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error al obtener nombre de usuario:', error);
        document.getElementById('userFilterName').textContent = `ID: ${userId}`;
        document.getElementById('userFilterNotice').classList.remove('hidden');
    }
}

/**
 * Limpiar filtro de usuario
 */
function limpiarFiltroUsuario() {
    // Remover parámetro de la URL y recargar
    window.location.href = '/admin/activity-logs';
}
