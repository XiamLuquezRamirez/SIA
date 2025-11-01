<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class EstadosPermisosSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Permisos para el módulo de Estados de Solicitud
        $permisos = [
            // Gestión de Estados
            [
                'name' => 'estados.ver',
                'description' => 'Ver lista de estados de solicitud',
                'guard_name' => 'web'
            ],
            [
                'name' => 'estados.crear',
                'description' => 'Crear nuevos estados de solicitud',
                'guard_name' => 'web'
            ],
            [
                'name' => 'estados.editar',
                'description' => 'Editar estados de solicitud existentes',
                'guard_name' => 'web'
            ],
            [
                'name' => 'estados.eliminar',
                'description' => 'Eliminar estados de solicitud',
                'guard_name' => 'web'
            ],
            [
                'name' => 'estados.activar',
                'description' => 'Activar/desactivar estados de solicitud',
                'guard_name' => 'web'
            ],
            [
                'name' => 'estados.duplicar',
                'description' => 'Duplicar estados de solicitud',
                'guard_name' => 'web'
            ],
            [
                'name' => 'estados.ver_diagrama',
                'description' => 'Ver diagrama de flujo de estados',
                'guard_name' => 'web'
            ],

            // Gestión de Tipos de Solicitud
            [
                'name' => 'tipos_solicitud.ver',
                'description' => 'Ver tipos de solicitud',
                'guard_name' => 'web'
            ],
            [
                'name' => 'tipos_solicitud.crear',
                'description' => 'Crear tipos de solicitud',
                'guard_name' => 'web'
            ],
            [
                'name' => 'tipos_solicitud.editar',
                'description' => 'Editar tipos de solicitud',
                'guard_name' => 'web'
            ],
            [
                'name' => 'tipos_solicitud.eliminar',
                'description' => 'Eliminar tipos de solicitud',
                'guard_name' => 'web'
            ],
            [
                'name' => 'tipos_solicitud.activar',
                'description' => 'Activar/desactivar tipos de solicitud',
                'guard_name' => 'web'
            ],
            [
                'name' => 'tipos_solicitud.clonar',
                'description' => 'Clonar tipos de solicitud',
                'guard_name' => 'web'
            ],
            [
                'name' => 'tipos_solicitud.configurar_formulario',
                'description' => 'Configurar formulario de tipos de solicitud',
                'guard_name' => 'web'
            ],

            // Gestión de Plantillas de Documentos
            [
                'name' => 'plantillas.ver',
                'description' => 'Ver plantillas de documentos',
                'guard_name' => 'web'
            ],
            [
                'name' => 'plantillas.crear',
                'description' => 'Crear plantillas de documentos',
                'guard_name' => 'web'
            ],
            [
                'name' => 'plantillas.editar',
                'description' => 'Editar plantillas de documentos',
                'guard_name' => 'web'
            ],
            [
                'name' => 'plantillas.eliminar',
                'description' => 'Eliminar plantillas de documentos',
                'guard_name' => 'web'
            ],
            [
                'name' => 'plantillas.duplicar',
                'description' => 'Duplicar plantillas de documentos',
                'guard_name' => 'web'
            ],
            [
                'name' => 'plantillas.activar',
                'description' => 'Activar/desactivar plantillas de documentos',
                'guard_name' => 'web'
            ],

            // Gestión de Campos Personalizados
            [
                'name' => 'campos_personalizados.ver',
                'description' => 'Ver campos personalizados',
                'guard_name' => 'web'
            ],
            [
                'name' => 'campos_personalizados.crear',
                'description' => 'Crear campos personalizados',
                'guard_name' => 'web'
            ],
            [
                'name' => 'campos_personalizados.editar',
                'description' => 'Editar campos personalizados',
                'guard_name' => 'web'
            ],
            [
                'name' => 'campos_personalizados.eliminar',
                'description' => 'Eliminar campos personalizados',
                'guard_name' => 'web'
            ],
            [
                'name' => 'campos_personalizados.activar',
                'description' => 'Activar/desactivar campos personalizados',
                'guard_name' => 'web'
            ],
            [
                'name' => 'campos_personalizados.duplicar',
                'description' => 'Duplicar campos personalizados',
                'guard_name' => 'web'
            ],
            [
                'name' => 'campos_personalizados.ver_uso',
                'description' => 'Ver uso de campos personalizados',
                'guard_name' => 'web'
            ],
        ];

        foreach ($permisos as $permiso) {
            Permission::firstOrCreate(
                ['name' => $permiso['name']],
                $permiso
            );
            $this->command->info("✓ Permiso '{$permiso['name']}' creado/verificado");
        }

        // Asignar permisos al rol Super Administrador
        $superAdmin = Role::where('name', 'Super Administrador')->first();
        if ($superAdmin) {
            $todosLosPermisos = Permission::whereIn('name', array_column($permisos, 'name'))->get();
            $superAdmin->syncPermissions($todosLosPermisos);
            $this->command->info("✓ Permisos asignados al Super Administrador");
        }

        // Asignar permisos de solo lectura al rol Director
        $director = Role::where('name', 'Director OAPM')->first();
        if ($director) {
            $permisosDirector = Permission::whereIn('name', [
                'estados.ver',
                'estados.ver_diagrama',
                'tipos_solicitud.ver',
                'plantillas.ver',
                'campos_personalizados.ver',
            ])->get();
            $director->givePermissionTo($permisosDirector);
            $this->command->info("✓ Permisos de lectura asignados al Director OAPM");
        }

        $this->command->info('✓ Seeder de permisos de estados completado');
    }
}
