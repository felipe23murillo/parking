// vehiculos.js - Lógica de vehículos parqueados
import { getAllActiveVehicles, searchVehicleByPlate } from './supabase.js';

function obtenerIconoVehiculo(tipo) {
    const iconos = {
        'Carro':     'bi-car-front-fill',
        'Moto':      'bi-scooter',
        'Camión':    'bi-truck',
        'Bicicleta': 'bi-bicycle',
    };
    return iconos[tipo] || 'bi-question-circle';
}

function calcularTiempoEstadia(fechaIngreso) {
    const diff = Date.now() - new Date(fechaIngreso).getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60)));
}

function formatearFecha(fecha) {
    return new Date(fecha).toLocaleDateString('es-CO');
}

let vehiculosFiltrados = [];

async function cargarVehiculos() {
    const tbody = document.getElementById('vehiculosTabla');
    if (!tbody) return;

    tbody.innerHTML = `
        <tr>
            <td colspan="8" class="text-center text-muted">
                <div class="spinner-border spinner-border-sm me-2" role="status"></div>
                Cargando...
            </td>
        </tr>`;

    try {
        const result = await getAllActiveVehicles();
        const vehiculos = result.success ? result.vehicles : [];
        vehiculosFiltrados = vehiculos;
        mostrarVehiculos(vehiculos);
        const totalEl = document.getElementById('totalVehiculos');
        if (totalEl) totalEl.textContent = vehiculos.length;
    } catch (error) {
        console.error('Error cargando vehículos:', error);
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-danger"><i class="bi bi-exclamation-triangle me-1"></i>Error al cargar los vehículos</td></tr>';
    }
}

function mostrarVehiculos(vehiculos) {
    const tbody = document.getElementById('vehiculosTabla');
    if (!tbody) return;

    if (!vehiculos || vehiculos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">No hay vehículos parqueados</td></tr>';
        return;
    }

    tbody.innerHTML = vehiculos.map(v => {
        const tiempo = calcularTiempoEstadia(`${v.entry_date}T${v.entry_time}`);
        const tiempoClase = tiempo >= 8 ? 'bg-danger' : tiempo >= 4 ? 'bg-warning text-dark' : 'bg-info';
        return `
            <tr>
                <td><strong>${v.license_plate}</strong></td>
                <td><i class="bi ${obtenerIconoVehiculo(v.vehicle_type)} me-1"></i>${v.vehicle_type}</td>
                <td><span class="badge bg-primary">${v.parking_space}</span></td>
                <td>${formatearFecha(v.entry_date)}</td>
                <td>${v.entry_time?.substring(0, 5) || ''}</td>
                <td>${v.user_id || '<span class="text-muted">—</span>'}</td>
                <td><span class="badge ${tiempoClase}">${tiempo}h</span></td>
                <td>
                    <a href="salida.html" class="btn btn-sm btn-success" title="Registrar salida">
                        <i class="bi bi-arrow-up-circle"></i>
                    </a>
                </td>
            </tr>`;
    }).join('');
}

async function filtrarVehiculos() {
    const busqueda = document.getElementById('buscarVehiculo')?.value.toLowerCase().trim() || '';
    const tipo     = document.getElementById('filtroTipo')?.value || '';

    const result = await getAllActiveVehicles();
    let vehiculos = result.success ? result.vehicles : [];

    if (tipo)     vehiculos = vehiculos.filter(v => v.vehicle_type === tipo);
    if (busqueda) vehiculos = vehiculos.filter(v => v.license_plate.toLowerCase().includes(busqueda));

    vehiculosFiltrados = vehiculos;
    mostrarVehiculos(vehiculos);
    const totalEl = document.getElementById('totalVehiculos');
    if (totalEl) totalEl.textContent = vehiculos.length;
}

document.addEventListener('DOMContentLoaded', function () {
    if (typeof protegerPagina === 'function') protegerPagina();

    cargarVehiculos();

    document.getElementById('buscarVehiculo')?.addEventListener('input', filtrarVehiculos);
    document.getElementById('filtroTipo')?.addEventListener('change', filtrarVehiculos);

    setInterval(cargarVehiculos, 30000);
});
