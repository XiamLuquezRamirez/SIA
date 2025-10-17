<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenido</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f7fa;
            margin: 0;
            padding: 0;
        }
        .email-container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
            padding: 50px 30px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 32px;
            font-weight: 700;
        }
        .header p {
            color: #bfdbfe;
            margin: 15px 0 0 0;
            font-size: 16px;
        }
        .content {
            padding: 40px 30px;
            color: #374151;
            line-height: 1.6;
        }
        .greeting {
            font-size: 22px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #1f2937;
        }
        .welcome-icon {
            text-align: center;
            font-size: 60px;
            margin: 20px 0;
        }
        .info-box {
            background-color: #eff6ff;
            border-left: 4px solid #3b82f6;
            padding: 20px;
            margin: 25px 0;
            border-radius: 6px;
        }
        .info-box h3 {
            margin: 0 0 10px 0;
            color: #1e40af;
            font-size: 16px;
        }
        .password-box {
            background-color: #f9fafb;
            border: 2px solid #3b82f6;
            padding: 20px;
            margin: 25px 0;
            border-radius: 8px;
            text-align: center;
        }
        .password-box .label {
            color: #6b7280;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
        }
        .password-box .password {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            font-family: 'Courier New', monospace;
            letter-spacing: 2px;
            padding: 15px;
            background-color: #ffffff;
            border-radius: 6px;
            display: inline-block;
        }
        .features {
            display: grid;
            gap: 15px;
            margin: 25px 0;
        }
        .feature-item {
            display: flex;
            align-items: start;
            padding: 15px;
            background-color: #f9fafb;
            border-radius: 8px;
        }
        .feature-icon {
            font-size: 24px;
            margin-right: 15px;
        }
        .feature-text h4 {
            margin: 0 0 5px 0;
            color: #1f2937;
            font-size: 15px;
        }
        .feature-text p {
            margin: 0;
            color: #6b7280;
            font-size: 14px;
        }
        .button {
            display: inline-block;
            background-color: #2563eb;
            color: #ffffff !important;
            padding: 14px 30px;
            text-decoration: none;
            border-radius: 8px;
            margin: 20px 0;
            font-weight: 600;
            transition: background-color 0.3s;
        }
        .button:hover {
            background-color: #1d4ed8;
        }
        .footer {
            background-color: #f9fafb;
            padding: 30px;
            text-align: center;
            color: #6b7280;
            font-size: 13px;
        }
        .footer p {
            margin: 5px 0;
        }
        .footer a {
            color: #2563eb;
            text-decoration: none;
        }
        .divider {
            height: 1px;
            background-color: #e5e7eb;
            margin: 25px 0;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <div class="welcome-icon">🎉</div>
            <h1>¡Bienvenido!</h1>
            <p>Tu cuenta ha sido creada exitosamente</p>
        </div>

        <!-- Content -->
        <div class="content">
            <div class="greeting">
                Hola {{ $user->nombre }} {{ $user->apellidos }},
            </div>

            <p>
                ¡Es un placer darte la bienvenida a <strong>{{ config('app.name') }}</strong>! 
                Tu cuenta ha sido creada exitosamente y ya tienes acceso al sistema.
            </p>

            @if($password)
            <!-- Password Box -->
            <div class="password-box">
                <div class="label">Tu contraseña temporal es:</div>
                <div class="password">{{ $password }}</div>
            </div>

            <div class="info-box">
                <h3>🔐 Información Importante</h3>
                <p style="margin: 0;">
                    Por razones de seguridad, se te solicitará cambiar esta contraseña temporal 
                    la primera vez que inicies sesión. Te recomendamos elegir una contraseña segura y única.
                </p>
            </div>
            @endif

            <!-- Features -->
            <div class="features">
                <div class="feature-item">
                    <div class="feature-icon">👤</div>
                    <div class="feature-text">
                        <h4>Tu Información de Usuario</h4>
                        <p>
                            <strong>Email:</strong> {{ $user->email }}<br>
                            <strong>Tipo:</strong> {{ $user->tipo_usuario === 'interno' ? 'Funcionario' : 'Ciudadano' }}
                            @if($user->area)
                                <br><strong>Área:</strong> {{ $user->area->nombre }}
                            @endif
                            @if($user->equipo)
                                <br><strong>Equipo:</strong> {{ $user->equipo->nombre }}
                            @endif
                        </p>
                    </div>
                </div>

                <div class="feature-item">
                    <div class="feature-icon">🔑</div>
                    <div class="feature-text">
                        <h4>Acceso al Sistema</h4>
                        <p>Puedes iniciar sesión con tu email y la contraseña proporcionada.</p>
                    </div>
                </div>

                <div class="feature-item">
                    <div class="feature-icon">📧</div>
                    <div class="feature-text">
                        <h4>Soporte</h4>
                        <p>Si necesitas ayuda o tienes alguna pregunta, contacta al administrador del sistema.</p>
                    </div>
                </div>
            </div>

            <div style="text-align: center;">
                <a href="{{ url('/login') }}" class="button">
                    Iniciar Sesión
                </a>
            </div>

            <div class="divider"></div>

            <p style="font-size: 14px; color: #6b7280; text-align: center;">
                Si no solicitaste esta cuenta o crees que esto es un error, 
                por favor contacta al administrador del sistema inmediatamente.
            </p>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p><strong>{{ config('app.name') }}</strong></p>
            <p>Este es un correo electrónico automático, por favor no respondas a este mensaje.</p>
            <p>© {{ date('Y') }} {{ config('app.name') }}. Todos los derechos reservados.</p>
        </div>
    </div>
</body>
</html>

