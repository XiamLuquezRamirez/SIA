<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Restablecimiento de Contraseña</title>
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
            background: linear-gradient(135deg, #ea580c 0%, #f97316 100%);
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        .header p {
            color: #fed7aa;
            margin: 10px 0 0 0;
            font-size: 14px;
        }
        .content {
            padding: 40px 30px;
            color: #374151;
            line-height: 1.6;
        }
        .greeting {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #1f2937;
        }
        .info-box {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 20px;
            margin: 25px 0;
            border-radius: 6px;
        }
        .info-box h3 {
            margin: 0 0 10px 0;
            color: #92400e;
            font-size: 16px;
        }
        .password-box {
            background-color: #f9fafb;
            border: 2px solid #ea580c;
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
            color: #ea580c;
            font-family: 'Courier New', monospace;
            letter-spacing: 2px;
            padding: 15px;
            background-color: #ffffff;
            border-radius: 6px;
            display: inline-block;
        }
        .warning-box {
            background-color: #fef2f2;
            border-left: 4px solid #ef4444;
            padding: 20px;
            margin: 25px 0;
            border-radius: 6px;
        }
        .warning-box h3 {
            margin: 0 0 10px 0;
            color: #991b1b;
            font-size: 16px;
            display: flex;
            align-items: center;
        }
        .warning-box ul {
            margin: 10px 0 0 0;
            padding-left: 20px;
        }
        .warning-box li {
            margin: 5px 0;
            color: #7f1d1d;
        }
        .button {
            display: inline-block;
            background-color: #ea580c;
            color: #ffffff !important;
            padding: 14px 30px;
            text-decoration: none;
            border-radius: 8px;
            margin: 20px 0;
            font-weight: 600;
            transition: background-color 0.3s;
        }
        .button:hover {
            background-color: #c2410c;
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
            color: #ea580c;
            text-decoration: none;
        }
        .divider {
            height: 1px;
            background-color: #e5e7eb;
            margin: 25px 0;
        }
        .meta-info {
            font-size: 13px;
            color: #9ca3af;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <h1>🔐 Restablecimiento de Contraseña</h1>
            <p>{{ config('app.name') }}</p>
        </div>

        <!-- Content -->
        <div class="content">
            <div class="greeting">
                Hola {{ $user->nombre }} {{ $user->apellidos }},
            </div>

            <p>
                Tu contraseña ha sido restablecida por un administrador del sistema.
                @if($resetBy)
                    <br><strong>Restablecida por:</strong> {{ $resetBy->nombre }} {{ $resetBy->apellidos }}
                @endif
            </p>

            <!-- Password Box -->
            <div class="password-box">
                <div class="label">Tu nueva contraseña temporal es:</div>
                <div class="password">{{ $password }}</div>
            </div>

            @if($requireChange)
            <div class="info-box">
                <h3>⚠️ Cambio de Contraseña Requerido</h3>
                <p style="margin: 0;">
                    Por razones de seguridad, se te solicitará cambiar esta contraseña temporal 
                    la próxima vez que inicies sesión en el sistema.
                </p>
            </div>
            @endif

            <!-- Warning Box -->
            <div class="warning-box">
                <h3>
                    🔒 Recomendaciones de Seguridad
                </h3>
                <ul>
                    <li>No compartas esta contraseña con nadie</li>
                    <li>Cámbiala inmediatamente después de iniciar sesión</li>
                    <li>Usa una contraseña segura: mínimo 8 caracteres, con mayúsculas, minúsculas, números y símbolos</li>
                    <li>Evita usar información personal fácil de adivinar</li>
                </ul>
            </div>

            <div style="text-align: center;">
                <a href="{{ url('/login') }}" class="button">
                    Iniciar Sesión Ahora
                </a>
            </div>

            <div class="divider"></div>

            <p style="font-size: 14px; color: #6b7280;">
                Si no solicitaste este restablecimiento o tienes alguna pregunta, 
                contacta inmediatamente al administrador del sistema.
            </p>

            <div class="meta-info">
                <strong>Información del usuario:</strong><br>
                Email: {{ $user->email }}<br>
                Fecha: {{ now()->format('d/m/Y H:i:s') }}<br>
                @if($user->area)
                Área: {{ $user->area->nombre }}<br>
                @endif
            </div>
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

