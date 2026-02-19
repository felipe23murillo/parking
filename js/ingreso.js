// ingreso.js - Lógica de ingreso de vehículos

// Proteger la página
protegerPagina();

// Actualizar fecha y hora actual
function actualizarFechaHora() {
    const ahora = new Date();
    const fechaHora = ahora.toLocaleString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    document.getElementById('fechaHora').value = fechaHora;
}

// Actualizar contador de espacios disponibles
function actualizarContadorEspacios() {
    const tipos = ['Carro', 'Moto', 'Camión', 'Bicicleta'];
    tipos.forEach(tipo => {
        const disponibles = obtenerEspaciosDisponibles(tipo).length;
        const elemento = document.getElementById(`espacios${tipo}s`);
        if (elemento) {
            elemento.textContent = disponibles;
            if (disponibles === 0) {
                elemento.classList.add('text-danger');
            } else {
                elemento.classList.remove('text-danger');
            }
        }
    });
}

// Mostrar tarifas
function mostrarTarifas() {
    const tarifas = obtenerDatos('tarifas') || [];
    const container = document.getElementById('tarifasInfo');
    
    if (tarifas.length === 0) {
        container.innerHTML = '<p class="text-muted">No hay tarifas configuradas</p>';
        return;
    }

    container.innerHTML = '<small>' + tarifas.map(t => {
        const precio = t.precioFijo > 0 ? 
            `Precio fijo: ${formatearMoneda(t.precioFijo)}` :
            `${formatearMoneda(t.precioHora)}/hora`;
        return `<strong>${t.tipo}:</strong> ${precio}`;
    }).join('<br>') + '</small>';
}

// Cargar espacios según tipo de vehículo
function cargarEspacios(tipo) {
    const selectEspacio = document.getElementById('espacio');
    const espaciosDisponibles = obtenerEspaciosDisponibles(tipo);

    selectEspacio.innerHTML = '';

    if (espaciosDisponibles.length === 0) {
        selectEspacio.innerHTML = '<option value="">No hay espacios disponibles</option>';
        selectEspacio.disabled = true;
        mostrarAlerta(`No hay espacios disponibles para ${tipo}`, 'warning');
        return;
    }

    selectEspacio.disabled = false;
    selectEspacio.innerHTML = '<option value="">Seleccione un espacio</option>';
    espaciosDisponibles.forEach(espacio => {
        const option = document.createElement('option');
        option.value = espacio.numero;
        option.textContent = espacio.numero;
        selectEspacio.appendChild(option);
    });
}

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

    // Auto-cerrar después de 5 segundos
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Inicializar página
document.addEventListener('DOMContentLoaded', function() {
    actualizarFechaHora();
    actualizarContadorEspacios();
    mostrarTarifas();

    // Actualizar fecha cada segundo
    setInterval(actualizarFechaHora, 1000);

    // Evento cambio de tipo de vehículo
    const tipoVehiculoSelect = document.getElementById('tipoVehiculo');
    tipoVehiculoSelect.addEventListener('change', function() {
        const tipo = this.value;
        if (tipo) {
            cargarEspacios(tipo);
        } else {
            document.getElementById('espacio').innerHTML = '<option value="">Primero seleccione el tipo de vehículo</option>';
            document.getElementById('espacio').disabled = true;
        }
    });

    // Manejo del formulario
    const form = document.getElementById('ingresoForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const placa = document.getElementById('placa').value.toUpperCase().trim();
        const tipo = document.getElementById('tipoVehiculo').value;
        const espacio = document.getElementById('espacio').value;

        // Validaciones
        if (!placa || !tipo || !espacio) {
            mostrarAlerta('Por favor complete todos los campos obligatorios', 'warning');
            return;
        }

        // Registrar ingreso
        const resultado = registrarIngreso(placa, tipo, espacio);

        if (resultado.exito) {
            mostrarAlerta(resultado.mensaje, 'success');
            
            // Limpiar formulario
            form.reset();
            document.getElementById('espacio').innerHTML = '<option value="">Primero seleccione el tipo de vehículo</option>';
            document.getElementById('espacio').disabled = true;

            // Actualizar contadores
            actualizarContadorEspacios();

            // Mostrar información del vehículo registrado
            setTimeout(() => {
                mostrarAlerta(
                    `Vehículo registrado:<br>
                    <strong>Placa:</strong> ${resultado.vehiculo.placa}<br>
                    <strong>Tipo:</strong> ${resultado.vehiculo.tipo}<br>
                    <strong>Espacio:</strong> ${resultado.vehiculo.espacio}<br>
                    <strong>Hora:</strong> ${resultado.vehiculo.horaIngreso}`,
                    'info'
                );
            }, 2000);
        } else {
            mostrarAlerta(resultado.mensaje, 'danger');
        }
    });
});
