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
        Schema::create('campos_tipo_solicitud', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campo_personalizado_id')->constrained('campos_personalizados')->onDelete('cascade');
            $table->foreignId('tipo_solicitud_id')->constrained('tipos_solicitud')->onDelete('cascade');

            // Overrides para personalizar el campo en este tipo de solicitud
            $table->string('nombre_override')->nullable();
            $table->string('etiqueta_override')->nullable();
            $table->string('variable_override')->nullable();
            $table->text('descripcion_override')->nullable();
            $table->string('placeholder_override')->nullable();
            $table->string('valor_defecto_override')->nullable();

            // Configuración específica del campo en este tipo
            $table->boolean('obligatorio')->default(false);
            $table->boolean('solo_lectura')->default(false);
            $table->boolean('oculto')->default(false);
            $table->string('ancho', 20)->nullable(); // completo, medio, tercio, cuarto
            $table->integer('orden')->default(0);
            $table->string('seccion')->nullable(); // Para agrupar campos por secciones
            $table->json('mostrar_si')->nullable(); // Lógica condicional para mostrar el campo

            $table->timestamps();

            // Índices únicos para evitar duplicados
            $table->unique(['campo_personalizado_id', 'tipo_solicitud_id'], 'campo_tipo_unique');

            // Índices para mejorar rendimiento
            $table->index('campo_personalizado_id');
            $table->index('tipo_solicitud_id');
            $table->index('orden');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('campos_tipo_solicitud');
    }
};
