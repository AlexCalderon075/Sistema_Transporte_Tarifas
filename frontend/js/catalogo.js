const API_URL = window.location.origin;

// 1. CARGAR DATOS AL ABRIR LA PÁGINA
document.addEventListener('DOMContentLoaded', () => {
    cargarCatalogo();
});

// 2. FUNCIÓN PARA OBTENER LOS DATOS DEL BACKEND
async function cargarCatalogo() {
    const tabla = document.getElementById('tabla-catalogo');
    if (!tabla) return;

    try {
        const res = await fetch(`${API_URL}/api/catalogo`);
        const datos = await res.json();

        // Limpiar tabla antes de llenar
        tabla.innerHTML = '';

        datos.forEach(item => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${item.concepto.replace(/_/g, ' ').toUpperCase()}</td>
                <td>
                    <input type="number" step="0.01" value="${item.valor}" 
                           id="input-${item.id}" class="form-control">
                </td>
                <td><span class="badge-categoria">${item.categoria || 'GENERAL'}</span></td>
                <td>
                    <button onclick="guardarCambio(${item.id}, '${item.concepto}')" class="btn-save">
                        <i class="fas fa-save"></i> Guardar
                    </button>
                </td>
            `;
            tabla.appendChild(fila);
        });
        console.log("✅ Catálogo cargado correctamente");
    } catch (err) {
        console.error("❌ Error al cargar el catálogo:", err);
        alert("Error al conectar con el servidor.");
    }
}

// 3. FUNCIÓN PARA GUARDAR CAMBIOS INDIVIDUALES
async function guardarCambio(id, concepto) {
    const nuevoValor = document.getElementById(`input-${id}`).value;

    try {
        const res = await fetch(`${API_URL}/api/catalogo/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ valor: nuevoValor })
        });

        if (res.ok) {
            // Animación simple de éxito
            const btn = event.target.closest('button');
            btn.style.background = '#2ecc71';
            btn.innerHTML = '<i class="fas fa-check"></i> ¡Listo!';
            
            setTimeout(() => {
                btn.style.background = '#8e44ad';
                btn.innerHTML = '<i class="fas fa-save"></i> Guardar';
            }, 2000);

            console.log(`${concepto} actualizado a ${nuevoValor}`);
        } else {
            throw new Error("Error al actualizar");
        }
    } catch (err) {
        console.error("Error:", err);
        alert("No se pudo guardar el cambio.");
    }
}