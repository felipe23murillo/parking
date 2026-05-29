// espacios.js - Lógica de gestión de espacios
import { getAllParkingSpaces, updateParkingSpace } from './supabase.js';

// Proteger la página
protegerPagina();

// Cargar espacios desde Supabase
async function cargarEspacios() {
    const result = await getAllParkingSpaces();
    const espacios = result.success ? result.spaces : [];

    // Agrupar por tipo
    const espaciosPorTipo = {
        Carro: espacios.filter(e => e.vehicle_type === 'Carro'),
        Moto: espacios.filter(e => e.vehicle_type === 'Moto'),
        Camión: espacios.filter(e => e.vehicle_type === 'Camión'),
        Bicicleta: espacios.filter(e => e.vehicle_type === 'Bicicleta')
    };

    // Mostrar espacios por tipo
    mostrarEspaciosPorTipo(espaciosPorTipo.Carro, 'espaciosCarros');
    mostrarEspaciosPorTipo(espaciosPorTipo.Moto, 'espaciosMotos');
    mostrarEspaciosPorTipo(espaciosPorTipo.Camión, 'espaciosCamiones');
    mostrarEspaciosPorTipo(espaciosPorTipo.Bicicleta, 'espaciosBicicletas');

    // Calcular estadísticas
    calcularEstadisticas(espacios);
}

// Mostrar espacios por tipo
function mostrarEspaciosPorTipo(espacios, containerId) {
    const container = document.getElementById(containerId);

    if (!espacios || espacios.length === 0) {
        container.innerHTML = '<p class="text-muted">No hay espacios configurados</p>';
        return;
    }

    container.innerHTML = espacios.map(espacio => {
        const clase = espacio.is_occupied ? 'bg-danger' : 'bg-success';
        const texto = espacio.is_occupied ? 'Ocupado' : 'Libre';
        const titulo = espacio.is_occupied ? `Ocupado por: ${espacio.license_plate || 'N/A'}` : 'Disponible';
        
        return `
            <div class="espacio-item">
                <span class="badge ${clase} w-100 p-2" title="${titulo}">
                    ${espacio.space_number}<br>
                    <small>${texto}</small>
                </span>
            </div>
        `;
    }).join('');
}

// Calcular estadísticas
function calcularEstadisticas(espacios) {
    const totalEspacios = espacios?.length || 0;
    const totalOcupados = espacios?.filter(e => e.is_occupied).length || 0;
    const disponibles = totalEspacios - totalOcupados;
    const porcentaje = totalEspacios > 0 ? Math.round((totalOcupados / totalEspacios) * 100) : 0;

    document.getElementById('totalEspacios').textContent = totalEspacios;
    document.getElementById('espaciosOcupados').textContent = totalOcupados;
    document.getElementById('espaciosDisponibles').textContent = disponibles;
    document.getElementById('porcentajeOcupacion').textContent = porcentaje + '%';
}

// Inicializar página
document.addEventListener('DOMContentLoaded', function() {
    protegerPagina();
    cargarEspacios();

    // Actualizar cada 30 segundos
    setInterval(cargarEspacios, 30000);
});