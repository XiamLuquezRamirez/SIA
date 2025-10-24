<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Festivos extends Model
{
    use HasFactory;

    protected $fillable = [
        'fecha',
        'nombre',
        'descripcion',
        'tipo',
        'aplica_sla',
        'slug',
        'dia_semana',
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];

    protected $appends = ['fecha_formateada'];

    public function getFechaFormateadaAttribute()
    {
        return Carbon::parse($this->fecha)->format('d/m/Y');
    }
}
