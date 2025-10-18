# 👥 Funcionalidades del Módulo de Usuarios - SIA

## 📋 Descripción General

El módulo de usuarios del sistema SIA incluye un conjunto completo de funcionalidades para la gestión de usuarios, desde la creación hasta el monitoreo de actividad.

---

## 🎯 Funcionalidades Implementadas

### 1. 📝 Gestión CRUD de Usuarios

#### Crear Usuario
- **Acceso**: Botón "Nuevo Usuario" en la parte superior
- **Características**:
  - ✅ Formulario multi-paso (3 pasos: Personal, Laboral, Acceso)
  - ✅ Tipos de usuario: Interno (Funcionario) / Externo (Ciudadano)
  - ✅ Campos dinámicos según tipo de usuario
  - ✅ Carga de foto de perfil
  - ✅ Validación en tiempo real
  - ✅ Indicador de fortaleza de contraseña
  - ✅ Asignación de roles
  - ✅ Envío automático de email de bienvenida

#### Ver Usuario
- **Acceso**: Click en fila de usuario O menú "Ver Detalle"
- **Características**:
  - ✅ Modal con 5 pestañas: Personal, Laboral, Roles, Actividad, Estadísticas
  - ✅ Información completa del usuario
  - ✅ Actividad reciente (últimas 10 acciones)
  - ✅ Estadísticas de uso
  - ✅ Roles y permisos asignados
  - ✅ Botones de acción rápida: Editar, Email, Imprimir

#### Editar Usuario
- **Acceso**: Menú "Editar" O botón en modal de vista
- **Características**:
  - ✅ Mismo formulario que crear, pre-llenado
  - ✅ Actualización de foto
  - ✅ Cambio de roles (con confirmación para roles críticos)
  - ✅ Contraseña opcional (solo si se desea cambiar)
  - ✅ Detección de cambios para confirmar cierre

#### Eliminar Usuario
- **Acceso**: Menú "Eliminar" (texto rojo)
- **Estado**: 🚧 Pendiente de implementación completa
- **Funcionalidad actual**: Alert de confirmación

---

### 2. 🔐 Gestión de Contraseñas

#### Restablecer Contraseña
- **Acceso**: Menú "Restablecer Contraseña"
- **Características**:
  - ✅ Modal dedicado con información del usuario
  - ✅ Dos métodos:
    - **Automática**: Genera contraseña segura de 12 caracteres
    - **Manual**: Permite ingresar contraseña personalizada
  - ✅ Indicador de fortaleza de contraseña
  - ✅ Validación de coincidencia
  - ✅ Opciones configurables:
    - Forzar cambio en próximo login
    - Enviar email al usuario
    - Cerrar sesiones activas
  - ✅ Advertencias de seguridad
  - ✅ Detección de sesiones activas
  - ✅ Email profesional con la nueva contraseña

**Email enviado incluye**:
- Contraseña temporal
- Quién realizó el restablecimiento
- Advertencias de seguridad
- Botón directo al login
- Recomendaciones de contraseña segura

---

### 3. 📊 Actividad y Auditoría

#### Ver Actividad (desde menú de usuario)
- **Acceso**: Menú "Ver Actividad"
- **Funcionalidad**:
  - ✅ Redirige al historial de actividades del sistema
  - ✅ Filtra automáticamente por el usuario seleccionado
  - ✅ Muestra aviso visual del filtro aplicado
  - ✅ Botón para "Ver todas las actividades"

#### Ver Actividad Completa (desde modal)
- **Acceso**: Botón "Ver Actividad Completa" en pestaña Actividad del modal
- **Funcionalidad**:
  - ✅ Redirige al historial de actividades
  - ✅ Filtra por usuario actual del modal
  - ✅ Mantiene contexto del usuario

#### Pestaña Actividad en Modal
- **Características**:
  - ✅ Últimas 10 actividades del usuario
  - ✅ Formato visual con iconos por tipo de acción
  - ✅ Fecha relativa ("hace 2 horas", "ayer", etc.)
  - ✅ Descripción detallada de cada acción
  - ✅ Loading skeleton mientras carga

---

### 4. 👔 Gestión de Roles

#### Gestionar Roles
- **Acceso**: Menú "Gestionar Roles"
- **Estado**: 🚧 Pendiente de implementación completa
- **Funcionalidad actual**: Alert de próxima implementación

#### Asignación en Creación/Edición
- **Características**:
  - ✅ Lista de roles disponibles según tipo de usuario
  - ✅ Checkboxes múltiples
  - ✅ Auto-selección de rol "Ciudadano" para externos
  - ✅ Validación de al menos un rol
  - ✅ Vista previa de permisos (pendiente)

---

### 5. 🔍 Búsqueda y Filtrado

#### Búsqueda Global
- **Características**:
  - ✅ Búsqueda en tiempo real (con debounce)
  - ✅ Busca en: nombre, apellidos, email, cédula
  - ✅ Búsqueda case-insensitive
  - ✅ Limpieza rápida con botón X

#### Filtros
- **Por Tipo de Usuario**:
  - Todos
  - Funcionarios (Internos)
  - Ciudadanos (Externos)
  - Inactivos

- **Por Área**: Dropdown con áreas del sistema
- **Por Equipo**: Dropdown dinámico según área seleccionada
- **Por Rol**: Dropdown con todos los roles

**Indicadores**:
- ✅ Badge con número de filtros activos
- ✅ Botón "Limpiar Filtros"
- ✅ Actualización automática de resultados

---

### 6. 📧 Sistema de Emails

#### Email de Bienvenida
- **Cuándo se envía**: Al crear un nuevo usuario
- **Contenido**:
  - Mensaje de bienvenida personalizado
  - Contraseña temporal
  - Información del usuario (área, equipo)
  - Botón directo al login
  - Features del sistema
- **Diseño**: Profesional con gradiente azul

#### Email de Restablecimiento
- **Cuándo se envía**: Al restablecer contraseña (si se marca opción)
- **Contenido**:
  - Nueva contraseña temporal
  - Quién realizó el restablecimiento
  - Fecha y hora
  - Advertencias de seguridad
  - Recomendaciones de contraseña segura
  - Botón directo al login
- **Diseño**: Profesional con gradiente naranja

**Configuración**:
- Ver `CONFIG_EMAILS.md` para configurar SMTP
- Soporte para: Gmail, Mailtrap, SendGrid, Mailgun
- Modo log para desarrollo

---

### 7. 🎨 Interfaz de Usuario

#### Tabla de Usuarios
- **Características**:
  - ✅ Diseño responsivo
  - ✅ Fotos de perfil con iniciales si no hay foto
  - ✅ Estado activo/inactivo con toggle visual
  - ✅ Badges de roles
  - ✅ Íconos de área y equipo
  - ✅ Menú de acciones por usuario
  - ✅ Selección múltiple de usuarios
  - ✅ Skeleton loader durante carga

#### Paginación
- **Características**:
  - ✅ Selector de registros por página (10, 25, 50, 100)
  - ✅ Indicador "Mostrando X de Y"
  - ✅ Navegación por páginas
  - ✅ Actualización dinámica

#### Modales
- **Diseño**:
  - ✅ Bordes redondeados (20px)
  - ✅ Headers con gradientes de color
  - ✅ Animaciones suaves
  - ✅ Cierre con confirmación si hay cambios
  - ✅ Multi-paso con indicadores visuales

---

### 8. ⚡ Acciones Masivas

#### Selección Múltiple
- **Características**:
  - ✅ Checkbox de "Seleccionar todo"
  - ✅ Checkboxes individuales
  - ✅ Barra de acciones masivas (aparece al seleccionar)
  - ✅ Contador de seleccionados

#### Acciones Disponibles
- **Exportar**: 🚧 Pendiente
- **Cambiar Estado**: 🚧 Pendiente
- **Asignar Rol**: 🚧 Pendiente

---

### 9. 🔐 Estado de Usuario

#### Activar/Desactivar
- **Acceso**: Toggle en la tabla
- **Características**:
  - ✅ Modal de confirmación con información del usuario
  - ✅ Campos según acción:
    - **Desactivar**: Motivo, reasignar responsabilidades, notificar
    - **Activar**: Mensaje de bienvenida, reactivar accesos
  - ✅ Actualización visual inmediata en tabla
  - ✅ Highlight temporal en fila actualizada
  - ✅ Auditoría de cambios

---

### 10. 📱 Características Adicionales

#### Validaciones
- ✅ Email único
- ✅ Cédula única
- ✅ Contraseña mínimo 8 caracteres
- ✅ Confirmación de contraseña
- ✅ Foto máximo 2MB (JPG, PNG)
- ✅ Campos requeridos según tipo de usuario

#### Seguridad
- ✅ Escape de HTML para prevenir XSS
- ✅ Validación CSRF en todos los formularios
- ✅ Hashing seguro de contraseñas
- ✅ Manejo de sesión expirada
- ✅ Redirección automática al login si no hay sesión

#### UX
- ✅ Mensajes toast informativos
- ✅ Loading states
- ✅ Skeleton loaders
- ✅ Confirmaciones para acciones críticas
- ✅ Indicadores visuales de estado
- ✅ Hints y tooltips

---

## 🎯 Flujos de Trabajo

### Flujo: Crear Usuario Nuevo

1. **Click** en "Nuevo Usuario"
2. **Paso 1 - Información Personal**:
   - Seleccionar tipo de usuario
   - Ingresar datos personales
   - Subir foto (opcional)
3. **Paso 2 - Información Laboral** (solo funcionarios):
   - Seleccionar área
   - Seleccionar equipo
   - Ingresar cargo
4. **Paso 3 - Acceso y Seguridad**:
   - Ingresar contraseña
   - Confirmar contraseña
   - Ver indicador de fortaleza
   - Seleccionar roles
5. **Enviar**: 
   - Usuario creado
   - Email de bienvenida enviado
   - Usuario aparece en tabla

### Flujo: Restablecer Contraseña

1. **Click** en menú → "Restablecer Contraseña"
2. **Modal abierto** con datos del usuario
3. **Seleccionar método**:
   - **Automática**: Click en "Generar Nueva Contraseña"
   - **Manual**: Ingresar y confirmar contraseña
4. **Configurar opciones**:
   - ☑ Forzar cambio en próximo login
   - ☑ Enviar email al usuario
   - ☑ Cerrar sesiones activas
5. **Click** en "Restablecer Contraseña"
6. **Resultado**:
   - Contraseña actualizada
   - Email enviado (si se marcó)
   - Sesiones cerradas (si se marcó)
   - Toast de confirmación

### Flujo: Ver Actividad de Usuario

1. **Click** en menú → "Ver Actividad"
2. **Redirección** a Historial de Actividades
3. **Filtro automático** aplicado para ese usuario
4. **Ver** todas las acciones del usuario
5. **Opcional**: Click en "Ver todas las actividades" para quitar filtro

---

## 📊 Estadísticas (en Modal)

Las estadísticas mostradas incluyen:
- 📅 Último login
- ⏱️ Tiempo de sesión promedio
- 🎯 Acciones totales
- 📝 Acciones este mes
- 🏆 Rol principal
- 📧 Emails enviados

---

## 🔧 Funciones JavaScript Principales

### Nomenclatura en Español (según REGLAS_NOMENCLATURA.md)

**Carga de datos**:
- `cargarUsuarios()` - Carga lista de usuarios
- `cargarAreas()` - Carga áreas
- `cargarEquipos()` - Carga equipos por área
- `cargarRoles()` - Carga roles disponibles
- `cargarActividadUsuario()` - Carga actividad del usuario

**Modales**:
- `abrirModalCrear()` - Abre modal de creación
- `cerrarModal()` - Cierra modal
- `cerrarModalConConfirmacion()` - Cierra con confirmación si hay cambios
- `abrirModalDesactivar()` - Abre modal de desactivación
- `abrirModalActivar()` - Abre modal de activación

**Acciones CRUD**:
- `verUsuario(id)` - Ver detalle de usuario
- `editarUsuario(id)` - Editar usuario
- `eliminarUsuario(id)` - Eliminar usuario
- `restablecerPassword(id)` - Restablecer contraseña

**Validaciones**:
- `validarTabActual()` - Valida paso actual del formulario
- `validarFormularioFinal()` - Validación final antes de enviar
- `esEmailValido()` - Valida formato de email
- `verificarFortalezaPassword()` - Verifica fortaleza de contraseña
- `verificarCoincidenciaPassword()` - Verifica que coincidan contraseñas

**Utilidades**:
- `mostrarToast()` - Muestra mensaje temporal
- `mostrarError()` - Muestra error en campo
- `limpiarTodosLosErrores()` - Limpia errores del formulario
- `formatearFecha()` - Formatea fechas para mostrar
- `escapeHtml()` - Escapa HTML para prevenir XSS

**Actividad**:
- `verActividad(id)` - Redirige a historial de actividades filtrado
- `verActividadCompleta()` - Ver actividad completa desde modal
- `cargarActividadUsuario()` - Carga últimas actividades
- `obtenerIconoActividad()` - Obtiene ícono según tipo de acción
- `formatearFechaActividad()` - Formatea fecha relativa

---

## ✅ Checklist de Funcionalidades

### Completadas ✅
- [x] Crear usuario
- [x] Ver usuario (modal con pestañas)
- [x] Editar usuario
- [x] Restablecer contraseña
- [x] Ver actividad (redirección a historial)
- [x] Activar/Desactivar usuario
- [x] Búsqueda global
- [x] Filtros por tipo, área, equipo, rol
- [x] Paginación
- [x] Selección múltiple
- [x] Email de bienvenida
- [x] Email de restablecimiento
- [x] Indicador de fortaleza de contraseña
- [x] Validación en tiempo real
- [x] Skeleton loaders
- [x] Manejo de sesión expirada

### Pendientes 🚧
- [ ] Eliminar usuario (implementación completa con reasignación)
- [ ] Gestionar roles (modal dedicado)
- [ ] Exportar usuarios (PDF, Excel)
- [ ] Acciones masivas (cambio de estado, asignación de roles)
- [ ] Importar usuarios (CSV, Excel)
- [ ] Vista previa de permisos por rol
- [ ] Historial de cambios en perfil de usuario
- [ ] Notificaciones en tiempo real

---

## 📚 Documentación Relacionada

- `REGLAS_NOMENCLATURA.md` - Convenciones de nombres en español
- `CONFIG_EMAILS.md` - Configuración del sistema de correos
- `ACTIVITY_LOG_DOCUMENTATION.md` - Sistema de auditoría y logs
- `README.md` - Documentación general del proyecto

---

**Última actualización**: Octubre 2024  
**Versión**: 2.0  
**Responsable**: Equipo de Desarrollo SIA

