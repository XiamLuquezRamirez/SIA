<x-app-layout>
    <x-slot name="title">Equipos</x-slot>
    <div class="container mx-auto px-4 py-6">
        <div class="flex justify-between items-center mb-6">
            <div>
                <h1 class="text-2xl font-bold text-gray-800">Gestión de Equipos</h1>
                <p class="text-gray-600 text-sm">Administrar equipos del sistema</p>
            </div>
            <button onclick="abrirModalCrearEquipo()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
                Nuevo Equipo
            </button>
        </div>

        <!-- Filtros y Búsqueda -->
        <div class="bg-white rounded-lg shadow-sm p-4 mb-4">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <!-- Búsqueda -->
                <div class="md:col-span-2">
                    <input type="text" id="searchInput" placeholder="Buscar por nombre o líder"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </div>

                <!-- Filtro Dependencia -->
                <div>
                    <select id="filterDependencia" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="">Todas las dependencias</option>
                    </select>
                </div>

                <!-- Filtro Estado -->
                <div>
                    <select id="filterEstado" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="">Todos los estados</option>
                        <option value="0">Todas</option>
                        <option value="1">Activo</option>
                        <option value="2">Inactivo</option>
                    </select>
                </div>
            </div>

            <!-- Badge de filtros aplicados -->
            <div id="filterBadge" class="mt-2 hidden">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    <span id="filterCount" style="margin-right: 5px;">0</span> filtros aplicados
                    <button onclick="limpiarFiltros()" class="ml-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </span>
            </div>
        </div>

        <!-- Tabla de Equipos -->
        <div class="bg-white rounded-lg shadow-sm overflow-hidden">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left">
                                <input type="checkbox" id="selectAll" class="rounded border-gray-300">
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipo</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dependencia o Área</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Líder</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número de miembros</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="equiposTableBody" class="bg-white divide-y divide-gray-200">
                        <!-- Skeleton Loader -->
                        <tr class="skeleton-row">
                            <td colspan="7" class="px-6 py-4">
                                <div class="animate-pulse flex space-x-4">
                                    <div class="flex-1 space-y-4 py-1">
                                        <div class="h-4 bg-gray-200 rounded w-3/4"></div>
                                        <div class="h-4 bg-gray-200 rounded w-1/2"></div>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
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
                            Mostrando <span id="showingFrom" class="font-medium">0</span> a <span id="showingTo" class="font-medium">0</span> de <span id="totalEquipos" class="font-medium">0</span> resultados
                        </p>
                    </div>
                    <div class="flex items-center gap-2">
                        <select id="perPageSelect" class="border border-gray-300 rounded-md text-sm px-2 py-1">
                            <option value="15">15 por página</option>
                            <option value="30">30 por página</option>
                            <option value="50">50 por página</option>
                            <option value="100">100 por página</option>
                        </select>
                        <nav id="pagination" class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                            <!-- Pagination buttons will be inserted here -->
                        </nav>
                    </div>
                </div>
            </div>
        </div>        
    </div>

     <!-- Modal Crear/Editar Equipo -->
     <div id="equipoModal" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-10 mx-auto mb-10 p-0 border w-11/12 max-w-4xl shadow-lg bg-white" style="border-radius: 20px;">
            <!-- Modal Header -->
            <div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700" style="border-top-left-radius: 20px; border-top-right-radius: 20px;">
                <div class="flex items-center justify-between">
                    <h3 id="modalTitle" class="text-xl font-semibold text-white"></h3>
                    <button type="button" onclick="cerrarModalEquipo()" class="text-white hover:text-gray-200 transition">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
            </div>

            <!-- Modal Body -->
            <form id="equipoForm" enctype="multipart/form-data" style="border-radius: 20px;" class="bg-white">
                <div class="px-6 pb-4 max-h-[60vh] overflow-y-auto p-4">
                    <!-- Tab 1: Información del Equipo -->
                    <div class="tab-content">
                        <div class="grid grid-cols-1 gap-4">
                            <!-- Campos de Equipo -->
                            <div id="funcionarioFields" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <!-- Área -->
                                <div class="md:col-span-2">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        Dependencia o Área <span class="text-red-500">*</span>
                                    </label>
                                    <select onchange="cargarUsuariosPorArea()" name="area_id" id="area_id" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                        <option value="">Seleccione una área</option>
                                    </select>
                                    <span class="error-message text-red-500 text-xs hidden"></span>
                                </div>
                                <!-- Nombre -->
                                <div class="md:col-span-2">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        Nombre <span class="text-red-500">*</span>
                                    </label>
                                    <input type="text" name="nombre" id="nombre"
                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Ej: Equipo de Salud">
                                    <span class="error-message text-red-500 text-xs hidden"></span>
                                </div>
                                <!-- Descripción de funciones -->
                                <div class="md:col-span-2">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        Descripción de funciones <span class="text-red-500">*</span>
                                    </label>
                                    <textarea name="funciones" id="funciones" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Ej: Equipo de Salud"></textarea>
                                    <span class="error-message text-red-500 text-xs hidden"></span>
                                </div>

                                <!-- Líder -->
                                <div class="md:col-span-2">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        Asignar Líder
                                    </label>
                                    <select onchange="mostrarMensajeSiTieneEquipo(this)" name="lider_id" id="lider_id" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                        <option value="">Seleccione un líder</option>
                                    </select>
                                    <span class="error-message text-red-500 text-xs hidden"></span>
                                </div>

                                <div class="md:col-span-2 danger-message hidden" id="danger-message-equipo">
                                    <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                                        <div class="flex items-center">
                                            <svg class="w-5 h-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7.707-4.707a1 1 0 00-1.414 1.414L10.586 10l-1.293 1.293a1 1 0 101.414 1.414L12 11.414l1.293 1.293a1 1 0 001.414-1.414L13.414 10l1.293-1.293a1 1 0 00-1.414-1.414L12 8.586z" clip-rule="evenodd"></path>
                                            </svg>
                                            <div>
                                                <span class="font-medium text-red-800">Importante</span>
                                                <p class="text-sm text-red-700" id="danger-message-text"></p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Rol -->
                                <div class="md:col-span-2">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        Rol
                                    </label>
                                    <select name="rol_id" id="rol_id" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                        <option value="">Seleccione un rol</option>
                                    </select>
                                    <span class="error-message text-red-500 text-xs hidden"></span>
                                </div>

                                <!-- Estado del Equipo -->
                                <div class="flex items-center justify-between  p-3 rounded-lg">
                                    <span class="text-sm font-medium text-gray-700">Equipo Activo</span>
                                    <label class="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" name="activo" id="activo" checked class="sr-only peer">
                                        <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Modal Footer -->
                <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between" style="border-bottom-left-radius: 30px; border-bottom-right-radius: 30px;">
                    <div class="flex-1"></div>
                    <div class="flex gap-2">
                        <button type="submit" id="submitButton"
                            class="hidden px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                            Guardar Equipo
                        </button>
                        <button type="button" onclick="cerrarModalEquipo()"
                            class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                            Cancelar
                        </button>
                    </div>
                </div>
            </form>
        </div>
    </div>


    @push('styles')
    <link rel="stylesheet" href="{{ asset('css/admin/usuarios-modal.css') }}">
    @endpush

    @push('scripts')
    <script src="{{ asset('js/admin/equipos.js') }}"></script>
    @endpush
</x-app-layout>