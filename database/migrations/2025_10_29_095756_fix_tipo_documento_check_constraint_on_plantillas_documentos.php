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
        // Primero, eliminar la restricción CHECK existente
        DB::statement('ALTER TABLE plantillas_documentos DROP CONSTRAINT IF EXISTS plantillas_documentos_tipo_documento_check');

        // Agregar nueva restricción CHECK con todos los valores permitidos (incluye ambos 'concepto' y 'concepto_tecnico' para compatibilidad)
        DB::statement("ALTER TABLE plantillas_documentos ADD CONSTRAINT plantillas_documentos_tipo_documento_check CHECK (tipo_documento IN ('certificado', 'concepto', 'concepto_tecnico', 'acta', 'resolucion', 'oficio', 'otro'))");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Eliminar la restricción CHECK agregada
        DB::statement('ALTER TABLE plantillas_documentos DROP CONSTRAINT IF EXISTS plantillas_documentos_tipo_documento_check');
    }
};
