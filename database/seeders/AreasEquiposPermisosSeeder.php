<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class AreasEquiposPermisosSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Permisos para el módulo de Áreas y Equipos
        $permisos = [
            // ========================================
            // GESTIÓN DE ÁREAS
            // ========================================
            [
                'name' => 'areas.ver',
                'description' => 'Ver lista de áreas',
                'guard_name' => 'web'
            ],
            [
                'name' => 'areas.crear',
                'description' => 'Crear nuevas áreas',
                'guard_name' => 'web'
            ],
            [
                'name' => 'areas.editar',
                'description' => 'Editar áreas existentes',
                'guard_name' => 'web'
            ],
            [
                'name' => 'areas.eliminar',
                'description' => 'Eliminar áreas',
                'guard_name' => 'web'
            ],
            [
                'name' => 'areas.activar',
                'description' => 'Activar/desactivar áreas',
                'guard_name' => 'web'
            ],
            [
                'name' => 'areas.asignar_coordinador',
                'description' => 'Asignar coordinador a áreas',
                'guard_name' => 'web'
            ],
            [
                'name' => 'areas.ver_detalle',
                'description' => 'Ver detalles completos de un área',
                'guard_name' => 'web'
            ],
            [
                'name' => 'areas.ver_organigrama',
                'description' => 'Ver organigrama de áreas',
                'guard_name' => 'web'
            ],

            // ========================================
            // GESTIÓN DE EQUIPOS
            // ========================================
            [
                'name' => 'equipos.ver',
                'description' => 'Ver lista de equipos',
                'guard_name' => 'web'
            ],
            [
                'name' => 'equipos.crear',
                'description' => 'Crear nuevos equipos',
                'guard_name' => 'web'
            ],
            [
                'name' => 'equipos.editar',
                'description' => 'Editar equipos existentes',
                'guard_name' => 'web'
            ],
            [
                'name' => 'equipos.eliminar',
                'description' => 'Eliminar equipos',
                'guard_name' => 'web'
            ],
            [
                'name' => 'equipos.activar',
                'description' => 'Activar/desactivar equipos',
                'guard_name' => 'web'
            ],
            [
                'name' => 'equipos.asignar_lider',
                'description' => 'Asignar líder a equipos',
                'guard_name' => 'web'
            ],
            [
                'name' => 'equipos.gestionar_miembros',
                'description' => 'Agregar o eliminar miembros de equipos',
                'guard_name' => 'web'
            ],
            [
                'name' => 'equipos.ver_detalle',
                'description' => 'Ver detalles completos de un equipo',
                'guard_name' => 'web'
            ],

            // ========================================
            // GESTIÓN DE DEPENDENCIAS (Alias para Áreas)
            // ========================================
            [
                'name' => 'dependencias.ver',
                'description' => 'Ver lista de dependencias',
                'guard_name' => 'web'
            ],
            [
                'name' => 'dependencias.crear',
                'description' => 'Crear nuevas dependencias',
                'guard_name' => 'web'
            ],
            [
                'name' => 'dependencias.editar',
                'description' => 'Editar dependencias existentes',
                'guard_name' => 'web'
            ],
            [
                'name' => 'dependencias.eliminar',
                'description' => 'Eliminar dependencias',
                'guard_name' => 'web'
            ],
        ];

        $this->command->info('Creando permisos de Áreas y Equipos...');

        foreach ($permisos as $permiso) {
            Permission::firstOrCreate(
                ['name' => $permiso['name']],
                $permiso
            );
            $this->command->info("✓ Permiso '{$permiso['name']}' creado/verificado");
        }

        // ========================================
        // ASIGNACIÓN DE PERMISOS A ROLES
        // ========================================

        // Super Administrador - Todos los permisos
        $superAdmin = Role::where('name', 'Super Administrador')->first();
        if ($superAdmin) {
            $todosLosPermisos = Permission::whereIn('name', array_column($permisos, 'name'))->get();
            $superAdmin->syncPermissions($superAdmin->permissions->merge($todosLosPermisos)->unique('id'));
            $this->command->info("✓ Permisos asignados al Super Administrador");
        }

        // Director OAPM - Todos los permisos
        $director = Role::where('name', 'Director OAPM')->first();
        if ($director) {
            $permisosDirector = Permission::whereIn('name', [
                'areas.ver',
                'areas.crear',
                'areas.editar',
                'areas.eliminar',
                'areas.activar',
                'areas.asignar_coordinador',
                'areas.ver_detalle',
                'areas.ver_organigrama',
                'equipos.ver',
                'equipos.crear',
                'equipos.editar',
                'equipos.eliminar',
                'equipos.activar',
                'equipos.asignar_lider',
                'equipos.gestionar_miembros',
                'equipos.ver_detalle',
                'dependencias.ver',
                'dependencias.crear',
                'dependencias.editar',
                'dependencias.eliminar',
            ])->get();
            $director->givePermissionTo($permisosDirector);
            $this->command->info("✓ Permisos asignados al Director OAPM");
        }

        // Coordinador de Área - Permisos de lectura y gestión de equipos en su área
        $coordinador = Role::where('name', 'Coordinador de Área')->first();
        if ($coordinador) {
            $permisosCoordinador = Permission::whereIn('name', [
                'areas.ver',
                'areas.ver_detalle',
                'areas.ver_organigrama',
                'equipos.ver',
                'equipos.crear',
                'equipos.editar',
                'equipos.activar',
                'equipos.asignar_lider',
                'equipos.gestionar_miembros',
                'equipos.ver_detalle',
                'dependencias.ver',
            ])->get();
            $coordinador->givePermissionTo($permisosCoordinador);
            $this->command->info("✓ Permisos asignados al Coordinador de Área");
        }

        // Líder de Equipo - Permisos de lectura y gestión de miembros de su equipo
        $lider = Role::where('name', 'Líder de Equipo')->first();
        if ($lider) {
            $permisosLider = Permission::whereIn('name', [
                'areas.ver',
                'areas.ver_detalle',
                'equipos.ver',
                'equipos.ver_detalle',
                'equipos.gestionar_miembros',
                'dependencias.ver',
            ])->get();
            $lider->givePermissionTo($permisosLider);
            $this->command->info("✓ Permisos asignados al Líder de Equipo");
        }

        // Funcionario - Solo permisos de lectura
        $funcionario = Role::where('name', 'Funcionario')->first();
        if ($funcionario) {
            $permisosFuncionario = Permission::whereIn('name', [
                'areas.ver',
                'equipos.ver',
                'dependencias.ver',
            ])->get();
            $funcionario->givePermissionTo($permisosFuncionario);
            $this->command->info("✓ Permisos asignados al Funcionario");
        }

        $this->command->info('✅ Seeder de permisos de Áreas y Equipos completado exitosamente');
    }
}
