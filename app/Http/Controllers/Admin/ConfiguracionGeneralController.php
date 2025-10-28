<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ConfiguracionGeneral;
use Illuminate\Http\Request;

class ConfiguracionGeneralController extends Controller
{
    public function index(Request $request)
    {
        if($request->ajax()){
            $configuracionGeneral = ConfiguracionGeneral::first();

            return response()->json([
                'configuracionGeneral' => $configuracionGeneral
            ]);
        }

        return view('admin.configuracion-general.index');
    }

    public function guardarConfiguracionGeneral(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'nit' => 'required|string|max:255',
            'direccion' => 'required|string|max:255',
            'ciudad' => 'required|string|max:255',
            'departamento' => 'required|string|max:255',
            'telefono_principal' => 'required|string|max:255',
            'telefono_secundario' => 'nullable|string|max:255',
            'email_contacto' => 'required|email|max:255',
            'sitio_web' => 'required|string|max:255',
            'slogan' => 'nullable|string|max:255',
            'horario_lunes_viernes_desde_jornada_manana' => 'required|string|max:255',
            'horario_lunes_viernes_hasta_jornada_manana' => 'required|string|max:255',
            'horario_lunes_viernes_desde_jornada_tarde' => 'required|string|max:255',
            'horario_lunes_viernes_hasta_jornada_tarde' => 'required|string|max:255',
            'habilitar_sabados' => 'required|boolean',
            'horario_sabado_desde' => 'nullable|string|max:255',
            'horario_sabado_hasta' => 'nullable|string|max:255',
            'habilitar_recordatorio_vencidas' => 'required|boolean',
            'hora_recordatorio_vencidas' => 'nullable|string|max:255',
            'habilitar_recordatorio_alertas' => 'required|boolean',
            'hora_recordatorio_alertas' => 'nullable|string|max:255',
            'tam_max_archivo_mb' => 'required|numeric|min:1',
            'tam_max_total_mb' => 'required|numeric|min:1',
            'formato_pdf' => 'required|boolean',
            'formato_doc' => 'required|boolean',
            'formato_docx' => 'required|boolean',
            'formato_xls' => 'required|boolean',
            'formato_xlsx' => 'required|boolean',
            'formato_jpg' => 'required|boolean',
            'formato_png' => 'required|boolean',
            'formato_gif' => 'required|boolean',
            'formato_bmp' => 'required|boolean',
            'formato_tiff' => 'required|boolean',
            'formato_zip' => 'required|boolean',
            'formato_rar' => 'required|boolean',
            'formato_7z' => 'required|boolean',
        ]);

         // Procesar foto si existe
         $fotoUrl = null;
         if ($request->hasFile('foto')) {
             $fotoUrl = $request->file('foto')->store('informacion_general', 'public');
         }

        if($request->action === 'crear'){
            $configuracionGeneral = ConfiguracionGeneral::create(
                [
                    'nombre_entidad' => $request->nombre,
                    'nit' => $request->nit,
                    'direccion' => $request->direccion,
                    'ciudad' => $request->ciudad,
                    'departamento' => $request->departamento,
                    'telefono_principal' => $request->telefono_principal,
                    'telefono_secundario' => $request->telefono_secundario,
                    'email_contacto' => $request->email_contacto,
                    'sitio_web' => $request->sitio_web,
                    'slogan' => $request->slogan,
                    'horario_lunes_viernes_desde_jornada_manana' => $request->horario_lunes_viernes_desde_jornada_manana,
                    'horario_lunes_viernes_hasta_jornada_manana' => $request->horario_lunes_viernes_hasta_jornada_manana,
                    'horario_lunes_viernes_desde_jornada_tarde' => $request->horario_lunes_viernes_desde_jornada_tarde,
                    'horario_lunes_viernes_hasta_jornada_tarde' => $request->horario_lunes_viernes_hasta_jornada_tarde,
                    'habilitar_sabados' => $request->habilitar_sabados,
                    'horario_sabado_desde' => $request->horario_sabado_desde,
                    'horario_sabado_hasta' => $request->horario_sabado_hasta,
                    'enviar_recordatorio_vencidas' => $request->habilitar_recordatorio_vencidas,
                    'hora_recordatorio_vencidas' => $request->hora_recordatorio_vencidas,
                    'enviar_recordatorio_alertas' => $request->habilitar_recordatorio_alertas,
                    'hora_recordatorio_alertas' => $request->hora_recordatorio_alertas,
                    'tam_max_archivo_mb' => $request->tam_max_archivo_mb,
                    'tam_max_total_mb' => $request->tam_max_total_mb,
                    'formato_doc_pdf' => $request->formato_pdf,
                    'formato_doc_doc' => $request->formato_doc,
                    'formato_doc_docx' => $request->formato_docx,
                    'formato_doc_xls' => $request->formato_xls,
                    'formato_doc_xlsx' => $request->formato_xlsx,
                    'formato_img_jpg' => $request->formato_jpg,
                    'formato_img_png' => $request->formato_png,
                    'formato_img_gif' => $request->formato_gif,
                    'formato_img_bmp' => $request->formato_bmp,
                    'formato_img_tiff' => $request->formato_tiff,
                    'formato_otros_zip' => $request->formato_zip,
                    'formato_otros_rar' => $request->formato_rar,
                    'formato_otros_7z' => $request->formato_7z,
                    'logo_url' => $fotoUrl ?? null,
                ]
            );

            return response()->json([
                'type' => 'success',
                'message' => 'Configuración general creada correctamente',
            ]);
        } else {
            $configuracionGeneral = ConfiguracionGeneral::find($request->id);
            
            $configuracionGeneral->nombre_entidad = $request->nombre;
            $configuracionGeneral->nit = $request->nit;
            $configuracionGeneral->direccion = $request->direccion;
            $configuracionGeneral->ciudad = $request->ciudad;
            $configuracionGeneral->departamento = $request->departamento;
            $configuracionGeneral->telefono_principal = $request->telefono_principal;
            $configuracionGeneral->telefono_secundario = $request->telefono_secundario;
            $configuracionGeneral->email_contacto = $request->email_contacto;
            $configuracionGeneral->sitio_web = $request->sitio_web;
            $configuracionGeneral->slogan = $request->slogan;
            $configuracionGeneral->horario_lunes_viernes_desde_jornada_manana = $request->horario_lunes_viernes_desde_jornada_manana;
            $configuracionGeneral->horario_lunes_viernes_hasta_jornada_manana = $request->horario_lunes_viernes_hasta_jornada_manana;
            $configuracionGeneral->horario_lunes_viernes_desde_jornada_tarde = $request->horario_lunes_viernes_desde_jornada_tarde;
            $configuracionGeneral->horario_lunes_viernes_hasta_jornada_tarde = $request->horario_lunes_viernes_hasta_jornada_tarde;
            $configuracionGeneral->habilitar_sabados = $request->habilitar_sabados;
            $configuracionGeneral->horario_sabado_desde = $request->horario_sabado_desde;
            $configuracionGeneral->horario_sabado_hasta = $request->horario_sabado_hasta;
            $configuracionGeneral->enviar_recordatorio_vencidas = $request->habilitar_recordatorio_vencidas;
            $configuracionGeneral->hora_recordatorio_vencidas = $request->hora_recordatorio_vencidas;
            $configuracionGeneral->enviar_recordatorio_alertas = $request->habilitar_recordatorio_alertas;
            $configuracionGeneral->hora_recordatorio_alertas = $request->hora_recordatorio_alertas;
            $configuracionGeneral->tam_max_archivo_mb = $request->tam_max_archivo_mb;
            $configuracionGeneral->tam_max_total_mb = $request->tam_max_total_mb;
            $configuracionGeneral->formato_doc_pdf = $request->formato_pdf;
            $configuracionGeneral->formato_doc_doc = $request->formato_doc;
            $configuracionGeneral->formato_doc_docx = $request->formato_docx;
            $configuracionGeneral->formato_doc_xls = $request->formato_xls;
            $configuracionGeneral->formato_doc_xlsx = $request->formato_xlsx;
            $configuracionGeneral->formato_img_jpg = $request->formato_jpg;
            $configuracionGeneral->formato_img_png = $request->formato_png;
            $configuracionGeneral->formato_img_gif = $request->formato_gif;
            $configuracionGeneral->formato_img_bmp = $request->formato_bmp;
            $configuracionGeneral->formato_img_tiff = $request->formato_tiff;
            $configuracionGeneral->formato_otros_zip = $request->formato_zip;
            $configuracionGeneral->formato_otros_rar = $request->formato_rar;
            $configuracionGeneral->formato_otros_7z = $request->formato_7z;

            if($request->hasFile('foto')){
                $configuracionGeneral->logo_url = $fotoUrl;
            }
            
            $configuracionGeneral->save();

            return response()->json([
                'type' => 'success',
                'message' => 'Configuración general actualizada correctamente',
            ]);
        }
    }


    public function consultarValoresPorDefecto()
    {
        $defaults = [
            'nombre_entidad' => 'Alcaldia de Valledupar',
            'nit' => '900123456-7',
            'direccion' => 'Calle 123 #45-67',
            'ciudad' => 'Valledupar',
            'departamento' => 'Cesar',
            'telefono_principal' => '6011234567',
            'telefono_secundario' => null,
            'email_contacto' => 'contacto@valledupar.gov.co',
            'sitio_web' => 'https://valledupar-cesar.gov.co/Paginas/default.aspx',
            'slogan' => 'Transparencia y eficiencia para todos',

            'horario_lunes_viernes_desde_jornada_manana' => '07:00:00',
            'horario_lunes_viernes_hasta_jornada_manana' => '13:00:00',
            'horario_lunes_viernes_desde_jornada_tarde' => '15:00:00',
            'horario_lunes_viernes_hasta_jornada_tarde' => '18:00:00',
            'habilitar_sabados' => false,
            'horario_sabado_desde' => '07:00:00',
            'horario_sabado_hasta' => '12:00:00',

            'enviar_recordatorio_vencidas' => true,
            'hora_recordatorio_vencidas' => '09:00:00',
            'enviar_recordatorio_alertas' => true,
            'hora_recordatorio_alertas' => '09:00:00',

            'tam_max_archivo_mb' => 10,
            'tam_max_total_mb' => 50,

            'formato_doc_pdf'  => true,
            'formato_doc_doc'  => true,
            'formato_doc_docx' => true,
            'formato_doc_xls'  => true,
            'formato_doc_xlsx' => true,

            'formato_img_jpg'  => true,
            'formato_img_png'  => true,
            'formato_img_gif'  => true,
            'formato_img_bmp'  => true,
            'formato_img_tiff' => true,

            'formato_otros_zip' => true,
            'formato_otros_rar' => true,
            'formato_otros_7z'  => true,
        ];

        return response()->json([
            'configuracionGeneral' => $defaults
        ]);
    }
}
