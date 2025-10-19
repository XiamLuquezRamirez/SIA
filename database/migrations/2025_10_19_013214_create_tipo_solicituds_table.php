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
        Schema::create('tipos_solicitud', function (Blueprint $table) {
            $table->id();
            
            // Información básica
            $table->string('codigo', 50)->unique()->comment('Código único del tipo');
            $table->string('nombre', 255)->comment('Nombre del tipo de solicitud');
            $table->text('descripcion')->nullable()->comment('Descripción detallada');
            $table->string('categoria', 100)->comment('Categoría: Certificados, Permisos, Licencias, etc.');
            
            // Área responsable
            $table->foreignId('area_id')->constrained('areas')->comment('Área responsable del tipo');
            
            // Configuración de tiempos
            $table->integer('tiempo_respuesta_dias')->default(3)->comment('Tiempo estimado en días hábiles');
            $table->integer('sla_dias')->nullable()->comment('SLA en días hábiles');
            
            // Estado y configuración
            $table->boolean('activo')->default(true);
            $table->boolean('requiere_aprobacion')->default(false)->comment('Si requiere flujo de aprobación');
            $table->boolean('requiere_pago')->default(false)->comment('Si requiere pago');
            $table->decimal('costo', 10, 2)->nullable()->comment('Costo si requiere pago');
            
            // Configuración de formulario
            $table->json('campos_formulario')->nullable()->comment('Configuración de campos del formulario');
            $table->json('documentos_requeridos')->nullable()->comment('Lista de documentos requeridos');
            
            // Configuración de flujo
            $table->json('flujo_aprobacion')->nullable()->comment('Configuración del flujo de aprobación');
            $table->json('plantillas')->nullable()->comment('Plantillas asociadas');
            
            // Configuración de notificaciones
            $table->json('notificaciones')->nullable()->comment('Configuración de notificaciones');
            
            // Metadatos
            $table->integer('orden')->default(0)->comment('Orden de visualización');
            $table->string('icono', 50)->nullable()->comment('Icono FontAwesome o emoji');
            $table->string('color', 20)->default('blue')->comment('Color para UI');
            
            // Auditoría
            $table->foreignId('created_by')->nullable()->constrained('users')->comment('Usuario que creó');
            $table->foreignId('updated_by')->nullable()->constrained('users')->comment('Usuario que actualizó');
            
            $table->timestamps();
            $table->softDeletes();
            
            // Índices
            $table->index('codigo');
            $table->index('categoria');
            $table->index('area_id');
            $table->index('activo');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tipos_solicitud');
    }
};
