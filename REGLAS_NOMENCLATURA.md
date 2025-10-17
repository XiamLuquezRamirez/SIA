# Reglas de Nomenclatura - Proyecto SIA

## 📋 Principios Generales

Este documento establece las reglas de nomenclatura para mantener un código consistente, legible y en español.

---

## 🔤 Idioma del Código

### ✅ Usar ESPAÑOL para:
- Nombres de funciones
- Nombres de variables
- Nombres de constantes
- Comentarios en el código
- Mensajes al usuario
- Documentación

### ❌ NO usar inglés excepto:
- Palabras técnicas sin traducción clara (framework, API, endpoint, token)
- Nombres de librerías y frameworks (Laravel, Alpine.js)
- Atributos HTML estándar (class, id, data-)
- Propiedades CSS estándar

---

## 📝 Convenciones de Nomenclatura

### 1. Funciones (camelCase en español)

#### ✅ CORRECTO:
```javascript
function verUsuario(id) { }
function cerrarModal() { }
function cargarDatos() { }
function obtenerInformacion() { }
function guardarCambios() { }
function eliminarRegistro() { }
function buscarPorNombre(nombre) { }
```

#### ❌ INCORRECTO:
```javascript
function viewUser(id) { }          // Inglés
function closeModal() { }          // Inglés
function ver_usuario(id) { }       // snake_case (no usar)
function VerUsuario(id) { }        // PascalCase (solo para clases)
```

### 2. Variables (camelCase en español)

#### ✅ CORRECTO:
```javascript
let usuarioActual = null;
const datosFormulario = {};
let nombreCompleto = 'Juan Pérez';
const idUsuario = 123;
let esValido = true;
```

#### ❌ INCORRECTO:
```javascript
let currentUser = null;            // Inglés
let usuario_actual = null;         // snake_case
let UsuarioActual = null;          // PascalCase
```

### 3. Constantes (UPPER_CASE en español)

#### ✅ CORRECTO:
```javascript
const MAXIMO_USUARIOS = 100;
const RUTA_API = '/api/usuarios';
const TIEMPO_ESPERA = 5000;
const ESTADO_ACTIVO = 'activo';
```

#### ❌ INCORRECTO:
```javascript
const MAX_USERS = 100;             // Inglés
const maximoUsuarios = 100;        // camelCase (usar para constantes simples)
```

### 4. Clases (PascalCase en español)

#### ✅ CORRECTO:
```javascript
class GestorUsuarios { }
class AdministradorPermisos { }
class ValidadorFormularios { }
```

#### ❌ INCORRECTO:
```javascript
class UserManager { }              // Inglés
class gestorUsuarios { }           // camelCase
```

### 5. IDs de Elementos HTML (camelCase en español)

#### ✅ CORRECTO:
```html
<div id="modalVerUsuario"></div>
<input id="nombreUsuario" />
<button id="botonGuardar"></button>
<div id="contenedorPrincipal"></div>
```

#### ❌ INCORRECTO:
```html
<div id="userViewModal"></div>     <!-- Inglés -->
<div id="modal-ver-usuario"></div> <!-- kebab-case (solo para clases CSS) -->
<div id="MODAL_VER"></div>         <!-- UPPER_CASE -->
```

### 6. Clases CSS (kebab-case en español)

#### ✅ CORRECTO:
```css
.contenedor-principal { }
.boton-primario { }
.texto-destacado { }
.modal-usuario { }
```

#### ❌ INCORRECTO:
```css
.mainContainer { }                 /* camelCase */
.boton_primario { }               /* snake_case */
.BOTON-PRIMARIO { }               /* UPPER_CASE */
```

---

## 🎯 Nombres Específicos por Contexto

### Operaciones CRUD

```javascript
// Crear
function crearUsuario(datos) { }
function agregarElemento(item) { }
function registrarNuevo() { }

// Leer/Obtener
function obtenerUsuario(id) { }
function listarUsuarios() { }
function buscarPorId(id) { }
function cargarDatos() { }

// Actualizar
function actualizarUsuario(id, datos) { }
function modificarCampo(campo, valor) { }
function guardarCambios() { }

// Eliminar
function eliminarUsuario(id) { }
function removerElemento(id) { }
function borrarRegistro(id) { }
```

### Interfaz de Usuario

```javascript
// Modales
function abrirModal() { }
function cerrarModal() { }
function mostrarModal(id) { }

// Tabs
function cambiarTab(nombre) { }
function activarTab(index) { }
function mostrarTab(id) { }

// Formularios
function validarFormulario() { }
function limpiarCampos() { }
function llenarFormulario(datos) { }

// Mensajes
function mostrarToast(mensaje, tipo) { }
function mostrarAlerta(texto) { }
function ocultarMensaje() { }

// Carga
function mostrarCargador() { }
function ocultarCargador() { }
function activarSpinner() { }
```

### Estado y Validación

```javascript
// Verificación
function esValido() { }
function estaActivo() { }
function tienePermiso(permiso) { }
function puedeEditar() { }

// Estado
function activarUsuario(id) { }
function desactivarElemento(id) { }
function marcarComoLeido(id) { }
function cambiarEstado(nuevo) { }
```

---

## 📚 Vocabulario Técnico Común

### Términos que SÍ se traducen:

| Inglés | Español |
|--------|---------|
| user | usuario |
| view | ver/vista |
| edit | editar |
| delete | eliminar |
| create | crear |
| update | actualizar |
| save | guardar |
| load | cargar |
| show | mostrar |
| hide | ocultar |
| open | abrir |
| close | cerrar |
| search | buscar |
| filter | filtrar |
| sort | ordenar |
| list | listar |
| detail | detalle |
| form | formulario |
| button | botón |
| input | entrada |
| select | seleccionar |
| change | cambiar |
| toggle | alternar |
| validate | validar |
| check | verificar |

### Términos que NO se traducen:

| Término | Razón |
|---------|-------|
| API | Acrónimo estándar |
| endpoint | Término técnico sin buena traducción |
| token | Término técnico |
| hash | Término técnico |
| callback | Término técnico |
| refresh | Término técnico común |
| cache | Término técnico |
| debug | Término técnico |
| log | Término técnico |

---

## 🔄 Prefijos y Sufijos Comunes

### Prefijos (acciones):

```javascript
// Obtener/Recuperar
obtener... (obtenerUsuario, obtenerDatos)
cargar... (cargarArchivo, cargarConfiguracion)
buscar... (buscarUsuario, buscarPorNombre)
listar... (listarUsuarios, listarRoles)

// Crear/Agregar
crear... (crearUsuario, crearRegistro)
agregar... (agregarElemento, agregarItem)
registrar... (registrarNuevo, registrarCambio)

// Actualizar/Modificar
actualizar... (actualizarUsuario, actualizarEstado)
modificar... (modificarCampo, modificarValor)
guardar... (guardarCambios, guardarDatos)

// Eliminar/Remover
eliminar... (eliminarUsuario, eliminarArchivo)
remover... (removerElemento, removerRol)
borrar... (borrarRegistro, borrarCampo)

// Mostrar/Ocultar
mostrar... (mostrarModal, mostrarMensaje)
ocultar... (ocultarElemento, ocultarSeccion)
activar... (activarTab, activarBoton)
desactivar... (desactivarUsuario, desactivarOpcion)

// Verificar/Validar
verificar... (verificarPermiso, verificarCampo)
validar... (validarFormulario, validarEmail)
comprobar... (comprobarEstado, comprobarExiste)

// Inicializar/Configurar
inicializar... (inicializarApp, inicializarDatos)
configurar... (configurarModal, configurarOpciones)
preparar... (prepararFormulario, prepararDatos)
```

### Sufijos:

```javascript
...Usuario (crearUsuario, editarUsuario)
...Modal (abrirModal, cerrarModal)
...Formulario (validarFormulario, limpiarFormulario)
...Datos (cargarDatos, guardarDatos)
...Lista (actualizarLista, ordenarLista)
...Estado (cambiarEstado, verificarEstado)
```

---

## 📋 Ejemplos Completos

### Módulo de Usuarios:

```javascript
// Variables
let usuarioActual = null;
let listaUsuarios = [];
let modalAbierto = false;

// Constantes
const RUTA_API_USUARIOS = '/api/usuarios';
const TIEMPO_SESION = 3600;

// Funciones principales
async function cargarUsuarios() { }
async function obtenerUsuario(id) { }
async function crearUsuario(datos) { }
async function actualizarUsuario(id, datos) { }
async function eliminarUsuario(id) { }

// Funciones de UI
function abrirModalCrear() { }
function cerrarModalCrear() { }
function mostrarDetalleUsuario(id) { }
function ocultarDetalleUsuario() { }

// Funciones de validación
function validarEmail(email) { }
function validarCedula(cedula) { }
function esUsuarioValido(datos) { }

// Funciones auxiliares
function formatearNombre(nombre) { }
function obtenerIniciales(nombre, apellido) { }
function calcularEdad(fechaNacimiento) { }
```

### Módulo de Modal:

```javascript
// Variables del modal
let modalActual = null;
let tabActivo = 'personal';
let datosUsuario = null;

// Funciones del modal
function abrirModalVerUsuario(id) { }
function cerrarModalVerUsuario() { }
function cambiarTabVista(nombreTab) { }
function llenarModalDetalles(datos) { }
function limpiarModalFormulario() { }

// Funciones de tabs
function mostrarTabPersonal() { }
function mostrarTabLaboral() { }
function mostrarTabRoles() { }
function activarTab(nombre) { }
function desactivarTodosLosGabs() { }
```

---

## ✅ Checklist de Revisión

Antes de hacer commit, verificar:

- [ ] Todas las funciones están en español
- [ ] Todas las variables están en español
- [ ] Los comentarios están en español
- [ ] Los mensajes al usuario están en español
- [ ] Se usa camelCase para funciones y variables
- [ ] Se usa PascalCase para clases
- [ ] Se usa UPPER_CASE para constantes globales
- [ ] Los IDs HTML están en camelCase español
- [ ] Las clases CSS están en kebab-case español
- [ ] No hay mezcla de inglés y español innecesaria

---

## 🚫 Antipatrones a Evitar

### ❌ Mezclar idiomas:
```javascript
function getUserDatos(id) { }      // MALO: mezcla inglés y español
function obtenerUserData(id) { }   // MALO: mezcla español e inglés
```

### ❌ Traducción literal incorrecta:
```javascript
function buscarUsuariosPorNombreYApellido() { } // MALO: muy largo
// MEJOR:
function buscarUsuarios(criterio) { }
```

### ❌ Abreviaturas no claras:
```javascript
function obtUsrAct() { }           // MALO: no se entiende
// MEJOR:
function obtenerUsuarioActual() { }
```

---

## 📖 Referencias

- [Clean Code en JavaScript](https://github.com/ryanmcdermott/clean-code-javascript)
- [Guía de Estilo JavaScript de Airbnb](https://github.com/airbnb/javascript)
- Convenciones adaptadas a español

---

## 🔄 Actualización

Este documento debe actualizarse cuando:
- Se agreguen nuevos patrones comunes
- Se identifiquen inconsistencias
- El equipo acuerde nuevas convenciones

**Última actualización:** Octubre 2024
**Versión:** 1.0

