<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TipoSolicitud;
use App\Models\Area;
use Illuminate\Http\Request;

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
                
                // Intentar cargar relación area si existe
                try {
                    $query->with(['area']);
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

                // Filtro por área
                if ($request->filled('area_id')) {
                    $query->where('area_id', $request->area_id);
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
        $tipo = TipoSolicitud::with(['area', 'creador', 'editor'])->findOrFail($id);

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
            'descripcion' => 'nullable|string',
            'categoria' => 'required|string|max:100',
            'area_id' => 'required|exists:areas,id',
            'tiempo_respuesta_dias' => 'required|integer|min:1',
            'sla_dias' => 'nullable|integer|min:1',
            'requiere_aprobacion' => 'boolean',
            'requiere_pago' => 'boolean',
            'costo' => 'nullable|numeric|min:0',
            'icono' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:20',
        ]);

        $validated['created_by'] = auth()->id();
        $validated['activo'] = $validated['activo'] ?? true;

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
            'descripcion' => 'nullable|string',
            'categoria' => 'required|string|max:100',
            'area_id' => 'required|exists:areas,id',
            'tiempo_respuesta_dias' => 'required|integer|min:1',
            'sla_dias' => 'nullable|integer|min:1',
            'requiere_aprobacion' => 'boolean',
            'requiere_pago' => 'boolean',
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
     * Obtener categorías disponibles
     */
    public function getCategorias()
    {
        // Por ahora devolver categorías predefinidas
        // TODO: Crear modelo CategoriaSolicitud cuando exista la tabla
        $categorias = [
            'Certificados',
            'Permisos',
            'Licencias',
            'Consultas',
            'Trámites',
            'Otros'
        ];

        return response()->json([
            'categorias' => $categorias
        ]);
    }
}
