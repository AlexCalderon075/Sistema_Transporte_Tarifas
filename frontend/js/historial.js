let cotizacionSeleccionada = null;

// Formateador de moneda (con corrección de miles)
function fM(v) {
    let n = parseFloat(v) || 0;
    if (n > 0 && n < 200) n *= 1000;
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
}

// Función para llenar un campo de forma segura (evita que el botón "muera")
function llenar(id, valor) {
    const el = document.getElementById(id);
    if (el) el.innerText = valor;
}

async function cargarHistorial() {
    const cuerpo = document.getElementById('cuerpoHistorial');
    
    // 1. Sacamos el nombre que guardamos en el Login
    const usuarioLogueado = localStorage.getItem('usuarioNombre');

    // Si por algo no hay nombre (no ha iniciado sesión), lo mandamos al login
    if (!usuarioLogueado) {
        alert("Debes iniciar sesión primero.");
        window.location.href = 'index.html'; // O el nombre de tu archivo de login
        return;
    }

    try {
        // 2. Le pasamos el nombre al servidor a través de la URL (?usuario=...)
        const url = `http://localhost:3000/api/historial?usuario=${encodeURIComponent(usuarioLogueado)}`;
        const res = await fetch(url);
        const datos = await res.json();
        
        cuerpo.innerHTML = ''; // Limpiamos la tabla
        
        // 3. Dibujamos solo los datos recibidos
        datos.forEach(c => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${c.id}</td>
                <td>${c.fecha}</td>
                <td>${c.origen}</td>
                <td>${c.destino}</td>
                <td><b>${fM(c.tarifa_final)}</b></td>
            `;
            
            fila.onclick = () => {
                cotizacionSeleccionada = c;
                document.querySelectorAll('tr').forEach(t => t.style.background = "transparent");
                fila.style.background = "#eef6ff";
            };
            cuerpo.appendChild(fila);
        });
    } catch (e) { 
        console.error("Error al cargar el historial:", e); 
    }
}
function generarPDF() {
    if (!cotizacionSeleccionada) return alert("Selecciona una fila primero.");
    const d = cotizacionSeleccionada;

    // Llenado SEGURO de los datos
    llenar('pdf-id', d.id);
    llenar('pdf-fecha', d.fecha);
    llenar('pdf-ruta', `${d.origen} a ${d.destino}`);
    llenar('pdf-config', `${d.tipo_operacion} (${d.unidad})`);
    llenar('pdf-modalidad', d.tipo_viaje);
    llenar('pdf-transfer', d.con_transfer || "NO");
    llenar('pdf-operador', d.usuario_nombre || "Operador General");

    // Los 13 campos de costos
    llenar('pdf-sueldo', fM(d.km * 2.5));
    llenar('pdf-diesel', fM((d.km / d.rendimiento) * d.precio_diesel));
    llenar('pdf-carga', fM(d.carga_laboral));
    llenar('pdf-manto', fM(d.mantenimiento));
    llenar('pdf-llantas', fM(d.llantas));
    llenar('pdf-seg-t', fM(d.seguro_tracto));
    llenar('pdf-seg-c', fM(d.seguro_caja));
    llenar('pdf-depre', fM(d.depreciacion));
    llenar('pdf-gps', fM(d.rastreo_satelital));
    llenar('pdf-div', fM(d.diversos_trans));
    llenar('pdf-admin', fM(d.administracion));
    llenar('pdf-infra', fM(d.infraestructura));
    llenar('pdf-ogoi', fM(d.direccion_ogoi));

    // Totales
    llenar('pdf-costo-t', fM(d.costo_operativo));
    llenar('pdf-util-porc', d.porcentaje_utilidad);
    llenar('pdf-util-neta', fM(d.utilidad));
    llenar('pdf-total', fM(d.tarifa_final) + " MXN");

    const content = document.getElementById('plantillaPDF');
    content.style.display = 'block';

    html2pdf().set({
        margin: 10,
        filename: `Reporte_ID_${d.id}.pdf`,
        html2canvas: { scale: 3 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(content).save().then(() => {
        content.style.display = 'none';
    });
}
// Seguridad: Si no hay sesión, expulsar y no dejar volver atrás
window.addEventListener('pageshow', function (event) {
    if (!localStorage.getItem('usuarioNombre')) {
        window.location.replace('index.html');
    }
});

document.addEventListener('DOMContentLoaded', cargarHistorial);