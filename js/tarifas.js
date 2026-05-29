// tarifas.js - Lógica de gestión de tarifas

// Proteger la página
protegerPagina();

function obtenerModalidadTarifa(tarifa) {
    return tarifa.modalidad || (Number(tarifa.precioFijo) > 0 ? 'fijo' : 'hora');
}

function obtenerValorTarifa(tarifa) {
    const modalidad = obtenerModalidadTarifa(tarifa);
    return modalidad === 'fijo' ? Number(tarifa.precioFijo) || 0 : Number(tarifa.precioHora) || 0;
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

    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
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

// Cargar y mostrar tarifas actuales
function cargarTarifasActuales() {
    const tarifas = obtenerDatos('tarifas') || [];
    const container = document.getElementById('tarifasActuales');

    if (tarifas.length === 0) {
        container.innerHTML = '<p class="text-muted">No hay tarifas configuradas</p>';
        return;
    }

    container.innerHTML = tarifas.map(t => {
        const modalidad = obtenerModalidadTarifa(t);
        const valor = obtenerValorTarifa(t);
        const precioTexto = modalidad === 'fijo' ? 
            `<span class="text-success">${formatearMoneda(valor)}</span> (Precio fijo)` :
            `<span class="text-primary">${formatearMoneda(valor)}</span> por hora`;

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
        const modalidad = obtenerModalidadTarifa(tarifa);

        mostrarEditorTarifa();
        seleccionarTipoVehiculo(tipo);
        document.getElementById('precioHora').value = Number(tarifa.precioHora) || 0;
        document.getElementById('precioFijo').value = Number(tarifa.precioFijo) || 0;
        seleccionarModalidad(modalidad);

        // Scroll al formulario
        document.getElementById('tarifasForm').scrollIntoView({ behavior: 'smooth' });
    }
};

// Guardar tarifa
function guardarTarifa(tipo, modalidad, valor) {
    const tarifas = obtenerDatos('tarifas') || [];
    
    // Buscar si existe la tarifa
    const index = tarifas.findIndex(t => t.tipo === tipo);
    const valorNumerico = parseInt(valor, 10) || 0;

    const nuevaTarifa = {
        tipo: tipo,
        modalidad: modalidad,
        precioHora: modalidad === 'hora' ? valorNumerico : 0,
        precioFijo: modalidad === 'fijo' ? valorNumerico : 0
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
    form.addEventListener('submit', function(e) {
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

        if (guardarTarifa(tipo, modalidad, valor)) {
            mostrarAlerta(`Tarifa para ${tipo} actualizada exitosamente`, 'success');
            cargarTarifasActuales();
            form.reset();
            document.getElementById('tipoVehiculo').value = '';
            actualizarCamposModalidad();
            ocultarEditorTarifa();
        } else {
            mostrarAlerta('Error al guardar la tarifa', 'danger');
        }
    });
});
