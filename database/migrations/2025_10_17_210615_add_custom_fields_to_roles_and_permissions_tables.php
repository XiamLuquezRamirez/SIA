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
        // Agregar campos personalizados a la tabla roles
        Schema::table('roles', function (Blueprint $table) {
            $table->text('description')->nullable()->after('name');
            $table->unsignedBigInteger('area_id')->nullable()->after('description');
            $table->boolean('activo')->default(true)->after('area_id');

            // Foreign key para area_id
            $table->foreign('area_id')
                ->references('id')
                ->on('areas')
                ->onDelete('set null');
        });

        // Agregar campos personalizados a la tabla permissions
        Schema::table('permissions', function (Blueprint $table) {
            $table->string('display_name')->nullable()->after('name');
            $table->string('module')->nullable()->after('display_name');
            $table->text('description')->nullable()->after('module');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Eliminar campos de la tabla roles
        Schema::table('roles', function (Blueprint $table) {
            $table->dropForeign(['area_id']);
            $table->dropColumn(['description', 'area_id', 'activo']);
        });

        // Eliminar campos de la tabla permissions
        Schema::table('permissions', function (Blueprint $table) {
            $table->dropColumn(['display_name', 'module', 'description']);
        });
    }
};
