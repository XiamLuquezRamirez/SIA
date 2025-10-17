# 📧 Configuración del Sistema de Correos Electrónicos - SIA

## 🎯 Descripción

El sistema SIA cuenta con un sistema completo de envío de correos electrónicos para notificaciones de usuarios, incluyendo:

1. **Email de Bienvenida** - Enviado cuando se crea un nuevo usuario
2. **Email de Restablecimiento de Contraseña** - Enviado cuando un administrador restablece la contraseña de un usuario

---

## 📋 Componentes Implementados

### 1. Clases Mailable

#### `App\Mail\UserWelcomeEmail`
- **Propósito**: Enviar email de bienvenida a usuarios recién creados
- **Parámetros**:
  - `$user`: Usuario creado
  - `$temporalPassword`: Contraseña temporal (opcional)
- **Vista**: `resources/views/emails/user-welcome.blade.php`

#### `App\Mail\PasswordResetNotification`
- **Propósito**: Notificar restablecimiento de contraseña
- **Parámetros**:
  - `$user`: Usuario al que se le restablece
  - `$temporalPassword`: Nueva contraseña temporal
  - `$requireChange`: Si se requiere cambio en próximo login (default: true)
  - `$resetBy`: Usuario que realizó el restablecimiento
- **Vista**: `resources/views/emails/password-reset.blade.php`

### 2. Vistas de Email

Las plantillas HTML están diseñadas con:
- ✅ Diseño responsive
- ✅ Estilos inline para compatibilidad con clientes de email
- ✅ Colores corporativos
- ✅ Información detallada y segura
- ✅ Botones de acción (CTA)
- ✅ Advertencias de seguridad

---

## ⚙️ Configuración de Laravel

### 1. Archivo `.env`

Para usar el sistema de correos, configura las siguientes variables en tu archivo `.env`:

#### Opción A: Usar Gmail (Desarrollo/Testing)

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=tu-email@gmail.com
MAIL_PASSWORD=tu-app-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=tu-email@gmail.com
MAIL_FROM_NAME="${APP_NAME}"
```

**Nota para Gmail**: Necesitas generar una "Contraseña de Aplicación" en tu cuenta de Google:
1. Ve a [Cuenta de Google](https://myaccount.google.com/)
2. Seguridad → Verificación en dos pasos (debe estar activada)
3. Contraseñas de aplicaciones → Generar nueva
4. Usa esa contraseña en `MAIL_PASSWORD`

#### Opción B: Usar Mailtrap (Desarrollo/Testing)

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=tu-username-mailtrap
MAIL_PASSWORD=tu-password-mailtrap
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@sia.com
MAIL_FROM_NAME="${APP_NAME}"
```

[Registrarse en Mailtrap](https://mailtrap.io/) para obtener credenciales.

#### Opción C: Usar SendGrid (Producción)

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USERNAME=apikey
MAIL_PASSWORD=tu-api-key-sendgrid
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@tudominio.com
MAIL_FROM_NAME="${APP_NAME}"
```

#### Opción D: Usar Mailgun (Producción)

```env
MAIL_MAILER=mailgun
MAILGUN_DOMAIN=tu-dominio.mailgun.org
MAILGUN_SECRET=tu-api-key
MAIL_FROM_ADDRESS=noreply@tudominio.com
MAIL_FROM_NAME="${APP_NAME}"
```

#### Opción E: Log (Solo desarrollo - No envía emails reales)

```env
MAIL_MAILER=log
MAIL_FROM_ADDRESS=noreply@sia.com
MAIL_FROM_NAME="${APP_NAME}"
```

Los emails se guardarán en `storage/logs/laravel.log`

---

## 🚀 Pruebas Rápidas

### 1. Probar Configuración

Crea un comando de prueba:

```bash
php artisan make:command TestEmail
```

Edita `app/Console/Commands/TestEmail.php`:

```php
<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Mail\UserWelcomeEmail;
use Illuminate\Support\Facades\Mail;

class TestEmail extends Command
{
    protected $signature = 'test:email {email}';
    protected $description = 'Probar envío de email';

    public function handle()
    {
        $user = User::where('email', $this->argument('email'))->first();
        
        if (!$user) {
            $this->error('Usuario no encontrado');
            return 1;
        }

        try {
            Mail::to($user->email)->send(new UserWelcomeEmail($user, 'Password123!'));
            $this->info('✅ Email enviado exitosamente a ' . $user->email);
        } catch (\Exception $e) {
            $this->error('❌ Error: ' . $e->getMessage());
        }

        return 0;
    }
}
```

Ejecutar:

```bash
php artisan test:email usuario@ejemplo.com
```

### 2. Probar desde la Aplicación

1. **Email de Bienvenida**: Crea un nuevo usuario desde la interfaz
2. **Email de Restablecimiento**: Usa la opción "Restablecer Contraseña" y marca "Enviar email"

---

## 📊 Logs y Auditoría

Todos los envíos de email se registran en los logs de Laravel:

```php
// Envíos exitosos
\Log::info('Email de bienvenida enviado', [
    'user_id' => $user->id,
    'user_email' => $user->email,
]);

// Errores
\Log::error('Error al enviar email de bienvenida', [
    'user_id' => $user->id,
    'error' => $e->getMessage(),
]);
```

Revisa los logs en: `storage/logs/laravel.log`

---

## 🔐 Seguridad

### Buenas Prácticas Implementadas:

1. ✅ **Contraseñas nunca se guardan en logs**
2. ✅ **Manejo de excepciones** - Si falla el email, no se interrumpe el flujo
3. ✅ **Try-catch en todos los envíos**
4. ✅ **Información sensible solo en el email**
5. ✅ **Avisos de seguridad en las plantillas**

### Recomendaciones Adicionales:

- 🔒 Usa HTTPS en producción
- 🔒 Configura SPF, DKIM y DMARC en tu dominio
- 🔒 Usa un servicio de email profesional en producción (SendGrid, Mailgun, AWS SES)
- 🔒 Monitorea los bounces y quejas de spam
- 🔒 Implementa rate limiting para prevenir abuso

---

## 🐛 Solución de Problemas

### Error: "Failed to authenticate on SMTP server"

**Causa**: Credenciales incorrectas o autenticación fallida

**Solución**:
1. Verifica usuario y contraseña en `.env`
2. Para Gmail, usa una Contraseña de Aplicación
3. Verifica que el puerto sea correcto (587 para TLS, 465 para SSL)

### Error: "Connection could not be established"

**Causa**: No se puede conectar al servidor SMTP

**Solución**:
1. Verifica el `MAIL_HOST`
2. Verifica que tu firewall/antivirus no bloquee el puerto
3. Verifica la conexión a internet
4. Prueba cambiar de puerto (587 ↔ 465)

### Los emails no llegan

**Posibles causas y soluciones**:

1. **Revisa la carpeta de Spam** del destinatario
2. **Verifica los logs**: `storage/logs/laravel.log`
3. **Usa Mailtrap** para desarrollo/testing
4. **Verifica que `MAIL_FROM_ADDRESS`** sea válido
5. **Ejecuta `php artisan config:clear`** después de cambiar `.env`

### Error: "Address in mailbox given does not comply with RFC 2822"

**Causa**: Email inválido

**Solución**:
1. Verifica que `MAIL_FROM_ADDRESS` tenga formato válido
2. Verifica que el email del usuario sea válido
3. Asegúrate de que no haya espacios en las direcciones

---

## 📈 Mejoras Futuras

### Colas (Queues)

Para mejorar el rendimiento, implementa colas:

1. **Configurar Cola**:

```env
QUEUE_CONNECTION=database
```

2. **Ejecutar**:

```bash
php artisan queue:table
php artisan migrate
php artisan queue:work
```

3. **Usar `ShouldQueue`**:

```php
class UserWelcomeEmail extends Mailable implements ShouldQueue
{
    // ...
}
```

### Plantillas Dinámicas

Implementar plantillas editables desde el panel de administración.

### Estadísticas

- Tasa de apertura
- Tasa de clics
- Bounces
- Quejas de spam

---

## 📚 Recursos Adicionales

- [Documentación oficial de Laravel Mail](https://laravel.com/docs/10.x/mail)
- [Documentación de Mailtrap](https://help.mailtrap.io/)
- [Documentación de SendGrid](https://docs.sendgrid.com/)
- [RFC 2822 - Email Format](https://www.ietf.org/rfc/rfc2822.txt)

---

## ✅ Checklist de Implementación

- [x] Crear clases Mailable
- [x] Crear vistas de email
- [x] Integrar en controladores
- [x] Manejo de excepciones
- [x] Logs de auditoría
- [ ] Configurar servicio de email en producción
- [ ] Probar envíos en diferentes clientes de email
- [ ] Configurar SPF/DKIM/DMARC
- [ ] Implementar colas (opcional)
- [ ] Monitoreo de deliverabilidad

---

**Última actualización:** Octubre 2024  
**Versión:** 1.0  
**Responsable:** Equipo de Desarrollo SIA

