<x-app-layout>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Header -->
        <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900">Seguridad y Privacidad</h1>
            <p class="mt-2 text-sm text-gray-600">Gestiona la seguridad y privacidad de tu cuenta</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Password Security -->
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 mt-6" style="height: fit-content;">
                <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900">Contraseña</h3>
                        <p class="text-sm text-gray-600 mt-1">Actualiza tu contraseña periódicamente para mantener tu cuenta segura</p>
                    </div>
                    <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                    </svg>
                </div>

                <div class="px-6 py-4">
                    <div class="flex items-center justify-center">
                        <p class="text-left text-sm text-gray-600 w-full"><strong>Última actualización:</strong> hace <span class="text-yellow-800 font-bold" id="last_update_time">0</span> días</p>
                    </div>
                    <div class="flex items-center justify-between mt-4">
                        <div class="bg-yellow-100 p-4 rounded-lg border border-yellow-400">
                            <p class="text-sm text-yellow-800"><strong>💡 Recomendación</strong></p>
                            <p class="text-sm text-yellow-800">Se recomienda cambiarla cada 90 días, para evitar que tu cuenta sea comprometida.</p>
                        </div>
                    </div>
                    <div class="mt-4">
                        <button onclick="openPasswordModal()" class="w-full flex justify-center items-center px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-900 transition-colors text-center">
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
                            </svg>
                            Cambiar Contraseña
                        </button>
                    </div>
                </div>
            </div>

            <!-- Sessions Active -->
            <div class="rounded-lg mt-6 col-span-2">
                <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900">Tus dispositivos</h3>
                        <p class="text-sm text-gray-600 mt-1">Tienes la sesión iniciada en estos dispositivos o has iniciado sesión en ellos en los últimos 28 días. Puede haber varias sesiones de actividad del mismo dispositivo.</p>
                    </div>
                    <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                    </svg>
                </div>

                <div class="px-6 py-4 w-full grid grid-cols-6 gap-4 bg-white rounded-lg shadow-sm border border-gray-200 mt-4">
                    <div class="justify-center col-span-1 pt-6">
                        <img src="{{ asset('images/devices/device-1.png') }}" alt="Dispositivo 1" class="w-full h-auto">
                    </div>
                    <div class="col-span-2 pl-2 pt-6">
                        <p class="text-left  w-full ">Tienes <strong>2</strong> sesiones en uno o varios ordenadores, da click en el dispositivo para ver más detalles.</p>
                    </div>
                    <div class="col-span-3 grid grid-cols-1 gap-4">
                        <div class="col-span-1 pl-2 pt-6">
                            <div class="bg-gray-100 p-4 rounded-lg border border-gray-200 item-dispositivo mb-4">
                                <div class="bg-blue-100 rounded-lg border p-1 border-blue-400 w-auto flex items-center justify-center gap-2">
                                    <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M21.007 8.27C22.194 9.125 23 10.45 23 12c0 1.55-.806 2.876-1.993 3.73.24 1.442-.134 2.958-1.227 4.05-1.095 1.095-2.61 1.459-4.046 1.225C14.883 22.196 13.546 23 12 23c-1.55 0-2.878-.807-3.731-1.996-1.438.235-2.954-.128-4.05-1.224-1.095-1.095-1.459-2.611-1.217-4.05C1.816 14.877 1 13.551 1 12s.816-2.878 2.002-3.73c-.242-1.439.122-2.955 1.218-4.05 1.093-1.094 2.61-1.467 4.057-1.227C9.125 1.804 10.453 1 12 1c1.545 0 2.88.803 3.732 1.993 1.442-.24 2.956.135 4.048 1.227 1.093 1.092 1.468 2.608 1.227 4.05Zm-4.426-.084a1 1 0 0 1 .233 1.395l-5 7a1 1 0 0 1-1.521.126l-3-3a1 1 0 0 1 1.414-1.414l2.165 2.165 4.314-6.04a1 1 0 0 1 1.395-.232Z" fill="#1e5dcb"/></svg>
                                    <p class="text-sm text-blue-800 text-center font-bold">Sesión actual</p>
                                </div>
                                <p class="text-sm text-gray-600 mt-2">
                                    <strong>Windows 10</strong><br>
                                    <span class="text-gray-500">Colombia - Bogotá</span><br>
                                    <span class="text-gray-500">15 de octubre de 2025 a las 10:00:00</span><br>
                                    <span class="text-gray-500">192.168.1.100</span><br>
                                    <span class="text-gray-500">Google Chrome</span><br>
                                </p> 
                            </div>
                            <div class="bg-gray-100 p-4 rounded-lg border border-gray-200 item-dispositivo mb-4">
                                <p class="text-sm text-gray-600 mt-2">
                                    <strong>Windows 10</strong><br>
                                    <span class="text-gray-500">Colombia - Bogotá</span><br>
                                    <span class="text-gray-500">15 de octubre de 2025 a las 10:00:00</span><br>
                                    <span class="text-gray-500">192.168.1.100</span><br>
                                    <span class="text-gray-500">Google Chrome</span><br>
                                </p> 
                            </div>
                        </div>
                    </div>
                </div>

                <div class="px-6 py-4 w-full grid grid-cols-6 gap-4 bg-white rounded-lg shadow-sm border border-gray-200 mt-4">
                    <div class="justify-center col-span-1 pt-6">
                        <img src="{{ asset('images/devices/device-2.png') }}" alt="Dispositivo 1" class="w-full h-auto">
                    </div>
                    <div class="col-span-2 pl-2 pt-6">
                        <p class="text-left  w-full ">Tienes <strong>2</strong> sesiones en uno o varios dispositivos móviles, da click en el dispositivo para ver más detalles.</p>
                    </div>
                    <div class="col-span-3 grid grid-cols-1 gap-4">
                        <div class="col-span-1 pl-2 pt-6">
                            <div class="bg-gray-100 p-4 rounded-lg border border-gray-200 item-dispositivo mb-4">
                                <p class="text-sm text-gray-600 mt-2">
                                    <strong>Android</strong><br>
                                    <span class="text-gray-500">Colombia - Bogotá</span><br>
                                    <span class="text-gray-500">15 de octubre de 2025 a las 10:00:00</span><br>
                                    <span class="text-gray-500">192.168.1.101</span><br>
                                    <span class="text-gray-500">Google Chrome</span><br>
                                </p> 
                            </div>
                            <div class="bg-gray-100 p-4 rounded-lg border border-gray-200 item-dispositivo mb-4">
                                <p class="text-sm text-gray-600 mt-2">
                                    <strong>iOS</strong><br>
                                    <span class="text-gray-500">Colombia - Bogotá</span><br>
                                    <span class="text-gray-500">15 de octubre de 2025 a las 10:00:00</span><br>
                                    <span class="text-gray-500">192.168.1.102</span><br>
                                    <span class="text-gray-500">Safari</span><br>
                                </p> 
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    @push('styles')
    <link rel="stylesheet" href="{{ asset('css/admin/usuarios-modal.css') }}">
    <link rel="stylesheet" href="{{ asset('css/seguridad.css') }}">
    @endpush

    @push('scripts')
    <script src="{{ asset('js/seguridad.js') }}"></script>
    @endpush
</x-app-layout>