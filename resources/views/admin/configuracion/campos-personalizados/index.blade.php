<x-app-layout>
    <x-slot name="title">Biblioteca de Campos Personalizados</x-slot>

    @push('styles')
    <link rel="stylesheet" href="{{ asset('css/admin/campos-personalizados.css') }}?v={{ time() }}">
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
                    <span class="text-gray-700 font-medium">Campos Personalizados</span>
                </li>
            </ol>
        </nav>

        <!-- Header -->
        <div class="mb-6">
            <h1 class="text-3xl font-bold text-gray-900 mb-2">BIBLIOTECA DE CAMPOS PERSONALIZADOS</h1>
            <p class="text-gray-600">Cree campos reutilizables que puede usar en diferentes tipos de solicitud</p>
        </div>

        <!-- Botones de Acción -->
        <div class="flex justify-end items-right mb-6">
            <div class="flex gap-3">
                <button onclick="abrirModalNuevoCampo()" class="flex items-right px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                    </svg>
                    Nuevo Campo
                </button>
            </div>
        </div>

        <!-- Filtros -->
        <div class="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
                <!-- Buscar -->
                <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
                    <div class="relative">
                        <input type="text" id="searchInput" placeholder="Buscar por nombre, etiqueta o slug..." class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <svg class="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                    </div>
                </div>

                <!-- Categoría -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                    <select id="filterCategoria" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="">Todas</option>
                    </select>
                </div>

                <!-- Tipo -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                    <select id="filterTipo" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="">Todos</option>
                        <option value="texto_corto">Texto corto</option>
                        <option value="texto_largo">Texto largo</option>
                        <option value="numero">Número</option>
                        <option value="moneda">Moneda</option>
                        <option value="fecha">Fecha</option>
                        <option value="email">Email</option>
                        <option value="telefono">Teléfono</option>
                        <option value="select">Lista desplegable</option>
                        <option value="checkbox">Casilla</option>
                        <option value="radio">Radio</option>
                        <option value="archivo">Archivo</option>
                        <option value="imagen">Imagen</option>
                    </select>
                </div>

                <!-- Estado -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                    <select id="filterEstado" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="">Todos</option>
                        <option value="activos" selected>Activos</option>
                        <option value="inactivos">Inactivos</option>
                    </select>
                </div>
            </div>

            <!-- Vista -->
            <div class="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200">
                <span class="text-sm font-medium text-gray-700">Vista:</span>
                <div class="flex gap-2">
                    <button onclick="cambiarVista('cards')" id="btnVistaCards" class="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                        Cards
                    </button>
                    <button onclick="cambiarVista('lista')" id="btnVistaLista" class="px-3 py-1 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                        Lista
                    </button>
                    <button onclick="cambiarVista('categoria')" id="btnVistaCategoria" class="px-3 py-1 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                        Por Categoría
                    </button>
                </div>
            </div>
        </div>

        <!-- Loader -->
        <div id="loader" class="hidden flex justify-center items-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>

        <!-- Contenedor de Campos -->
        <div id="camposContainer" class="min-h-[400px]">
            <!-- Los campos se cargarán aquí dinámicamente -->
        </div>

        <!-- Estado Vacío -->
        <div id="estadoVacio" class="hidden bg-white rounded-lg shadow-sm p-12 text-center">
            <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
            </svg>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">No hay campos personalizados</h3>
            <p class="text-gray-600 mb-4">Comienza creando tu primer campo personalizado</p>
            <button onclick="abrirModalNuevoCampo()" class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
                Nuevo Campo
            </button>
        </div>
    </div>

    @push('scripts')
    <script src="{{ asset('js/admin/campos-personalizados.js') }}?v={{ time() }}"></script>
    @endpush
</x-app-layout>
