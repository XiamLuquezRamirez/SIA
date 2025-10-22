<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Categoria extends Model
{
    use HasFactory;

    /**
     * Nombre de la tabla
     */
    protected $table = 'categorias';

    /**
     * Campos asignables masivamente
     */
    protected $fillable = [
        'nombre',
        'slug',
        'descripcion',
        'color',
        'icono',
        'orden',
        'activo',
    ];

    /**
     * Campos que son cast
     */
    protected $casts = [
        'activo' => 'boolean',
        'orden' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relación con tipos de solicitud
     */
    public function tiposSolicitud()
    {
        return $this->hasMany(TipoSolicitud::class, 'categoria_id');
    }

    /**
     * Scope para categorías activas
     */
    public function scopeActivas($query)
    {
        return $query->where('activo', true);
    }

    /**
     * Scope para ordenar por orden
     */
    public function scopeOrdenado($query)
    {
        return $query->orderBy('orden')->orderBy('nombre');
    }

    /**
     * Accessor para mostrar el icono con el nombre
     */
    public function getNombreConIconoAttribute()
    {
        return "{$this->icono} {$this->nombre}";
    }

    /**
     * Obtener conteo de tipos de solicitud activos
     */
    public function getTiposSolicitudActivosCountAttribute()
    {
        return $this->tiposSolicitud()->where('activo', true)->count();
    }
}
