document.getElementById('formRegistro').addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombre = document.getElementById('nombre').value;
    const telefono = document.getElementById('telefono').value;
    const correo = document.getElementById('correo').value;
    const tarjeta = document.getElementById('tarjeta').value;
    const pass = document.getElementById('pass').value;
    const confirmPass = document.getElementById('confirmPass').value;

    if (pass !== confirmPass) {
        alert("Las contraseñas no coinciden");
        return;
    }

    try {
        const res = await fetch('http://localhost:3000/api/registro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, telefono, correo, tarjeta_id: tarjeta, password: pass })
        });

        const data = await res.json();
        if (res.ok) {
            alert(data.mensaje);
            window.location.href = 'index.html';
        } else {
            alert("Error: " + data.error);
        }
    } catch (err) {
        alert("No se pudo conectar con el servidor.");
    }
});