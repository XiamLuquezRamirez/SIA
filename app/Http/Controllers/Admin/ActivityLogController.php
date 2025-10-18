<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    /**
     * Mostrar vista principal de historial de actividades
     */
    public function index()
    {
        return view('admin.activity-logs.index');
    }

    /**
     * Obtener actividades filtradas (API)
     */
    public function getActivities(Request $request)
    {
        // Parámetros de filtrado
        $limit = $request->get('limit', 50);
        $offset = $request->get('offset', 0);
        $search = $request->get('search');
        $userId = $request->get('user_id');
        $logName = $request->get('log_name');
        $event = $request->get('event');
        $severity = $request->get('severity');
        $important = $request->get('important');
        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');

        // Construir query
        $query = ActivityLog::with('user')
            ->orderBy('created_at', 'desc');

        // Aplicar filtros
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('description', 'ILIKE', "%{$search}%")
                  ->orWhere('user_name', 'ILIKE', "%{$search}%")
                  ->orWhere('user_email', 'ILIKE', "%{$search}%")
                  ->orWhere('ip_address', 'ILIKE', "%{$search}%");
            });
        }

        if ($userId) {
            $query->where('user_id', $userId);
        }

        if ($logName) {
            $query->where('log_name', $logName);
        }

        if ($event) {
            $query->where('event', $event);
        }

        if ($severity) {
            $query->where('severity', $severity);
        }

        if ($important === 'true' || $important === '1') {
            $query->where('is_important', true);
        }

        if ($startDate && $endDate) {
            $query->whereBetween('created_at', [$startDate, $endDate]);
        } elseif ($startDate) {
            $query->where('created_at', '>=', $startDate);
        } elseif ($endDate) {
            $query->where('created_at', '<=', $endDate);
        }

        // Obtener total
        $total = $query->count();

        // Obtener actividades paginadas
        $activities = $query->skip($offset)->take($limit)->get();

        // Formatear respuesta
        $formatted = $activities->map(function ($log) {
            return [
                'id' => $log->id,
                'user_id' => $log->user_id,
                'user_name' => $log->user_name,
                'user_email' => $log->user_email,
                'log_name' => $log->log_name,
                'description' => $log->description,
                'event' => $log->event,
                'subject_type' => $log->subject_type,
                'subject_id' => $log->subject_id,
                'properties' => $log->properties,
                'ip_address' => $log->ip_address,
                'user_agent' => $log->user_agent,
                'url' => $log->url,
                'method' => $log->method,
                'severity' => $log->severity,
                'is_important' => $log->is_important,
                'created_at' => $log->created_at->format('Y-m-d H:i:s'),
                'created_at_relative' => $log->created_at->diffForHumans(),
                'icon' => $log->getIcon(),
                'color' => $log->getColor(),
                'changes' => $log->getFormattedChanges(),
            ];
        });

        return response()->json([
            'success' => true,
            'activities' => $formatted,
            'total' => $total,
            'limit' => $limit,
            'offset' => $offset,
        ]);
    }

    /**
     * Obtener estadísticas de actividades
     */
    public function getStats(Request $request)
    {
        $startDate = $request->get('start_date', now()->startOfMonth());
        $endDate = $request->get('end_date', now()->endOfMonth());

        $stats = [
            'total' => ActivityLog::betweenDates($startDate, $endDate)->count(),
            'por_severidad' => [
                'info' => ActivityLog::betweenDates($startDate, $endDate)->severity('info')->count(),
                'warning' => ActivityLog::betweenDates($startDate, $endDate)->severity('warning')->count(),
                'error' => ActivityLog::betweenDates($startDate, $endDate)->severity('error')->count(),
                'critical' => ActivityLog::betweenDates($startDate, $endDate)->severity('critical')->count(),
            ],
            'por_categoria' => ActivityLog::betweenDates($startDate, $endDate)
                ->selectRaw('log_name, COUNT(*) as total')
                ->groupBy('log_name')
                ->pluck('total', 'log_name')
                ->toArray(),
            'importantes' => ActivityLog::betweenDates($startDate, $endDate)->important()->count(),
            'usuarios_activos' => ActivityLog::betweenDates($startDate, $endDate)
                ->distinct('user_id')
                ->count('user_id'),
        ];

        return response()->json([
            'success' => true,
            'stats' => $stats,
        ]);
    }

    /**
     * Exportar actividades a CSV
     */
    public function export(Request $request)
    {
        // Similar a getActivities pero genera CSV
        // TODO: Implementar exportación
        return response()->json([
            'success' => false,
            'message' => 'Exportación en desarrollo'
        ], 501);
    }
}
