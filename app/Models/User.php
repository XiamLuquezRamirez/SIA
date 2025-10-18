<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles, SoftDeletes;

    protected $fillable = [
        'tipo_documento',
        'cedula',
        'nombre',
        'apellidos',
        'email',
        'password',
        'telefono',
        'celular',
        'direccion',
        'foto_url',
        'area_id',
        'equipo_id',
        'cargo',
        'tipo_usuario',
        'activo',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'activo' => 'boolean',
    ];

    // Relación con área
    public function area()
    {
        return $this->belongsTo(Area::class);
    }

    // Relación con equipo
    public function equipo()
    {
        return $this->belongsTo(Equipo::class);
    }

    // Accessor para nombre completo
    public function getNombreCompletoAttribute()
    {
        return "{$this->nombre} {$this->apellidos}";
    }

    // Scope para usuarios activos
    public function scopeActivos($query)
    {
        return $query->where('activo', true);
    }

    // Helper para verificar si es funcionario
    public function esFuncionario()
    {
        return $this->tipo_usuario === 'interno';
    }

    // Helper para verificar si es ciudadano
    public function esCiudadano()
    {
        return $this->tipo_usuario === 'externo';
    }

    // Relación con logs de actividad
    public function activityLogs()
    {
        return $this->hasMany(ActivityLog::class, 'user_id');
    }

    // Obtener logs de actividad recientes
    public function recentActivityLogs($limit = 20)
    {
        return $this->activityLogs()
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }
}
