<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\Area;

class RoleController extends Controller
{
    /**
     * Listar todos los roles del sistema con permisos y usuarios
     */
    public function index(Request $request)
    {
        try {
            $roles = Role::with(['permissions', 'users'])
                ->withCount('users')
                ->get()
                ->map(function ($role) {
                    return [
                        'id' => $role->id,
                        'name' => $role->name,
                        'description' => $role->description,
                        'area_id' => $role->area_id,
                        'activo' => $role->activo ?? true,
                        'guard_name' => $role->guard_name,
                        'users_count' => $role->users_count,
                        'permissions' => $role->permissions->map(function ($permission) {
                            return [
                                'id' => $permission->id,
                                'name' => $permission->name,
                                'display_name' => $permission->display_name,
                                'module' => $permission->module,
                            ];
                        }),
                        'created_at' => $role->created_at,
                        'updated_at' => $role->updated_at,
                    ];
                });

            return response()->json([
                'success' => true,
                'roles' => $roles
            ]);
        } catch (\Exception $e) {
            Log::error('Error al listar roles', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al cargar los roles'
            ], 500);
        }
    }

    /**
     * Obtener un rol específico con sus permisos
     */
    public function show(Role $role)
    {
        try {
            $role->load(['permissions', 'users']);

            return response()->json([
                'success' => true,
                'role' => [
                    'id' => $role->id,
                    'name' => $role->name,
                    'description' => $role->description,
                    'area_id' => $role->area_id,
                    'activo' => $role->activo ?? true,
                    'guard_name' => $role->guard_name,
                    'users_count' => $role->users->count(),
                    'permissions' => $role->permissions->map(function ($permission) {
                        return [
                            'id' => $permission->id,
                            'name' => $permission->name,
                            'display_name' => $permission->display_name,
                            'module' => $permission->module,
                        ];
                    }),
                    'created_at' => $role->created_at,
                    'updated_at' => $role->updated_at,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error al obtener rol', [
                'role_id' => $role->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al cargar el rol'
            ], 500);
        }
    }

    /**
     * Crear un nuevo rol
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:roles,name',
                'description' => 'nullable|string|max:500',
                'area_id' => 'nullable|exists:areas,id',
                'activo' => 'boolean',
            ]);

            DB::beginTransaction();

            $role = Role::create([
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'area_id' => $validated['area_id'] ?? null,
                'activo' => $validated['activo'] ?? true,
                'guard_name' => 'web',
            ]);

            DB::commit();

            Log::info('Rol creado exitosamente', [
                'role_id' => $role->id,
                'role_name' => $role->name,
                'created_by' => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Rol creado exitosamente',
                'role' => $role
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Error al crear rol', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al crear el rol'
            ], 500);
        }
    }

    /**
     * Actualizar un rol existente
     */
    public function update(Request $request, Role $role)
    {
        try {
            // Verificar si es un rol del sistema (no editable completamente)
            $rolesDelSistema = [
                'Super Administrador',
                'Director OAPM',
                'Coordinador de Área',
                'Líder de Equipo',
                'Funcionario',
                'Ciudadano'
            ];

            $esRolSistema = in_array($role->name, $rolesDelSistema);

            $validated = $request->validate([
                'name' => [
                    'sometimes',
                    'required',
                    'string',
                    'max:255',
                    Rule::unique('roles', 'name')->ignore($role->id),
                ],
                'description' => 'nullable|string|max:500',
                'area_id' => 'nullable|exists:areas,id',
                'activo' => 'boolean',
            ]);

            DB::beginTransaction();

            // Si es rol del sistema, solo permitir cambiar descripción y estado
            if ($esRolSistema) {
                $role->update([
                    'description' => $validated['description'] ?? $role->description,
                    'activo' => $validated['activo'] ?? $role->activo,
                ]);
            } else {
                $role->update([
                    'name' => $validated['name'] ?? $role->name,
                    'description' => $validated['description'] ?? $role->description,
                    'area_id' => $validated['area_id'] ?? $role->area_id,
                    'activo' => $validated['activo'] ?? $role->activo,
                ]);
            }

            DB::commit();

            Log::info('Rol actualizado exitosamente', [
                'role_id' => $role->id,
                'role_name' => $role->name,
                'updated_by' => auth()->id(),
                'changes' => $validated
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Rol actualizado exitosamente',
                'role' => $role
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Error al actualizar rol', [
                'role_id' => $role->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar el rol'
            ], 500);
        }
    }

    /**
     * Eliminar un rol
     */
    public function destroy(Role $role)
    {
        try {
            // Verificar que no sea un rol del sistema
            $rolesDelSistema = [
                'Super Administrador',
                'Director OAPM',
                'Coordinador de Área',
                'Líder de Equipo',
                'Funcionario',
                'Ciudadano'
            ];

            if (in_array($role->name, $rolesDelSistema)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede eliminar un rol del sistema'
                ], 403);
            }

            // Verificar que no tenga usuarios asignados
            if ($role->users()->count() > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede eliminar un rol que tiene usuarios asignados'
                ], 400);
            }

            DB::beginTransaction();

            $roleName = $role->name;
            $roleId = $role->id;

            $role->delete();

            DB::commit();

            Log::info('Rol eliminado exitosamente', [
                'role_id' => $roleId,
                'role_name' => $roleName,
                'deleted_by' => auth()->id()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Rol eliminado exitosamente'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Error al eliminar rol', [
                'role_id' => $role->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar el rol'
            ], 500);
        }
    }

    /**
     * Obtener todos los permisos del sistema
     */
    public function getPermisos(Request $request)
    {
        try {
            $permisos = Permission::all()->map(function ($permiso) {
                return [
                    'id' => $permiso->id,
                    'name' => $permiso->name,
                    'display_name' => $permiso->display_name ?? $permiso->name,
                    'module' => $permiso->module ?? 'General',
                    'description' => $permiso->description,
                    'guard_name' => $permiso->guard_name,
                ];
            });

            return response()->json([
                'success' => true,
                'permissions' => $permisos
            ]);
        } catch (\Exception $e) {
            Log::error('Error al listar permisos', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al cargar los permisos'
            ], 500);
        }
    }

    /**
     * Actualizar permisos de un rol
     */
    public function updatePermisos(Request $request, Role $role)
    {
        try {
            $validated = $request->validate([
                'permissions' => 'required|array',
                'permissions.*' => 'exists:permissions,id',
            ]);

            DB::beginTransaction();

            // Sincronizar permisos
            $role->syncPermissions($validated['permissions']);

            DB::commit();

            Log::info('Permisos de rol actualizados', [
                'role_id' => $role->id,
                'role_name' => $role->name,
                'permissions_count' => count($validated['permissions']),
                'updated_by' => auth()->id()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Permisos actualizados exitosamente',
                'permissions_count' => count($validated['permissions'])
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Error al actualizar permisos de rol', [
                'role_id' => $role->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar los permisos'
            ], 500);
        }
    }

    /**
     * Clonar un rol existente
     */
    public function clonar(Request $request, Role $role)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:roles,name',
                'description' => 'nullable|string|max:500',
                'area_id' => 'nullable|exists:areas,id',
                'clonar_permisos' => 'boolean',
                'activo' => 'boolean',
            ]);

            DB::beginTransaction();

            // Crear el nuevo rol
            $nuevoRol = Role::create([
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'area_id' => $validated['area_id'] ?? null,
                'activo' => $validated['activo'] ?? true,
                'guard_name' => 'web',
            ]);

            // Si se debe clonar permisos
            if ($validated['clonar_permisos'] ?? true) {
                $permisos = $role->permissions->pluck('name')->toArray();
                $nuevoRol->syncPermissions($permisos);
            }

            DB::commit();

            Log::info('Rol clonado exitosamente', [
                'original_role_id' => $role->id,
                'original_role_name' => $role->name,
                'new_role_id' => $nuevoRol->id,
                'new_role_name' => $nuevoRol->name,
                'permissions_cloned' => $validated['clonar_permisos'] ?? true,
                'created_by' => auth()->id()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Rol clonado exitosamente',
                'role' => $nuevoRol
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Error al clonar rol', [
                'role_id' => $role->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al clonar el rol'
            ], 500);
        }
    }
}
