<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

class EstadoSolicitud extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'estados_solicitud';

    protected $fillable = [
        'codigo',
        'nombre',
        'slug',
        'descripcion',
        'tipo',
        'es_inicial',
        'es_final',
        'es_sistema',
        'notifica_solicitante',
        'permite_edicion',
        'requiere_resolucion',
        'genera_documento',
        'pausa_sla',
        'reinicia_sla',
        'color',
        'icono',
        'orden',
        'activo',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'es_inicial' => 'boolean',
        'es_final' => 'boolean',
        'es_sistema' => 'boolean',
        'notifica_solicitante' => 'boolean',
        'permite_edicion' => 'boolean',
        'requiere_resolucion' => 'boolean',
        'genera_documento' => 'boolean',
        'pausa_sla' => 'boolean',
        'reinicia_sla' => 'boolean',
        'activo' => 'boolean',
        'orden' => 'integer',
    ];

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
     * Estados a los que puede avanzar desde este estado
     */
    public function estadosSiguientes()
    {
        return $this->belongsToMany(
            EstadoSolicitud::class,
            'estado_siguiente',
            'estado_actual_id',
            'estado_siguiente_id'
        )->withTimestamps();
    }

    /**
     * Estados desde los que puede venir
     */
    public function estadosAnteriores()
    {
        return $this->belongsToMany(
            EstadoSolicitud::class,
            'estado_siguiente',
            'estado_siguiente_id',
            'estado_actual_id'
        )->withTimestamps();
    }

    /**
     * Roles que pueden asignar este estado
     */
    public function roles()
    {
        return $this->belongsToMany(
            Role::class,
            'estado_rol',
            'estado_solicitud_id',
            'role_id'
        )->withTimestamps();
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
     * Scope para estados del sistema
     */
    public function scopeSistema($query)
    {
        return $query->where('es_sistema', true);
    }

    /**
     * Generar slug único
     */
    public static function generarSlug($nombre)
    {
        $slug = Str::slug($nombre);
        $contador = 1;
        $slugBase = $slug;

        while (static::where('slug', $slug)->exists()) {
            $slug = $slugBase . '-' . $contador;
            $contador++;
        }

        return $slug;
    }

    /**
     * Verificar si tiene solicitudes asociadas
     */
    public function tieneSolicitudes()
    {
        // TODO: Implementar cuando exista la tabla de solicitudes
        return false;
    }

    /**
     * Contar solicitudes en este estado
     */
    public function contarSolicitudes()
    {
        // TODO: Implementar cuando exista la tabla de solicitudes
        return 0;
    }

    /**
     * Verificar si puede ser eliminado
     */
    public function puedeSerEliminado()
    {
        if ($this->es_sistema) {
            return false;
        }

        if ($this->tieneSolicitudes()) {
            return false;
        }

        return true;
    }

    /**
     * Verificar si es estado inicial
     */
    public function esInicial()
    {
        return $this->es_inicial;
    }

    /**
     * Verificar si es estado final
     */
    public function esFinal()
    {
        return $this->es_final;
    }

    /**
     * Accessor para nombre con icono
     */
    public function getNombreConIconoAttribute()
    {
        return $this->icono ? "{$this->icono} {$this->nombre}" : $this->nombre;
    }

    /**
     * Obtener badge HTML
     */
    public function getBadgeHtmlAttribute()
    {
        $tipoClasses = [
            'inicial' => 'bg-blue-100 text-blue-800',
            'proceso' => 'bg-orange-100 text-orange-800',
            'final' => 'bg-green-100 text-green-800',
            'bloqueante' => 'bg-gray-100 text-gray-800',
        ];

        $class = $tipoClasses[$this->tipo] ?? 'bg-gray-100 text-gray-800';

        return sprintf(
            '<span class="px-2 py-1 rounded text-xs font-medium %s" style="background-color: %s20; color: %s;">%s %s</span>',
            $class,
            $this->color,
            $this->color,
            $this->icono ?? '',
            $this->nombre
        );
    }
}
