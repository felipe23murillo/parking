// storage.js - Funciones adaptadas para usar Supabase en lugar de localStorage
import {
    loginUser,
    getAllUsers,
    createUser,
    updateUser,
    deleteUser,
    getAllActiveVehicles,
    getAllParkingSpaces,
    getAvailableSpacesByType,
    getAllHistory,
    getAllRates,
    getSettings
} from './supabase.js';

// Cache local para mejorar rendimiento
let cache = {
    usuarios: [],
    vehiculosActivos: [],
    historial: [],
    tarifas: [],
    espacios: [],
    configuracion: null
};

// ==================== INICIALIZACIÓN ====================

async function inicializarDatos() {
    try {
        console.log('Inicializando datos desde Supabase...');
        
        const resultados = await Promise.all([
            getAllUsers(),
            getAllActiveVehicles(),
            getAllHistory(),
            getAllRates(),
            getAllParkingSpaces(),
            getSettings()
        ]);

        if (resultados[0].success) cache.usuarios = resultados[0].users || [];
        if (resultados[1].success) cache.vehiculosActivos = resultados[1].vehicles || [];
        if (resultados[2].success) cache.historial = resultados[2].history || [];
        if (resultados[3].success) cache.tarifas = resultados[3].rates || [];
        if (resultados[4].success) cache.espacios = resultados[4].spaces || [];
        if (resultados[5].success) cache.configuracion = resultados[5].settings;

        console.log('Datos cargados correctamente');
        return true;
    } catch (error) {
        console.error('Error al inicializar datos:', error);
        return false;
    }
}

// ==================== USUARIOS ====================

async function obtenerUsuarios() {
    const result = await getAllUsers();
    if (result.success) {
        cache.usuarios = result.users || [];
        return cache.usuarios;
    }
    return cache.usuarios;
}

async function crearUsuario(datosUsuario) {
    const result = await createUser({
        nombre: datosUsuario.nombre,
        usuario: datosUsuario.usuario,
        password: datosUsuario.password,
        rol: datosUsuario.rol || 'operador',
        estado: datosUsuario.estado || 'activo'
    });
    
    if (result.success) {
        cache.usuarios.push(result.user);
        return result.user;
    }
    return null;
}

async function actualizarUsuario(usuarioId, datosNuevos) {
    const result = await updateUser(usuarioId, datosNuevos);
    if (result.success) {
        const index = cache.usuarios.findIndex(u => u.id === usuarioId);
        if (index !== -1) {
            cache.usuarios[index] = result.user;
        }
        return result.user;
    }
    return null;
}

async function eliminarUsuario(usuarioId) {
    const result = await deleteUser(usuarioId);
    if (result.success) {
        cache.usuarios = cache.usuarios.filter(u => u.id !== usuarioId);
        return true;
    }
    return false;
}

// ==================== VEHÍCULOS ACTIVOS ====================

async function obtenerVehiculosActivos() {
    const result = await getAllActiveVehicles();
    if (result.success) {
        cache.vehiculosActivos = result.vehicles || [];
        return cache.vehiculosActivos;
    }
    return cache.vehiculosActivos;
}

// ==================== ESPACIOS DE PARQUEO ====================

async function obtenerEspacios() {
    const result = await getAllParkingSpaces();
    if (result.success) {
        cache.espacios = result.spaces || [];
        return cache.espacios;
    }
    return cache.espacios;
}

// ==================== HISTORIAL ====================

async function obtenerHistorial() {
    const result = await getAllHistory();
    if (result.success) {
        cache.historial = result.history || [];
        return cache.historial;
    }
    return cache.historial;
}

// ==================== TARIFAS ====================

async function obtenerTarifas() {
    const result = await getAllRates();
    if (result.success) {
        cache.tarifas = result.rates || [];
        return cache.tarifas;
    }
    return cache.tarifas;
}

// ==================== CONFIGURACIÓN ====================

async function obtenerConfiguracion() {
    const result = await getSettings();
    if (result.success) {
        cache.configuracion = result.settings;
        return cache.configuracion;
    }
    return cache.configuracion;
}

// ==================== FUNCIONES LEGADAS (compatibilidad) ====================

function guardarDatos(clave, datos) {
    cache[clave] = datos;
    return true;
}

function obtenerDatos(clave) {
    return cache[clave] || null;
}

function eliminarDatos(clave) {
    cache[clave] = null;
    return true;
}

// ==================== INICIALIZAR AL CARGAR ====================

inicializarDatos();