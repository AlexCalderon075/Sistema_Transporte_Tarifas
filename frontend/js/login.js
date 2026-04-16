// --- PROTECCIÓN DE CAMPOS AL REGRESAR ---
window.addEventListener('pageshow', function (event) {
    // 1. Intentamos resetear el formulario si existe
    const formulario = document.getElementById('formLogin');
    if (formulario) {
        formulario.reset();
    }

    // 2. Limpieza manual reforzada (solo borra el CONTENIDO, no el BOTÓN)
    const campoCorreo = document.getElementById('loginCorreo');
    const campoPass = document.getElementById('loginPass');

    if (campoCorreo) campoCorreo.value = ""; 
    if (campoPass) campoPass.value = "";
    
    console.log("Campos de login limpiados automáticamente.");
});

// --- LÓGICA DE LOGIN EXISTENTE ---
document.getElementById('formLogin').addEventListener('submit', async (e) => {
    e.preventDefault();

    const correo = document.getElementById('loginCorreo').value;
    const password = document.getElementById('loginPass').value;

    try {
        const res = await fetch(`${API_BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo, password })
});
        const data = await res.json();

        if (res.ok) {
            // Guardamos el nombre
            localStorage.setItem('usuarioNombre', data.usuario.nombre);
            
            // IMPORTANTE: Usamos replace para que el login no se quede en el historial
            window.location.replace('dashboard.html');
        } else {
            alert("Error: " + data.error);
        }
    } catch (err) {
        alert("Error de conexión con el servidor.");
    }
});

// Extra: Mostrar/Ocultar contraseña
document.getElementById('showPass').addEventListener('change', function() {
    const passInput = document.getElementById('loginPass');
    passInput.type = this.checked ? 'text' : 'password';
});
