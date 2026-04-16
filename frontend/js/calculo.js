const API_URL = "https://sistema-transporte-tarifas.onrender.com"; // Cambiar por tu URL de Render después
let costoGlobal = 0, utilidadGlobal = 0, tarifaGlobal = 0;

// Protección antiback
window.addEventListener('pageshow', function (event) {
    if (!localStorage.getItem('usuarioNombre')) {
        window.location.replace('index.html');
    }
});

function realizarCalculo() {
    try {
        const km = parseFloat(document.getElementById('txtKm').value) || 0;
        const rend = parseFloat(document.getElementById('txtRendimiento').value) || 1;
        const precioD = parseFloat(document.getElementById('txtDieselPrecio').value) || 0;
        const casetas = parseFloat(document.getElementById('txtCasetas').value) || 0;
        const recolecciones = parseFloat(document.getElementById('txtCostoRecoleccion').value) || 0;
        const porcUtilidad = (parseFloat(document.getElementById('txtUtilidadPorcentaje').value) || 0) / 100;
        const dias = parseInt(document.getElementById('txtDiasViaje').value) || 1;

        const costoDiesel = (km / rend) * precioD;
        const sueldoOperador = km * 2.5; 
        const viaticos = dias * 500;
        const costoTransfer = document.getElementById('rbConTransfer').checked ? 1500 : 0;

        const subtotalVariables = (km * 1.10) + (km * 0.75) + (km * 1.50) + (km * 0.20);
        const subtotalFijos = (dias * 120) + (dias * 60) + (dias * 35) + (dias * 200) + (dias * 150) + (dias * 100) + (dias * 180);

        costoGlobal = costoDiesel + casetas + sueldoOperador + viaticos + recolecciones + costoTransfer + subtotalVariables + subtotalFijos;
        utilidadGlobal = costoGlobal * porcUtilidad;
        tarifaGlobal = costoGlobal + utilidadGlobal;

        const esPesos = document.getElementById('rbPesos').checked;
        const moneda = esPesos ? "MXN" : "USD";
        const valorFinal = esPesos ? tarifaGlobal : tarifaGlobal / 17.5;

        document.getElementById('lblTarifaTotal').innerText = `TARIFA FINAL: $${valorFinal.toLocaleString('en-US', {minimumFractionDigits:2})} ${moneda}`;
        
    } catch (e) {
        alert("Error en los datos de entrada.");
    }
}

async function guardarDatos() {
    if (tarifaGlobal === 0) return alert("Primero realiza el cálculo.");

    const datos = {
        fecha: new Date().toISOString().split('T')[0],
        origen: document.getElementById('txtOrigen').value,
        destino: document.getElementById('txtDestino').value,
        unidad: document.getElementById('cbUnidad').value,
        tipo_viaje: document.getElementById('cbViaje').value,
        tipo_caja: document.getElementById('cbCaja').value,
        km: parseFloat(document.getElementById('txtKm').value),
        costo_operativo: costoGlobal,
        utilidad: utilidadGlobal,
        tarifa_final: tarifaGlobal,
        usuario_nombre: localStorage.getItem('usuarioNombre'),
        dias_viaje: parseInt(document.getElementById('txtDiasViaje').value),
        costo_recoleccion: parseFloat(document.getElementById('txtCostoRecoleccion').value),
        con_transfer: document.getElementById('rbConTransfer').checked ? "SI" : "NO",
        moneda: document.getElementById('rbPesos').checked ? "MXN" : "USD",
        tipo_operacion: document.getElementById('cbOperacion').value,
        monto_casetas: parseFloat(document.getElementById('txtCasetas').value),
        precio_diesel: parseFloat(document.getElementById('txtDieselPrecio').value),
        rendimiento: parseFloat(document.getElementById('txtRendimiento').value),
        porcentaje_utilidad: parseFloat(document.getElementById('txtUtilidadPorcentaje').value),
        // Desglose para la DB
        carga_laboral: parseInt(document.getElementById('txtDiasViaje').value) * 180,
        mantenimiento: parseFloat(document.getElementById('txtKm').value) * 1.10,
        llantas: parseFloat(document.getElementById('txtKm').value) * 0.75,
        seguro_tracto: parseInt(document.getElementById('txtDiasViaje').value) * 120,
        seguro_caja: parseInt(document.getElementById('txtDiasViaje').value) * 60,
        depreciacion: parseFloat(document.getElementById('txtKm').value) * 1.50,
        rastreo_satelital: parseInt(document.getElementById('txtDiasViaje').value) * 35,
        diversos_trans: parseFloat(document.getElementById('txtKm').value) * 0.20,
        administracion: parseInt(document.getElementById('txtDiasViaje').value) * 200,
        infraestructura: parseInt(document.getElementById('txtDiasViaje').value) * 150,
        direccion_ogoi: parseInt(document.getElementById('txtDiasViaje').value) * 100
    };

    try {
        const res = await fetch(`${API_URL}/api/historial`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
        if (res.ok) alert("¡Cotización detallada guardada!");
    } catch (e) { alert("Error al guardar."); }
}