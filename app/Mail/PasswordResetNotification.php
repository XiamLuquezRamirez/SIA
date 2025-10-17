<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PasswordResetNotification extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Usuario al que se le restablece la contraseña
     */
    public User $user;

    /**
     * Contraseña temporal (en texto plano)
     */
    public string $temporalPassword;

    /**
     * Si se requiere cambio de contraseña en próximo login
     */
    public bool $requireChange;

    /**
     * Usuario que realizó el restablecimiento
     */
    public $resetBy;

    /**
     * Create a new message instance.
     */
    public function __construct(User $user, string $temporalPassword, bool $requireChange = true, $resetBy = null)
    {
        $this->user = $user;
        $this->temporalPassword = $temporalPassword;
        $this->requireChange = $requireChange;
        $this->resetBy = $resetBy ?? auth()->user();
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Restablecimiento de Contraseña - ' . config('app.name'),
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.password-reset',
            with: [
                'user' => $this->user,
                'password' => $this->temporalPassword,
                'requireChange' => $this->requireChange,
                'resetBy' => $this->resetBy,
            ]
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
