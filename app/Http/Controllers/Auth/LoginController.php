<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

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
                throw ValidationException::withMessages([
                    'email' => 'Tu cuenta está inactiva. Contacta al administrador.',
                ]);
            }

            // Redirigir según rol
            if ($user->hasRole(['Super Administrador', 'Director OAPM'])) {
                return redirect()->intended('/admin/dashboard');
            } elseif ($user->hasRole('Ciudadano')) {
                return redirect()->intended('/portal/mis-solicitudes');
            } else {
                return redirect()->intended('/dashboard');
            }
        }

        // Si falla la autenticación
        throw ValidationException::withMessages([
            'email' => 'Las credenciales no coinciden con nuestros registros.',
        ]);
    }

    public function logout(Request $request)
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/login')->with('success', 'Has cerrado sesión correctamente');
    }
}
