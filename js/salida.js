// salida.js - Lógica de salida de vehículos
import { getAllActiveVehicles, searchVehicleByPlate, getAllRates, getAllParkingSpaces, registerVehicleExit, removeActiveVehicle, updateParkingSpace, getSettings } from './supabase.js';

let vehiculoActual = null;

// Wrapper para formatearMoneda y formatearFecha
function formatearMoneda(valor) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(valor);
}

function formatearFecha(fecha) {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Wrapper para buscarVehiculoPorPlaca
async function buscarVehiculoPorPlaca(placa) {
    const result = await searchVehicleByPlate(placa);
    return result.success ? { vehicle: result.vehicle } : null;
}

function fechaLocalHoy() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function horaLocalAhora() {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

// Usa separador 'T' para parsear como hora local (no UTC)
function calcularTiempoEstadia(fecha, hora) {
    const ingreso = new Date(`${fecha}T${hora}`);
    const diferencia = Date.now() - ingreso.getTime();
    return Math.max(1, Math.ceil(diferencia / (1000 * 60 * 60)));
}

// Wrapper para calcularTarifa
async function calcularTarifa(tipo, tiempoEstadia) {
    try {
        const tarifas = await getAllRates();
        if (!tarifas.success) return 0;
        const tarifa = tarifas.rates.find(t => t.vehicle_type === tipo);
        if (!tarifa) return 0;
        if (tarifa.fixed_price > 0) return tarifa.fixed_price;
        return tarifa.price_per_hour * tiempoEstadia;
    } catch (error) {
        return 0;
    }
}

// Wrapper para registrarSalida
async function registrarSalida(vehiculo, userId) {
    try {
        const tiempoEstadia = calcularTiempoEstadia(vehiculo.entry_date, vehiculo.entry_time);
        const tarifa = await calcularTarifa(vehiculo.vehicle_type, tiempoEstadia);
        
        const historialData = {
            license_plate: vehiculo.license_plate,
            vehicle_type: vehiculo.vehicle_type,
            parking_space: vehiculo.parking_space,
            entry_date: vehiculo.entry_date,
            entry_time: vehiculo.entry_time,
            exit_date: fechaLocalHoy(),
            exit_time: horaLocalAhora(),
            stay_time: tiempoEstadia,
            amount_paid: tarifa,
            user_id: userId
        };
        
        const historialResult = await registerVehicleExit(historialData);
        if (historialResult.success) {
            await removeActiveVehicle(vehiculo.id);
            
            const espaciosResult = await getAllParkingSpaces();
            const espacios = espaciosResult.success ? espaciosResult.spaces : [];
            const espacio = espacios.find(e => e.space_number === vehiculo.parking_space && e.vehicle_type === vehiculo.vehicle_type);
            if (espacio) {
                await updateParkingSpace(espacio.id, { is_occupied: false, license_plate: null });
            }
            
            return { exito: true, mensaje: 'Salida registrada exitosamente', historial: historialResult.history, tiempoEstadia, tarifa };
        }
        return { exito: false, mensaje: 'Error al registrar la salida' };
    } catch (error) {
        return { exito: false, mensaje: 'Error del sistema: ' + error.message };
    }
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

    const tiempo = calcularTiempoEstadia(vehiculo.entry_date, vehiculo.entry_time);
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
    protegerPagina();
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
            // Capturar datos ANTES de que ocultarInfoVehiculo() limpie vehiculoActual
            const datosVehiculo = { ...vehiculoActual };
            const resultado = await registrarSalida(datosVehiculo, usuario?.id);

            if (resultado.exito) {
                const valor = formatearMoneda(resultado.tarifa);

                mostrarAlerta(
                    `Salida registrada exitosamente<br>
                    <strong>Placa:</strong> ${datosVehiculo.license_plate}<br>
                    <strong>Tiempo:</strong> ${resultado.tiempoEstadia} hora(s)<br>
                    <strong>Total a pagar:</strong> ${valor}`,
                    'success'
                );

                document.getElementById('placaBuscar').value = '';
                ocultarInfoVehiculo();
                cargarVehiculosActivos();

                setTimeout(async () => {
                    await mostrarTicketPago({
                        license_plate: datosVehiculo.license_plate,
                        vehicle_type:  datosVehiculo.vehicle_type,
                        parking_space: datosVehiculo.parking_space,
                        entry_date:    datosVehiculo.entry_date,
                        entry_time:    datosVehiculo.entry_time,
                        exit_date:     resultado.historial?.exit_date,
                        tiempoEstadia: resultado.tiempoEstadia,
                        valorPagado:   resultado.tarifa
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

// Obtener configuración (función wrapper para storage)
async function obtenerConfiguracion() {
    try {
        const result = await getSettings();
        return result.success ? result.settings : {};
    } catch (error) {
        return {};
    }
}

// Mostrar ticket de pago
async function mostrarTicketPago(vehiculo) {
    const configuracion = await obtenerConfiguracion();
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
                    <h3 class="mb-3">${configuracion?.parking_name || 'Parqueadero Central'}</h3>
                    <hr>
                    <p><strong>Placa:</strong> ${vehiculo.license_plate}</p>
                    <p><strong>Tipo:</strong> ${vehiculo.vehicle_type}</p>
                    <p><strong>Espacio:</strong> ${vehiculo.parking_space}</p>
                    <hr>
                    <p><strong>Ingreso:</strong> ${formatearFecha(vehiculo.entry_date)}</p>
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