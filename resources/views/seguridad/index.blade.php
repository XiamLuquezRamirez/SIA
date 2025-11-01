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
                        <p class="text-left  w-full ">Tienes <strong id="total_sesiones_pc">0</strong> sesiones en uno o varios ordenadores, da click en el dispositivo para ver más detalles.</p>
                    </div>
                    <div class="col-span-3 grid grid-cols-1 gap-4">
                        <div class="col-span-1 pl-2 pt-6" id="dispositivos_pc_skeleton" style="display: block;">
                            @for($i = 0; $i < 10; $i++)
                                <tr class="skeleton-row">
                                    <td colspan="7" class="px-6 py-4">
                                        <div class="animate-pulse flex space-x-4">
                                            <div class="flex-1 space-y-4 py-1">
                                                <div class="h-4 bg-gray-200 rounded w-3/4"></div>
                                                <div class="h-4 bg-gray-200 rounded w-1/2"></div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            @endfor
                        </div>
                        <div class="col-span-1 pl-2 pt-6" id="dispositivos_pc" style="display: none;"></div>
                    </div>
                </div>

                <div class="px-6 py-4 w-full grid grid-cols-6 gap-4 bg-white rounded-lg shadow-sm border border-gray-200 mt-4">
                    <div class="justify-center col-span-1 pt-6">
                        <img src="{{ asset('images/devices/device-2.png') }}" alt="Dispositivo 1" class="w-full h-auto">
                    </div>
                    <div class="col-span-2 pl-2 pt-6">
                        <p class="text-left  w-full ">Tienes <strong id="total_sesiones_movil">0</strong> sesiones en uno o varios dispositivos móviles, da click en el dispositivo para ver más detalles.</p>
                    </div>
                    <div class="col-span-3 grid grid-cols-1 gap-4">
                        <div class="col-span-1 pl-2 pt-6" id="dispositivos_movil_skeleton" style="display: block;">
                            @for($i = 0; $i < 10; $i++)
                                <tr class="skeleton-row">
                                    <td colspan="7" class="px-6 py-4">
                                        <div class="animate-pulse flex space-x-4">
                                            <div class="flex-1 space-y-4 py-1">
                                                <div class="h-4 bg-gray-200 rounded w-3/4"></div>
                                                <div class="h-4 bg-gray-200 rounded w-1/2"></div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            @endfor
                        </div>
                        <div class="col-span-1 pl-2 pt-6" id="dispositivos_movil" style="display: none;"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>


    <!-- Password Change Modal -->
    <div id="passwordModal" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-lg bg-white">
            <div class="mt-3">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold text-gray-900">Cambiar Contraseña</h3>
                    <button onclick="closePasswordModal()" class="text-gray-400 hover:text-gray-600">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>

                <form id="passwordForm">
                    @csrf
                    <!-- Current Password -->
                    <div class="mb-4">
                        <label for="current_password" class="block text-sm font-medium text-gray-700 mb-2">
                            Contraseña Actual <span class="text-red-500">*</span>
                        </label>
                        <div class="relative">
                            <input type="password"
                                   name="current_password"
                                   id="current_password"
                                   required
                                   class="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            <button type="button"
                                    onclick="alternarVisibilidadPassword('current_password')"
                                    class="absolute inset-y-0 right-0 pr-3 flex items-center">
                                <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                </svg>
                            </button>
                        </div>
                        <p class="mt-1 text-xs text-red-600 hidden" id="current_password-error"></p>
                    </div>

                    <!-- New Password -->
                    <div class="mb-4">
                        <label for="new_password" class="block text-sm font-medium text-gray-700 mb-2">
                            Nueva Contraseña <span class="text-red-500">*</span>
                        </label>
                        <div>
                            <div class="relative">
                                <input type="password" name="new_password" id="new_password" required
                                    class="w-full px-3 py-2 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Mínimo 8 caracteres"
                                    oninput="verificarFortalezaPassword()">
                                <button type="button" onclick="alternarVisibilidadPassword('new_password')"
                                    class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                    </svg>
                                </button>
                            </div>
                            <span class="error-message text-red-500 text-xs hidden"></span>

                            <!-- Indicador de Fortaleza -->
                            <div class="mt-2">
                                <div class="flex gap-1">
                                    <div id="strength1" class="h-1 flex-1 bg-gray-200 rounded"></div>
                                    <div id="strength2" class="h-1 flex-1 bg-gray-200 rounded"></div>
                                    <div id="strength3" class="h-1 flex-1 bg-gray-200 rounded"></div>
                                    <div id="strength4" class="h-1 flex-1 bg-gray-200 rounded"></div>
                                </div>
                                <p id="strengthLabel" class="text-xs text-gray-500 mt-1">Fortaleza de contraseña</p>
                            </div>
                        </div>
                        <p class="mt-1 text-xs text-gray-500">Mínimo 8 caracteres</p>
                        <p class="mt-1 text-xs text-red-600 hidden" id="new_password-error"></p>
                    </div>

                    <!-- Confirm New Password -->
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Confirmar Contraseña <span class="text-red-500">*</span>
                        </label>
                        <div class="relative">
                            <input type="password" name="password_confirmation" id="password_confirmation" required
                                class="w-full px-3 py-2 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Repita la contraseña"
                                oninput="verificarCoincidenciaPassword()">
                            <button type="button" onclick="alternarVisibilidadPassword('password_confirmation')"
                                class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                </svg>
                            </button>
                        </div>
                        <span class="error-message text-red-500 text-xs hidden"></span>
                        <p id="passwordMatchMessage" class="text-xs mt-1 hidden"></p>
                    </div>

                    <!-- Security Tips -->
                    <div class="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div class="flex">
                            <svg class="h-5 w-5 text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                            </svg>
                            <div class="ml-3">
                                <h4 class="text-xs font-semibold text-blue-800">Consejos de Seguridad:</h4>
                                <ul class="mt-1 text-xs text-blue-700 list-disc list-inside">
                                    <li>Usa al menos 8 caracteres</li>
                                    <li>Combina letras, números y símbolos</li>
                                    <li>No uses información personal</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div class="flex gap-3 justify-end">
                        <button type="button"
                                onclick="closePasswordModal()"
                                class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors">
                            Cancelar
                        </button>
                        <button type="submit"
                                class="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors">
                            Actualizar Contraseña
                        </button>
                    </div>
                </form>
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