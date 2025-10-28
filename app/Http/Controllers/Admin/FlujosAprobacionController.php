<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EstadoSolicitud;
use App\Models\TransicionFlujo;
use App\Models\TipoSolicitud;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class FlujosAprobacionController extends Controller
{
    /**
     * Vista principal de flujos de aprobación
     */
    public function index()
    {
        return view('admin.configuracion.flujos-aprobacion');
    }

    /**
     * Obtener todos los estados
     */
    public function getEstados(Request $request)
    {
        try {
            $estados = EstadoSolicitud::activos()
                ->ordenado()
                ->get()
                ->map(function($estado) {
                    return [
                        'id' => $estado->id,
                        'nombre' => $estado->nombre,
                        'slug' => $estado->slug,
                        'descripcion' => $estado->descripcion,
                        'tipo' => $estado->tipo,
                        'color' => $estado->color,
                        'icono' => $estado->icono,
                        'orden' => $estado->orden,
                        'nombre_con_icono' => $estado->nombre_con_icono,
                        'es_inicial' => $estado->esInicial(),
                        'es_final' => $estado->esFinal(),
                    ];
                });

            return response()->json([
                'success' => true,
                'estados' => $estados
            ]);
        } catch (\Exception $e) {
            Log::error('Error al obtener estados', ['error' => $e->getMessage()]);
            
            return response()->json([
                'success' => false,
                'message' => 'Error al cargar estados'
            ], 500);
        }
    }

    /**
     * Obtener transiciones de un flujo
     */
    public function getTransiciones(Request $request)
    {
        try {
            $tipoSolicitudId = $request->input('tipo_solicitud_id');
            $soloEspecificas = $request->input('solo_especificas', false); // Nuevo parámetro

            $query = TransicionFlujo::with(['estadoOrigen', 'estadoDestino', 'tipoSolicitud'])
                ->activas();

            if ($tipoSolicitudId) {
                if ($soloEspecificas) {
                    // Obtener SOLO las transiciones específicas del tipo (sin flujo básico)
                    $query->where('tipo_solicitud_id', $tipoSolicitudId);
                } else {
                    // Obtener transiciones específicas y básicas (comportamiento original)
                    $query->where(function($q) use ($tipoSolicitudId) {
                        $q->where('tipo_solicitud_id', $tipoSolicitudId)
                          ->orWhereNull('tipo_solicitud_id');
                    });
                }
            } else {
                // Solo flujo básico
                $query->whereNull('tipo_solicitud_id');
            }
            
            $transiciones = $query->orderBy('orden')->get()->map(function($trans) {
                return [
                    'id' => $trans->id,
                    'nombre' => $trans->nombre_display,
                    'descripcion' => $trans->descripcion,
                    'estado_origen' => [
                        'id' => $trans->estadoOrigen->id,
                        'nombre' => $trans->estadoOrigen->nombre,
                        'color' => $trans->estadoOrigen->color,
                    ],
                    'estado_destino' => [
                        'id' => $trans->estadoDestino->id,
                        'nombre' => $trans->estadoDestino->nombre,
                        'color' => $trans->estadoDestino->color,
                    ],
                    'tipo_solicitud_id' => $trans->tipo_solicitud_id,
                    'es_flujo_basico' => $trans->tipo_solicitud_id === null,
                    'roles_permitidos' => $trans->roles_permitidos,
                    'solo_funcionario_asignado' => $trans->solo_funcionario_asignado,
                    'requiere_comentario' => $trans->requiere_comentario,
                    'requiere_documento' => $trans->requiere_documento,
                    'requiere_aprobacion_previa' => $trans->requiere_aprobacion_previa,
                    'minimo_dias_transcurridos' => $trans->minimo_dias_transcurridos,
                    'tiene_condiciones' => $trans->tieneCondiciones(),
                    'tiene_acciones' => $trans->tieneAcciones(),
                    'color_boton' => $trans->color_boton,
                    'texto_boton' => $trans->texto_boton,
                    'config_diagrama' => $trans->config_diagrama,
                ];
            });

            return response()->json([
                'success' => true,
                'transiciones' => $transiciones
            ]);
        } catch (\Exception $e) {
            Log::error('Error al obtener transiciones', [
                'error' => $e->getMessage(),
                'tipo_solicitud_id' => $request->input('tipo_solicitud_id')
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Error al cargar transiciones'
            ], 500);
        }
    }

    /**
     * Crear nueva transición
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'tipo_solicitud_id' => 'nullable|exists:tipos_solicitud,id',
                'estado_origen_id' => 'required|exists:estados_solicitud,id',
                'estado_destino_id' => [
                    'required',
                    'exists:estados_solicitud,id',
                    'different:estado_origen_id',
                    Rule::unique('transiciones_flujo')
                        ->where('tipo_solicitud_id', $request->tipo_solicitud_id)
                        ->where('estado_origen_id', $request->estado_origen_id),
                ],
                'nombre' => 'nullable|string|max:150',
                'descripcion' => 'nullable|string',
                'roles_permitidos' => 'nullable|array',
                'solo_funcionario_asignado' => 'boolean',
                'requiere_comentario' => 'boolean',
                'requiere_documento' => 'boolean',
                'requiere_aprobacion_previa' => 'boolean',
                'minimo_dias_transcurridos' => 'nullable|integer|min:0',
                'campos_requeridos' => 'nullable|array',
                'reasignar_funcionario' => 'boolean',
                'usuario_reasignar_id' => 'nullable|exists:users,id',
                'cambiar_prioridad_a' => 'nullable|in:baja,normal,alta,urgente',
                'recalcular_fecha_vencimiento' => 'boolean',
                'agregar_dias_vencimiento' => 'nullable|integer',
                'generar_documento' => 'boolean',
                'enviar_notificaciones' => 'boolean',
                'notificaciones_config' => 'nullable|array',
                'registrar_auditoria' => 'boolean',
                'color_boton' => 'nullable|string|max:20',
                'texto_boton' => 'nullable|string|max:50',
                'requiere_confirmacion' => 'boolean',
                'mensaje_confirmacion' => 'nullable|string',
                'activo' => 'boolean',
            ]);

            DB::beginTransaction();

            $transicion = TransicionFlujo::create($validated);

            DB::commit();

            Log::info('Transición de flujo creada', [
                'transicion_id' => $transicion->id,
                'tipo_solicitud_id' => $transicion->tipo_solicitud_id,
                'created_by' => auth()->id()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Transición creada exitosamente',
                'transicion' => $transicion->load(['estadoOrigen', 'estadoDestino'])
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Error al crear transición', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al crear la transición'
            ], 500);
        }
    }

    /**
     * Mostrar una transición específica
     */
    public function show($id)
    {
        dd($id);
        try {
            $transicion = TransicionFlujo::with(['estadoOrigen', 'estadoDestino', 'tipoSolicitud', 'usuarioReasignar'])
                ->findOrFail($id);
            
            return response()->json([
                'success' => true,
                'transicion' => $transicion
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Transición no encontrada'
            ], 404);
        }
    }

    /**
     * Actualizar transición
     */
    public function update(Request $request, $id)
    {
        try {
            $transicion = TransicionFlujo::findOrFail($id);

            $validated = $request->validate([
                'nombre' => 'nullable|string|max:150',
                'descripcion' => 'nullable|string',
                'roles_permitidos' => 'nullable|array',
                'solo_funcionario_asignado' => 'boolean',
                'requiere_comentario' => 'boolean',
                'requiere_documento' => 'boolean',
                'requiere_aprobacion_previa' => 'boolean',
                'minimo_dias_transcurridos' => 'nullable|integer|min:0',
                'campos_requeridos' => 'nullable|array',
                'reasignar_funcionario' => 'boolean',
                'usuario_reasignar_id' => 'nullable|exists:users,id',
                'cambiar_prioridad_a' => 'nullable|in:baja,normal,alta,urgente',
                'recalcular_fecha_vencimiento' => 'boolean',
                'agregar_dias_vencimiento' => 'nullable|integer',
                'generar_documento' => 'boolean',
                'enviar_notificaciones' => 'boolean',
                'notificaciones_config' => 'nullable|array',
                'registrar_auditoria' => 'boolean',
                'color_boton' => 'nullable|string|max:20',
                'texto_boton' => 'nullable|string|max:50',
                'requiere_confirmacion' => 'boolean',
                'mensaje_confirmacion' => 'nullable|string',
                'activo' => 'boolean',
            ]);

            DB::beginTransaction();

            $transicion->update($validated);

            DB::commit();

            Log::info('Transición actualizada', [
                'transicion_id' => $transicion->id,
                'updated_by' => auth()->id()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Transición actualizada exitosamente',
                'transicion' => $transicion->load(['estadoOrigen', 'estadoDestino'])
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Error al actualizar transición', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar la transición'
            ], 500);
        }
    }

    /**
     * Eliminar transición
     */
    public function destroy($id)
    {
        try {
            $transicion = TransicionFlujo::findOrFail($id);

            DB::beginTransaction();

            $transicion->delete();

            DB::commit();

            Log::info('Transición eliminada', [
                'transicion_id' => $id,
                'deleted_by' => auth()->id()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Transición eliminada exitosamente'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Error al eliminar transición', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar la transición'
            ], 500);
        }
    }

    /**
     * Obtener diagrama de flujo completo
     */
    public function getDiagramaFlujo(Request $request)
    {
        try {
            $tipoSolicitudId = $request->input('tipo_solicitud_id');
            
            // Obtener todos los estados
            $estados = EstadoSolicitud::activos()->ordenado()->get();
            
            // Obtener transiciones
            $query = TransicionFlujo::with(['estadoOrigen', 'estadoDestino'])->activas();
            
            if ($tipoSolicitudId) {
                $query->where(function($q) use ($tipoSolicitudId) {
                    $q->where('tipo_solicitud_id', $tipoSolicitudId)
                      ->orWhereNull('tipo_solicitud_id');
                });
            } else {
                $query->whereNull('tipo_solicitud_id');
            }
            
            $transiciones = $query->get();

            // Formatear para el diagrama
            $nodos = $estados->map(function($estado) use ($transiciones) {
                $transicionesDesde = $transiciones->where('estado_origen_id', $estado->id)->count();
                
                return [
                    'id' => $estado->id,
                    'nombre' => $estado->nombre,
                    'slug' => $estado->slug,
                    'descripcion' => $estado->descripcion,
                    'tipo' => $estado->tipo,
                    'color' => $estado->color,
                    'icono' => $estado->icono,
                    'orden' => $estado->orden,
                    'transiciones_salida' => $transicionesDesde,
                    'sin_salidas' => $transicionesDesde === 0 && !$estado->esFinal(),
                ];
            });

            $enlaces = $transiciones->map(function($trans) {
                return $trans->config_diagrama;
            });

            return response()->json([
                'success' => true,
                'nodos' => $nodos,
                'enlaces' => $enlaces,
                'total_estados' => $estados->count(),
                'total_transiciones' => $transiciones->count(),
            ]);
        } catch (\Exception $e) {
            Log::error('Error al obtener diagrama', ['error' => $e->getMessage()]);
            
            return response()->json([
                'success' => false,
                'message' => 'Error al generar diagrama'
            ], 500);
        }
    }

    /**
     * Validar que una transición puede ser creada
     */
    public function validarTransicion(Request $request)
    {
        $existe = TransicionFlujo::where('tipo_solicitud_id', $request->tipo_solicitud_id)
            ->where('estado_origen_id', $request->estado_origen_id)
            ->where('estado_destino_id', $request->estado_destino_id)
            ->exists();

        return response()->json([
            'disponible' => !$existe,
            'message' => $existe ? 'Esta transición ya existe' : 'Transición disponible'
        ]);
    }
}
