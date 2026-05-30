// tarifas.js - Lógica de gestión de tarifas
import { getAllRates, updateRate } from './supabase.js';

// Formatear moneda
function formatearMoneda(valor) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(valor);
}

// Obtener icono por tipo de vehículo
function obtenerIconoVehiculo(tipo) {
    const iconos = {
        'Carro': 'bi-car-front-fill',
        'Moto': 'bi-scooter',
        'Camión': 'bi-truck',
        'Bicicleta': 'bi-bicycle'
    };
    return iconos[tipo] || 'bi-question-circle';
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

function seleccionarTipoVehiculo(tipo) {
    document.getElementById('tipoVehiculo').value = tipo;

    const opcion = Array.from(document.querySelectorAll('input[name="tipoVehiculoOption"]'))
        .find(input => input.value === tipo);

    if (opcion) {
        opcion.checked = true;
    }
}

function seleccionarModalidad(modalidad) {
    const input = document.querySelector(`input[name="modalidadTarifa"][value="${modalidad}"]`);
    if (input) {
        input.checked = true;
    }
    actualizarCamposModalidad();
}

function actualizarCamposModalidad() {
    const modalidad = document.querySelector('input[name="modalidadTarifa"]:checked')?.value || 'hora';
    const precioHora = document.getElementById('precioHora');
    const precioFijo = document.getElementById('precioFijo');
    const precioHoraGroup = document.getElementById('precioHoraGroup');
    const precioFijoGroup = document.getElementById('precioFijoGroup');

    const usarPrecioHora = modalidad === 'hora';

    precioHora.disabled = !usarPrecioHora;
    precioHora.required = usarPrecioHora;
    precioHoraGroup.classList.toggle('opacity-50', !usarPrecioHora);

    precioFijo.disabled = usarPrecioHora;
    precioFijo.required = !usarPrecioHora;
    precioFijoGroup.classList.toggle('opacity-50', usarPrecioHora);

    if (usarPrecioHora) {
        precioFijo.value = 0;
    } else {
        precioHora.value = 0;
    }
}

function mostrarEditorTarifa() {
    const editor = document.getElementById('tarifaEditorContainer');
    if (editor) {
        editor.classList.remove('d-none');
    }
}

function ocultarEditorTarifa() {
    const editor = document.getElementById('tarifaEditorContainer');
    if (editor) {
        editor.classList.add('d-none');
    }
}

// Cargar y mostrar tarifas actuales desde Supabase
async function cargarTarifasActuales() {
    const result = await getAllRates();
    const tarifas = result.success ? result.rates : [];
    const container = document.getElementById('tarifasActuales');

    if (!tarifas || tarifas.length === 0) {
        container.innerHTML = '<p class="text-muted">No hay tarifas configuradas</p>';
        return;
    }

    container.innerHTML = tarifas.map(t => {
        const modalidad = t.fixed_price > 0 ? 'fijo' : 'hora';
        const valor = modalidad === 'fijo' ? t.fixed_price : t.price_per_hour;
        const precioTexto = modalidad === 'fijo' ? 
            `<span class="text-success">${formatearMoneda(valor)}</span> (Precio fijo)` :
            `<span class="text-primary">${formatearMoneda(valor)}</span> por hora`;

        return `
            <div class="d-flex justify-content-between align-items-center mb-3 p-3 border rounded">
                <div>
                    <h5 class="mb-1">
                        <i class="bi ${obtenerIconoVehiculo(t.vehicle_type)}"></i> ${t.vehicle_type}
                    </h5>
                    <p class="mb-0">${precioTexto}</p>
                </div>
                <button class="btn btn-sm btn-outline-primary" onclick="editarTarifa('${t.vehicle_type}')">
                    <i class="bi bi-pencil"></i> Editar
                </button>
            </div>
        `;
    }).join('');
}

// Editar tarifa (cargar datos en formulario)
window.editarTarifa = async function(tipo) {
    const result = await getAllRates();
    const tarifas = result.success ? result.rates : [];
    const tarifa = tarifas.find(t => t.vehicle_type === tipo);

    if (tarifa) {
        const modalidad = tarifa.fixed_price > 0 ? 'fijo' : 'hora';

        mostrarEditorTarifa();
        seleccionarTipoVehiculo(tipo);
        document.getElementById('precioHora').value = Number(tarifa.price_per_hour) || 0;
        document.getElementById('precioFijo').value = Number(tarifa.fixed_price) || 0;
        seleccionarModalidad(modalidad);

        document.getElementById('tarifasForm').scrollIntoView({ behavior: 'smooth' });
    }
};

// Inicializar página
document.addEventListener('DOMContentLoaded', function() {
    cargarTarifasActuales();
    actualizarCamposModalidad();

    document.querySelectorAll('input[name="tipoVehiculoOption"]').forEach(input => {
        input.addEventListener('change', function() {
            seleccionarTipoVehiculo(this.value);
        });
    });

    document.querySelectorAll('input[name="modalidadTarifa"]').forEach(input => {
        input.addEventListener('change', actualizarCamposModalidad);
    });

    // Manejo del formulario
    const form = document.getElementById('tarifasForm');
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const tipo = document.getElementById('tipoVehiculo').value;
        const modalidad = document.querySelector('input[name="modalidadTarifa"]:checked')?.value || 'hora';
        const inputValor = modalidad === 'hora' ? document.getElementById('precioHora') : document.getElementById('precioFijo');
        const valor = parseInt(inputValor.value, 10) || 0;

        if (!tipo) {
            mostrarAlerta('Por favor seleccione un tipo de vehículo', 'warning');
            return;
        }

        if (valor <= 0) {
            const textoModalidad = modalidad === 'hora' ? 'valor por hora' : 'valor fijo';
            mostrarAlerta(`Por favor ingrese un ${textoModalidad} mayor a 0`, 'warning');
            return;
        }

        // Obtener rateId para actualizar
        const ratesResult = await getAllRates();
        const tarifas = ratesResult.success ? ratesResult.rates : [];
        const tarifaExistente = tarifas.find(t => t.vehicle_type === tipo);
        
        if (tarifaExistente) {
            const updateResult = await updateRate(tarifaExistente.id, {
                price_per_hour: modalidad === 'hora' ? valor : 0,
                fixed_price: modalidad === 'fijo' ? valor : 0
            });

            if (updateResult.success) {
                mostrarAlerta(`Tarifa para ${tipo} actualizada exitosamente`, 'success');
                cargarTarifasActuales();
                form.reset();
                document.getElementById('tipoVehiculo').value = '';
                actualizarCamposModalidad();
                ocultarEditorTarifa();
            } else {
                mostrarAlerta('Error al guardar la tarifa: ' + updateResult.error, 'danger');
            }
        } else {
            mostrarAlerta('No se encontró la tarifa para actualizar', 'danger');
        }
    });
});