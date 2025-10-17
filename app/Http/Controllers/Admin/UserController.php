<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Area;
use App\Models\Equipo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
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
            'password' => Hash::make($validated['password']),
            'activo' => $validated['activo'] ?? true,
            'foto_url' => $fotoUrl,
        ]);

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
        $cambioArea = $user->area_id != $validated['area_id'];
        $cambioEquipo = $user->equipo_id != $validated['equipo_id'];

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

        if ($user->id === auth()->id()) {
            return response()->json(['message' => 'No puedes eliminar tu propio usuario'], 403);
        }

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
        return response()->json($areas);
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
        $query = Role::query();

        if ($request->has('tipo_usuario')) {
            if ($request->tipo_usuario === 'externo') {
                $query->where('name', 'Ciudadano');
            } elseif ($request->tipo_usuario === 'interno') {
                $query->where('name', '!=', 'Ciudadano');
            }
        }

        $roles = $query->get();
        return response()->json($roles);
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
        
        // TODO: Implementar sistema de auditoría completo
        // Por ahora retornamos datos de ejemplo basados en el log
        
        $actividades = [
            // Estos son datos de ejemplo. En producción deberían venir de una tabla de auditoría
            [
                'id' => 1,
                'tipo' => 'login',
                'descripcion' => 'Inicio de sesión',
                'fecha' => $user->updated_at->subDays(1)->format('Y-m-d H:i:s'),
                'ip' => '192.168.1.1',
                'icono' => 'login',
            ],
            [
                'id' => 2,
                'tipo' => 'update',
                'descripcion' => 'Perfil actualizado',
                'fecha' => $user->updated_at->subDays(3)->format('Y-m-d H:i:s'),
                'ip' => '192.168.1.1',
                'icono' => 'edit',
            ],
        ];

        // Si existe el módulo de logs, cargar datos reales
        // $actividades = ActivityLog::where('user_id', $id)
        //     ->orderBy('created_at', 'desc')
        //     ->limit(20)
        //     ->get();

        return response()->json([
            'actividades' => $actividades,
            'total' => count($actividades),
        ]);
    }
}
