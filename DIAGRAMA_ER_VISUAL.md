# 📊 Diagrama Entidad-Relación Visual - SIA

## 🎨 Diagrama Completo (Mermaid)

**Copia este código en:** https://mermaid.live/ para ver el diagrama visual

```mermaid
erDiagram
    USERS {
        bigint id PK
        string tipo_documento
        string cedula UK "Único"
        string nombre
        string apellidos  
        string email UK "Único"
        string password
        string telefono
        string celular
        string direccion
        string foto_url
        bigint area_id FK "Nullable"
        bigint equipo_id FK "Nullable"
        string cargo "Nullable"
        enum tipo_usuario "interno/externo"
        boolean activo "default true"
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at "Soft Delete"
    }

    AREAS {
        bigint id PK
        string nombre
        string slug UK "Único"
        text descripcion
        bigint coordinador_id FK "Nullable"
        boolean activo "default true"
        timestamp created_at
        timestamp updated_at
    }

    EQUIPOS {
        bigint id PK
        string nombre
        string slug UK "Único"
        bigint area_id FK
        bigint lider_id FK "Nullable"
        text funciones
        boolean activo "default true"
        timestamp created_at
        timestamp updated_at
    }

    ROLES {
        bigint id PK
        string name UK "Único con guard"
        string guard_name "web"
        timestamp created_at
        timestamp updated_at
    }

    PERMISSIONS {
        bigint id PK
        string name UK "Único con guard"
        string guard_name "web"
        timestamp created_at
        timestamp updated_at
    }

    MODEL_HAS_ROLES {
        bigint role_id FK
        string model_type "App-Models-User"
        bigint model_id FK
    }

    MODEL_HAS_PERMISSIONS {
        bigint permission_id FK
        string model_type "App-Models-User"
        bigint model_id FK
    }

    ROLE_HAS_PERMISSIONS {
        bigint permission_id FK
        bigint role_id FK
    }

    PASSWORD_RESET_TOKENS {
        string email PK
        string token
        timestamp created_at
    }

    PERSONAL_ACCESS_TOKENS {
        bigint id PK
        string tokenable_type
        bigint tokenable_id
        string name
        string token UK "Hash de 64 chars"
        text abilities "JSON"
        timestamp last_used_at
        timestamp expires_at
        timestamp created_at
        timestamp updated_at
    }

    FAILED_JOBS {
        bigint id PK
        string uuid UK
        text connection
        text queue
        longtext payload
        longtext exception
        timestamp failed_at
    }

    %% Relaciones Organizacionales
    USERS }o--|| AREAS : "pertenece_a"
    USERS }o--|| EQUIPOS : "es_miembro_de"
    AREAS ||--o| USERS : "coordinador"
    EQUIPOS ||--o| USERS : "lider"
    AREAS ||--o{ EQUIPOS : "contiene"
    EQUIPOS }o--|| AREAS : "pertenece_a"

    %% Relaciones de Permisos (Spatie)
    USERS ||--o{ MODEL_HAS_ROLES : "tiene"
    ROLES ||--o{ MODEL_HAS_ROLES : "asignado_a"
    USERS ||--o{ MODEL_HAS_PERMISSIONS : "tiene_directo"
    PERMISSIONS ||--o{ MODEL_HAS_PERMISSIONS : "asignado_a"
    ROLES ||--o{ ROLE_HAS_PERMISSIONS : "contiene"
    PERMISSIONS ||--o{ ROLE_HAS_PERMISSIONS : "pertenece_a"

    %% Otras relaciones
    USERS ||--o{ PASSWORD_RESET_TOKENS : "email"
    USERS ||--o{ PERSONAL_ACCESS_TOKENS : "posee_tokens"
```

---

## 🎯 Diagrama Simplificado (Core)

**Solo las tablas principales y sus relaciones:**

```mermaid
erDiagram
    USERS ||--o{ USERS : "auto-relacion"
    USERS }o--|| AREAS : "pertenece"
    USERS }o--|| EQUIPOS : "trabaja_en"
    AREAS ||--o{ EQUIPOS : "contiene"
    AREAS ||--o| USERS : "coordinador"
    EQUIPOS ||--o| USERS : "lider"
    USERS }o--o{ ROLES : "tiene_roles"
    ROLES }o--o{ PERMISSIONS : "tiene_permisos"

    USERS {
        bigint id PK
        string cedula UK
        string nombre
        string email UK
        bigint area_id FK
        bigint equipo_id FK
        enum tipo_usuario
        boolean activo
    }

    AREAS {
        bigint id PK
        string nombre
        bigint coordinador_id FK
    }

    EQUIPOS {
        bigint id PK
        string nombre
        bigint area_id FK
        bigint lider_id FK
    }

    ROLES {
        bigint id PK
        string name UK
    }

    PERMISSIONS {
        bigint id PK
        string name UK
    }
```

---

## 🏗️ Arquitectura de Datos por Módulos

### Módulo de Usuarios 👥

```
USERS (Tabla Principal)
  ├── Información Personal
  │   ├── tipo_documento
  │   ├── cedula (único)
  │   ├── nombre
  │   ├── apellidos
  │   ├── email (único)
  │   ├── telefono
  │   ├── celular
  │   ├── direccion
  │   └── foto_url
  │
  ├── Información Laboral (solo internos)
  │   ├── area_id → AREAS
  │   ├── equipo_id → EQUIPOS
  │   └── cargo
  │
  ├── Configuración
  │   ├── tipo_usuario (interno/externo)
  │   ├── activo (boolean)
  │   └── password (hashed)
  │
  └── Permisos
      └── roles → MODEL_HAS_ROLES → ROLES → PERMISSIONS
```

### Módulo Organizacional 🏢

```
AREAS
  ├── nombre
  ├── slug (único)
  ├── descripcion
  ├── coordinador_id → USERS
  ├── activo
  └── RELACIONES:
      ├── hasMany(EQUIPOS)
      ├── hasMany(USERS)
      └── belongsTo(USER, coordinador)

EQUIPOS
  ├── nombre
  ├── slug (único)
  ├── area_id → AREAS
  ├── lider_id → USERS
  ├── funciones
  ├── activo
  └── RELACIONES:
      ├── belongsTo(AREA)
      ├── belongsTo(USER, lider)
      └── hasMany(USERS, miembros)
```

### Sistema de Permisos 🔐

```
SPATIE PERMISSION (Laravel Package)

PERMISSIONS
  └── name (ej: usuarios.ver, usuarios.crear)

ROLES
  ├── name (ej: Super Administrador, Funcionario)
  └── permissions[] (múltiples)

ASSIGNMENTS
  ├── model_has_roles (User → Role)
  ├── model_has_permissions (User → Permission directo)
  └── role_has_permissions (Role → Permission)
```

---

## 🔄 Flujo de Datos Típico

### Creación de Usuario Funcionario:

```
1. Crear registro en USERS
   ├── Datos personales
   ├── area_id = [área seleccionada]
   ├── equipo_id = [equipo seleccionado]
   └── tipo_usuario = 'interno'

2. Asignar roles
   └── Insertar en MODEL_HAS_ROLES
       ├── role_id = [rol seleccionado]
       ├── model_type = 'App\Models\User'
       └── model_id = [id del usuario]

3. Actualizar estadísticas
   ├── Incrementar contador en AREA
   └── Incrementar contador en EQUIPO
```

### Verificación de Permisos:

```
Usuario intenta acción → Verificar permiso

1. Obtener roles del usuario
   └── SELECT * FROM model_has_roles WHERE model_id = ?

2. Obtener permisos de esos roles
   └── SELECT * FROM role_has_permissions WHERE role_id IN (...)

3. Obtener permisos directos
   └── SELECT * FROM model_has_permissions WHERE model_id = ?

4. Unir todos los permisos
   └── UNION de permisos de roles + permisos directos

5. Verificar si tiene el permiso requerido
   └── IF 'usuarios.ver' IN permisos → PERMITIR
```

---

## 📈 Diagrama de Cardinalidades

```
                    1                    N
    AREA ────────────────────────── EQUIPOS
      │ 1                               │ 1
      │                                 │
      │ N                               │ N
      └───────── USERS ─────────────────┘
                   │ N
                   │
                   │ M
                   │
              ┌────┴────┐
              │         │
           N  │         │  N
              │         │
              ▼         ▼
           ROLES ───── PERMISSIONS
              M           M
```

**Leyenda:**
- 1 = Uno
- N = Muchos
- M = Muchos a Muchos

---

## 🛠️ Herramientas para Visualizar

### Online (Recomendado):
1. **Mermaid Live Editor:** https://mermaid.live/
   - Copia el código Mermaid de arriba
   - Visualiza y exporta como PNG/SVG

2. **DB Diagram:** https://dbdiagram.io/
   - Usa sintaxis DBML
   - Genera diagramas profesionales

3. **DrawSQL:** https://drawsql.app/
   - Importa desde SQL
   - Editor visual interactivo

### Herramientas Locales:
1. **MySQL Workbench** - Reverse engineer desde BD
2. **DBeaver** - Genera ER diagrams automáticamente
3. **phpMyAdmin** - Designer view

---

## 📝 Notas Importantes

### Características Especiales:

1. **Soft Deletes en Users**
   - Los usuarios NO se eliminan físicamente
   - Campo `deleted_at` marca eliminación lógica

2. **Relaciones Auto-referenciadas**
   - Area → coordinador (User)
   - Equipo → líder (User)
   - Pueden crear ciclos si no se maneja bien

3. **Polimorfismo en Permisos**
   - `model_type` permite asignar roles/permisos a diferentes entidades
   - Actualmente solo se usa con User

4. **Guard Names**
   - Todos usan 'web' por defecto
   - Permite múltiples sistemas de autenticación

---

## ✅ Archivo Generado

- `MODELO_ENTIDAD_RELACION.md` - Documentación completa
- `DIAGRAMA_ER_VISUAL.md` - Este archivo con diagramas visuales

**Para ver el diagrama:**
1. Abre https://mermaid.live/
2. Copia el código Mermaid de arriba
3. ¡Visualiza el diagrama completo!


