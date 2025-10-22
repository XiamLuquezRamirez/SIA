# 📖 EXPLICACIÓN COMPLETA - Flujos de Aprobación

## 🎯 ¿Qué es el Sistema de Flujos de Aprobación?

Es un sistema que define **por qué estados** puede pasar una solicitud y **quién puede moverla** entre esos estados.

## 🔄 Conceptos Básicos

### 1. Estados
Son las **etapas** por las que pasa una solicitud:
- 📧 **Nueva** (INICIAL) - Cuando se crea
- 👤 **Asignada** (PROCESO) - Cuando se asigna a alguien
- ⏳ **En Proceso** (PROCESO) - Cuando se está trabajando en ella
- 🔍 **En Revisión** (PROCESO) - Cuando se está revisando
- ✅ **Aprobada** (FINAL) - Cuando se aprueba
- ❌ **Rechazada** (FINAL) - Cuando se rechaza

### 2. Transiciones
Son las **flechas** que conectan estados:
```
Nueva → Asignada
Asignada → En Proceso
En Proceso → En Revisión
En Revisión → Aprobada
En Revisión → Rechazada
```

### 3. Flujo Básico vs Personalizado

**Flujo Básico:**
- Usa el flujo estándar del sistema
- No necesita configuración
- Aplica a TODOS los tipos de solicitud

**Flujo Personalizado:**
- Creas transiciones específicas para ESTE tipo
- Solo para este tipo de solicitud
- Tiene prioridad sobre el flujo básico

## 📋 PROCESO COMPLETO - Paso a Paso

### PASO 1: Crear Tipo de Solicitud

```
1. Vas a: Administración → Configurar Solicitudes
2. Click "➕ Nuevo Tipo de Solicitud"
3. Wizard se abre con 4 pasos
4. Estás en PASO 1
```

### PASO 2: Completar Información Básica

```
En PASO 1 llenas:
├─ Código: CERT-NOM-001
├─ Nombre: Certificado de Nomenclatura
│   └─ (Slug se genera automáticamente)
├─ Descripción: ...
├─ Categoría: 📄 Certificados
├─ Área Responsable: Planeación
├─ Días de Respuesta: 5
├─ Días de Alerta: 2
└─ Color e Icono

Click "Siguiente →"
  ↓
Se GUARDA en base de datos con activo=false (borrador)
  ↓
Recibes un ID (ejemplo: tipoIdCreado = 12)
  ↓
Avanzas al PASO 2
```

### PASO 3: Configurar Flujo (PASO 2 del Wizard)

```
Llegas a PASO 2: "Flujos de Aprobación"

Ves 2 opciones:
┌─────────────────────────────────────────┐
│ ○ Flujo Básico (Por Defecto)           │
│   └─ Usa flujo estándar del sistema    │
│                                         │
│ ○ Flujo Personalizado                  │
│   └─ Crea transiciones específicas     │
└─────────────────────────────────────────┘
```

#### Opción A: Flujo Básico (Más Simple)

```
1. Dejas seleccionado "Flujo Básico"
2. Ves el flujo estándar:
   📧 Nueva → 👤 Asignada → ⏳ En Proceso → ✅ Aprobada
3. Click "Siguiente"
4. Listo ✅
```

#### Opción B: Flujo Personalizado

```
1. Seleccionas "○ Flujo Personalizado"
   ↓
2. Se cargan los ESTADOS del sistema:
   GET /admin/api/configuracion/estados
   ↓
   Respuesta:
   {
     "estados": [
       {id: 1, nombre: "Nueva", tipo: "inicial", ...},
       {id: 2, nombre: "Asignada", tipo: "proceso", ...},
       ...
     ]
   }
   ↓
3. Se muestra el DIAGRAMA con los estados:
   ┌────────────────────────────────────┐
   │ 📊 Diagrama de Flujo               │
   │ [+ Nueva Transición]               │
   ├────────────────────────────────────┤
   │                                    │
   │  📧     👤      ⏳      ✅          │
   │ Nueva  Asignada En Proceso Aprobada│
   │                                    │
   └────────────────────────────────────┘
   
4. También se muestran las transiciones YA CREADAS:
   GET /admin/api/configuracion/flujos-transiciones?tipo_solicitud_id=12
   ↓
   (Por ahora: vacío, es la primera vez)
```

### PASO 4: Crear Primera Transición

```
1. Click en "➕ Nueva Transición"
   ↓
2. Modal se abre:
   ┌───────────────────────────────────┐
   │ + Nueva Transición                │
   ├───────────────────────────────────┤
   │                                   │
   │ Estado Origen *                   │
   │ [Seleccione estado origen ▼]      │
   │                                   │
   │ Estado Destino *                  │
   │ [Seleccione estado destino ▼]     │
   │                                   │
   │ Nombre: _____________________     │
   │ Texto botón: ________________     │
   │ Descripción: ________________     │
   │                                   │
   │ 👥 Quién Puede Ejecutar           │
   │ ☐ Super Administrador             │
   │ ☐ Director OAPM                   │
   │ ☐ Coordinador del Área            │
   │ ... (más opciones)                │
   │                                   │
   │ ⚙️ Condiciones                     │
   │ ☐ Requiere comentario             │
   │ ☐ Requiere documento              │
   │ ... (más opciones)                │
   │                                   │
   │ 🤖 Acciones Automáticas            │
   │ ☐ Reasignar funcionario           │
   │ ☑ Enviar notificaciones           │
   │ ... (más opciones)                │
   │                                   │
   │ [Cancelar] [Crear Transición]     │
   └───────────────────────────────────┘

3. Usuario llena:
   ├─ Estado Origen: 📧 Nueva
   ├─ Estado Destino: 👤 Asignada
   ├─ Nombre: "Asignar Solicitud"
   ├─ Texto botón: "Asignar"
   ├─ Roles: [☑ Director OAPM, ☑ Coordinador]
   ├─ Condiciones: [☑ Requiere comentario]
   └─ Acciones: [☑ Enviar notificaciones]

4. Click "Crear Transición"
   ↓
5. Se GUARDA en base de datos:
   POST /admin/api/configuracion/flujos-transiciones
   Body: {
     tipo_solicitud_id: 12,
     estado_origen_id: 1,
     estado_destino_id: 2,
     nombre: "Asignar Solicitud",
     roles_permitidos: ["Director OAPM", "Coordinador del Área"],
     requiere_comentario: true,
     ...
   }
   ↓
6. Backend valida y crea:
   ✓ No duplicados
   ✓ Estados existen
   ✓ Estados son diferentes
   ↓
7. Respuesta:
   {success: true, message: "Transición creada"}
   ↓
8. Frontend actualiza:
   ├─ Modal se cierra
   ├─ Recarga transiciones
   ├─ Actualiza diagrama
   └─ Muestra en lista
```

### PASO 5: Ver Transición Creada

```
Ahora en "Transiciones Configuradas" verás:

┌──────────────────────────────────────────┐
│ 📋 Transiciones Configuradas             │
├──────────────────────────────────────────┤
│ 1. Asignar Solicitud                     │
│    Nueva → Asignada                      │
│    [Con condiciones]                     │
│    [✏️ Editar] [🗑️ Eliminar]              │
└──────────────────────────────────────────┘

Y en el diagrama:
- El diagrama se actualiza mostrando la conexión
```

### PASO 6: Crear Más Transiciones (Opcional)

```
Puedes crear un flujo completo:

Transición 1: Nueva → Asignada
Transición 2: Asignada → En Proceso
Transición 3: En Proceso → En Revisión
Transición 4: En Revisión → Aprobada
Transición 5: En Revisión → Rechazada

Cada una con sus propios:
- Permisos (quién puede ejecutar)
- Condiciones (qué se requiere)
- Acciones (qué pasa automáticamente)
```

### PASO 7: Continuar con el Wizard

```
Click "Siguiente →"
   ↓
Paso 3 del Wizard
   (siguiente funcionalidad)
```

## 🔍 DEBUG - Qué Verificar

### 1. Abre la Consola (F12)

```javascript
// Cuando llegas al Paso 2 y seleccionas "Flujo Personalizado"
// Deberías ver en consola:

> Cargando estados disponibles...
> Estados recibidos: {success: true, estados: Array(8)}
> Estados guardados en window: 8
> Renderizando diagrama con 8 estados
> Cargando transiciones para tipo: 12
> Transiciones recibidas: {success: true, transiciones: []}
> Total transiciones: 0
```

### 2. Verifica que los Estados se Cargaron

```javascript
// En consola escribe:
window.estadosDisponibles

// Deberías ver:
// Array(8) [{id: 1, nombre: "Nueva", ...}, ...]
```

### 3. Verifica que el Diagrama se Renderizó

```html
<!-- Inspecciona el elemento #diagrama_flujo -->
<!-- Debería tener HTML con los estados -->
```

## 🐛 Solución de Problemas

### Problema 1: "No hay estados disponibles"

**Causa:** API no devuelve datos  
**Solución:**
```bash
# Verificar que hay datos
php artisan tinker --execute="DB::table('estados_solicitud')->count()"
# Debería retornar: 8

# Probar endpoint directamente
curl http://localhost:8000/admin/api/configuracion/estados
```

### Problema 2: Modal no se abre

**Causa:** `window.estadosDisponibles` está vacío  
**Solución:**
```javascript
// En consola (F12):
console.log('Estados:', window.estadosDisponibles);

// Si es undefined o []:
// 1. Verifica que seleccionaste "Flujo Personalizado"
// 2. Verifica que la petición a /admin/api/configuracion/estados funcione
```

### Problema 3: Diagrama vacío

**Causa:** No se renderiza correctamente  
**Solución:**
```javascript
// Forzar renderizado:
renderizarDiagramaFlujo();

// Verificar elemento existe:
console.log(document.getElementById('diagrama_flujo'));
```

## ✅ Checklist de Verificación

Antes de hacer clic en "+ Nueva Transición", verifica:

```
☑ Paso 1 completado y guardado
☑ tipoIdCreado tiene un valor (ej: 12)
☑ Estás en Paso 2
☑ Seleccionaste "Flujo Personalizado"
☑ El diagrama muestra los 8 estados
☑ window.estadosDisponibles tiene 8 elementos
☑ No hay errores en consola F12
```

## 🎮 Ejemplo Práctico Completo

### Escenario: Certificado de Nomenclatura

```
════════════════════════════════════════
PASO 1: INFORMACIÓN BÁSICA
════════════════════════════════════════
Código: CERT-NOM-001
Nombre: Certificado de Nomenclatura
Slug: certificado-nomenclatura (auto)
Categoría: 📄 Certificados
Área: Planeación
Días: 5

[Siguiente →]
  ↓ Se guarda con ID=15
  
════════════════════════════════════════
PASO 2: FLUJOS DE APROBACIÓN
════════════════════════════════════════

Selecciono: ○ Flujo Personalizado
  ↓
Se cargan 8 estados
  ↓
Veo diagrama con los estados
  ↓

[+ Nueva Transición]
  ↓
Modal se abre
  ↓

CONFIGURACIÓN TRANSICIÓN #1:
─────────────────────────────
Origen: 📧 Nueva
Destino: 👤 Asignada
Nombre: Asignar para Revisión
Botón: Asignar

Permisos:
☑ Director OAPM
☑ Coordinador del Área

Condiciones:
☑ Requiere comentario

Acciones:
☑ Enviar notificaciones

[Crear Transición]
  ↓
POST /admin/api/configuracion/flujos-transiciones
  ↓
✓ Creada con ID=101
  ↓
Modal se cierra
Diagrama se actualiza
Lista muestra: "1. Asignar para Revisión"
  ↓

[+ Nueva Transición] (otra más)
  ↓

CONFIGURACIÓN TRANSICIÓN #2:
─────────────────────────────
Origen: 👤 Asignada
Destino: ⏳ En Proceso
Nombre: Iniciar Trabajo
...
  ↓
Etc...
  ↓

Cuando termino de configurar:
[Siguiente →]
  ↓
Paso 3 del Wizard
```

## 🔗 Relación con Base de Datos

### Tabla `tipos_solicitud`
```sql
INSERT INTO tipos_solicitud (
  codigo, nombre, slug, categoria_id, ...
) VALUES (
  'CERT-NOM-001', 'Certificado...', 'certificado...', 1, ...
);
-- Retorna ID = 15
```

### Tabla `transiciones_flujo`
```sql
INSERT INTO transiciones_flujo (
  tipo_solicitud_id,  -- 15 (vinculado al tipo)
  estado_origen_id,   -- 1 (Nueva)
  estado_destino_id,  -- 2 (Asignada)
  nombre,             -- "Asignar para Revisión"
  roles_permitidos,   -- ["Director OAPM", ...]
  ...
) VALUES (...);
```

## 🎯 ¿Para Qué Sirve?

Cuando un **ciudadano** cree una solicitud de tipo "Certificado de Nomenclatura":

```
1. Solicitud se crea en estado "Nueva"
   ↓
2. Un Director ve la solicitud
   ↓
3. Tiene botón "Asignar" (de la transición)
   ↓
4. Click "Asignar"
   ├─ Sistema verifica: ¿Es Director? ✓
   ├─ Sistema verifica: ¿Tiene comentario? ✓
   ├─ Cambia estado a "Asignada"
   ├─ Envía notificación
   └─ Registra en auditoría
```

## 📊 Ejemplo Visual del Flujo

```
                    ┌─────────────┐
                    │  📧 Nueva   │ (INICIAL)
                    │  (Estado 1) │
                    └──────┬──────┘
                           │
                    Transición 1:
                    "Asignar"
                    Roles: Director, Coordinador
                    Condición: Requiere comentario
                           │
                           ↓
                    ┌──────────────┐
                    │ 👤 Asignada  │
                    │  (Estado 2)  │
                    └──────┬───────┘
                           │
                    Transición 2:
                    "Iniciar Trabajo"
                    Roles: Funcionario Asignado
                           │
                           ↓
                    ┌───────────────┐
                    │ ⏳ En Proceso │
                    │  (Estado 3)   │
                    └───────┬───────┘
                           │
                    Transición 3:
                    "Enviar a Revisión"
                    Roles: Funcionario
                           │
                           ↓
                    ┌────────────────┐
                    │ 🔍 En Revisión │
                    │  (Estado 4)    │
                    └────┬───────┬───┘
                         │       │
            Transición 4 │       │ Transición 5
            "Aprobar"    │       │ "Rechazar"
            Roles: Dir   │       │ Roles: Dir
                         │       │
                    ┌────▼───┐  ┌▼──────────┐
                    │ ✅     │  │ ❌        │
                    │Aprobada│  │Rechazada  │
                    │(Final) │  │ (Final)   │
                    └────────┘  └───────────┘
```

## 💻 Datos en Consola

### Ver Estado Actual

```javascript
// Abre consola (F12) en Paso 2

// Ver estados cargados
console.log('Estados:', window.estadosDisponibles);
// Array(8) [{id: 1, nombre: "Nueva"}, ...]

// Ver transiciones creadas
console.log('Transiciones:', window.transicionesConfiguradas);
// Array(0) [] <- Vacío si no has creado ninguna

// Ver ID del tipo en creación
console.log('Tipo ID:', tipoIdCreado);
// 15 <- Debe tener un número
```

## 🎯 Resumen del Proceso

1. **PASO 1 del Wizard:** Crea el tipo (se guarda en BD)
2. **PASO 2 del Wizard:** Configura flujo
   - Si "Básico": No hace nada
   - Si "Personalizado": Crea transiciones
3. **Crear Transición:** Define reglas de paso entre estados
4. **Cada Transición tiene:**
   - ¿Desde qué estado? (origen)
   - ¿Hasta qué estado? (destino)
   - ¿Quién puede? (permisos)
   - ¿Qué se requiere? (condiciones)
   - ¿Qué pasa automáticamente? (acciones)

---

**¿Necesitas que revise algo específico en tu pantalla o hay algún error en consola?**

Compárteme:
1. Lo que ves en la consola (F12)
2. Si ves el diagrama con los estados
3. Qué pasa cuando haces click en "+ Nueva Transición"
