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
        Schema::create('categorias', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 100)->unique()->comment('Nombre de la categoría');
            $table->string('slug', 100)->unique()->comment('Slug para URLs');
            $table->text('descripcion')->nullable()->comment('Descripción de la categoría');
            $table->string('color', 20)->default('#3B82F6')->comment('Color en hex para UI');
            $table->string('icono', 50)->default('📁')->comment('Emoji o icono');
            $table->integer('orden')->default(0)->comment('Orden de visualización');
            $table->boolean('activo')->default(true)->comment('Si está activa');
            $table->timestamps();
            
            // Índices
            $table->index('slug');
            $table->index('activo');
            $table->index('orden');
        });

        // Insertar categorías por defecto
        DB::table('categorias')->insert([
            [
                'nombre' => 'Certificados',
                'slug' => 'certificados',
                'descripcion' => 'Solicitudes de certificados y documentos oficiales',
                'color' => '#3B82F6',
                'icono' => '📄',
                'orden' => 1,
                'activo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nombre' => 'Permisos',
                'slug' => 'permisos',
                'descripcion' => 'Solicitudes de permisos y autorizaciones',
                'color' => '#10B981',
                'icono' => '✅',
                'orden' => 2,
                'activo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nombre' => 'Licencias',
                'slug' => 'licencias',
                'descripcion' => 'Solicitudes de licencias de construcción y funcionamiento',
                'color' => '#F59E0B',
                'icono' => '🏗️',
                'orden' => 3,
                'activo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nombre' => 'Consultas',
                'slug' => 'consultas',
                'descripcion' => 'Consultas y peticiones de información',
                'color' => '#8B5CF6',
                'icono' => '❓',
                'orden' => 4,
                'activo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nombre' => 'Quejas y Reclamos',
                'slug' => 'quejas-reclamos',
                'descripcion' => 'Quejas, reclamos y sugerencias',
                'color' => '#EF4444',
                'icono' => '⚠️',
                'orden' => 5,
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
        Schema::dropIfExists('categorias');
    }
};
