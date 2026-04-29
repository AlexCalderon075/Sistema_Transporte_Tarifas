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

        console.log("Catálogo cargado y sincronizado");
    } catch (err) {
        console.error("Error cargando catálogo:", err);
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
    // --- 1. CAPTURA DE ENTRADAS DEL HTML ---
    // Convertimos a Number para evitar que se concatenen como texto
    const km = Number(document.getElementById('km').value) || 0;
    const diasViaje = Number(document.getElementById('dias').value) || 1;
    const casetas = Number(document.getElementById('casetas').value) || 0;
    const precioDiesel = Number(document.getElementById('precio_diesel_manual').value) || 0;
    const rendimiento = Number(document.getElementById('rendimiento').value) || 2.5;
    const utilidadPorcentaje = Number(document.getElementById('utilidad_input').value) || 0;
    const recoleccion = Number(document.getElementById('recoleccion').value) || 0;

    // CAPTURA DE SELECTORES (Asegúrate que los IDs coincidan con tu HTML)
    const tipoOperacion = document.getElementById('tipo_operacion').value; // 'sencillo' o 'full'
    const tipoCaja = document.getElementById('tipo_caja').value;           // 'seca' o 'refrigerado'
    const tipoUnidad = document.getElementById('tipo_unidad').value;       // 'propia' o 'renta'
    const tieneTransfer = document.querySelector('input[name="transfer"]:checked').value === 'si';
    const monedaSeleccionada = document.querySelector('input[name="moneda"]:checked').value;

    // Validación básica
    if (km <= 0) {
        alert("Por favor, ingresa los kilómetros del viaje.");
        return;
    }

    // --- 2. CARGOS Y FACTORES DESDE LA BASE DE DATOS (getVal) ---
    
    // Si la unidad es renta, toma 'costo_renta', si no, es 0
    const cargoRenta = (tipoUnidad === 'renta') ? getVal('costo_renta') : 0;
    
    // Si es refrigerado, suma el extra y calcula el diesel del thermo
    const extraCaja = (tipoCaja === 'refrigerado') ? getVal('extra_refrigerado') : 0;
    const dieselThermoTotal = (tipoCaja === 'refrigerado') ? (getVal('litros_diesel_thermo') * precioDiesel) : 0;

    // Factor de operación (1.4 si es full, 1 si es sencillo)
    const factorOperacion = (tipoOperacion === 'full') ? getVal('factor_full') : 1;

    // --- 3. CÁLCULOS OPERATIVOS ---
    const dieselTracto = (km / rendimiento) * precioDiesel;

    // Conceptos por Kilómetro
    const gastosPorKm = (
        getVal('administracion') + 
        getVal('direccion_ogoi') + 
        getVal('diversos_trans') + 
        getVal('llantas') + 
        getVal('mantenimiento')
    ) * km;

    // Conceptos por Día
    const gastosPorDia = (
        getVal('carga_laboral') + 
        getVal('depreciacion') + 
        getVal('infraestructura') + 
        getVal('rastreo_sat') + 
        getVal('seguro_caja') + 
        getVal('seguro_tracto')
    ) * diasViaje;

    const montoTransfer = tieneTransfer ? getVal('transfer_costo') : 0;

    // --- 4. TOTALIZACIÓN ---

    // Suma Base: Incluye todos los costos directos y extras
    let sumaBase = (
        dieselTracto + 
        dieselThermoTotal + 
        gastosPorKm + 
        gastosPorDia + 
        casetas + 
        recoleccion + 
        extraCaja + 
        cargoRenta + 
        montoTransfer
    );

    // Aplicar multiplicador si es FULL
    sumaBase = sumaBase * factorOperacion;

    // Sueldo del operador (Base * 0.035)
    const pagoOperador = sumaBase * getVal('sueldo_operador_base');

    // Costo Total
    const costoTotalMXN = sumaBase + pagoOperador;

    // Aplicar margen de utilidad
    const tarifaFinalMXN = costoTotalMXN * (1 + (utilidadPorcentaje / 100));

    // --- 5. CONVERSIÓN Y SALIDA ---
    let valorFinal = tarifaFinalMXN;
    const tc = getVal('tipo_de_cambio') || 18.50;

    if (monedaSeleccionada === 'usd') {
        valorFinal = tarifaFinalMXN / tc;
    }

    const simbolo = (monedaSeleccionada === 'usd') ? 'USD $' : '$';
    
    // Mostrar en el HTML con formato de moneda
    document.getElementById('res_tarifa').innerText = `${simbolo}${valorFinal.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;

    // Log para depuración en consola
    console.log("Cálculo finalizado con éxito.");
}