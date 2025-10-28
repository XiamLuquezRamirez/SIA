// ========================================
// PLANTILLAS DE DOCUMENTOS - EDITOR
// ========================================

let editoresCodeMirror = {};
let variablesDetectadas = [];
let plantillaId = null;

// ========================================
// INICIALIZACIÓN
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    inicializarEditores();
    configurarTabs();

    // Detectar si estamos en modo edición
    const form = document.getElementById('formPlantilla');
    plantillaId = form.dataset.plantillaId || null;

    // Detectar variables al cargar (en edición) o al escribir
    detectarVariablesEnTodosLosEditores();
});

// ========================================
// INICIALIZAR EDITORES CODEMIRROR
// ========================================
function inicializarEditores() {
    // Configuración común para editores HTML
    const configHTML = {
        mode: 'htmlmixed',
        theme: 'monokai',
        lineNumbers: true,
        lineWrapping: true,
        autoCloseTags: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        indentUnit: 2,
        tabSize: 2,
        indentWithTabs: false,
        extraKeys: {
            'Ctrl-Space': 'autocomplete',
            'F11': function(cm) {
                cm.setOption('fullScreen', !cm.getOption('fullScreen'));
            },
            'Esc': function(cm) {
                if (cm.getOption('fullScreen')) cm.setOption('fullScreen', false);
            }
        }
    };

    // Configuración para editor CSS
    const configCSS = {
        ...configHTML,
        mode: 'css'
    };

    // Inicializar editor de contenido principal
    const contenidoTextarea = document.getElementById('contenido_html');
    editoresCodeMirror.contenido = CodeMirror.fromTextArea(contenidoTextarea, configHTML);

    // Inicializar editor de encabezado
    const encabezadoTextarea = document.getElementById('encabezado_html');
    editoresCodeMirror.encabezado = CodeMirror.fromTextArea(encabezadoTextarea, configHTML);

    // Inicializar editor de pie de página
    const pieTextarea = document.getElementById('pie_pagina_html');
    editoresCodeMirror.pie = CodeMirror.fromTextArea(pieTextarea, configHTML);

    // Inicializar editor de CSS
    const cssTextarea = document.getElementById('contenido_css');
    editoresCodeMirror.css = CodeMirror.fromTextArea(cssTextarea, configCSS);

    // Detectar variables cuando cambia el contenido
    Object.values(editoresCodeMirror).forEach(editor => {
        editor.on('change', function() {
            detectarVariablesEnTodosLosEditores();
        });
    });

    // Placeholder inicial si está vacío
    if (editoresCodeMirror.contenido.getValue() === '') {
        editoresCodeMirror.contenido.setValue(`<div style="text-align: center; margin-top: 50px;">
    <h1>{{sistema.entidad}}</h1>
    <h2>CERTIFICADO DE EJEMPLO</h2>

    <p style="text-align: justify; margin: 30px 50px;">
        El suscrito certifica que el señor(a) <strong>{{solicitante.nombre_completo}}</strong>,
        identificado(a) con {{solicitante.tipo_documento}} No. <strong>{{solicitante.numero_documento}}</strong>,
        radicó solicitud con número <strong>{{solicitud.radicado}}</strong> el día {{solicitud.fecha_radicacion}}.
    </p>

    <p>Dado en {{sistema.ciudad}}, a {{sistema.fecha_actual}}</p>

    <div style="margin-top: 80px;">
        <p>_________________________________</p>
        <p><strong>{{funcionario.nombre_completo}}</strong></p>
        <p>{{funcionario.cargo}}</p>
    </div>
</div>`);
    }
}

// ========================================
// TABS
// ========================================
function configurarTabs() {
    // Asegurar que el primer tab esté visible
    document.getElementById('tab-contenido').style.display = 'block';
}

function cambiarTab(event, tabName) {
    event.preventDefault();

    // Ocultar todos los contenidos
    document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = 'none';
    });

    // Remover clase activa de todos los botones
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.classList.remove('border-blue-500', 'text-blue-600');
        btn.classList.add('border-transparent', 'text-gray-500');
    });

    // Mostrar el contenido seleccionado
    document.getElementById('tab-' + tabName).style.display = 'block';

    // Activar el botón seleccionado
    const btnActivo = document.querySelector(`[data-tab="${tabName}"]`);
    btnActivo.classList.add('active');
    btnActivo.classList.remove('border-transparent', 'text-gray-500');
    btnActivo.classList.add('border-blue-500', 'text-blue-600');

    // Refrescar el editor correspondiente para que se renderice correctamente
    const editorMap = {
        'contenido': editoresCodeMirror.contenido,
        'encabezado': editoresCodeMirror.encabezado,
        'pie': editoresCodeMirror.pie,
        'estilos': editoresCodeMirror.css
    };

    if (editorMap[tabName]) {
        setTimeout(() => editorMap[tabName].refresh(), 10);
    }
}

// Agregar estilos a los botones de tab
document.addEventListener('DOMContentLoaded', function() {
    const style = document.createElement('style');
    style.textContent = `
        .tab-btn {
            padding: 0.75rem 1.5rem;
            border: none;
            background: none;
            font-weight: 500;
            cursor: pointer;
            border-bottom: 3px solid transparent;
            transition: all 0.2s;
            color: #6b7280;
        }
        .tab-btn:hover {
            color: #3b82f6;
        }
        .tab-btn.active {
            color: #3b82f6;
            border-bottom-color: #3b82f6;
        }
    `;
    document.head.appendChild(style);
});

// ========================================
// DETECCIÓN DE VARIABLES
// ========================================
function detectarVariablesEnTodosLosEditores() {
    const contenido = editoresCodeMirror.contenido.getValue();
    const encabezado = editoresCodeMirror.encabezado.getValue();
    const pie = editoresCodeMirror.pie.getValue();

    const textoCompleto = contenido + ' ' + encabezado + ' ' + pie;

    // Regex para detectar variables con formato {{variable}}
    const regex = /\{\{([^}]+)\}\}/g;
    const variablesEncontradas = [];
    let match;

    while ((match = regex.exec(textoCompleto)) !== null) {
        const variable = match[1].trim();
        if (!variablesEncontradas.includes(variable)) {
            variablesEncontradas.push(variable);
        }
    }

    variablesDetectadas = variablesEncontradas;
    actualizarPanelVariablesObligatorias();
}

function actualizarPanelVariablesObligatorias() {
    const container = document.getElementById('variables-obligatorias-container');

    if (variablesDetectadas.length === 0) {
        container.innerHTML = '<p class="text-sm text-gray-500 italic col-span-full">No se han detectado variables en el contenido</p>';
        return;
    }

    // En modo edición, marcar las variables que ya estaban como obligatorias
    const obligatoriasExistentes = window.variablesObligatoriasExistentes || [];

    container.innerHTML = variablesDetectadas.map(variable => {
        const isChecked = obligatoriasExistentes.includes(variable) ? 'checked' : '';
        return `
            <label class="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                <input type="checkbox" name="variables_obligatorias[]" value="${variable}" ${isChecked}
                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                <span class="ml-2 text-sm font-mono text-gray-700">${variable}</span>
            </label>
        `;
    }).join('');
}

// ========================================
// GUARDAR PLANTILLA
// ========================================
async function guardarPlantilla() {
    try {
        // Sincronizar editores con textareas
        editoresCodeMirror.contenido.save();
        editoresCodeMirror.encabezado.save();
        editoresCodeMirror.pie.save();
        editoresCodeMirror.css.save();

        // Validar campos obligatorios
        const nombre = document.getElementById('nombre').value.trim();
        const tipoDocumento = document.getElementById('tipo_documento').value;
        const contenidoHtml = editoresCodeMirror.contenido.getValue().trim();

        if (!nombre) {
            Swal.fire({
                icon: 'warning',
                title: 'Campo Requerido',
                text: 'Por favor ingresa el nombre de la plantilla'
            });
            return;
        }

        if (!tipoDocumento) {
            Swal.fire({
                icon: 'warning',
                title: 'Campo Requerido',
                text: 'Por favor selecciona el tipo de documento'
            });
            return;
        }

        if (!contenidoHtml) {
            Swal.fire({
                icon: 'warning',
                title: 'Campo Requerido',
                text: 'Por favor ingresa el contenido HTML de la plantilla'
            });
            return;
        }

        // Recopilar datos del formulario
        const formData = {
            nombre: nombre,
            tipo_documento: tipoDocumento,
            descripcion: document.getElementById('descripcion').value,
            contenido_html: contenidoHtml,
            encabezado_html: editoresCodeMirror.encabezado.getValue(),
            pie_pagina_html: editoresCodeMirror.pie.getValue(),
            contenido_css: editoresCodeMirror.css.getValue(),
            orientacion: document.getElementById('orientacion').value,
            tamano_pagina: document.getElementById('tamano_pagina').value,
            margen_superior: document.getElementById('margen_superior').value,
            margen_inferior: document.getElementById('margen_inferior').value,
            margen_izquierdo: document.getElementById('margen_izquierdo').value,
            margen_derecho: document.getElementById('margen_derecho').value,
            activo: document.getElementById('activo').checked,
            variables_usadas: variablesDetectadas,
            variables_obligatorias: Array.from(document.querySelectorAll('input[name="variables_obligatorias[]"]:checked'))
                .map(cb => cb.value)
        };

        // Determinar URL y método según si es creación o edición
        const url = plantillaId
            ? `/admin/api/configuracion/plantillas-documentos/${plantillaId}`
            : '/admin/api/configuracion/plantillas-documentos';

        const method = plantillaId ? 'PUT' : 'POST';

        // Enviar petición
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al guardar la plantilla');
        }

        const data = await response.json();

        // Mostrar mensaje de éxito
        await Swal.fire({
            icon: 'success',
            title: plantillaId ? 'Plantilla Actualizada' : 'Plantilla Creada',
            text: data.message,
            timer: 2000,
            showConfirmButton: false
        });

        // Redirigir al listado
        window.location.href = '/admin/configuracion/documentos/plantillas';

    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error al Guardar',
            text: error.message || 'No se pudo guardar la plantilla'
        });
    }
}

// ========================================
// VISTA PREVIA
// ========================================
async function vistaPrevia() {
    try {
        // Sincronizar editores
        editoresCodeMirror.contenido.save();
        editoresCodeMirror.encabezado.save();
        editoresCodeMirror.pie.save();
        editoresCodeMirror.css.save();

        // Si estamos en modo edición, usar el endpoint del servidor
        if (plantillaId) {
            const response = await fetch(`/admin/api/configuracion/plantillas-documentos/${plantillaId}/preview`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                }
            });

            if (!response.ok) throw new Error('Error al generar vista previa');

            const data = await response.json();
            mostrarVistaPreviaHTML(data.html);
        } else {
            // En modo creación, generar preview del lado del cliente
            const contenido = editoresCodeMirror.contenido.getValue();
            const encabezado = editoresCodeMirror.encabezado.getValue();
            const pie = editoresCodeMirror.pie.getValue();
            const css = editoresCodeMirror.css.getValue();

            // Reemplazar variables con datos de ejemplo
            const datosEjemplo = {
                'solicitante.nombre_completo': 'Juan Carlos Pérez García',
                'solicitante.tipo_documento': 'Cédula de Ciudadanía',
                'solicitante.numero_documento': '1234567890',
                'solicitante.email': 'juan.perez@example.com',
                'solicitante.telefono': '300 123 4567',
                'solicitante.direccion': 'Calle 16 # 5-20',
                'solicitud.radicado': 'CERT-NOM-001-2025-00001',
                'solicitud.fecha_radicacion': '22 de noviembre de 2025',
                'solicitud.estado': 'Aprobada',
                'solicitud.prioridad': 'Normal',
                'sistema.entidad': 'ALCALDÍA DE VALLEDUPAR',
                'sistema.dependencia': 'Oficina de Planeación Municipal',
                'sistema.ciudad': 'Valledupar',
                'sistema.departamento': 'Cesar',
                'sistema.fecha_actual': new Date().toLocaleDateString('es-CO'),
                'sistema.fecha_actual_letras': 'veintidós (22) días del mes de noviembre del año dos mil veinticinco (2025)',
                'funcionario.nombre_completo': 'José Olivella Martínez',
                'funcionario.cargo': 'Profesional Especializado',
                'funcionario.area': 'Ordenamiento Territorial',
                'campo.direccion_predio': 'Calle 16 # 5-20',
                'campo.barrio': 'Centro',
                'campo.area_m2': '120'
            };

            let htmlConDatos = contenido;
            Object.entries(datosEjemplo).forEach(([variable, valor]) => {
                const regex = new RegExp(`\\{\\{${variable}\\}\\}`, 'g');
                htmlConDatos = htmlConDatos.replace(regex, valor);
            });

            const htmlCompleto = `
                ${encabezado ? encabezado : ''}
                ${htmlConDatos}
                ${pie ? pie : ''}
                ${css ? '<style>' + css + '</style>' : ''}
            `;

            mostrarVistaPreviaHTML(htmlCompleto);
        }

    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo generar la vista previa'
        });
    }
}

function mostrarVistaPreviaHTML(html) {
    const modal = document.getElementById('modalPreviewPDF');
    const content = document.getElementById('preview-pdf-content');
    const nombre = document.getElementById('preview-plantilla-nombre');

    nombre.textContent = document.getElementById('nombre').value || 'Vista Previa';
    content.innerHTML = html;

    modal.classList.remove('hidden');
}

function cerrarModalPreviewPDF() {
    document.getElementById('modalPreviewPDF').classList.add('hidden');
}

function descargarPDFPreview() {
    Swal.fire({
        icon: 'info',
        title: 'Próximamente',
        text: 'La descarga de PDF estará disponible próximamente'
    });
}

// ========================================
// VARIABLES DISPONIBLES
// ========================================
function mostrarVariablesDisponibles() {
    document.getElementById('modalVariables').classList.remove('hidden');
}

function cerrarModalVariables() {
    document.getElementById('modalVariables').classList.add('hidden');
}

function copiarVariable(variable) {
    const texto = `{{${variable}}}`;

    // Copiar al portapapeles
    navigator.clipboard.writeText(texto).then(() => {
        // Insertar en el editor activo
        const tabActivo = document.querySelector('.tab-btn.active')?.dataset.tab || 'contenido';
        const editorMap = {
            'contenido': editoresCodeMirror.contenido,
            'encabezado': editoresCodeMirror.encabezado,
            'pie': editoresCodeMirror.pie,
            'estilos': editoresCodeMirror.css
        };

        const editor = editorMap[tabActivo];
        if (editor) {
            const doc = editor.getDoc();
            const cursor = doc.getCursor();
            doc.replaceRange(texto, cursor);
            editor.focus();
        }

        // Mostrar mensaje
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true
        });

        Toast.fire({
            icon: 'success',
            title: `Variable copiada: ${texto}`
        });

    }).catch(err => {
        console.error('Error al copiar:', err);
    });
}

// ========================================
// DETECTAR VARIABLES EXISTENTES (MODO EDICIÓN)
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    // Dar tiempo a que los editores se inicialicen
    setTimeout(() => {
        detectarVariablesEnTodosLosEditores();
    }, 500);
});
