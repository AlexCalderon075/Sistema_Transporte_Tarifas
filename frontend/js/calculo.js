const API_URL = window.location.origin;
let catalogoGlobal = [];
let datosParaHistorial = null; 

document.addEventListener('DOMContentLoaded', async () => {
    await cargarPreciosCatalogo();
});

async function cargarPreciosCatalogo() {
    try {
        const res = await fetch(`${API_URL}/api/catalogo`);
        if (!res.ok) throw new Error("Error en la respuesta");
        catalogoGlobal = await res.json();
        console.log("Catálogo cargado");
    } catch (err) { console.error("Error:", err); }
}

function getVal(conceptoNombre) {
    const item = catalogoGlobal.find(i => i.concepto === conceptoNombre);
    return item ? parseFloat(item.valor) : 0;
}

async function calcularTarifa() {
    console.log("Iniciando cálculo...");
    
    // --- PASO 1: FORZAR APARICIÓN DEL BOTÓN ---
    // Lo hacemos al principio para asegurar que se vea aunque algo falle después
    const botonGuardar = document.getElementById('btn-guardar');
if (botonGuardar) {
    // Esto fuerza la aparición ignorando cualquier otra regla CSS
    botonGuardar.setAttribute('style', 'display: block !important; background-color: #27ae60 !important; color: white !important; border: none; padding: 15px; width: 100%; border-radius: 8px; font-size: 1.1rem; font-weight: bold; cursor: pointer; margin-top: 15px;');
    console.log("Botón de guardar forzado visualmente");
}
    try {
        // --- PASO 2: CAPTURA DE DATOS ---
        let km = Number(document.getElementById('km').value) || 0;
        let casetas = Number(document.getElementById('casetas').value) || 0;
        const diasViaje = Number(document.getElementById('dias').value) || 1;
        const precioDiesel = Number(document.getElementById('precio_diesel_manual').value) || 0;
        const rendimiento = Number(document.getElementById('rendimiento').value) || 2.5;
        const utilidadPorcentaje = Number(document.getElementById('utilidad_input').value) || 0;
        const recoleccion = Number(document.getElementById('recoleccion').value) || 0;

        const tipoViaje = document.getElementById('tipo_viaje').value;
        const tipoOperacion = document.getElementById('tipo_operacion').value;
        const tipoCaja = document.getElementById('tipo_caja').value;
        const tipoUnidad = document.getElementById('tipo_unidad').value;
        
        // Captura segura de radios
        const tieneTransferEl = document.querySelector('input[name="transfer"]:checked');
        const tieneTransfer = tieneTransferEl ? tieneTransferEl.value === 'si' : false;
        
        const monedaEl = document.querySelector('input[name="moneda"]:checked');
        const monedaSeleccionada = monedaEl ? monedaEl.value : 'mxn';

        if (km <= 0) { alert("Ingresa los kilómetros"); return; }

        // --- PASO 3: MATEMÁTICAS ---
        if (tipoViaje === 'redondo') { km *= 2; casetas *= 2; }

        const tcActual = getVal('tipo_de_cambio') || 18.50;
        const fFull = (tipoOperacion === 'full') ? getVal('factor_full') : 1;
        const d_tracto = (km / rendimiento) * precioDiesel;
        const g_km = (getVal('administracion') + getVal('direccion_ogoi') + getVal('diversos_trans') + getVal('llantas') + getVal('mantenimiento')) * km;
        const g_dia = (getVal('carga_laboral') + getVal('depreciacion') + getVal('infraestructura') + getVal('rastreo_sat') + getVal('seguro_caja') + getVal('seguro_tracto')) * diasViaje;

        let sumaBase = (d_tracto + g_km + g_dia + casetas + recoleccion + (tipoCaja === 'refrigerado' ? getVal('extra_refrigerado') : 0));
        sumaBase *= fFull;

        const pagoOperador = sumaBase * getVal('sueldo_operador_base');
        const costoTotalMXN = sumaBase + pagoOperador;
        const tarifaFinalMXN = costoTotalMXN * (1 + (utilidadPorcentaje / 100));

        let valorFinal = (monedaSeleccionada === 'usd') ? (tarifaFinalMXN / tcActual) : tarifaFinalMXN;

        // --- PASO 4: MOSTRAR RESULTADO ---
        const simbolo = (monedaSeleccionada === 'usd') ? 'USD $' : '$';
        document.getElementById('res_tarifa').innerText = `${simbolo}${valorFinal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

        // --- PASO 5: PREPARAR OBJETO HISTORIAL ---
        datosParaHistorial = {
            fecha: new Date().toISOString(),
            origen: document.getElementById('origen').value,
            destino: document.getElementById('destino').value,
            unidad: tipoUnidad,
            tipo_viaje: tipoViaje,
            tipo_caja: tipoCaja,
            tipo_operacion: tipoOperacion,
            km: km,
            costo_operativo: costoTotalMXN,
            utilidad: tarifaFinalMXN - costoTotalMXN,
            tarifa_final: valorFinal,
            usuario_nombre: "Alex Calderon", 
            dias_viaje: diasViaje,
            costo_recoleccion: recoleccion,
            con_transfer: tieneTransfer ? 'si' : 'no',
            moneda: monedaSeleccionada,
            monto_casetas: casetas,
            precio_diesel: precioDiesel,
            rendimiento: rendimiento,
            porcentaje_utilidad: utilidadPorcentaje,
            tarjeta_operador: pagoOperador,
            mantenimiento: getVal('mantenimiento') * km,
            llantas: getVal('llantas') * km,
            administracion: getVal('administracion') * km,
            seguro_tracto: getVal('seguro_tracto') * diasViaje,
            seguro_caja: getVal('seguro_caja') * diasViaje,
            depreciacion: getVal('depreciacion') * diasViaje,
            rastreo_satelital: getVal('rastreo_sat') * diasViaje,
            infraestructura: getVal('infraestructura') * diasViaje,
            carga_laboral: getVal('carga_laboral') * diasViaje,
            diversos_trans: getVal('diversos_trans') * km,
            direccion_ogoi: getVal('direccion_ogoi') * km
        };

    } catch (err) {
        console.error("Error fatal:", err);
        alert("Error en el cálculo. Revisa la consola (F12).");
    }
}

async function guardarEnHistorial() {
    if (!datosParaHistorial) return;
    try {
        const res = await fetch(`${API_URL}/api/historial_calculo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosParaHistorial)
        });
        if (res.ok) {
            alert("Guardado en historial.");
            document.getElementById('btn-guardar').style.display = 'none';
        }
    } catch (err) { console.error(err); }
}