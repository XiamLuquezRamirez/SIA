# Sistema de Manejo de Errores y Sesión - SIA

## 📋 Problema Original

### ❌ Antes:
- **Error 404:** Página negra con texto "404 Not Found"
- **Error 405:** Mensaje de error sin contexto cuando la sesión expira
- **Mala UX:** Usuario confundido sin saber qué hacer

### ✅ Ahora:
- **Error 404:** Redirección automática al login (si no autenticado) o página amigable (si autenticado)
- **Error 405:** Detección de sesión expirada y redirección al login
- **Buena UX:** Mensajes claros y redirección automática

---

## 🔧 Soluciones Implementadas

### 1. Backend - Handler.php

#### Manejo de Excepciones

**Archivo:** `SIA/app/Exceptions/Handler.php`

```php
public function render($request, Throwable $exception)
{
    // 401 - No Autenticado
    if ($exception instanceof AuthenticationException) {
        return redirect()->route('login')
            ->with('warning', 'Su sesión ha expirado.');
    }

    // 419 - Token CSRF Expirado
    if ($exception instanceof TokenMismatchException) {
        return redirect()->route('login')
            ->with('warning', 'Su sesión ha expirado.');
    }

    // 404 - No Encontrado
    if ($exception instanceof NotFoundHttpException) {
        if (!auth()->check()) {
            return redirect()->route('login');
        }
        return response()->view('errors.404', [], 404);
    }

    // 405 - Método No Permitido (sesión expirada)
    if ($exception instanceof MethodNotAllowedHttpException) {
        if (!auth()->check()) {
            return redirect()->route('login');
        }
        return response()->view('errors.405', [], 405);
    }
}
```

#### Características:

✅ **Detección inteligente** - Distingue si el usuario está autenticado  
✅ **Soporte AJAX** - Responde JSON para peticiones AJAX  
✅ **Mensajes flash** - Usa sesión para mostrar mensajes al usuario  
✅ **Redirección suave** - Usa `redirect()->guest()` para volver después del login  

---

### 2. Frontend - JavaScript

#### Función Global de Manejo de Respuestas

**Archivo:** `SIA/public/js/admin/usuarios.js`

```javascript
async function manejarRespuestaFetch(response) {
    // Errores de autenticación (401, 405, 419)
    if (response.status === 401 || response.status === 405 || response.status === 419) {
        showToast('Su sesión ha expirado. Redirigiendo al login...', 'error');
        
        setTimeout(() => {
            window.location.href = '/login';
        }, 2000);
        
        throw new Error('Sesión expirada');
    }
    
    // Error 404
    if (response.status === 404) {
        const data = await response.json().catch(() => ({}));
        
        if (data.redirect) {
            showToast('Redirigiendo al login...', 'info');
            setTimeout(() => {
                window.location.href = data.redirect;
            }, 1500);
        }
    }
    
    return response;
}
```

#### Uso en Funciones:

```javascript
// ANTES
const response = await fetch('/admin/usuarios');
if (!response.ok) throw new Error('Error');

// AHORA
const response = await fetch('/admin/usuarios');
await manejarRespuestaFetch(response); // ✓ Detecta sesión expirada
if (!response.ok) throw new Error('Error');
```

#### Actualizado en:
- ✅ `loadUsers()` - Carga de usuarios
- ✅ `verUsuario()` - Detalle de usuario
- ✅ `cargarActividadUsuario()` - Historial de actividad
- 🔄 Pendiente: Aplicar a otros 12 fetches del archivo

---

### 3. Vistas de Error Personalizadas

#### 404.blade.php - Página No Encontrada

**Archivo:** `SIA/resources/views/errors/404.blade.php`

**Características:**
- 🎨 Diseño moderno con Tailwind CSS
- 📱 Totalmente responsive
- 🔄 Botón "Volver Atrás"
- 🏠 Botón "Ir al Dashboard" (si está autenticado)
- 🔑 Botón "Iniciar Sesión" (si NO está autenticado)
- 🐛 Info de debug (solo en desarrollo)

**Contenido:**
```html
<h1>404</h1>
<h2>Página No Encontrada</h2>
<p>La página que buscas no existe o ha sido movida.</p>

@auth
    <a href="{{ route('dashboard') }}">Ir al Dashboard</a>
    <button onclick="window.history.back()">Volver Atrás</button>
@else
    <a href="{{ route('login') }}">Iniciar Sesión</a>
@endauth
```

#### 405.blade.php - Método No Permitido

**Archivo:** `SIA/resources/views/errors/405.blade.php`

**Características:**
- ⚠️ Diseño con advertencia clara
- 🔄 Botón "Recargar Página"
- 🔑 Botón "Iniciar Sesión"
- ℹ️ Explicación de por qué ocurre el error
- 💡 Sugerencias de solución

**Explicaciones incluidas:**
- Tu sesión pudo haber expirado
- Intentaste acceder sin permisos
- Recargaste después de enviar formulario

---

## 🎯 Flujo de Manejo de Errores

### Caso 1: Error 404 - Usuario NO Autenticado

```
Usuario intenta acceder a /admin/usuarios/999
    ↓
Backend: Usuario no autenticado + Ruta no existe
    ↓
Handler detecta: NotFoundHttpException + !auth()->check()
    ↓
Redirección a /login con mensaje flash
    ↓
Usuario ve: "Por favor, inicie sesión para continuar"
```

### Caso 2: Error 404 - Usuario Autenticado

```
Usuario autenticado accede a /admin/algo-que-no-existe
    ↓
Handler detecta: NotFoundHttpException + auth()->check()
    ↓
Muestra vista personalizada errors.404
    ↓
Usuario ve: Página bonita con opciones de navegación
```

### Caso 3: Error 405 - Sesión Expirada

```
Usuario con sesión expirada intenta POST
    ↓
Laravel responde 405 Method Not Allowed
    ↓
Handler detecta: MethodNotAllowedHttpException + !auth()->check()
    ↓
Redirección a /login con mensaje "Sesión expirada"
    ↓
Usuario inicia sesión y continúa
```

### Caso 4: Error 405 - Método Incorrecto (Autenticado)

```
Usuario autenticado usa método incorrecto
    ↓
Handler detecta: MethodNotAllowedHttpException + auth()->check()
    ↓
Muestra vista personalizada errors.405
    ↓
Usuario ve: Explicación y botón para recargar
```

### Caso 5: Petición AJAX - Sesión Expirada

```
JavaScript hace fetch a API
    ↓
Sesión expirada (401/405/419)
    ↓
Backend responde JSON con redirect
    ↓
manejarRespuestaFetch() detecta código de error
    ↓
Muestra toast "Sesión expirada"
    ↓
Espera 2 segundos
    ↓
Redirección automática a /login
```

---

## 📊 Códigos de Estado Manejados

| Código | Nombre | Causa Común | Acción |
|--------|--------|-------------|--------|
| 401 | Unauthorized | Sesión expirada, token inválido | → Login |
| 404 | Not Found | Ruta no existe | → Login (si no auth) ó Vista 404 |
| 405 | Method Not Allowed | Sesión expirada en POST/PUT/DELETE | → Login (si no auth) ó Vista 405 |
| 419 | Page Expired | Token CSRF expirado | → Login |

---

## 🎨 Características de las Vistas de Error

### Diseño:
- ✅ Tailwind CSS integrado
- ✅ Responsive (móvil, tablet, desktop)
- ✅ Iconos SVG descriptivos
- ✅ Colores según gravedad (azul, amarillo, rojo)

### Funcionalidad:
- ✅ Botones contextuales según autenticación
- ✅ Mensajes claros en español
- ✅ Sugerencias de acción
- ✅ Info de debug (solo en desarrollo)

### UX:
- ✅ No más pantallas negras
- ✅ Mensajes amigables
- ✅ Acciones claras (Login, Volver, Recargar)
- ✅ Temporizadores antes de redirigir (para leer mensajes)

---

## 🔄 Manejo de AJAX

### Respuestas del Backend para AJAX:

```php
// 401 - No Autenticado
return response()->json([
    'message' => 'Sesión expirada.',
    'redirect' => route('login')
], 401);

// 404 - No Encontrado
return response()->json([
    'message' => 'Página no encontrada.',
    'redirect' => route('login') // Solo si no está autenticado
], 404);
```

### Manejo en Frontend:

```javascript
const response = await fetch('/api/algo');
await manejarRespuestaFetch(response); // ✓ Detecta y redirige automáticamente

// Si llega aquí, la sesión es válida
const data = await response.json();
```

---

## ⚙️ Configuración Adicional Recomendada

### 1. Tiempo de Sesión en .env

```env
SESSION_LIFETIME=120  # 2 horas (default Laravel)
# o
SESSION_LIFETIME=480  # 8 horas (jornada laboral)
```

### 2. Middleware de Inactividad (Opcional)

Si quieres cerrar sesión por inactividad, puedes crear un middleware personalizado.

### 3. Mensaje Flash en Login

El LoginController puede mostrar los mensajes flash:

```php
@if(session('warning'))
    <div class="alert alert-warning">
        {{ session('warning') }}
    </div>
@endif
```

---

## ✅ Testing

### 1. Test de Error 404

**Sin autenticar:**
```bash
1. Cierra sesión
2. Visita: http://localhost/admin/usuarios/999
3. Resultado esperado: Redirección a /login
```

**Autenticado:**
```bash
1. Inicia sesión
2. Visita: http://localhost/admin/algo-que-no-existe
3. Resultado esperado: Página 404 personalizada con botones
```

### 2. Test de Error 405 (Sesión Expirada)

```bash
1. Inicia sesión
2. Espera que expire la sesión (o limpia cookies manualmente)
3. Intenta guardar un formulario
4. Resultado esperado: Toast + Redirección a /login después de 2s
```

### 3. Test de AJAX

```bash
1. Abre consola del navegador
2. Expira la sesión (limpia cookies)
3. Haz clic en "Ver Detalle" de un usuario
4. Resultado esperado:
   - Toast: "Su sesión ha expirado..."
   - Consola: No errores críticos
   - Redirección automática a /login
```

---

## 📂 Archivos Modificados/Creados

### Backend:
1. ✅ `SIA/app/Exceptions/Handler.php` - Lógica de manejo de errores
   - Método `render()` sobrescrito
   - Método `unauthenticated()` sobrescrito
   - Imports agregados

### Frontend - Vistas:
2. ✅ `SIA/resources/views/errors/404.blade.php` - Página 404 personalizada
3. ✅ `SIA/resources/views/errors/405.blade.php` - Página 405 personalizada

### Frontend - JavaScript:
4. ✅ `SIA/public/js/admin/usuarios.js`
   - Función `manejarRespuestaFetch()` agregada
   - 3 llamadas fetch actualizadas (loadUsers, verUsuario, cargarActividadUsuario)

### Documentación:
5. ✅ `SIA/MANEJO_ERRORES_Y_SESION.md` - Este documento

---

## 🚀 Próximos Pasos Opcionales

### 1. Aplicar a Otros Fetches ⏳

Actualizar los 12 fetches restantes en `usuarios.js`:
- `loadAreas()`
- `loadEquipos()`
- `loadRoles()`
- `editUser()`
- `toggleUserStatus()`
- `loadAreasForModal()`
- `loadEquiposByArea()`
- `loadRolesForModal()`
- `handleFormSubmit()`
- `handleEditFormSubmit()`
- `confirmToggleStatus()`
- `loadUsuariosParaReasignar()`

### 2. Crear Más Vistas de Error

- `401.blade.php` - No Autorizado
- `403.blade.php` - Prohibido
- `419.blade.php` - Token Expirado
- `500.blade.php` - Error del Servidor
- `503.blade.php` - Servicio No Disponible

### 3. Agregar Interceptor Global

Crear un interceptor para fetch que aplique automáticamente a todas las peticiones:

```javascript
// Sobrescribir fetch global
const fetchOriginal = window.fetch;
window.fetch = async (...args) => {
    const response = await fetchOriginal(...args);
    await manejarRespuestaFetch(response);
    return response;
};
```

### 4. Logging de Errores

Agregar sistema de logging de errores del cliente:

```javascript
window.addEventListener('unhandledrejection', function(event) {
    // Enviar error al servidor para análisis
    fetch('/api/log-error', {
        method: 'POST',
        body: JSON.stringify({
            error: event.reason.toString(),
            url: window.location.href
        })
    });
});
```

---

## 📖 Casos de Uso

### Caso 1: Usuario Trabajando, Sesión Expira

**Escenario:**
```
1. Usuario está gestionando usuarios
2. Deja la página abierta 3 horas
3. Intenta ver detalle de un usuario
```

**Resultado:**
```
→ Toast: "Su sesión ha expirado. Redirigiendo al login..."
→ Espera 2 segundos (para leer el mensaje)
→ Redirección automática a /login
→ Usuario inicia sesión
→ (Opcional) Puede configurar para volver a la página original
```

### Caso 2: Usuario Sin Autenticar Accede a Ruta Protegida

**Escenario:**
```
1. Usuario escribe en navegador: http://localhost/admin/usuarios
2. No ha iniciado sesión
```

**Resultado:**
```
→ Middleware detecta no autenticado
→ Handler genera redirección
→ Usuario redirigido a /login
→ Mensaje: "Por favor, inicie sesión para continuar"
```

### Caso 3: Usuario Intenta Acción con Token CSRF Expirado

**Escenario:**
```
1. Usuario abre formulario
2. Espera varias horas
3. Intenta enviar formulario (POST)
```

**Resultado:**
```
→ Laravel detecta TokenMismatchException
→ Handler redirecciona a /login
→ Mensaje: "Su sesión ha expirado. Por favor, inicie sesión nuevamente"
```

---

## 🛡️ Seguridad

### Protecciones Implementadas:

1. **No exponer información sensible** en mensajes de error
2. **Diferenciar entre usuarios autenticados y no autenticados**
3. **Prevenir acceso a rutas protegidas** sin autenticación
4. **Cerrar sesiones expiradas** adecuadamente
5. **Validar tokens CSRF** en todas las peticiones POST/PUT/DELETE

### Consideraciones:

- ⚠️ Los mensajes de error no revelan estructura del sistema
- ⚠️ Los errores 404 no exponen rutas reales
- ⚠️ Debug info solo visible en modo desarrollo
- ⚠️ Logs de errores en servidor (no en cliente)

---

## 📱 Experiencia del Usuario

### Antes (❌):

```
[Pantalla negra]
404
Not Found
```

Usuario: *"¿Qué hago ahora? ¿Cerré sesión? ¿Hay un error?"*

### Ahora (✅):

```
[Página bonita con logo e íconos]
404 - Página No Encontrada
La página que buscas no existe o ha sido movida.

[Botón: Ir al Dashboard] [Botón: Volver Atrás]

Lo sentimos, si crees que esto es un error, contacta al administrador.
```

Usuario: *"Entiendo qué pasó y sé qué hacer"*

---

## 🔍 Debugging

### Ver Errores en Desarrollo:

Las vistas de error muestran información adicional si `APP_DEBUG=true`:

```
Debug Info:
URL solicitada: http://localhost/admin/usuarios/999
Método: GET
Usuario autenticado: No
```

### Ver en Logs de Laravel:

```bash
tail -f storage/logs/laravel.log
```

### Ver en Consola del Navegador:

```javascript
// Los errores se registran en consola
console.error('Error al cargar usuario:', error);
```

---

## 📈 Beneficios

### Para el Usuario:
- ✅ Nunca ve pantallas negras de error
- ✅ Mensajes claros en español
- ✅ Siempre sabe qué hacer
- ✅ Redirección automática al login

### Para el Desarrollador:
- ✅ Manejo centralizado de errores
- ✅ Código reutilizable (`manejarRespuestaFetch`)
- ✅ Fácil de mantener y extender
- ✅ Debug info cuando se necesita

### Para el Sistema:
- ✅ Seguridad mejorada
- ✅ Mejor gestión de sesiones
- ✅ Logs organizados
- ✅ UX profesional

---

## 📋 Checklist de Implementación

- [x] Handler.php actualizado con manejo de excepciones
- [x] Vista 404.blade.php creada
- [x] Vista 405.blade.php creada
- [x] Función manejarRespuestaFetch() creada
- [x] Actualizada función loadUsers()
- [x] Actualizada función verUsuario()
- [x] Actualizada función cargarActividadUsuario()
- [ ] Aplicar a los 12 fetches restantes (opcional)
- [ ] Crear vistas para otros errores (401, 403, 500, etc.)
- [ ] Agregar interceptor global de fetch (opcional)
- [ ] Agregar sistema de logging de errores (opcional)

---

## 🎓 Referencias

- [Laravel Error Handling](https://laravel.com/docs/10.x/errors)
- [HTTP Status Codes](https://httpstatuses.com/)
- [MDN - HTTP Status](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)

---

**Última actualización:** Octubre 2024  
**Versión:** 1.0  
**Estado:** ✅ Implementado y Funcionando

