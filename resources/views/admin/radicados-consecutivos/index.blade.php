<x-app-layout>
    <x-slot name="title">Festivos</x-slot>
    <div class="container mx-auto px-4 py-6">
        <div class="flex justify-between items-center mb-6">
            <div>
                <h1 class="text-2xl font-bold text-gray-800">Configuración de Radicados por Tipo</h1>
                <p class="text-gray-600 text-sm">Configure la estructura y formato de los radicados para cada tipo de solicitud</p>
            </div>
            <div class="flex items-center gap-2">
                <button onclick="abrirModalConfigurarRadicado()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                    </svg>
                    Configurar nuevo Radicado
                </button>
            </div>
        </div>
        <!-- Filtros y Búsqueda -->
        <div class="bg-white rounded-lg shadow-sm p-4 mb-4">
            <div class="grid grid-cols-8 gap-4" style="align-items: center;">
                <div class="col-span-3">
                    <div class="overflow-hidden shadow-sm rounded-lg" style="background-color:rgb(205, 183, 255);">
                        <div class="p-2">
                            <div class="flex items-center">
                                <div class="flex-shrink-0 pl-2">
                                    <svg fill="rgb(58, 25, 88)" xmlns="http://www.w3.org/2000/svg" 
                                            width="50px" height="50px" viewBox="0 0 100 100" enable-background="new 0 0 100 100" xml:space="preserve">
                                        <g>
                                            <path d="M61.8,29.4l8.9,8.9l0,0c2,1.9,2,5.1,0,7l0,0L47.5,68.4V47.3V36.6l7.2-7.3C56.6,27.4,59.9,27.4,61.8,29.4z"
                                                />
                                        </g>
                                        <path d="M37.5,20H25c-2.8,0-5,2.2-5,5v43.8C20,75,25,80,31.2,80s11.2-5,11.2-11.2V25C42.5,22.2,40.2,20,37.5,20z
                                            M31.2,73.8c-2.8,0-5-2.2-5-5s2.2-5,5-5s5,2.2,5,5S34,73.8,31.2,73.8z"/>
                                        <g>
                                            <path d="M75,57.5h-8.8l-6,6H74L73.9,74H49.8l-6,6H75c2.8,0,5-2.2,5-5V62.5C80,59.8,77.8,57.5,75,57.5L75,57.5z"/>
                                        </g>
                                    </svg>
                                </div>
                                <div class="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt style="text-align: center;  color: #63279b;" class="text-sm font-bold truncate">Total <br>Tipos de Solicitud</dt>
                                        <dd style="color:rgb(58, 25, 88); font-size: 1.5rem;" class="text-center font-semibold text-gray-900"><span id="totalTiposSolicitudCard">0</span></dd>
                                    </dl>
                                </div>
                                <div class="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt style="text-align: center; color: #63279b;" class="text-sm font-bold truncate">Tipos de Solicitud <br>Configurados</dt>
                                        <dd style="color:rgb(58, 25, 88); font-size: 1.5rem;" class="text-center font-semibold text-gray-900"><span id="totalTiposSolicitudConfigurados">0</span></dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Búsqueda -->
                <div class="col-span-3">
                    <label for="searchInput" class="block text-sm font-medium text-gray-700 mb-1">Nombre o categoría</label>
                    <input type="text" id="searchInput" placeholder="Nombre o categoría..."
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </div>

               
                <!-- Filtro estado -->
                <div class="col-span-2">
                    <label for="filterEstado" class="block text-sm font-medium text-gray-700 mb-1">Filtrar por Estado de Configuración</label>
                    <select id="filterEstado" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="">Todos los estados</option>
                        <option value="1">Configurados</option>
                        <option value="2">No configurados</option>
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

        <!-- Tabla de TIPOS DE SOLICITUD -->
        <div class="bg-white rounded-lg shadow-sm overflow-hidden">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>    
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style="text-align: center;">Formato de Radicado</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style="text-align: center;">Estado de Configuración</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style="text-align: center;">Consecutivo Actual</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style="text-align: center;">Número de Radicados</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style="text-align: center;">Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="tiposSolicitudTableBody" class="bg-white divide-y divide-gray-200">
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
                        Mostrando <span id="showingFrom" class="font-medium">0</span> a <span id="showingTo" class="font-medium">0</span> de <span id="totalTiposSolicitud" class="font-medium">0</span> resultados
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


    <!-- Modal Crear/Editar Usuario -->
    <div id="configurarRadicadoModal" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-10 mx-auto mb-10 p-0 border w-11/12 max-w-4xl shadow-lg bg-white" style="border-radius: 20px;">
            <!-- Modal Header -->
            <div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700" style="border-top-left-radius: 20px; border-top-right-radius: 20px;">
                <div class="flex items-center justify-between">
                    <h3 id="modalTitle" class="text-xl font-semibold text-white">Crear Nuevo Usuario</h3>
                    <button type="button" onclick="cerrarModalConConfirmacion()" class="text-white hover:text-gray-200 transition">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
            </div>

            <!-- Modal Body -->
            <form id="configurarRadicadoForm" enctype="multipart/form-data" style="border-radius: 20px;" class="bg-white">
                <!-- Progress Steps -->
                <div class="px-6 pt-6 pb-2">
                    <div class="flex items-start justify-center gap-2 mb-8">
                        <div class="flex items-center flex-1 max-w-xs">
                            <div class="step-indicator active" data-step="1">
                                <div class="step-number">1</div>
                                <div class="step-label" style="text-align: center; max-width: 240px;">Seleccionar Tipo de Solicitud</div>
                            </div>
                            <div class="step-line"></div>
                        </div>
                        <div class="flex items-center flex-1 max-w-xs">
                            <div class="step-line"></div>
                            <div class="step-indicator" data-step="2">
                                <div class="step-number">2</div>
                                <div class="step-label" style="text-align: center; max-width: 240px;">Configurar Estructura del Radicado</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tab Content -->
                <div class="px-6 pb-4">
                    <!-- Tab 1: Información Personal -->
                    <div id="tab1" class="tab-content active">
                        <div class="grid grid-cols-3 md:grid-cols-2 gap-4">
                
                            <!-- Tipo de  solicitud -->
                            <div class="col-span-3">
                                <label class="block text-sm font-medium text-gray-700 mb-1">
                                    Tipo de Solicitud <span class="text-red-500">*</span>
                                </label>
                                <select name="tipo_solicitud" id="tipo_solicitud" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                    
                                </select>
                                <span class="error-message text-red-500 text-xs hidden"></span>
                            </div>

                            <!-- Info basica -->
                            <div class="col-span-3">
                                <label class="block text-sm font-medium text-gray-700 mb-1">
                                    Información Básica del tipo de solicitud <span class="text-red-500">*</span>
                                </label>
                            </div>
                            <div class="col-span-1">
                                <label class="block text-sm font-medium text-gray-700 mb-1">
                                    Código <span class="text-red-500">*</span>
                                </label>
                                <input type="text" name="codigo_tipo_solicitud" id="codigo_tipo_solicitud" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                            </div>
                            <div class="col-span-2">
                                <label class="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre <span class="text-red-500">*</span>
                                </label>
                                <input type="text" name="nombre_tipo_solicitud" id="nombre_tipo_solicitud" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                            </div>
                            <div class="col-span-1">
                                <label class="block text-sm font-medium text-gray-700 mb-1">
                                    Categoría <span class="text-red-500">*</span>
                                </label>
                                <input type="text" name="categoria_tipo_solicitud" id="categoria_tipo_solicitud" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                            </div>
                            <div class="col-span-1">
                                <label class="block text-sm font-medium text-gray-700 mb-1">
                                    Área Responsable <span class="text-red-500">*</span>
                                </label>
                                <input type="text" name="area_responsable_tipo_solicitud" id="area_responsable_tipo_solicitud" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                            </div>
                            <div class="col-span-1">
                                <label class="block text-sm font-medium text-gray-700 mb-1">
                                    Total de solicitudes históricas de este tipo <span class="text-red-500">*</span>
                                </label>
                                <input type="number" name="total_solicitudes_historicas_tipo_solicitud" id="total_solicitudes_historicas_tipo_solicitud" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                            </div>
                            <div class="col-span-3">
                                <label class="block text-sm font-medium text-gray-700 mb-1">
                                    Descripción <span class="text-red-500">*</span>
                                </label>
                                <textarea name="descripcion_tipo_solicitud" id="descripcion_tipo_solicitud" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required></textarea>
                            </div>

                            <div class="col-span-3">
                                <!-- si tiene solicitudes y no esta configurado, mostrar un mensaje -->
                                <div id="mensajeNoConfigurado">
                                    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                        <h4 class="font-semibold text-yellow-800 mb-2">Tipo de Solicitud no configurado</h4>
                                        <p class="text-sm text-yellow-700">Este tipo de solicitud tiene solicitudes radicadas y no está configurado. Continúe para configurar el radicado.</p>
                                    </div>
                                </div>

                                <!-- si no tiene solicitudes, mostrar un mensaje -->
                                <div id="mensajeNoSolicitudes" class="mt-2">
                                    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4" style="display: flex; align-items: center; gap: 10px;">
                                        <input style="transform: scale(1.8);" type="checkbox" name="marcar_para_generar_radicados_retroactivos" checked id="marcar_para_generar_radicados_retroactivos" class="w-4 h-4 text-blue-600 focus:ring-blue-500">
                                        <h4  style="margin-bottom: 0;" class="font-semibold text-yellow-800 mb-2">Marcar para generar radicados retroactivos</h4>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Tab 2: Información La bórdenes de trabajo -->
                    <div id="tab2" class="tab-content hidden">
                        <div class="grid grid-cols-2 gap-4">
                            <div class="col-span-1">
                                <label class="block text-sm font-medium text-gray-700 mb-1">
                                    Código del radicado <span class="text-red-500">*</span>
                                </label>
                                <input type="text" name="codigo_radicado" id="codigo_radicado" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                            </div>
                            <div class="col-span-1">
                                <label class="block text-sm font-medium text-gray-700 mb-1">
                                    Vista Previa de la estructura del radicado <span class="text-red-500">*</span>
                                </label>
                                <input type="text" name="vista_previa_radicado" id="vista_previa_radicado" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required readonly>
                            </div>
                            <!-- Separador -->
                            <div class="col-span-2 grid grid-cols-2 gap-4">
                                <div class="col-span-1">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        Separador <span class="text-red-500">*</span>
                                    </label>
                                    <select onchange="cambiarSeparador(this.value)" name="separador" id="separador" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                                        <option value="-">Guión bajo</option>
                                        <option value="_">Guión bajo</option>
                                        <option value=".">Punto</option>
                                        <option value="/">Diagonal o barra</option>
                                        <option value="">Sin separador</option>
                                        <option value="custom">Personalizado</option>
                                    </select>
                                    <span class="error-message text-red-500 text-xs hidden"></span>
                                </div>
                                <div id="separador_personalizado_container" class="col-span-1" style="display: none;">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        Separador personalizado <span class="text-red-500">*</span>
                                    </label>
                                    <input maxlength="1" type="text" name="separador_personalizado" id="separador_personalizado"  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Ingrese el separador personalizado" oninput="cambiarSeparadorPersonalizado(this.value)">
                                    <span class="error-message text-red-500 text-xs hidden"></span>
                                </div>
                            </div>

                            <!-- Agregar Año a la vista previa del radicado -->
                            <div class="col-span-1 border border-gray-300 rounded-lg p-2">
                                <div style="display: flex; align-items: center; gap: 20px; width: 100%;">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        ¿Desea agregar el año a al radicado?
                                    </label>
                                    <input style="transform: scale(1.8);" checked onclick="cambiarAgregarAnoAVistaPreviaRadicado()" type="checkbox" name="agregar_ano_a_vista_previa_radicado" id="agregar_ano_a_vista_previa_radicado" class="w-4 h-4 text-blue-600 focus:ring-blue-500">
                                </div>
                                <!-- Numero de digitos que desea agregar del año -->
                                <div id="numero_digitos_ano_container" class="mt-2" style="display: block;">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        Número de dígitos que desea agregar del año
                                    </label>
                                    <select onchange="generarVistaPreviaRadicado()" name="numero_digitos_ano" id="numero_digitos_ano" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                        <option value="2">2 Digitos ({{ date('y') }})</option>
                                        <option selected value="4">4 Digitos ({{ date('Y') }})</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Modal Footer -->
                <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between" style="border-bottom-left-radius: 30px; border-bottom-right-radius: 30px;">
                    <button type="button" id="prevButton" onclick="anteriorTab()"
                        class="hidden px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                        Anterior
                    </button>
                    <div class="flex-1"></div>
                    <div class="flex gap-2">
                        <button type="button" onclick="cerrarModalConConfirmacion()"
                            class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                            Cancelar
                        </button>
                        <button type="button" id="nextButton" onclick="siguienteTab()"
                            class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                            Siguiente
                        </button>
                        <button type="submit" id="submitButton"
                            class="hidden px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                            Guardar Usuario
                        </button>
                    </div>
                </div>
            </form>
        </div>
    </div>


    @push('styles')
    <link rel="stylesheet" href="{{ asset('css/admin/usuarios-modal.css') }}">
    <link href="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css" rel="stylesheet" />
    @endpush

    @push('scripts')
    <script src="{{ asset('js/admin/radicados-consecutivos.js') }}"></script>

    <!-- JS -->
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js"></script>
    @endpush
</x-app-layout>
