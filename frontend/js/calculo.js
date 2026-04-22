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
    // Entradas del usuario en el formulario
    const km = parseFloat(document.getElementById('km').value) || 0;
    const diasViaje = parseFloat(document.getElementById('dias').value) || 1;
    const casetas = parseFloat(document.getElementById('casetas').value) || 0;
    const transfer = parseFloat(document.getElementById('transfer').value) || 0;
    const litrosDieselThermo = parseFloat(document.getElementById('diesel_thermo').value) || 0;

    if (km <= 0) return alert("Ingresa los kilómetros para calcular");

    // --- CÁLCULOS INDIVIDUALES (Según tu imagen de fórmulas) ---
    const precioDiesel = getVal('precio_diesel');
    const rendimientoTracto = 2.5; // Valor estándar o puedes agregarlo al catálogo

    const admin = km * getVal('administracion');
    const cargaLaboral = diasViaje * getVal('carga_laboral');
    const depreciacion = diasViaje * getVal('depreciacion');
    const diesel = (km / rendimientoTracto) * precioDiesel;
    const dieselThermo = litrosDieselThermo * precioDiesel;
    const direccionOGOI = km * getVal('direccion_ogoi');
    const diversosTrans = km * getVal('diversos_trans');
    const infraestructura = diasViaje * getVal('infraestructura');
    const llantas = km * getVal('llantas');
    const mantenimiento = km * getVal('mantenimiento');
    const rastreoSat = diasViaje * getVal('rastreo_sat');
    const seguroCaja = diasViaje * getVal('seguro_caja');
    const seguroTracto = diasViaje * getVal('seguro_tracto');

    // --- PAGO OPERADOR (Suma de conceptos * Factor de Pago Operador) ---
    // Según tu guía: (Transfer + Casetas + Diésel + Diésel Thermo + Carga Laboral + Mantenimiento + Llantas + Seguros + Depreciación + Rastreo + Diversos + Admin + Infra + OGOI) * Factor
    const sumaParaOperador = transfer + casetas + diesel + dieselThermo + cargaLaboral + 
                             mantenimiento + llantas + seguroTracto + seguroCaja + 
                             depreciacion + rastreoSat + diversosTrans + admin + 
                             infraestructura + direccionOGOI;
    
    const pagoOperador = sumaParaOperador * getVal('sueldo_operador_base');

    // --- COSTO TOTAL ---
    // Según tu guía: Pago Operador + Suma de todos los conceptos anteriores
    const costoTotal = pagoOperador + sumaParaOperador;

    // --- TARIFA (Costo * Utilidad) ---
    const utilidad = 1.15; // 15% de utilidad, puedes ajustarlo o traerlo del catálogo
    const tarifaFinal = costoTotal * utilidad;

    // --- MOSTRAR RESULTADOS ---
    document.getElementById('res_pago_operador').innerText = `$${pagoOperador.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
    document.getElementById('res_costo_total').innerText = `$${costoTotal.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
    document.getElementById('res_tarifa').innerText = `$${tarifaFinal.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
}

async function guardarEnHistorial(datosCalculados) {
    try {
        await fetch(`${API_URL}/api/historial`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosCalculados)
        });
        console.log(" Cotización guardada en el historial");
    } catch (err) {
        console.error("Error al guardar historial");
    }
}