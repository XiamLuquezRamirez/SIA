<x-app-layout>
    <x-slot name="title">Plantillas de Documentos</x-slot>

    @push('styles')
    <link rel="stylesheet" href="{{ asset('css/admin/plantillas-documentos.css') }}?v={{ time() }}">
    @endpush

    <div class="container mx-auto px-4 py-6">
        <!-- Breadcrumb -->
        <nav class="text-sm mb-4">
            <ol class="list-none p-0 inline-flex">
                <li class="flex items-center">
                    <a href="{{ route('admin.dashboard') }}" class="text-blue-600 hover:text-blue-800">Inicio</a>
                    <svg class="w-3 h-3 mx-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path>
                    </svg>
                </li>
                <li class="flex items-center">
                    <span class="text-gray-500">Configuración</span>
                    <svg class="w-3 h-3 mx-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path>
                    </svg>
                </li>
                <li class="flex items-center">
                    <span class="text-gray-700 font-medium">Plantillas de Documentos</span>
                </li>
            </ol>
        </nav>

        <!-- Header -->
        <div class="mb-6">
            <h1 class="text-3xl font-bold text-gray-900 mb-2">Plantillas de Documentos</h1>
            <p class="text-gray-600">Gestione las plantillas para generar documentos PDF</p>
        </div>

        <!-- Botones de Acción -->
        <div class="flex justify-end items-center mb-6">
            <div class="flex gap-3">
                <button onclick="abrirModalNuevaPlantilla()" class="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                    </svg>
                    Nueva Plantilla
                </button>
            </div>
        </div>

        <!-- Filtros -->
        <div class="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <!-- Buscar -->
                <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
                    <div class="relative">
                        <input type="text" id="searchInput" placeholder="Buscar por nombre o descripción..." 
                            class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <svg class="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                    </div>
                </div>

                <!-- Tipo de Documento -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de Documento</label>
                    <select id="filterTipo" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="">Todos</option>
                        <option value="certificado">Certificado</option>
                        <option value="concepto">Concepto</option>
                        <option value="acta">Acta</option>
                        <option value="oficio">Oficio</option>
                    </select>
                </div>

                <!-- Estado -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                    <select id="filterEstado" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="">Todos</option>
                        <option value="activas" selected>Activas</option>
                        <option value="inactivas">Inactivas</option>
                    </select>
                </div>
            </div>
        </div>

        <!-- Loader -->
        <div id="skeletonLoader" class="hidden flex justify-center items-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>

        <!-- Contenedor de Plantillas (Grid) -->
        <div id="plantillasGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- Las plantillas se cargarán aquí dinámicamente -->
        </div>

        <!-- Contenedor de Plantillas (Lista) -->
        <div id="plantillasLista" class="hidden">
            <div class="bg-white rounded-lg shadow-sm overflow-hidden">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plantilla</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variables</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usos</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="plantillasListaBody" class="bg-white divide-y divide-gray-200">
                        <!-- Las filas se cargarán aquí dinámicamente -->
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Estado Vacío -->
        <div id="emptyState" class="hidden bg-white rounded-lg shadow-sm p-12 text-center">
            <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">No hay plantillas de documentos</h3>
            <p class="text-gray-600 mb-4">Comienza creando tu primera plantilla</p>
            <button onclick="abrirModalNuevaPlantilla()" class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
                Nueva Plantilla
            </button>
        </div>
    </div>

    @push('scripts')
    <script src="{{ asset('js/admin/plantillas-documentos.js') }}?v={{ time() }}"></script>
    @endpush
</x-app-layout>

