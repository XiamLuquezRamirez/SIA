<x-app-layout>
    <x-slot name="title">Plantillas de Documentos</x-slot>

    @push('styles')
    <link rel="stylesheet" href="{{ asset('css/admin/plantillas-documentos.css') }}?v={{ time() }}">
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
                            <span class="text-gray-500">Configuración</span>
                        </div>
                    </li>
                    <li aria-current="page">
                        <div class="flex items-center">
                            <svg class="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path>
                            </svg>
                            <span class="text-gray-700 font-medium">Plantillas de Documentos</span>
                        </div>
                    </li>
                </ol>
            </nav>

            <!-- Título y Acciones -->
            <div class="flex justify-between items-start">
                <div>
                    <h1 class="text-2xl font-bold text-gray-800">Plantillas de Documentos</h1>
                    <p class="text-gray-600 text-sm mt-1">Gestiona las plantillas para generar documentos PDF automáticos</p>
                </div>
                <div class="flex gap-2">
                    <button onclick="exportarPlantillas()" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path>
                        </svg>
                        Exportar
                    </button>
                    <button onclick="importarPlantillas()" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                        </svg>
                        Importar
                    </button>
                    <button onclick="abrirModalNuevaPlantilla()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                        </svg>
                        Nueva Plantilla
                    </button>
                </div>
            </div>
        </div>

        <!-- Estadísticas Rápidas -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-white rounded-lg shadow-sm p-4">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <div class="rounded-md bg-blue-100 p-3">
                            <svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                        </div>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-500">Total Plantillas</p>
                        <p class="text-2xl font-semibold text-gray-900" id="stat-total">0</p>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow-sm p-4">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <div class="rounded-md bg-green-100 p-3">
                            <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-500">Activas</p>
                        <p class="text-2xl font-semibold text-gray-900" id="stat-activas">0</p>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow-sm p-4">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <div class="rounded-md bg-purple-100 p-3">
                            <svg class="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                            </svg>
                        </div>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-500">Certificados</p>
                        <p class="text-2xl font-semibold text-gray-900" id="stat-certificados">0</p>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow-sm p-4">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <div class="rounded-md bg-orange-100 p-3">
                            <svg class="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path>
                            </svg>
                        </div>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-500">Documentos Generados</p>
                        <p class="text-2xl font-semibold text-gray-900" id="stat-generados">0</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Filtros y Vista -->
        <div class="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
                <!-- Búsqueda -->
                <div class="relative md:col-span-2">
                    <input type="text" id="searchInput" placeholder="Buscar plantilla..."
                        class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <svg class="absolute left-3 top-3 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                </div>

                <!-- Tipo de Documento -->
                <select id="filterTipo" class="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500">
                    <option value="">Todos los tipos</option>
                    <option value="certificado">Certificados</option>
                    <option value="concepto">Conceptos</option>
                    <option value="acta">Actas</option>
                    <option value="oficio">Oficios</option>
                </select>

                <!-- Estado -->
                <select id="filterEstado" class="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500">
                    <option value="">Todos los estados</option>
                    <option value="activos">Activos</option>
                    <option value="inactivos">Inactivos</option>
                </select>

                <!-- Modo de Vista -->
                <div class="flex gap-2">
                    <button id="vistaCards" onclick="cambiarVista('cards')" class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        <svg class="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
                        </svg>
                    </button>
                    <button id="vistaLista" onclick="cambiarVista('lista')" class="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                        <svg class="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                        </svg>
                    </button>
                </div>
            </div>
        </div>

        <!-- Grid de Cards -->
        <div id="plantillasGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- Los cards se cargarán aquí via JavaScript -->
        </div>

        <!-- Vista de Lista -->
        <div id="plantillasLista" class="hidden bg-white rounded-lg shadow-sm overflow-hidden">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plantilla</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variables</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uso</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                </thead>
                <tbody id="plantillasListaBody" class="bg-white divide-y divide-gray-200">
                    <!-- Las filas se cargarán aquí via JavaScript -->
                </tbody>
            </table>
        </div>

        <!-- Skeleton Loader -->
        <div id="skeletonLoader" class="hidden grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                <div class="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div class="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div class="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                <div class="space-y-2 mt-4">
                    <div class="h-3 bg-gray-200 rounded"></div>
                    <div class="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
            </div>
            <div class="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                <div class="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div class="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div class="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                <div class="space-y-2 mt-4">
                    <div class="h-3 bg-gray-200 rounded"></div>
                    <div class="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
            </div>
            <div class="bg-white rounded-lg shadow-sm p-6 animate-pulse">
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
            <h3 class="mt-2 text-sm font-medium text-gray-900">No hay plantillas</h3>
            <p class="mt-1 text-sm text-gray-500">Comienza creando una nueva plantilla de documentos.</p>
            <div class="mt-6">
                <button onclick="abrirModalNuevaPlantilla()" class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                    Crear Primera Plantilla
                </button>
            </div>
        </div>
    </div>

    <!-- Modal: Vista Previa PDF -->
    <div id="modalPreviewPDF" class="hidden fixed inset-0 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full z-[9999]">
        <div class="relative top-0 mx-auto p-0 w-full max-w-6xl my-8">
            <div class="bg-white rounded-lg shadow-2xl">
                <!-- Header del Modal -->
                <div class="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-t-lg z-10">
                    <div class="flex justify-between items-center">
                        <div>
                            <h2 class="text-2xl font-bold">Vista Previa - Documento PDF</h2>
                            <p class="text-blue-100 text-sm mt-1" id="preview-plantilla-nombre">Plantilla de Ejemplo</p>
                        </div>
                        <button onclick="cerrarModalPreviewPDF()" class="text-white hover:text-gray-200 transition-colors">
                            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Contenido del Modal -->
                <div id="contenidoPreviewPDF" class="p-6 overflow-y-auto max-h-[calc(100vh-180px)]">
                    <div class="bg-gray-100 p-8 rounded shadow-inner">
                        <div id="preview-pdf-content" class="bg-white p-8 rounded shadow-lg max-w-4xl mx-auto">
                            <!-- El contenido se inyectará aquí dinámicamente -->
                        </div>
                    </div>
                </div>

                <!-- Footer del Modal -->
                <div class="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-lg border-t border-gray-200">
                    <div class="flex justify-between items-center">
                        <div class="text-sm text-gray-600">
                            <span class="font-medium">Nota:</span> Esta es una vista previa con datos de ejemplo
                        </div>
                        <div class="flex gap-3">
                            <button onclick="descargarPDFPreview()" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                                <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                </svg>
                                Descargar PDF
                            </button>
                            <button onclick="cerrarModalPreviewPDF()" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                Cerrar Vista Previa
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal: Importar Plantillas -->
    <div id="modalImportar" class="hidden fixed inset-0 bg-gray-900 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div class="mt-3">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-medium leading-6 text-gray-900">Importar Plantillas</h3>
                    <button onclick="cerrarModalImportar()" class="text-gray-400 hover:text-gray-600">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                <div class="mt-4">
                    <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                        </svg>
                        <div class="mt-4">
                            <label for="file-upload" class="cursor-pointer">
                                <span class="mt-2 block text-sm font-medium text-gray-900">
                                    Selecciona un archivo JSON
                                </span>
                                <input id="file-upload" name="file-upload" type="file" accept=".json" class="sr-only" onchange="handleFileSelect(event)">
                                <p class="mt-1 text-xs text-gray-500">o arrastra y suelta aquí</p>
                            </label>
                        </div>
                    </div>

                    <div id="file-info" class="hidden mt-4 p-4 bg-blue-50 rounded-lg">
                        <div class="flex items-center">
                            <svg class="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clip-rule="evenodd"></path>
                            </svg>
                            <span class="ml-2 text-sm text-blue-700" id="file-name"></span>
                        </div>
                    </div>
                </div>

                <div class="mt-6 flex justify-end gap-3">
                    <button onclick="cerrarModalImportar()" class="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                        Cancelar
                    </button>
                    <button id="btn-importar" onclick="procesarImportacion()" disabled class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                        Importar
                    </button>
                </div>
            </div>
        </div>
    </div>

    @push('scripts')
    <script src="{{ asset('js/admin/plantillas-documentos.js') }}?v={{ time() }}"></script>
    @endpush
</x-app-layout>
