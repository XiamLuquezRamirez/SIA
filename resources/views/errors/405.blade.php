<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>405 - Método No Permitido</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100">
    <div class="min-h-screen flex items-center justify-center px-4">
        <div class="max-w-lg w-full">
            <div class="bg-white rounded-lg shadow-xl p-8 text-center">
                <!-- Icono de Error -->
                <div class="flex justify-center mb-6">
                    <svg class="w-24 h-24 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                </div>

                <!-- Código de Error -->
                <h1 class="text-6xl font-bold text-gray-800 mb-4">405</h1>
                
                <!-- Mensaje -->
                <h2 class="text-2xl font-semibold text-gray-700 mb-4">
                    Método No Permitido
                </h2>
                
                <p class="text-gray-600 mb-8">
                    La acción que intentas realizar no está permitida o tu sesión ha expirado.
                </p>

                <!-- Botones de Acción -->
                <div class="flex flex-col sm:flex-row gap-4 justify-center">
                    <a href="/login" class="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition">
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                        </svg>
                        Iniciar Sesión
                    </a>
                    <button onclick="window.location.reload()" class="inline-flex items-center justify-center px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition">
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                        </svg>
                        Recargar Página
                    </button>
                </div>

                <!-- Información Adicional -->
                <div class="mt-8 pt-6 border-t border-gray-200">
                    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                        <p class="text-sm text-yellow-800 font-medium mb-2">
                            <svg class="w-5 h-5 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
                            </svg>
                            ¿Por qué veo este error?
                        </p>
                        <ul class="text-sm text-yellow-700 text-left list-disc list-inside">
                            <li>Tu sesión pudo haber expirado</li>
                            <li>Intentaste acceder a una función sin los permisos necesarios</li>
                            <li>La página fue recargada después de enviar un formulario</li>
                        </ul>
                    </div>
                    <p class="text-sm text-gray-500">
                        Si el problema persiste, contacta al administrador del sistema.
                    </p>
                </div>
            </div>

            <!-- Debug Info (Solo en desarrollo) -->
            @if(config('app.debug'))
                <div class="mt-4 bg-gray-800 text-white p-4 rounded-lg text-sm">
                    <p class="font-semibold mb-2">Debug Info:</p>
                    <p>URL solicitada: {{ request()->url() }}</p>
                    <p>Método: {{ request()->method() }}</p>
                    <p>Usuario autenticado: {{ auth()->check() ? 'Sí' : 'No' }}</p>
                </div>
            @endif
        </div>
    </div>
</body>
</html>

