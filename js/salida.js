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

    setTimeout(() => alertDiv.remove(), 5000);
}

// Cargar lista de vehículos activos desde Supabase
async function cargarVehiculosActivos() {
    const result = await getAllActiveVehicles();
    const vehiculos = result.success ? result.vehicles : [];
    const tbody = document.getElementById('vehiculosActivosTabla');

    if (!vehiculos || vehiculos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No hay vehículos parqueados</td></tr>';
        return;
    }

    tbody.innerHTML = vehiculos.map(v => `
        <tr>
            <td><strong>${v.license_plate}</strong></td>
            <td><small><i class="bi ${obtenerIconoVehiculo(v.vehicle_type)}"></i> ${v.vehicle_type}</small></td>
            <td><span class="badge bg-primary">${v.parking_space}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="buscarPorPlaca('${v.license_plate}')">
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
async function buscarVehiculo(placa) {
    const result = await buscarVehiculoPorPlaca(placa);
    const vehiculo = result?.vehicle || null;

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
    document.getElementById('infoPlaca').textContent = vehiculo.license_plate;
    document.getElementById('infoTipo').innerHTML = `<i class="bi ${obtenerIconoVehiculo(vehiculo.vehicle_type)}"></i> ${vehiculo.vehicle_type}`;
    document.getElementById('infoEspacio').textContent = vehiculo.parking_space;
    document.getElementById('infoFechaIngreso').textContent = formatearFecha(vehiculo.entry_date);
    document.getElementById('infoHoraIngreso').textContent = vehiculo.entry_time;

    const tiempo = calcularTiempoEstadia(`${vehiculo.entry_date} ${vehiculo.entry_time}`);
    document.getElementById('tiempoParqueado').textContent = `${tiempo} hora(s)`;

    calcularTarifa(vehiculo.vehicle_type, tiempo).then(valor => {
        document.getElementById('valorPagar').textContent = formatearMoneda(valor);
    });

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
    btnRegistrarSalida.addEventListener('click', async function() {
        if (!vehiculoActual) return;

        if (confirm('¿Está seguro de registrar la salida de este vehículo?')) {
            const usuario = obtenerUsuarioActual();
            const resultado = await registrarSalida(vehiculoActual, usuario?.id);

            if (resultado.exito) {
                const valor = formatearMoneda(resultado.tarifa);
                
                mostrarAlerta(
                    `Salida registrada exitosamente<br>
                    <strong>Placa:</strong> ${vehiculoActual.license_plate}<br>
                    <strong>Tiempo:</strong> ${resultado.tiempoEstadia} hora(s)<br>
                    <strong>Total a pagar:</strong> ${valor}`,
                    'success'
                );

                document.getElementById('placaBuscar').value = '';
                ocultarInfoVehiculo();
                cargarVehiculosActivos();

                setTimeout(() => {
                    mostrarTicketPago({
                        placa: vehiculoActual.license_plate,
                        tipo: vehiculoActual.vehicle_type,
                        espacio: vehiculoActual.parking_space,
                        fechaIngreso: vehiculoActual.entry_date,
                        horaIngreso: vehiculoActual.entry_time,
                        fechaSalida: resultado.historial?.exit_date,
                        tiempoEstadia: resultado.tiempoEstadia,
                        valorPagado: resultado.tarifa
                    });
                }, 1000);
            } else {
                mostrarAlerta(resultado.mensaje, 'danger');
            }
        }
    });

    // Botón cancelar
    document.getElementById('btnCancelar').addEventListener('click', function() {
        document.getElementById('placaBuscar').value = '';
        ocultarInfoVehiculo();
    });
});

// Mostrar ticket de pago
function mostrarTicketPago(vehiculo) {
    const configuracion = obtenerDatos('configuracion');
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
                    <h3 class="mb-3">${configuracion?.nombreParqueadero || 'Parqueadero Central'}</h3>
                    <hr>
                    <p><strong>Placa:</strong> ${vehiculo.placa}</p>
                    <p><strong>Tipo:</strong> ${vehiculo.tipo}</p>
                    <p><strong>Espacio:</strong> ${vehiculo.espacio}</p>
                    <hr>
                    <p><strong>Ingreso:</strong> ${formatearFecha(vehiculo.fechaIngreso)}</p>
                    <p><strong>Salida:</strong> ${formatearFecha(new Date())}</p>
                    <p><strong>Tiempo:</strong> ${vehiculo.tiempoEstadia} hora(s)</p>
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