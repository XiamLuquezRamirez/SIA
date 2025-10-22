<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PlantillasDocumentosSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Plantilla 1: Certificado de Nomenclatura Estándar
        $plantilla1 = DB::table('plantillas_documentos')->insertGetId([
            'nombre' => 'Certificado de Nomenclatura Estándar',
            'slug' => 'certificado-nomenclatura-estandar',
            'tipo_documento' => 'certificado',
            'descripcion' => 'Plantilla estándar para certificados de nomenclatura domiciliaria',
            'contenido_html' => $this->getHtmlCertificadoNomenclatura(),
            'contenido_css' => $this->getCssCertificadoNomenclatura(),
            'encabezado_html' => $this->getEncabezadoOficial(),
            'pie_pagina_html' => $this->getPiePaginaOficial(),
            'orientacion' => 'vertical',
            'tamano_pagina' => 'carta',
            'margen_superior' => 25,
            'margen_inferior' => 25,
            'margen_izquierdo' => 25,
            'margen_derecho' => 25,
            'formato_salida' => 'pdf',
            'numero_copias' => 1,
            'variables_usadas' => json_encode([
                '{{solicitante.nombre_completo}}',
                '{{solicitante.numero_documento}}',
                '{{solicitud.radicado}}',
                '{{campo.direccion_predio}}',
                '{{campo.barrio}}',
                '{{campo.estrato}}',
                '{{sistema.fecha_actual_letras}}',
                '{{sistema.ciudad}}'
            ]),
            'total_variables' => 8,
            'activo' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Plantilla 2: Concepto de Uso del Suelo
        $plantilla2 = DB::table('plantillas_documentos')->insertGetId([
            'nombre' => 'Concepto de Uso del Suelo',
            'slug' => 'concepto-uso-suelo',
            'tipo_documento' => 'concepto_tecnico',
            'descripcion' => 'Plantilla para conceptos de uso del suelo',
            'contenido_html' => $this->getHtmlConceptoUsoSuelo(),
            'contenido_css' => $this->getCssCertificadoNomenclatura(),
            'encabezado_html' => $this->getEncabezadoOficial(),
            'pie_pagina_html' => $this->getPiePaginaOficial(),
            'orientacion' => 'vertical',
            'tamano_pagina' => 'carta',
            'margen_superior' => 25,
            'margen_inferior' => 25,
            'margen_izquierdo' => 25,
            'margen_derecho' => 25,
            'formato_salida' => 'pdf',
            'numero_copias' => 1,
            'variables_usadas' => json_encode([
                '{{solicitante.nombre_completo}}',
                '{{solicitante.numero_documento}}',
                '{{solicitud.radicado}}',
                '{{campo.direccion_predio}}',
                '{{campo.barrio}}',
                '{{campo.uso_solicitado}}',
                '{{campo.area_metros}}',
                '{{campo.normativa_aplicable}}',
                '{{sistema.fecha_actual_letras}}',
                '{{sistema.ciudad}}',
                '{{campo.concepto_favorable}}',
                '{{campo.observaciones}}'
            ]),
            'total_variables' => 12,
            'activo' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Plantilla 3: Acta de Inspección Técnica
        $plantilla3 = DB::table('plantillas_documentos')->insertGetId([
            'nombre' => 'Acta de Inspección Técnica',
            'slug' => 'acta-inspeccion-tecnica',
            'tipo_documento' => 'acta',
            'descripcion' => 'Plantilla para actas de inspección técnica en campo',
            'contenido_html' => $this->getHtmlActaInspeccion(),
            'contenido_css' => $this->getCssCertificadoNomenclatura(),
            'encabezado_html' => $this->getEncabezadoOficial(),
            'pie_pagina_html' => $this->getPiePaginaOficial(),
            'orientacion' => 'vertical',
            'tamano_pagina' => 'oficio',
            'margen_superior' => 25,
            'margen_inferior' => 25,
            'margen_izquierdo' => 25,
            'margen_derecho' => 25,
            'formato_salida' => 'pdf',
            'numero_copias' => 1,
            'variables_usadas' => json_encode([
                '{{solicitante.nombre_completo}}',
                '{{solicitud.radicado}}',
                '{{campo.direccion_predio}}',
                '{{campo.fecha_inspeccion}}',
                '{{campo.hora_inspeccion}}',
                '{{campo.hallazgos}}',
                '{{campo.recomendaciones}}',
                '{{campo.cumple_normativa}}',
                '{{funcionario.nombre}}',
                '{{funcionario.cargo}}',
                '{{sistema.fecha_actual_letras}}',
                '{{sistema.ciudad}}'
            ]),
            'total_variables' => 12,
            'activo' => false, // Inactiva para ejemplo
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Asociar plantillas a tipos de solicitud (asumiendo que ya existen tipos)
        // Tipo de solicitud ID = 1 (ejemplo)
        $tipoSolicitudId = DB::table('tipos_solicitud')->first()->id ?? null;

        if ($tipoSolicitudId) {
            // Asociación tipo-plantilla
            $pivot1 = DB::table('tipo_solicitud_plantilla')->insert([
                'tipo_solicitud_id' => $tipoSolicitudId,
                'plantilla_documento_id' => $plantilla1,
                'generar_automatico' => true,
                'momento_generacion' => 'al_aprobar',
                'nombre_archivo_template' => 'Certificado_{{radicado}}.pdf',
                'es_principal' => true,
                'orden' => 1,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            // Mapeo de variables para la plantilla 1
            $mapeos = [
                ['variable_plantilla' => '{{campo.direccion_predio}}', 'tipo_origen' => 'campo', 'campo_origen' => 'direccion'],
                ['variable_plantilla' => '{{campo.barrio}}', 'tipo_origen' => 'campo', 'campo_origen' => 'barrio'],
                ['variable_plantilla' => '{{campo.estrato}}', 'tipo_origen' => 'campo', 'campo_origen' => 'estrato'],
                ['variable_plantilla' => '{{solicitante.nombre_completo}}', 'tipo_origen' => 'solicitante', 'campo_origen' => 'nombre_completo'],
                ['variable_plantilla' => '{{solicitante.numero_documento}}', 'tipo_origen' => 'solicitante', 'campo_origen' => 'numero_documento'],
                ['variable_plantilla' => '{{solicitud.radicado}}', 'tipo_origen' => 'solicitud', 'campo_origen' => 'radicado'],
                ['variable_plantilla' => '{{sistema.fecha_actual_letras}}', 'tipo_origen' => 'sistema', 'campo_origen' => 'fecha_actual_letras'],
                ['variable_plantilla' => '{{sistema.ciudad}}', 'tipo_origen' => 'fijo', 'valor_fijo' => 'Valledupar'],
            ];

            foreach ($mapeos as $mapeo) {
                DB::table('mapeo_variables_plantilla')->insert([
                    'tipo_solicitud_id' => $tipoSolicitudId,
                    'plantilla_documento_id' => $plantilla1,
                    'variable_plantilla' => $mapeo['variable_plantilla'],
                    'tipo_origen' => $mapeo['tipo_origen'],
                    'campo_origen' => $mapeo['campo_origen'] ?? null,
                    'valor_fijo' => $mapeo['valor_fijo'] ?? null,
                    'transformacion' => null,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }

            // Firmantes para la plantilla 1
            $firmantes = [
                [
                    'rol_firmante' => 'funcionario_asignado',
                    'tipo_firma' => 'digital',
                    'posicion' => 'inferior_izquierda',
                    'orden' => 1,
                    'obligatorio' => true,
                    'enviar_notificacion' => true,
                    'permitir_delegacion' => false
                ],
                [
                    'rol_firmante' => 'coordinador_area',
                    'tipo_firma' => 'digital',
                    'posicion' => 'inferior_centro',
                    'orden' => 2,
                    'obligatorio' => true,
                    'enviar_notificacion' => true,
                    'permitir_delegacion' => false
                ],
                [
                    'rol_firmante' => 'director_oapm',
                    'tipo_firma' => 'digital',
                    'posicion' => 'inferior_derecha',
                    'orden' => 3,
                    'obligatorio' => true,
                    'enviar_notificacion' => true,
                    'permitir_delegacion' => true
                ]
            ];

            foreach ($firmantes as $firmante) {
                DB::table('firmantes_plantilla')->insert([
                    'tipo_solicitud_id' => $tipoSolicitudId,
                    'plantilla_documento_id' => $plantilla1,
                    'rol_firmante' => $firmante['rol_firmante'],
                    'tipo_firma' => $firmante['tipo_firma'],
                    'posicion' => $firmante['posicion'],
                    'orden' => $firmante['orden'],
                    'obligatorio' => $firmante['obligatorio'],
                    'enviar_notificacion' => $firmante['enviar_notificacion'],
                    'permitir_delegacion' => $firmante['permitir_delegacion'],
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }
        }
    }

    /**
     * HTML para Certificado de Nomenclatura
     */
    private function getHtmlCertificadoNomenclatura(): string
    {
        return <<<'HTML'
<div class="certificado">
    <div class="titulo-principal">
        <h1>CERTIFICADO DE NOMENCLATURA</h1>
    </div>

    <div class="radicado">
        <p><strong>Radicado:</strong> {{solicitud.radicado}}</p>
    </div>

    <div class="contenido">
        <p class="parrafo">La <strong>Oficina de Planeación Municipal de {{sistema.ciudad}}</strong> certifica que:</p>

        <p class="parrafo">El predio ubicado en <strong>{{campo.direccion_predio}}</strong>, del barrio <strong>{{campo.barrio}}</strong>, estrato <strong>{{campo.estrato}}</strong>, corresponde a nomenclatura debidamente asignada según los registros de esta dependencia.</p>

        <p class="parrafo"><strong>Solicitante:</strong> {{solicitante.nombre_completo}}<br>
        <strong>Documento:</strong> {{solicitante.numero_documento}}</p>

        <p class="parrafo">Se expide el presente certificado en {{sistema.ciudad}}, {{sistema.fecha_actual_letras}}.</p>
    </div>

    <div class="firmas">
        <!-- Las firmas se agregarán dinámicamente -->
    </div>
</div>
HTML;
    }

    /**
     * HTML para Concepto de Uso del Suelo
     */
    private function getHtmlConceptoUsoSuelo(): string
    {
        return <<<'HTML'
<div class="concepto">
    <div class="titulo-principal">
        <h1>CONCEPTO DE USO DEL SUELO</h1>
    </div>

    <div class="radicado">
        <p><strong>Radicado:</strong> {{solicitud.radicado}}</p>
    </div>

    <div class="contenido">
        <p class="parrafo"><strong>SOLICITANTE:</strong> {{solicitante.nombre_completo}}<br>
        <strong>DOCUMENTO:</strong> {{solicitante.numero_documento}}</p>

        <p class="parrafo"><strong>PREDIO:</strong> {{campo.direccion_predio}}, Barrio {{campo.barrio}}</p>

        <p class="parrafo"><strong>USO SOLICITADO:</strong> {{campo.uso_solicitado}}<br>
        <strong>ÁREA:</strong> {{campo.area_metros}} m²</p>

        <p class="parrafo"><strong>NORMATIVA APLICABLE:</strong><br>{{campo.normativa_aplicable}}</p>

        <p class="parrafo"><strong>CONCEPTO:</strong> {{campo.concepto_favorable}}</p>

        <p class="parrafo"><strong>OBSERVACIONES:</strong><br>{{campo.observaciones}}</p>

        <p class="parrafo">Expedido en {{sistema.ciudad}}, {{sistema.fecha_actual_letras}}.</p>
    </div>
</div>
HTML;
    }

    /**
     * HTML para Acta de Inspección
     */
    private function getHtmlActaInspeccion(): string
    {
        return <<<'HTML'
<div class="acta">
    <div class="titulo-principal">
        <h1>ACTA DE INSPECCIÓN TÉCNICA</h1>
    </div>

    <div class="radicado">
        <p><strong>Radicado:</strong> {{solicitud.radicado}}</p>
    </div>

    <div class="contenido">
        <p class="parrafo"><strong>FECHA DE INSPECCIÓN:</strong> {{campo.fecha_inspeccion}}<br>
        <strong>HORA:</strong> {{campo.hora_inspeccion}}</p>

        <p class="parrafo"><strong>LUGAR:</strong> {{campo.direccion_predio}}</p>

        <p class="parrafo"><strong>SOLICITANTE:</strong> {{solicitante.nombre_completo}}</p>

        <p class="parrafo"><strong>HALLAZGOS:</strong><br>{{campo.hallazgos}}</p>

        <p class="parrafo"><strong>RECOMENDACIONES:</strong><br>{{campo.recomendaciones}}</p>

        <p class="parrafo"><strong>CUMPLE NORMATIVA:</strong> {{campo.cumple_normativa}}</p>

        <p class="parrafo"><strong>INSPECTOR:</strong> {{funcionario.nombre}}<br>
        <strong>CARGO:</strong> {{funcionario.cargo}}</p>

        <p class="parrafo">Firmado en {{sistema.ciudad}}, {{sistema.fecha_actual_letras}}.</p>
    </div>
</div>
HTML;
    }

    /**
     * CSS compartido
     */
    private function getCssCertificadoNomenclatura(): string
    {
        return <<<'CSS'
body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 12pt;
    line-height: 1.6;
    color: #333;
}

.certificado, .concepto, .acta {
    width: 100%;
    padding: 20px;
}

.titulo-principal {
    text-align: center;
    margin-bottom: 30px;
    border-bottom: 2px solid #2563eb;
    padding-bottom: 10px;
}

.titulo-principal h1 {
    font-size: 18pt;
    color: #1e40af;
    margin: 0;
}

.radicado {
    text-align: right;
    margin-bottom: 20px;
    font-size: 10pt;
}

.contenido {
    margin: 20px 0;
}

.parrafo {
    text-align: justify;
    margin-bottom: 15px;
}

.firmas {
    margin-top: 60px;
}
CSS;
    }

    /**
     * Encabezado oficial
     */
    private function getEncabezadoOficial(): string
    {
        return <<<'HTML'
<div style="text-align: center; border-bottom: 1px solid #ddd; padding-bottom: 10px;">
    <h2 style="margin: 0; color: #1e40af; font-size: 16pt;">ALCALDÍA DE VALLEDUPAR</h2>
    <p style="margin: 5px 0; font-size: 10pt;">Oficina de Planeación Municipal</p>
</div>
HTML;
    }

    /**
     * Pie de página oficial
     */
    private function getPiePaginaOficial(): string
    {
        return <<<'HTML'
<div style="text-align: center; border-top: 1px solid #ddd; padding-top: 10px; font-size: 8pt; color: #666;">
    <p>Calle 16 #5-20, Centro - Valledupar, Cesar<br>
    Tel: (605) 574 5555 | www.valledupar.gov.co</p>
</div>
HTML;
    }
}
