<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EstadoSolicitud extends Model
{
    use HasFactory;

    protected $table = 'estados_solicitud';

    protected $fillable = [
        'nombre',
        'slug',
        'descripcion',
        'tipo',
        'color',
        'icono',
        'orden',
        'notificar_ciudadano',
        'notificar_funcionario',
        'requiere_comentario',
        'permite_cambios',
        'visible_ciudadano',
        'activo',
        'es_sistema',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'notificar_ciudadano' => 'boolean',
        'notificar_funcionario' => 'boolean',
        'requiere_comentario' => 'boolean',
        'permite_cambios' => 'boolean',
        'visible_ciudadano' => 'boolean',
        'activo' => 'boolean',
        'es_sistema' => 'boolean',
        'orden' => 'integer',
    ];

    /**
     * Relación con transiciones de origen
     */
    public function transicionesOrigen()
    {
        return $this->hasMany(TransicionFlujo::class, 'estado_origen_id');
    }

    /**
     * Relación con transiciones de destino
     */
    public function transicionesDestino()
    {
        return $this->hasMany(TransicionFlujo::class, 'estado_destino_id');
    }

    /**
     * Obtener todos los estados a los que se puede transicionar desde este
     */
    public function estadosSiguientes()
    {
        return $this->belongsToMany(
            EstadoSolicitud::class,
            'transiciones_flujo',
            'estado_origen_id',
            'estado_destino_id'
        )->withPivot([
            'nombre',
            'descripcion',
            'roles_permitidos',
            'requiere_comentario',
            'requiere_documento',
            'activo'
        ]);
    }

    /**
     * Scope para estados activos
     */
    public function scopeActivos($query)
    {
        return $query->where('activo', true);
    }

    /**
     * Scope para estados por tipo
     */
    public function scopeTipo($query, $tipo)
    {
        return $query->where('tipo', $tipo);
    }

    /**
     * Scope ordenado
     */
    public function scopeOrdenado($query)
    {
        return $query->orderBy('orden')->orderBy('nombre');
    }

    /**
     * Accessor para nombre con icono
     */
    public function getNombreConIconoAttribute()
    {
        return "{$this->icono} {$this->nombre}";
    }

    /**
     * Verificar si es estado inicial
     */
    public function esInicial()
    {
        return $this->tipo === 'inicial';
    }

    /**
     * Verificar si es estado final
     */
    public function esFinal()
    {
        return in_array($this->tipo, ['final', 'final_exitoso', 'final_rechazado', 'cancelado']);
    }

    /**
     * Verificar si es estado de proceso
     */
    public function esProceso()
    {
        return in_array($this->tipo, ['proceso', 'intermedio']);
    }

    /**
     * Obtener transiciones disponibles para un tipo de solicitud
     */
    public function getTransicionesDisponibles($tipoSolicitudId = null)
    {
        $query = $this->transicionesOrigen()->where('activo', true);
        
        if ($tipoSolicitudId) {
            $query->where(function($q) use ($tipoSolicitudId) {
                $q->where('tipo_solicitud_id', $tipoSolicitudId)
                  ->orWhereNull('tipo_solicitud_id');
            });
        } else {
            $query->whereNull('tipo_solicitud_id');
        }
        
        return $query->get();
    }
}
