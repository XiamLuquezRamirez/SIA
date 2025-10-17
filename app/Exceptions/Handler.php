<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Session\TokenMismatchException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * The list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });
    }

    /**
     * Render an exception into an HTTP response.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Throwable  $exception
     * @return \Symfony\Component\HttpFoundation\Response
     *
     * @throws \Throwable
     */
    public function render($request, Throwable $exception)
    {
        // ⚠️ IMPORTANTE: SOLO manejar peticiones AJAX
        // Dejar que Laravel maneje completamente la navegación normal
        
        $esAjax = $request->ajax() || $request->expectsJson() || $request->wantsJson();
        
        // ========================================
        // SOLO PARA PETICIONES AJAX
        // ========================================
        
        if ($esAjax) {
            // Token CSRF expirado
            if ($exception instanceof TokenMismatchException) {
                return response()->json([
                    'message' => 'Sesión expirada. Por favor, recargue la página e inicie sesión.',
                    'redirect' => '/login'
                ], 419);
            }
            
            // 404 - Recurso no encontrado
            if ($exception instanceof NotFoundHttpException) {
                if (!auth()->check()) {
                    return response()->json([
                        'message' => 'Sesión expirada o no autenticado.',
                        'redirect' => '/login'
                    ], 401);
                }
                
                return response()->json([
                    'message' => 'Recurso no encontrado.',
                    'error' => 'La ruta solicitada no existe.'
                ], 404);
            }
            
            // 405 - Método no permitido
            if ($exception instanceof MethodNotAllowedHttpException) {
                if (!auth()->check()) {
                    return response()->json([
                        'message' => 'Sesión expirada. Por favor, inicie sesión.',
                        'redirect' => '/login'
                    ], 401);
                }
                
                return response()->json([
                    'message' => 'Método no permitido.',
                    'error' => 'El método HTTP utilizado no está permitido para esta ruta.'
                ], 405);
            }
        }
        
        // ========================================
        // PARA NAVEGACIÓN NORMAL
        // ========================================
        
        // Dejar que Laravel maneje TODO naturalmente
        // Esto incluye redirecciones al login, páginas de error por defecto, etc.
        // NO interferir para evitar bucles
        
        return parent::render($request, $exception);
    }

    /**
     * Convert an authentication exception into a response.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Illuminate\Auth\AuthenticationException  $exception
     * @return \Symfony\Component\HttpFoundation\Response
     */
    protected function unauthenticated($request, AuthenticationException $exception)
    {
        if ($request->expectsJson() || $request->ajax()) {
            return response()->json([
                'message' => 'No autenticado. Sesión expirada.',
                'redirect' => route('login')
            ], 401);
        }

        return redirect()->guest(route('login'))
            ->with('warning', 'Por favor, inicie sesión para continuar.');
    }
}
