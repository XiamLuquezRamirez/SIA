<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ActivityLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'user_name',
        'user_email',
        'log_name',
        'description',
        'event',
        'subject_type',
        'subject_id',
        'causer_type',
        'causer_id',
        'properties',
        'ip_address',
        'user_agent',
        'url',
        'method',
        'severity',
        'is_important',
    ];

    protected $casts = [
        'properties' => 'array',
        'is_important' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relación con el usuario que realizó la acción
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Relación polimórfica con el modelo afectado
     */
    public function subject(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Relación polimórfica con quien causó la acción
     */
    public function causer(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Scope para filtrar por nombre de log
     */
    public function scopeLogName($query, $logName)
    {
        return $query->where('log_name', $logName);
    }

    /**
     * Scope para filtrar por evento
     */
    public function scopeEvent($query, $event)
    {
        return $query->where('event', $event);
    }

    /**
     * Scope para filtrar por severidad
     */
    public function scopeSeverity($query, $severity)
    {
        return $query->where('severity', $severity);
    }

    /**
     * Scope para logs importantes
     */
    public function scopeImportant($query)
    {
        return $query->where('is_important', true);
    }

    /**
     * Scope para filtrar por usuario
     */
    public function scopeByUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope para filtrar por tipo y ID de subject
     */
    public function scopeForSubject($query, $subjectType, $subjectId = null)
    {
        $query->where('subject_type', $subjectType);

        if ($subjectId !== null) {
            $query->where('subject_id', $subjectId);
        }

        return $query;
    }

    /**
     * Scope para filtrar por rango de fechas
     */
    public function scopeBetweenDates($query, $startDate, $endDate)
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }

    /**
     * Registrar una actividad
     */
    public static function log(array $attributes): self
    {
        // Obtener información del request actual
        $request = request();

        // Si no se proporciona usuario, usar el autenticado
        if (!isset($attributes['user_id']) && auth()->check()) {
            $user = auth()->user();
            $attributes['user_id'] = $user->id;
            $attributes['user_name'] = $user->nombre . ' ' . $user->apellidos;
            $attributes['user_email'] = $user->email;
        }

        // Agregar información de la request
        if ($request) {
            $attributes['ip_address'] = $attributes['ip_address'] ?? $request->ip();
            $attributes['user_agent'] = $attributes['user_agent'] ?? $request->userAgent();
            $attributes['url'] = $attributes['url'] ?? $request->fullUrl();
            $attributes['method'] = $attributes['method'] ?? $request->method();
        }

        return static::create($attributes);
    }

    /**
     * Helper para registrar login
     */
    public static function logLogin(User $user): self
    {
        return static::log([
            'user_id' => $user->id,
            'user_name' => $user->nombre . ' ' . $user->apellidos,
            'user_email' => $user->email,
            'log_name' => 'auth',
            'description' => 'Usuario inició sesión',
            'event' => 'logged_in',
            'severity' => 'info',
            'is_important' => false,
        ]);
    }

    /**
     * Helper para registrar logout
     */
    public static function logLogout(User $user): self
    {
        return static::log([
            'user_id' => $user->id,
            'user_name' => $user->nombre . ' ' . $user->apellidos,
            'user_email' => $user->email,
            'log_name' => 'auth',
            'description' => 'Usuario cerró sesión',
            'event' => 'logged_out',
            'severity' => 'info',
            'is_important' => false,
        ]);
    }

    /**
     * Helper para registrar creación de modelo
     */
    public static function logCreated($model, string $description = null): self
    {
        return static::log([
            'log_name' => static::getLogNameFromModel($model),
            'description' => $description ?? 'Registro creado',
            'event' => 'created',
            'subject_type' => get_class($model),
            'subject_id' => $model->id,
            'properties' => [
                'attributes' => $model->getAttributes(),
            ],
            'severity' => 'info',
        ]);
    }

    /**
     * Helper para registrar actualización de modelo
     */
    public static function logUpdated($model, array $oldAttributes, string $description = null): self
    {
        return static::log([
            'log_name' => static::getLogNameFromModel($model),
            'description' => $description ?? 'Registro actualizado',
            'event' => 'updated',
            'subject_type' => get_class($model),
            'subject_id' => $model->id,
            'properties' => [
                'old' => $oldAttributes,
                'attributes' => $model->getAttributes(),
                'changes' => $model->getChanges(),
            ],
            'severity' => 'info',
        ]);
    }

    /**
     * Helper para registrar eliminación de modelo
     */
    public static function logDeleted($model, string $description = null): self
    {
        return static::log([
            'log_name' => static::getLogNameFromModel($model),
            'description' => $description ?? 'Registro eliminado',
            'event' => 'deleted',
            'subject_type' => get_class($model),
            'subject_id' => $model->id,
            'properties' => [
                'attributes' => $model->getAttributes(),
            ],
            'severity' => 'warning',
            'is_important' => true,
        ]);
    }

    /**
     * Obtener nombre del log basado en el modelo
     */
    private static function getLogNameFromModel($model): string
    {
        $modelClass = class_basename($model);

        $logNames = [
            'User' => 'user_management',
            'Role' => 'role_management',
            'Permission' => 'permission_management',
            'Area' => 'area_management',
            'Equipo' => 'team_management',
        ];

        return $logNames[$modelClass] ?? 'general';
    }

    /**
     * Obtener descripción formateada con los cambios
     */
    public function getFormattedChanges(): array
    {
        if (!isset($this->properties['changes'])) {
            return [];
        }

        $changes = [];
        foreach ($this->properties['changes'] as $field => $newValue) {
            $oldValue = $this->properties['old'][$field] ?? null;

            $changes[] = [
                'field' => $field,
                'old' => $oldValue,
                'new' => $newValue,
            ];
        }

        return $changes;
    }

    /**
     * Obtener ícono según el evento
     */
    public function getIcon(): string
    {
        $icons = [
            'logged_in' => 'login',
            'logged_out' => 'logout',
            'created' => 'plus-circle',
            'updated' => 'edit',
            'deleted' => 'trash',
            'viewed' => 'eye',
            'downloaded' => 'download',
            'uploaded' => 'upload',
        ];

        return $icons[$this->event] ?? 'info-circle';
    }

    /**
     * Obtener color según severidad
     */
    public function getColor(): string
    {
        $colors = [
            'info' => 'blue',
            'warning' => 'yellow',
            'error' => 'red',
            'critical' => 'red',
        ];

        return $colors[$this->severity] ?? 'gray';
    }
}
