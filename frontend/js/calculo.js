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
a// Variable global para retener los datos después de calcular
let datosParaHistorial = null;

async function calcularTarifa() {
    try {
        // 1. CAPTURA DE INPUTS
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
        const tieneTransfer = document.querySelector('input[name="transfer"]:checked').value === 'si';
        const monedaSeleccionada = document.querySelector('input[name="moneda"]:checked').value;

        if (km <= 0) { alert("Ingresa los kilómetros"); return; }

        // 2. LÓGICA DE NEGOCIO (Viaje Redondo)
        if (tipoViaje === 'redondo') {
            km *= 2;
            casetas *= 2;
        }

        // 3. OBTENCIÓN DE VALORES DEL CATÁLOGO
        const tcActual = getVal('tipo_de_cambio') || 18.50;
        const fFull = (tipoOperacion === 'full') ? getVal('factor_full') : 1;
        const eRefri = (tipoCaja === 'refrigerado') ? getVal('extra_refrigerado') : 0;
        const dThermo = (tipoCaja === 'refrigerado') ? (getVal('litros_diesel_thermo') * precioDiesel) : 0;
        const cRenta = (tipoUnidad === 'renta') ? getVal('costo_renta') : 0;
        const mTransfer = tieneTransfer ? getVal('transfer_costo') : 0;

        // 4. CÁLCULOS OPERATIVOS (Desglose para historial)
        const d_tracto = (km / rendimiento) * precioDiesel;
        const g_km = (getVal('administracion') + getVal('direccion_ogoi') + getVal('diversos_trans') + getVal('llantas') + getVal('mantenimiento')) * km;
        const g_dia = (getVal('carga_laboral') + getVal('depreciacion') + getVal('infraestructura') + getVal('rastreo_sat') + getVal('seguro_caja') + getVal('seguro_tracto')) * diasViaje;

        let sumaBase = (d_tracto + dThermo + g_km + g_dia + casetas + recoleccion + eRefri + cRenta + mTransfer);
        sumaBase *= fFull;

        const pagoOperador = sumaBase * getVal('sueldo_operador_base');
        const costoTotalMXN = sumaBase + pagoOperador;
        const tarifaFinalMXN = costoTotalMXN * (1 + (utilidadPorcentaje / 100));

        // Conversión a Moneda Seleccionada
        let valorFinal = (monedaSeleccionada === 'usd') ? (tarifaFinalMXN / tcActual) : tarifaFinalMXN;

        // 5. MOSTRAR RESULTADO EN PANTALLA
        const simbolo = (monedaSeleccionada === 'usd') ? 'USD $' : '$';
        document.getElementById('res_tarifa').innerText = `${simbolo}${valorFinal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

        // 6. PREPARAR OBJETO COMPLETO PARA HISTORIAL_CALCULO
        datosParaHistorial = {
            fecha: new Date().toISOString(),
            origen: document.getElementById('origen').value || "N/A",
            destino: document.getElementById('destino').value || "N/A",
            unidad: tipoUnidad,
            tipo_viaje: tipoViaje,
            tipo_caja: tipoCaja,
            tipo_operacion: tipoOperacion,
            km: km,
            peso: 0, // Puedes agregar un input para esto si lo requieres
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
            // Desglose detallado desde Catálogo
            carga_laboral: getVal('carga_laboral') * diasViaje,
            mantenimiento: getVal('mantenimiento') * km,
            llantas: getVal('llantas') * km,
            seguro_tracto: getVal('seguro_tracto') * diasViaje,
            seguro_caja: getVal('seguro_caja') * diasViaje,
            depreciacion: getVal('depreciacion') * diasViaje,
            rastreo_satelital: getVal('rastreo_sat') * diasViaje,
            diversos_trans: getVal('diversos_trans') * km,
            administracion: getVal('administracion') * km,
            infraestructura: getVal('infraestructura') * diasViaje,
            direccion_ogoi: getVal('direccion_ogoi') * km
        };

        // Mostrar botón de guardar
        document.getElementById('btn-guardar').style.display = 'block';

    } catch (err) {
        console.error("Error en el cálculo:", err);
        alert("Ocurrió un error. Verifica que los campos del catálogo en Supabase estén correctos.");
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
            alert("✅ Cotización guardada en el historial.");
            document.getElementById('btn-guardar').style.display = 'none';
        } else {
            alert("❌ No se pudo guardar. Revisa la conexión con el servidor.");
        }
    } catch (err) {
        console.error("Error al guardar:", err);
        alert("Error de red al intentar guardar.");
    }
}