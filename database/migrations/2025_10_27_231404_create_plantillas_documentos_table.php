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
            $table->string('nombre');
            $table->string('slug')->unique();
            $table->string('tipo_documento')->default('certificado'); // certificado, concepto, acta, oficio
            $table->text('descripcion')->nullable();

            // Contenido HTML
            $table->longText('contenido_html');
            $table->longText('contenido_css')->nullable();
            $table->longText('encabezado_html')->nullable();
            $table->longText('pie_pagina_html')->nullable();

            // Configuración de página
            $table->string('orientacion')->default('vertical'); // vertical, horizontal
            $table->string('tamano_pagina')->default('carta'); // carta, oficio, a4
            $table->integer('margen_superior')->default(25); // en mm
            $table->integer('margen_inferior')->default(25);
            $table->integer('margen_izquierdo')->default(25);
            $table->integer('margen_derecho')->default(25);

            // Variables y metadatos
            $table->json('variables_usadas')->nullable(); // Array de variables detectadas
            $table->json('variables_obligatorias')->nullable(); // Variables que deben estar mapeadas
            $table->json('configuracion_adicional')->nullable(); // Otras configs

            // Preview y caché
            $table->string('preview_imagen')->nullable(); // Ruta a imagen de preview
            $table->timestamp('preview_generado_at')->nullable();

            // Estado y uso
            $table->boolean('activo')->default(true);
            $table->integer('veces_usado')->default(0); // Contador de uso
            $table->timestamp('ultima_generacion')->nullable();

            // Auditoría
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users');
            $table->timestamps();
            $table->softDeletes();

            // Índices
            $table->index('tipo_documento');
            $table->index('activo');
            $table->index('created_by');
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
