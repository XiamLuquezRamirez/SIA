// ========================================
// PLANTILLAS DE DOCUMENTOS - JavaScript
// ========================================

let plantillas = [];
let plantillasFiltradas = [];
let vistaActual = "cards"; // 'cards' o 'lista'
let archivoImportar = null;
let paginaActual = 1;
let filtrosActuales = {
    search: "",
    tipo: "",
    estado: "",
};

// ========================================
// INICIALIZACIÓN
// ========================================
document.addEventListener("DOMContentLoaded", function () {
    cargarPlantillas();
    configurarEventListeners();
});

// ========================================
// CARGAR PLANTILLAS
// ========================================
async function cargarPlantillas() {
    try {
        mostrarLoader();

        const perPageSelect = document.getElementById("perPageSelect");
        const perPage = perPageSelect ? perPageSelect.value : 6;
        const params = new URLSearchParams({
            page: paginaActual,
            per_page: perPage,
            ...filtrosActuales,
        });

        const response = await fetch(
            `/admin/api/configuracion/plantillas-documentos?${params}`,
            {
                headers: {
                    Accept: "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                    "X-CSRF-TOKEN":
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute("content") || "",
                },
            }
        );

        if (!response.ok) {
            throw new Error("Error al cargar plantillas");
        }

        const data = await response.json();

        const permissions = data.permissions;
        window.userPermissions = permissions;

        // Si viene con paginación
        if (data.plantillas && data.plantillas.data) {
            plantillas = data.plantillas.data;
            plantillasFiltradas = plantillas;
            renderizarPlantillas();
            renderizarPaginacion(data.plantillas);
        } else {
            // Formato antiguo sin paginación
            plantillas = data.plantillas || data.data || data;
            plantillasFiltradas = plantillas;
            renderizarPlantillas();
        }

        actualizarEstadisticas();
    } catch (error) {
        console.error("Error:", error);
        Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudieron cargar las plantillas",
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

    if (vistaActual === "cards") {
        renderizarCards();
    } else {
        renderizarLista();
    }
}

function renderizarCards() {
    const grid = document.getElementById("plantillasGrid");
    grid.classList.remove("hidden");
    document.getElementById("plantillasLista").classList.add("hidden");

    grid.innerHTML = plantillasFiltradas
        .map((plantilla) => createCardHTML(plantilla))
        .join("");
}

function renderizarLista() {
    document.getElementById("plantillasGrid").classList.add("hidden");
    const lista = document.getElementById("plantillasLista");
    lista.classList.remove("hidden");

    const tbody = document.getElementById("plantillasListaBody");
    tbody.innerHTML = plantillasFiltradas
        .map((plantilla) => createRowHTML(plantilla))
        .join("");
}

function createCardHTML(plantilla) {
    const tipoClases = {
        certificado: "certificado",
        concepto: "concepto",
        acta: "acta",
        oficio: "oficio",
    };

    const tipoNombres = {
        certificado: "Certificado",
        concepto: "Concepto",
        acta: "Acta",
        oficio: "Oficio",
    };

    const variables = plantilla.variables_usadas || [];
    const variablesHTML = variables
        .slice(0, 3)
        .map((v) => `<span class="variable-badge">${v}</span>`)
        .join("");

    const masVariables =
        variables.length > 3
            ? `<span class="text-xs text-gray-500">+${
                  variables.length - 3
              } más</span>`
            : "";

    return `
        <div class="plantilla-card ${
            !plantilla.activo ? "inactiva" : ""
        } fade-in">
            <div class="plantilla-header">
                <div class="flex-1">
                    <h3 class="plantilla-nombre text-truncate">${
                        plantilla.nombre
                    }</h3>
                    <span class="plantilla-tipo ${
                        tipoClases[plantilla.tipo_documento]
                    }">
                        ${tipoNombres[plantilla.tipo_documento]}
                    </span>
                </div>
                <div style="position: relative; display: inline-block;">
                    <button onclick="toggleMenuPlantilla(event, ${
                        plantilla.id
                    })" class="text-gray-400 hover:text-gray-600 p-1" style="display: inline-flex; align-items: center; justify-content: center;">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path>
                        </svg>
                    </button>
                    <div id="menu-${
                        plantilla.id
                    }" class="hidden" style="position: absolute; right: 0; top: 100%; margin-top: 0.5rem; width: 12rem; border-radius: 0.375rem; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); background-color: white; border: 1px solid rgba(0, 0, 0, 0.05); z-index: 9999;">
                        <div style="padding: 0.25rem 0;">
                            ${window.userPermissions.canEdit ? `
                                <a href="#" onclick="cerrarTodosLosMenus(); editarPlantilla(${
                                    plantilla.id
                                }); return false;" class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                </svg>
                                Editar Información
                            </a>
                            ` : ''}
                            ${window.userPermissions.canDuplicate ? `
                            <a href="#" onclick="event.stopPropagation(); cerrarTodosLosMenus(); duplicarPlantilla(${
                                plantilla.id
                            }); return false;" class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                                </svg>
                                Duplicar
                            </a>
                            ` : ''}
                            ${window.userPermissions.canActivate ? `
                            <a href="#" onclick="event.stopPropagation(); cerrarTodosLosMenus(); toggleEstadoPlantilla(${
                                plantilla.id
                            }); return false;" class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${
                                        plantilla.activo
                                            ? "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                                            : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    }"></path>
                                </svg>
                                ${plantilla.activo ? "Desactivar" : "Activar"}
                            </a>
                            ` : ''}
                            ${window.userPermissions.canDelete ? `
                           
                            <a href="#" onclick="event.stopPropagation(); cerrarTodosLosMenus(); eliminarPlantilla(${
                                plantilla.id
                            }); return false;" style="display: flex; align-items: center; padding: 0.5rem 1rem; font-size: 0.875rem; color: #dc2626; text-decoration: none;" onmouseover="this.style.backgroundColor='#f3f4f6'" onmouseout="this.style.backgroundColor='transparent'">
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

            ${
                plantilla.descripcion
                    ? `
                <p class="plantilla-descripcion">${plantilla.descripcion}</p>
            `
                    : ""
            }

            ${
                variables.length > 0
                    ? `
                <div class="plantilla-variables">
                    ${variablesHTML}
                    ${masVariables}
                </div>
            `
                    : ""
            }
     <!-- Toggle Estado -->
                <div class="flex items-center justify-between py-3 border-t border-b border-gray-200 mb-4">
                    <span class="text-sm font-medium text-gray-700">Estado:</span>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input id="toggle-estado-${
                            plantilla.id
                        }" type="checkbox" class="sr-only peer" ${
        plantilla.activo ? "checked" : ""
    }
                        onchange="alternarEstadoPlantilla(${
                            plantilla.id
                        }, this.checked)">
                        <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        <span id="estado-${
                            plantilla.id
                        }" class="ml-3 text-sm font-medium ${
        plantilla.activo ? "text-green-600" : "text-gray-400"
    }">
                            ${plantilla.activo ? "Activada" : "Desactivada"}
                        </span>
                    </label>
                </div>
            <div class="plantilla-meta">
           
                <div class="plantilla-meta-item">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    Usado en ${plantilla.tipos_solicitud_count || 0} tipo(s)
                </div>
                <div class="plantilla-meta-item">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                    </svg>
                    ${variables.length} variables
                </div>
            </div>

            <div class="plantilla-actions" style="position: relative;">
                ${window.userPermissions.canVer ? `
                <button onclick="verPlantilla(${
                    plantilla.id
                })" class="plantilla-btn btn-primary">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                    Vista Previa
                </button>
                ` : ''}
            </div>
        </div>
    `;
}

function createRowHTML(plantilla) {
    const tipoNombres = {
        certificado: "Certificado",
        concepto: "Concepto",
        acta: "Acta",
        oficio: "Oficio",
    };

    const variables = plantilla.variables_usadas || [];

    return `
        <tr class="${!plantilla.activo ? "bg-gray-50" : ""}" data-plantilla-id="${plantilla.id}">
            <td class="px-6 py-4">
                <div class="font-medium text-gray-900">${plantilla.nombre}</div>
                ${
                    plantilla.descripcion
                        ? `<div class="text-sm text-gray-500 text-truncate">${plantilla.descripcion}</div>`
                        : ""
                }
            </td>
            <td class="px-6 py-4">
                <span class="plantilla-tipo ${plantilla.tipo_documento}">
                    ${tipoNombres[plantilla.tipo_documento]}
                </span>
            </td>
            <td class="px-6 py-4">
                <label class="relative inline-flex items-center cursor-pointer">
                    <input id="toggle-estado-${
                        plantilla.id
                    }" type="checkbox" class="sr-only peer" ${
        plantilla.activo ? "checked" : ""
    }
                    onchange="alternarEstadoPlantilla(${
                        plantilla.id
                    }, this.checked)">
                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    <span id="estado-${
                        plantilla.id
                    }" class="ml-3 text-sm font-medium ${
        plantilla.activo ? "text-green-600" : "text-gray-400"
    }">
                        ${plantilla.activo ? "Activada" : "Desactivada"}
                    </span>
                </label>
            </td>
            <td class="px-6 py-4 text-sm text-gray-500">
                ${variables.length} variables
            </td>
            <td class="px-6 py-4 text-sm text-gray-500">
                ${plantilla.tipos_solicitud_count || 0} tipo(s)
            </td>
            <td class="px-6 py-4 text-sm font-medium space-x-2">
                <button onclick="verPlantilla(${
                    plantilla.id
                })" class="text-blue-600 hover:text-blue-900">Ver</button>
                <button onclick="editarPlantilla(${
                    plantilla.id
                })" class="text-indigo-600 hover:text-indigo-900">Editar</button>
                <button onclick="eliminarPlantilla(${
                    plantilla.id
                })" class="text-red-600 hover:text-red-900">Eliminar</button>
            </td>
        </tr>
    `;
}

// ========================================
// FILTROS
// ========================================
function aplicarFiltros() {
    filtrosActuales.search =
        document.getElementById("searchInput")?.value || "";
    filtrosActuales.tipo = document.getElementById("filterTipo")?.value || "";
    filtrosActuales.estado =
        document.getElementById("filterEstado")?.value || "";

    paginaActual = 1; // Reset a la primera página
    cargarPlantillas();
}

function configurarEventListeners() {
    // Filtros con debounce para búsqueda
    const searchInput = document.getElementById("searchInput");
    const filterTipo = document.getElementById("filterTipo");
    const filterEstado = document.getElementById("filterEstado");

    let searchTimeout;
    if (searchInput) {
        searchInput.addEventListener("input", function () {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                aplicarFiltros();
            }, 500);
        });
    }
    if (filterTipo) filterTipo.addEventListener("change", aplicarFiltros);
    if (filterEstado) filterEstado.addEventListener("change", aplicarFiltros);

    // Items por página
    const perPageSelect = document.getElementById("perPageSelect");
    if (perPageSelect) {
        perPageSelect.addEventListener("change", function (e) {
            paginaActual = 1;
            cargarPlantillas();
        });
    }

    // Cerrar dropdown al hacer clic fuera
    document.addEventListener("click", function (e) {
        if (
            !e.target.closest('[id^="menu-"]') &&
            !e.target.closest('button[onclick^="toggleMenuPlantilla"]')
        ) {
            cerrarTodosLosMenus();
        }
    });
}

// ========================================
// CAMBIAR VISTA
// ========================================
function cambiarVista(vista) {
    vistaActual = vista;

    const btnCards = document.getElementById("vistaCards");
    const btnLista = document.getElementById("vistaLista");

    // Solo actualizar botones si existen
    if (btnCards && btnLista) {
        if (vista === "cards") {
            btnCards.classList.remove("bg-gray-200", "text-gray-700");
            btnCards.classList.add("bg-blue-600", "text-white");
            btnLista.classList.remove("bg-blue-600", "text-white");
            btnLista.classList.add("bg-gray-200", "text-gray-700");
        } else {
            btnLista.classList.remove("bg-gray-200", "text-gray-700");
            btnLista.classList.add("bg-blue-600", "text-white");
            btnCards.classList.remove("bg-blue-600", "text-white");
            btnCards.classList.add("bg-gray-200", "text-gray-700");
        }
    }

    renderizarPlantillas();
}

// ========================================
// ESTADÍSTICAS
// ========================================
function actualizarEstadisticas() {
    const total = plantillas.length;
    const activas = plantillas.filter((p) => p.activo).length;
    const certificados = plantillas.filter(
        (p) => p.tipo_documento === "certificado"
    ).length;
    const generados = plantillas.reduce(
        (sum, p) => sum + (p.veces_usado || 0),
        0
    );

    // Solo actualizar si los elementos existen
    const statTotal = document.getElementById("stat-total");
    const statActivas = document.getElementById("stat-activas");
    const statCertificados = document.getElementById("stat-certificados");
    const statGenerados = document.getElementById("stat-generados");

    if (statTotal) statTotal.textContent = total;
    if (statActivas) statActivas.textContent = activas;
    if (statCertificados) statCertificados.textContent = certificados;
    if (statGenerados) statGenerados.textContent = generados;
}

// ========================================
// ACCIONES DE PLANTILLA
// ========================================
function abrirModalNuevaPlantilla() {
    const modal = document.getElementById("modalCrearPlantilla");
    if (modal) {
        // Resetear ID de edición
        plantillaIdEnEdicion = null;

        // Cambiar título del modal
        const tituloModal = modal.querySelector("h3");
        if (tituloModal) {
            tituloModal.textContent = "Crear Plantilla de Documento";
        }

        modal.classList.remove("hidden");
        limpiarFormularioPlantilla();
        cargarCamposPersonalizados(); // Cargar campos personalizados dinámicamente
        inicializarEditores();
    }
}

function cerrarModalPlantilla() {
    const modal = document.getElementById("modalCrearPlantilla");
    if (modal) {
        modal.classList.add("hidden");
        destruirEditores();

        // Resetear ID de edición
        plantillaIdEnEdicion = null;

        // Restaurar título del modal
        const tituloModal = modal.querySelector("h3");
        if (tituloModal) {
            tituloModal.textContent = "Crear Plantilla de Documento";
        }
    }
}

function limpiarFormularioPlantilla() {
    const form = document.getElementById("formPlantilla");
    if (form) {
        form.reset();
    }
}

let plantillaIdEnEdicion = null; // Variable para saber si estamos editando

async function editarPlantilla(id) {
    try {
        // Cargar datos de la plantilla
        const response = await fetch(
            `/admin/api/configuracion/plantillas-documentos/${id}`
        );
        if (!response.ok) throw new Error("Error al cargar plantilla");

        const data = await response.json();
        const plantilla = data.plantilla;

        // Guardar ID para la actualización
        plantillaIdEnEdicion = id;

        // Abrir modal
        const modal = document.getElementById("modalCrearPlantilla");
        if (modal) {
            // Cambiar título del modal
            const tituloModal = modal.querySelector("h3");
            if (tituloModal) {
                tituloModal.textContent = "Editar Plantilla de Documento";
            }

            // Cargar datos en el formulario
            document.getElementById("nombrePlantilla").value =
                plantilla.nombre || "";
            document.getElementById("tipoDocumento").value =
                plantilla.tipo_documento || "";
            document.getElementById("descripcionPlantilla").value =
                plantilla.descripcion || "";

            // Configuración de página
            const orientacionRadios = document.querySelectorAll(
                'input[name="orientacion"]'
            );
            orientacionRadios.forEach((radio) => {
                radio.checked = radio.value === plantilla.orientacion;
            });

            document.querySelector('select[name="tamano_pagina"]').value =
                plantilla.tamano_pagina || "carta";
            document.querySelector('input[name="margen_superior"]').value =
                plantilla.margen_superior || 25;
            document.querySelector('input[name="margen_inferior"]').value =
                plantilla.margen_inferior || 25;
            document.querySelector('input[name="margen_izquierdo"]').value =
                plantilla.margen_izquierdo || 25;
            document.querySelector('input[name="margen_derecho"]').value =
                plantilla.margen_derecho || 25;

            modal.classList.remove("hidden");

            // Cargar campos personalizados
            cargarCamposPersonalizados();

            // Inicializar editores y cargar contenido
            inicializarEditores();

            // Esperar a que los editores estén listos y cargar contenido
            setTimeout(() => {
                if (typeof tinymce !== "undefined") {
                    const editorContenido = tinymce.get("contenidoHTML");
                    const editorEncabezado = tinymce.get("encabezadoHTML");
                    const editorPie = tinymce.get("piePaginaHTML");

                    if (editorContenido)
                        editorContenido.setContent(
                            plantilla.contenido_html || ""
                        );
                    if (editorEncabezado)
                        editorEncabezado.setContent(
                            plantilla.encabezado_html || ""
                        );
                    if (editorPie)
                        editorPie.setContent(plantilla.pie_pagina_html || "");
                }
            }, 500);
        }
    } catch (error) {
        console.error("Error:", error);
        Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudo cargar la plantilla para editar",
        });
    }
}

async function verPlantilla(id) {
    try {
        const response = await fetch(
            `/admin/api/configuracion/plantillas-documentos/${id}/preview`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": document.querySelector(
                        'meta[name="csrf-token"]'
                    ).content,
                },
            }
        );

        if (!response.ok) throw new Error("Error al generar vista previa");

        const data = await response.json();

        // Mostrar modal de preview
        const modal = document.getElementById("modalPreviewPDF");
        const content = document.getElementById("preview-pdf-content");
        const nombre = document.getElementById("preview-plantilla-nombre");

        if (modal && content && nombre) {
            const plantilla = plantillas.find((p) => p.id === id);
            if (plantilla) {
                nombre.textContent = plantilla.nombre;
            }
            content.innerHTML = data.html;
            modal.classList.remove("hidden");
        }
    } catch (error) {
        console.error("Error:", error);
        Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudo generar la vista previa",
        });
    }
}

function cerrarModalPreviewPDF() {
    const modal = document.getElementById("modalPreviewPDF");
    if (modal) modal.classList.add("hidden");
}

async function descargarPDFPreview() {
    // TODO: Implementar descarga de PDF
    Swal.fire({
        icon: "info",
        title: "Próximamente",
        text: "La descarga de PDF estará disponible próximamente",
    });
}

async function duplicarPlantilla(id) {
    const plantilla = plantillas.find((p) => p.id === id);

    const { value: nombre } = await Swal.fire({
        title: "Duplicar Plantilla",
        html: `
            <p class="text-sm text-gray-600 mb-4">Se creará una copia de "${plantilla.nombre}"</p>
            <input id="swal-nombre" class="swal2-input" placeholder="Nombre de la nueva plantilla" value="${plantilla.nombre} (Copia)">
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: "Duplicar",
        cancelButtonText: "Cancelar",
        preConfirm: () => {
            return document.getElementById("swal-nombre").value;
        },
    });

    if (nombre) {
        try {
            const response = await fetch(
                `/admin/api/configuracion/plantillas-documentos/${id}/duplicar`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRF-TOKEN": document.querySelector(
                            'meta[name="csrf-token"]'
                        ).content,
                    },
                    body: JSON.stringify({ nuevo_nombre: nombre }),
                }
            );

            if (!response.ok) throw new Error("Error al duplicar");

            const data = await response.json();

            Swal.fire({
                icon: "success",
                title: "Plantilla Duplicada",
                text: data.message,
            });

            cargarPlantillas();
        } catch (error) {
            console.error("Error:", error);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "No se pudo duplicar la plantilla",
            });
        }
    }
}

async function toggleEstadoPlantilla(id) {
    try {
        const response = await fetch(
            `/admin/api/configuracion/plantillas-documentos/${id}/toggle`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": document.querySelector(
                        'meta[name="csrf-token"]'
                    ).content,
                },
            }
        );

        if (!response.ok) throw new Error("Error al cambiar estado");

        const data = await response.json();

        Swal.fire({
            icon: "success",
            title: "Estado Actualizado",
            text: data.message,
            timer: 2000,
            showConfirmButton: false,
        });

        cargarPlantillas();
    } catch (error) {
        console.error("Error:", error);
        Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudo cambiar el estado",
        });
    }
}

async function alternarEstadoPlantilla(id, nuevoEstado) {
    try {
        // Actualizar UI inmediatamente para feedback rápido
        const toggleCheckbox = document.getElementById(`toggle-estado-${id}`);
        const estadoTexto = document.getElementById(`estado-${id}`);
        
        const response = await fetch(
            `/admin/api/configuracion/plantillas-documentos/${id}/toggle`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": document.querySelector(
                        'meta[name="csrf-token"]'
                    ).content,
                },
            }
        );

        if (!response.ok) {
            // Revertir el cambio si hay error
            if (toggleCheckbox) {
                toggleCheckbox.checked = !nuevoEstado;
            }
            throw new Error("Error al cambiar estado");
        }

        const data = await response.json();

        // Actualizar el texto y color del estado
        if (estadoTexto) {
            estadoTexto.textContent = nuevoEstado ? "Activada" : "Desactivada";
            estadoTexto.className = `ml-3 text-sm font-medium ${
                nuevoEstado ? "text-green-600" : "text-gray-400"
            }`;
        }

        // Actualizar el estado en el array de plantillas
        const plantilla = plantillas.find((p) => p.id === id);
        if (plantilla) {
            plantilla.activo = nuevoEstado;
        }

        // Actualizar la tarjeta (agregar/quitar clase inactiva) - Vista de Cards
        const card = toggleCheckbox?.closest('.plantilla-card');
        if (card) {
            if (nuevoEstado) {
                card.classList.remove('inactiva');
            } else {
                card.classList.add('inactiva');
            }
        }

        // Actualizar la fila de la tabla - Vista de Lista
        const row = toggleCheckbox?.closest('tr');
        if (row) {
            if (nuevoEstado) {
                row.classList.remove('bg-gray-50');
            } else {
                row.classList.add('bg-gray-50');
            }
        }

        // Mostrar notificación de éxito
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true,
        });
        
        Toast.fire({
            icon: 'success',
            title: data.message || `Plantilla ${nuevoEstado ? 'activada' : 'desactivada'} correctamente`
        });

    } catch (error) {
        console.error("Error:", error);
        
        // Revertir el checkbox si hay error
        const toggleCheckbox = document.getElementById(`toggle-estado-${id}`);
        if (toggleCheckbox) {
            toggleCheckbox.checked = !nuevoEstado;
        }
        
        Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudo cambiar el estado de la plantilla",
            timer: 3000,
            showConfirmButton: false,
        });
    }
}

async function verEstadisticas(id) {
    try {
        const response = await fetch(
            `/admin/api/configuracion/plantillas-documentos/${id}/uso`
        );
        if (!response.ok) throw new Error("Error al cargar estadísticas");

        const data = await response.json();

        Swal.fire({
            title: "Estadísticas de Uso",
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
                        <span>${data.ultima_generacion || "Nunca"}</span>
                    </div>
                </div>
            `,
            icon: "info",
        });
    } catch (error) {
        console.error("Error:", error);
        Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudieron cargar las estadísticas",
        });
    }
}

async function eliminarPlantilla(id) {
    const plantilla = plantillas.find((p) => p.id === id);

    const result = await Swal.fire({
        title: "¿Eliminar Plantilla?",
        html: `
            <p class="text-sm text-gray-600 mb-2">¿Estás seguro de que deseas eliminar la plantilla "${plantilla.nombre}"?</p>
            <p class="text-xs text-red-600">Esta acción no se puede deshacer.</p>
        `,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
        try {
            const response = await fetch(
                `/admin/api/configuracion/plantillas-documentos/${id}`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRF-TOKEN": document.querySelector(
                            'meta[name="csrf-token"]'
                        ).content,
                    },
                }
            );

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Error al eliminar");
            }

            const data = await response.json();

            Swal.fire({
                icon: "success",
                title: "Plantilla Eliminada",
                text: data.message,
                timer: 2000,
                showConfirmButton: false,
            });

            cargarPlantillas();
        } catch (error) {
            console.error("Error:", error);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: error.message,
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

    const estaAbierto = !menu.classList.contains("hidden");

    // Cerrar todos los menús primero
    cerrarTodosLosMenus();

    // Si el menú estaba cerrado, abrirlo
    if (!estaAbierto) {
        menu.classList.remove("hidden");
    }
}

function cerrarTodosLosMenus() {
    document.querySelectorAll('[id^="menu-"]').forEach((menu) => {
        menu.classList.add("hidden");
    });
}

// ========================================
// IMPORTAR / EXPORTAR
// ========================================
async function exportarPlantillas() {
    try {
        const response = await fetch(
            "/admin/api/configuracion/plantillas-documentos/exportar",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": document.querySelector(
                        'meta[name="csrf-token"]'
                    ).content,
                },
            }
        );

        if (!response.ok) throw new Error("Error al exportar");

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `plantillas-${new Date().getTime()}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        Swal.fire({
            icon: "success",
            title: "Exportación Exitosa",
            text: "Las plantillas se han exportado correctamente",
            timer: 2000,
            showConfirmButton: false,
        });
    } catch (error) {
        console.error("Error:", error);
        Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudieron exportar las plantillas",
        });
    }
}

function importarPlantillas() {
    const modal = document.getElementById("modalImportar");
    if (modal) modal.classList.remove("hidden");
}

function cerrarModalImportar() {
    const modal = document.getElementById("modalImportar");
    const fileUpload = document.getElementById("file-upload");
    const fileInfo = document.getElementById("file-info");
    const btnImportar = document.getElementById("btn-importar");

    if (modal) modal.classList.add("hidden");
    if (fileUpload) fileUpload.value = "";
    if (fileInfo) fileInfo.classList.add("hidden");
    if (btnImportar) btnImportar.disabled = true;
    archivoImportar = null;
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        if (file.type !== "application/json") {
            Swal.fire({
                icon: "error",
                title: "Archivo Inválido",
                text: "Por favor selecciona un archivo JSON válido",
            });
            return;
        }

        archivoImportar = file;
        const fileName = document.getElementById("file-name");
        const fileInfo = document.getElementById("file-info");
        const btnImportar = document.getElementById("btn-importar");

        if (fileName) fileName.textContent = file.name;
        if (fileInfo) fileInfo.classList.remove("hidden");
        if (btnImportar) btnImportar.disabled = false;
    }
}

async function procesarImportacion() {
    if (!archivoImportar) return;

    try {
        const formData = new FormData();
        formData.append("archivo", archivoImportar);

        const response = await fetch(
            "/admin/api/configuracion/plantillas-documentos/importar",
            {
                method: "POST",
                headers: {
                    "X-CSRF-TOKEN": document.querySelector(
                        'meta[name="csrf-token"]'
                    ).content,
                },
                body: formData,
            }
        );

        if (!response.ok) throw new Error("Error al importar");

        const data = await response.json();

        cerrarModalImportar();

        Swal.fire({
            icon: "success",
            title: "Importación Exitosa",
            text: data.message,
        });

        cargarPlantillas();
    } catch (error) {
        console.error("Error:", error);
        Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudieron importar las plantillas",
        });
    }
}

// ========================================
// UTILIDADES
// ========================================
function mostrarLoader() {
    const loader = document.getElementById("skeletonLoader");
    const grid = document.getElementById("plantillasGrid");
    const lista = document.getElementById("plantillasLista");
    const empty = document.getElementById("emptyState");

    if (loader) loader.classList.remove("hidden");
    if (grid) grid.classList.add("hidden");
    if (lista) lista.classList.add("hidden");
    if (empty) empty.classList.add("hidden");
}

function ocultarLoader() {
    const loader = document.getElementById("skeletonLoader");
    if (loader) loader.classList.add("hidden");
}

function mostrarEmptyState() {
    const empty = document.getElementById("emptyState");
    const grid = document.getElementById("plantillasGrid");
    const lista = document.getElementById("plantillasLista");

    if (empty) empty.classList.remove("hidden");
    if (grid) grid.classList.add("hidden");
    if (lista) lista.classList.add("hidden");
}

function ocultarEmptyState() {
    const empty = document.getElementById("emptyState");
    if (empty) empty.classList.add("hidden");
}

// ========================================
// PAGINACIÓN
// ========================================
function renderizarPaginacion(data) {
    // Actualizar información de registros
    document.getElementById("showingFrom").textContent = data.from || 0;
    document.getElementById("showingTo").textContent = data.to || 0;
    document.getElementById("totalPlantillas").textContent = data.total || 0;

    const pagination = document.getElementById("pagination");
    let html = "";

    // Botón anterior
    html += `
        <button onclick="cambiarPagina(${data.current_page - 1})"
                ${data.current_page === 1 ? "disabled" : ""}
                class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${
                    data.current_page === 1
                        ? "cursor-not-allowed opacity-50"
                        : ""
                }">
            Anterior
        </button>
    `;

    // Páginas
    for (let i = 1; i <= data.last_page; i++) {
        if (
            i === 1 ||
            i === data.last_page ||
            (i >= data.current_page - 2 && i <= data.current_page + 2)
        ) {
            html += `
                <button onclick="cambiarPagina(${i})"
                        class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${
                            i === data.current_page
                                ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                : "bg-white text-gray-500 hover:bg-gray-50"
                        }">
                    ${i}
                </button>
            `;
        } else if (i === data.current_page - 3 || i === data.current_page + 3) {
            html +=
                '<span class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>';
        }
    }

    // Botón siguiente
    html += `
        <button onclick="cambiarPagina(${data.current_page + 1})"
                ${data.current_page === data.last_page ? "disabled" : ""}
                class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${
                    data.current_page === data.last_page
                        ? "cursor-not-allowed opacity-50"
                        : ""
                }">
            Siguiente
        </button>
    `;

    pagination.innerHTML = html;
}

function cambiarPagina(page) {
    paginaActual = page;
    cargarPlantillas();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

// ========================================
// EDITOR TINYMCE
// ========================================
let editoresActivos = {};

function inicializarEditores() {
    const configEditor = {
        selector: ".tinymce-editor",
        height: 500,
        menubar: "file edit view insert format tools table help",
        plugins: [
            "advlist",
            "autolink",
            "lists",
            "link",
            "image",
            "charmap",
            "preview",
            "anchor",
            "searchreplace",
            "visualblocks",
            "code",
            "fullscreen",
            "insertdatetime",
            "media",
            "table",
            "help",
            "wordcount",
        ],
        toolbar:
            "undo redo | blocks | bold italic underline | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | table | code | help",
        content_style:
            "body { font-family: Arial, sans-serif; font-size: 14px; }",
        language: "es",
        language_url: "/js/tinymce/langs/es.js",
        setup: function (editor) {
            editoresActivos[editor.id] = editor;
        },
    };

    // Verificar si TinyMCE está disponible
    if (typeof tinymce !== "undefined") {
        tinymce.init(configEditor);
    } else {
        console.warn(
            "TinyMCE no está cargado. Asegúrese de incluir el script de TinyMCE."
        );
    }
}

function destruirEditores() {
    if (typeof tinymce !== "undefined") {
        for (let editorId in editoresActivos) {
            tinymce.get(editorId)?.remove();
        }
        editoresActivos = {};
    }
}

function getEditorContent(editorId) {
    if (typeof tinymce !== "undefined") {
        const editor = tinymce.get(editorId);
        return editor ? editor.getContent() : "";
    }
    return document.getElementById(editorId)?.value || "";
}

// ========================================
// ACORDEÓN DE VARIABLES
// ========================================
function toggleAccordion(id) {
    const content = document.getElementById(id);
    const icon = document.getElementById(`icon-${id}`);

    if (content && icon) {
        content.classList.toggle("hidden");
        icon.classList.toggle("rotate-180");
    }
}

// ========================================
// TABS DEL EDITOR
// ========================================
function cambiarTabEditor(tab) {
    // Ocultar todos los paneles
    document.querySelectorAll(".editor-panel").forEach((panel) => {
        panel.classList.add("hidden");
    });

    // Remover clase active de todos los tabs
    document.querySelectorAll(".tab-editor-btn").forEach((btn) => {
        btn.classList.remove("active", "border-blue-500", "text-blue-600");
        btn.classList.add(
            "border-transparent",
            "text-gray-500",
            "hover:text-gray-700",
            "hover:border-gray-300"
        );
    });

    // Mostrar panel seleccionado
    const panel = document.getElementById(`editor-${tab}`);
    if (panel) {
        panel.classList.remove("hidden");
    }

    // Activar tab seleccionado
    const tabBtn = document.getElementById(`tab-${tab}`);
    if (tabBtn) {
        tabBtn.classList.add("active", "border-blue-500", "text-blue-600");
        tabBtn.classList.remove(
            "border-transparent",
            "text-gray-500",
            "hover:text-gray-700",
            "hover:border-gray-300"
        );
    }
}

// ========================================
// INSERTAR VARIABLES
// ========================================
function insertarVariable(variable) {
    // Obtener el editor activo
    let editorActivo = null;

    if (typeof tinymce !== "undefined") {
        // Encontrar qué tab está activo
        const panelContenido = document.getElementById("editor-contenido");
        const panelEncabezado = document.getElementById("editor-encabezado");
        const panelPie = document.getElementById("editor-pie");

        if (!panelContenido.classList.contains("hidden")) {
            editorActivo = tinymce.get("contenidoHTML");
        } else if (!panelEncabezado.classList.contains("hidden")) {
            editorActivo = tinymce.get("encabezadoHTML");
        } else if (!panelPie.classList.contains("hidden")) {
            editorActivo = tinymce.get("piePaginaHTML");
        }

        if (editorActivo) {
            editorActivo.insertContent(variable);
        }
    }
}

// ========================================
// GUARDAR PLANTILLA
// ========================================
async function guardarPlantilla() {
    try {
        const form = document.getElementById("formPlantilla");
        const formData = new FormData(form);

        // Obtener contenido de los editores
        formData.set("contenido_html", getEditorContent("contenidoHTML"));
        formData.set("encabezado_html", getEditorContent("encabezadoHTML"));
        formData.set("pie_pagina_html", getEditorContent("piePaginaHTML"));
        formData.set("activo", true);

        // Validar campos obligatorios
        if (!formData.get("nombre")) {
            mostrarToast("El nombre de la plantilla es obligatorio", "warning");
            return;
        }

        if (!formData.get("tipo_documento")) {
            mostrarToast("El tipo de documento es obligatorio", "warning");
            return;
        }

        if (!formData.get("contenido_html")) {
            mostrarToast(
                "El contenido de la plantilla es obligatorio",
                "warning"
            );
            return;
        }

        // Convertir FormData a JSON
        const data = {};
        formData.forEach((value, key) => {
            // Convertir valores booleanos que vienen como string
            if (key === "activo") {
                data[key] = value === "true" || value === true;
            } else {
                data[key] = value;
            }
        });

        // Determinar si estamos creando o editando
        const esEdicion = plantillaIdEnEdicion !== null;
        const url = esEdicion
            ? `/admin/api/configuracion/plantillas-documentos/${plantillaIdEnEdicion}`
            : "/admin/api/configuracion/plantillas-documentos";
        const method = esEdicion ? "PUT" : "POST";

        // Enviar solicitud
        const response = await fetch(url, {
            method: method,
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-TOKEN": document.querySelector(
                    'meta[name="csrf-token"]'
                ).content,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Error al guardar la plantilla");
        }

        const result = await response.json();

        // Cerrar modal
        cerrarModalPlantilla();

        // Mostrar mensaje de éxito
        mostrarToast(
            esEdicion ? "Plantilla Actualizada" : "Plantilla Creada",
            "success",
            result.message ||
                (esEdicion
                    ? "La plantilla se ha actualizado exitosamente"
                    : "La plantilla se ha creado exitosamente")
        );

        // Recargar lista de plantillas
        cargarPlantillas();
    } catch (error) {
        console.error("Error:", error);
        mostrarToast(
            "Error",
            "error",
            error.message || "No se pudo guardar la plantilla"
        );
    }
}

async function guardarBorradorPlantilla() {
    try {
        const form = document.getElementById("formPlantilla");
        const formData = new FormData(form);

        // Obtener contenido de los editores
        formData.set("contenido_html", getEditorContent("contenidoHTML"));
        formData.set("encabezado_html", getEditorContent("encabezadoHTML"));
        formData.set("pie_pagina_html", getEditorContent("piePaginaHTML"));
        formData.set("activo", false); // Guardar como inactivo (borrador)

        // Validar solo nombre
        if (!formData.get("nombre")) {
            mostrarToast("El nombre de la plantilla es obligatorio", "warning");
            return;
        }

        // Convertir FormData a JSON
        const data = {};
        formData.forEach((value, key) => {
            // Convertir valores booleanos que vienen como string
            if (key === "activo") {
                data[key] = value === "true" || value === true;
            } else {
                data[key] = value;
            }
        });

        // Enviar solicitud
        const response = await fetch(
            "/admin/api/configuracion/plantillas-documentos",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": document.querySelector(
                        'meta[name="csrf-token"]'
                    ).content,
                },
                body: JSON.stringify(data),
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Error al guardar el borrador");
        }

        const result = await response.json();

        // Cerrar modal
        cerrarModalPlantilla();

        // Mostrar mensaje de éxito
        mostrarToast(
            "Borrador Guardado",
            "success",
            result.message || "El borrador se ha guardado exitosamente"
        );

        // Recargar lista de plantillas
        cargarPlantillas();
    } catch (error) {
        console.error("Error:", error);
        mostrarToast(
            "Error",
            "error",
            error.message || "No se pudo guardar el borrador"
        );
    }
}

// ========================================
// VISTA PREVIA
// ========================================
async function vistaPreviaPlantilla() {
    try {
        // Obtener contenido de los editores
        const contenidoHTML = getEditorContent("contenidoHTML");
        const encabezadoHTML = getEditorContent("encabezadoHTML");
        const piePaginaHTML = getEditorContent("piePaginaHTML");

        if (!contenidoHTML) {
            mostrarToast(
                "Contenido Vacío",
                "warning",
                "Debe agregar contenido a la plantilla para ver la vista previa"
            );
            return;
        }

        // Datos de ejemplo para reemplazar variables
        const datosEjemplo = {
            "solicitante.nombre_completo": "Juan Pérez García",
            "solicitante.documento": "1234567890",
            "solicitante.email": "juan.perez@example.com",
            "solicitante.telefono": "3001234567",
            "solicitud.numero": "SOL-2025-001",
            "solicitud.fecha": new Date().toLocaleDateString("es-CO"),
            "solicitud.tipo": "Certificado Laboral",
            "solicitud.asunto": "Solicitud de certificado laboral",
            "funcionario.nombre": "María González",
            "funcionario.cargo": "Jefe de Recursos Humanos",
            "funcionario.firma": "[FIRMA DIGITAL]",
            "sistema.fecha_actual": new Date().toLocaleDateString("es-CO"),
            "sistema.hora_actual": new Date().toLocaleTimeString("es-CO"),
            "sistema.entidad": "Nombre de la Entidad",
            "consecutivo.numero": "00123",
            "consecutivo.anio": new Date().getFullYear().toString(),
        };

        // Reemplazar variables en el contenido
        let contenidoFinal = encabezadoHTML + contenidoHTML + piePaginaHTML;

        for (let [variable, valor] of Object.entries(datosEjemplo)) {
            const regex = new RegExp(`{{${variable}}}`, "g");
            contenidoFinal = contenidoFinal.replace(regex, valor);
        }

        // Mostrar en el modal de vista previa
        const modal = document.getElementById("modalVistaPreviaPDF");
        const previewContent = document.getElementById("preview-content");

        if (modal && previewContent) {
            previewContent.innerHTML = contenidoFinal;
            modal.classList.remove("hidden");
        }
    } catch (error) {
        console.error("Error:", error);
        mostrarToast("Error", "error", "No se pudo generar la vista previa");
    }
}

function cerrarModalVistaPrevia() {
    const modal = document.getElementById("modalVistaPreviaPDF");
    if (modal) {
        modal.classList.add("hidden");
    }
}

// ========================================
// CARGAR CAMPOS PERSONALIZADOS
// ========================================
async function cargarCamposPersonalizados() {
    try {
        const response = await fetch(
            "/admin/api/configuracion/campos-personalizados?estado=activos&per_page=1000",
            {
                headers: {
                    Accept: "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                    "X-CSRF-TOKEN":
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute("content") || "",
                },
            }
        );

        if (!response.ok) {
            throw new Error("Error al cargar campos personalizados");
        }

        const data = await response.json();
        const campos = data.campos?.data || data.data || data.campos || [];

        const container = document.getElementById(
            "campos-personalizados-container"
        );
        const badge = document.getElementById("badge-campos-count");

        if (!container) return;

        // Actualizar contador
        if (badge) {
            badge.textContent = campos.length;
        }

        if (campos.length === 0) {
            container.innerHTML = `
                <div class="text-xs text-gray-500 text-center py-2">
                    No hay campos personalizados activos.
                    <a href="/admin/configuracion/campos-personalizados" class="text-blue-600 hover:underline block mt-1">
                        Crear campo personalizado
                    </a>
                </div>
            `;
            return;
        }

        // Agrupar campos por categoría
        const camposPorCategoria = {};
        campos.forEach((campo) => {
            const categoria = campo.categoria_id || "Sin categoría";
            if (!camposPorCategoria[categoria]) {
                camposPorCategoria[categoria] = [];
            }
            camposPorCategoria[categoria].push(campo);
        });

        // Renderizar campos agrupados
        let html = "";

        // Si todos los campos están sin categoría, no mostrar agrupación
        if (
            Object.keys(camposPorCategoria).length === 1 &&
            camposPorCategoria["Sin categoría"]
        ) {
            html = campos.map((campo) => crearBotonVariable(campo)).join("");
        } else {
            // Mostrar agrupados por categoría
            for (const [categoria, camposCategoria] of Object.entries(
                camposPorCategoria
            )) {
                if (categoria !== "Sin categoría") {
                    html += `<div class="text-xs font-semibold text-gray-700 mt-2 mb-1">${categoria}</div>`;
                }
                html += camposCategoria
                    .map((campo) => crearBotonVariable(campo))
                    .join("");
            }
        }

        container.innerHTML = html;
    } catch (error) {
        console.error("Error al cargar campos personalizados:", error);
        const container = document.getElementById(
            "campos-personalizados-container"
        );
        if (container) {
            container.innerHTML = `
                <div class="text-xs text-red-600 text-center py-2">
                    Error al cargar campos personalizados
                </div>
            `;
        }
    }
}

function crearBotonVariable(campo) {
    // Generar el slug/identificador del campo para la variable
    const slug =
        campo.slug ||
        campo.nombre
            .toLowerCase()
            .replace(/\s+/g, "_")
            .replace(/[^a-z0-9_]/g, "");
    const variable = `campo.${slug}`;

    // Determinar el ícono según el tipo de campo
    const iconos = {
        texto_corto: "📝",
        texto_largo: "📄",
        numero: "🔢",
        moneda: "💰",
        fecha: "📅",
        email: "📧",
        telefono: "📞",
        select: "📋",
        checkbox: "☑️",
        radio: "🔘",
        archivo: "📎",
        imagen: "🖼️",
    };

    const icono = iconos[campo.tipo_campo] || "📌";
    const descripcion = campo.descripcion || campo.etiqueta || campo.nombre;

    return `
        <button type="button" onclick="insertarVariable('@{{${variable}}}')"
            class="w-full text-left px-2 py-1 text-xs bg-purple-50 hover:bg-purple-100 rounded font-mono text-purple-700 flex items-center"
            title="${descripcion}">
            <span class="mr-1">${icono}</span>
            @{{${variable}}}
        </button>
    `;
}

function mostrarToast(message, type = "success", text = "") {
    const Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener("mouseenter", Swal.stopTimer);
            toast.addEventListener("mouseleave", Swal.resumeTimer);
        },
    });

    Toast.fire({
        icon: type,
        title: message,
    });
}
