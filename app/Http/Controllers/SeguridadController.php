<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\SesionUsuario;
use Illuminate\Support\Facades\Auth;
use Jenssegers\Agent\Agent;
use Illuminate\Support\Facades\Http;

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
    
        $dispositivo = $agent->platform(); // Windows, Android, iOS, etc.
        $navegador = $agent->browser();    // Chrome, Safari, Firefox, etc.
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
        ]);

        return response()->json([
            'message' => 'Nueva sesión creada correctamente',
            'data' => $sesion
        ], 201);
    }

    public function cambiarEstadoSesion($request){
        $idUsuario = Auth::id();
        $ip_privada = $request->ip();
        $ip = $request->ip;
        $sesion = SesionUsuario::where('id_usuario', $idUsuario)
            ->where('ip', $request->ip)
            ->where('ip_privada', $request->ip_privada)
            ->first();
        $sesion->update([
            'estado' => 'inactiva',
        ]);
    }

}
