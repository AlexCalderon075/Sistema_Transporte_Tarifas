const API_URL = window.location.origin;

// 1. INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', () => {
    cargarCatalogo();
    
    // Configurar el envío del formulario del modal
    const form = document.getElementById('formEditarTarifa');
    if(form) {
        form.addEventListener('submit', guardarCambio);
    }
});

// 2. CARGAR DATOS EN LA TABLA
async function cargarCatalogo() {
    const tabla = document.getElementById('cuerpoCatalogo');
    if (!tabla) return;

    try {
        const res = await fetch(`${API_URL}/api/catalogo`);
        if (!res.ok) throw new Error("No se pudo obtener el catálogo");
        
        const datos = await res.json();
        tabla.innerHTML = '';

        datos.forEach(item => {
            const fila = document.createElement('tr');

            // Creamos las celdas con texto plano primero para evitar errores de sintaxis
            const nombreLimpio = item.concepto.replace(/_/g, ' ').toUpperCase();
            const valorFormateado = parseFloat(item.valor).toFixed(2);

            fila.innerHTML = `
                <td>${nombreLimpio}</td>
                <td><span style="background:#eee; padding:4px 8px; border-radius:4px; font-size:0.75rem;">${item.categoria || 'GENERAL'}</span></td>
                <td class="text-right">$${valorFormateado}</td>
                <td style="text-align: center;">
                    <button class="btn-edit" id="btn-${item.id}">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                </td>
            `;

            tabla.appendChild(fila);

            // Asignamos el evento click al botón de forma segura
            document.getElementById(`btn-${item.id}`).onclick = () => {
                abrirModal(item.id, item.concepto, item.valor);
            };
        });
        
        console.log("✅ Datos cargados correctamente");
    } catch (err) {
        console.error("❌ Error en cargarCatalogo:", err);
    }
}

// 3. LÓGICA DEL MODAL
function abrirModal(id, concepto, valor) {
    document.getElementById('editId').value = id;
    document.getElementById('editConcepto').value = concepto;
    document.getElementById('editValor').value = valor;
    
    // Título del modal
    document.getElementById('nombreConcepto').innerText = concepto.replace(/_/g, ' ').toUpperCase();
    
    // Mostrar el modal
    document.getElementById('modalEditar').style.display = 'block';
}

function cerrarModal() {
    document.getElementById('modalEditar').style.display = 'none';
}

// 4. GUARDAR CAMBIOS (ENVÍO AL SERVIDOR)
async function guardarCambio(e) {
    e.preventDefault();

    const id = document.getElementById('editId').value;
    const valor = document.getElementById('editValor').value;

    try {
        const res = await fetch(`${API_URL}/api/catalogo/${id}`, {
            method: 'PUT', // Usamos PUT como definimos en el server.js
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ valor: valor })
        });

        if (res.ok) {
            alert("¡Valor actualizado correctamente!");
            cerrarModal();
            cargarCatalogo(); // Refrescamos la tabla
        } else {
            const errorData = await res.json();
            alert("Error al guardar: " + errorData.error);
        }
    } catch (err) {
        console.error("❌ Error al guardar:", err);
        alert("Error de conexión con el servidor.");
    }
}

// Cerrar modal al hacer clic fuera de la caja blanca
window.onclick = function(event) {
    const modal = document.getElementById('modalEditar');
    if (event.target == modal) {
        cerrarModal();
    }
};