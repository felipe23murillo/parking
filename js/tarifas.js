// tarifas.js - Lógica de gestión de tarifas

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

// Cargar y mostrar tarifas actuales
function cargarTarifasActuales() {
    const tarifas = obtenerDatos('tarifas') || [];
    const container = document.getElementById('tarifasActuales');

    if (tarifas.length === 0) {
        container.innerHTML = '<p class="text-muted">No hay tarifas configuradas</p>';
        return;
    }

    container.innerHTML = tarifas.map(t => {
        const precioTexto = t.precioFijo > 0 ? 
            `<span class="text-success">${formatearMoneda(t.precioFijo)}</span> (Precio Fijo)` :
            `<span class="text-primary">${formatearMoneda(t.precioHora)}</span> por hora`;

        return `
            <div class="d-flex justify-content-between align-items-center mb-3 p-3 border rounded">
                <div>
                    <h5 class="mb-1">
                        <i class="bi ${obtenerIconoVehiculo(t.tipo)}"></i> ${t.tipo}
                    </h5>
                    <p class="mb-0">${precioTexto}</p>
                </div>
                <button class="btn btn-sm btn-outline-primary" onclick="editarTarifa('${t.tipo}')">
                    <i class="bi bi-pencil"></i> Editar
                </button>
            </div>
        `;
    }).join('');
}

// Editar tarifa (cargar datos en formulario)
window.editarTarifa = function(tipo) {
    const tarifas = obtenerDatos('tarifas') || [];
    const tarifa = tarifas.find(t => t.tipo === tipo);

    if (tarifa) {
        document.getElementById('tipoVehiculo').value = tipo;
        document.getElementById('precioHora').value = tarifa.precioHora;
        document.getElementById('precioFijo').value = tarifa.precioFijo;

        // Scroll al formulario
        document.getElementById('tarifasForm').scrollIntoView({ behavior: 'smooth' });
    }
};

// Guardar tarifa
function guardarTarifa(tipo, precioHora, precioFijo) {
    const tarifas = obtenerDatos('tarifas') || [];
    
    // Buscar si existe la tarifa
    const index = tarifas.findIndex(t => t.tipo === tipo);

    const nuevaTarifa = {
        tipo: tipo,
        precioHora: parseInt(precioHora) || 0,
        precioFijo: parseInt(precioFijo) || 0
    };

    if (index !== -1) {
        // Actualizar tarifa existente
        tarifas[index] = nuevaTarifa;
    } else {
        // Agregar nueva tarifa
        tarifas.push(nuevaTarifa);
    }

    return guardarDatos('tarifas', tarifas);
}

// Inicializar página
document.addEventListener('DOMContentLoaded', function() {
    cargarTarifasActuales();

    // Manejo del formulario
    const form = document.getElementById('tarifasForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const tipo = document.getElementById('tipoVehiculo').value;
        const precioHora = document.getElementById('precioHora').value;
        const precioFijo = document.getElementById('precioFijo').value;

        if (!tipo) {
            mostrarAlerta('Por favor seleccione un tipo de vehículo', 'warning');
            return;
        }

        if (!precioHora && !precioFijo) {
            mostrarAlerta('Por favor ingrese al menos un precio (por hora o fijo)', 'warning');
            return;
        }

        if (guardarTarifa(tipo, precioHora, precioFijo)) {
            mostrarAlerta(`Tarifa para ${tipo} actualizada exitosamente`, 'success');
            cargarTarifasActuales();
            form.reset();
        } else {
            mostrarAlerta('Error al guardar la tarifa', 'danger');
        }
    });
});
