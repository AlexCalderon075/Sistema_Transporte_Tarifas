document.getElementById('formLogin').addEventListener('submit', async (e) => {
    e.preventDefault();

    const correo = document.getElementById('loginCorreo').value;
    const password = document.getElementById('loginPass').value;

    try {
        const res = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo, password })
        });

        const data = await res.json();

        if (res.ok) {
            // Guardamos el nombre del usuario para mostrarlo en el Dashboard
            localStorage.setItem('usuarioNombre', data.usuario.nombre);
            window.location.href = 'dashboard.html';
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