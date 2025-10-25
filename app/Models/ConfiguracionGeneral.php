<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ConfiguracionGeneral extends Model
{
    use HasFactory;

    protected $table = 'configuracion_general';

    protected $fillable = [
        // Información General
        'nombre_entidad',
        'nit',
        'direccion',
        'ciudad',
        'departamento',
        'telefono_principal',
        'telefono_secundario',
        'email_contacto',
        'sitio_web',
        'logo_url',
        'slogan',

        // Horarios
        'horario_lunes_viernes_desde',
        'horario_lunes_viernes_hasta',
        'habilitar_sabados',
        'horario_sabado_desde',
        'horario_sabado_hasta',
        'enviar_recordatorio_vencidas',
        'hora_recordatorio_vencidas',
        'enviar_recordatorio_alertas',
        'hora_recordatorio_alertas',

        // Archivos
        'tam_max_archivo_mb',
        'tam_max_total_mb',

        // Documentos
        'formato_doc_pdf',
        'formato_doc_doc',
        'formato_doc_docx',
        'formato_doc_xls',
        'formato_doc_xlsx',

        // Imágenes
        'formato_img_jpg',
        'formato_img_png',
        'formato_img_gif',
        'formato_img_bmp',
        'formato_img_tiff',

        // Otros
        'formato_otros_zip',
        'formato_otros_rar',
        'formato_otros_7z',

        // Auditoría
        'created_by',
    ];


    protected $casts = [
        // Booleans
        'habilitar_sabados' => 'boolean',
        'enviar_recordatorio_vencidas' => 'boolean',
        'enviar_recordatorio_alertas' => 'boolean',

        'formato_doc_pdf'  => 'boolean',
        'formato_doc_doc'  => 'boolean',
        'formato_doc_docx' => 'boolean',
        'formato_doc_xls'  => 'boolean',
        'formato_doc_xlsx' => 'boolean',

        'formato_img_jpg'  => 'boolean',
        'formato_img_png'  => 'boolean',
        'formato_img_gif'  => 'boolean',
        'formato_img_bmp'  => 'boolean',
        'formato_img_tiff' => 'boolean',

        'formato_otros_zip' => 'boolean',
        'formato_otros_rar' => 'boolean',
        'formato_otros_7z'  => 'boolean',

        // Enteros
        'tam_max_archivo_mb' => 'integer',
        'tam_max_total_mb'   => 'integer',
        'created_by'         => 'integer',

        // Fechas (timestamps)
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function getLogoUrlAttribute($value)
    {
        if (! $value) {
            return null;
        }

        // Si guardas rutas relativas en storage/app/public:
        if (strpos($value, 'http') === 0) {
            return $value; // ya es URL absoluta
        }

        return asset('storage/' . ltrim($value, '/'));
    }
}
