<x-app-layout>
    <x-slot name="title">
        Calendario de Festivos - Configuración
    </x-slot>

    <div class="container mx-auto px-4 py-6">
        <!-- Header -->
        <div class="mb-6">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900 flex items-center">
                        <span class="text-4xl mr-3">📅</span>
                        Calendario de Festivos
                    </h1>
                    <p class="text-gray-600 mt-2">
                        Administra los días festivos para el cálculo correcto de términos y fechas límite
                    </p>
                </div>
                <button class="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg flex items-center transition-colors shadow-md">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    Nuevo Festivo
                </button>
            </div>
        </div>

        <!-- Selector de Año -->
        <div class="mb-6">
            <div class="flex items-center gap-4">
                <label class="text-gray-700 font-medium">Año:</label>
                <select class="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="2024">2024</option>
                    <option value="2025" selected>2025</option>
                    <option value="2026">2026</option>
                </select>
                <button class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                    </svg>
                    Importar Festivos
                </button>
            </div>
        </div>

        <!-- Contenido Principal -->
        <div class="bg-white rounded-lg shadow-md p-6">
            <div class="text-center py-12">
                <div class="text-6xl mb-4">📅</div>
                <h3 class="text-xl font-semibold text-gray-900 mb-2">Módulo en Desarrollo</h3>
                <p class="text-gray-600 mb-4">
                    El calendario de festivos estará disponible próximamente.
                </p>
                <p class="text-sm text-gray-500">
                    Aquí podrás gestionar días festivos, feriados y calcular días hábiles para términos legales.
                </p>
            </div>
        </div>
    </div>
</x-app-layout>

