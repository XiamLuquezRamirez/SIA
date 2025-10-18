# Sistema de Registro de Actividades (Activity Logs)

## Descripción

El sistema de Activity Logs permite registrar y rastrear todas las acciones importantes que los usuarios realizan en el sistema SIA OAPM. Esto incluye autenticaciones, cambios en registros, eliminaciones, y cualquier operación relevante para auditoría y seguridad.

## Estructura de la Base de Datos

### Tabla: `activity_logs`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | bigint | ID único del log |
| `user_id` | bigint | ID del usuario que realizó la acción |
| `user_name` | string | Nombre completo del usuario (guardado por si se elimina) |
| `user_email` | string | Email del usuario |
| `log_name` | string | Categoría del log (auth, user_management, etc.) |
| `description` | text | Descripción legible de la actividad |
| `event` | string | Tipo de evento (logged_in, created, updated, deleted, etc.) |
| `subject_type` | string | Clase del modelo afectado |
| `subject_id` | bigint | ID del modelo afectado |
| `causer_type` | string | Clase del modelo que causó la acción |
| `causer_id` | bigint | ID del modelo que causó la acción |
| `properties` | json | Datos adicionales (antes/después, metadata) |
| `ip_address` | string | IP desde donde se realizó la acción |
| `user_agent` | string | Navegador/dispositivo utilizado |
| `url` | string | URL de la petición |
| `method` | string | Método HTTP (GET, POST, PUT, DELETE) |
| `severity` | enum | Nivel de importancia (info, warning, error, critical) |
| `is_important` | boolean | Marca si el evento es importante |
| `created_at` | timestamp | Fecha y hora del registro |
| `updated_at` | timestamp | Última actualización |

## Uso del Sistema

### 1. Registro Automático de Login/Logout

El sistema registra automáticamente cuando un usuario inicia o cierra sesión:

```php
// En LoginController::login()
ActivityLog::logLogin($user);

// En LoginController::logout()
ActivityLog::logLogout($user);
```

### 2. Registro Manual de Actividades

#### Método General

```php
use App\Models\ActivityLog;

ActivityLog::log([
    'log_name' => 'user_management',
    'description' => 'Usuario creado exitosamente',
    'event' => 'created',
    'subject_type' => User::class,
    'subject_id' => $user->id,
    'properties' => [
        'roles' => $user->roles->pluck('name'),
    ],
    'severity' => 'info',
    'is_important' => true,
]);
```

#### Helpers para Modelos

```php
// Registrar creación
ActivityLog::logCreated($user, 'Nuevo usuario registrado en el sistema');

// Registrar actualización
$oldAttributes = $user->getOriginal();
$user->update($data);
ActivityLog::logUpdated($user, $oldAttributes, 'Perfil de usuario actualizado');

// Registrar eliminación
ActivityLog::logDeleted($user, 'Usuario eliminado del sistema');
```

### 3. Consultar Actividades

#### Por Usuario

```php
// Obtener últimas 20 actividades de un usuario
$activities = ActivityLog::byUser($userId)
    ->orderBy('created_at', 'desc')
    ->limit(20)
    ->get();

// Usar el helper del modelo User
$activities = $user->recentActivityLogs(50);
```

#### Por Filtros

```php
// Filtrar por nombre de log
$activities = ActivityLog::logName('auth')->get();

// Filtrar por evento
$activities = ActivityLog::event('logged_in')->get();

// Filtrar por severidad
$activities = ActivityLog::severity('error')->get();

// Solo actividades importantes
$activities = ActivityLog::important()->get();

// Filtrar por modelo afectado
$activities = ActivityLog::forSubject(User::class, $userId)->get();

// Filtrar por rango de fechas
$activities = ActivityLog::betweenDates('2025-01-01', '2025-12-31')->get();
```

#### Combinando Filtros

```php
$activities = ActivityLog::byUser($userId)
    ->logName('user_management')
    ->event('updated')
    ->betweenDates($startDate, $endDate)
    ->orderBy('created_at', 'desc')
    ->paginate(20);
```

## Categorías de Logs (log_name)

- `auth` - Autenticación (login, logout, intentos fallidos)
- `user_management` - Gestión de usuarios
- `role_management` - Gestión de roles
- `permission_management` - Gestión de permisos
- `area_management` - Gestión de áreas
- `team_management` - Gestión de equipos
- `general` - Otras actividades

## Tipos de Eventos (event)

- `logged_in` - Usuario inició sesión
- `logged_out` - Usuario cerró sesión
- `login_failed` - Intento de login fallido
- `created` - Registro creado
- `updated` - Registro actualizado
- `deleted` - Registro eliminado
- `viewed` - Registro visualizado
- `downloaded` - Archivo descargado
- `uploaded` - Archivo subido

## Niveles de Severidad (severity)

- `info` - Información general
- `warning` - Advertencia
- `error` - Error
- `critical` - Crítico

## API Endpoints

### Obtener Actividades de un Usuario

```
GET /admin/usuarios/{id}/actividad
```

**Parámetros de query:**
- `limit` (int, default: 50) - Cantidad de registros a devolver
- `offset` (int, default: 0) - Offset para paginación
- `log_name` (string, opcional) - Filtrar por categoría
- `event` (string, opcional) - Filtrar por evento
- `severity` (string, opcional) - Filtrar por severidad

**Respuesta:**
```json
{
    "actividades": [
        {
            "id": 1,
            "tipo": "logged_in",
            "log_name": "auth",
            "descripcion": "Usuario inició sesión",
            "fecha": "2025-10-17 23:30:15",
            "fecha_relativa": "hace 5 minutos",
            "ip": "192.168.1.100",
            "user_agent": "Mozilla/5.0...",
            "url": "http://localhost/login",
            "method": "POST",
            "severity": "info",
            "is_important": false,
            "icono": "login",
            "color": "blue",
            "properties": {},
            "changes": []
        }
    ],
    "total": 150,
    "limit": 50,
    "offset": 0
}
```

## Relaciones del Modelo

### ActivityLog

```php
// Usuario que realizó la acción
$log->user; // BelongsTo User

// Modelo afectado (polimórfico)
$log->subject; // MorphTo

// Quien causó la acción (polimórfico)
$log->causer; // MorphTo
```

### User

```php
// Todos los logs del usuario
$user->activityLogs; // HasMany ActivityLog

// Últimos N logs
$user->recentActivityLogs(20);
```

## Métodos Útiles del Modelo ActivityLog

### getFormattedChanges()

Devuelve un array formateado con los cambios realizados:

```php
$log->getFormattedChanges();
// [
//     ['field' => 'email', 'old' => 'old@example.com', 'new' => 'new@example.com'],
//     ['field' => 'activo', 'old' => true, 'new' => false]
// ]
```

### getIcon()

Devuelve el ícono correspondiente al tipo de evento:

```php
$log->getIcon(); // 'login', 'edit', 'trash', etc.
```

### getColor()

Devuelve el color correspondiente a la severidad:

```php
$log->getColor(); // 'blue', 'yellow', 'red', 'gray'
```

## Mejores Prácticas

1. **Siempre registrar operaciones críticas:**
   - Creación, actualización y eliminación de usuarios
   - Cambios de roles y permisos
   - Acceso a información sensible
   - Cambios en configuración del sistema

2. **Usar niveles de severidad apropiados:**
   - `info`: Operaciones normales
   - `warning`: Cambios importantes que requieren atención
   - `error`: Operaciones fallidas
   - `critical`: Fallos de seguridad o sistema

3. **Marcar eventos importantes:**
   - Usar `is_important => true` para eventos que requieren revisión
   - Eliminaciones
   - Cambios de permisos
   - Accesos fallidos múltiples

4. **Incluir contexto en properties:**
   ```php
   'properties' => [
       'old' => $oldData,
       'new' => $newData,
       'reason' => 'Motivo del cambio',
       'additional_info' => 'Información relevante'
   ]
   ```

5. **Limpieza periódica:**
   - Considerar implementar una tarea programada para limpiar logs antiguos
   - Archivar logs importantes antes de eliminar

## Ejemplos de Uso Completo

### Ejemplo 1: Registrar cambio de contraseña

```php
ActivityLog::log([
    'log_name' => 'user_management',
    'description' => 'Contraseña restablecida por administrador',
    'event' => 'password_reset',
    'subject_type' => User::class,
    'subject_id' => $user->id,
    'properties' => [
        'reset_by' => auth()->user()->nombre_completo,
        'force_change' => true,
        'email_sent' => true,
    ],
    'severity' => 'warning',
    'is_important' => true,
]);
```

### Ejemplo 2: Registrar cambio de rol

```php
ActivityLog::log([
    'log_name' => 'role_management',
    'description' => 'Roles de usuario actualizados',
    'event' => 'roles_changed',
    'subject_type' => User::class,
    'subject_id' => $user->id,
    'properties' => [
        'old_roles' => ['Funcionario'],
        'new_roles' => ['Funcionario', 'Coordinador de Área'],
        'added' => ['Coordinador de Área'],
        'removed' => [],
    ],
    'severity' => 'info',
    'is_important' => true,
]);
```

### Ejemplo 3: Registrar acceso denegado

```php
ActivityLog::log([
    'log_name' => 'security',
    'description' => 'Intento de acceso a recurso sin permisos',
    'event' => 'access_denied',
    'properties' => [
        'resource' => $resourceName,
        'required_permission' => $permission,
    ],
    'severity' => 'warning',
    'is_important' => true,
]);
```

## Mantenimiento

### Índices de Base de Datos

La tabla incluye índices en:
- `user_id`
- `log_name`
- `event`
- `subject_type` y `subject_id` (compuesto)
- `created_at`
- `severity`

Estos índices optimizan las consultas más comunes.

### Consideraciones de Rendimiento

- Los logs se insertan de forma asíncrona cuando sea posible
- Implementar archivado de logs antiguos (> 1 año)
- Monitorear el tamaño de la tabla regularmente
- Considerar particionamiento por fecha para tablas muy grandes

## Seguridad

- Los logs NO se pueden modificar (no hay método `update()`)
- Los logs NO se pueden eliminar desde la aplicación (solo desde la base de datos)
- Solo usuarios con permisos específicos pueden ver logs de otros usuarios
- Los datos sensibles en `properties` deben ser encriptados antes de guardar

## Futuras Mejoras

- [ ] Dashboard de auditoría con gráficos
- [ ] Alertas automáticas para eventos críticos
- [ ] Exportación de logs a CSV/PDF
- [ ] Integración con sistema de notificaciones
- [ ] Análisis de patrones sospechosos
- [ ] Retención automática de logs importantes
