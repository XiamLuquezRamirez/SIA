<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Dependencia;
use Illuminate\Http\Request;

class DependenciasController extends Controller
{
    public function index(Request $request)
    {
        if ($request->ajax()) {
            $query = Dependencia::with(['coordinador', 'equipos', 'funcionarios']);

            // Búsqueda
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('nombre', 'ILIKE', "%{$search}%")
                    ->orWhere('descripcion', 'ILIKE', "%{$search}%");
                });
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

            // Paginación
            $perPage = $request->get('per_page', 15);
            $dependencias = $query->paginate($perPage);
            return response()->json($dependencias);
        }

        return view('admin.dependencias.index');
    }

    public function guardarDependencia(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'descripcion' => 'required|string|max:500',
            'coordinador_id' => 'required|exists:users,id',
            'activo' => 'required|boolean',
        ], [
            'nombre.required' => 'El nombre es obligatorio',
            'nombre.max' => 'El nombre debe tener menos de 255 caracteres',
            'descripcion.required' => 'La descripción es obligatoria',
            'descripcion.max' => 'La descripción debe tener menos de 500 caracteres',
            'coordinador_id.required' => 'El coordinador es obligatorio',
            'coordinador_id.exists' => 'El coordinador no existe',
        ]);

        $dependencia = Dependencia::create([
            'nombre' => $validated['nombre'],
            'descripcion' => $validated['descripcion'],
            'coordinador_id' => $validated['coordinador_id'],
            'activo' => $validated['activo'],
        ]);

        return response()->json([
            'message' => 'Dependencia creada exitosamente',
            'dependencia' => $dependencia
        ], 201);
    }
}
