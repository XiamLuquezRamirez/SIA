<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Equipo;
use Illuminate\Http\Request;
use App\Models\User;

class EquiposController extends Controller
{
    public function index(Request $request)
    {
        if ($request->ajax()) {
            $query = Equipo::with(['area', 'lider', 'miembros'])->orderBy('id', 'desc');

            // Búsqueda
            if ($request->has('search') && $request->search) {
                if ($request->filled('search')) {
                    $search = $request->search;
                    $query->where(function($q) use ($search) {
                        $q->where('nombre', 'ILIKE', "%{$search}%")
                          ->orWhereHas('lider', function($q2) use ($search) {
                              $q2->where('nombre', 'ILIKE', "%{$search}%");
                          });
                    });
                }
            }

            // Filtro por estado
            if ($request->has('estado') && $request->estado) {
                if ($request->estado === '0') {
                    $query->where(function($q) {
                        $q->where('activo', true)
                        ->orWhere('activo', false);
                    });

                } else if ($request->estado === '1') {
                    $query->where('activo', true);
                } else if ($request->estado === '2') {
                    $query->where('activo', false);
                }
            }

            // Filtro por dependencia
            if ($request->has('dependencia_id') && $request->dependencia_id) {
                $query->where('area_id', $request->dependencia_id);
            }

            // Paginación
            $perPage = $request->get('per_page', 15);
            $equipos = $query->paginate($perPage);
            return response()->json($equipos);
        }

        return view('admin.equipos.index');
    }

    public function getUsuariosAreaSelect(Request $request)
    {
        $usuarios = User::where('area_id', $request->area_id)->where('equipo_id', null)->get();
        return response()->json(['usuarios' => $usuarios, 'total' => $usuarios->count()]);
}

    public function getEquiposAreaSelect(Request $request)
    {
        $equipos = Equipo::where('area_id', $request->area_id)->get();
        return response()->json(['equipos' => $equipos, 'total' => $equipos->count()]);
    }

    public function guardarEquipo(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'area_id' => 'required|exists:areas,id',
            'lider_id' => 'required|exists:users,id',
            'funciones' => 'required|string',
        ], [
            'nombre.required' => 'El nombre es obligatorio',
            'nombre.max' => 'El nombre debe tener menos de 255 caracteres',
            'area_id.required' => 'El área es obligatoria',
            'area_id.exists' => 'El área no existe',
            'lider_id.required' => 'El líder es obligatorio',
            'lider_id.exists' => 'El líder no existe',
            'funciones.required' => 'Las funciones son obligatorias',
        ]);

        $equipo = Equipo::create([
            'nombre' => $request->nombre,
            'area_id' => $request->area_id,
            'lider_id' => $request->lider_id,
            'funciones' => $request->funciones,
            'activo' => $request->activo,
        ]);

        return response()->json([
            'message' => 'Equipo creado exitosamente',
            'type' => 'success',
            'equipo' => $equipo
        ], 201);
    }
}
