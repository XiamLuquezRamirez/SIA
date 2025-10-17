<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class UserWelcomeEmail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Usuario recién creado
     */
    public User $user;

    /**
     * Contraseña temporal (opcional, solo si se proporciona)
     */
    public ?string $temporalPassword;

    /**
     * Create a new message instance.
     */
    public function __construct(User $user, ?string $temporalPassword = null)
    {
        $this->user = $user;
        $this->temporalPassword = $temporalPassword;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Bienvenido a ' . config('app.name'),
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.user-welcome',
            with: [
                'user' => $this->user,
                'password' => $this->temporalPassword,
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
