<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ConfiguracionRadicados extends Model
{
    use HasFactory;

    protected $table = 'configuracion_radicados_tipos';

    protected $fillable = [
        'tipo_solicitud_id',
        'codigo',
        'incluir_anio',
        'formato_anio',
        'incluir_mes',
        'formato_mes',
        'longitud_consecutivo',
        'separador',
        'reinicia_por',
        'numero_inicial',
        'consecutivo',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'incluir_anio' => 'boolean',
        'incluir_mes' => 'boolean',
        'longitud_consecutivo' => 'integer',
        'numero_inicial' => 'integer',
        'consecutivo' => 'integer',
        'created_by' => 'integer',
        'updated_by' => 'integer',
    ];
}
