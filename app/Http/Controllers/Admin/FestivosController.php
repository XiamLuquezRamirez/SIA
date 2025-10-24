<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Festivos;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Carbon\CarbonImmutable;

class FestivosController extends Controller
{
    public function index(Request $request)
    {
        if ($request->ajax()) {
            $query = Festivos::orderBy('fecha', 'asc');

            // Búsqueda
            if ($request->has('search') && $request->search) {
                if ($request->filled('search')) {
                    $search = $request->search;
                    $query->where(function($q) use ($search) {
                        $q->where('nombre', 'ILIKE', "%{$search}%")
                          ->orWhere('dia_semana', 'ILIKE', "%{$search}%")
                          ->orWhere('descripcion', 'ILIKE', "%{$search}%");
                    });
                }
            }

            // Filtro por año
            if ($request->has('year') && $request->year) {
                $query->where('fecha', 'LIKE', "%{$request->year}%");
            }


            // Filtro por tipo
            if ($request->has('tipo') && $request->tipo) {
                $query->where('tipo', $request->tipo);
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
            $festivos = $query->paginate($perPage);
            return response()->json($festivos);
        }

        return view('admin.festivos.index');
    }

    public function guardarFestivo(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'descripcion' => 'required|string|max:500',
            'fecha' => 'required|date',
            'tipo' => 'required|string|max:255',
            'aplica_sla' => 'required|boolean',
        ], [
            'nombre.required' => 'El nombre es obligatorio',
            'nombre.max' => 'El nombre debe tener menos de 255 caracteres',
            'descripcion.required' => 'La descripción es obligatoria',
            'descripcion.max' => 'La descripción debe tener menos de 500 caracteres',
            'fecha.required' => 'La fecha es obligatoria',
            'fecha.date' => 'La fecha debe ser una fecha válida',
            'tipo.required' => 'El tipo es obligatorio',
            'tipo.max' => 'El tipo debe tener menos de 255 caracteres',
            'aplica_sla.required' => 'El aplican a SLA es obligatorio',
            'aplica_sla.boolean' => 'El aplican a SLA debe ser un booleano',
        ]);

        // Verificar si ya hay un festivo registrado para esta fecha
        $festivo = Festivos::where('fecha', $validated['fecha'])->first();
        if ($festivo) {
            // Eliminar el festivo existente
            $festivo->delete();
        }

        $slug = Str::slug($validated['nombre']);
        $dia_semana = Carbon::parse($validated['fecha'])->locale('es')->dayName;

        $festivo = Festivos::create([
            'nombre' => $validated['nombre'],
            'descripcion' => $validated['descripcion'],
            'fecha' => $validated['fecha'],
            'tipo' => $validated['tipo'],
            'aplica_sla' => $validated['aplica_sla'],
            'dia_semana' => $dia_semana,
            'slug' => $slug,
        ]);

        if ($festivo) {
            return response()->json([
                'message' => 'Festivo creado exitosamente',
                'type' => 'success'
            ], 201);
        } else {
            return response()->json([
                'message' => 'Error al crear festivo',
                'type' => 'error'
            ], 500);
        }
    }

    public function consultarDisponibilidadFestivo($fecha)
    {
        $festivo = Festivos::where('fecha', $fecha)->first();

        if ($festivo) {
            return response()->json([
                'disponible' => false,
                'festivo' => $festivo
            ], 200);
        } else {
            return response()->json([
                'disponible' => true,
                'festivo' => null
            ], 200);
        }
    }

    public function consultarFestivo($id_festivo)
    {
        $festivo = Festivos::find($id_festivo);
        return response()->json([
            'festivo' => $festivo
        ], 200);
    }

    public function editarFestivo(Request $request, $id_festivo)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'descripcion' => 'required|string|max:500',
            'fecha' => 'required|date',
            'tipo' => 'required|string|max:255',
            'aplica_sla' => 'required|boolean',
        ], [
            'nombre.required' => 'El nombre es obligatorio',
            'nombre.max' => 'El nombre debe tener menos de 255 caracteres',
            'descripcion.required' => 'La descripción es obligatoria',
            'descripcion.max' => 'La descripción debe tener menos de 500 caracteres',
            'fecha.required' => 'La fecha es obligatoria',
            'fecha.date' => 'La fecha debe ser una fecha válida',
            'tipo.required' => 'El tipo es obligatorio',
            'tipo.max' => 'El tipo debe tener menos de 255 caracteres',
            'aplica_sla.required' => 'El aplican a SLA es obligatorio',
            'aplica_sla.boolean' => 'El aplican a SLA debe ser un booleano',
        ]);

        $festivo = Festivos::find($id_festivo);


        $slug = Str::slug($validated['nombre']);
        $dia_semana = Carbon::parse($validated['fecha'])->locale('es')->dayName;

        $festivo->nombre = $validated['nombre'];
        $festivo->descripcion = $validated['descripcion'];
        $festivo->fecha = $validated['fecha'];
        $festivo->tipo = $validated['tipo'];
        $festivo->aplica_sla = $validated['aplica_sla'];
        $festivo->dia_semana = $dia_semana;
        $festivo->slug = $slug;
        $festivo->save();

       
        return response()->json([
            'message' => 'Festivo actualizado exitosamente',
            'type' => 'success'
        ], 201);
       
    }

    public function alternarAplicacionSLAFestivo(Request $request, $id_festivo)
    {
        $festivo = Festivos::find($id_festivo);
        $festivo->aplica_sla = $request->aplica_sla == '1' ? true : false;
        $festivo->save();
        
        if ($festivo->aplica_sla) {
            return response()->json([
                'message' => 'Aplicación de SLA para el festivo activada exitosamente',
                'type' => 'success'
            ], 201);
        } else {
            return response()->json([
                'message' => 'Aplicación de SLA para el festivo desactivada exitosamente',
                'type' => 'success'
            ], 201);
        }
    }
}
