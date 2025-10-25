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

async function cargarDepartamentos() {
   departamentos.forEach(departamento => {
    const option = document.createElement('option');
    option.value = departamento;
    option.textContent = departamento;
    document.getElementById('departamento').appendChild(option);
   });

   const departamento = document.getElementById('departamento').value;
   const response = await fetch(`/data/colombia.json`);
   const data = await response.json();
   ciudades = data;
}

cargarDepartamentos();

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
    } else {
        document.getElementById('horario_sabado').classList.add('hidden');
        document.getElementById('horario_sabado_desde').value = '';
        document.getElementById('horario_sabado_hasta').value = '';
    }
}           

function mostrarHoraRecordatorioVencidas() {
    const habilitar_recordatorio_vencidas = document.getElementById('habilitar_recordatorio_vencidas').checked;
    if(habilitar_recordatorio_vencidas) {
        document.getElementById('hora_recordatorio_vencidas').classList.remove('hidden');
    } else {
        document.getElementById('hora_recordatorio_vencidas').classList.add('hidden');
        document.getElementById('hora_recordatorio_vencidas').value = '';
    }
}

function mostrarHoraRecordatorioAlertasAmarillas() {
    const habilitar_recordatorio_alertas_amarillas = document.getElementById('habilitar_recordatorio_alertas_amarillas').checked;
    if(habilitar_recordatorio_alertas_amarillas) {
        document.getElementById('hora_recordatorio_alertas_amarillas').classList.remove('hidden');
    } else {
        document.getElementById('hora_recordatorio_alertas_amarillas').classList.add('hidden');
        document.getElementById('hora_recordatorio_alertas_amarillas').value = '';
    }
}   