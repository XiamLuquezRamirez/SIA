document.addEventListener('DOMContentLoaded', function() {
    obtenerConfiguracion();
});

async function obtenerConfiguracion() {
    const response = await fetch('/notificaciones/obtener-configuracion');
    const data = await response.json();
    
    if (response.ok) {
        if (data.mostrar_notificaciones) {
            document.getElementById('mostrar_notificaciones').checked = data.mostrar_notificaciones;
            document.getElementById('reproducir_sonido').checked = data.reproducir_sonido;       
            document.getElementById('mostrar_badge').checked = data.mostrar_badge;
            document.querySelector('input[name="frecuencia_envio"][value="' + data.frecuencia_envio + '"]').checked = true;
            document.getElementById('sol_nueva_asignada_plataforma').checked = data.sol_nueva_asignada_plataforma;
            document.getElementById('sol_nueva_asignada_email').checked = data.sol_nueva_asignada_email;
            document.getElementById('sol_actualizada_plataforma').checked = data.sol_actualizada_plataforma;
            document.getElementById('sol_actualizada_email').checked = data.sol_actualizada_email;
            document.getElementById('sol_completada_plataforma').checked = data.sol_completada_plataforma;
            document.getElementById('sol_completada_email').checked = data.sol_completada_email;
            document.getElementById('sol_comentario_plataforma').checked = data.sol_comentario_plataforma;
            document.getElementById('sol_comentario_email').checked = data.sol_comentario_email;
            document.getElementById('sol_documento_plataforma').checked = data.sol_documento_plataforma;
            document.getElementById('sol_documento_email').checked = data.sol_documento_email;
            document.getElementById('sol_proxima_vencer_plataforma').checked = data.sol_proxima_vencer_plataforma;
            document.getElementById('sol_proxima_vencer_email').checked = data.sol_proxima_vencer_email;
            document.getElementById('sol_vencida_plataforma').checked = data.sol_vencida_plataforma;
            document.getElementById('sol_vencida_email').checked = data.sol_vencida_email;
            document.getElementById('col_mencion_plataforma').checked = data.col_mencion_plataforma;
            document.getElementById('col_mencion_email').checked = data.col_mencion_email;
            document.getElementById('col_respuesta_plataforma').checked = data.col_respuesta_plataforma;
            document.getElementById('col_respuesta_email').checked = data.col_respuesta_email;
        } else {
            Swal.fire({
                title: 'No ha guardado ninguna configuración, por favor revise los campos y de click en "Guardar configuración"',
                icon: 'warning',
                showConfirmButton: true,
                confirmButtonText: 'Aceptar',
            });
        }
    }
}

async function guardarConfiguracion() {
    const mostrar_notificaciones = document.getElementById('mostrar_notificaciones').checked ? 1 : 0;
    const reproducir_sonido = document.getElementById('reproducir_sonido').checked ? 1 : 0;
    const mostrar_badge = document.getElementById('mostrar_badge').checked ? 1 : 0;
    const frecuencia_envio = document.querySelector('input[name="frecuencia_envio"]:checked').value;
    const sol_nueva_asignada_plataforma = document.getElementById('sol_nueva_asignada_plataforma').checked ? 1 : 0;
    const sol_nueva_asignada_email = document.getElementById('sol_nueva_asignada_email').checked ? 1 : 0;
    const sol_actualizada_plataforma = document.getElementById('sol_actualizada_plataforma').checked ? 1 : 0;
    const sol_actualizada_email = document.getElementById('sol_actualizada_email').checked ? 1 : 0;
    const sol_completada_plataforma = document.getElementById('sol_completada_plataforma').checked ? 1 : 0;
    const sol_completada_email = document.getElementById('sol_completada_email').checked ? 1 : 0;
    const sol_comentario_plataforma = document.getElementById('sol_comentario_plataforma').checked ? 1 : 0;
    const sol_comentario_email = document.getElementById('sol_comentario_email').checked ? 1 : 0;
    const sol_documento_plataforma = document.getElementById('sol_documento_plataforma').checked ? 1 : 0;
    const sol_documento_email = document.getElementById('sol_documento_email').checked ? 1 : 0;
    const sol_proxima_vencer_plataforma = document.getElementById('sol_proxima_vencer_plataforma').checked ? 1 : 0;
    const sol_proxima_vencer_email = document.getElementById('sol_proxima_vencer_email').checked ? 1 : 0;
    const sol_vencida_plataforma = document.getElementById('sol_vencida_plataforma').checked ? 1 : 0;
    const sol_vencida_email = document.getElementById('sol_vencida_email').checked ? 1 : 0;
    const col_mencion_plataforma = document.getElementById('col_mencion_plataforma').checked ? 1 : 0;
    const col_mencion_email = document.getElementById('col_mencion_email').checked ? 1 : 0;
    const col_respuesta_plataforma = document.getElementById('col_respuesta_plataforma').checked ? 1 : 0;
    const col_respuesta_email = document.getElementById('col_respuesta_email').checked ? 1 : 0;

    try {
        // Deshabilitar botón y cambiar texto
        mostrarSwalCargando('Guardando configuración...');

        // Preparar FormData
        const formData = new FormData();
        // Agregar datos del formulario
        formData.append('mostrar_notificaciones', mostrar_notificaciones);
        formData.append('reproducir_sonido', reproducir_sonido);
        formData.append('mostrar_badge', mostrar_badge);
        formData.append('frecuencia_envio', frecuencia_envio);
        formData.append('sol_nueva_asignada_plataforma', sol_nueva_asignada_plataforma);
        formData.append('sol_nueva_asignada_email', sol_nueva_asignada_email);
        formData.append('sol_actualizada_plataforma', sol_actualizada_plataforma);
        formData.append('sol_actualizada_email', sol_actualizada_email);
        formData.append('sol_completada_plataforma', sol_completada_plataforma);
        formData.append('sol_completada_email', sol_completada_email);
        formData.append('sol_comentario_plataforma', sol_comentario_plataforma);
        formData.append('sol_comentario_email', sol_comentario_email);
        formData.append('sol_documento_plataforma', sol_documento_plataforma);
        formData.append('sol_documento_email', sol_documento_email);
        formData.append('sol_proxima_vencer_plataforma', sol_proxima_vencer_plataforma);
        formData.append('sol_proxima_vencer_email', sol_proxima_vencer_email);
        formData.append('sol_vencida_plataforma', sol_vencida_plataforma);
        formData.append('sol_vencida_email', sol_vencida_email);
        formData.append('col_mencion_plataforma', col_mencion_plataforma);
        formData.append('col_mencion_email', col_mencion_email);
        formData.append('col_respuesta_plataforma', col_respuesta_plataforma);
        formData.append('col_respuesta_email', col_respuesta_email);

        // Enviar petición
        const response = await fetch('/notificaciones/guardar-configuracion', {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
            },
            body: formData
        });

        const data = await response.json();
        Swal.close();

        if (response.ok) {
            // Éxito
            mostrarToast(data.message, data.type);

        } else if (response.status === 422) {
            // Errores de validación
            mostrarToast('Por favor corrija los errores en el formulario', 'error');

        } else {
            // Error del servidor
            mostrarToast(data.message || 'Error al guardar configuración', 'error');
        }

    } catch (error) {
        mostrarToast(error.message || 'Error al guardar configuración', 'error');
    }
}


function mostrarSwalCargando(mensaje) {
    Swal.fire({
        title: mensaje,
        icon: 'info',
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false,
        allowClose: false,
        allowEscapeKey: false,
        progressBar: true,
        didOpen: () => {
            Swal.showLoading();
        }
    });
}

function mostrarToast(message, type = 'success') {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer)
            toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
    });

    const icons = {
        'success': 'success',
        'error': 'error',
        'warning': 'warning',
        'info': 'info'
    };

    Toast.fire({
        icon: icons[type] || 'success',
        title: message
    });
}
