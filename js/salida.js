// salida.js - Lógica de salida de vehículos

// Proteger la página
protegerPagina();

let vehiculoActual = null;

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

// Cargar lista de vehículos activos
function cargarVehiculosActivos() {
    const vehiculos = obtenerDatos('vehiculosActivos') || [];
    const tbody = document.getElementById('vehiculosActivosTabla');

    if (vehiculos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No hay vehículos parqueados</td></tr>';
        return;
    }

    tbody.innerHTML = vehiculos.map(v => `
        <tr>
            <td><strong>${v.placa}</strong></td>
            <td><small><i class="bi ${obtenerIconoVehiculo(v.tipo)}"></i> ${v.tipo}</small></td>
            <td><span class="badge bg-primary">${v.espacio}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="buscarPorPlaca('${v.placa}')">
                    <i class="bi bi-search"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Buscar vehículo por placa (función global para los botones)
window.buscarPorPlaca = function(placa) {
    document.getElementById('placaBuscar').value = placa;
    buscarVehiculo(placa);
};

// Buscar vehículo
function buscarVehiculo(placa) {
    const vehiculo = buscarVehiculoPorPlaca(placa);

    if (!vehiculo) {
        mostrarAlerta('No se encontró un vehículo con esa placa', 'warning');
        ocultarInfoVehiculo();
        return;
    }

    vehiculoActual = vehiculo;
    mostrarInfoVehiculo(vehiculo);
}

// Mostrar información del vehículo
function mostrarInfoVehiculo(vehiculo) {
    document.getElementById('infoPlaca').textContent = vehiculo.placa;
    document.getElementById('infoTipo').innerHTML = `<i class="bi ${obtenerIconoVehiculo(vehiculo.tipo)}"></i> ${vehiculo.tipo}`;
    document.getElementById('infoEspacio').textContent = vehiculo.espacio;
    document.getElementById('infoFechaIngreso').textContent = formatearFecha(vehiculo.fechaIngreso);
    document.getElementById('infoHoraIngreso').textContent = vehiculo.horaIngreso;

    const tiempo = calcularTiempoEstadia(vehiculo.fechaIngreso);
    document.getElementById('tiempoParqueado').textContent = tiempo.texto;

    const valor = calcularValorAPagar(vehiculo.tipo, vehiculo.fechaIngreso);
    document.getElementById('valorPagar').textContent = formatearMoneda(valor);

    document.getElementById('vehiculoInfo').classList.remove('d-none');
}

// Ocultar información del vehículo
function ocultarInfoVehiculo() {
    document.getElementById('vehiculoInfo').classList.add('d-none');
    vehiculoActual = null;
}

// Inicializar página
document.addEventListener('DOMContentLoaded', function() {
    cargarVehiculosActivos();

    // Formulario de búsqueda
    const buscarForm = document.getElementById('buscarForm');
    buscarForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const placa = document.getElementById('placaBuscar').value.toUpperCase().trim();
        if (placa) {
            buscarVehiculo(placa);
        }
    });

    // Botón registrar salida
    const btnRegistrarSalida = document.getElementById('btnRegistrarSalida');
    btnRegistrarSalida.addEventListener('click', function() {
        if (!vehiculoActual) return;

        if (confirm('¿Está seguro de registrar la salida de este vehículo?')) {
            const resultado = registrarSalida(vehiculoActual.placa);

            if (resultado.exito) {
                const valor = formatearMoneda(resultado.vehiculo.valorPagado);
                
                mostrarAlerta(
                    `Salida registrada exitosamente<br>
                    <strong>Placa:</strong> ${resultado.vehiculo.placa}<br>
                    <strong>Tiempo:</strong> ${resultado.vehiculo.tiempoEstadia}<br>
                    <strong>Total a pagar:</strong> ${valor}`,
                    'success'
                );

                // Limpiar formulario
                document.getElementById('placaBuscar').value = '';
                ocultarInfoVehiculo();
                cargarVehiculosActivos();

                // Mostrar ticket de pago después de 1 segundo
                setTimeout(() => {
                    mostrarTicketPago(resultado.vehiculo);
                }, 1000);
            } else {
                mostrarAlerta(resultado.mensaje, 'danger');
            }
        }
    });

    // Botón cancelar
    const btnCancelar = document.getElementById('btnCancelar');
    btnCancelar.addEventListener('click', function() {
        document.getElementById('placaBuscar').value = '';
        ocultarInfoVehiculo();
    });
});

// Mostrar ticket de pago
function mostrarTicketPago(vehiculo) {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header bg-primary text-white">
                    <h5 class="modal-title"><i class="bi bi-receipt"></i> Ticket de Pago</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body text-center">
                    <h3 class="mb-3">${obtenerDatos('configuracion')?.nombreParqueadero || 'Parqueadero Central'}</h3>
                    <hr>
                    <p><strong>Placa:</strong> ${vehiculo.placa}</p>
                    <p><strong>Tipo:</strong> ${vehiculo.tipo}</p>
                    <p><strong>Espacio:</strong> ${vehiculo.espacio}</p>
                    <hr>
                    <p><strong>Ingreso:</strong> ${formatearFecha(vehiculo.fechaIngreso)}</p>
                    <p><strong>Salida:</strong> ${formatearFecha(vehiculo.fechaSalida)}</p>
                    <p><strong>Tiempo:</strong> ${vehiculo.tiempoEstadia}</p>
                    <hr>
                    <h2 class="text-success">Total: ${formatearMoneda(vehiculo.valorPagado)}</h2>
                    <hr>
                    <small class="text-muted">Gracias por usar nuestro servicio</small>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" onclick="window.print()">
                        <i class="bi bi-printer"></i> Imprimir
                    </button>
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();

    modal.addEventListener('hidden.bs.modal', function() {
        modal.remove();
    });
}
