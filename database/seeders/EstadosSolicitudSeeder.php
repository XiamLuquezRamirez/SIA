<?php

namespace Database\Seeders;

use App\Models\EstadoSolicitud;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EstadosSolicitudSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::beginTransaction();

        try {
            // Estados iniciales del sistema
            $estados = [
                [
                    'codigo' => 'RADICADA',
                    'nombre' => 'Radicada',
                    'slug' => 'radicada',
                    'descripcion' => 'Solicitud recibida y radicada en el sistema, pendiente de revisión inicial.',
                    'tipo' => 'inicial',
                    'es_inicial' => true,
                    'es_final' => false,
                    'es_sistema' => true,
                    'notifica_solicitante' => true,
                    'permite_edicion' => true,
                    'requiere_resolucion' => false,
                    'genera_documento' => false,
                    'pausa_sla' => false,
                    'reinicia_sla' => false,
                    'color' => '#3B82F6',
                    'icono' => '📥',
                    'orden' => 1,
                    'activo' => true,
                ],
                [
                    'codigo' => 'EN_REVISION',
                    'nombre' => 'En Revisión',
                    'slug' => 'en-revision',
                    'descripcion' => 'La solicitud está siendo revisada por el equipo correspondiente para validar que cumple con los requisitos.',
                    'tipo' => 'proceso',
                    'es_inicial' => false,
                    'es_final' => false,
                    'es_sistema' => true,
                    'notifica_solicitante' => true,
                    'permite_edicion' => false,
                    'requiere_resolucion' => false,
                    'genera_documento' => false,
                    'pausa_sla' => false,
                    'reinicia_sla' => false,
                    'color' => '#F59E0B',
                    'icono' => '🔍',
                    'orden' => 2,
                    'activo' => true,
                ],
                [
                    'codigo' => 'INFO_INCOMPLETA',
                    'nombre' => 'Información Incompleta',
                    'slug' => 'informacion-incompleta',
                    'descripcion' => 'La solicitud requiere información adicional o documentos complementarios del solicitante.',
                    'tipo' => 'bloqueante',
                    'es_inicial' => false,
                    'es_final' => false,
                    'es_sistema' => true,
                    'notifica_solicitante' => true,
                    'permite_edicion' => true,
                    'requiere_resolucion' => false,
                    'genera_documento' => false,
                    'pausa_sla' => true,
                    'reinicia_sla' => false,
                    'color' => '#6B7280',
                    'icono' => '⚠️',
                    'orden' => 3,
                    'activo' => true,
                ],
                [
                    'codigo' => 'EN_PROCESO',
                    'nombre' => 'En Proceso',
                    'slug' => 'en-proceso',
                    'descripcion' => 'La solicitud está siendo procesada por el equipo asignado.',
                    'tipo' => 'proceso',
                    'es_inicial' => false,
                    'es_final' => false,
                    'es_sistema' => true,
                    'notifica_solicitante' => true,
                    'permite_edicion' => false,
                    'requiere_resolucion' => false,
                    'genera_documento' => false,
                    'pausa_sla' => false,
                    'reinicia_sla' => false,
                    'color' => '#F97316',
                    'icono' => '⚙️',
                    'orden' => 4,
                    'activo' => true,
                ],
                [
                    'codigo' => 'APROBADA',
                    'nombre' => 'Aprobada',
                    'slug' => 'aprobada',
                    'descripcion' => 'La solicitud ha sido aprobada exitosamente.',
                    'tipo' => 'final',
                    'es_inicial' => false,
                    'es_final' => true,
                    'es_sistema' => true,
                    'notifica_solicitante' => true,
                    'permite_edicion' => false,
                    'requiere_resolucion' => true,
                    'genera_documento' => true,
                    'pausa_sla' => false,
                    'reinicia_sla' => false,
                    'color' => '#10B981',
                    'icono' => '✅',
                    'orden' => 5,
                    'activo' => true,
                ],
                [
                    'codigo' => 'RECHAZADA',
                    'nombre' => 'Rechazada',
                    'slug' => 'rechazada',
                    'descripcion' => 'La solicitud ha sido rechazada por no cumplir con los requisitos o políticas establecidas.',
                    'tipo' => 'final',
                    'es_inicial' => false,
                    'es_final' => true,
                    'es_sistema' => true,
                    'notifica_solicitante' => true,
                    'permite_edicion' => false,
                    'requiere_resolucion' => true,
                    'genera_documento' => true,
                    'pausa_sla' => false,
                    'reinicia_sla' => false,
                    'color' => '#EF4444',
                    'icono' => '❌',
                    'orden' => 6,
                    'activo' => true,
                ],
                [
                    'codigo' => 'ANULADA',
                    'nombre' => 'Anulada',
                    'slug' => 'anulada',
                    'descripcion' => 'La solicitud ha sido anulada por el solicitante o por el sistema.',
                    'tipo' => 'final',
                    'es_inicial' => false,
                    'es_final' => true,
                    'es_sistema' => true,
                    'notifica_solicitante' => true,
                    'permite_edicion' => false,
                    'requiere_resolucion' => false,
                    'genera_documento' => false,
                    'pausa_sla' => false,
                    'reinicia_sla' => false,
                    'color' => '#9CA3AF',
                    'icono' => '🚫',
                    'orden' => 7,
                    'activo' => true,
                ],
            ];

            // Crear estados
            $estadosCreados = [];
            foreach ($estados as $estado) {
                $estadosCreados[$estado['codigo']] = EstadoSolicitud::create($estado);
                $this->command->info("✓ Estado '{$estado['nombre']}' creado");
            }

            // Definir flujo de estados (transiciones permitidas)
            $transiciones = [
                'RADICADA' => ['EN_REVISION', 'INFO_INCOMPLETA', 'ANULADA'],
                'EN_REVISION' => ['EN_PROCESO', 'INFO_INCOMPLETA', 'RECHAZADA', 'ANULADA'],
                'INFO_INCOMPLETA' => ['EN_REVISION', 'ANULADA'],
                'EN_PROCESO' => ['APROBADA', 'RECHAZADA', 'INFO_INCOMPLETA', 'ANULADA'],
                'APROBADA' => [], // Estado final, no tiene transiciones
                'RECHAZADA' => [], // Estado final, no tiene transiciones
                'ANULADA' => [], // Estado final, no tiene transiciones
            ];

            // Sincronizar transiciones
            foreach ($transiciones as $estadoActualCodigo => $estadosSiguientes) {
                $estadoActual = $estadosCreados[$estadoActualCodigo];
                $siguientesIds = [];

                foreach ($estadosSiguientes as $siguienteCodigo) {
                    $siguientesIds[] = $estadosCreados[$siguienteCodigo]->id;
                }

                if (!empty($siguientesIds)) {
                    $estadoActual->estadosSiguientes()->sync($siguientesIds);
                    $this->command->info("✓ Transiciones configuradas para '{$estadoActual->nombre}'");
                }
            }

            DB::commit();
            $this->command->info('✓ Seeder de estados completado exitosamente');

        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error('Error al ejecutar seeder: ' . $e->getMessage());
            throw $e;
        }
    }
}
