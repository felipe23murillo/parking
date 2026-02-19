// dashboard.js - Lógica del dashboard

// Actualizar estadísticas
function actualizarEstadisticas() {
    // Obtener datos directamente de LocalStorage
    const vehiculos = JSON.parse(localStorage.getItem('vehiculosActivos')) || [];
    
    console.log('Vehículos en LocalStorage:', vehiculos); // Debug
    
    // Contar por tipo
    const conteo = {
        Carro: vehiculos.filter(v => v.tipo === 'Carro').length,
        Moto: vehiculos.filter(v => v.tipo === 'Moto').length,
        Camión: vehiculos.filter(v => v.tipo === 'Camión').length,
        Bicicleta: vehiculos.filter(v => v.tipo === 'Bicicleta').length
    };
    
    console.log('Conteo:', conteo); // Debug
    
    document.getElementById('totalCarros').textContent = conteo.Carro;
    document.getElementById('totalMotos').textContent = conteo.Moto;
    document.getElementById('totalCamiones').textContent = conteo.Camión;
    document.getElementById('totalBicicletas').textContent = conteo.Bicicleta;
    
    const total = conteo.Carro + conteo.Moto + conteo.Camión + conteo.Bicicleta;
    document.getElementById('totalVehiculos').textContent = total;
}

// Cargar actividad reciente
function cargarActividadReciente() {
    const vehiculos = JSON.parse(localStorage.getItem('vehiculosActivos')) || [];
    const tbody = document.getElementById('actividadReciente');
    
    console.log('Vehículos para actividad reciente:', vehiculos); // Debug
    
    if (vehiculos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No hay vehículos parqueados actualmente</td></tr>';
        return;
    }

    // Mostrar los últimos 5 vehículos
    const recientes = vehiculos.slice(-5).reverse();
    
    tbody.innerHTML = recientes.map(v => `
        <tr>
            <td><strong>${v.placa}</strong></td>
            <td><i class="bi ${obtenerIconoVehiculo(v.tipo)}"></i> ${v.tipo}</td>
            <td>${formatearFecha(v.fechaIngreso)}</td>
            <td><span class="badge bg-primary">${v.espacio}</span></td>
        </tr>
    `).join('');
}

// Inicializar dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Proteger la página
    protegerPagina();
    
    // Cargar datos
    actualizarEstadisticas();
    cargarActividadReciente();
    
    // Actualizar cada 30 segundos
    setInterval(() => {
        actualizarEstadisticas();
        cargarActividadReciente();
    }, 30000);
});

// Actualizar cuando la página recibe el foco
window.addEventListener('focus', function() {
    actualizarEstadisticas();
    cargarActividadReciente();
});

// Actualizar cuando se carga la página (después de navegar)
window.addEventListener('pageshow', function(event) {
    actualizarEstadisticas();
    cargarActividadReciente();
});
