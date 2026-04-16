const API_URL = "https://sistema-transporte-tarifas-1.onrender.com"; 

document.addEventListener('DOMContentLoaded', async () => {
    const nombreUsuario = localStorage.getItem('usuarioNombre');
    if (!nombreUsuario) { window.location.replace('index.html'); return; }

    try {
        const res = await fetch(`${API_URL}/api/usuario/${encodeURIComponent(nombreUsuario)}`);
        const data = await res.json();

        if (res.ok) {
            document.getElementById('perfNombre').value = data.nombre || '';
            document.getElementById('perfCorreo').value = data.correo || '';
            document.getElementById('perfTelefono').value = data.telefono || '';
            document.getElementById('perfTarjeta').value = data.tarjeta_id || '';
            
            if (data.foto) {
                const rutaFoto = data.foto.startsWith('http') ? data.foto : `${API_URL}${data.foto}`;
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
    
    if (fotoInput.files[0]) {
        formData.append('fotoArchivo', fotoInput.files[0]);
    } else {
        const srcActual = document.getElementById('imgPerfil').src;
        // Limpiamos la URL para quedarnos solo con /uploads/...
        const rutaRelativa = srcActual.replace(API_URL, '');
        formData.append('fotoExistente', rutaRelativa);
    }

    try {
        const res = await fetch(`${API_URL}/api/usuario/actualizar/${encodeURIComponent(nombreOriginal)}`, {
            method: 'PUT',
            body: formData 
        });

        if (res.ok) {
            const data = await res.json();
            alert("Perfil actualizado");
            localStorage.setItem('usuarioNombre', document.getElementById('perfNombre').value);
            location.reload();
        }
    } catch (err) { alert("Error al conectar con el servidor"); }
});