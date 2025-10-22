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
        Schema::create('transiciones_flujo', function (Blueprint $table) {
            $table->id();
            
            // Relaciones
            $table->foreignId('tipo_solicitud_id')->nullable()
                ->constrained('tipos_solicitud')->nullOnDelete()
                ->comment('Tipo de solicitud específico (null = flujo básico para todos)');
            $table->foreignId('estado_origen_id')
                ->constrained('estados_solicitud')->cascadeOnDelete()
                ->comment('Estado desde el cual se puede ejecutar');
            $table->foreignId('estado_destino_id')
                ->constrained('estados_solicitud')->cascadeOnDelete()
                ->comment('Estado al cual se transiciona');
            
            // Información básica
            $table->string('nombre', 150)->nullable()->comment('Nombre de la transición (ej: "Aprobar", "Rechazar")');
            $table->text('descripcion')->nullable()->comment('Descripción de la transición');
            
            // Permisos - Quién puede ejecutar
            $table->json('roles_permitidos')->nullable()->comment('Array de roles que pueden ejecutar');
            $table->boolean('solo_funcionario_asignado')->default(false)
                ->comment('Solo el funcionario asignado puede ejecutar');
            
            // Condiciones
            $table->boolean('requiere_comentario')->default(false);
            $table->boolean('requiere_documento')->default(false);
            $table->boolean('requiere_aprobacion_previa')->default(false);
            $table->integer('minimo_dias_transcurridos')->nullable()
                ->comment('Días mínimos desde el estado anterior');
            $table->json('campos_requeridos')->nullable()
                ->comment('Campos del formulario que deben estar completos');
            $table->json('condiciones_personalizadas')->nullable()
                ->comment('Condiciones adicionales en formato JSON');
            
            // Acciones automáticas
            $table->boolean('reasignar_funcionario')->default(false);
            $table->foreignId('usuario_reasignar_id')->nullable()
                ->constrained('users')->nullOnDelete()
                ->comment('Usuario al que se reasigna automáticamente');
            $table->string('cambiar_prioridad_a', 20)->nullable()
                ->comment('Nueva prioridad (baja, normal, alta, urgente)');
            $table->boolean('recalcular_fecha_vencimiento')->default(false);
            $table->integer('agregar_dias_vencimiento')->nullable()
                ->comment('Días adicionales al vencimiento');
            $table->boolean('generar_documento')->default(false);
            $table->foreignId('plantilla_documento_id')->nullable()
                ->comment('ID de plantilla a generar (cuando exista tabla)');
            $table->boolean('enviar_notificaciones')->default(true);
            $table->json('notificaciones_config')->nullable()
                ->comment('Configuración de notificaciones');
            $table->boolean('registrar_auditoria')->default(true);
            
            // Metadata
            $table->integer('orden')->default(0)->comment('Orden de visualización');
            $table->string('color_boton', 20)->nullable()->comment('Color del botón de acción');
            $table->string('texto_boton', 50)->nullable()->comment('Texto del botón');
            $table->boolean('requiere_confirmacion')->default(true)
                ->comment('Mostrar confirmación antes de ejecutar');
            $table->text('mensaje_confirmacion')->nullable();
            
            $table->boolean('activo')->default(true);
            $table->timestamps();
            
            // Índices
            $table->index(['tipo_solicitud_id', 'estado_origen_id']);
            $table->index('estado_destino_id');
            $table->index('activo');
            
            // Constraint único para evitar duplicados
            $table->unique(['tipo_solicitud_id', 'estado_origen_id', 'estado_destino_id'], 'transicion_unica');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transiciones_flujo');
    }
};
