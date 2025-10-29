<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TipoSolicitud;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class RadicadosConsecutivosController extends Controller
{
    public function index(Request $request)
    {
        if ($request->ajax()) {
            $query = TipoSolicitud::with(['categoria', 'configuracionRadicados'])->orderBy('id', 'desc');

            // Búsqueda
            if ($request->has('search') && $request->search) {
                $search = $request->search;
            
                $query->where(function($q) use ($search) {
                    $q->where('nombre', 'ILIKE', "%{$search}%")
                      ->orWhereHas('categoria', function($q2) use ($search) {
                          $q2->where('nombre', 'ILIKE', "%{$search}%");
                      });
                });
            }

            // Filtro por estado de configuración
            if ($request->has('estado_configuracion') && $request->estado_configuracion) {
                if ($request->estado_configuracion === '1') {
                    // Los que NO tienen configuración (null)
                    $query->whereDoesntHave('configuracionRadicados');
                } elseif ($request->estado_configuracion === '2') {
                    // Los que SÍ tienen configuración (no null)
                    $query->whereHas('configuracionRadicados');
                }
            }

            // Paginación
            $perPage = $request->get('per_page', 15);
            $tiposSolicitud = $query->paginate($perPage);


            $totalConfigurados = $tiposSolicitud->where('configuracionRadicados', true)->count();

            return response()->json([
                'data' => $tiposSolicitud->items(),
                'current_page' => $tiposSolicitud->currentPage(),
                'last_page' => $tiposSolicitud->lastPage(),
                'per_page' => $tiposSolicitud->perPage(),
                'total' => $tiposSolicitud->total(),
                'totalConfigurados' => $totalConfigurados,
            ]);
        }

        return view('admin.radicados-consecutivos.index');
    }

    function getTiposSolicitudes(){
        $solicitudes = TipoSolicitud::with(['categoria', 'areaResponsable'])->orderBy('id', 'desc')->get();
        
        foreach($solicitudes as $solicitud){
            $solicitud->total_solicitudes_historicas = $solicitud->getSolicitudesCountAttribute();
        }

        return response()->json($solicitudes);
    }
}
