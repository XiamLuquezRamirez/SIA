<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('roles', function (Blueprint $table) {
            $table->string('slug')->unique()->nullable()->after('name');
        });

        // Generar slugs para roles existentes
        DB::table('roles')->get()->each(function ($role) {
            $slug = \Illuminate\Support\Str::slug($role->name);
            
            // Si el slug ya existe, agregar un sufijo numérico
            $originalSlug = $slug;
            $count = 1;
            
            while (DB::table('roles')->where('slug', $slug)->where('id', '!=', $role->id)->exists()) {
                $slug = $originalSlug . '-' . $count;
                $count++;
            }
            
            DB::table('roles')->where('id', $role->id)->update(['slug' => $slug]);
        });

        // Hacer el campo no nullable después de poblar los datos
        Schema::table('roles', function (Blueprint $table) {
            $table->string('slug')->nullable(false)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('roles', function (Blueprint $table) {
            $table->dropColumn('slug');
        });
    }
};
