const API_URL = window.location.origin;
let catalogoGlobal = [];

// 1. CARGAR DATOS AL INICIAR
document.addEventListener('DOMContentLoaded', async () => {
    await cargarPreciosCatalogo();
    console.log("🚀 Calculadora lista con datos de Supabase");
});

async function cargarPreciosCatalogo() {
    try {
        const res = await fetch(`${API_URL}/api/catalogo`);
        catalogoGlobal = await res.json();
    } catch (err) {
        console.error("Error obteniendo catálogo:", err);
        alert("No se pudieron cargar los precios del catálogo.");
    }
}

// 2. FUNCIÓN AUXILIAR PARA OBTENER VALORES
function getVal(conceptoNombre) {
    const item = catalogoGlobal.find(i => i.concepto === conceptoNombre);
    return item ? parseFloat(item.valor) : 0;
}

// 3. LÓGICA PRINCIPAL DEL CÁLCULO
async function calcularTarifa() {
    // Captura de datos del formulario (lo que el usuario escribe)
    const km = parseFloat(document.getElementById('km').value) || 0;
    const diasViaje = parseFloat(document.getElementById('dias').value) || 1;
    const tipoUnidad = document.getElementById('unidad').value; // 'sencillo' o 'full'
    const tipoCaja = document.getElementById('caja').value; // 'seca', 'refrigerada', 'plataforma'

    if (km <= 0) {
        alert("Por favor ingresa los kilómetros");
        return;
    }

    // --- A. COSTOS VARIABLES (Se multiplican por KM) ---
    const rendimiento = (tipoUnidad === 'full') ? 1.8 : 2.5; // Esto también podrías subirlo al catálogo
    const precioDiesel = getVal('precio_diesel');
    const costoDiesel = (km / rendimiento) * precioDiesel;

    const mantenimiento = getVal('mantenimiento') * km;
    const llantas = getVal('llantas') * km;
    const depreciacion = getVal('depreciacion') * km;
    const diversos = getVal('diversos_trans') * km;
    const sueldoOperador = getVal('sueldo_operador_base') * km;

    // --- B. COSTOS FIJOS (Se multiplican por DÍAS) ---
    const seguroTracto = getVal('seguro_tracto') * diasViaje;
    const seguroCaja = getVal('seguro_caja') * diasViaje;
    const rastreo = getVal('rastreo_sat') * diasViaje;
    const admin = getVal('administracion') * diasViaje;
    const infra = getVal('infraestructura') * diasViaje;
    const cargaLaboral = getVal('carga_laboral') * diasViaje;
    const ogoi = getVal('direccion_ogoi') * diasViaje;

    // --- C. EXTRAS POR TIPO DE CAJA ---
    let extraCaja = 0;
    if (tipoCaja === 'refrigerado') extraCaja = getVal('extra_refrigerado');
    if (tipoCaja === 'plataforma') extraCaja = getVal('extra_plataforma');

    // --- D. TOTALIZADO ---
    const subtotalCosto = costoDiesel + mantenimiento + llantas + depreciacion + diversos + 
                         sueldoOperador + seguroTracto + seguroCaja + rastreo + 
                         admin + infra + cargaLaboral + ogoi + extraCaja;

    // Aplicamos factor de configuración (Sencillo = 1, Full = 1.4 según tu guía)
    const factorConfig = (tipoUnidad === 'full') ? getVal('factor_full') : getVal('factor_sencillo');
    const costoFinal = subtotalCosto * factorConfig;

    // --- E. MOSTRAR RESULTADOS ---
    document.getElementById('res_costo').innerText = `$${costoFinal.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
    
    // Si tienes un campo de utilidad (ejemplo 15%)
    const porcentajeUtilidad = 1.15; 
    const tarifaSugerida = costoFinal * porcentajeUtilidad;
    document.getElementById('res_tarifa').innerText = `$${tarifaSugerida.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
}

// 4. GUARDAR EN HISTORIAL (Opcional)
async function guardarCalculo() {
    // Aquí iría tu fetch POST a /api/historial enviando los resultados
    console.log("Guardando en historial...");
}