<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CampoPersonalizado;
use Illuminate\Http\Request;

class CampoPersonalizadoController extends Controller
{
    /**
     * Mostrar la biblioteca de campos personalizados
     */
    public function index(Request $request)
    {
       
        // Si es petición AJAX, devolver JSON
        if ($request->ajax()) {
            $query = CampoPersonalizado::query();
          
            // Búsqueda
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('nombre', 'ILIKE', "%{$search}%")
                      ->orWhere('etiqueta', 'ILIKE', "%{$search}%")
                      ->orWhere('slug', 'ILIKE', "%{$search}%");
                });
            }

           

            // Filtro por categoría
            if ($request->filled('categoria')) {
                $query->categoria($request->categoria);
            }

            // Filtro por tipo
            if ($request->filled('tipo')) {
                $query->tipo($request->tipo);
            }

            // Filtro por estado
            if ($request->filled('estado')) {
                if ($request->estado === 'activos') {
                    $query->where('activo', true);
                } elseif ($request->estado === 'inactivos') {
                    $query->where('activo', false);
                }
            }

            // Ordenar
            $query->ordenado();

            // Cargar relaciones y conteos
            $query->with(['creador', 'tiposSolicitud'])
                  ->withCount('tiposSolicitud');
                
            $campos = $query->paginate(6);

            return response()->json($campos);
        }

        // Vista HTML
        return view('admin.configuracion.campos-personalizados.index');
    }

    /**
     * Obtener un campo específico
     */
    public function show($id)
    {
        $campo = CampoPersonalizado::with(['creador', 'editor', 'tiposSolicitud'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'campo' => $campo,
        ]);
    }

    /**
     * Crear nuevo campo personalizado
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'nombre' => 'required|string|max:255',
                'slug' => 'required|string|max:255|unique:campos_personalizados,slug',
                'etiqueta' => 'required|string|max:255',
                'variable' => 'required|string|max:255',
                'descripcion' => 'nullable|string',
                'categoria' => 'required|string|max:100',
                'tipo' => 'required|string|max:50',
                'configuracion' => 'nullable|array',
                'validacion' => 'nullable|array',
                'opciones' => 'nullable|array',
                'ancho' => 'nullable|string|in:completo,medio,tercio,cuarto',
                'icono' => 'nullable|string|max:50',
                'clases_css' => 'nullable|string|max:255',
                'logica_condicional' => 'nullable|array',
                'formula' => 'nullable|string|max:500',
                'comportamiento' => 'nullable|array',
                'ayuda_contextual' => 'nullable|array',
                'activo' => 'nullable|boolean',
                'orden' => 'nullable|integer',
            ]);

            $validated['created_by'] = auth()->id();
            $validated['activo'] = $validated['activo'] ?? false;

            $campo = CampoPersonalizado::create($validated);

            \Log::info('Campo personalizado creado', [
                'campo_id' => $campo->id,
                'nombre' => $campo->nombre,
                'created_by' => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Campo creado exitosamente',
                'campo' => $campo,
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error al crear campo personalizado: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al crear el campo: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar campo personalizado
     */
    public function update(Request $request, $id)
    {
        try {
            $campo = CampoPersonalizado::findOrFail($id);

            $validated = $request->validate([
                'nombre' => 'required|string|max:255',
                'slug' => 'required|string|max:255|unique:campos_personalizados,slug,' . $id,
                'etiqueta' => 'required|string|max:255',
                'variable' => 'required|string|max:255',
                'descripcion' => 'nullable|string',
                'categoria' => 'required|string|max:100',
                'tipo' => 'required|string|max:50',
                'configuracion' => 'nullable|array',
                'validacion' => 'nullable|array',
                'opciones' => 'nullable|array',
                'ancho' => 'nullable|string|in:completo,medio,tercio,cuarto',
                'icono' => 'nullable|string|max:50',
                'clases_css' => 'nullable|string|max:255',
                'logica_condicional' => 'nullable|array',
                'formula' => 'nullable|string|max:500',
                'comportamiento' => 'nullable|array',
                'ayuda_contextual' => 'nullable|array',
                'activo' => 'nullable|boolean',
                'orden' => 'nullable|integer',
            ]);

            $validated['updated_by'] = auth()->id();

            $campo->update($validated);

            \Log::info('Campo personalizado actualizado', [
                'campo_id' => $campo->id,
                'updated_by' => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Campo actualizado exitosamente',
                'campo' => $campo,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error al actualizar campo personalizado: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar el campo: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar campo personalizado
     */
    public function destroy($id)
    {
        $campo = CampoPersonalizado::findOrFail($id);

        // Verificar que no esté en uso
        $usosActivos = $campo->tiposSolicitud()->count();
        if ($usosActivos > 0) {
            return response()->json([
                'success' => false,
                'message' => "No se puede eliminar. El campo está siendo usado en {$usosActivos} tipo(s) de solicitud"
            ], 422);
        }

        $campo->delete();

        \Log::info('Campo personalizado eliminado', [
            'campo_id' => $id,
            'deleted_by' => auth()->id(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Campo eliminado exitosamente',
        ]);
    }

    /**
     * Toggle estado activo/inactivo
     */
    public function toggleEstado($id)
    {
        $campo = CampoPersonalizado::findOrFail($id);
        $nuevoEstado = !$campo->activo;

        $campo->activo = $nuevoEstado;
        $campo->updated_by = auth()->id();
        $campo->save();

        \Log::info('Estado de campo personalizado cambiado', [
            'campo_id' => $campo->id,
            'nuevo_estado' => $nuevoEstado ? 'activo' : 'inactivo',
            'changed_by' => auth()->id(),
        ]);

        return response()->json([
            'success' => true,
            'message' => $nuevoEstado ? 'Campo activado' : 'Campo desactivado',
            'campo' => $campo,
        ]);
    }

    /**
     * Duplicar campo personalizado
     */
    public function duplicar($id)
    {
        $campoOriginal = CampoPersonalizado::findOrFail($id);

        $nuevoCampo = $campoOriginal->replicate();
        $nuevoCampo->nombre = $campoOriginal->nombre . ' (Copia)';
        $nuevoCampo->slug = CampoPersonalizado::generarSlug($nuevoCampo->nombre);
        $nuevoCampo->variable = CampoPersonalizado::generarVariable($nuevoCampo->slug);
        $nuevoCampo->activo = true;
        $nuevoCampo->usos = 0;
        $nuevoCampo->created_by = auth()->id();
        $nuevoCampo->updated_by = null;
        $nuevoCampo->save();

        \Log::info('Campo personalizado duplicado', [
            'campo_original_id' => $campoOriginal->id,
            'campo_nuevo_id' => $nuevoCampo->id,
            'created_by' => auth()->id(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Campo duplicado exitosamente',
            'campo' => $nuevoCampo,
        ], 201);
    }

    /**
     * Ver uso del campo (en qué tipos de solicitud se usa)
     */
    public function verUso($id)
    {
        $campo = CampoPersonalizado::with('tiposSolicitud')->findOrFail($id);

        return response()->json([
            'success' => true,
            'campo' => $campo->nombre,
            'tipos_solicitud' => $campo->tiposSolicitud,
            'total_usos' => $campo->tiposSolicitud->count(),
        ]);
    }

    /**
     * Generar slug desde nombre
     */
    public function generarSlug(Request $request)
    {
        $nombre = $request->input('nombre');
        $slug = CampoPersonalizado::generarSlug($nombre);
        $variable = CampoPersonalizado::generarVariable($slug);

        return response()->json([
            'success' => true,
            'slug' => $slug,
            'variable' => $variable,
        ]);
    }

    /**
     * Obtener categorías disponibles
     */
    public function getCategorias()
    {
        $categorias = CampoPersonalizado::select('categoria')
            ->groupBy('categoria')
            ->orderBy('categoria')
            ->pluck('categoria');

        // Categorías predefinidas
        $categoriasDefault = [
            'datos_generales' => 'Datos Generales',
            'datos_predio' => 'Datos del Predio',
            'informacion_tecnica' => 'Información Técnica',
            'archivos_documentos' => 'Archivos y Documentos',
            'sin_categorizar' => 'Sin Categorizar',
        ];

        return response()->json([
            'success' => true,
            'categorias' => $categoriasDefault,
            'categorias_usadas' => $categorias,
        ]);
    }
}
