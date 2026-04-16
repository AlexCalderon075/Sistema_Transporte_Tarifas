// 1. Bloqueo inmediato (esto corre apenas carga la página o al dar "atrás")
window.addEventListener('pageshow', function (event) {
    const usuario = localStorage.getItem('usuarioNombre');
    if (!usuario) {
        // .replace borra la página del historial para que no puedan volver
        window.location.replace('index.html');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const nombreUsuario = localStorage.getItem('usuarioNombre');

    // Segunda capa de seguridad
    if (!nombreUsuario) {
        window.location.replace('index.html');
        return;
    }

    const bienvenidaElemento = document.getElementById('bienvenida');
    if (bienvenidaElemento) {
        bienvenidaElemento.innerText = `Bienvenido, ${nombreUsuario}`;
    }
});

// 2. Función para salir (Actualizada con .replace)
function cerrarSesion() {
    localStorage.clear();
    console.log("Sesión cerrada");
    window.location.replace('index.html');
}