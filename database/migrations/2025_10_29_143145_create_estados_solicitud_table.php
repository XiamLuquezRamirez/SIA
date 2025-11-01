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
        Schema::create('estados_solicitud', function (Blueprint $table) {
            $table->id();

            // Información básica
            $table->string('codigo', 50)->unique();
            $table->string('nombre', 100);
            $table->string('slug', 100)->unique();
            $table->text('descripcion')->nullable();

            // Tipo y clasificación
            $table->enum('tipo', ['inicial', 'proceso', 'final', 'bloqueante'])->default('proceso');
            $table->boolean('es_inicial')->default(false);
            $table->boolean('es_final')->default(false);
            $table->boolean('es_sistema')->default(false);

            // Configuración de comportamiento
            $table->boolean('notifica_solicitante')->default(true);
            $table->boolean('permite_edicion')->default(false);
            $table->boolean('requiere_resolucion')->default(false);
            $table->boolean('genera_documento')->default(false);

            // SLA
            $table->boolean('pausa_sla')->default(false);
            $table->boolean('reinicia_sla')->default(false);

            // Visual
            $table->string('color', 7)->default('#6B7280');
            $table->string('icono', 10)->nullable();
            $table->integer('orden')->default(0);

            // Estado
            $table->boolean('activo')->default(true);

            // Auditoría
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users');
            $table->timestamps();
            $table->softDeletes();

            // Índices
            $table->index('codigo');
            $table->index('tipo');
            $table->index('activo');
            $table->index('orden');
        });

        // Tabla pivote para estados siguientes (flujo)
        Schema::create('estado_siguiente', function (Blueprint $table) {
            $table->id();
            $table->foreignId('estado_actual_id')->constrained('estados_solicitud')->onDelete('cascade');
            $table->foreignId('estado_siguiente_id')->constrained('estados_solicitud')->onDelete('cascade');
            $table->timestamps();

            $table->unique(['estado_actual_id', 'estado_siguiente_id'], 'estado_flujo_unique');
        });

        // Tabla para roles que pueden asignar cada estado
        Schema::create('estado_rol', function (Blueprint $table) {
            $table->id();
            $table->foreignId('estado_solicitud_id')->constrained('estados_solicitud')->onDelete('cascade');
            $table->unsignedBigInteger('role_id');
            $table->timestamps();

            $table->unique(['estado_solicitud_id', 'role_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('estado_rol');
        Schema::dropIfExists('estado_siguiente');
        Schema::dropIfExists('estados_solicitud');
    }
};
