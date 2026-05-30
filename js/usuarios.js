// usuarios.js - Gestión de usuarios del sistema
import { getAllUsers, createUser, updateUser, deleteUser } from './supabase.js';

let usuarioEditandoId = null;

// Escapar HTML
function escaparHtml(valor) {
    const div = document.createElement('div');
    div.textContent = valor ?? '';
    return div.innerHTML;
}

// Mostrar alerta
function mostrarAlertaUsuarios(mensaje, tipo = 'danger') {
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

// Cargar usuarios desde Supabase
async function cargarUsuarios() {
    const result = await getAllUsers();
    return result.success ? result.users : [];
}

// Actualizar resumen
async function actualizarResumenUsuarios() {
    const usuarios = await cargarUsuarios();
    const activos = usuarios.filter(u => u.estado !== 'inactivo').length;
    const inactivos = usuarios.length - activos;

    document.getElementById('totalUsuarios').textContent = usuarios.length;
    document.getElementById('usuariosActivos').textContent = activos;
    document.getElementById('usuariosInactivos').textContent = inactivos;
}

// Mostrar usuarios en la tabla
async function mostrarUsuarios() {
    const usuarios = await cargarUsuarios();
    const tbody = document.getElementById('usuariosTabla');

    if (!usuarios || usuarios.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No hay usuarios registrados</td></tr>';
        return;
    }

    const usuarioActualLogin = obtenerUsuarioActual();
    
    tbody.innerHTML = usuarios.map(usuario => {
        const estado = usuario.estado === 'inactivo' ? 'inactivo' : 'activo';
        const estadoClase = estado === 'activo' ? 'success' : 'secondary';
        const rolTexto = usuario.rol === 'admin' ? 'Administrador' : 'Operador';
        const esPropio = usuarioActualLogin?.id === usuario.id;

        return `
            <tr>
                <td><strong>${escaparHtml(usuario.nombre)}</strong></td>
                <td>${escaparHtml(usuario.usuario)}</td>
                <td><span class="badge bg-primary">${rolTexto}</span></td>
                <td><span class="badge bg-${estadoClase}">${estado}</span></td>
                <td><small>${usuario.fechaCreacion ? new Date(usuario.fechaCreacion).toLocaleDateString('es-CO') : '-'}</small></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="editarUsuario(${usuario.id})" title="Editar usuario" ${esPropio ? 'disabled' : ''}>
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-${estado === 'activo' ? 'warning' : 'success'} me-1" onclick="cambiarEstadoUsuario(${usuario.id})" title="${estado === 'activo' ? 'Inactivar' : 'Activar'} usuario" ${esPropio ? 'disabled' : ''}>
                        <i class="bi bi-${estado === 'activo' ? 'pause-circle' : 'play-circle'}"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="eliminarUsuario(${usuario.id})" title="Eliminar usuario" ${esPropio ? 'disabled' : ''}>
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Limpiar formulario
function limpiarFormulario() {
    usuarioEditandoId = null;
    document.getElementById('usuarioForm').reset();
    document.getElementById('usuarioId').value = '';
    document.getElementById('password').required = true;
    document.getElementById('passwordHelp').textContent = 'La clave será necesaria para iniciar sesión.';
    document.getElementById('formTitle').innerHTML = '<i class="bi bi-person-plus"></i> Crear Usuario';
    document.getElementById('btnGuardarUsuario').innerHTML = '<i class="bi bi-save"></i> Guardar Usuario';
    document.getElementById('btnCancelarEdicion').classList.add('d-none');
}

// Editar usuario
window.editarUsuario = async function(id) {
    const usuarios = await cargarUsuarios();
    const usuario = usuarios.find(u => u.id === id);
    if (!usuario) return;

    usuarioEditandoId = id;
    document.getElementById('usuarioId').value = usuario.id;
    document.getElementById('nombre').value = usuario.nombre;
    document.getElementById('usuario').value = usuario.usuario;
    document.getElementById('password').value = '';
    document.getElementById('password').required = false;
    document.getElementById('rol').value = usuario.rol || 'operador';
    document.getElementById('estado').value = usuario.estado || 'activo';
    document.getElementById('passwordHelp').textContent = 'Deje la clave vacía para conservar la actual.';
    document.getElementById('formTitle').innerHTML = '<i class="bi bi-pencil"></i> Editar Usuario';
    document.getElementById('btnGuardarUsuario').innerHTML = '<i class="bi bi-check-circle"></i> Actualizar Usuario';
    document.getElementById('btnCancelarEdicion').classList.remove('d-none');
    document.getElementById('nombre').focus();
};

// Cambiar estado usuario
window.cambiarEstadoUsuario = async function(id) {
    const usuarios = await cargarUsuarios();
    const usuario = usuarios.find(u => u.id === id);
    const usuarioActualLogin = obtenerUsuarioActual();

    if (!usuario) return;

    if (usuarioActualLogin && usuarioActualLogin.id === id && usuario.estado !== 'inactivo') {
        mostrarAlertaUsuarios('No puede inactivar el usuario con el que tiene la sesión abierta.', 'warning');
        return;
    }

    const nuevoEstado = usuario.estado === 'inactivo' ? 'activo' : 'inactivo';
    const result = await updateUser(id, { ...usuario, estado: nuevoEstado });
    
    if (result.success) {
        mostrarAlertaUsuarios(`Usuario ${nuevoEstado === 'activo' ? 'activado' : 'inactivado'} correctamente.`, 'success');
        mostrarUsuarios();
        actualizarResumenUsuarios();
    } else {
        mostrarAlertaUsuarios('Error al actualizar usuario: ' + result.error, 'danger');
    }
};

// Eliminar usuario
window.eliminarUsuario = async function(id) {
    const usuarios = await cargarUsuarios();
    const usuario = usuarios.find(u => u.id === id);
    const usuarioActualLogin = obtenerUsuarioActual();

    if (!usuario) return;

    if (usuarioActualLogin && usuarioActualLogin.id === id) {
        mostrarAlertaUsuarios('No puede eliminar el usuario con el que tiene la sesión abierta.', 'warning');
        return;
    }

    if (!confirm(`¿Desea eliminar el usuario "${usuario.usuario}"?`)) return;

    const result = await deleteUser(id);
    if (result.success) {
        limpiarFormulario();
        mostrarUsuarios();
        actualizarResumenUsuarios();
        mostrarAlertaUsuarios('Usuario eliminado correctamente.', 'success');
    } else {
        mostrarAlertaUsuarios('Error al eliminar usuario: ' + result.error, 'danger');
    }
};

// Filtrar usuarios
async function filtrarUsuarios() {
    const busqueda = document.getElementById('buscarUsuario').value.toLowerCase();
    const estado = document.getElementById('filtroEstado').value;
    
    const usuarios = await cargarUsuarios();
    let filtrados = usuarios;

    if (estado) {
        filtrados = filtrados.filter(u => (u.estado || 'activo') === estado);
    }

    if (busqueda) {
        filtrados = filtrados.filter(u =>
            u.nombre.toLowerCase().includes(busqueda) ||
            u.usuario.toLowerCase().includes(busqueda)
        );
    }

    const tbody = document.getElementById('usuariosTabla');
    tbody.innerHTML = filtrados.map(usuario => {
        const est = usuario.estado === 'inactivo' ? 'inactivo' : 'activo';
        const estClase = est === 'activo' ? 'success' : 'secondary';
        const rolTexto = usuario.rol === 'admin' ? 'Administrador' : 'Operador';
        const esPropio = obtenerUsuarioActual()?.id === usuario.id;

        return `
            <tr>
                <td><strong>${escaparHtml(usuario.nombre)}</strong></td>
                <td>${escaparHtml(usuario.usuario)}</td>
                <td><span class="badge bg-primary">${rolTexto}</span></td>
                <td><span class="badge bg-${estClase}">${est}</span></td>
                <td><small>${usuario.fechaCreacion ? new Date(usuario.fechaCreacion).toLocaleDateString('es-CO') : '-'}</small></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="editarUsuario(${usuario.id})" title="Editar usuario" ${esPropio ? 'disabled' : ''}>
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-${est === 'activo' ? 'warning' : 'success'} me-1" onclick="cambiarEstadoUsuario(${usuario.id})" title="${est === 'activo' ? 'Inactivar' : 'Activar'} usuario" ${esPropio ? 'disabled' : ''}>
                        <i class="bi bi-${est === 'activo' ? 'pause-circle' : 'play-circle'}"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="eliminarUsuario(${usuario.id})" title="Eliminar usuario" ${esPropio ? 'disabled' : ''}>
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Inicializar página
document.addEventListener('DOMContentLoaded', function() {
    protegerPagina();
    actualizarResumenUsuarios();
    mostrarUsuarios();

    document.getElementById('usuarioForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const nombre = document.getElementById('nombre').value.trim();
        const usuario = document.getElementById('usuario').value.trim().toLowerCase();
        const password = document.getElementById('password').value.trim();
        const rol = document.getElementById('rol').value;
        const estado = document.getElementById('estado').value;

        if (!nombre || !usuario || (!usuarioEditandoId && !password) || !rol || !estado) {
            mostrarAlertaUsuarios('Complete todos los campos obligatorios.', 'warning');
            return;
        }

        let result;

        if (usuarioEditandoId) {
            const usuarios = await cargarUsuarios();
            const usuarioExistente = usuarios.find(u => u.id === usuarioEditandoId);
            
            if (password) {
                usuarioExistente.password = password;
            }
            
            result = await updateUser(usuarioEditandoId, {
                nombre,
                usuario,
                password: password || usuarioExistente.password,
                rol,
                estado
            });
        } else {
            result = await createUser({
                nombre,
                usuario,
                password,
                rol,
                estado,
                fechaCreacion: new Date().toISOString()
            });
        }

        if (result.success) {
            limpiarFormulario();
            mostrarUsuarios();
            actualizarResumenUsuarios();
            mostrarAlertaUsuarios('Usuario guardado correctamente.', 'success');
        } else {
            mostrarAlertaUsuarios('Error al guardar usuario: ' + result.error, 'danger');
        }
    });

    document.getElementById('btnCancelarEdicion').addEventListener('click', limpiarFormulario);
    document.getElementById('buscarUsuario').addEventListener('input', filtrarUsuarios);
    document.getElementById('filtroEstado').addEventListener('change', filtrarUsuarios);
});