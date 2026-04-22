const API_URL = window.location.origin;

document.addEventListener('DOMContentLoaded', cargarCatalogo);

async function cargarCatalogo() {
    try {
        const res = await fetch(`${API_URL}/api/catalogo`);
        const datos = await res.json();
        const cuerpo = document.getElementById('cuerpoCatalogo');
        cuerpo.innerHTML = '';

        datos.forEach(item => {
            // Formateamos el texto del concepto para que no se vea con guiones bajos
            const nombreLimpio = item.concepto.replace(/_/g, ' ').toUpperCase();
            
            cuerpo.innerHTML += `
                <tr>
                    <td><strong>${nombreLimpio}</strong></td>
                    <td>${item.categoria || 'N/A'}</td>
                    <td class="text-right"><strong>$${item.valor.toLocaleString()}</strong></td>
                    <td>
                        <button class="btn-edit" onclick="abrirModal(${JSON.stringify(item).replace(/"/g, '&quot;')})">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        console.error("Error cargando catálogo:", err);
    }
}

function abrirModal(item) {
    // 1. Corregimos el título
    document.getElementById('nombreConcepto').innerText = item.concepto.replace(/_/g, ' ').toUpperCase();
    
    // 2. Cargamos el ID (invisible para el usuario)
    document.getElementById('editId').value = item.id;
    
    // 3. Cargamos el Valor actual
    document.getElementById('editValor').value = item.valor;
    
    // 4. Cargamos el nombre técnico (invisible)
    document.getElementById('editConcepto').value = item.concepto;
    
    // 5. Mostramos el modal
    document.getElementById('modalEditar').style.display = 'block';
}
function cerrarModal() {
    document.getElementById('modalEditar').style.display = 'none';
}

// Guardar cambios
document.getElementById('formEditarTarifa').addEventListener('submit', async (e) => {
    e.preventDefault();

    const datosActualizados = {
        id: document.getElementById('editId').value,
        valor: document.getElementById('editValor').value,
        concepto: document.getElementById('editConcepto').value // ¡Este es clave!
    };

    console.log("Enviando a Render:", datosActualizados); // Esto lo verás en tu F12

    try {
        const res = await fetch(`${API_URL}/api/catalogo/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosActualizados)
        });

        if (res.ok) {
            alert("¡Actualizado!");
            cerrarModal();
            cargarCatalogo(); 
        } else {
            const errorData = await res.json();
            console.error("Error del servidor:", errorData);
        }
    } catch (err) {
        console.error("Error de conexión:", err);
    }
});
async function calcularTarifa() {
    // 1. Capturamos el precio que el usuario escribió en la calculadora
    const precioDiesel = parseFloat(document.getElementById('precio_diesel_manual').value) || 0;
    
    // 2. Capturamos los datos de la ruta
    const km = parseFloat(document.getElementById('km').value) || 0;
    const diasViaje = parseFloat(document.getElementById('dias').value) || 1;
    const casetas = parseFloat(document.getElementById('casetas').value) || 0;
    const transfer = parseFloat(document.getElementById('transfer').value) || 0;
    const rendimiento = parseFloat(document.getElementById('rendimiento_manual').value) || 2.5;

    // 3. Traemos del CATÁLOGO los litros fijos del Thermo
    // Asegúrate de tener un concepto llamado 'litros_diesel_thermo' en Supabase
    const litrosDieselThermo = getVal('litros_diesel_thermo');

    // --- CÁLCULOS ---
    const costoDieselTracto = (km / rendimiento) * precioDiesel;
    const costoDieselThermo = litrosDieselThermo * precioDiesel;

    // ... resto de tus sumas siguiendo la tabla de fórmulas ...
    const admin = km * getVal('administracion');
    const cargaLaboral = diasViaje * getVal('carga_laboral');
    // (etcétera con todos los demás conceptos del catálogo)

    // Sumamos todo para el Pago Operador y el Costo Total
    const sumaGastos = costoDieselTracto + costoDieselThermo + casetas + transfer + admin + cargaLaboral; // (Suma todos los demás)
    
    const pagoOperador = sumaGastos * getVal('sueldo_operador_base');
    const costoTotal = pagoOperador + sumaGastos;

    // Aplicar utilidad
    const porcUtilidad = parseFloat(document.getElementById('utilidad_input').value) / 100;
    const tarifaFinal = costoTotal * (1 + porcUtilidad);

    // Mostrar resultado
    document.getElementById('res_tarifa').innerText = `$${tarifaFinal.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
}