// auth.js - Manejo de autenticación con Supabase
import { loginUser } from './supabase.js';

let usuarioActual = null;

function verificarSesion() {
    const sesionActiva = sessionStorage.getItem('sesionActiva');
    return sesionActiva === 'true';
}

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

async function iniciarSesion(usuario, password) {
    try {
        const usuarioValido = await validarCredenciales(usuario, password);
        
        if (usuarioValido) {
            const estado = usuarioValido.estado || 'activo';
            if (estado === 'activo') {
                sessionStorage.setItem('sesionActiva', 'true');
                sessionStorage.setItem('usuarioActual', JSON.stringify(usuarioValido));
                usuarioActual = usuarioValido;
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        return false;
    }
}

function cerrarSesion() {
    sessionStorage.removeItem('sesionActiva');
    sessionStorage.removeItem('usuarioActual');
    usuarioActual = null;
    window.location.href = 'index.html';
}

function obtenerUsuarioActual() {
    if (usuarioActual) return usuarioActual;
    
    const usuario = sessionStorage.getItem('usuarioActual');
    if (usuario) {
        usuarioActual = JSON.parse(usuario);
        return usuarioActual;
    }
    return null;
}

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
    setTimeout(() => alertDiv.remove(), 5000);
}

function protegerPagina() {
    if (!verificarSesion() && !window.location.pathname.includes('index.html')) {
        window.location.href = 'index.html';
    }
}

// Hacer funciones disponibles globalmente para otros scripts
window.verificarSesion = verificarSesion;
window.protegerPagina = protegerPagina;
window.obtenerUsuarioActual = obtenerUsuarioActual;
window.cerrarSesion = cerrarSesion;
window.mostrarAlerta = mostrarAlerta;

document.addEventListener('DOMContentLoaded', async function() {
    const loginForm = document.getElementById('loginForm');
    const esPaginaLogin = Boolean(loginForm);
    
    if (esPaginaLogin && verificarSesion()) {
        window.location.href = 'dashboard.html';
        return;
    }

    if (!esPaginaLogin && !verificarSesion()) {
        window.location.href = 'index.html';
        return;
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const usuario = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Verificando...';
            
            try {
                const resultado = await iniciarSesion(usuario, password);
                console.log('Resultado login:', resultado);
                
                if (resultado) {
                    mostrarAlerta('Inicio de sesión exitoso. Redirigiendo...', 'success');
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1500);
                } else {
                    mostrarAlerta('Usuario o contraseña incorrectos. Por favor, intente nuevamente.', 'danger');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Iniciar Sesión';
                }
            } catch (error) {
                console.error('Error en login:', error);
                mostrarAlerta('Error en el sistema: ' + error.message, 'danger');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Iniciar Sesión';
            }
        });
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('¿Está seguro que desea cerrar sesión?')) {
                cerrarSesion();
            }
        });
    }

    const userName = document.getElementById('userName');
    if (userName) {
        const usuario = obtenerUsuarioActual();
        if (usuario) {
            userName.textContent = usuario.nombre;
        }
    }

    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }
});
