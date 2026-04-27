const API_URL = window.location.origin;
let catalogoGlobal = [];

document.addEventListener('DOMContentLoaded', async () => {
    await cargarPreciosCatalogo();
});

async function cargarPreciosCatalogo() {
    try {
        const res = await fetch(`${API_URL}/api/catalogo`);
        catalogoGlobal = await res.json();
    } catch (err) {
        console.error("Error cargando catálogo", err);
    }
}

function getVal(nombre) {
    const item = catalogoGlobal.find(i => i.concepto === nombre);
    return item ? parseFloat(item.valor) : 0;
}

async function calcularTarifa() {
    // 1. Entradas manuales
    const km = parseFloat(document.getElementById('km').value) || 0;
    const dias = parseFloat(document.getElementById('dias').value) || 1;
    const casetas = parseFloat(document.getElementById('casetas').value) || 0;
    const precioDiesel = parseFloat(document.getElementById('precio_diesel_manual').value) || 0;
    const rendimiento = parseFloat(document.getElementById('rendimiento').value) || 2.5;
    const utilidadPorc = parseFloat(document.getElementById('utilidad_input').value) / 100;
    const recoleccion = parseFloat(document.getElementById('recoleccion').value) || 0;

    const tieneTransfer = document.querySelector('input[name="transfer"]:checked').value === 'si';
    const moneda = document.querySelector('input[name="moneda"]:checked').value;

    // 2. Valores de la Base de Datos
    const litrosThermo = getVal('litros_diesel_thermo'); 
    const tc = getVal('tipo_de_cambio') || 18.5;
    const costoTransfer = tieneTransfer ? getVal('transfer_costo') : 0;

    // 3. Cálculos de Diésel
    const dieselTracto = (km / rendimiento) * precioDiesel;
    const dieselThermo = litrosThermo * precioDiesel;

    // 4. Gastos por KM y por DÍA
    const gastosKM = km * (getVal('administracion') + getVal('direccion_ogoi') + getVal('diversos_trans') + getVal('llantas') + getVal('mantenimiento'));
    const gastosDias = dias * (getVal('carga_laboral') + getVal('depreciacion') + getVal('infraestructura') + getVal('rastreo_sat') + getVal('seguro_caja') + getVal('seguro_tracto'));

    // 5. Totales
    const sumaGastos = dieselTracto + dieselThermo + casetas + costoTransfer + gastosKM + gastosDias + recoleccion;
    const pagoOperador = sumaGastos * getVal('sueldo_operador_base');
    const costoTotalMXN = pagoOperador + sumaGastos;
    const tarifaFinalMXN = costoTotalMXN * (1 + utilidadPorc);

    // 6. Conversión de Moneda
    let mostrar = tarifaFinalMXN;
    let prefijo = "$";

    if (moneda === 'usd') {
        mostrar = tarifaFinalMXN / tc;
        prefijo = "USD $";
    }

    document.getElementById('res_tarifa').innerText = `${prefijo}${mostrar.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
}