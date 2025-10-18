<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Dependencia extends Model
{
    use HasFactory;

    protected $table = 'areas';

    protected $fillable = [
        'nombre',
        'descripcion',
        'coordinador_id'     
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
        return $this->hasMany(Equipo::class, 'area_id');
    }

    public function funcionarios()
    {
        return $this->hasMany(User::class, 'area_id');
    }
}
