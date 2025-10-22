<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('estados_solicitud', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 100)->comment('Nombre del estado');
            $table->string('slug', 100)->unique()->comment('Slug único');
            $table->text('descripcion')->nullable()->comment('Descripción del estado');
            $table->string('color', 20)->default('#6B7280')->comment('Color en hex');
            $table->string('icono', 50)->default('📋')->comment('Emoji o icono');
            $table->enum('tipo', ['inicial', 'intermedio', 'final'])->default('intermedio')
                ->comment('Tipo de estado');
            $table->integer('orden')->default(0)->comment('Orden de visualización');
            $table->boolean('requiere_asignacion')->default(false)
                ->comment('Si requiere asignar funcionario');
            $table->boolean('notificar_usuario')->default(true)
                ->comment('Si notifica al usuario solicitante');
            $table->boolean('notificar_funcionario')->default(true)
                ->comment('Si notifica al funcionario asignado');
            $table->boolean('pausar_conteo_dias')->default(false)
                ->comment('Si pausa el conteo de días');
            $table->json('metadatos')->nullable()->comment('Metadatos adicionales');
            $table->boolean('activo')->default(true);
            $table->timestamps();
            
            // Índices
            $table->index('slug');
            $table->index('tipo');
            $table->index('activo');
            $table->index('orden');
        });

        // Insertar estados por defecto
        DB::table('estados_solicitud')->insert([
            [
                'nombre' => 'Radicada',
                'slug' => 'radicada',
                'descripcion' => 'Solicitud recibida y radicada en el sistema',
                'color' => '#3B82F6',
                'icono' => '📥',
                'tipo' => 'inicial',
                'orden' => 1,
                'requiere_asignacion' => false,
                'notificar_usuario' => true,
                'notificar_funcionario' => false,
                'pausar_conteo_dias' => false,
                'activo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nombre' => 'En Revisión',
                'slug' => 'en-revision',
                'descripcion' => 'Solicitud en proceso de revisión',
                'color' => '#F59E0B',
                'icono' => '🔍',
                'tipo' => 'intermedio',
                'orden' => 2,
                'requiere_asignacion' => true,
                'notificar_usuario' => false,
                'notificar_funcionario' => true,
                'pausar_conteo_dias' => false,
                'activo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nombre' => 'Pendiente de Documentos',
                'slug' => 'pendiente-documentos',
                'descripcion' => 'Esperando documentación adicional del solicitante',
                'color' => '#EF4444',
                'icono' => '📄',
                'tipo' => 'intermedio',
                'orden' => 3,
                'requiere_asignacion' => false,
                'notificar_usuario' => true,
                'notificar_funcionario' => false,
                'pausar_conteo_dias' => true,
                'activo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nombre' => 'En Aprobación',
                'slug' => 'en-aprobacion',
                'descripcion' => 'Solicitud esperando aprobación de director',
                'color' => '#8B5CF6',
                'icono' => '✅',
                'tipo' => 'intermedio',
                'orden' => 4,
                'requiere_asignacion' => true,
                'notificar_usuario' => false,
                'notificar_funcionario' => true,
                'pausar_conteo_dias' => false,
                'activo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nombre' => 'Aprobada',
                'slug' => 'aprobada',
                'descripcion' => 'Solicitud aprobada y completada',
                'color' => '#10B981',
                'icono' => '✓',
                'tipo' => 'final',
                'orden' => 5,
                'requiere_asignacion' => false,
                'notificar_usuario' => true,
                'notificar_funcionario' => true,
                'pausar_conteo_dias' => false,
                'activo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nombre' => 'Rechazada',
                'slug' => 'rechazada',
                'descripcion' => 'Solicitud rechazada',
                'color' => '#DC2626',
                'icono' => '✗',
                'tipo' => 'final',
                'orden' => 6,
                'requiere_asignacion' => false,
                'notificar_usuario' => true,
                'notificar_funcionario' => true,
                'pausar_conteo_dias' => false,
                'activo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('estados_solicitud');
    }
};
