<x-app-layout>
    <x-slot name="title">Festivos</x-slot>
    <div class="container mx-auto px-4 py-6">
        <div class="flex justify-between items-center mb-6">
            <div>
                <h1 class="text-2xl font-bold text-gray-800">Gestión de Festivos</h1>
                <p class="text-gray-600 text-sm">Administrar festivos para el calculo de SLA</p>
            </div>
            <div class="flex items-center gap-2">
                <button onclick="abrirModalImportarFestivos()" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                    <svg width="20px" height="20px" viewBox="0 0 16 16" fill="#ffffff" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 6L6 6L6 12L10 12L10 6L13 6V5L8 0L3 5L3 6Z" fill="#ffffff"/>
                        <path d="M2 16L14 16V14L2 14V16Z" fill="#ffffff"/>
                    </svg>
                    Importar Festivos
                </button>
                <button onclick="abrirModalCrearFestivo()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                    </svg>
                    Nuevo Festivo
                </button>
            </div>
        </div>

         <!-- Filtros y Búsqueda -->
         <div class="bg-white rounded-lg shadow-sm p-4 mb-4">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4" style="align-items: center;">
                <div class="md:col-span-1">
                    <div class="overflow-hidden shadow-sm rounded-lg" style="background-color:rgb(205, 183, 255);">
                        <div class="p-2">
                            <div class="flex items-center">
                                <div class="flex-shrink-0">
                                    <svg fill="#63279b" width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" data-name="Layer 1">
                                        <path d="M12,19a1,1,0,1,0-1-1A1,1,0,0,0,12,19Zm5,0a1,1,0,1,0-1-1A1,1,0,0,0,17,19Zm0-4a1,1,0,1,0-1-1A1,1,0,0,0,17,15Zm-5,0a1,1,0,1,0-1-1A1,1,0,0,0,12,15ZM19,3H18V2a1,1,0,0,0-2,0V3H8V2A1,1,0,0,0,6,2V3H5A3,3,0,0,0,2,6V20a3,3,0,0,0,3,3H19a3,3,0,0,0,3-3V6A3,3,0,0,0,19,3Zm1,17a1,1,0,0,1-1,1H5a1,1,0,0,1-1-1V11H20ZM20,9H4V6A1,1,0,0,1,5,5H6V6A1,1,0,0,0,8,6V5h8V6a1,1,0,0,0,2,0V5h1a1,1,0,0,1,1,1ZM7,15a1,1,0,1,0-1-1A1,1,0,0,0,7,15Zm0,4a1,1,0,1,0-1-1A1,1,0,0,0,7,19Z"/>
                                    </svg>
                                </div>
                                <div class="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt style="text-align: center;  color: #63279b;" class="text-sm font-bold truncate">Total Festivos</dt>
                                        <dd style="color:rgb(58, 25, 88); font-size: 1.5rem;" class="text-center font-semibold text-gray-900"><span id="totalFestivosCard"></span></dd>
                                    </dl>
                                </div>
                                <div class="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt style="text-align: center; color: #63279b;" class="text-sm font-bold truncate">Aplican a SLA</dt>
                                        <dd style="color:rgb(58, 25, 88); font-size: 1.5rem;" class="text-center font-semibold text-gray-900"><span id="totalFestivosSLA"></span></dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Búsqueda -->
                <div class="md:col-span-1">
                    <label for="searchInput" class="block text-sm font-medium text-gray-700 mb-1">Nombre, descripción o dia</label>
                    <input type="text" id="searchInput" placeholder="Nombre o descripción o dia de semana..."
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </div>

                <!-- Filtro Año -->
                <div class="md:col-span-1">
                    <label for="filterYear" class="block text-sm font-medium text-gray-700 mb-1">Filtrar por Año</label>
                    <select id="filterYear" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="">Todos los años</option>
                        @php
                            $year = date('Y');
                            $year_start = $year - 10;
                            $year_end = $year + 10;
                        @endphp
                        @for ($i = $year_start; $i <= $year_end; $i++)
                            <option {{ $i == $year ? 'selected' : '' }} value="{{ $i }}">{{ $i }}</option>
                        @endfor
                    </select>
                </div>

                <!-- Filtro Tipo -->

                <div class="md:col-span-1">
                    <label for="filterTipo" class="block text-sm font-medium text-gray-700 mb-1">Filtrar por Tipo</label>
                    <select id="filterTipo" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="">Todos los tipos</option>
                        <option value="Nacional">Nacional</option>
                        <option value="Departamental">Departamental</option>
                        <option value="Municipal">Municipal</option>
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

        <!-- Tabs -->
        <div class="border-b border-gray-200">
            <nav class="-mb-px flex space-x-8">
                <button style="padding-left: 20px; padding-right: 20px;" id="BtnviewTab_tabla" onclick="cambiarTabVista('tabla')" class="view-tab-button active border-b-2 border-blue-600 py-4 px-1 text-sm font-medium text-blue-600">
                    Información tipo Tabla
                </button>
                <button style="padding-left: 20px; padding-right: 20px;" id="BtnviewTab_calendario" onclick="cambiarTabVista('calendario')" class="view-tab-button border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                    Información tipo Calendario
                </button>
            </nav>
        </div>
        <div class="bg-white" style="border-radius: 0px 0px 30px 30px;">
            <!-- Tab Content -->
            <div class="px-6 py-6 overflow-y-auto">
                <!-- Tab: Tabla -->
                <div id="viewTab_tabla" class="view-tab-content">
                    <!-- Tabla de Usuarios -->
                    <div class="bg-white rounded-lg shadow-sm overflow-hidden">
                        <div class="overflow-x-auto">
                            <table class="min-w-full divide-y divide-gray-200">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th class="px-6 py-3 text-left">
                                            <input type="checkbox" id="selectAll" class="rounded border-gray-300">
                                        </th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha completa</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dia de la semana</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style="text-align: center;">Nombre</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style="text-align: center;">Descripción</th>    
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style="text-align: center;">Tipo</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style="text-align: center;">Aplican a SLA</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style="text-align: center;">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody id="festivosTableBody" class="bg-white divide-y divide-gray-200">
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
                                        Mostrando <span id="showingFrom" class="font-medium">0</span> a <span id="showingTo" class="font-medium">0</span> de <span id="totalFestivos" class="font-medium">0</span> resultados
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
                <!-- Tab: Calendario -->
                <div id="viewTab_calendario" class="hidden view-tab-content">
                    <div class="bg-white rounded-lg shadow-sm overflow-hidden">
                        <div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r" style="border-top-left-radius: 20px; border-top-right-radius: 20px;">
                            <h3 class="text-xl font-semibold">Descripcion de colores de los festivos</h3>
                            <br>
                            <table class="table-auto w-full">
                                <thead>
                                    <tr style="display: flex; align-items: center; gap: 10px;">
                                        <th style="border: 1px solid #000; display: flex; align-items: center; gap: 10px; padding-right: 10px;">
                                            <div class="w-8 h-8" style="background-color: #ff8e8e;"></div> Festivo Nacional
                                        </th>
                                        <th style="border: 1px solid #000; display: flex; align-items: center; gap: 10px; padding-right: 10px;">
                                            <div class="w-8 h-8" style="background-color: #a1e2ff;"></div> Festivo Departamental
                                        </th>
                                        <th style="border: 1px solid #000; display: flex; align-items: center; gap: 10px; padding-right: 10px;">
                                            <div class="w-8 h-8" style="background-color: #91ff96;"></div> Festivo Municipal
                                        </th>
                                    </tr>
                                </thead>
                            </table>
                        </div>
                        <div id="calendar" class="grid grid-cols-2 gap-4" style="min-height: 500px;"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>


    <!-- Modal Crear/Editar Festivo -->
    <div id="festivoModal" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-10 mx-auto mb-10 p-0 border w-11/12 max-w-4xl shadow-lg bg-white" style="border-radius: 20px;">
            <!-- Modal Header -->
            <div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700" style="border-top-left-radius: 20px; border-top-right-radius: 20px;">
                <div class="flex items-center justify-between">
                    <h3 id="modalTitle" class="text-xl font-semibold text-white">Crear Nuevo Festivo</h3>
                    <button type="button" onclick="cerrarModalFestivo()" class="text-white hover:text-gray-200 transition">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
            </div>

            <!-- Modal Body -->
            <form id="festivoForm" enctype="multipart/form-data" style="border-radius: 20px;" class="bg-white">
                <div class="px-6 pb-4 max-h-[60vh] overflow-y-auto p-4">
                    <!-- Tab 1: Información del Festivo -->
                    <div class="tab-content">
                        <div class="grid grid-cols-1 gap-4">
                            <!-- Campos de Festivo -->
                            <div id="funcionarioFields" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <!-- Cargo -->
                                <div class="md:col-span-2">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        Nombre <span class="text-red-500">*</span>
                                    </label>
                                    <input type="text" name="nombre" id="nombre"
                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Ej: Fiesta de la Patria">
                                    <span class="error-message text-red-500 text-xs hidden"></span>
                                </div>

                                <!-- Descripción -->
                                <div class="md:col-span-2">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        Descripción <span class="text-red-500">*</span>
                                    </label>
                                    <textarea name="descripcion" id="descripcion" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Ej: Se celebra el 20 de mayo de cada año en todo el país"></textarea>
                                    <span class="error-message text-red-500 text-xs hidden"></span>
                                </div>

                                <!-- Fecha -->
                                <div class="md:col-span-2">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        Fecha <span class="text-red-500">*</span>
                                    </label>
                                    <input type="date" name="fecha" id="fecha" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                    <span class="error-message text-red-500 text-xs hidden"></span>
                                </div>

                                <!-- tipo -->
                                <div class="md:col-span-2">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        Tipo de festivo <span class="text-red-500">*</span>
                                    </label>
                                    <select name="tipo" id="tipo" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                        <option value="">Seleccione un tipo</option>
                                        <option value="Nacional">Nacional</option>
                                        <option value="Departamental">Departamental</option>
                                        <option value="Municipal">Municipal</option>
                                    </select>
                                    <span class="error-message text-red-500 text-xs hidden"></span>
                                </div>

                                <!-- Aplican a SLA -->
                                <div class="flex items-center justify-between  p-3 rounded-lg">
                                    <div class="col-span-1 flex items-center justify-start rounded-lg gap-2">
                                        <span class="text-sm font-medium text-gray-700">Aplican a SLA</span>
                                        <label class="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" name="aplica_sla" id="aplica_sla" checked class="sr-only peer">
                                            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>
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
                            Guardar Festivo
                        </button>
                        <button type="button" onclick="cerrarModalFestivo()"
                            class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                            Cancelar
                        </button>
                    </div>
                </div>
            </form>
        </div>
    </div>


     <!-- Modal Crear/Importar Festivo -->
     <div id="importarFestivoModal" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-10 mx-auto mb-10 p-0 border w-11/12 max-w-4xl shadow-lg bg-white" style="border-radius: 20px;">
            <!-- Modal Header -->
            <div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700" style="border-top-left-radius: 20px; border-top-right-radius: 20px;">
                <div class="flex items-center justify-between">
                    <h3 id="modalTitle" class="text-xl font-semibold text-white">Importar Festivos</h3>
                    <button type="button" onclick="cerrarModalImportarFestivo()" class="text-white hover:text-gray-200 transition">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
            </div>

            <!-- Modal Body -->
            <form id="importarFestivoForm" enctype="multipart/form-data" style="border-radius: 20px;" class="bg-white">
                <div class="px-6 pb-4 max-h-[60vh] overflow-y-auto p-4">
                    <!-- Tab 1: Información del Festivo -->
                    <div class="tab-content">
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Seleccione el año de los festivos que desea importar
                        </label>
                        <select onchange="cargarFestivosApi(this.value)" name="anio_importar" id="anio_importar" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <option value="">Seleccione un año</option>
                            @php
                                $year = date('Y');
                                $year_start = $year - 10;
                                $year_end = $year + 10;
                            @endphp
                            @for ($i = $year_start; $i <= $year_end; $i++)
                                <option value="{{ $i }}">{{ $i }}</option>
                            @endfor
                        </select>
                        <div class="grid grid-cols-1 gap-4">
                            <!-- Campos de Festivo -->
                            <label class="block text-sm font-medium text-gray-700 mb-1 mt-4">
                                Seleccione los festivos que desea importar
                            </label>
                            <div id="contenedorImportarFestivos" class="grid grid-cols-1">
                                <table class="min-w-full divide-y divide-gray-200">
                                    <thead class="bg-gray-50">
                                        <tr>
                                            <th class="px-6 py-3 text-left" style="text-align: center; width: 10%;">
                                                <input type="checkbox" id="selectAllImportar" onchange="seleccionarTodosFestivosImportar(this)" class="rounded border-gray-300">
                                            </th>
                                            <th class="px-6 py-3 text-left" style="text-align: left; width: 20%;">
                                                <span>Festivo</span>
                                            </th>
                                            <th class="px-6 py-3 text-left" style="text-align: center; width: 20%;">
                                                <span>Fecha</span>
                                            </th>
                                            <th class="px-6 py-3 text-left" style="text-align: center; width: 20%;">
                                                <span>Dia de la semana</span>
                                            </th>
                                            <th class="px-6 py-3 text-left" style="text-align: center; width: 20%;">
                                                <span>Tipo</span>
                                            </th>
                                            <th class="px-6 py-3 text-left" style="text-align: center; width: 20%;">
                                                <span>Aplicación de SLA</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody id="festivosTableBodyImportar" class="bg-white divide-y divide-gray-200">
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Modal Footer -->
                <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between" style="border-bottom-left-radius: 30px; border-bottom-right-radius: 30px;">
                    <div class="flex-1"></div>
                    <div class="flex gap-2">
                        <button type="submit" onclick="consultarDisponibilidadImportarFestivos(event)" id="submitButtonImportarFestivos"
                            class=" px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                            Importar Festivos
                        </button>
                        <button type="button" onclick="cerrarModalImportarFestivo()"
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
    <link rel="stylesheet" href="https://unpkg.com/tippy.js@6/dist/tippy.css" />
    <link rel="stylesheet" href="{{ asset('css/admin/tippy.css') }}">
    @endpush

    @push('scripts')
    <script src="https://cdn.jsdelivr.net/npm/fullcalendar@6.1.19/index.global.min.js"></script>
    <script src="{{ asset('js/admin/festivos.js') }}"></script>
    <script src="https://unpkg.com/@popperjs/core@2"></script>
    <script src="https://unpkg.com/tippy.js@6"></script>
    @endpush

</x-app-layout>