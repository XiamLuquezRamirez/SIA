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
        // Primero verificar si hay registros y eliminarlos (es una tabla nueva sin datos importantes)
        DB::table('estados_solicitud')->truncate();

        Schema::table('estados_solicitud', function (Blueprint $table) {
            // Agregar columna codigo si no existe
            if (!Schema::hasColumn('estados_solicitud', 'codigo')) {
                $table->string('codigo', 50)->nullable()->after('id');
            }

            // Agregar columnas faltantes
            if (!Schema::hasColumn('estados_solicitud', 'es_inicial')) {
                $table->boolean('es_inicial')->default(false)->after('tipo');
            }
            if (!Schema::hasColumn('estados_solicitud', 'es_final')) {
                $table->boolean('es_final')->default(false)->after('es_inicial');
            }
            if (!Schema::hasColumn('estados_solicitud', 'requiere_resolucion')) {
                $table->boolean('requiere_resolucion')->default(false)->after('permite_cambios');
            }
            if (!Schema::hasColumn('estados_solicitud', 'genera_documento')) {
                $table->boolean('genera_documento')->default(false)->after('requiere_resolucion');
            }
            if (!Schema::hasColumn('estados_solicitud', 'pausa_sla')) {
                $table->boolean('pausa_sla')->default(false)->after('genera_documento');
            }
            if (!Schema::hasColumn('estados_solicitud', 'reinicia_sla')) {
                $table->boolean('reinicia_sla')->default(false)->after('pausa_sla');
            }
            if (!Schema::hasColumn('estados_solicitud', 'deleted_at')) {
                $table->softDeletes();
            }
        });

        // Hacer la columna codigo not null y unique
        DB::statement('ALTER TABLE estados_solicitud ALTER COLUMN codigo SET NOT NULL');
        DB::statement('ALTER TABLE estados_solicitud ADD CONSTRAINT estados_solicitud_codigo_unique UNIQUE (codigo)');

        // Actualizar CHECK constraint para incluir tipo 'bloqueante'
        DB::statement('ALTER TABLE estados_solicitud DROP CONSTRAINT IF EXISTS estados_solicitud_tipo_check');
        DB::statement("ALTER TABLE estados_solicitud ADD CONSTRAINT estados_solicitud_tipo_check CHECK (tipo IN ('inicial', 'proceso', 'final', 'bloqueante'))");

        // Renombrar columnas existentes para que coincidan con el nuevo modelo
        DB::statement('ALTER TABLE estados_solicitud RENAME COLUMN notificar_ciudadano TO notifica_solicitante');
        DB::statement('ALTER TABLE estados_solicitud RENAME COLUMN permite_cambios TO permite_edicion');

        // Eliminar columnas que ya no se usan
        Schema::table('estados_solicitud', function (Blueprint $table) {
            if (Schema::hasColumn('estados_solicitud', 'notificar_funcionario')) {
                $table->dropColumn('notificar_funcionario');
            }
            if (Schema::hasColumn('estados_solicitud', 'requiere_comentario')) {
                $table->dropColumn('requiere_comentario');
            }
            if (Schema::hasColumn('estados_solicitud', 'visible_ciudadano')) {
                $table->dropColumn('visible_ciudadano');
            }
        });

        // Agregar índices
        Schema::table('estados_solicitud', function (Blueprint $table) {
            $table->index('codigo');
            $table->index('tipo');
            $table->index('activo');
            $table->index('orden');
        });

        // Crear tablas pivote si no existen
        if (!Schema::hasTable('estado_siguiente')) {
            Schema::create('estado_siguiente', function (Blueprint $table) {
                $table->id();
                $table->foreignId('estado_actual_id')->constrained('estados_solicitud')->onDelete('cascade');
                $table->foreignId('estado_siguiente_id')->constrained('estados_solicitud')->onDelete('cascade');
                $table->timestamps();

                $table->unique(['estado_actual_id', 'estado_siguiente_id'], 'estado_flujo_unique');
            });
        }

        if (!Schema::hasTable('estado_rol')) {
            Schema::create('estado_rol', function (Blueprint $table) {
                $table->id();
                $table->foreignId('estado_solicitud_id')->constrained('estados_solicitud')->onDelete('cascade');
                $table->unsignedBigInteger('role_id');
                $table->timestamps();

                $table->unique(['estado_solicitud_id', 'role_id']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Eliminar tablas pivote
        Schema::dropIfExists('estado_rol');
        Schema::dropIfExists('estado_siguiente');

        // Renombrar columnas de vuelta
        DB::statement('ALTER TABLE estados_solicitud RENAME COLUMN notifica_solicitante TO notificar_ciudadano');
        DB::statement('ALTER TABLE estados_solicitud RENAME COLUMN permite_edicion TO permite_cambios');

        Schema::table('estados_solicitud', function (Blueprint $table) {
            // Eliminar nuevas columnas
            $table->dropColumn([
                'codigo',
                'es_inicial',
                'es_final',
                'requiere_resolucion',
                'genera_documento',
                'pausa_sla',
                'reinicia_sla',
                'deleted_at'
            ]);

            // Restaurar columnas antiguas
            $table->boolean('notificar_funcionario')->default(false);
            $table->boolean('requiere_comentario')->default(false);
            $table->boolean('visible_ciudadano')->default(true);

            // Eliminar índices
            $table->dropIndex(['codigo']);
            $table->dropIndex(['tipo']);
            $table->dropIndex(['activo']);
            $table->dropIndex(['orden']);
        });
    }
};
