<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

// Ruta raíz redirige al login
Route::get('/', function () {
    return redirect()->route('login');
});

// Ruta /home (Laravel por defecto redirige aquí)
Route::get('/home', function () {
    // Si está autenticado, ir al dashboard
    if (auth()->check()) {
        $user = auth()->user();
        if ($user->hasRole(['Super Administrador', 'Director OAPM'])) {
            return redirect()->route('admin.dashboard');
        }
        return redirect()->route('dashboard');
    }
    // Si no está autenticado, ir al login
    return redirect()->route('login');
})->name('home');

// Rutas de autenticación (guest)
Route::middleware('guest')->group(function () {
    Route::get('/login', [LoginController::class, 'showLoginForm'])->name('login');
    Route::post('/login', [LoginController::class, 'login']);
});

// Rutas protegidas (requieren autenticación)
Route::middleware(['auth'])->group(function () {
    // Logout
    Route::post('/logout', [LoginController::class, 'logout'])->name('logout');

    // Dashboard principal
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Dashboard administrativo (para Super Admin y Director)
    Route::get('/admin/dashboard', [DashboardController::class, 'index'])
        ->middleware('role:Super Administrador|Director OAPM')
        ->name('admin.dashboard');

    // Rutas de administración de usuarios
    Route::prefix('admin')->name('admin.')->middleware('role:Super Administrador|Director OAPM')->group(function () {
        // CRUD de usuarios
        Route::resource('usuarios', App\Http\Controllers\Admin\UserController::class);

        // Rutas adicionales para usuarios
        Route::patch('usuarios/{usuario}/toggle-estado', [App\Http\Controllers\Admin\UserController::class, 'toggleEstado'])
            ->name('usuarios.toggle-estado');
        
        // Rutas para modal de detalle de usuario
        Route::get('usuarios/{usuario}/detalle', [App\Http\Controllers\Admin\UserController::class, 'getDetalle'])
            ->name('usuarios.detalle');
        Route::get('usuarios/{usuario}/actividad', [App\Http\Controllers\Admin\UserController::class, 'getActividad'])
            ->name('usuarios.actividad');

        // API auxiliares
        Route::get('api/areas', [App\Http\Controllers\Admin\UserController::class, 'getAreas'])
            ->name('api.areas');
        Route::get('api/equipos', [App\Http\Controllers\Admin\UserController::class, 'getEquipos'])
            ->name('api.equipos');
        Route::get('api/roles', [App\Http\Controllers\Admin\UserController::class, 'getRoles'])
            ->name('api.roles'); 


        // Rutas para historia de usuario dependencias
        Route::resource('dependencias', App\Http\Controllers\Admin\DependenciasController::class);
    });
});
