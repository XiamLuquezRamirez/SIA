# 🧪 Cómo Probar Flujos de Aprobación

## ✅ Módulo Implementado en Wizard - Paso 2

## 📝 Pasos para Probar

### 1️⃣ Abrir el Wizard

```
1. Ve a: http://localhost:8000/admin/tipos-solicitud
2. Click en botón "➕ Nuevo Tipo de Solicitud"
3. El wizard se abrirá
```

### 2️⃣ Completar Paso 1

```
Paso 1: Información Básica

Llena:
  ✓ Código: TEST-FLUJO-001
  ✓ Nombre: Prueba de Flujos
    (El slug se genera automáticamente)
  ✓ Descripción: Prueba del sistema de flujos
  ✓ Categoría: 📄 Certificados
  ✓ Área Responsable: (selecciona una)
  ✓ Días de Respuesta: 5
  ✓ Días de Alerta: 2

Click "Siguiente →"
```

### 3️⃣ Ver Paso 2 - Flujos de Aprobación

```
Paso 2: Flujos de Aprobación

Verás:
  ○ Flujo Básico (Por Defecto) ← Seleccionado
  ○ Flujo Personalizado

Por defecto muestra:
  ┌─────────────────────────────────────┐
  │ Flujo Básico del Sistema            │
  ├─────────────────────────────────────┤
  │ 📥 Radicada → 🔍 En Revisión →      │
  │ ✅ En Aprobación → ✓ Aprobada        │
  └─────────────────────────────────────┘
```

### 4️⃣ Probar Flujo Personalizado

```
1. Selecciona: ○ Flujo Personalizado

2. Verás aparecer:
   ┌─────────────────────────────────┐
   │ 📊 Diagrama de Flujo            │
   │ [+ Nueva Transición]            │
   │                                 │
   │ (Diagrama con estados)          │
   └─────────────────────────────────┘
   
   ┌─────────────────────────────────┐
   │ 📋 Transiciones Configuradas    │
   │ No hay transiciones...          │
   └─────────────────────────────────┘

3. Estados mostrados en el diagrama:
   📥 Radicada (INICIAL)
   🔍 En Revisión
   📄 Pendiente de Documentos
   ✅ En Aprobación
   ✓ Aprobada (FINAL)
   ✗ Rechazada (FINAL)
```

### 5️⃣ Crear Transición

```
1. Click en "+ Nueva Transición"

2. Modal se abre con formulario

3. Completa:
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Estados *
   ├─ Origen: 📥 Radicada
   └─ Destino: 🔍 En Revisión
   
   Identificación
   ├─ Nombre: Asignar para Revisión
   └─ Texto botón: Revisar Solicitud
   
   👥 Quién Puede Ejecutar
   ☑ Director OAPM
   ☑ Coordinador del Área
   ☐ Líder del Equipo
   
   ⚙️ Condiciones
   ☑ Requiere comentario obligatorio
   ☐ Requiere adjuntar documento
   
   🤖 Acciones Automáticas
   ☐ Reasignar funcionario
   ☑ Enviar notificaciones
   ☑ Registrar en auditoría
   
   Confirmación
   ☑ Requiere confirmación
   Mensaje: "¿Asignar esta solicitud para revisión?"
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━

4. Click "Crear Transición"

5. Verás:
   ✓ Toast: "Transición creada exitosamente"
   ✓ Modal se cierra
   ✓ Diagrama se actualiza
   ✓ Lista muestra la nueva transición
```

### 6️⃣ Ver Transición en Lista

```
Después de crear, verás en la lista:

┌─────────────────────────────────────────────┐
│ 1. Asignar para Revisión                    │
│ Radicada → En Revisión                      │
│ [Con condiciones] [Con acciones]            │
│ [✏️ Editar] [🗑️ Eliminar]                    │
└─────────────────────────────────────────────┘
```

### 7️⃣ Agregar Más Transiciones (Opcional)

```
Puedes crear flujo completo:

1. Radicada → En Revisión
2. En Revisión → En Aprobación
3. En Aprobación → Aprobada
4. En Aprobación → Rechazada
5. En Revisión → Pendiente de Documentos
6. Pendiente de Documentos → En Revisión
```

### 8️⃣ Continuar con el Wizard

```
Click "Siguiente →"
  ↓
Paso 3: Configuración de Flujo
  (siguiente funcionalidad)
```

## 🔍 Validaciones que Verás

### ✅ Validación de Duplicados

```
Si intentas crear:
  Radicada → En Revisión

Y ya existe esa transición:
  ❌ Error: "Esta transición ya existe"
```

### ✅ Validación de Estados Iguales

```
Si seleccionas:
  Origen: Radicada
  Destino: Radicada

  ❌ Error: "El estado origen y destino no pueden ser el mismo"
```

### ✅ Validación de Campos

```
Si no seleccionas origen o destino:
  ❌ Error: "Debe seleccionar estado origen y destino"
```

## 🎯 Casos de Prueba

### Caso 1: Flujo Básico (Más Simple)
```
1. Completa Paso 1
2. En Paso 2: deja seleccionado "Flujo Básico"
3. Click "Siguiente"
✅ Pasa sin problemas
```

### Caso 2: Flujo Personalizado Mínimo
```
1. Completa Paso 1
2. En Paso 2: selecciona "Flujo Personalizado"
3. Crea 1 transición: Radicada → En Revisión
4. Click "Siguiente"
✅ Pasa con flujo personalizado
```

### Caso 3: Flujo Personalizado Completo
```
1. Completa Paso 1
2. En Paso 2: selecciona "Flujo Personalizado"
3. Crea múltiples transiciones:
   - Radicada → En Revisión
   - En Revisión → En Aprobación
   - En Aprobación → Aprobada
   - En Aprobación → Rechazada
4. Cada una con sus condiciones y acciones
5. Click "Siguiente"
✅ Pasa con flujo completo configurado
```

### Caso 4: Eliminar Transición
```
1. En Paso 2 con flujo personalizado
2. Crea una transición
3. Click en botón 🗑️ de la transición
4. Confirma eliminación
✅ Transición eliminada, diagrama actualizado
```

### Caso 5: Ver Detalles de Estado
```
1. En Paso 2 con flujo personalizado
2. Click en cualquier nodo del diagrama
✅ Muestra popup con detalles del estado
```

## 🐛 Errores Comunes y Soluciones

### Error: "Sin estados disponibles"
```
Problema: No carga estados
Solución: Verificar que existe tabla estados_solicitud con datos
```

### Error: Modal no se abre
```
Problema: Click en "+ Nueva Transición" no hace nada
Solución: Primero seleccionar "Flujo Personalizado"
```

### Error 422 al crear transición
```
Problema: Validación falla
Solución: Verificar que tipo_solicitud_id existe (debe pasar Paso 1 primero)
```

## 📊 Verificar en Consola (F12)

```javascript
// Ver estados cargados
console.log(window.estadosDisponibles);

// Ver transiciones configuradas
console.log(window.transicionesConfiguradas);

// Ver ID del tipo en creación
console.log(tipoIdCreado);
```

## ✨ Resultado Esperado

Al completar el Paso 2, el tipo de solicitud tendrá:

```json
{
  // Si flujo básico:
  "flujo_personalizado": false,
  "transiciones": [] // Usa transiciones básicas del sistema
  
  // Si flujo personalizado:
  "flujo_personalizado": true,
  "transiciones": [
    {
      "estado_origen_id": 1,
      "estado_destino_id": 2,
      "roles_permitidos": ["Director OAPM"],
      "requiere_comentario": true,
      ...
    }
  ]
}
```

## 🎉 Estado Final

```
✅ Paso 2 del Wizard: FUNCIONAL
✅ Flujo Básico: Muestra info correcta
✅ Flujo Personalizado: Diagrama funcional
✅ Nueva Transición: Modal completo
✅ Crear: POST funciona
✅ Eliminar: DELETE funciona
✅ Validaciones: Activas
✅ UI: Moderna y clara
```

---

**Listo para Probar:** ✅ SÍ  
**Ubicación:** Wizard → Paso 2  
**Estado:** Completamente Funcional

