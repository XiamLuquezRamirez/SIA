<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $title ?? 'Login' }} - SIA</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>

    <!-- Alpine.js -->
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>

    <!-- Custom CSS -->
    <link rel="stylesheet" href="{{ asset('css/app.css') }}">

    <!-- Custom JS -->
    <script src="{{ asset('js/app.js') }}" defer></script>
</head>
<body class="bg-gradient-to-br from-blue-50 to-green-50 min-h-screen flex items-center justify-center p-4">

    {{ $slot }}

    <footer class="fixed bottom-0 w-full bg-white/80 backdrop-blur-sm py-4 text-center text-sm text-gray-600">
        <p>&copy; {{ date('Y') }} Alcaldía de Valledupar</p>
    </footer>

</body>
</html>
