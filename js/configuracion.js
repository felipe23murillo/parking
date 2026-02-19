// configuracion.js - Lógica de configuración del sistema

// Proteger la página
protegerPagina();

// Mostrar alerta
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

    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Cargar configuración actual
function cargarConfiguracion() {
    const config = obtenerDatos('configuracion') || {};

    document.getElementById('nombreParqueadero').value = config.nombreParqueadero || '';
    document.getElementById('direccion').value = config.direccion || '';
    document.getElementById('telefono').value = config.telefono || '';
    document.getElementById('email').value = config.email || '';
}

// Cargar estadísticas
function cargarEstadisticas() {
    const vehiculosActivos = obtenerDatos('vehiculosActivos') || [];
    const historial = obtenerDatos('historial') || [];
    const tarifas = obtenerDatos('tarifas') || [];
    const espacios = obtenerDatos('espacios') || {};

    document.getElementById('statActivos').textContent = vehiculosActivos.length;
    document.getElementById('statHistorial').textContent = historial.length;
    document.getElementById('statTarifas').textContent = tarifas.length;

    let totalEspacios = 0;
    Object.values(espacios).forEach(tipo => {
        totalEspacios += tipo.length;
    });
    document.getElementById('statEspacios').textContent = totalEspacios;
}

// Exportar todos los datos
function exportarDatos() {
    const datos = {
        vehiculosActivos: obtenerDatos('vehiculosActivos'),
        historial: obtenerDatos('historial'),
        tarifas: obtenerDatos('tarifas'),
        espacios: obtenerDatos('espacios'),
        configuracion: obtenerDatos('configuracion'),
        fechaExportacion: new Date().toISOString()
    };

    const json = JSON.stringify(datos, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_parqueadero_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    mostrarAlerta('Datos exportados exitosamente', 'success');
}

// Limpiar vehículos activos
function limpiarVehiculosActivos() {
    if (confirm('¿Está seguro de eliminar todos los vehículos activos? Esto liberará todos los espacios.')) {
        // Liberar todos los espacios
        const espacios = obtenerDatos('espacios');
        Object.keys(espacios).forEach(tipo => {
            espacios[tipo].forEach(espacio => {
                espacio.ocupado = false;
                delete espacio.vehiculo;
            });
        });
        guardarDatos('espacios', espacios);

        // Limpiar vehículos activos
        guardarDatos('vehiculosActivos', []);
        
        cargarEstadisticas();
        mostrarAlerta('Todos los vehículos activos han sido eliminados y los espacios liberados', 'success');
    }
}

// Resetear sistema completo
function resetearSistema() {
    if (confirm('⚠️ ADVERTENCIA: Esto eliminará TODOS los datos del sistema incluyendo historial, configuración, vehículos y tarifas. ¿Está completamente seguro?')) {
        if (confirm('Confirmación final: ¿Realmente desea resetear todo el sistema?')) {
            limpiarTodo();
            mostrarAlerta('Sistema reseteado exitosamente. Redirigiendo...', 'success');
            
            setTimeout(() => {
                cerrarSesion();
            }, 2000);
        }
    }
}

// Inicializar página
document.addEventListener('DOMContentLoaded', function() {
    cargarConfiguracion();
    cargarEstadisticas();

    // Formulario de configuración
    const form = document.getElementById('configuracionForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const config = {
            nombreParqueadero: document.getElementById('nombreParqueadero').value,
            direccion: document.getElementById('direccion').value,
            telefono: document.getElementById('telefono').value,
            email: document.getElementById('email').value
        };

        if (guardarDatos('configuracion', config)) {
            mostrarAlerta('Configuración guardada exitosamente', 'success');
        } else {
            mostrarAlerta('Error al guardar la configuración', 'danger');
        }
    });

    // Botones de gestión de datos
    document.getElementById('btnExportarDatos').addEventListener('click', exportarDatos);
    document.getElementById('btnLimpiarVehiculos').addEventListener('click', limpiarVehiculosActivos);
    document.getElementById('btnResetearSistema').addEventListener('click', resetearSistema);
});
