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
        Schema::create('plantillas_documentos', function (Blueprint $table) {
            $table->id();

            // Información básica
            $table->string('nombre', 255);
            $table->string('slug', 255)->unique();
            $table->enum('tipo_documento', ['certificado', 'concepto', 'acta', 'resolucion', 'oficio', 'otro'])->default('certificado');
            $table->text('descripcion')->nullable();

            // Contenido de la plantilla
            $table->longText('contenido_html');
            $table->longText('contenido_css')->nullable();
            $table->longText('encabezado_html')->nullable();
            $table->longText('pie_pagina_html')->nullable();

            // Configuración de página
            $table->enum('orientacion', ['vertical', 'horizontal'])->default('vertical');
            $table->enum('tamano_pagina', ['carta', 'oficio', 'a4', 'legal'])->default('carta');
            $table->integer('margen_superior')->default(25); // en mm
            $table->integer('margen_inferior')->default(25);
            $table->integer('margen_izquierdo')->default(25);
            $table->integer('margen_derecho')->default(25);

            // Variables
            $table->json('variables_usadas')->nullable(); // Array de variables: ["{{campo.direccion}}", "{{solicitud.radicado}}"]
            $table->integer('total_variables')->default(0);

            // Preview
            $table->string('preview_url', 500)->nullable(); // Ruta a miniatura/preview

            // Estado y auditoria
            $table->boolean('activo')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            // Índices
            $table->index('tipo_documento');
            $table->index('activo');
            $table->index('slug');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('plantillas_documentos');
    }
};
