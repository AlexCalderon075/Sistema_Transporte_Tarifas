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
    console.log("Iniciando proceso de cálculo...");

    try {
        // 1. CAPTURA SEGURA (Si un elemento no existe, le asigna 0 o texto vacío)
        const getElValue = (id) => {
            const el = document.getElementById(id);
            return el ? el.value : (id === 'origen' || id === 'destino' ? "" : 0);
        };

        let km = Number(getElValue('km'));
        let casetas = Number(getElValue('casetas'));
        const diasViaje = Number(getElValue('dias'));
        const precioDiesel = Number(getElValue('precio_diesel_manual'));
        const rendimiento = Number(getElValue('rendimiento')) || 2.5;
        const utilidadPorcentaje = Number(getElValue('utilidad_input'));
        const recoleccion = Number(getElValue('recoleccion'));

        const tipoViaje = getElValue('tipo_viaje');
        const tipoOperacion = getElValue('tipo_operacion');
        const tipoCaja = getElValue('tipo_caja');
        const tipoUnidad = getElValue('tipo_unidad');
        
        const tieneTransfer = document.querySelector('input[name="transfer"]:checked')?.value === 'si';
        const monedaSeleccionada = document.querySelector('input[name="moneda"]:checked')?.value || 'mxn';

        if (km <= 0) { 
            alert("Por favor, ingresa los kilómetros para calcular."); 
            return; 
        }

        // 2. MATEMÁTICAS
        if (tipoViaje === 'redondo') { km *= 2; casetas *= 2; }

        const tcActual = getVal('tipo_de_cambio') || 18.50;
        const fFull = (tipoOperacion === 'full') ? getVal('factor_full') : 1;
        
        // Cálculos de costos
        const d_tracto = (km / rendimiento) * precioDiesel;
        const g_km = (getVal('administracion') + getVal('direccion_ogoi') + getVal('diversos_trans') + getVal('llantas') + getVal('mantenimiento')) * km;
        const g_dia = (getVal('carga_laboral') + getVal('depreciacion') + getVal('infraestructura') + getVal('rastreo_sat') + getVal('seguro_caja') + getVal('seguro_tracto')) * diasViaje;

        let sumaBase = (d_tracto + g_km + g_dia + casetas + recoleccion + (tipoCaja === 'refrigerado' ? getVal('extra_refrigerado') : 0));
        sumaBase *= fFull;

        const pagoOperador = sumaBase * getVal('sueldo_operador_base');
        const costoTotalMXN = sumaBase + pagoOperador;
        const tarifaFinalMXN = costoTotalMXN * (1 + (utilidadPorcentaje / 100));

        let valorFinal = (monedaSeleccionada === 'usd') ? (tarifaFinalMXN / tcActual) : tarifaFinalMXN;

        // 3. MOSTRAR RESULTADOS
        const simbolo = (monedaSeleccionada === 'usd') ? 'USD $' : '$';
        document.getElementById('res_tarifa').innerText = `${simbolo}${valorFinal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

        // 4. GUARDAR DATOS EN LA VARIABLE GLOBAL
        datosParaHistorial = {
            fecha: new Date().toISOString(),
            origen: document.getElementById('origen').value || "N/A",
            destino: document.getElementById('destino').value || "N/A",
            unidad: tipoUnidad,
            tipo_viaje: tipoViaje,
            tipo_caja: tipoCaja,
            km: km,
            peso: 0, 
            costo_operativo: costoTotalMXN,
            utilidad: tarifaFinalMXN - costoTotalMXN,
            tarifa_final: valorFinal,
            usuario_nombre: "", 
            dias_viaje: diasViaje,
            costo_recoleccion: recoleccion,
            con_transfer: tieneTransfer ? 'si' : 'no',
            moneda: monedaSeleccionada,
            tipo_operacion: tipoOperacion,
            monto_casetas: casetas,
            precio_diesel: precioDiesel,
            rendimiento: rendimiento,
            porcentaje_utilidad: utilidadPorcentaje,
            tarjeta_operador: pagoOperador,
            
            // Desglose usando los nombres exactos de tu tabla Catálogo
            carga_laboral: getVal('carga_laboral') * diasViaje,
            mantenimiento: getVal('mantenimiento') * km,
            llantas: getVal('llantas') * km,
            seguro_tracto: getVal('seguro_tracto') * diasViaje,
            seguro_caja: getVal('seguro_caja') * diasViaje,
            depreciacion: getVal('depreciacion') * km, // Nota: Según tu tabla es Variable_KM
            rastreo_satelital: getVal('rastreo_sat') * diasViaje, // JS usa 'rastreo_sat' del catálogo y guarda en 'rastreo_satelital' de la BD
            diversos_trans: getVal('diversos_trans') * km,
            administracion: getVal('administracion') * diasViaje,
            infraestructura: getVal('infraestructura') * diasViaje,
            direccion_ogoi: getVal('direccion_ogoi') * diasViaje
        };
        // --- EL PASO FINAL: MOSTRAR EL BOTÓN ---
        const btnGuardar = document.getElementById('btn-guardar');
        if (btnGuardar) {
            btnGuardar.style.setProperty('display', 'block', 'important');
            console.log("Botón de guardar activado con éxito");
        } else {
            console.error("No se encontró el elemento con ID 'btn-guardar'");
        }

    } catch (err) {
        console.error("Error en el cálculo:", err);
        alert("Ocurrió un error al procesar los datos.");
    }
}
async function guardarEnHistorial() {
    if (!datosParaHistorial) return;

    try {
        // Esta URL debe ser la misma que definiste en app.post(...) de tu servidor
        const res = await fetch(`${API_URL}/api/historial_calculo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosParaHistorial)
        });

        if (res.ok) {
            alert("✅ Cotización guardada en historial_calculos correctamente.");
            document.getElementById('btn-guardar').style.display = 'none';
        } else {
            const errorData = await res.json();
            alert("❌ Error: " + errorData.error);
        }
    } catch (err) {
        console.error("Error de conexión:", err);
        alert("No se pudo conectar con el servidor. Verifica que el servidor esté corriendo.");
    }
}