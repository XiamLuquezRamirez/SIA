// ========================================
// CONFIGURACIÓN GLOBAL DE SWEETALERT2
// ========================================

/**
 * Wrapper para Swal.fire que automáticamente ajusta el z-index
 * cuando el modal de configuración está abierto
 */
const SwalOriginal = window.Swal;

// Guardar la referencia original del método fire
const fireOriginal = SwalOriginal.fire.bind(SwalOriginal);

// Sobrescribir solo el método fire, manteniendo Swal como constructor
window.Swal.fire = function (options) {
    // Si el modal de configuración está visible, ajustar z-index
    const modalConfiguracion = document.getElementById(
        "modalConfigurarFormulario"
    );
    const modalVisible =
        modalConfiguracion && !modalConfiguracion.classList.contains("hidden");

    if (modalVisible) {
        // Agregar didOpen a las opciones existentes
        const originalDidOpen = options?.didOpen;
        options = {
            ...options,
            didOpen: () => {
                const swalContainer =
                    document.querySelector(".swal2-container");
                if (swalContainer) {
                    swalContainer.style.zIndex = "9999";
                }
                // Llamar al didOpen original si existe
                if (originalDidOpen) {
                    originalDidOpen();
                }
            },
        };
    }

    return fireOriginal(options);
};

// ========================================
// MANEJO DE RESPUESTAS
// ========================================

async function manejarRespuestaFetch(response) {
    const contentType = response.headers.get("content-type");
    const esHTML = contentType && contentType.includes("text/html");

    if (esHTML && (response.status === 200 || response.status === 302)) {
        const texto = await response.text();

        if (texto.includes("login") || texto.includes("csrf")) {
            mostrarToast(
                "Su sesión ha expirado. Redirigiendo al login...",
                "error"
            );
            setTimeout(() => {
                window.location.href = "/login";
            }, 2000);
            throw new Error("Sesión expirada");
        }
    }

    if (response.status === 401 || response.status === 419) {
        mostrarToast(
            "Su sesión ha expirado. Redirigiendo al login...",
            "error"
        );
        setTimeout(() => {
            window.location.href = "/login";
        }, 2000);
        throw new Error("Sesión expirada");
    }

    return response;
}

/**
 * Refrescar token CSRF desde el servidor
 */
async function refrescarCSRFToken() {
    try {
        const response = await fetch("/admin/dashboard", {
            method: "GET",
            credentials: "same-origin",
        });

        if (response.ok) {
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");
            const newToken = doc
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute("content");

            if (newToken) {
                // Actualizar el token en el documento actual
                const metaTag = document.querySelector(
                    'meta[name="csrf-token"]'
                );
                if (metaTag) {
                    metaTag.setAttribute("content", newToken);
                    console.log("✅ Token CSRF refrescado");
                    return newToken;
                }
            }
        }

        console.warn("⚠️ No se pudo refrescar el token CSRF");
        return null;
    } catch (error) {
        console.error("❌ Error al refrescar token CSRF:", error);
        return null;
    }
}

/**
 * Verificar si la sesión está activa
 */
async function verificarSesion() {
    try {
        // Usar una ruta API simple que requiera autenticación
        const response = await fetch("/admin/api/tipos/categorias", {
            method: "GET",
            credentials: "same-origin",
            headers: {
                "X-Requested-With": "XMLHttpRequest",
                Accept: "application/json",
            },
        });

        console.log("🔍 Verificación de sesión - Status:", response.status);

        // Si recibimos 200, la sesión está activa
        // Si recibimos 401, 419, o 302, la sesión expiró
        if (response.status === 401 || response.status === 419) {
            console.error("❌ Sesión expirada (401/419)");
            return false;
        }

        if (response.ok) {
            console.log("✅ Sesión verificada correctamente");
            return true;
        }

        // Cualquier otro error, asumimos que la sesión sigue activa
        // (podría ser un error de red, etc.)
        console.warn(
            "⚠️ Status inesperado:",
            response.status,
            "- Asumiendo sesión activa"
        );
        return true;
    } catch (error) {
        console.error("❌ Error al verificar sesión:", error);
        // En caso de error de red, asumimos que la sesión sigue activa
        // para no bloquear al usuario innecesariamente
        return true;
    }
}

// ========================================
// ESTADO GLOBAL
// ========================================

let paginaActual = 1;
let filtrosActuales = {
    search: "",
    categoria: "",
    estado: "",
    area_id: "",
};
let temporizadorBusqueda = null;

// ========================================
// INICIALIZACIÓN
// ========================================

document.addEventListener("DOMContentLoaded", function () {
    cargarTiposSolicitud();
    cargarCategorias("filterCategoria");
    cargarAreas("filterArea");
    configurarEscuchadores();
});

// ========================================
// CONFIGURAR EVENT LISTENERS
// ========================================

function configurarEscuchadores() {
    // Búsqueda con debounce
    document
        .getElementById("searchInput")
        .addEventListener("input", function (e) {
            clearTimeout(temporizadorBusqueda);
            temporizadorBusqueda = setTimeout(() => {
                filtrosActuales.search = e.target.value;
                paginaActual = 1;
                cargarTiposSolicitud();
            }, 500);
        });

    // Filtros
    document
        .getElementById("filterCategoria")
        .addEventListener("change", function (e) {
            filtrosActuales.categoria = e.target.value;
            paginaActual = 1;
            cargarTiposSolicitud();
            actualizarIndicadorFiltros();
        });

    document
        .getElementById("filterEstado")
        .addEventListener("change", function (e) {
            filtrosActuales.estado = e.target.value;
            paginaActual = 1;
            cargarTiposSolicitud();
            actualizarIndicadorFiltros();
        });

    document
        .getElementById("filterArea")
        .addEventListener("change", function (e) {
            filtrosActuales.area_id = e.target.value;
            paginaActual = 1;
            cargarTiposSolicitud();
            actualizarIndicadorFiltros();
        });

    // Items por página
    const perPageSelect = document.getElementById("perPageSelect");
    if (perPageSelect) {
        perPageSelect.addEventListener("change", function (e) {
            paginaActual = 1;
            cargarTiposSolicitud();
        });
    }
}

// ========================================
// CARGAR DATOS
// ========================================

async function cargarTiposSolicitud() {
    try {
        mostrarCargador();

        const perPageSelect = document.getElementById("perPageSelect");
        const perPage = perPageSelect ? perPageSelect.value : 6;
        const params = new URLSearchParams({
            page: paginaActual,
            per_page: perPage,
            ...filtrosActuales,
        });

        const response = await fetch(`/admin/solicitudes/api/tipos?${params}`, {
            headers: {
                "X-Requested-With": "XMLHttpRequest",
                Accept: "application/json",
                "X-CSRF-TOKEN":
                    document
                        .querySelector('meta[name="csrf-token"]')
                        ?.getAttribute("content") || "",
            },
        });

        console.log("Response status:", response.status);
        console.log(
            "Response content-type:",
            response.headers.get("content-type")
        );

        await manejarRespuestaFetch(response);

        if (!response.ok) {
            console.error("Response not OK:", response.status);
            throw new Error(`Error ${response.status}`);
        }

        const data = await response.json();
        console.log("Data recibida:", data);

        // Verificar estructura
        const permissions = data.permissions;
        window.userPermissions = permissions;

        // La respuesta paginada viene en data.tipos.data (Laravel pagination)
        const tiposPaginados = data.tipos;
        const tipos = tiposPaginados.data || [];

        console.log("Tipos paginados:", tiposPaginados);
        console.log("Array de tipos:", tipos);

        if (!Array.isArray(tipos)) {
            console.error("Tipos no es array:", tipos);
            mostrarEstadoVacio();
            return;
        }

        if (tipos.length === 0) {
            console.log("No hay tipos de solicitud en BD");
            mostrarEstadoVacio();
        } else {
            console.log("Renderizando", tipos.length, "tipos");
            renderizarTipos(tipos);
            renderizarPaginacion(tiposPaginados);
        }
    } catch (error) {
        console.error("Error completo:", error);
        console.error("Stack:", error.stack);
        mostrarToast("Error al cargar: " + error.message, "error");
        mostrarEstadoVacio();
    }
}

async function cargarCategorias(id_select) {
    try {
        const response = await fetch("/admin/api/tipos-solicitud/categorias", {
            headers: {
                "X-Requested-With": "XMLHttpRequest",
                Accept: "application/json",
                "X-CSRF-TOKEN":
                    document
                        .querySelector('meta[name="csrf-token"]')
                        ?.getAttribute("content") || "",
            },
        });
        await manejarRespuestaFetch(response);

        if (response.ok) {
            const data = await response.json();

            // Guardar en variable global para usar en resumen
            if (data.success && data.categorias) {
                window.categoriasDisponibles = data.categorias;
            }

            const select = document.getElementById(id_select);
            if (select && data.success && data.categorias) {
                data.categorias.forEach((cat) => {
                    const option = document.createElement("option");
                    option.value = cat.id;
                    option.textContent = `${cat.icono} ${cat.nombre}`;
                    option.dataset.color = cat.color;
                    option.dataset.slug = cat.slug;
                    select.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error("Error al cargar categorías:", error);
    }
}

async function cargarAreas(id_select) {
    try {
        const response = await fetch("/admin/api/areas", {
            headers: {
                "X-Requested-With": "XMLHttpRequest",
                Accept: "application/json",
                "X-CSRF-TOKEN":
                    document
                        .querySelector('meta[name="csrf-token"]')
                        ?.getAttribute("content") || "",
            },
        });
        await manejarRespuestaFetch(response);

        if (response.ok) {
            const data = await response.json();

            // Manejar diferentes formatos de respuesta
            const areas = data.areas || data;

            // Guardar en variable global para usar en resumen
            if (Array.isArray(areas)) {
                window.areasDisponibles = areas;
            }

            const select = document.getElementById(id_select);
            if (select) {
                if (Array.isArray(areas)) {
                    areas.forEach((area) => {
                        const option = document.createElement("option");
                        option.value = area.id;
                        option.textContent = area.nombre;
                        select.appendChild(option);
                    });
                }
            }
        }
    } catch (error) {
        console.error("Error al cargar áreas:", error);
    }
}

// ========================================
// RENDERIZAR UI
// ========================================

function renderizarTipos(tipos) {
    const grid = document.getElementById("tiposGrid");
    document.getElementById("emptyState").classList.add("hidden");
    document.getElementById("skeletonLoader").classList.add("hidden");
    grid.classList.remove("hidden");

    grid.innerHTML = tipos.map((tipo) => crearCard(tipo)).join("");
}

function renderizarPaginacion(data) {
    // Actualizar información de registros
    document.getElementById("showingFrom").textContent = data.from || 0;
    document.getElementById("showingTo").textContent = data.to || 0;
    document.getElementById("totalTipos").textContent = data.total || 0;

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
    cargarTiposSolicitud();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function crearCard(tipo) {
    const colorClasses = {
        blue: "bg-blue-100 text-blue-800 border-blue-300",
        green: "bg-green-100 text-green-800 border-green-300",
        purple: "bg-purple-100 text-purple-800 border-purple-300",
        orange: "bg-orange-100 text-orange-800 border-orange-300",
        red: "bg-red-100 text-red-800 border-red-300",
    };

    const colorClass = colorClasses[tipo.color] || colorClasses.blue;

    return `
        <div class="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-200">
            <!-- Header del Card -->
            <div class="flex items-start justify-between mb-4">
                <div class="flex items-center gap-2">
                    <span class="text-2xl">${tipo.icono || "📄"}</span>
                    <h3 class="font-semibold text-gray-900">${tipo.nombre}</h3>
                </div>
                
                <!-- Menú de acciones -->
                <div class="relative" x-data="{ open: false }">
                    <button @click="open = !open" class="text-gray-400 hover:text-gray-600 p-1">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path>
                        </svg> 
                    </button>
                    <div x-show="open" @click.away="open = false" 
                        class="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                        <div class="py-1">
                            <a href="#" onclick="verDetalleTipo(${
                                tipo.id
                            }); return false;" class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                </svg>
                                Ver Detalle
                            </a>
                            ${
                                window.userPermissions.canEdit
                                    ? `
                            <a href="#" onclick="editarTipo(${tipo.id}); return false;" class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                </svg>
                                Editar Información
                            </a>
                            `
                                    : ""
                            }
                            ${
                                window.userPermissions.canConfigurarFormulario
                                    ? `
                            <a href="#" onclick="configurarFormulario(${tipo.id}); return false;" class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                </svg>
                                Configurar Formulario
                            </a>
                            `
                                    : ""
                            }
                            ${
                                window.userPermissions.canClonar
                                    ? `
                            <a href="#" onclick="clonarTipo(${tipo.id}); return false;" class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                                </svg>
                                Clonar Tipo
                            </a>
                            `
                                    : ""
                            }
                            ${
                                window.userPermissions.canDelete
                                    ? `
                            <a href="#" onclick="eliminarTipo(${tipo.id}, '${tipo.codigo}'); return false;" class="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                </svg>
                                Eliminar
                            </a>
                            `
                                    : ""
                            }
                        </div>
                    </div>
                </div>
            </div>

            <!-- Información -->
            <div class="space-y-2 mb-4">
                <p class="text-sm text-gray-600">
                    <span class="font-medium">Código:</span> ${tipo.codigo}
                </p>
                <p class="text-sm">
                    <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium ${colorClass}">
                        ${tipo.categoria?.nombre || "Sin categoría"}
                    </span>
                </p>
            </div>

            <!-- Detalles -->
            <div class="space-y-2 mb-4 text-sm text-gray-600">
                <div class="flex items-center gap-2">
                    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                    </svg>
                    <span class="font-medium">Área:</span> ${
                        tipo.area?.nombre || "Sin área"
                    }
                </div>
                <div class="flex items-center gap-2">
                    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span class="font-medium">Tiempo:</span> ${
                        tipo.tiempo_respuesta_dias
                    } días hábiles
                </div>
                <div class="flex items-center gap-2">
                    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <span class="font-medium">Campos:</span> ${
                        tipo.campos_personalizados?.length || 0
                    } configurados
                </div>
            </div>

            <!-- Toggle Estado -->
            <div class="flex items-center justify-between py-3 border-t border-b border-gray-200 mb-4">
                <span class="text-sm font-medium text-gray-700">Estado:</span>
                <label class="relative inline-flex items-center cursor-pointer">
                    <input id="toggle-estado-${
                        tipo.id
                    }" type="checkbox" class="sr-only peer" ${
        tipo.activo ? "checked" : ""
    }
                    onchange="alternarEstadoTipo(${tipo.id}, this.checked)">
                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    <span id="estado-${
                        tipo.id
                    }" class="ml-3 text-sm font-medium ${
        tipo.activo ? "text-green-600" : "text-gray-400"
    }">
                        ${tipo.activo ? "Activo" : "Inactivo"}
                    </span>
                </label>
            </div>

            <!-- Estadísticas (simuladas) -->
            <div class="mb-4">
                <p class="text-xs font-medium text-gray-500 mb-2">Estadísticas (este mes):</p>
                <div class="grid grid-cols-3 gap-2 text-center">
                    <div class="bg-blue-50 rounded p-2">
                        <p class="text-lg font-bold text-blue-600">0</p>
                        <p class="text-xs text-gray-600">Radicadas</p>
                    </div>
                    <div class="bg-yellow-50 rounded p-2">
                        <p class="text-lg font-bold text-yellow-600">0</p>
                        <p class="text-xs text-gray-600">En proceso</p>
                    </div>
                    <div class="bg-green-50 rounded p-2">
                        <p class="text-lg font-bold text-green-600">0</p>
                        <p class="text-xs text-gray-600">Completadas</p>
                    </div>
                </div>
            </div>

            <!-- Botón Ver Detalle -->
            <button onclick="verDetalleTipo(${tipo.id})" 
                class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition flex items-center gap-2 justify-center">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                </svg>  Ver Detalle
            </button>
        </div>
    `;
}

function mostrarCargador() {
    document.getElementById("tiposGrid").classList.add("hidden");
    document.getElementById("emptyState").classList.add("hidden");
    document.getElementById("skeletonLoader").classList.remove("hidden");
}

function mostrarEstadoVacio() {
    document.getElementById("tiposGrid").classList.add("hidden");
    document.getElementById("skeletonLoader").classList.add("hidden");
    document.getElementById("emptyState").classList.remove("hidden");
}

// ========================================
// ACCIONES DE TIPOS
// ========================================

async function verDetalleTipo(id) {
    try {
        // Mostrar loading
        Swal.fire({
            title: "Cargando...",
            text: "Obteniendo detalles del tipo de solicitud",
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => {
                Swal.showLoading();
            },
        });

        // Cargar datos del tipo de solicitud
        const response = await fetch(`/admin/api/tipos-solicitud/${id}`, {
            headers: {
                "X-Requested-With": "XMLHttpRequest",
                Accept: "application/json",
                "X-CSRF-TOKEN":
                    document
                        .querySelector('meta[name="csrf-token"]')
                        ?.getAttribute("content") || "",
            },
        });

        await manejarRespuestaFetch(response);

        if (!response.ok) {
            throw new Error("No se pudo cargar el tipo de solicitud");
        }

        const data = await response.json();
        const tipo = data.tipo || data;
        const plantillas = data.plantillas || [];
        const estadisticas = data.estadisticas || {
            radicadas: 0,
            en_proceso: 0,
            completadas: 0,
            este_mes: 0,
        };

        console.log("📄 Tipo de solicitud cargado:", tipo);
        console.log("📋 Plantillas:", plantillas);

        Swal.close();

        // Mostrar modal con detalles
        mostrarModalDetalleTipo(tipo, plantillas, estadisticas);
    } catch (error) {
        console.error("Error al cargar detalle del tipo:", error);
        mostrarToast(
            "Error",
            "error",
            "No se pudo cargar la información del tipo de solicitud"
        );
    }
}

function mostrarModalDetalleTipo(tipo, plantillas, estadisticas) {
    // Crear modal
    const modal = document.createElement("div");
    modal.id = "modalDetalleTipo";
    modal.className =
        "fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50";

    // Colores para las categorías
    const colorClasses = {
        blue: "bg-blue-100 text-blue-800 border-blue-300",
        green: "bg-green-100 text-green-800 border-green-300",
        purple: "bg-purple-100 text-purple-800 border-purple-300",
        orange: "bg-orange-100 text-orange-800 border-orange-300",
        red: "bg-red-100 text-red-800 border-red-300",
    };
    const colorClass = colorClasses[tipo.color] || colorClasses.blue;

    // Preparar datos de campos personalizados
    const camposPersonalizados = tipo.campos_personalizados || [];

    // Preparar datos de flujo de aprobación
    const flujoAprobacion = tipo.flujo_aprobacion || null;

    modal.innerHTML = `
        <div class="relative top-10 mx-auto p-0 border w-11/12 max-w-6xl shadow-lg bg-white rounded-2xl mb-10">
            <!-- Header -->
            <div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-2xl">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <span class="text-4xl">${tipo.icono || "📄"}</span>
                        <div>
                            <h3 class="text-xl font-semibold text-white">${
                                tipo.nombre
                            }</h3>
                            <p class="text-blue-100 text-sm">Código: ${
                                tipo.codigo
                            } |
                                <span class="${
                                    tipo.activo
                                        ? "text-green-200"
                                        : "text-gray-300"
                                }">${
        tipo.activo ? "✓ Activo" : "○ Inactivo"
    }</span>
                            </p>
                        </div>
                    </div>
                    <button type="button" onclick="cerrarModalDetalle()" class="text-white hover:text-gray-200">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                <!-- Pestañas de navegación -->
                <div class="mt-4 flex border-b border-blue-500">
                    <button onclick="cambiarTabDetalle(1)" id="tabDetalle1" class="tab-detalle-activo px-4 py-2 font-medium text-white border-b-2 border-white">
                        Paso 1: Información Básica
                    </button>
                    <button onclick="cambiarTabDetalle(2)" id="tabDetalle2" class="tab-detalle px-4 py-2 font-medium text-blue-200 hover:text-white border-b-2 border-transparent">
                        Paso 2: Campos
                    </button>
                    <button onclick="cambiarTabDetalle(3)" id="tabDetalle3" class="tab-detalle px-4 py-2 font-medium text-blue-200 hover:text-white border-b-2 border-transparent">
                        Paso 3: Flujo
                    </button>
                    <button onclick="cambiarTabDetalle(4)" id="tabDetalle4" class="tab-detalle px-4 py-2 font-medium text-blue-200 hover:text-white border-b-2 border-transparent">
                        Paso 4: Plantillas
                    </button>
                </div>
            </div>

            <!-- Body con contenido de las pestañas -->
            <div class="px-6 py-6 max-h-[65vh] overflow-y-auto">
                ${generarContenidoTabsDetalle(
                    tipo,
                    camposPersonalizados,
                    flujoAprobacion,
                    plantillas,
                    estadisticas,
                    colorClass
                )}
            </div>

            <!-- Footer con acciones -->
            <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between rounded-b-2xl">
                <button type="button" onclick="cerrarModalDetalle()" class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                    Cerrar
                </button>
                <div class="flex gap-2">
                    <button type="button" onclick="cerrarModalDetalle(); editarTipo(${
                        tipo.id
                    });" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                        Editar Tipo
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

function generarContenidoTabsDetalle(
    tipo,
    camposPersonalizados,
    flujoAprobacion,
    plantillas,
    estadisticas,
    colorClass
) {
    return `
        <!-- TAB 1: Información Básica -->
        <div id="tabContent1" class="tab-content-detalle">
            <!-- Información General -->
            <div class="mb-6">
                <h4 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Información General
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="bg-gray-50 rounded-lg p-4">
                        <label class="text-sm font-medium text-gray-500">Categoría</label>
                        <p class="mt-1">
                            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${colorClass}">
                                ${tipo.categoria?.icono || ""} ${
        tipo.categoria?.nombre || "Sin categoría"
    }
                            </span>
                        </p>
                    </div>
                    <div class="bg-gray-50 rounded-lg p-4">
                        <label class="text-sm font-medium text-gray-500">Área Responsable</label>
                        <p class="mt-1 text-gray-900">${
                            tipo.area_responsable?.nombre ||
                            tipo.area?.nombre ||
                            "Sin área"
                        }</p>
                    </div>
                    <div class="bg-gray-50 rounded-lg p-4">
                        <label class="text-sm font-medium text-gray-500">Tiempo de Respuesta</label>
                        <p class="mt-1 text-gray-900">${
                            tipo.dias_respuesta ||
                            tipo.tiempo_respuesta_dias ||
                            0
                        } días ${
        tipo.tipo_dias === "calendario" ? "calendario" : "hábiles"
    }</p>
                    </div>
                    <div class="bg-gray-50 rounded-lg p-4">
                        <label class="text-sm font-medium text-gray-500">SLA (días)</label>
                        <p class="mt-1 text-gray-900">${
                            tipo.sla_dias || "No definido"
                        }</p>
                    </div>
                </div>
            </div>

            <!-- Descripción e Instrucciones -->
            ${
                tipo.descripcion || tipo.instrucciones
                    ? `
            <div class="mb-6">
                <h4 class="text-lg font-semibold text-gray-800 mb-4">Descripción e Instrucciones</h4>
                ${
                    tipo.descripcion
                        ? `
                <div class="bg-gray-50 rounded-lg p-4 mb-3">
                    <label class="text-sm font-medium text-gray-500 block mb-2">Descripción</label>
                    <p class="text-gray-900 whitespace-pre-wrap">${tipo.descripcion}</p>
                </div>
                `
                        : ""
                }
                ${
                    tipo.instrucciones
                        ? `
                <div class="bg-gray-50 rounded-lg p-4">
                    <label class="text-sm font-medium text-gray-500 block mb-2">Instrucciones</label>
                    <p class="text-gray-900 whitespace-pre-wrap">${tipo.instrucciones}</p>
                </div>
                `
                        : ""
                }
            </div>
            `
                    : ""
            }

            <!-- Configuraciones -->
            <div class="mb-6">
                <h4 class="text-lg font-semibold text-gray-800 mb-4">Configuraciones</h4>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                        <div>
                            <label class="text-sm font-medium text-gray-500 block">Requiere Aprobación</label>
                            <p class="mt-1 text-gray-900">${
                                tipo.requiere_aprobacion ? "Sí" : "No"
                            }</p>
                        </div>
                        ${
                            tipo.requiere_aprobacion
                                ? '<svg class="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>'
                                : '<svg class="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>'
                        }
                    </div>
                    <div class="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                        <div>
                            <label class="text-sm font-medium text-gray-500 block">Requiere Pago</label>
                            <p class="mt-1 text-gray-900">${
                                tipo.requiere_pago ? "Sí" : "No"
                            }</p>
                        </div>
                        ${
                            tipo.requiere_pago
                                ? '<svg class="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>'
                                : '<svg class="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>'
                        }
                    </div>
                    <div class="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                        <div>
                            <label class="text-sm font-medium text-gray-500 block">Requiere Documentos</label>
                            <p class="mt-1 text-gray-900">${
                                tipo.requiere_documentos ? "Sí" : "No"
                            }</p>
                        </div>
                        ${
                            tipo.requiere_documentos
                                ? '<svg class="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>'
                                : '<svg class="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>'
                        }
                    </div>
                </div>
                ${
                    tipo.requiere_pago && (tipo.valor_tramite || tipo.costo)
                        ? `
                <div class="mt-4 bg-blue-50 border-l-4 border-blue-500 p-4">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"></path>
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd"></path>
                            </svg>
                        </div>
                        <div class="ml-3">
                            <p class="text-sm text-blue-700">
                                <span class="font-medium">Valor del trámite:</span> $${parseFloat(
                                    tipo.valor_tramite || tipo.costo || 0
                                ).toLocaleString("es-CO")}
                            </p>
                        </div>
                    </div>
                </div>
                `
                        : ""
                }
            </div>

            <!-- Estadísticas -->
            <div class="mb-6">
                <h4 class="text-lg font-semibold text-gray-800 mb-4">Estadísticas de Uso</h4>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div class="bg-blue-50 rounded-lg p-4 text-center">
                        <p class="text-3xl font-bold text-blue-600">${
                            estadisticas.radicadas || 0
                        }</p>
                        <p class="text-sm text-gray-600 mt-1">Radicadas</p>
                    </div>
                    <div class="bg-yellow-50 rounded-lg p-4 text-center">
                        <p class="text-3xl font-bold text-yellow-600">${
                            estadisticas.en_proceso || 0
                        }</p>
                        <p class="text-sm text-gray-600 mt-1">En Proceso</p>
                    </div>
                    <div class="bg-green-50 rounded-lg p-4 text-center">
                        <p class="text-3xl font-bold text-green-600">${
                            estadisticas.completadas || 0
                        }</p>
                        <p class="text-sm text-gray-600 mt-1">Completadas</p>
                    </div>
                    <div class="bg-purple-50 rounded-lg p-4 text-center">
                        <p class="text-3xl font-bold text-purple-600">${
                            estadisticas.este_mes || 0
                        }</p>
                        <p class="text-sm text-gray-600 mt-1">Este Mes</p>
                    </div>
                </div>
            </div>

            <!-- Auditoría -->
            ${
                tipo.created_at || tipo.updated_at
                    ? `
            <div>
                <h4 class="text-lg font-semibold text-gray-800 mb-4">Información de Auditoría</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${
                        tipo.created_at
                            ? `
                    <div class="bg-gray-50 rounded-lg p-4">
                        <label class="text-sm font-medium text-gray-500 block">Fecha de Creación</label>
                        <p class="mt-1 text-gray-900">${new Date(
                            tipo.created_at
                        ).toLocaleString("es-CO")}</p>
                        ${
                            tipo.creador?.name
                                ? `<p class="text-sm text-gray-500">Por: ${tipo.creador.name}</p>`
                                : ""
                        }
                    </div>
                    `
                            : ""
                    }
                    ${
                        tipo.updated_at
                            ? `
                    <div class="bg-gray-50 rounded-lg p-4">
                        <label class="text-sm font-medium text-gray-500 block">Última Actualización</label>
                        <p class="mt-1 text-gray-900">${new Date(
                            tipo.updated_at
                        ).toLocaleString("es-CO")}</p>
                        ${
                            tipo.editor?.name
                                ? `<p class="text-sm text-gray-500">Por: ${tipo.editor.name}</p>`
                                : ""
                        }
                    </div>
                    `
                            : ""
                    }
                </div>
            </div>
            `
                    : ""
            }
        </div>

        <!-- TAB 2: Campos del Formulario -->
        <div id="tabContent2" class="tab-content-detalle hidden">
            <h4 class="text-lg font-semibold text-gray-800 mb-4">Campos Personalizados del Formulario</h4>
            ${
                camposPersonalizados && camposPersonalizados.length > 0
                    ? `
                <div class="space-y-3">
                    ${camposPersonalizados
                        .map(
                            (campo, index) => `
                        <div class="bg-gray-50 rounded-lg p-4 border-l-4 ${
                            campo.pivot?.obligatorio
                                ? "border-red-500"
                                : "border-blue-500"
                        }">
                            <div class="flex items-start justify-between">
                                <div class="flex-1">
                                    <div class="flex items-center gap-2 mb-2">
                                        <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">${
                                            index + 1
                                        }</span>
                                        <h5 class="font-semibold text-gray-900">${
                                            campo.etiqueta || campo.nombre
                                        }</h5>
                                        ${
                                            campo.pivot?.obligatorio
                                                ? '<span class="text-red-500 text-sm">*</span>'
                                                : ""
                                        }
                                    </div>
                                    <div class="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                                        <div>
                                            <span class="text-gray-500">Tipo:</span>
                                            <span class="text-gray-900 ml-1 font-medium">${
                                                campo.tipo
                                            }</span>
                                        </div>
                                        <div>
                                            <span class="text-gray-500">Variable:</span>
                                            <code class="text-blue-600 text-xs">${
                                                campo.variable
                                            }</code>
                                        </div>
                                        ${
                                            campo.categoria
                                                ? `
                                        <div>
                                            <span class="text-gray-500">Categoría:</span>
                                            <span class="text-gray-900 ml-1">${campo.categoria}</span>
                                        </div>
                                        `
                                                : ""
                                        }
                                    </div>
                                    ${
                                        campo.descripcion
                                            ? `
                                        <p class="text-sm text-gray-600 mt-2">${campo.descripcion}</p>
                                    `
                                            : ""
                                    }
                                </div>
                            </div>
                        </div>
                    `
                        )
                        .join("")}
                </div>
            `
                    : `
                <div class="bg-gray-50 rounded-lg p-8 text-center">
                    <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <h3 class="mt-2 text-sm font-medium text-gray-900">No hay campos configurados</h3>
                    <p class="mt-1 text-sm text-gray-500">Este tipo de solicitud no tiene campos personalizados asociados.</p>
                </div>
            `
            }
        </div>

        <!-- TAB 3: Flujo de Aprobación -->
        <div id="tabContent3" class="tab-content-detalle hidden">
            <h4 class="text-lg font-semibold text-gray-800 mb-4">Flujo de Aprobación</h4>
            ${
                flujoAprobacion &&
                typeof flujoAprobacion === "object" &&
                Object.keys(flujoAprobacion).length > 0
                    ? `
                <div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                    <p class="text-sm text-blue-700">
                        <strong>Tipo de Flujo:</strong> ${
                            flujoAprobacion.tipo === "personalizado"
                                ? "🎨 Flujo Personalizado"
                                : flujoAprobacion.tipo === "defecto"
                                ? "⚙️ Flujo por Defecto"
                                : "⚙️ Flujo Estándar del Sistema"
                        }
                    </p>
                </div>

                ${
                    flujoAprobacion.tipo === "personalizado" &&
                    flujoAprobacion.transiciones &&
                    flujoAprobacion.transiciones.length > 0
                        ? `
                    <!-- Diagrama Visual del Flujo Personalizado -->
                    <div class="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 mb-4">
                        <h5 class="text-md font-semibold text-gray-800 mb-4">🔄 Diagrama de Flujo</h5>
                        <div class="flex flex-wrap items-center justify-center gap-2">
                            ${(() => {
                                // Crear un conjunto de estados únicos en orden
                                const estados = new Map();
                                flujoAprobacion.transiciones.forEach(
                                    (trans) => {
                                        const origen =
                                            trans.estado_origen?.nombre ||
                                            trans.origen ||
                                            "Inicial";
                                        const destino =
                                            trans.estado_destino?.nombre ||
                                            trans.destino ||
                                            "Final";
                                        if (!estados.has(origen))
                                            estados.set(origen, estados.size);
                                        if (!estados.has(destino))
                                            estados.set(destino, estados.size);
                                    }
                                );

                                // Generar badges de estados en orden
                                const estadosArray = Array.from(estados.keys());
                                return estadosArray
                                    .map((estado, idx) => {
                                        const colores = [
                                            "bg-blue-100 text-blue-700",
                                            "bg-yellow-100 text-yellow-700",
                                            "bg-purple-100 text-purple-700",
                                            "bg-orange-100 text-orange-700",
                                            "bg-green-100 text-green-700",
                                        ];
                                        const color =
                                            colores[idx % colores.length];
                                        return `
                                        ${
                                            idx > 0
                                                ? '<span class="text-gray-400">→</span>'
                                                : ""
                                        }
                                        <span class="px-3 py-2 ${color} rounded-lg font-medium text-sm whitespace-nowrap">${estado}</span>
                                    `;
                                    })
                                    .join("");
                            })()}
                        </div>
                    </div>

                    <!-- Lista Detallada de Transiciones -->
                    <div class="bg-white border border-gray-200 rounded-lg p-6">
                        <h5 class="text-md font-semibold text-gray-800 mb-4">📋 Detalle de Transiciones</h5>
                        <div class="space-y-3">
                            ${flujoAprobacion.transiciones
                                .map(
                                    (trans, idx) => `
                                <div class="bg-gray-50 border-l-4 border-purple-500 rounded-lg p-4">
                                    <div class="flex items-center gap-3 mb-3">
                                        <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-800 text-xs font-bold">${
                                            idx + 1
                                        }</span>
                                        <span class="text-sm font-semibold text-gray-900">${
                                            trans.nombre || "Transición"
                                        }</span>
                                    </div>
                                    <div class="flex items-center gap-2 mb-2">
                                        <span class="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md font-medium text-sm">${
                                            trans.estado_origen?.nombre ||
                                            trans.origen ||
                                            "Inicial"
                                        }</span>
                                        <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                                        </svg>
                                        <span class="px-3 py-1.5 bg-green-100 text-green-700 rounded-md font-medium text-sm">${
                                            trans.estado_destino?.nombre ||
                                            trans.destino ||
                                            "Final"
                                        }</span>
                                    </div>
                                    ${
                                        trans.roles_permitidos
                                            ? `
                                        <div class="mt-2 flex items-center gap-2">
                                            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                            </svg>
                                            <span class="text-xs text-gray-600">
                                                <strong>Roles autorizados:</strong> ${
                                                    Array.isArray(
                                                        trans.roles_permitidos
                                                    )
                                                        ? trans.roles_permitidos.join(
                                                              ", "
                                                          )
                                                        : trans.roles_permitidos
                                                }
                                            </span>
                                        </div>
                                    `
                                            : ""
                                    }
                                    ${
                                        trans.requiere_aprobacion
                                            ? `
                                        <div class="mt-2">
                                            <span class="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                                ✓ Requiere Aprobación
                                            </span>
                                        </div>
                                    `
                                            : ""
                                    }
                                </div>
                            `
                                )
                                .join("")}
                        </div>
                    </div>
                `
                        : `
                    <div class="bg-gray-50 rounded-lg p-6">
                        <p class="text-sm text-gray-600">
                            ${
                                flujoAprobacion.tipo === "defecto" ||
                                !flujoAprobacion.tipo
                                    ? "✅ Este tipo de solicitud utiliza el flujo estándar del sistema con las siguientes etapas: Radicada → En Revisión → En Proceso → Completada."
                                    : "El flujo personalizado está configurado pero no tiene transiciones específicas definidas."
                            }
                        </p>
                    </div>
                `
                }
            `
                    : `
                <div class="bg-gray-50 rounded-lg p-8 text-center">
                    <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <h3 class="mt-2 text-sm font-medium text-gray-900">Flujo por Defecto</h3>
                    <p class="mt-1 text-sm text-gray-500">Este tipo de solicitud utiliza el flujo estándar del sistema.</p>
                    <div class="mt-4 flex items-center justify-center gap-2 text-xs">
                        <span class="px-2 py-1 bg-blue-100 text-blue-700 rounded">📥 Radicada</span>
                        <span class="text-gray-400">→</span>
                        <span class="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">🔍 En Revisión</span>
                        <span class="text-gray-400">→</span>
                        <span class="px-2 py-1 bg-purple-100 text-purple-700 rounded">⚙️ En Proceso</span>
                        <span class="text-gray-400">→</span>
                        <span class="px-2 py-1 bg-green-100 text-green-700 rounded">✅ Completada</span>
                    </div>
                </div>
            `
            }
        </div>

        <!-- TAB 4: Plantillas -->
        <div id="tabContent4" class="tab-content-detalle hidden">
            <h4 class="text-lg font-semibold text-gray-800 mb-4">Plantillas de Documentos</h4>
            ${
                plantillas && plantillas.length > 0
                    ? `
                <div class="space-y-3">
                    ${plantillas
                        .map(
                            (plantilla, index) => `
                        <div class="bg-gray-50 rounded-lg p-4 border-l-4 ${
                            plantilla.es_principal
                                ? "border-purple-500"
                                : "border-green-500"
                        }">
                            <div class="flex items-start justify-between">
                                <div class="flex-1">
                                    <div class="flex items-center gap-2 mb-2">
                                        <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-800 text-xs font-bold">${
                                            plantilla.orden || index + 1
                                        }</span>
                                        <h5 class="font-semibold text-gray-900">${
                                            plantilla.nombre
                                        }</h5>
                                        ${
                                            plantilla.es_principal
                                                ? '<span class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">Principal</span>'
                                                : ""
                                        }
                                    </div>
                                    ${
                                        plantilla.descripcion
                                            ? `
                                        <p class="text-sm text-gray-600 mb-2">${plantilla.descripcion}</p>
                                    `
                                            : ""
                                    }
                                    <div class="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <span class="text-gray-500">Momento de generación:</span>
                                            <span class="text-gray-900 ml-1 font-medium">
                                                ${
                                                    plantilla.momento_generacion ===
                                                    "al_aprobar"
                                                        ? "Al Aprobar"
                                                        : plantilla.momento_generacion ===
                                                          "al_completar"
                                                        ? "Al Completar"
                                                        : "Manual"
                                                }
                                            </span>
                                        </div>
                                        <div>
                                            <span class="text-gray-500">Generación automática:</span>
                                            <span class="text-gray-900 ml-1">${
                                                plantilla.generar_automatico
                                                    ? "Sí"
                                                    : "No"
                                            }</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `
                        )
                        .join("")}
                </div>
            `
                    : `
                <div class="bg-gray-50 rounded-lg p-8 text-center">
                    <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                    </svg>
                    <h3 class="mt-2 text-sm font-medium text-gray-900">No hay plantillas configuradas</h3>
                    <p class="mt-1 text-sm text-gray-500">Este tipo de solicitud no tiene plantillas de documentos asociadas.</p>
                </div>
            `
            }
        </div>
    `;
}

function cambiarTabDetalle(tabNumber) {
    // Ocultar todos los contenidos
    document.querySelectorAll(".tab-content-detalle").forEach((content) => {
        content.classList.add("hidden");
    });

    // Desactivar todas las pestañas
    document.querySelectorAll('[id^="tabDetalle"]').forEach((tab) => {
        tab.classList.remove(
            "tab-detalle-activo",
            "text-white",
            "border-white"
        );
        tab.classList.add("tab-detalle", "text-blue-200", "border-transparent");
    });

    // Mostrar contenido seleccionado
    document
        .getElementById(`tabContent${tabNumber}`)
        .classList.remove("hidden");

    // Activar pestaña seleccionada
    const activeTab = document.getElementById(`tabDetalle${tabNumber}`);
    activeTab.classList.remove(
        "tab-detalle",
        "text-blue-200",
        "border-transparent"
    );
    activeTab.classList.add("tab-detalle-activo", "text-white", "border-white");
}

function cerrarModalDetalle() {
    const modal = document.getElementById("modalDetalleTipo");
    if (modal) {
        modal.remove();
    }
}

// ========================================
// WIZARD DE CREACIÓN
// ========================================

let pasoActualWizard = 1;
let tipoIdCreado = null;
let camposSeleccionados = [];
let datosWizardTemp = {}; // Almacenar datos temporalmente entre pasos

function abrirModalNuevoTipo() {
    pasoActualWizard = 1;
    tipoIdCreado = null;
    camposSeleccionados = [];
    datosWizardTemp = {}; // Limpiar datos temporales

    const modal = document.createElement("div");
    modal.id = "wizardModal";
    modal.className =
        "fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50";
    modal.innerHTML = `
        <div class="relative top-10 mx-auto p-0 border w-11/12 max-w-4xl shadow-lg bg-white rounded-2xl mb-10">
            <!-- Header -->
            <div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-2xl">
                <div class="flex items-center justify-between">
                    <h3 class="text-xl font-semibold text-white">Crear Nuevo Tipo de Solicitud</h3>
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
                        <div class="flex flex-col items-center flex-1">
                            <div id="step1Indicator" class="flex items-center justify-center">
                                <div class="w-10 h-10 bg-white text-blue-600 rounded-full flex items-center justify-center font-bold text-lg shadow-lg ring-4 ring-blue-300">1</div>
                            </div>
                            <span class="mt-2 text-xs text-white font-medium text-center">Información<br>Básica</span>
                        </div>

                        <div class="flex-1 h-1 bg-blue-400 mx-2 mb-4 max-w-[80px]"></div>

                        <!-- Paso 2 -->
                        <div class="flex flex-col items-center flex-1">
                            <div id="step2Indicator" class="flex items-center justify-center">
                                <div class="w-10 h-10 bg-blue-400 text-white rounded-full flex items-center justify-center font-semibold text-lg">2</div>
                            </div>
                            <span class="mt-2 text-xs text-white font-medium text-center">Campos del<br>Formulario</span>
                        </div>

                        <div class="flex-1 h-1 bg-blue-400 mx-2 mb-4 max-w-[80px]"></div>

                        <!-- Paso 3 -->
                        <div class="flex flex-col items-center flex-1">
                            <div id="step3Indicator" class="flex items-center justify-center">
                                <div class="w-10 h-10 bg-blue-400 text-white rounded-full flex items-center justify-center font-semibold text-lg">3</div>
                            </div>
                            <span class="mt-2 text-xs text-white font-medium text-center">Flujo de<br>Aprobación</span>
                        </div>

                        <div class="flex-1 h-1 bg-blue-400 mx-2 mb-4 max-w-[80px]"></div>

                        <!-- Paso 4 -->
                        <div class="flex flex-col items-center flex-1">
                            <div id="step4Indicator" class="flex items-center justify-center">
                                <div class="w-10 h-10 bg-blue-400 text-white rounded-full flex items-center justify-center font-semibold text-lg">4</div>
                            </div>
                            <span class="mt-2 text-xs text-white font-medium text-center">Plantillas</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Body con los pasos -->
            <div class="px-6 py-6">
                <div id="wizardContent">
                    <!-- El contenido del paso actual se cargará aquí -->
                </div>
            </div>

            <!-- Footer con botones -->
            <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between rounded-b-2xl">
                <button type="button" onclick="cerrarWizard()" class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 justify-center">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>  Cancelar
                </button>
                <div class="flex gap-2">
                    <button type="button" id="btnAnterior" onclick="pasoAnteriorWizard()" 
                        class="hidden px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                        </svg> 
                        Anterior
                    </button>
                    <button type="button" id="btnSiguiente" onclick="pasoSiguienteWizard()" 
                        class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Siguiente <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Refrescar token CSRF al abrir el wizard
    refrescarCSRFToken().then(() => {
        console.log("✅ Token CSRF refrescado al abrir wizard");
    });

    mostrarPasoWizard(1);

    // Agregar contador de caracteres para instrucciones
    document
        .getElementById("wizard_instrucciones")
        ?.addEventListener("input", function () {
            document.getElementById("contador_instrucciones").textContent =
                this.value.length;
        });
}

function abrirModalEditarTipo(tipo, plantillas = []) {
    console.log("🔍 DEBUG abrirModalEditarTipo - Tipo recibido:", tipo);
    console.log("🔍 DEBUG - categoria_id:", tipo.categoria_id);
    console.log("🔍 DEBUG - area_responsable_id:", tipo.area_responsable_id);
    console.log("🔍 DEBUG - Plantillas recibidas:", plantillas);
    console.log(
        "🔍 DEBUG - Campos personalizados:",
        tipo.campos_personalizados
    );

    pasoActualWizard = 1;
    tipoIdCreado = tipo.id; // Establecer el ID para modo edición

    // Restaurar campos seleccionados si existen
    if (
        tipo.campos_personalizados &&
        Array.isArray(tipo.campos_personalizados)
    ) {
        window.camposSeleccionadosWizard = tipo.campos_personalizados;
        console.log("📝 Campos restaurados:", window.camposSeleccionadosWizard);
    } else {
        window.camposSeleccionadosWizard = [];
    }

    // Restaurar plantillas seleccionadas si existen
    if (plantillas && Array.isArray(plantillas)) {
        // Mapear las plantillas del backend a la estructura que espera el frontend
        window.plantillasSeleccionadas = plantillas.map((p) => ({
            id: p.id,
            nombre: p.nombre,
            slug: p.slug,
            descripcion: p.descripcion || "",
            generar_automatico: p.generar_automatico || true,
            momento_generacion: p.momento_generacion || "al_aprobar",
            es_principal: p.es_principal || false,
            orden: p.orden || 1,
        }));
        console.log(
            "📋 Plantillas restauradas:",
            window.plantillasSeleccionadas
        );
    } else {
        window.plantillasSeleccionadas = [];
    }

    // Determinar el tipo de flujo desde los datos originales
    let tipoFlujo = "defecto"; // Por defecto
    if (tipo.flujo_aprobacion) {
        console.log("🔍 Analizando flujo_aprobacion:", tipo.flujo_aprobacion);

        // Si tiene flujo_aprobacion configurado, verificar si es personalizado
        // Puede venir como objeto con tipo, o como array, o con transiciones
        if (
            tipo.flujo_aprobacion.tipo === "personalizado" ||
            (Array.isArray(tipo.flujo_aprobacion.transiciones) &&
                tipo.flujo_aprobacion.transiciones.length > 0) ||
            tipo.flujo_aprobacion.personalizado === true ||
            (typeof tipo.flujo_aprobacion === "string" &&
                tipo.flujo_aprobacion === "personalizado")
        ) {
            tipoFlujo = "personalizado";
            console.log("✅ Flujo personalizado detectado");
        } else {
            console.log("ℹ️ Flujo por defecto");
        }
    } else {
        console.log("ℹ️ No hay flujo_aprobacion configurado, usando defecto");
    }

    // Guardar información de permisos si viene del backend
    const permisos = window.currentPermisos || {
        puede_editar_campos: true,
        tiene_solicitudes: false,
        solicitudes_count: 0,
        mensaje_bloqueo: null,
    };

    datosWizardTemp = {
        tipoIdCreado: tipo.id,
        modoEdicion: true,
        datosOriginales: tipo,
        plantillasOriginales: plantillas,
        camposOriginales: tipo.campos_personalizados,
        tipo_flujo: tipoFlujo, // Guardar el tipo de flujo
        flujo_aprobacion_original: tipo.flujo_aprobacion, // Guardar el flujo completo
        permisos: permisos, // Guardar permisos de edición
    };

    console.log("🔍 DEBUG - datosWizardTemp configurado:", datosWizardTemp);
    console.log("🔍 DEBUG - Tipo de flujo detectado:", tipoFlujo);
    console.log("🔍 DEBUG - Permisos:", permisos);

    const modal = document.createElement("div");
    modal.id = "wizardModal";
    modal.className =
        "fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50";
    modal.innerHTML = `
        <div class="relative top-10 mx-auto p-0 border w-11/12 max-w-4xl shadow-lg bg-white rounded-2xl mb-10">
            <!-- Header -->
            <div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-600 to-green-700 rounded-t-2xl">
                <div class="flex items-center justify-between">
                    <h3 class="text-xl font-semibold text-white">Editar Tipo de Solicitud: ${tipo.nombre}</h3>
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
                        <div class="flex flex-col items-center flex-1">
                            <div id="step1Indicator" class="flex items-center justify-center">
                                <div class="w-10 h-10 bg-white text-green-600 rounded-full flex items-center justify-center font-bold text-lg shadow-lg ring-4 ring-green-300">1</div>
                            </div>
                            <span class="mt-2 text-xs text-white font-medium text-center">Información<br>Básica</span>
                        </div>

                        <div class="flex-1 h-1 bg-green-400 mx-2 max-w-[80px]"></div>

                        <!-- Paso 2 -->
                        <div class="flex flex-col items-center flex-1">
                            <div id="step2Indicator" class="flex items-center justify-center">
                                <div class="w-10 h-10 bg-green-400 text-white rounded-full flex items-center justify-center font-semibold text-lg">2</div>
                            </div>
                            <span class="mt-2 text-xs text-white font-medium text-center">Campos del<br>Formulario</span>
                        </div>

                        <div class="flex-1 h-1 bg-green-400 mx-2 max-w-[80px]"></div>

                        <!-- Paso 3 -->
                        <div class="flex flex-col items-center flex-1">
                            <div id="step3Indicator" class="flex items-center justify-center">
                                <div class="w-10 h-10 bg-green-400 text-white rounded-full flex items-center justify-center font-semibold text-lg">3</div>
                            </div>
                            <span class="mt-2 text-xs text-white font-medium text-center">Flujo de<br>Aprobación</span>
                        </div>

                        <div class="flex-1 h-1 bg-green-400 mx-2 max-w-[80px]"></div>

                        <!-- Paso 4 -->
                        <div class="flex flex-col items-center flex-1">
                            <div id="step4Indicator" class="flex items-center justify-center">
                                <div class="w-10 h-10 bg-green-400 text-white rounded-full flex items-center justify-center font-semibold text-lg">4</div>
                            </div>
                            <span class="mt-2 text-xs text-white font-medium text-center">Plantillas</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Body con los pasos -->
            <div class="px-6 py-6">
                <div id="wizardContent">
                    <!-- El contenido del paso actual se cargará aquí -->
                </div>
            </div>

            <!-- Footer con botones -->
            <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between rounded-b-2xl">
                <button type="button" onclick="cerrarWizard()" class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                    Cancelar
                </button>
                <div class="flex gap-2">
                    <button type="button" id="btnAnterior" onclick="pasoAnteriorWizard()"
                        class="hidden px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                        </svg> 
                        Anterior
                    </button>
                    <button type="button" id="btnSiguiente" onclick="pasoSiguienteWizard()"
                        class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                        Siguiente →
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Refrescar token CSRF al abrir el wizard
    refrescarCSRFToken().then(() => {
        console.log("✅ Token CSRF refrescado al abrir wizard");
    });

    mostrarPasoWizard(1);

    // Agregar contador de caracteres para instrucciones
    document
        .getElementById("wizard_instrucciones")
        ?.addEventListener("input", function () {
            document.getElementById("contador_instrucciones").textContent =
                this.value.length;
        });
}

async function mostrarPasoWizard(paso) {
    // Solo guardar datos del paso actual si no estamos en la primera carga del modo edición
    // En modo edición, la primera vez que se muestra paso 1, NO debemos guardar porque los campos están vacíos
    const esModoCreacionOCambio =
        !datosWizardTemp.modoEdicion || datosWizardTemp.paso1;

    if (esModoCreacionOCambio && pasoActualWizard !== paso) {
        // Guardar datos del paso actual antes de cambiar
        guardarDatosPasoActual();
    }

    // Restaurar tipoIdCreado si existe en memoria temporal
    if (datosWizardTemp.tipoIdCreado && !tipoIdCreado) {
        tipoIdCreado = datosWizardTemp.tipoIdCreado;
        console.log("🔄 Restaurando tipoIdCreado:", tipoIdCreado);
    }

    pasoActualWizard = paso;
    actualizarProgressBar();
    actualizarBotonesWizard();

    const content = document.getElementById("wizardContent");

    switch (paso) {
        case 1:
            content.innerHTML = generarPaso1();
            await inicializarPaso1(); // Esperar a que se carguen los selects
            restaurarDatosPaso1();
            break;
        case 2:
            content.innerHTML = generarPaso2();
            inicializarPaso2();
            break;
        case 3:
            content.innerHTML = generarPaso3();
            await inicializarPaso3Flujos();
            break;
        case 4:
            content.innerHTML = generarPaso4();
            await inicializarPaso4();
            break;
    }
}

/**
 * Cambiar tipo de flujo (defecto/personalizado)
 */
function cambiarTipoFlujo(tipo) {
    console.log("🔄 Cambiando tipo de flujo a:", tipo);

    const configuracionPersonalizado = document.getElementById(
        "configuracion_flujo_personalizado"
    );
    const infoDefecto = document.getElementById("info_flujo_defecto");

    if (tipo === "personalizado") {
        // Mostrar configuración personalizada
        configuracionPersonalizado?.classList.remove("hidden");
        infoDefecto?.classList.add("hidden");

        // Cargar estados y transiciones si no se han cargado
        if (
            !window.estadosDisponibles ||
            window.estadosDisponibles.length === 0
        ) {
            cargarEstadosDisponibles();
        }
        if (!window.transicionesConfiguradas) {
            cargarTransicionesConfiguradas();
        }
    } else {
        // Mostrar info de flujo por defecto
        configuracionPersonalizado?.classList.add("hidden");
        infoDefecto?.classList.remove("hidden");
    }

    // Guardar selección en datos temporales
    datosWizardTemp.tipo_flujo = tipo;
}

/**
 * Inicializar paso 3 - Flujos de Aprobación
 */
async function inicializarPaso3Flujos() {
    console.log("========================================");
    console.log("📋 Inicializando Paso 3 - Flujos de Aprobación");
    console.log("========================================");

    // Debug: Mostrar estado actual
    console.log("🔍 datosWizardTemp:", datosWizardTemp);
    console.log("🔍 datosWizardTemp.tipo_flujo:", datosWizardTemp.tipo_flujo);
    console.log(
        "🔍 datosWizardTemp.flujo_aprobacion_original:",
        datosWizardTemp.flujo_aprobacion_original
    );
    console.log("🔍 datosWizardTemp.modoEdicion:", datosWizardTemp.modoEdicion);

    // Restaurar selección previa si existe
    const tipoFlujoGuardado = datosWizardTemp.tipo_flujo || "defecto";
    console.log("✅ Tipo de flujo a restaurar:", tipoFlujoGuardado);

    const radioDefecto = document.querySelector(
        'input[name="tipo_flujo"][value="defecto"]'
    );
    const radioPersonalizado = document.querySelector(
        'input[name="tipo_flujo"][value="personalizado"]'
    );

    if (tipoFlujoGuardado === "personalizado") {
        console.log("🔄 Configurando flujo PERSONALIZADO");
        if (radioPersonalizado) {
            radioPersonalizado.checked = true;
            console.log("✅ Radio button 'personalizado' marcado");
        } else {
            console.error("❌ No se encontró el radio button 'personalizado'");
        }
        cambiarTipoFlujo("personalizado");

        // Cargar estados y transiciones
        await cargarEstadosDisponibles();
        await cargarTransicionesConfiguradas();
    } else {
        console.log("🔄 Configurando flujo POR DEFECTO");
        if (radioDefecto) {
            radioDefecto.checked = true;
            console.log("✅ Radio button 'defecto' marcado");
        } else {
            console.error("❌ No se encontró el radio button 'defecto'");
        }
        cambiarTipoFlujo("defecto");
    }

    console.log("✅ Paso 3 inicializado correctamente");
    console.log("========================================");
}

/**
 * Inicializar paso 4 - Plantillas
 */
async function inicializarPaso4() {
    console.log("🔄 Inicializando Paso 4 - Plantillas...");
    console.log(
        "📋 window.plantillasSeleccionadas:",
        window.plantillasSeleccionadas
    );
    console.log(
        "📋 datosWizardTemp.plantillasOriginales:",
        datosWizardTemp.plantillasOriginales
    );

    // Cargar plantillas disponibles
    await cargarPlantillasDisponibles();

    // En modo edición, restaurar plantillas seleccionadas
    if (
        datosWizardTemp.modoEdicion &&
        window.plantillasSeleccionadas &&
        window.plantillasSeleccionadas.length > 0
    ) {
        console.log("📥 Modo Edición: Restaurando plantillas seleccionadas");
        renderizarPlantillasSeleccionadas();
    }

    // Configurar listeners de filtros
    const buscar = document.getElementById("buscarPlantilla");
    const filtroTipo = document.getElementById("filtroTipoDocumento");

    if (buscar) {
        buscar.addEventListener(
            "input",
            debounce(cargarPlantillasDisponibles, 500)
        );
    }

    if (filtroTipo) {
        filtroTipo.addEventListener("change", cargarPlantillasDisponibles);
    }

    console.log("✅ Paso 4 inicializado");
}

/**
 * Función debounce para búsqueda
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Guardar datos del paso actual en memoria temporal
 */
function guardarDatosPasoActual() {
    // Siempre guardar el tipoIdCreado
    datosWizardTemp.tipoIdCreado = tipoIdCreado;
    console.log("💾 Guardando tipoIdCreado:", tipoIdCreado);

    if (pasoActualWizard === 1) {
        // Guardar todos los campos del paso 1
        const campos = [
            "wizard_codigo",
            "wizard_nombre",
            "wizard_slug",
            "wizard_descripcion",
            "wizard_instrucciones",
            "wizard_categoria_id",
            "wizard_area_responsable_id",
            "wizard_requiere_pago",
            "wizard_valor_tramite",
            "wizard_dias_respuesta",
            "wizard_dias_alerta",
            "wizard_sla",
            "wizard_color",
            "wizard_color_text",
            "wizard_icono",
            "wizard_requiere_documentos",
            "wizard_activo",
        ];

        datosWizardTemp.paso1 = {};

        campos.forEach((campo) => {
            const elemento = document.getElementById(campo);
            if (elemento) {
                if (elemento.type === "checkbox") {
                    datosWizardTemp.paso1[campo] = elemento.checked;
                } else {
                    datosWizardTemp.paso1[campo] = elemento.value;
                }
            }
        });

        console.log("📦 Datos del Paso 1 guardados:", datosWizardTemp.paso1);
    } else if (pasoActualWizard === 2) {
        // Guardar campos seleccionados del paso 2
        datosWizardTemp.paso2 = {
            campos: window.camposSeleccionadosWizard || [],
        };
        console.log("📦 Datos del Paso 2 guardados:", datosWizardTemp.paso2);
    } else if (pasoActualWizard === 3) {
        // Guardar configuración del flujo del paso 3
        const tipoFlujoSeleccionado =
            document.querySelector('input[name="tipo_flujo"]:checked')?.value ||
            "defecto";
        datosWizardTemp.tipo_flujo = tipoFlujoSeleccionado;
        datosWizardTemp.paso3 = {
            tipo_flujo: tipoFlujoSeleccionado,
        };
        console.log("📦 Datos del Paso 3 guardados:", datosWizardTemp.paso3);
        console.log("   - Tipo de flujo:", tipoFlujoSeleccionado);
    }
}

/**
 * Restaurar datos del paso 1 desde memoria temporal
 */
function restaurarDatosPaso1() {
    console.log("🔍 DEBUG restaurarDatosPaso1:", {
        modoEdicion: datosWizardTemp.modoEdicion,
        tieneDatosOriginales: !!datosWizardTemp.datosOriginales,
        tienePaso1: !!datosWizardTemp.paso1,
        datosOriginales: datosWizardTemp.datosOriginales,
    });

    // Si estamos en modo edición y es la primera carga, usar datos originales
    if (
        datosWizardTemp.modoEdicion &&
        datosWizardTemp.datosOriginales &&
        !datosWizardTemp.paso1
    ) {
        console.log("📥 Modo Edición: Cargando datos originales del tipo");
        const tipo = datosWizardTemp.datosOriginales;

        // Mapear campos del tipo a campos del wizard
        const mapeo = {
            wizard_codigo: tipo.codigo,
            wizard_nombre: tipo.nombre,
            wizard_slug: tipo.slug,
            wizard_descripcion: tipo.descripcion || "",
            wizard_instrucciones: tipo.instrucciones || "",
            wizard_categoria_id: tipo.categoria_id,
            wizard_area_responsable_id: tipo.area_responsable_id,
            wizard_requiere_pago: tipo.requiere_pago || false,
            wizard_valor_tramite: tipo.valor_tramite || "",
            wizard_dias_respuesta: tipo.dias_respuesta,
            wizard_dias_alerta: tipo.dias_alerta,
            wizard_sla: tipo.sla_dias || "",
            wizard_color: tipo.color || "#3B82F6",
            wizard_icono: tipo.icono || "📄",
            wizard_requiere_documentos: tipo.requiere_documentos || false,
            wizard_activo: tipo.activo || false,
            wizard_requiere_aprobacion: tipo.requiere_aprobacion || false,
        };

        // Cargar valores en los campos
        Object.keys(mapeo).forEach((campo) => {
            const elemento = document.getElementById(campo);
            if (elemento) {
                const valor = mapeo[campo];

                if (elemento.type === "checkbox") {
                    elemento.checked = valor;
                    elemento.dispatchEvent(new Event("change"));
                } else {
                    elemento.value =
                        valor !== null && valor !== undefined ? valor : "";
                    elemento.dispatchEvent(new Event("input"));
                }

                console.log(`✅ Campo ${campo} cargado con valor:`, valor);
            }
        });

        // Mostrar campo de valor_tramite si requiere_pago está marcado
        const requierePago = document.getElementById("wizard_requiere_pago");
        const campoValorTramite = document.getElementById(
            "campo_valor_tramite"
        );
        if (requierePago && campoValorTramite) {
            if (requierePago.checked) {
                campoValorTramite.classList.remove("hidden");
            } else {
                campoValorTramite.classList.add("hidden");
            }
        }

        // Actualizar contadores
        const descripcion = document.getElementById("wizard_descripcion");
        const contador = document.getElementById("contador_descripcion");
        if (descripcion && contador) {
            contador.textContent = descripcion.value.length;
        }

        const instrucciones = document.getElementById("wizard_instrucciones");
        const contadorInst = document.getElementById("contador_instrucciones");
        if (instrucciones && contadorInst) {
            contadorInst.textContent = instrucciones.value.length;
        }

        console.log("✅ Datos originales cargados en modo edición");
        return;
    }

    // Si hay datos guardados temporalmente del paso 1, usarlos
    if (datosWizardTemp.paso1) {
        console.log("📥 Restaurando datos del Paso 1:", datosWizardTemp.paso1);

        // Los selects ya están cargados (await en inicializarPaso1)
        Object.keys(datosWizardTemp.paso1).forEach((campo) => {
            const elemento = document.getElementById(campo);
            if (elemento) {
                const valorGuardado = datosWizardTemp.paso1[campo];

                if (elemento.type === "checkbox") {
                    elemento.checked = valorGuardado;
                    // Disparar evento change para checkboxes
                    elemento.dispatchEvent(new Event("change"));
                } else {
                    elemento.value = valorGuardado;
                    // Disparar evento input
                    elemento.dispatchEvent(new Event("input"));
                }

                // Verificar que el select tenga el valor (si es select)
                if (elemento.tagName === "SELECT" && valorGuardado) {
                    console.log(
                        `🔍 Select ${campo}: Valor guardado=${valorGuardado}, Valor actual=${elemento.value}`
                    );
                    if (elemento.value !== valorGuardado) {
                        console.warn(
                            `⚠️ El select ${campo} no pudo restaurar el valor ${valorGuardado}`
                        );
                    }
                }
            } else {
                console.warn(`⚠️ No se encontró el elemento: ${campo}`);
            }
        });

        // Mostrar campo de valor_tramite si requiere_pago está marcado
        const requierePago = document.getElementById("wizard_requiere_pago");
        const campoValorTramite = document.getElementById(
            "campo_valor_tramite"
        );
        if (requierePago && campoValorTramite) {
            if (requierePago.checked) {
                campoValorTramite.classList.remove("hidden");
            } else {
                campoValorTramite.classList.add("hidden");
            }
        }

        // Actualizar contadores
        const descripcion = document.getElementById("wizard_descripcion");
        const contador = document.getElementById("contador_descripcion");
        if (descripcion && contador) {
            contador.textContent = descripcion.value.length;
        }

        console.log("✅ Datos del Paso 1 restaurados completamente");
    }
}

function actualizarProgressBar() {
    console.log("🔄 Actualizando progress bar para paso:", pasoActualWizard);

    // Actualizar indicadores específicos por ID
    const step1 = document.getElementById("step1Indicator");
    const step2 = document.getElementById("step2Indicator");
    const step3 = document.getElementById("step3Indicator");
    const step4 = document.getElementById("step4Indicator");

    if (!step1 || !step2 || !step3 || !step4) {
        console.error("❌ No se encontraron los indicadores de paso");
        return;
    }

    const steps = [
        { element: step1, num: 1 },
        { element: step2, num: 2 },
        { element: step3, num: 3 },
        { element: step4, num: 4 },
    ];

    steps.forEach(({ element, num }) => {
        const circle = element.querySelector("div");
        if (!circle) return;

        if (num < pasoActualWizard) {
            // Paso completado - Verde con checkmark
            circle.className =
                "w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg";
            circle.innerHTML = "✓";
            console.log(`✅ Paso ${num}: Completado`);
        } else if (num === pasoActualWizard) {
            // Paso actual - Blanco con ring azul
            circle.className =
                "w-10 h-10 bg-white text-blue-600 rounded-full flex items-center justify-center font-bold text-lg shadow-lg ring-4 ring-blue-300";
            circle.textContent = num;
            console.log(`🎯 Paso ${num}: Activo`);
        } else {
            // Paso pendiente - Azul claro
            circle.className =
                "w-10 h-10 bg-blue-400 text-white rounded-full flex items-center justify-center font-semibold text-lg";
            circle.textContent = num;
            console.log(`⏳ Paso ${num}: Pendiente`);
        }
    });

    // Actualizar las líneas conectoras
    const progressContainer = document.querySelector(
        "#wizardModal .flex.items-center.justify-between"
    );
    const lines = progressContainer
        ? progressContainer.querySelectorAll(".flex-1.h-1")
        : [];

    lines.forEach((line, index) => {
        const linePosition = index + 1; // La línea 0 está entre paso 1 y 2

        if (linePosition < pasoActualWizard) {
            // Línea completada - Verde
            line.className = "flex-1 h-1 bg-green-500 mx-2 max-w-[80px]";
        } else {
            // Línea pendiente - Azul claro
            line.className = "flex-1 h-1 bg-blue-400 mx-2 max-w-[80px]";
        }
    });

    console.log("✅ Progress bar actualizado");
}

function actualizarBotonesWizard() {
    const btnAnterior = document.getElementById("btnAnterior");
    const btnSiguiente = document.getElementById("btnSiguiente");
    const modoEdicion = datosWizardTemp.modoEdicion || false;

    // Botón anterior
    if (pasoActualWizard === 1) {
        btnAnterior.classList.add("hidden");
    } else {
        btnAnterior.classList.remove("hidden");
    }

    // Botón siguiente/finalizar
    if (pasoActualWizard === 4) {
        btnSiguiente.textContent = modoEdicion
            ? "Guardar Cambios"
            : "Finalizar Configuración";
    } else {
        btnSiguiente.textContent = "Siguiente →";
    }
}

function pasoAnteriorWizard() {
    if (pasoActualWizard > 1) {
        mostrarPasoWizard(pasoActualWizard - 1);
    }
}

async function pasoSiguienteWizard() {
    // Validar y guardar paso actual
    const validado = await validarYGuardarPaso(pasoActualWizard);

    if (validado) {
        if (pasoActualWizard < 4) {
            mostrarPasoWizard(pasoActualWizard + 1);
        } else {
            // Finalizar
            await finalizarWizard();
        }
    }
}

async function cerrarWizard() {
    // Verificar si estamos en modo edición
    const modoEdicion = datosWizardTemp.modoEdicion || false;

    if (tipoIdCreado) {
        // Si estamos en modo edición, solo preguntar si desea descartar cambios
        if (modoEdicion) {
            const result = await Swal.fire({
                title: "¿Descartar cambios?",
                text: "Los cambios no guardados se perderán",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Sí, descartar cambios",
                cancelButtonText: "Continuar editando",
                confirmButtonColor: "#dc2626",
                cancelButtonColor: "#6b7280",
                reverseButtons: true,
            });

            if (result.isConfirmed) {
                // Solo cerrar el modal, NO eliminar el registro
                document.getElementById("wizardModal").remove();
                mostrarToast("Cambios descartados", "info");
                cargarTiposSolicitud();
                limpiarEstadoWizard();
            }
            // Si result.isDismissed (Cancelar), no hacer nada y mantener el wizard abierto
        } else {
            // Modo creación: ofrecer opciones de guardar como borrador o eliminar
            const result = await Swal.fire({
                title: "¿Descartar configuración?",
                text: "Has comenzado a crear un tipo. ¿Qué deseas hacer?",
                icon: "warning",
                showDenyButton: true,
                showCancelButton: true,
                confirmButtonText: "Guardar como borrador",
                denyButtonText: "Descartar todo",
                cancelButtonText: "Continuar editando",
                confirmButtonColor: "#2563eb",
                denyButtonColor: "#dc2626",
                cancelButtonColor: "#6b7280",
                reverseButtons: true,
            });

            if (result.isConfirmed) {
                // Guardar como borrador (inactivo)
                document.getElementById("wizardModal").remove();
                mostrarToast("Tipo guardado como borrador", "info");
                cargarTiposSolicitud();
                limpiarEstadoWizard();
            } else if (result.isDenied) {
                // Descartar todo: eliminar tipo y transiciones creadas
                await descartarTodoWizard();
            }
            // Si result.isDismissed (Cancelar), no hacer nada y mantener el wizard abierto
        }
    } else {
        document.getElementById("wizardModal").remove();
        limpiarEstadoWizard();
    }
}

/**
 * Descartar todo: eliminar el tipo de solicitud y sus transiciones
 */
async function descartarTodoWizard() {
    if (!tipoIdCreado) {
        document.getElementById("wizardModal")?.remove();
        limpiarEstadoWizard();
        return;
    }

    try {
        // Mostrar loading
        mostrarToast(
            "Descartando...",
            "info",
            "Eliminando tipo de solicitud y transiciones"
        );

        // 1. Eliminar todas las transiciones específicas del tipo
        const responseTransiciones = await fetch(
            `/admin/api/configuracion/flujos-transiciones?tipo_solicitud_id=${tipoIdCreado}&solo_especificas=true`,
            {
                headers: {
                    "X-CSRF-TOKEN": document.querySelector(
                        'meta[name="csrf-token"]'
                    ).content,
                },
            }
        );

        if (responseTransiciones.ok) {
            const dataTransiciones = await responseTransiciones.json();
            if (
                dataTransiciones.success &&
                dataTransiciones.transiciones.length > 0
            ) {
                // Eliminar cada transición
                const deletePromises = dataTransiciones.transiciones.map(
                    (trans) =>
                        fetch(
                            `/admin/api/configuracion/flujos-transiciones/${trans.id}`,
                            {
                                method: "DELETE",
                                headers: {
                                    "X-CSRF-TOKEN": document.querySelector(
                                        'meta[name="csrf-token"]'
                                    ).content,
                                    "Content-Type": "application/json",
                                },
                            }
                        )
                );

                await Promise.all(deletePromises);
                console.log(
                    `${dataTransiciones.transiciones.length} transiciones eliminadas`
                );
            }
        }

        // 2. Eliminar el tipo de solicitud
        const responseTipo = await fetch(
            `/admin/api/tipos-solicitud/${tipoIdCreado}`,
            {
                method: "DELETE",
                headers: {
                    "X-CSRF-TOKEN": document.querySelector(
                        'meta[name="csrf-token"]'
                    ).content,
                    "Content-Type": "application/json",
                },
            }
        );

        if (!responseTipo.ok) {
            throw new Error("No se pudo eliminar el tipo de solicitud");
        }

        // Cerrar el wizard y limpiar
        document.getElementById("wizardModal")?.remove();
        limpiarEstadoWizard();

        // Recargar la lista de tipos
        cargarTiposSolicitud();

        // Mostrar mensaje de éxito
        mostrarToast(
            "Descartado exitosamente",
            "success",
            "El tipo de solicitud y sus transiciones fueron eliminados"
        );
    } catch (error) {
        console.error("Error al descartar:", error);
        mostrarToast(
            "Error al descartar",
            "error",
            error.message ||
                "No se pudo eliminar completamente. Por favor, revisa manualmente."
        );

        // Aun con error, cerrar el wizard
        document.getElementById("wizardModal")?.remove();
        limpiarEstadoWizard();
        cargarTiposSolicitud();
    }
}

/**
 * Limpiar estado del wizard (variables globales)
 */
function limpiarEstadoWizard() {
    // Limpiar variables globales
    tipoIdCreado = null;
    pasoActualWizard = 1;
    window.estadosDisponibles = [];
    window.transicionesConfiguradas = [];
    window.transicionesTodas = [];
    window.categoriasDisponibles = [];
    window.areasDisponibles = [];
    window.rolesDisponibles = [];
    window.plantillasSeleccionadas = [];
    window.todasLasPlantillas = [];

    console.log("Estado del wizard limpiado");
}

// ========================================
// GENERACIÓN DE PASOS DEL WIZARD
// ========================================

function generarPaso1() {
    return `
        <div class="space-y-6">
            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                <p class="text-sm text-blue-700">
                    <strong>Paso 1 de 4:</strong> Configura la información básica del tipo de solicitud.
                    Todos los campos marcados con <span class="text-red-500">*</span> son obligatorios.
                </p>
            </div>

            <!-- Código y Nombre -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Código <span class="text-red-500">*</span>
                    </label>
                    <input type="text" id="wizard_codigo" 
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ej: CERT-NOM-001"
                        maxlength="50"
                        oninput="this.value = this.value.toUpperCase();">
                    <p class="mt-1 text-xs text-gray-500">Identificador único del tipo</p>
                    <p id="error_codigo" class="mt-1 text-xs text-red-600 hidden"></p>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Nombre <span class="text-red-500">*</span>
                    </label>
                    <input type="text" id="wizard_nombre" 
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ej: Certificado de Nomenclatura"
                        maxlength="255"
                        oninput="generarSlugTipoSolicitud()">
                    <p id="error_nombre" class="mt-1 text-xs text-red-600 hidden"></p>
                </div>
            </div>

            <!-- Slug -->
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                    Slug <span class="text-red-500">*</span>
                    <button type="button" onclick="regenerarSlugTipo()" 
                        class="ml-2 text-xs text-blue-600 hover:text-blue-800"
                        title="Regenerar desde el nombre">
                        <svg class="w-3 h-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                        </svg>
                    </button>
                </label>
                <input type="text" id="wizard_slug" required
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    placeholder="ej: certificado-nomenclatura"
                    pattern='[a-z0-9\-]+'
                    title="Solo letras minúsculas, números y guiones">
                <p class="mt-1 text-xs text-gray-500">Se genera automáticamente del nombre. Debe ser único.</p>
                <p id="error_slug" class="mt-1 text-xs text-red-600 hidden"></p>
            </div>

            <!-- Descripción -->
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                    Descripción <span class="text-red-500">*</span>
                </label>
                <textarea id="wizard_descripcion" rows="3"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe el propósito y uso de este tipo de solicitud..."
                    maxlength="500"></textarea>
                <p class="mt-1 text-xs text-gray-500">
                    <span id="contador_descripcion">0</span>/500 caracteres
                </p>
                <p id="error_descripcion" class="mt-1 text-xs text-red-600 hidden"></p>
            </div>

            <!-- Instrucciones -->
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                    Instrucciones para el Solicitante
                </label>
                <textarea id="wizard_instrucciones" rows="4"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Pasos detallados que debe seguir el usuario para presentar esta solicitud..."
                    maxlength="1000"></textarea>
                <p class="mt-1 text-xs text-gray-500">
                    <span id="contador_instrucciones">0</span>/1000 caracteres
                </p>
            </div>

            <!-- Categoría y Área -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Categoría <span class="text-red-500">*</span>
                    </label>
                    <select id="wizard_categoria_id" 
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="">Seleccione una categoría</option>
                    </select>
                    <p id="error_categoria_id" class="mt-1 text-xs text-red-600 hidden"></p>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Área Responsable <span class="text-red-500">*</span>
                    </label>
                    <select id="wizard_area_responsable_id" 
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="">Seleccione un área</option>
                    </select>
                    <p id="error_area_responsable_id" class="mt-1 text-xs text-red-600 hidden"></p>
                </div>
            </div>

            <!-- Tiempos -->
            <div class="bg-gray-50 p-4 rounded-lg">
                <h4 class="text-sm font-semibold text-gray-700 mb-4">⏱️ Tiempos de Gestión</h4>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Días de Respuesta <span class="text-red-500">*</span>
                        </label>
                        <input type="number" id="wizard_dias_respuesta" min="1" max="365"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="5" value="5">
                        <p class="mt-1 text-xs text-gray-500">Días hábiles para responder</p>
                        <p id="error_dias_respuesta" class="mt-1 text-xs text-red-600 hidden"></p>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Días de Alerta <span class="text-red-500">*</span>
                        </label>
                        <input type="number" id="wizard_dias_alerta" min="1" max="30"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="2" value="2">
                        <p class="mt-1 text-xs text-gray-500">Días antes del vencimiento</p>
                        <p id="error_dias_alerta" class="mt-1 text-xs text-red-600 hidden"></p>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            SLA (días) <span class="text-red-500">*</span>
                        </label>
                        <input type="number" id="wizard_sla" min="1" max="365"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="30">
                        <p id="error_sla" class="mt-1 text-xs text-red-600 hidden"></p>
                    </div>
                </div>
            </div>

            <!-- Opciones Adicionales -->
            <div class="bg-gray-50 p-4 rounded-lg">
                <h4 class="text-sm font-semibold text-gray-700 mb-4">⚙️ Configuración Adicional</h4>
                <div class="space-y-3">
                    <label class="flex items-center cursor-pointer">
                        <input type="checkbox" id="wizard_requiere_aprobacion" 
                            class="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500">
                        <span class="ml-3 text-sm text-gray-700">Requiere aprobación previa</span>
                    </label>
                    
                    <label class="flex items-center cursor-pointer">
                        <input type="checkbox" id="wizard_requiere_pago" 
                            class="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500">
                        <span class="ml-3 text-sm text-gray-700">Requiere pago</span>
                    </label>
                    
                    <div id="campo_valor_tramite" class="ml-8 hidden">
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Valor del Trámite ($)
                        </label>
                        <input type="number" id="wizard_valor_tramite" min="0" step="0.01"
                            class="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0.00">
                    </div>

                    <label class="flex items-center cursor-pointer">
                        <input type="checkbox" id="wizard_requiere_documentos" 
                            class="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500">
                        <span class="ml-3 text-sm text-gray-700">Requiere adjuntar documentos</span>
                    </label>
                </div>
            </div>

            <!-- Icono y Color -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Icono
                    </label>
                    <select id="wizard_icono" 
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="📄">📄 Documento</option>
                        <option value="📝">📝 Formulario</option>
                        <option value="💼">💼 Trabajo</option>
                        <option value="🔧">🔧 Servicio</option>
                        <option value="📋">📋 Checklist</option>
                        <option value="🎯">🎯 Objetivo</option>
                        <option value="⚡">⚡ Urgente</option>
                        <option value="🔒">🔒 Seguridad</option>
                    </select>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Color
                    </label>
                    <div class="flex gap-2">
                        <input type="color" id="wizard_color" value="#3B82F6"
                            class="w-16 h-10 border border-gray-300 rounded cursor-pointer">
                        <input type="text" id="wizard_color_text" value="#3B82F6"
                            class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="#3B82F6" maxlength="7">
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function inicializarPaso1() {
    console.log("🔄 Inicializando Paso 1...");

    // Cargar categorías y áreas en paralelo y ESPERAR
    await Promise.all([
        cargarCategorias("wizard_categoria_id"),
        cargarAreas("wizard_area_responsable_id"),
    ]);

    console.log("✅ Categorías y áreas cargadas");

    // Contador de descripción
    const descripcion = document.getElementById("wizard_descripcion");
    const contador = document.getElementById("contador_descripcion");
    if (descripcion && contador) {
        descripcion.addEventListener("input", () => {
            contador.textContent = descripcion.value.length;
        });
    }

    // Sincronizar color picker con input text
    const colorPicker = document.getElementById("wizard_color");
    const colorText = document.getElementById("wizard_color_text");

    if (colorPicker && colorText) {
        colorPicker.addEventListener("input", (e) => {
            colorText.value = e.target.value.toUpperCase();
        });

        colorText.addEventListener("input", (e) => {
            const valor = e.target.value;
            if (/^#[0-9A-Fa-f]{6}$/.test(valor)) {
                colorPicker.value = valor;
            }
        });
    }

    // Mostrar/ocultar campo de valor_tramite
    const requierePago = document.getElementById("wizard_requiere_pago");
    const campoValorTramite = document.getElementById("campo_valor_tramite");

    if (requierePago && campoValorTramite) {
        requierePago.addEventListener("change", (e) => {
            if (e.target.checked) {
                campoValorTramite.classList.remove("hidden");
            } else {
                campoValorTramite.classList.add("hidden");
                document.getElementById("wizard_valor_tramite").value = "";
            }
        });
    }

    // Validación en tiempo real
    agregarValidacionTiempoReal();

    console.log("✅ Paso 1 inicializado completamente");
}

/**
 * Inicializar Paso 2 - Flujos de Aprobación
 */
function inicializarPaso2() {
    // Global array to store selected fields (predefined + custom)
    window.camposSeleccionadosWizard = window.camposSeleccionadosWizard || [];

    // Verificar si se pueden editar los campos
    const permisos = datosWizardTemp.permisos || {};
    const puedeEditarCampos = permisos.puede_editar_campos !== false;

    console.log("📋 Inicializando Paso 2");
    console.log("   - Puede editar campos:", puedeEditarCampos);
    console.log("   - Permisos:", permisos);

    // Si no se pueden editar campos, mostrar advertencia
    if (!puedeEditarCampos && datosWizardTemp.modoEdicion) {
        const container = document.getElementById(
            "campos_seleccionados_container"
        );
        if (container) {
            // Agregar advertencia al inicio del contenedor
            const advertencia = document.createElement("div");
            advertencia.className =
                "bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4";
            advertencia.innerHTML = `
                <div class="flex">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                        </svg>
                    </div>
                    <div class="ml-3">
                        <h3 class="text-sm font-medium text-yellow-800">Campos no editables</h3>
                        <p class="mt-1 text-sm text-yellow-700">
                            ${
                                permisos.mensaje_bloqueo ||
                                "No se pueden modificar los campos de este tipo de solicitud porque ya tiene solicitudes radicadas."
                            }
                        </p>
                        <p class="mt-2 text-xs text-yellow-600">
                            Puedes ver los campos configurados pero no agregar, eliminar o reordenarlos.
                        </p>
                    </div>
                </div>
            `;
            container.parentElement.insertBefore(advertencia, container);
        }

        // Deshabilitar checkboxes de campos predefinidos
        document.querySelectorAll(".campo-predefinido").forEach((checkbox) => {
            checkbox.disabled = true;
            checkbox.style.cursor = "not-allowed";
            checkbox.parentElement.style.opacity = "0.6";
        });

        // Deshabilitar botón de agregar campo personalizado
        const btnAgregarCampo = container?.querySelector(
            'button[onclick="abrirModalCampoPersonalizado()"]'
        );
        if (btnAgregarCampo) {
            btnAgregarCampo.disabled = true;
            btnAgregarCampo.classList.add("opacity-50", "cursor-not-allowed");
            btnAgregarCampo.onclick = (e) => {
                e.preventDefault();
                mostrarToast(
                    "No se pueden agregar campos porque el tipo tiene solicitudes radicadas",
                    "warning"
                );
            };
        }
    } else {
        // Event listeners for predefined fields checkboxes (solo si puede editar)
        const checkboxes = document.querySelectorAll(".campo-predefinido");
        checkboxes.forEach((checkbox) => {
            checkbox.addEventListener("change", (e) => {
                if (e.target.checked) {
                    agregarCampoPredefinido(e.target.value);
                } else {
                    removerCampoPredefinido(e.target.value);
                }
            });
        });
    }

    // Load campos from biblioteca
    cargarCamposBiblioteca();

    // Restore selected fields from temp data
    restaurarCamposSeleccionados();
}

/**
 * Helper functions for Step 2 - Form Fields
 */

async function cargarCamposBiblioteca() {
    try {
        const response = await fetch(
            "/admin/api/configuracion/campos-personalizados",
            {
                headers: {
                    "X-Requested-With": "XMLHttpRequest",
                    Accept: "application/json",
                    "X-CSRF-TOKEN":
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute("content") || "",
                },
            }
        );

        if (!response.ok) {
            throw new Error("Error al cargar campos de la biblioteca");
        }

        const data = await response.json();
        console.log("📚 Campos de biblioteca cargados:", data);

        renderizarCamposBiblioteca(data.campos.data || []);
    } catch (error) {
        console.error("❌ Error al cargar campos de biblioteca:", error);
        const container = document.getElementById("campos_biblioteca_list");
        if (container) {
            container.innerHTML = `
                <div class="text-center text-red-400 py-8">
                    <p class="text-sm">Error al cargar campos</p>
                    <button onclick="cargarCamposBiblioteca()" class="mt-2 text-xs text-blue-600 hover:underline">
                        Reintentar
                    </button>
                </div>
            `;
        }
    }
}

function renderizarCamposBiblioteca(campos) {
    const container = document.getElementById("campos_biblioteca_list");
    if (!container) return;

    if (!campos || campos.length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-400 py-8">
                <p class="text-sm">No hay campos en la biblioteca</p>
                <a href="/admin/configuracion/campos-personalizados" target="_blank"
                   class="mt-2 text-xs text-blue-600 hover:underline inline-block">
                    Ir a la biblioteca →
                </a>
            </div>
        `;
        return;
    }

    // Only show active campos
    const camposActivos = campos.filter((c) => c.activo);

    container.innerHTML = camposActivos
        .map((campo) => {
            const iconoTipo = {
                text: "📝",
                textarea: "📄",
                number: "🔢",
                email: "📧",
                tel: "📞",
                date: "📅",
                time: "⏰",
                select: "📋",
                radio: "🔘",
                checkbox: "☑️",
                file: "📎",
                mapa: "🗺️",
            };

            const icono = iconoTipo[campo.tipo] || campo.icono || "📌";

            return `
            <label class="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded border border-transparent hover:border-blue-200">
                <div class="flex items-center flex-1">
                    <input type="checkbox" value="${campo.id}" data-campo-id="${
                campo.id
            }"
                           class="campo-biblioteca w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
                    <div class="ml-3">
                        <span class="text-sm font-medium text-gray-700">${icono} ${
                campo.etiqueta || campo.nombre
            }</span>
                        ${
                            campo.descripcion
                                ? `<p class="text-xs text-gray-500 mt-0.5">${campo.descripcion}</p>`
                                : ""
                        }
                    </div>
                </div>
                <span class="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">${
                    campo.tipo
                }</span>
            </label>
        `;
        })
        .join("");

    // Add event listeners
    const checkboxes = container.querySelectorAll(".campo-biblioteca");
    checkboxes.forEach((checkbox) => {
        checkbox.addEventListener("change", (e) => {
            const campoId = parseInt(e.target.dataset.campoId);
            const campo = camposActivos.find((c) => c.id === campoId);

            if (e.target.checked && campo) {
                agregarCampoBiblioteca(campo);
            } else {
                removerCampoBiblioteca(campoId);
            }
        });
    });
}

function agregarCampoBiblioteca(campo) {
    // Check if already exists
    const existe = window.camposSeleccionadosWizard.find(
        (c) => c.campo_id === campo.id && c.tipo_origen === "biblioteca"
    );
    if (existe) return;

    const iconoTipo = {
        text: "📝",
        textarea: "📄",
        number: "🔢",
        email: "📧",
        tel: "📞",
        date: "📅",
        time: "⏰",
        select: "📋",
        radio: "🔘",
        checkbox: "☑️",
        file: "📎",
        mapa: "🗺️",
    };

    window.camposSeleccionadosWizard.push({
        campo_id: campo.id,
        slug: campo.slug,
        nombre: `${iconoTipo[campo.tipo] || campo.icono || "📌"} ${
            campo.etiqueta || campo.nombre
        }`,
        tipo: campo.tipo,
        tipo_origen: "biblioteca",
        orden: window.camposSeleccionadosWizard.length + 1,
    });

    renderizarCamposSeleccionados();
}

function removerCampoBiblioteca(campoId) {
    window.camposSeleccionadosWizard = window.camposSeleccionadosWizard.filter(
        (c) => !(c.campo_id === campoId && c.tipo_origen === "biblioteca")
    );
    renderizarCamposSeleccionados();
}

// Mapping of predefined field names
const camposPredefinidosNombres = {
    direccion: "📍 Dirección del Predio",
    barrio: "🏘️ Barrio/Sector",
    estrato: "📊 Estrato",
    uso_predio: "🏢 Uso del Predio",
    area_m2: "📐 Área en m²",
    ubicacion_mapa: "🗺️ Ubicación en Mapa",
    observaciones: "📝 Observaciones",
};

function agregarCampoPredefinido(slug) {
    // Check if already exists
    const existe = window.camposSeleccionadosWizard.find(
        (c) => c.slug === slug && c.tipo_origen === "predefinido"
    );
    if (existe) return;

    window.camposSeleccionadosWizard.push({
        slug: slug,
        nombre: camposPredefinidosNombres[slug] || slug,
        tipo_origen: "predefinido",
        orden: window.camposSeleccionadosWizard.length + 1,
    });

    renderizarCamposSeleccionados();
}

function removerCampoPredefinido(slug) {
    window.camposSeleccionadosWizard = window.camposSeleccionadosWizard.filter(
        (c) => !(c.slug === slug && c.tipo_origen === "predefinido")
    );
    renderizarCamposSeleccionados();
}

function agregarCampoPersonalizadoNuevo(tipo, etiqueta, obligatorio) {
    window.camposSeleccionadosWizard.push({
        tipo: tipo,
        etiqueta: etiqueta,
        nombre: etiqueta,
        obligatorio: obligatorio,
        tipo_origen: "personalizado",
        orden: window.camposSeleccionadosWizard.length + 1,
    });

    renderizarCamposSeleccionados();
}

function renderizarCamposSeleccionados() {
    const container = document.getElementById("campos_seleccionados_list");
    if (!container) return;

    if (window.camposSeleccionadosWizard.length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-400 py-12 border-2 border-dashed border-gray-300 rounded-lg">
                <svg class="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <p class="text-sm">Selecciona al menos un campo</p>
            </div>
        `;
        return;
    }

    // Verificar si se pueden editar los campos
    const permisos = datosWizardTemp.permisos || {};
    const puedeEditarCampos = permisos.puede_editar_campos !== false;

    // Sort by orden
    const sorted = [...window.camposSeleccionadosWizard].sort(
        (a, b) => a.orden - b.orden
    );

    container.innerHTML = sorted
        .map((campo, index) => {
            const icono = campo.tipo_origen === "predefinido" ? "📋" : "✏️";
            const badge = campo.obligatorio
                ? '<span class="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Obligatorio</span>'
                : "";

            // Si no puede editar, deshabilitar el drag y el botón de eliminar
            const draggable = puedeEditarCampos
                ? 'draggable="true" cursor-move'
                : "";
            const cursorClass = puedeEditarCampos
                ? "cursor-move"
                : "cursor-default";
            const deleteButton = puedeEditarCampos
                ? `<button type="button" onclick="removerCampoSeleccionado(${index})"
                       class="text-red-600 hover:text-red-800 hover:bg-red-50 p-1 rounded">
                       <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                       </svg>
                   </button>`
                : `<svg class="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                   </svg>`;

            return `
            <div class="campo-seleccionado flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 ${cursorClass}"
                 data-index="${index}" ${draggable}>
                <div class="flex items-center space-x-3">
                    ${
                        puedeEditarCampos
                            ? `<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"></path>
                    </svg>`
                            : ""
                    }
                    <span class="text-sm font-medium text-gray-700">${icono} ${
                campo.nombre
            }</span>
                    ${badge}
                </div>
                ${deleteButton}
            </div>
        `;
        })
        .join("");

    // Initialize drag & drop (solo si puede editar)
    if (puedeEditarCampos) {
        initializarDragAndDrop();
    }
}

function removerCampoSeleccionado(index) {
    const campo = window.camposSeleccionadosWizard[index];

    // If it's a predefined field, uncheck the checkbox
    if (campo.tipo_origen === "predefinido") {
        const checkbox = document.querySelector(
            `.campo-predefinido[value="${campo.slug}"]`
        );
        if (checkbox) checkbox.checked = false;
    }

    // If it's from biblioteca, uncheck the checkbox
    if (campo.tipo_origen === "biblioteca" && campo.campo_id) {
        const checkbox = document.querySelector(
            `.campo-biblioteca[data-campo-id="${campo.campo_id}"]`
        );
        if (checkbox) checkbox.checked = false;
    }

    window.camposSeleccionadosWizard.splice(index, 1);
    renderizarCamposSeleccionados();
}

function initializarDragAndDrop() {
    const items = document.querySelectorAll(".campo-seleccionado");
    let draggedItem = null;

    items.forEach((item) => {
        item.addEventListener("dragstart", function (e) {
            draggedItem = this;
            this.style.opacity = "0.5";
        });

        item.addEventListener("dragend", function (e) {
            this.style.opacity = "1";
        });

        item.addEventListener("dragover", function (e) {
            e.preventDefault();
        });

        item.addEventListener("drop", function (e) {
            e.preventDefault();
            if (draggedItem !== this) {
                const fromIndex = parseInt(draggedItem.dataset.index);
                const toIndex = parseInt(this.dataset.index);

                // Swap in array
                const temp = window.camposSeleccionadosWizard[fromIndex];
                window.camposSeleccionadosWizard[fromIndex] =
                    window.camposSeleccionadosWizard[toIndex];
                window.camposSeleccionadosWizard[toIndex] = temp;

                // Update orden
                window.camposSeleccionadosWizard.forEach(
                    (campo, i) => (campo.orden = i + 1)
                );

                renderizarCamposSeleccionados();
            }
        });
    });
}

function restaurarCamposSeleccionados() {
    console.log("🔄 Restaurando campos seleccionados...");
    console.log("📝 datosWizardTemp.paso2:", datosWizardTemp.paso2);
    console.log(
        "📝 datosWizardTemp.camposOriginales:",
        datosWizardTemp.camposOriginales
    );
    console.log(
        "📝 window.camposSeleccionadosWizard:",
        window.camposSeleccionadosWizard
    );

    // En modo edición, si es la primera vez que se muestra el paso 2, cargar desde camposOriginales
    if (
        datosWizardTemp.modoEdicion &&
        datosWizardTemp.camposOriginales &&
        !datosWizardTemp.paso2
    ) {
        console.log("📥 Modo Edición: Cargando campos originales");

        // Los campos vienen del API con la estructura del pivot
        // window.camposSeleccionadosWizard ya se estableció en abrirModalEditarTipo

        // Marcar checkboxes de campos predefinidos si existen
        if (
            window.camposSeleccionadosWizard &&
            window.camposSeleccionadosWizard.length > 0
        ) {
            window.camposSeleccionadosWizard.forEach((campo) => {
                if (
                    campo.categoria === "predefinido" ||
                    campo.categoria === "ubicacion" ||
                    campo.categoria === "clasificacion"
                ) {
                    const checkbox = document.querySelector(
                        `.campo-predefinido[value="${campo.slug}"]`
                    );
                    if (checkbox) {
                        checkbox.checked = true;
                        console.log(`✅ Checkbox marcado para: ${campo.slug}`);
                    }
                }
            });
        }

        renderizarCamposSeleccionados();
        console.log("✅ Campos originales restaurados");
        return;
    }

    // Restaurar desde paso2 guardado temporalmente (al navegar entre pasos)
    if (datosWizardTemp.paso2 && datosWizardTemp.paso2.campos) {
        window.camposSeleccionadosWizard = datosWizardTemp.paso2.campos;

        // Check the checkboxes for predefined fields
        datosWizardTemp.paso2.campos.forEach((campo) => {
            if (campo.tipo_origen === "predefinido") {
                const checkbox = document.querySelector(
                    `.campo-predefinido[value="${campo.slug}"]`
                );
                if (checkbox) checkbox.checked = true;
            }
        });

        renderizarCamposSeleccionados();
        console.log("✅ Campos del paso2 restaurados");
    }
}

/**
 * Vista previa del formulario en el wizard
 */
function vistaPreviaFormularioWizard() {
    console.log("📋 Mostrando vista previa del formulario");
    console.log("📝 Campos seleccionados:", window.camposSeleccionadosWizard);

    if (
        !window.camposSeleccionadosWizard ||
        window.camposSeleccionadosWizard.length === 0
    ) {
        mostrarToast("No hay campos seleccionados para previsualizar", "info");
        return;
    }

    // Obtener nombre del tipo de solicitud
    const nombreTipo =
        document.getElementById("wizard_nombre")?.value || "Tipo de Solicitud";

    // Generar HTML de la vista previa
    let htmlPreview = `
        <div class="text-left">
            <!-- Encabezado del formulario -->
            <div class="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-lg mb-6">
                <h3 class="text-xl font-bold mb-2">${nombreTipo}</h3>
                <p class="text-green-100 text-sm">Complete el siguiente formulario con la información solicitada</p>
            </div>

            <div class="bg-white space-y-6">
                <!-- Sección: Datos del Solicitante -->
                <div class="border-b pb-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <svg class="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                        Datos del Solicitante
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        ${generarCampoPreview(
                            "Tipo de Documento",
                            "select",
                            false,
                            null,
                            [
                                "Cédula de Ciudadanía",
                                "Cédula de Extranjería",
                                "Pasaporte",
                                "NIT",
                            ]
                        )}
                        ${generarCampoPreview(
                            "Número de Documento",
                            "text",
                            false,
                            "1234567890"
                        )}
                        ${generarCampoPreview(
                            "Nombres",
                            "text",
                            false,
                            "Juan Carlos"
                        )}
                        ${generarCampoPreview(
                            "Apellidos",
                            "text",
                            false,
                            "Pérez González"
                        )}
                        ${generarCampoPreview(
                            "Correo Electrónico",
                            "email",
                            false,
                            "juan.perez@example.com"
                        )}
                        ${generarCampoPreview(
                            "Teléfono",
                            "tel",
                            false,
                            "300 123 4567"
                        )}
                    </div>
                </div>

                <!-- Sección: Información Específica -->
                <div>
                    <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <svg class="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        Información de la Solicitud
                    </h3>
                    <div class="grid grid-cols-1 gap-4">
                        ${generarCamposPersonalizadosPreview()}
                    </div>
                </div>

                <!-- Botones de acción (simulados) -->
                <div class="flex justify-between items-center pt-6 border-t">
                    <button type="button" disabled class="px-6 py-2 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed">
                        Cancelar
                    </button>
                    <button type="button" disabled class="px-6 py-2 bg-blue-600 text-white rounded-lg cursor-not-allowed flex items-center">
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        Enviar Solicitud
                    </button>
                </div>

                <!-- Nota informativa -->
                <div class="bg-blue-50 border-l-4 border-blue-500 p-4 mt-4">
                    <p class="text-sm text-blue-700">
                        <strong>Nota:</strong> Esta es una vista previa del formulario. Los campos mostrados son solo de ejemplo y no se puede interactuar con ellos.
                    </p>
                </div>
            </div>
        </div>
    `;

    // Mostrar en modal HTML personalizado
    const modalVistaPrevia = document.getElementById(
        "modalVistaPreviaFormulario"
    );
    const contenidoVistaPrevia = document.getElementById(
        "contenidoVistaPrevia"
    );

    if (modalVistaPrevia && contenidoVistaPrevia) {
        contenidoVistaPrevia.innerHTML = htmlPreview;
        modalVistaPrevia.classList.remove("hidden");
        console.log("✅ Modal de vista previa abierto correctamente");
    } else {
        console.error("❌ No se encontró el modal de vista previa");
        mostrarToast("Error al abrir vista previa", "error");
    }
}

/**
 * Cerrar modal de vista previa
 */
function cerrarModalVistaPrevia() {
    const modalVistaPrevia = document.getElementById(
        "modalVistaPreviaFormulario"
    );
    if (modalVistaPrevia) {
        modalVistaPrevia.classList.add("hidden");
        console.log("✅ Modal de vista previa cerrado");
    }
}

/**
 * Generar HTML de un campo para la vista previa
 */
function generarCampoPreview(
    label,
    tipo,
    obligatorio,
    valorEjemplo = "",
    opciones = null
) {
    const requiredMark = obligatorio
        ? '<span class="text-red-500 ml-1">*</span>'
        : "";
    let inputHTML = "";

    switch (tipo) {
        case "text":
            inputHTML = `<input type="text" value="${valorEjemplo}" disabled class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">`;
            break;
        case "email":
            inputHTML = `<input type="email" value="${valorEjemplo}" disabled class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">`;
            break;
        case "tel":
            inputHTML = `<input type="tel" value="${valorEjemplo}" disabled class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">`;
            break;
        case "number":
            inputHTML = `<input type="number" value="${valorEjemplo}" disabled class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">`;
            break;
        case "date":
            inputHTML = `<input type="date" value="${valorEjemplo}" disabled class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">`;
            break;
        case "select":
            inputHTML = `<select disabled class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                <option>Seleccione una opción...</option>
                ${
                    opciones
                        ? opciones.map((o) => `<option>${o}</option>`).join("")
                        : ""
                }
            </select>`;
            break;
        case "textarea":
            inputHTML = `<textarea rows="3" disabled class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">${valorEjemplo}</textarea>`;
            break;
        default:
            inputHTML = `<input type="text" disabled class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">`;
    }

    return `
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
                ${label}${requiredMark}
            </label>
            ${inputHTML}
        </div>
    `;
}

/**
 * Generar HTML de los campos personalizados seleccionados
 */
function generarCamposPersonalizadosPreview() {
    let html = "";
    const campos = [...window.camposSeleccionadosWizard].sort(
        (a, b) => (a.orden || 0) - (b.orden || 0)
    );

    campos.forEach((campo, index) => {
        const obligatorio =
            campo.obligatorio || campo.pivot?.obligatorio || false;
        const etiqueta = campo.etiqueta || campo.nombre || `Campo ${index + 1}`;
        const tipo = campo.tipo || "text";

        // Determinar el tipo de input HTML
        let tipoHTML = "text";
        let opciones = null;

        switch (tipo) {
            case "text":
            case "texto":
            case "texto_corto":
                tipoHTML = "text";
                break;
            case "textarea":
            case "texto_largo":
                tipoHTML = "textarea";
                break;
            case "number":
            case "numero":
                tipoHTML = "number";
                break;
            case "email":
            case "correo":
                tipoHTML = "email";
                break;
            case "tel":
            case "telefono":
                tipoHTML = "tel";
                break;
            case "date":
            case "fecha":
                tipoHTML = "date";
                break;
            case "select":
            case "lista":
                tipoHTML = "select";
                opciones = campo.opciones || [
                    "Opción 1",
                    "Opción 2",
                    "Opción 3",
                ];
                break;
            case "radio":
                tipoHTML = "radio";
                opciones = campo.opciones || ["Opción 1", "Opción 2"];
                break;
            case "checkbox":
                tipoHTML = "checkbox";
                opciones = campo.opciones || ["Opción 1", "Opción 2"];
                break;
            case "file":
            case "archivo":
                tipoHTML = "file";
                break;
            default:
                tipoHTML = "text";
        }

        // Generar HTML según el tipo
        if (tipoHTML === "radio") {
            html += `
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        ${etiqueta}${
                obligatorio ? '<span class="text-red-500 ml-1">*</span>' : ""
            }
                    </label>
                    <div class="space-y-2">
                        ${opciones
                            .map(
                                (opcion, i) => `
                            <label class="flex items-center">
                                <input type="radio" name="radio_${index}" disabled class="mr-2 text-blue-600">
                                <span class="text-sm text-gray-700">${opcion}</span>
                            </label>
                        `
                            )
                            .join("")}
                    </div>
                </div>
            `;
        } else if (tipoHTML === "checkbox") {
            html += `
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        ${etiqueta}${
                obligatorio ? '<span class="text-red-500 ml-1">*</span>' : ""
            }
                    </label>
                    <div class="space-y-2">
                        ${opciones
                            .map(
                                (opcion) => `
                            <label class="flex items-center">
                                <input type="checkbox" disabled class="mr-2 text-blue-600">
                                <span class="text-sm text-gray-700">${opcion}</span>
                            </label>
                        `
                            )
                            .join("")}
                    </div>
                </div>
            `;
        } else if (tipoHTML === "file") {
            html += `
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                        ${etiqueta}${
                obligatorio ? '<span class="text-red-500 ml-1">*</span>' : ""
            }
                    </label>
                    <input type="file" disabled class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                    <p class="text-xs text-gray-500 mt-1">Formatos permitidos: PDF, JPG, PNG. Máximo 10MB.</p>
                </div>
            `;
        } else {
            html += generarCampoPreview(
                etiqueta,
                tipoHTML,
                obligatorio,
                "",
                opciones
            );
        }
    });

    return (
        html ||
        '<p class="text-gray-500 text-center py-4">No hay campos personalizados seleccionados</p>'
    );
}

function abrirModalCampoPersonalizado() {
    Swal.fire({
        title: "Agregar Campo Personalizado",
        html: `
            <div class="text-left space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de campo</label>
                    <select id="swal_tipo_campo" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="text">Texto</option>
                        <option value="number">Número</option>
                        <option value="date">Fecha</option>
                        <option value="select">Selección (lista)</option>
                        <option value="textarea">Área de texto</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Etiqueta del campo</label>
                    <input type="text" id="swal_etiqueta_campo" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                           placeholder="Ej: Número de Pisos">
                </div>
                <div>
                    <label class="flex items-center cursor-pointer">
                        <input type="checkbox" id="swal_obligatorio_campo" class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
                        <span class="ml-2 text-sm text-gray-700">Campo obligatorio</span>
                    </label>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: "Agregar Campo",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#3B82F6",
        preConfirm: () => {
            const tipo = document.getElementById("swal_tipo_campo").value;
            const etiqueta = document
                .getElementById("swal_etiqueta_campo")
                .value.trim();
            const obligatorio = document.getElementById(
                "swal_obligatorio_campo"
            ).checked;

            if (!etiqueta) {
                Swal.showValidationMessage(
                    "La etiqueta del campo es obligatoria"
                );
                return false;
            }

            return { tipo, etiqueta, obligatorio };
        },
    }).then((result) => {
        if (result.isConfirmed) {
            const { tipo, etiqueta, obligatorio } = result.value;
            agregarCampoPersonalizadoNuevo(tipo, etiqueta, obligatorio);

            Swal.fire({
                icon: "success",
                title: "Campo agregado",
                text: `El campo "${etiqueta}" se agregó correctamente`,
                timer: 2000,
                showConfirmButton: false,
            });
        }
    });
}

/**
 * Cargar estados disponibles del sistema
 */
async function cargarEstadosDisponibles() {
    try {
        console.log("Cargando estados disponibles...");
        const response = await fetch("/admin/api/configuracion/estados", {
            headers: {
                "X-CSRF-TOKEN": document.querySelector(
                    'meta[name="csrf-token"]'
                ).content,
            },
        });

        if (response.ok) {
            const data = await response.json();
            console.log("Estados recibidos:", data);
            if (data.success && data.estados) {
                window.estadosDisponibles = data.estados;
                console.log(
                    "Estados guardados en window:",
                    window.estadosDisponibles.length
                );
                renderizarDiagramaFlujo();
            } else {
                console.error("Respuesta sin estados:", data);
            }
        } else {
            console.error("Error HTTP:", response.status);
        }
    } catch (error) {
        console.error("Error al cargar estados:", error);
        Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudieron cargar los estados del sistema. Verifica que la tabla estados_solicitud tenga datos.",
        });
    }
}

/**
 * Cargar transiciones configuradas
 */
async function cargarTransicionesConfiguradas() {
    try {
        const tipoSolicitudId = tipoIdCreado; // ID del tipo en creación
        console.log("Cargando transiciones para tipo:", tipoSolicitudId);

        // IMPORTANTE: Limpiar transiciones antes de cargar nuevas
        window.transicionesConfiguradas = [];
        window.transicionesTodas = [];
        console.log("🧹 Transiciones limpiadas antes de cargar");

        if (!tipoSolicitudId) {
            console.warn("No hay tipoIdCreado, cargando transiciones básicas");
            // Si no hay tipo, solo cargar flujo básico
            const url = "/admin/api/configuracion/flujos-transiciones";
            const response = await fetch(url, {
                headers: {
                    "X-CSRF-TOKEN": document.querySelector(
                        'meta[name="csrf-token"]'
                    ).content,
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    window.transicionesConfiguradas = data.transiciones || [];
                    window.transicionesTodas = data.transiciones || [];
                    renderizarListaTransiciones();
                    renderizarDiagramaFlujo();
                }
            }
            return;
        }

        // Cargar transiciones específicas del tipo
        const responseEspecificas = await fetch(
            `/admin/api/configuracion/flujos-transiciones?tipo_solicitud_id=${tipoSolicitudId}&solo_especificas=true`,
            {
                headers: {
                    "X-CSRF-TOKEN": document.querySelector(
                        'meta[name="csrf-token"]'
                    ).content,
                },
            }
        );

        if (responseEspecificas.ok) {
            const dataEspecificas = await responseEspecificas.json();

            console.log("Transiciones específicas cargadas:", dataEspecificas);

            if (dataEspecificas.success) {
                // Usar las mismas transiciones para diagrama y lista
                const transiciones = dataEspecificas.transiciones || [];

                window.transicionesTodas = transiciones;
                window.transicionesConfiguradas = transiciones;

                console.log(
                    "✅ Total transiciones cargadas:",
                    transiciones.length
                );

                renderizarListaTransiciones();
                renderizarDiagramaFlujo();
            }
        } else {
            console.error("Error HTTP al cargar transiciones");
        }
    } catch (error) {
        console.error("Error al cargar transiciones:", error);
    }
}

/**
 * Renderizar diagrama de flujo (versión simplificada con divs)
 */
function renderizarDiagramaFlujo() {
    const diagrama = document.getElementById("diagrama_flujo");
    if (!diagrama) {
        console.error("No se encontró el elemento diagrama_flujo");
        return;
    }

    if (!window.estadosDisponibles || window.estadosDisponibles.length === 0) {
        console.warn("No hay estados disponibles para mostrar");
        diagrama.innerHTML = `
            <div class="absolute inset-0 flex items-center justify-center">
                <div class="text-center text-gray-500">
                    <svg class="w-16 h-16 mx-auto mb-2 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p>Cargando estados...</p>
                </div>
            </div>
        `;
        return;
    }

    console.log(
        "Renderizando diagrama con",
        window.estadosDisponibles.length,
        "estados"
    );

    const estados = window.estadosDisponibles || [];
    // Usar TODAS las transiciones (básicas + específicas) para el diagrama
    const transiciones =
        window.transicionesTodas || window.transicionesConfiguradas || [];

    diagrama.innerHTML = "";

    let html = '<div class="p-8 min-h-[400px]">';
    html += '<div class="flex flex-wrap gap-6 justify-center">';

    estados.forEach((estado, index) => {
        const tieneTransiciones = transiciones.some(
            (t) => t.estado_origen.id === estado.id
        );

        html += `
            <div class="relative">
                <div class="flex flex-col items-center">
                    <div class="px-6 py-4 rounded-lg shadow-md text-center min-w-[150px] cursor-pointer hover:shadow-lg transition"
                        style="background-color: ${estado.color}; color: white;"
                        onclick="verDetallesEstado(${estado.id})">
                        <div class="text-3xl mb-2">${estado.icono}</div>
                        <div class="font-semibold text-sm">${
                            estado.nombre
                        }</div>
                        ${
                            estado.tipo === "inicial"
                                ? '<div class="text-xs mt-1 opacity-80">INICIAL</div>'
                                : ""
                        }
                        ${
                            estado.tipo === "final"
                                ? '<div class="text-xs mt-1 opacity-80">FINAL</div>'
                                : ""
                        }
                    </div>
                    ${
                        !tieneTransiciones && estado.tipo !== "final"
                            ? `
                        <div class="text-xs text-red-600 mt-2 font-medium">⚠️ Sin salidas</div>
                    `
                            : ""
                    }
                </div>
            </div>
        `;
    });

    html += "</div>";

    // Mostrar transiciones como lista debajo

    if (transiciones.length > 0) {
        html += '<div class="mt-8 space-y-2">';
        html +=
            '<h5 class="text-sm font-semibold text-gray-700 mb-3">Transiciones:</h5>';
        transiciones.forEach((trans) => {
            html += `
                <div class="flex items-center gap-3 bg-white p-3 rounded border border-gray-200">
                    <span class="px-3 py-1 rounded text-sm" style="background-color: ${
                        trans.estado_origen.color
                    }20; color: ${trans.estado_origen.color}">
                        ${trans.estado_origen.nombre}
                    </span>
                    <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                    </svg>
                    <span class="px-3 py-1 rounded text-sm" style="background-color: ${
                        trans.estado_destino.color
                    }20; color: ${trans.estado_destino.color}">
                        ${trans.estado_destino.nombre}
                    </span>
                    <span class="flex-1 text-sm text-gray-600">${
                        trans.nombre || "Sin nombre"
                    }</span>
                    <button onclick="editarTransicion(${
                        trans.id
                    })" class="text-blue-600 hover:text-blue-800 p-1">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                    </button>
                    <button onclick="eliminarTransicion(${
                        trans.id
                    })" class="text-red-600 hover:text-red-800 p-1">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>
                </div>
            `;
        });
        html += "</div>";
    }

    html += "</div>";
    diagrama.innerHTML = html;
}

/**
 * Renderizar lista de transiciones
 */
function renderizarListaTransiciones() {
    const lista = document.getElementById("lista_transiciones_configuradas");
    if (!lista) {
        console.warn(
            "⚠️ Elemento lista_transiciones_configuradas no encontrado"
        );
        return;
    }

    console.log(
        "🔄 Renderizando lista de transiciones:",
        window.transicionesConfiguradas
    );

    // IMPORTANTE: Limpiar el contenido anterior para evitar duplicados
    lista.innerHTML = "";

    const transiciones = window.transicionesConfiguradas || [];

    if (transiciones.length === 0) {
        lista.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <p>No hay transiciones configuradas</p>
                <p class="text-sm mt-2">Haz clic en "Nueva Transición" para agregar una</p>
            </div>
        `;
        return;
    }

    let html = "";
    transiciones.forEach((trans, index) => {
        html += `
            <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                <div class="flex items-center justify-between">
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-2">
                            <span class="text-sm font-medium text-gray-900">${
                                index + 1
                            }. ${trans.nombre || "Transición"}</span>
                            ${
                                trans.es_flujo_basico
                                    ? '<span class="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">Flujo Básico</span>'
                                    : ""
                            }
                        </div>
                        <div class="flex items-center gap-2 text-sm text-gray-600">
                            <span class="font-medium" style="color: ${
                                trans.estado_origen.color
                            }">${trans.estado_origen.nombre}</span>
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                            </svg>
                            <span class="font-medium" style="color: ${
                                trans.estado_destino.color
                            }">${trans.estado_destino.nombre}</span>
                        </div>
                        ${
                            trans.descripcion
                                ? `<p class="text-xs text-gray-500 mt-1">${trans.descripcion}</p>`
                                : ""
                        }
                        <div class="flex gap-2 mt-2">
                            ${
                                trans.tiene_condiciones
                                    ? '<span class="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">Con condiciones</span>'
                                    : ""
                            }
                            ${
                                trans.tiene_acciones
                                    ? '<span class="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Con acciones</span>'
                                    : ""
                            }
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="editarTransicion(${trans.id})" 
                            class="p-2 text-blue-600 hover:bg-blue-50 rounded transition">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                        </button>
                        <button onclick="eliminarTransicion(${trans.id})"
                            class="p-2 text-red-600 hover:bg-red-50 rounded transition">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });

    lista.innerHTML = html;
}

/**
 * Normalizar texto a formato slug
 * Convierte texto a minúsculas, elimina acentos y caracteres especiales
 */
function normalizarSlug(texto) {
    if (!texto) return "";

    // Mapa de caracteres con acentos y sus equivalentes sin acentos
    const acentos = {
        á: "a",
        é: "e",
        í: "i",
        ó: "o",
        ú: "u",
        Á: "a",
        É: "e",
        Í: "i",
        Ó: "o",
        Ú: "u",
        à: "a",
        è: "e",
        ì: "i",
        ò: "o",
        ù: "u",
        À: "a",
        È: "e",
        Ì: "i",
        Ò: "o",
        Ù: "u",
        ä: "a",
        ë: "e",
        ï: "i",
        ö: "o",
        ü: "u",
        Ä: "a",
        Ë: "e",
        Ï: "i",
        Ö: "o",
        Ü: "u",
        â: "a",
        ê: "e",
        î: "i",
        ô: "o",
        û: "u",
        Â: "a",
        Ê: "e",
        Î: "i",
        Ô: "o",
        Û: "u",
        ã: "a",
        õ: "o",
        ñ: "n",
        Ã: "a",
        Õ: "o",
        Ñ: "n",
        ç: "c",
        Ç: "c",
    };

    // Convertir a minúsculas
    let slug = texto.toLowerCase();

    // Reemplazar caracteres con acentos
    slug = slug
        .split("")
        .map((char) => acentos[char] || char)
        .join("");

    // Reemplazar espacios y caracteres especiales por guiones
    slug = slug
        .replace(/[^a-z0-9]+/g, "-") // Reemplazar caracteres no alfanuméricos por guiones
        .replace(/^-+|-+$/g, "") // Eliminar guiones al inicio y final
        .replace(/-+/g, "-"); // Reemplazar múltiples guiones por uno solo

    return slug;
}

/**
 * Generar slug automáticamente desde el nombre del tipo de solicitud
 */
function generarSlugTipoSolicitud() {
    const nombreInput = document.getElementById("wizard_nombre");
    const slugInput = document.getElementById("wizard_slug");

    if (!nombreInput || !slugInput) return;

    // Solo generar si el slug está vacío o no ha sido modificado manualmente
    if (!slugInput.dataset.manuallyEdited) {
        const slug = normalizarSlug(nombreInput.value);
        slugInput.value = slug;
    }
}

/**
 * Regenerar slug manualmente desde el nombre
 */
function regenerarSlugTipo() {
    const nombreInput = document.getElementById("wizard_nombre");
    const slugInput = document.getElementById("wizard_slug");

    if (!nombreInput || !slugInput) return;

    const slug = normalizarSlug(nombreInput.value);
    slugInput.value = slug;
    delete slugInput.dataset.manuallyEdited;
}

function agregarValidacionTiempoReal() {
    const campos = [
        "codigo",
        "nombre",
        "slug",
        "descripcion",
        "categoria_id",
        "area_responsable_id",
        "dias_respuesta",
        "dias_alerta",
        "sla",
    ];

    // Detectar edición manual del slug
    const slugInput = document.getElementById("wizard_slug");
    if (slugInput) {
        slugInput.addEventListener("input", function () {
            this.dataset.manuallyEdited = "true";
            const slug = normalizarSlug(this.value);
            this.value = slug;
        });
    }

    campos.forEach((campo) => {
        const input = document.getElementById(`wizard_${campo}`);
        console.log(input);
        if (input) {
            input.addEventListener("blur", () => validarCampoPaso1(campo));
            input.addEventListener("input", () => {
                // Limpiar error al empezar a escribir
                const error = document.getElementById(`error_${campo}`);
                if (error) {
                    error.classList.add("hidden");
                    input.classList.remove("border-red-500");
                }
            });
        }
    });
}

async function validarCampoPaso1(campo) {
    const input = document.getElementById(`wizard_${campo}`);
    const error = document.getElementById(`error_${campo}`);

    if (!input || !error) return true;

    let esValido = true;
    let mensaje = "";

    switch (campo) {
        case "codigo":
            if (!input.value.trim()) {
                esValido = false;
                mensaje = "El código es obligatorio";
            } else if (!/^[A-Z0-9\-]+$/i.test(input.value)) {
                esValido = false;
                mensaje = "Solo letras, números y guiones";
            }

            // Validar que el codigo no exista (solo si es nuevo o si cambió)
            if (input.value.trim() && esValido) {
                // Obtener el ID del tipo si ya fue creado (puede estar en tipoIdCreado o en datosWizardTemp)
                const idExcluir = tipoIdCreado || datosWizardTemp.tipoIdCreado;

                // Obtener el código original guardado (si existe)
                // Puede venir de datosOriginales (modo edición) o del paso1 guardado (modo creación después de guardar paso 1)
                const codigoOriginal =
                    datosWizardTemp.datosOriginales?.codigo ||
                    datosWizardTemp.paso1?.codigo ||
                    null;

                // Determinar si debemos validar:
                // - Siempre validar si NO hay código original guardado (primera vez)
                // - Si hay código original, solo validar si el código cambió
                const codigoCambio = codigoOriginal
                    ? input.value.trim() !== codigoOriginal
                    : true;

                if (codigoCambio) {
                    // Construir URL con parámetro de exclusión si ya existe un ID
                    let url = `/admin/solicitudes/api/tipos/getByCodigo/${input.value.trim()}`;

                    if (idExcluir) {
                        url += `?excluir_id=${idExcluir}`;
                    }

                    const response = await fetch(url);
                    const data = await response.json();
                    if (data.existe) {
                        esValido = false;
                        mensaje = "El código ya existe";
                    }
                }
            }
            break;

        case "nombre":
            if (!input.value.trim()) {
                esValido = false;
                mensaje = "El nombre es obligatorio";
            } else if (input.value.trim().length < 3) {
                esValido = false;
                mensaje = "Mínimo 3 caracteres";
            }
            break;

        case "descripcion":
            if (!input.value.trim()) {
                esValido = false;
                mensaje = "La descripción es obligatoria";
            } else if (input.value.trim().length < 10) {
                esValido = false;
                mensaje = "Mínimo 10 caracteres";
            }
            break;

        case "slug":
            if (!input.value) {
                esValido = false;
                mensaje = "Este campo es obligatorio";
            } else if (!/^[a-z0-9\-]+$/.test(input.value)) {
                esValido = false;
                mensaje = "Solo letras minúsculas, números y guiones";
            }
            break;

        case "categoria_id":
        case "area_responsable_id":
            if (!input.value) {
                esValido = false;
                mensaje = "Este campo es obligatorio";
            }
            break;

        case "dias_respuesta":
        case "dias_alerta":
        case "sla":
            if (!input.value || input.value < 1) {
                esValido = false;
                mensaje = "Debe ser al menos 1 día";
            }
            break;
    }

    if (!esValido) {
        error.textContent = mensaje;
        error.classList.remove("hidden");
        input.classList.add("border-red-500");
    } else {
        error.classList.add("hidden");
        input.classList.remove("border-red-500");
    }

    return esValido;
}

function generarPaso2() {
    return `
        <div class="space-y-6">
            <!-- Header -->
            <div>
                <h3 class="text-2xl font-bold text-gray-900">Configurar Campos del Formulario</h3>
                <p class="text-sm text-gray-600 mt-1">Agrega los campos que verá el ciudadano</p>
            </div>

            <!-- Info Note -->
            <div class="bg-blue-50 border-l-4 border-blue-500 p-4">
                <p class="text-sm text-blue-700">
                    Los datos del solicitante (documento, nombre, email, teléfono) se incluyen automáticamente
                </p>
            </div>

            <!-- Two Column Layout -->
            <div class="grid grid-cols-5 gap-6">
                <!-- Left Column (40%) - Predefined Fields -->
                <div class="col-span-2">
                    <div class="bg-white border border-gray-200 rounded-lg p-4">
                        <h4 class="text-lg font-semibold text-gray-800 mb-4">📋 Campos Predefinidos</h4>
                        <div class="space-y-3" id="campos_predefinidos_list">
                            <label class="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                                <input type="checkbox" value="direccion" class="campo-predefinido w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
                                <span class="ml-3 text-sm text-gray-700">📍 Dirección del Predio</span>
                            </label>
                            <label class="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                                <input type="checkbox" value="barrio" class="campo-predefinido w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
                                <span class="ml-3 text-sm text-gray-700">🏘️ Barrio/Sector</span>
                            </label>
                            <label class="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                                <input type="checkbox" value="estrato" class="campo-predefinido w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
                                <span class="ml-3 text-sm text-gray-700">📊 Estrato</span>
                            </label>
                            <label class="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                                <input type="checkbox" value="uso_predio" class="campo-predefinido w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
                                <span class="ml-3 text-sm text-gray-700">🏢 Uso del Predio</span>
                            </label>
                            <label class="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                                <input type="checkbox" value="area_m2" class="campo-predefinido w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
                                <span class="ml-3 text-sm text-gray-700">📐 Área en m²</span>
                            </label>
                            <label class="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                                <input type="checkbox" value="ubicacion_mapa" class="campo-predefinido w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
                                <span class="ml-3 text-sm text-gray-700">🗺️ Ubicación en Mapa</span>
                            </label>
                            <label class="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                                <input type="checkbox" value="observaciones" class="campo-predefinido w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
                                <span class="ml-3 text-sm text-gray-700">📝 Observaciones</span>
                            </label>
                        </div>
                    </div>

                    <!-- Biblioteca de Campos -->
                    <div class="bg-white border border-gray-200 rounded-lg p-4 mt-4">
                        <h4 class="text-lg font-semibold text-gray-800 mb-4">📚 Biblioteca de Campos</h4>
                        <div id="campos_biblioteca_list" class="space-y-2 max-h-[300px] overflow-y-auto">
                            <div class="text-center text-gray-400 py-8">
                                <div class="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                                <p class="text-sm">Cargando campos...</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right Column (60%) - Selected Fields -->
                <div class="col-span-3">
                    <div class="bg-white border border-gray-200 rounded-lg p-4">
                        <div class="flex items-center justify-between mb-4">
                            <h4 class="text-lg font-semibold text-gray-800">✅ Campos Seleccionados</h4>
                            <div class="flex gap-2">
                                <button type="button" onclick="vistaPreviaFormularioWizard()"
                                    class="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm flex items-center">
                                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                    </svg>
                                    Vista Previa
                                </button>
                            <button type="button" onclick="abrirModalCampoPersonalizado()"
                                class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm flex items-center">
                                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                                </svg>
                                    Agregar Campo
                            </button>
                            </div>
                        </div>

                        <div id="campos_seleccionados_container" class="min-h-[300px]">
                            <div id="campos_seleccionados_list" class="space-y-2">
                                <div class="text-center text-gray-400 py-12 border-2 border-dashed border-gray-300 rounded-lg">
                                    <svg class="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                    </svg>
                                    <p class="text-sm">Selecciona al menos un campo</p>
                                </div>
                            </div>
                        </div>

                        <div class="mt-4 text-xs text-gray-500">
                            <span class="font-semibold">💡 Tip:</span> Puedes reordenar los campos arrastrándolos
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function generarPaso3() {
    return `
        <div class="space-y-6">
            <!-- Header Info -->
            <div class="bg-blue-50 border-l-4 border-blue-500 p-4">
                <p class="text-sm text-blue-700">
                    <strong>Paso 3 de 4:</strong> Configura el flujo de aprobación para este tipo de solicitud.
                </p>
            </div>

            <!-- Selector de Tipo de Flujo -->
            <div class="bg-white border border-gray-200 rounded-lg p-6">
                <h4 class="text-lg font-semibold text-gray-800 mb-4">🎯 Tipo de Flujo</h4>
                <div class="space-y-4">
                    <!-- Opción: Flujo por Defecto -->
                    <label class="flex items-start p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition">
                        <input type="radio" name="tipo_flujo" value="defecto"
                               class="mt-1 w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                               onchange="cambiarTipoFlujo('defecto')" checked>
                        <div class="ml-3 flex-1">
                            <div class="flex items-center gap-2">
                                <span class="font-semibold text-gray-900">Flujo por Defecto del Sistema</span>
                                <span class="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Recomendado</span>
                            </div>
                            <p class="text-sm text-gray-600 mt-1">
                                Utiliza el flujo estándar configurado en el sistema. Perfecto para la mayoría de los casos.
                            </p>
                            <div class="flex items-center space-x-2 text-xs mt-2 flex-wrap">
                                <span class="px-2 py-1 bg-blue-100 text-blue-700 rounded">📥 Radicada</span>
                                <span class="text-gray-400">→</span>
                                <span class="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">🔍 En Revisión</span>
                                <span class="text-gray-400">→</span>
                                <span class="px-2 py-1 bg-purple-100 text-purple-700 rounded">✅ En Aprobación</span>
                                <span class="text-gray-400">→</span>
                                <span class="px-2 py-1 bg-green-100 text-green-700 rounded">✓ Aprobada</span>
                            </div>
                        </div>
                    </label>

                    <!-- Opción: Flujo Personalizado -->
                    <label class="flex items-start p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-purple-300 hover:bg-purple-50 transition">
                        <input type="radio" name="tipo_flujo" value="personalizado"
                               class="mt-1 w-5 h-5 text-purple-600 border-gray-300 focus:ring-purple-500"
                               onchange="cambiarTipoFlujo('personalizado')">
                        <div class="ml-3 flex-1">
                            <div class="flex items-center gap-2">
                                <span class="font-semibold text-gray-900">Flujo Personalizado</span>
                                <span class="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">Avanzado</span>
                            </div>
                            <p class="text-sm text-gray-600 mt-1">
                                Configura transiciones específicas para este tipo de solicitud. Permite control total sobre el flujo.
                            </p>
                        </div>
                    </label>
                </div>
            </div>

            <!-- Configuración de Flujo Personalizado (Oculto por defecto) -->
            <div id="configuracion_flujo_personalizado" class="hidden space-y-6">
                <!-- Diagrama de Flujo -->
                <div class="bg-white border border-gray-200 rounded-lg p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h4 class="text-lg font-semibold text-gray-800">🔄 Diagrama de Flujo</h4>
                        <button type="button" onclick="cargarTransicionesConfiguradas()"
                            class="px-3 py-1 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 rounded">
                            🔄 Actualizar
                        </button>
                    </div>
                    <div id="diagrama_flujo" class="min-h-[200px] border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                        <div class="flex items-center justify-center h-40">
                            <div class="text-center text-gray-400">
                                <div class="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                                <p class="text-sm">Cargando diagrama...</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Transiciones Configuradas -->
                <div class="bg-white border border-gray-200 rounded-lg p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h4 class="text-lg font-semibold text-gray-800">⚙️ Transiciones Personalizadas</h4>
                        <button type="button" onclick="abrirModalNuevaTransicion()"
                            class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition">
                            ➕ Nueva Transición
                        </button>
                    </div>
                    <div id="lista_transiciones_configuradas" class="space-y-2">
                        <div class="text-center text-gray-400 py-8">
                            <p class="text-sm">No hay transiciones personalizadas configuradas</p>
                            <p class="text-xs mt-1">Agrega al menos una transición para el flujo personalizado</p>
                        </div>
                    </div>
                </div>

                <!-- Nota informativa -->
                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p class="text-sm text-yellow-800">
                        <strong>💡 Nota:</strong> Las transiciones personalizadas solo aplican para este tipo de solicitud.
                        Debes configurar al menos una transición para usar el flujo personalizado.
                    </p>
                </div>
            </div>

            <!-- Información del Flujo por Defecto (Visible por defecto) -->
            <div id="info_flujo_defecto" class="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
                <div class="flex items-start">
                    <svg class="w-8 h-8 text-green-600 mt-1 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <div>
                        <h5 class="font-semibold text-green-900 text-lg mb-2">Flujo por Defecto Seleccionado</h5>
                        <p class="text-green-700 text-sm mb-3">
                            Este tipo de solicitud utilizará el flujo estándar del sistema. No requiere configuración adicional.
                        </p>
                        <p class="text-xs text-green-600">
                            ✅ Puedes cambiar al flujo personalizado en cualquier momento desde la configuración del tipo.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function generarPaso4() {
    return `
        <div class="space-y-6">
            <div class="bg-blue-50 border-l-4 border-blue-500 p-4">
                <p class="text-sm text-blue-700">
                    <strong>Paso 4 de 4:</strong> Selecciona las plantillas de documentos que se generarán para este tipo de solicitud.
                </p>
            </div>

            <!-- Filtros de búsqueda -->
            <div class="bg-white border border-gray-200 rounded-lg p-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Buscar Plantilla</label>
                        <input type="text" id="buscarPlantilla" placeholder="Buscar por nombre..."
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Tipo de Documento</label>
                        <select id="filtroTipoDocumento"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            <option value="">Todos los tipos</option>
                            <option value="certificado">Certificado</option>
                            <option value="concepto_tecnico">Concepto Técnico</option>
                            <option value="acta">Acta</option>
                            <option value="resolucion">Resolución</option>
                            <option value="oficio">Oficio</option>
                            <option value="otro">Otro</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Plantillas Seleccionadas -->
            <div id="plantillasSeleccionadas" class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 class="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    📋 Plantillas Seleccionadas
                    <span id="contadorPlantillas" class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">0</span>
                </h4>
                <div id="listaPlantillasSeleccionadas" class="space-y-2">
                    <p class="text-sm text-gray-500 italic">No hay plantillas seleccionadas aún</p>
                </div>
            </div>

            <!-- Lista de Plantillas Disponibles -->
            <div class="border border-gray-200 rounded-lg p-4">
                <h4 class="text-md font-semibold text-gray-800 mb-4">Plantillas Disponibles</h4>
                <div id="listaPlantillasDisponibles" class="space-y-3">
                    <div class="flex justify-center py-8">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                </div>
            </div>

            <!-- Información adicional -->
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p class="text-sm text-yellow-800">
                    <strong>💡 Nota:</strong> Puedes seleccionar múltiples plantillas. Cada plantilla se puede configurar
                    para generarse automáticamente al aprobar o completar la solicitud, o generarse manualmente.
                </p>
            </div>
        </div>
    `;
}

/**
 * Generar resumen de plantillas seleccionadas
 */
function generarResumenPlantillas() {
    if (
        !window.plantillasSeleccionadas ||
        window.plantillasSeleccionadas.length === 0
    ) {
        return `
            <div class="border border-gray-200 rounded-lg p-4">
                <h5 class="font-semibold text-gray-800 mb-2">📄 Plantillas de Documentos</h5>
                <p class="text-sm text-gray-500 italic">No se seleccionaron plantillas para este tipo de solicitud</p>
            </div>
        `;
    }

    const plantillasHTML = window.plantillasSeleccionadas
        .map((plantilla, index) => {
            const tipoLabel = obtenerLabelTipoDocumento(
                plantilla.tipo_documento
            );
            const momentoLabel =
                {
                    al_aprobar: "Al Aprobar",
                    al_completar: "Al Completar",
                    manual: "Manual",
                }[plantilla.momento_generacion] || plantilla.momento_generacion;

            return `
            <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div class="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center font-semibold text-sm">
                    ${index + 1}
                </div>
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                        <h6 class="font-medium text-gray-800">${
                            plantilla.nombre
                        }</h6>
                        ${
                            plantilla.es_principal
                                ? '<span class="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-medium">Principal</span>'
                                : ""
                        }
                        ${
                            plantilla.generar_automatico
                                ? '<span class="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">Auto</span>'
                                : ""
                        }
                    </div>
                    <div class="flex items-center gap-3 text-xs text-gray-600">
                        <span>📋 ${tipoLabel}</span>
                        <span>⏱️ ${momentoLabel}</span>
                        <span>🔧 ${
                            plantilla.total_variables || 0
                        } variables</span>
                    </div>
                </div>
            </div>
        `;
        })
        .join("");

    return `
        <div class="border border-gray-200 rounded-lg p-4">
            <h5 class="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                📄 Plantillas de Documentos
                <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    ${window.plantillasSeleccionadas.length}
                </span>
            </h5>
            <div class="space-y-2">
                ${plantillasHTML}
            </div>
        </div>
    `;
}

// ========================================
// GESTIÓN DE TRANSICIONES
// ========================================

/**
 * Abrir modal para crear nueva transición
 */
function abrirModalNuevaTransicion() {
    if (!window.estadosDisponibles || window.estadosDisponibles.length === 0) {
        Swal.fire({
            icon: "warning",
            title: "Sin estados disponibles",
            text: "No hay estados configurados en el sistema",
        });
        return;
    }

    const modalHTML = crearModalTransicion();

    // Convertir string HTML a nodo DOM
    const div = document.createElement("div");
    div.innerHTML = modalHTML;
    const modalNode = div.firstElementChild;

    document.body.appendChild(modalNode);
    cargarEstadosEnModal();
}

/**
 * Crear modal de transición
 */
function crearModalTransicion(transicion = null) {
    const esEdicion = transicion !== null;
    const estados = window.estadosDisponibles || [];

    return `
        <div id="modalTransicion" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div class="relative bg-white rounded-lg shadow-xl w-11/12 max-w-4xl max-h-[90vh] overflow-hidden">
                <!-- Header -->
                <div class="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                    <div class="flex items-center justify-between">
                        <h3 class="text-xl font-semibold">${
                            esEdicion
                                ? "Editar Transición"
                                : "+ Nueva Transición"
                        }</h3>
                        <button onclick="cerrarModalTransicion()" class="text-white hover:text-gray-200">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <!-- Body -->
                <div class="px-6 py-4 overflow-y-auto" style="max-height: calc(90vh - 140px);">
                    <form id="formTransicion" class="space-y-6">
                        <!-- Estados -->
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                    Estado Origen <span class="text-red-500">*</span>
                                </label>
                                <select id="trans_estado_origen" required
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                    <option value="">Seleccione estado origen</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                    Estado Destino <span class="text-red-500">*</span>
                                </label>
                                <select id="trans_estado_destino" required
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                    <option value="">Seleccione estado destino</option>
                                </select>
                            </div>
                        </div>
                        
                        <!-- Nombre y Descripción -->
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                    Nombre de la Transición
                                </label>
                                <input type="text" id="trans_nombre" 
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Ej: Aprobar, Rechazar, Revisar">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                    Texto del Botón
                                </label>
                                <input type="text" id="trans_texto_boton" 
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Ej: Aprobar Solicitud">
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Descripción
                            </label>
                            <textarea id="trans_descripcion" rows="2"
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Descripción de cuándo y cómo usar esta transición"></textarea>
                        </div>
                        
                        <!-- Quién puede ejecutar -->
                        <div class="border border-gray-200 rounded-lg p-4">
                            <h4 class="text-sm font-semibold text-gray-800 mb-3">👥 Quién Puede Ejecutar</h4>
                            <div class="space-y-2">
                                <label class="flex items-center cursor-pointer">
                                    <input type="checkbox" value="Super Administrador" class="rol-permitido w-4 h-4 text-blue-600 rounded">
                                    <span class="ml-2 text-sm">Super Administrador</span>
                                </label>
                                <label class="flex items-center cursor-pointer">
                                    <input type="checkbox" value="Director OAPM" class="rol-permitido w-4 h-4 text-blue-600 rounded">
                                    <span class="ml-2 text-sm">Director OAPM</span>
                                </label>
                                <label class="flex items-center cursor-pointer">
                                    <input type="checkbox" value="Coordinador de Área" class="rol-permitido w-4 h-4 text-blue-600 rounded">
                                    <span class="ml-2 text-sm">Coordinador del Área</span>
                                </label>
                                <label class="flex items-center cursor-pointer">
                                    <input type="checkbox" value="Líder de Equipo" class="rol-permitido w-4 h-4 text-blue-600 rounded">
                                    <span class="ml-2 text-sm">Líder del Equipo</span>
                                </label>
                                <label class="flex items-center cursor-pointer">
                                    <input type="checkbox" value="Funcionario" class="rol-permitido w-4 h-4 text-blue-600 rounded">
                                    <span class="ml-2 text-sm">Cualquier Funcionario</span>
                                </label>
                            </div>
                            <div class="mt-3 pt-3 border-t border-gray-200">
                                <label class="flex items-center cursor-pointer">
                                    <input type="checkbox" id="trans_solo_asignado" class="w-4 h-4 text-blue-600 rounded">
                                    <span class="ml-2 text-sm font-medium text-gray-700">Solo funcionario asignado</span>
                                </label>
                            </div>
                        </div>
                        
                        <!-- Condiciones -->
                        <div class="border border-gray-200 rounded-lg p-4">
                            <h4 class="text-sm font-semibold text-gray-800 mb-3">⚙️ Condiciones</h4>
                            <div class="space-y-2">
                                <label class="flex items-center cursor-pointer">
                                    <input type="checkbox" id="trans_requiere_comentario" class="w-4 h-4 text-blue-600 rounded">
                                    <span class="ml-2 text-sm">Requiere comentario obligatorio</span>
                                </label>
                                <label class="flex items-center cursor-pointer">
                                    <input type="checkbox" id="trans_requiere_documento" class="w-4 h-4 text-blue-600 rounded">
                                    <span class="ml-2 text-sm">Requiere adjuntar documento</span>
                                </label>
                                <label class="flex items-center cursor-pointer">
                                    <input type="checkbox" id="trans_requiere_aprobacion" class="w-4 h-4 text-blue-600 rounded">
                                    <span class="ml-2 text-sm">Requiere aprobación previa</span>
                                </label>
                                <div class="flex items-center gap-2">
                                    <input type="checkbox" id="trans_check_dias" class="w-4 h-4 text-blue-600 rounded">
                                    <span class="text-sm">Solo si han pasado</span>
                                    <input type="number" id="trans_minimo_dias" min="1" max="365"
                                        class="w-20 px-2 py-1 border border-gray-300 rounded text-sm" placeholder="0">
                                    <span class="text-sm">días</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Acciones Automáticas -->
                        <div class="border border-gray-200 rounded-lg p-4">
                            <h4 class="text-sm font-semibold text-gray-800 mb-3">🤖 Acciones Automáticas</h4>
                            <div class="grid grid-cols-2 gap-3">
                                <label class="flex items-center cursor-pointer">
                                    <input type="checkbox" id="trans_reasignar" class="w-4 h-4 text-blue-600 rounded">
                                    <span class="ml-2 text-sm">Reasignar funcionario</span>
                                </label>
                                <label class="flex items-center cursor-pointer">
                                    <input type="checkbox" id="trans_cambiar_prioridad" class="w-4 h-4 text-blue-600 rounded">
                                    <span class="ml-2 text-sm">Cambiar prioridad</span>
                                </label>
                                <label class="flex items-center cursor-pointer">
                                    <input type="checkbox" id="trans_recalcular_fecha" class="w-4 h-4 text-blue-600 rounded">
                                    <span class="ml-2 text-sm">Recalcular fecha</span>
                                </label>
                                <label class="flex items-center cursor-pointer">
                                    <input type="checkbox" id="trans_generar_doc" class="w-4 h-4 text-blue-600 rounded">
                                    <span class="ml-2 text-sm">Generar documento</span>
                                </label>
                                <label class="flex items-center cursor-pointer">
                                    <input type="checkbox" id="trans_enviar_notif" class="w-4 h-4 text-blue-600 rounded" checked>
                                    <span class="ml-2 text-sm">Enviar notificaciones</span>
                                </label>
                                <label class="flex items-center cursor-pointer">
                                    <input type="checkbox" id="trans_registrar_audit" class="w-4 h-4 text-blue-600 rounded" checked>
                                    <span class="ml-2 text-sm">Registrar en auditoría</span>
                                </label>
                            </div>
                        </div>
                        
                        <!-- Confirmación -->
                        <div class="border border-gray-200 rounded-lg p-4">
                            <label class="flex items-center cursor-pointer">
                                <input type="checkbox" id="trans_requiere_confirmacion" class="w-4 h-4 text-blue-600 rounded" checked>
                                <span class="ml-2 text-sm font-medium">Requiere confirmación antes de ejecutar</span>
                            </label>
                            <div id="campo_mensaje_confirmacion" class="mt-3">
                                <input type="text" id="trans_mensaje_confirmacion" 
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                                    placeholder="¿Está seguro de aprobar esta solicitud?">
                            </div>
                        </div>
                    </form>
                </div>
                
                <!-- Footer -->
                <div class="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
                    <button type="button" onclick="cerrarModalTransicion()"
                        class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition">
                        Cancelar
                    </button>
                    <button type="button" onclick="guardarTransicion()"
                        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
                        ${esEdicion ? "Actualizar" : "Crear"} Transición
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Cargar estados en el modal
 */
function cargarEstadosEnModal() {
    const estados = window.estadosDisponibles || [];

    const selectOrigen = document.getElementById("trans_estado_origen");
    const selectDestino = document.getElementById("trans_estado_destino");

    estados.forEach((estado) => {
        const optionOrigen = document.createElement("option");
        optionOrigen.value = estado.id;
        optionOrigen.textContent = `${estado.icono} ${estado.nombre}`;
        selectOrigen.appendChild(optionOrigen);

        const optionDestino = document.createElement("option");
        optionDestino.value = estado.id;
        optionDestino.textContent = `${estado.icono} ${estado.nombre}`;
        selectDestino.appendChild(optionDestino);
    });
}

/**
 * Cerrar modal de transición
 */
function cerrarModalTransicion() {
    const modal = document.getElementById("modalTransicion");
    if (modal) {
        modal.remove();
    }
}

/**
 * Guardar transición (crear o actualizar)
 */
async function guardarTransicion() {
    const form = document.getElementById("formTransicion");
    const transicionId = form?.dataset.transicionId; // Si existe, es edición
    const esEdicion = !!transicionId;

    const estadoOrigen = document.getElementById("trans_estado_origen").value;
    const estadoDestino = document.getElementById("trans_estado_destino").value;

    if (!estadoOrigen || !estadoDestino) {
        Swal.fire({
            icon: "warning",
            title: "Campos incompletos",
            text: "Debe seleccionar estado origen y destino",
        });
        return;
    }

    if (estadoOrigen === estadoDestino) {
        Swal.fire({
            icon: "error",
            title: "Error",
            text: "El estado origen y destino no pueden ser el mismo",
        });
        return;
    }

    // Obtener roles permitidos
    const rolesPermitidos = Array.from(
        document.querySelectorAll(".rol-permitido:checked")
    ).map((cb) => cb.value);

    const datos = {
        tipo_solicitud_id: tipoIdCreado,
        estado_origen_id: parseInt(estadoOrigen),
        estado_destino_id: parseInt(estadoDestino),
        nombre: document.getElementById("trans_nombre").value || null,
        descripcion: document.getElementById("trans_descripcion").value || null,
        roles_permitidos: rolesPermitidos.length > 0 ? rolesPermitidos : null,
        solo_funcionario_asignado: document.getElementById(
            "trans_solo_asignado"
        ).checked,
        requiere_comentario: document.getElementById(
            "trans_requiere_comentario"
        ).checked,
        requiere_documento: document.getElementById("trans_requiere_documento")
            .checked,
        requiere_aprobacion_previa: document.getElementById(
            "trans_requiere_aprobacion"
        ).checked,
        minimo_dias_transcurridos: document.getElementById("trans_check_dias")
            .checked
            ? parseInt(document.getElementById("trans_minimo_dias").value)
            : null,
        reasignar_funcionario:
            document.getElementById("trans_reasignar").checked,
        recalcular_fecha_vencimiento: document.getElementById(
            "trans_recalcular_fecha"
        ).checked,
        generar_documento: document.getElementById("trans_generar_doc").checked,
        enviar_notificaciones:
            document.getElementById("trans_enviar_notif").checked,
        registrar_auditoria: document.getElementById("trans_registrar_audit")
            .checked,
        requiere_confirmacion: document.getElementById(
            "trans_requiere_confirmacion"
        ).checked,
        mensaje_confirmacion:
            document.getElementById("trans_mensaje_confirmacion").value || null,
        texto_boton: document.getElementById("trans_texto_boton").value || null,
        activo: true,
    };

    try {
        // Determinar URL y método según sea creación o edición
        const url = esEdicion
            ? `/admin/api/configuracion/flujos-transiciones/${transicionId}`
            : "/admin/api/configuracion/flujos-transiciones";

        const method = esEdicion ? "PUT" : "POST";

        console.log(`${method} ${url}`, datos);

        const response = await fetch(url, {
            method: method,
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-TOKEN": document.querySelector(
                    'meta[name="csrf-token"]'
                ).content,
            },
            body: JSON.stringify(datos),
        });

        const result = await response.json();

        if (result.success) {
            Swal.fire({
                icon: "success",
                title: "¡Éxito!",
                text: esEdicion
                    ? "Transición actualizada exitosamente"
                    : "Transición creada exitosamente",
                timer: 2000,
                showConfirmButton: false,
            });

            cerrarModalTransicion();
            cargarTransicionesConfiguradas();
        } else {
            throw new Error(result.message || "Error al guardar");
        }
    } catch (error) {
        console.error("Error al guardar transición:", error);
        Swal.fire({
            icon: "error",
            title: "Error",
            text: error.message || "No se pudo guardar la transición",
        });
    }
}

/**
 * Editar transición existente
 */
async function editarTransicion(id) {
    try {
        console.log("Cargando transición para editar:", id);

        // Cargar datos de la transición
        const response = await fetch(
            `/admin/api/configuracion/flujos-transiciones/${id}`,
            {
                headers: {
                    "X-CSRF-TOKEN": document.querySelector(
                        'meta[name="csrf-token"]'
                    ).content,
                },
            }
        );

        if (!response.ok) {
            throw new Error("No se pudo cargar la transición");
        }

        const data = await response.json();
        console.log("Transición cargada:", data);

        if (!data.success) {
            throw new Error(data.message || "Error al cargar transición");
        }

        const transicion = data.transicion;

        // Abrir modal
        const modalHTML = crearModalTransicion(transicion);
        const div = document.createElement("div");
        div.innerHTML = modalHTML;
        const modalNode = div.firstElementChild;

        document.body.appendChild(modalNode);

        // Poblar estados
        cargarEstadosEnModal();

        // Esperar un poco para que se carguen los selects
        setTimeout(() => {
            poblarDatosTransicion(transicion);
        }, 100);
    } catch (error) {
        console.error("Error al editar transición:", error);
        Swal.fire({
            icon: "error",
            title: "Error",
            text: error.message || "No se pudo cargar la transición",
        });
    }
}

/**
 * Poblar datos de transición en el modal (para edición)
 */
function poblarDatosTransicion(transicion) {
    console.log("Poblando datos en modal:", transicion);

    // Estados
    const selectOrigen = document.getElementById("trans_estado_origen");
    const selectDestino = document.getElementById("trans_estado_destino");

    if (selectOrigen && transicion.estado_origen_id) {
        selectOrigen.value = transicion.estado_origen_id;
        selectOrigen.disabled = true; // No permitir cambiar en edición
        selectOrigen.classList.add("bg-gray-100", "cursor-not-allowed");
    }

    if (selectDestino && transicion.estado_destino_id) {
        selectDestino.value = transicion.estado_destino_id;
        selectDestino.disabled = true; // No permitir cambiar en edición
        selectDestino.classList.add("bg-gray-100", "cursor-not-allowed");
    }

    // Agregar mensaje informativo de edición
    const form = document.getElementById("formTransicion");
    if (form && !document.getElementById("mensaje_edicion")) {
        const mensajeEdicion = document.createElement("div");
        mensajeEdicion.id = "mensaje_edicion";
        mensajeEdicion.className =
            "bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4";
        mensajeEdicion.innerHTML = `
            <div class="flex items-start">
                <svg class="w-5 h-5 text-yellow-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                </svg>
                <div>
                    <p class="text-sm font-medium text-yellow-800">Editando Transición</p>
                    <p class="text-xs text-yellow-700 mt-1">Los estados origen y destino no se pueden modificar. Para cambiarlos, elimina esta transición y crea una nueva.</p>
                </div>
            </div>
        `;
        form.insertBefore(mensajeEdicion, form.firstChild);
    }

    // Textos
    if (transicion.nombre) {
        document.getElementById("trans_nombre").value = transicion.nombre;
    }

    if (transicion.texto_boton) {
        document.getElementById("trans_texto_boton").value =
            transicion.texto_boton;
    }

    if (transicion.descripcion) {
        document.getElementById("trans_descripcion").value =
            transicion.descripcion;
    }

    // Roles permitidos
    if (
        transicion.roles_permitidos &&
        Array.isArray(transicion.roles_permitidos)
    ) {
        document.querySelectorAll(".rol-permitido").forEach((checkbox) => {
            if (transicion.roles_permitidos.includes(checkbox.value)) {
                checkbox.checked = true;
            }
        });
    }

    // Solo funcionario asignado
    if (transicion.solo_funcionario_asignado) {
        document.getElementById("trans_solo_asignado").checked = true;
    }

    // Condiciones
    document.getElementById("trans_requiere_comentario").checked =
        transicion.requiere_comentario || false;
    document.getElementById("trans_requiere_documento").checked =
        transicion.requiere_documento || false;
    document.getElementById("trans_requiere_aprobacion").checked =
        transicion.requiere_aprobacion_previa || false;

    if (transicion.minimo_dias_transcurridos) {
        document.getElementById("trans_check_dias").checked = true;
        document.getElementById("trans_minimo_dias").value =
            transicion.minimo_dias_transcurridos;
    }

    // Acciones automáticas
    document.getElementById("trans_reasignar").checked =
        transicion.reasignar_funcionario || false;
    document.getElementById("trans_cambiar_prioridad").checked =
        !!transicion.cambiar_prioridad_a;
    document.getElementById("trans_recalcular_fecha").checked =
        transicion.recalcular_fecha_vencimiento || false;
    document.getElementById("trans_generar_doc").checked =
        transicion.generar_documento || false;
    document.getElementById("trans_enviar_notif").checked =
        transicion.enviar_notificaciones !== false;
    document.getElementById("trans_registrar_audit").checked =
        transicion.registrar_auditoria !== false;

    // Confirmación
    document.getElementById("trans_requiere_confirmacion").checked =
        transicion.requiere_confirmacion !== false;

    if (transicion.mensaje_confirmacion) {
        document.getElementById("trans_mensaje_confirmacion").value =
            transicion.mensaje_confirmacion;
    }

    // Guardar ID para actualización
    document.getElementById("formTransicion").dataset.transicionId =
        transicion.id;
}

/**
 * Eliminar transición
 */
async function eliminarTransicion(id) {
    const confirmado = await Swal.fire({
        title: "¿Eliminar transición?",
        text: "Esta acción no se puede deshacer",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#DC2626",
        cancelButtonColor: "#6B7280",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
    });

    if (confirmado.isConfirmed) {
        try {
            const response = await fetch(
                `/admin/api/configuracion/flujos-transiciones/${id}`,
                {
                    method: "DELETE",
                    headers: {
                        "X-CSRF-TOKEN": document.querySelector(
                            'meta[name="csrf-token"]'
                        ).content,
                    },
                }
            );

            const result = await response.json();

            if (result.success) {
                Swal.fire({
                    icon: "success",
                    title: "Eliminada",
                    text: "Transición eliminada exitosamente",
                    timer: 2000,
                    showConfirmButton: false,
                });

                cargarTransicionesConfiguradas();
            }
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "No se pudo eliminar la transición",
            });
        }
    }
}

/**
 * Ver detalles de un estado
 */
function verDetallesEstado(id) {
    const estado = window.estadosDisponibles.find((e) => e.id === id);
    if (!estado) return;

    Swal.fire({
        title: `${estado.icono} ${estado.nombre}`,
        html: `
            <div class="text-left space-y-2">
                <p class="text-sm text-gray-600">${
                    estado.descripcion || "Sin descripción"
                }</p>
                <div class="border-t pt-2 mt-2">
                    <div class="grid grid-cols-2 gap-2 text-sm">
                        <div><span class="font-medium">Tipo:</span> ${
                            estado.tipo
                        }</div>
                        <div><span class="font-medium">Color:</span> <span class="inline-block w-4 h-4 rounded" style="background:${
                            estado.color
                        }"></span></div>
                    </div>
                </div>
            </div>
        `,
        icon: "info",
        confirmButtonText: "Cerrar",
    });
}

// ========================================
// VALIDACIÓN Y GUARDADO
// ========================================

async function validarYGuardarPaso(paso) {
    switch (paso) {
        case 1:
            return await validarYGuardarPaso1();
        case 2:
            return await validarYGuardarPaso2();
        case 3:
            return true; // Placeholder - pasar automáticamente
        case 4:
            return true; // En el paso 4 solo se revisa, el guardado final es con finalizarWizard
        default:
            return false;
    }
}

async function validarYGuardarPaso1() {
    console.log("========================================");
    console.log("🔍 VALIDANDO Y GUARDANDO PASO 1");
    console.log("========================================");
    console.log("📌 tipoIdCreado actual:", tipoIdCreado);
    console.log(
        "📌 datosWizardTemp.tipoIdCreado:",
        datosWizardTemp.tipoIdCreado
    );

    // Asegurar que tipoIdCreado esté actualizado
    if (!tipoIdCreado && datosWizardTemp.tipoIdCreado) {
        tipoIdCreado = datosWizardTemp.tipoIdCreado;
        console.log(
            "🔄 Restaurado tipoIdCreado de datosWizardTemp:",
            tipoIdCreado
        );
    }

    console.log("📌 tipoIdCreado FINAL a usar:", tipoIdCreado);

    // Validar todos los campos obligatorios
    const camposObligatorios = [
        "codigo",
        "nombre",
        "slug",
        "descripcion",
        "categoria_id",
        "area_responsable_id",
        "dias_respuesta",
        "dias_alerta",
        "sla",
    ];
    let todosValidos = true;

    for (const campo of camposObligatorios) {
        const esValido = await validarCampoPaso1(campo);
        if (!esValido) {
            todosValidos = false;
            console.error(`❌ Campo inválido: ${campo}`);
        }
    }

    if (!todosValidos) {
        mostrarAdvertencia(
            "Por favor, completa todos los campos obligatorios correctamente"
        );
        return false;
    }

    // Preparar datos del paso 1
    const diasRespuesta = parseInt(
        document.getElementById("wizard_dias_respuesta").value
    );
    const diasAlerta = parseInt(
        document.getElementById("wizard_dias_alerta").value
    );

    // Validar área antes de preparar datos
    const areaSelect = document.getElementById("wizard_area_responsable_id");
    const areaValue = areaSelect ? areaSelect.value : null;

    console.log("🔍 Área responsable:", {
        select: areaSelect,
        value: areaValue,
        options: areaSelect ? areaSelect.options.length : 0,
    });

    if (!areaValue || areaValue === "") {
        console.error("❌ Área responsable no seleccionada");
        mostrarAdvertencia("Debe seleccionar un área responsable");
        return false;
    }

    const datos = {
        codigo: document.getElementById("wizard_codigo").value.trim(),
        nombre: document.getElementById("wizard_nombre").value.trim(),
        slug: document.getElementById("wizard_slug").value.trim(),
        descripcion: document.getElementById("wizard_descripcion").value.trim(),
        instrucciones:
            document.getElementById("wizard_instrucciones").value.trim() ||
            null,
        categoria_id: parseInt(
            document.getElementById("wizard_categoria_id").value
        ),
        area_responsable_id: parseInt(areaValue),
        dias_respuesta: diasRespuesta,
        dias_alerta: diasAlerta,
        // Campos obligatorios por constraints de BD
        dias_alerta_amarilla: Math.max(
            diasAlerta + 1,
            Math.floor(diasRespuesta * 0.6)
        ),
        dias_alerta_roja: Math.max(1, Math.floor(diasRespuesta * 0.2)),
        tipo_dias: "habiles",
        iniciar_conteo_desde: "radicacion",
        sla_dias: document.getElementById("wizard_sla").value
            ? parseInt(document.getElementById("wizard_sla").value)
            : null,
        requiere_aprobacion: document.getElementById(
            "wizard_requiere_aprobacion"
        ).checked,
        requiere_pago: document.getElementById("wizard_requiere_pago").checked,
        valor_tramite: document.getElementById("wizard_requiere_pago").checked
            ? parseFloat(
                  document.getElementById("wizard_valor_tramite").value || 0
              )
            : null,
        tipo_valor: "fijo",
        requiere_documentos: document.getElementById(
            "wizard_requiere_documentos"
        ).checked,
        prioridad_defecto: "normal",
        momento_generacion: "al_aprobar",
        icono: document.getElementById("wizard_icono").value,
        color: document.getElementById("wizard_color").value,
        visible_portal: true,
        solo_usuarios_registrados: true,
        activo: false, // Inactivo hasta finalizar
    };

    console.log("📦 Datos a enviar:", datos);
    console.log("========================================");

    try {
        // Si ya hay un tipo creado, actualizar; si no, crear
        let response;
        let method;
        let url;

        if (tipoIdCreado) {
            method = "PUT";
            url = `/admin/api/tipos-solicitud/${tipoIdCreado}`;
            console.log("🔄🔄🔄 ACTUALIZANDO TIPO EXISTENTE 🔄🔄🔄");
            console.log(`   Método: ${method}`);
            console.log(`   URL: ${url}`);
            console.log(`   ID del tipo: ${tipoIdCreado}`);
            console.log(`   Código: ${datos.codigo}`);
            console.log(`   Slug: ${datos.slug}`);
            console.log("========================================");

            response = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                    Accept: "application/json",
                    "X-CSRF-TOKEN":
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute("content") || "",
                },
                body: JSON.stringify(datos),
            });
        } else {
            method = "POST";
            url = "/admin/api/tipos-solicitud";
            console.log("✨✨✨ CREANDO NUEVO TIPO ✨✨✨");
            console.log(`   Método: ${method}`);
            console.log(`   URL: ${url}`);
            console.log(`   Código: ${datos.codigo}`);
            console.log(`   Slug: ${datos.slug}`);
            console.log("========================================");

            response = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                    Accept: "application/json",
                    "X-CSRF-TOKEN":
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute("content") || "",
                },
                body: JSON.stringify(datos),
            });
        }

        console.log(
            `📡 RESPUESTA: ${method} ${url} - Status: ${response.status}`
        );
        console.log("========================================");

        if (response.ok) {
            const jsonData = await response.json();
            console.log("✅ Respuesta exitosa COMPLETA:", jsonData);
            console.log(
                "✅ Estructura de respuesta:",
                JSON.stringify(jsonData, null, 2)
            );

            // Extraer el ID de diferentes formatos de respuesta
            const nuevoId =
                jsonData.id ||
                jsonData.data?.id ||
                jsonData.tipo?.id ||
                jsonData.tipoSolicitud?.id;

            console.log("🔍 ID extraído de respuesta:", nuevoId);
            console.log("🔍 tipoIdCreado ANTES:", tipoIdCreado);

            // Guardar el ID del tipo creado o actualizado
            if (!tipoIdCreado && nuevoId) {
                tipoIdCreado = nuevoId;
                datosWizardTemp.tipoIdCreado = nuevoId; // Guardar inmediatamente
                console.log(
                    `✅✅✅ TIPO CREADO CON ID: ${tipoIdCreado} ✅✅✅`
                );
                console.log(
                    "💾 Guardado en datosWizardTemp:",
                    datosWizardTemp.tipoIdCreado
                );
            } else if (tipoIdCreado) {
                console.log(
                    `✅✅✅ TIPO ACTUALIZADO ID: ${tipoIdCreado} ✅✅✅`
                );
            } else {
                console.error(
                    "⚠️⚠️⚠️ NO SE PUDO OBTENER EL ID DE LA RESPUESTA ⚠️⚠️⚠️"
                );
                console.error("Respuesta completa:", jsonData);
            }

            console.log("🔍 tipoIdCreado DESPUÉS:", tipoIdCreado);
            console.log("========================================");

            return true;
        } else {
            // Manejar errores de validación
            const errorData = await response.json();
            console.error("❌❌❌ ERROR DEL SERVIDOR ❌❌❌");
            console.error("   Método usado:", method);
            console.error("   URL:", url);
            console.error("   tipoIdCreado:", tipoIdCreado);
            console.error("   Status:", response.status);
            console.error("   Error data:", errorData);
            console.error("========================================");

            if (errorData.errors) {
                console.error("❌ Errores de validación:", errorData.errors);

                // Mostrar errores específicos con contexto
                let mensajeError =
                    method === "PUT"
                        ? `Errores al ACTUALIZAR tipo (ID: ${tipoIdCreado}):\n\n`
                        : "Errores al CREAR nuevo tipo:\n\n";

                for (const [campo, errores] of Object.entries(
                    errorData.errors
                )) {
                    mensajeError += `• ${campo}: ${errores.join(", ")}\n`;
                }

                // Si son errores de unique en PUT, agregar ayuda
                if (
                    method === "PUT" &&
                    (errorData.errors.codigo || errorData.errors.slug)
                ) {
                    mensajeError +=
                        "\n⚠️ NOTA: Esto NO debería pasar en modo UPDATE.\n";
                    mensajeError += `El backend debería ignorar el registro con ID ${tipoIdCreado}.\n`;
                    mensajeError +=
                        "Verifica que la ruta PUT esté configurada correctamente.";
                }

                mostrarErrorAlerta("Error de Validación", mensajeError);
            } else {
                mostrarErrorAlerta(
                    "Error al guardar",
                    errorData.message ||
                        "No se pudo guardar la información básica"
                );
            }

            return false;
        }
    } catch (error) {
        console.error("❌ Error al guardar paso 1:", error);
        mostrarErrorAlerta(
            "Error al guardar",
            error.message || "No se pudo guardar la información básica"
        );
        return false;
    }
}

async function validarYGuardarPaso2() {
    console.log("========================================");
    console.log("🔍 VALIDANDO Y GUARDANDO PASO 2 - Campos del Formulario");
    console.log("========================================");

    // Validate at least one field is selected
    if (
        !window.camposSeleccionadosWizard ||
        window.camposSeleccionadosWizard.length === 0
    ) {
        Swal.fire({
            icon: "warning",
            title: "Campos requeridos",
            text: "Debes seleccionar al menos un campo para el formulario",
            confirmButtonColor: "#EF4444",
        });
        return false;
    }

    // Verify tipoIdCreado exists
    if (!tipoIdCreado && datosWizardTemp.tipoIdCreado) {
        tipoIdCreado = datosWizardTemp.tipoIdCreado;
    }

    if (!tipoIdCreado) {
        console.error(
            "❌ No hay tipoIdCreado. No se puede guardar campos sin un tipo creado."
        );
        Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se puede continuar. Debe completar el Paso 1 primero.",
            confirmButtonColor: "#EF4444",
        });
        return false;
    }

    console.log(
        "✅ Campos seleccionados:",
        window.camposSeleccionadosWizard.length
    );
    console.log("✅ ID del tipo:", tipoIdCreado);

    // Prepare data to send
    console.log(
        "📝 Campos seleccionados ultimo paso:",
        window.camposSeleccionadosWizard
    );

    // Separar campos por tipo de origen
    const camposPredefinidos = [];
    const camposPersonalizados = [];
    const camposBiblioteca = [];

    window.camposSeleccionadosWizard.forEach((campo, index) => {
        console.log(`🔍 Procesando campo ${index}:`, campo);

        const tipoOrigen = campo.tipo_origen || campo.pivot?.tipo_origen;
        console.log(`   - Tipo origen: ${tipoOrigen}`);

        if (tipoOrigen === "predefinido") {
            camposPredefinidos.push(campo.slug);
        } else if (
            tipoOrigen === "personalizado" ||
            tipoOrigen === "formulario_tipo_solicitud"
        ) {
            // Incluir el ID del campo si existe para que el backend lo actualice en lugar de crear uno nuevo
            camposPersonalizados.push({
                id: campo.id || campo.campo_id || null,
                tipo: campo.tipo,
                nombre: campo.nombre || campo.etiqueta,
                etiqueta: campo.etiqueta || campo.nombre,
                obligatorio:
                    campo.obligatorio || campo.pivot?.obligatorio || false,
                orden: campo.orden || campo.pivot?.orden || index + 1,
                configuracion: campo.configuracion || {},
            });
        } else if (tipoOrigen === "biblioteca") {
            const campoId = campo.campo_id || campo.id;
            if (campoId) {
                camposBiblioteca.push(campoId);
            }
        } else {
            console.warn(`⚠️ Campo con tipo_origen desconocido:`, campo);
            // Si no tiene tipo_origen, intentar inferirlo
            if (campo.campo_id || (campo.id && campo.slug && !campo.etiqueta)) {
                // Probablemente es de biblioteca
                const campoId = campo.campo_id || campo.id;
                if (campoId) {
                    camposBiblioteca.push(campoId);
                }
            } else {
                // Probablemente es personalizado
                camposPersonalizados.push({
                    id: campo.id || null,
                    tipo: campo.tipo,
                    nombre: campo.nombre || campo.etiqueta,
                    etiqueta: campo.etiqueta || campo.nombre,
                    obligatorio: campo.obligatorio || false,
                    orden: campo.orden || index + 1,
                    configuracion: campo.configuracion || {},
                });
            }
        }
    });

    const datosEnviar = {
        campos_predefinidos: camposPredefinidos,
        campos_personalizados: camposPersonalizados,
        campos_biblioteca: camposBiblioteca,
    };

    console.log("📦 Datos a enviar:");
    console.log("   - Campos predefinidos:", camposPredefinidos);
    console.log("   - Campos personalizados:", camposPersonalizados);
    console.log("   - Campos biblioteca:", camposBiblioteca);

    try {
        const url = `/admin/solicitudes/api/tipos/${tipoIdCreado}/campos-rapidos`;
        console.log("📡 POST", url);

        // Verificar y refrescar token CSRF si es necesario
        let csrfToken = document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute("content");
        console.log("🔐 CSRF Token:", csrfToken ? "Presente" : "FALTANTE");

        if (!csrfToken) {
            console.log("⚠️ Token CSRF faltante, intentando refrescar...");
            csrfToken = await refrescarCSRFToken();

            if (!csrfToken) {
                throw new Error(
                    "Token CSRF no disponible. Por favor recarga la página."
                );
            }
        }

        console.log("📡 Enviando petición con headers:", {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
            Accept: "application/json",
            "X-CSRF-TOKEN": csrfToken ? "presente" : "faltante",
        });

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Requested-With": "XMLHttpRequest",
                Accept: "application/json",
                "X-CSRF-TOKEN": csrfToken,
            },
            body: JSON.stringify(datosEnviar),
            credentials: "same-origin",
        });

        console.log("📡 Response status:", response.status);
        console.log("📡 Response headers:", {
            contentType: response.headers.get("content-type"),
            location: response.headers.get("location"),
        });

        if (response.ok) {
            const jsonData = await response.json();
            console.log("✅ Respuesta exitosa:", jsonData);

            if (jsonData.success) {
                console.log(
                    `✅ Campos guardados exitosamente (${jsonData.campos_count} campos)`
                );
                return true;
            } else {
                throw new Error(jsonData.message || "Error al guardar campos");
            }
        } else {
            const errorData = await response.json();
            console.error("❌ Error del servidor:", errorData);
            console.error("❌ Status:", response.status);
            console.error("❌ URL intentada:", url);

            // Manejar error 404 - ruta no encontrada
            if (response.status === 404) {
                Swal.fire({
                    icon: "error",
                    title: "Error de configuración",
                    html: `
                        <p>No se pudo encontrar la ruta del servidor.</p>
                        <p class="text-sm mt-2"><strong>URL:</strong> ${url}</p>
                        <p class="text-sm mt-2">Por favor, verifica que:</p>
                        <ul class="text-sm text-left">
                            <li>1. El tipo de solicitud fue creado correctamente (ID: ${tipoIdCreado})</li>
                            <li>2. La ruta existe en el servidor</li>
                            <li>3. Tu sesión sigue activa</li>
                        </ul>
                    `,
                    confirmButtonColor: "#EF4444",
                });
                return false;
            }

            // Manejar error 401 - no autenticado
            if (response.status === 401) {
                Swal.fire({
                    icon: "warning",
                    title: "Sesión expirada",
                    text: "Tu sesión ha expirado. Por favor, recarga la página e inicia sesión nuevamente.",
                    confirmButtonText: "Recargar página",
                    confirmButtonColor: "#F59E0B",
                }).then((result) => {
                    if (result.isConfirmed) {
                        window.location.reload();
                    }
                });
                return false;
            }

            let mensajeError = "Error al guardar los campos del formulario";
            if (errorData.errors) {
                mensajeError += ":\n\n";
                for (const [campo, errores] of Object.entries(
                    errorData.errors
                )) {
                    mensajeError += `• ${campo}: ${errores.join(", ")}\n`;
                }
            } else if (errorData.message) {
                mensajeError += ": " + errorData.message;
            }

            Swal.fire({
                icon: "error",
                title: "Error al guardar",
                text: mensajeError,
                confirmButtonColor: "#EF4444",
            });

            return false;
        }
    } catch (error) {
        console.error("❌ Excepción al guardar paso 2:", error);
        Swal.fire({
            icon: "error",
            title: "Error",
            text:
                error.message || "No se pudo guardar los campos del formulario",
            confirmButtonColor: "#EF4444",
        });
        return false;
    }
}

function mostrarLoading(title, text) {
    Swal.fire({
        title: title,
        text: text,
        allowOutsideClick: false,
        allowEscapeKey: false,
    });
}
async function finalizarWizard() {
    if (!tipoIdCreado) {
        mostrarErrorAlerta("Error", "No se ha creado el tipo de solicitud");
        return;
    }

    const modoEdicion = datosWizardTemp.modoEdicion || false;

    try {
        // Mostrar loading
        Swal.fire({
            title: modoEdicion
                ? "Guardando cambios..."
                : "Finalizando configuración...",
            text: modoEdicion
                ? "Actualizando información del tipo de solicitud"
                : "Guardando configuración y activando tipo de solicitud",
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => {
                Swal.showLoading();
            },
        });

        // 1. Guardar tipo de flujo de aprobación
        await guardarFlujoAprobacion();

        // 2. Guardar plantillas seleccionadas
        if (
            window.plantillasSeleccionadas &&
            window.plantillasSeleccionadas.length > 0
        ) {
            await guardarPlantillasDelTipo();
        }

        // 2. Activar el tipo de solicitud (solo si es creación nueva)
        if (!modoEdicion) {
            const response = await fetch(
                `/admin/api/tipos-solicitud/${tipoIdCreado}/toggle`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        "X-Requested-With": "XMLHttpRequest",
                        Accept: "application/json",
                        "X-CSRF-TOKEN":
                            document
                                .querySelector('meta[name="csrf-token"]')
                                ?.getAttribute("content") || "",
                    },
                    body: JSON.stringify({ activo: true }),
                }
            );

            await manejarRespuestaFetch(response);

            if (!response.ok) {
                throw new Error("Error al activar el tipo");
            }
        }

        // Cerrar modal
        document.getElementById("wizardModal")?.remove();

        // Limpiar estado
        limpiarEstadoWizard();

        // Mostrar éxito
        if (modoEdicion) {
            await mostrarExito(
                "¡Cambios Guardados!",
                "El tipo de solicitud se ha actualizado correctamente"
            );
        } else {
            await mostrarExito(
                "¡Tipo de Solicitud Creado!",
                `El tipo se ha configurado correctamente con ${
                    window.plantillasSeleccionadas?.length || 0
                } plantilla(s) y está activo`
            );
        }

        // Recargar lista
        cargarTiposSolicitud();
    } catch (error) {
        console.error("Error al finalizar:", error);
        Swal.close();
        mostrarErrorAlerta(
            "Error al finalizar",
            error.message ||
                `No se pudo ${
                    modoEdicion ? "actualizar" : "activar"
                } el tipo de solicitud`
        );
    }
}

/**
 * Guardar el flujo de aprobación del tipo de solicitud
 */
async function guardarFlujoAprobacion() {
    console.log("========================================");
    console.log("💾 Guardando flujo de aprobación");
    console.log("========================================");

    if (!tipoIdCreado) {
        console.error("❌ No hay tipoIdCreado");
        return;
    }

    try {
        // Obtener el tipo de flujo seleccionado
        const tipoFlujo = datosWizardTemp.tipo_flujo || "defecto";
        console.log("📋 Tipo de flujo a guardar:", tipoFlujo);

        // Preparar datos del flujo
        const flujoData = {
            tipo: tipoFlujo,
        };

        // Si es flujo personalizado, agregar más configuración si existe
        if (tipoFlujo === "personalizado") {
            // Aquí podrías agregar transiciones, estados, etc.
            flujoData.transiciones = []; // Por ahora vacío, se configura en otro momento
            console.log(
                "⚙️ Flujo personalizado - transiciones se configuran por separado"
            );
        }

        console.log("📦 Datos a enviar:", flujoData);

        // Obtener los datos actuales del tipo para no perder información
        const responseGet = await fetch(
            `/admin/api/tipos-solicitud/${tipoIdCreado}`,
            {
                headers: {
                    "X-Requested-With": "XMLHttpRequest",
                    Accept: "application/json",
                    "X-CSRF-TOKEN":
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute("content") || "",
                },
            }
        );

        if (!responseGet.ok) {
            throw new Error("No se pudo cargar los datos actuales del tipo");
        }

        const datosActuales = await responseGet.json();
        const tipoActual = datosActuales.tipo || datosActuales;

        // Preparar datos completos para actualizar, manteniendo los valores actuales
        const datosCompletos = {
            codigo: tipoActual.codigo,
            nombre: tipoActual.nombre,
            slug: tipoActual.slug,
            descripcion: tipoActual.descripcion,
            instrucciones: tipoActual.instrucciones,
            categoria_id: tipoActual.categoria_id,
            area_responsable_id: tipoActual.area_responsable_id,
            dias_respuesta: tipoActual.dias_respuesta,
            dias_alerta: tipoActual.dias_alerta,
            dias_alerta_amarilla: tipoActual.dias_alerta_amarilla,
            dias_alerta_roja: tipoActual.dias_alerta_roja,
            tipo_dias: tipoActual.tipo_dias,
            iniciar_conteo_desde: tipoActual.iniciar_conteo_desde,
            sla_dias: tipoActual.sla_dias,
            requiere_aprobacion: tipoActual.requiere_aprobacion || false,
            requiere_pago: tipoActual.requiere_pago || false,
            valor_tramite: tipoActual.valor_tramite,
            tipo_valor: tipoActual.tipo_valor,
            requiere_documentos: tipoActual.requiere_documentos || false,
            documentos_requeridos: tipoActual.documentos_requeridos,
            prioridad_defecto: tipoActual.prioridad_defecto,
            momento_generacion: tipoActual.momento_generacion,
            icono: tipoActual.icono,
            color: tipoActual.color,
            // Actualizar solo el flujo
            flujo_aprobacion: flujoData,
        };

        console.log("📦 Datos completos a enviar:", datosCompletos);

        // Guardar en el campo flujo_aprobacion del tipo de solicitud
        const response = await fetch(
            `/admin/api/tipos-solicitud/${tipoIdCreado}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                    Accept: "application/json",
                    "X-CSRF-TOKEN":
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute("content") || "",
                },
                body: JSON.stringify(datosCompletos),
            }
        );

        await manejarRespuestaFetch(response);

        if (response.ok) {
            const data = await response.json();
            console.log("✅ Flujo de aprobación guardado:", data);
        } else {
            const errorData = await response.json();
            console.error("❌ Error al guardar flujo:", errorData);
            throw new Error(
                errorData.message || "Error al guardar flujo de aprobación"
            );
        }

        console.log("✅ Flujo de aprobación guardado correctamente");
        console.log("========================================");
    } catch (error) {
        console.error("❌ Error al guardar flujo de aprobación:", error);
        // No lanzar el error para no interrumpir el proceso completo
        // Solo loguearlo
        console.warn("⚠️ Continuando sin guardar el flujo...");
    }
}

/**
 * Guardar las plantillas asociadas al tipo de solicitud
 */
async function guardarPlantillasDelTipo() {
    if (
        !tipoIdCreado ||
        !window.plantillasSeleccionadas ||
        window.plantillasSeleccionadas.length === 0
    ) {
        console.log("⚠️ No hay plantillas para guardar o no hay tipoIdCreado");
        return;
    }

    console.log("💾 Guardando plantillas para tipo:", tipoIdCreado);
    console.log("📋 Plantillas seleccionadas:", window.plantillasSeleccionadas);

    const plantillasParaGuardar = window.plantillasSeleccionadas.map(
        (plantilla) => ({
            plantilla_documento_id: plantilla.id,
            generar_automatico: plantilla.generar_automatico ?? true,
            momento_generacion: plantilla.momento_generacion || "al_aprobar",
            es_principal: plantilla.es_principal ?? false,
            orden: plantilla.orden || 1,
        })
    );

    console.log("📤 Datos a enviar:", { plantillas: plantillasParaGuardar });

    try {
        const url = `/admin/api/tipos-solicitud/${tipoIdCreado}/plantillas`;
        console.log("🌐 URL:", url);

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Requested-With": "XMLHttpRequest",
                Accept: "application/json",
                "X-CSRF-TOKEN":
                    document
                        .querySelector('meta[name="csrf-token"]')
                        ?.getAttribute("content") || "",
            },
            body: JSON.stringify({ plantillas: plantillasParaGuardar }),
        });

        console.log("📡 Respuesta status:", response.status);

        await manejarRespuestaFetch(response);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("❌ Error del servidor:", errorData);
            throw new Error(errorData.message || "Error al guardar plantillas");
        }

        const data = await response.json();
        console.log("✅ Plantillas guardadas exitosamente:", data);
    } catch (error) {
        console.error("❌ Error al guardar plantillas:", error);
        throw error;
    }
}

async function editarTipo(id) {
    try {
        // Mostrar loading
        Swal.fire({
            title: "Cargando...",
            text: "Obteniendo información del tipo de solicitud",
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => {
                Swal.showLoading();
            },
        });

        // Cargar datos del tipo de solicitud
        const response = await fetch(`/admin/api/tipos-solicitud/${id}`, {
            headers: {
                "X-Requested-With": "XMLHttpRequest",
                Accept: "application/json",
                "X-CSRF-TOKEN":
                    document
                        .querySelector('meta[name="csrf-token"]')
                        ?.getAttribute("content") || "",
            },
        });

        await manejarRespuestaFetch(response);

        if (!response.ok) {
            throw new Error("No se pudo cargar el tipo de solicitud");
        }

        const data = await response.json();
        console.log("📝 Datos del tipo de solicitud:", data);
        const tipo = data.tipo || data;

        console.log("📝 Tipo de solicitud cargado para editar:", tipo);
        console.log("📋 Plantillas:", data.plantillas);
        console.log("📝 Campos personalizados:", tipo.campos_personalizados);
        console.log("🔒 Permisos:", data.permisos);

        // Guardar permisos en variable global para que abrirModalEditarTipo pueda acceder
        window.currentPermisos = data.permisos || {
            puede_editar_campos: true,
            tiene_solicitudes: false,
            solicitudes_count: 0,
            mensaje_bloqueo: null,
        };

        Swal.close();

        // Abrir wizard en modo edición con todos los datos
        abrirModalEditarTipo(tipo, data.plantillas);
    } catch (error) {
        console.error("Error al cargar tipo para editar:", error);
        Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudo cargar la información del tipo de solicitud",
        });
    }
}

function configurarFormulario(id) {
    abrirModalConfigurarFormulario(id);
}

async function clonarTipo(id) {
    const confirmado = await mostrarConfirmacion({
        title: "¿Clonar Tipo de Solicitud?",
        text: "Se creará una copia de este tipo con los mismos campos, flujos y configuración. El nuevo tipo se creará como inactivo.",
        confirmButtonText: "Sí, clonar",
        confirmButtonColor: "#2563eb",
    });

    if (!confirmado) return;

    try {
        // Mostrar loading
        Swal.fire({
            title: "Clonando...",
            text: "Creando copia del tipo de solicitud",
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => {
                Swal.showLoading();
            },
        });

        const response = await fetch(
            `/admin/api/tipos-solicitud/${id}/clonar`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": document.querySelector(
                        'meta[name="csrf-token"]'
                    ).content,
                    "X-Requested-With": "XMLHttpRequest",
                },
            }
        );

        await manejarRespuestaFetch(response);

        const data = await response.json();

        if (response.ok && data.success) {
            Swal.fire({
                icon: "success",
                title: "¡Clonado Exitosamente!",
                html: `
                    <div class="text-left">
                        <p class="mb-2">Se ha creado una copia del tipo de solicitud:</p>
                        <div class="bg-gray-50 rounded p-3 mt-2">
                            <p class="font-semibold text-blue-600">${data.tipo.codigo}</p>
                            <p class="text-sm text-gray-600">${data.tipo.nombre}</p>
                        </div>
                        <p class="text-sm text-yellow-600 mt-3">
                            ⚠️ El tipo clonado está <strong>inactivo</strong>. Puedes activarlo cuando esté listo.
                        </p>
                    </div>
                `,
                confirmButtonColor: "#3B82F6",
                confirmButtonText: "Entendido",
            }).then(() => {
                // Recargar la lista
                cargarTiposSolicitud();
            });
        } else {
            throw new Error(data.message || "Error al clonar el tipo");
        }
    } catch (error) {
        console.error("Error al clonar tipo:", error);
        Swal.fire({
            icon: "error",
            title: "Error al Clonar",
            text: error.message || "No se pudo clonar el tipo de solicitud",
            confirmButtonColor: "#EF4444",
        });
    }
}

async function eliminarTipo(id, codigo) {
    const confirmado = await mostrarConfirmacion({
        title: "¿Eliminar Tipo de Solicitud?",
        html: `
            <p class="mb-4">Esta acción no se puede deshacer.</p>
            <p class="text-sm text-gray-600">Para confirmar, escriba el código del tipo:</p>
            <p class="font-mono font-bold text-lg mt-2">${codigo}</p>
        `,
        input: "text",
        inputPlaceholder: "Ingrese el código...",
        confirmButtonText: "Eliminar",
        confirmButtonColor: "#dc2626",
        showCancelButton: true,
        inputValidator: (value) => {
            if (value !== codigo) {
                return "El código no coincide";
            }
        },
    });

    if (confirmado) {
        try {
            const response = await fetch(`/admin/api/tipos-solicitud/${id}`, {
                method: "DELETE",
                headers: {
                    "X-Requested-With": "XMLHttpRequest",
                    Accept: "application/json",
                    "X-CSRF-TOKEN": document
                        .querySelector('meta[name="csrf-token"]')
                        .getAttribute("content"),
                },
            });

            await manejarRespuestaFetch(response);

            if (response.ok) {
                const data = await response.json();
                mostrarToast(
                    data.message || "Tipo de solicitud eliminado",
                    "success"
                );
                cargarTiposSolicitud();
            } else {
                const data = await response.json();
                mostrarErrorAlerta(data.message || "Error al eliminar");
            }
        } catch (error) {
            console.error("Error:", error);
            mostrarErrorAlerta("Error al eliminar tipo de solicitud");
        }
    }
}

async function alternarEstadoTipo(id, nuevoEstado) {
    try {
        const response = await fetch(
            `/admin/api/tipos-solicitud/${id}/toggle`,
            {
                method: "PATCH",
                headers: {
                    "X-Requested-With": "XMLHttpRequest",
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": document
                        .querySelector('meta[name="csrf-token"]')
                        .getAttribute("content"),
                },
            }
        );

        await manejarRespuestaFetch(response);

        if (response.ok) {
            const data = await response.json();
            const toggle = document.getElementById(`toggle-estado-${id}`);
            if (toggle) toggle.checked = nuevoEstado;
            const estado = document.getElementById(`estado-${id}`);
            if (estado)
                estado.textContent = nuevoEstado ? "Activo" : "Inactivo";
            if (estado) estado.classList.toggle("text-green-600", nuevoEstado);
            if (estado) estado.classList.toggle("text-gray-400", !nuevoEstado);
            mostrarToast(data.message, "success");
        } else {
            // Revertir toggle
            const toggle = document.querySelector(
                `input[onchange="alternarEstadoTipo(${id}, this.checked)"]`
            );
            if (toggle) toggle.checked = !nuevoEstado;
            mostrarErrorAlerta("Error al cambiar estado");
        }
    } catch (error) {
        console.error("Error:", error);
        const toggle = document.querySelector(
            `input[onchange="alternarEstadoTipo(${id}, this.checked)"]`
        );
        if (toggle) toggle.checked = !nuevoEstado;
        mostrarErrorAlerta("Error al cambiar estado");
    }
}

// ========================================
// FILTROS
// ========================================

function limpiarFiltros() {
    filtrosActuales = {
        search: "",
        categoria: "",
        estado: "",
        area_id: "",
    };

    document.getElementById("searchInput").value = "";
    document.getElementById("filterCategoria").value = "";
    document.getElementById("filterEstado").value = "";
    document.getElementById("filterArea").value = "";

    paginaActual = 1;
    cargarTiposSolicitud();
    actualizarIndicadorFiltros();
}

function actualizarIndicadorFiltros() {
    let count = 0;
    if (filtrosActuales.search) count++;
    if (filtrosActuales.categoria) count++;
    if (filtrosActuales.estado) count++;
    if (filtrosActuales.area_id) count++;

    const badge = document.getElementById("filterBadge");
    const filterCount = document.getElementById("filterCount");

    if (count > 0) {
        badge.classList.remove("hidden");
        filterCount.textContent = count;
    } else {
        badge.classList.add("hidden");
    }
}

// ========================================
// HELPERS DE SWEETALERT2
// (Reutilizar del archivo usuarios.js o definir aquí)
// ========================================

function mostrarToast(message, type = "success") {
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

    const icons = {
        success: "success",
        error: "error",
        warning: "warning",
        info: "info",
    };

    Toast.fire({
        icon: icons[type] || "success",
        title: message,
    });
}

async function mostrarConfirmacion(opciones = {}) {
    const defaultOptions = {
        title: "¿Está seguro?",
        text: "Esta acción no se puede deshacer",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#2563eb",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Sí, confirmar",
        cancelButtonText: "Cancelar",
        reverseButtons: true,
    };

    const result = await Swal.fire({ ...defaultOptions, ...opciones });
    return result.isConfirmed;
}

function mostrarErrorAlerta(mensaje, titulo = "Error") {
    return mostrarToast(titulo, "error", mensaje);
}

function mostrarInfo(mensaje, titulo = "Información") {
    return mostrarToast(titulo, "info", mensaje);
}

function mostrarExito(titulo, mensaje) {
    return mostrarToast(titulo, "success", mensaje);
}

// ========================================
// GESTIÓN DE PLANTILLAS (PASO 3)
// ========================================

// Variable global para almacenar plantillas seleccionadas
window.plantillasSeleccionadas = window.plantillasSeleccionadas || [];
window.todasLasPlantillas = window.todasLasPlantillas || [];

/**
 * Cargar plantillas disponibles
 */
async function cargarPlantillasDisponibles() {
    try {
        const busqueda =
            document.getElementById("buscarPlantilla")?.value || "";
        const tipoDocumento =
            document.getElementById("filtroTipoDocumento")?.value || "";

        const params = new URLSearchParams();
        if (busqueda) params.append("search", busqueda);
        if (tipoDocumento) params.append("tipo", tipoDocumento);
        params.append("per_page", 1000); // Cargar todas las plantillas activas

        const response = await fetch(
            `/admin/api/configuracion/plantillas-documentos?${params.toString()}`,
            {
                headers: {
                    "X-CSRF-TOKEN": document.querySelector(
                        'meta[name="csrf-token"]'
                    ).content,
                    Accept: "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                },
            }
        );

        await manejarRespuestaFetch(response);

        if (!response.ok) {
            throw new Error("Error al cargar plantillas");
        }

        const data = await response.json();

        if (data.success) {
            // Extraer las plantillas del objeto paginado
            const plantillas = data.plantillas?.data || data.plantillas || [];
            window.todasLasPlantillas = plantillas;
            renderizarPlantillasDisponibles(plantillas);
        } else {
            throw new Error(data.message || "Error al cargar plantillas");
        }
    } catch (error) {
        console.error("Error al cargar plantillas:", error);
        const container = document.getElementById("listaPlantillasDisponibles");
        if (container) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <p class="text-red-600">Error al cargar plantillas</p>
                    <button onclick="cargarPlantillasDisponibles()"
                        class="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Reintentar
                    </button>
                </div>
            `;
        }
    }
}

/**
 * Renderizar lista de plantillas disponibles
 */
function renderizarPlantillasDisponibles(plantillas) {
    const container = document.getElementById("listaPlantillasDisponibles");

    if (!container) return;

    if (!plantillas || plantillas.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8">
                <p class="text-gray-500">No se encontraron plantillas disponibles</p>
            </div>
        `;
        return;
    }

    const plantillasHTML = plantillas
        .map((plantilla) => {
            const estaSeleccionada = window.plantillasSeleccionadas.some(
                (p) => p.id === plantilla.id
            );
            const tipoDocumentoLabel = obtenerLabelTipoDocumento(
                plantilla.tipo_documento
            );
            const colorTipo = obtenerColorTipoDocumento(
                plantilla.tipo_documento
            );

            return `
            <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow ${
                estaSeleccionada ? "bg-blue-50 border-blue-300" : "bg-white"
            }">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-2">
                            <h5 class="font-semibold text-gray-800">${
                                plantilla.nombre
                            }</h5>
                            <span class="px-2 py-1 ${colorTipo} rounded-full text-xs font-medium">
                                ${tipoDocumentoLabel}
                            </span>
                        </div>
                        <p class="text-sm text-gray-600 mb-2">${
                            plantilla.descripcion || "Sin descripción"
                        }</p>
                        <div class="flex items-center gap-4 text-xs text-gray-500 mb-3">
                            <span>📄 ${plantilla.tamano_pagina || "carta"} - ${
                plantilla.orientacion || "vertical"
            }</span>
                            <span>🔧 ${
                                plantilla.variables_usadas.length || 0
                            } variables</span>
                        </div>
                        <button onclick="verVistaPrevia(${plantilla.id})"
                            class="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                            </svg>
                            Ver Vista Previa
                        </button>
                    </div>
                    <div class="ml-4 flex flex-col gap-2">
                        ${
                            estaSeleccionada
                                ? `<button onclick="quitarPlantilla(${plantilla.id})"
                                class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm whitespace-nowrap">
                                Quitar
                            </button>`
                                : `<button onclick="agregarPlantilla(${plantilla.id})"
                                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm whitespace-nowrap">
                                + Agregar
                            </button>`
                        }
                    </div>
                </div>
            </div>
        `;
        })
        .join("");

    container.innerHTML = plantillasHTML;
}

/**
 * Agregar plantilla a la selección
 */
function agregarPlantilla(plantillaId) {
    const plantilla = window.todasLasPlantillas.find(
        (p) => p.id === plantillaId
    );

    if (!plantilla) {
        mostrarToast("Plantilla no encontrada", "error");
        return;
    }

    // Verificar si ya está seleccionada
    if (window.plantillasSeleccionadas.some((p) => p.id === plantillaId)) {
        mostrarToast("Esta plantilla ya está seleccionada", "warning");
        return;
    }

    // Agregar configuración por defecto
    const plantillaConConfig = {
        ...plantilla,
        generar_automatico: true,
        momento_generacion: "al_aprobar",
        es_principal: window.plantillasSeleccionadas.length === 0,
        orden: window.plantillasSeleccionadas.length + 1,
    };

    window.plantillasSeleccionadas.push(plantillaConConfig);

    // Re-renderizar ambas listas
    renderizarPlantillasDisponibles(window.todasLasPlantillas);
    renderizarPlantillasSeleccionadas();

    mostrarToast("Plantilla agregada correctamente", "success");
}

/**
 * Quitar plantilla de la selección
 */
function quitarPlantilla(plantillaId) {
    const index = window.plantillasSeleccionadas.findIndex(
        (p) => p.id === plantillaId
    );

    if (index === -1) {
        return;
    }

    window.plantillasSeleccionadas.splice(index, 1);

    // Reordenar
    window.plantillasSeleccionadas.forEach((p, i) => {
        p.orden = i + 1;
    });

    // Re-renderizar ambas listas
    renderizarPlantillasDisponibles(window.todasLasPlantillas);
    renderizarPlantillasSeleccionadas();

    mostrarToast("Plantilla eliminada", "info");
}

/**
 * Renderizar plantillas seleccionadas
 */
function renderizarPlantillasSeleccionadas() {
    const container = document.getElementById("listaPlantillasSeleccionadas");
    const contador = document.getElementById("contadorPlantillas");

    if (contador) {
        contador.textContent = window.plantillasSeleccionadas.length;
    }

    if (!container) return;

    if (window.plantillasSeleccionadas.length === 0) {
        container.innerHTML =
            '<p class="text-sm text-gray-500 italic">No hay plantillas seleccionadas aún</p>';
        return;
    }

    const plantillasHTML = window.plantillasSeleccionadas
        .map((plantilla, index) => {
            const tipoDocumentoLabel = obtenerLabelTipoDocumento(
                plantilla.tipo_documento
            );

            return `
            <div class="bg-white border border-gray-300 rounded-lg p-3">
                <div class="flex items-start justify-between mb-2">
                    <div class="flex-1">
                        <div class="flex items-center gap-2">
                            <span class="text-gray-500 font-mono text-xs">#${
                                plantilla.orden
                            }</span>
                            <h6 class="font-medium text-gray-800">${
                                plantilla.nombre
                            }</h6>
                            ${
                                plantilla.es_principal
                                    ? '<span class="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs">Principal</span>'
                                    : ""
                            }
                        </div>
                    </div>
                    <button onclick="quitarPlantilla(${plantilla.id})"
                        class="text-red-600 hover:text-red-800">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                <div class="grid grid-cols-2 gap-2 text-xs">
                    <div>
                        <label class="block text-gray-600 mb-1">Generación</label>
                        <select onchange="actualizarConfigPlantilla(${
                            plantilla.id
                        }, 'momento_generacion', this.value)"
                            class="w-full px-2 py-1 border border-gray-300 rounded text-xs">
                            <option value="al_aprobar" ${
                                plantilla.momento_generacion === "al_aprobar"
                                    ? "selected"
                                    : ""
                            }>Al Aprobar</option>
                            <option value="al_completar" ${
                                plantilla.momento_generacion === "al_completar"
                                    ? "selected"
                                    : ""
                            }>Al Completar</option>
                            <option value="manual" ${
                                plantilla.momento_generacion === "manual"
                                    ? "selected"
                                    : ""
                            }>Manual</option>
                        </select>
                    </div>
                    <div class="flex items-end">
                        <label class="flex items-center gap-1 cursor-pointer">
                            <input type="checkbox"
                                ${plantilla.generar_automatico ? "checked" : ""}
                                onchange="actualizarConfigPlantilla(${
                                    plantilla.id
                                }, 'generar_automatico', this.checked)"
                                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                            <span class="text-gray-700">Auto-generar</span>
                        </label>
                    </div>
                </div>
            </div>
        `;
        })
        .join("");

    container.innerHTML = plantillasHTML;
}

/**
 * Actualizar configuración de una plantilla
 */
function actualizarConfigPlantilla(plantillaId, campo, valor) {
    const plantilla = window.plantillasSeleccionadas.find(
        (p) => p.id === plantillaId
    );

    if (plantilla) {
        plantilla[campo] = valor;
    }
}

/**
 * Obtener label de tipo de documento
 */
function obtenerLabelTipoDocumento(tipo) {
    const labels = {
        certificado: "Certificado",
        concepto_tecnico: "Concepto Técnico",
        acta: "Acta",
        resolucion: "Resolución",
        oficio: "Oficio",
        otro: "Otro",
    };
    return labels[tipo] || tipo;
}

/**
 * Obtener color para tipo de documento
 */
function obtenerColorTipoDocumento(tipo) {
    const colores = {
        certificado: "bg-blue-100 text-blue-800",
        concepto_tecnico: "bg-green-100 text-green-800",
        acta: "bg-purple-100 text-purple-800",
        resolucion: "bg-orange-100 text-orange-800",
        oficio: "bg-yellow-100 text-yellow-800",
        otro: "bg-gray-100 text-gray-800",
    };
    return colores[tipo] || "bg-gray-100 text-gray-800";
}

/**
 * Ver vista previa de una plantilla
 */
async function verVistaPrevia(plantillaId) {
    try {
        // Buscar la plantilla en el array
        const plantilla = window.todasLasPlantillas.find(
            (p) => p.id === plantillaId
        );

        if (!plantilla) {
            mostrarToast("Plantilla no encontrada", "error");
            return;
        }

        // Parsear variables si están en JSON
        let variables = [];
        if (plantilla.variables_usadas) {
            try {
                variables =
                    typeof plantilla.variables_usadas === "string"
                        ? JSON.parse(plantilla.variables_usadas)
                        : plantilla.variables_usadas;
            } catch (e) {
                console.error("Error al parsear variables:", e);
            }
        }

        // Crear HTML de vista previa
        const variablesHTML =
            variables && variables.length > 0
                ? `<div class="mt-4">
                <h4 class="font-semibold text-gray-700 mb-2">Variables disponibles:</h4>
                <div class="flex flex-wrap gap-2">
                    ${variables
                        .map(
                            (v) => `
                        <span class="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-mono">${v}</span>
                    `
                        )
                        .join("")}
                </div>
            </div>`
                : '<p class="text-sm text-gray-500 mt-4">No hay variables configuradas</p>';

        const htmlContent =
            plantilla.contenido_html ||
            '<p class="text-gray-500">Sin contenido HTML</p>';
        const cssContent = plantilla.contenido_css || "";
        const encabezadoHTML = plantilla.encabezado_html || "";
        const pieHTML = plantilla.pie_pagina_html || "";

        Swal.fire({
            title: `Vista Previa: ${plantilla.nombre}`,
            width: "90%",
            html: `
                <div class="text-left">
                    <!-- Información de la plantilla -->
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <div class="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <span class="text-gray-600">Tipo:</span>
                                <span class="ml-2 font-medium">${obtenerLabelTipoDocumento(
                                    plantilla.tipo_documento
                                )}</span>
                            </div>
                            <div>
                                <span class="text-gray-600">Tamaño:</span>
                                <span class="ml-2 font-medium">${
                                    plantilla.tamano_pagina || "carta"
                                }</span>
                            </div>
                            <div>
                                <span class="text-gray-600">Orientación:</span>
                                <span class="ml-2 font-medium">${
                                    plantilla.orientacion || "vertical"
                                }</span>
                            </div>
                            <div>
                                <span class="text-gray-600">Variables:</span>
                                <span class="ml-2 font-medium">${
                                    plantilla.variables_usadas.length || 0
                                }</span>
                            </div>
                        </div>
                        ${
                            plantilla.descripcion
                                ? `<p class="text-sm text-gray-600 mt-2">${plantilla.descripcion}</p>`
                                : ""
                        }
                    </div>

                    ${variablesHTML}

                    <!-- Vista previa del documento -->
                    <div class="mt-6">
                        <h4 class="font-semibold text-gray-700 mb-3">Previsualización del Documento:</h4>
                        <div class="border border-gray-300 rounded-lg p-4 bg-white shadow-inner max-h-96 overflow-y-auto">
                            <style>${cssContent}</style>
                            ${encabezadoHTML}
                            ${htmlContent}
                            ${pieHTML}
                        </div>
                    </div>

                    <div class="mt-4 text-xs text-gray-500">
                        <strong>Nota:</strong> Esta es una vista previa con variables sin reemplazar.
                        El documento final mostrará los valores reales cuando se genere.
                    </div>
                </div>
            `,
            showCancelButton: false,
            confirmButtonText: "Cerrar",
            confirmButtonColor: "#2563eb",
            customClass: {
                popup: "swal-wide",
                htmlContainer: "swal-html-container-custom",
            },
        });
    } catch (error) {
        console.error("Error al mostrar vista previa:", error);
        mostrarToast("Error al cargar la vista previa", "error");
    }
}

// ========================================
// CONFIGURAR FORMULARIO - MODAL CONSTRUCTOR
// ========================================

let tipoIdConfigurando = null;
let camposFormulario = [];
let campoSeleccionado = null;
let contadorCampos = 0;

/**
 * Abrir modal para configurar formulario de un tipo
 */
async function abrirModalConfigurarFormulario(tipoId) {
    console.log("🎨 Abriendo configurador de formulario para tipo:", tipoId);

    tipoIdConfigurando = tipoId;
    camposFormulario = [];
    campoSeleccionado = null;

    // Mostrar modal
    const modal = document.getElementById("modalConfigurarFormulario");
    modal.classList.remove("hidden");

    // Cargar datos del tipo
    cargarDatosTipoParaFormulario(tipoId);

    // Inicializar drag and drop
    inicializarDragAndDrop();

    // IMPORTANTE: Esperar a que se carguen los campos existentes antes de continuar
    await cargarCamposExistentes(tipoId);

    console.log("🎨 Modal listo. Campos cargados:", camposFormulario.length);
}

/**
 * Cerrar modal de configuración
 * @param {boolean} forzarCierre - Si es true, cierra sin pedir confirmación
 */
function cerrarModalConfiguracion(forzarCierre = false) {
    if (camposFormulario.length > 0 && !forzarCierre) {
        Swal.fire({
            title: "¿Cerrar sin guardar?",
            text: "Tienes cambios sin guardar. ¿Estás seguro de que deseas cerrar?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#EF4444",
            cancelButtonColor: "#6B7280",
            confirmButtonText: "Sí, cerrar",
            cancelButtonText: "Cancelar",
        }).then((result) => {
            if (result.isConfirmed) {
                const modal = document.getElementById(
                    "modalConfigurarFormulario"
                );
                modal.classList.add("hidden");

                // Limpiar estado
                tipoIdConfigurando = null;
                camposFormulario = [];
                campoSeleccionado = null;
                limpiarFormularioConstructor();
            }
        });
        return;
    }

    const modal = document.getElementById("modalConfigurarFormulario");
    modal.classList.add("hidden");

    // Limpiar estado
    tipoIdConfigurando = null;
    camposFormulario = [];
    campoSeleccionado = null;
    limpiarFormularioConstructor();
}

/**
 * Cargar datos básicos del tipo para mostrar en el header
 */
async function cargarDatosTipoParaFormulario(tipoId) {
    try {
        const response = await fetch(`/admin/solicitudes/api/tipos/${tipoId}`);
        const data = await response.json();

        if (data.tipo) {
            document.getElementById("modal-tipo-nombre").textContent =
                data.tipo.nombre;
        }
    } catch (error) {
        console.error("Error al cargar datos del tipo:", error);
    }
}

/**
 * Cargar campos existentes del tipo (si los tiene)
 */
async function cargarCamposExistentes(tipoId) {
    try {
        const response = await fetch(`/admin/solicitudes/api/tipos/${tipoId}`);
        const data = await response.json();

        console.log("📥 Datos recibidos del backend:", data);
        console.log(
            "📥 Campos personalizados:",
            data.tipo?.campos_personalizados
        );

        if (
            data.tipo &&
            data.tipo.campos_personalizados &&
            data.tipo.campos_personalizados.length > 0
        ) {
            console.log(
                `📥 Cargando ${data.tipo.campos_personalizados.length} campos existentes...`
            );

            // Agregar campos existentes al constructor SIN renderizar cada vez
            data.tipo.campos_personalizados.forEach((campo, index) => {
                console.log(
                    `➕ [${index + 1}/${
                        data.tipo.campos_personalizados.length
                    }] Campo: "${campo.etiqueta}"`
                );
                console.log(
                    `   ↳ ID: ${campo.id}, Tipo: ${campo.tipo}, Categoria: ${campo.categoria}`
                );
                console.log(`   ↳ Slug: ${campo.slug}`);
                console.log(
                    `   ↳ tipo_origen directo: ${
                        campo.tipo_origen
                            ? `✅ "${campo.tipo_origen}"`
                            : "❌ NO"
                    }`
                );
                console.log(
                    `   ↳ pivot.tipo_origen: ${
                        campo.pivot?.tipo_origen
                            ? `✅ "${campo.pivot.tipo_origen}"`
                            : "❌ NO"
                    }`
                );

                // El tercer parámetro "true" evita renderizar en cada iteración
                agregarCampoAlFormulario(campo.tipo, campo, true);
            });

            console.log(
                "✅ Total de campos cargados en memoria:",
                camposFormulario.length
            );
            console.log(
                "✅ ESTRUCTURA COMPLETA de campos en memoria:",
                camposFormulario
            );

            // Renderizar UNA SOLA VEZ al final
            renderizarCamposFormulario();
            actualizarContador();
        } else {
            console.log(
                "ℹ️ No hay campos existentes para este tipo de solicitud"
            );
        }
    } catch (error) {
        console.error("❌ Error al cargar campos existentes:", error);
    }
}

/**
 * Inicializar funcionalidad de drag and drop
 */
// Variable para rastrear si ya se inicializó drag and drop
let dragAndDropInicializado = false;

// Funciones nombradas para poder removerlas
let handleDragOver, handleDragLeave, handleDrop;

function inicializarDragAndDrop() {
    const camposDisponibles = document.querySelectorAll(".campo-disponible");
    const areaFormulario = document.getElementById("area-formulario-drop");

    if (!areaFormulario) {
        console.warn("⚠️ Área de formulario no encontrada");
        return;
    }

    // Si ya fue inicializado, remover listeners anteriores del área de formulario
    if (dragAndDropInicializado) {
        console.log("🔄 Removiendo listeners anteriores de drag and drop");
        areaFormulario.removeEventListener("dragover", handleDragOver);
        areaFormulario.removeEventListener("dragleave", handleDragLeave);
        areaFormulario.removeEventListener("drop", handleDrop);
    }

    // Definir funciones de manejo de eventos
    handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
        areaFormulario.classList.add("drag-over");
    };

    handleDragLeave = () => {
        areaFormulario.classList.remove("drag-over");
    };

    handleDrop = (e) => {
        e.preventDefault();
        areaFormulario.classList.remove("drag-over");

        const tipoCampo = e.dataTransfer.getData("tipoCampo");
        if (tipoCampo) {
            console.log("📥 Campo soltado en formulario:", tipoCampo);
            agregarCampoAlFormulario(tipoCampo);
        }
    };

    // Drag start en campos disponibles (estos se recrean cada vez, no hay problema)
    camposDisponibles.forEach((campo) => {
        campo.addEventListener("dragstart", (e) => {
            e.dataTransfer.effectAllowed = "copy";
            e.dataTransfer.setData("tipoCampo", campo.dataset.tipo);
            campo.style.opacity = "0.5";
        });

        campo.addEventListener("dragend", (e) => {
            campo.style.opacity = "1";
        });
    });

    // Agregar listeners al área de formulario
    areaFormulario.addEventListener("dragover", handleDragOver);
    areaFormulario.addEventListener("dragleave", handleDragLeave);
    areaFormulario.addEventListener("drop", handleDrop);

    dragAndDropInicializado = true;
    console.log("✅ Drag and drop inicializado correctamente");
}

/**
 * Agregar un campo al formulario
 */
function agregarCampoAlFormulario(
    tipoCampo,
    datosExistentes = null,
    noRenderizar = false
) {
    contadorCampos++;

    // Determinar el tipo_origen del campo
    let tipoOrigen = "personalizado"; // Por defecto

    if (datosExistentes) {
        console.log(
            `🔍 Detectando tipo_origen para "${datosExistentes.etiqueta}":`,
            {
                tiene_tipo_origen: !!datosExistentes.tipo_origen,
                tipo_origen_valor: datosExistentes.tipo_origen,
                tiene_pivot_tipo_origen: !!(
                    datosExistentes.pivot && datosExistentes.pivot.tipo_origen
                ),
                pivot_tipo_origen_valor: datosExistentes.pivot?.tipo_origen,
                categoria: datosExistentes.categoria,
                slug: datosExistentes.slug,
            }
        );

        // PRIORIDAD 1: Si viene tipo_origen en el nivel principal (agregado por el backend desde pivot)
        if (datosExistentes.tipo_origen) {
            tipoOrigen = datosExistentes.tipo_origen;
            console.log(
                `✅ [PRIORIDAD 1] Campo "${datosExistentes.etiqueta}" tiene tipo_origen:`,
                tipoOrigen
            );
        }
        // PRIORIDAD 2: Si viene tipo_origen del pivot (fallback para compatibilidad)
        else if (datosExistentes.pivot && datosExistentes.pivot.tipo_origen) {
            tipoOrigen = datosExistentes.pivot.tipo_origen;
            console.log(
                `✅ [PRIORIDAD 2] Campo "${datosExistentes.etiqueta}" tiene tipo_origen en pivot:`,
                tipoOrigen
            );
        }
        // FALLBACK: Si no tiene tipo_origen, intentar detectarlo (casos legacy)
        else {
            const slugsPredefinidos = [
                "direccion_predio",
                "barrio_sector",
                "estrato",
                "uso_predio",
                "area_m2",
                "ubicacion_mapa",
                "observaciones",
            ];

            if (
                datosExistentes.slug &&
                slugsPredefinidos.includes(datosExistentes.slug)
            ) {
                tipoOrigen = "predefinido";
                console.log(
                    `⚠️ [FALLBACK] Campo "${datosExistentes.etiqueta}" detectado como PREDEFINIDO por slug`
                );
            } else if (
                datosExistentes.categoria &&
                datosExistentes.categoria !== "formulario_tipo_solicitud" &&
                datosExistentes.categoria !== null &&
                datosExistentes.categoria !== ""
            ) {
                tipoOrigen = "biblioteca";
                console.log(
                    `⚠️ [FALLBACK] Campo "${datosExistentes.etiqueta}" detectado como BIBLIOTECA por categoria:`,
                    datosExistentes.categoria
                );
            } else {
                console.log(
                    `⚠️ [FALLBACK] Campo "${datosExistentes.etiqueta}" detectado como PERSONALIZADO (default)`
                );
            }
        }
    }

    const campo = {
        // Si datosExistentes tiene id numérico, usarlo. Si no, generar ID temporal de texto
        id: datosExistentes?.id || `campo_${Date.now()}_${contadorCampos}`,
        tipo: datosExistentes?.tipo || tipoCampo,
        nombre: datosExistentes?.nombre || `campo_${contadorCampos}`,
        etiqueta:
            datosExistentes?.etiqueta || obtenerEtiquetaPorTipo(tipoCampo),
        orden: datosExistentes?.pivot?.orden || camposFormulario.length + 1,
        obligatorio: datosExistentes?.pivot?.obligatorio || false,
        configuracion: datosExistentes?.configuracion || {},
        configurado: !!datosExistentes,
        tipo_origen: tipoOrigen,
        slug: datosExistentes?.slug || null,
        categoria: datosExistentes?.categoria || null,
        // Para campos de biblioteca: campo_id puede venir de datosExistentes (wizard)
        // o ser null si es campo existente (en ese caso usamos id directamente)
        campo_id: datosExistentes?.campo_id || null,
    };

    console.log(`📝 Campo creado en memoria:`, {
        etiqueta: campo.etiqueta,
        id: campo.id,
        tipo_id: typeof campo.id,
        tipo_origen: campo.tipo_origen,
        campo_id: campo.campo_id,
    });

    camposFormulario.push(campo);

    // Solo renderizar si no se solicita lo contrario
    if (!noRenderizar) {
        renderizarCamposFormulario();
        actualizarContador();
    }

    // Ocultar placeholder si es el primer campo
    if (camposFormulario.length === 1) {
        const placeholder = document.getElementById(
            "placeholder-formulario-vacio"
        );
        if (placeholder) {
            placeholder.style.display = "none";
        }
    }

    // Auto-seleccionar el campo recién agregado para configurarlo
    if (!datosExistentes && !noRenderizar) {
        seleccionarCampo(campo.id);
    }

    return campo;
}

/**
 * Obtener etiqueta por defecto según tipo de campo
 */
function obtenerEtiquetaPorTipo(tipo) {
    const etiquetas = {
        texto_corto: "Texto Corto",
        texto_largo: "Texto Largo",
        email: "Correo Electrónico",
        telefono: "Teléfono",
        fecha: "Fecha",
        numero: "Número",
        moneda: "Valor en Pesos",
        checkbox: "Opción de Selección",
        radio: "Seleccione una Opción",
        select: "Lista Desplegable",
        archivo: "Adjuntar Archivo",
        imagen: "Adjuntar Imagen",
        direccion: "Dirección",
        ubicacion: "Ubicación en Mapa",
    };

    return etiquetas[tipo] || "Campo Personalizado";
}

/**
 * Obtener ícono según tipo de campo
 */
function obtenerIconoPorTipo(tipo) {
    const iconos = {
        texto_corto: "📝",
        texto_largo: "📄",
        email: "📧",
        telefono: "☎️",
        fecha: "📅",
        numero: "#️⃣",
        moneda: "💰",
        checkbox: "☑️",
        radio: "🔘",
        select: "📋",
        archivo: "📎",
        imagen: "🖼️",
        direccion: "📍",
        ubicacion: "🗺️",
    };

    return iconos[tipo] || "📌";
}

/**
 * Renderizar lista de campos en el formulario
 */
function renderizarCamposFormulario() {
    const lista = document.getElementById("formulario-campos-lista");
    lista.innerHTML = "";

    // Ordenar por campo.orden
    camposFormulario.sort((a, b) => a.orden - b.orden);

    camposFormulario.forEach((campo, index) => {
        const div = document.createElement("div");
        div.className = `campo-formulario-item ${
            campoSeleccionado === campo.id ? "selected" : ""
        }`;
        div.dataset.campoId = campo.id;
        div.draggable = true;

        div.innerHTML = `
            <div class="flex items-start gap-3">
                <!-- Drag handle -->
                <div class="drag-handle pt-1">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path>
                    </svg>
                </div>

                <!-- Contenido del campo -->
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                        <span class="text-xl">${obtenerIconoPorTipo(
                            campo.tipo
                        )}</span>
                        <span class="font-semibold text-gray-900">${
                            campo.etiqueta
                        }</span>
                        ${
                            campo.obligatorio
                                ? '<span class="text-red-500">*</span>'
                                : ""
                        }
                    </div>
                    <div class="text-sm text-gray-500">
                        Tipo: <span class="font-medium">${campo.tipo}</span> •
                        Nombre: <span class="font-mono text-xs bg-gray-100 px-1 rounded">${
                            campo.nombre
                        }</span>
                    </div>
                    <div class="mt-2">
                        ${
                            campo.configurado
                                ? '<span class="badge-configurado">✓ Configurado</span>'
                                : '<span class="badge-sin-configurar">⚠️ Sin configurar</span>'
                        }
                    </div>
                </div>

                <!-- Botones de acción -->
                <div class="flex flex-col gap-1">
                    <button onclick="seleccionarCampo('${
                        campo.id
                    }')" class="btn-config p-2 text-blue-600 hover:bg-blue-50 rounded" title="Configurar">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                    </button>
                    <button onclick="duplicarCampo('${
                        campo.id
                    }')" class="btn-duplicate p-2 text-gray-600 hover:bg-gray-50 rounded" title="Duplicar">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                        </svg>
                    </button>
                    <button onclick="eliminarCampo('${
                        campo.id
                    }')" class="btn-delete p-2 text-red-600 hover:bg-red-50 rounded" title="Eliminar">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `;

        // Agregar eventos de drag para reordenar
        div.addEventListener("dragstart", (e) => {
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("campoId", campo.id);
            div.classList.add("dragging");
        });

        div.addEventListener("dragend", () => {
            div.classList.remove("dragging");
        });

        div.addEventListener("dragover", (e) => {
            e.preventDefault();
            const dragging = document.querySelector(".dragging");
            if (dragging && dragging !== div) {
                const rect = div.getBoundingClientRect();
                const midY = rect.top + rect.height / 2;
                if (e.clientY < midY) {
                    div.parentNode.insertBefore(dragging, div);
                } else {
                    div.parentNode.insertBefore(dragging, div.nextSibling);
                }
            }
        });

        div.addEventListener("drop", () => {
            actualizarOrdenCampos();
        });

        lista.appendChild(div);
    });
}

/**
 * Actualizar orden de los campos después de reordenar
 */
function actualizarOrdenCampos() {
    const items = document.querySelectorAll(".campo-formulario-item");
    items.forEach((item, index) => {
        const campoId = item.dataset.campoId;
        const campo = camposFormulario.find((c) => c.id === campoId);
        if (campo) {
            campo.orden = index + 1;
        }
    });
}

/**
 * Actualizar contador de campos
 */
function actualizarContador() {
    const total = camposFormulario.length;
    const configurados = camposFormulario.filter((c) => c.configurado).length;
    const sinConfigurar = total - configurados;

    document.getElementById("modal-campos-contador").textContent = configurados;

    const badgeSinConfigurar = document.getElementById(
        "modal-campos-sin-configurar"
    );
    if (sinConfigurar > 0) {
        badgeSinConfigurar.style.display = "inline-flex";
        badgeSinConfigurar.textContent = `⚠️ ${sinConfigurar} campo(s) sin configurar`;
    } else {
        badgeSinConfigurar.style.display = "none";
    }
}

/**
 * Seleccionar un campo para configurarlo
 */
function seleccionarCampo(campoId) {
    campoSeleccionado = campoId;
    const campo = camposFormulario.find((c) => c.id === campoId);

    if (!campo) return;

    // Re-renderizar para marcar el campo seleccionado
    renderizarCamposFormulario();

    // Mostrar panel de configuración
    mostrarPanelConfiguracion(campo);

    // Scroll al panel de configuración en móvil
    document
        .getElementById("panel-config-campo")
        .scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/**
 * Duplicar un campo
 */
function duplicarCampo(campoId) {
    const campo = camposFormulario.find((c) => c.id === campoId);
    if (!campo) return;

    contadorCampos++;

    const campoDuplicado = {
        ...campo,
        id: `campo_${Date.now()}_${contadorCampos}`,
        nombre: `${campo.nombre}_copia`,
        orden: camposFormulario.length + 1,
        configurado: true, // Ya está configurado porque se copia la config
    };

    camposFormulario.push(campoDuplicado);
    renderizarCamposFormulario();
    actualizarContador();

    mostrarToast(`Campo "${campo.etiqueta}" duplicado`, "success");
}

/**
 * Eliminar un campo
 */
function eliminarCampo(campoId) {
    const campo = camposFormulario.find((c) => c.id === campoId);
    if (!campo) return;

    if (!confirm(`¿Eliminar el campo "${campo.etiqueta}"?`)) {
        return;
    }

    camposFormulario = camposFormulario.filter((c) => c.id !== campoId);
    renderizarCamposFormulario();
    actualizarContador();

    // Si se eliminó el campo seleccionado, limpiar panel
    if (campoSeleccionado === campoId) {
        campoSeleccionado = null;
        ocultarPanelConfiguracion();
    }

    // Si no quedan campos, mostrar placeholder
    if (camposFormulario.length === 0) {
        document.getElementById("placeholder-formulario-vacio").style.display =
            "block";
    }

    mostrarToast(`Campo "${campo.etiqueta}" eliminado`, "success");
}

/**
 * Limpiar todo el formulario
 */
function limpiarFormulario() {
    if (camposFormulario.length === 0) return;

    if (!confirm("¿Deseas eliminar todos los campos del formulario?")) {
        return;
    }

    camposFormulario = [];
    campoSeleccionado = null;
    limpiarFormularioConstructor();
    mostrarToast("Formulario limpiado", "info");
}

/**
 * Limpiar constructor visualmente
 */
function limpiarFormularioConstructor() {
    document.getElementById("formulario-campos-lista").innerHTML = "";
    document.getElementById("placeholder-formulario-vacio").style.display =
        "block";
    ocultarPanelConfiguracion();
    actualizarContador();
}

/**
 * Mostrar panel de configuración para un campo
 */
function mostrarPanelConfiguracion(campo) {
    document.getElementById("config-campo-vacia").style.display = "none";
    const contenido = document.getElementById("config-campo-contenido");
    contenido.style.display = "block";

    // Generar formulario de configuración según el tipo de campo
    contenido.innerHTML = generarFormularioConfiguracion(campo);

    // Cargar valores existentes si el campo ya está configurado
    if (campo.configurado) {
        cargarValoresConfiguracion(campo);
    }
}

/**
 * Ocultar panel de configuración
 */
function ocultarPanelConfiguracion() {
    document.getElementById("config-campo-vacia").style.display = "block";
    document.getElementById("config-campo-contenido").style.display = "none";
}

/**
 * Generar formulario de configuración según tipo de campo
 */
function generarFormularioConfiguracion(campo) {
    const configuracionComun = `
        <h3 class="text-lg font-semibold text-gray-900 mb-4">
            ${obtenerIconoPorTipo(campo.tipo)} Configurar Campo
        </h3>

        <!-- Nombre interno -->
        <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
                Nombre interno (slug)
                <span class="text-red-500">*</span>
            </label>
            <input type="text" id="config_nombre" value="${campo.nombre}"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="ej: direccion_predio">
            <p class="text-xs text-gray-500 mt-1">Sin espacios ni caracteres especiales</p>
        </div>

        <!-- Etiqueta -->
        <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
                Etiqueta visible
                <span class="text-red-500">*</span>
            </label>
            <input type="text" id="config_etiqueta" value="${campo.etiqueta}"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="ej: Dirección del Predio">
        </div>

        <!-- Campo obligatorio -->
        <div class="mb-4">
            <label class="flex items-center cursor-pointer">
                <input type="checkbox" id="config_obligatorio" ${
                    campo.obligatorio ? "checked" : ""
                }
                    class="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                <span class="text-sm font-medium text-gray-700">Campo obligatorio</span>
            </label>
        </div>

        <!-- Texto de ayuda -->
        <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
                Texto de ayuda (opcional)
            </label>
            <textarea id="config_ayuda" rows="2"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Texto explicativo para el usuario">${
                    campo.configuracion.ayuda || ""
                }</textarea>
        </div>
    `;

    // Configuración específica según tipo
    let configuracionEspecifica = "";

    switch (campo.tipo) {
        case "texto_corto":
        case "email":
        case "telefono":
            configuracionEspecifica = `
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Placeholder</label>
                    <input type="text" id="config_placeholder" value="${
                        campo.configuracion.placeholder || ""
                    }"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="Ej: Ingrese su dirección">
                </div>
                <div class="grid grid-cols-2 gap-2 mb-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Long. mínima</label>
                        <input type="number" id="config_min_length" value="${
                            campo.configuracion.min_length || ""
                        }"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="0">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Long. máxima</label>
                        <input type="number" id="config_max_length" value="${
                            campo.configuracion.max_length || ""
                        }"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="255">
                    </div>
                </div>
            `;
            break;

        case "texto_largo":
            configuracionEspecifica = `
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Placeholder</label>
                    <input type="text" id="config_placeholder" value="${
                        campo.configuracion.placeholder || ""
                    }"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                </div>
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Filas visibles</label>
                    <input type="number" id="config_rows" value="${
                        campo.configuracion.rows || 4
                    }"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" min="2" max="10">
                </div>
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Long. máxima</label>
                    <input type="number" id="config_max_length" value="${
                        campo.configuracion.max_length || 500
                    }"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                </div>
            `;
            break;

        case "numero":
        case "moneda":
            configuracionEspecifica = `
                <div class="grid grid-cols-2 gap-2 mb-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Valor mínimo</label>
                        <input type="number" id="config_min_value" value="${
                            campo.configuracion.min_value || ""
                        }"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Valor máximo</label>
                        <input type="number" id="config_max_value" value="${
                            campo.configuracion.max_value || ""
                        }"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    </div>
                </div>
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Valor por defecto</label>
                    <input type="number" id="config_default_value" value="${
                        campo.configuracion.default_value || ""
                    }"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                </div>
                ${
                    campo.tipo === "moneda"
                        ? `
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Moneda</label>
                    <select id="config_currency" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                        <option value="COP" ${
                            campo.configuracion.currency === "COP"
                                ? "selected"
                                : ""
                        }>COP - Peso Colombiano</option>
                        <option value="USD" ${
                            campo.configuracion.currency === "USD"
                                ? "selected"
                                : ""
                        }>USD - Dólar</option>
                        <option value="EUR" ${
                            campo.configuracion.currency === "EUR"
                                ? "selected"
                                : ""
                        }>EUR - Euro</option>
                    </select>
                </div>
                `
                        : ""
                }
            `;
            break;

        case "select":
        case "radio":
        case "checkbox":
            const opciones = campo.configuracion.opciones || [];
            configuracionEspecifica = `
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Opciones
                        <span class="text-red-500">*</span>
                    </label>
                    <div id="opciones-container" class="space-y-2 mb-2">
                        ${opciones
                            .map(
                                (opcion, index) => `
                            <div class="opcion-item">
                                <input type="text" class="opcion-valor" value="${opcion.valor}" placeholder="Valor">
                                <input type="text" class="opcion-etiqueta" value="${opcion.etiqueta}" placeholder="Etiqueta">
                                <button type="button" onclick="eliminarOpcion(this)">✕</button>
                            </div>
                        `
                            )
                            .join("")}
                    </div>
                    <button type="button" onclick="agregarOpcion()" class="btn-agregar-opcion">
                        + Agregar Opción
                    </button>
                </div>
                ${
                    campo.tipo === "select"
                        ? `
                <div class="mb-4">
                    <label class="flex items-center cursor-pointer">
                        <input type="checkbox" id="config_multiple" ${
                            campo.configuracion.multiple ? "checked" : ""
                        }
                            class="mr-2 h-4 w-4 text-blue-600">
                        <span class="text-sm font-medium text-gray-700">Permitir selección múltiple</span>
                    </label>
                </div>
                `
                        : ""
                }
            `;
            break;

        case "archivo":
        case "imagen":
            configuracionEspecifica = `
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Tamaño máximo (MB)</label>
                    <input type="number" id="config_max_size" value="${
                        campo.configuracion.max_size || 10
                    }"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" min="1" max="100">
                </div>
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Tipos permitidos</label>
                    <input type="text" id="config_allowed_types" value="${
                        campo.configuracion.allowed_types ||
                        (campo.tipo === "imagen"
                            ? ".jpg,.png,.gif,.webp"
                            : ".pdf,.doc,.docx")
                    }"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder=".pdf,.doc,.xlsx">
                </div>
                <div class="mb-4">
                    <label class="flex items-center cursor-pointer">
                        <input type="checkbox" id="config_multiple_files" ${
                            campo.configuracion.multiple_files ? "checked" : ""
                        }
                            class="mr-2 h-4 w-4 text-blue-600">
                        <span class="text-sm font-medium text-gray-700">Permitir múltiples archivos</span>
                    </label>
                </div>
            `;
            break;

        case "fecha":
            configuracionEspecifica = `
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Fecha mínima</label>
                    <input type="date" id="config_min_date" value="${
                        campo.configuracion.min_date || ""
                    }"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                </div>
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Fecha máxima</label>
                    <input type="date" id="config_max_date" value="${
                        campo.configuracion.max_date || ""
                    }"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                </div>
            `;
            break;

        case "ubicacion":
            configuracionEspecifica = `
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Tipo de geometría</label>
                    <select id="config_geometry_type" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                        <option value="point" ${
                            campo.configuracion.geometry_type === "point"
                                ? "selected"
                                : ""
                        }>Punto</option>
                        <option value="polygon" ${
                            campo.configuracion.geometry_type === "polygon"
                                ? "selected"
                                : ""
                        }>Polígono</option>
                        <option value="line" ${
                            campo.configuracion.geometry_type === "line"
                                ? "selected"
                                : ""
                        }>Línea</option>
                    </select>
                </div>
                <div class="mb-4">
                    <label class="flex items-center cursor-pointer">
                        <input type="checkbox" id="config_search_enabled" ${
                            campo.configuracion.search_enabled !== false
                                ? "checked"
                                : ""
                        }
                            class="mr-2 h-4 w-4 text-blue-600">
                        <span class="text-sm font-medium text-gray-700">Habilitar búsqueda de dirección</span>
                    </label>
                </div>
            `;
            break;
    }

    return `
        ${configuracionComun}
        ${configuracionEspecifica}

        <!-- Botón guardar -->
        <div class="mt-6 pt-4 border-t border-gray-200">
            <button type="button" onclick="guardarConfiguracionCampo()"
                class="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold">
                ✓ Guardar Configuración
            </button>
        </div>
    `;
}

/**
 * Cargar valores de configuración existentes (no hace nada, los valores ya vienen en el HTML)
 */
function cargarValoresConfiguracion(campo) {
    // Los valores ya están cargados en el HTML generado
    // Esta función está disponible por si se necesita lógica adicional
}

/**
 * Agregar una opción (para select, radio, checkbox)
 */
function agregarOpcion() {
    const container = document.getElementById("opciones-container");
    if (!container) return;

    const div = document.createElement("div");
    div.className = "opcion-item";
    div.innerHTML = `
        <input type="text" class="opcion-valor" placeholder="Valor">
        <input type="text" class="opcion-etiqueta" placeholder="Etiqueta">
        <button type="button" onclick="eliminarOpcion(this)">✕</button>
    `;
    container.appendChild(div);
}

/**
 * Eliminar una opción
 */
function eliminarOpcion(btn) {
    btn.parentElement.remove();
}

/**
 * Guardar configuración del campo seleccionado
 */
function guardarConfiguracionCampo() {
    if (!campoSeleccionado) return;

    const campo = camposFormulario.find((c) => c.id === campoSeleccionado);
    if (!campo) return;

    // Obtener valores comunes
    const nombre = document.getElementById("config_nombre")?.value.trim();
    const etiqueta = document.getElementById("config_etiqueta")?.value.trim();
    const obligatorio =
        document.getElementById("config_obligatorio")?.checked || false;
    const ayuda = document.getElementById("config_ayuda")?.value.trim();

    // Validar campos obligatorios
    if (!nombre || !etiqueta) {
        mostrarToast("El nombre y etiqueta son obligatorios", "error");
        return;
    }

    // Actualizar datos básicos
    campo.nombre = nombre;
    campo.etiqueta = etiqueta;
    campo.obligatorio = obligatorio;
    campo.configuracion.ayuda = ayuda;

    // Obtener configuración específica según tipo
    switch (campo.tipo) {
        case "texto_corto":
        case "email":
        case "telefono":
            campo.configuracion.placeholder = document
                .getElementById("config_placeholder")
                ?.value.trim();
            campo.configuracion.min_length =
                parseInt(document.getElementById("config_min_length")?.value) ||
                null;
            campo.configuracion.max_length =
                parseInt(document.getElementById("config_max_length")?.value) ||
                null;
            break;

        case "texto_largo":
            campo.configuracion.placeholder = document
                .getElementById("config_placeholder")
                ?.value.trim();
            campo.configuracion.rows =
                parseInt(document.getElementById("config_rows")?.value) || 4;
            campo.configuracion.max_length =
                parseInt(document.getElementById("config_max_length")?.value) ||
                500;
            break;

        case "numero":
        case "moneda":
            campo.configuracion.min_value =
                parseFloat(
                    document.getElementById("config_min_value")?.value
                ) || null;
            campo.configuracion.max_value =
                parseFloat(
                    document.getElementById("config_max_value")?.value
                ) || null;
            campo.configuracion.default_value =
                parseFloat(
                    document.getElementById("config_default_value")?.value
                ) || null;
            if (campo.tipo === "moneda") {
                campo.configuracion.currency =
                    document.getElementById("config_currency")?.value || "COP";
            }
            break;

        case "select":
        case "radio":
        case "checkbox":
            // Obtener opciones
            const opciones = [];
            document
                .querySelectorAll("#opciones-container .opcion-item")
                .forEach((item) => {
                    const valor = item
                        .querySelector(".opcion-valor")
                        ?.value.trim();
                    const etiqueta = item
                        .querySelector(".opcion-etiqueta")
                        ?.value.trim();
                    if (valor && etiqueta) {
                        opciones.push({ valor, etiqueta });
                    }
                });

            if (opciones.length === 0) {
                mostrarToast("Debes agregar al menos una opción", "error");
                return;
            }

            campo.configuracion.opciones = opciones;

            if (campo.tipo === "select") {
                campo.configuracion.multiple =
                    document.getElementById("config_multiple")?.checked ||
                    false;
            }
            break;

        case "archivo":
        case "imagen":
            campo.configuracion.max_size =
                parseInt(document.getElementById("config_max_size")?.value) ||
                10;
            campo.configuracion.allowed_types = document
                .getElementById("config_allowed_types")
                ?.value.trim();
            campo.configuracion.multiple_files =
                document.getElementById("config_multiple_files")?.checked ||
                false;
            break;

        case "fecha":
            campo.configuracion.min_date =
                document.getElementById("config_min_date")?.value;
            campo.configuracion.max_date =
                document.getElementById("config_max_date")?.value;
            break;

        case "ubicacion":
            campo.configuracion.geometry_type =
                document.getElementById("config_geometry_type")?.value ||
                "point";
            campo.configuracion.search_enabled =
                document.getElementById("config_search_enabled")?.checked !==
                false;
            break;
    }

    // Marcar como configurado
    campo.configurado = true;

    // Re-renderizar y actualizar
    renderizarCamposFormulario();
    actualizarContador();
    mostrarToast(`Campo "${campo.etiqueta}" configurado`, "success");
}

/**
 * Guardar configuración completa del formulario en el backend
 */
async function guardarConfiguracionFormulario() {
    if (camposFormulario.length === 0) {
        mostrarToast("Agrega al menos un campo al formulario", "error");
        return;
    }

    // Verificar que todos los campos estén configurados
    const sinConfigurar = camposFormulario.filter((c) => !c.configurado);
    if (sinConfigurar.length > 0) {
        const result = await Swal.fire({
            title: "Campos sin configurar",
            text: `Hay ${sinConfigurar.length} campo(s) sin configurar. ¿Deseas guardar de todas formas?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3B82F6",
            cancelButtonColor: "#6B7280",
            confirmButtonText: "Sí, guardar",
            cancelButtonText: "Cancelar",
        });

        if (!result.isConfirmed) {
            console.log("❌ Usuario canceló el guardado");
            return;
        }

        console.log("✅ Usuario confirmó guardar con campos sin configurar");
    }

    try {
        console.log(
            "🔍 ANTES DE GUARDAR - camposFormulario en memoria:",
            camposFormulario
        );
        console.log(
            "🔍 ANTES DE GUARDAR - Total de campos:",
            camposFormulario.length
        );

        // Mostrar todos los campos en memoria antes de clasificar
        console.log("📦 TODOS los campos en memoria:", camposFormulario);
        console.log(
            "📦 RESUMEN campos:",
            camposFormulario.map((c) => ({
                id: c.id,
                etiqueta: c.etiqueta,
                tipo_origen: c.tipo_origen,
                slug: c.slug,
                categoria: c.categoria,
                campo_id: c.campo_id,
            }))
        );

        // Separar campos por tipo_origen
        const camposPredefinidos = camposFormulario
            .filter((c) => {
                const esPredefinido = c.tipo_origen === "predefinido";
                if (esPredefinido) {
                    console.log(
                        `📋 PREDEFINIDO: "${c.etiqueta}" (slug: ${c.slug})`
                    );
                }
                return esPredefinido;
            })
            .map((c) => c.slug);

        const camposPersonalizados = camposFormulario
            .filter((c) => {
                const esPersonalizado = c.tipo_origen === "personalizado";
                if (esPersonalizado) {
                    console.log(
                        `✏️ PERSONALIZADO: "${c.etiqueta}" (id: ${c.id}, categoria: ${c.categoria})`
                    );
                }
                return esPersonalizado;
            })
            .map((c) => ({
                tipo: c.tipo,
                nombre: c.nombre,
                etiqueta: c.etiqueta,
                orden: c.orden,
                obligatorio: c.obligatorio,
                configuracion: c.configuracion,
                // Si tiene ID numérico, incluirlo para actualizar el campo existente
                ...(c.id && typeof c.id === "number" ? { id: c.id } : {}),
            }));

        console.log("🔍 Filtrando campos de biblioteca...");
        const camposBibliotecaFiltrados = camposFormulario.filter((c) => {
            const esBiblioteca = c.tipo_origen === "biblioteca";
            console.log(
                `   Evaluando "${c.etiqueta}": tipo_origen="${c.tipo_origen}", es biblioteca? ${esBiblioteca}`
            );
            if (esBiblioteca) {
                console.log(`   ✅ ES BIBLIOTECA: "${c.etiqueta}"`, {
                    campo_id: c.campo_id,
                    id: c.id,
                    tipo_id: typeof c.id,
                    categoria: c.categoria,
                });
            }
            return esBiblioteca;
        });

        console.log(
            "📚 Campos de biblioteca filtrados:",
            camposBibliotecaFiltrados
        );

        const camposBiblioteca = camposBibliotecaFiltrados
            .map((c) => {
                // Para campos de biblioteca, usar campo_id si existe (nuevo del wizard),
                // o id si es numérico (existente de BD)
                const resultado =
                    c.campo_id || (typeof c.id === "number" ? c.id : null);
                console.log(
                    `   → Mapeando "${c.etiqueta}": campo_id=${
                        c.campo_id
                    }, id=${
                        c.id
                    }, tipo_id=${typeof c.id}, resultado=${resultado}`
                );
                return resultado;
            })
            .filter((id) => id !== null && id !== undefined); // Eliminar nulls y undefined

        console.log("📋 RESUMEN - Predefinidos:", camposPredefinidos);
        console.log("✏️ RESUMEN - Personalizados:", camposPersonalizados);
        console.log("📚 RESUMEN - Biblioteca:", camposBiblioteca);

        const datosEnviar = {
            campos_predefinidos: camposPredefinidos,
            campos_personalizados: camposPersonalizados,
            campos_biblioteca: camposBiblioteca,
        };

        console.log("💾 DATOS A ENVIAR AL BACKEND:", datosEnviar);
        console.log("💾 Total de campos a enviar:", camposFormulario.length);

        const response = await fetch(
            `/admin/solicitudes/api/tipos/${tipoIdConfigurando}/campos-rapidos`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": document.querySelector(
                        'meta[name="csrf-token"]'
                    ).content,
                },
                body: JSON.stringify(datosEnviar),
            }
        );

        const data = await response.json();

        if (response.ok && data.success) {
            mostrarToast(
                `✓ Formulario guardado exitosamente (${camposFormulario.length} campos)`,
                "success"
            );

            // Cerrar modal después de guardar (sin pedir confirmación)
            setTimeout(() => {
                cerrarModalConfiguracion(true); // true = forzar cierre sin confirmación
                cargarTiposSolicitud(); // Recargar la lista
            }, 1500);
        } else {
            throw new Error(data.message || "Error al guardar");
        }
    } catch (error) {
        console.error("Error al guardar configuración:", error);
        mostrarToast(
            "Error al guardar la configuración del formulario",
            "error"
        );
    }
}

/**
 * Vista previa del formulario
 */
function vistaPreviaFormulario() {
    if (camposFormulario.length === 0) {
        mostrarToast("No hay campos para previsualizar", "info");
        return;
    }

    console.log(
        "📋 Mostrando vista previa del formulario (modalConfigurarFormulario)"
    );
    console.log("📝 Campos del formulario:", camposFormulario);

    // Obtener nombre del tipo (desde el modal o datos temporales)
    const nombreTipo =
        document.getElementById("modal-tipo-nombre")?.textContent ||
        "Tipo de Solicitud";

    // Generar HTML del preview con el nuevo formato
    let htmlPreview = `
        <div class="text-left">
            <!-- Encabezado del formulario -->
            <div class="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-lg mb-6">
                <h3 class="text-xl font-bold mb-2">${nombreTipo}</h3>
                <p class="text-green-100 text-sm">Complete el siguiente formulario con la información solicitada</p>
            </div>

            <div class="bg-white space-y-6">
                <!-- Sección: Datos del Solicitante -->
                <div class="border-b pb-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <svg class="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                        Datos del Solicitante
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de Documento</label>
                            <select disabled class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                                <option>Cédula de Ciudadanía</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Número de Documento</label>
                            <input type="text" value="1234567890" disabled class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Nombres</label>
                            <input type="text" value="Juan Carlos" disabled class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
                            <input type="text" value="Pérez González" disabled class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                            <input type="email" value="juan.perez@example.com" disabled class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                            <input type="tel" value="300 123 4567" disabled class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                        </div>
                    </div>
                </div>

                <!-- Sección: Información Específica -->
                <div>
                    <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <svg class="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        Información de la Solicitud
                    </h3>
                    <div class="grid grid-cols-1 gap-4">
                        ${generarCamposPersonalizadosPreviewDesdeFormulario()}
                    </div>
                </div>

                <!-- Botones de acción (simulados) -->
                <div class="flex justify-between items-center pt-6 border-t">
                    <button type="button" disabled class="px-6 py-2 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed">
                        Cancelar
                    </button>
                    <button type="button" disabled class="px-6 py-2 bg-blue-600 text-white rounded-lg cursor-not-allowed flex items-center">
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        Enviar Solicitud
                    </button>
                </div>

                <!-- Nota informativa -->
                <div class="bg-blue-50 border-l-4 border-blue-500 p-4 mt-4">
                    <p class="text-sm text-blue-700">
                        <strong>Nota:</strong> Esta es una vista previa del formulario. Los campos mostrados son solo de ejemplo y no se puede interactuar con ellos.
                    </p>
                </div>
            </div>
        </div>
    `;

    // Mostrar en modal HTML personalizado
    const modalVistaPrevia = document.getElementById(
        "modalVistaPreviaFormulario"
    );
    const contenidoVistaPrevia = document.getElementById(
        "contenidoVistaPrevia"
    );

    if (modalVistaPrevia && contenidoVistaPrevia) {
        contenidoVistaPrevia.innerHTML = htmlPreview;
        modalVistaPrevia.classList.remove("hidden");
        console.log("✅ Modal de vista previa abierto correctamente");
    } else {
        console.error("❌ No se encontró el modal de vista previa");
        mostrarToast("Error al abrir vista previa", "error");
    }
}

/**
 * Generar HTML de los campos personalizados desde camposFormulario
 */
function generarCamposPersonalizadosPreviewDesdeFormulario() {
    let html = "";

    camposFormulario.forEach((campo, index) => {
        const obligatorio = campo.obligatorio || false;
        const requiredMark = obligatorio
            ? '<span class="text-red-500 ml-1">*</span>'
            : "";
        const etiqueta = campo.etiqueta || campo.nombre || `Campo ${index + 1}`;
        const tipo = campo.tipo || "text";
        const ayuda = campo.configuracion?.ayuda
            ? `<p class="text-xs text-gray-500 mt-1">${campo.configuracion.ayuda}</p>`
            : "";

        html += "<div>";
        html += `<label class="block text-sm font-medium text-gray-700 mb-1">${obtenerIconoPorTipo(
            tipo
        )} ${etiqueta}${requiredMark}</label>`;

        switch (tipo) {
            case "texto_corto":
            case "email":
            case "telefono":
                html += `<input type="text" placeholder="${
                    campo.configuracion?.placeholder || ""
                }" disabled class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">`;
                break;

            case "texto_largo":
                html += `<textarea rows="${
                    campo.configuracion?.rows || 4
                }" placeholder="${
                    campo.configuracion?.placeholder || ""
                }" disabled class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"></textarea>`;
                break;

            case "numero":
            case "moneda":
                html += `<input type="number" disabled class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">`;
                break;

            case "fecha":
                html += `<input type="date" disabled class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">`;
                break;

            case "select":
                html +=
                    '<select disabled class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"><option>Seleccione...</option>';
                (campo.configuracion?.opciones || []).forEach((opcion) => {
                    html += `<option>${
                        opcion.etiqueta || opcion.valor || opcion
                    }</option>`;
                });
                html += "</select>";
                break;

            case "radio":
                html += '<div class="space-y-2">';
                (campo.configuracion?.opciones || []).forEach((opcion, i) => {
                    html += `<label class="flex items-center">
                        <input type="radio" name="${
                            campo.nombre
                        }" disabled class="mr-2">
                        <span class="text-sm">${
                            opcion.etiqueta || opcion.valor || opcion
                        }</span>
                    </label>`;
                });
                html += "</div>";
                break;

            case "checkbox":
                html += '<div class="space-y-2">';
                (campo.configuracion?.opciones || []).forEach((opcion, i) => {
                    html += `<label class="flex items-center">
                        <input type="checkbox" disabled class="mr-2">
                        <span class="text-sm">${
                            opcion.etiqueta || opcion.valor || opcion
                        }</span>
                    </label>`;
                });
                html += "</div>";
                break;

            case "archivo":
            case "imagen":
                html += `<input type="file" disabled class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700" ${
                    campo.configuracion?.multiple_files ? "multiple" : ""
                }>`;
                html += `<p class="text-xs text-gray-500 mt-1">Máx: ${
                    campo.configuracion?.max_size || 10
                }MB. Tipos: ${
                    campo.configuracion?.allowed_types || "Todos"
                }</p>`;
                break;

            case "direccion":
                html += `<input type="text" placeholder="Dirección completa" disabled class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">`;
                break;

            case "ubicacion":
                html +=
                    '<div class="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">🗺️ Mapa Interactivo</div>';
                break;

            default:
                html += `<input type="text" disabled class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">`;
        }

        html += ayuda;
        html += "</div>";
    });

    return html;
}
