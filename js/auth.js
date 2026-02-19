// auth.js - Manejo de autenticación

// Verificar si existe una sesión activa
function verificarSesion() {
    const sesionActiva = localStorage.getItem('sesionActiva');
    return sesionActiva === 'true';
}

// Validar credenciales
function validarCredenciales(usuario, password) {
    const usuarios = obtenerDatos('usuarios');
    if (!usuarios) return null;

    return usuarios.find(u => u.usuario === usuario && u.password === password);
}

// Iniciar sesión
function iniciarSesion(usuario, password) {
    const usuarioValido = validarCredenciales(usuario, password);
    
    if (usuarioValido) {
        localStorage.setItem('sesionActiva', 'true');
        localStorage.setItem('usuarioActual', JSON.stringify(usuarioValido));
        return true;
    }
    return false;
}

// Cerrar sesión
function cerrarSesion() {
    localStorage.removeItem('sesionActiva');
    localStorage.removeItem('usuarioActual');
    window.location.href = 'index.html';
}

// Obtener usuario actual
function obtenerUsuarioActual() {
    const usuario = localStorage.getItem('usuarioActual');
    return usuario ? JSON.parse(usuario) : null;
}

// Mostrar alerta Bootstrap
function mostrarAlerta(mensaje, tipo = 'danger') {
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) return;

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${tipo} alert-dismissible fade show`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    alertContainer.innerHTML = '';
    alertContainer.appendChild(alertDiv);

    // Auto-cerrar después de 5 segundos
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Manejo del formulario de login
if (document.getElementById('loginForm')) {
    // Si ya hay sesión activa, redirigir al dashboard
    if (verificarSesion()) {
        window.location.href = 'dashboard.html';
    }

    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const usuario = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        if (iniciarSesion(usuario, password)) {
            mostrarAlerta('Inicio de sesión exitoso. Redirigiendo...', 'success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } else {
            mostrarAlerta('Usuario o contraseña incorrectos. Por favor, intente nuevamente.');
        }
    });
}

// Proteger páginas que requieren autenticación
function protegerPagina() {
    if (!verificarSesion() && !window.location.pathname.includes('index.html')) {
        window.location.href = 'index.html';
    }
}

// Configurar botón de logout si existe
document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('¿Está seguro que desea cerrar sesión?')) {
                cerrarSesion();
            }
        });
    }

    // Mostrar nombre de usuario si existe
    const userName = document.getElementById('userName');
    if (userName) {
        const usuario = obtenerUsuarioActual();
        if (usuario) {
            userName.textContent = usuario.nombre;
        }
    }

    // Toggle sidebar
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }
});
