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

    // ========================================
    // RUTAS DE ADMINISTRACIÓN
    // ========================================
    Route::prefix('admin')->name('admin.')->middleware('role:Super Administrador|Director OAPM')->group(function () {
        
        // ========================================
        // 📁 SOLICITUDES
        // ========================================
        Route::prefix('solicitudes')->name('solicitudes.')->group(function () {
            // Bandeja de Solicitudes
            Route::get('/', [App\Http\Controllers\Admin\SolicitudController::class, 'index'])->name('index');
            
            // Agregar Solicitud
            Route::get('create', [App\Http\Controllers\Admin\SolicitudController::class, 'create'])->name('create');
            Route::post('/', [App\Http\Controllers\Admin\SolicitudController::class, 'store'])->name('store');
            
            // Ver/Editar/Eliminar Solicitud
            Route::get('{solicitud}', [App\Http\Controllers\Admin\SolicitudController::class, 'show'])->name('show');
            Route::get('{solicitud}/edit', [App\Http\Controllers\Admin\SolicitudController::class, 'edit'])->name('edit');
            Route::put('{solicitud}', [App\Http\Controllers\Admin\SolicitudController::class, 'update'])->name('update');
            Route::delete('{solicitud}', [App\Http\Controllers\Admin\SolicitudController::class, 'destroy'])->name('destroy');
            
            // Tipos de Solicitud
            Route::get('tipos', [App\Http\Controllers\Admin\TipoSolicitudController::class, 'index'])
                ->name('tipos.index');
            
            // APIs de Tipos de Solicitud
            Route::prefix('api/tipos')->name('api.tipos.')->group(function () {
                Route::get('categorias', [App\Http\Controllers\Admin\TipoSolicitudController::class, 'getCategorias'])->name('categorias');
                Route::get('/', [App\Http\Controllers\Admin\TipoSolicitudController::class, 'index'])->name('index');
                Route::post('/', [App\Http\Controllers\Admin\TipoSolicitudController::class, 'store'])->name('store');
                Route::get('{tipo}', [App\Http\Controllers\Admin\TipoSolicitudController::class, 'show'])->name('show');
                Route::put('{tipo}', [App\Http\Controllers\Admin\TipoSolicitudController::class, 'update'])->name('update');
                Route::patch('{tipo}/toggle', [App\Http\Controllers\Admin\TipoSolicitudController::class, 'toggleEstado'])->name('toggle');
                Route::delete('{tipo}', [App\Http\Controllers\Admin\TipoSolicitudController::class, 'destroy'])->name('destroy');
                Route::post('{tipo}/plantillas', [App\Http\Controllers\Admin\TipoSolicitudController::class, 'guardarPlantillas'])->name('plantillas');
            });
        });
        
        // Alias para compatibilidad con código existente
        Route::get('tipos-solicitud', [App\Http\Controllers\Admin\TipoSolicitudController::class, 'index'])
            ->name('configurarSolicitudes.index');
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
        Route::post('api/tipos-solicitud/{tipo}/plantillas', [App\Http\Controllers\Admin\TipoSolicitudController::class, 'guardarPlantillas'])
            ->name('api.tipos-solicitud.plantillas');

        // ========================================
        // 👥 EQUIPOS Y ÁREAS
        // ========================================
        Route::prefix('equipos-areas')->name('equipos-areas.')->group(function () {
            // Áreas (Dependencias)
            Route::resource('dependencias', App\Http\Controllers\Admin\DependenciasController::class);
            Route::post('guardar-dependencia', [App\Http\Controllers\Admin\DependenciasController::class, 'guardarDependencia'])->name('guardar-dependencia');
            Route::get('dependencias/{dependencia}', [App\Http\Controllers\Admin\DependenciasController::class, 'show'])->name('dependencias-show');
            Route::post('editar-dependencia/{dependencia}', [App\Http\Controllers\Admin\DependenciasController::class, 'update'])->name('editar-dependencia');
            Route::post('alternar-estado-dependencia/{dependencia}', [App\Http\Controllers\Admin\DependenciasController::class, 'alternarEstadoDependencia'])->name('alternar-estado-dependencia');
            Route::delete('eliminar-dependencia/{dependencia}', [App\Http\Controllers\Admin\DependenciasController::class, 'eliminarDependencia'])->name('eliminar-dependencia');
            Route::get('dependencias-select', [App\Http\Controllers\Admin\DependenciasController::class, 'getDependenciasSelect'])->name('dependencias-select');
            Route::get('usuarios', [App\Http\Controllers\Admin\DependenciasController::class, 'getUsuarios'])->name('usuarios');

            // Rutas para gestion de equipos
            Route::resource('equipos', App\Http\Controllers\Admin\EquiposController::class);
            Route::get('equipos-area-select', [App\Http\Controllers\Admin\EquiposController::class, 'getEquiposAreaSelect'])->name('equipos-select');
            Route::get('usuarios-area-select', [App\Http\Controllers\Admin\EquiposController::class, 'getUsuariosAreaSelect'])->name('usuarios-area.select');
            Route::post('guardar-equipo', [App\Http\Controllers\Admin\EquiposController::class, 'guardarEquipo'])->name('guardar-equipo');
            Route::get('verificar-miembro-equipo', [App\Http\Controllers\Admin\EquiposController::class, 'verificarMiembroEquipo'])->name('equipos.verificar-miembro-equipo');
            Route::get('datos-equipo/{equipo}', [App\Http\Controllers\Admin\EquiposController::class, 'getDatosEquipo'])->name('equipos.get-datos-equipo');
            Route::post('editar-equipo/{equipo}', [App\Http\Controllers\Admin\EquiposController::class, 'update'])->name('editar-equipo');
            //obtener roles relacionados con lider de equipo mediante el slug
            Route::get('roles-lider-equipo', [App\Http\Controllers\Admin\EquiposController::class, 'getRolesLiderEquipo'])->name('equipos.roles-lider-equipo');
            Route::post('alternar-estado-equipo/{equipo}', [App\Http\Controllers\Admin\EquiposController::class, 'alternarEstadoEquipo'])->name('alternar-estado-equipo');
            Route::get('informacion-equipo/{equipo}', [App\Http\Controllers\Admin\EquiposController::class, 'getInformacionEquipo'])->name('equipos.get-informacion-equipo');
            Route::delete('eliminar-equipo/{equipo}', [App\Http\Controllers\Admin\EquiposController::class, 'eliminarEquipo'])->name('eliminar-equipo');
            Route::post('empleados-por-area-otros-equipos', [App\Http\Controllers\Admin\EquiposController::class, 'getEmpleadosPorAreaOtrosEquipos'])->name('equipos.get-empleados-por-area-otros-equipos');
            Route::post('agregar-miembros-equipo', [App\Http\Controllers\Admin\EquiposController::class, 'agregarMiembrosAlEquipo'])->name('equipos.agregar-miembros-equipo');
            Route::get('eliminar-miembro-equipo/{id_empleado}', [App\Http\Controllers\Admin\EquiposController::class, 'eliminarMiembroDelEquipo'])->name('equipos.eliminar-miembro-equipo');
            
            // Organigrama
            Route::get('organigrama', [App\Http\Controllers\Admin\DependenciasController::class, 'organigrama'])->name('dependencias.organigrama');
            Route::get('organigrama-data', [App\Http\Controllers\Admin\DependenciasController::class, 'getOrganigramaData'])->name('dependencias.organigrama-data');
        });


        Route::get('equipos-area-select', [App\Http\Controllers\Admin\EquiposController::class, 'getEquiposAreaSelect'])->name('equipos-select');
        Route::get('usuarios-area-select', [App\Http\Controllers\Admin\EquiposController::class, 'getUsuariosAreaSelect'])->name('usuarios-area.select');
    
        // ========================================
        // ⚙️ CONFIGURACIÓN
        // ========================================
        Route::prefix('configuracion')->name('configuracion.')->group(function () {
            // Flujos y Estados
            Route::get('flujos-estados', [App\Http\Controllers\Admin\FlujosAprobacionController::class, 'index'])
                ->name('flujos-estados');
            
            // Documentos (con sub-rutas)
            Route::prefix('documentos')->name('documentos.')->group(function () {
                Route::get('plantillas', function () {
                    return view('admin.configuracion.plantillas');
                })->name('plantillas');
                
                Route::get('consecutivos', function () {
                    return view('admin.configuracion.consecutivos');
                })->name('consecutivos');
            });
            
            // Parámetros Generales (con sub-rutas)
            Route::prefix('parametros')->name('parametros.')->group(function () {
                // ========================================
                // 📁 CATEGORÍAS
                // ========================================
                Route::resource('categorias', App\Http\Controllers\Admin\CategoriaController::class);
                Route::post('categorias/guardar', [App\Http\Controllers\Admin\CategoriaController::class, 'guardarCategoria'])->name('categorias.guardar');
                Route::get('categorias/consultar/{categoria}', [App\Http\Controllers\Admin\CategoriaController::class, 'consultarCategoria'])->name('categorias.consultar');
                Route::post('categorias/editar/{categoria}', [App\Http\Controllers\Admin\CategoriaController::class, 'editarCategoria'])->name('categorias.editar');
                Route::post('categorias/alternar-estado-categoria/{categoria}', [App\Http\Controllers\Admin\CategoriaController::class, 'alternarEstadoCategoria'])->name('categorias.alternar-estado-categoria');
                Route::get('categorias/eliminar/{categoria}', [App\Http\Controllers\Admin\CategoriaController::class, 'eliminarCategoria'])->name('categorias.eliminar');
                // ========================================
                // 📁 FESTIVOS
                // ========================================
                Route::get('festivos/ver-todos-festivos', [App\Http\Controllers\Admin\FestivosController::class, 'consultarTodosFestivos'])->name('festivos.consultar-todos-festivos');
                Route::resource('festivos', App\Http\Controllers\Admin\FestivosController::class);
                Route::post('festivos/guardar', [App\Http\Controllers\Admin\FestivosController::class, 'guardarFestivo'])->name('festivos.guardar');
                Route::get('festivos/consultar/{id_festivo}', [App\Http\Controllers\Admin\FestivosController::class, 'consultarFestivo'])->name('festivos.consultar');
                Route::get('festivos/consultar-disponibilidad/{fecha}', [App\Http\Controllers\Admin\FestivosController::class, 'consultarDisponibilidadFestivo'])->name('festivos.consultar-disponibilidad');
                Route::post('festivos/editar/{id_festivo}', [App\Http\Controllers\Admin\FestivosController::class, 'editarFestivo'])->name('festivos.editar');
                Route::post('festivos/alternar-aplicacion-sla-festivo/{id_festivo}', [App\Http\Controllers\Admin\FestivosController::class, 'alternarAplicacionSLAFestivo'])->name('festivos.alternar-aplicacion-sla-festivo');
                Route::post('festivos/consultar-disponibilidad-importar', [App\Http\Controllers\Admin\FestivosController::class, 'consultarDisponibilidadImportarFestivos'])->name('festivos.consultar-disponibilidad-importar');
                Route::post('festivos/importar-festivos', [App\Http\Controllers\Admin\FestivosController::class, 'importarFestivos'])->name('festivos.importar-festivos');
                Route::get('festivos/eliminar/{id_festivo}', [App\Http\Controllers\Admin\FestivosController::class, 'eliminarFestivo'])->name('festivos.eliminar');
            });
            
            // Alias para compatibilidad con código existente
            Route::get('categorias', function () {
                return view('admin.configuracion.categorias');
            })->name('categorias');
            Route::get('estados', function () {
                return view('admin.configuracion.estados');
            })->name('estados');
            Route::get('plantillas', function () {
                return view('admin.configuracion.plantillas');
            })->name('plantillas');
            Route::get('consecutivos', function () {
                return view('admin.configuracion.consecutivos');
            })->name('consecutivos');
            Route::get('festivos', function () {
                return view('admin.configuracion.festivos');
            })->name('festivos');
            Route::get('flujos-aprobacion', [App\Http\Controllers\Admin\FlujosAprobacionController::class, 'index'])
                ->name('flujos-aprobacion');
        });
        
        // API de Flujos de Aprobación
        Route::prefix('api/configuracion')->name('api.configuracion.')->group(function () {
            Route::get('estados', [App\Http\Controllers\Admin\FlujosAprobacionController::class, 'getEstados'])->name('estados');
            Route::get('flujos-transiciones', [App\Http\Controllers\Admin\FlujosAprobacionController::class, 'getTransiciones'])->name('flujos.transiciones.index');
            Route::post('flujos-transiciones', [App\Http\Controllers\Admin\FlujosAprobacionController::class, 'store'])->name('flujos.transiciones.store');
            Route::get('flujos-transiciones/{id}', [App\Http\Controllers\Admin\FlujosAprobacionController::class, 'show'])->name('flujos.transiciones.show');
            Route::put('flujos-transiciones/{id}', [App\Http\Controllers\Admin\FlujosAprobacionController::class, 'update'])->name('flujos.transiciones.update');
            Route::delete('flujos-transiciones/{id}', [App\Http\Controllers\Admin\FlujosAprobacionController::class, 'destroy'])->name('flujos.transiciones.destroy');
            Route::get('diagrama-flujo', [App\Http\Controllers\Admin\FlujosAprobacionController::class, 'getDiagramaFlujo'])->name('flujos.diagrama');
            Route::post('flujos-transiciones/validar', [App\Http\Controllers\Admin\FlujosAprobacionController::class, 'validarTransicion'])->name('flujos.validar');

            // Plantillas de Documentos
            Route::get('plantillas', [App\Http\Controllers\Admin\PlantillaDocumentoController::class, 'index'])->name('plantillas.index');
            Route::get('plantillas/{id}', [App\Http\Controllers\Admin\PlantillaDocumentoController::class, 'show'])->name('plantillas.show');
        });
        
        // ========================================
        // 🔒 USUARIOS Y ROLES
        // ========================================
        Route::prefix('usuarios')->name('usuarios.')->group(function () {
            // CRUD de usuarios
            Route::get('/', [App\Http\Controllers\Admin\UserController::class, 'index'])->name('index');
            Route::get('create', [App\Http\Controllers\Admin\UserController::class, 'create'])->name('create');
            Route::post('/', [App\Http\Controllers\Admin\UserController::class, 'store'])->name('store');
            Route::get('{usuario}', [App\Http\Controllers\Admin\UserController::class, 'show'])->name('show');
            Route::get('{usuario}/edit', [App\Http\Controllers\Admin\UserController::class, 'edit'])->name('edit');
            Route::put('{usuario}', [App\Http\Controllers\Admin\UserController::class, 'update'])->name('update');
            Route::delete('{usuario}', [App\Http\Controllers\Admin\UserController::class, 'destroy'])->name('destroy');
            
            // Acciones adicionales
            Route::patch('{usuario}/toggle-estado', [App\Http\Controllers\Admin\UserController::class, 'toggleEstado'])->name('toggle-estado');
            Route::get('{usuario}/detalle', [App\Http\Controllers\Admin\UserController::class, 'getDetalle'])->name('detalle');
            Route::get('{usuario}/actividad', [App\Http\Controllers\Admin\UserController::class, 'getActividad'])->name('actividad');
            
            // Exportación
            Route::post('exportar', [App\Http\Controllers\Admin\UserController::class, 'exportarMasivo'])->name('exportar');
        });
        
        // APIs de Usuarios y Roles
        Route::prefix('api')->name('api.')->group(function () {
            // Usuarios
            Route::get('usuarios', [App\Http\Controllers\Admin\UserController::class, 'getUsuariosForSelect'])->name('usuarios');
            Route::get('usuarios/{usuario}', [App\Http\Controllers\Admin\UserController::class, 'show'])->name('usuarios.show');
            Route::post('usuarios/{usuario}/restablecer-password', [App\Http\Controllers\Admin\UserController::class, 'restablecerPassword'])->name('usuarios.restablecer-password');
            Route::post('usuarios/{usuario}/actualizar-roles', [App\Http\Controllers\Admin\UserController::class, 'actualizarRoles'])->name('usuarios.actualizar-roles');
            Route::post('usuarios/cambiar-estado-masivo', [App\Http\Controllers\Admin\UserController::class, 'cambiarEstadoMasivo'])->name('usuarios.cambiar-estado-masivo');
            Route::post('usuarios/asignar-rol-masivo', [App\Http\Controllers\Admin\UserController::class, 'asignarRolMasivo'])->name('usuarios.asignar-rol-masivo');
            
            // Roles
            Route::get('roles/validate-slug', [App\Http\Controllers\Admin\RoleController::class, 'validateSlug'])->name('roles.validate-slug');
            Route::get('roles', [App\Http\Controllers\Admin\RoleController::class, 'index'])->name('roles.index');
            Route::post('roles', [App\Http\Controllers\Admin\RoleController::class, 'store'])->name('roles.store');
            Route::get('roles/{role}', [App\Http\Controllers\Admin\RoleController::class, 'show'])->name('roles.show');
            Route::put('roles/{role}', [App\Http\Controllers\Admin\RoleController::class, 'update'])->name('roles.update');
            Route::delete('roles/{role}', [App\Http\Controllers\Admin\RoleController::class, 'destroy'])->name('roles.destroy');
            Route::post('roles/{role}/permisos', [App\Http\Controllers\Admin\RoleController::class, 'updatePermisos'])->name('roles.permisos');
            Route::post('roles/{role}/clonar', [App\Http\Controllers\Admin\RoleController::class, 'clonar'])->name('roles.clonar');
            
            // Permisos
            Route::get('permisos', [App\Http\Controllers\Admin\RoleController::class, 'getPermisos'])->name('permisos');
            
            // Áreas y Equipos
            Route::get('areas', [App\Http\Controllers\Admin\UserController::class, 'getAreas'])->name('areas');
            Route::get('equipos', [App\Http\Controllers\Admin\UserController::class, 'getEquipos'])->name('equipos');
        });
        
        // ========================================
        // 🧾 AUDITORÍA Y MONITOREO
        // ========================================
        Route::prefix('auditoria')->name('auditoria.')->group(function () {
            Route::get('/', [App\Http\Controllers\Admin\ActivityLogController::class, 'index'])->name('index');
            Route::get('activities', [App\Http\Controllers\Admin\ActivityLogController::class, 'getActivities'])->name('activities');
            Route::get('stats', [App\Http\Controllers\Admin\ActivityLogController::class, 'getStats'])->name('stats');
        });
        
        // Alias para compatibilidad
        Route::get('activity-logs', [App\Http\Controllers\Admin\ActivityLogController::class, 'index'])->name('activity-logs.index');
        Route::get('activity-logs/activities', [App\Http\Controllers\Admin\ActivityLogController::class, 'getActivities'])->name('activity-logs.activities');
        Route::get('activity-logs/stats', [App\Http\Controllers\Admin\ActivityLogController::class, 'getStats'])->name('activity-logs.stats');
        
        // ========================================
        // 📊 REPORTES
        // ========================================
        // Route::prefix('reportes')->name('reportes.')->group(function () {
        //     Route::get('/', [App\Http\Controllers\Admin\ReportesController::class, 'index'])->name('index');
        // });
       
    });
});
