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
        Schema::create('firmantes_plantilla', function (Blueprint $table) {
            $table->id();

            // Relación
            $table->foreignId('tipo_solicitud_id')->constrained('tipos_solicitud')->cascadeOnDelete();
            $table->foreignId('plantilla_documento_id')->constrained('plantillas_documentos')->cascadeOnDelete();

            // Información del firmante
            $table->enum('rol_firmante', [
                'funcionario_asignado',
                'lider_equipo',
                'coordinador_area',
                'director_oapm',
                'rol_especifico',
                'usuario_especifico'
            ])->default('funcionario_asignado');

            $table->foreignId('rol_id')->nullable()->constrained('roles')->nullOnDelete(); // Si es rol_especifico
            $table->foreignId('usuario_id')->nullable()->constrained('users')->nullOnDelete(); // Si es usuario_especifico

            // Configuración de firma
            $table->enum('tipo_firma', ['digital', 'manuscrita', 'solo_nombre'])->default('digital');
            $table->enum('posicion', [
                'inferior_izquierda',
                'inferior_centro',
                'inferior_derecha',
                'superior_izquierda',
                'superior_centro',
                'superior_derecha',
                'personalizada'
            ])->default('inferior_izquierda');

            $table->integer('posicion_x')->nullable(); // Para posición personalizada (mm desde izquierda)
            $table->integer('posicion_y')->nullable(); // Para posición personalizada (mm desde arriba)

            // Orden y opciones
            $table->integer('orden')->default(1); // 1 = primero, 2 = segundo, etc.
            $table->boolean('obligatorio')->default(true);
            $table->boolean('enviar_notificacion')->default(true);
            $table->boolean('permitir_delegacion')->default(false);

            $table->timestamps();

            // Índices
            $table->index(['tipo_solicitud_id', 'plantilla_documento_id']);
            $table->index('orden');
            $table->index('rol_firmante');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('firmantes_plantilla');
    }
};
