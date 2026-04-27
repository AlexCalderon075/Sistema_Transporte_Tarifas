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
    if (!tabla) {
        console.error("❌ No se encontró el elemento 'cuerpoCatalogo' en el HTML");
        return;
    }

    try {
        console.log("Anlizando conexión con:", `${window.location.origin}/api/catalogo`);
        const res = await fetch(`/api/catalogo`); // Usamos ruta relativa por seguridad
        
        if (!res.ok) throw new Error("Error en la respuesta del servidor");
        
        const datos = await res.json();
        console.log("📦 Datos recibidos:", datos);

        if (datos.length === 0) {
            tabla.innerHTML = '<tr><td colspan="4" style="text-align:center;">No hay datos en la base de datos</td></tr>';
            return;
        }

        tabla.innerHTML = '';
        datos.forEach(item => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${item.concepto.replace(/_/g, ' ').toUpperCase()}</td>
                <td><span style="background:#eee; padding:4px 8px; border-radius:4px; font-size:0.75rem;">${item.categoria || 'GENERAL'}</span></td>
                <td class="text-right">$${parseFloat(item.valor).toFixed(2)}</td>
                <td style="text-align: center;">
                    <button class="btn-edit" id="btn-${item.id}">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                </td>
            `;
            tabla.appendChild(fila);

            document.getElementById(`btn-${item.id}`).onclick = () => {
                abrirModal(item.id, item.concepto, item.valor);
            };
        });
    } catch (err) {
        console.error("❌ Error fatal:", err);
        tabla.innerHTML = '<tr><td colspan="4" style="text-align:center; color:red;">Error al conectar con el servidor</td></tr>';
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