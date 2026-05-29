// vehiculos.js - Lógica de vehículos parqueados
import { getAllActiveVehicles } from './supabase.js';

let vehiculosFiltrados = [];

// Cargar y mostrar vehículos desde Supabase
async function cargarVehiculos() {
    const result = await getAllActiveVehicles();
    const vehiculos = result.success ? result.vehicles : [];
    vehiculosFiltrados = vehiculos;
    mostrarVehiculos(vehiculos);
    document.getElementById('totalVehiculos').textContent = vehiculos.length;
}

// Mostrar vehículos en la tabla
function mostrarVehiculos(vehiculos) {
    const tbody = document.getElementById('vehiculosTabla');

    if (!vehiculos || vehiculos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">No hay vehículos parqueados</td></tr>';
        return;
    }

    tbody.innerHTML = vehiculos.map(v => {
        const tiempo = calcularTiempoEstadia(`${v.entry_date} ${v.entry_time}`);
        return `
            <tr>
                <td><strong>${v.license_plate}</strong></td>
                <td><i class="bi ${obtenerIconoVehiculo(v.vehicle_type)}"></i> ${v.vehicle_type}</td>
                <td><span class="badge bg-primary">${v.parking_space}</span></td>
                <td>${new Date(v.entry_date).toLocaleDateString('es-CO')}</td>
                <td>${v.entry_time}</td>
                <td>${v.user_id || 'Sin usuario'}</td>
                <td><span class="badge bg-info">${tiempo} hora(s)</span></td>
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
async function filtrarVehiculos() {
    const busqueda = document.getElementById('buscarVehiculo').value.toLowerCase();
    const tipo = document.getElementById('filtroTipo').value;
    
    const result = await getAllActiveVehicles();
    let vehiculos = result.success ? result.vehicles : [];

    if (tipo) {
        vehiculos = vehiculos.filter(v => v.vehicle_type === tipo);
    }

    if (busqueda) {
        vehiculos = vehiculos.filter(v => v.license_plate.toLowerCase().includes(busqueda));
    }

    vehiculosFiltrados = vehiculos;
    mostrarVehiculos(vehiculos);
    document.getElementById('totalVehiculos').textContent = vehiculos.length;
}

// Inicializar página
document.addEventListener('DOMContentLoaded', function() {
    protegerPagina();
    cargarVehiculos();

    document.getElementById('buscarVehiculo').addEventListener('input', filtrarVehiculos);
    document.getElementById('filtroTipo').addEventListener('change', filtrarVehiculos);

    setInterval(cargarVehiculos, 30000);
});