// CONFIGURACIÓN: Cambia esta URL cuando ya tengas la de Render
const API_URL = "https://sistema-transporte-tarifas-1.onrender.com"; 

// --- PROTECCIÓN DE CAMPOS AL REGRESAR ---
window.addEventListener('pageshow', function (event) {
    const formulario = document.getElementById('formLogin');
    if (formulario) formulario.reset();
    if (document.getElementById('loginCorreo')) document.getElementById('loginCorreo').value = "";
    if (document.getElementById('loginPass')) document.getElementById('loginPass').value = "";
});

// --- LÓGICA DE LOGIN ---
document.getElementById('formLogin').addEventListener('submit', async (e) => {
    e.preventDefault();

    const correo = document.getElementById('loginCorreo').value;
    const password = document.getElementById('loginPass').value;

    try {
        const res = await fetch(`${API_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo, password })
        });

        const data = await res.json();

        if (res.ok) {
            localStorage.setItem('usuarioNombre', data.usuario.nombre);
            // Usamos replace para mayor seguridad en el historial
            window.location.replace('dashboard.html');
        } else {
            alert("Error: " + data.error);
        }
    } catch (err) {
        alert("Error de conexión con el servidor.");
    }
});
async function recuperarClave() {
    const correo = prompt("Introduce tu correo registrado:");
    if (!correo) return;

    const tarjeta = prompt("Introduce tu ID de Tarjeta para validar tu identidad:");
    if (!tarjeta) return;

    try {
        const response = await fetch('https://sistema-transporte-tarifas-1.onrender.com/api/recuperar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo, tarjeta_id: tarjeta })
        });

        const data = await response.json();

        if (response.ok) {
            alert("Validación exitosa. Tu contraseña es: " + data.password);
        } else {
            alert("x " + data.error);
        }
    } catch (error) {
        alerct("Hubo un error al conectar con el servidor.");
    }
}
// Mostrar/Ocultar contraseña
const checkShow = document.getElementById('showPass');
if (checkShow) {
    checkShow.addEventListener('change', function() {
        const passInput = document.getElementById('loginPass');
        passInput.type = this.checked ? 'text' : 'password';
    });
}