# 🎨 Guía de SweetAlert2 - Proyecto SIA

## 📋 Descripción

SweetAlert2 es la librería de alertas y modales utilizada en todo el proyecto SIA para proporcionar una experiencia de usuario moderna, accesible y consistente.

---

## 🚀 Instalación

SweetAlert2 está incluido via CDN en `resources/views/components/app-layout.blade.php`:

```html
<!-- SweetAlert2 -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css">
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
```

**Versión**: 11.x (Última estable)

---

## 🎯 Funciones Helper Disponibles

### 1. **mostrarExito(mensaje, titulo)**

Muestra una alerta de éxito con ícono verde.

```javascript
mostrarExito('Usuario creado exitosamente');
mostrarExito('Cambios guardados', 'Guardado');
```

**Características**:
- ✅ Ícono: success (✓ verde)
- ✅ Color de botón: Azul (#2563eb)
- ✅ Botón: "Aceptar"

---

### 2. **mostrarErrorAlerta(mensaje, titulo)**

Muestra una alerta de error con ícono rojo.

```javascript
mostrarErrorAlerta('No se pudo guardar el usuario');
mostrarErrorAlerta('Acceso denegado', 'Error de Permisos');
```

**Características**:
- ✅ Ícono: error (✗ rojo)
- ✅ Color de botón: Rojo (#dc2626)
- ✅ Botón: "Aceptar"

---

### 3. **mostrarAdvertencia(mensaje, titulo)**

Muestra una alerta de advertencia con ícono amarillo.

```javascript
mostrarAdvertencia('Este campo es requerido', 'Campo Requerido');
mostrarAdvertencia('La sesión expirará pronto');
```

**Características**:
- ✅ Ícono: warning (⚠ amarillo)
- ✅ Color de botón: Naranja (#f59e0b)
- ✅ Botón: "Aceptar"

---

### 4. **mostrarInfo(mensaje, titulo)**

Muestra una alerta informativa con ícono azul.

```javascript
mostrarInfo('La exportación puede tardar unos minutos');
mostrarInfo('Funcionalidad próximamente', 'En Desarrollo');
```

**Características**:
- ✅ Ícono: info (ℹ azul)
- ✅ Color de botón: Azul (#2563eb)
- ✅ Botón: "Aceptar"

---

### 5. **mostrarConfirmacion(opciones)**

Muestra un diálogo de confirmación con botones Sí/No.

```javascript
// Uso básico
const confirmado = await mostrarConfirmacion();
if (confirmado) {
    // Usuario confirmó
}

// Con opciones personalizadas
const confirmado = await mostrarConfirmacion({
    title: '¿Eliminar Usuario?',
    text: 'Esta acción no se puede deshacer',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'No, cancelar',
    confirmButtonColor: '#dc2626'
});
```

**Opciones disponibles**:
- `title`: Título del modal
- `text`: Texto descriptivo
- `icon`: 'warning', 'question', 'info', etc.
- `confirmButtonText`: Texto del botón de confirmación
- `cancelButtonText`: Texto del botón de cancelar
- `confirmButtonColor`: Color del botón de confirmación
- `cancelButtonColor`: Color del botón de cancelar

**Valores por defecto**:
```javascript
{
    title: '¿Está seguro?',
    text: "Esta acción no se puede deshacer",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#2563eb',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Sí, confirmar',
    cancelButtonText: 'Cancelar',
    reverseButtons: true
}
```

---

### 6. **mostrarToast(mensaje, tipo)**

Muestra una notificación toast en la esquina superior derecha.

```javascript
mostrarToast('Usuario guardado', 'success');
mostrarToast('Error al cargar datos', 'error');
mostrarToast('Cargando...', 'info');
mostrarToast('Revise los datos', 'warning');
```

**Tipos disponibles**:
- `'success'` - Verde con ícono ✓
- `'error'` - Rojo con ícono ✗
- `'warning'` - Amarillo con ícono ⚠
- `'info'` - Azul con ícono ℹ

**Características**:
- ✅ Posición: top-end (esquina superior derecha)
- ✅ Duración: 3 segundos
- ✅ Progress bar visible
- ✅ Se pausa al hover
- ✅ Se auto-cierra
- ✅ No requiere confirmación

---

## 📚 Ejemplos de Uso

### Ejemplo 1: Crear Usuario

```javascript
async function crearUsuario(datos) {
    try {
        const response = await fetch('/api/usuarios', {
            method: 'POST',
            body: JSON.stringify(datos)
        });

        if (response.ok) {
            mostrarToast('Usuario creado exitosamente', 'success');
            cargarUsuarios();
        } else {
            mostrarErrorAlerta('No se pudo crear el usuario');
        }
    } catch (error) {
        mostrarErrorAlerta('Error de conexión');
    }
}
```

### Ejemplo 2: Eliminar con Confirmación

```javascript
async function eliminarUsuario(id) {
    const confirmado = await mostrarConfirmacion({
        title: '¿Eliminar Usuario?',
        text: 'Esta acción no se puede deshacer. El usuario será eliminado permanentemente.',
        confirmButtonText: 'Sí, eliminar',
        confirmButtonColor: '#dc2626',
        icon: 'warning'
    });

    if (confirmado) {
        // Proceder con eliminación
        try {
            await fetch(`/api/usuarios/${id}`, { method: 'DELETE' });
            mostrarToast('Usuario eliminado', 'success');
        } catch (error) {
            mostrarErrorAlerta('Error al eliminar usuario');
        }
    }
}
```

### Ejemplo 3: Modal con Input

```javascript
async function solicitarMotivo() {
    const result = await Swal.fire({
        title: 'Motivo del Cambio',
        input: 'textarea',
        inputPlaceholder: 'Ingrese el motivo...',
        showCancelButton: true,
        confirmButtonText: 'Enviar',
        cancelButtonText: 'Cancelar',
        inputValidator: (value) => {
            if (!value) {
                return 'Debe ingresar un motivo';
            }
        }
    });

    if (result.isConfirmed) {
        const motivo = result.value;
        // Procesar motivo
    }
}
```

### Ejemplo 4: Loading durante Operación

```javascript
async function operacionLarga() {
    Swal.fire({
        title: 'Procesando...',
        text: 'Por favor espere',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        willOpen: () => {
            Swal.showLoading();
        }
    });

    try {
        await realizarOperacion();
        Swal.close();
        mostrarToast('Operación completada', 'success');
    } catch (error) {
        Swal.close();
        mostrarErrorAlerta('Error en la operación');
    }
}
```

---

## 🎨 Tipos de Iconos Disponibles

```javascript
{
    success: '✓',   // Verde
    error: '✗',     // Rojo
    warning: '⚠',   // Amarillo
    info: 'ℹ',      // Azul
    question: '?'   // Azul claro
}
```

---

## 🎯 Casos de Uso Comunes en SIA

### 1. Cerrar Modal con Cambios

```javascript
async function cerrarModalConConfirmacion() {
    if (formChanged) {
        const confirmado = await mostrarConfirmacion({
            title: '¿Descartar cambios?',
            text: 'Hay cambios sin guardar. ¿Estás seguro de que deseas salir?',
            confirmButtonText: 'Sí, descartar',
            cancelButtonText: 'Continuar editando',
            confirmButtonColor: '#dc2626'
        });

        if (confirmado) {
            cerrarModal();
        }
    } else {
        cerrarModal();
    }
}
```

### 2. Remover Rol con Confirmación

```javascript
async function removerRol(nombreRol) {
    const confirmado = await mostrarConfirmacion({
        title: '¿Remover Rol?',
        text: `¿Está seguro de remover el rol "${nombreRol}"?`,
        confirmButtonText: 'Sí, remover',
        confirmButtonColor: '#dc2626'
    });

    if (confirmado) {
        // Proceder con remoción
    }
}
```

### 3. Solicitar Motivo de Cambio

```javascript
async function solicitarMotivoEdicion() {
    const motivo = await mostrarDialogoCambioMotivo();
    
    if (motivo) {
        // Usuario ingresó motivo y confirmó
        procederConCambio(motivo);
    } else {
        // Usuario canceló
        revertirCambios();
    }
}
```

### 4. Confirmación de Coordinador/Líder

```javascript
async function validarCambioArea() {
    if (esCoordinador) {
        const confirmado = await mostrarConfirmacionCoordinador();
        if (!confirmado) {
            // Cancelar cambio
            return false;
        }
    }
    
    if (esLider) {
        const confirmado = await mostrarConfirmacionLider();
        if (!confirmado) {
            // Cancelar cambio
            return false;
        }
    }
    
    return true;
}
```

---

## 📊 Comparativa: Antes vs Después

### Antes (Nativo)

```javascript
// Alert simple
alert('Usuario creado');

// Confirm
if (confirm('¿Eliminar usuario?')) {
    eliminar();
}

// Toast personalizado
const toast = document.createElement('div');
toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg';
toast.textContent = 'Guardado';
document.body.appendChild(toast);
setTimeout(() => toast.remove(), 3000);
```

### Después (SweetAlert2)

```javascript
// Alert mejorado
mostrarExito('Usuario creado');

// Confirm mejorado
if (await mostrarConfirmacion({ 
    title: '¿Eliminar usuario?' 
})) {
    eliminar();
}

// Toast mejorado
mostrarToast('Guardado', 'success');
```

---

## 🎨 Personalización de Colores

### Paleta de Colores del Proyecto

```javascript
const colores = {
    azul: '#2563eb',      // Primario
    rojo: '#dc2626',      // Peligro
    verde: '#10b981',     // Éxito
    amarillo: '#f59e0b',  // Advertencia
    naranja: '#ea580c',   // Acento
    purpura: '#9333ea',   // Secundario
    gris: '#6b7280'       // Neutral
};
```

---

## ✅ Ventajas de SweetAlert2

### UI/UX
- ✅ **Diseño moderno** y profesional
- ✅ **Animaciones suaves** (fade in/out)
- ✅ **Responsive** automático
- ✅ **Accesible** (teclado, screen readers)
- ✅ **Personalizable** 100%

### Funcionalidad
- ✅ **Promesas nativas** (async/await)
- ✅ **Inputs integrados** (text, textarea, select, radio, checkbox)
- ✅ **Validación de inputs**
- ✅ **Progress bar** en toasts
- ✅ **Loading states** integrados
- ✅ **HTML personalizado**

### Desarrollo
- ✅ **Menos código** (elimina modales personalizados)
- ✅ **Mantenible** (API consistente)
- ✅ **Documentación** extensa
- ✅ **TypeScript** support
- ✅ **Sin dependencias** (framework-agnostic)

---

## 📖 Funciones Implementadas en SIA

### Básicas
| Función | Uso | Ejemplo |
|---------|-----|---------|
| `mostrarExito()` | Operación exitosa | Usuario creado |
| `mostrarErrorAlerta()` | Operación fallida | Error al guardar |
| `mostrarAdvertencia()` | Precaución | Campo requerido |
| `mostrarInfo()` | Información | Próximamente |
| `mostrarConfirmacion()` | Confirmación | ¿Eliminar? |
| `mostrarToast()` | Notificación rápida | Guardado |

### Especializadas
| Función | Propósito |
|---------|-----------|
| `mostrarConfirmacionCoordinador()` | Confirmar cambio de área de coordinador |
| `mostrarConfirmacionLider()` | Confirmar cambio de equipo de líder |
| `mostrarDialogoCambioMotivo()` | Solicitar motivo de cambio |

---

## 🔧 Configuración Personalizada

### Configurar Toast Global

```javascript
const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
});

Toast.fire({
    icon: 'success',
    title: 'Guardado exitosamente'
});
```

### Configurar Alerta Compleja

```javascript
Swal.fire({
    title: 'Título Personalizado',
    html: '<div>HTML personalizado</div>',
    icon: 'question',
    imageUrl: '/img/custom-icon.png',
    imageWidth: 100,
    imageHeight: 100,
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Sí, proceder!',
    cancelButtonText: 'No, cancelar',
    reverseButtons: true,
    footer: '<a href="#">¿Necesitas ayuda?</a>',
    backdrop: true,
    allowOutsideClick: false,
    allowEscapeKey: false,
    allowEnterKey: true
});
```

---

## 🎭 Tipos de Modales

### 1. Modal Simple

```javascript
Swal.fire('¡Hola!', 'Mensaje simple', 'info');
```

### 2. Modal con HTML

```javascript
Swal.fire({
    title: 'Información Detallada',
    html: `
        <ul style="text-align: left;">
            <li>Item 1</li>
            <li>Item 2</li>
            <li>Item 3</li>
        </ul>
    `
});
```

### 3. Modal con Input

```javascript
const { value: email } = await Swal.fire({
    title: 'Ingrese su email',
    input: 'email',
    inputPlaceholder: 'email@ejemplo.com',
    inputValidator: (value) => {
        if (!value) {
            return 'Debe ingresar un email';
        }
    }
});
```

Tipos de input disponibles:
- `text`, `email`, `password`, `number`, `tel`, `range`, `textarea`
- `select`, `radio`, `checkbox`
- `file`, `url`

### 4. Modal con Imagen

```javascript
Swal.fire({
    title: 'Usuario Creado',
    text: 'El usuario ha sido creado exitosamente',
    imageUrl: '/storage/usuarios/foto.jpg',
    imageWidth: 100,
    imageHeight: 100,
    imageAlt: 'Foto de perfil'
});
```

### 5. Modal Encadenado (Steps)

```javascript
const steps = ['1', '2', '3'];
const swalQueueStep = Swal.mixin({
    confirmButtonText: 'Siguiente →',
    cancelButtonText: 'Atrás',
    progressSteps: steps,
    reverseButtons: true
});

const values = [];
let currentStep;

for (currentStep = 0; currentStep < steps.length;) {
    const result = await swalQueueStep.fire({
        title: `Paso ${currentStep + 1}`,
        text: `Contenido del paso ${currentStep + 1}`,
        currentProgressStep: currentStep,
        showCancelButton: currentStep > 0,
        confirmButtonText: currentStep === steps.length - 1 ? 'Finalizar' : 'Siguiente →'
    });

    if (result.isConfirmed) {
        values[currentStep] = result.value;
        currentStep++;
    } else if (result.dismiss === Swal.DismissReason.cancel) {
        currentStep--;
    } else {
        break;
    }
}
```

---

## 🎯 Casos de Uso Específicos

### 1. Loading con Progreso

```javascript
Swal.fire({
    title: 'Exportando usuarios...',
    html: 'Procesando <b></b> de 100 usuarios',
    timerProgressBar: true,
    didOpen: () => {
        Swal.showLoading();
        const b = Swal.getHtmlContainer().querySelector('b');
        let progress = 0;
        
        const timerInterval = setInterval(() => {
            progress++;
            b.textContent = progress;
            if (progress >= 100) {
                clearInterval(timerInterval);
                Swal.close();
            }
        }, 50);
    }
});
```

### 2. Auto-cierre con Timer

```javascript
let timerInterval;
Swal.fire({
    title: 'Redirigiendo...',
    html: 'Serás redirigido en <b></b> segundos.',
    timer: 5000,
    timerProgressBar: true,
    didOpen: () => {
        Swal.showLoading();
        const b = Swal.getHtmlContainer().querySelector('b');
        timerInterval = setInterval(() => {
            b.textContent = Math.ceil(Swal.getTimerLeft() / 1000);
        }, 100);
    },
    willClose: () => {
        clearInterval(timerInterval);
    }
}).then((result) => {
    if (result.dismiss === Swal.DismissReason.timer) {
        window.location.href = '/destino';
    }
});
```

### 3. Confirmación con Checkbox

```javascript
const { value: accept } = await Swal.fire({
    title: 'Términos y condiciones',
    input: 'checkbox',
    inputValue: 0,
    inputPlaceholder: 'Acepto los términos y condiciones',
    confirmButtonText: 'Continuar',
    inputValidator: (result) => {
        return !result && 'Debes aceptar los términos';
    }
});

if (accept) {
    mostrarToast('Términos aceptados', 'success');
}
```

---

## 🚨 Migraciones Realizadas

### alerts() → SweetAlert2

| Antes | Después |
|-------|---------|
| `alert('Mensaje')` | `mostrarInfo('Mensaje')` |
| `alert('Error!')` | `mostrarErrorAlerta('Error!')` |
| `alert('¡Éxito!')` | `mostrarExito('¡Éxito!')` |

### confirm() → SweetAlert2

| Antes | Después |
|-------|---------|
| `if (confirm('¿Seguro?'))` | `if (await mostrarConfirmacion())` |
| `if (confirm('¿Eliminar?'))` | `if (await mostrarConfirmacion({ title: '¿Eliminar?' }))` |

### Modales Personalizados → SweetAlert2

| Modal Personalizado | SweetAlert2 |
|---------------------|-------------|
| Modal con overlay + HTML | `Swal.fire({ html: '...' })` |
| Modal con botones custom | `Swal.fire({ confirmButtonText, cancelButtonText })` |
| Modal con input | `Swal.fire({ input: 'text' })` |

---

## 📚 Recursos Adicionales

- [Documentación Oficial](https://sweetalert2.github.io/)
- [Ejemplos en Vivo](https://sweetalert2.github.io/#examples)
- [GitHub Repository](https://github.com/sweetalert2/sweetalert2)
- [Configuración API](https://sweetalert2.github.io/#configuration)

---

## ✅ Checklist de Implementación

- [x] Incluir SweetAlert2 via CDN
- [x] Crear funciones helper en español
- [x] Reemplazar todos los `alert()`
- [x] Reemplazar todos los `confirm()`
- [x] Reemplazar modales personalizados
- [x] Implementar toast notifications
- [x] Personalizar colores del proyecto
- [x] Documentar uso y ejemplos

---

## 🎨 Personalización Avanzada

### Tema Oscuro

```javascript
Swal.fire({
    title: 'Tema Oscuro',
    background: '#1f2937',
    color: '#ffffff',
    confirmButtonColor: '#2563eb'
});
```

### Posiciones de Toast

```javascript
const positions = [
    'top', 'top-start', 'top-end',
    'center', 'center-start', 'center-end',
    'bottom', 'bottom-start', 'bottom-end'
];

Toast.fire({
    icon: 'success',
    title: 'Toast en diferente posición',
    position: 'bottom-end'
});
```

---

**Última actualización**: Octubre 2024  
**Versión**: 1.0  
**SweetAlert2 Version**: 11.x  
**Responsable**: Equipo de Desarrollo SIA

