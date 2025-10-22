<x-app-layout>
    <x-slot name="title">
        Estados de Solicitud - Configuración
    </x-slot>

    <div class="container mx-auto px-4 py-6">
        <!-- Header -->
        <div class="mb-6">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900 flex items-center">
                        <span class="text-4xl mr-3">📊</span>
                        Estados de Solicitud
                    </h1>
                    <p class="text-gray-600 mt-2">
                        Configura los estados y flujos de trabajo de las solicitudes en el sistema
                    </p>
                </div>
                <button class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg flex items-center transition-colors shadow-md">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    Nuevo Estado
                </button>
            </div>
        </div>

        <!-- Contenido Principal -->
        <div class="bg-white rounded-lg shadow-md p-6">
            <div class="text-center py-12">
                <div class="text-6xl mb-4">📊</div>
                <h3 class="text-xl font-semibold text-gray-900 mb-2">Módulo en Desarrollo</h3>
                <p class="text-gray-600 mb-4">
                    La configuración de estados estará disponible próximamente.
                </p>
                <p class="text-sm text-gray-500">
                    Aquí podrás definir estados personalizados, flujos de trabajo y transiciones permitidas.
                </p>
            </div>
        </div>
    </div>
</x-app-layout>

