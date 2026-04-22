const API_URL = window.location.origin;
let catalogoGlobal = [];

// 1. CARGAR DATOS AL INICIAR
document.addEventListener('DOMContentLoaded', async () => {
    await cargarPreciosCatalogo();
    console.log("🚀 Calculadora cargada con las fórmulas oficiales");
});

async function cargarPreciosCatalogo() {
    try {
        const res = await fetch(`${API_URL}/api/catalogo`);
        catalogoGlobal = await res.json();
    } catch (err) {
        console.error("Error obteniendo catálogo:", err);
    }
}

// FUNCIÓN AUXILIAR PARA OBTENER VALORES DEL CATÁLOGO
function getVal(conceptoNombre) {
    const item = catalogoGlobal.find(i => i.concepto === conceptoNombre);
    return item ? parseFloat(item.valor) : 0;
}

// 2. LÓGICA DE CÁLCULO SEGÚN TU GUÍA
async function calcularTarifa() {
    // 1. Capturamos lo que el usuario escribió (Manual)
    const precioDiesel = parseFloat(document.getElementById('precio_diesel_manual').value) || 0;
    const km = parseFloat(document.getElementById('km').value) || 0;
    const diasViaje = parseFloat(document.getElementById('dias').value) || 1;
    const casetas = parseFloat(document.getElementById('casetas').value) || 0;
    const rendimiento = parseFloat(document.getElementById('rendimiento').value) || 2.5;

    // 2. Traemos del CATÁLOGO el valor fijo que guardaste en la BD
    const litrosDieselThermo = getVal('litros_diesel_thermo'); 

    // --- CÁLCULOS DE DIÉSEL ---
    const costoDieselTracto = (km / rendimiento) * precioDiesel;
    const costoDieselThermo = litrosDieselThermo * precioDiesel;

    // --- OTROS CONCEPTOS DEL CATÁLOGO (Factores Específicos) ---
    const admin = km * getVal('administracion');
    const cargaLaboral = diasViaje * getVal('carga_laboral');
    const depreciacion = diasViaje * getVal('depreciacion');
    const infra = diasViaje * getVal('infraestructura');
    const llantas = km * getVal('llantas');
    const mantenimiento = km * getVal('mantenimiento');
    const rastreo = diasViaje * getVal('rastreo_sat');
    const segCaja = diasViaje * getVal('seguro_caja');
    const segTracto = diasViaje * getVal('seguro_tracto');
    const ogoi = km * getVal('direccion_ogoi');
    const diversos = km * getVal('diversos_trans');

    // Transfer (Lógica de los botones radio)
    const tieneTransfer = document.querySelector('input[name="transfer"]:checked').value === 'si';
    const montoTransfer = tieneTransfer ? getVal('transfer_costo') : 0; 

    // --- PAGO OPERADOR (Suma según tu tabla) ---
    const sumaConceptos = costoDieselTracto + costoDieselThermo + casetas + montoTransfer + 
                         cargaLaboral + mantenimiento + llantas + segTracto + 
                         segCaja + depreciacion + rastreo + diversos + 
                         admin + infra + ogoi;

    const pagoOperador = sumaConceptos * getVal('sueldo_operador_base');

    // --- COSTO TOTAL Y TARIFA ---
    const costoTotal = pagoOperador + sumaConceptos;
    const utilidadPorc = parseFloat(document.getElementById('utilidad_input').value) / 100;
    const tarifaFinal = costoTotal * (1 + utilidadPorc);

    // --- MOSTRAR RESULTADO ---
    document.getElementById('res_tarifa').innerText = `$${tarifaFinal.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
}