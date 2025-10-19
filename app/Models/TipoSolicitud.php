<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Schema;

class TipoSolicitud extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Nombre de la tabla
     */
    protected $table = 'tipos_solicitud';

    /**
     * Campos asignables masivamente
     */
    protected $fillable = [
        'codigo',
        'nombre',
        'descripcion',
        'categoria',
        'area_id',
        'tiempo_respuesta_dias',
        'sla_dias',
        'activo',
        'requiere_aprobacion',
        'requiere_pago',
        'costo',
        'campos_formulario',
        'documentos_requeridos',
        'flujo_aprobacion',
        'plantillas',
        'notificaciones',
        'orden',
        'icono',
        'color',
        'created_by',
        'updated_by',
    ];

    /**
     * Campos que son JSON
     */
    protected $casts = [
        'activo' => 'boolean',
        'requiere_aprobacion' => 'boolean',
        'requiere_pago' => 'boolean',
        'costo' => 'decimal:2',
        'campos_formulario' => 'array',
        'documentos_requeridos' => 'array',
        'flujo_aprobacion' => 'array',
        'plantillas' => 'array',
        'notificaciones' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Relación con Área
     */
    public function area()
    {
        return $this->belongsTo(Area::class);
    }

    /**
     * Relación con usuario creador
     */
    public function creador()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Relación con usuario que actualizó
     */
    public function editor()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Relación con solicitudes (cuando se implemente)
     */
    public function solicitudes()
    {
        return $this->hasMany(Solicitud::class, 'tipo_solicitud_id');
    }

    /**
     * Scope para tipos activos
     */
    public function scopeActivos($query)
    {
        return $query->where('activo', true);
    }

    /**
     * Scope para buscar por categoría
     */
    public function scopeCategoria($query, $categoria)
    {
        // Adaptable: usar categoria_id o categoria según estructura de BD
        if (Schema::hasColumn('tipos_solicitud', 'categoria_id')) {
            return $query->where('categoria_id', $categoria);
        }
        return $query->where('categoria', $categoria);
    }

    /**
     * Scope para filtrar por área
     */
    public function scopeArea($query, $areaId)
    {
        return $query->where('area_id', $areaId);
    }

    /**
     * Accessor para nombre completo con código
     */
    public function getNombreCompletoAttribute()
    {
        return "{$this->codigo} - {$this->nombre}";
    }

    /**
     * Accessor para ícono con fallback
     */
    public function getIconoDisplayAttribute()
    {
        return $this->icono ?? '📄';
    }
}
