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
    } catch (err) {
        console.error("Error obteniendo catálogo:", err);
        alert("No se pudieron cargar los factores del catálogo. Revisa la conexión.");
    }
}

// FUNCIÓN AUXILIAR PARA OBTENER VALORES POR NOMBRE DE CONCEPTO
function getVal(conceptoNombre) {
    const item = catalogoGlobal.find(i => i.concepto === conceptoNombre);
    return item ? parseFloat(item.valor) : 0;
}

// 2. LÓGICA PRINCIPAL DE CÁLCULO
async function calcularTarifa() {
    // --- A. VALORES MANUALES (Del Formulario) ---
    const km = parseFloat(document.getElementById('km').value) || 0;
    const diasViaje = parseFloat(document.getElementById('dias').value) || 1;
    const casetas = parseFloat(document.getElementById('casetas').value) || 0;
    const precioDieselManual = parseFloat(document.getElementById('precio_diesel_manual').value) || 0;
    const rendimiento = parseFloat(document.getElementById('rendimiento').value) || 2.5;
    const utilidadPorcentaje = parseFloat(document.getElementById('utilidad_input').value) || 0;
    const recoleccion = parseFloat(document.getElementById('recoleccion').value) || 0;

    // Capturar Radio Buttons (Transfer y Moneda)
    const tieneTransfer = document.querySelector('input[name="transfer"]:checked').value === 'si';
    const monedaSeleccionada = document.querySelector('input[name="moneda"]:checked').value;

    if (km <= 0) {
        alert("Por favor, ingresa los kilómetros del viaje.");
        return;
    }

    // --- B. VALORES DEL CATÁLOGO (De la Base de Datos) ---
    const litrosThermo = getVal('litros_diesel_thermo');
    const sueldoOperadorBase = getVal('sueldo_operador_base');
    const tc = getVal('tipo_de_cambio') || 18.50;
    const montoTransferBD = getVal('transfer_costo');

    // --- C. CÁLCULOS SEGÚN TABLA DE FÓRMULAS ---
    
    // Diésel
    const costoDieselTracto = (km / rendimiento) * precioDieselManual;
    const costoDieselThermo = litrosThermo * precioDieselManual;

    // Conceptos por Kilómetros
    const admin = km * getVal('administracion');
    const ogoi = km * getVal('direccion_ogoi');
    const diversos = km * getVal('diversos_trans');
    const llantas = km * getVal('llantas');
    const mantenimiento = km * getVal('mantenimiento');

    // Conceptos por Días
    const cargaLaboral = diasViaje * getVal('carga_laboral');
    const depreciacion = diasViaje * getVal('depreciacion');
    const infraestructura = diasViaje * getVal('infraestructura');
    const rastreo = diasViaje * getVal('rastreo_sat');
    const seguroCaja = diasViaje * getVal('seguro_caja');
    const seguroTracto = diasViaje * getVal('seguro_tracto');

    // Transfer
    const montoTransferFinal = tieneTransfer ? montoTransferBD : 0;

    // --- D. TOTALIZACIÓN ---

    // 1. Suma base de conceptos operativos
    const sumaConceptosOperativos = (
        montoTransferFinal + casetas + costoDieselTracto + costoDieselThermo +
        cargaLaboral + mantenimiento + llantas + seguroTracto + seguroCaja +
        depreciacion + rastreo + diversos + admin + infraestructura + ogoi + recoleccion
    );

    // 2. Pago Operador: (Suma de conceptos) * Factor Sueldo
    const pagoOperador = sumaConceptosOperativos * sueldoOperadorBase;

    // 3. Costo Total: Pago Operador + Suma de Conceptos
    const costoTotalMXN = pagoOperador + sumaConceptosOperativos;

    // 4. Tarifa Final (con Utilidad)
    const tarifaFinalMXN = costoTotalMXN * (1 + (utilidadPorcentaje / 100));

    // --- E. CONVERSIÓN Y VISUALIZACIÓN ---
    let valorAMostrar = tarifaFinalMXN;
    let simbolo = "$";
    let textoMoneda = "MXN";

    if (monedaSeleccionada === 'usd') {
        valorAMostrar = tarifaFinalMXN / tc;
        simbolo = "USD $";
        textoMoneda = "USD";
    }

    // Inyectar resultados en el HTML
    const resultadoDiv = document.getElementById('res_tarifa');
    resultadoDiv.innerText = `${simbolo}${valorAMostrar.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;

    // Logs opcionales para depuración
    console.log(`Cálculo finalizado en ${textoMoneda}`);
}