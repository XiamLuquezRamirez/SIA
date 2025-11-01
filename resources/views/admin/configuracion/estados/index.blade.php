<x-app-layout>
    <x-slot name="title">Estados de Solicitud</x-slot>

    @push('styles')
    <link rel="stylesheet" href="{{ asset('css/admin/estados-solicitud.css') }}?v={{ time() }}">
    @endpush
<div class="container mx-auto px-4 py-6">
    {{-- Header --}}
    <div class="mb-6">
        {{-- Breadcrumb --}}
        <nav class="flex mb-4" aria-label="Breadcrumb">
            <ol class="inline-flex items-center space-x-1 md:space-x-3">
                <li class="inline-flex items-center">
                    <a href="{{ route('admin.dashboard') }}" class="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600">
                        <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path></svg>
                        Dashboard
                    </a>
                </li>
                <li>
                    <div class="flex items-center">
                        <svg class="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path></svg>
                        <span class="ml-1 text-sm font-medium text-gray-500 md:ml-2">Configuración</span>
                    </div>
                </li>
                <li aria-current="page">
                    <div class="flex items-center">
                        <svg class="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path></svg>
                        <span class="ml-1 text-sm font-medium text-gray-700 md:ml-2">Estados de Solicitud</span>
                    </div>
                </li>
            </ol>
        </nav>

        {{-- Título y botones --}}
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h1 class="text-2xl font-bold text-gray-800">Estados de Solicitud</h1>
                <p class="text-gray-600 text-sm mt-1">Defina las etapas del ciclo de vida de las solicitudes</p>
            </div>
            <div class="flex gap-2">
                @can('estados.crear')
                <button onclick="abrirModalNuevoEstado()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                    Nuevo Estado
                </button>
                @endcan
                @can('estados.ver_diagrama')
                <button onclick="verDiagramaFlujo()" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                    Ver Flujo
                </button>
                @endcan
            </div>
        </div>
    </div>

    {{-- Pestañas de filtro --}}
    <div class="mb-6">
        <div class="border-b border-gray-200">
            <nav class="-mb-px flex space-x-8">
                <button onclick="filtrarPorTipo('todos')" class="tab-filter active whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
                    Todos
                </button>
                <button onclick="filtrarPorTipo('inicial')" class="tab-filter whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
                    Iniciales
                </button>
                <button onclick="filtrarPorTipo('proceso')" class="tab-filter whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
                    En Proceso
                </button>
                <button onclick="filtrarPorTipo('final')" class="tab-filter whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
                    Finales
                </button>
                <button onclick="filtrarPorTipo('bloqueante')" class="tab-filter whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
                    Bloqueantes
                </button>
            </nav>
        </div>
    </div>

    {{-- Barra de búsqueda --}}
    <div class="mb-6">
        <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
            </div>
            <input type="text" id="buscarEstado" onkeyup="buscarEstados()" class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Buscar por código, nombre o descripción...">
        </div>
    </div>

    {{-- Lista de estados --}}
    <div id="estadosContainer">
        <div class="flex justify-center items-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    </div>
</div>

{{-- Modal Wizard para Crear/Editar Estado --}}
<div id="wizardModal" class="hidden fixed inset-0 bg-gray-900 bg-opacity-75 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen px-4">
        <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full">
            {{-- Header del modal --}}
            <div class="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-lg">
                <div class="flex justify-between items-center">
                    <h3 class="text-xl font-bold text-white" id="wizardTitulo">Nuevo Estado</h3>
                    <button onclick="cerrarWizard()" class="text-white hover:text-gray-200">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
            </div>

            {{-- Indicador de pasos --}}
            <div class="px-6 py-4 border-b">
                <div class="flex justify-between items-center">
                    <div class="flex-1 wizard-step active" data-step="1">
                        <div class="flex items-center">
                            <div class="step-circle">1</div>
                            <span class="ml-2 text-sm font-medium">Información Básica</span>
                        </div>
                    </div>
                    <div class="flex-1 wizard-step" data-step="2">
                        <div class="flex items-center">
                            <div class="step-circle">2</div>
                            <span class="ml-2 text-sm font-medium">Comportamiento</span>
                        </div>
                    </div>
                    <div class="flex-1 wizard-step" data-step="3">
                        <div class="flex items-center">
                            <div class="step-circle">3</div>
                            <span class="ml-2 text-sm font-medium">Flujo</span>
                        </div>
                    </div>
                    <div class="flex-1 wizard-step" data-step="4">
                        <div class="flex items-center">
                            <div class="step-circle">4</div>
                            <span class="ml-2 text-sm font-medium">Visual</span>
                        </div>
                    </div>
                    <div class="flex-1 wizard-step" data-step="5">
                        <div class="flex items-center">
                            <div class="step-circle">5</div>
                            <span class="ml-2 text-sm font-medium">Resumen</span>
                        </div>
                    </div>
                </div>
            </div>

            {{-- Contenido del wizard --}}
            <div id="wizardContent" class="px-6 py-6 min-h-[400px]">
                {{-- Los pasos se cargarán dinámicamente con JavaScript --}}
            </div>

            {{-- Footer del modal --}}
            <div class="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-between">
               
            <button onclick="cerrarWizard()" class="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg transition-colors">
                        Cancelar
                    </button>
       
                <div class="flex-1"></div>
                <div class="flex gap-2">
                <button onclick="pasoAnterior()" id="btnAnterior" class="hidden bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                    </svg> 
                    Anterior
                </button>
                    <button onclick="siguientePaso()" id="btnSiguiente" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2 justify-center">
                    Siguiente
                    <svg width="20px" height="20px" fill="#fffff" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" data-name="Layer 1"><path d="M17.92,11.62a1,1,0,0,0-.21-.33l-5-5a1,1,0,0,0-1.42,1.42L14.59,11H7a1,1,0,0,0,0,2h7.59l-3.3,3.29a1,1,0,0,0,0,1.42,1,1,0,0,0,1.42,0l5-5a1,1,0,0,0,.21-.33A1,1,0,0,0,17.92,11.62Z"/></svg>
                     
                    </button>
                    <button onclick="guardarEstado()" id="btnGuardar" class="hidden bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg> 
                        Guardar Estado
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>

{{-- Modal Diagrama de Flujo --}}
<div id="diagramaModal" class="hidden fixed inset-0 bg-gray-900 bg-opacity-75 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen px-4">
        <div class="bg-white rounded-lg shadow-xl max-w-6xl w-full">
            <div class="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 rounded-t-lg flex justify-between items-center">
                <h3 class="text-xl font-bold text-white">Diagrama de Flujo de Estados</h3>
                <button onclick="cerrarDiagrama()" class="text-white hover:text-gray-200">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
            <div id="diagramaContainer" class="p-6 bg-gray-50 min-h-[500px]">
                {{-- El diagrama se renderizará con JavaScript --}}
            </div>
        </div>
    </div>
</div>

{{-- Panel lateral de detalles --}}
<div id="panelDetalles" class="hidden fixed inset-y-0 right-0 top-16 w-96 bg-white shadow-2xl z-40 overflow-y-auto transform transition-transform duration-300">
    <div class="p-6">
        <div class="flex justify-between items-center mb-4 mt-2">
            <h3 class="text-lg font-bold text-gray-800">Detalles del Estado</h3>
            <button onclick="cerrarPanelDetalles()" class="text-gray-500 hover:text-gray-700">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        </div>
        <div id="contenidoDetalles">
            {{-- Se cargará dinámicamente --}}
        </div>
    </div>
</div>

<input type="hidden" id="rolesDisponibles" value='@json($roles)'>

@push('scripts')
<script src="{{ asset('js/admin/estados-solicitud.js') }}?v={{ time() }}"></script>
@endpush
</x-app-layout>
