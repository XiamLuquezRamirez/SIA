<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PlantillaDocumento;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class PlantillaDocumentoController extends Controller
{
    /**
     * Mostrar vista principal de plantillas
     */
    public function indexView()
    {
        return view('admin.configuracion.plantillas.index');
    }

    /**
     * Listar plantillas (API)
     */
    public function index(Request $request)
    {
        
        try {
            if ($request->ajax() || $request->wantsJson()) {
                $query = PlantillaDocumento::with(['creador', 'editor']);

                // Filtro por tipo de documento
                if ($request->filled('tipo')) {
                    $query->where('tipo_documento', $request->tipo);
                }

                // Filtro por estado
                if ($request->filled('estado')) {
                    if ($request->estado === 'activas') {
                        $query->where('activo', true);
                    } elseif ($request->estado === 'inactivas') {
                        $query->where('activo', false);
                    }
                }

                // Búsqueda
                if ($request->filled('search')) {
                    $search = $request->search;
                    $query->where(function($q) use ($search) {
                        $q->where('nombre', 'ilike', "%{$search}%")
                          ->orWhere('descripcion', 'ilike', "%{$search}%")
                          ->orWhere('slug', 'ilike', "%{$search}%");
                    });
                }

                // Ordenamiento
                $orderBy = $request->get('order_by', 'nombre');
                $orderDir = $request->get('order_dir', 'asc');
                $query->orderBy($orderBy, $orderDir);

                // Paginación
                $perPage = $request->get('per_page', 6);
                $plantillas = $query->paginate($perPage);

                // Agregar información de uso
                $plantillas->getCollection()->transform(function($plantilla) {
                    $plantilla->tipos_usando = $plantilla->tiposSolicitud()->count();
                    return $plantilla;
                });

                return response()->json([
                    'success' => true,
                    'plantillas' => $plantillas
                ]);
            }

            // Si no es AJAX, retornar vista
            return $this->indexView();

        } catch (\Exception $e) {
            \Log::error('Error al cargar plantillas', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al cargar plantillas: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mostrar vista de creación
     */
    public function create()
    {
        return view('admin.configuracion.plantillas.crear');
    }

    /**
     * Crear nueva plantilla
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'nombre' => 'required|string|max:255',
                'tipo_documento' => 'required|string|in:certificado,concepto,acta,oficio',
                'descripcion' => 'nullable|string',
                'contenido_html' => 'required|string',
                'contenido_css' => 'nullable|string',
                'encabezado_html' => 'nullable|string',
                'pie_pagina_html' => 'nullable|string',
                'orientacion' => 'required|in:vertical,horizontal',
                'tamano_pagina' => 'required|in:carta,oficio,a4',
                'margen_superior' => 'nullable|integer|min:0',
                'margen_inferior' => 'nullable|integer|min:0',
                'margen_izquierdo' => 'nullable|integer|min:0',
                'margen_derecho' => 'nullable|integer|min:0',
                'activo' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Errores de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            // Generar slug único
            $slug = PlantillaDocumento::generarSlug($request->nombre);

            $plantilla = PlantillaDocumento::create([
                'nombre' => $request->nombre,
                'slug' => $slug,
                'tipo_documento' => $request->tipo_documento,
                'descripcion' => $request->descripcion,
                'contenido_html' => $request->contenido_html,
                'contenido_css' => $request->contenido_css,
                'encabezado_html' => $request->encabezado_html,
                'pie_pagina_html' => $request->pie_pagina_html,
                'orientacion' => $request->orientacion ?? 'vertical',
                'tamano_pagina' => $request->tamano_pagina ?? 'carta',
                'margen_superior' => $request->margen_superior ?? 25,
                'margen_inferior' => $request->margen_inferior ?? 25,
                'margen_izquierdo' => $request->margen_izquierdo ?? 25,
                'margen_derecho' => $request->margen_derecho ?? 25,
                'activo' => $request->activo ?? true,
                'created_by' => auth()->id(),
            ]);

            // Extraer y guardar variables usadas
            $plantilla->actualizarVariables();

            DB::commit();

            \Log::info('Plantilla de documento creada', [
                'plantilla_id' => $plantilla->id,
                'nombre' => $plantilla->nombre,
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Plantilla creada exitosamente',
                'plantilla' => $plantilla->fresh(['creador'])
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            \Log::error('Error al crear plantilla', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al crear plantilla: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mostrar vista de edición
     */
    public function edit($id)
    {
        $plantilla = PlantillaDocumento::with(['creador', 'editor'])->findOrFail($id);
        return view('admin.configuracion.plantillas.editar', compact('plantilla'));
    }

    /**
     * Mostrar detalles de una plantilla
     */
    public function show($id)
    {
        try {
            $plantilla = PlantillaDocumento::with(['creador', 'editor', 'tiposSolicitud'])
                ->findOrFail($id);

            // Agregar estadísticas
            $plantilla->estadisticas = $plantilla->getEstadisticas();

            return response()->json([
                'success' => true,
                'plantilla' => $plantilla
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cargar plantilla: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar plantilla
     */
    public function update(Request $request, $id)
    {
        try {
            $plantilla = PlantillaDocumento::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'nombre' => 'required|string|max:255',
                'tipo_documento' => 'required|string|in:certificado,concepto,acta,oficio',
                'descripcion' => 'nullable|string',
                'contenido_html' => 'required|string',
                'contenido_css' => 'nullable|string',
                'encabezado_html' => 'nullable|string',
                'pie_pagina_html' => 'nullable|string',
                'orientacion' => 'required|in:vertical,horizontal',
                'tamano_pagina' => 'required|in:carta,oficio,a4',
                'margen_superior' => 'nullable|integer|min:0',
                'margen_inferior' => 'nullable|integer|min:0',
                'margen_izquierdo' => 'nullable|integer|min:0',
                'margen_derecho' => 'nullable|integer|min:0',
                'activo' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Errores de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            // Actualizar slug si cambió el nombre
            if ($request->nombre !== $plantilla->nombre) {
                $slug = PlantillaDocumento::generarSlug($request->nombre);
                $plantilla->slug = $slug;
            }

            $plantilla->fill([
                'nombre' => $request->nombre,
                'tipo_documento' => $request->tipo_documento,
                'descripcion' => $request->descripcion,
                'contenido_html' => $request->contenido_html,
                'contenido_css' => $request->contenido_css,
                'encabezado_html' => $request->encabezado_html,
                'pie_pagina_html' => $request->pie_pagina_html,
                'orientacion' => $request->orientacion,
                'tamano_pagina' => $request->tamano_pagina,
                'margen_superior' => $request->margen_superior,
                'margen_inferior' => $request->margen_inferior,
                'margen_izquierdo' => $request->margen_izquierdo,
                'margen_derecho' => $request->margen_derecho,
                'activo' => $request->activo ?? $plantilla->activo,
                'updated_by' => auth()->id(),
            ]);

            $plantilla->save();

            // Actualizar variables
            $plantilla->actualizarVariables();

            DB::commit();

            \Log::info('Plantilla actualizada', [
                'plantilla_id' => $plantilla->id,
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Plantilla actualizada exitosamente',
                'plantilla' => $plantilla->fresh(['creador', 'editor'])
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            \Log::error('Error al actualizar plantilla', [
                'plantilla_id' => $id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar plantilla: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar plantilla
     */
    public function destroy($id)
    {
        try {
            $plantilla = PlantillaDocumento::findOrFail($id);

            // Verificar si está en uso
            $tiposUsando = $plantilla->tiposSolicitud()->count();
            if ($tiposUsando > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede eliminar la plantilla porque está siendo usada por ' . $tiposUsando . ' tipo(s) de solicitud',
                    'tipos_usando' => $tiposUsando
                ], 422);
            }

            $plantilla->delete();

            \Log::info('Plantilla eliminada', [
                'plantilla_id' => $id,
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Plantilla eliminada exitosamente'
            ]);

        } catch (\Exception $e) {
            \Log::error('Error al eliminar plantilla', [
                'plantilla_id' => $id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar plantilla: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Duplicar plantilla
     */
    public function duplicar(Request $request, $id)
    {
        try {
            $plantillaOriginal = PlantillaDocumento::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'nuevo_nombre' => 'required|string|max:255',
                'copiar_contenido' => 'nullable|boolean',
                'copiar_encabezado_pie' => 'nullable|boolean',
                'copiar_configuracion' => 'nullable|boolean',
                'copiar_estilos' => 'nullable|boolean',
                'activo' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            $slug = PlantillaDocumento::generarSlug($request->nuevo_nombre);

            $nuevaPlantilla = PlantillaDocumento::create([
                'nombre' => $request->nuevo_nombre,
                'slug' => $slug,
                'tipo_documento' => $plantillaOriginal->tipo_documento,
                'descripcion' => $plantillaOriginal->descripcion,
                'contenido_html' => $request->copiar_contenido !== false ? $plantillaOriginal->contenido_html : '',
                'contenido_css' => $request->copiar_estilos !== false ? $plantillaOriginal->contenido_css : '',
                'encabezado_html' => $request->copiar_encabezado_pie !== false ? $plantillaOriginal->encabezado_html : '',
                'pie_pagina_html' => $request->copiar_encabezado_pie !== false ? $plantillaOriginal->pie_pagina_html : '',
                'orientacion' => $request->copiar_configuracion !== false ? $plantillaOriginal->orientacion : 'vertical',
                'tamano_pagina' => $request->copiar_configuracion !== false ? $plantillaOriginal->tamano_pagina : 'carta',
                'margen_superior' => $request->copiar_configuracion !== false ? $plantillaOriginal->margen_superior : 25,
                'margen_inferior' => $request->copiar_configuracion !== false ? $plantillaOriginal->margen_inferior : 25,
                'margen_izquierdo' => $request->copiar_configuracion !== false ? $plantillaOriginal->margen_izquierdo : 25,
                'margen_derecho' => $request->copiar_configuracion !== false ? $plantillaOriginal->margen_derecho : 25,
                'activo' => $request->activo ?? false,
                'created_by' => auth()->id(),
            ]);

            $nuevaPlantilla->actualizarVariables();

            DB::commit();

            \Log::info('Plantilla duplicada', [
                'original_id' => $id,
                'nueva_id' => $nuevaPlantilla->id,
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Plantilla duplicada exitosamente',
                'plantilla' => $nuevaPlantilla->fresh(['creador'])
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            \Log::error('Error al duplicar plantilla', [
                'plantilla_id' => $id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al duplicar plantilla: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Toggle estado activo/inactivo
     */
    public function toggleEstado($id)
    {
        try {
            $plantilla = PlantillaDocumento::findOrFail($id);
            $plantilla->activo = !$plantilla->activo;
            $plantilla->updated_by = auth()->id();
            $plantilla->save();

            return response()->json([
                'success' => true,
                'message' => $plantilla->activo ? 'Plantilla activada' : 'Plantilla desactivada',
                'activo' => $plantilla->activo
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cambiar estado: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Ver uso de la plantilla
     */
    public function verUso($id)
    {
        try {
            $plantilla = PlantillaDocumento::with(['tiposSolicitud' => function($query) {
                $query->select('tipos_solicitud.id', 'tipos_solicitud.codigo', 'tipos_solicitud.nombre');
            }])->findOrFail($id);

            $estadisticas = $plantilla->getEstadisticas();

            return response()->json([
                'success' => true,
                'plantilla' => $plantilla,
                'estadisticas' => $estadisticas,
                'tipos_solicitud' => $plantilla->tiposSolicitud
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener uso: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Preview PDF con datos de ejemplo
     */
    public function previewPDF(Request $request, $id)
    {
        try {
            $plantilla = PlantillaDocumento::findOrFail($id);

            // Obtener datos de ejemplo o personalizados
            $datos = $request->has('datos_personalizados')
                ? $request->datos_personalizados
                : PlantillaDocumento::getDatosEjemplo();

            // Generar HTML completo
            $htmlCompleto = $plantilla->encabezado_html ?? '';
            $htmlCompleto .= $plantilla->contenido_html;
            $htmlCompleto .= $plantilla->pie_pagina_html ?? '';

            // Reemplazar variables
            $htmlFinal = $plantilla->reemplazarVariables($htmlCompleto, $datos);

            // Agregar CSS
            $css = $plantilla->contenido_css ?? '';

            // TODO: Aquí iría la integración con librería PDF (DomPDF, mPDF, etc.)
            // Por ahora retornamos el HTML procesado

            return response()->json([
                'success' => true,
                'html' => $htmlFinal,
                'css' => $css,
                'configuracion' => [
                    'orientacion' => $plantilla->orientacion,
                    'tamano_pagina' => $plantilla->tamano_pagina,
                    'margenes' => [
                        'superior' => $plantilla->margen_superior,
                        'inferior' => $plantilla->margen_inferior,
                        'izquierdo' => $plantilla->margen_izquierdo,
                        'derecho' => $plantilla->margen_derecho,
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Error al generar preview PDF', [
                'plantilla_id' => $id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al generar preview: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Exportar plantillas seleccionadas
     */
    public function exportar(Request $request)
    {
        try {
            $ids = $request->get('ids', []);

            $plantillas = PlantillaDocumento::whereIn('id', $ids)->get();

            $export = $plantillas->map(function($plantilla) {
                return [
                    'nombre' => $plantilla->nombre,
                    'tipo_documento' => $plantilla->tipo_documento,
                    'descripcion' => $plantilla->descripcion,
                    'contenido_html' => $plantilla->contenido_html,
                    'contenido_css' => $plantilla->contenido_css,
                    'encabezado_html' => $plantilla->encabezado_html,
                    'pie_pagina_html' => $plantilla->pie_pagina_html,
                    'orientacion' => $plantilla->orientacion,
                    'tamano_pagina' => $plantilla->tamano_pagina,
                    'margen_superior' => $plantilla->margen_superior,
                    'margen_inferior' => $plantilla->margen_inferior,
                    'margen_izquierdo' => $plantilla->margen_izquierdo,
                    'margen_derecho' => $plantilla->margen_derecho,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $export,
                'filename' => 'plantillas_' . date('Y-m-d') . '.json'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al exportar: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Importar plantillas desde JSON
     */
    public function importar(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'plantillas' => 'required|array',
                'modo' => 'required|in:crear,reemplazar'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            $importadas = 0;
            $reemplazadas = 0;
            $errores = [];

            foreach ($request->plantillas as $plantillaData) {
                try {
                    $slug = PlantillaDocumento::generarSlug($plantillaData['nombre']);

                    if ($request->modo === 'reemplazar') {
                        $existente = PlantillaDocumento::where('nombre', $plantillaData['nombre'])->first();
                        if ($existente) {
                            $existente->update(array_merge($plantillaData, [
                                'slug' => $slug,
                                'updated_by' => auth()->id()
                            ]));
                            $existente->actualizarVariables();
                            $reemplazadas++;
                            continue;
                        }
                    }

                    $plantilla = PlantillaDocumento::create(array_merge($plantillaData, [
                        'slug' => $slug,
                        'created_by' => auth()->id()
                    ]));
                    $plantilla->actualizarVariables();
                    $importadas++;

                } catch (\Exception $e) {
                    $errores[] = "Error en '{$plantillaData['nombre']}': " . $e->getMessage();
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "Importación completada: {$importadas} creadas, {$reemplazadas} reemplazadas",
                'importadas' => $importadas,
                'reemplazadas' => $reemplazadas,
                'errores' => $errores
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Error al importar: ' . $e->getMessage()
            ], 500);
        }
    }
}
