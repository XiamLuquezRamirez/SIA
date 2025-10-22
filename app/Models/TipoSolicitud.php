<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Schema;

class TipoSolicitud extends Model
{
    use HasFactory;

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
        'slug',
        'descripcion',
        'instrucciones',
        'categoria',
        'categoria_id',
        'area_responsable_id', // Campo principal
        'area_id', // Alias
        'dias_respuesta', // Campo principal
        'tiempo_respuesta_dias', // Alias
        'dias_alerta',
        'dias_alerta_amarilla',
        'dias_alerta_roja',
        'sla_dias',
        'activo',
        'requiere_aprobacion',
        'requiere_pago',
        'valor_tramite', // Campo principal
        'costo', // Alias
        'requiere_documentos',
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
     * Campos que son JSON o tienen tipos específicos
     */
    protected $casts = [
        'activo' => 'boolean',
        'requiere_aprobacion' => 'boolean',
        'requiere_pago' => 'boolean',
        'requiere_documentos' => 'boolean',
        'costo' => 'decimal:2',
        'valor_tramite' => 'decimal:2',
        'tiempo_respuesta_dias' => 'integer',
        'dias_respuesta' => 'integer',
        'dias_alerta' => 'integer',
        'sla_dias' => 'integer',
        'orden' => 'integer',
        'campos_formulario' => 'array',
        'documentos_requeridos' => 'array',
        'flujo_aprobacion' => 'array',
        'plantillas' => 'array',
        'notificaciones' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relación con Categoría
     */
    public function categoria()
    {
        return $this->belongsTo(Categoria::class, 'categoria_id');
    }

    /**
     * Relación con Área responsable (usa area_responsable_id)
     */
    public function areaResponsable()
    {
        return $this->belongsTo(Area::class, 'area_responsable_id');
    }

    /**
     * Alias para areaResponsable() - usa area_id si existe, sino area_responsable_id
     */
    public function area()
    {
        return $this->belongsTo(Area::class, 'area_responsable_id');
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
     * Scope para buscar por categoría (ID o slug)
     */
    public function scopeCategoria($query, $categoria)
    {
        // Si es numérico, buscar por ID, si no, por slug de categoría
        if (is_numeric($categoria)) {
            return $query->where('categoria_id', $categoria);
        }
        
        // Buscar categoría por slug y filtrar
        return $query->whereHas('categoria', function ($q) use ($categoria) {
            $q->where('slug', $categoria);
        });
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

    /**
     * Accessor para tiempo_respuesta_dias (alias de dias_respuesta)
     */
    public function getTiempoRespuestaDiasAttribute()
    {
        return $this->attributes['dias_respuesta'] ?? $this->attributes['tiempo_respuesta_dias'] ?? 3;
    }

    /**
     * Mutator para tiempo_respuesta_dias
     */
    public function setTiempoRespuestaDiasAttribute($value)
    {
        $this->attributes['dias_respuesta'] = $value;
    }

    /**
     * Accessor para costo (alias de valor_tramite)
     */
    public function getCostoAttribute()
    {
        return $this->attributes['valor_tramite'] ?? $this->attributes['costo'] ?? 0;
    }

    /**
     * Mutator para costo
     */
    public function setCostoAttribute($value)
    {
        $this->attributes['valor_tramite'] = $value;
    }

    /**
     * Accessor para area_id (alias de area_responsable_id)
     */
    public function getAreaIdAttribute()
    {
        return $this->attributes['area_responsable_id'] ?? $this->attributes['area_id'] ?? null;
    }

    /**
     * Mutator para area_id
     */
    public function setAreaIdAttribute($value)
    {
        $this->attributes['area_responsable_id'] = $value;
    }

    /**
     * Accessor para obtener el nombre de la categoría
     */
    public function getCategoriaNombreAttribute()
    {
        return $this->categoria ? $this->categoria->nombre : ($this->categoria ?? 'Sin categoría');
    }

    /**
     * Verificar si tiene documentos requeridos
     */
    public function tieneDocumentosRequeridos()
    {
        return $this->requiere_documentos && 
               is_array($this->documentos_requeridos) && 
               count($this->documentos_requeridos) > 0;
    }

    /**
     * Obtener conteo de documentos requeridos
     */
    public function getDocumentosRequeridosCountAttribute()
    {
        return is_array($this->documentos_requeridos) ? count($this->documentos_requeridos) : 0;
    }
}
