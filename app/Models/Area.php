<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Area extends Model
{
    use HasFactory;

    protected $fillable = [
        'nombre',
        'slug',
        'descripcion',
        'coordinador_id',
        'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];

    public function coordinador()
    {
        return $this->belongsTo(User::class, 'coordinador_id');
    }

    public function equipos()
    {
        return $this->hasMany(Equipo::class);
    }

    public function usuarios()
    {
        return $this->hasMany(User::class);
    }
}
