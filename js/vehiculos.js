// vehiculos.js - Lógica de vehículos parqueados

// Proteger la página
protegerPagina();

let vehiculosFiltrados = [];

// Cargar y mostrar vehículos
function cargarVehiculos() {
    const vehiculos = obtenerDatos('vehiculosActivos') || [];
    vehiculosFiltrados = vehiculos;
    mostrarVehiculos(vehiculos);
    document.getElementById('totalVehiculos').textContent = vehiculos.length;
}

// Mostrar vehículos en la tabla
function mostrarVehiculos(vehiculos) {
    const tbody = document.getElementById('vehiculosTabla');

    if (vehiculos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No hay vehículos parqueados</td></tr>';
        return;
    }

    tbody.innerHTML = vehiculos.map(v => {
        const tiempo = calcularTiempoEstadia(v.fechaIngreso);
        return `
            <tr>
                <td><strong>${v.placa}</strong></td>
                <td><i class="bi ${obtenerIconoVehiculo(v.tipo)}"></i> ${v.tipo}</td>
                <td><span class="badge bg-primary">${v.espacio}</span></td>
                <td>${new Date(v.fechaIngreso).toLocaleDateString('es-CO')}</td>
                <td>${v.horaIngreso}</td>
                <td><span class="badge bg-info">${tiempo.texto}</span></td>
                <td>
                    <a href="salida.html" class="btn btn-sm btn-success" title="Registrar salida">
                        <i class="bi bi-arrow-up-circle"></i>
                    </a>
                </td>
            </tr>
        `;
    }).join('');
}

// Filtrar vehículos
function filtrarVehiculos() {
    const busqueda = document.getElementById('buscarVehiculo').value.toLowerCase();
    const tipo = document.getElementById('filtroTipo').value;
    
    let vehiculos = obtenerDatos('vehiculosActivos') || [];

    // Filtrar por tipo
    if (tipo) {
        vehiculos = vehiculos.filter(v => v.tipo === tipo);
    }

    // Filtrar por placa
    if (busqueda) {
        vehiculos = vehiculos.filter(v => v.placa.toLowerCase().includes(busqueda));
    }

    vehiculosFiltrados = vehiculos;
    mostrarVehiculos(vehiculos);
    document.getElementById('totalVehiculos').textContent = vehiculos.length;
}

// Inicializar página
document.addEventListener('DOMContentLoaded', function() {
    cargarVehiculos();

    // Evento de búsqueda
    document.getElementById('buscarVehiculo').addEventListener('input', filtrarVehiculos);
    document.getElementById('filtroTipo').addEventListener('change', filtrarVehiculos);

    // Actualizar cada 30 segundos
    setInterval(cargarVehiculos, 30000);
});
