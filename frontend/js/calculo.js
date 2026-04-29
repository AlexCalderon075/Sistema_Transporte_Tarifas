const API_URL = window.location.origin;
let catalogoGlobal = [];

// 1. CARGAR DATOS DEL CATÁLOGO AL INICIAR
document.addEventListener('DOMContentLoaded', async () => {
    await cargarPreciosCatalogo();
    console.log("Calculadora sincronizada con Supabase");
});

async function cargarPreciosCatalogo() {
    try {
        const res = await fetch(`${API_URL}/api/catalogo`);
        if (!res.ok) throw new Error("Error en la respuesta de la red");
        
        catalogoGlobal = await res.json();
        
        // Sincronizar precio del diesel de una vez
        const precioBD = getVal('precio_diesel'); 
        if (precioBD > 0) {
            document.getElementById('precio_diesel_manual').value = precioBD;
        }

        console.log("✅ Catálogo cargado y sincronizado");
    } catch (err) {
        console.error("❌ Error cargando catálogo:", err);
        alert("Atención: Los valores del catálogo no se cargaron. Los cálculos podrían ser incorrectos.");
    }
}

function getVal(conceptoNombre) {
    // Buscamos el concepto y nos aseguramos de devolver un NÚMERO real
    const item = catalogoGlobal.find(i => i.concepto === conceptoNombre);
    return item ? parseFloat(item.valor) : 0;
}

// 2. LÓGICA PRINCIPAL DE CÁLCULO
async function calcularTarifa() {
    // --- 1. CAPTURA DE ENTRADAS (Asegurando que sean números) ---
    const km = Number(document.getElementById('km').value) || 0;
    const diasViaje = Number(document.getElementById('dias').value) || 1;
    const casetas = Number(document.getElementById('casetas').value) || 0;
    const precioDiesel = Number(document.getElementById('precio_diesel_manual').value) || 0;
    const rendimiento = Number(document.getElementById('rendimiento').value) || 2.5;
    const utilidadPorcentaje = Number(document.getElementById('utilidad_input').value) || 0;
    
    // IMPORTANTE: Captura de recolección corregida
    const recoleccion = Number(document.getElementById('recoleccion').value) || 0;

    const tipoOperacion = document.getElementById('tipo_operacion').value; 
    const tipoCaja = document.getElementById('tipo_caja').value;           
    const tipoUnidad = document.getElementById('tipo_unidad').value;       
    const monedaSeleccionada = document.querySelector('input[name="moneda"]:checked').value;
    const tieneTransfer = document.querySelector('input[name="transfer"]:checked').value === 'si';

    if (km <= 0) {
        alert("Por favor, ingresa los kilómetros del viaje.");
        return;
    }

    // --- 2. FACTORES Y CARGOS EXTRA (De la Base de Datos) ---
    const factorOperacion = (tipoOperacion === 'full') ? getVal('factor_full') : 1;
    const extraCaja = (tipoCaja === 'refrigerado') ? getVal('extra_refrigerado') : 0;
    const dieselThermoTotal = (tipoCaja === 'refrigerado') ? (getVal('litros_diesel_thermo') * precioDiesel) : 0;
    const cargoRenta = (tipoUnidad === 'renta') ? getVal('costo_renta') : 0;
    const montoTransfer = tieneTransfer ? getVal('transfer_costo') : 0;

    // --- 3. CÁLCULOS OPERATIVOS ---
    const dieselTracto = (km / rendimiento) * precioDiesel;

    const gastosPorKm = (
        getVal('administracion') + 
        getVal('direccion_ogoi') + 
        getVal('diversos_trans') + 
        getVal('llantas') + 
        getVal('mantenimiento')
    ) * km;

    const gastosPorDia = (
        getVal('carga_laboral') + 
        getVal('depreciacion') + 
        getVal('infraestructura') + 
        getVal('rastreo_sat') + 
        getVal('seguro_caja') + 
        getVal('seguro_tracto')
    ) * diasViaje;

    // --- 4. TOTALIZACIÓN FINAL ---

    // Suma de todos los costos incluyendo RECOLECCIÓN
    let sumaBase = (
        dieselTracto + 
        dieselThermoTotal + 
        gastosPorKm + 
        gastosPorDia + 
        casetas + 
        montoTransfer + 
        recoleccion + // <--- Aquí se suma la recolección
        extraCaja + 
        cargoRenta
    );

    // Aplicar factor Full si es el caso
    sumaBase = sumaBase * factorOperacion;

    // Pago Operador (SumaBase * Factor Sueldo)
    const pagoOperador = sumaBase * getVal('sueldo_operador_base');

    // Costo Total Final
    const costoTotalMXN = sumaBase + pagoOperador;

    // Tarifa con Utilidad
    const tarifaFinalMXN = costoTotalMXN * (1 + (utilidadPorcentaje / 100));

    // --- 5. VISUALIZACIÓN ---
    let valorFinal = tarifaFinalMXN;
    let tc = getVal('tipo_de_cambio') || 18.50;

    if (monedaSeleccionada === 'usd') {
        valorFinal = tarifaFinalMXN / tc;
    }

    const simbolo = (monedaSeleccionada === 'usd') ? 'USD $' : '$';
    
    document.getElementById('res_tarifa').innerText = `${simbolo}${valorFinal.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;

    console.log("Cálculo con recolección de:", recoleccion);
}