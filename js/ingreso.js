// ingreso.js - Lógica de ingreso de vehículos
import { getAvailableSpacesByType, getAllRates } from './supabase.js';

// Proteger la página
protegerPagina();

// Formatear moneda
function formatearMoneda(valor) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(valor);
}

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
async function actualizarContadorEspacios() {
    const tipos = ['Carro', 'Moto', 'Camión', 'Bicicleta'];
    for (const tipo of tipos) {
        const result = await getAvailableSpacesByType(tipo);
        const disponibles = result.success ? result.spaces.length : 0;
        const elemento = document.getElementById(`espacios${tipo}s`);
        if (elemento) {
            elemento.textContent = disponibles;
            if (disponibles === 0) {
                elemento.classList.add('text-danger');
            } else {
                elemento.classList.remove('text-danger');
            }
        }
    }
}

// Mostrar tarifas desde Supabase
async function mostrarTarifas() {
    const result = await getAllRates();
    const tarifas = result.success ? result.rates : [];
    const container = document.getElementById('tarifasInfo');

    if (!tarifas || tarifas.length === 0) {
        container.innerHTML = '<p class="text-muted">No hay tarifas configuradas</p>';
        return;
    }

    container.innerHTML = '<small>' + tarifas.map(t => {
        const modalidad = t.fixed_price > 0 ? 'fijo' : 'hora';
        const precio = modalidad === 'fijo' ? 
            `Precio fijo: ${formatearMoneda(Number(t.fixed_price) || 0)}` :
            `${formatearMoneda(Number(t.price_per_hour) || 0)}/hora`;
        return `<strong>${t.vehicle_type}:</strong> ${precio}`;
    }).join('<br>') + '</small>';
}

// Cargar espacios según tipo de vehículo
async function cargarEspacios(tipo) {
    const selectEspacio = document.getElementById('espacio');
    const result = await getAvailableSpacesByType(tipo);
    const espaciosDisponibles = result.success ? result.spaces : [];

    selectEspacio.innerHTML = '';

    if (!espaciosDisponibles || espaciosDisponibles.length === 0) {
        selectEspacio.innerHTML = '<option value="">No hay espacios disponibles</option>';
        selectEspacio.disabled = true;
        mostrarAlerta(`No hay espacios disponibles para ${tipo}`, 'warning');
        return;
    }

    selectEspacio.disabled = false;
    selectEspacio.innerHTML = '<option value="">Seleccione un espacio</option>';
    espaciosDisponibles.forEach(espacio => {
        const option = document.createElement('option');
        option.value = espacio.space_number;
        option.textContent = espacio.space_number;
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
    setTimeout(() => alertDiv.remove(), 5000);
}

// Inicializar página
document.addEventListener('DOMContentLoaded', function() {
    actualizarFechaHora();
    actualizarContadorEspacios();
    mostrarTarifas();

    setInterval(actualizarFechaHora, 1000);

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

    const form = document.getElementById('ingresoForm');
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const placa = document.getElementById('placa').value.toUpperCase().trim();
        const tipo = document.getElementById('tipoVehiculo').value;
        const espacio = document.getElementById('espacio').value;
        const usuario = obtenerUsuarioActual();

        if (!placa || !tipo || !espacio) {
            mostrarAlerta('Por favor complete todos los campos obligatorios', 'warning');
            return;
        }

        const resultado = await registrarIngreso(placa, tipo, espacio, usuario?.id);

        if (resultado.exito) {
            mostrarAlerta(resultado.mensaje, 'success');
            
            form.reset();
            document.getElementById('espacio').innerHTML = '<option value="">Primero seleccione el tipo de vehículo</option>';
            document.getElementById('espacio').disabled = true;

            actualizarContadorEspacios();

            setTimeout(() => {
                const vehiculo = resultado.vehiculo;
                mostrarAlerta(
                    `Vehículo registrado:<br>
                    <strong>Placa:</strong> ${vehiculo.license_plate}<br>
                    <strong>Tipo:</strong> ${vehiculo.vehicle_type}<br>
                    <strong>Espacio:</strong> ${vehiculo.parking_space}<br>
                    <strong>Hora:</strong> ${vehiculo.entry_time}`,
                    'info'
                );
            }, 2000);
        } else {
            mostrarAlerta(resultado.mensaje, 'danger');
        }
    });
});