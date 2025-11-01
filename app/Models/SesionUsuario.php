<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class SesionUsuario extends Model
{
    use HasFactory;

    protected $table = 'sesiones_usuarios';

    protected $fillable = [
        'id_usuario',
        'dispositivo',
        'ubicacion',
        'fecha_hora',
        'ip',
        'navegador',
        'ip_privada',
        'estado',
        'tipo_dispositivo',
        'nombre_dispositivo',
    ];

    // Relación con el modelo Usuario
    public function usuario()
    {
        return $this->belongsTo(User::class, 'id_usuario');
    }
}
