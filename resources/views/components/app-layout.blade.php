<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $title ?? 'Dashboard' }} - SIA OAPM</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>

    <!-- Alpine.js -->
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>

    <!-- SweetAlert2 -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css">
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

    <!-- Custom CSS -->
    <link rel="stylesheet" href="{{ asset('css/app.css') }}">

    @stack('styles')

    <!-- Custom JS -->
    <script src="{{ asset('js/app.js') }}" defer></script>
</head>
<body class="bg-gray-100" x-data="{ sidebarOpen: false }">

    <!-- Navbar -->
    <nav class="fixed top-0 z-50 w-full bg-white border-b border-gray-200">
        <div class="px-3 py-3 lg:px-5 lg:pl-3">
            <div class="flex items-center justify-between">
                <!-- Toggle Sidebar (Mobile) - Izquierda -->
                <div class="flex items-center w-20">
                    <button @click="sidebarOpen = !sidebarOpen" class="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100">
                        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"></path>
                        </svg>
                    </button>
                </div>

                <!-- Logo - Centro -->
                <div class="flex-1 flex items-center justify-center">
                    <a href="{{ route('dashboard') }}" class="flex items-center justify-center">
                        <img src="{{ asset('images/logo.png') }}" alt="Logo SIA" class="h-16 w-auto object-contain">
                    </a>
                </div>

                <!-- Usuario - Derecha -->
                <div class="flex items-center justify-end w-20" x-data="{ dropdownOpen: false }">
                    <button @click="dropdownOpen = !dropdownOpen" class="flex items-center text-sm bg-gray-800 rounded-full focus:ring-4 focus:ring-gray-300">
                        <div class="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold">
                            {{ substr(auth()->user()->nombre, 0, 1) }}{{ substr(auth()->user()->apellidos, 0, 1) }}
                        </div>
                    </button>

                    <!-- Dropdown -->
                    <div x-show="dropdownOpen" @click.away="dropdownOpen = false"
                         class="absolute right-0 top-14 z-50 my-4 text-base list-none bg-white divide-y divide-gray-100 rounded shadow">
                        <div class="px-4 py-3">
                            <p class="text-sm text-gray-900">{{ auth()->user()->nombre_completo }}</p>
                            <p class="text-sm font-medium text-gray-500 truncate">{{ auth()->user()->email }}</p>
                        </div>
                        <ul class="py-1">
                            <li>
                                <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Mi Perfil</a>
                            </li>
                            <li>
                                <form method="POST" action="{{ route('logout') }}">
                                    @csrf
                                    <button type="submit" class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                        Cerrar Sesión
                                    </button>
                                </form>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </nav>

    <!-- Sidebar -->
    <aside class="fixed top-0 left-0 z-40 w-64 h-screen pt-24 transition-transform bg-white border-r border-gray-200 md:translate-x-0"
           :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'">
        <div class="h-full px-3 pb-4 overflow-y-auto">
            <ul class="space-y-2 font-medium">
                <!-- Dashboard -->
                <li>
                    <a href="{{ route('dashboard') }}"
                       class="flex items-center p-2 rounded-lg hover:bg-gray-100 {{ request()->routeIs('dashboard') || request()->routeIs('admin.dashboard') ? 'bg-blue-50 text-blue-600' : 'text-gray-900' }}">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                        </svg>
                        <span class="ml-3">Dashboard</span>
                    </a>
                </li>

                @role('Super Administrador|Director OAPM')
                <!-- Administración -->
                <li x-data="{ open: {{ request()->routeIs('admin.*') && !request()->routeIs('admin.dashboard') ? 'true' : 'false' }} }">
                    <button @click="open = !open"
                            class="flex items-center justify-between w-full p-2 rounded-lg hover:bg-gray-100 {{ request()->routeIs('admin.*') && !request()->routeIs('admin.dashboard') ? 'bg-blue-50 text-blue-600' : 'text-gray-900' }}">
                        <div class="flex items-center">
                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"></path>
                            </svg>
                            <span class="ml-3">Administración</span>
                        </div>
                        <svg class="w-4 h-4 transition-transform" :class="open ? 'rotate-180' : ''" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                        </svg>
                    </button>
                    <ul x-show="open" x-transition class="pl-10 mt-2 space-y-1">
                        <li>
                            <a href="{{ route('admin.configurarSolicitudes.index') }}"
                               class="flex items-center p-2 rounded-lg hover:bg-gray-100 {{ request()->routeIs('admin.configurarSolicitudes.*') ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-700' }}">
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015-2.236V5a5 5 0 00-5-5zM3 15a1 1 0 001 1h12a1 1 0 100-2H4a1 1 0 00-1 1z" clip-rule="evenodd"></path>
                                </svg>
                                <span class="ml-2">Configurar Solicitudes</span>
                            </a>
                        </li>
                        <li>
                            <a href="{{ route('admin.dependencias.index') }}"
                               class="flex items-center p-2 rounded-lg hover:bg-gray-100 {{ request()->routeIs('admin.dependencias.*') ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-700' }}">
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015-2.236V5a5 5 0 00-5-5zM3 15a1 1 0 001 1h12a1 1 0 100-2H4a1 1 0 00-1 1z" clip-rule="evenodd"></path>
                                </svg>
                                <span class="ml-2">Dependencias</span>
                            </a>
                        </li>
                        <li>
                            <a href="{{ route('admin.usuarios.index') }}"
                               class="flex items-center p-2 rounded-lg hover:bg-gray-100 {{ request()->routeIs('admin.usuarios.*') ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-700' }}">
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"></path>
                                </svg>
                                <span class="ml-2">Usuarios y Roles</span>
                            </a>
                        </li>
                        <li>
                            <a href="{{ route('admin.activity-logs.index') }}"
                               class="flex items-center p-2 rounded-lg hover:bg-gray-100 {{ request()->routeIs('admin.activity-logs.*') ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-700' }}">
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"></path>
                                </svg>
                                <span class="ml-2">Historial de Actividades</span>
                            </a>
                        </li>
                        <li>

                    </ul>
                </li>
                @endrole
            </ul>
        </div>
    </aside>

    <!-- Main Content -->
    <div class="p-4 md:ml-64 mt-20">
        <!-- Alertas -->
        @if(session('success'))
            <div class="p-4 mb-4 text-sm text-green-800 rounded-lg bg-green-50" role="alert">
                {{ session('success') }}
            </div>
        @endif

        @if(session('error'))
            <div class="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50" role="alert">
                {{ session('error') }}
            </div>
        @endif

        <!-- Contenido -->
        {{ $slot }}
    </div>

    @stack('scripts')
</body>
</html>
