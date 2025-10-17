<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // Dashboard según rol
        if ($user->hasRole('Super Administrador') || $user->hasRole('Director OAPM')) {
            return view('admin.dashboard', compact('user'));
        } elseif ($user->hasRole('Coordinador de Área')) {
            return view('coordinador.dashboard', compact('user'));
        } elseif ($user->hasRole('Líder de Equipo')) {
            return view('lider.dashboard', compact('user'));
        } elseif ($user->hasRole('Ciudadano')) {
            return view('portal.dashboard', compact('user'));
        } else {
            // Funcionario operativo u otros roles
            return view('dashboard', compact('user'));
        }
    }
}
