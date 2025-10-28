<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CampoPersonalizado extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'campos_personalizados';

    protected $fillable = [
        'nombre',
        'slug',
        'etiqueta',
        'variable',
        'descripcion',
        'categoria',
        'tipo',
        'placeholder',
        'valor_defecto',
        'longitud_minima',
        'longitud_maxima',
        'valor_minimo',
        'valor_maximo',
        'opciones',
        'formatos_permitidos',
        'tamano_maximo_mb',
        'configuracion',
        'validacion',
        'ancho',
        'icono',
        'clases_css',
        'logica_condicional',
        'formula',
        'comportamiento',
        'ayuda_contextual',
        'activo',
        'orden',
        'usos',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'configuracion' => 'array',
        'validacion' => 'array',
        'opciones' => 'array',
        'logica_condicional' => 'array',
        'comportamiento' => 'array',
        'ayuda_contextual' => 'array',
        'activo' => 'boolean',
        'orden' => 'integer',
        'usos' => 'integer',
        'longitud_minima' => 'integer',
        'longitud_maxima' => 'integer',
        'valor_minimo' => 'decimal:2',
        'valor_maximo' => 'decimal:2',
        'tamano_maximo_mb' => 'integer',
    ];

    /**
     * Relación con el usuario creador
     */
    public function creador()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Relación con el usuario editor
     */
    public function editor()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Relación con tipos de solicitud
     */
    public function tiposSolicitud()
    {
        return $this->belongsToMany(TipoSolicitud::class, 'campos_tipo_solicitud')
            ->withPivot([
                'nombre_override', 'etiqueta_override', 'variable_override', 
                'descripcion_override', 'placeholder_override', 'valor_defecto_override',
                'obligatorio', 'solo_lectura', 'oculto', 'ancho', 'orden', 
                'seccion', 'mostrar_si'
            ])
            ->withTimestamps();
    }

    /**
     * Scope para campos activos
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
        return $query->where('categoria', $categoria);
    }

    /**
     * Scope para buscar por tipo
     */
    public function scopeTipo($query, $tipo)
    {
        return $query->where('tipo', $tipo);
    }

    /**
     * Scope para ordenar por categoría y orden
     */
    public function scopeOrdenado($query)
    {
        return $query->orderBy('categoria')->orderBy('orden')->orderBy('nombre');
    }

    /**
     * Generar slug automáticamente desde el nombre
     */
    public static function generarSlug($nombre)
    {
        $slug = strtolower($nombre);
        $slug = preg_replace('/[áàäâ]/u', 'a', $slug);
        $slug = preg_replace('/[éèëê]/u', 'e', $slug);
        $slug = preg_replace('/[íìïî]/u', 'i', $slug);
        $slug = preg_replace('/[óòöô]/u', 'o', $slug);
        $slug = preg_replace('/[úùüû]/u', 'u', $slug);
        $slug = preg_replace('/[ñ]/u', 'n', $slug);
        $slug = preg_replace('/[^a-z0-9]+/', '_', $slug);
        $slug = trim($slug, '_');

        return $slug;
    }

    
    /**
     * Generar variable para plantillas
     */
    public static function generarVariable($slug)
    {
        return '{{campo.' . $slug . '}}';
    }

    /**
     * Accessor para obtener el conteo real de usos
     * Calcula dinámicamente cuántos tipos de solicitud usan este campo
     */
    public function getUsosAttribute($value)
    {
        // Si la relación está cargada, contar desde ahí
        if ($this->relationLoaded('tiposSolicitud')) {
            return $this->tiposSolicitud->count();
        }
        
        // Si existe el atributo tipos_solicitud_count (cuando se usa withCount)
        if (isset($this->attributes['tipos_solicitud_count'])) {
            return $this->attributes['tipos_solicitud_count'];
        }
        
        // De lo contrario, devolver el valor de la base de datos
        return $value ?? 0;
    }
}
