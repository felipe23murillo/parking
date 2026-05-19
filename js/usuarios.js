// usuarios.js - Gestion de usuarios del sistema

// Proteger la pagina
protegerPagina();

let usuarioEditandoId = null;

function obtenerUsuarios() {
    return obtenerDatos('usuarios') || [];
}

function normalizarUsuario(valor) {
    return valor.trim().toLowerCase();
}

function escaparHtml(valor) {
    const div = document.createElement('div');
    div.textContent = valor ?? '';
    return div.innerHTML;
}

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

    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

function actualizarResumenUsuarios() {
    const usuarios = obtenerUsuarios();
    const activos = usuarios.filter(usuario => usuario.estado !== 'inactivo').length;
    const inactivos = usuarios.length - activos;

    document.getElementById('totalUsuarios').textContent = usuarios.length;
    document.getElementById('usuariosActivos').textContent = activos;
    document.getElementById('usuariosInactivos').textContent = inactivos;
}

function mostrarUsuarios(usuarios = obtenerUsuarios()) {
    const tbody = document.getElementById('usuariosTabla');

    if (usuarios.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No hay usuarios registrados</td></tr>';
        return;
    }

    const ordenados = [...usuarios].sort((a, b) => a.nombre.localeCompare(b.nombre));
    tbody.innerHTML = ordenados.map(usuario => {
        const estado = usuario.estado === 'inactivo' ? 'inactivo' : 'activo';
        const estadoClase = estado === 'activo' ? 'success' : 'secondary';
        const rolTexto = usuario.rol === 'admin' ? 'Administrador' : 'Operador';

        return `
            <tr>
                <td><strong>${escaparHtml(usuario.nombre)}</strong></td>
                <td>${escaparHtml(usuario.usuario)}</td>
                <td><span class="badge bg-primary">${rolTexto}</span></td>
                <td><span class="badge bg-${estadoClase}">${estado}</span></td>
                <td><small>${usuario.fechaCreacion ? new Date(usuario.fechaCreacion).toLocaleDateString('es-CO') : '-'}</small></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="editarUsuario(${usuario.id})" title="Editar usuario">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-${estado === 'activo' ? 'warning' : 'success'} me-1" onclick="cambiarEstadoUsuario(${usuario.id})" title="${estado === 'activo' ? 'Inactivar' : 'Activar'} usuario">
                        <i class="bi bi-${estado === 'activo' ? 'pause-circle' : 'play-circle'}"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="eliminarUsuario(${usuario.id})" title="Eliminar usuario">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function limpiarFormulario() {
    usuarioEditandoId = null;
    document.getElementById('usuarioForm').reset();
    document.getElementById('usuarioId').value = '';
    document.getElementById('password').required = true;
    document.getElementById('passwordHelp').textContent = 'La clave sera necesaria para iniciar sesion.';
    document.getElementById('formTitle').innerHTML = '<i class="bi bi-person-plus"></i> Crear Usuario';
    document.getElementById('btnGuardarUsuario').innerHTML = '<i class="bi bi-save"></i> Guardar Usuario';
    document.getElementById('btnCancelarEdicion').classList.add('d-none');
}

function editarUsuario(id) {
    const usuario = obtenerUsuarios().find(item => item.id === id);
    if (!usuario) return;

    usuarioEditandoId = id;
    document.getElementById('usuarioId').value = usuario.id;
    document.getElementById('nombre').value = usuario.nombre;
    document.getElementById('usuario').value = usuario.usuario;
    document.getElementById('password').value = '';
    document.getElementById('password').required = false;
    document.getElementById('rol').value = usuario.rol || 'operador';
    document.getElementById('estado').value = usuario.estado || 'activo';
    document.getElementById('passwordHelp').textContent = 'Deje la clave vacia para conservar la actual.';
    document.getElementById('formTitle').innerHTML = '<i class="bi bi-pencil"></i> Editar Usuario';
    document.getElementById('btnGuardarUsuario').innerHTML = '<i class="bi bi-check-circle"></i> Actualizar Usuario';
    document.getElementById('btnCancelarEdicion').classList.remove('d-none');
    document.getElementById('nombre').focus();
}

function cambiarEstadoUsuario(id) {
    const usuarios = obtenerUsuarios();
    const usuario = usuarios.find(item => item.id === id);
    const usuarioActual = obtenerUsuarioActual();

    if (!usuario) return;

    if (usuarioActual && usuarioActual.id === id && usuario.estado !== 'inactivo') {
        mostrarAlertaUsuarios('No puede inactivar el usuario con el que tiene la sesion abierta.', 'warning');
        return;
    }

    usuario.estado = usuario.estado === 'inactivo' ? 'activo' : 'inactivo';
    guardarDatos('usuarios', usuarios);
    mostrarUsuarios();
    actualizarResumenUsuarios();
    mostrarAlertaUsuarios(`Usuario ${usuario.estado === 'activo' ? 'activado' : 'inactivado'} correctamente.`, 'success');
}

function eliminarUsuario(id) {
    const usuarios = obtenerUsuarios();
    const usuario = usuarios.find(item => item.id === id);
    const usuarioActual = obtenerUsuarioActual();

    if (!usuario) return;

    if (usuarioActual && usuarioActual.id === id) {
        mostrarAlertaUsuarios('No puede eliminar el usuario con el que tiene la sesion abierta.', 'warning');
        return;
    }

    if (!confirm(`Desea eliminar el usuario "${usuario.usuario}"?`)) {
        return;
    }

    guardarDatos('usuarios', usuarios.filter(item => item.id !== id));
    limpiarFormulario();
    mostrarUsuarios();
    actualizarResumenUsuarios();
    mostrarAlertaUsuarios('Usuario eliminado correctamente.', 'success');
}

function filtrarUsuarios() {
    const busqueda = document.getElementById('buscarUsuario').value.toLowerCase();
    const estado = document.getElementById('filtroEstado').value;
    let usuarios = obtenerUsuarios();

    if (estado) {
        usuarios = usuarios.filter(usuario => (usuario.estado || 'activo') === estado);
    }

    if (busqueda) {
        usuarios = usuarios.filter(usuario =>
            usuario.nombre.toLowerCase().includes(busqueda) ||
            usuario.usuario.toLowerCase().includes(busqueda)
        );
    }

    mostrarUsuarios(usuarios);
}

document.addEventListener('DOMContentLoaded', function() {
    actualizarResumenUsuarios();
    mostrarUsuarios();

    document.getElementById('usuarioForm').addEventListener('submit', function(e) {
        e.preventDefault();

        const usuarios = obtenerUsuarios();
        const nombre = document.getElementById('nombre').value.trim();
        const usuario = normalizarUsuario(document.getElementById('usuario').value);
        const password = document.getElementById('password').value.trim();
        const rol = document.getElementById('rol').value;
        const estado = document.getElementById('estado').value;

        if (!nombre || !usuario || (!usuarioEditandoId && !password) || !rol || !estado) {
            mostrarAlertaUsuarios('Complete todos los campos obligatorios.', 'warning');
            return;
        }

        const usuarioDuplicado = usuarios.some(item =>
            item.id !== usuarioEditandoId && normalizarUsuario(item.usuario) === usuario
        );

        if (usuarioDuplicado) {
            mostrarAlertaUsuarios('Ya existe un usuario con ese nombre de acceso.', 'warning');
            return;
        }

        if (usuarioEditandoId) {
            const index = usuarios.findIndex(item => item.id === usuarioEditandoId);
            if (index === -1) return;

            usuarios[index] = {
                ...usuarios[index],
                nombre,
                usuario,
                rol,
                estado
            };

            if (password) {
                usuarios[index].password = password;
            }
        } else {
            usuarios.push({
                id: Date.now(),
                nombre,
                usuario,
                password,
                rol,
                estado,
                fechaCreacion: new Date().toISOString()
            });
        }

        guardarDatos('usuarios', usuarios);
        limpiarFormulario();
        mostrarUsuarios();
        actualizarResumenUsuarios();
        mostrarAlertaUsuarios('Usuario guardado correctamente.', 'success');
    });

    document.getElementById('btnCancelarEdicion').addEventListener('click', limpiarFormulario);
    document.getElementById('buscarUsuario').addEventListener('input', filtrarUsuarios);
    document.getElementById('filtroEstado').addEventListener('change', filtrarUsuarios);
});
