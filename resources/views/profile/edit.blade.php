<x-app-layout>
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Header -->
        <div class="mb-8">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900">Editar Perfil</h1>
                    <p class="mt-2 text-sm text-gray-600">Actualiza tu información personal</p>
                </div>
                <a href="{{ route('profile.show') }}"
                   class="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                    </svg>
                    Volver
                </a>
            </div>
        </div>

        <!-- Edit Form -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200">
            <form id="profileForm" method="POST">
                @csrf
                @method('PUT')

                <div class="px-6 py-4 border-b border-gray-200">
                    <h3 class="text-lg font-semibold text-gray-900">Información Personal</h3>
                    <p class="mt-1 text-sm text-gray-600">Los campos con <span class="text-red-500">*</span> son obligatorios</p>
                </div>

                <div class="px-6 py-6 space-y-6">
                    <!-- Read-only fields -->
                    <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <p class="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Información No Editable</p>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Tipo de Documento</label>
                                <p class="mt-1 text-sm text-gray-900 bg-white px-3 py-2 rounded border border-gray-200">{{ $user->tipo_documento }}</p>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700">Número de Documento</label>
                                <p class="mt-1 text-sm text-gray-900 bg-white px-3 py-2 rounded border border-gray-200">{{ $user->cedula }}</p>
                            </div>

                            @if($user->esFuncionario())
                                @if($user->area)
                                <div>
                                    <label class="block text-sm font-medium text-gray-700">Área</label>
                                    <p class="mt-1 text-sm text-gray-900 bg-white px-3 py-2 rounded border border-gray-200">{{ $user->area->nombre }}</p>
                                </div>
                                @endif

                                @if($user->equipo)
                                <div>
                                    <label class="block text-sm font-medium text-gray-700">Equipo</label>
                                    <p class="mt-1 text-sm text-gray-900 bg-white px-3 py-2 rounded border border-gray-200">{{ $user->equipo->nombre }}</p>
                                </div>
                                @endif

                                @if($user->cargo)
                                <div>
                                    <label class="block text-sm font-medium text-gray-700">Cargo</label>
                                    <p class="mt-1 text-sm text-gray-900 bg-white px-3 py-2 rounded border border-gray-200">{{ $user->cargo }}</p>
                                </div>
                                @endif
                            @endif
                        </div>
                        <p class="mt-3 text-xs text-gray-500">
                            <svg class="inline w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                            </svg>
                            Estos campos solo pueden ser modificados por un administrador
                        </p>
                    </div>

                    <!-- Editable fields -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- Nombre -->
                        <div>
                            <label for="nombre" class="block text-sm font-medium text-gray-700">
                                Nombre <span class="text-red-500">*</span>
                            </label>
                            <input type="text"
                                   name="nombre"
                                   id="nombre"
                                   value="{{ old('nombre', $user->nombre) }}"
                                   required
                                   maxlength="255"
                                   class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            <p class="mt-1 text-xs text-red-600 hidden" id="nombre-error"></p>
                        </div>

                        <!-- Apellidos -->
                        <div>
                            <label for="apellidos" class="block text-sm font-medium text-gray-700">
                                Apellidos <span class="text-red-500">*</span>
                            </label>
                            <input type="text"
                                   name="apellidos"
                                   id="apellidos"
                                   value="{{ old('apellidos', $user->apellidos) }}"
                                   required
                                   maxlength="255"
                                   class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            <p class="mt-1 text-xs text-red-600 hidden" id="apellidos-error"></p>
                        </div>

                        <!-- Email -->
                        <div>
                            <label for="email" class="block text-sm font-medium text-gray-700">
                                Correo Electrónico <span class="text-red-500">*</span>
                            </label>
                            <input type="email"
                                   name="email"
                                   id="email"
                                   value="{{ old('email', $user->email) }}"
                                   required
                                   maxlength="255"
                                   class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            <p class="mt-1 text-xs text-red-600 hidden" id="email-error"></p>
                        </div>

                        <!-- Teléfono -->
                        <div>
                            <label for="telefono" class="block text-sm font-medium text-gray-700">
                                Teléfono
                            </label>
                            <input type="text"
                                   name="telefono"
                                   id="telefono"
                                   value="{{ old('telefono', $user->telefono) }}"
                                   maxlength="20"
                                   placeholder="Ej: 5551234"
                                   class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            <p class="mt-1 text-xs text-red-600 hidden" id="telefono-error"></p>
                        </div>

                        <!-- Celular -->
                        <div>
                            <label for="celular" class="block text-sm font-medium text-gray-700">
                                Celular
                            </label>
                            <input type="text"
                                   name="celular"
                                   id="celular"
                                   value="{{ old('celular', $user->celular) }}"
                                   maxlength="20"
                                   placeholder="Ej: 3001234567"
                                   class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            <p class="mt-1 text-xs text-red-600 hidden" id="celular-error"></p>
                        </div>

                        <!-- Dirección -->
                        <div class="md:col-span-2">
                            <label for="direccion" class="block text-sm font-medium text-gray-700">
                                Dirección
                            </label>
                            <textarea name="direccion"
                                      id="direccion"
                                      rows="3"
                                      maxlength="500"
                                      placeholder="Ej: Calle 15 # 10-25"
                                      class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">{{ old('direccion', $user->direccion) }}</textarea>
                            <p class="mt-1 text-xs text-gray-500">Máximo 500 caracteres</p>
                            <p class="mt-1 text-xs text-red-600 hidden" id="direccion-error"></p>
                        </div>
                    </div>
                </div>

                <!-- Form Actions -->
                <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between rounded-b-lg">
                    <div class="text-sm text-gray-600">
                        <svg class="inline w-4 h-4 mr-1 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                        </svg>
                        Todos los cambios serán registrados
                    </div>

                    <div class="flex gap-3">
                        <a href="{{ route('profile.show') }}"
                           class="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium">
                            Cancelar
                        </a>
                        <button type="submit"
                                class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center">
                            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                            </svg>
                            Guardar Cambios
                        </button>
                    </div>
                </div>
            </form>
        </div>

        <!-- Help Card -->
        <div class="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div class="flex">
                <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                    </svg>
                </div>
                <div class="ml-3">
                    <h3 class="text-sm font-medium text-blue-800">Información Importante</h3>
                    <div class="mt-2 text-sm text-blue-700">
                        <ul class="list-disc list-inside space-y-1">
                            <li>Los cambios en tu perfil serán efectivos inmediatamente</li>
                            <li>Si necesitas cambiar tu documento, área o cargo, contacta a un administrador</li>
                            <li>Para cambiar tu contraseña, contacta a un administrador</li>
                            <li>Tu foto de perfil se puede actualizar desde la página de visualización del perfil</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- SweetAlert2 -->
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

    <script>
        document.getElementById('profileForm').addEventListener('submit', async function(e) {
            e.preventDefault();

            // Clear previous errors
            document.querySelectorAll('[id$="-error"]').forEach(el => {
                el.textContent = '';
                el.classList.add('hidden');
            });

            // Clear error borders
            document.querySelectorAll('input, textarea').forEach(el => {
                el.classList.remove('border-red-500');
            });

            const formData = new FormData(this);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('{{ route("profile.update") }}', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (result.success) {
                    await Swal.fire({
                        title: 'Éxito',
                        text: result.message,
                        icon: 'success',
                        confirmButtonText: 'OK'
                    });

                    window.location.href = '{{ route("profile.show") }}';
                } else {
                    // Handle validation errors
                    if (result.errors) {
                        Object.keys(result.errors).forEach(field => {
                            const errorElement = document.getElementById(`${field}-error`);
                            const inputElement = document.getElementById(field);

                            if (errorElement && inputElement) {
                                errorElement.textContent = result.errors[field][0];
                                errorElement.classList.remove('hidden');
                                inputElement.classList.add('border-red-500');
                            }
                        });

                        Swal.fire({
                            title: 'Error de Validación',
                            text: 'Por favor corrige los errores en el formulario',
                            icon: 'error',
                            confirmButtonText: 'OK'
                        });
                    } else {
                        throw new Error(result.message || 'Error al actualizar el perfil');
                    }
                }
            } catch (error) {
                console.error('Error:', error);

                // Check if it's a validation error (422)
                if (error.response && error.response.status === 422) {
                    const errors = await error.response.json();
                    Object.keys(errors.errors || {}).forEach(field => {
                        const errorElement = document.getElementById(`${field}-error`);
                        const inputElement = document.getElementById(field);

                        if (errorElement && inputElement) {
                            errorElement.textContent = errors.errors[field][0];
                            errorElement.classList.remove('hidden');
                            inputElement.classList.add('border-red-500');
                        }
                    });

                    Swal.fire({
                        title: 'Error de Validación',
                        text: 'Por favor corrige los errores en el formulario',
                        icon: 'error',
                        confirmButtonText: 'OK'
                    });
                } else {
                    Swal.fire({
                        title: 'Error',
                        text: error.message || 'Error al actualizar el perfil',
                        icon: 'error',
                        confirmButtonText: 'OK'
                    });
                }
            }
        });
    </script>
</x-app-layout>
