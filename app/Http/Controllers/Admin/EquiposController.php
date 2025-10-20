<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Equipo;
use Illuminate\Http\Request;
use App\Models\User;
use Spatie\Permission\Models\Role;

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
        $usuarios = User::with('equipo')
        ->where('area_id', $request->area_id)
        ->where('activo', true)
        ->where('tipo_usuario', 'interno')
        ->get();

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
            'lider_id' => 'nullable|exists:users,id',
            'funciones' => 'required|string',
        ], [
            'nombre.required' => 'El nombre es obligatorio',
            'nombre.max' => 'El nombre debe tener menos de 255 caracteres',
            'area_id.required' => 'El área es obligatoria',
            'area_id.exists' => 'El área no existe',
            'lider_id.nullable' => 'El líder es opcional',
            'lider_id.exists' => 'El líder no existe',
            'funciones.required' => 'Las funciones son obligatorias',
        ]);

        //buscra si la id del lider mandada ya esta asociada a otro equipo
        if ($request->lider_id) {
            //buscra si la id del lider mandada ya esta asociada a otro equipo
            $equipo_asociado = Equipo::where('lider_id', $request->lider_id)->first();
            // si existe quitarla 
            if ($equipo_asociado) {
                $equipo_asociado->lider_id = null;
                $equipo_asociado->save();
            }
        }

        //crear el equipo
        $equipo = Equipo::create([
            'nombre' => $request->nombre,
            'area_id' => $request->area_id,
            'lider_id' => $request->lider_id ? $request->lider_id : null,
            'funciones' => $request->funciones,
            'activo' => $request->activo,
        ]);

        //si se asigna un lider, actualizar el area y el equipo al lider
        if ($request->lider_id) {
            //actualizar el area y el equipo al lider
            $usuario = User::find($request->lider_id);
            $usuario->area_id = $request->area_id;
            $usuario->equipo_id = $equipo->id;
            $usuario->save();

            //verificar si tenia rol de lider de equipo, si lo tiene, quitarlo
            $this->quitarPermisosLiderEquipo($request->lider_id);
            
            //asignar el rol al lider con soloel rol mandado
            $usuario->assignRole($request->rol_id);
        }


        //registrar cambios en log para auditoría
        \Log::info('Equipo creado exitosamente: ', [
            'equipo_id' => $equipo->id,
            'equipo_nombre' => $equipo->nombre,
            'usuario_que_crea' => auth()->id(),
            'fecha_creacion' => now()
        ]);

        return response()->json([
            'message' => 'Equipo creado exitosamente',
            'type' => 'success',
            'equipo' => $equipo
        ], 201);
    }

    function quitarPermisosLiderEquipo($id_usuario)
    {
        $slug = 'lider-de-equipo';
        $roles_lider_equipo = Role::where('slug', 'like', '%' . $slug . '%')->get();

        $usuario = User::with('roles')->where('id', $id_usuario)->first();
        
        foreach ($usuario->roles as $role) {
           foreach ($roles_lider_equipo as $role_lider_equipo) {
            if ($role->id == $role_lider_equipo->id) {
                $usuario->removeRole($role->name);   
            }
           }
        }
        return 1;
    }

    public function verificarMiembroEquipo(Request $request)
    {

        $lider = Equipo::with('lider')->where('lider_id', $request->id_usuario)->first();
        if ($lider) {
            return response()->json(['tipo' => 'lider', 'mensaje' => '<p>El usuario es <strong style="color:rgb(214, 100, 48);">lider</strong> de otro equipo, al continuar se movera el usuario al equipo que esta creando.</p>']);
        }

        $usuario = User::find($request->id_usuario);
        if ($usuario->equipo_id) {  
            return response()->json(['tipo' => 'miembro', 'mensaje' => '<p>El usuario es <strong style="color:rgb(214, 100, 48);">miembro</strong> de otro equipo, al continuar se movera el usuario al equipo que esta creando.</p>']);
        }

        return response()->json(['tipo' => 'ninguno']);
    }


    public function getRolesLiderEquipo(Request $request)
    {
        $slug = 'lider-de-equipo';
        $roles = Role::where('slug', 'like', '%' . $slug . '%')->get();
        return response()->json(['roles' => $roles]);
    }

    public function getDatosEquipo($id)
    {
        //buscar roles relacionados con lider de equipo
        $slug = 'lider-de-equipo';
        $roles_lider_equipo = Role::where('slug', 'like', '%' . $slug . '%')->get();

        //buscar equipo
        $equipo = Equipo::with('lider','area')->find($id);

        if ($equipo->lider_id) {
            //buscar rol del lider
            $lider = User::with('roles')->find($equipo->lider_id);
            //filtrar roles del lider por los roles relacionados con lider de equipo
            $roles_lider = null;
            $roles_lider = $lider->roles->first(fn($role) => $roles_lider_equipo->pluck('id')->contains($role->id));


            $equipo->setRelation('lider', $lider);
            $equipo->rol_lider = $roles_lider;
        }
        else {
            $equipo->rol_lider = null;
        }

        return response()->json(['equipo' => $equipo]);
    }
}
