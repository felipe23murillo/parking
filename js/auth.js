// auth.js - Manejo de autenticación con Supabase
import { loginUser } from './supabase.js';

// Variable global para usuario actual
let usuarioActual = null;

// Verificar si existe una sesión activa
function verificarSesion() {
    const sesionActiva = sessionStorage.getItem('sesionActiva');
    return sesionActiva === 'true';
}

// Validar credenciales contra Supabase
async function validarCredenciales(usuario, password) {
    try {
        const result = await loginUser(usuario, password);
        if (result.success) {
            return result.user;
        }
        return null;
    } catch (error) {
        console.error('Error validando credenciales:', error);
        return null;
    }
}

// Iniciar sesión
async function iniciarSesion(usuario, password) {
    try {
        const usuarioValido = await validarCredenciales(usuario, password);
        
        if (usuarioValido && usuarioValido.estado === 'activo') {
            sessionStorage.setItem('sesionActiva', 'true');
            sessionStorage.setItem('usuarioActual', JSON.stringify(usuarioValido));
            usuarioActual = usuarioValido;
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        return false;
    }
}

// Cerrar sesión
function cerrarSesion() {
    sessionStorage.removeItem('sesionActiva');
    sessionStorage.removeItem('usuarioActual');
    usuarioActual = null;
    window.location.href = 'index.html';
}

// Obtener usuario actual
function obtenerUsuarioActual() {
    if (usuarioActual) return usuarioActual;
    
    const usuario = sessionStorage.getItem('usuarioActual');
    if (usuario) {
        usuarioActual = JSON.parse(usuario);
        return usuarioActual;
    }
    return null;
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

// Proteger páginas que requieren autenticación
function protegerPagina() {
    if (!verificarSesion() && !window.location.pathname.includes('index.html')) {
        window.location.href = 'index.html';
    }
}

// Manejo del formulario de login
document.addEventListener('DOMContentLoaded', async function() {
    const loginForm = document.getElementById('loginForm');
    
    // Si ya hay sesión activa, redirigir al dashboard
    if (verificarSesion()) {
        window.location.href = 'dashboard.html';
        return;
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const usuario = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            
            // Deshabilitar botón durante la solicitud
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Verificando...';
            
            try {
                const resultado = await iniciarSesion(usuario, password);
                
                if (resultado) {
                    mostrarAlerta('Inicio de sesión exitoso. Redirigiendo...', 'success');
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1500);
                } else {
                    mostrarAlerta('Usuario o contraseña incorrectos. Por favor, intente nuevamente.');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Iniciar Sesión';
                }
            } catch (error) {
                console.error('Error en login:', error);
                mostrarAlerta('Error en el sistema: ' + error.message);
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Iniciar Sesión';
            }
        });
    }

    // Configurar botón de logout si existe
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
