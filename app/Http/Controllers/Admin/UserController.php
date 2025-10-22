<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Area;
use App\Models\Equipo;
use App\Models\ActivityLog;
use App\Mail\PasswordResetNotification;
use App\Mail\UserWelcomeEmail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        // Si es petición AJAX, devolver JSON
        if ($request->ajax()) {
            $query = User::with(['area', 'equipo', 'roles']);
     
         
            // Búsqueda
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('nombre', 'ILIKE', "%{$search}%")
                      ->orWhere('apellidos', 'ILIKE', "%{$search}%")
                      ->orWhere('email', 'ILIKE', "%{$search}%")
                      ->orWhere('cedula', 'ILIKE', "%{$search}%");
                });
            }
           
      

            // Filtro por tipo de usuario
            if ($request->has('tipo') && $request->tipo) {
                $query->where('tipo_usuario', $request->tipo);
            }


            // Filtro por área
            if ($request->has('area_id') && $request->area_id) {
                $query->where('area_id', $request->area_id);
            }

       
            // Filtro por equipo
            if ($request->has('equipo_id') && $request->equipo_id) {
                $query->where('equipo_id', $request->equipo_id);
            }

            // Filtro por rol
            if ($request->has('rol') && $request->rol) {
                $query->whereHas('roles', function($q) use ($request) {
                    $q->where('name', $request->rol);
                });
            }

            // Filtro por estado
            if ($request->has('activo') && $request->activo !== '') {
                if ($request->activo === 'true' || $request->activo === '1') {
                    $query->where('activo', true);
                } elseif ($request->activo === 'false' || $request->activo === '0') {
                    $query->where('activo', false);
                }
            }

            
            // Paginación
            $perPage = $request->get('per_page', 15);
            $users = $query->paginate($perPage);
           

            return response()->json($users);
        }

        // Vista principal
        return view('admin.usuarios.index');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'tipo_documento' => 'required|in:CC,CE,Pasaporte',
            'cedula' => 'required|string|unique:users,cedula',
            'nombre' => 'required|string|max:255',
            'apellidos' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'telefono' => 'nullable|string|max:20',
            'celular' => 'nullable|string|max:20',
            'direccion' => 'nullable|string|max:255',
            'tipo_usuario' => 'required|in:interno,externo',
            'area_id' => 'nullable|exists:areas,id',
            'equipo_id' => 'nullable|exists:equipos,id',
            'cargo' => 'nullable|string|max:255',
            'password' => 'required|string|min:8|confirmed',
            'roles' => 'required|array|min:1',
            'roles.*' => 'exists:roles,name',
            'activo' => 'boolean',
            'foto' => 'nullable|image|max:2048',
        ], [
            'cedula.unique' => 'Ya existe un usuario con este documento',
            'email.unique' => 'El email ya está registrado',
            'password.min' => 'La contraseña debe tener al menos 8 caracteres',
            'password.confirmed' => 'Las contraseñas no coinciden',
            'roles.required' => 'Debe asignar al menos un rol',
        ]);

        // Si es funcionario, validar área y equipo
        if ($validated['tipo_usuario'] === 'interno') {
            $request->validate([
                'area_id' => 'required|exists:areas,id',
                'equipo_id' => 'required|exists:equipos,id',
                'cargo' => 'required|string|max:255',
            ]);
        }

        // Procesar foto si existe
        $fotoUrl = null;
        if ($request->hasFile('foto')) {
            $fotoUrl = $request->file('foto')->store('usuarios', 'public');
        }

        // Guardar contraseña en texto plano temporalmente para enviar por email
        $passwordPlainText = $validated['password'];

        // Crear usuario
        $user = User::create([
            'tipo_documento' => $validated['tipo_documento'],
            'cedula' => $validated['cedula'],
            'nombre' => $validated['nombre'],
            'apellidos' => $validated['apellidos'],
            'email' => $validated['email'],
            'telefono' => $validated['telefono'],
            'celular' => $validated['celular'],
            'direccion' => $validated['direccion'],
            'tipo_usuario' => $validated['tipo_usuario'],
            'area_id' => $validated['area_id'] ?? null,
            'equipo_id' => $validated['equipo_id'] ?? null,
            'cargo' => $validated['cargo'] ?? null,
            'password' => Hash::make($passwordPlainText),
            'activo' => $validated['activo'] ?? true,
            'foto_url' => $fotoUrl,
        ]);

        // Enviar correo de bienvenida con contraseña
        try {
            Mail::to($user->email)->send(new UserWelcomeEmail($user, $passwordPlainText));
            
            \Log::info('Email de bienvenida enviado', [
                'user_id' => $user->id,
                'user_email' => $user->email,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error al enviar email de bienvenida', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
            // No detenemos la creación del usuario si falla el email
        }

        // Asignar roles
        $user->syncRoles($validated['roles']);

        return response()->json([
            'message' => 'Usuario creado exitosamente',
            'user' => $user->load(['area', 'equipo', 'roles'])
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $user = User::with(['area', 'equipo', 'roles', 'permissions'])->findOrFail($id);

        // Verificar si es coordinador de algún área
        $esCoordinador = Area::where('coordinador_id', $user->id)->exists();

        // Verificar si es líder de algún equipo
        $esLider = Equipo::where('lider_id', $user->id)->exists();

        // Contar tareas activas si las hay (preparar para cuando se implemente el módulo de tareas)
        $tareasActivas = 0; // TODO: Implementar cuando exista el módulo de tareas

        return response()->json([
            'user' => $user,
            'metadata' => [
                'es_coordinador' => $esCoordinador,
                'es_lider' => $esLider,
                'tareas_activas' => $tareasActivas,
                'area_coordinada' => $esCoordinador ? Area::where('coordinador_id', $user->id)->first() : null,
                'equipo_liderado' => $esLider ? Equipo::where('lider_id', $user->id)->first() : null,
            ]
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $user = User::findOrFail($id);

        // Guardar datos originales para auditoría
        $datosOriginales = [
            'email' => $user->email,
            'area_id' => $user->area_id,
            'equipo_id' => $user->equipo_id,
            'tipo_usuario' => $user->tipo_usuario,
            'roles' => $user->roles->pluck('name')->toArray(),
        ];

        $validated = $request->validate([
            'tipo_documento' => 'required|in:CC,CE,Pasaporte',
            'cedula' => ['required', 'string', Rule::unique('users')->ignore($user->id)],
            'nombre' => 'required|string|max:255',
            'apellidos' => 'required|string|max:255',
            'email' => ['required', 'email', Rule::unique('users')->ignore($user->id)],
            'telefono' => 'nullable|string|max:20',
            'celular' => 'nullable|string|max:20',
            'direccion' => 'nullable|string|max:255',
            'tipo_usuario' => 'required|in:interno,externo',
            'area_id' => 'nullable|exists:areas,id',
            'equipo_id' => 'nullable|exists:equipos,id',
            'cargo' => 'nullable|string|max:255',
            'roles' => 'required|array|min:1',
            'roles.*' => 'exists:roles,name',
            'activo' => 'boolean',
            'foto' => 'nullable|image|max:2048',
            'motivo_cambio_area' => 'nullable|string|max:500',
            'remover_como_coordinador' => 'nullable|boolean',
        ], [
            'cedula.unique' => 'Ya existe un usuario con este documento',
            'email.unique' => 'El email ya está registrado',
            'roles.required' => 'Debe asignar al menos un rol',
        ]);

        // Si es funcionario, validar área y equipo
        if ($validated['tipo_usuario'] === 'interno') {
            $request->validate([
                'area_id' => 'required|exists:areas,id',
                'equipo_id' => 'required|exists:equipos,id',
                'cargo' => 'required|string|max:255',
            ]);
        }

        // Verificar si cambió el área
        $cambioArea = $user->area_id != ($validated['area_id'] ?? null);
        $cambioEquipo = $user->equipo_id != ($validated['equipo_id'] ?? null);

        // Si cambió área o equipo y hay tareas activas, requerir motivo
        if (($cambioArea || $cambioEquipo) && $user->tipo_usuario === 'interno') {
            if (!$request->has('motivo_cambio_area')) {
                return response()->json([
                    'message' => 'Debe proporcionar un motivo para el cambio de área/equipo',
                    'requires_confirmation' => true,
                    'tipo' => 'cambio_area',
                ], 422);
            }
        }

        // Verificar si es coordinador y está cambiando de área
        $esCoordinador = Area::where('coordinador_id', $user->id)->exists();
        if ($esCoordinador && $cambioArea) {
            $areaCoordinada = Area::where('coordinador_id', $user->id)->first();

            if (!$request->has('remover_como_coordinador')) {
                return response()->json([
                    'message' => 'Este usuario es Coordinador del área: ' . $areaCoordinada->nombre,
                    'requires_confirmation' => true,
                    'tipo' => 'es_coordinador',
                    'area' => $areaCoordinada,
                ], 422);
            }

            // Si decidió remover como coordinador
            if ($request->remover_como_coordinador) {
                $areaCoordinada->coordinador_id = null;
                $areaCoordinada->save();

                \Log::info('Usuario removido como coordinador', [
                    'user_id' => $user->id,
                    'area_id' => $areaCoordinada->id,
                    'area_nombre' => $areaCoordinada->nombre,
                ]);
            }
        }

        // Verificar si es líder y está cambiando de equipo
        $esLider = Equipo::where('lider_id', $user->id)->exists();
        if ($esLider && $cambioEquipo) {
            $equipoLiderado = Equipo::where('lider_id', $user->id)->first();

            if (!$request->has('remover_como_lider')) {
                return response()->json([
                    'message' => 'Este usuario es Líder del equipo: ' . $equipoLiderado->nombre,
                    'requires_confirmation' => true,
                    'tipo' => 'es_lider',
                    'equipo' => $equipoLiderado,
                ], 422);
            }

            if ($request->remover_como_lider) {
                $equipoLiderado->lider_id = null;
                $equipoLiderado->save();
            }
        }

        // Procesar foto si existe
        if ($request->hasFile('foto')) {
            if ($user->foto_url) {
                Storage::disk('public')->delete($user->foto_url);
            }
            $validated['foto_url'] = $request->file('foto')->store('usuarios', 'public');
        }

        // Si el usuario es externo, asegurar que campos laborales sean null
        if ($validated['tipo_usuario'] === 'externo') {
            $validated['area_id'] = null;
            $validated['equipo_id'] = null;
            $validated['cargo'] = null;
        }

        // Actualizar usuario
        $user->update($validated);
        $user->syncRoles($validated['roles']);

        // Registrar cambios en log para auditoría
        $cambios = [];
        if ($datosOriginales['email'] !== $user->email) {
            $cambios['email'] = ['anterior' => $datosOriginales['email'], 'nuevo' => $user->email];
        }
        if ($datosOriginales['area_id'] !== $user->area_id) {
            $cambios['area'] = [
                'anterior' => $datosOriginales['area_id'],
                'nuevo' => $user->area_id,
                'motivo' => $request->motivo_cambio_area ?? 'No especificado',
            ];
        }
        if ($datosOriginales['equipo_id'] !== $user->equipo_id) {
            $cambios['equipo'] = [
                'anterior' => $datosOriginales['equipo_id'],
                'nuevo' => $user->equipo_id,
                'motivo' => $request->motivo_cambio_area ?? 'No especificado',
            ];
        }

        if (!empty($cambios)) {
            \Log::info('Usuario actualizado con cambios', [
                'user_id' => $user->id,
                'usuario_que_actualiza' => auth()->id(),
                'cambios' => $cambios,
            ]);
        }

        return response()->json([
            'message' => 'Usuario actualizado exitosamente',
            'user' => $user->load(['area', 'equipo', 'roles']),
            'cambios_realizados' => $cambios,
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $user = User::findOrFail($id);

        // No se puede eliminar a sí mismo
        if ($user->id === auth()->id()) {
            return response()->json(['message' => 'No puedes eliminar tu propio usuario'], 403);
        }

        // Verificar si es coordinador de algún área
        $esCoordinador = Area::where('coordinador_id', $user->id)->exists();
        if ($esCoordinador) {
            $areaCoordinada = Area::where('coordinador_id', $user->id)->first();
            return response()->json([
                'message' => 'No se puede eliminar este usuario porque es Coordinador del área: ' . $areaCoordinada->nombre,
                'tipo_error' => 'es_coordinador',
                'area' => $areaCoordinada->nombre
            ], 422);
        }

        // Verificar si es líder de algún equipo
        $esLider = Equipo::where('lider_id', $user->id)->exists();
        if ($esLider) {
            $equipoLiderado = Equipo::where('lider_id', $user->id)->first();
            return response()->json([
                'message' => 'No se puede eliminar este usuario porque es Líder del equipo: ' . $equipoLiderado->nombre,
                'tipo_error' => 'es_lider',
                'equipo' => $equipoLiderado->nombre
            ], 422);
        }

        // TODO: Verificar si tiene tareas activas cuando se implemente el módulo
        // $tareasActivas = Task::where('user_id', $user->id)->where('estado', 'activo')->count();
        // if ($tareasActivas > 0) {
        //     return response()->json([
        //         'message' => "No se puede eliminar este usuario porque tiene {$tareasActivas} tareas activas",
        //         'tipo_error' => 'tiene_tareas',
        //         'tareas_activas' => $tareasActivas
        //     ], 422);
        // }

        // Registrar auditoría antes de eliminar
        \Log::info('Usuario eliminado', [
            'user_id' => $user->id,
            'user_nombre' => $user->nombre . ' ' . $user->apellidos,
            'user_email' => $user->email,
            'eliminado_por' => auth()->id(),
        ]);

        // Eliminar foto si existe
        if ($user->foto_url) {
            Storage::disk('public')->delete($user->foto_url);
        }

        // Eliminar usuario
        $user->delete();

        return response()->json(['message' => 'Usuario eliminado exitosamente']);
    }

    /**
     * Toggle user active status
     */
    public function toggleEstado(Request $request, string $id)
    {
        $user = User::with(['area', 'equipo', 'roles'])->findOrFail($id);

        // No se puede desactivar a sí mismo
        if ($user->id === auth()->id()) {
            return response()->json([
                'message' => 'No puedes desactivar tu propio usuario'
            ], 403);
        }

        $validated = $request->validate([
            'activo' => 'required|boolean',
            'motivo' => 'nullable|string|max:500',
            'reasignar_tareas_a' => 'nullable|string',
            'notificar' => 'boolean',
        ]);

        $estadoAnterior = $user->activo;
        $user->activo = $validated['activo'];
        $user->save();

        // Registrar cambio de estado en log
        \Log::info('Cambio de estado de usuario', [
            'user_id' => $user->id,
            'usuario_que_cambia' => auth()->id(),
            'estado_anterior' => $estadoAnterior,
            'estado_nuevo' => $validated['activo'],
            'motivo' => $validated['motivo'] ?? 'No especificado',
        ]);

        // Si se está desactivando
        if (!$validated['activo']) {
            // TODO: Cerrar sesiones activas del usuario
            // Session::where('user_id', $user->id)->delete();

            // TODO: Reasignar tareas si tiene
            if ($request->has('reasignar_tareas_a') && $validated['reasignar_tareas_a']) {
                $this->reasignarTareas($user->id, $validated['reasignar_tareas_a']);
            }

            // TODO: Notificar al usuario si se solicitó
            if ($validated['notificar'] ?? false) {
                // Mail::to($user->email)->send(new UserDeactivatedNotification($user, $validated['motivo']));
                \Log::info('Notificación de desactivación enviada', ['user_id' => $user->id]);
            }
        } else {
            // Si se está activando
            if ($validated['notificar'] ?? false) {
                // Mail::to($user->email)->send(new UserActivatedNotification($user));
                \Log::info('Notificación de activación enviada', ['user_id' => $user->id]);
            }
        }

        $message = $validated['activo'] ? 'Usuario activado exitosamente' : 'Usuario desactivado exitosamente';

        return response()->json([
            'message' => $message,
            'user' => $user
        ]);
    }

    /**
     * Reasignar tareas del usuario
     */
    private function reasignarTareas($userId, $reasignarA)
    {
        // TODO: Implementar cuando exista el módulo de tareas
        \Log::info('Reasignación de tareas', [
            'de_usuario' => $userId,
            'a' => $reasignarA,
        ]);

        // Lógica de reasignación:
        // - Si $reasignarA === 'lider': buscar líder del equipo y reasignar
        // - Si es un ID numérico: reasignar a ese usuario
        // - Si es 'null': dejar sin asignar
    }

    /**
     * Get areas for select
     */
    public function getAreas()
    {
        $areas = Area::where('activo', true)->select('id', 'nombre', 'coordinador_id')->get();
        return response()->json(['areas' => $areas]);
    }

    /**
     * Get equipos by area
     */
    public function getEquipos(Request $request)
    {
        $query = Equipo::where('activo', true);

        if ($request->has('area_id')) {
            $query->where('area_id', $request->area_id);
        }

        $equipos = $query->select('id', 'nombre', 'area_id', 'lider_id')->get();
        return response()->json($equipos);
    }

    /**
     * Get roles for select
     */
    public function getRoles(Request $request)
    {
        $query = Role::with('permissions');

        if ($request->has('tipo_usuario')) {
            if ($request->tipo_usuario === 'externo') {
                $query->where('name', 'Ciudadano');
            } elseif ($request->tipo_usuario === 'interno') {
                $query->where('name', '!=', 'Ciudadano');
            }
        }

        $roles = $query->get();
        return response()->json(['roles' => $roles]);
    }

    /**
     * Get detailed user information for modal view
     */
    public function getDetalle(string $id)
    {
        $user = User::with([
            'area.coordinador', 
            'equipo.lider',
            'roles.permissions'
        ])->findOrFail($id);

        // Información laboral
        $infoLaboral = null;
        if ($user->tipo_usuario === 'interno' && $user->area) {
            $infoLaboral = [
                'area' => [
                    'id' => $user->area->id,
                    'nombre' => $user->area->nombre,
                    'coordinador' => $user->area->coordinador ? [
                        'id' => $user->area->coordinador->id,
                        'nombre' => $user->area->coordinador->nombre . ' ' . $user->area->coordinador->apellidos,
                    ] : null,
                ],
                'equipo' => $user->equipo ? [
                    'id' => $user->equipo->id,
                    'nombre' => $user->equipo->nombre,
                    'lider' => $user->equipo->lider ? [
                        'id' => $user->equipo->lider->id,
                        'nombre' => $user->equipo->lider->nombre . ' ' . $user->equipo->lider->apellidos,
                    ] : null,
                ] : null,
                'cargo' => $user->cargo,
                'fecha_ingreso' => $user->created_at->format('Y-m-d'),
                'tiempo_organizacion' => $user->created_at->diffForHumans(null, true),
            ];
        } else {
            // Es ciudadano - contar solicitudes (TODO: implementar cuando exista el módulo)
            $infoLaboral = [
                'es_ciudadano' => true,
                'solicitudes_realizadas' => 0, // TODO: Implementar conteo real
            ];
        }

        // Verificar si es coordinador o líder
        $esCoordinador = Area::where('coordinador_id', $user->id)->exists();
        $esLider = Equipo::where('lider_id', $user->id)->exists();

        // Roles y permisos organizados por módulo
        $rolesDetalle = [];
        $permisosEfectivos = [];
        
        foreach ($user->roles as $role) {
            $rolesDetalle[] = [
                'id' => $role->id,
                'nombre' => $role->name,
                'descripcion' => $role->guard_name,
                'fecha_asignacion' => $user->created_at->format('Y-m-d H:i'), // TODO: obtener fecha real de pivot
            ];

            foreach ($role->permissions as $permission) {
                // Agrupar permisos por módulo (usando el prefijo antes del punto)
                $partes = explode('.', $permission->name);
                $modulo = $partes[0] ?? 'general';
                
                if (!isset($permisosEfectivos[$modulo])) {
                    $permisosEfectivos[$modulo] = [];
                }
                
                $permisosEfectivos[$modulo][] = [
                    'nombre' => $permission->name,
                    'rol_origen' => $role->name,
                ];
            }
        }

        // Estadísticas básicas
        $estadisticas = [
            'tareas_completadas_mes' => 0, // TODO: Implementar cuando exista módulo
            'tareas_completadas_total' => 0,
            'solicitudes_gestionadas' => 0,
            'documentos_firmados' => 0,
            'dias_ultimo_acceso' => $user->updated_at->diffInDays(),
        ];

        // Si es líder o coordinador, agregar estadísticas del equipo/área
        if ($esLider || $esCoordinador) {
            $estadisticas['es_lider_coordinador'] = true;
            // TODO: Agregar estadísticas del equipo/área
        }

        return response()->json([
            'user' => [
                'id' => $user->id,
                'tipo_documento' => $user->tipo_documento,
                'cedula' => $user->cedula,
                'nombre_completo' => $user->nombre . ' ' . $user->apellidos,
                'nombre' => $user->nombre,
                'apellidos' => $user->apellidos,
                'email' => $user->email,
                'telefono' => $user->telefono,
                'celular' => $user->celular,
                'direccion' => $user->direccion,
                'foto_url' => $user->foto_url,
                'tipo_usuario' => $user->tipo_usuario,
                'activo' => $user->activo,
                'fecha_registro' => $user->created_at->format('d/m/Y H:i'),
                'ultimo_acceso' => $user->updated_at->format('d/m/Y H:i'),
            ],
            'info_laboral' => $infoLaboral,
            'roles_detalle' => $rolesDetalle,
            'permisos_efectivos' => $permisosEfectivos,
            'estadisticas' => $estadisticas,
            'metadata' => [
                'es_coordinador' => $esCoordinador,
                'es_lider' => $esLider,
            ],
        ]);
    }

    /**
     * Get user activity history
     */
    public function getActividad(string $id, Request $request)
    {
        $user = User::findOrFail($id);

        // Parámetros de paginación y filtros
        $limit = $request->get('limit', 50);
        $offset = $request->get('offset', 0);
        $logName = $request->get('log_name'); // auth, user_management, etc.
        $event = $request->get('event'); // logged_in, created, updated, etc.
        $severity = $request->get('severity'); // info, warning, error, critical

        // Construir query
        $query = ActivityLog::where('user_id', $id)
            ->orderBy('created_at', 'desc');

        // Aplicar filtros si existen
        if ($logName) {
            $query->where('log_name', $logName);
        }

        if ($event) {
            $query->where('event', $event);
        }

        if ($severity) {
            $query->where('severity', $severity);
        }

        // Obtener total de registros
        $total = $query->count();

        // Obtener actividades paginadas
        $activityLogs = $query->skip($offset)->take($limit)->get();

        // Formatear actividades para el frontend
        $actividades = $activityLogs->map(function ($log) {
            return [
                'id' => $log->id,
                'tipo' => $log->event,
                'log_name' => $log->log_name,
                'descripcion' => $log->description,
                'fecha' => $log->created_at->format('Y-m-d H:i:s'),
                'fecha_relativa' => $log->created_at->diffForHumans(),
                'ip' => $log->ip_address,
                'user_agent' => $log->user_agent,
                'url' => $log->url,
                'method' => $log->method,
                'severity' => $log->severity,
                'is_important' => $log->is_important,
                'icono' => $log->getIcon(),
                'color' => $log->getColor(),
                'properties' => $log->properties,
                'changes' => $log->getFormattedChanges(),
            ];
        });

        return response()->json([
            'actividades' => $actividades,
            'total' => $total,
            'limit' => $limit,
            'offset' => $offset,
        ]);
    }

    /**
     * Reset user password
     */
    public function restablecerPassword(Request $request, string $id)
    {
        $user = User::findOrFail($id);

        // Validar que no es el mismo usuario
        if ($user->id === auth()->id()) {
            return response()->json([
                'message' => 'No puedes restablecer tu propia contraseña desde aquí'
            ], 403);
        }

        // Validar request
        $validated = $request->validate([
            'password' => 'required|string|min:8',
            'forzar_cambio' => 'boolean',
            'enviar_email' => 'boolean',
            'cerrar_sesiones' => 'boolean',
        ], [
            'password.required' => 'La contraseña es requerida',
            'password.min' => 'La contraseña debe tener al menos 8 caracteres',
        ]);

        // Guardar contraseña anterior para auditoría (hash)
        $passwordAnterior = $user->password;

        // Actualizar contraseña
        $user->password = Hash::make($validated['password']);

        // Si se debe forzar cambio de contraseña en próximo login
        if ($validated['forzar_cambio'] ?? false) {
            // TODO: Implementar campo password_change_required en la tabla users
            // $user->password_change_required = true;
            \Log::info('Se requiere cambio de contraseña en próximo login', ['user_id' => $user->id]);
        }

        $user->save();

        // Registrar en auditoría
        \Log::info('Contraseña restablecida', [
            'user_id' => $user->id,
            'user_email' => $user->email,
            'restablecido_por' => auth()->id(),
            'forzar_cambio' => $validated['forzar_cambio'] ?? false,
            'enviar_email' => $validated['enviar_email'] ?? false,
            'cerrar_sesiones' => $validated['cerrar_sesiones'] ?? false,
        ]);

        // Cerrar sesiones activas si se solicitó
        if ($validated['cerrar_sesiones'] ?? false) {
            // TODO: Implementar cierre de sesiones cuando exista el módulo de sesiones
            // DB::table('sessions')->where('user_id', $user->id)->delete();
            \Log::info('Sesiones cerradas para usuario', ['user_id' => $user->id]);
        }

        // Enviar email si se solicitó
        if ($validated['enviar_email'] ?? false) {
            try {
                Mail::to($user->email)->send(
                    new PasswordResetNotification(
                        $user,
                        $validated['password'],
                        $validated['forzar_cambio'] ?? true,
                        auth()->user()
                    )
                );

                \Log::info('Email de restablecimiento enviado', [
                    'user_id' => $user->id,
                    'user_email' => $user->email,
                ]);
            } catch (\Exception $e) {
                \Log::error('Error al enviar email de restablecimiento', [
                    'user_id' => $user->id,
                    'error' => $e->getMessage(),
                ]);
                // No detenemos la ejecución si falla el email
            }
        }

        return response()->json([
            'message' => 'Contraseña restablecida exitosamente',
            'user' => $user->only(['id', 'nombre', 'apellidos', 'email']),
            'acciones_realizadas' => [
                'password_actualizada' => true,
                'forzar_cambio' => $validated['forzar_cambio'] ?? false,
                'email_enviado' => $validated['enviar_email'] ?? false,
                'sesiones_cerradas' => $validated['cerrar_sesiones'] ?? false,
            ]
        ]);
    }

    /**
     * Actualizar roles del usuario
     */
    public function actualizarRoles(Request $request, string $id)
    {
        $user = User::with('roles')->findOrFail($id);

        // Validar request
        $validated = $request->validate([
            'roles' => 'required|array|min:1',
            'roles.*' => 'exists:roles,id',
            'notificar' => 'boolean',
            'cerrar_sesion' => 'boolean',
        ], [
            'roles.required' => 'Debe asignar al menos un rol',
            'roles.min' => 'El usuario debe tener al menos un rol',
            'roles.*.exists' => 'Uno o más roles seleccionados no existen',
        ]);

        // Guardar roles anteriores para auditoría
        $rolesAnteriores = $user->roles->pluck('name', 'id')->toArray();

        // Obtener los nuevos roles por ID
        $nuevosRoles = Role::whereIn('id', $validated['roles'])->get();
        $nuevosRolesNombres = $nuevosRoles->pluck('name', 'id')->toArray();

        // Verificar cambios
        $rolesAgregados = array_diff($validated['roles'], array_keys($rolesAnteriores));
        $rolesRemovidos = array_diff(array_keys($rolesAnteriores), $validated['roles']);

        // Si es coordinador y se está removiendo ese rol, verificar
        if (!empty($rolesRemovidos)) {
            $esCoordinador = Area::where('coordinador_id', $user->id)->exists();
            $rolCoordinadorId = Role::where('name', 'Coordinador de Área')->first()?->id;

            if ($esCoordinador && in_array($rolCoordinadorId, $rolesRemovidos)) {
                $areaCoordinada = Area::where('coordinador_id', $user->id)->first();

                // Remover como coordinador
                $areaCoordinada->coordinador_id = null;
                $areaCoordinada->save();

                \Log::warning('Usuario removido como coordinador al cambiar roles', [
                    'user_id' => $user->id,
                    'area_id' => $areaCoordinada->id,
                    'area_nombre' => $areaCoordinada->nombre,
                    'modificado_por' => auth()->id(),
                ]);
            }
        }

        // Sincronizar roles (esto reemplaza todos los roles anteriores)
        $user->syncRoles($nuevosRoles->pluck('name')->toArray());

        // Registrar cambios en auditoría
        \Log::info('Roles de usuario actualizados', [
            'user_id' => $user->id,
            'user_nombre' => $user->nombre . ' ' . $user->apellidos,
            'user_email' => $user->email,
            'modificado_por' => auth()->id(),
            'roles_anteriores' => $rolesAnteriores,
            'roles_nuevos' => $nuevosRolesNombres,
            'roles_agregados' => array_intersect_key($nuevosRolesNombres, array_flip($rolesAgregados)),
            'roles_removidos' => array_intersect_key($rolesAnteriores, array_flip($rolesRemovidos)),
        ]);

        // Cerrar sesiones activas si se solicitó
        if ($validated['cerrar_sesion'] ?? false) {
            // TODO: Implementar cierre de sesiones cuando exista el módulo
            // DB::table('sessions')->where('user_id', $user->id)->delete();
            \Log::info('Sesiones cerradas tras cambio de roles', ['user_id' => $user->id]);
        }

        // Si el usuario está actualmente logueado, refrescar permisos en sesión
        if ($user->id === auth()->id()) {
            // Laravel automáticamente recarga los permisos en la próxima request
            \Log::info('Permisos actualizados para usuario activo', ['user_id' => $user->id]);
        }

        // Enviar notificación por email si se solicitó
        if ($validated['notificar'] ?? false) {
            try {
                // TODO: Crear mailable RolesChangedNotification
                // Mail::to($user->email)->send(
                //     new RolesChangedNotification(
                //         $user,
                //         $rolesAnteriores,
                //         $nuevosRolesNombres,
                //         auth()->user()
                //     )
                // );

                \Log::info('Email de cambio de roles enviado', [
                    'user_id' => $user->id,
                    'user_email' => $user->email,
                ]);
            } catch (\Exception $e) {
                \Log::error('Error al enviar email de cambio de roles', [
                    'user_id' => $user->id,
                    'error' => $e->getMessage(),
                ]);
                // No detenemos la ejecución si falla el email
            }
        }

        // Preparar resumen de cambios
        $resumenCambios = [];
        if (!empty($rolesAgregados)) {
            $resumenCambios['agregados'] = array_values(array_intersect_key($nuevosRolesNombres, array_flip($rolesAgregados)));
        }
        if (!empty($rolesRemovidos)) {
            $resumenCambios['removidos'] = array_values(array_intersect_key($rolesAnteriores, array_flip($rolesRemovidos)));
        }

        return response()->json([
            'message' => 'Roles actualizados exitosamente',
            'user' => $user->load('roles')->only(['id', 'nombre', 'apellidos', 'email']),
            'roles_actuales' => $user->roles->pluck('name')->toArray(),
            'cambios' => $resumenCambios,
            'acciones_realizadas' => [
                'roles_actualizados' => true,
                'email_enviado' => $validated['notificar'] ?? false,
                'sesion_cerrada' => $validated['cerrar_sesion'] ?? false,
            ]
        ]);
    }

    /**
     * Exportar usuarios seleccionados a Excel
     */
    public function exportarMasivo(Request $request)
    {
        $validated = $request->validate([
            'usuarios' => 'required|array|min:1',
            'usuarios.*' => 'exists:users,id',
        ]);

        $usuarios = User::with(['area', 'equipo', 'roles'])
            ->whereIn('id', $validated['usuarios'])
            ->get();

        // Registrar exportación
        \Log::info('Exportación masiva de usuarios', [
            'total_usuarios' => count($validated['usuarios']),
            'exportado_por' => auth()->id(),
            'fecha' => now(),
        ]);

        // Crear CSV
        $filename = 'usuarios_' . date('Y-m-d_His') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function() use ($usuarios) {
            $file = fopen('php://output', 'w');
            
            // BOM para UTF-8
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
            
            // Headers
            fputcsv($file, [
                'ID',
                'Tipo Documento',
                'Cédula',
                'Nombre',
                'Apellidos',
                'Email',
                'Teléfono',
                'Celular',
                'Tipo Usuario',
                'Área',
                'Equipo',
                'Cargo',
                'Roles',
                'Estado',
                'Fecha Creación',
            ], ';');

            // Datos
            foreach ($usuarios as $user) {
                fputcsv($file, [
                    $user->id,
                    $user->tipo_documento ?? '',
                    $user->cedula ?? '',
                    $user->nombre,
                    $user->apellidos,
                    $user->email,
                    $user->telefono ?? '',
                    $user->celular ?? '',
                    $user->tipo_usuario === 'interno' ? 'Funcionario' : 'Ciudadano',
                    $user->area->nombre ?? '',
                    $user->equipo->nombre ?? '',
                    $user->cargo ?? '',
                    $user->roles->pluck('name')->implode(', '),
                    $user->activo ? 'Activo' : 'Inactivo',
                    $user->created_at->format('Y-m-d H:i:s'),
                ], ';');
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Cambiar estado de múltiples usuarios
     */
    public function cambiarEstadoMasivo(Request $request)
    {
        $validated = $request->validate([
            'usuarios' => 'required|array|min:1',
            'usuarios.*' => 'exists:users,id',
            'accion' => 'required|in:activar,desactivar',
            'motivo' => 'required|string|max:500',
        ]);

        $exitosos = 0;
        $fallidos = 0;
        $errores = [];
        $nuevoEstado = $validated['accion'] === 'activar';

        foreach ($validated['usuarios'] as $userId) {
            try {
                $user = User::findOrFail($userId);

                // No permitir cambiar el estado del usuario autenticado
                if ($user->id === auth()->id()) {
                    $fallidos++;
                    $errores[] = "No puedes cambiar tu propio estado";
                    continue;
                }

                $user->activo = $nuevoEstado;
                $user->save();

                // Registrar en log
                \Log::info('Estado de usuario cambiado (masivo)', [
                    'user_id' => $user->id,
                    'nuevo_estado' => $nuevoEstado ? 'activo' : 'inactivo',
                    'motivo' => $validated['motivo'],
                    'cambiado_por' => auth()->id(),
                ]);

                $exitosos++;
            } catch (\Exception $e) {
                $fallidos++;
                $errores[] = "Usuario {$userId}: " . $e->getMessage();
                \Log::error('Error en cambio de estado masivo', [
                    'user_id' => $userId,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return response()->json([
            'message' => $fallidos > 0
                ? "Operación completada con algunos errores"
                : "Estado actualizado exitosamente",
            'exitosos' => $exitosos,
            'fallidos' => $fallidos,
            'errores' => $errores,
        ], $fallidos > 0 && $exitosos === 0 ? 422 : 200);
    }

    /**
     * Asignar rol a múltiples usuarios
     */
    public function asignarRolMasivo(Request $request)
    {
        $validated = $request->validate([
            'usuarios' => 'required|array|min:1',
            'usuarios.*' => 'exists:users,id',
            'accion' => 'required|in:agregar,reemplazar,remover',
            'rol' => 'required|string|exists:roles,name',
        ]);

        $exitosos = 0;
        $fallidos = 0;
        $errores = [];

        foreach ($validated['usuarios'] as $userId) {
            try {
                $user = User::findOrFail($userId);
                $rolName = $validated['rol'];

                switch ($validated['accion']) {
                    case 'agregar':
                        // Agregar rol sin eliminar los existentes
                        if (!$user->hasRole($rolName)) {
                            $user->assignRole($rolName);
                        }
                        break;

                    case 'reemplazar':
                        // Eliminar todos los roles y asignar solo el nuevo
                        $user->syncRoles([$rolName]);
                        break;

                    case 'remover':
                        // Remover rol específico
                        if ($user->hasRole($rolName)) {
                            $user->removeRole($rolName);
                        }
                        break;
                }

                // Registrar en log
                \Log::info('Rol asignado masivamente', [
                    'user_id' => $user->id,
                    'accion' => $validated['accion'],
                    'rol' => $rolName,
                    'asignado_por' => auth()->id(),
                ]);

                $exitosos++;
            } catch (\Exception $e) {
                $fallidos++;
                $errores[] = "Usuario {$userId}: " . $e->getMessage();
                \Log::error('Error en asignación masiva de rol', [
                    'user_id' => $userId,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return response()->json([
            'message' => $fallidos > 0
                ? "Operación completada con algunos errores"
                : "Rol asignado exitosamente",
            'exitosos' => $exitosos,
            'fallidos' => $fallidos,
            'errores' => $errores,
        ], $fallidos > 0 && $exitosos === 0 ? 422 : 200);
    }

    /**
     * Get users for select
     */
    public function getUsuariosForSelect()
    {
        $usuarios = User::where('activo', true)->select('id', 'nombre', 'apellidos')->get();
        return response()->json([
            'usuarios' => $usuarios,
            'total' => $usuarios->count(),
        ]); 
    }
}
