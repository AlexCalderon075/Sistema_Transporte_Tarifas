const API_URL = window.location.origin;
let catalogoGlobal = [];

// 1. CARGAR DATOS AL INICIAR
document.addEventListener('DOMContentLoaded', async () => {
    await cargarPreciosCatalogo();
    console.log("Calculadora sincronizada con Supabase");
});

async function cargarPreciosCatalogo() {
    try {
        const res = await fetch(`${API_URL}/api/catalogo`);
        if (!res.ok) throw new Error("Error en la respuesta");
        
        catalogoGlobal = await res.json();
        
        const precioBD = getVal('precio_diesel'); 
        if (precioBD > 0) {
            document.getElementById('precio_diesel_manual').value = precioBD;
        }
        console.log("Catálogo cargado con éxito");
    } catch (err) {
        console.error("Error:", err);
    }
}

function getVal(conceptoNombre) {
    const item = catalogoGlobal.find(i => i.concepto === conceptoNombre);
    return item ? parseFloat(item.valor) : 0;
}

// 2. LÓGICA DE CÁLCULO ACTUALIZADA
async function calcularTarifa() {
    try {
        // --- A. CAPTURA DE INPUTS NUMÉRICOS ---
        let km = Number(document.getElementById('km').value) || 0;
        let casetas = Number(document.getElementById('casetas').value) || 0;
        const diasViaje = Number(document.getElementById('dias').value) || 1;
        const precioDiesel = Number(document.getElementById('precio_diesel_manual').value) || 0;
        const rendimiento = Number(document.getElementById('rendimiento').value) || 2.5;
        const utilidadPorcentaje = Number(document.getElementById('utilidad_input').value) || 0;
        const recoleccion = Number(document.getElementById('recoleccion').value) || 0;

        // --- B. CAPTURA DE SELECTORES (IDs corregidos) ---
        const tipoViaje = document.getElementById('tipo_viaje').value;     // ida / redondo
        const tipoOperacion = document.getElementById('tipo_operacion').value; // sencillo / full
        const tipoCaja = document.getElementById('tipo_caja').value;           // seca / refrigerado
        const tipoUnidad = document.getElementById('tipo_unidad').value;       // propia / renta

        const tieneTransfer = document.querySelector('input[name="transfer"]:checked').value === 'si';
        const monedaSeleccionada = document.querySelector('input[name="moneda"]:checked').value;

        if (km <= 0) {
            alert("Ingresa los kilómetros");
            return;
        }

        // --- C. APLICACIÓN DE REGLAS DE NEGOCIO ---

        // 1. Lógica de Tipo de Viaje
        if (tipoViaje === 'redondo') {
            km = km * 2;
            casetas = casetas * 2;
        }

        // 2. Cargos de la Base de Datos
        const cargoRenta = (tipoUnidad === 'renta') ? getVal('costo_renta') : 0;
        const extraRefri = (tipoCaja === 'refrigerado') ? getVal('extra_refrigerado') : 0;
        const dieselThermo = (tipoCaja === 'refrigerado') ? (getVal('litros_diesel_thermo') * precioDiesel) : 0;
        const factorFull = (tipoOperacion === 'full') ? getVal('factor_full') : 1;
        const montoTransfer = tieneTransfer ? getVal('transfer_costo') : 0;

        // --- D. CÁLCULOS OPERATIVOS ---
        const costoDieselTracto = (km / rendimiento) * precioDiesel;

        const gastosKm = (
            getVal('administracion') + getVal('direccion_ogoi') + 
            getVal('diversos_trans') + getVal('llantas') + getVal('mantenimiento')
        ) * km;

        const gastosDia = (
            getVal('carga_laboral') + getVal('depreciacion') + getVal('infraestructura') + 
            getVal('rastreo_sat') + getVal('seguro_caja') + getVal('seguro_tracto')
        ) * diasViaje;

        // --- E. SUMA TOTAL ---
        let sumaBase = (
            costoDieselTracto + dieselThermo + gastosKm + gastosDia + 
            casetas + recoleccion + extraRefri + cargoRenta + montoTransfer
        );

        // Aplicar el factor FULL si corresponde
        sumaBase = sumaBase * factorFull;

        // Sueldo Operador e Impuestos/Margen
        const pagoOperador = sumaBase * getVal('sueldo_operador_base');
        const costoTotalMXN = sumaBase + pagoOperador;
        const tarifaFinalMXN = costoTotalMXN * (1 + (utilidadPorcentaje / 100));

        // --- F. CONVERSIÓN Y MUESTRA ---
        let resultado = tarifaFinalMXN;
        if (monedaSeleccionada === 'usd') {
            resultado = tarifaFinalMXN / (getVal('tipo_de_cambio') || 18.50);
        }

        const simbolo = (monedaSeleccionada === 'usd') ? 'USD $' : '$';
        document.getElementById('res_tarifa').innerText = `${simbolo}${resultado.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;

    } catch (err) {
        console.error("Error al calcular:", err);
        alert("Falta configurar algún campo en el HTML (ID no encontrado)");
    }
}