<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\SesionUsuario;
use Illuminate\Support\Facades\Auth;
use Jenssegers\Agent\Agent;
use Illuminate\Support\Facades\Http;
use App\Models\ActivityLog;
class SeguridadController extends Controller
{
    public function index()
    {
        return view('seguridad.index');
    }


    public function registrarSesion(Request $request){
        $idUsuario = Auth::id();
        $agent = new Agent();
        $agent->setUserAgent($request->userAgent()); // <— aquí usamos el User-Agent del cliente
    
        $nombre_dispositivo = $agent->device();
        $dispositivo = $agent->platform(); // Windows, Android, iOS, etc.
        $navegador = $agent->browser(); 
        $tipo_dispositivo = "";
        
        if($agent->isMobile()){
            $tipo_dispositivo = "Movil";
        }else{
            $tipo_dispositivo = "PC";
        }
        // Chrome, Safari, Firefox, etc.
        $ip = $request->ip_publica;              // IP real del cliente
        $ip_privada = $request->ip_privada;
        $fecha_hora = now()->translatedFormat('j \\d\\e F \\a \\l\\a\\s h:i A');

        $ubicacion = null;
        try {
            $response = Http::get("http://ip-api.com/json/{$ip}");
            if ($response->successful()) {
                $data = $response->json();
                $ubicacion = "{$data['city']}, {$data['country']}";
            }
        } catch (\Exception $e) {
            $ubicacion = null;
        }

        // Buscar si ya existe una sesión activa con mismo usuario, dispositivo e IP
        $sesionExistente = SesionUsuario::where('id_usuario', $idUsuario)
            ->where('dispositivo', $dispositivo)
            ->where('ip_privada', $ip_privada)
            ->where('ip', $ip)
            ->first();


        if ($sesionExistente) {
            // Si ya existe una sesión activa, simplemente actualiza la fecha y ubicación
            $sesionExistente->update([
                'fecha_hora' => $fecha_hora,
                'ubicacion' => $ubicacion,
                'navegador' => $navegador,
                'estado' => 'activa',
                'tipo_dispositivo' => $tipo_dispositivo,
                'nombre_dispositivo' => $nombre_dispositivo,
            ]);

            return response()->json([
                'message' => 'Sesión ya activa, se actualizó la información existente.',
                'data' => $sesionExistente
            ], 200);
        }

        // Crear nueva sesión si no existe una activa
        $sesion = SesionUsuario::create([
            'id_usuario' => $idUsuario,
            'dispositivo' => $dispositivo,
            'ubicacion' => $ubicacion,
            'fecha_hora' => $fecha_hora,
            'ip' => $ip,
            'ip_privada' => $ip_privada,
            'navegador' => $navegador,
            'estado' => 'activa',
            'tipo_dispositivo' => $tipo_dispositivo,
            'nombre_dispositivo' => $nombre_dispositivo,
        ]);

        return response()->json([
            'message' => 'Nueva sesión creada correctamente',
            'data' => $sesion
        ], 201);
    }

    public function cambiarEstadoSesion($request){
        $idUsuario = Auth::id();
        $ip_privada = $request->ip_privada;
        $ip_publica = $request->ip_publica;
        $sesion = SesionUsuario::where('id_usuario', $idUsuario)
            ->where('ip', $ip_publica)
            ->where('ip_privada', $ip_privada)
            ->first();
        $sesion->update([
            'estado' => 'inactiva',
        ]);
    }

    public function datosSeguridad()
    {
        $ip_publica = request()->ip_publica;
        $ip_privada = request()->ip();

        $idUsuario = auth()->user()->id;

        $ultima_vez_cambio_password = ActivityLog::where('user_id', $idUsuario)
            ->where('event', 'password_changed')
            ->orderBy('created_at', 'desc')
            ->first();

        if($ultima_vez_cambio_password){
            $ultima_vez_cambio_password_en_dias = $ultima_vez_cambio_password->created_at->diffInDays(now());
        }else{
            $ultima_vez_cambio_password_en_dias = 0;
        }

        $dispositivos_vinculados_pc = SesionUsuario::where('id_usuario', $idUsuario)
        ->where('tipo_dispositivo', 'PC')
        ->orderBy('created_at', 'desc')
        ->orderBy('updated_at', 'desc')
        ->get();


        foreach($dispositivos_vinculados_pc as $dispositivo){
            if($dispositivo->ip == $ip_publica && $dispositivo->ip_privada == $ip_privada){
                $dispositivo->actual = true;
            }else{
                $dispositivo->actual = false;
            }
        }

        $dispositivos_vinculados_movil = SesionUsuario::where('id_usuario', $idUsuario)
        ->where('tipo_dispositivo', 'Movil')
        ->orderBy('created_at', 'desc')
        ->orderBy('updated_at', 'desc')
        ->get();

        foreach($dispositivos_vinculados_movil as $dispositivo){
            if($dispositivo->ip == $ip_publica && $dispositivo->ip_privada == $ip_privada){
                $dispositivo->actual = true;
            }else{
                $dispositivo->actual     = false;
            }
        }

        return response()->json([
            'ultima_vez_cambio_password' => $ultima_vez_cambio_password_en_dias,
            'dispositivos_vinculados_pc' => $dispositivos_vinculados_pc,
            'dispositivos_vinculados_movil' => $dispositivos_vinculados_movil,
        ]);
    }

}
