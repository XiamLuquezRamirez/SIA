<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TransicionFlujo extends Model
{
    use HasFactory;

    protected $table = 'transiciones_flujo';

    protected $fillable = [
        'tipo_solicitud_id',
        'estado_origen_id',
        'estado_destino_id',
        'nombre',
        'descripcion',
        'roles_permitidos',
        'solo_funcionario_asignado',
        'requiere_comentario',
        'requiere_documento',
        'requiere_aprobacion_previa',
        'minimo_dias_transcurridos',
        'campos_requeridos',
        'condiciones_personalizadas',
        'reasignar_funcionario',
        'usuario_reasignar_id',
        'cambiar_prioridad_a',
        'recalcular_fecha_vencimiento',
        'agregar_dias_vencimiento',
        'generar_documento',
        'plantilla_documento_id',
        'enviar_notificaciones',
        'notificaciones_config',
        'registrar_auditoria',
        'orden',
        'color_boton',
        'texto_boton',
        'requiere_confirmacion',
        'mensaje_confirmacion',
        'activo',
    ];

    protected $casts = [
        'roles_permitidos' => 'array',
        'campos_requeridos' => 'array',
        'condiciones_personalizadas' => 'array',
        'notificaciones_config' => 'array',
        'solo_funcionario_asignado' => 'boolean',
        'requiere_comentario' => 'boolean',
        'requiere_documento' => 'boolean',
        'requiere_aprobacion_previa' => 'boolean',
        'reasignar_funcionario' => 'boolean',
        'recalcular_fecha_vencimiento' => 'boolean',
        'generar_documento' => 'boolean',
        'enviar_notificaciones' => 'boolean',
        'registrar_auditoria' => 'boolean',
        'requiere_confirmacion' => 'boolean',
        'activo' => 'boolean',
        'orden' => 'integer',
        'minimo_dias_transcurridos' => 'integer',
        'agregar_dias_vencimiento' => 'integer',
    ];

    /**
     * Relación con tipo de solicitud
     */
    public function tipoSolicitud()
    {
        return $this->belongsTo(TipoSolicitud::class, 'tipo_solicitud_id');
    }

    /**
     * Relación con estado origen
     */
    public function estadoOrigen()
    {
        return $this->belongsTo(EstadoSolicitud::class, 'estado_origen_id');
    }

    /**
     * Relación con estado destino
     */
    public function estadoDestino()
    {
        return $this->belongsTo(EstadoSolicitud::class, 'estado_destino_id');
    }

    /**
     * Relación con usuario para reasignación
     */
    public function usuarioReasignar()
    {
        return $this->belongsTo(User::class, 'usuario_reasignar_id');
    }

    /**
     * Scope para transiciones activas
     */
    public function scopeActivas($query)
    {
        return $query->where('activo', true);
    }

    /**
     * Scope para flujo básico (aplica a todos los tipos)
     */
    public function scopeFlujoBasico($query)
    {
        return $query->whereNull('tipo_solicitud_id');
    }

    /**
     * Scope para flujo específico de un tipo
     */
    public function scopeFlujoTipo($query, $tipoSolicitudId)
    {
        return $query->where('tipo_solicitud_id', $tipoSolicitudId);
    }

    /**
     * Scope para transiciones desde un estado
     */
    public function scopeDesdeEstado($query, $estadoId)
    {
        return $query->where('estado_origen_id', $estadoId);
    }

    /**
     * Verificar si un rol puede ejecutar esta transición
     */
    public function puedeEjecutarRol($nombreRol)
    {
        if (!$this->roles_permitidos || empty($this->roles_permitidos)) {
            return true; // Si no hay restricción, cualquiera puede
        }
        
        return in_array($nombreRol, $this->roles_permitidos);
    }

    /**
     * Obtener nombre de la transición o generar uno por defecto
     */
    public function getNombreDisplayAttribute()
    {
        if ($this->nombre) {
            return $this->nombre;
        }
        
        return $this->estadoOrigen->nombre . ' → ' . $this->estadoDestino->nombre;
    }

    /**
     * Verificar si la transición requiere condiciones
     */
    public function tieneCondiciones()
    {
        return $this->requiere_comentario 
            || $this->requiere_documento 
            || $this->requiere_aprobacion_previa 
            || $this->minimo_dias_transcurridos
            || ($this->campos_requeridos && count($this->campos_requeridos) > 0);
    }

    /**
     * Verificar si la transición tiene acciones automáticas
     */
    public function tieneAcciones()
    {
        return $this->reasignar_funcionario 
            || $this->cambiar_prioridad_a
            || $this->recalcular_fecha_vencimiento
            || $this->generar_documento
            || $this->enviar_notificaciones;
    }

    /**
     * Obtener configuración resumida para el diagrama
     */
    public function getConfigDiagramaAttribute()
    {
        return [
            'id' => $this->id,
            'from' => $this->estado_origen_id,
            'to' => $this->estado_destino_id,
            'label' => $this->nombre ?? '',
            'color' => $this->color_boton ?? '#3B82F6',
            'requiere_condiciones' => $this->tieneCondiciones(),
            'tiene_acciones' => $this->tieneAcciones(),
            'activo' => $this->activo,
        ];
    }
}
