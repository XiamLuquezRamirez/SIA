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
        Schema::create('tipo_solicitud_plantilla', function (Blueprint $table) {
            $table->id();

            // Relación
            $table->foreignId('tipo_solicitud_id')->constrained('tipos_solicitud')->cascadeOnDelete();
            $table->foreignId('plantilla_documento_id')->constrained('plantillas_documentos')->cascadeOnDelete();

            // Configuración de generación
            $table->boolean('generar_automatico')->default(true);
            $table->enum('momento_generacion', ['al_aprobar', 'al_completar', 'manual'])->default('al_aprobar');
            $table->string('nombre_archivo_template', 255)->nullable(); // "Certificado_{{radicado}}.pdf"

            // Estado
            $table->boolean('es_principal')->default(true); // Si es la plantilla principal del tipo
            $table->integer('orden')->default(1); // Orden de generación si hay múltiples plantillas

            $table->timestamps();

            // Índices y constraints
            $table->index(['tipo_solicitud_id', 'plantilla_documento_id']);
            $table->index('es_principal');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tipo_solicitud_plantilla');
    }
};
