<x-app-layout>
    <x-slot name="title">Dashboard</x-slot>

    <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p class="text-gray-600">Bienvenido, {{ $user->nombre_completo }}</p>
    </div>

    <!-- Tarjetas de resumen -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Mis Tareas</h3>
            <p class="text-3xl font-bold text-blue-600">12</p>
            <p class="text-sm text-gray-500 mt-2">Tareas pendientes</p>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Solicitudes Asignadas</h3>
            <p class="text-3xl font-bold text-green-600">8</p>
            <p class="text-sm text-gray-500 mt-2">Requieren atención</p>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Completadas</h3>
            <p class="text-3xl font-bold text-purple-600">45</p>
            <p class="text-sm text-gray-500 mt-2">Este mes</p>
        </div>
    </div>

    <!-- Contenido principal -->
    <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Actividad Reciente</h2>
        <p class="text-gray-600">Aquí aparecerá tu actividad reciente en el sistema.</p>
    </div>

</x-app-layout>
