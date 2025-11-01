<x-app-layout>
    <x-slot name="title">Tipos de Solicitud</x-slot>

    @push('styles')
    <link rel="stylesheet" href="{{ asset('css/admin/tipos-solicitud.css') }}?v={{ time() }}">
    @endpush  

    <div class="container mx-auto">
        <!-- Header -->
        <div class="mb-6">
            <!-- Breadcrumb -->
            <nav class="flex mb-4" aria-label="Breadcrumb">
                <ol class="inline-flex items-center space-x-1 md:space-x-3">
                    <li class="inline-flex items-center">
                        <a href="{{ route('dashboard') }}" class="text-gray-700 hover:text-blue-600">
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                            </svg>
                        </a>
                    </li>
                    <li>
                        <div class="flex items-center">
                            <svg class="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path>
                            </svg>
                            <span class="text-gray-500">Administración</span>
                        </div>
                    </li>
                    <li aria-current="page">
                        <div class="flex items-center">
                            <svg class="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path>
                            </svg>
                            <span class="text-gray-700 font-medium">Tipos de Solicitud</span>
                        </div>
                    </li>
                </ol>
            </nav>

            <!-- Título y Acciones -->
            <div class="flex justify-between items-start">
                <div>
                    <h1 class="text-2xl font-bold text-gray-800">Tipos de Solicitud</h1>
                    <p class="text-gray-600 text-sm mt-1">Configurar y gestionar tipos de solicitudes del sistema</p>
                </div>
                <div class="flex gap-2">
                    @can('tipos_solicitud.crear')
                    <button onclick="abrirModalNuevoTipo()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                        </svg>
                        Nuevo Tipo
                    </button>
                    @endcan
                </div>
            </div>
        </div>

        <!-- Herramientas
        <div class="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div class="flex flex-wrap gap-2">
                <button onclick="abrirModalGestionarEstados()" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                    </svg>
                    Gestionar Estados
                </button>
                <button class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Validar Configuración
                </button>
            
            </div>
        </div>-->

        <!-- Filtros -->
        <div class="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <!-- Búsqueda -->
                <div class="relative">
                    <input type="text" id="searchInput" placeholder="Buscar tipo..." 
                        class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <svg class="absolute left-3 top-3 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                </div> 

                <!-- Categoría -->
                <select id="filterCategoria" class="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500">
                    <option value="">Todas las categorías</option>
                </select>

                <!-- Estado -->
                <select id="filterEstado" class="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500">
                    <option value="">Todos los estados</option>
                    <option value="activos">Activos</option>
                    <option value="inactivos">Inactivos</option>
                </select>

                <!-- Área -->
                <select id="filterArea" class="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500">
                    <option value="">Todas las áreas</option>
                </select>
            </div>

            <!-- Indicador de filtros -->
            <div id="filterBadge" class="hidden mt-3">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    <span id="filterCount">0</span> filtros aplicados
                    <button onclick="limpiarFiltros()" class="ml-2 text-blue-600 hover:text-blue-800">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </span>
            </div>
        </div>

        <!-- Contenedor con Grid y Paginación -->
        <div class="bg-white rounded-lg shadow-sm overflow-hidden">
            <!-- Grid de Cards -->
            <div id="tiposGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                <!-- Los cards se cargarán aquí via JavaScript -->
            </div>

            <!-- Paginación -->
            <div class="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div class="flex-1 flex justify-between sm:hidden">
                    <button id="prevPageMobile" class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                        Anterior
                    </button>
                    <button id="nextPageMobile" class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                        Siguiente
                    </button>
                </div>
                <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                        <p class="text-sm text-gray-700">
                            Mostrando <span id="showingFrom" class="font-medium">0</span> a <span id="showingTo" class="font-medium">0</span> de <span id="totalTipos" class="font-medium">0</span> resultados
                        </p>
                    </div>
                    <div class="flex items-center gap-2">
                        <select id="perPageSelect" class="border border-gray-300 rounded-md text-sm px-2 py-1">
                            <option value="6">6 por página</option>
                            <option value="12">12 por página</option>
                            <option value="24">24 por página</option>
                            <option value="50">50 por página</option>
                        </select>
                        <nav id="pagination" class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                            <!-- Pagination buttons will be inserted here -->
                        </nav>
                    </div>
                </div>
            </div>
        </div>

        <!-- Skeleton Loader -->
        <div id="skeletonLoader" class="hidden grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- 6 skeleton cards -->
            <div class="bg-white rounded-lg shadow-sm p-6 animate-pulse" x-data="{ count: 6 }">
                <div class="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div class="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div class="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                <div class="space-y-2 mt-4">
                    <div class="h-3 bg-gray-200 rounded"></div>
                    <div class="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
            </div>
        </div>

        <!-- Empty State -->
        <div id="emptyState" class="hidden bg-white rounded-lg shadow-sm p-12 text-center">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">No hay tipos de solicitud</h3>
            <p class="mt-1 text-sm text-gray-500">Comienza creando un nuevo tipo de solicitud.</p>
            <div class="mt-6">
                <button onclick="abrirModalNuevoTipo()" class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                    Crear Primer Tipo
                </button>
            </div>
        </div>
    </div>

    <!-- Modal: Configurar Formulario -->
    <div id="modalConfigurarFormulario" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-0 mx-auto p-0 w-full h-full bg-white">
            <!-- Header del Modal -->
            <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
                <div class="flex justify-between items-center">
                    <div>
                        <h2 class="text-2xl font-bold text-gray-900">Configurar Campos del Formulario</h2>
                        <p class="text-sm text-gray-600 mt-1" id="modal-tipo-nombre">Cargando...</p>
                        <div class="mt-2 flex items-center gap-4">
                            <span class="text-sm text-gray-500">
                                <span id="modal-campos-contador">0</span> campos configurados
                            </span>
                            <span class="text-sm text-yellow-600" id="modal-campos-sin-configurar" style="display: none;">
                                ⚠️ Hay campos sin configurar
                            </span>
                        </div>
                    </div>
                    <div class="flex gap-3">
                        <button onclick="cerrarModalConfiguracion()" class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                            ✕ Cerrar
                        </button>
                        <button onclick="vistaPreviaFormulario()" class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                            👁️ Vista Previa
                        </button>
                        <button onclick="guardarConfiguracionFormulario()" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            💾 Guardar Cambios
                        </button>
                    </div>
                </div>
            </div>

            <!-- Contenido del Modal: Layout 3 columnas -->
            <div class="grid grid-cols-12 gap-4 p-6 h-[calc(100vh-120px)]">
                <!-- Columna 1: Campos Disponibles (25%) -->
                <div class="col-span-3 overflow-y-auto">
                    <div class="bg-gray-50 rounded-lg p-4 sticky top-0">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">Campos Disponibles</h3>

                        <!-- Campos del sistema -->
                        <div class="mb-6">
                            <h4 class="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                <svg class="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                                </svg>
                                Siempre Incluidos
                            </h4>
                            <div class="text-xs text-gray-500 space-y-1 bg-white p-3 rounded border border-gray-200">
                                <div>• Tipo de documento</div>
                                <div>• Número de documento</div>
                                <div>• Nombres y Apellidos</div>
                                <div>• Email</div>
                                <div>• Teléfono</div>
                                <p class="mt-2 text-xs italic text-gray-400">Se obtienen del perfil del usuario</p>
                            </div>
                        </div>

                        <!-- Campos arrastrables -->
                        <div class="space-y-2">
                            <h4 class="text-sm font-medium text-gray-700 mb-3">Arrastra para agregar</h4>

                            <div class="campo-disponible" draggable="true" data-tipo="texto_corto">
                                <span class="text-xl">📝</span>
                                <span>Texto Corto</span>
                            </div>

                            <div class="campo-disponible" draggable="true" data-tipo="texto_largo">
                                <span class="text-xl">📄</span>
                                <span>Texto Largo</span>
                            </div>

                            <div class="campo-disponible" draggable="true" data-tipo="email">
                                <span class="text-xl">📧</span>
                                <span>Email</span>
                            </div>

                            <div class="campo-disponible" draggable="true" data-tipo="telefono">
                                <span class="text-xl">☎️</span>
                                <span>Teléfono</span>
                            </div>

                            <div class="campo-disponible" draggable="true" data-tipo="fecha">
                                <span class="text-xl">📅</span>
                                <span>Fecha</span>
                            </div>

                            <div class="campo-disponible" draggable="true" data-tipo="numero">
                                <span class="text-xl">#️⃣</span>
                                <span>Número</span>
                            </div>

                            <div class="campo-disponible" draggable="true" data-tipo="moneda">
                                <span class="text-xl">💰</span>
                                <span>Moneda</span>
                            </div>

                            <div class="campo-disponible" draggable="true" data-tipo="checkbox">
                                <span class="text-xl">☑️</span>
                                <span>Checkbox</span>
                            </div>

                            <div class="campo-disponible" draggable="true" data-tipo="radio">
                                <span class="text-xl">🔘</span>
                                <span>Radio</span>
                            </div>

                            <div class="campo-disponible" draggable="true" data-tipo="select">
                                <span class="text-xl">📋</span>
                                <span>Select</span>
                            </div>

                            <div class="campo-disponible" draggable="true" data-tipo="archivo">
                                <span class="text-xl">📎</span>
                                <span>Archivo</span>
                            </div>

                            <div class="campo-disponible" draggable="true" data-tipo="imagen">
                                <span class="text-xl">🖼️</span>
                                <span>Imagen</span>
                            </div>

                            <div class="campo-disponible" draggable="true" data-tipo="direccion">
                                <span class="text-xl">📍</span>
                                <span>Dirección</span>
                            </div>

                            <div class="campo-disponible" draggable="true" data-tipo="ubicacion">
                                <span class="text-xl">🗺️</span>
                                <span>Ubicación/Mapa</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Columna 2: Constructor de Formulario (50%) -->
                <div class="col-span-6 overflow-y-auto">
                    <div class="bg-white rounded-lg border border-gray-200 p-6 min-h-full">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-lg font-semibold text-gray-900">Formulario (Constructor)</h3>
                            <button onclick="limpiarFormulario()" class="text-sm text-red-600 hover:text-red-700">
                                🗑️ Limpiar Todo
                            </button>
                        </div>

                        <!-- Área de drop -->
                        <div id="area-formulario-drop" class="min-h-[600px] border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                            <div id="placeholder-formulario-vacio" class="text-center py-20 text-gray-400">
                                <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                </svg>
                                <p class="text-lg font-medium mb-2">Arrastra campos aquí para construir el formulario</p>
                                <p class="text-sm">Los campos se pueden reordenar después de agregarlos</p>
                            </div>

                            <div id="formulario-campos-lista" class="space-y-3">
                                <!-- Los campos se agregarán aquí dinámicamente -->
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Columna 3: Panel de Configuración (25%) -->
                <div class="col-span-3 overflow-y-auto">
                    <div class="bg-gray-50 rounded-lg p-4 sticky top-0" id="panel-config-campo">
                        <div id="config-campo-vacia" class="text-center py-20 text-gray-400">
                            <svg class="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            </svg>
                            <p class="text-sm">Selecciona un campo para configurarlo</p>
                        </div>

                        <div id="config-campo-contenido" style="display: none;">
                            <!-- El contenido de configuración se cargará dinámicamente -->
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal: Vista Previa del Formulario -->
    <div id="modalVistaPreviaFormulario" class="hidden fixed inset-0 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full z-[9999]">
        <div class="relative top-0 mx-auto p-0 w-full max-w-6xl my-8">
            <div class="bg-white rounded-lg shadow-2xl">
                <!-- Header del Modal -->
                <div class="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-t-lg z-10">
                    <div class="flex justify-between items-center">
                        <div>
                            <h2 class="text-2xl font-bold">Vista Previa del Formulario</h2>
                            <p class="text-blue-100 text-sm mt-1">Así verán los ciudadanos el formulario de solicitud</p>
                        </div>
                        <button onclick="cerrarModalVistaPrevia()" class="text-white hover:text-gray-200 transition-colors">
                            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Contenido del Modal -->
                <div id="contenidoVistaPrevia" class="p-6 overflow-y-auto max-h-[calc(100vh-180px)]">
                    <!-- El contenido se inyectará aquí dinámicamente -->
                </div>

                <!-- Footer del Modal -->
                <div class="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-lg border-t border-gray-200">
                    <div class="flex justify-end">
                        <button onclick="cerrarModalVistaPrevia()" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            Cerrar Vista Previa
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    @push('scripts')
    <script src="{{ asset('js/admin/tipos-solicitud.js') }}?v={{ time() }}"></script>
    @endpush
</x-app-layout>

