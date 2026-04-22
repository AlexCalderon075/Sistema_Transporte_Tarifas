const API_URL = window.location.origin;

document.getElementById('formCalculo').addEventListener('submit', async (e) => {
    e.preventDefault();

    // 1. Obtener datos del formulario
    const unidadSeleccionada = document.getElementById('selectUnidad').value; // Ej: 'T3-S2'
    const km = parseFloat(document.getElementById('inputKm').value);
    const tipoViaje = document.getElementById('selectTipo').value; // 'sencillo' o 'full'

    try {
        // 2. CONSULTAR EL CATÁLOGO (Lo que configuraste antes)
        const resCat = await fetch(`${API_URL}/api/catalogo`);
        const catalogo = await resCat.json();

        // Buscamos la fila que corresponde a la unidad
        const config = catalogo.find(item => item.unidad === unidadSeleccionada);

        if (!config) {
            alert("No se encontró configuración para esta unidad en el catálogo.");
            return;
        }

        // 3. LÓGICA DE CÁLCULO BASADA EN EL CATÁLOGO
        // El rendimiento cambia si es sencillo o full (puedes ajustar esta lógica)
        const rendimientoReal = (tipoViaje === 'full') ? (config.rendimiento * 0.7) : config.rendimiento;
        
        const gastoDiesel = (km / rendimientoReal) * config.precio_diesel;
        const sueldo = config.sueldo_operador; // O config.sueldo_operador * km si es por distancia
        
        const costoOperativo = gastoDiesel + sueldo + config.infraestructura;
        
        // Aplicamos porcentajes del catálogo
        const conAdmin = costoOperativo * (1 + (config.administracion / 100));
        const precioFinal = conAdmin * (1 + (config.utilidad / 100));

        // 4. MOSTRAR RESULTADOS
        document.getElementById('resTotal').innerText = `$${precioFinal.toFixed(2)}`;
        document.getElementById('resDiesel').innerText = `$${gastoDiesel.toFixed(2)}`;
        
        // 5. GUARDAR EN EL HISTORIAL AUTOMÁTICAMENTE
        guardarEnHistorial({
            unidad: unidadSeleccionada,
            km: km,
            tipo: tipoViaje,
            total: precioFinal.toFixed(2),
            diesel_aplicado: config.precio_diesel
        });

    } catch (err) {
        console.error("Error en el cálculo:", err);
        alert("Error al conectar con el catálogo.");
    }
});

async function guardarEnHistorial(datos) {
    await fetch(`${API_URL}/api/historial/guardar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    });
}