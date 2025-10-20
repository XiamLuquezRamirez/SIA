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
    <link rel="stylesheet" href="{{ asset('css/header-user.css') }}">

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
                <div class="flex items-center w-10">
                    <button @click="sidebarOpen = !sidebarOpen" class="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100">
                        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"></path>
                        </svg>
                    </button>
                </div>

                <!-- Logo - Centro -->
                <div class="flex-1 flex items-left justify-left">
                    <a href="{{ route('dashboard') }}" class="flex items-left justify-left">
                        <img src="{{ asset('images/logo.png') }}" alt="Logo SIA" class="h-16 w-auto object-contain">
                    </a>
                </div>

                <!-- Usuario - Derecha -->
                <div class="user-header-container flex items-center justify-end space-x-4" x-data="{ dropdownOpen: false }">
                    <!-- Icono de Notificaciones -->
                    <button class="header-notification-icon relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
                        <svg fill="#000000" class="w-6 h-6" viewBox="0 0 36 36" version="1.1" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                            <title>Notificaciones</title>
                            <path class="clr-i-solid clr-i-solid-path-1" d="M32.85,28.13l-.34-.3A14.37,14.37,0,0,1,30,24.9a12.63,12.63,0,0,1-1.35-4.81V15.15A10.81,10.81,0,0,0,19.21,4.4V3.11a1.33,1.33,0,1,0-2.67,0V4.42A10.81,10.81,0,0,0,7.21,15.15v4.94A12.63,12.63,0,0,1,5.86,24.9a14.4,14.4,0,0,1-2.47,2.93l-.34.3v2.82H32.85Z"></path>
                            <path class="clr-i-solid clr-i-solid-path-2" d="M15.32,32a2.65,2.65,0,0,0,5.25,0Z"></path>
                            <rect x="0" y="0" width="36" height="36" fill-opacity="0" />
                        </svg>
                        <!-- Badge de notificaciones -->
                        <span class="notification-badge badge-pulse absolute -top-1 -right-1 w-5 h-5 text-white text-xs rounded-full flex items-center justify-center">3</span>
                    </button>

                    <!-- Icono de Mensajes -->
                    <button class="header-message-icon relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                        </svg>
                        <!-- Badge de mensajes -->
                        <span class="message-badge badge-pulse absolute -top-1 -right-1 w-5 h-5 text-white text-xs rounded-full flex items-center justify-center">2</span>
                    </button>

                    <!-- Información del Usuario -->
                    <div class="user-container flex items-center space-x-3">
                        <!-- Nombre y Rol -->
                        <div class="user-info text-right">
                            <p class="user-name text-sm font-medium">{{ auth()->user()->nombre_completo }}</p>
                            <p class="user-role text-xs">{{ auth()->user()->roles->first()->name ?? 'Usuario' }}</p>
                        </div>

                        <!-- Foto de Perfil -->
                        <button @click="dropdownOpen = !dropdownOpen" class="flex items-center space-x-2 p-1 hover:bg-gray-100 rounded-lg transition-colors">
                            <div class="user-avatar w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold">
                                @if(auth()->user()->foto_perfil)
                                <img src="{{ asset('storage/' . auth()->user()->foto_perfil) }}" alt="Foto de perfil" class="w-10 h-10 rounded-full object-cover">
                                @else
                                {{ substr(auth()->user()->nombre, 0, 1) }}{{ substr(auth()->user()->apellidos, 0, 1) }}
                                @endif
                            </div>
                            <!-- Flecha del dropdown -->
                            <svg class="dropdown-arrow w-4 h-4 text-gray-400 transition-transform" :class="dropdownOpen ? 'rotated' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                        </button>
                    </div>

                    <!-- Dropdown del Usuario -->
                    <div x-show="dropdownOpen" @click.away="dropdownOpen = false"
                        x-transition:enter="transition ease-out duration-200"
                        x-transition:enter-start="opacity-0 scale-95"
                        x-transition:enter-end="opacity-100 scale-100"
                        x-transition:leave="transition ease-in duration-75"
                        x-transition:leave-start="opacity-100 scale-100"
                        x-transition:leave-end="opacity-0 scale-95"
                        class="user-dropdown absolute right-4 top-16 z-50 w-64 rounded-lg py-2">

                        <!-- Header del dropdown -->
                        <div class="dropdown-header px-4 py-3">
                            <div class="flex items-center space-x-3">
                                <div class="dropdown-avatar w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                                    @if(auth()->user()->foto_perfil)
                                    <img src="{{ asset('storage/' . auth()->user()->foto_perfil) }}" alt="Foto de perfil" class="w-12 h-12 rounded-full object-cover">
                                    @else
                                    {{ substr(auth()->user()->nombre, 0, 1) }}{{ substr(auth()->user()->apellidos, 0, 1) }}
                                    @endif
                                </div>
                                <div>
                                    <p class="user-text text-sm font-medium text-gray-900">{{ auth()->user()->nombre_completo }}</p>
                                    <p class="text-xs text-gray-500">{{ auth()->user()->email }}</p>
                                    <p class="text-xs text-blue-600 font-medium">{{ auth()->user()->roles->first()->name ?? 'Usuario' }}</p>
                                </div>
                            </div>
                        </div>

                        <!-- Opciones del menú -->
                        <ul class="py-2">
                            <li>
                                <a href="#" class="user-menu-item flex items-center px-4 py-2 text-sm text-gray-700">
                                    <svg class="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                    </svg>
                                    Mi Perfil
                                </a>
                            </li>
                            <li>
                                <a href="#" class="user-menu-item flex items-center px-4 py-2 text-sm text-gray-700">
                                    <svg class="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                    </svg>
                                    Configuración
                                </a>
                            </li>
                            <li>
                                <a href="#" class="user-menu-item flex items-center px-4 py-2 text-sm text-gray-700">
                                    <svg class="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                    Ayuda
                                </a>
                            </li>
                        </ul>

                        <!-- Separador -->
                        <div class="dropdown-separator my-2"></div>

                        <!-- Cerrar Sesión -->
                        <div class="px-2">
                            <form method="POST" action="{{ route('logout') }}">
                                @csrf
                                <button type="submit" class="user-logout flex items-center w-full px-2 py-2 text-sm text-red-600">
                                    <svg class="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                                    </svg>
                                    Cerrar Sesión
                                </button>
                            </form>
                        </div>
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
                                <svg fill="#000000" class="w-4 h-4" version="1.1" id="XMLID_116_" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
                                    viewBox="0 0 24 24" xml:space="preserve">
                                    <g id="document-config">
                                        <path d="M23,24h-9v-2h7V8h-6V2H5v9H3V0h14.4L23,5.6V24z M17,6h3.6L17,2.4V6z M8,24H6v-2.1c-0.4-0.1-0.7-0.2-1-0.4l-1.5,1.5
		l-1.4-1.4L3.6,20c-0.2-0.3-0.3-0.7-0.4-1H1v-2h2.1c0.1-0.4,0.2-0.7,0.4-1l-1.5-1.5l1.4-1.4L5,14.6c0.3-0.2,0.7-0.3,1-0.4V12h2v2.1
		c0.4,0.1,0.7,0.2,1,0.4l1.5-1.5l1.4,1.4L10.4,16c0.2,0.3,0.3,0.7,0.4,1H13v2h-2.1c-0.1,0.4-0.2,0.7-0.4,1l1.5,1.5l-1.4,1.4L9,21.4
		c-0.3,0.2-0.7,0.3-1,0.4V24z M7,16c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S8.1,16,7,16z" />
                                    </g>
                                </svg>
                                <span class="ml-2">Configurar Solicitudes</span>
                            </a>
                        </li>
                        <li>
                            <a href="{{ route('admin.dependencias.index') }}"
                                class="flex items-center p-2 rounded-lg hover:bg-gray-100 {{ request()->routeIs('admin.dependencias.*') ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-700' }}">
<svg fill="#000000" class="w-4 h-4" viewBox="0 0 36 36" version="1.1"  preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <title>organization-line</title>
    <polygon points="9.8 18.8 26.2 18.8 26.2 21.88 27.8 21.88 27.8 17.2 18.8 17.2 18.8 14 17.2 14 17.2 17.2 8.2 17.2 8.2 21.88 9.8 21.88 9.8 18.8" class="clr-i-outline clr-i-outline-path-1"></polygon><path d="M14,23H4a2,2,0,0,0-2,2v6a2,2,0,0,0,2,2H14a2,2,0,0,0,2-2V25A2,2,0,0,0,14,23ZM4,31V25H14v6Z" class="clr-i-outline clr-i-outline-path-2"></path><path d="M32,23H22a2,2,0,0,0-2,2v6a2,2,0,0,0,2,2H32a2,2,0,0,0,2-2V25A2,2,0,0,0,32,23ZM22,31V25H32v6Z" class="clr-i-outline clr-i-outline-path-3"></path><path d="M13,13H23a2,2,0,0,0,2-2V5a2,2,0,0,0-2-2H13a2,2,0,0,0-2,2v6A2,2,0,0,0,13,13Zm0-8H23v6H13Z" class="clr-i-outline clr-i-outline-path-4"></path>
    <rect x="0" y="0" width="36" height="36" fill-opacity="0"/>
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