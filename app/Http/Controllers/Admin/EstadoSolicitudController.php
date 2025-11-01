<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EstadoSolicitud;
use Spatie\Permission\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class EstadoSolicitudController extends Controller
{
 

    /**
     * Listar todos los estados con filtros
     * GET /admin/configuracion/estados
     */
    public function index(Request $request)
    {
        try {

            if(!auth()->user()->can('estados.ver')) {
                return redirect()->route('admin.dashboard')->with('error', 'No tienes permisos para ver estados de solicitud');
            }

            // Si es petición AJAX, retornar JSON
            if ($request->ajax() || $request->expectsJson()) {
                $query = EstadoSolicitud::with(['creador:id,nombre,apellidos', 'editor:id,nombre,apellidos', 'roles:id,name'])
                    ->withCount('estadosSiguientes', 'estadosAnteriores');

                // Filtro por tipo
                if ($request->has('tipo') && $request->tipo !== 'todos') {
                    $query->where('tipo', $request->tipo);
                }

                // Filtro por activo
                if ($request->has('activo')) {
                    $query->where('activo', $request->boolean('activo'));
                }

                // Búsqueda
                if ($request->has('buscar') && $request->buscar) {
                    $buscar = $request->buscar;
                    $query->where(function($q) use ($buscar) {
                        $q->where('codigo', 'ILIKE', "%{$buscar}%")
                          ->orWhere('nombre', 'ILIKE', "%{$buscar}%")
                          ->orWhere('descripcion', 'ILIKE', "%{$buscar}%");
                    });
                }

                // Ordenamiento
                $estados = $query->ordenado()->get();
                

                return response()->json([
                    'success' => true,
                    'estados' => $estados->map(function($estado) {
                        return [
                            'id' => $estado->id,
                            'codigo' => $estado->codigo,
                            'nombre' => $estado->nombre,
                            'slug' => $estado->slug,
                            'descripcion' => $estado->descripcion,
                            'tipo' => $estado->tipo,
                            'es_inicial' => $estado->es_inicial,
                            'es_final' => $estado->es_final,
                            'es_sistema' => $estado->es_sistema,
                            'notifica_solicitante' => $estado->notifica_solicitante,
                            'permite_edicion' => $estado->permite_edicion,
                            'requiere_resolucion' => $estado->requiere_resolucion,
                            'genera_documento' => $estado->genera_documento,
                            'pausa_sla' => $estado->pausa_sla,
                            'reinicia_sla' => $estado->reinicia_sla,
                            'color' => $estado->color,
                            'icono' => $estado->icono,
                            'orden' => $estado->orden,
                            'activo' => $estado->activo,
                            'puede_eliminar' => $estado->puedeSerEliminado(),
                            'solicitudes_count' => $estado->contarSolicitudes(),
                            'estados_siguientes_count' => $estado->estados_siguientes_count,
                            'estados_anteriores_count' => $estado->estados_anteriores_count,
                            'roles' => $estado->roles->pluck('name'),
                            'creador' => $estado->creador ? trim($estado->creador->nombre . ' ' . $estado->creador->apellidos) : null,
                            'editor' => $estado->editor ? trim($estado->editor->nombre . ' ' . $estado->editor->apellidos) : null,
                            'created_at' => $estado->created_at?->format('Y-m-d H:i:s'),
                            'updated_at' => $estado->updated_at?->format('Y-m-d H:i:s'),
                        ];
                    }),
                    'permissions' => [
                        'canCreate' => auth()->user()->can('estados.crear'),
                        'canEdit' => auth()->user()->can('estados.editar'),
                        'canDelete' => auth()->user()->can('estados.eliminar'),
                        'canActivate' => auth()->user()->can('estados.activar'),
                        'canDuplicate' => auth()->user()->can('estados.duplicar'),
                        'canVer' => auth()->user()->can('estados.ver'),
                        'canVerDiagrama' => auth()->user()->can('estados.ver_diagrama'),
                    ]
                ]);
            }

            // Retornar vista
            $roles = Role::orderBy('name')->get();
            return view('admin.configuracion.estados.index', compact('roles'));
        } catch (\Exception $e) {
            Log::error('Error al cargar estados: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);

            if ($request->ajax() || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error al cargar estados: ' . $e->getMessage()
                ], 500);
            }

            return back()->with('error', 'Error al cargar estados: ' . $e->getMessage());
        }
    }

    /**
     * Mostrar un estado específico
     * GET /admin/configuracion/estados/{id}
     */
    public function show($id)
    {
        try {
            $estado = EstadoSolicitud::with([
                'creador:id,nombre,apellidos,email',
                'editor:id,nombre,apellidos,email',
                'roles:id,name',
                'estadosSiguientes:id,codigo,nombre,color,icono',
                'estadosAnteriores:id,codigo,nombre,color,icono'
            ])->findOrFail($id);

            return response()->json([
                'success' => true,
                'estado' => [
                    'id' => $estado->id,
                    'codigo' => $estado->codigo,
                    'nombre' => $estado->nombre,
                    'slug' => $estado->slug,
                    'descripcion' => $estado->descripcion,
                    'tipo' => $estado->tipo,
                    'es_inicial' => $estado->es_inicial,
                    'es_final' => $estado->es_final,
                    'es_sistema' => $estado->es_sistema,
                    'notifica_solicitante' => $estado->notifica_solicitante,
                    'permite_edicion' => $estado->permite_edicion,
                    'requiere_resolucion' => $estado->requiere_resolucion,
                    'genera_documento' => $estado->genera_documento,
                    'pausa_sla' => $estado->pausa_sla,
                    'reinicia_sla' => $estado->reinicia_sla,
                    'color' => $estado->color,
                    'icono' => $estado->icono,
                    'orden' => $estado->orden,
                    'activo' => $estado->activo,
                    'puede_eliminar' => $estado->puedeSerEliminado(),
                    'solicitudes_count' => $estado->contarSolicitudes(),
                    'roles' => $estado->roles,
                    'estados_siguientes' => $estado->estadosSiguientes,
                    'estados_anteriores' => $estado->estadosAnteriores,
                    'creador' => $estado->creador ? [
                        'id' => $estado->creador->id,
                        'nombre' => trim($estado->creador->nombre . ' ' . $estado->creador->apellidos),
                        'email' => $estado->creador->email
                    ] : null,
                    'editor' => $estado->editor ? [
                        'id' => $estado->editor->id,
                        'nombre' => trim($estado->editor->nombre . ' ' . $estado->editor->apellidos),
                        'email' => $estado->editor->email
                    ] : null,
                    'created_at' => $estado->created_at?->format('Y-m-d H:i:s'),
                    'updated_at' => $estado->updated_at?->format('Y-m-d H:i:s'),
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error al mostrar estado: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al cargar estado: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear nuevo estado
     * POST /admin/configuracion/estados
     */
    public function store(Request $request)
    {
        try {
            // Validación
            $validator = Validator::make($request->all(), [
                'codigo' => 'required|string|max:50|unique:estados_solicitud,codigo|regex:/^[A-Z0-9_\-]+$/',
                'nombre' => 'required|string|max:100',
                'descripcion' => 'nullable|string',
                'tipo' => 'required|in:inicial,proceso,final,bloqueante',
                'es_inicial' => 'boolean',
                'es_final' => 'boolean',
                'notifica_solicitante' => 'boolean',
                'permite_edicion' => 'boolean',
                'requiere_resolucion' => 'boolean',
                'genera_documento' => 'boolean',
                'pausa_sla' => 'boolean',
                'reinicia_sla' => 'boolean',
                'color' => 'required|string|regex:/^#[0-9A-Fa-f]{6}$/',
                'icono' => 'nullable|string|max:10',
                'orden' => 'nullable|integer|min:0',
                'activo' => 'boolean',
                'roles' => 'nullable|array',
                'roles.*' => 'exists:roles,id',
                'estados_siguientes' => 'nullable|array',
                'estados_siguientes.*' => 'exists:estados_solicitud,id',
            ], [
                'codigo.required' => 'El código es obligatorio',
                'codigo.unique' => 'Ya existe un estado con este código',
                'codigo.regex' => 'El código solo puede contener mayúsculas, números, guiones y guiones bajos',
                'nombre.required' => 'El nombre es obligatorio',
                'tipo.required' => 'El tipo es obligatorio',
                'tipo.in' => 'El tipo debe ser: inicial, proceso, final o bloqueante',
                'color.required' => 'El color es obligatorio',
                'color.regex' => 'El color debe ser un código hexadecimal válido (#RRGGBB)',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            // Validar que solo haya un estado inicial
            if ($request->boolean('es_inicial')) {
                $estadoInicialExiste = EstadoSolicitud::where('es_inicial', true)->exists();
                if ($estadoInicialExiste) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Ya existe un estado inicial. Solo puede haber uno.'
                    ], 422);
                }
            }

            // Generar slug único
            $slug = EstadoSolicitud::generarSlug($request->nombre);

            // Crear estado
            $estado = EstadoSolicitud::create([
                'codigo' => strtoupper($request->codigo),
                'nombre' => $request->nombre,
                'slug' => $slug,
                'descripcion' => $request->descripcion,
                'tipo' => $request->tipo,
                'es_inicial' => $request->boolean('es_inicial'),
                'es_final' => $request->boolean('es_final'),
                'es_sistema' => false, // Los creados por usuario nunca son de sistema
                'notifica_solicitante' => $request->boolean('notifica_solicitante', true),
                'permite_edicion' => $request->boolean('permite_edicion'),
                'requiere_resolucion' => $request->boolean('requiere_resolucion'),
                'genera_documento' => $request->boolean('genera_documento'),
                'pausa_sla' => $request->boolean('pausa_sla'),
                'reinicia_sla' => $request->boolean('reinicia_sla'),
                'color' => $request->color,
                'icono' => $request->icono,
                'orden' => $request->orden ?? 0,
                'activo' => $request->boolean('activo', true),
                'created_by' => auth()->id(),
                'updated_by' => auth()->id(),
            ]);

            // Sincronizar roles
            if ($request->has('roles') && is_array($request->roles)) {
                $estado->roles()->sync($request->roles);
            }

            // Sincronizar estados siguientes
            if ($request->has('estados_siguientes') && is_array($request->estados_siguientes)) {
                $estado->estadosSiguientes()->sync($request->estados_siguientes);
            }

            DB::commit();

            Log::info('Estado de solicitud creado', [
                'estado_id' => $estado->id,
                'codigo' => $estado->codigo,
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Estado creado exitosamente',
                'estado' => $estado->load(['roles', 'estadosSiguientes'])
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al crear estado: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al crear estado: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar estado existente
     * PUT /admin/configuracion/estados/{id}
     */
    public function update(Request $request, $id)
    {
        try {
            $estado = EstadoSolicitud::findOrFail($id);

            // Validar que estados de sistema no se pueden modificar ciertas propiedades
            if ($estado->es_sistema) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se pueden modificar las propiedades críticas de estados del sistema'
                ], 403);
            }

            // Validación
            $validator = Validator::make($request->all(), [
                'codigo' => 'required|string|max:50|unique:estados_solicitud,codigo,' . $id . '|regex:/^[A-Z0-9_\-]+$/',
                'nombre' => 'required|string|max:100',
                'descripcion' => 'nullable|string',
                'tipo' => 'required|in:inicial,proceso,final,bloqueante',
                'es_inicial' => 'boolean',
                'es_final' => 'boolean',
                'notifica_solicitante' => 'boolean',
                'permite_edicion' => 'boolean',
                'requiere_resolucion' => 'boolean',
                'genera_documento' => 'boolean',
                'pausa_sla' => 'boolean',
                'reinicia_sla' => 'boolean',
                'color' => 'required|string|regex:/^#[0-9A-Fa-f]{6}$/',
                'icono' => 'nullable|string|max:10',
                'orden' => 'nullable|integer|min:0',
                'activo' => 'boolean',
                'roles' => 'nullable|array',
                'roles.*' => 'exists:roles,id',
                'estados_siguientes' => 'nullable|array',
                'estados_siguientes.*' => 'exists:estados_solicitud,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            // Validar que solo haya un estado inicial
            if ($request->boolean('es_inicial') && !$estado->es_inicial) {
                $estadoInicialExiste = EstadoSolicitud::where('es_inicial', true)
                    ->where('id', '!=', $id)
                    ->exists();
                if ($estadoInicialExiste) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Ya existe un estado inicial. Solo puede haber uno.'
                    ], 422);
                }
            }

            // Generar nuevo slug si cambió el nombre
            if ($request->nombre !== $estado->nombre) {
                $slug = Str::slug($request->nombre);
                $contador = 1;
                $slugBase = $slug;
                while (EstadoSolicitud::where('slug', $slug)->where('id', '!=', $id)->exists()) {
                    $slug = $slugBase . '-' . $contador;
                    $contador++;
                }
            } else {
                $slug = $estado->slug;
            }

            // Actualizar estado
            $estado->update([
                'codigo' => strtoupper($request->codigo),
                'nombre' => $request->nombre,
                'slug' => $slug,
                'descripcion' => $request->descripcion,
                'tipo' => $request->tipo,
                'es_inicial' => $request->boolean('es_inicial'),
                'es_final' => $request->boolean('es_final'),
                'notifica_solicitante' => $request->boolean('notifica_solicitante'),
                'permite_edicion' => $request->boolean('permite_edicion'),
                'requiere_resolucion' => $request->boolean('requiere_resolucion'),
                'genera_documento' => $request->boolean('genera_documento'),
                'pausa_sla' => $request->boolean('pausa_sla'),
                'reinicia_sla' => $request->boolean('reinicia_sla'),
                'color' => $request->color,
                'icono' => $request->icono,
                'orden' => $request->orden ?? $estado->orden,
                'activo' => $request->boolean('activo'),
                'updated_by' => auth()->id(),
            ]);

            // Sincronizar roles
            if ($request->has('roles')) {
                $estado->roles()->sync($request->roles ?? []);
            }

            // Sincronizar estados siguientes
            if ($request->has('estados_siguientes')) {
                $estado->estadosSiguientes()->sync($request->estados_siguientes ?? []);
            }

            DB::commit();

            Log::info('Estado de solicitud actualizado', [
                'estado_id' => $estado->id,
                'codigo' => $estado->codigo,
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Estado actualizado exitosamente',
                'estado' => $estado->load(['roles', 'estadosSiguientes'])
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al actualizar estado: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar estado: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar estado
     * DELETE /admin/configuracion/estados/{id}
     */
    public function destroy($id)
    {
        try {
            $estado = EstadoSolicitud::findOrFail($id);

            // Validar que se puede eliminar
            if (!$estado->puedeSerEliminado()) {
                $razon = $estado->es_sistema
                    ? 'Los estados del sistema no se pueden eliminar'
                    : 'El estado tiene solicitudes asociadas y no se puede eliminar';

                return response()->json([
                    'success' => false,
                    'message' => $razon
                ], 403);
            }

            DB::beginTransaction();

            // Eliminar relaciones
            $estado->roles()->detach();
            $estado->estadosSiguientes()->detach();
            $estado->estadosAnteriores()->detach();

            // Soft delete
            $codigo = $estado->codigo;
            $estado->delete();

            DB::commit();

            Log::info('Estado de solicitud eliminado', [
                'estado_id' => $id,
                'codigo' => $codigo,
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Estado eliminado exitosamente'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al eliminar estado: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar estado: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Activar/desactivar estado
     * PATCH /admin/configuracion/estados/{id}/toggle
     */
    public function toggleEstado($id)
    {
        try {
            $estado = EstadoSolicitud::findOrFail($id);

            // Estados de sistema siempre deben estar activos
            if ($estado->es_sistema && $estado->activo) {
                return response()->json([
                    'success' => false,
                    'message' => 'Los estados del sistema no se pueden desactivar'
                ], 403);
            }

            DB::beginTransaction();

            $nuevoEstado = !$estado->activo;
            $estado->update([
                'activo' => $nuevoEstado,
                'updated_by' => auth()->id()
            ]);

            DB::commit();

            Log::info('Estado de solicitud ' . ($nuevoEstado ? 'activado' : 'desactivado'), [
                'estado_id' => $id,
                'codigo' => $estado->codigo,
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Estado ' . ($nuevoEstado ? 'activado' : 'desactivado') . ' exitosamente',
                'activo' => $nuevoEstado
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al cambiar estado: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error al cambiar estado: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Duplicar estado
     * POST /admin/configuracion/estados/{id}/duplicar
     */
    public function duplicar(Request $request, $id)
    {
        try {
            $estadoOriginal = EstadoSolicitud::with(['roles', 'estadosSiguientes'])->findOrFail($id);

            $validator = Validator::make($request->all(), [
                'codigo' => 'required|string|max:50|unique:estados_solicitud,codigo|regex:/^[A-Z0-9_\-]+$/',
                'nombre' => 'required|string|max:100',
                'copiar_flujo' => 'boolean',
                'copiar_roles' => 'boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            // Generar slug único
            $slug = EstadoSolicitud::generarSlug($request->nombre);

            // Crear duplicado
            $estadoNuevo = EstadoSolicitud::create([
                'codigo' => strtoupper($request->codigo),
                'nombre' => $request->nombre,
                'slug' => $slug,
                'descripcion' => $estadoOriginal->descripcion,
                'tipo' => $estadoOriginal->tipo,
                'es_inicial' => false, // El duplicado nunca es inicial
                'es_final' => $estadoOriginal->es_final,
                'es_sistema' => false, // El duplicado nunca es de sistema
                'notifica_solicitante' => $estadoOriginal->notifica_solicitante,
                'permite_edicion' => $estadoOriginal->permite_edicion,
                'requiere_resolucion' => $estadoOriginal->requiere_resolucion,
                'genera_documento' => $estadoOriginal->genera_documento,
                'pausa_sla' => $estadoOriginal->pausa_sla,
                'reinicia_sla' => $estadoOriginal->reinicia_sla,
                'color' => $estadoOriginal->color,
                'icono' => $estadoOriginal->icono,
                'orden' => EstadoSolicitud::max('orden') + 1,
                'activo' => false, // Inicia inactivo para revisión
                'created_by' => auth()->id(),
                'updated_by' => auth()->id(),
            ]);

            // Copiar roles si se solicitó
            if ($request->boolean('copiar_roles', true)) {
                $estadoNuevo->roles()->sync($estadoOriginal->roles->pluck('id'));
            }

            // Copiar flujo si se solicitó
            if ($request->boolean('copiar_flujo', true)) {
                $estadoNuevo->estadosSiguientes()->sync($estadoOriginal->estadosSiguientes->pluck('id'));
            }

            DB::commit();

            Log::info('Estado de solicitud duplicado', [
                'estado_original_id' => $id,
                'estado_nuevo_id' => $estadoNuevo->id,
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Estado duplicado exitosamente',
                'estado' => $estadoNuevo->load(['roles', 'estadosSiguientes'])
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al duplicar estado: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error al duplicar estado: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reordenar estados (drag & drop)
     * PUT /admin/configuracion/estados/reordenar
     */
    public function reordenar(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'orden' => 'required|array',
                'orden.*' => 'exists:estados_solicitud,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            foreach ($request->orden as $index => $estadoId) {
                EstadoSolicitud::where('id', $estadoId)->update([
                    'orden' => $index,
                    'updated_by' => auth()->id()
                ]);
            }

            DB::commit();

            Log::info('Estados reordenados', [
                'cantidad' => count($request->orden),
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Estados reordenados exitosamente'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al reordenar estados: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error al reordenar estados: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener datos para diagrama de flujo
     * GET /admin/configuracion/estados/diagrama
     */
    public function diagrama()
    {
        try {
            $estados = EstadoSolicitud::with(['estadosSiguientes:id,codigo,nombre,color,icono,tipo'])
                ->activos()
                ->ordenado()
                ->get();

            // Formatear para visualización de diagrama
            $nodos = $estados->map(function($estado) {
                return [
                    'id' => $estado->id,
                    'codigo' => $estado->codigo,
                    'nombre' => $estado->nombre,
                    'tipo' => $estado->tipo,
                    'color' => $estado->color,
                    'icono' => $estado->icono,
                    'es_inicial' => $estado->es_inicial,
                    'es_final' => $estado->es_final,
                ];
            });

            // Crear aristas (conexiones)
            $aristas = [];
            foreach ($estados as $estado) {
                foreach ($estado->estadosSiguientes as $siguiente) {
                    $aristas[] = [
                        'from' => $estado->id,
                        'to' => $siguiente->id,
                        'label' => ''
                    ];
                }
            }

            return response()->json([
                'success' => true,
                'diagrama' => [
                    'nodos' => $nodos,
                    'aristas' => $aristas
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error al generar diagrama: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error al generar diagrama: ' . $e->getMessage()
            ], 500);
        }
    }
}
