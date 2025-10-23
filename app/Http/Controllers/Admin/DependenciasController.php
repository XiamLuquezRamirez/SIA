<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Dependencia;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Storage;
use App\Models\Equipo;
class DependenciasController extends Controller
{
    public function index(Request $request)
    {
        if ($request->ajax()) {
            $query = Dependencia::with(['coordinador', 'equipos', 'funcionarios'])->orderBy('id', 'desc');

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

    public function getUsuarios()
    {
        $usuarios = User::with('roles')
        ->where('tipo_usuario', 'interno')
        ->where('activo', true)
        ->orderBy('nombre', 'asc')
        ->get();

        return response()->json([
            'usuarios' => $usuarios
        ]);
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
            'message' => 'Área creada exitosamente',
            'dependencia' => $dependencia
        ], 201);
    }

    public function show(string $id){
        $dependencia = Dependencia::with(['coordinador', 'equipos', 'funcionarios'])->findOrFail($id);


        return response()->json([
            'dependencia' => $dependencia
        ]);
    }

    public function update(Request $request, string $id)
    {
        $dependencia = Dependencia::findOrFail($id);

        // Guardar datos originales para auditoría
        $datosOriginales = [
            'nombre' => $dependencia->nombre,
            'descripcion' => $dependencia->descripcion,
            'coordinador_id' => $dependencia->coordinador_id,
            'activo' => $dependencia->activo,
        ];

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

        $validated['coordinador_id'] = (int) $request->coordinador_id;
        $validated['activo'] = $request->activo == '1' ? true : false;


       $dependencia->update($validated);

        // Registrar cambios en log para auditoría
        $cambios = [];
        if ($datosOriginales['nombre'] !== $dependencia->nombre) {
            $cambios['nombre'] = ['anterior' => $datosOriginales['nombre'], 'nuevo' => $dependencia->nombre];
        }
        if ($datosOriginales['descripcion'] !== $dependencia->descripcion) {
            $cambios['descripcion'] = ['anterior' => $datosOriginales['descripcion'], 'nuevo' => $dependencia->descripcion];
        }
        if ($datosOriginales['coordinador_id'] !== $dependencia->coordinador_id) {
            $cambios['coordinador'] = ['anterior' => $datosOriginales['coordinador_id'], 'nuevo' => $dependencia->coordinador_id];
        }
        if ($datosOriginales['activo'] !== $dependencia->activo) {
            $cambios['activo'] = ['anterior' => $datosOriginales['activo'], 'nuevo' => $dependencia->activo];
        }


        if (!empty($cambios)) {
            \Log::info('Área actualizada exitosamente, cambios realizados: ', [
                'dependencia_id' => $dependencia->id,
                'usuario_que_actualiza' => auth()->id(),
                'cambios' => $cambios,
            ]);
        }

        return response()->json([
            'message' => 'Área actualizada exitosamente',
            'dependencia' => $dependencia->load(['coordinador']),
            'cambios_realizados' => $cambios,
        ]);
    }

    public function alternarEstadoDependencia(Request $request, string $id)
    {
        $id = (int) $id;
        $dependencia = Dependencia::findOrFail($id);
        $datosOriginales = [
            'activo' => $dependencia->activo,
        ];

        $dependencia->activo = $request->activo == '1' ? true : false;
        $dependencia->save();

        // Notificar al coordinador
        if ($request->notificar == '1') {}

        // Desactivar los equipos de la dependencia
        $equipos_desactivados = [];
        if ($request->desactivar_equipos == '1') {
            $equipos = $dependencia->equipos;
            foreach ($equipos as $equipo) {
                $equipo->activo = false;
                $equipo->save();
                $equipos_desactivados[] = "$equipo->id - $equipo->nombre";
            }
        }

        // Registrar cambios en log para auditoría

        \Log::info('Área actualizada exitosamente, cambios realizados: ', [
            'dependencia_id' => $dependencia->id,
            'usuario_que_actualiza' => auth()->id(),
            'cambios' => [
                'activo' => ['anterior' => $datosOriginales['activo'], 'nuevo' => $dependencia->activo],
            ],
            'equipos_desactivados' => $equipos_desactivados,
        ]);

        return response()->json([
            'message' => 'Estado del área cambiado exitosamente',
        ]);
    }

    public function eliminarDependencia(Request $request, string $id)
    {
        $dependencia = Dependencia::findOrFail($id);

        if ($dependencia) {
            $dependencia->delete();

            \Log::info('Área eliminada exitosamente: ', [
                'dependencia_id' => $dependencia->id,
                'usuario_que_elimina' => auth()->id(),
            ]);

            return response()->json([
                'message' => 'Área eliminada exitosamente',
                'icon' => 'success',
            ]);
        } else {
            return response()->json([
                'message' => 'Área no encontrada',
                'icon' => 'error',
            ]);
        }
    }

    public function getDependenciasSelect()
    {
        $dependencias = Dependencia::select('id', 'nombre')->where('activo', true)->orderBy('nombre', 'asc')->get();
        return response()->json($dependencias);
    }

    public function organigrama()
    {
        return view('admin.dependencias.organigrama');
    }

    public function getOrganigramaData()
    {
        $areas = Dependencia::with('coordinador')->get();

        $data[] = [
            'id' => "ceo",
            'name' => "CEO",
            'tags' => ['ceo'],
            'title' => "Oficina Central",
        ];

        foreach ($areas as $area) {
            $data[] = [
                'id' => 'area_'.$area->id,
                'pid' => "ceo",
                'name' => "ÁREA",
                'tags' => ['area'],
                'title' => $area->nombre,
            ];

            //agregar coordinador de cada area
            $id_coordinador = null;
            if ($area->coordinador) {
                $id_coordinador = 'coordinador_'.$area->coordinador->id;
                $data[] = [
                    'id' => $id_coordinador,
                    'pid' => 'area_'.$area->id,
                    'name' => explode(" ", $area->coordinador->nombre)[0]." ".explode(" ", $area->coordinador->apellidos)[0],
                    'title' => "Coordinador del Área",
                    'tags' => ['coordinador'],
                    'img' => $area->coordinador->foto_url ? Storage::url($area->coordinador->foto_url) : Storage::url('default.png'),
                    'tareas_activas_completadas' => [2,4],
                ];
            }else{
                $id_coordinador = "sin_coordinador_".$area->id;
                $data[] = [
                    'id' => $id_coordinador,
                    'pid' => 'area_'.$area->id,
                    'name' => "Sin Asignar",
                    'title' => "Coordinador del Área",
                    'tags' => ['coordinador'],
                    'img' => Storage::url('default.png'),
                ];
            }

            $equipos_area = Equipo::with('lider')->where('area_id', $area->id)->get();
            foreach ($equipos_area as $equipo) {
                $data[] = [
                    'id' => 'equipo_'.$equipo->id,
                    'pid' => $id_coordinador,
                    'name' => "EQUIPO",
                    'title' => $equipo->nombre,
                    'tags' => ['equipo'],
                ];

                //agregar lider de cada equipo
                $id_lider = null;
                if ($equipo->lider) {
                    $id_lider = 'lider_'.$equipo->lider->id;
                    $data[] = [
                        'id' => $id_lider,
                        'pid' => 'equipo_'.$equipo->id,
                        'name' => explode(" ", $equipo->lider->nombre)[0]." ".explode(" ", $equipo->lider->apellidos)[0],
                        'title' => "Lider del Equipo",
                        'tags' => ['lider'],
                        'img' => $equipo->lider->foto_url ? Storage::url($equipo->lider->foto_url) : Storage::url('default.png'),
                        'tareas_activas_completadas' => [2,4],
                    ];
                }else{
                    $id_lider = "sin_lider_".$equipo->id;
                    $data[] = [
                        'id' => $id_lider,
                        'pid' => 'equipo_'.$equipo->id,
                        'name' => "Sin Asignar",
                        'title' => "Lider del Equipo",
                        'tags' => ['lider'],
                        'img' => Storage::url('default.png'),
                    ];
                }

                //agregar funcionarios de cada equipo
                $funcionarios_equipo = User::where('equipo_id', $equipo->id)->get();
                foreach ($funcionarios_equipo as $funcionario) {
                    $data[] = [
                        'id' => 'funcionario_'.$funcionario->id,
                        'pid' => $id_lider,
                        'name' => explode(" ", $funcionario->nombre)[0]." ".explode(" ", $funcionario->apellidos)[0],
                        'title' => $funcionario->cargo,
                        'img' => $funcionario->foto_url ? Storage::url($funcionario->foto_url) : Storage::url('default.png'),
                        'tags' => ['funcionario'],
                        'tareas_activas_completadas' => [2,4],
                    ];

                    $id_lider = 'funcionario_'.$funcionario->id;
                }
            }
        }

        return response()->json($data);
    }
}
