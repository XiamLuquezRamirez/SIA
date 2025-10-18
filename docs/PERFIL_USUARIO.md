# Funcionalidad de Mi Perfil

## Descripción General

Se ha implementado una funcionalidad completa de "Mi Perfil" que permite a los usuarios visualizar y editar su información personal en el sistema SIA.

## Características Implementadas

### 1. Visualización del Perfil (`/profile`)

**Ruta:** `GET /profile`
**Vista:** `resources/views/profile/show.blade.php`

#### Funcionalidades:
- **Foto de Perfil:**
  - Visualización de foto actual o iniciales del usuario
  - Botón para cambiar foto (modal con upload)
  - Botón para eliminar foto (si existe)
  - Validación: máx 2MB, formatos: PNG, JPG, GIF

- **Información Personal:**
  - Nombre completo
  - Tipo y número de documento (solo lectura)
  - Email, teléfono, celular, dirección
  - Botón "Editar Perfil" para ir a la página de edición

- **Información Laboral** (solo usuarios internos):
  - Área asignada
  - Equipo asignado
  - Cargo

- **Actividad Reciente:**
  - Últimas 10 actividades del usuario
  - Timestamps relativos (hace X tiempo)

- **Información de la Cuenta:**
  - Fecha de registro
  - Última actualización
  - Estado activo/inactivo
  - Roles asignados

### 2. Edición del Perfil (`/profile/edit`)

**Ruta:** `GET /profile/edit`
**Vista:** `resources/views/profile/edit.blade.php`

#### Campos Editables:
- ✅ Nombre (requerido)
- ✅ Apellidos (requerido)
- ✅ Correo Electrónico (requerido, único)
- ✅ Teléfono (opcional)
- ✅ Celular (opcional)
- ✅ Dirección (opcional, máx 500 caracteres)

#### Campos Solo Lectura (mostrados en gris):
- 🔒 Tipo de Documento
- 🔒 Número de Documento
- 🔒 Área (solo funcionarios)
- 🔒 Equipo (solo funcionarios)
- 🔒 Cargo (solo funcionarios)

#### Validación:
- Validación en tiempo real con SweetAlert2
- Mensajes de error específicos por campo
- Validación de email único
- Longitud máxima de caracteres

### 3. Actualización del Perfil

**Ruta:** `PUT /profile/update`
**Método:** ProfileController@update

#### Características:
- Actualización AJAX (sin recargar página)
- Registro de actividad en el log del sistema
- Notificaciones con SweetAlert2
- Redirección automática al perfil tras guardar

### 4. Gestión de Foto de Perfil

#### Subir/Actualizar Foto
**Ruta:** `POST /profile/photo`
**Método:** ProfileController@updatePhoto

- Modal de upload con preview
- Almacenamiento en `storage/public/usuarios/`
- Eliminación automática de foto anterior
- Validación de tamaño y formato

#### Eliminar Foto
**Ruta:** `DELETE /profile/photo`
**Método:** ProfileController@deletePhoto

- Confirmación con SweetAlert2
- Eliminación física del archivo
- Actualización de registro en BD

## Archivos Creados

### Controlador
- `app/Http/Controllers/ProfileController.php`
  - `show()` - Mostrar perfil
  - `edit()` - Formulario de edición
  - `update()` - Actualizar información
  - `updatePhoto()` - Subir/actualizar foto
  - `deletePhoto()` - Eliminar foto

### Vistas
- `resources/views/profile/show.blade.php` - Vista del perfil
- `resources/views/profile/edit.blade.php` - Formulario de edición

### Rutas
Agregadas en `routes/web.php`:
```php
Route::prefix('profile')->name('profile.')->group(function () {
    Route::get('/', [ProfileController::class, 'show'])->name('show');
    Route::get('/edit', [ProfileController::class, 'edit'])->name('edit');
    Route::put('/update', [ProfileController::class, 'update'])->name('update');
    Route::post('/photo', [ProfileController::class, 'updatePhoto'])->name('photo.update');
    Route::delete('/photo', [ProfileController::class, 'deletePhoto'])->name('photo.delete');
});
```

## Archivos Modificados

### Layout
- `resources/views/components/app-layout.blade.php`
  - Actualizado enlace "Mi Perfil" en el menú de usuario (línea 63)
  - Cambiado de `href="#"` a `href="{{ route('profile.show') }}"`

## Seguridad

### Medidas Implementadas:
1. ✅ Middleware `auth` - Solo usuarios autenticados
2. ✅ CSRF Token en todos los formularios
3. ✅ Validación de datos en servidor
4. ✅ Usuario solo puede editar su propio perfil
5. ✅ Campos sensibles protegidos (documento, área, cargo)
6. ✅ Registro de auditoría de todos los cambios
7. ✅ Validación de tipos de archivo en uploads
8. ✅ Límite de tamaño de archivos (2MB)

### NO Permitido:
- ❌ Cambiar contraseña (requiere proceso separado)
- ❌ Cambiar roles/permisos
- ❌ Modificar información laboral (área, equipo, cargo)
- ❌ Desactivar propia cuenta
- ❌ Cambiar tipo/número de documento

## Registro de Actividad

Todas las acciones se registran en `activity_logs`:

```php
ActivityLog::create([
    'user_id' => $user->id,
    'log_name' => 'user_profile',
    'description' => 'Usuario actualizó su perfil',
    'subject_type' => 'App\Models\User',
    'subject_id' => $user->id,
    'event' => 'updated|photo_updated|photo_deleted',
    'properties' => json_encode([...])
]);
```

## UI/UX

### Tecnologías Utilizadas:
- **Tailwind CSS** - Estilos y diseño responsivo
- **Alpine.js** - Interactividad (modales, dropdowns)
- **SweetAlert2** - Notificaciones y confirmaciones
- **Fetch API** - Peticiones AJAX

### Diseño:
- Diseño de 3 columnas en escritorio (lg:grid-cols-3)
- Totalmente responsivo (mobile-first)
- Tema consistente con el resto de la aplicación
- Badges de estado (activo/inactivo, roles)
- Timeline de actividad reciente

## Acceso

### Desde el Layout Principal:
1. Click en el avatar del usuario (esquina superior derecha)
2. Click en "Mi Perfil" en el dropdown
3. Redirige a `/profile`

### URLs Directas:
- Ver perfil: `http://localhost/profile`
- Editar perfil: `http://localhost/profile/edit`

## Flujo de Usuario

```
Usuario hace click en "Mi Perfil"
    ↓
GET /profile (Vista del perfil)
    ↓
Usuario ve su información y actividad reciente
    ↓
    ├─ Opción 1: Cambiar Foto
    │   ↓
    │   Modal de upload → POST /profile/photo
    │   ↓
    │   SweetAlert success → Recarga página
    │
    ├─ Opción 2: Eliminar Foto
    │   ↓
    │   Confirmación SweetAlert → DELETE /profile/photo
    │   ↓
    │   SweetAlert success → Recarga página
    │
    └─ Opción 3: Editar Perfil
        ↓
        GET /profile/edit (Formulario)
        ↓
        Usuario edita campos
        ↓
        Submit → PUT /profile/update
        ↓
        Validación + ActivityLog
        ↓
        SweetAlert success → Redirect a /profile
```

## Testing

### Rutas para Verificar:
```bash
# Listar rutas de perfil
php artisan route:list --name=profile

# Verificar estado de la aplicación
php artisan about
```

### Casos de Prueba Sugeridos:
1. ✅ Acceder al perfil estando autenticado
2. ✅ Intentar acceder sin autenticación (debe redirigir a login)
3. ✅ Editar nombre y apellidos
4. ✅ Actualizar email (verificar unicidad)
5. ✅ Subir foto de perfil válida
6. ✅ Intentar subir archivo > 2MB (debe rechazar)
7. ✅ Intentar subir archivo no-imagen (debe rechazar)
8. ✅ Eliminar foto de perfil
9. ✅ Ver actividad reciente
10. ✅ Verificar que campos protegidos no se puedan editar

## Notas de Desarrollo

### Relaciones del Modelo User:
```php
$user->area          // BelongsTo Area
$user->equipo        // BelongsTo Equipo
$user->roles         // BelongsToMany Role
$user->activityLogs  // HasMany ActivityLog
```

### Accessors Utilizados:
```php
$user->nombre_completo  // Nombre + Apellidos
$user->esFuncionario()  // tipo_usuario === 'interno'
$user->esCiudadano()    // tipo_usuario === 'externo'
```

### Almacenamiento de Fotos:
```
storage/
  app/
    public/
      usuarios/        ← Fotos de perfil
        {hash}.jpg
        {hash}.png
```

Enlace simbólico: `php artisan storage:link`

## Mantenimiento Futuro

### Posibles Mejoras:
1. Agregar cambio de contraseña con verificación
2. Preferencias de usuario (idioma, notificaciones)
3. Integración con 2FA
4. Historial completo de cambios
5. Exportar datos personales (GDPR)
6. Crop/resize de imagen antes de upload
7. Preview de imagen antes de guardar

### Consideraciones:
- Las fotos antiguas se eliminan automáticamente al subir nuevas
- Los logs de actividad conservan el historial completo
- La validación de email único permite el email actual del usuario

---

**Fecha de Implementación:** 18 de octubre de 2025
**Versión de Laravel:** 10.49.1
**Desarrollado para:** SIA - Alcaldía de Valledupar
