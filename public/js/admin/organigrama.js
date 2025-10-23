function generarOrganigrama(data) {
 
    OrgChart.templates.area = Object.assign({}, OrgChart.templates.olivia);

    // Cambiamos colores (azul)
    OrgChart.templates.area.node =
        '<rect x="0" y="0" width="250" height="120" rx="10" ry="10" fill="#007bff" stroke="#0056b3" stroke-width="2"></rect>';
    OrgChart.templates.area.field_0 =
        '<text style="font-size: 18px; font-weight: bold;" fill="#ffffff" x="125" y="40" text-anchor="middle">{val}</text>';
    OrgChart.templates.area.field_1 =
        '<text style="font-size: 14px;" fill="#e0e0e0" x="125" y="70" text-anchor="middle">{val}</text>';

    OrgChart.templates.equipos = Object.assign({}, OrgChart.templates.olivia);
    OrgChart.templates.equipos.node =
        '<rect x="0" y="0" width="250" height="120" rx="10" ry="10" fill="#ff8eec" stroke="#99508d" stroke-width="2"></rect>';
    OrgChart.templates.equipos.field_0 =
        '<text style="font-size: 18px; font-weight: bold;" fill="#99508d" x="125" y="40" text-anchor="middle">{val}</text>';
    OrgChart.templates.equipos.field_1 =
        '<text style="font-size: 14px;" fill="#99508d" x="125" y="70" text-anchor="middle">{val}</text>';

    OrgChart.templates.lider = Object.assign({}, OrgChart.templates.olivia);
    OrgChart.templates.lider.node =
        '<rect x="0" y="0" width="250" height="120" rx="10" ry="10" fill="#ff9800" stroke="#995b00" stroke-width="2"></rect>';
    OrgChart.templates.lider.field_0 =
        '<text style="font-size: 18px; font-weight: bold;" fill="#ffffff" x="145" y="40" text-anchor="middle">{val}</text>';
    OrgChart.templates.lider.field_1 =
        '<text style="font-size: 14px;" fill="#e0e0e0" x="150" y="70" text-anchor="middle">{val}</text>';

    OrgChart.templates.coordinador = Object.assign({}, OrgChart.templates.olivia);
    OrgChart.templates.coordinador.node =
        '<rect x="0" y="0" width="250" height="120" rx="10" ry="10" fill="#ae58cf" stroke="#501f63" stroke-width="2"></rect>';
    
    OrgChart.templates.coordinador.img_0 =
    '<clipPath id="{randId}"><rect x="10" y="20" rx="50" ry="50" width="60" height="60"></rect></clipPath>' +
    '<image preserveAspectRatio="xMidYMid slice" clip-path="url(#{randId})" xlink:href="{val}" x="10" y="20" width="60" height="60"></image>';

    OrgChart.templates.coordinador.field_0 =
        '<text style="font-size: 18px; font-weight: bold;" fill="#ffffff" x="80" y="40">{val}</text>';
    OrgChart.templates.coordinador.field_1 =
        '<text style="font-size: 14px;" fill="#e0e0e0" x="80" y="70">{val}</text>';


    let options = getOptions();
    let chart = new OrgChart(document.getElementById("tree"), {
        template: 'olivia',
        siblingSeparation: 100, // separación entre nodos del mismo nivel
        levelSeparation: 150,
        subtreeSeparation: 150,
        mouseScrool: OrgChart.scroll,
        scaleInitial: options.scaleInitial,
        enableAI: true,
        enableSearch: false,
        template: "olivia",
        enableDragDrop: false,
        nodeMouseClick: OrgChart.action.edit,
        nodeMenu: {
            details: { text: "Detalles" }
        },
        nodeBinding: {
            imgs: "img",
            description: "description",
            field_0: "name",
            field_1: "title",
            img_0: "img",
        },
        tags: {
            "assistant": {
                template: "ula",
            },
            "coordinador": {
                template: "coordinador",
            },
            "lider": {
                template: "lider",
            },
            "area": {
                template: "area",
            },
            "equipo": {
                template: "equipos",
            }
        }
    });

    chart.load(data);

    function getOptions() {
        const searchParams = new URLSearchParams(window.location.search);
        let fit = searchParams.get('fit');
        let scaleInitial = 1;
        if (fit == 'yes') {
            scaleInitial = OrgChart.match.boundary;
        }
        return { scaleInitial };
    }
}

async function getOrganigramaData() {
    mostrarSwalCargando('Cargando datos del organigrama, por favor espere...');
    try {
        const response = await fetch('/admin/equipos-areas/organigrama-data');
        const data = await response.json();
        Swal.close();
        generarOrganigrama(data);
    } catch (error) {
        console.error('Error:', error);
        mostrarToast('Error al obtener los datos del organigrama', 'error');
    }
}

function mostrarToast(message, type) {
    Swal.fire({
        icon: type,
        title: message,
        confirmButtonColor: '#3b82f6',
        confirmButtonText: 'Aceptar',
        allowOutsideClick: false,
    });
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

document.addEventListener('DOMContentLoaded', function() {
    getOrganigramaData();
});