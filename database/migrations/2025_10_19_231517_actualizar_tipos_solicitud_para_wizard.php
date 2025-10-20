<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tipos_solicitud', function (Blueprint $table) {
            // 1. Agregar campos nuevos necesarios para el wizard
            if (!Schema::hasColumn('tipos_solicitud', 'categoria')) {
                $table->string('categoria', 100)->nullable()->after('descripcion')
                    ->comment('Categoría del tipo: Certificados, Permisos, Licencias, etc.');
            }
            
            if (!Schema::hasColumn('tipos_solicitud', 'area_id')) {
                $table->foreignId('area_id')->nullable()->after('categoria')
                    ->comment('Referencia al área responsable (coincide con area_responsable_id)');
            }
            
            if (!Schema::hasColumn('tipos_solicitud', 'tiempo_respuesta_dias')) {
                $table->integer('tiempo_respuesta_dias')->default(3)->after('area_id')
                    ->comment('Tiempo de respuesta en días hábiles (coincide con dias_respuesta)');
            }
            
            if (!Schema::hasColumn('tipos_solicitud', 'sla_dias')) {
                $table->integer('sla_dias')->nullable()->after('tiempo_respuesta_dias')
                    ->comment('SLA en días hábiles');
            }
            
            if (!Schema::hasColumn('tipos_solicitud', 'requiere_aprobacion')) {
                $table->boolean('requiere_aprobacion')->default(false)->after('activo')
                    ->comment('Si requiere flujo de aprobación');
            }
            
            if (!Schema::hasColumn('tipos_solicitud', 'costo')) {
                $table->decimal('costo', 10, 2)->nullable()->after('valor_tramite')
                    ->comment('Costo si requiere pago (en USD o moneda local)');
            }
            
            if (!Schema::hasColumn('tipos_solicitud', 'campos_formulario')) {
                $table->json('campos_formulario')->nullable()->after('costo')
                    ->comment('Configuración de campos del formulario');
            }
            
            if (!Schema::hasColumn('tipos_solicitud', 'documentos_requeridos')) {
                $table->json('documentos_requeridos')->nullable()->after('campos_formulario')
                    ->comment('Lista de documentos requeridos');
            }
            
            if (!Schema::hasColumn('tipos_solicitud', 'flujo_aprobacion')) {
                $table->json('flujo_aprobacion')->nullable()->after('documentos_requeridos')
                    ->comment('Configuración del flujo de aprobación');
            }
            
            if (!Schema::hasColumn('tipos_solicitud', 'plantillas')) {
                $table->json('plantillas')->nullable()->after('flujo_aprobacion')
                    ->comment('Plantillas asociadas');
            }
            
            if (!Schema::hasColumn('tipos_solicitud', 'notificaciones')) {
                $table->json('notificaciones')->nullable()->after('plantillas')
                    ->comment('Configuración de notificaciones');
            }
        });
        
        // 2. Sincronizar datos de campos antiguos a nuevos (solo tipos compatibles)
        \DB::statement('
            UPDATE tipos_solicitud 
            SET 
                area_id = COALESCE(area_id, area_responsable_id),
                tiempo_respuesta_dias = COALESCE(tiempo_respuesta_dias, dias_respuesta, 3),
                categoria = COALESCE(categoria, \'General\'),
                costo = COALESCE(costo, valor_tramite, 0)
            WHERE area_id IS NULL OR tiempo_respuesta_dias IS NULL OR categoria IS NULL
        ');
        
        // Sincronizar requiere_aprobacion por separado para evitar conflicto de tipos
        \DB::statement('
            UPDATE tipos_solicitud 
            SET requiere_aprobacion = false
            WHERE requiere_aprobacion IS NULL
        ');
        
        // 3. Agregar índices para optimización
        Schema::table('tipos_solicitud', function (Blueprint $table) {
            if (!Schema::hasColumn('tipos_solicitud', 'categoria') || 
                !\DB::select("SELECT indexname FROM pg_indexes WHERE tablename = 'tipos_solicitud' AND indexname = 'tipos_solicitud_categoria_index'")) {
                try {
                    $table->index('categoria');
                } catch (\Exception $e) {
                    // Índice ya existe
                }
            }
            
            if (!Schema::hasColumn('tipos_solicitud', 'area_id') || 
                !\DB::select("SELECT indexname FROM pg_indexes WHERE tablename = 'tipos_solicitud' AND indexname = 'tipos_solicitud_area_id_index'")) {
                try {
                    $table->index('area_id');
                } catch (\Exception $e) {
                    // Índice ya existe
                }
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tipos_solicitud', function (Blueprint $table) {
            // Eliminar campos agregados (cuidado: puede perder datos)
            $columnsToRemove = [
                'notificaciones',
                'plantillas',
                'flujo_aprobacion',
                'documentos_requeridos',
                'campos_formulario',
                'costo',
                'requiere_aprobacion',
                'sla_dias',
                'tiempo_respuesta_dias',
                'area_id',
                'categoria',
            ];
            
            foreach ($columnsToRemove as $column) {
                if (Schema::hasColumn('tipos_solicitud', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
