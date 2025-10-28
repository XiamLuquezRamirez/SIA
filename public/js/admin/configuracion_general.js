const departamentos = [
    "Amazonas",
    "Antioquia",
    "Arauca",
    "Atlántico",
    "Bolívar",
    "Boyacá",
    "Caldas",
    "Caquetá",
    "Casanare",
    "Cauca",
    "Cesar",
    "Chocó",
    "Córdoba",
    "Cundinamarca",
    "Guainía",
    "Guaviare",
    "Huila",
    "La Guajira",
    "Magdalena",
    "Meta",
    "Nariño",
    "Norte de Santander",
    "Putumayo",
    "Quindío",
    "Risaralda",
    "San Andrés y Providencia",
    "Santander",
    "Sucre",
    "Tolima",
    "Valle del Cauca",
    "Vaupés",
    "Vichada",
    "Bogotá D.C."
];

var ciudades = [];
var selectedPhoto = null;
var formChanged = false;

async function cargarDepartamentos() {
   departamentos.forEach(departamento => {
    const option = document.createElement('option');
    option.value = departamento;
    option.textContent = departamento;
    document.getElementById('departamento').appendChild(option);
   });

   const response = await fetch(`/data/colombia.json`);
   const data = await response.json();
   ciudades = data;
}

async function cargarCiudades() {
    document.getElementById('ciudad').innerHTML = '<option value="">Seleccione una ciudad</option>';
    var departamento = document.getElementById('departamento').value;
    var ciudades_departamento = ciudades.find(ciudad => ciudad.departamento === departamento);
    if(ciudades_departamento) {
        ciudades_departamento.ciudades.forEach(ciudad => {
            const option = document.createElement('option');
            option.value = ciudad;
            option.textContent = ciudad;
            document.getElementById('ciudad').appendChild(option);
        });
    }
}


function cambiarTabVista(nombreTab) {
    tabVistaActual = nombreTab;
    
    // Actualizar UI de tabs
    document.querySelectorAll('.view-tab-button').forEach(btn => {
        btn.classList.remove('border-blue-600', 'text-blue-600');
        btn.classList.add('border-transparent', 'text-gray-500');
        btn.classList.remove('active');
    });
    
    const botonActivo = document.getElementById(`BtnviewTab_${nombreTab}`);
    if (botonActivo) {
        botonActivo.classList.add('border-blue-600', 'text-blue-600');
        botonActivo.classList.remove('border-transparent', 'text-gray-500');
        botonActivo.classList.add('active');
    }
    
    // Ocultar todos los contenidos
    document.querySelectorAll('.view-tab-content').forEach(contenido => {
        contenido.classList.add('hidden');
    });
    
    // Mostrar contenido activo
    const contenidoActivo = document.getElementById(`viewTab_${nombreTab}`);
    if (contenidoActivo) {
        contenidoActivo.classList.remove('hidden');
    }
}


function mostrarHorarioSabado() {
    const habilitar_sabados = document.getElementById('habilitar_sabados').checked;
    if(habilitar_sabados) {
        document.getElementById('horario_sabado').classList.remove('hidden');
        if(data.horario_sabado_desde){
            document.getElementById('horario_sabado_desde').value = data.horario_sabado_desde;
        } else {
            document.getElementById('horario_sabado_desde').value = '08:00';
        }
        if(data.horario_sabado_hasta){
            document.getElementById('horario_sabado_hasta').value = data.horario_sabado_hasta;
        } else {
            document.getElementById('horario_sabado_hasta').value = '12:00';
        }
    } else {
        document.getElementById('horario_sabado').classList.add('hidden');
    }
}           

function mostrarHoraRecordatorioVencidas() {
    const habilitar_recordatorio_vencidas = document.getElementById('habilitar_recordatorio_vencidas').checked;
    if(habilitar_recordatorio_vencidas) {
        document.getElementById('div_hora_recordatorio_vencidas').classList.remove('hidden');
        if(data.hora_recordatorio_vencidas){
            document.getElementById('hora_recordatorio_vencidas').value = data.hora_recordatorio_vencidas;
        } else {
            document.getElementById('hora_recordatorio_vencidas').value = '08:00';
        }
    } else {
        document.getElementById('div_hora_recordatorio_vencidas').classList.add('hidden');
    }
}

function mostrarHoraRecordatorioAlertasAmarillas() {
    const habilitar_recordatorio_alertas_amarillas = document.getElementById('habilitar_recordatorio_alertas_amarillas').checked;
    if(habilitar_recordatorio_alertas_amarillas) {
        document.getElementById('div_hora_recordatorio_alertas_amarillas').classList.remove('hidden');
        if(data.hora_recordatorio_alertas){
            document.getElementById('hora_recordatorio_alertas_amarillas').value = data.hora_recordatorio_alertas;
        } else {
            document.getElementById('hora_recordatorio_alertas_amarillas').value = '08:00';
        }
    } else {
        document.getElementById('div_hora_recordatorio_alertas_amarillas').classList.add('hidden');
    }
}   


document.addEventListener('DOMContentLoaded', () => {
    cargarDepartamentos();
    consultardatosConfiguracionGeneral();
});

var data = {};
async function consultardatosConfiguracionGeneral() {
    mostrarSwalCargando('Cargando datos de la configuración general, por favor espere...');
    const response = await fetch(`/admin/configuracion/parametros/configuracion-general`,
        {
            headers: {
            'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json'
            }
        }
    );
    const data_response = await response.json();
    data = data_response.configuracionGeneral;
    Swal.close();
    if(data_response.configuracionGeneral){
        cargarDatosConfiguracionGeneral(data_response.configuracionGeneral);
    }
}

function cargarDatosConfiguracionGeneral(data){
    // Datos generales
    document.getElementById('nombre').value = data.nombre_entidad;
    document.getElementById('nit').value = data.nit;
    document.getElementById('direccion').value = data.direccion;
    document.getElementById('departamento').value = data.departamento;
    setTimeout(() => {
        cargarCiudades();
        document.getElementById('ciudad').value = data.ciudad;
    }, 100);
    document.getElementById('telefono_principal').value = data.telefono_principal;
    document.getElementById('telefono_secundario').value = data.telefono_secundario;
    document.getElementById('email_contacto').value = data.email_contacto;
    document.getElementById('sitio_web').value = data.sitio_web;
    document.getElementById('slogan').value = data.slogan;

    // Horarios
    document.getElementById('horario_lunes_viernes_desde_jornada_manana').value = data.horario_lunes_viernes_desde_jornada_manana;
    document.getElementById('horario_lunes_viernes_hasta_jornada_manana').value = data.horario_lunes_viernes_hasta_jornada_manana;
    document.getElementById('horario_lunes_viernes_desde_jornada_tarde').value = data.horario_lunes_viernes_desde_jornada_tarde;
    document.getElementById('horario_lunes_viernes_hasta_jornada_tarde').value = data.horario_lunes_viernes_hasta_jornada_tarde;
    document.getElementById('habilitar_sabados').checked = data.habilitar_sabados;
    mostrarHorarioSabado();
    document.getElementById('horario_sabado_desde').value = data.horario_sabado_desde;
    document.getElementById('horario_sabado_hasta').value = data.horario_sabado_hasta;
    document.getElementById('habilitar_recordatorio_vencidas').checked = data.enviar_recordatorio_vencidas;
    mostrarHoraRecordatorioVencidas();
    document.getElementById('hora_recordatorio_vencidas').value = data.hora_recordatorio_vencidas;
    document.getElementById('habilitar_recordatorio_alertas_amarillas').checked = data.enviar_recordatorio_alertas;
    mostrarHoraRecordatorioAlertasAmarillas();
    document.getElementById('hora_recordatorio_alertas_amarillas').value = data.hora_recordatorio_alertas;

    //pesos maximos
    document.getElementById('tam_max_archivo_mb').value = data.tam_max_archivo_mb;
    document.getElementById('tam_max_total_mb').value = data.tam_max_total_mb;

    // Formatos de archivos permitidos
    document.getElementById('formato_pdf').checked = data.formato_doc_pdf;
    document.getElementById('formato_doc').checked = data.formato_doc_doc;
    document.getElementById('formato_docx').checked = data.formato_doc_docx;
    document.getElementById('formato_xls').checked = data.formato_doc_xls;
    document.getElementById('formato_xlsx').checked = data.formato_doc_xlsx;

    // Formatos de imágenes permitidos
    document.getElementById('formato_jpg').checked = data.formato_img_jpg;
    document.getElementById('formato_png').checked = data.formato_img_png;
    document.getElementById('formato_gif').checked = data.formato_img_gif;
    document.getElementById('formato_bmp').checked = data.formato_img_bmp;
    document.getElementById('formato_tiff').checked = data.formato_img_tiff;

    // Formatos de otros archivos permitidos
    document.getElementById('formato_zip').checked = data.formato_otros_zip;
    document.getElementById('formato_rar').checked = data.formato_otros_rar;
    document.getElementById('formato_7z').checked = data.formato_otros_7z;

    // Foto de la entidad
    if(data.logo_url) {
        document.getElementById('photoPreview').innerHTML = `
            <img src="/storage/${data.logo_url}" alt="Preview" class="w-full h-full object-cover">
        `;
    }
}


async function guardarDatosConfiguracionGeneral() {
    if(validarFormulario()) {
        var formData = new FormData();
        // si existe una entidad configurada, se debe actualizar, si no, se debe crear
        if(data){
            formData.append('id', data.id);
            formData.append('action', 'actualizar');
        } else {
            formData.append('action', 'crear');
        }
        // Datos generales
        formData.append('nombre', document.getElementById('nombre').value);
        formData.append('nit', document.getElementById('nit').value);
        formData.append('direccion', document.getElementById('direccion').value);
        formData.append('ciudad', document.getElementById('ciudad').value);
        formData.append('departamento', document.getElementById('departamento').value);
        formData.append('telefono_principal', document.getElementById('telefono_principal').value);
        formData.append('telefono_secundario', document.getElementById('telefono_secundario').value);
        formData.append('email_contacto', document.getElementById('email_contacto').value);
        formData.append('sitio_web', document.getElementById('sitio_web').value);
        formData.append('slogan', document.getElementById('slogan').value);

        // Horarios
        formData.append('horario_lunes_viernes_desde_jornada_manana', document.getElementById('horario_lunes_viernes_desde_jornada_manana').value);
        formData.append('horario_lunes_viernes_hasta_jornada_manana', document.getElementById('horario_lunes_viernes_hasta_jornada_manana').value);
        formData.append('horario_lunes_viernes_desde_jornada_tarde', document.getElementById('horario_lunes_viernes_desde_jornada_tarde').value);
        formData.append('horario_lunes_viernes_hasta_jornada_tarde', document.getElementById('horario_lunes_viernes_hasta_jornada_tarde').value);
        formData.append('habilitar_sabados', document.getElementById('habilitar_sabados').checked ? '1' : '0');
        formData.append('horario_sabado_desde', document.getElementById('horario_sabado_desde').value);
        formData.append('horario_sabado_hasta', document.getElementById('horario_sabado_hasta').value);
        formData.append('habilitar_recordatorio_vencidas', document.getElementById('habilitar_recordatorio_vencidas').checked ? '1' : '0');
        formData.append('hora_recordatorio_vencidas', document.getElementById('hora_recordatorio_vencidas').value);
        formData.append('habilitar_recordatorio_alertas', document.getElementById('habilitar_recordatorio_alertas_amarillas').checked ? '1' : '0');
        formData.append('hora_recordatorio_alertas', document.getElementById('hora_recordatorio_alertas_amarillas').value);

        //pesos maximos
        formData.append('tam_max_archivo_mb', document.getElementById('tam_max_archivo_mb').value);
        formData.append('tam_max_total_mb', document.getElementById('tam_max_total_mb').value);

        // Formatos de archivos permitidos
        formData.append('formato_pdf', document.getElementById('formato_pdf').checked ? '1' : '0');
        formData.append('formato_doc', document.getElementById('formato_doc').checked ? '1' : '0');
        formData.append('formato_docx', document.getElementById('formato_docx').checked ? '1' : '0');
        formData.append('formato_xls', document.getElementById('formato_xls').checked ? '1' : '0');
        formData.append('formato_xlsx', document.getElementById('formato_xlsx').checked ? '1' : '0');

        // Formatos de imágenes permitidos
        formData.append('formato_jpg', document.getElementById('formato_jpg').checked ? '1' : '0');
            formData.append('formato_png', document.getElementById('formato_png').checked ? '1' : '0');
        formData.append('formato_gif', document.getElementById('formato_gif').checked ? '1' : '0');
        formData.append('formato_bmp', document.getElementById('formato_bmp').checked ? '1' : '0');
        formData.append('formato_tiff', document.getElementById('formato_tiff').checked ? '1' : '0');

        // Formatos de otros archivos permitidos
        formData.append('formato_zip', document.getElementById('formato_zip').checked ? '1' : '0');
        formData.append('formato_rar', document.getElementById('formato_rar').checked ? '1' : '0');
        formData.append('formato_7z', document.getElementById('formato_7z').checked ? '1' : '0');


        // Foto de la entidad
        if(selectedPhoto) {
            formData.append('foto', selectedPhoto);
        }

        mostrarSwalCargando('Guardando datos de la configuración general, por favor espere...');
        const response = await fetch(`/admin/configuracion/parametros/configuracion-general/guardar`,
            {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
                },
                body: formData
            }
        );
        const data_response = await response.json();
        Swal.close();
        if(response.ok){
            Swal.close();
            mostrarToast(data_response.message, data_response.type);
            setTimeout(() => {
                consultardatosConfiguracionGeneral();
            }, 500);
        } else {
            mostrarToast(data_response.message, 'error');
        }   
    }else{
       Swal.fire({
        title: 'Error',
        text: "por favor, verifique todos los campos requeridos de todas las pestañas de la configuración general",
        icon: 'error',
        confirmButtonText: 'Aceptar',
        allowOutsideClick: false,
       });
    }
}

function validarFormulario() {
    limpiarTodosLosErrores();
    var isValid = true;

    // Datos generales
    if(document.getElementById('nombre').value.trim() === '') {
        mostrarError('nombre', 'El nombre de la entidad es requerido');
        isValid = false;
    }

    if(document.getElementById('nit').value.trim() === '') {
        mostrarError('nit', 'El NIT es requerido');
        isValid = false;
    }

    if(document.getElementById('direccion').value.trim() === '') {
        mostrarError('direccion', 'La dirección es requerida');
        isValid = false;
    }
    
    if(document.getElementById('ciudad').value.trim() === '') {
        mostrarError('ciudad', 'La ciudad es requerida');
        isValid = false;
    }

    if(document.getElementById('departamento').value.trim() === '') {
        mostrarError('departamento', 'El departamento es requerido');
        isValid = false;
    }

    if(document.getElementById('telefono_principal').value.trim() === '') {
        mostrarError('telefono_principal', 'El teléfono principal es requerido');
        isValid = false;
    }

    if(document.getElementById('email_contacto').value.trim() === '') {
        mostrarError('email_contacto', 'El email de contacto es requerido');
        isValid = false;
    }

    if(document.getElementById('sitio_web').value.trim() === '') {
        mostrarError('sitio_web', 'El sitio web es requerido');
        isValid = false;
    }

    if(document.getElementById('slogan').value.trim() === '') {
        mostrarError('slogan', 'El slogan es requerido');
        isValid = false;
    }

    // Horarios

    if(document.getElementById('horario_lunes_viernes_desde_jornada_manana').value.trim() === '') {
        mostrarError('horario_lunes_viernes_desde_jornada_manana', 'El horario de lunes a viernes de la jornada mañana es requerido');
        isValid = false;
    }

    if(document.getElementById('horario_lunes_viernes_hasta_jornada_manana').value.trim() === '') {
        mostrarError('horario_lunes_viernes_hasta_jornada_manana', 'El horario de lunes a viernes de la jornada mañana es requerido');
        isValid = false;
    }

    if(document.getElementById('horario_lunes_viernes_desde_jornada_tarde').value.trim() === '') {
        mostrarError('horario_lunes_viernes_desde_jornada_tarde', 'El horario de lunes a viernes de la jornada tarde es requerido');
        isValid = false;
    }

    if(document.getElementById('horario_lunes_viernes_hasta_jornada_tarde').value.trim() === '') {
        mostrarError('horario_lunes_viernes_hasta_jornada_tarde', 'El horario de lunes a viernes de la jornada tarde es requerido');
        isValid = false;
    }

    if(document.getElementById('habilitar_sabados').checked === true) {
        if(document.getElementById('horario_sabado_desde').value.trim() === '') {
            mostrarError('horario_sabado_desde', 'El horario de sábados es requerido');
            isValid = false;
        }
        if(document.getElementById('horario_sabado_hasta').value.trim() === '') {
            mostrarError('horario_sabado_hasta', 'El horario de sábados es requerido');
            isValid = false;
        }
    }

    if(document.getElementById('habilitar_recordatorio_vencidas').checked === true) {        
        if(document.getElementById('hora_recordatorio_vencidas').value.trim() === '') {
            mostrarError('hora_recordatorio_vencidas', 'La hora de recordatorio de vencidas es requerida');
            isValid = false;
        }   
    }

    if(document.getElementById('habilitar_recordatorio_alertas_amarillas').checked === true) {
        if(document.getElementById('hora_recordatorio_alertas_amarillas').value.trim() === '') {
            mostrarError('hora_recordatorio_alertas_amarillas', 'La hora de recordatorio de alertas amarillas es requerida');
            isValid = false;
        }
    }

    //pesos maximos
    if(document.getElementById('tam_max_archivo_mb').value.trim() === '') {
        mostrarError('tam_max_archivo_mb', 'El peso máximo de archivo es requerido');
        isValid = false;
    }
    if(document.getElementById('tam_max_total_mb').value.trim() === '') {
        mostrarError('tam_max_total_mb', 'El peso máximo total es requerido');
        isValid = false;
    }
    
    return isValid;
}

function mostrarError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorSpan = field.parentElement.querySelector('.error-message');

    field.classList.add('error');
    if (errorSpan) {
        errorSpan.textContent = message;
        errorSpan.classList.remove('hidden');
    }
}


function limpiarTodosLosErrores() {
    document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('.error-message').forEach(el => {
        el.classList.add('hidden');
        el.textContent = '';
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


function mostrarSwalCargando(mensaje) {
    Swal.fire({
        title: mensaje,
        allowOutsideClick: false,
        showConfirmButton: false,
        showCancelButton: false,
        willOpen: () => {
            Swal.showLoading();
        }
    });
}

// ========================================
// UPLOAD Y PREVIEW DE FOTO
// ========================================

function manejarSubidaFoto(event) {
    const file = event.target.files[0];

    if (!file) return;

    // Validar tamaño (máx 2MB)
    if (file.size > 2 * 1024 * 1024) {
        mostrarToast('La imagen no debe superar 2MB', 'error');
        event.target.value = '';
        return;
    }

    // Validar tipo
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
        mostrarToast('Solo se permiten imágenes JPG y PNG', 'error');
        event.target.value = '';
        return;
    }

    // Mostrar preview
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('photoPreview').innerHTML = `
            <img src="${e.target.result}" alt="Preview" class="w-full h-full object-cover">
        `;
        selectedPhoto = file;
        formChanged = true;
    };
    reader.readAsDataURL(file);
}


async function manejarRestaurarValoresPorDefecto() {
    mostrarSwalCargando('Cargando datos de la configuración general, por favor espere...');
    const response = await fetch(`/admin/configuracion/parametros/configuracion-general/valores-por-defecto`,
        {
            headers: {
            'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json'
            }
        }
    );
    const data_response = await response.json();
    data = data_response.configuracionGeneral;
    Swal.close();
    cargarDatosConfiguracionGeneral(data_response.configuracionGeneral);
}