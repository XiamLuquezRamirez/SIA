<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class ConfiguracionGeneralPermisosSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Creando permisos de módulos de configuración...');

        // ========================================
        // PERMISOS DE CONFIGURACIÓN GENERAL
        // ========================================
        $permisosConfiguracion = [
            [
                'name' => 'configuracion_general.ver',
                'description' => 'Ver configuración general del sistema',
                'guard_name' => 'web'
            ],
            [
                'name' => 'configuracion_general.editar',
                'description' => 'Editar configuración general del sistema',
                'guard_name' => 'web'
            ],
            [
                'name' => 'configuracion_general.actualizar_logo',
                'description' => 'Actualizar logo de la institución',
                'guard_name' => 'web'
            ],
            [
                'name' => 'configuracion_general.actualizar_firma',
                'description' => 'Actualizar firma digital',
                'guard_name' => 'web'
            ],
            [
                'name' => 'configuracion_general.configurar_email',
                'description' => 'Configurar parámetros de correo electrónico',
                'guard_name' => 'web'
            ],
            [
                'name' => 'configuracion_general.configurar_notificaciones',
                'description' => 'Configurar sistema de notificaciones',
                'guard_name' => 'web'
            ],
        ];

        // ========================================
        // PERMISOS DE CATEGORÍAS
        // ========================================
        $permisosCategorias = [
            [
                'name' => 'categorias.ver',
                'description' => 'Ver lista de categorías',
                'guard_name' => 'web'
            ],
            [
                'name' => 'categorias.crear',
                'description' => 'Crear nuevas categorías',
                'guard_name' => 'web'
            ],
            [
                'name' => 'categorias.editar',
                'description' => 'Editar categorías existentes',
                'guard_name' => 'web'
            ],
            [
                'name' => 'categorias.eliminar',
                'description' => 'Eliminar categorías',
                'guard_name' => 'web'
            ],
            [
                'name' => 'categorias.activar',
                'description' => 'Activar/desactivar categorías',
                'guard_name' => 'web'
            ],
            [
                'name' => 'categorias.ver_detalle',
                'description' => 'Ver detalles completos de una categoría',
                'guard_name' => 'web'
            ],
        ];

        // ========================================
        // PERMISOS DE FESTIVOS
        // ========================================
        $permisosFestivos = [
            [
                'name' => 'festivos.ver',
                'description' => 'Ver lista de días festivos',
                'guard_name' => 'web'
            ],
            [
                'name' => 'festivos.crear',
                'description' => 'Crear nuevos días festivos',
                'guard_name' => 'web'
            ],
            [
                'name' => 'festivos.editar',
                'description' => 'Editar días festivos existentes',
                'guard_name' => 'web'
            ],
            [
                'name' => 'festivos.eliminar',
                'description' => 'Eliminar días festivos',
                'guard_name' => 'web'
            ],
            [
                'name' => 'festivos.importar',
                'description' => 'Importar calendario de festivos',
                'guard_name' => 'web'
            ],
            [
                'name' => 'festivos.exportar',
                'description' => 'Exportar calendario de festivos',
                'guard_name' => 'web'
            ],
        ];

        // ========================================
        // PERMISOS DE AUDITORÍA Y MONITOREO
        // ========================================
        $permisosAuditoria = [
            [
                'name' => 'auditoria.ver',
                'description' => 'Ver registros de auditoría',
                'guard_name' => 'web'
            ],
            [
                'name' => 'auditoria.ver_detalle',
                'description' => 'Ver detalles completos de un registro de auditoría',
                'guard_name' => 'web'
            ],
            [
                'name' => 'auditoria.exportar',
                'description' => 'Exportar registros de auditoría',
                'guard_name' => 'web'
            ],
            [
                'name' => 'auditoria.filtrar',
                'description' => 'Aplicar filtros avanzados en auditoría',
                'guard_name' => 'web'
            ],
            [
                'name' => 'monitoreo.ver_dashboard',
                'description' => 'Ver dashboard de monitoreo del sistema',
                'guard_name' => 'web'
            ],
            [
                'name' => 'monitoreo.ver_metricas',
                'description' => 'Ver métricas y estadísticas del sistema',
                'guard_name' => 'web'
            ],
            [
                'name' => 'monitoreo.ver_logs',
                'description' => 'Ver logs del sistema',
                'guard_name' => 'web'
            ],
            [
                'name' => 'monitoreo.limpiar_logs',
                'description' => 'Limpiar logs antiguos del sistema',
                'guard_name' => 'web'
            ],
        ];

        // ========================================
        // CREAR TODOS LOS PERMISOS
        // ========================================
        $todosLosPermisos = array_merge(
            $permisosConfiguracion,
            $permisosCategorias,
            $permisosFestivos,
            $permisosAuditoria
        );

        foreach ($todosLosPermisos as $permiso) {
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
            $todosPermisosIds = Permission::whereIn('name', array_column($todosLosPermisos, 'name'))->get();
            $superAdmin->syncPermissions($superAdmin->permissions->merge($todosPermisosIds)->unique('id'));
            $this->command->info("✓ Permisos asignados al Super Administrador");
        }

        // Director OAPM - Todos los permisos excepto limpiar logs
        $director = Role::where('name', 'Director OAPM')->first();
        if ($director) {
            $permisosDirector = Permission::whereIn('name', [
                // Configuración General
                'configuracion_general.ver',
                'configuracion_general.editar',
                'configuracion_general.actualizar_logo',
                'configuracion_general.actualizar_firma',
                'configuracion_general.configurar_email',
                'configuracion_general.configurar_notificaciones',
                // Categorías
                'categorias.ver',
                'categorias.crear',
                'categorias.editar',
                'categorias.eliminar',
                'categorias.activar',
                'categorias.ver_detalle',
                // Festivos
                'festivos.ver',
                'festivos.crear',
                'festivos.editar',
                'festivos.eliminar',
                'festivos.importar',
                'festivos.exportar',
                // Auditoría y Monitoreo
                'auditoria.ver',
                'auditoria.ver_detalle',
                'auditoria.exportar',
                'auditoria.filtrar',
                'monitoreo.ver_dashboard',
                'monitoreo.ver_metricas',
                'monitoreo.ver_logs',
            ])->get();
            $director->givePermissionTo($permisosDirector);
            $this->command->info("✓ Permisos asignados al Director OAPM");
        }

        // Coordinador de Área - Permisos de lectura y gestión limitada
        $coordinador = Role::where('name', 'Coordinador de Área')->first();
        if ($coordinador) {
            $permisosCoordinador = Permission::whereIn('name', [
                'configuracion_general.ver',
                'categorias.ver',
                'categorias.ver_detalle',
                'festivos.ver',
                'auditoria.ver',
                'monitoreo.ver_dashboard',
                'monitoreo.ver_metricas',
            ])->get();
            $coordinador->givePermissionTo($permisosCoordinador);
            $this->command->info("✓ Permisos asignados al Coordinador de Área");
        }

        // Líder de Equipo - Solo permisos de lectura básica
        $lider = Role::where('name', 'Líder de Equipo')->first();
        if ($lider) {
            $permisosLider = Permission::whereIn('name', [
                'festivos.ver',
                'auditoria.ver',
            ])->get();
            $lider->givePermissionTo($permisosLider);
            $this->command->info("✓ Permisos asignados al Líder de Equipo");
        }

        // Funcionario - Solo lectura de festivos
        $funcionario = Role::where('name', 'Funcionario')->first();
        if ($funcionario) {
            $permisosFuncionario = Permission::whereIn('name', [
                'festivos.ver',
            ])->get();
            $funcionario->givePermissionTo($permisosFuncionario);
            $this->command->info("✓ Permisos asignados al Funcionario");
        }

        $this->command->info('');
        $this->command->info("📊 RESUMEN DE PERMISOS CREADOS:");
        $this->command->info("   • Configuración General: " . count($permisosConfiguracion) . " permisos");
        $this->command->info("   • Categorías: " . count($permisosCategorias) . " permisos");
        $this->command->info("   • Festivos: " . count($permisosFestivos) . " permisos");
        $this->command->info("   • Auditoría y Monitoreo: " . count($permisosAuditoria) . " permisos");
        $this->command->info("   • TOTAL: " . count($todosLosPermisos) . " permisos");
        $this->command->info('');
        $this->command->info('✅ Seeder de permisos de configuración completado exitosamente');
    }
}
