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
        Schema::table('campos_tipo_solicitud', function (Blueprint $table) {
            $table->string('tipo_origen', 20)->default('personalizado')->after('campo_personalizado_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('campos_tipo_solicitud', function (Blueprint $table) {
            $table->dropColumn('tipo_origen');
        });
    }
};
