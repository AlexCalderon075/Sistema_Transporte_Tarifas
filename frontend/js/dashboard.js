document.addEventListener('DOMContentLoaded', () => {
    // 1. Recuperar el nombre del usuario desde el almacenamiento local
    const nombreUsuario = localStorage.getItem('usuarioNombre');

    // 2. Verificar si el usuario está autenticado
    if (!nombreUsuario) {
        // Si no hay datos, lo mandamos de vuelta al login por seguridad
        window.location.href = 'index.html';
        return;
    }

    // 3. Mostrar el nombre en el encabezado
    const bienvenidaElemento = document.getElementById('bienvenida');
    if (bienvenidaElemento) {
        bienvenidaElemento.innerText = `Bienvenido, ${nombreUsuario}`;
    }
});

// Función para salir del sistema
function cerrarSesion() {
    // Borramos los datos de la sesión
    localStorage.removeItem('usuarioNombre');
    // Redirigimos al inicio
    window.location.href = 'index.html';
}