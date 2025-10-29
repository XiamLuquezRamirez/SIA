<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TipoSolicitud;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\ConfiguracionRadicados;

class ConfiguracionRadicadosController extends Controller
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
                    // Los que SI tienen configuración (null)
                    $query->whereHas('configuracionRadicados');
                } elseif ($request->estado_configuracion === '2') {
                    // Los que No tienen configuración (no null)
                    $query->whereDoesntHave('configuracionRadicados');
                }
            }

            // Paginación
            $perPage = $request->get('per_page', 15);
            $tiposSolicitud = $query->paginate($perPage);


            $totalConfigurados = $tiposSolicitud->whereNotNull('configuracionRadicados')->count();

            return response()->json([
                'data' => $tiposSolicitud->items(),
                'current_page' => $tiposSolicitud->currentPage(),
                'last_page' => $tiposSolicitud->lastPage(),
                'per_page' => $tiposSolicitud->perPage(),
                'total' => $tiposSolicitud->total(),
                'totalConfigurados' => $totalConfigurados,
            ]);
        }

        return view('admin.configuracion.radicados-consecutivos.index');
    }

    function getTiposSolicitudes(){
        $solicitudes = TipoSolicitud::with(['categoria', 'areaResponsable', 'configuracionRadicados'])->orderBy('id', 'desc')->get();
        
        foreach($solicitudes as $solicitud){
            $solicitud->total_solicitudes_historicas = $solicitud->getSolicitudesCountAttribute();
        }

        return response()->json($solicitudes);
    }

    function guardarConfiguracionRadicado(Request $request)
    {
       $tipo_solicitud_id = $request->tipo_solicitud_id;
       $codigo = $request->codigo;
       $incluir_anio = $request->incluir_anio;
       $formato_anio = $request->formato_anio;
       $incluir_mes = $request->incluir_mes;
       $formato_mes = $request->formato_mes;
       $longitud_consecutivo = $request->longitud_consecutivo;
       $separador = $request->separador;
       $separador_personalizado = $request->separador_personalizado;
       $reiniciar_por = $request->reiniciar_por;
       $numero_inicial = $request->numero_inicial;


        //crear la configuracion del radicado
        $configuracion_radicado = ConfiguracionRadicados::create([
            'tipo_solicitud_id' => $tipo_solicitud_id,
            'codigo' => $codigo,
            'incluir_anio' => $incluir_anio,
            'formato_anio' => $formato_anio,
            'incluir_mes' => $incluir_mes,
            'formato_mes' => $formato_mes,
            'longitud_consecutivo' => $longitud_consecutivo,
            'separador' => $separador == 'custom' ? $separador_personalizado : $separador,
            'separador_personalizado' => $separador_personalizado,
            'reinicia_por' => $reiniciar_por,
            'numero_inicial' => $numero_inicial,
            'consecutivo' => $numero_inicial,
        ]);

        //registrar cambios en log para auditoría
        \Log::info('Configuracion del radicado creada exitosamente: ', [
            'accion' =>"configurar_radicado_creada",
            'usuario_que_crea' => auth()->id(),
            'id_configuracion_radicado' => $configuracion_radicado->id,
        ]);

        return response()->json([
            'message' => 'Configuracion del radicado creada exitosamente',
            'type' => 'success',
        ], 201);
    }
}
