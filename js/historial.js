// historial.js - Lógica del historial
import { getAllHistory, filterHistoryByDateRange } from './supabase.js';

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

// Formatear moneda
function formatearMoneda(valor) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(valor);
}

// Cargar y mostrar historial desde Supabase
async function cargarHistorial() {
    try {
        const result = await getAllHistory();
        const historial = result.success ? result.history : [];
        mostrarHistorial(historial);
        calcularEstadisticas(historial);
    } catch (error) {
        console.error('Error cargando historial:', error);
        const tbody = document.getElementById('historialTabla');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center text-danger">Error al cargar el historial</td></tr>';
        }
    }
}

// Mostrar historial en la tabla
function mostrarHistorial(registros) {
    const tbody = document.getElementById('historialTabla');

    if (!registros || registros.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">No hay registros en el historial</td></tr>';
        return;
    }

    const ordenados = [...registros].sort((a, b) => new Date(b.exit_date) - new Date(a.exit_date));

    tbody.innerHTML = ordenados.map(r => `
        <tr>
            <td><strong>${r.license_plate}</strong></td>
            <td><i class="bi ${obtenerIconoVehiculo(r.vehicle_type)}"></i> ${r.vehicle_type}</td>
            <td><span class="badge bg-secondary">${r.parking_space}</span></td>
            <td><small>${new Date(r.entry_date).toLocaleDateString('es-CO')} ${r.entry_time}</small></td>
            <td>${r.user_id || 'Sin usuario'}</td>
            <td><small>${new Date(r.exit_date).toLocaleDateString('es-CO')} ${r.exit_time}</small></td>
            <td><span class="badge bg-info">${r.stay_time}h</span></td>
            <td><strong class="text-success">${formatearMoneda(r.amount_paid)}</strong></td>
        </tr>
    `).join('');
}

// Calcular estadísticas
function calcularEstadisticas(registros) {
    const total = registros?.length || 0;
    document.getElementById('totalRegistros').textContent = total;

    if (total === 0) {
        document.getElementById('ingresosTotales').textContent = formatearMoneda(0);
        document.getElementById('promedioVehiculo').textContent = formatearMoneda(0);
        document.getElementById('tiempoPromedio').textContent = '0h';
        return;
    }

    const ingresos = registros.reduce((sum, r) => sum + (r.amount_paid || 0), 0);
    document.getElementById('ingresosTotales').textContent = formatearMoneda(ingresos);
    document.getElementById('promedioVehiculo').textContent = formatearMoneda(ingresos / total);

    const tiempoTotal = registros.reduce((sum, r) => sum + (r.stay_time || 0), 0);
    document.getElementById('tiempoPromedio').textContent = `${Math.round(tiempoTotal / total)}h`;
}

// Filtrar historial
async function filtrarHistorial() {
    const busqueda = document.getElementById('buscarHistorial').value.toLowerCase();
    const tipo = document.getElementById('filtroTipo').value;
    
    let registros = [];
    const result = await getAllHistory();
    if (result.success) {
        registros = result.history || [];
    }

    if (tipo) {
        registros = registros.filter(r => r.vehicle_type === tipo);
    }

    if (busqueda) {
        registros = registros.filter(r => r.license_plate.toLowerCase().includes(busqueda));
    }

    mostrarHistorial(registros);
    calcularEstadisticas(registros);
}

// Exportar historial a CSV
async function exportarHistorial() {
    const result = await getAllHistory();
    const historial = result.success ? result.history : [];
    
    if (!historial || historial.length === 0) {
        alert('No hay datos para exportar');
        return;
    }

    let csv = 'Placa,Tipo,Espacio,Fecha Ingreso,Hora Ingreso,Registrado Por,Fecha Salida,Hora Salida,Tiempo,Valor\n';
    
    historial.forEach(r => {
        csv += `${r.license_plate},${r.vehicle_type},${r.parking_space},${new Date(r.entry_date).toLocaleDateString('es-CO')},${r.entry_time},${r.user_id || 'Sin usuario'},${new Date(r.exit_date).toLocaleDateString('es-CO')},${r.exit_time},${r.stay_time},${r.amount_paid}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `historial_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Inicializar página
document.addEventListener('DOMContentLoaded', function() {
    protegerPagina();
    cargarHistorial();

    document.getElementById('buscarHistorial').addEventListener('input', filtrarHistorial);
    document.getElementById('filtroTipo').addEventListener('change', filtrarHistorial);
    document.getElementById('btnExportar').addEventListener('click', exportarHistorial);
});