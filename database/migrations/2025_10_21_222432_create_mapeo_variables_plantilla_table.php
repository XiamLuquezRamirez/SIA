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
        Schema::create('mapeo_variables_plantilla', function (Blueprint $table) {
            $table->id();

            // Relación
            $table->foreignId('tipo_solicitud_id')->constrained('tipos_solicitud')->cascadeOnDelete();
            $table->foreignId('plantilla_documento_id')->constrained('plantillas_documentos')->cascadeOnDelete();

            // Mapeo
            $table->string('variable_plantilla', 255); // "{{campo.direccion_predio}}"
            $table->enum('tipo_origen', ['campo', 'sistema', 'solicitante', 'solicitud', 'fijo'])->default('campo');
            $table->string('campo_origen', 255)->nullable(); // nombre del campo en el formulario: "campo_direccion"
            $table->text('valor_fijo')->nullable(); // Si es tipo 'fijo', el valor constante
            $table->string('transformacion', 100)->nullable(); // uppercase, lowercase, date_format, etc.

            $table->timestamps();

            // Índices
            $table->index(['tipo_solicitud_id', 'plantilla_documento_id']);
            $table->index('variable_plantilla');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mapeo_variables_plantilla');
    }
};
