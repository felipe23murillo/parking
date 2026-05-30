// configuracion.js - Lógica de configuración del sistema
import { getSettings, updateSettings, getAllActiveVehicles, getAllHistory, getAllRates, getAllUsers, getAllParkingSpaces } from './supabase.js';

// Mostrar alerta
function mostrarAlerta(mensaje, tipo = 'danger') {
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) return;

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${tipo} alert-dismissible fade show`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    alertContainer.innerHTML = '';
    alertContainer.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 5000);
}

// Cargar configuración actual desde Supabase
async function cargarConfiguracion() {
    const result = await getSettings();
    const config = result.success ? result.settings : {};

    document.getElementById('nombreParqueadero').value = config?.parking_name || '';
    document.getElementById('direccion').value = config?.address || '';
    document.getElementById('telefono').value = config?.phone || '';
    document.getElementById('email').value = config?.email || '';
}

// Cargar estadísticas desde Supabase
async function cargarEstadisticas() {
    const [vehResult, histResult, ratesResult, usersResult, spacesResult] = await Promise.all([
        getAllActiveVehicles(),
        getAllHistory(),
        getAllRates(),
        getAllUsers(),
        getAllParkingSpaces()
    ]);

    document.getElementById('statActivos').textContent = vehResult.success ? (vehResult.vehicles?.length || 0) : 0;
    document.getElementById('statHistorial').textContent = histResult.success ? (histResult.history?.length || 0) : 0;
    document.getElementById('statTarifas').textContent = ratesResult.success ? (ratesResult.rates?.length || 0) : 0;
    document.getElementById('statUsuarios').textContent = usersResult.success ? (usersResult.users?.length || 0) : 0;
    document.getElementById('statEspacios').textContent = spacesResult.success ? (spacesResult.spaces?.length || 0) : 0;
}

// Exportar todos los datos
async function exportarDatos() {
    const [histResult, ratesResult, usersResult, spacesResult, settingsResult] = await Promise.all([
        getAllHistory(),
        getAllRates(),
        getAllUsers(),
        getAllParkingSpaces(),
        getSettings()
    ]);

    const datos = {
        historial: histResult.success ? histResult.history : [],
        tarifas: ratesResult.success ? ratesResult.rates : [],
        usuarios: usersResult.success ? usersResult.users : [],
        espacios: spacesResult.success ? spacesResult.spaces : [],
        configuracion: settingsResult.success ? settingsResult.settings : null,
        fechaExportacion: new Date().toISOString()
    };

    const json = JSON.stringify(datos, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_parqueadero_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    mostrarAlerta('Datos exportados exitosamente', 'success');
}

// Inicializar página
document.addEventListener('DOMContentLoaded', function() {
    protegerPagina();
    cargarConfiguracion();
    cargarEstadisticas();

    // Formulario de configuración
    const form = document.getElementById('configuracionForm');
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const config = {
            parking_name: document.getElementById('nombreParqueadero').value,
            address: document.getElementById('direccion').value,
            phone: document.getElementById('telefono').value,
            email: document.getElementById('email').value
        };

        const result = await updateSettings(config);
        if (result.success) {
            mostrarAlerta('Configuración guardada exitosamente', 'success');
        } else {
            mostrarAlerta('Error al guardar la configuración: ' + result.error, 'danger');
        }
    });

    // Botones de gestión de datos
    document.getElementById('btnExportarDatos').addEventListener('click', exportarDatos);
});