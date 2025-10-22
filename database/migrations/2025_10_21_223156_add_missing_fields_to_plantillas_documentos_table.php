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
        Schema::table('plantillas_documentos', function (Blueprint $table) {
            // Agregar campos faltantes
            $table->json('variables_usadas')->nullable()->after('margen_derecho');
            $table->integer('total_variables')->default(0)->after('variables_usadas');
            $table->string('preview_url', 500)->nullable()->after('total_variables');
            $table->softDeletes()->after('updated_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('plantillas_documentos', function (Blueprint $table) {
            $table->dropColumn(['variables_usadas', 'total_variables', 'preview_url']);
            $table->dropSoftDeletes();
        });
    }
};
