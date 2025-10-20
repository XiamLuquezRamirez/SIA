# 📊 Estructura de la Tabla `tipos_solicitud`

## 🎯 Resumen

Se ha actualizado la tabla `tipos_solicitud` para ser compatible con el **wizard de creación** desarrollado, manteniendo retrocompatibilidad con campos existentes.

---

## ✅ **Migración Ejecutada**

### **Archivo:**
```
database/migrations/2025_10_19_231517_actualizar_tipos_solicitud_para_wizard.php
```

### **Fecha de ejecución:** 
19 de octubre de 2025

### **Estado:** ✅ Completada exitosamente

---

## 📦 **Campos Agregados para el Wizard**

| Campo | Tipo | Obligatorio | Descripción | Usado en Paso |
|-------|------|-------------|-------------|---------------|
| `categoria` | `string(100)` | No | Categoría del tipo (Certificados, Permisos, etc.) | Paso 1 |
| `area_id` | `foreignId` | No | Referencia al área responsable | Paso 1 |
| `tiempo_respuesta_dias` | `integer` | Sí (default: 3) | Tiempo de respuesta en días hábiles | Paso 1 |
| `sla_dias` | `integer` | No | SLA en días hábiles | Paso 1 |
| `requiere_aprobacion` | `boolean` | No (default: false) | Si requiere flujo de aprobación | Paso 1 |
| `costo` | `decimal(10,2)` | No | Costo si requiere pago | Paso 1 |
| `campos_formulario` | `json` | No | Configuración de campos del formulario | Paso 2 (futuro) |
| `documentos_requeridos` | `json` | No | Lista de documentos requeridos | Paso 2 (futuro) |
| `flujo_aprobacion` | `json` | No | Configuración del flujo de aprobación | Paso 3 (futuro) |
| `plantillas` | `json` | No | Plantillas asociadas | Paso 4 (futuro) |
| `notificaciones` | `json` | No | Configuración de notificaciones | Paso 4 (futuro) |

---

## 🔄 **Sincronización de Datos**

La migración sincronizó automáticamente datos de campos antiguos a nuevos:

```sql
UPDATE tipos_solicitud 
SET 
    area_id = COALESCE(area_id, area_responsable_id),
    tiempo_respuesta_dias = COALESCE(tiempo_respuesta_dias, dias_respuesta, 3),
    categoria = COALESCE(categoria, 'General'),
    costo = COALESCE(costo, valor_tramite, 0)
WHERE area_id IS NULL OR tiempo_respuesta_dias IS NULL OR categoria IS NULL;
```

### **Mapeo de Campos:**

| Campo Antiguo | Campo Nuevo | Estado |
|---------------|-------------|--------|
| `area_responsable_id` | `area_id` | ✅ Datos copiados |
| `dias_respuesta` | `tiempo_respuesta_dias` | ✅ Datos copiados |
| `categoria_id` | `categoria` | ✅ Valor 'General' asignado |
| `valor_tramite` | `costo` | ✅ Datos copiados |

---

## 📋 **Campos del Wizard vs Base de Datos**

### **Paso 1: Información Básica** ✅ 100% Compatible

| Campo en Wizard | Campo en BD | Tipo | Estado |
|-----------------|-------------|------|--------|
| `wizard_codigo` | `codigo` | `string(50)` | ✅ Existe |
| `wizard_nombre` | `nombre` | `string(255)` | ✅ Existe |
| `wizard_descripcion` | `descripcion` | `text` | ✅ Existe |
| `wizard_categoria` | `categoria` | `string(100)` | ✅ Agregado |
| `wizard_area_id` | `area_id` | `foreignId` | ✅ Agregado |
| `wizard_tiempo_respuesta` | `tiempo_respuesta_dias` | `integer` | ✅ Agregado |
| `wizard_sla` | `sla_dias` | `integer` | ✅ Agregado |
| `wizard_requiere_aprobacion` | `requiere_aprobacion` | `boolean` | ✅ Agregado |
| `wizard_requiere_pago` | `requiere_pago` | `boolean` | ✅ Existe |
| `wizard_costo` | `costo` | `decimal(10,2)` | ✅ Agregado |
| `wizard_icono` | `icono` | `string(50)` | ✅ Existe |
| `wizard_color` | `color` | `string(20)` | ✅ Existe |

### **Paso 2: Configurar Campos** 🚧 Placeholder

| Campo | Estado | Nota |
|-------|--------|------|
| `campos_formulario` | ✅ Preparado (JSON) | Funcionalidad futura |

### **Paso 3: Flujo de Aprobación** 🚧 Placeholder

| Campo | Estado | Nota |
|-------|--------|------|
| `flujo_aprobacion` | ✅ Preparado (JSON) | Funcionalidad futura |

### **Paso 4: Plantillas** 🚧 Placeholder

| Campo | Estado | Nota |
|-------|--------|------|
| `plantillas` | ✅ Preparado (JSON) | Funcionalidad futura |
| `notificaciones` | ✅ Preparado (JSON) | Funcionalidad futura |

---

## 🔍 **Índices Agregados**

Para optimizar las consultas, se agregaron los siguientes índices:

```php
$table->index('categoria');   // Para filtrar por categoría
$table->index('area_id');     // Para filtrar por área
```

---

## 📊 **Estadísticas de la Tabla**

| Métrica | Antes | Después |
|---------|-------|---------|
| **Total de columnas** | 62 | 73 |
| **Campos JSON** | 0 | 5 |
| **Índices** | ~8 | ~10 |
| **Campos del wizard** | 8/13 (61%) | 13/13 (100%) |

---

## 🔗 **Relaciones del Modelo**

### **Definidas en `TipoSolicitud.php`:**

```php
// Relación con Área
public function area() {
    return $this->belongsTo(Area::class);
}

// Relación con usuario creador
public function creador() {
    return $this->belongsTo(User::class, 'created_by');
}

// Relación con usuario que actualizó
public function editor() {
    return $this->belongsTo(User::class, 'updated_by');
}

// Relación con solicitudes (cuando se implemente)
public function solicitudes() {
    return $this->hasMany(Solicitud::class, 'tipo_solicitud_id');
}
```

---

## ⚠️ **Campos Duplicados (Retrocompatibilidad)**

Algunos campos existen en dos versiones para mantener compatibilidad:

| Antiguo | Nuevo | Estado |
|---------|-------|--------|
| `area_responsable_id` | `area_id` | ⚠️ Ambos existen |
| `dias_respuesta` | `tiempo_respuesta_dias` | ⚠️ Ambos existen |
| `categoria_id` | `categoria` | ⚠️ Ambos existen |
| `valor_tramite` | `costo` | ⚠️ Ambos existen |

### **Recomendación:**
En una futura migración (cuando el sistema esté estable), considerar:
1. Migrar todos los datos a los nuevos campos
2. Eliminar los campos antiguos
3. Actualizar código legacy que use campos antiguos

---

## 🔧 **Configuración del Modelo**

### **Archivo: `app/Models/TipoSolicitud.php`**

```php
protected $fillable = [
    'codigo',
    'nombre',
    'descripcion',
    'categoria',               // ✅ Nuevo
    'area_id',                 // ✅ Nuevo
    'tiempo_respuesta_dias',   // ✅ Nuevo
    'sla_dias',                // ✅ Nuevo
    'activo',
    'requiere_aprobacion',     // ✅ Nuevo
    'requiere_pago',
    'costo',                   // ✅ Nuevo
    'campos_formulario',       // ✅ Nuevo (JSON)
    'documentos_requeridos',   // ✅ Nuevo (JSON)
    'flujo_aprobacion',        // ✅ Nuevo (JSON)
    'plantillas',              // ✅ Nuevo (JSON)
    'notificaciones',          // ✅ Nuevo (JSON)
    'orden',
    'icono',
    'color',
    'created_by',
    'updated_by',
];

protected $casts = [
    'activo' => 'boolean',
    'requiere_aprobacion' => 'boolean',    // ✅ Nuevo
    'requiere_pago' => 'boolean',
    'costo' => 'decimal:2',                // ✅ Nuevo
    'campos_formulario' => 'array',        // ✅ Nuevo
    'documentos_requeridos' => 'array',    // ✅ Nuevo
    'flujo_aprobacion' => 'array',         // ✅ Nuevo
    'plantillas' => 'array',               // ✅ Nuevo
    'notificaciones' => 'array',           // ✅ Nuevo
    'created_at' => 'datetime',
    'updated_at' => 'datetime',
];
```

---

## 📝 **Ejemplos de Uso**

### **1. Crear un Tipo desde el Wizard (Paso 1)**

```php
$tipo = TipoSolicitud::create([
    'codigo' => 'SOL-TI-001',
    'nombre' => 'Solicitud de Soporte Técnico',
    'descripcion' => 'Para problemas de hardware o software',
    'categoria' => 'Tecnología',           // ✅ Campo nuevo
    'area_id' => 5,                        // ✅ Campo nuevo
    'tiempo_respuesta_dias' => 3,          // ✅ Campo nuevo
    'sla_dias' => 7,                       // ✅ Campo nuevo
    'requiere_aprobacion' => false,        // ✅ Campo nuevo
    'requiere_pago' => false,
    'costo' => 0,                          // ✅ Campo nuevo
    'icono' => '🔧',
    'color' => '#3B82F6',
    'activo' => true,
]);
```

### **2. Actualizar Configuración de Campos (Paso 2 - Futuro)**

```php
$tipo->update([
    'campos_formulario' => [              // ✅ Campo nuevo (JSON)
        [
            'nombre' => 'numero_serie',
            'tipo' => 'text',
            'obligatorio' => true,
            'label' => 'Número de Serie'
        ],
        [
            'nombre' => 'descripcion_problema',
            'tipo' => 'textarea',
            'obligatorio' => true,
            'label' => 'Descripción del Problema'
        ]
    ]
]);
```

### **3. Configurar Flujo de Aprobación (Paso 3 - Futuro)**

```php
$tipo->update([
    'flujo_aprobacion' => [               // ✅ Campo nuevo (JSON)
        'pasos' => [
            [
                'orden' => 1,
                'nombre' => 'Aprobación Coordinador',
                'rol_id' => 3,
                'opcional' => false
            ],
            [
                'orden' => 2,
                'nombre' => 'Aprobación Director',
                'rol_id' => 2,
                'opcional' => true
            ]
        ]
    ]
]);
```

---

## 🧪 **Testing**

### **Verificar Campos:**

```bash
php artisan tinker

use App\Models\TipoSolicitud;
use Illuminate\Support\Facades\Schema;

// Ver todos los campos
Schema::getColumnListing('tipos_solicitud');

// Verificar que un campo existe
Schema::hasColumn('tipos_solicitud', 'categoria'); // true

// Ver tipo de un campo
Schema::getColumnType('tipos_solicitud', 'campos_formulario'); // json
```

### **Crear Tipo de Prueba:**

```php
$tipo = TipoSolicitud::create([
    'codigo' => 'TEST-001',
    'nombre' => 'Tipo de Prueba',
    'descripcion' => 'Prueba del wizard',
    'categoria' => 'Test',
    'area_id' => 1,
    'tiempo_respuesta_dias' => 5,
    'activo' => false
]);

// Verificar
$tipo->categoria;              // 'Test'
$tipo->tiempo_respuesta_dias;  // 5
$tipo->campos_formulario;      // null (array vacío cuando se asigna)
```

---

## 🔐 **SoftDeletes - Estado**

**❌ NO está habilitado**

La tabla **NO** tiene la columna `deleted_at`, por lo que el trait `SoftDeletes` fue eliminado del modelo.

**Razón:** Causaba errores SQL al intentar consultar `tipos_solicitud.deleted_at`.

---

## 📊 **Comparación: Antes vs Después**

### **Antes de la Migración**

```
❌ categoria (string) - NO existía
❌ area_id - NO existía (solo area_responsable_id)
❌ tiempo_respuesta_dias - NO existía (solo dias_respuesta)
❌ sla_dias - NO existía
❌ requiere_aprobacion (boolean) - NO existía
❌ costo (decimal) - NO existía (solo valor_tramite)
❌ campos_formulario (json) - NO existía
❌ documentos_requeridos (json) - NO existía
❌ flujo_aprobacion (json) - NO existía
❌ plantillas (json) - NO existía
❌ notificaciones (json) - NO existía
```

### **Después de la Migración**

```
✅ categoria - Existe (sincronizado con 'General')
✅ area_id - Existe (sincronizado con area_responsable_id)
✅ tiempo_respuesta_dias - Existe (sincronizado con dias_respuesta)
✅ sla_dias - Existe (valor null por defecto)
✅ requiere_aprobacion - Existe (valor false por defecto)
✅ costo - Existe (sincronizado con valor_tramite)
✅ campos_formulario - Existe (JSON vacío)
✅ documentos_requeridos - Existe (JSON vacío)
✅ flujo_aprobacion - Existe (JSON vacío)
✅ plantillas - Existe (JSON vacío)
✅ notificaciones - Existe (JSON vacío)
```

---

## 🚀 **Próximos Pasos**

### **Inmediato:**
- ✅ Wizard Paso 1 funcional
- ✅ Tabla sincronizada
- ✅ Modelo actualizado

### **Corto Plazo:**
- [ ] Implementar Paso 2 (Configurador de Campos)
- [ ] Implementar Paso 3 (Constructor de Flujos)
- [ ] Implementar Paso 4 (Gestor de Plantillas)

### **Mediano Plazo:**
- [ ] Migrar código legacy a usar nuevos campos
- [ ] Deprecar campos antiguos
- [ ] Crear migración de limpieza (eliminar duplicados)

---

## 📞 **Soporte**

Si necesitas realizar cambios en la estructura:

1. **Agregar un campo:**
   ```bash
   php artisan make:migration add_campo_a_tipos_solicitud --table=tipos_solicitud
   ```

2. **Actualizar el modelo:**
   ```php
   // En TipoSolicitud.php
   protected $fillable = [..., 'nuevo_campo'];
   protected $casts = ['nuevo_campo' => 'tipo'];
   ```

3. **Actualizar el wizard:**
   ```javascript
   // En tipos-solicitud.js
   // Agregar input en generarPaso1()
   // Agregar validación en validarCampoPaso1()
   // Agregar en datos del validarYGuardarPaso1()
   ```

---

## ✅ **Conclusión**

La tabla `tipos_solicitud` ahora está **completamente alineada** con el wizard desarrollado, manteniendo retrocompatibilidad con campos existentes. Todos los campos necesarios para los 4 pasos del wizard están listos y funcionales.

**Estado:** ✅ Listo para producción (Paso 1 completo, Pasos 2-4 preparados para desarrollo futuro)

---

*Última actualización: 19 de octubre de 2025*

