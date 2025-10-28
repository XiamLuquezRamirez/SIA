<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class PlantillaDocumento extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'plantillas_documentos';

    protected $fillable = [
        'nombre',
        'slug',
        'tipo_documento',
        'descripcion',
        'contenido_html',
        'contenido_css',
        'encabezado_html',
        'pie_pagina_html',
        'orientacion',
        'tamano_pagina',
        'margen_superior',
        'margen_inferior',
        'margen_izquierdo',
        'margen_derecho',
        'variables_usadas',
        'variables_obligatorias',
        'configuracion_adicional',
        'preview_imagen',
        'preview_generado_at',
        'activo',
        'veces_usado',
        'ultima_generacion',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'variables_usadas' => 'array',
        'variables_obligatorias' => 'array',
        'configuracion_adicional' => 'array',
        'preview_generado_at' => 'datetime',
        'ultima_generacion' => 'datetime',
        'activo' => 'boolean',
        'veces_usado' => 'integer',
        'margen_superior' => 'integer',
        'margen_inferior' => 'integer',
        'margen_izquierdo' => 'integer',
        'margen_derecho' => 'integer',
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
     * Relación con tipos de solicitud que usan esta plantilla
     */
    public function tiposSolicitud()
    {
        return $this->belongsToMany(TipoSolicitud::class, 'tipo_solicitud_plantilla', 'plantilla_documento_id', 'tipo_solicitud_id')
            ->withPivot(['generar_automatico', 'momento_generacion', 'es_principal', 'orden'])
            ->withTimestamps();
    }

    /**
     * Scope para plantillas activas
     */
    public function scopeActivas($query)
    {
        return $query->where('activo', true);
    }

    /**
     * Scope por tipo de documento
     */
    public function scopeTipo($query, $tipo)
    {
        return $query->where('tipo_documento', $tipo);
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
     * Extraer variables del contenido HTML
     */
    public function extraerVariables()
    {
        $contenido = $this->contenido_html . ' ' . $this->encabezado_html . ' ' . $this->pie_pagina_html;

        // Buscar todas las variables con patrón {{variable}}
        preg_match_all('/\{\{([^}]+)\}\}/', $contenido, $matches);

        if (!empty($matches[1])) {
            $variables = array_unique($matches[1]);
            $variables = array_map('trim', $variables);
            return array_values($variables);
        }

        return [];
    }

    /**
     * Actualizar variables usadas automáticamente
     */
    public function actualizarVariables()
    {
        $this->variables_usadas = $this->extraerVariables();
        $this->save();
    }

    /**
     * Obtener datos de ejemplo para preview
     */
    public static function getDatosEjemplo()
    {
        return [
            // Solicitante
            'solicitante' => [
                'nombre_completo' => 'Juan Carlos Pérez García',
                'tipo_documento' => 'Cédula de Ciudadanía',
                'numero_documento' => '1234567890',
                'email' => 'juan.perez@example.com',
                'telefono' => '300 123 4567',
                'direccion' => 'Calle 16 # 5-20',
            ],

            // Solicitud
            'solicitud' => [
                'radicado' => 'CERT-NOM-001-2025-00001',
                'fecha_radicacion' => '22 de noviembre de 2025',
                'estado' => 'Aprobada',
                'prioridad' => 'Normal',
            ],

            // Sistema
            'sistema' => [
                'entidad' => 'ALCALDÍA DE VALLEDUPAR',
                'dependencia' => 'Oficina de Planeación Municipal',
                'ciudad' => 'Valledupar',
                'departamento' => 'Cesar',
                'logo' => '/images/escudo-alcaldia.png',
                'fecha_actual' => date('d/m/Y'),
                'fecha_actual_letras' => 'veintidós (22) días del mes de noviembre del año dos mil veinticinco (2025)',
                'hora_actual' => date('H:i:s'),
            ],

            // Campos personalizados (ejemplos)
            'campo' => [
                'direccion_predio' => 'Calle 16 # 5-20',
                'barrio' => 'Centro',
                'barrio_sector' => 'Centro',
                'estrato' => '3',
                'uso_predio' => 'Residencial',
                'area_m2' => '120',
                'area_metros' => '120',
                'observaciones' => 'Predio en buen estado de conservación',
            ],

            // Funcionario asignado
            'funcionario' => [
                'nombre_completo' => 'José Olivella Martínez',
                'cargo' => 'Profesional Especializado',
                'area' => 'Ordenamiento Territorial',
            ],
        ];
    }

    /**
     * Reemplazar variables en el HTML con datos
     */
    public function reemplazarVariables($html, $datos = null)
    {
        if ($datos === null) {
            $datos = static::getDatosEjemplo();
        }

        // Función recursiva para aplanar el array con notación de punto
        $flatten = function($array, $prefix = '') use (&$flatten) {
            $result = [];
            foreach ($array as $key => $value) {
                $newKey = $prefix ? "{$prefix}.{$key}" : $key;
                if (is_array($value)) {
                    $result = array_merge($result, $flatten($value, $newKey));
                } else {
                    $result[$newKey] = $value;
                }
            }
            return $result;
        };

        $datosPlanos = $flatten($datos);

        // Reemplazar variables
        foreach ($datosPlanos as $key => $value) {
            $html = str_replace("{{{$key}}}", $value, $html);
        }

        return $html;
    }

    /**
     * Incrementar contador de uso
     */
    public function incrementarUso()
    {
        $this->increment('veces_usado');
        $this->ultima_generacion = now();
        $this->save();
    }

    /**
     * Obtener estadísticas de uso
     */
    public function getEstadisticas()
    {
        return [
            'veces_usado' => $this->veces_usado,
            'ultima_generacion' => $this->ultima_generacion,
            'tipos_asociados' => $this->tiposSolicitud()->count(),
        ];
    }
}
