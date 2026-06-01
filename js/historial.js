// historial.js - Lógica del historial
import { getAllHistory, filterHistoryByDateRange } from './supabase.js';

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
    if (!fecha) return '—';
    return new Date(fecha).toLocaleDateString('es-CO', {
        year: 'numeric', month: 'short', day: 'numeric',
    });
}

function formatearMoneda(valor) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency', currency: 'COP', minimumFractionDigits: 0,
    }).format(valor || 0);
}

async function cargarHistorial() {
    const tbody = document.getElementById('historialTabla');
    if (!tbody) return;

    tbody.innerHTML = `
        <tr>
            <td colspan="8" class="text-center text-muted">
                <div class="spinner-border spinner-border-sm me-2" role="status"></div>
                Cargando historial...
            </td>
        </tr>`;

    try {
        const result = await getAllHistory();
        const historial = result.success ? result.history : [];
        mostrarHistorial(historial);
        calcularEstadisticas(historial);
    } catch (error) {
        console.error('Error cargando historial:', error);
        if (tbody) tbody.innerHTML = '<tr><td colspan="8" class="text-center text-danger"><i class="bi bi-exclamation-triangle me-1"></i>Error al cargar el historial</td></tr>';
    }
}

function mostrarHistorial(registros) {
    const tbody = document.getElementById('historialTabla');
    if (!tbody) return;

    if (!registros || registros.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">No hay registros en el historial</td></tr>';
        return;
    }

    // Ya viene ordenado por exit_date DESC desde Supabase
    tbody.innerHTML = registros.map(r => `
        <tr>
            <td><strong>${r.license_plate}</strong></td>
            <td><i class="bi ${obtenerIconoVehiculo(r.vehicle_type)} me-1"></i>${r.vehicle_type}</td>
            <td><span class="badge bg-secondary">${r.parking_space}</span></td>
            <td><small>${formatearFecha(r.entry_date)} ${r.entry_time?.substring(0,5) || ''}</small></td>
            <td>${r.user_id || '<span class="text-muted">—</span>'}</td>
            <td><small>${formatearFecha(r.exit_date)} ${r.exit_time?.substring(0,5) || ''}</small></td>
            <td><span class="badge bg-info text-dark">${r.stay_time || 0}h</span></td>
            <td><strong class="text-success">${formatearMoneda(r.amount_paid)}</strong></td>
        </tr>`).join('');
}

function calcularEstadisticas(registros) {
    const total = registros?.length || 0;
    const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

    setEl('totalRegistros', total);

    if (total === 0) {
        setEl('ingresosTotales',   formatearMoneda(0));
        setEl('promedioVehiculo',  formatearMoneda(0));
        setEl('tiempoPromedio',    '0h');
        return;
    }

    const ingresos     = registros.reduce((s, r) => s + (Number(r.amount_paid) || 0), 0);
    const tiempoTotal  = registros.reduce((s, r) => s + (Number(r.stay_time) || 0), 0);

    setEl('ingresosTotales',  formatearMoneda(ingresos));
    setEl('promedioVehiculo', formatearMoneda(ingresos / total));
    setEl('tiempoPromedio',   `${Math.round(tiempoTotal / total)}h`);
}

async function filtrarHistorial() {
    const busqueda  = document.getElementById('buscarHistorial')?.value.toLowerCase().trim() || '';
    const tipo      = document.getElementById('filtroTipo')?.value || '';
    const fechaInicio = document.getElementById('fechaInicio')?.value || '';
    const fechaFin    = document.getElementById('fechaFin')?.value || '';

    let registros = [];

    if (fechaInicio && fechaFin) {
        const result = await filterHistoryByDateRange(fechaInicio, fechaFin);
        registros = result.success ? result.history : [];
    } else {
        const result = await getAllHistory();
        registros = result.success ? result.history : [];
    }

    if (tipo)     registros = registros.filter(r => r.vehicle_type === tipo);
    if (busqueda) registros = registros.filter(r =>
        r.license_plate?.toLowerCase().includes(busqueda)
    );

    mostrarHistorial(registros);
    calcularEstadisticas(registros);
}

async function exportarHistorial() {
    const result = await getAllHistory();
    const historial = result.success ? result.history : [];

    if (!historial.length) {
        alert('No hay datos para exportar');
        return;
    }

    const filas = historial.map(r =>
        [r.license_plate, r.vehicle_type, r.parking_space,
         formatearFecha(r.entry_date), r.entry_time || '',
         r.user_id || '',
         formatearFecha(r.exit_date), r.exit_time || '',
         r.stay_time || 0, r.amount_paid || 0
        ].join(',')
    );

    const csv  = 'Placa,Tipo,Espacio,Fecha Ingreso,Hora Ingreso,Registrado Por,Fecha Salida,Hora Salida,Tiempo(h),Valor\n' + filas.join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href     = url;
    link.download = `historial_${new Date().toISOString().split('T')[0]}.csv`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

document.addEventListener('DOMContentLoaded', function () {
    if (typeof protegerPagina === 'function') protegerPagina();

    cargarHistorial();

    document.getElementById('buscarHistorial')?.addEventListener('input', filtrarHistorial);
    document.getElementById('filtroTipo')?.addEventListener('change', filtrarHistorial);
    document.getElementById('fechaInicio')?.addEventListener('change', filtrarHistorial);
    document.getElementById('fechaFin')?.addEventListener('change', filtrarHistorial);
    document.getElementById('btnExportar')?.addEventListener('click', exportarHistorial);
    document.getElementById('btnLimpiarFiltros')?.addEventListener('click', () => {
        ['buscarHistorial', 'filtroTipo', 'fechaInicio', 'fechaFin'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        cargarHistorial();
    });
});
