// espacios.js - Lógica de gestión de espacios

// Proteger la página
protegerPagina();

// Cargar espacios
function cargarEspacios() {
    const espacios = obtenerDatos('espacios') || {};
    const vehiculosActivos = obtenerDatos('vehiculosActivos') || [];

    // Actualizar ocupación basada en vehículos activos
    vehiculosActivos.forEach(vehiculo => {
        const tipo = vehiculo.tipo;
        if (espacios[tipo]) {
            const espacio = espacios[tipo].find(e => e.numero === vehiculo.espacio);
            if (espacio) {
                espacio.ocupado = true;
                espacio.vehiculo = vehiculo.placa;
            }
        }
    });

    // Guardar actualización
    guardarDatos('espacios', espacios);

    // Mostrar espacios por tipo
    mostrarEspaciosPorTipo('Carro', 'espaciosCarros');
    mostrarEspaciosPorTipo('Moto', 'espaciosMotos');
    mostrarEspaciosPorTipo('Camión', 'espaciosCamiones');
    mostrarEspaciosPorTipo('Bicicleta', 'espaciosBicicletas');

    // Calcular estadísticas
    calcularEstadisticas();
}

// Mostrar espacios por tipo
function mostrarEspaciosPorTipo(tipo, containerId) {
    const espacios = obtenerDatos('espacios') || {};
    const container = document.getElementById(containerId);

    if (!espacios[tipo] || espacios[tipo].length === 0) {
        container.innerHTML = '<p class="text-muted">No hay espacios configurados</p>';
        return;
    }

    container.innerHTML = espacios[tipo].map(espacio => {
        const clase = espacio.ocupado ? 'bg-danger' : 'bg-success';
        const texto = espacio.ocupado ? 'Ocupado' : 'Libre';
        const titulo = espacio.ocupado ? `Ocupado por: ${espacio.vehiculo || 'N/A'}` : 'Disponible';
        
        return `
            <div class="espacio-item">
                <span class="badge ${clase} w-100 p-2" title="${titulo}">
                    ${espacio.numero}<br>
                    <small>${texto}</small>
                </span>
            </div>
        `;
    }).join('');
}

// Calcular estadísticas
function calcularEstadisticas() {
    const espacios = obtenerDatos('espacios') || {};
    
    let totalEspacios = 0;
    let totalOcupados = 0;

    Object.values(espacios).forEach(tipoEspacios => {
        totalEspacios += tipoEspacios.length;
        totalOcupados += tipoEspacios.filter(e => e.ocupado).length;
    });

    const disponibles = totalEspacios - totalOcupados;
    const porcentaje = totalEspacios > 0 ? Math.round((totalOcupados / totalEspacios) * 100) : 0;

    document.getElementById('totalEspacios').textContent = totalEspacios;
    document.getElementById('espaciosOcupados').textContent = totalOcupados;
    document.getElementById('espaciosDisponibles').textContent = disponibles;
    document.getElementById('porcentajeOcupacion').textContent = porcentaje + '%';
}

// Inicializar página
document.addEventListener('DOMContentLoaded', function() {
    cargarEspacios();

    // Actualizar cada 30 segundos
    setInterval(cargarEspacios, 30000);
});
