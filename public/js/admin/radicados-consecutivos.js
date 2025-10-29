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
    estado_configuracion: '',
};
let selectedTiposSolicitud = [];
let debounceTimer = null;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    cargarTiposSolicitud();
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
            cargarTiposSolicitud();
        }, 500);
    });

    // Filtros
    document.getElementById('filterEstado').addEventListener('change', function(e) {
        currentFilters.estado_configuracion = e.target.value;
        currentPage = 1;
        cargarTiposSolicitud();
    });


    // Items por página
    document.getElementById('perPageSelect').addEventListener('change', function(e) {
        currentPage = 1;
        cargarTiposSolicitud();
    });
}

// Cargar dependencias
async function cargarTiposSolicitud() {
    try {
        mostrarCargadorEsqueleto();

        const perPage = document.getElementById('perPageSelect').value;
        const params = new URLSearchParams({
            page: currentPage,
            per_page: perPage,
            ...currentFilters
        });

        const response = await fetch(`/admin/configuracion/radicados-consecutivos/?${params}`, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json'
            }
        });

        // Manejar sesión expirada o errores de autenticación
        await manejarRespuestaFetch(response);

        if (!response.ok) throw new Error('Error al cargar los tipos de solicitud');

        const data = await response.json();
        renderizarTiposSolicitud(data.data);
        renderizarPaginacion(data);
        actualizarIndicadorFiltros();
        
    } catch (error) {
        console.error('Error:', error);
        if (error.message !== 'Sesión expirada' && error.message !== 'No encontrado - Redirigiendo') {
            mostrarToast('Error al cargar los tipos de solicitud', 'error');
        }
    }
}

function renderizarTiposSolicitud(tiposSolicitud) {
    const tbody = document.getElementById('tiposSolicitudTableBody');

    if (tiposSolicitud.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                    No se encontraron tipos de solicitud  
                </td>
            </tr>
        `;
        return;
    }
    

    // Debug: verificar datos de fotos
    tbody.innerHTML = tiposSolicitud.map(tipoSolicitud => `
        <tr class="hover:bg-gray-50 ${selectedTiposSolicitud.includes(tipoSolicitud.id.toString()) ? 'bg-blue-50' : ''}">
            <td class="px-6 py-4">
                <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full">
                    ${tipoSolicitud.nombre}
                </span>
            </td>
            <td class="px-6 py-4" style="max-width: 200px;">
                <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full">
                    ${tipoSolicitud.categoria.nombre}
                </span>
            </td>
            <td class="px-6 py-4">
                <div class="flex items-center">
                ${tipoSolicitud.activo ? `
                    <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Activo
                    </span>
                ` : `
                    <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        Inactivo
                    </span>
                `}
                </div>
            </td>
            <td class="px-6 py-4 text-sm text-gray-500 text-center">
                <div class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    <span class="text-xs">${tipoSolicitud.codigo}</span>
                </div>
            </td>
            <td class="px-6 py-4 text-center">
            ${tipoSolicitud.configuracion_radicados ? `
                    <div class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Configurado
                    </div>
                ` : `
                    <div class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        -
                    </div>
                `}
            </td>
             <td class="px-6 py-4 text-center" style="text-align: center;">
             ${tipoSolicitud.configuracion_radicados ? `
                <div class="px-2 py-1 inline-flex text-xs leading-5 font-semibold w-5 h-5 bg-green-700 text-green-800" style="border-radius: 50%;">
                    
                </div>
                ` : `
                <div class="px-2 py-1 inline-flex text-xs leading-5 font-semibold w-5 h-5 bg-red-700 text-red-800" style="border-radius: 50%;">
                    
                </div>
                `}
                </div>
            </td>
             <td class="px-6 py-4 text-center">
             ${tipoSolicitud.configuracion_radicados ? `
                <div class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    ${tipoSolicitud.configuracion_radicados.consecutivo}
                </div>
                ` : `
                <div class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                    0
                </div>
                `}
            </td>
             <td class="px-6 py-4 text-center">
                <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full">
                    ${tipoSolicitud.solicitudes_count}
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
                            <a href="#" onclick="verConfiguracionTipoSolicitud(${tipoSolicitud.id}); return false;" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Ver Detalle</a>
                            <a href="#" onclick="editarConfiguracionTipoSolicitud(${tipoSolicitud.id}); return false;" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Editar</a>
                             <a href="#" onclick="eliminarConfiguracionTipoSolicitud(${tipoSolicitud.id}); return false;" class="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100">Eliminar</a>
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
    document.getElementById('totalTiposSolicitud').textContent = data.total || 0;
    document.getElementById('totalTiposSolicitudCard').textContent = data.total || 0;
    document.getElementById('totalTiposSolicitudConfigurados').textContent = data.totalConfigurados || 0;

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
    cargarTiposSolicitud();
}


// Actualizar badge de filtros
function actualizarIndicadorFiltros() {
    let count = 0;
    if (currentFilters.search) count++;
    if (currentFilters.estado_configuracion) count++;
    
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
    const tbody = document.getElementById('tiposSolicitudTableBody');
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
        estado_configuracion: '',
    };

    document.getElementById('searchInput').value = '';
    document.getElementById('filterEstado').value = '';

    currentPage = 1;
    cargarTiposSolicitud();
}

var tipoAbrirModal = "crear";
// Abrir modal de creación
function abrirModalConfigurarRadicado() {
    tipoAbrirModal = "crear";
    document.getElementById('modalTitle').textContent = 'Configurar Radicado';
    document.getElementById('configurarRadicadoForm').reset();
    document.getElementById('configurarRadicadoModal').classList.remove('hidden');
    document.getElementById('ejemploVisualConsecutivoContainer').style.display = 'block';

    //cargar tipos de solicitud
    cargarTiposSolicitudSelect();
    currentTab = 1;
    mostrarTab(currentTab);
}

var tiposSolicitud = [];
var tipoSolicitudSelected = null;
async function cargarTiposSolicitudSelect() {
    const response = await fetch('/admin/configuracion/radicados-consecutivos/tipos-solicitud-select');
    const data = await response.json();
    tiposSolicitud = data;


    var tiposSolicitudSelect = [
        {
            id: 0,
            text: 'Seleccione un tipo de solicitud'
        }
    ];
    data.forEach(tipo => {
        tiposSolicitudSelect.push({
            id: tipo.id,
            text: tipo.configuracion_radicados ? '✅ ' + tipo.nombre : '⚙️ ' + tipo.nombre
        });
    });
    
    $('#tipo_solicitud').val(null).trigger('change'); // limpia la selección
    $('#tipo_solicitud').empty();
    inicializarSelect(tiposSolicitudSelect);
}

async function seleccionarTipoSolicitud(id){
    tipoSolicitudSelected = await tiposSolicitud.find(item => item.id == id);

    if(!tipoSolicitudSelected){
        return;
    }

    if(!tipoSolicitudSelected.configuracion_radicados){
        document.getElementById('nombre_tipo_solicitud').value = tipoSolicitudSelected.nombre;
        document.getElementById('categoria_tipo_solicitud').value = tipoSolicitudSelected.categoria.nombre;
        document.getElementById('descripcion_tipo_solicitud').value = tipoSolicitudSelected.descripcion;
        document.getElementById('area_responsable_tipo_solicitud').value = tipoSolicitudSelected.area_responsable.nombre;
        document.getElementById('total_solicitudes_historicas_tipo_solicitud').value = tipoSolicitudSelected.total_solicitudes_historicas;
        document.getElementById('codigo_tipo_solicitud').value = tipoSolicitudSelected.codigo;
        document.getElementById('codigo_radicado').value = tipoSolicitudSelected.codigo;

        if(tipoSolicitudSelected.total_solicitudes_historicas > 0){
            document.getElementById('mensajeNoConfiguradoTieneSolicitudes').style.display = 'block';
        }else{
            document.getElementById('mensajeNoConfiguradoTieneSolicitudes').style.display = 'none';
        }
    }else{
        if(tipoAbrirModal == "crear"){
            Swal.fire({
                title: 'Tipo de solicitud configurado',
                text: 'El tipo de solicitud ya tiene una configuración de radicado',
                icon: 'warning',
                confirmButtonText: 'Aceptar'
            });
        }
    }
}



function inicializarSelect(datos) {
    $('#tipo_solicitud').select2({
        placeholder: 'Seleccione una opción',
        data: datos,
        allowClear: true
    });
}


// Cerrar modal con confirmación
async function cerrarModalConConfirmacion() {
        const confirmado = await Swal.fire({
            title: '¿Descartar cambios?',
            text: '¿Estás seguro de que deseas salir?',
            confirmButtonText: 'Sí, descartar',
            cancelButtonText: 'Continuar editando',
            showCancelButton: true,
            showConfirmButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#2563eb'
        }).then((result) => {
            if (result.isConfirmed) {
                return true;
            }
            return false;
        });

        if (confirmado) {
            cerrarModal();
        }
}

function cerrarModal() {
    document.getElementById('configurarRadicadoModal').classList.add('hidden');
    formChanged = false;
    currentTab = 1;

    // limpiar paso 1
    document.getElementById('nombre_tipo_solicitud').value = '';
    document.getElementById('categoria_tipo_solicitud').value = '';
    document.getElementById('descripcion_tipo_solicitud').value = '';
    document.getElementById('area_responsable_tipo_solicitud').value = '';
    document.getElementById('total_solicitudes_historicas_tipo_solicitud').value = '';
    document.getElementById('codigo_tipo_solicitud').value = '';
    document.getElementById('codigo_radicado').value = '';
    document.getElementById('mensajeNoConfiguradoTieneSolicitudes').style.display = 'none';

    //limpiar paso 2
    document.getElementById('separador').value = "-";
    document.getElementById('separador_personalizado_container').style.display = 'none';
    document.getElementById('separador_personalizado').value = '';
    document.getElementById('agregar_ano_a_vista_previa_radicado').checked = true;
    document.getElementById('numero_digitos_ano').value = '4';
    document.getElementById('numero_digitos_ano_container').style.display = 'block';
    document.getElementById('agregar_mes_a_vista_previa_radicado').checked = true;
    document.getElementById('numero_digitos_mes').value = '2';
    document.getElementById('numero_digitos_mes_container').style.display = 'block';
    document.getElementById('cantidad_digitos_consecutivo').value = '5';
    document.getElementById('numero_inicial_consecutivo').value = '1';
    document.getElementById('reiniciar_consecutivo_cada').value = 'ano';

    document.getElementById('ejemploVisualConsecutivoContainer').style.display = 'none';

    cambiarReiniciarConsecutivoCada();
    limpiarTodosLosErrores();
    tipoSolicitudSelected = null;
    separador_seleccionado = "-";
}


// Variables globales
let currentTab = 1;
let formChanged = false;
let selectedTipoSolicitud = null;

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
    } else if (tabNumber === 2) {
        prevButton.classList.remove('hidden');
        nextButton.classList.add('hidden');
        submitButton.classList.remove('hidden');

        //generar vista previa del radicado
        generarVistaPreviaRadicado();
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
        if(!tipoSolicitudSelected){
            mostrarError('tipo_solicitud', 'Debe seleccionar un tipo de solicitud');
            isValid = false;
        }
    } else if (currentTab === 2) {
        // Validar Información Laboral
        
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

function limpiarTodosLosErrores() {
    document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('.error-message').forEach(el => {
        el.classList.add('hidden');
        el.textContent = '';
    });
}

var separador_seleccionado = "-";
var valores_para_vista_previa_radicado = [];
var vista_previa_radicado = "";
function cambiarSeparador(separador) {
    separador_seleccionado = separador;

    if(separador == "custom"){
        document.getElementById('separador_personalizado_container').style.display = 'block';
    }else{
        document.getElementById('separador_personalizado_container').style.display = 'none';
        document.getElementById('separador_personalizado').value = '';
        limpiarTodosLosErrores();
        generarVistaPreviaRadicado();
    }
}

function cambiarSeparadorPersonalizado(separador) {
    separador_seleccionado = separador;
    //validar que no sea espacio en blanco 
    if(separador.trim() == ""){
        mostrarError('separador_personalizado', 'El separador personalizado no puede ser espacio en blanco');
        return;
    }else{
        limpiarTodosLosErrores();
        generarVistaPreviaRadicado();
    }
}

function generarVistaPreviaRadicado() {
    limpiarTodosLosErrores();
    valores_para_vista_previa_radicado = [];
    //agregar el codigo del tipo de solicitud
    valores_para_vista_previa_radicado.push(tipoSolicitudSelected.codigo);

    //agregar el año si esta marcado
    if(document.getElementById('agregar_ano_a_vista_previa_radicado').checked){
        if(document.getElementById('numero_digitos_ano').value == 2){
            valores_para_vista_previa_radicado.push(new Date().getFullYear().toString().slice(-2));
        }else{
            valores_para_vista_previa_radicado.push(new Date().getFullYear().toString());
        }
    }

    //agregar el mes si esta marcado
    if(document.getElementById('agregar_mes_a_vista_previa_radicado').checked){
        if(document.getElementById('numero_digitos_mes').value == 1){
            valores_para_vista_previa_radicado.push('5');
        }else{
            valores_para_vista_previa_radicado.push('05');
        }
    }

    // agregar consecutivo
    var numero_digitos_consecutivo = document.getElementById('cantidad_digitos_consecutivo').value;
    var numero_caracteres_consecutivo = document.getElementById('numero_inicial_consecutivo').value.length;
    var numero_ceros_consecutivo = numero_digitos_consecutivo - numero_caracteres_consecutivo;


    if(numero_ceros_consecutivo < 0){
        mostrarError('numero_inicial_consecutivo', 'El tamaño del número inicial del consecutivo no puede ser mayor al número de dígitos del consecutivo');
    } else if(numero_caracteres_consecutivo == 0 || document.getElementById('numero_inicial_consecutivo').value == '0'){
        mostrarError('numero_inicial_consecutivo', 'El número inicial del consecutivo no puede ser cero o estar vacío');
    } else if(parseInt(document.getElementById('numero_inicial_consecutivo').value) < 0){
        mostrarError('numero_inicial_consecutivo', 'El número inicial del consecutivo no puede ser menor a 0');
    }
    else{
        var consecutivo = '0'.repeat(numero_ceros_consecutivo) + document.getElementById('numero_inicial_consecutivo').value;
        document.getElementById('numero_inicial_consecutivo_valor').textContent = document.getElementById('numero_inicial_consecutivo').value;
        document.getElementById('numero_de_solicitudes_podran_registrar').textContent = '9'.repeat(numero_digitos_consecutivo) - parseInt(document.getElementById('numero_inicial_consecutivo').value);
        valores_para_vista_previa_radicado.push(consecutivo);
    }

    vista_previa_radicado = valores_para_vista_previa_radicado.join(separador_seleccionado);
    document.getElementById('vista_previa_radicado').value = vista_previa_radicado;
}

function cambiarAgregarAnoAVistaPreviaRadicado() {
    if(document.getElementById('agregar_ano_a_vista_previa_radicado').checked){
        document.getElementById('numero_digitos_ano_container').style.display = 'block';
        generarVistaPreviaRadicado();
        cambiarReiniciarConsecutivoCada();
    }else{
        document.getElementById('numero_digitos_ano_container').style.display = 'none';

        Swal.fire({
            title: '¿Desea quitar el año del radicado?',
            html: `<div class="message-error bg-red-100 p-2 rounded-md" style="text-align: left;">
                <h3 class="font-bold text-red-500">
                    Sin año, el consecutivo debe ser único permanentemente
                </h3>
                <br>
                <h3 class="font-bold text-red-500">
                    Se recomienda usar más de 4 dígitos en el consecutivo para evitar que se repita el consecutivo.
                </h3>
            </div>`,
            confirmButtonText: 'Sí, quitar',
            cancelButtonText: 'No, cancelar',
            showCancelButton: true,
            showConfirmButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#2563eb'
        }).then((result) => {
            if (result.isConfirmed) {
                document.getElementById('agregar_ano_a_vista_previa_radicado').checked = false;
                document.getElementById('numero_digitos_ano_container').style.display = 'none';
                generarVistaPreviaRadicado();
                cambiarReiniciarConsecutivoCada();
            }else{
                document.getElementById('agregar_ano_a_vista_previa_radicado').checked = true;
                document.getElementById('numero_digitos_ano_container').style.display = 'block';
            }
        });
    }
}

function cambiarAgregarMesAVistaPreviaRadicado() {
    if(document.getElementById('agregar_mes_a_vista_previa_radicado').checked){
        document.getElementById('numero_digitos_mes_container').style.display = 'block';
    }else{
        document.getElementById('numero_digitos_mes_container').style.display = 'none';
    }

    generarVistaPreviaRadicado();
    cambiarReiniciarConsecutivoCada();
}

function cambiarReiniciarConsecutivoCada() {
    limpiarTodosLosErrores();
    var valor = document.getElementById('reiniciar_consecutivo_cada').value;
    var checkbox_ano = document.getElementById('agregar_ano_a_vista_previa_radicado');
    var checkbox_mes = document.getElementById('agregar_mes_a_vista_previa_radicado');

    var ejemploVisualConsecutivo = document.getElementById('ejemploVisualConsecutivo');
    var texto_ejemplo_visual_consecutivo = "";
    if(valor == 'ano'){
        if(checkbox_ano.checked){
            texto_ejemplo_visual_consecutivo = "31 Dic 2025: LIC-CONS-2025-00999 <br> 01 Ene 2026: LIC-CONS-2026-00001 ← Reinición del consecutivo";
        }else{
            mostrarError('reiniciar_consecutivo_cada', 'para reiniciar el consecutivo cada año, debe seleccionar la opción de agregar el año al radicado');
        }
    }else if(valor == 'mes'){
        if(checkbox_mes.checked){
            texto_ejemplo_visual_consecutivo = "31 Ene 2025: LIC-CONS-2025-01-00999 <br> 01 Feb 2025: LIC-CONS-2025-02-00001 ← Reinición del consecutivo";
        }else{
            mostrarError('reiniciar_consecutivo_cada', 'para reiniciar el consecutivo cada mes, debe seleccionar la opción de agregar el mes al radicado');
        }
    } else if(valor == 'nunca'){
        texto_ejemplo_visual_consecutivo = "⚠️ Asegúrese de elegir suficientes dígitos, ya que el consecutivo nunca se reiniciara, continúa indefinidamente <br><br> LIC-CONS-2025-00001 <br> ....... <br> LIC-CONS-2025-00003 <br> ....... <br> LIC-CONS-2025-00999";
    }

    ejemploVisualConsecutivo.innerHTML = texto_ejemplo_visual_consecutivo;
}


function guardarTipoSolicitud(e) {
    limpiarTodosLosErrores();
    e.preventDefault();
    if(validarTipoSolicitud()){
        guardarConfiguracionRadicado();
    }
}


function validarTipoSolicitud() {
    let isValid = true;

    var errores = "<div class='message-error bg-red-100 p-2 rounded-md text-red-500' style='text-align: left;'><ul class='list-disc list-inside'>";

    if(document.getElementById('separador').value == "custom"){
        if(document.getElementById('separador_personalizado').value.trim() == ""){
            errores += "<li>El separador personalizado no puede ser espacio en blanco</li>";
            mostrarError('separador_personalizado', 'El separador personalizado no puede ser espacio en blanco');
            isValid = false;
        }
    }

    //validar el consecutivo
    var numero_digitos_consecutivo = document.getElementById('cantidad_digitos_consecutivo').value;
    var numero_caracteres_consecutivo = document.getElementById('numero_inicial_consecutivo').value.length;
    var numero_ceros_consecutivo = numero_digitos_consecutivo - numero_caracteres_consecutivo;


    if(numero_ceros_consecutivo < 0){
        errores += "<li>El tamaño del número inicial del consecutivo no puede ser mayor al número de dígitos del consecutivo</li>";
        mostrarError('numero_inicial_consecutivo', 'El tamaño del número inicial del consecutivo no puede ser mayor al número de dígitos del consecutivo');
        isValid = false;
    } else if(numero_caracteres_consecutivo == 0 || document.getElementById('numero_inicial_consecutivo').value == '0'){
        errores += "<li>El número inicial del consecutivo no puede ser cero o estar vacío</li>";
        mostrarError('numero_inicial_consecutivo', 'El número inicial del consecutivo no puede ser cero o estar vacío');
        isValid = false;
    } else if(parseInt(document.getElementById('numero_inicial_consecutivo').value) < 0){
        errores += "<li>El número inicial del consecutivo no puede ser menor a 0</li>";
        mostrarError('numero_inicial_consecutivo', 'El número inicial del consecutivo no puede ser menor a 0');
        isValid = false;
    }

    // validar el reiniciar consecutivo cada
    var valor = document.getElementById('reiniciar_consecutivo_cada').value;
    var checkbox_ano = document.getElementById('agregar_ano_a_vista_previa_radicado');
    var checkbox_mes = document.getElementById('agregar_mes_a_vista_previa_radicado');

    if(valor == 'ano'){
        if(checkbox_ano.checked == false){
            errores += "<li>Para reiniciar el consecutivo cada año, debe seleccionar la opción de agregar el año al radicado</li>";
            mostrarError('reiniciar_consecutivo_cada', 'Para reiniciar el consecutivo cada año, debe seleccionar la opción de agregar el año al radicado');
            isValid = false;
        }
    }else if(valor == 'mes'){
        if(checkbox_mes.checked == false){
            errores += "<li>Para reiniciar el consecutivo cada mes, debe seleccionar la opción de agregar el mes al radicado</li>";
            mostrarError('reiniciar_consecutivo_cada', 'Para reiniciar el consecutivo cada mes, debe seleccionar la opción de agregar el mes al radicado');
            isValid = false;
        }
    } else if(valor == 'nunca'){
        if(numero_ceros_consecutivo < 5){
            errores += "<li>Asegúrese de elegir suficientes dígitos, ya que el consecutivo nunca se reiniciara, continúa indefinidamente</li>";
            mostrarError('reiniciar_consecutivo_cada', 'Asegúrese de elegir suficientes dígitos, ya que el consecutivo nunca se reiniciara, continúa indefinidamente');
            isValid = false;
        }
    }

    errores += "</ul></div>";

    if(!isValid){
        Swal.fire({
            title: 'Corrija los siguientes errores',
            html: errores,
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });
    }

    return isValid;
}

async function guardarConfiguracionRadicado() {

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
        formData.append('tipo_solicitud_id', tipoSolicitudSelected.id);
        formData.append('codigo', tipoSolicitudSelected.codigo);
        formData.append('incluir_anio', document.getElementById('agregar_ano_a_vista_previa_radicado').checked ? 1 : 0);
        if(document.getElementById('agregar_ano_a_vista_previa_radicado').checked){
            formData.append('formato_anio', document.getElementById('numero_digitos_ano').value);
        }else{
            formData.append('formato_anio', 0);
        }
        formData.append('incluir_mes', document.getElementById('agregar_mes_a_vista_previa_radicado').checked ? 1 : 0);
        if(document.getElementById('agregar_mes_a_vista_previa_radicado').checked){
            formData.append('formato_mes', document.getElementById('numero_digitos_mes').value);
        }else{
            formData.append('formato_mes', 0);
        }
        formData.append('longitud_consecutivo', document.getElementById('cantidad_digitos_consecutivo').value);
        formData.append('separador', document.getElementById('separador').value);
        formData.append('separador_personalizado', document.getElementById('separador_personalizado').value);
        formData.append('reiniciar_por', document.getElementById('reiniciar_consecutivo_cada').value);
        formData.append('numero_inicial', document.getElementById('numero_inicial_consecutivo').value);

        // Enviar petición
        const response = await fetch('/admin/configuracion/radicados-consecutivos/guardar', {
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
            cerrarModal();

            // Recargar lista de categorías
            setTimeout(() => {
                cargarTiposSolicitud();
            }, 500);

        } else if (response.status === 422) {
            // Errores de validación
            mostrarToast('Por favor corrija los errores en el formulario', 'error');

        } else {
            // Error del servidor
            mostrarToast(data.message || 'Error al guardar configuración del radicado', 'error');
        }

    } catch (error) {
        mostrarToast(error.message || 'Error al guardar configuración del radicado', 'error');

    } finally {
        // Restaurar botón
        submitButton.disabled = false;
        submitButton.classList.remove('loading');
        submitButton.innerHTML = originalText;
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