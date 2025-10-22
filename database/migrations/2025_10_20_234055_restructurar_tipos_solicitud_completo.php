<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tipos_solicitud', function (Blueprint $table) {
            // 1. Agregar slug (único e indexado)
            if (!Schema::hasColumn('tipos_solicitud', 'slug')) {
                $table->string('slug', 255)->nullable()->unique()->after('nombre')
                    ->comment('Slug único para URLs y referencias');
            }

            // 2. Agregar instrucciones
            if (!Schema::hasColumn('tipos_solicitud', 'instrucciones')) {
                $table->text('instrucciones')->nullable()->after('descripcion')
                    ->comment('Instrucciones detalladas para el usuario');
            }

            // 3. Agregar categoria_id (foreign key) si no existe
            if (!Schema::hasColumn('tipos_solicitud', 'categoria_id')) {
                $table->foreignId('categoria_id')->nullable()->after('slug')
                    ->constrained('categorias')
                    ->nullOnDelete()
                    ->comment('Categoría del tipo de solicitud');
            }

            // 4. Agregar dias_alerta
            if (!Schema::hasColumn('tipos_solicitud', 'dias_alerta')) {
                $table->integer('dias_alerta')->nullable()->after('tiempo_respuesta_dias')
                    ->comment('Días antes del vencimiento para enviar alerta');
            }

            // 5. Agregar requiere_documentos
            if (!Schema::hasColumn('tipos_solicitud', 'requiere_documentos')) {
                $table->boolean('requiere_documentos')->default(false)->after('color')
                    ->comment('Si requiere adjuntar documentos');
            }
        });

        // 6. Migrar datos del campo 'categoria' (string) a 'categoria_id' (foreign key)
        $tiposSolicitud = DB::table('tipos_solicitud')->whereNotNull('categoria')->get();
        
        foreach ($tiposSolicitud as $tipo) {
            if (!empty($tipo->categoria)) {
                // Buscar o crear la categoría
                $slug = Str::slug($tipo->categoria);
                $categoria = DB::table('categorias')->where('slug', $slug)->first();
                
                if (!$categoria) {
                    // Crear nueva categoría si no existe
                    $categoriaId = DB::table('categorias')->insertGetId([
                        'nombre' => $tipo->categoria,
                        'slug' => $slug,
                        'descripcion' => "Categoría: {$tipo->categoria}",
                        'color' => '#6B7280',
                        'icono' => '📋',
                        'orden' => 99,
                        'activo' => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                } else {
                    $categoriaId = $categoria->id;
                }
                
                // Actualizar el tipo de solicitud con la categoria_id
                DB::table('tipos_solicitud')
                    ->where('id', $tipo->id)
                    ->update(['categoria_id' => $categoriaId]);
            }
        }

        // 7. Generar slugs para registros existentes que no lo tengan
        $tiposSinSlug = DB::table('tipos_solicitud')->whereNull('slug')->get();
        
        foreach ($tiposSinSlug as $tipo) {
            $slug = Str::slug($tipo->nombre);
            $originalSlug = $slug;
            $count = 1;
            
            // Verificar unicidad y agregar sufijo si es necesario
            while (DB::table('tipos_solicitud')->where('slug', $slug)->where('id', '!=', $tipo->id)->exists()) {
                $slug = $originalSlug . '-' . $count;
                $count++;
            }
            
            DB::table('tipos_solicitud')
                ->where('id', $tipo->id)
                ->update(['slug' => $slug]);
        }

        // 8. Hacer slug NOT NULL después de poblar datos
        Schema::table('tipos_solicitud', function (Blueprint $table) {
            $table->string('slug', 255)->nullable(false)->change();
        });

        // 9. Actualizar requiere_documentos basado en documentos_requeridos
        DB::statement("
            UPDATE tipos_solicitud 
            SET requiere_documentos = CASE 
                WHEN documentos_requeridos IS NOT NULL 
                     AND documentos_requeridos::text != '[]' 
                     AND documentos_requeridos::text != 'null' 
                THEN true 
                ELSE false 
            END
            WHERE requiere_documentos IS NULL OR requiere_documentos = false
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tipos_solicitud', function (Blueprint $table) {
            // Eliminar campos agregados
            if (Schema::hasColumn('tipos_solicitud', 'requiere_documentos')) {
                $table->dropColumn('requiere_documentos');
            }
            
            if (Schema::hasColumn('tipos_solicitud', 'dias_alerta')) {
                $table->dropColumn('dias_alerta');
            }
            
            if (Schema::hasColumn('tipos_solicitud', 'categoria_id')) {
                $table->dropForeign(['categoria_id']);
                $table->dropColumn('categoria_id');
            }
            
            if (Schema::hasColumn('tipos_solicitud', 'instrucciones')) {
                $table->dropColumn('instrucciones');
            }
            
            if (Schema::hasColumn('tipos_solicitud', 'slug')) {
                $table->dropColumn('slug');
            }
        });
    }
};
