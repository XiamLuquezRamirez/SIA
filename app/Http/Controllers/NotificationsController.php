<?php

namespace App\Http\Controllers;
use App\Events\UserNotificationEvent;
use Illuminate\Http\Request;

class NotificationsController extends Controller
{
    function enviarNotificacion($userId, $message)
    {
        $userId = $userId;
        $message = $message;
        broadcast(new UserNotificationEvent($userId, $message));
        return response()->json(['status' => 'ok']);
    }

    function configurarNotificaciones()
    {
        return view('notifications.config');
    }
}
