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
                                                <br>
                                                <div class="md:col-span-2">
                                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                                        Motivos por los cuales se esta cambiando de lider
                                                    </label>
                                                    <textarea name="motivo_cambio_lider" id="motivo_cambio_lider" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Ej: Reestructuración organizacional, cambio de funciones, etc."></textarea>
                                                    <span class="error-message text-red-500 text-xs hidden"></span>
                                                </div>
                                                <br>
                                                <div class="md:col-span-2" style="display: flex; align-items: center; gap: 10px;">
                                                    <input type="checkbox"  checked name="notificar_anterior_lider" id="notificar_anterior_lider" class="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded">
                                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                                        Notificar por correo al anterior lider del cambio
                                                    </label>
                                                </div>
                                                <div class="md:col-span-2" style="display: flex; align-items: center; gap: 10px;">
                                                    <input type="checkbox"  checked name="mantener_anterior_lider" id="mantener_anterior_lider" class="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded">
                                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                                        Mantener al anterior lider como miembro del equipo
                                                    </label>
                                                </div>
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

    <!-- Modal Ver Detalle de Equipo -->
    <div id="viewEquipoModal" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-10 mx-auto mb-10 p-0 border w-11/12 max-w-6xl shadow-lg bg-white" style="border-radius: 30px;">
            <!-- Modal Header -->
            <div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700" style="border-top-left-radius: 30px; border-top-right-radius: 30px;">
                <div class="flex items-center justify-between">
                    <h3 class="text-xl font-semibold text-white"> Detalle del Equipo</h3>
                    <div class="flex gap-2">
                        <button type="button" onclick="imprimirEquipo()" class="text-white hover:text-gray-200 transition px-3 py-1 rounded-lg hover:bg-blue-800" title="Imprimir Perfil">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
                            </svg>
                        </button>
                        <button type="button" id="BtnviewTab_editar" onclick="" class="hidden text-white hover:text-gray-200 transition px-3 py-1 rounded-lg hover:bg-blue-800" title="Editar Equipo">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                        </button>
                        <button type="button" onclick="cerrarModalVerEquipo()" class="text-white hover:text-gray-200 transition">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Modal Body -->
            <div class="bg-white" style="border-radius: 30px;">
                <!-- Tabs -->
                <div class="border-b border-gray-200 px-6">
                    <nav class="-mb-px flex space-x-8">
                        <button id="BtnviewTab_informacion" onclick="cambiarTabVista('informacion')" class="view-tab-button active border-b-2 border-blue-600 py-4 px-1 text-sm font-medium text-blue-600">
                            Información del Equipo
                        </button>
                        <button id="BtnviewTab_miembros" onclick="cambiarTabVista('miembros')" class="view-tab-button border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                            Miembros del Equipo
                        </button>
                        <button id="BtnviewTab_estadisticas" onclick="cambiarTabVista('estadisticas')" class="view-tab-button border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                            Estadísticas
                        </button>
                    </nav>
                </div>

                <!-- Tab Content -->
                <div class="px-6 py-4">
                    <!-- Tab: Información Personal -->
                    <div id="viewTab_informacion" class="hidden view-tab-content">
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                Dependencia o Área del Equipo <span class="text-red-500">*</span>
                            </label>
                            <input type="text" name="area_nombre" id="viewEquipoAreaNombre"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                disabled
                            >
                            <span class="error-message text-red-500 text-xs hidden"></span>
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                Nombre del Equipo <span class="text-red-500">*</span>
                            </label>
                            <input type="text" name="nombre" id="viewEquipoNombre"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                disabled
                            >
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                Funciones del Equipo <span class="text-red-500">*</span>
                            </label>
                            <textarea name="descripcion" id="viewEquipoDescripcion" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" disabled>
                                
                            </textarea>
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                Líder del Equipo <span class="text-red-500">*</span>
                            </label>
                            <div class="mt-4 flex items-center" id="viewEquipoLider"></div>
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                Estado del Equipo <span class="text-red-500">*</span>
                            </label>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input id="viewEquipoEstado" type="checkbox" class="sr-only peer"  disabled>
                                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                            </label>
                        </div>
                    </div>

                    <div id="viewTab_miembros" class="hidden view-tab-content">
                        <div class="mb-4" style="position: relative;">
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                Lista de miembros del Equipo <span class="text-blue-500" id="viewEquipoMiembrosNombre"></span><br>
                                <span class="text-xs text-gray-500" id="viewEquipoMiembrosCount"></span>
                            </label>
                            <button type="button" onclick="abrirModalAgregarMiembro()" class="absolute right-0 top-0 px-4 py-2 text-white border border-gray-300 bg-blue-700 rounded-lg hover:bg-blue-500  transition " style="display: flex; align-items: center; gap: 10px;">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                                Añadir Miembro
                            </button>
                            <br>
                            <div class="mt-4 w-full" style="max-height: 400px; overflow-y: auto;">
                                <table class="min-w-full divide-y divide-gray-200">
                                    <thead class="bg-gray-50">
                                        <tr>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Foto de perfil</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo de miembro</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cargo</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estadisticas</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody class="bg-white divide-y divide-gray-200" id="viewEquipoMiembros">
                                        
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div id="viewTab_estadisticas" class="hidden view-tab-content">
                        <div class="flex flex-col md:flex-row gap-6">
                            <div class="mb-4">
                                <label class="block text-sm font-medium text-gray-700 mb-1">
                                    Implementacion en un futuro
                                </label>
                                <div class="mt-4 w-full" style="max-height: 400px; overflow-y: auto;">
                                    <p class="text-sm text-gray-700">
                                        Implementacion en un futuro
                                    </p>
                                </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modal Footer -->
            <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2" style="border-bottom-left-radius: 30px; border-bottom-right-radius: 30px;">
                <button type="button" onclick="cerrarModalVerEquipo()" class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                    Cerrar
                </button>
            </div>
        </div>
    </div>
    </div>


    <!-- Modal agregar miembros a un equipo -->
    <div id="viewEquipoAgregarMiembroModal" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-10 mx-auto mb-10 p-0 border w-11/12 max-w-6xl shadow-lg bg-white" style="border-radius: 30px;">
            <!-- Modal Header -->
            <div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700" style="border-top-left-radius: 30px; border-top-right-radius: 30px;">
                <div class="flex items-center justify-between">
                    <h3 class="text-xl font-semibold text-white"> Añadir Miembro al Equipo</h3>
                    <div class="flex gap-2">
                        <button type="button" onclick="cerrarModalAgregarMiembro()" class="text-white hover:text-gray-200 transition">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
            <!-- Modal Body -->
            <div class="bg-white" style="border-radius: 30px;">
                <!-- Tab Content -->
                <div class="px-6 py-4 overflow-y-auto">
                    <!-- Tab: Información Personal -->
                    <div>
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-1" style="font-size: 20px;">
                                Lista de funcionarios de la dependencia o área <span class="text-blue-500" id="areaNombreAgregarMiembro"></span><br>
                            </label>
                            <br>
                            <div class="grid grid-cols-2 gap-4">
                                <div class="col-span-1" style="display: flex; align-items: end;">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        Cantidad de funcionarios seleccionados: <span class="text-orange-500" id="cantidadEmpleadosSeleccionados">0</span>
                                    </label>
                                </div>
                                <div class="col-span-1">
                                   <input type="text" name="buscar_empleado" id="buscar_empleado" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Buscar por nombre, email, cargo, etc.">
                                </div>
                            </div>
                            <div class="mt-4 w-full" style="max-height: 400px; overflow-y: auto;">
                                <table class="min-w-full divide-y divide-gray-200">
                                    <thead class="bg-gray-50">
                                        <tr>
                                            <th style="padding: 0 !important;" class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                                                <input onchange="seleccionarTodosEmpleados(this)" id="checkbox_seleccionar_todos_empleados" type="checkbox" style="transform: scale(1.5);">
                                            </th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Foto</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">equipo actual</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo de miembro</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cargo</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                        </tr>
                                    </thead>
                                    <tbody class="bg-white divide-y divide-gray-200" id="empleadosAgregarMiembro">
                                        
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modal Footer -->
            <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2 hov" style="border-bottom-left-radius: 30px; border-bottom-right-radius: 30px;">
                <button type="button" onclick="agregarMiembrosAlEquipo()" class="px-4 py-2 text-white bg-green-600 border border-gray-300 rounded-lg hover:bg-green-700 transition">
                    Añadir funcionarios seleccionados
                </button>
                <button type="button" onclick="cerrarModalAgregarMiembro()" class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                    Cerrar
                </button>
            </div>
        </div>
    </div>

    @push('styles')
    <link rel="stylesheet" href="{{ asset('css/admin/usuarios-modal.css') }}">
    @endpush

    @push('scripts')
    <script src="{{ asset('js/admin/equipos.js') }}"></script>
    @endpush
</x-app-layout>