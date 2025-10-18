<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\File;
use App\Models\ActivityLog;

class ProfileController extends Controller
{
    /**
     * Display the user's profile.
     */
    public function show()
    {
        $user = auth()->user();

        // Load relationships only if foreign keys exist
        if ($user->area_id) {
            $user->load('area');
        }
        if ($user->equipo_id) {
            $user->load('equipo');
        }

        // Get recent activity logs
        $activityLogs = $user->recentActivityLogs(10);

        return view('profile.show', compact('user', 'activityLogs'));
    }

    /**
     * Show the form for editing the user's profile.
     */
    public function edit()
    {
        $user = auth()->user();

        // Load relationships only if foreign keys exist
        if ($user->area_id) {
            $user->load('area');
        }
        if ($user->equipo_id) {
            $user->load('equipo');
        }

        return view('profile.edit', compact('user'));
    }

    /**
     * Update the user's profile information.
     */
    public function update(Request $request)
    {
        $user = auth()->user();

        $validated = $request->validate([
            'nombre' => ['required', 'string', 'max:255'],
            'apellidos' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email,' . $user->id],
            'telefono' => ['nullable', 'string', 'max:20'],
            'celular' => ['nullable', 'string', 'max:20'],
            'direccion' => ['nullable', 'string', 'max:500'],
        ]);

        // Store old values for activity log
        $oldValues = $user->only(['nombre', 'apellidos', 'email', 'telefono', 'celular', 'direccion']);

        // Update user
        $user->update($validated);

        // Log the activity
        ActivityLog::create([
            'user_id' => $user->id,
            'log_name' => 'user_profile',
            'description' => 'Usuario actualizó su perfil',
            'subject_type' => 'App\Models\User',
            'subject_id' => $user->id,
            'event' => 'updated',
            'properties' => json_encode([
                'old' => $oldValues,
                'attributes' => $validated
            ])
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Perfil actualizado correctamente'
        ]);
    }

    /**
     * Update the user's profile photo.
     */
    public function updatePhoto(Request $request)
    {
        $user = auth()->user();

        $request->validate([
            'foto' => ['required', File::image()->max(2048)] // 2MB max
        ]);

        // Delete old photo if exists
        if ($user->foto_url && Storage::disk('public')->exists($user->foto_url)) {
            Storage::disk('public')->delete($user->foto_url);
        }

        // Store new photo
        $path = $request->file('foto')->store('usuarios', 'public');

        // Update user
        $user->update(['foto_url' => $path]);

        // Log the activity
        ActivityLog::create([
            'user_id' => $user->id,
            'log_name' => 'user_profile',
            'description' => 'Usuario actualizó su foto de perfil',
            'subject_type' => 'App\Models\User',
            'subject_id' => $user->id,
            'event' => 'photo_updated',
            'properties' => json_encode([
                'old_photo' => $user->foto_url,
                'new_photo' => $path
            ])
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Foto de perfil actualizada correctamente',
            'foto_url' => Storage::url($path)
        ]);
    }

    /**
     * Delete the user's profile photo.
     */
    public function deletePhoto()
    {
        $user = auth()->user();

        if ($user->foto_url && Storage::disk('public')->exists($user->foto_url)) {
            Storage::disk('public')->delete($user->foto_url);

            $oldPhoto = $user->foto_url;
            $user->update(['foto_url' => null]);

            // Log the activity
            ActivityLog::create([
                'user_id' => $user->id,
                'log_name' => 'user_profile',
                'description' => 'Usuario eliminó su foto de perfil',
                'subject_type' => 'App\Models\User',
                'subject_id' => $user->id,
                'event' => 'photo_deleted',
                'properties' => json_encode([
                    'old_photo' => $oldPhoto
                ])
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Foto de perfil eliminada correctamente'
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'No hay foto de perfil para eliminar'
        ], 404);
    }

    /**
     * Update the user's password.
     */
    public function updatePassword(Request $request)
    {
        $user = auth()->user();

        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'new_password' => ['required', 'string', 'min:8', 'confirmed'],
        ], [
            'current_password.required' => 'La contraseña actual es requerida',
            'new_password.required' => 'La nueva contraseña es requerida',
            'new_password.min' => 'La nueva contraseña debe tener al menos 8 caracteres',
            'new_password.confirmed' => 'Las contraseñas no coinciden',
        ]);

        // Verify current password
        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'La contraseña actual no es correcta',
                'errors' => [
                    'current_password' => ['La contraseña actual no es correcta']
                ]
            ], 422);
        }

        // Check if new password is different from current
        if (Hash::check($validated['new_password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'La nueva contraseña debe ser diferente a la actual',
                'errors' => [
                    'new_password' => ['La nueva contraseña debe ser diferente a la actual']
                ]
            ], 422);
        }

        // Update password
        $user->update([
            'password' => Hash::make($validated['new_password'])
        ]);

        // Log the activity
        ActivityLog::create([
            'user_id' => $user->id,
            'log_name' => 'user_profile',
            'description' => 'Usuario cambió su contraseña',
            'subject_type' => 'App\Models\User',
            'subject_id' => $user->id,
            'event' => 'password_changed',
            'properties' => json_encode([
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent()
            ])
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Contraseña actualizada correctamente'
        ]);
    }
}
