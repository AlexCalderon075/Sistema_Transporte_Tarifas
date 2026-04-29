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
    // Usamos Number() para asegurar que no haya concatenación de texto
    const km = Number(document.getElementById('km').value) || 0;
    const diasViaje = Number(document.getElementById('dias').value) || 1;
    const casetas = Number(document.getElementById('casetas').value) || 0;
    const precioDieselManual = Number(document.getElementById('precio_diesel_manual').value) || 0;
    const rendimiento = Number(document.getElementById('rendimiento').value) || 2.5;
    const utilidadPorcentaje = Number(document.getElementById('utilidad_input').value) || 0;
    const recoleccion = Number(document.getElementById('recoleccion').value) || 0;

    const tieneTransfer = document.querySelector('input[name="transfer"]:checked').value === 'si';
    const monedaSeleccionada = document.querySelector('input[name="moneda"]:checked').value;

    if (km <= 0) {
        alert("Por favor, ingresa los kilómetros del viaje.");
        return;
    }

    // --- B. VALORES DEL CATÁLOGO ---
    const tc = getVal('tipo_de_cambio') || 18.50;
    
    const sueldoOperadorBase = getVal('sueldo_operador_base') / 100; // Esto convierte el 3.5 en 0.035

    // --- C. CÁLCULOS OPERATIVOS ---
    const costoDieselTracto = (km / rendimiento) * precioDieselManual;
    const costoDieselThermo = getVal('litros_diesel_thermo') * precioDieselManual;

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

    const montoTransferFinal = tieneTransfer ? getVal('transfer_costo') : 0;

    // --- D. TOTALIZACIÓN (Sin errores de millones) ---
    const sumaConceptosOperativos = montoTransferFinal + casetas + costoDieselTracto + 
                                    costoDieselThermo + gastosPorKm + gastosPorDia + recoleccion;

    // Pago Operador (Suma * Factor)
    const pagoOperador = sumaConceptosOperativos * sueldoOperadorBase;

    // Costo Total
    const costoTotalMXN = sumaConceptosOperativos + pagoOperador;

    // Tarifa Final con margen (Fórmula de margen real)
    const factorUtilidad = 1 - (utilidadPorcentaje / 100);
    const tarifaFinalMXN = factorUtilidad > 0 ? (costoTotalMXN / factorUtilidad) : costoTotalMXN;

    // --- E. VISUALIZACIÓN ---
    let valorFinal = monedaSeleccionada === 'usd' ? (tarifaFinalMXN / tc) : tarifaFinalMXN;
    let prefijo = monedaSeleccionada === 'usd' ? 'USD $' : '$';

    document.getElementById('res_tarifa').innerText = prefijo + valorFinal.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}