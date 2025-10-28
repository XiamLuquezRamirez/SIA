<x-app-layout>
    <x-slot name="title">Editar Plantilla - {{ $plantilla->nombre }}</x-slot>

    @push('styles')
    <link rel="stylesheet" href="{{ asset('css/admin/plantillas-documentos.css') }}?v={{ time() }}">
    <!-- CodeMirror CSS -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/codemirror.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/theme/monokai.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/addon/hint/show-hint.min.css">
    @endpush

    <div class="container mx-auto px-4 py-6">
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
                    <li>
                        <div class="flex items-center">
                            <svg class="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path>
                            </svg>
                            <a href="{{ route('admin.configuracion.documentos.plantillas') }}" class="text-gray-500 hover:text-blue-600">Plantillas de Documentos</a>
                        </div>
                    </li>
                    <li aria-current="page">
                        <div class="flex items-center">
                            <svg class="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path>
                            </svg>
                            <span class="text-gray-700 font-medium">Editar Plantilla</span>
                        </div>
                    </li>
                </ol>
            </nav>

            <!-- Título y Acciones -->
            <div class="flex justify-between items-start">
                <div>
                    <h1 class="text-2xl font-bold text-gray-800">Editar Plantilla: {{ $plantilla->nombre }}</h1>
                    <p class="text-gray-600 text-sm mt-1">Modifica la plantilla para generar documentos PDF</p>
                </div>
                <div class="flex gap-2">
                    <a href="{{ route('admin.configuracion.documentos.plantillas') }}" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                        </svg>
                        Volver
                    </a>
                    <button onclick="guardarPlantilla()" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
                        </svg>
                        Guardar Cambios
                    </button>
                    <button onclick="vistaPrevia()" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                        </svg>
                        Vista Previa
                    </button>
                </div>
            </div>
        </div>

        <form id="formPlantilla" data-plantilla-id="{{ $plantilla->id }}">
            <input type="hidden" name="_method" value="PUT">

            <!-- Información Básica -->
            <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Información Básica</h3>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Nombre de la Plantilla *</label>
                        <input type="text" name="nombre" id="nombre" required value="{{ $plantilla->nombre }}"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Ej: Certificado de Nomenclatura">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Tipo de Documento *</label>
                        <select name="tipo_documento" id="tipo_documento" required
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            <option value="">Seleccione un tipo</option>
                            <option value="certificado" {{ $plantilla->tipo_documento == 'certificado' ? 'selected' : '' }}>Certificado</option>
                            <option value="concepto" {{ $plantilla->tipo_documento == 'concepto' ? 'selected' : '' }}>Concepto</option>
                            <option value="acta" {{ $plantilla->tipo_documento == 'acta' ? 'selected' : '' }}>Acta</option>
                            <option value="oficio" {{ $plantilla->tipo_documento == 'oficio' ? 'selected' : '' }}>Oficio</option>
                        </select>
                    </div>

                    <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                        <textarea name="descripcion" id="descripcion" rows="3"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Descripción breve de la plantilla y su propósito">{{ $plantilla->descripcion }}</textarea>
                    </div>

                    <div>
                        <label class="flex items-center">
                            <input type="checkbox" name="activo" id="activo" {{ $plantilla->activo ? 'checked' : '' }} class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                            <span class="ml-2 text-sm text-gray-700">Plantilla activa</span>
                        </label>
                    </div>
                </div>
            </div>

            <!-- Editor de Contenido -->
            <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold text-gray-900">Contenido del Documento</h3>
                    <button type="button" onclick="mostrarVariablesDisponibles()" class="text-blue-600 hover:text-blue-700 text-sm font-medium">
                        Ver Variables Disponibles
                    </button>
                </div>

                <!-- Tabs -->
                <div class="border-b border-gray-200 mb-4">
                    <nav class="-mb-px flex space-x-8">
                        <button type="button" class="tab-btn active" data-tab="contenido" onclick="cambiarTab(event, 'contenido')">
                            <span class="text-lg mr-2">📄</span> Contenido Principal
                        </button>
                        <button type="button" class="tab-btn" data-tab="encabezado" onclick="cambiarTab(event, 'encabezado')">
                            <span class="text-lg mr-2">🔝</span> Encabezado
                        </button>
                        <button type="button" class="tab-btn" data-tab="pie" onclick="cambiarTab(event, 'pie')">
                            <span class="text-lg mr-2">🔽</span> Pie de Página
                        </button>
                        <button type="button" class="tab-btn" data-tab="estilos" onclick="cambiarTab(event, 'estilos')">
                            <span class="text-lg mr-2">🎨</span> Estilos CSS
                        </button>
                    </nav>
                </div>

                <!-- Tab Contenido Principal -->
                <div id="tab-contenido" class="tab-content active">
                    <div class="mb-2">
                        <label class="block text-sm font-medium text-gray-700 mb-2">HTML del Contenido Principal *</label>
                        <p class="text-xs text-gray-500 mb-2">Usa variables con la sintaxis: <code class="bg-gray-100 px-2 py-1 rounded">{{'{{'}}nombre_variable{{'}}'}}</code></p>
                    </div>
                    <textarea id="contenido_html" name="contenido_html" class="w-full" style="height: 400px;">{{ $plantilla->contenido_html }}</textarea>
                </div>

                <!-- Tab Encabezado -->
                <div id="tab-encabezado" class="tab-content" style="display: none;">
                    <div class="mb-2">
                        <label class="block text-sm font-medium text-gray-700 mb-2">HTML del Encabezado</label>
                        <p class="text-xs text-gray-500 mb-2">Este contenido aparecerá en la parte superior de cada página</p>
                    </div>
                    <textarea id="encabezado_html" name="encabezado_html" class="w-full" style="height: 400px;">{{ $plantilla->encabezado_html }}</textarea>
                </div>

                <!-- Tab Pie de Página -->
                <div id="tab-pie" class="tab-content" style="display: none;">
                    <div class="mb-2">
                        <label class="block text-sm font-medium text-gray-700 mb-2">HTML del Pie de Página</label>
                        <p class="text-xs text-gray-500 mb-2">Este contenido aparecerá en la parte inferior de cada página</p>
                    </div>
                    <textarea id="pie_pagina_html" name="pie_pagina_html" class="w-full" style="height: 400px;">{{ $plantilla->pie_pagina_html }}</textarea>
                </div>

                <!-- Tab Estilos CSS -->
                <div id="tab-estilos" class="tab-content" style="display: none;">
                    <div class="mb-2">
                        <label class="block text-sm font-medium text-gray-700 mb-2">CSS Personalizado</label>
                        <p class="text-xs text-gray-500 mb-2">Estilos CSS para personalizar el documento (opcional)</p>
                    </div>
                    <textarea id="contenido_css" name="contenido_css" class="w-full" style="height: 400px;">{{ $plantilla->contenido_css }}</textarea>
                </div>
            </div>

            <!-- Configuración de Página -->
            <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Configuración de Página</h3>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Orientación</label>
                        <select name="orientacion" id="orientacion"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            <option value="vertical" {{ $plantilla->orientacion == 'vertical' ? 'selected' : '' }}>Vertical (Portrait)</option>
                            <option value="horizontal" {{ $plantilla->orientacion == 'horizontal' ? 'selected' : '' }}>Horizontal (Landscape)</option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Tamaño de Página</label>
                        <select name="tamano_pagina" id="tamano_pagina"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            <option value="carta" {{ $plantilla->tamano_pagina == 'carta' ? 'selected' : '' }}>Carta (Letter)</option>
                            <option value="oficio" {{ $plantilla->tamano_pagina == 'oficio' ? 'selected' : '' }}>Oficio (Legal)</option>
                            <option value="a4" {{ $plantilla->tamano_pagina == 'a4' ? 'selected' : '' }}>A4</option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Margen Superior (mm)</label>
                        <input type="number" name="margen_superior" id="margen_superior" value="{{ $plantilla->margen_superior }}" min="0" max="100"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Margen Inferior (mm)</label>
                        <input type="number" name="margen_inferior" id="margen_inferior" value="{{ $plantilla->margen_inferior }}" min="0" max="100"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Margen Izquierdo (mm)</label>
                        <input type="number" name="margen_izquierdo" id="margen_izquierdo" value="{{ $plantilla->margen_izquierdo }}" min="0" max="100"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Margen Derecho (mm)</label>
                        <input type="number" name="margen_derecho" id="margen_derecho" value="{{ $plantilla->margen_derecho }}" min="0" max="100"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    </div>
                </div>
            </div>

            <!-- Variables Obligatorias -->
            <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Variables Obligatorias</h3>
                <p class="text-sm text-gray-600 mb-4">Selecciona las variables que son obligatorias para esta plantilla</p>

                <div id="variables-obligatorias-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <!-- Se llenará dinámicamente con las variables detectadas -->
                </div>
            </div>

            <!-- Estadísticas de Uso (solo en edición) -->
            <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Estadísticas de Uso</h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="bg-blue-50 rounded-lg p-4">
                        <div class="text-sm text-blue-600 font-medium">Veces Usado</div>
                        <div class="text-2xl font-bold text-blue-900 mt-1">{{ $plantilla->veces_usado }}</div>
                    </div>
                    <div class="bg-green-50 rounded-lg p-4">
                        <div class="text-sm text-green-600 font-medium">Tipos de Solicitud Asociados</div>
                        <div class="text-2xl font-bold text-green-900 mt-1">{{ $plantilla->tiposSolicitud()->count() }}</div>
                    </div>
                    <div class="bg-purple-50 rounded-lg p-4">
                        <div class="text-sm text-purple-600 font-medium">Última Generación</div>
                        <div class="text-sm font-medium text-purple-900 mt-1">
                            {{ $plantilla->ultima_generacion ? $plantilla->ultima_generacion->format('d/m/Y H:i') : 'Nunca' }}
                        </div>
                    </div>
                </div>
            </div>
        </form>
    </div>

    <!-- Modal: Variables Disponibles (mismo que en create.blade.php) -->
    <div id="modalVariables" class="hidden fixed inset-0 bg-gray-900 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-medium leading-6 text-gray-900">Variables Disponibles</h3>
                <button onclick="cerrarModalVariables()" class="text-gray-400 hover:text-gray-600">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>

            <div class="mt-4 max-h-[600px] overflow-y-auto">
                <div class="space-y-6">
                    <!-- Solicitante -->
                    <div>
                        <h4 class="font-semibold text-gray-900 mb-3 flex items-center">
                            <span class="text-xl mr-2">👤</span> Datos del Solicitante
                        </h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div class="variable-item" onclick="copiarVariable('solicitante.nombre_completo')">
                                <code>{{'{{'}}solicitante.nombre_completo{{'}}'}}</code>
                                <div class="variable-desc">Nombre completo del solicitante</div>
                            </div>
                            <div class="variable-item" onclick="copiarVariable('solicitante.tipo_documento')">
                                <code>{{'{{'}}solicitante.tipo_documento{{'}}'}}</code>
                                <div class="variable-desc">Tipo de documento</div>
                            </div>
                            <div class="variable-item" onclick="copiarVariable('solicitante.numero_documento')">
                                <code>{{'{{'}}solicitante.numero_documento{{'}}'}}</code>
                                <div class="variable-desc">Número de documento</div>
                            </div>
                            <div class="variable-item" onclick="copiarVariable('solicitante.email')">
                                <code>{{'{{'}}solicitante.email{{'}}'}}</code>
                                <div class="variable-desc">Correo electrónico</div>
                            </div>
                            <div class="variable-item" onclick="copiarVariable('solicitante.telefono')">
                                <code>{{'{{'}}solicitante.telefono{{'}}'}}</code>
                                <div class="variable-desc">Teléfono</div>
                            </div>
                            <div class="variable-item" onclick="copiarVariable('solicitante.direccion')">
                                <code>{{'{{'}}solicitante.direccion{{'}}'}}</code>
                                <div class="variable-desc">Dirección</div>
                            </div>
                        </div>
                    </div>

                    <!-- Solicitud -->
                    <div>
                        <h4 class="font-semibold text-gray-900 mb-3 flex items-center">
                            <span class="text-xl mr-2">📋</span> Datos de la Solicitud
                        </h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div class="variable-item" onclick="copiarVariable('solicitud.radicado')">
                                <code>{{'{{'}}solicitud.radicado{{'}}'}}</code>
                                <div class="variable-desc">Número de radicado</div>
                            </div>
                            <div class="variable-item" onclick="copiarVariable('solicitud.fecha_radicacion')">
                                <code>{{'{{'}}solicitud.fecha_radicacion{{'}}'}}</code>
                                <div class="variable-desc">Fecha de radicación</div>
                            </div>
                            <div class="variable-item" onclick="copiarVariable('solicitud.estado')">
                                <code>{{'{{'}}solicitud.estado{{'}}'}}</code>
                                <div class="variable-desc">Estado actual</div>
                            </div>
                            <div class="variable-item" onclick="copiarVariable('solicitud.prioridad')">
                                <code>{{'{{'}}solicitud.prioridad{{'}}'}}</code>
                                <div class="variable-desc">Prioridad de la solicitud</div>
                            </div>
                        </div>
                    </div>

                    <!-- Sistema -->
                    <div>
                        <h4 class="font-semibold text-gray-900 mb-3 flex items-center">
                            <span class="text-xl mr-2">🏛️</span> Datos del Sistema
                        </h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div class="variable-item" onclick="copiarVariable('sistema.entidad')">
                                <code>{{'{{'}}sistema.entidad{{'}}'}}</code>
                                <div class="variable-desc">Nombre de la entidad</div>
                            </div>
                            <div class="variable-item" onclick="copiarVariable('sistema.dependencia')">
                                <code>{{'{{'}}sistema.dependencia{{'}}'}}</code>
                                <div class="variable-desc">Dependencia</div>
                            </div>
                            <div class="variable-item" onclick="copiarVariable('sistema.ciudad')">
                                <code>{{'{{'}}sistema.ciudad{{'}}'}}</code>
                                <div class="variable-desc">Ciudad</div>
                            </div>
                            <div class="variable-item" onclick="copiarVariable('sistema.departamento')">
                                <code>{{'{{'}}sistema.departamento{{'}}'}}</code>
                                <div class="variable-desc">Departamento</div>
                            </div>
                            <div class="variable-item" onclick="copiarVariable('sistema.fecha_actual')">
                                <code>{{'{{'}}sistema.fecha_actual{{'}}'}}</code>
                                <div class="variable-desc">Fecha actual</div>
                            </div>
                            <div class="variable-item" onclick="copiarVariable('sistema.fecha_actual_letras')">
                                <code>{{'{{'}}sistema.fecha_actual_letras{{'}}'}}</code>
                                <div class="variable-desc">Fecha actual en letras</div>
                            </div>
                        </div>
                    </div>

                    <!-- Funcionario -->
                    <div>
                        <h4 class="font-semibold text-gray-900 mb-3 flex items-center">
                            <span class="text-xl mr-2">👨‍💼</span> Datos del Funcionario
                        </h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div class="variable-item" onclick="copiarVariable('funcionario.nombre_completo')">
                                <code>{{'{{'}}funcionario.nombre_completo{{'}}'}}</code>
                                <div class="variable-desc">Nombre del funcionario</div>
                            </div>
                            <div class="variable-item" onclick="copiarVariable('funcionario.cargo')">
                                <code>{{'{{'}}funcionario.cargo{{'}}'}}</code>
                                <div class="variable-desc">Cargo</div>
                            </div>
                            <div class="variable-item" onclick="copiarVariable('funcionario.area')">
                                <code>{{'{{'}}funcionario.area{{'}}'}}</code>
                                <div class="variable-desc">Área o dependencia</div>
                            </div>
                        </div>
                    </div>

                    <!-- Campos Personalizados -->
                    <div>
                        <h4 class="font-semibold text-gray-900 mb-3 flex items-center">
                            <span class="text-xl mr-2">📝</span> Campos Personalizados
                        </h4>
                        <p class="text-sm text-gray-600 mb-3">Usa <code class="bg-gray-100 px-2 py-1 rounded">{{'{{'}}campo.nombre_campo{{'}}'}}</code> para acceder a campos personalizados</p>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div class="variable-item" onclick="copiarVariable('campo.direccion_predio')">
                                <code>{{'{{'}}campo.direccion_predio{{'}}'}}</code>
                                <div class="variable-desc">Ejemplo: Dirección del predio</div>
                            </div>
                            <div class="variable-item" onclick="copiarVariable('campo.barrio')">
                                <code>{{'{{'}}campo.barrio{{'}}'}}</code>
                                <div class="variable-desc">Ejemplo: Barrio</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="mt-6 flex justify-end">
                <button onclick="cerrarModalVariables()" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Cerrar
                </button>
            </div>
        </div>
    </div>

    @push('scripts')
    <!-- CodeMirror JS -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/codemirror.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/mode/xml/xml.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/mode/css/css.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/mode/htmlmixed/htmlmixed.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/addon/hint/show-hint.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/addon/hint/xml-hint.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/addon/hint/html-hint.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/addon/hint/css-hint.min.js"></script>

    <script>
        // Pasar variables obligatorias existentes desde el servidor
        window.variablesObligatoriasExistentes = @json($plantilla->variables_obligatorias ?? []);
    </script>
    <script src="{{ asset('js/admin/plantillas-documentos-editor.js') }}?v={{ time() }}"></script>
    @endpush
</x-app-layout>
