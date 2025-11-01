document.addEventListener('DOMContentLoaded', function() {
    iniciarPagina();
});

function iniciarPagina(){
    obtenerIpPublica().then(ip => {
        consultarDatosSeguridad(ip);
    });
}
async function obtenerIpPublica() {
    try {
        const res = await fetch('https://api.ipify.org?format=json');
        if (!res.ok) throw new Error('Respuesta no OK');
        const data = await res.json();
        return data.ip; // cadena con la IP pública
    } catch (err) {
        console.error('No se pudo obtener la IP pública:', err);
        return null;
    }
}

async function consultarDatosSeguridad(ip) {
    try {
        document.getElementById('dispositivos_pc_skeleton').style.display = 'block';
        document.getElementById('dispositivos_movil_skeleton').style.display = 'block';
        document.getElementById('dispositivos_pc').style.display = 'none';
        document.getElementById('dispositivos_movil').style.display = 'none';
        const response = await fetch('/seguridad/datos-seguridad?ip_publica=' + ip);
        const data = await response.json();
        Swal.close();
        if(response.ok){
            document.getElementById('last_update_time').textContent = data.ultima_vez_cambio_password;
            document.getElementById('total_sesiones_pc').textContent = data.dispositivos_vinculados_pc.length;
            document.getElementById('total_sesiones_movil').textContent = data.dispositivos_vinculados_movil.length;
            mostrarDispositivosPC(data.dispositivos_vinculados_pc);
            mostrarDispositivosMovil(data.dispositivos_vinculados_movil);
        }else{
            mostrarToast('Error al cargar los datos de seguridad, por favor intente nuevamente...', 'error');
            console.error(data.message);
        }
    } catch (error) {
        mostrarToast('Error al cargar los datos de seguridad, por favor intente nuevamente...', 'error');
        console.error(error);
    }
}

function mostrarDispositivosPC(dispositivos) {
    document.getElementById('dispositivos_pc_skeleton').style.display = 'none';
    document.getElementById('dispositivos_pc').style.display = 'block';
    const dispositivosPC = document.getElementById('dispositivos_pc');
    dispositivosPC.innerHTML = '';
    dispositivos.forEach(dispositivo => {
        dispositivosPC.innerHTML += `
            <div class="bg-gray-100 p-4 rounded-lg border border-gray-200 item-dispositivo mb-4">
                ${dispositivo.actual ? `
                    <div class="bg-blue-100 rounded-lg border p-1 border-blue-400 w-auto flex items-center justify-center gap-2">
                        <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M21.007 8.27C22.194 9.125 23 10.45 23 12c0 1.55-.806 2.876-1.993 3.73.24 1.442-.134 2.958-1.227 4.05-1.095 1.095-2.61 1.459-4.046 1.225C14.883 22.196 13.546 23 12 23c-1.55 0-2.878-.807-3.731-1.996-1.438.235-2.954-.128-4.05-1.224-1.095-1.095-1.459-2.611-1.217-4.05C1.816 14.877 1 13.551 1 12s.816-2.878 2.002-3.73c-.242-1.439.122-2.955 1.218-4.05 1.093-1.094 2.61-1.467 4.057-1.227C9.125 1.804 10.453 1 12 1c1.545 0 2.88.803 3.732 1.993 1.442-.24 2.956.135 4.048 1.227 1.093 1.092 1.468 2.608 1.227 4.05Zm-4.426-.084a1 1 0 0 1 .233 1.395l-5 7a1 1 0 0 1-1.521.126l-3-3a1 1 0 0 1 1.414-1.414l2.165 2.165 4.314-6.04a1 1 0 0 1 1.395-.232Z" fill="#1e5dcb"/></svg>
                        <p class="text-sm text-blue-800 text-center font-bold">Sesión actual</p>
                    </div>
                ` : `
                     <div></div>
                ` }
                <p class="text-sm text-gray-600 mt-2">
                    <strong>${dispositivo.navegador} en ${dispositivo.dispositivo}</strong><br>
                    <span class="text-gray-500">💻  ${dispositivo.ubicacion}</span><br>
                    <span class="text-gray-500">📅 ${dispositivo.fecha_hora}</span><br>
                    <span class="text-gray-500">🌐 ${dispositivo.ip}</span><br>
                </p> 
            </div>
        `;
    });
}

function mostrarDispositivosMovil(dispositivos) {
    document.getElementById('dispositivos_movil_skeleton').style.display = 'none';
    document.getElementById('dispositivos_movil').style.display = 'block';
    const dispositivosMovil = document.getElementById('dispositivos_movil');
    dispositivosMovil.innerHTML = '';
    dispositivos.forEach(dispositivo => {
        dispositivosMovil.innerHTML += `
            <div class="bg-gray-100 p-4 rounded-lg border border-gray-200 item-dispositivo mb-4">
                ${dispositivo.actual ? `
                    <div class="bg-blue-100 rounded-lg border p-1 border-blue-400 w-auto flex items-center justify-center gap-2">
                        <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M21.007 8.27C22.194 9.125 23 10.45 23 12c0 1.55-.806 2.876-1.993 3.73.24 1.442-.134 2.958-1.227 4.05-1.095 1.095-2.61 1.459-4.046 1.225C14.883 22.196 13.546 23 12 23c-1.55 0-2.878-.807-3.731-1.996-1.438.235-2.954-.128-4.05-1.224-1.095-1.095-1.459-2.611-1.217-4.05C1.816 14.877 1 13.551 1 12s.816-2.878 2.002-3.73c-.242-1.439.122-2.955 1.218-4.05 1.093-1.094 2.61-1.467 4.057-1.227C9.125 1.804 10.453 1 12 1c1.545 0 2.88.803 3.732 1.993 1.442-.24 2.956.135 4.048 1.227 1.093 1.092 1.468 2.608 1.227 4.05Zm-4.426-.084a1 1 0 0 1 .233 1.395l-5 7a1 1 0 0 1-1.521.126l-3-3a1 1 0 0 1 1.414-1.414l2.165 2.165 4.314-6.04a1 1 0 0 1 1.395-.232Z" fill="#1e5dcb"/></svg>
                        <p class="text-sm text-blue-800 text-center font-bold">Sesión actual</p>
                    </div>
                ` : `
                     <div></div>
                ` }
                <p class="text-sm text-gray-600 mt-2">
                    <strong>${dispositivo.navegador} en ${dispositivo.dispositivo}</strong><br>
                    <span class="text-gray-500">📱 ${dispositivo.ubicacion}</span><br>
                    <span class="text-gray-500">📅 ${dispositivo.fecha_hora}</span><br>
                    <span class="text-gray-500">🌐 ${dispositivo.ip}</span><br>
                </p> 
            </div>
        `;
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

// Password Modal Functions
function openPasswordModal() {
    document.getElementById('passwordModal').classList.remove('hidden');
}

function closePasswordModal() {
    document.getElementById('passwordModal').classList.add('hidden');
    document.getElementById('passwordForm').reset();
    // Clear error messages
    document.querySelectorAll('[id$="-error"]').forEach(el => {
        el.textContent = '';
        el.classList.add('hidden');
    });
    // Clear error borders
    document.querySelectorAll('#passwordForm input').forEach(el => {
        el.classList.remove('border-red-500');
    });
}

// ========================================
// FORTALEZA DE CONTRASEÑA
// ========================================
var passwordStrength = 0;
var coincidenciaPassword = false;
function verificarFortalezaPassword() {
    const password = document.getElementById('new_password').value;
    const strengthBars = ['strength1', 'strength2', 'strength3', 'strength4'];
    const label = document.getElementById('strengthLabel');

    // Resetear
    strengthBars.forEach(id => {
        document.getElementById(id).style.backgroundColor = '#E5E7EB';
    });

    if (password.length === 0) {
        label.textContent = 'Fortaleza de contraseña';
        label.className = 'text-xs text-gray-500 mt-1';
        return;
    }

    let strength = 0;

    // Criterios de fortaleza
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/\d/)) strength++;
    if (password.match(/[^a-zA-Z\d]/)) strength++;

    const strengthLevels = [
        { level: 1, label: 'Débil', color: '#EF4444', bars: 1 },
        { level: 2, label: 'Media', color: '#F59E0B', bars: 2 },
        { level: 3, label: 'Buena', color: '#3B82F6', bars: 3 },
        { level: 4, label: 'Fuerte', color: '#10B981', bars: 4 }
    ];

    const currentLevel = strengthLevels[strength - 1];
    if (currentLevel) {
        passwordStrength = currentLevel.level;
        label.textContent = `Fortaleza: ${currentLevel.label}`;
        label.style.color = currentLevel.color;

        for (let i = 0; i < currentLevel.bars; i++) {
            document.getElementById(strengthBars[i]).style.backgroundColor = currentLevel.color;
        }
    }

    verificarCoincidenciaPassword();
}

function verificarCoincidenciaPassword() {
    const password = document.getElementById('new_password').value;
    const confirmation = document.getElementById('password_confirmation').value;
    const message = document.getElementById('passwordMatchMessage');

    if (confirmation.length === 0) {
        message.classList.add('hidden');
        return;
    }

    message.classList.remove('hidden');

    if (password === confirmation) {
        message.textContent = '✓ Las contraseñas coinciden';
        message.className = 'text-xs text-green-600 mt-1';
        document.getElementById('password_confirmation').classList.remove('error');
        coincidenciaPassword = true;
    } else {
        message.textContent = '✗ Las contraseñas no coinciden';
        message.className = 'text-xs text-red-600 mt-1';
        document.getElementById('password_confirmation').classList.add('error');
        coincidenciaPassword = false;
    }
}

function alternarVisibilidadPassword(fieldId) {
    const field = document.getElementById(fieldId);
    field.type = field.type === 'password' ? 'text' : 'password';
}

document.getElementById('passwordForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    if(!coincidenciaPassword){
        mostrarToast('Las contraseñas no coinciden', 'error');
        return;
    }
    if(passwordStrength < 2){
        mostrarToast('La contraseña no es lo suficientemente fuerte', 'error');
        return;
    }
    
    try {
        var formData = new FormData(this);
        var data = Object.fromEntries(formData.entries());
        mostrarSwalCargando('Actualizando contraseña, por favor espere...');
        const response = await fetch('/profile/password', {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            mostrarToast(result.message, 'success');
            closePasswordModal();
            setTimeout(() => {
                iniciarPagina();
            }, 2000);
        } else if (response.status === 422) {
            // Errores de validación
            mostrarToast(result.message || 'Por favor corrija los errores en el formulario', 'error');

        } else {
            // Error del servidor
            mostrarToast(data.message || 'Error al crear área', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarToast('Error al actualizar la contraseña', 'error');
    }
});

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