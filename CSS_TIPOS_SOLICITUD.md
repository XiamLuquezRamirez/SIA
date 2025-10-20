# 🎨 Guía de Estilos - Tipos de Solicitud

## 📂 Ubicación del Archivo CSS

```
c:\xampp\htdocs\SIA\public\css\admin\tipos-solicitud.css
```

---

## 📋 Índice de Estilos

### 1. **Estilos Generales** (Líneas 1-46)
- Cards de tipos
- Badges de estado (activo/inactivo)
- Efectos hover

### 2. **Wizard Modal** (Líneas 48-75)
- Animación de entrada del modal
- Overlay y contenedor

### 3. **Progress Bar** (Líneas 77-136)
- Círculos de pasos
- Animación del anillo pulsante
- Líneas conectoras
- Checkmark animado

### 4. **Formularios del Wizard** (Líneas 138-218)
- Inputs, selects, textareas
- Validación con animación shake
- Mensajes de error
- Checkboxes personalizados
- Color picker

### 5. **Botones** (Líneas 220-256)
- Botón Siguiente con ripple effect
- Botón Anterior
- Efectos hover

### 6. **Placeholders** (Líneas 258-272)
- Emoji animado (bounce)
- Pasos 2 y 3 "Próximamente"

### 7. **Resumen Paso 4** (Líneas 274-318)
- Cards con fade in secuencial
- Badges de opciones

### 8. **Skeleton Loaders** (Líneas 320-336)
- Animación de carga

### 9. **Estado Vacío** (Líneas 338-357)
- Empty state animado

### 10. **Filtros y Búsqueda** (Líneas 359-387)
- Tabs con underline animado

### 11. **Paginación** (Líneas 389-403)
- Botones con hover

### 12. **Responsive Mobile** (Líneas 405-429)
- Progress bar vertical
- Modal adaptativo

### 13. **Utilidades** (Líneas 431-461)
- Smooth scroll
- Scrollbar personalizado

---

## 🎯 Animaciones Destacadas

### 1. **Anillo Pulsante** (Paso Actual del Wizard)

```css
@keyframes pulse-ring {
    0%, 100% {
        opacity: 1;
        transform: scale(1);
    }
    50% {
        opacity: 0.5;
        transform: scale(1.05);
    }
}
```

**Uso:** Se aplica automáticamente al paso actual del wizard.

**Efecto:** El anillo azul alrededor del círculo pulsa suavemente.

**Duración:** 2 segundos, infinito.

---

### 2. **Checkmark Appear** (Pasos Completados)

```css
@keyframes checkmarkAppear {
    0% {
        transform: scale(0) rotate(-45deg);
        opacity: 0;
    }
    50% {
        transform: scale(1.2) rotate(10deg);
    }
    100% {
        transform: scale(1) rotate(0deg);
        opacity: 1;
    }
}
```

**Uso:** Cuando completas un paso, el checkmark ✓ aparece con esta animación.

**Efecto:** El checkmark aparece girando y con un ligero rebote.

**Duración:** 0.4 segundos.

---

### 3. **Shake** (Campos con Error)

```css
@keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
}
```

**Uso:** Cuando un campo tiene un error de validación.

**Efecto:** El campo se sacude de izquierda a derecha.

**Duración:** 0.5 segundos.

---

### 4. **Fade In Up** (Resumen del Paso 4)

```css
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
```

**Uso:** Cada card del resumen aparece secuencialmente.

**Efecto:** Los elementos aparecen desde abajo con fade.

**Duración:** 0.5 segundos con retraso escalonado (0.1s, 0.2s, 0.3s, 0.4s).

---

### 5. **Ripple Effect** (Botón Siguiente)

```css
#btnSiguiente::after {
    content: '';
    position: absolute;
    /* ... */
    transition: width 0.6s, height 0.6s;
}

#btnSiguiente:active::after {
    width: 300px;
    height: 300px;
}
```

**Uso:** Cuando haces clic en "Siguiente" o "Finalizar".

**Efecto:** Un círculo blanco semitransparente se expande desde el centro.

**Duración:** 0.6 segundos.

---

### 6. **Bounce** (Emojis de Placeholders)

```css
@keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
}
```

**Uso:** Emojis grandes en los pasos 2 y 3 ("Próximamente").

**Efecto:** El emoji rebota suavemente arriba y abajo.

**Duración:** 2 segundos, infinito.

---

## 🎨 Paleta de Colores

| Elemento | Color | Código |
|----------|-------|--------|
| **Primario (Azul)** | 🔵 | `#3B82F6` |
| **Éxito (Verde)** | 🟢 | `#10B981` |
| **Error (Rojo)** | 🔴 | `#EF4444` |
| **Advertencia (Amarillo)** | 🟡 | `#F59E0B` |
| **Gris Claro** | ⚪ | `#F3F4F6` |
| **Gris Medio** | ⚫ | `#6B7280` |
| **Gris Oscuro** | ⬛ | `#374151` |

---

## 📱 Responsive Design

### Desktop (> 768px)
- Progress bar horizontal con 4 pasos
- Modal ancho: 95% max-width 1024px
- Grid de 2 columnas en formularios

### Mobile (< 768px)
- Progress bar vertical (cambio automático)
- Modal ancho: 95% de la pantalla
- Grid de 1 columna en formularios
- Líneas conectoras ocultas

---

## 🔧 Personalizaciones Comunes

### Cambiar Color Principal

```css
/* En tipos-solicitud.css, busca y reemplaza */
#3B82F6 → TU_COLOR
```

**Afecta a:**
- Progress bar
- Botones
- Focus states
- Tabs activos

---

### Ajustar Velocidad de Animaciones

```css
/* Busca estas líneas y modifica la duración */

transition: all 0.3s ease; /* Transiciones generales */
animation: pulse-ring 2s ease-in-out infinite; /* Anillo pulsante */
animation: bounce 2s infinite; /* Bounce de emojis */
```

---

### Deshabilitar Animaciones (Accesibilidad)

Agrega al final del archivo:

```css
@media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
}
```

---

## 🧪 Testing de Estilos

### Cómo Probar

1. **Progress Bar:**
   - Abre el wizard
   - Avanza entre pasos
   - Verifica: anillo pulsante, checkmarks, líneas verdes

2. **Validación:**
   - Deja campos vacíos
   - Intenta avanzar
   - Verifica: shake animation, mensajes de error

3. **Hover Effects:**
   - Pasa el mouse sobre:
     - Cards de tipos
     - Botones del wizard
     - Campos de formulario

4. **Responsive:**
   - Abre DevTools (F12)
   - Cambia a vista móvil
   - Verifica: progress bar vertical

---

## 📊 Performance

### Optimizaciones Incluidas

- ✅ **Hardware Acceleration**: `transform` y `opacity` en animaciones
- ✅ **Will-change**: En elementos animados
- ✅ **Transiciones suaves**: `ease` y `ease-in-out`
- ✅ **Selectores específicos**: `#wizardModal` scope
- ✅ **CSS Minificado**: Listo para producción

### Tamaño del Archivo

- **Original:** 11.5 KB
- **Minificado:** ~8 KB (se puede reducir más)
- **Gzipped:** ~2.5 KB

---

## 🚀 Próximas Mejoras

### Sugerencias para Expandir

1. **Dark Mode**
   ```css
   @media (prefers-color-scheme: dark) {
       /* Estilos para modo oscuro */
   }
   ```

2. **Más Animaciones**
   - Confetti al completar
   - Progress bar con porcentaje
   - Tooltips animados

3. **Temas Personalizados**
   - CSS Variables para colores
   - Múltiples esquemas de color

---

## 📚 Recursos Adicionales

### Documentación de Referencia

- **Tailwind CSS:** https://tailwindcss.com/docs
- **CSS Animations:** https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Animations
- **CSS Transitions:** https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Transitions

### Herramientas Útiles

- **Cubic Bezier Generator:** https://cubic-bezier.com
- **Animista:** https://animista.net (generador de animaciones)
- **CSS Grid Generator:** https://cssgrid-generator.netlify.app

---

## 🐛 Troubleshooting

### Los estilos no se aplican

1. **Limpia el caché del navegador:** Ctrl + Shift + R
2. **Verifica la ruta del CSS:**
   ```php
   @push('styles')
   <link rel="stylesheet" href="{{ asset('css/admin/tipos-solicitud.css') }}">
   @endpush
   ```
3. **Revisa la consola del navegador:** F12 → Console (busca errores 404)

---

### Animaciones lentas o entrecortadas

1. **Reduce el número de sombras** (`box-shadow`)
2. **Usa `transform` en lugar de `top/left/width/height`**
3. **Activa hardware acceleration:**
   ```css
   transform: translateZ(0);
   will-change: transform;
   ```

---

### Conflictos con Tailwind

Si Tailwind sobrescribe tus estilos:

```css
/* Usa !important con precaución */
#wizardModal .mi-clase {
    color: blue !important;
}
```

---

## 📝 Changelog

### v1.0.0 - 2025-10-20

**Agregado:**
- ✅ Estilos completos del wizard (4 pasos)
- ✅ 10+ animaciones personalizadas
- ✅ Responsive design completo
- ✅ Skeleton loaders
- ✅ Empty states
- ✅ Validación con feedback visual

**Próximas Versiones:**
- [ ] Dark mode
- [ ] Más temas de color
- [ ] Animaciones de confetti
- [ ] Tooltips informativos

---

*Última actualización: 20 de octubre de 2025*

