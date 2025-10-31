<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class UserNotificationSetting extends Model
{
    use HasFactory;

    protected $table = 'config_notificacion';

    protected $fillable = [
        'id_usuario',
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
    ];

    // Relación: un usuario tiene una configuración de notificaciones
    public function user()
    {
        return $this->belongsTo(User::class, 'id_usuario');
    }
}
