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
    // Ajustamos los campos del modal a la nueva estructura
    document.getElementById('nombreUnidad').innerText = item.concepto.replace(/_/g, ' ').toUpperCase();
    document.getElementById('editId').value = item.id;
    document.getElementById('editValor').value = item.valor; // Ahora solo editamos el valor
    
    // Guardamos el nombre del concepto en un campo oculto para el log del servidor
    document.getElementById('editConcepto').value = item.concepto;
    
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
        concepto: document.getElementById('editConcepto').value
    };

    try {
        const res = await fetch(`${API_URL}/api/catalogo/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosActualizados)
        });

        if (res.ok) {
            alert("Concepto actualizado con éxito");
            cerrarModal();
            cargarCatalogo(); 
        }
    } catch (err) {
        alert("Error al actualizar el catálogo");
    }
});