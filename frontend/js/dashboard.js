// CONFIGURACIÓN: Cambia esta URL por la de Render cuando la tengas
const API_URL = "https://sistema-transporte-tarifas.onrender.com"; 

// --- 1. PROTECCIÓN ANTIBACK (SEGURIDAD TOTAL) ---
// Se activa incluso si el usuario usa las flechas del navegador
window.addEventListener('pageshow', function (event) {
    const usuario = localStorage.getItem('usuarioNombre');
    if (!usuario) {
        // Si no hay sesión, lo expulsamos sin dejar rastro en el historial
        window.location.replace('index.html');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // 1. Recuperar el nombre del usuario
    const nombreUsuario = localStorage.getItem('usuarioNombre');

    // 2. Verificar autenticación al cargar
    if (!nombreUsuario) {
        window.location.replace('index.html');
        return;
    }

    // 3. Mostrar el nombre en el encabezado
    const bienvenidaElemento = document.getElementById('bienvenida');
    if (bienvenidaElemento) {
        bienvenidaElemento.innerText = `Bienvenido, ${nombreUsuario}`;
    }
});

// --- 3. FUNCIÓN PARA SALIR DEL SISTEMA ---
function cerrarSesion() {
    // Borramos todos los datos (nombre, fotos temporales, etc.)
    localStorage.clear();
    
    console.log("Cerrando sesión y protegiendo historial...");
    
    // Redirigimos usando replace para que el login ocupe el lugar del dashboard
    window.location.replace('index.html');
}