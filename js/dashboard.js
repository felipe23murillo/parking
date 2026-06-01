// dashboard.js - Lógica del dashboard
import { getAllActiveVehicles, getAllParkingSpaces } from './supabase.js';

function obtenerIconoVehiculo(tipo) {
    const iconos = {
        'Carro':     'bi-car-front-fill',
        'Moto':      'bi-scooter',
        'Camión':    'bi-truck',
        'Bicicleta': 'bi-bicycle',
    };
    return iconos[tipo] || 'bi-question-circle';
}

function formatearFecha(fecha) {
    return new Date(fecha).toLocaleDateString('es-CO', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

async function actualizarEstadisticas() {
    try {
        const result = await getAllActiveVehicles();
        const vehiculos = result.success ? result.vehicles : [];

        const conteo = {
            Carro:     vehiculos.filter(v => v.vehicle_type === 'Carro').length,
            Moto:      vehiculos.filter(v => v.vehicle_type === 'Moto').length,
            Camión:    vehiculos.filter(v => v.vehicle_type === 'Camión').length,
            Bicicleta: vehiculos.filter(v => v.vehicle_type === 'Bicicleta').length,
        };

        const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        set('totalCarros',     conteo.Carro);
        set('totalMotos',      conteo.Moto);
        set('totalCamiones',   conteo.Camión);
        set('totalBicicletas', conteo.Bicicleta);
        set('totalVehiculos',  vehiculos.length);
    } catch (error) {
        console.error('Error actualizando estadísticas:', error);
    }
}

async function cargarDisponibilidadEspacios() {
    const container = document.getElementById('disponibilidadEspacios');
    if (!container) return;

    try {
        const result = await getAllParkingSpaces();
        const espacios = result.success ? result.spaces : [];

        const tipos = ['Carro', 'Moto', 'Camión', 'Bicicleta'];
        const datos = tipos.map(tipo => {
            const delTipo    = espacios.filter(e => e.vehicle_type === tipo);
            const total      = delTipo.length;
            const ocupados   = delTipo.filter(e => e.is_occupied).length;
            const disponibles = total - ocupados;
            const pct        = total > 0 ? Math.round((ocupados / total) * 100) : 0;
            return { tipo, total, ocupados, disponibles, pct };
        });

        if (espacios.length === 0) {
            container.innerHTML = '<div class="col-12 text-center text-muted">No hay espacios configurados</div>';
            return;
        }

        container.innerHTML = datos.map(d => {
            const colorBarra = d.pct >= 90 ? 'bg-danger' : d.pct >= 70 ? 'bg-warning' : 'bg-success';
            return `
                <div class="col-sm-6 col-lg-3">
                    <div class="border rounded p-3 h-100">
                        <div class="d-flex align-items-center mb-2">
                            <i class="bi ${obtenerIconoVehiculo(d.tipo)} fs-5 me-2"></i>
                            <strong>${d.tipo}</strong>
                        </div>
                        <div class="progress mb-2" style="height:8px;">
                            <div class="progress-bar ${colorBarra}" style="width:${d.pct}%"></div>
                        </div>
                        <div class="d-flex justify-content-between small">
                            <span class="text-success"><i class="bi bi-check-circle"></i> ${d.disponibles} libres</span>
                            <span class="text-danger"><i class="bi bi-x-circle"></i> ${d.ocupados} ocupados</span>
                        </div>
                    </div>
                </div>`;
        }).join('');
    } catch (error) {
        console.error('Error cargando disponibilidad:', error);
        if (container) container.innerHTML = '<div class="col-12 text-center text-danger">Error al cargar espacios</div>';
    }
}

async function cargarActividadReciente() {
    const tbody = document.getElementById('actividadReciente');
    if (!tbody) return;

    try {
        const result = await getAllActiveVehicles();
        const vehiculos = result.success ? result.vehicles : [];

        if (!vehiculos.length) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No hay vehículos parqueados actualmente</td></tr>';
            return;
        }

        tbody.innerHTML = vehiculos.slice(0, 5).map(v => `
            <tr>
                <td><strong>${v.license_plate}</strong></td>
                <td><i class="bi ${obtenerIconoVehiculo(v.vehicle_type)} me-1"></i>${v.vehicle_type}</td>
                <td>${formatearFecha(v.entry_date + ' ' + v.entry_time)}</td>
                <td><span class="badge bg-primary">${v.parking_space}</span></td>
            </tr>`).join('');
    } catch (error) {
        console.error('Error cargando actividad reciente:', error);
        if (tbody) tbody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Error al cargar la actividad</td></tr>';
    }
}

function actualizarTodo() {
    actualizarEstadisticas();
    cargarActividadReciente();
    cargarDisponibilidadEspacios();
}

document.addEventListener('DOMContentLoaded', function () {
    if (typeof protegerPagina === 'function') protegerPagina();

    actualizarTodo();
    setInterval(actualizarTodo, 30000);
});

window.addEventListener('focus',    actualizarTodo);
window.addEventListener('pageshow', actualizarTodo);
