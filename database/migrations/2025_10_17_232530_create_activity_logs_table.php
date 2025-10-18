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
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();

            // Usuario que realizó la acción
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('user_name')->nullable(); // Guardar nombre por si el usuario se elimina
            $table->string('user_email')->nullable();

            // Información de la actividad
            $table->string('log_name')->nullable(); // Categoría: auth, user_management, role_management, etc.
            $table->text('description'); // Descripción legible de la actividad
            $table->string('event')->nullable(); // created, updated, deleted, logged_in, logged_out, etc.

            // Modelo afectado (si aplica)
            $table->string('subject_type')->nullable(); // Clase del modelo (User, Role, etc.)
            $table->unsignedBigInteger('subject_id')->nullable(); // ID del modelo

            // Modelo que realizó la acción (usualmente igual a user)
            $table->string('causer_type')->nullable();
            $table->unsignedBigInteger('causer_id')->nullable();

            // Datos adicionales
            $table->json('properties')->nullable(); // Datos antes/después, metadata, etc.

            // Información de la request
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent')->nullable();
            $table->string('url')->nullable();
            $table->string('method', 10)->nullable(); // GET, POST, PUT, DELETE

            // Severidad y estado
            $table->enum('severity', ['info', 'warning', 'error', 'critical'])->default('info');
            $table->boolean('is_important')->default(false); // Para marcar eventos importantes

            $table->timestamps();

            // Índices para mejorar rendimiento de consultas
            $table->index('user_id');
            $table->index('log_name');
            $table->index('event');
            $table->index(['subject_type', 'subject_id']);
            $table->index('created_at');
            $table->index('severity');

            // Foreign key
            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
