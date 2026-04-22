const API_URL = window.location.origin;

document.addEventListener('DOMContentLoaded', cargarCatalogo);

async function cargarCatalogo() {
    try {
        const res = await fetch(`${API_URL}/api/catalogo`);
        const datos = await res.json();
        const cuerpo = document.getElementById('cuerpoCatalogo');
        cuerpo.innerHTML = '';

        datos.forEach(item => {
            cuerpo.innerHTML += `
                <tr>
                    <td><strong>${item.unidad}</strong></td>
                    <td>${item.rendimiento} km/L</td>
                    <td>$${item.precio_diesel}</td>
                    <td>$${item.infraestructura}</td>
                    <td>$${item.sueldo_operador}</td>
                    <td>${item.administracion}%</td>
                    <td>${item.utilidad}%</td>
                    <td>
                        <button class="btn-edit" onclick="abrirModal(${JSON.stringify(item).replace(/"/g, '&quot;')})">
                            <i class="fas fa-edit"></i>
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
    document.getElementById('nombreUnidad').innerText = item.unidad;
    document.getElementById('editId').value = item.id;
    document.getElementById('editRendimiento').value = item.rendimiento;
    document.getElementById('editDiesel').value = item.precio_diesel;
    document.getElementById('editInfra').value = item.infraestructura;
    document.getElementById('editAdmin').value = item.administracion;
    document.getElementById('editUtilidad').value = item.utilidad;
    
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
        rendimiento: document.getElementById('editRendimiento').value,
        precio_diesel: document.getElementById('editDiesel').value,
        infraestructura: document.getElementById('editInfra').value,
        administracion: document.getElementById('editAdmin').value,
        utilidad: document.getElementById('editUtilidad').value
    };

    try {
        const res = await fetch(`${API_URL}/api/catalogo/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosActualizados)
        });

        if (res.ok) {
            alert("Catálogo actualizado correctamente");
            cerrarModal();
            cargarCatalogo(); // Recargar tabla
        }
    } catch (err) {
        alert("Error al actualizar el catálogo");
    }
});