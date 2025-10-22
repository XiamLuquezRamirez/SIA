# 🚀 Guía Rápida - Tipos de Solicitud

## 📌 Lo que Necesitas Saber

Tu sistema ahora tiene una estructura moderna y normalizada para tipos de solicitud con **categorías**, **slugs** y **campos adicionales**.

## 🎯 Formato JSON Soportado

```json
{
  "codigo": "CERT-NOM-001",
  "nombre": "Certificado de Nomenclatura",
  "slug": "certificado-nomenclatura",
  "categoria_id": 1,
  "descripcion": "...",
  "instrucciones": "...",
  "area_responsable_id": 4,
  "requiere_pago": false,
  "valor_tramite": null,
  "dias_respuesta": 3,
  "dias_alerta": 2,
  "color": "#3B82F6",
  "icono": "📄",
  "requiere_documentos": true,
  "documentos_requeridos": [...],
  "activo": true
}
```

## ⚡ Uso Rápido

### 1. Crear un Tipo de Solicitud

```php
use App\Models\TipoSolicitud;

$tipo = TipoSolicitud::create([
    'codigo' => 'CERT-NOM-001',
    'nombre' => 'Certificado de Nomenclatura',
    'slug' => 'certificado-nomenclatura',
    'categoria_id' => 1, // 1=Certificados, 2=Permisos, etc.
    'descripcion' => 'Certificado oficial de nomenclatura',
    'instrucciones' => 'Presente los documentos...',
    'area_id' => 4,
    'dias_respuesta' => 3,
    'dias_alerta' => 2,
    'requiere_pago' => false,
    'valor_tramite' => null,
    'color' => '#3B82F6',
    'icono' => '📄',
    'requiere_documentos' => true,
    'documentos_requeridos' => [
        ['nombre' => 'Cédula', 'obligatorio' => true]
    ],
    'activo' => true
]);
```

### 2. Consultar Tipos con Categoría

```php
// Con relación categoria
$tipos = TipoSolicitud::with('categoria')->get();

foreach ($tipos as $tipo) {
    echo $tipo->categoria->nombre; // "Certificados"
    echo $tipo->categoria->icono; // "📄"
}
```

### 3. Filtrar por Categoría

```php
// Por ID
$certificados = TipoSolicitud::categoria(1)->get();

// Por slug
$certificados = TipoSolicitud::categoria('certificados')->get();
```

### 4. Listar Categorías

```php
use App\Models\Categoria;

$categorias = Categoria::activas()->ordenado()->get();

foreach ($categorias as $cat) {
    echo $cat->nombre_con_icono; // "📄 Certificados"
    echo $cat->tipos_solicitud_activos_count; // 15
}
```

## 📊 Categorías Disponibles

| ID | Nombre | Slug | Icono | Color |
|----|--------|------|-------|-------|
| 1 | Certificados | certificados | 📄 | #3B82F6 |
| 2 | Permisos | permisos | ✅ | #10B981 |
| 3 | Licencias | licencias | 🏗️ | #F59E0B |
| 4 | Consultas | consultas | ❓ | #8B5CF6 |
| 5 | Quejas y Reclamos | quejas-reclamos | ⚠️ | #EF4444 |

## 🔄 Campos con Alias (Compatibilidad)

Estos campos funcionan con **ambos nombres**:

```php
// AMBAS FORMAS FUNCIONAN:

// ✅ Forma 1 (nueva)
$tipo->dias_respuesta = 3;
$tipo->valor_tramite = 0;
$tipo->area_responsable_id = 4;

// ✅ Forma 2 (anterior, aún funciona)
$tipo->tiempo_respuesta_dias = 3;
$tipo->costo = 0;
$tipo->area_id = 4;
```

## 🎨 Campos Nuevos

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `slug` | string | URL amigable (único) | "certificado-nomenclatura" |
| `categoria_id` | int | FK a categorias | 1 |
| `instrucciones` | text | Guía para usuario | "Presente los docs..." |
| `dias_alerta` | int | Días antes de vencimiento | 2 |
| `requiere_documentos` | bool | Flag de documentos | true |

## 📡 API Endpoints

### Obtener Categorías
```http
GET /admin/api/tipos-solicitud/categorias

{
  "success": true,
  "categorias": [
    {
      "id": 1,
      "nombre": "Certificados",
      "slug": "certificados",
      "color": "#3B82F6",
      "icono": "📄",
      "nombre_con_icono": "📄 Certificados",
      "tipos_count": 15
    }
  ]
}
```

### Listar Tipos (con filtro)
```http
GET /admin/api/tipos-solicitud?categoria_id=1
GET /admin/api/tipos-solicitud?area_id=4
GET /admin/api/tipos-solicitud?search=certificado
```

## ⚠️ Validaciones Importantes

```php
// slug: único, solo minúsculas, números y guiones
'slug' => 'required|unique:tipos_solicitud,slug|regex:/^[a-z0-9-]+$/'

// categoria_id: debe existir en tabla categorias
'categoria_id' => 'required|exists:categorias,id'

// dias_respuesta y dias_alerta: enteros positivos
'dias_respuesta' => 'required|integer|min:1'
'dias_alerta' => 'nullable|integer|min:1'
```

## 🎯 Ejemplos de Código Real

### Ejemplo 1: Crear Certificado

```php
$certificado = TipoSolicitud::create([
    'codigo' => 'CERT-USO-001',
    'nombre' => 'Certificado de Uso de Suelo',
    'slug' => 'certificado-uso-suelo',
    'categoria_id' => 1, // Certificados
    'descripcion' => 'Certificado de uso del suelo urbano',
    'instrucciones' => 'Presente certificado de tradición actualizado',
    'area_id' => 4, // Planeación
    'dias_respuesta' => 5,
    'dias_alerta' => 2,
    'requiere_pago' => true,
    'valor_tramite' => 45000,
    'color' => '#3B82F6',
    'icono' => '📄',
    'requiere_documentos' => true,
    'documentos_requeridos' => [
        ['nombre' => 'Certificado de Tradición', 'obligatorio' => true],
        ['nombre' => 'Cédula', 'obligatorio' => true]
    ],
    'activo' => true
]);
```

### Ejemplo 2: Crear Permiso

```php
$permiso = TipoSolicitud::create([
    'codigo' => 'PERM-EVENT-001',
    'nombre' => 'Permiso para Evento Público',
    'slug' => 'permiso-evento-publico',
    'categoria_id' => 2, // Permisos
    'descripcion' => 'Permiso para realización de eventos públicos',
    'instrucciones' => 'Presentar con 15 días de anticipación',
    'area_id' => 5,
    'dias_respuesta' => 10,
    'dias_alerta' => 5,
    'requiere_pago' => false,
    'color' => '#10B981',
    'icono' => '✅',
    'activo' => true
]);
```

### Ejemplo 3: Filtrar y Mostrar

```php
// Obtener todos los certificados activos
$certificados = TipoSolicitud::with('categoria')
    ->categoria(1) // o categoria('certificados')
    ->where('activo', true)
    ->orderBy('nombre')
    ->get();

// Mostrar
foreach ($certificados as $cert) {
    echo "{$cert->categoria->icono} {$cert->nombre}\n";
    echo "Slug: {$cert->slug}\n";
    echo "Días respuesta: {$cert->dias_respuesta}\n";
    echo "Alerta: {$cert->dias_alerta} días antes\n";
    echo "Requiere docs: " . ($cert->requiere_documentos ? 'Sí' : 'No') . "\n";
    echo "---\n";
}
```

## 🔍 Verificar Estado

```bash
# Ver categorías creadas
php artisan tinker --execute="echo json_encode(DB::table('categorias')->get(), JSON_PRETTY_PRINT);"

# Ver tipos con slug
php artisan tinker --execute="echo json_encode(DB::table('tipos_solicitud')->select('id','nombre','slug','categoria_id')->get(), JSON_PRETTY_PRINT);"
```

## 🎨 Menú de Configuración

Accede al menú:
- **Administración** → **Configuración** → **Categorías**
- Ruta: `/admin/configuracion/categorias`

## 📚 Documentación Completa

Para más detalles, consulta:
- `IMPLEMENTACION_COMPLETA.md` - Guía técnica completa
- `RESTRUCTURACION_TIPOS_SOLICITUD.md` - Detalles de la restructuración
- `RESUMEN_RESTRUCTURACION.md` - Resumen ejecutivo

## ❓ Preguntas Frecuentes

### ¿Puedo seguir usando los nombres anteriores?
**Sí**, todos los nombres anteriores siguen funcionando gracias a accessors/mutators.

### ¿Se perdieron datos en la migración?
**No**, todos los datos fueron migrados automáticamente y se mantiene compatibilidad total.

### ¿Cómo agrego una nueva categoría?
```php
Categoria::create([
    'nombre' => 'Nueva Categoría',
    'slug' => 'nueva-categoria',
    'descripcion' => 'Descripción...',
    'color' => '#6B7280',
    'icono' => '📋',
    'orden' => 10,
    'activo' => true
]);
```

### ¿El slug se genera automáticamente?
No en el código, pero puedes usar:
```php
use Illuminate\Support\Str;
$slug = Str::slug($nombre);
```

## 🎉 ¡Listo!

Tu sistema está actualizado y listo para usar el nuevo formato. Todo es retrocompatible, así que tu código existente seguirá funcionando sin cambios.

---

**¿Necesitas ayuda?** Consulta la documentación completa o revisa los ejemplos de código.

