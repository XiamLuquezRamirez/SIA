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
              @if(auth()->user()->can('plantillas.crear'))
                <button onclick="abrirModalNuevaPlantilla()" class="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                    </svg>
                    Nueva Plantilla
                </button>
            @endif
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

        <!-- Contenedor con Grid/Lista y Paginación -->
        <div class="bg-white rounded-lg shadow-sm overflow-hidden">
            <!-- Contenedor de Plantillas (Grid) -->
            <div id="plantillasGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                <!-- Las plantillas se cargarán aquí dinámicamente -->
            </div>

            <!-- Contenedor de Plantillas (Lista) -->
            <div id="plantillasLista" class="hidden">
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
                            Mostrando <span id="showingFrom" class="font-medium">0</span> a <span id="showingTo" class="font-medium">0</span> de <span id="totalPlantillas" class="font-medium">0</span> resultados
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

    <!-- Modal: Crear/Editar Plantilla -->
    <div id="modalCrearPlantilla" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-11/12 max-w-7xl shadow-lg rounded-md bg-white">
            <!-- Header del Modal -->
            <div class="flex justify-between items-center pb-3 border-b">
                <div>
                    <h3 class="text-2xl font-bold text-gray-900">Crear Plantilla de Documento</h3>
                    <p class="text-sm text-gray-600 mt-1">Configure la plantilla para generar documentos automáticamente</p>
                </div>
                <button onclick="cerrarModalPlantilla()" class="text-gray-400 hover:text-gray-600">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>

            <!-- Contenido del Modal -->
            <div class="mt-4">
                <form id="formPlantilla" class="grid grid-cols-12 gap-6">
                    <!-- Columna Izquierda (30%) -->
                    <div class="col-span-12 lg:col-span-4 space-y-6">
                        <!-- Sección: Información -->
                        <div class="bg-gray-50 rounded-lg p-4">
                            <h4 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                Información
                            </h4>

                            <div class="space-y-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        Nombre de la Plantilla <span class="text-red-500">*</span>
                                    </label>
                                    <input type="text" id="nombrePlantilla" name="nombre" required
                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Ej: Certificado Laboral">
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        Tipo de Documento <span class="text-red-500">*</span>
                                    </label>
                                    <select id="tipoDocumento" name="tipo_documento" required
                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                        <option value="">Seleccione...</option>
                                        <option value="certificado">Certificado</option>
                                        <option value="concepto">Concepto</option>
                                        <option value="acta">Acta</option>
                                        <option value="oficio">Oficio</option>
                                    </select>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        Descripción
                                    </label>
                                    <textarea id="descripcionPlantilla" name="descripcion" rows="3"
                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Breve descripción de la plantilla..."></textarea>
                                </div>
                            </div>
                        </div>

                        <!-- Sección: Configuración de Página -->
                        <div class="bg-gray-50 rounded-lg p-4">
                            <h4 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
                                </svg>
                                Configuración de Página
                            </h4>

                            <div class="space-y-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Orientación</label>
                                    <div class="grid grid-cols-2 gap-2">
                                        <label class="flex items-center justify-center px-3 py-2 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                                            <input type="radio" name="orientacion" value="vertical" class="mr-2" checked>
                                            <span class="text-sm">Vertical</span>
                                        </label>
                                        <label class="flex items-center justify-center px-3 py-2 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                                            <input type="radio" name="orientacion" value="horizontal" class="mr-2">
                                            <span class="text-sm">Horizontal</span>
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Tamaño</label>
                                    <select name="tamano_pagina"
                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                        <option value="carta" selected>Carta (21.59 x 27.94 cm)</option>
                                        <option value="oficio">Oficio (21.59 x 35.56 cm)</option>
                                        <option value="a4">A4 (21 x 29.7 cm)</option>
                                    </select>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Márgenes (mm)</label>
                                    <div class="grid grid-cols-2 gap-3">
                                        <div>
                                            <label class="block text-xs text-gray-600 mb-1">Superior</label>
                                            <input type="number" name="margen_superior" value="25" min="0" max="100"
                                                class="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500">
                                        </div>
                                        <div>
                                            <label class="block text-xs text-gray-600 mb-1">Inferior</label>
                                            <input type="number" name="margen_inferior" value="25" min="0" max="100"
                                                class="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500">
                                        </div>
                                        <div>
                                            <label class="block text-xs text-gray-600 mb-1">Izquierdo</label>
                                            <input type="number" name="margen_izquierdo" value="25" min="0" max="100"
                                                class="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500">
                                        </div>
                                        <div>
                                            <label class="block text-xs text-gray-600 mb-1">Derecho</label>
                                            <input type="number" name="margen_derecho" value="25" min="0" max="100"
                                                class="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Sección: Variables Disponibles -->
                        <div class="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                            <h4 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"></path>
                                </svg>
                                Variables Disponibles
                            </h4>
                            <p class="text-xs text-gray-600 mb-3">Haga clic en una variable para insertarla en el cursor</p>

                            <!-- Acordeón de Variables -->
                            <div class="space-y-2">
                                <!-- Solicitante -->
                                <div class="border border-gray-200 rounded-lg overflow-hidden">
                                    <button type="button" onclick="toggleAccordion('vars-solicitante')"
                                        class="w-full px-3 py-2 bg-white hover:bg-gray-50 flex justify-between items-center text-left">
                                        <span class="font-medium text-sm text-gray-900">Solicitante</span>
                                        <svg class="w-4 h-4 transform transition-transform" id="icon-vars-solicitante" fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                                        </svg>
                                    </button>
                                    <div id="vars-solicitante" class="hidden px-3 py-2 bg-white border-t border-gray-200">
                                        <div class="space-y-1">
                                            <button type="button" onclick="insertarVariable('@{{solicitante.nombre_completo}}')"
                                                class="w-full text-left px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 rounded font-mono text-blue-700"
                                                title="Nombre completo del solicitante">
                                                @{{solicitante.nombre_completo}}
                                            </button>
                                            <button type="button" onclick="insertarVariable('@{{solicitante.documento}}')"
                                                class="w-full text-left px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 rounded font-mono text-blue-700"
                                                title="Documento de identidad">
                                                @{{solicitante.documento}}
                                            </button>
                                            <button type="button" onclick="insertarVariable('@{{solicitante.email}}')"
                                                class="w-full text-left px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 rounded font-mono text-blue-700"
                                                title="Correo electrónico">
                                                @{{solicitante.email}}
                                            </button>
                                            <button type="button" onclick="insertarVariable('@{{solicitante.telefono}}')"
                                                class="w-full text-left px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 rounded font-mono text-blue-700"
                                                title="Teléfono">
                                                @{{solicitante.telefono}}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <!-- Solicitud -->
                                <div class="border border-gray-200 rounded-lg overflow-hidden">
                                    <button type="button" onclick="toggleAccordion('vars-solicitud')"
                                        class="w-full px-3 py-2 bg-white hover:bg-gray-50 flex justify-between items-center text-left">
                                        <span class="font-medium text-sm text-gray-900">Solicitud</span>
                                        <svg class="w-4 h-4 transform transition-transform" id="icon-vars-solicitud" fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                                        </svg>
                                    </button>
                                    <div id="vars-solicitud" class="hidden px-3 py-2 bg-white border-t border-gray-200">
                                        <div class="space-y-1">
                                            <button type="button" onclick="insertarVariable('@{{solicitud.numero}}')"
                                                class="w-full text-left px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 rounded font-mono text-blue-700"
                                                title="Número de solicitud">
                                                @{{solicitud.numero}}
                                            </button>
                                            <button type="button" onclick="insertarVariable('@{{solicitud.fecha}}')"
                                                class="w-full text-left px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 rounded font-mono text-blue-700"
                                                title="Fecha de la solicitud">
                                                @{{solicitud.fecha}}
                                            </button>
                                            <button type="button" onclick="insertarVariable('@{{solicitud.tipo}}')"
                                                class="w-full text-left px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 rounded font-mono text-blue-700"
                                                title="Tipo de solicitud">
                                                @{{solicitud.tipo}}
                                            </button>
                                            <button type="button" onclick="insertarVariable('@{{solicitud.asunto}}')"
                                                class="w-full text-left px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 rounded font-mono text-blue-700"
                                                title="Asunto de la solicitud">
                                                @{{solicitud.asunto}}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <!-- Funcionario -->
                                <div class="border border-gray-200 rounded-lg overflow-hidden">
                                    <button type="button" onclick="toggleAccordion('vars-funcionario')"
                                        class="w-full px-3 py-2 bg-white hover:bg-gray-50 flex justify-between items-center text-left">
                                        <span class="font-medium text-sm text-gray-900">Funcionario</span>
                                        <svg class="w-4 h-4 transform transition-transform" id="icon-vars-funcionario" fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                                        </svg>
                                    </button>
                                    <div id="vars-funcionario" class="hidden px-3 py-2 bg-white border-t border-gray-200">
                                        <div class="space-y-1">
                                            <button type="button" onclick="insertarVariable('@{{funcionario.nombre}}')"
                                                class="w-full text-left px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 rounded font-mono text-blue-700"
                                                title="Nombre del funcionario">
                                                @{{funcionario.nombre}}
                                            </button>
                                            <button type="button" onclick="insertarVariable('@{{funcionario.cargo}}')"
                                                class="w-full text-left px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 rounded font-mono text-blue-700"
                                                title="Cargo del funcionario">
                                                @{{funcionario.cargo}}
                                            </button>
                                            <button type="button" onclick="insertarVariable('@{{funcionario.firma}}')"
                                                class="w-full text-left px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 rounded font-mono text-blue-700"
                                                title="Firma del funcionario">
                                                @{{funcionario.firma}}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <!-- Sistema -->
                                <div class="border border-gray-200 rounded-lg overflow-hidden">
                                    <button type="button" onclick="toggleAccordion('vars-sistema')"
                                        class="w-full px-3 py-2 bg-white hover:bg-gray-50 flex justify-between items-center text-left">
                                        <span class="font-medium text-sm text-gray-900">Sistema</span>
                                        <svg class="w-4 h-4 transform transition-transform" id="icon-vars-sistema" fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                                        </svg>
                                    </button>
                                    <div id="vars-sistema" class="hidden px-3 py-2 bg-white border-t border-gray-200">
                                        <div class="space-y-1">
                                            <button type="button" onclick="insertarVariable('@{{sistema.fecha_actual}}')"
                                                class="w-full text-left px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 rounded font-mono text-blue-700"
                                                title="Fecha actual">
                                                @{{sistema.fecha_actual}}
                                            </button>
                                            <button type="button" onclick="insertarVariable('@{{sistema.hora_actual}}')"
                                                class="w-full text-left px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 rounded font-mono text-blue-700"
                                                title="Hora actual">
                                                @{{sistema.hora_actual}}
                                            </button>
                                            <button type="button" onclick="insertarVariable('@{{sistema.entidad}}')"
                                                class="w-full text-left px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 rounded font-mono text-blue-700"
                                                title="Nombre de la entidad">
                                                @{{sistema.entidad}}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <!-- Consecutivos -->
                                <div class="border border-gray-200 rounded-lg overflow-hidden">
                                    <button type="button" onclick="toggleAccordion('vars-consecutivos')"
                                        class="w-full px-3 py-2 bg-white hover:bg-gray-50 flex justify-between items-center text-left">
                                        <span class="font-medium text-sm text-gray-900">Consecutivos</span>
                                        <svg class="w-4 h-4 transform transition-transform" id="icon-vars-consecutivos" fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                                        </svg>
                                    </button>
                                    <div id="vars-consecutivos" class="hidden px-3 py-2 bg-white border-t border-gray-200">
                                        <div class="space-y-1">
                                            <button type="button" onclick="insertarVariable('@{{consecutivo.numero}}')"
                                                class="w-full text-left px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 rounded font-mono text-blue-700"
                                                title="Número consecutivo">
                                                @{{consecutivo.numero}}
                                            </button>
                                            <button type="button" onclick="insertarVariable('@{{consecutivo.anio}}')"
                                                class="w-full text-left px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 rounded font-mono text-blue-700"
                                                title="Año del consecutivo">
                                                @{{consecutivo.anio}}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <!-- Campos Personalizados (dinámicos) -->
                                <div class="border border-gray-200 rounded-lg overflow-hidden">
                                    <button type="button" onclick="toggleAccordion('vars-campos-personalizados')"
                                        class="w-full px-3 py-2 bg-white hover:bg-gray-50 flex justify-between items-center text-left">
                                        <span class="font-medium text-sm text-gray-900 flex items-center">
                                            Campos Personalizados
                                            <span id="badge-campos-count" class="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">0</span>
                                        </span>
                                        <svg class="w-4 h-4 transform transition-transform" id="icon-vars-campos-personalizados" fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                                        </svg>
                                    </button>
                                    <div id="vars-campos-personalizados" class="hidden px-3 py-2 bg-white border-t border-gray-200">
                                        <div id="campos-personalizados-container" class="space-y-1">
                                            <div class="text-xs text-gray-500 text-center py-2">
                                                Cargando campos personalizados...
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Ayuda sobre Variables -->
                            <div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div class="flex items-start">
                                    <svg class="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                    <div class="text-xs text-blue-800">
                                        <p class="font-semibold mb-1">¿Cómo funcionan las variables?</p>
                                        <p class="mb-2">Las variables se reemplazan automáticamente con datos reales cuando se genera el documento:</p>
                                        <ul class="list-disc ml-4 space-y-1">
                                            <li><strong>Solicitante:</strong> Datos del ciudadano que realiza la solicitud</li>
                                            <li><strong>Solicitud:</strong> Información de la solicitud actual (número, fecha, tipo)</li>
                                            <li><strong>Funcionario:</strong> Datos del usuario que aprueba/genera el documento</li>
                                            <li><strong>Sistema:</strong> Información general (fecha actual, nombre de la entidad)</li>
                                            <li><strong>Campos Personalizados:</strong> Valores ingresados en el formulario de solicitud</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Columna Derecha (70%) -->
                    <div class="col-span-12 lg:col-span-8">
                        <div class="bg-gray-50 rounded-lg p-4 h-full">
                            <h4 class="text-lg font-semibold text-gray-900 mb-4">Editor de Contenido</h4>

                            <!-- Tabs del Editor -->
                            <div class="border-b border-gray-200 mb-4">
                                <nav class="-mb-px flex space-x-8">
                                    <button type="button" onclick="cambiarTabEditor('contenido')"
                                        id="tab-contenido"
                                        class="tab-editor-btn active whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm">
                                        Contenido Principal
                                    </button>
                                    <button type="button" onclick="cambiarTabEditor('encabezado')"
                                        id="tab-encabezado"
                                        class="tab-editor-btn whitespace-nowrap py-2 px-1 border-b-2 border-transparent font-medium text-sm">
                                        Encabezado
                                    </button>
                                    <button type="button" onclick="cambiarTabEditor('pie')"
                                        id="tab-pie"
                                        class="tab-editor-btn whitespace-nowrap py-2 px-1 border-b-2 border-transparent font-medium text-sm">
                                        Pie de Página
                                    </button>
                                </nav>
                            </div>

                            <!-- Editores -->
                            <div class="editor-container">
                                <div id="editor-contenido" class="editor-panel">
                                    <textarea id="contenidoHTML" name="contenido_html" class="tinymce-editor"></textarea>
                                </div>
                                <div id="editor-encabezado" class="editor-panel hidden">
                                    <textarea id="encabezadoHTML" name="encabezado_html" class="tinymce-editor"></textarea>
                                </div>
                                <div id="editor-pie" class="editor-panel hidden">
                                    <textarea id="piePaginaHTML" name="pie_pagina_html" class="tinymce-editor"></textarea>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>

            <!-- Footer del Modal -->
            <div class="flex justify-between items-center mt-6 pt-4 border-t">
                <button type="button" onclick="cerrarModalPlantilla()"
                    class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
                    Cancelar
                </button>
                <div class="flex gap-3">
                    <button type="button" onclick="guardarBorradorPlantilla()"
                        class="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition">
                        Guardar Borrador
                    </button>
                    <button type="button" onclick="vistaPreviaPlantilla()"
                        class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center">
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                        </svg>
                        Vista Previa
                    </button>
                    <button type="button" onclick="guardarPlantilla()"
                        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center">
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Guardar
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal: Vista Previa PDF (desde el editor) -->
    <div id="modalVistaPreviaPDF" class="hidden fixed inset-0 bg-gray-900 bg-opacity-75 z-50">
        <div class="flex items-center justify-center min-h-screen p-4">
            <div class="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-screen flex flex-col">
                <!-- Header -->
                <div class="flex justify-between items-center px-6 py-4 border-b">
                    <h3 class="text-xl font-bold text-gray-900">Vista Previa del Documento</h3>
                    <button onclick="cerrarModalVistaPrevia()" class="text-gray-400 hover:text-gray-600">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                <!-- Contenido -->
                <div id="contenidoVistaPrevia" class="flex-1 overflow-auto p-6 bg-gray-100">
                    <div class="bg-white shadow-lg mx-auto" style="width: 210mm; min-height: 297mm; padding: 25mm;">
                        <div id="preview-content">
                            <!-- El contenido del preview se cargará aquí -->
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div class="flex justify-end items-center px-6 py-4 border-t bg-gray-50">
                    <button onclick="cerrarModalVistaPrevia()"
                        class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal: Ver Plantilla Guardada -->
    <div id="modalPreviewPDF" class="hidden fixed inset-0 bg-gray-900 bg-opacity-75 z-50">
        <div class="flex items-center justify-center min-h-screen p-4">
            <div class="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-screen flex flex-col">
                <!-- Header -->
                <div class="flex justify-between items-center px-6 py-4 border-b">
                    <div>
                        <h3 class="text-xl font-bold text-gray-900">Vista Previa</h3>
                        <p id="preview-plantilla-nombre" class="text-sm text-gray-600 mt-1"></p>
                    </div>
                    <button onclick="cerrarModalPreviewPDF()" class="text-gray-400 hover:text-gray-600">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                <!-- Contenido -->
                <div class="flex-1 overflow-auto p-6 bg-gray-100">
                    <div class="bg-white shadow-lg mx-auto" style="width: 210mm; min-height: 297mm; padding: 25mm;">
                        <div id="preview-pdf-content">
                            <!-- El contenido del preview se cargará aquí -->
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div class="flex justify-between items-center px-6 py-4 border-t bg-gray-50">
                    <div class="text-sm text-gray-600">
                        <span class="flex items-center">
                            <svg class="w-4 h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            Vista previa con datos de ejemplo
                        </span>
                    </div>
                    <div class="flex gap-3">
                        <button onclick="descargarPDFPreview()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center">
                            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                            Descargar PDF
                        </button>
                        <button onclick="cerrarModalPreviewPDF()" class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition">
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    @push('scripts')
    <!-- TinyMCE desde CDN público (sin API key requerida) -->
    <script src="https://cdn.jsdelivr.net/npm/tinymce@6/tinymce.min.js" referrerpolicy="origin"></script>
    <script src="{{ asset('js/admin/plantillas-documentos.js') }}?v={{ time() }}"></script>
    @endpush
</x-app-layout>

