<x-app-layout>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Header -->
        <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900">Mi Perfil</h1>
            <p class="mt-2 text-sm text-gray-600">Visualiza y actualiza tu información personal</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Profile Photo Card -->
            <div class="lg:col-span-1">
                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div class="text-center">
                        <div class="relative inline-block">
                            @if($user->foto_url)
                                <img src="{{ Storage::url($user->foto_url) }}"
                                     alt="{{ $user->nombre_completo }}"
                                     class="w-32 h-32 rounded-full object-cover border-4 border-blue-100"
                                     id="profilePhoto">
                            @else
                                <div class="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-4xl font-bold border-4 border-blue-100"
                                     id="profilePhoto">
                                    {{ strtoupper(substr($user->nombre, 0, 1) . substr($user->apellidos, 0, 1)) }}
                                </div>
                            @endif
                        </div>

                        <h2 class="mt-4 text-xl font-semibold text-gray-900">{{ $user->nombre_completo }}</h2>
                        <p class="text-sm text-gray-600">{{ $user->email }}</p>

                        @if($user->cargo)
                            <p class="mt-2 text-sm font-medium text-blue-600">{{ $user->cargo }}</p>
                        @endif

                        <div class="mt-6 space-y-2">
                            <button onclick="openPhotoModal()"
                                    class="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                                Cambiar foto
                            </button>

                            @if($user->foto_url)
                                <button onclick="deletePhoto()"
                                        class="w-full bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors">
                                    Eliminar foto
                                </button>
                            @endif
                        </div>

                        <!-- Status Badge -->
                        <div class="mt-4">
                            @if($user->activo)
                                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                                    </svg>
                                    Activo
                                </span>
                            @else
                                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    Inactivo
                                </span>
                            @endif
                        </div>
                    </div>
                </div>

                <!-- User Type Card -->
                <div class="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 class="text-sm font-semibold text-gray-900 mb-4">Tipo de Usuario</h3>
                    <div class="space-y-3">
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-gray-600">Categoría:</span>
                            <span class="text-sm font-medium text-gray-900">
                                @if($user->esFuncionario())
                                    Funcionario
                                @else
                                    Ciudadano
                                @endif
                            </span>
                        </div>

                        @if($user->roles->isNotEmpty())
                            <div class="pt-3 border-t">
                                <span class="text-xs font-semibold text-gray-600 uppercase tracking-wide">Roles:</span>
                                <div class="mt-2 space-y-1">
                                    @foreach($user->roles as $role)
                                        <span class="inline-block px-2 py-1 text-xs font-medium rounded bg-blue-50 text-blue-700">
                                            {{ $role->name }}
                                        </span>
                                    @endforeach
                                </div>
                            </div>
                        @endif
                    </div>
                </div>

              
            </div>

            <!-- Profile Information -->
            <div class="lg:col-span-2 space-y-6">
                <!-- Personal Information Card -->
                <div class="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                        <h3 class="text-lg font-semibold text-gray-900">Información Personal</h3>
                        <a href="{{ route('profile.edit') }}"
                           class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                            </svg>
                            Editar Perfil
                        </a>
                    </div>

                    <div class="px-6 py-4">
                        <dl class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <dt class="text-sm font-medium text-gray-500">Tipo de Documento</dt>
                                <dd class="mt-1 text-sm text-gray-900">{{ $user->tipo_documento }}</dd>
                            </div>

                            <div>
                                <dt class="text-sm font-medium text-gray-500">Número de Documento</dt>
                                <dd class="mt-1 text-sm text-gray-900">{{ $user->cedula }}</dd>
                            </div>

                            <div>
                                <dt class="text-sm font-medium text-gray-500">Nombre</dt>
                                <dd class="mt-1 text-sm text-gray-900">{{ $user->nombre }}</dd>
                            </div>

                            <div>
                                <dt class="text-sm font-medium text-gray-500">Apellidos</dt>
                                <dd class="mt-1 text-sm text-gray-900">{{ $user->apellidos }}</dd>
                            </div>

                            <div>
                                <dt class="text-sm font-medium text-gray-500">Correo Electrónico</dt>
                                <dd class="mt-1 text-sm text-gray-900">{{ $user->email }}</dd>
                            </div>

                            <div>
                                <dt class="text-sm font-medium text-gray-500">Teléfono</dt>
                                <dd class="mt-1 text-sm text-gray-900">{{ $user->telefono ?? 'No registrado' }}</dd>
                            </div>

                            <div>
                                <dt class="text-sm font-medium text-gray-500">Celular</dt>
                                <dd class="mt-1 text-sm text-gray-900">{{ $user->celular ?? 'No registrado' }}</dd>
                            </div>

                            <div>
                                <dt class="text-sm font-medium text-gray-500">Dirección</dt>
                                <dd class="mt-1 text-sm text-gray-900">{{ $user->direccion ?? 'No registrada' }}</dd>
                            </div>
                        </dl>
                    </div>
                </div>

                <!-- Work Information (only for internal users) -->
                @if($user->esFuncionario())
                <div class="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div class="px-6 py-4 border-b border-gray-200">
                        <h3 class="text-lg font-semibold text-gray-900">Información Laboral</h3>
                    </div>

                    <div class="px-6 py-4">
                        <dl class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            @if($user->area)
                            <div>
                                <dt class="text-sm font-medium text-gray-500">Área</dt>
                                <dd class="mt-1 text-sm text-gray-900">{{ $user->area->nombre }}</dd>
                            </div>
                            @endif

                            @if($user->equipo)
                            <div>
                                <dt class="text-sm font-medium text-gray-500">Equipo</dt>
                                <dd class="mt-1 text-sm text-gray-900">{{ $user->equipo->nombre }}</dd>
                            </div>
                            @endif

                            @if($user->cargo)
                            <div>
                                <dt class="text-sm font-medium text-gray-500">Cargo</dt>
                                <dd class="mt-1 text-sm text-gray-900">{{ $user->cargo }}</dd>
                            </div>
                            @endif
                        </dl>
                    </div>
                </div>
                @endif

                <!-- Recent Activity -->
                @if($activityLogs->isNotEmpty())
                <div class="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div class="px-6 py-4 border-b border-gray-200">
                        <h3 class="text-lg font-semibold text-gray-900">Últimos Accesos</h3>
                    </div>

                    <div class="px-6 py-4">
                        <div class="flow-root">
                            <ul class="-mb-8">
                                @foreach($activityLogs as $index => $log)
                                <li>
                                    <div class="relative pb-8">
                                        @if($index < $activityLogs->count() - 1)
                                        <span class="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                                        @endif

                                        <div class="relative flex space-x-3">
                                            <div>
                                                <span class="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center ring-8 ring-white">
                                                    <svg class="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
                                                    </svg>
                                                </span>
                                            </div>
                                            <div class="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                                <div>
                                                    <p class="text-sm text-gray-900">{{ $log->description }}</p>
                                                </div>
                                                <div class="text-right text-sm whitespace-nowrap text-gray-500">
                                                    <time datetime="{{ $log->created_at }}">{{ $log->created_at->diffForHumans() }}</time>
                                                </div>
                                                <div class="text-right text-sm whitespace-nowrap text-gray-500">
                                                    <p class="text-sm text-gray-900">{{ $log->ip_address }}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                                @endforeach
                            </ul>
                        </div>
                    </div>
                </div>
                @endif

                <!-- Account Information -->
                <div class="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div class="px-6 py-4 border-b border-gray-200">
                        <h3 class="text-lg font-semibold text-gray-900">Información de la Cuenta</h3>
                    </div>

                    <div class="px-6 py-4">
                        <dl class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <dt class="text-sm font-medium text-gray-500">Fecha de Registro</dt>
                                <dd class="mt-1 text-sm text-gray-900">{{ $user->created_at->format('d/m/Y H:i') }}</dd>
                            </div>

                            <div>
                                <dt class="text-sm font-medium text-gray-500">Última Actualización</dt>
                                <dd class="mt-1 text-sm text-gray-900">{{ $user->updated_at->format('d/m/Y H:i') }}</dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Photo Upload Modal -->
    <div id="photoModal" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-lg bg-white">
            <div class="mt-3">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Cambiar Foto de Perfil</h3>

                <form id="photoForm" enctype="multipart/form-data">
                    @csrf
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Selecciona una imagen
                        </label>
                        <input type="file"
                               name="foto"
                               id="fotoInput"
                               accept="image/*"
                               class="block w-full text-sm text-gray-500
                                      file:mr-4 file:py-2 file:px-4
                                      file:rounded-lg file:border-0
                                      file:text-sm file:font-semibold
                                      file:bg-blue-50 file:text-blue-700
                                      hover:file:bg-blue-100"
                               required>
                        <p class="mt-1 text-xs text-gray-500">PNG, JPG o GIF (máx. 2MB)</p>
                    </div>

                    <div class="flex gap-3 justify-end">
                        <button type="button"
                                onclick="closePhotoModal()"
                                class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors">
                            Cancelar
                        </button>
                        <button type="submit"
                                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            Subir Foto
                        </button>
                    </div>
                </form>
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
                                    onclick="togglePassword('current_password')"
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
                        <div class="relative">
                            <input type="password"
                                   name="new_password"
                                   id="new_password"
                                   required
                                   minlength="8"
                                   class="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            <button type="button"
                                    onclick="togglePassword('new_password')"
                                    class="absolute inset-y-0 right-0 pr-3 flex items-center">
                                <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                </svg>
                            </button>
                        </div>
                        <p class="mt-1 text-xs text-gray-500">Mínimo 8 caracteres</p>
                        <p class="mt-1 text-xs text-red-600 hidden" id="new_password-error"></p>
                    </div>

                    <!-- Confirm New Password -->
                    <div class="mb-6">
                        <label for="new_password_confirmation" class="block text-sm font-medium text-gray-700 mb-2">
                            Confirmar Nueva Contraseña <span class="text-red-500">*</span>
                        </label>
                        <div class="relative">
                            <input type="password"
                                   name="new_password_confirmation"
                                   id="new_password_confirmation"
                                   required
                                   minlength="8"
                                   class="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            <button type="button"
                                    onclick="togglePassword('new_password_confirmation')"
                                    class="absolute inset-y-0 right-0 pr-3 flex items-center">
                                <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                </svg>
                            </button>
                        </div>
                        <p class="mt-1 text-xs text-red-600 hidden" id="new_password_confirmation-error"></p>
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

    <!-- SweetAlert2 -->
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

    <script>
        function openPhotoModal() {
            document.getElementById('photoModal').classList.remove('hidden');
        }

        function closePhotoModal() {
            document.getElementById('photoModal').classList.add('hidden');
            document.getElementById('photoForm').reset();
        }

        // Handle photo upload
        document.getElementById('photoForm').addEventListener('submit', async function(e) {
            e.preventDefault();

            const formData = new FormData(this);

            try {
                mostrarSwalCargando('Subiendo foto, por favor espere...');
                const response = await fetch('{{ route("profile.photo.update") }}', {
                    method: 'POST',
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                    },
                    body: formData
                });

                const data = await response.json();
                Swal.close();

                if (data.success) {
                    await Swal.fire({
                        title: 'Éxito',
                        text: data.message,
                        icon: 'success',
                        confirmButtonText: 'OK'
                    });

                    location.reload();
                } else {
                    throw new Error(data.message || 'Error al subir la foto');
                }
            } catch (error) {
                Swal.fire({
                    title: 'Error',
                    text: error.message || 'Error al subir la foto',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        });

        // Handle photo deletion
        async function deletePhoto() {
            const result = await Swal.fire({
                title: '¿Estás seguro?',
                text: 'Se eliminará tu foto de perfil',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar'
            });

            if (result.isConfirmed) {
                try {
                    mostrarSwalCargando('Eliminando foto, por favor espere...');
                    const response = await fetch('{{ route("profile.photo.delete") }}', {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                            'Content-Type': 'application/json'
                        }
                    });

                    const data = await response.json();
                    Swal.close();
                    if (data.success) {
                        await Swal.fire({
                            title: 'Éxito',
                            text: data.message,
                            icon: 'success',
                            confirmButtonText: 'OK'
                        });

                        location.reload();
                    } else {
                        throw new Error(data.message || 'Error al eliminar la foto');
                    }
                } catch (error) {
                    Swal.fire({
                        title: 'Error',
                        text: error.message || 'Error al eliminar la foto',
                        icon: 'error',
                        confirmButtonText: 'OK'
                    });
                }
            }
        }

        // Close modal on outside click
        document.getElementById('photoModal').addEventListener('click', function(e) {
            if (e.target === this) {
                closePhotoModal();
            }
        });

        // Password Modal Functions
        function openPasswordModal() {
            document.getElementById('passwordModal').classList.remove('hidden');
        }

        function closePasswordModal() {
            document.getElementById('passwordModal').classList.add('hidden');
            document.getElementById('passwordForm').reset();
            // Clear error messages
            document.querySelectorAll('[id$="-error"]').forEach(el => {
                el.textContent = '';
                el.classList.add('hidden');
            });
            // Clear error borders
            document.querySelectorAll('#passwordForm input').forEach(el => {
                el.classList.remove('border-red-500');
            });
        }

        // Toggle password visibility
        function togglePassword(fieldId) {
            const field = document.getElementById(fieldId);
            field.type = field.type === 'password' ? 'text' : 'password';
        }

        // Handle password change
        document.getElementById('passwordForm').addEventListener('submit', async function(e) {
            e.preventDefault();

            // Clear previous errors
            document.querySelectorAll('[id$="-error"]').forEach(el => {
                el.textContent = '';
                el.classList.add('hidden');
            });
            document.querySelectorAll('#passwordForm input').forEach(el => {
                el.classList.remove('border-red-500');
            });

            const formData = new FormData(this);
            const data = Object.fromEntries(formData.entries());
            
            var password = data.new_password;
            var password_confirmation = data.new_password_confirmation;
            if (password !== password_confirmation) {
                Swal.fire({
                    title: 'Error',
                    text: 'Las contraseñas no coinciden',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
                return;
            }

            try {
                mostrarSwalCargando('Actualizando contraseña, por favor espere...');
                const response = await fetch('{{ route("profile.password.update") }}', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();
                Swal.close();
                if (result.success) {
                    closePasswordModal();
                    await Swal.fire({
                        title: 'Éxito',
                        text: result.message,
                        icon: 'success',
                        confirmButtonText: 'OK'
                    });
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
                    }

                    Swal.fire({
                        title: 'Error',
                        text: result.message || 'Error al actualizar la contraseña',
                        icon: 'error',
                        confirmButtonText: 'OK'
                    });
                }
            } catch (error) {
                console.error('Error:', error);
                Swal.fire({
                    title: 'Error',
                    text: 'Error al actualizar la contraseña',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        });

        // Close password modal on outside click
        document.getElementById('passwordModal').addEventListener('click', function(e) {
            if (e.target === this) {
                closePasswordModal();
            }
        });


        function mostrarSwalCargando(mensaje) {
            Swal.fire({
                title: mensaje,
                icon: 'info',
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false,
                allowClose: false,
                allowEscapeKey: false,
                progressBar: true,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
        }

    </script>
</x-app-layout>
