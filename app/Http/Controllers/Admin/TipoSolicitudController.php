<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TipoSolicitud;
use App\Models\Area;
use App\Models\Categoria;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TipoSolicitudController extends Controller
{
    /**
     * Mostrar lista de tipos de solicitud
     */
    public function index(Request $request)
    {
        // Debug: Verificar autenticación
        \Log::info('TipoSolicitud index - Auth check', [
            'authenticated' => auth()->check(),
            'user_id' => auth()->id(),
            'is_ajax' => $request->ajax(),
            'session_id' => session()->getId(),
        ]);

        try {
            // Si es petición AJAX, devolver JSON
            if ($request->ajax()) {
                $query = TipoSolicitud::query();
                
                // Intentar cargar relaciones si existen
                try {
                    $query->with(['area', 'categoria']);
                } catch (\Exception $e) {
                    // Si falla la relación, continuar sin ella
                }

                // Búsqueda
                if ($request->filled('search')) {
                    $search = $request->search;
                    $query->where(function($q) use ($search) {
                        $q->where('nombre', 'ILIKE', "%{$search}%")
                          ->orWhere('codigo', 'ILIKE', "%{$search}%");
                    });
                }

                // Filtro por estado
                if ($request->filled('estado')) {
                    if ($request->estado === 'activos') {
                        $query->where('activo', true);
                    } elseif ($request->estado === 'inactivos') {
                        $query->where('activo', false);
                    }
                }

                // Filtro por área (usar area_responsable_id)
                if ($request->filled('area_id') || $request->filled('area_responsable_id')) {
                    $areaId = $request->filled('area_responsable_id') ? $request->area_responsable_id : $request->area_id;
                    $query->where('area_responsable_id', $areaId);
                }

                // Filtro por categoría
                if ($request->filled('categoria_id')) {
                    $query->where('categoria_id', $request->categoria_id);
                }

                // Ordenar - usar solo campos que existen con seguridad
                $query->orderBy('id', 'desc');

                $tipos = $query->paginate(24);

                return response()->json($tipos);
            }

            // Vista HTML
            return view('admin.tipos-solicitud.index');
        } catch (\Exception $e) {
            \Log::error('Error en TipoSolicitudController@index', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            // Si es AJAX, devolver error JSON
            if ($request->ajax()) {
                return response()->json([
                    'error' => 'Error al cargar tipos de solicitud',
                    'message' => $e->getMessage()
                ], 500);
            }
            
            // Si es web, redirigir con error
            return redirect()->route('admin.dashboard')
                ->with('error', 'Error al cargar tipos de solicitud: ' . $e->getMessage());
        }
    }

    /**
     * Mostrar detalle de un tipo de solicitud
     */
    public function show(string $id)
    {
        $tipo = TipoSolicitud::with(['areaResponsable', 'categoria', 'creador', 'editor'])->findOrFail($id);

        // Estadísticas simuladas (implementar cuando exista modelo Solicitud)
        $estadisticas = [
            'radicadas' => 0,
            'en_proceso' => 0,
            'completadas' => 0,
            'este_mes' => 0,
        ];

        return response()->json([
            'tipo' => $tipo,
            'estadisticas' => $estadisticas,
        ]);
    }

    /**
     * Crear nuevo tipo de solicitud
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'codigo' => 'required|string|max:50|unique:tipos_solicitud,codigo',
            'nombre' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:tipos_solicitud,slug|regex:/^[a-z0-9-]+$/',
            'descripcion' => 'nullable|string',
            'instrucciones' => 'nullable|string',
            'categoria_id' => 'required|exists:categorias,id',
            'area_responsable_id' => 'required|exists:areas,id',
            'dias_respuesta' => 'required|integer|min:1',
            'dias_alerta' => 'nullable|integer|min:1',
            'dias_alerta_amarilla' => 'nullable|integer|min:1',
            'dias_alerta_roja' => 'nullable|integer|min:1',
            'tipo_dias' => 'nullable|string|in:habiles,calendario',
            'iniciar_conteo_desde' => 'nullable|string|in:radicacion,asignacion,pago,estado_especifico',
            'sla_dias' => 'nullable|integer|min:1',
            'requiere_aprobacion' => 'boolean',
            'requiere_pago' => 'boolean',
            'valor_tramite' => 'nullable|numeric|min:0',
            'tipo_valor' => 'nullable|string|in:fijo,variable',
            'requiere_documentos' => 'boolean',
            'documentos_requeridos' => 'nullable|array',
            'prioridad_defecto' => 'nullable|string|in:baja,normal,alta,urgente',
            'momento_generacion' => 'nullable|string|in:al_aprobar,al_completar,manual',
            'icono' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:20',
            'visible_portal' => 'boolean',
            'solo_usuarios_registrados' => 'boolean',
            'activo' => 'boolean',
        ]);

        $validated['created_by'] = auth()->id();
        $validated['activo'] = $validated['activo'] ?? false;

        $tipo = TipoSolicitud::create($validated);

        \Log::info('Tipo de solicitud creado', [
            'tipo_id' => $tipo->id,
            'codigo' => $tipo->codigo,
            'created_by' => auth()->id(),
        ]);

        return response()->json([
            'message' => 'Tipo de solicitud creado exitosamente',
            'tipo' => $tipo->load('area'),
        ], 201);
    }

    /**
     * Actualizar tipo de solicitud
     */
    public function update(Request $request, string $id)
    {
        $tipo = TipoSolicitud::findOrFail($id);

        $validated = $request->validate([
            'codigo' => 'required|string|max:50|unique:tipos_solicitud,codigo,' . $id,
            'nombre' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:tipos_solicitud,slug,' . $id . '|regex:/^[a-z0-9-]+$/',
            'descripcion' => 'nullable|string',
            'instrucciones' => 'nullable|string',
            'categoria_id' => 'required|exists:categorias,id',
            'area_responsable_id' => 'required|exists:areas,id',
            'dias_respuesta' => 'required|integer|min:1',
            'dias_alerta' => 'nullable|integer|min:1',
            'dias_alerta_amarilla' => 'nullable|integer|min:1',
            'dias_alerta_roja' => 'nullable|integer|min:1',
            'tipo_dias' => 'nullable|string|in:habiles,calendario',
            'iniciar_conteo_desde' => 'nullable|string|in:radicacion,asignacion,pago,estado_especifico',
            'sla_dias' => 'nullable|integer|min:1',
            'requiere_aprobacion' => 'boolean',
            'requiere_pago' => 'boolean',
            'valor_tramite' => 'nullable|numeric|min:0',
            'tipo_valor' => 'nullable|string|in:fijo,variable',
            'requiere_documentos' => 'boolean',
            'documentos_requeridos' => 'nullable|array',
            'prioridad_defecto' => 'nullable|string|in:baja,normal,alta,urgente',
            'momento_generacion' => 'nullable|string|in:al_aprobar,al_completar,manual',
            'costo' => 'nullable|numeric|min:0',
            'icono' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:20',
        ]);

        $validated['updated_by'] = auth()->id();

        $tipo->update($validated);

        \Log::info('Tipo de solicitud actualizado', [
            'tipo_id' => $tipo->id,
            'updated_by' => auth()->id(),
        ]);

        return response()->json([
            'message' => 'Tipo de solicitud actualizado exitosamente',
            'tipo' => $tipo->load('area'),
        ]);
    }

    /**
     * Eliminar tipo de solicitud
     */
    public function destroy(string $id)
    {
        $tipo = TipoSolicitud::findOrFail($id);

        // Verificar que no tenga solicitudes activas
        // $solicitudesActivas = $tipo->solicitudes()->count();
        // if ($solicitudesActivas > 0) {
        //     return response()->json([
        //         'message' => "No se puede eliminar. Hay {$solicitudesActivas} solicitud(es) asociada(s)"
        //     ], 422);
        // }

        $tipo->delete();

        \Log::info('Tipo de solicitud eliminado', [
            'tipo_id' => $id,
            'deleted_by' => auth()->id(),
        ]);

        return response()->json([
            'message' => 'Tipo de solicitud eliminado exitosamente',
        ]);
    }

    /**
     * Toggle estado activo/inactivo
     */
    public function toggleEstado(Request $request, string $id)
    {
        $tipo = TipoSolicitud::findOrFail($id);
        $nuevoEstado = !$tipo->activo;

        $tipo->activo = $nuevoEstado;
        $tipo->updated_by = auth()->id();
        $tipo->save();

        \Log::info('Estado de tipo de solicitud cambiado', [
            'tipo_id' => $tipo->id,
            'nuevo_estado' => $nuevoEstado ? 'activo' : 'inactivo',
            'changed_by' => auth()->id(),
        ]);

        return response()->json([
            'message' => $nuevoEstado ? 'Tipo de solicitud activado' : 'Tipo de solicitud desactivado',
            'tipo' => $tipo,
        ]);
    }

    /**
     * Obtener categorías disponibles desde la tabla
     */
    public function getCategorias()
    {
        try {
            $categorias = Categoria::activas()
                ->ordenado()
                ->get()
                ->map(function($categoria) {
                    return [
                        'id' => $categoria->id,
                        'nombre' => $categoria->nombre,
                        'slug' => $categoria->slug,
                        'descripcion' => $categoria->descripcion,
                        'color' => $categoria->color,
                        'icono' => $categoria->icono,
                        'nombre_con_icono' => $categoria->nombre_con_icono,
                        'tipos_count' => $categoria->tipos_solicitud_activos_count,
                    ];
                });

            return response()->json([
                'success' => true,
                'categorias' => $categorias
            ]);
        } catch (\Exception $e) {
            \Log::error('Error al cargar categorías', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al cargar categorías',
                'categorias' => []
            ], 500);
        }
    }

    /**
     * Guardar plantillas asociadas al tipo de solicitud
     */
    public function guardarPlantillas(Request $request, string $id)
    {
        \Log::info('Iniciando guardarPlantillas', [
            'tipo_id' => $id,
            'request_data' => $request->all(),
        ]);

        $tipo = TipoSolicitud::findOrFail($id);

        try {
            $validated = $request->validate([
                'plantillas' => 'required|array',
                'plantillas.*.plantilla_documento_id' => 'required|exists:plantillas_documentos,id',
                'plantillas.*.generar_automatico' => 'boolean',
                'plantillas.*.momento_generacion' => 'required|in:al_aprobar,al_completar,manual',
                'plantillas.*.es_principal' => 'boolean',
                'plantillas.*.orden' => 'required|integer|min:1',
            ]);

            \Log::info('Validación exitosa', ['validated' => $validated]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Error de validación en guardarPlantillas', [
                'errors' => $e->errors(),
                'request_data' => $request->all(),
            ]);
            throw $e;
        }

        try {
            \DB::beginTransaction();

            // Eliminar plantillas anteriores del tipo de solicitud
            \DB::table('tipo_solicitud_plantilla')
                ->where('tipo_solicitud_id', $id)
                ->delete();

            // Insertar las nuevas plantillas
            foreach ($validated['plantillas'] as $plantilla) {
                \DB::table('tipo_solicitud_plantilla')->insert([
                    'tipo_solicitud_id' => $id,
                    'plantilla_documento_id' => $plantilla['plantilla_documento_id'],
                    'generar_automatico' => $plantilla['generar_automatico'] ?? true,
                    'momento_generacion' => $plantilla['momento_generacion'],
                    'es_principal' => $plantilla['es_principal'] ?? false,
                    'orden' => $plantilla['orden'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            \DB::commit();

            \Log::info('Plantillas asociadas a tipo de solicitud', [
                'tipo_id' => $id,
                'plantillas_count' => count($validated['plantillas']),
                'user_id' => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Plantillas guardadas exitosamente',
                'plantillas_count' => count($validated['plantillas']),
            ]);

        } catch (\Exception $e) {
            \DB::rollBack();

            \Log::error('Error al guardar plantillas del tipo de solicitud', [
                'tipo_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al guardar plantillas: ' . $e->getMessage(),
            ], 500);
        }
    }
}
