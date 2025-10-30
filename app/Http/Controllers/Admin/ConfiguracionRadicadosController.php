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

    function editarConfiguracionRadicado(Request $request)
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
        $id_configuracion_radicado = $request->id_configuracion_radicado;


        //editar la configuracion del radicado
        $configuracion_radicado = ConfiguracionRadicados::where('id', $id_configuracion_radicado)->first();
        
        $data_old = [
            'codigo' => $configuracion_radicado->codigo,
            'incluir_anio' => $configuracion_radicado->incluir_anio,
            'formato_anio' => $configuracion_radicado->formato_anio,
            'incluir_mes' => $configuracion_radicado->incluir_mes,
            'formato_mes' => $configuracion_radicado->formato_mes,
            'longitud_consecutivo' => $configuracion_radicado->longitud_consecutivo,
            'separador' => $configuracion_radicado->separador,
            'reinicia_por' => $configuracion_radicado->reinicia_por,
        ];

        $configuracion_radicado->codigo = $codigo;
        $configuracion_radicado->incluir_anio = $incluir_anio;
        $configuracion_radicado->formato_anio = $formato_anio;
        $configuracion_radicado->incluir_mes = $incluir_mes;
        $configuracion_radicado->formato_mes = $formato_mes;
        $configuracion_radicado->longitud_consecutivo = $longitud_consecutivo;
        $configuracion_radicado->separador = $separador == 'custom' ? $separador_personalizado : $separador;
        $configuracion_radicado->reinicia_por = $reiniciar_por;
        $configuracion_radicado->save();

        //ver que datos cambiaron
        $data_changed = [];
        if($data_old['codigo'] != $configuracion_radicado->codigo) {
            $data_changed[] = 'Código: ' . $data_old['codigo'] . ' -> ' . $configuracion_radicado->codigo;
        }
        if($data_old['incluir_anio'] != $configuracion_radicado->incluir_anio) {
            $data_changed[] = 'Incluir Año: ' . $data_old['incluir_anio'] . ' -> ' . $configuracion_radicado->incluir_anio;
        }
        if($data_old['formato_anio'] != $configuracion_radicado->formato_anio) {
            $data_changed[] = 'Formato Año: ' . $data_old['formato_anio'] . ' -> ' . $configuracion_radicado->formato_anio;
        }
        if($data_old['incluir_mes'] != $configuracion_radicado->incluir_mes) {
            $data_changed[] = 'Incluir Mes: ' . $data_old['incluir_mes'] . ' -> ' . $configuracion_radicado->incluir_mes;
        }
        if($data_old['formato_mes'] != $configuracion_radicado->formato_mes) {
            $data_changed[] = 'Formato Mes: ' . $data_old['formato_mes'] . ' -> ' . $configuracion_radicado->formato_mes;
        }
        if($data_old['longitud_consecutivo'] != $configuracion_radicado->longitud_consecutivo) {
            $data_changed[] = 'Longitud Consecutivo: ' . $data_old['longitud_consecutivo'] . ' -> ' . $configuracion_radicado->longitud_consecutivo;
        }
        if($data_old['separador'] != $configuracion_radicado->separador) {
            $data_changed[] = 'Separador: ' . $data_old['separador'] . ' -> ' . $configuracion_radicado->separador;
        }
        if($data_old['reinicia_por'] != $configuracion_radicado->reinicia_por) {
            $data_changed[] = 'Reiniciar Por: ' . $data_old['reinicia_por'] . ' -> ' . $configuracion_radicado->reinicia_por;
        }

        //registrar cambios en log para auditoría
        \Log::info('Configuracion del radicado editada exitosamente: ', [
            'accion' =>"configurar_radicado_editada",
            'usuario_que_edita' => auth()->id(),
            'id_configuracion_radicado' => $configuracion_radicado->id,
            'cambios_realizados' => $data_changed,
        ]);

        return response()->json([
            'message' => 'Configuracion del radicado editada exitosamente',
            'type' => 'success',
        ], 200);
    }
}
