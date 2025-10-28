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
        Schema::table('campos_personalizados', function (Blueprint $table) {
            // Agregar columnas faltantes para el wizard
            $table->integer('orden')->default(0)->after('activo');
            $table->integer('usos')->default(0)->after('orden');
            $table->string('ancho', 20)->nullable()->after('usos');
            $table->string('icono', 50)->nullable()->after('ancho');
            $table->string('clases_css')->nullable()->after('icono');
            $table->json('configuracion')->nullable()->after('clases_css');
            $table->json('validacion')->nullable()->after('configuracion');
            $table->json('logica_condicional')->nullable()->after('validacion');
            $table->string('formula', 500)->nullable()->after('logica_condicional');
            $table->json('comportamiento')->nullable()->after('formula');
            $table->json('ayuda_contextual')->nullable()->after('comportamiento');
            $table->bigInteger('updated_by')->nullable()->after('created_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('campos_personalizados', function (Blueprint $table) {
            $table->dropColumn([
                'orden',
                'usos',
                'ancho',
                'icono',
                'clases_css',
                'configuracion',
                'validacion',
                'logica_condicional',
                'formula',
                'comportamiento',
                'ayuda_contextual',
                'updated_by'
            ]);
        });
    }
};
