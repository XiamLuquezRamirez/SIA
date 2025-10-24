<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $title ?? 'Dashboard' }} - SIA OAPM</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <!-- fav Icons -->

    <link rel="icon" href="{{ asset('images/favicon.ico') }}">
 
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
                <!-- Inicio -->
                <li>
                    <a href="{{ route('dashboard') }}"
                        class="flex items-center p-2 rounded-lg hover:bg-gray-100 {{ request()->routeIs('dashboard') || request()->routeIs('admin.dashboard') ? 'bg-blue-50 text-blue-600' : 'text-gray-900' }}">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                        </svg>
                        <span class="ml-3">Inicio</span>
                    </a>
                </li>

                @role('Super Administrador|Director OAPM')

                <!-- Solicitudes -->
                <li x-data="{ open: {{ request()->routeIs('admin.solicitudes.*') || request()->routeIs('admin.configurarSolicitudes.*') ? 'true' : 'false' }} }">
                    <button @click="open = !open"
                        class="flex items-center justify-between w-full p-2 rounded-lg hover:bg-gray-100 {{ request()->routeIs('admin.solicitudes.*') || request()->routeIs('admin.configurarSolicitudes.*') ? 'bg-blue-50 text-blue-600' : 'text-gray-900' }}">
                        <div class="flex items-center">
                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"></path>
                                <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"></path>
                            </svg>
                            <span class="ml-3">Solicitudes</span>
                        </div>
                        <svg class="w-4 h-4 transition-transform" :class="open ? 'rotate-180' : ''" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                        </svg>
                    </button>
                    <ul x-show="open" x-transition class="pl-10 mt-2 space-y-1">
                        <li>
                            <a href="{{ route('admin.solicitudes.create') }}"
                                class="flex items-center p-2 rounded-lg hover:bg-gray-100 {{ request()->routeIs('admin.solicitudes.create') ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-700' }}">
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd"></path>
                                </svg>
                                <span class="ml-2">Agregar Solicitud</span>
                            </a>
                        </li>
                        <li>
                            <a href="{{ route('admin.solicitudes.index') }}"
                                class="flex items-center p-2 rounded-lg hover:bg-gray-100 {{ request()->routeIs('admin.solicitudes.index') ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-700' }}">
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"></path>
                                </svg>
                                <span class="ml-2">Bandeja de Solicitudes</span>
                            </a>
                        </li>
                        <li>
                            <a href="{{ route('admin.configurarSolicitudes.index') }}"
                                class="flex items-center p-2 rounded-lg hover:bg-gray-100 {{ request()->routeIs('admin.configurarSolicitudes.*') ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-700' }}">
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"></path>
                                </svg>
                                <span class="ml-2">Tipos de Solicitud</span>
                            </a>
                        </li>
                        <li>
                            <a href="#"
                                class="flex items-center p-2 rounded-lg hover:bg-gray-100 text-gray-700">
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9 9a2 2 0 114 0 2 2 0 01-4 0z"></path>
                                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a4 4 0 00-3.446 6.032l-2.261 2.26a1 1 0 101.414 1.415l2.261-2.261A4 4 0 1011 5z" clip-rule="evenodd"></path>
                                </svg>
                                <span class="ml-2">Seguimiento de Solicitudes</span>
                            </a>
                        </li>
                    </ul>
                </li>

                <!-- Equipos y Áreas -->
                <li x-data="{ open: {{ request()->routeIs('admin.equipos-areas.equipos.*') || request()->routeIs('admin.equipos-areas.dependencias.*') ? 'true' : 'false' }} }">
                    <button @click="open = !open"
                        class="flex items-center justify-between w-full p-2 rounded-lg hover:bg-gray-100 {{ request()->routeIs('admin.equipos.*') || request()->routeIs('admin.areas.*') || request()->routeIs('admin.dependencias.*') ? 'bg-blue-50 text-blue-600' : 'text-gray-900' }}">
                        <div class="flex items-center">
                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"></path>
                            </svg>
                            <span class="ml-3">Áreas y Equipos</span>
                        </div>
                        <svg class="w-4 h-4 transition-transform" :class="open ? 'rotate-180' : ''" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                        </svg>
                    </button>
                    <ul x-show="open" x-transition class="pl-10 mt-2 space-y-1">
                        <li>
                            <a href="{{ route('admin.equipos-areas.dependencias.index') }}"
                                class="flex items-center p-2 rounded-lg hover:bg-gray-100 {{ request()->routeIs('admin.equipos-areas.dependencias.*') ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-700' }}">
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clip-rule="evenodd"></path>
                                </svg>
                                <span class="ml-2">Áreas</span>
                            </a>
                        </li>
                       <li>
                            <a href="{{ route('admin.equipos-areas.equipos.index') }}"
                               class="flex items-center p-2 rounded-lg hover:bg-gray-100 {{ request()->routeIs('admin.equipos-areas.equipos.*') ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-700' }}">
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"></path>
                                </svg>                  
                                <span class="ml-2">Equipos</span>
                            </a>
                        </li>
                        <li>
                            <a href="{{ route('admin.equipos-areas.dependencias.organigrama') }}"
                                class="flex items-center p-2 rounded-lg hover:bg-gray-100 text-gray-700">
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm11 1H6v8l4-2 4 2V6z" clip-rule="evenodd"></path>
                                </svg>
                                <span class="ml-2">Organigrama</span>
                            </a>
                        </li>
                    </ul>
                </li>

                <!-- Configuración -->
                <li x-data="{ open: {{ request()->routeIs('admin.configuracion.*') ? 'true' : 'false' }} }">
                    <button @click="open = !open"
                        class="flex items-center justify-between w-full p-2 rounded-lg hover:bg-gray-100 {{ request()->routeIs('admin.configuracion.*') ? 'bg-blue-50 text-blue-600' : 'text-gray-900' }}">
                        <div class="flex items-center">
                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"></path>
                            </svg>
                            <span class="ml-3">Configuración</span>
                        </div>
                        <svg class="w-4 h-4 transition-transform" :class="open ? 'rotate-180' : ''" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                        </svg>
                    </button>
                    <ul x-show="open" x-transition class="pl-10 mt-2 space-y-1">
                        <!-- Flujos y Estados -->
                        <li>
                            <a href="#"
                                class="flex items-center p-2 rounded-lg hover:bg-gray-100 text-gray-700">
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clip-rule="evenodd"></path>
                                </svg>
                                <span class="ml-2">Estados</span>
                            </a>
                        </li>
                        
                        <!-- Documentos (con submenú) -->
                        <li x-data="{ openDocs: {{ request()->routeIs('admin.configuracion.documentos.*') || request()->routeIs('admin.configuracion.plantillas') || request()->routeIs('admin.configuracion.consecutivos') ? 'true' : 'false' }} }">
                            <button @click="openDocs = !openDocs"
                                class="flex items-center justify-between w-full p-2 rounded-lg hover:bg-gray-100 {{ request()->routeIs('admin.configuracion.documentos.*') || request()->routeIs('admin.configuracion.plantillas') || request()->routeIs('admin.configuracion.consecutivos') ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700' }}">
                                <div class="flex items-center">
                                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"></path>
                                    </svg>
                                    <span class="ml-2">Documentos</span>
                                </div>
                                <svg class="w-3 h-3 transition-transform" :class="openDocs ? 'rotate-180' : ''" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                                </svg>
                            </button>
                            <ul x-show="openDocs" x-transition class="pl-8 mt-1 space-y-1">
                                <li>
                                    <a href="{{ route('admin.configuracion.documentos.plantillas') }}"
                                        class="flex items-center p-2 rounded-lg hover:bg-gray-100 {{ request()->routeIs('admin.configuracion.documentos.plantillas') || request()->routeIs('admin.configuracion.plantillas') ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-600' }} text-sm">
                                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z"></path>
                                            <path d="M3 8a2 2 0 012-2v10h8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"></path>
                                        </svg>
                                        <span class="ml-2">Plantillas de Documento</span>
                                    </a>
                                </li>
                                <li>
                                    <a href="{{ route('admin.configuracion.documentos.consecutivos') }}"
                                        class="flex items-center p-2 rounded-lg hover:bg-gray-100 {{ request()->routeIs('admin.configuracion.documentos.consecutivos') || request()->routeIs('admin.configuracion.consecutivos') ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-600' }} text-sm">
                                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path>
                                        </svg>
                                        <span class="ml-2">Consecutivos y Radicados</span>
                                    </a>
                                </li>
                            </ul>
                        </li>
                        
                        <!-- Parámetros Generales (con submenú) -->
                        <li x-data="{ openParams: {{ request()->routeIs('admin.configuracion.parametros.*') || request()->routeIs('admin.configuracion.categorias') || request()->routeIs('admin.configuracion.festivos') ? 'true' : 'false' }} }">
                            <button @click="openParams = !openParams"
                                class="flex items-center justify-between w-full p-2 rounded-lg hover:bg-gray-100 {{ request()->routeIs('admin.configuracion.parametros.*') || request()->routeIs('admin.configuracion.categorias') || request()->routeIs('admin.configuracion.festivos') ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700' }}">
                                <div class="flex items-center">
                                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"></path>
                                    </svg>
                                    <span class="ml-2">Parámetros Generales</span>
                                </div>
                                <svg class="w-3 h-3 transition-transform" :class="openParams ? 'rotate-180' : ''" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                                </svg>
                            </button>
                            <ul x-show="openParams" x-transition class="pl-8 mt-1 space-y-1">
                                <li>
                                    <a href="{{ route('admin.configuracion.parametros.categorias.index') }}"
                                        class="flex items-center p-2 rounded-lg hover:bg-gray-100 {{ request()->routeIs('admin.configuracion.parametros.categorias.index') || request()->routeIs('admin.configuracion.categorias.index') ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-600' }} text-sm">
                                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1H8a3 3 0 00-3 3v1.5a1.5 1.5 0 01-3 0V6z" clip-rule="evenodd"></path>
                                            <path d="M6 12a2 2 0 012-2h8a2 2 0 012 2v2a2 2 0 01-2 2H2h2a2 2 0 002-2v-2z"></path>
                                        </svg>
                                        <span class="ml-2">Categorías</span>
                                    </a>
                                </li>
                                <li>
                                    <a href="{{ route('admin.configuracion.parametros.festivos.index') }}"
                                        class="flex items-center p-2 rounded-lg hover:bg-gray-100 {{ request()->routeIs('admin.configuracion.parametros.festivos.index') || request()->routeIs('admin.configuracion.festivos.index') ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-600' }} text-sm">
                                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clip-rule="evenodd"></path>
                                        </svg>
                                        <span class="ml-2">Festivos</span>
                                    </a>
                                </li>
                            </ul>
                        </li>
                    </ul>
                </li>

                <!-- Usuarios y Roles -->
                <li>
                    <a href="{{ route('admin.usuarios.index') }}"
                        class="flex items-center p-2 rounded-lg hover:bg-gray-100 {{ request()->routeIs('admin.usuarios.*') ? 'bg-blue-50 text-blue-600' : 'text-gray-900' }}">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"></path>
                        </svg>
                        <span class="ml-3">Usuarios y Roles</span>
                    </a>
                </li>

                <!-- Auditoría y Monitoreo -->
                <li>
                    <a href="{{ route('admin.activity-logs.index') }}"
                        class="flex items-center p-2 rounded-lg hover:bg-gray-100 {{ request()->routeIs('admin.activity-logs.*') ? 'bg-blue-50 text-blue-600' : 'text-gray-900' }}">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                        </svg>
                        <span class="ml-3">Auditoría y Monitoreo</span>
                    </a>
                </li>

                <!-- Reportes -->
                <li>
                    <a href="#"
                        class="flex items-center p-2 rounded-lg hover:bg-gray-100 text-gray-900">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"></path>
                        </svg>
                        <span class="ml-3">Reportes</span>
                    </a>
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