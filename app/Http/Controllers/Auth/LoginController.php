<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use App\Http\Controllers\SeguridadController;

class LoginController extends Controller
{
    public function showLoginForm()
    {
        // Si ya está autenticado, redirigir a dashboard
        if (Auth::check()) {
            return redirect()->route('dashboard');
        }

        return view('auth.login');
    }

    public function login(Request $request)
    {
        // Validar datos
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ], [
            'email.required' => 'El email es obligatorio',
            'email.email' => 'Ingresa un email válido',
            'password.required' => 'La contraseña es obligatoria',
        ]);

        // Intentar autenticación
        if (Auth::attempt($credentials, $request->boolean('remember'))) {
            $request->session()->regenerate();

            $user = Auth::user();

            // Verificar que el usuario esté activo
            if (!$user->activo) {
                Auth::logout();

                // Registrar intento de login de cuenta inactiva
                ActivityLog::log([
                    'user_id' => $user->id,
                    'user_name' => $user->nombre . ' ' . $user->apellidos,
                    'user_email' => $user->email,
                    'log_name' => 'auth',
                    'description' => 'Intento de inicio de sesión en cuenta inactiva',
                    'event' => 'login_failed',
                    'severity' => 'warning',
                    'is_important' => true,
                ]);

                throw ValidationException::withMessages([
                    'email' => 'Tu cuenta está inactiva. Contacta al administrador.',
                ]);
            }

            // Registrar login exitoso
            ActivityLog::logLogin($user);

            // Registrar sesión
            $seguridadController = new SeguridadController();
            $request->ip_privada = request()->ip();

            $seguridadController->registrarSesion($request);

            // Redirigir según rol
            $ruta = '';
            if ($user->hasRole(['Super Administrador', 'Director OAPM'])) {
                $ruta = '/admin/dashboard';
            } elseif ($user->hasRole('Ciudadano')) {
                $ruta = '/portal/mis-solicitudes';
            } else {
                $ruta = '/dashboard';
            }

            return json_encode([
                'success' => true,
                'message' => 'Sesión iniciada correctamente',
                'ruta' => $ruta,
            ]);
        } else {
            return json_encode([
                'success' => false,
                'message' => 'Las credenciales no coinciden con nuestros registros.',
            ]);
        }
    }

    public function logout(Request $request)
    {
        $user = Auth::user();
        $ip_privada = $request->ip();

        $request->merge([
            'ip_privada' => $request->ip(),
        ]);


        $seguridadController = new SeguridadController();
        $seguridadController->cambiarEstadoSesion($request);
        // Registrar logout antes de cerrar la sesión
        if ($user) {
            ActivityLog::logLogout($user);
        }

        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/login')->with('success', 'Has cerrado sesión correctamente');
    }
}
