<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Area;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Crear rol si no existe
        $adminRole = Role::firstOrCreate(['name' => 'Super Administrador']);

        // Verificar si existe un área, si no crear una
        $area = Area::first();
        if (!$area) {
            $area = Area::create([
                'nombre' => 'Dirección General',
                'descripcion' => 'Área administrativa principal',
                'activo' => true,
            ]);
        }

        // Buscar usuario por cédula o email
        $admin = User::where('cedula', '1234567890')
            ->orWhere('email', 'admin@sia.com')
            ->first();

        if (!$admin) {
            // Crear nuevo usuario
            $admin = User::create([
                'tipo_documento' => 'CC',
                'cedula' => '12345678',
                'nombre' => 'Administrador',
                'apellidos' => 'Sistema',
                'email' => 'admin@sia.com',
                'password' => Hash::make('admin123'),
                'tipo_usuario' => 'interno',
                'area_id' => $area->id,
                'cargo' => 'Administrador del Sistema',
                'activo' => true,
            ]);
        } else {
            // Actualizar contraseña y asegurar que esté activo
            $admin->update([
                'password' => Hash::make('admin123'),
                'activo' => true,
            ]);
        }

        // Asignar rol si no lo tiene
        if (!$admin->hasRole('Super Administrador')) {
            $admin->assignRole($adminRole);
        }

        $this->command->info('✅ Usuario administrador actualizado:');
        $this->command->info('📧 Email: ' . $admin->email);
        $this->command->info('🔑 Password: admin123');
        $this->command->info('👤 Rol: Super Administrador');
        $this->command->info('✓ Estado: ' . ($admin->activo ? 'Activo' : 'Inactivo'));
    }
}
