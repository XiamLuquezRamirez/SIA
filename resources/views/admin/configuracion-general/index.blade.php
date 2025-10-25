<x-app-layout>
    <x-slot name="title">Configuración General</x-slot>
    <div class="container mx-auto px-4 py-6">
        <div class="flex justify-between items-center mb-6">
            <div>
                <h1 class="text-2xl font-bold text-gray-800">Configuración General</h1>
                <p class="text-gray-600 text-sm">Administrar configuración general del sistema</p>
            </div>
            <div class="flex items-center gap-2">
                <button onclick="abrirModalImportarFestivos()" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                    <svg width="20px" height="20px" viewBox="0 0 15 15" fill="#ffffff" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 1.5C0 0.671573 0.671573 0 1.5 0H10.0858C10.4836 0 10.8651 0.158035 11.1464 0.43934L14.5607 3.85355C14.842 4.13486 15 4.51639 15 4.91421V13.5C15 14.3284 14.3284 15 13.5 15H11V11.5C11 10.6716 10.3284 10 9.5 10H5.5C4.67157 10 4 10.6716 4 11.5V15H1.5C0.671573 15 0 14.3284 0 13.5V1.5Z" fill="#ffffff"/>
                        <path d="M5 15H10V11.5C10 11.2239 9.77614 11 9.5 11H5.5C5.22386 11 5 11.2239 5 11.5V15Z" fill="#ffffff"/>
                    </svg>
                    Guardar Cambios
                </button>
                <button onclick="abrirModalCrearFestivo()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                    <svg width="25px" height="25px" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5.88468 17C7.32466 19.1128 9.75033 20.5 12.5 20.5C16.9183 20.5 20.5 16.9183 20.5 12.5C20.5 8.08172 16.9183 4.5 12.5 4.5C8.08172 4.5 4.5 8.08172 4.5 12.5V13.5M12.5 8V12.5L15.5 15.5" stroke="#ffffff" stroke-width="1.2"/>
                        <path d="M7 11L4.5 13.5L2 11" stroke="#ffffff" stroke-width="1.2"/>
                    </svg>
                    Restaurar Valores por Defecto
                </button>
            </div>
        </div>
    </div>

     <!-- Tabs -->
     <div class="border-b border-gray-200">
        <nav class="-mb-px flex space-x-8">
            <button style="padding-left: 20px; padding-right: 20px;" id="BtnviewTab_informacion_general" onclick="cambiarTabVista('informacion_general')" class="view-tab-button active border-b-2 border-blue-600 py-4 px-1 text-sm font-medium text-blue-600">
                Información General
            </button>
            <button style="padding-left: 20px; padding-right: 20px;" id="BtnviewTab_horarios_atencion" onclick="cambiarTabVista('horarios_atencion')" class="view-tab-button border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                Horarios de Atención
            </button>
            <button style="padding-left: 20px; padding-right: 20px;" id="BtnviewTab_archivos" onclick="cambiarTabVista('archivos')" class="view-tab-button border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                Archivos
            </button>
        </nav>
    </div>

    <form id="formConfiguracionGeneral" enctype="multipart/form-data">
        <div class="bg-white rounded-lg shadow-sm overflow-hidden p-6">
            <div id="viewTab_informacion_general" class="view-tab-content">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Foto de perfil -->
                    <div class="md:col-span-2 flex justify-center mb-4 p-4">
                        <div class="text-center">
                            <div class="relative inline-block">
                                <div id="photoPreview" class="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-gray-300">
                                    <svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                    </svg>
                                </div>
                                <label for="foto" class="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                    </svg>
                                </label>
                                <input type="file" id="foto" name="foto" accept="image/jpeg,image/png,image/jpg" class="hidden" onchange="manejarSubidaFoto(event)">
                            </div>
                            <p class="text-xs text-gray-500 mt-2">Máx. 2MB - JPG, PNG</p>
                            <p class="text-xs text-gray-500 mt-2">Tamaño recomendado: 500 x 500px</p>
                        </div>
                    </div>
                    <!-- Nit de la Entidad -->
                    <div class="md:col-span-1">
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Nit <span class="text-red-500">*</span>
                        </label>
                        <input type="text" name="nit" id="nit"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Ej: 1234567890">
                        <span class="error-message text-red-500 text-xs hidden"></span>
                    </div>
                    <!-- Nombre de la Entidad -->
                    <div class="md:col-span-1">
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Nombre de la Entidad <span class="text-red-500">*</span>
                        </label>
                        <input type="text" name="nombre" id="nombre"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Ej: Ministerio de Salud">
                        <span class="error-message text-red-500 text-xs hidden"></span>
                    </div>
                    <!-- Dirección -->  
                    <div class="md:col-span-1">
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Dirección <span class="text-red-500">*</span>
                        </label>
                        <input type="text" name="direccion" id="direccion"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Ej: Calle 123 # 45-67">
                        <span class="error-message text-red-500 text-xs hidden"></span>
                    </div>
                    <!-- Departamento -->
                    <div class="md:col-span-1">
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Departamento <span class="text-red-500">*</span>
                        </label>
                        <select onchange="cargarCiudades()" name="departamento" id="departamento" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <option value="">Seleccione un departamento</option>
                        </select>
                        <span class="error-message text-red-500 text-xs hidden"></span>
                    </div>
                     <!-- Ciudad -->
                     <div class="md:col-span-1">
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Ciudad <span class="text-red-500">*</span>
                        </label>
                        <select name="ciudad" id="ciudad" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <option value="">Seleccione una ciudad</option>
                        </select>
                        <span class="error-message text-red-500 text-xs hidden"></span>
                    </div>
                    <!-- Teléfono Principal -->
                    <div class="md:col-span-1">
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Teléfono Principal <span class="text-red-500">*</span>
                        </label>
                        <input type="text" name="telefono_principal" id="telefono_principal"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Ej: 3178901234">
                        <span class="error-message text-red-500 text-xs hidden"></span>
                    </div>
                    <!-- Teléfono Secundario -->
                    <div class="md:col-span-1">
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Teléfono Secundario <span class="text-red-500">*</span>
                        </label>
                        <input type="text" name="telefono_secundario" id="telefono_secundario"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Ej: 3178901234">
                        <span class="error-message text-red-500 text-xs hidden"></span>
                    </div>
                    <!-- Email de Contacto -->
                    <div class="md:col-span-1">
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Email de Contacto <span class="text-red-500">*</span>
                        </label>
                        <input type="email" name="email_contacto" id="email_contacto"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Ej: info@ministeriosalud.gov.co">
                    </div>
                    <!-- Sitio Web -->
                    <div class="md:col-span-1">
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Sitio Web <span class="text-red-500">*</span>
                        </label>
                        <input type="text" name="sitio_web" id="sitio_web"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Ej: https://www.ministeriosalud.gov.co">
                        <span class="error-message text-red-500 text-xs hidden"></span>
                    </div>
                    <!-- Slogan -->
                    <div class="md:col-span-1">
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Slogan <span class="text-red-500">*</span>
                        </label>
                        <input type="text" name="slogan" id="slogan"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Ej: Salud para todos">
                        <span class="error-message text-red-500 text-xs hidden"></span>
                    </div>
                </div>
            </div>
            <div id="viewTab_horarios_atencion" class="view-tab-content">
                <div class="flex justify-between items-center mb-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4" style="width: 100%;">
                    <div class="md:col-span-2">
                        <p class="block text-sm font-medium text-gray-700 mb-1" style="font-size: 20px;">
                            <i> Define el horario de atención de la entidad </i>
                        </p>
                    </div>
                    <div class="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 border border-gray-200 pb-4 rounded-lg p-4" style="width: 100%;">
                        <!-- Horario de Atención -->
                        <div class="md:col-span-2 mb-1">
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                Horario de Atención lunes a viernes<span class="text-red-500">*</span>
                            </label>
                        </div>
                        <div class="md:col-span-1 mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                Desde <span class="text-red-500">*</span>
                            </label>
                            <input type="time" name="horario_lunes_viernes_desde" id="horario_lunes_viernes_desde" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>
                        <div class="md:col-span-1 mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                Hasta <span class="text-red-500">*</span>
                            </label>
                            <input type="time" name="horario_lunes_viernes_hasta" id="horario_lunes_viernes_hasta" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>
                    </div>
                    <div class="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 border border-gray-200 pb-4 rounded-lg p-4" style="width: 100%;">
                        <div class="col-span-2 mb-1">
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                ¿Desea habilitar los sábados? <span class="text-red-500">*</span>
                            </label>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input checked id="habilitar_sabados" type="checkbox" class="sr-only peer" onchange="mostrarHorarioSabado()">
                                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                            </label>
                        </div>
                        <div id="horario_sabado" class="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div class="md:col-span-1">
                                <label class="block text-sm font-medium text-gray-700 mb-1">
                                    Desde <span class="text-red-500">*</span>
                                </label>
                                <input type="time" name="horario_lunes_viernes_desde" id="horario_lunes_viernes_desde" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            </div>
                            <div class="md:col-span-1">
                                <label class="block text-sm font-medium text-gray-700 mb-1">
                                    Hasta <span class="text-red-500">*</span>
                                </label>
                                <input type="time" name="horario_lunes_viernes_hasta" id="horario_lunes_viernes_hasta" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            </div>
                        </div>
                    </div>
                    <div class="col-span-1 grid grid-cols-1 md:grid-cols-1 gap-4 border border-gray-200 pb-4 rounded-lg p-4" style="width: 100%;">
                        <div class="md:col-span-1 mb-4 mt-4">
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                ¿Desea enviar recordatorios de solicitudes vencidas? <span class="text-red-500">*</span>
                            </label>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input checked id="habilitar_recordatorio_vencidas" type="checkbox" class="sr-only peer" onchange="mostrarHoraRecordatorioVencidas()">
                                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                            </label>
                            <div id="hora_recordatorio_vencidas">
                                <label class="block text-sm font-medium text-gray-700 mb-1">
                                    Hora de envío recordatorio de solicitudes vencidas <span class="text-red-500">*</span>
                                </label>
                                <input type="time" name="hora_recordatorio_vencidas" id="hora_recordatorio_vencidas" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            </div>
                        </div>
                    </div>
                    <div class="col-span-1 grid grid-cols-1 md:grid-cols-1 gap-4 border border-gray-200 pb-4 rounded-lg p-4" style="width: 100%;">
                        <div class="md:col-span-1 mb-4 mt-4" id="hora_recordatorio_vencidas">
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                ¿Enviar recordatorio de alertas amarillas? <span class="text-red-500">*</span>
                            </label>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input checked id="habilitar_recordatorio_alertas_amarillas" type="checkbox" class="sr-only peer" onchange="mostrarHoraRecordatorioAlertasAmarillas()">
                                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                            </label>
                            <div id="hora_recordatorio_alertas_amarillas">
                                <label class="block text-sm font-medium text-gray-700 mb-1">
                                    Hora de envío recordatorio de solicitudes vencidas <span class="text-red-500">*</span>
                                </label>
                                <input type="time" name="hora_recordatorio_alertas_amarillas" id="hora_recordatorio_alertas_amarillas" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </form>

    @push('styles')
    <link rel="stylesheet" href="{{ asset('css/admin/usuarios-modal.css') }}">
    <link rel="stylesheet" href="{{ asset('css/admin/tippy.css') }}">
    @endpush

    @push('scripts')
    <script src="{{ asset('js/admin/configuracion_general.js') }}"></script>
    @endpush
</x-app-layout>