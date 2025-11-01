<x-guest-layout>
    <div class="w-full max-w-md">
        <!-- Logo y Título -->
        <div class="text-center mb-8">
            <img src="{{ asset('images/logo.png') }}" alt="Logo" >
        </div>

        <!-- Card de Login -->
        <div class="bg-white rounded-lg shadow-xl p-8">
            <h2 class="text-2xl font-semibold text-gray-900 mb-6">Iniciar Sesión</h2>

            <!-- Mensajes de Sesión -->
            @if(session('success'))
                <div class="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
                    {{ session('success') }}
                </div>
            @endif

            @if(session('error'))
                <div class="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                    {{ session('error') }}
                </div>
            @endif

            <!-- Formulario -->
            <form id="loginForm" method="POST" action="{{ route('login') }}" x-data="{ showPassword: false }">
                @csrf

                <!-- Email -->
                <div class="mb-4">
                    <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
                        Correo Electrónico
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value="{{ old('email') }}"
                        required
                        autofocus
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent @error('email') border-red-500 @enderror"
                        placeholder="tu@email.com"
                    >
                    @error('email')
                        <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                    @enderror
                </div>

                <!-- Password -->
                <div class="mb-4">
                    <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
                        Contraseña
                    </label>
                    <div class="relative">
                        <input
                            :type="showPassword ? 'text' : 'password'"
                            id="password"
                            name="password"
                            required
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent @error('password') border-red-500 @enderror"
                            placeholder="••••••••"
                        >
                        <button
                            type="button"
                            @click="showPassword = !showPassword"
                            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                            <svg x-show="!showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                            </svg>
                            <svg x-show="showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
                            </svg>
                        </button>
                    </div>
                    @error('password')
                        <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                    @enderror
                </div>

                <!-- Recordarme -->
                <div class="flex items-center justify-between mb-6">
                    <label class="flex items-center">
                        <input
                            type="checkbox"
                            id="remember"
                            name="remember"
                            class="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        >
                        <span class="ml-2 text-sm text-gray-600">Recordarme</span>
                    </label>
                    <a href="#" class="text-sm text-green-600 hover:text-green-700">
                        ¿Olvidaste tu contraseña?
                    </a>
                </div>

                <input type="hidden" name="ip_publica" id="ip_publica">

                <!-- Botón Submit -->
                <button
                    id="btn_login"
                    type="submit"
                    class="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                >
                    Iniciar Sesión
                </button>
            </form>

            <!-- Registro (opcional) -->
        </div>

        <!-- Información de Prueba (SOLO DESARROLLO) -->
        <div class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p class="text-xs text-yellow-800 font-semibold mb-2">Credenciales de Prueba:</p>
            <p class="text-xs text-yellow-700">Email: admin@alcaldia.gov.co</p>
            <p class="text-xs text-yellow-700">Password: admin123</p>
        </div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            obtenerIpPublica().then(ip => {
                document.getElementById('ip_publica').value = ip;
            });
        });

        async function obtenerIpPublica() {
            try {
                const res = await fetch('https://api.ipify.org?format=json');
                if (!res.ok) throw new Error('Respuesta no OK');
                const data = await res.json();
                return data.ip; // cadena con la IP pública
            } catch (err) {
                console.error('No se pudo obtener la IP pública:', err);
                return null;
            }
        }

        document.getElementById('btn_login').addEventListener('click', function() {
            event.preventDefault();
            iniciarSesion();
        });

        async function iniciarSesion() {
            var btn_login = document.getElementById('btn_login');
            var text_btn_login = btn_login.textContent;
            btn_login.textContent = 'Iniciando sesión...';
            btn_login.disabled = true;
            btn_login.classList.add('opacity-50');
            btn_login.classList.add('cursor-not-allowed');
            btn_login.classList.remove('bg-green-600');
            btn_login.classList.add('bg-gray-400');

            const formData = new FormData(document.getElementById('loginForm'));
            formData.append('ip_publica', document.getElementById('ip_publica').value);
            formData.append('email', document.getElementById('email').value);
            formData.append('password', document.getElementById('password').value);
            formData.append('remember', document.getElementById('remember').checked);

            const response = await fetch('{{ route("login") }}', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                },
                body: formData
            });

            const result = await response.json();

            try {
                if (result.success) {
                    window.location.href = result.ruta;
                } else {
                    Swal.fire({
                        title: 'Error',
                        text: result.message,
                        icon: 'error',
                        confirmButtonText: 'OK'
                    });
                }
            } catch (error) {
                Swal.fire({
                    title: 'Error',
                    text: error.message || 'Error al iniciar sesión',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            } finally {
                btn_login.textContent = text_btn_login;
                btn_login.disabled = false;
                btn_login.classList.remove('opacity-50');
                btn_login.classList.remove('cursor-not-allowed');
                btn_login.classList.add('bg-green-600');
                btn_login.classList.remove('bg-gray-400');
                btn_login.classList.add('hover:bg-green-700');
                btn_login.classList.remove('hover:bg-gray-500');
            }
        }       
    </script>
</x-guest-layout>
