<?php

namespace App\Http\Controllers;
use App\Events\UserNotificationEvent;
use Illuminate\Http\Request;
use App\Models\UserNotificationSetting;

class NotificationsController extends Controller
{
    function enviarNotificacion($userId, $message)
    {
        $userId = $userId;
        $message = $message;
        broadcast(new UserNotificationEvent($userId, $message));
        return response()->json(['status' => 'ok']);
    }

    function configurarNotificaciones()
    {
        return view('notifications.config');
    }


    function guardarConfiguracion(Request $request)
    {
        $data = $request->only([
            'mostrar_notificaciones',
            'reproducir_sonido',
            'mostrar_badge',
            'frecuencia_envio',
            'sol_nueva_asignada_plataforma',
            'sol_nueva_asignada_email',
            'sol_actualizada_plataforma',
            'sol_actualizada_email',
            'sol_completada_plataforma',
            'sol_completada_email',
            'sol_comentario_plataforma',
            'sol_comentario_email',
            'sol_documento_plataforma',
            'sol_documento_email',
            'sol_proxima_vencer_plataforma',
            'sol_proxima_vencer_email',
            'sol_vencida_plataforma',
            'sol_vencida_email',
            'col_mencion_plataforma',
            'col_mencion_email',
            'col_respuesta_plataforma',
            'col_respuesta_email',
        ]);

    
        $id_usuario = auth()->user()->id;

        UserNotificationSetting::updateOrCreate(
            ['id_usuario' => $id_usuario],
            $data
        );

        return response()->json([
            'status' => 'ok',
            'message' => 'Configuración guardada correctamente',
            'type' => 'success',
        ]);

    }

    function obtenerConfiguracion()
    {
        $id_usuario = auth()->user()->id;
        $configuracion = UserNotificationSetting::where('id_usuario', $id_usuario)->first();
        return response()->json($configuracion);
    }
}
