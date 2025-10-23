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
let selectedCategorias = [];
let debounceTimer = null;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    cargarCategorias();
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
            cargarCategorias();
        }, 500);
    });

    // Filtros
    document.getElementById('filterEstado').addEventListener('change', function(e) {
        currentFilters.estado = e.target.value;
        currentPage = 1;
        cargarCategorias();
    });


    // Items por página
    document.getElementById('perPageSelect').addEventListener('change', function(e) {
        currentPage = 1;
        cargarCategorias();
    });

    // Seleccionar todos
    document.getElementById('selectAll').addEventListener('change', function(e) {
        const checkboxes = document.querySelectorAll('.categoria-checkbox');
        checkboxes.forEach(cb => {
            cb.checked = e.target.checked;
            if (e.target.checked) {
                if (!selectedCategorias.includes(cb.value)) {
                    selectedCategorias.push(cb.value);
                }
            } else {
                selectedCategorias = [];
            }
        });
    });
}

// Cargar categorias
async function cargarCategorias() {
    try {
        mostrarCargadorEsqueleto();

        const perPage = document.getElementById('perPageSelect').value;
        const params = new URLSearchParams({
            page: currentPage,
            per_page: perPage,
            ...currentFilters
        });

        const response = await fetch(`/admin/configuracion/parametros/categorias?${params}`, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json'
            }
        });

        // Manejar sesión expirada o errores de autenticación
        await manejarRespuestaFetch(response);

        if (!response.ok) throw new Error('Error al cargar categorias');

        const data = await response.json();
        renderizarCategorias(data.data);
        renderizarPaginacion(data);
        actualizarIndicadorFiltros();
        
    } catch (error) {
        console.error('Error:', error);
        if (error.message !== 'Sesión expirada' && error.message !== 'No encontrado - Redirigiendo') {
            mostrarToast('Error al cargar categorias', 'error');
        }
    }
}

function renderizarCategorias(categorias) {
    const tbody = document.getElementById('categoriasTableBody');

    if (categorias.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                    No se encontraron categorias  
                </td>
            </tr>
        `;
        return;
    }
    

    // Debug: verificar datos de fotos
    tbody.innerHTML = categorias.map(categoria => `
        <tr class="hover:bg-gray-50 ${selectedCategorias.includes(categoria.id.toString()) ? 'bg-blue-50' : ''}">
            <td class="px-6 py-4">
                <input type="checkbox" class="categoria-checkbox rounded border-gray-300"
                       value="${categoria.id}"
                       ${selectedCategorias.includes(categoria.id.toString()) ? 'checked' : ''}
                       onchange="alternarSeleccionCategoria(${categoria.id})">
            </td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full">
                    ${categoria.nombre}
                </span>
            </td>
            <td class="px-6 py-4" style="max-width: 200px;">
                <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full">
                    ${categoria.descripcion}
                </span>
            </td>
            <td class="px-6 py-4 text-center">
                 <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full">
                    <p style="font-size: 30px;">${categoria.icono}</p>
                </span>
            </td>
            <td class="px-6 py-4 text-sm text-gray-500 text-center">
                <div class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    <span class="text-xs">${categoria.slug}</span>
                </div>
            </td>
            <td class="px-6 py-4 text-center">
                <div class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full">
                    <div style="background-color: ${categoria.color}; width: 20px; height: 20px; border-radius: 50%;"></div>
                </div>
            </td>
            <td class="px-6 py-4 text-center">
                <label class="relative inline-flex items-center cursor-pointer">
                    <input id="check_categoria_${categoria.id}" type="checkbox" class="sr-only peer" ${categoria.activo ? 'checked' : ''} onchange="alternarEstadoCategoria(${categoria.id}, this.checked)">
                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
            </td>
            <td class="px-6 py-4 text-center">
                <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full">
                    ${categoria.tipos_solicitud.length}
                </span>
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
                            <a href="#" onclick="verCategoria(${categoria.id}); return false;" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Ver Detalle</a>
                            <a href="#" onclick="editarCategoria(${categoria.id}); return false;" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Editar</a>
                             <a href="#" onclick="eliminarCategoria(${categoria.id}); return false;" class="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100">Eliminar</a>
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
    document.getElementById('totalCategorias').textContent = data.total || 0;

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
    cargarCategorias();
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
    const tbody = document.getElementById('categoriasTableBody');
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
    cargarCategorias();
}

// Abrir modal de creación de area
function abrirModalCrearCategoria() {
    document.getElementById('modalTitle').textContent = 'Crear Nueva Categoría';
    document.getElementById('categoriaForm').reset();
    document.getElementById('categoriaModal').classList.remove('hidden');
    document.getElementById('submitButton').classList.remove('hidden');
    formChanged = false;

    //cambiar el evento del formulario a POST
    const form = document.getElementById('categoriaForm');
    //form.removeEventListener('submit', manejarEnvioFormularioEditarCategoria);
    form.addEventListener('submit', manejarEnvioFormulario);

    //cambiar el texto del botón
    document.getElementById('submitButton').textContent = 'Guardar Categoría';

    // Limpiar errores
    limpiarTodosLosErrores();

    // Listener para detectar cambios en el formulario
    document.getElementById('categoriaForm').addEventListener('input', function() {
        formChanged = true;
    });
}

function limpiarTodosLosErrores() {
    document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('.error-message').forEach(el => {
        el.classList.add('hidden');
        el.textContent = '';
    });
}

function cerrarModalCategoria() {
    document.getElementById('categoriaModal').classList.add('hidden');
    document.getElementById('nombre').value = '';
    document.getElementById('descripcion').value = '';
    document.getElementById('icono').innerHTML = '';
    document.getElementById('color').value = '#ffffff';
    document.getElementById('activo').checked = false;
    document.getElementById('icono').style.backgroundColor = '#ffffff';
    formChanged = false;
    document.getElementById('submitButton').classList.remove('hidden');
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
        const formData = new FormData();
        // Agregar datos del formulario
        formData.append('nombre', document.getElementById('nombre').value);
        formData.append('descripcion', document.getElementById('descripcion').value);
        formData.append('icono', document.getElementById('icono').innerHTML);
        formData.append('color', document.getElementById('color').value);
        // Agregar activo
        const activo = document.getElementById('activo').checked;
        formData.append('activo', activo ? '1' : '0');

        // Enviar petición
        const response = await fetch('/admin/configuracion/parametros/categorias/guardar', {
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
            mostrarToast('Categoría creada exitosamente', 'success');
            cerrarModalCategoria();

            // Recargar lista de categorías
            setTimeout(() => {
                currentPage = 1;
                cargarCategorias();
            }, 500);

        } else if (response.status === 422) {
            // Errores de validación
            mostrarToast('Por favor corrija los errores en el formulario', 'error');

        } else {
            // Error del servidor
            mostrarToast(data.message || 'Error al crear categoría', 'error');
        }

    } catch (error) {
        mostrarToast(error.message || 'Error al guardar categoría', 'error');

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

    // Validar icono
    const icono = document.getElementById('icono').innerHTML;
    if (icono.trim() === '') {
        mostrarError('icono', 'El icono es obligatorio');
        isValid = false;
    }

    // Validar color
    const color = document.getElementById('color').value;
    if (color === '#ffffff') {
        mostrarError('color', 'El color es obligatorio');
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

const pickerOptions = { 
    categories: ['activity','objects', 'symbols', 'flags', 'nature', 'places'],
    i18n: {
        "search": "Buscar",
        "search_no_results_1": "Vaya!",
        "search_no_results_2": "Ese emoji no se pudo encontrar",
        "pick": "Elige un emoji…",
        "add_custom": "Añadir emoji personalizado",
        "categories": {
          "activity": "Actividades",
          "flags": "Banderas",
          "objects": "Objetos",
          "symbols": "Símbolos",
          "nature": "Animales y Naturaleza",
          "places": "Lugares"
        },
        "skins": {
          "choose": "Elige el tono de piel predeterminado",
          "1": "Sin tono",
          "2": "Claro",
          "3": "Medio-Claro",
          "4": "Medio",
          "5": "Medio-Oscuro",
          "6": "Oscuro"
        }
    },
    onEmojiSelect:function(emoji) {
        document.getElementById('icono').innerHTML = emoji.native;
    }
}
const picker = new EmojiMart.Picker(pickerOptions)
document.getElementById('icono_picker').appendChild(picker)

function cambiarColor(color) {
    document.getElementById('color').value = color;
    document.getElementById('icono').style.backgroundColor = color;
}