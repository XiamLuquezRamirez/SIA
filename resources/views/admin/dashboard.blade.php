<x-app-layout>
    <x-slot name="title">Dashboard Administrativo</x-slot>

    <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900">Dashboard Administrativo</h1>
        <p class="text-gray-600">Bienvenido, {{ $user->nombre_completo }}</p>
    </div>

    <!-- Métricas -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <!-- Card 1 -->
        <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm text-gray-600">Total Solicitudes</p>
                    <p class="text-3xl font-bold text-gray-900">245</p>
                </div>
                <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg class="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"></path>
                        <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"></path>
                    </svg>
                </div>
            </div>
        </div>

        <!-- Card 2 -->
        <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm text-gray-600">En Proceso</p>
                    <p class="text-3xl font-bold text-gray-900">87</p>
                </div>
                <div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <svg class="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path>
                    </svg>
                </div>
            </div>
        </div>

        <!-- Card 3 -->
        <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm text-gray-600">Completadas</p>
                    <p class="text-3xl font-bold text-gray-900">142</p>
                </div>
                <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg class="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                    </svg>
                </div>
            </div>
        </div>

        <!-- Card 4 -->
        <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm text-gray-600">Usuarios Activos</p>
                    <p class="text-3xl font-bold text-gray-900">32</p>
                </div>
                <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg class="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"></path>
                    </svg>
                </div>
            </div>
        </div>
    </div>

    <!-- Tabla de Solicitudes Recientes -->
    <div class="bg-white rounded-lg shadow">
        <div class="p-6 border-b border-gray-200">
            <h2 class="text-xl font-semibold text-gray-900">Solicitudes Recientes</h2>
        </div>
        <div class="p-6">
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead>
                        <tr class="text-left text-sm text-gray-600 border-b">
                            <th class="pb-3">Folio</th>
                            <th class="pb-3">Ciudadano</th>
                            <th class="pb-3">Tipo</th>
                            <th class="pb-3">Fecha</th>
                            <th class="pb-3">Estado</th>
                            <th class="pb-3">Acciones</th>
                        </tr>
                    </thead>
                    <tbody class="text-sm">
                        <tr class="border-b hover:bg-gray-50">
                            <td class="py-3">#2025-001</td>
                            <td class="py-3">Juan Pérez</td>
                            <td class="py-3">Petición</td>
                            <td class="py-3">10/17/2025</td>
                            <td class="py-3">
                                <span class="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">En Proceso</span>
                            </td>
                            <td class="py-3">
                                <button class="text-blue-600 hover:text-blue-800">Ver</button>
                            </td>
                        </tr>
                        <tr class="border-b hover:bg-gray-50">
                            <td class="py-3">#2025-002</td>
                            <td class="py-3">María González</td>
                            <td class="py-3">Queja</td>
                            <td class="py-3">10/17/2025</td>
                            <td class="py-3">
                                <span class="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Completada</span>
                            </td>
                            <td class="py-3">
                                <button class="text-blue-600 hover:text-blue-800">Ver</button>
                            </td>
                        </tr>
                        <tr class="border-b hover:bg-gray-50">
                            <td class="py-3">#2025-003</td>
                            <td class="py-3">Carlos Rodríguez</td>
                            <td class="py-3">Reclamo</td>
                            <td class="py-3">10/16/2025</td>
                            <td class="py-3">
                                <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">Recibida</span>
                            </td>
                            <td class="py-3">
                                <button class="text-blue-600 hover:text-blue-800">Ver</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

</x-app-layout>
