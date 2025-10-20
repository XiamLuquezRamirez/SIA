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

    // Rutas de perfil de usuario
    Route::prefix('profile')->name('profile.')->group(function () {
        Route::get('/', [App\Http\Controllers\ProfileController::class, 'show'])->name('show');
        Route::get('/edit', [App\Http\Controllers\ProfileController::class, 'edit'])->name('edit');
        Route::put('/update', [App\Http\Controllers\ProfileController::class, 'update'])->name('update');
        Route::post('/photo', [App\Http\Controllers\ProfileController::class, 'updatePhoto'])->name('photo.update');
        Route::delete('/photo', [App\Http\Controllers\ProfileController::class, 'deletePhoto'])->name('photo.delete');
        Route::put('/password', [App\Http\Controllers\ProfileController::class, 'updatePassword'])->name('password.update');
    });

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

        // Ruta para restablecer contraseña
        Route::post('api/usuarios/{usuario}/restablecer-password', [App\Http\Controllers\Admin\UserController::class, 'restablecerPassword'])
            ->name('api.usuarios.restablecer-password');

        // Ruta para actualizar roles
        Route::post('api/usuarios/{usuario}/actualizar-roles', [App\Http\Controllers\Admin\UserController::class, 'actualizarRoles'])
            ->name('api.usuarios.actualizar-roles');

        // Rutas de acciones masivas
        Route::post('usuarios/exportar', [App\Http\Controllers\Admin\UserController::class, 'exportarMasivo'])
            ->name('usuarios.exportar');
        Route::post('api/usuarios/cambiar-estado-masivo', [App\Http\Controllers\Admin\UserController::class, 'cambiarEstadoMasivo'])
            ->name('api.usuarios.cambiar-estado-masivo');
        Route::post('api/usuarios/asignar-rol-masivo', [App\Http\Controllers\Admin\UserController::class, 'asignarRolMasivo'])
            ->name('api.usuarios.asignar-rol-masivo');

        // API auxiliares
        Route::get('api/areas', [App\Http\Controllers\Admin\UserController::class, 'getAreas'])
            ->name('api.areas');
        Route::get('api/equipos', [App\Http\Controllers\Admin\UserController::class, 'getEquipos'])
            ->name('api.equipos');
        Route::get('api/usuarios/{usuario}', [App\Http\Controllers\Admin\UserController::class, 'show'])
            ->name('api.usuarios.show');
        Route::get('api/usuarios', [App\Http\Controllers\Admin\UserController::class, 'getUsuariosForSelect'])
            ->name('api.usuarios');

        // Rutas API para gestión de roles
        Route::get('api/roles', [App\Http\Controllers\Admin\RoleController::class, 'index'])
            ->name('api.roles.index');
        Route::get('api/roles/{role}', [App\Http\Controllers\Admin\RoleController::class, 'show'])
            ->name('api.roles.show');
        Route::post('api/roles', [App\Http\Controllers\Admin\RoleController::class, 'store'])
            ->name('api.roles.store');
        Route::put('api/roles/{role}', [App\Http\Controllers\Admin\RoleController::class, 'update'])
            ->name('api.roles.update');
        Route::delete('api/roles/{role}', [App\Http\Controllers\Admin\RoleController::class, 'destroy'])
            ->name('api.roles.destroy');

        // Rutas para gestión de permisos de roles
        Route::get('api/permisos', [App\Http\Controllers\Admin\RoleController::class, 'getPermisos'])
            ->name('api.permisos');
        Route::post('api/roles/{role}/permisos', [App\Http\Controllers\Admin\RoleController::class, 'updatePermisos'])
            ->name('api.roles.permisos');

        // Ruta para clonar rol
        Route::post('api/roles/{role}/clonar', [App\Http\Controllers\Admin\RoleController::class, 'clonar'])
            ->name('api.roles.clonar');

        // Rutas para tipos de solicitud
        Route::get('tipos-solicitud', [App\Http\Controllers\Admin\TipoSolicitudController::class, 'index'])
            ->name('configurarSolicitudes.index');
        
        // IMPORTANTE: Rutas específicas ANTES de rutas con parámetros {tipo}
        Route::get('api/tipos-solicitud/categorias', [App\Http\Controllers\Admin\TipoSolicitudController::class, 'getCategorias'])
            ->name('api.tipos-solicitud.categorias');
        
        Route::get('api/tipos-solicitud', [App\Http\Controllers\Admin\TipoSolicitudController::class, 'index'])
            ->name('api.tipos-solicitud.index');
        Route::post('api/tipos-solicitud', [App\Http\Controllers\Admin\TipoSolicitudController::class, 'store'])
            ->name('api.tipos-solicitud.store');
        Route::patch('api/tipos-solicitud/{tipo}/toggle', [App\Http\Controllers\Admin\TipoSolicitudController::class, 'toggleEstado'])
            ->name('api.tipos-solicitud.toggle');
        Route::get('api/tipos-solicitud/{tipo}', [App\Http\Controllers\Admin\TipoSolicitudController::class, 'show'])
            ->name('api.tipos-solicitud.show');
        Route::put('api/tipos-solicitud/{tipo}', [App\Http\Controllers\Admin\TipoSolicitudController::class, 'update'])
            ->name('api.tipos-solicitud.update');
        Route::delete('api/tipos-solicitud/{tipo}', [App\Http\Controllers\Admin\TipoSolicitudController::class, 'destroy'])
            ->name('api.tipos-solicitud.destroy');

        // Ruta para obtener lista de áreas (usado en wizards)
        Route::get('areas', function() {
            return response()->json(App\Models\Area::orderBy('nombre')->get(['id', 'nombre']));
        })->name('api.areas');

        // Rutas para historia de usuario dependencias
        Route::resource('dependencias', App\Http\Controllers\Admin\DependenciasController::class);

        // Rutas para historial de actividades del sistema
        Route::get('activity-logs', [App\Http\Controllers\Admin\ActivityLogController::class, 'index'])
            ->name('activity-logs.index');
        Route::get('activity-logs/activities', [App\Http\Controllers\Admin\ActivityLogController::class, 'getActivities'])
            ->name('activity-logs.activities');
        Route::get('activity-logs/stats', [App\Http\Controllers\Admin\ActivityLogController::class, 'getStats'])
            ->name('activity-logs.stats');


        // Rutas para gestion de dependencias
        Route::post('guardar-dependencia', [App\Http\Controllers\Admin\DependenciasController::class, 'guardarDependencia'])->name('guardar-dependencia');
        Route::get('dependencias/{dependencia}', [App\Http\Controllers\Admin\DependenciasController::class, 'show'])->name('dependencias.show');
        Route::post('editar-dependencia/{dependencia}', [App\Http\Controllers\Admin\DependenciasController::class, 'update'])->name('editar-dependencia');
        Route::post('alternar-estado-dependencia/{dependencia}', [App\Http\Controllers\Admin\DependenciasController::class, 'alternarEstadoDependencia'])->name('alternar-estado-dependencia');
        Route::delete('eliminar-dependencia/{dependencia}', [App\Http\Controllers\Admin\DependenciasController::class, 'eliminarDependencia'])->name('eliminar-dependencia');
        Route::get('dependencias-select', [App\Http\Controllers\Admin\DependenciasController::class, 'getDependenciasSelect'])->name('dependencias.select');
       
        // Rutas para gestion de equipos
        Route::resource('equipos', App\Http\Controllers\Admin\EquiposController::class);
        Route::get('usuarios-area-select', [App\Http\Controllers\Admin\EquiposController::class, 'getUsuariosAreaSelect'])->name('usuarios-area.select');
        Route::post('guardar-equipo', [App\Http\Controllers\Admin\EquiposController::class, 'guardarEquipo'])->name('guardar-equipo');
    });
});
