// historial.js - Lógica del historial

// Proteger la página
protegerPagina();

// Cargar y mostrar historial
function cargarHistorial() {
    const historial = obtenerDatos('historial') || [];
    mostrarHistorial(historial);
    calcularEstadisticas(historial);
}

// Mostrar historial en la tabla
function mostrarHistorial(registros) {
    const tbody = document.getElementById('historialTabla');

    if (registros.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No hay registros en el historial</td></tr>';
        return;
    }

    // Ordenar por fecha de salida más reciente
    const ordenados = [...registros].sort((a, b) => new Date(b.fechaSalida) - new Date(a.fechaSalida));

    tbody.innerHTML = ordenados.map(r => `
        <tr>
            <td><strong>${r.placa}</strong></td>
            <td><i class="bi ${obtenerIconoVehiculo(r.tipo)}"></i> ${r.tipo}</td>
            <td><span class="badge bg-secondary">${r.espacio}</span></td>
            <td><small>${new Date(r.fechaIngreso).toLocaleDateString('es-CO')} ${r.horaIngreso}</small></td>
            <td><small>${new Date(r.fechaSalida).toLocaleDateString('es-CO')} ${r.horaSalida}</small></td>
            <td><span class="badge bg-info">${r.tiempoEstadia}</span></td>
            <td><strong class="text-success">${formatearMoneda(r.valorPagado)}</strong></td>
        </tr>
    `).join('');
}

// Calcular estadísticas
function calcularEstadisticas(registros) {
    const total = registros.length;
    document.getElementById('totalRegistros').textContent = total;

    if (total === 0) {
        document.getElementById('ingresosTotales').textContent = formatearMoneda(0);
        document.getElementById('promedioVehiculo').textContent = formatearMoneda(0);
        document.getElementById('tiempoPromedio').textContent = '0h';
        return;
    }

    // Ingresos totales
    const ingresos = registros.reduce((sum, r) => sum + (r.valorPagado || 0), 0);
    document.getElementById('ingresosTotales').textContent = formatearMoneda(ingresos);

    // Promedio por vehículo
    const promedio = ingresos / total;
    document.getElementById('promedioVehiculo').textContent = formatearMoneda(promedio);

    // Tiempo promedio
    const tiempoTotal = registros.reduce((sum, r) => sum + (r.totalHoras || 0), 0);
    const tiempoPromedio = Math.round(tiempoTotal / total);
    document.getElementById('tiempoPromedio').textContent = `${tiempoPromedio}h`;
}

// Filtrar historial
function filtrarHistorial() {
    const busqueda = document.getElementById('buscarHistorial').value.toLowerCase();
    const tipo = document.getElementById('filtroTipo').value;
    
    let registros = obtenerDatos('historial') || [];

    // Filtrar por tipo
    if (tipo) {
        registros = registros.filter(r => r.tipo === tipo);
    }

    // Filtrar por placa
    if (busqueda) {
        registros = registros.filter(r => r.placa.toLowerCase().includes(busqueda));
    }

    mostrarHistorial(registros);
    calcularEstadisticas(registros);
}

// Exportar historial a CSV
function exportarHistorial() {
    const historial = obtenerDatos('historial') || [];
    
    if (historial.length === 0) {
        alert('No hay datos para exportar');
        return;
    }

    // Crear CSV
    let csv = 'Placa,Tipo,Espacio,Fecha Ingreso,Hora Ingreso,Fecha Salida,Hora Salida,Tiempo,Valor\n';
    
    historial.forEach(r => {
        csv += `${r.placa},${r.tipo},${r.espacio},${new Date(r.fechaIngreso).toLocaleDateString('es-CO')},${r.horaIngreso},${new Date(r.fechaSalida).toLocaleDateString('es-CO')},${r.horaSalida},${r.tiempoEstadia},${r.valorPagado}\n`;
    });

    // Descargar archivo
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

// Limpiar historial
function limpiarHistorial() {
    if (confirm('¿Está seguro de que desea eliminar todo el historial? Esta acción no se puede deshacer.')) {
        if (confirm('Confirmación final: Se eliminarán todos los registros históricos.')) {
            guardarDatos('historial', []);
            cargarHistorial();
            alert('Historial eliminado exitosamente');
        }
    }
}

// Inicializar página
document.addEventListener('DOMContentLoaded', function() {
    cargarHistorial();

    // Eventos de filtros
    document.getElementById('buscarHistorial').addEventListener('input', filtrarHistorial);
    document.getElementById('filtroTipo').addEventListener('change', filtrarHistorial);

    // Botón exportar
    document.getElementById('btnExportar').addEventListener('click', exportarHistorial);

    // Botón limpiar historial
    document.getElementById('btnLimpiarHistorial').addEventListener('click', limpiarHistorial);
});
