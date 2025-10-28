<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Categoria;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoriaController extends Controller
{
    public function index(Request $request)
    {
        if ($request->ajax()) {
            $query = Categoria::with('tiposSolicitud')->orderBy('id', 'desc');

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
            $categorias = $query->paginate($perPage);
            return response()->json($categorias);
        }

        return view('admin.categorias.index');
    }

    public function guardarCategoria(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'descripcion' => 'required|string|max:500',
            'icono' => 'required|string|max:255',
            'color' => 'required|string|max:255',
            'activo' => 'required|boolean',
        ], [
            'nombre.required' => 'El nombre es obligatorio',
            'nombre.max' => 'El nombre debe tener menos de 255 caracteres',
            'descripcion.required' => 'La descripción es obligatoria',
            'descripcion.max' => 'La descripción debe tener menos de 500 caracteres',
            'icono.required' => 'El icono es obligatorio',
            'icono.max' => 'El icono debe tener menos de 255 caracteres',
            'color.required' => 'El color es obligatorio',
            'color.max' => 'El color debe tener menos de 255 caracteres',
        ]);

        $slug = Str::slug($validated['nombre']);

        $categoria = Categoria::create([
            'nombre' => $validated['nombre'],
            'descripcion' => $validated['descripcion'],
            'slug' => $slug,
            'icono' => $validated['icono'],
            'color' => $validated['color'],
            'activo' => $validated['activo'],
        ]);

        if ($categoria) {
            return response()->json([
                'message' => 'Categoría creada exitosamente',
                'type' => 'success'
            ], 201);
        } else {
            return response()->json([
                'message' => 'Error al crear categoría',
                'type' => 'error'
            ], 500);
        }
    }

    public function consultarCategoria($categoria)
    {
        $categoria = Categoria::with('tiposSolicitud')->find($categoria);
        return response()->json([
            'categoria' => $categoria
        ], 200);
    }

    public function editarCategoria(Request $request, $categoria)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'descripcion' => 'required|string|max:500',
            'icono' => 'required|string|max:255',
            'color' => 'required|string|max:255',
            'activo' => 'required|boolean',
        ], [
            'nombre.required' => 'El nombre es obligatorio',
            'nombre.max' => 'El nombre debe tener menos de 255 caracteres',
            'descripcion.required' => 'La descripción es obligatoria',
            'descripcion.max' => 'La descripción debe tener menos de 500 caracteres',
            'icono.required' => 'El icono es obligatorio',
            'icono.max' => 'El icono debe tener menos de 255 caracteres',
            'color.required' => 'El color es obligatorio',
            'color.max' => 'El color debe tener menos de 255 caracteres',
        ]);

        $slug = Str::slug($validated['nombre']);

        $categoria = Categoria::find($categoria);

        $categoria->nombre = $validated['nombre'];
        $categoria->descripcion = $validated['descripcion'];
        $categoria->slug = $slug;
        $categoria->icono = $validated['icono'];
        $categoria->color = $validated['color'];
        $categoria->activo = $validated['activo'];
        $categoria->save();

        if ($categoria) {
            return response()->json([
                'message' => 'Categoría actualizada exitosamente',
                'type' => 'success'
            ], 200);
        } else {
            return response()->json([
                'message' => 'Error al actualizar categoría',
                'type' => 'error'
            ], 500);
        }
    }

    public function alternarEstadoCategoria(Request $request, $categoria)
    {
        $validated = $request->validate([
            'activo' => 'required|boolean',
        ], [
            'activo.required' => 'El estado es obligatorio',
            'activo.boolean' => 'El estado debe ser un booleano',
        ]);

        if ($validated['activo']) {
            $message = 'Categoría activada exitosamente';
        } else {
            $message = 'Categoría desactivada exitosamente';
        }

        $categoria = Categoria::find($categoria);
        $categoria->activo = $validated['activo'];
        $categoria->save();
        
        return response()->json([
            'message' => $message,
            'type' => 'success'
        ], 200);
    }


    public function eliminarCategoria(Request $request, string $id)
    {
        $categoria = Categoria::findOrFail($id);

        if ($categoria) {
            $categoria->delete();

            \Log::info('Categoría eliminada exitosamente: ', [
                'categoria_id' => $categoria->id,
                'usuario_que_elimina' => auth()->id(),
            ]);

            return response()->json([
                'message' => 'Categoría eliminada exitosamente',
                'type' => 'success',
            ]);
        } else {
            return response()->json([
                'message' => 'Categoría no encontrada',
                'type' => 'error',
            ]);
        }
    }
}