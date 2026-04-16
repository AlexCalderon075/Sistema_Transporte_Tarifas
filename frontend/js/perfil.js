document.addEventListener('DOMContentLoaded', async () => {
    const nombreUsuario = localStorage.getItem('usuarioNombre');
    if (!nombreUsuario) { window.location.href = 'index.html'; return; }

    try {
        const res = await fetch(`http://localhost:3000/api/usuario/${encodeURIComponent(nombreUsuario)}`);
        const data = await res.json();

        if (res.ok) {
            document.getElementById('perfNombre').value = data.nombre || '';
            document.getElementById('perfCorreo').value = data.correo || '';
            document.getElementById('perfTelefono').value = data.telefono || '';
            document.getElementById('perfTarjeta').value = data.tarjeta_id || '';
            
            if (data.foto) {
                // Si la ruta no es una URL completa, le pegamos el servidor
                const rutaFoto = data.foto.startsWith('http') ? data.foto : `http://localhost:3000${data.foto}`;
                document.getElementById('imgPerfil').src = rutaFoto;
            }
        }
    } catch (err) { console.error("Error al cargar perfil", err); }
});

document.getElementById('formPerfil').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombreOriginal = localStorage.getItem('usuarioNombre');
    const fotoInput = document.getElementById('fotoArchivo');

    const formData = new FormData();
    formData.append('nombre', document.getElementById('perfNombre').value);
    formData.append('telefono', document.getElementById('perfTelefono').value);
    formData.append('tarjeta_id', document.getElementById('perfTarjeta').value);
    
    // Si el usuario eligió un archivo, se adjunta. Si no, mandamos la ruta actual.
    if (fotoInput.files[0]) {
        formData.append('fotoArchivo', fotoInput.files[0]);
    } else {
        const srcActual = document.getElementById('imgPerfil').src;
        // Solo mandamos la parte relativa (/uploads/...)
        const rutaRelativa = srcActual.replace('http://localhost:3000', '');
        formData.append('fotoExistente', rutaRelativa);
    }

    try {
        const res = await fetch(`http://localhost:3000/api/usuario/actualizar/${encodeURIComponent(nombreOriginal)}`, {
            method: 'PUT',
            body: formData // Importante: FormData no lleva headers de Content-Type manuales
        });

        if (res.ok) {
            const data = await res.json();
            alert("Perfil actualizado");
            localStorage.setItem('usuarioNombre', document.getElementById('perfNombre').value);
            location.reload();
        }
    } catch (err) { alert("Error al conectar con el servidor"); }
});