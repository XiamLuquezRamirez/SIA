<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PlantillaDocumentoController extends Controller
{
    /**
     * Listar todas las plantillas activas
     */
    public function index(Request $request)
    {
        try {
            $query = DB::table('plantillas_documentos')
                ->whereNull('deleted_at')
                ->where('activo', true);

            // Filtro por tipo de documento
            if ($request->has('tipo_documento') && $request->tipo_documento != '') {
                $query->where('tipo_documento', $request->tipo_documento);
            }

            // Búsqueda
            if ($request->has('search') && $request->search != '') {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('nombre', 'ilike', "%{$search}%")
                      ->orWhere('descripcion', 'ilike', "%{$search}%")
                      ->orWhere('slug', 'ilike', "%{$search}%");
                });
            }

            $plantillas = $query->orderBy('nombre', 'asc')->get();

            return response()->json([
                'success' => true,
                'plantillas' => $plantillas
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cargar plantillas: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener una plantilla específica
     */
    public function show($id)
    {
        try {
            $plantilla = DB::table('plantillas_documentos')
                ->whereNull('deleted_at')
                ->where('id', $id)
                ->first();

            if (!$plantilla) {
                return response()->json([
                    'success' => false,
                    'message' => 'Plantilla no encontrada'
                ], 404);
            }

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
}
