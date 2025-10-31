<x-app-layout>
    <x-slot name="title">Configuración de Notificaciones</x-slot>
    <div class="container mx-auto px-4 py-6">
        <div class="flex justify-between items-center mb-6">
            <div>
                <h1 class="text-2xl font-bold text-gray-800">Configuración de Notificaciones</h1>
                <p class="text-gray-600 text-sm">Configurar notificaciones del sistema</p>
            </div>
            <button onclick="guardarConfiguracion()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                <svg width="20px" height="20px" viewBox="0 0 16 16" fill="#ffffff" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11 1H1V15L4 15L4 9L12 9L12 15H15V5L11 1Z" fill="#ffffff"/>
                    <path d="M10 15V11H6L6 15H10Z" fill="#ffffff"/></svg>
                Guardar Configuración
            </button>
        </div>
    </div>

     <!-- Profile Information -->
    <div class="grid grid-cols-2 gap-6">
        <div class="lg:col-span-1 space-y-6">
            <!-- Personal Information Card -->
            <div class="bg-white rounded-lg shadow-sm border border-gray-200">
                <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 class="text-lg font-semibold text-gray-900">Notificaciones en la aplicación</h3>
                </div>
                <div class="px-6 py-4">
                    <div class="md:col-span-1 flex items-center gap-2 border border-gray-200 pb-4 rounded-lg p-4" style="justify-content: space-between;">
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Mostrar notificaciones en tiempo real<br> 
                            <span class="text-xs text-gray-500">Recibirás alertas dentro de la aplicación</span>
                        </label>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input checked id="mostrar_notificaciones" type="checkbox" class="sr-only peer">
                            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                    </div>
                </div>
                <div class="px-6 py-4">
                    <div class="md:col-span-1 flex items-center gap-2 border border-gray-200 pb-4 rounded-lg p-4" style="justify-content: space-between;">
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Reproducir sonido de notificación<br> 
                            <span class="text-xs text-gray-500">Se reproducirá un sonido al recibir notificaciones  </span>
                        </label>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input checked id="reproducir_sonido" type="checkbox" class="sr-only peer">
                            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                    </div>
                </div>
                <div class="px-6 py-4">
                    <div class="md:col-span-1 flex items-center gap-2 border border-gray-200 pb-4 rounded-lg p-4" style="justify-content: space-between;">
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Mostrar badge con contador<br> 
                            <span class="text-xs text-gray-500">Verás el número de notificaciones pendientes</span>
                        </label>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input checked id="mostrar_badge" type="checkbox" class="sr-only peer">
                            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                    </div>
                </div>
            </div>
        </div>
        <div class="lg:col-span-1 space-y-6">
            <!-- Personal Information Card -->
            <div class="bg-white rounded-lg shadow-sm border border-gray-200">
                <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 class="text-lg font-semibold text-gray-900">Notificaciones por correo electrónico</h3>
                    <span class="text-xs text-gray-500"><strong>Email de notificaciones:</strong> admin@oapm.gov.co 🔒</span>
                </div>
                <div class="px-6 py-4">
                    <div class="md:col-span-1 items-center gap-2 border border-gray-200 pb-4 rounded-lg p-4" style="justify-content: space-between;">
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Frecuencia del envío de notificaciones<br> 
                            <span class="text-xs text-gray-500">Verás el número de notificaciones pendientes</span>
                        </label>
                        <div class="flex items-center gap-2 justify-between m-2 pb-2 pt-2 w-full border border-gray-200 rounded-lg p-2">
                            <span class="text-xs text-gray-700">Inmediato (al ocurrir el evento) </span>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input checked id="" type="radio" name="frecuencia_envio" value="inmediato" class="sr-only peer">
                                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                            </label>
                        </div>
                        <div class="flex items-center gap-2 justify-between m-2 pb-2 pt-2 w-full border border-gray-200 rounded-lg p-2">
                            <span class="text-xs text-gray-700">Resumen diario  (Todos los días a las 8:00 AM) </span>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input checked id="" type="radio" name="frecuencia_envio" value="resumen_diario" class="sr-only peer">
                                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                            </label>
                        </div>
                        <div class="flex items-center gap-2 justify-between m-2 pb-2 pt-2 w-full border border-gray-200 rounded-lg p-2">
                            <span class="text-xs text-gray-700">Resumen semanal  (Cada lunes a las 8:00 AM) </span>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input checked id="" type="radio" name="frecuencia_envio" value="resumen_diario" class="sr-only peer">
                                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                            </label>
                        </div>
                        <div class="flex items-center gap-2 justify-between m-2 pb-2 pt-2 w-full border border-gray-200 rounded-lg p-2">
                            <span class="text-xs text-gray-700">Nunca  (No se enviarán notificaciones) </span>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input checked id="" type="radio" name="frecuencia_envio" value="nunca" class="sr-only peer">
                                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="lg:col-span-2 space-y-6">
            <!-- Personal Information Card -->
            <div class="bg-white rounded-lg shadow-sm border border-gray-200">
                <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 class="text-lg font-semibold text-gray-900">Tipos de notificaciones</h3>
                </div>
                <div class="grid grid-cols-2 gap-6">
                    <div class="col-span-1 border border-gray-200 rounded-lg m-4">
                        <div class="items-center gap-2 pb-4 rounded-lg p-4" style="justify-content: space-between;">
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                Solicitudes
                            </label>
                        </div>
                        <hr>
                        <div class="grid grid-cols-4 gap-6 mt-2 p-4">
                            <div class="col-span-2"></div>
                            <div class="col-span-1 text-center"><strong>Plataforma</strong></div>
                            <div class="col-span-1 text-center"><strong>Email</strong></div>

                            <div class="col-span-2 text-left ml-2">Nueva solicitud asignada</div>
                            <div class="col-span-1 text-center">
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input checked id="sol_nueva_asignada_plataforma" type="checkbox" class="sr-only peer">
                                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                </label>
                            </div>
                            <div class="col-span-1 text-center">
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input checked id="sol_nueva_asignada_email" type="checkbox" class="sr-only peer">
                                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                </label>
                            </div>

                            <div class="col-span-2 text-left ml-2">Solicitud Actualizada</div>
                            <div class="col-span-1 text-center">
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input checked id="sol_actualizada_plataforma" type="checkbox" class="sr-only peer">
                                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                </label>
                            </div>
                            <div class="col-span-1 text-center">
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input checked id="sol_actualizada_email" type="checkbox" class="sr-only peer">
                                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                </label>
                            </div>

                            <div class="col-span-2 text-left ml-2">Solicitud Completada</div>
                            <div class="col-span-1 text-center">
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input checked id="sol_completada_plataforma" type="checkbox" class="sr-only peer">
                                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                </label>
                            </div>
                            <div class="col-span-1 text-center">
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input checked id="sol_completada_email" type="checkbox" class="sr-only peer">
                                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                </label>
                            </div>

                            <div class="col-span-2 text-left ml-2">Comentario Nuevo</div>
                            <div class="col-span-1 text-center">
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input checked id="sol_comentario_plataforma" type="checkbox" class="sr-only peer">
                                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                </label>
                            </div>
                            <div class="col-span-1 text-center">
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input checked id="sol_comentario_email" type="checkbox" class="sr-only peer">
                                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                </label>
                            </div>

                            <div class="col-span-2 text-left ml-2">Documento Adjuntado</div>
                            <div class="col-span-1 text-center">
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input checked id="sol_documento_plataforma" type="checkbox" class="sr-only peer">
                                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                </label>
                            </div>
                            <div class="col-span-1 text-center">
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input checked id="sol_documento_email" type="checkbox" class="sr-only peer">
                                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                </label>
                            </div>

                            <div class="col-span-2 text-left ml-2">Solicitud proxima a vencer</div>
                            <div class="col-span-1 text-center">
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input checked id="sol_proxima_vencer_plataforma" type="checkbox" class="sr-only peer">
                                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                </label>
                            </div>
                            <div class="col-span-1 text-center">
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input checked id="sol_proxima_vencer_email" type="checkbox" class="sr-only peer">
                                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                </label>
                            </div>

                            <div class="col-span-2 text-left ml-2">Solicitud vencida</div>
                            <div class="col-span-1 text-center">
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input checked id="sol_vencida_plataforma" type="checkbox" class="sr-only peer">
                                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                </label>
                            </div>
                            <div class="col-span-1 text-center">
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input checked id="sol_vencida_email" type="checkbox" class="sr-only peer">
                                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                </label>
                            </div>
                        </div>
                    </div>
                    <div class="col-span-1 border border-gray-200 rounded-lg m-4">
                        <div class="items-center gap-2 pb-4 rounded-lg p-4" style="justify-content: space-between;">
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                Colaboración
                            </label>
                        </div>
                        <hr>
                        <div class="grid grid-cols-4 gap-6 mt-2 p-4">
                            <div class="col-span-2"></div>
                            <div class="col-span-1 text-center"><strong>Plataforma</strong></div>
                            <div class="col-span-1 text-center"><strong>Email</strong></div>

                            <div class="col-span-2 text-left ml-2">Mencionado en un comentario</div>
                            <div class="col-span-1 text-center">
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input checked id="col_mencion_plataforma" type="checkbox" class="sr-only peer">
                                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                </label>
                            </div>
                            <div class="col-span-1 text-center">
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input checked id="col_mencion_email" type="checkbox" class="sr-only peer">
                                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                </label>
                            </div>

                            <div class="col-span-2 text-left ml-2">Respuesta a mi comentario</div>
                            <div class="col-span-1 text-center">
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input checked id="col_respuesta_plataforma" type="checkbox" class="sr-only peer">
                                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                </label>
                            </div>
                            <div class="col-span-1 text-center">
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input checked id="col_respuesta_email" type="checkbox" class="sr-only peer">
                                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    @push('scripts')
        <script src="{{ asset('js/notifications.js') }}"></script>
    @endpush
</x-app-layout>