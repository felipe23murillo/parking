// dashboard.js - Lógica del dashboard
import { getAllActiveVehicles } from './supabase.js';

// Formatear fecha
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

// Actualizar estadísticas
async function actualizarEstadisticas() {
    const result = await getAllActiveVehicles();
    const vehiculos = result.success ? result.vehicles : [];
    
    const conteo = {
        Carro: vehiculos.filter(v => v.vehicle_type === 'Carro').length,
        Moto: vehiculos.filter(v => v.vehicle_type === 'Moto').length,
        Camión: vehiculos.filter(v => v.vehicle_type === 'Camión').length,
        Bicicleta: vehiculos.filter(v => v.vehicle_type === 'Bicicleta').length
    };

    document.getElementById('totalCarros').textContent = conteo.Carro;
    document.getElementById('totalMotos').textContent = conteo.Moto;
    document.getElementById('totalCamiones').textContent = conteo.Camión;
    document.getElementById('totalBicicletas').textContent = conteo.Bicicleta;
    
    const total = conteo.Carro + conteo.Moto + conteo.Camión + conteo.Bicicleta;
    document.getElementById('totalVehiculos').textContent = total;
}

// Cargar actividad reciente
async function cargarActividadReciente() {
    const result = await getAllActiveVehicles();
    const vehiculos = result.success ? result.vehicles : [];
    const tbody = document.getElementById('actividadReciente');

    if (!vehiculos || vehiculos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No hay vehículos parqueados actualmente</td></tr>';
        return;
    }

    const recientes = vehiculos.slice(-5).reverse();
    
    tbody.innerHTML = recientes.map(v => `
        <tr>
            <td><strong>${v.license_plate}</strong></td>
            <td><i class="bi ${obtenerIconoVehiculo(v.vehicle_type)}"></i> ${v.vehicle_type}</td>
            <td>${formatearFecha(v.entry_date + ' ' + v.entry_time)}</td>
            <td><span class="badge bg-primary">${v.parking_space}</span></td>
        </tr>
    `).join('');
}

// Inicializar dashboard
document.addEventListener('DOMContentLoaded', function() {
    protegerPagina();
    
    actualizarEstadisticas();
    cargarActividadReciente();
    
    setInterval(() => {
        actualizarEstadisticas();
        cargarActividadReciente();
    }, 30000);
});

window.addEventListener('focus', function() {
    actualizarEstadisticas();
    cargarActividadReciente();
});

window.addEventListener('pageshow', function(event) {
    actualizarEstadisticas();
    cargarActividadReciente();
});