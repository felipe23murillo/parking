// parking.js - Funciones de lógica del parqueadero con Supabase
import {
    getAllActiveVehicles,
    registerVehicleEntry,
    searchVehicleByPlate,
    removeActiveVehicle,
    registerVehicleExit,
    getAllParkingSpaces,
    getAvailableSpacesByType,
    updateParkingSpace,
    getAllRates,
    getSettings
} from './supabase.js';

// ==================== VEHÍCULOS ====================

// Obtener vehículos por tipo
async function obtenerVehiculosPorTipo(tipo) {
    const result = await getAllActiveVehicles();
    if (result.success) {
        return result.vehicles.filter(v => v.vehicle_type === tipo);
    }
    return [];
}

// Contar vehículos activos por tipo
async function contarVehiculosPorTipo() {
    const result = await getAllActiveVehicles();
    if (result.success) {
        const vehiculos = result.vehicles;
        return {
            Carro: vehiculos.filter(v => v.vehicle_type === 'Carro').length,
            Moto: vehiculos.filter(v => v.vehicle_type === 'Moto').length,
            Camión: vehiculos.filter(v => v.vehicle_type === 'Camión').length,
            Bicicleta: vehiculos.filter(v => v.vehicle_type === 'Bicicleta').length
        };
    }
    return { Carro: 0, Moto: 0, Camión: 0, Bicicleta: 0 };
}

// Verificar si una placa ya existe
async function existePlaca(placa) {
    const result = await buscarVehiculoPorPlaca(placa);
    return result !== null;
}

// ==================== ESPACIOS ====================

// Obtener todos los espacios
async function obtenerTodosEspacios() {
    const result = await getAllParkingSpaces();
    if (result.success) {
        return result.spaces || [];
    }
    return [];
}

// Wrapper para buscarVehiculoPorPlaca
async function buscarVehiculoPorPlaca(placa) {
    const result = await searchVehicleByPlate(placa);
    return result.success ? result.vehicle : null;
}

// Marcar espacio como ocupado
async function ocuparEspacio(tipo, numeroEspacio, licensePlate) {
    const result = await getAllParkingSpaces();
    const espacios = result.success ? result.spaces : [];
    
    const espacio = espacios.find(e => e.space_number === numeroEspacio && e.vehicle_type === tipo);
    if (espacio) {
        const updateResult = await updateParkingSpace(espacio.id, {
            is_occupied: true,
            license_plate: licensePlate
        });
        return updateResult.success;
    }
    return false;
}

// Liberar espacio
async function liberarEspacio(tipo, numeroEspacio) {
    const result = await getAllParkingSpaces();
    const espacios = result.success ? result.spaces : [];
    
    const espacio = espacios.find(e => e.space_number === numeroEspacio && e.vehicle_type === tipo);
    if (espacio) {
        const updateResult = await updateParkingSpace(espacio.id, {
            is_occupied: false,
            license_plate: null
        });
        return updateResult.success;
    }
    return false;
}

// ==================== INGRESO/SALIDA DE VEHÍCULOS ====================

// Registrar ingreso de vehículo
async function registrarIngreso(placa, tipo, espacio, userId) {
    try {
        // Validar que no exista la placa
        if (await existePlaca(placa)) {
            return { exito: false, mensaje: 'Esta placa ya está registrada en el parqueadero' };
        }

        // Registrar ingreso en Supabase
        const vehicleData = {
            license_plate: placa.toUpperCase(),
            vehicle_type: tipo,
            parking_space: espacio,
            entry_date: fechaLocalHoy(),
            entry_time: horaLocalAhora(),
            user_id: userId
        };

        const result = await registerVehicleEntry(vehicleData);
        if (result.success) {
            await ocuparEspacio(tipo, espacio, placa.toUpperCase());
            return { exito: true, mensaje: 'Vehículo registrado exitosamente', vehiculo: result.vehicle };
        }

        return { exito: false, mensaje: 'Error al registrar el vehículo' };
    } catch (error) {
        console.error('Error en registrarIngreso:', error);
        return { exito: false, mensaje: 'Error del sistema: ' + error.message };
    }
}

// Buscar vehículo por placa
async function buscarVehiculo(placa) {
    const result = await buscarVehiculoPorPlaca(placa);
    return result;
}

// Devuelve la fecha local actual en formato YYYY-MM-DD (sin zona horaria)
function fechaLocalHoy() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Devuelve la hora local actual en formato HH:mm:ss
function horaLocalAhora() {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

// Calcular tiempo de estadía (en horas)
// Usa separador 'T' para que new Date() parsee como hora LOCAL, no UTC
function calcularTiempoEstadia(fecha, hora) {
    const ingreso = new Date(`${fecha}T${hora}`);
    const diferencia = Date.now() - ingreso.getTime();
    return Math.max(1, Math.ceil(diferencia / (1000 * 60 * 60)));
}

// Calcular tarifa
async function calcularTarifa(tipo, tiempoEstadia) {
    try {
        const tarifas = await getAllRates();
        if (!tarifas.success) return 0;

        const tarifa = tarifas.rates.find(t => t.vehicle_type === tipo);
        if (!tarifa) return 0;

        if (tarifa.fixed_price > 0) {
            return tarifa.fixed_price;
        }

        return tarifa.price_per_hour * tiempoEstadia;
    } catch (error) {
        console.error('Error al calcular tarifa:', error);
        return 0;
    }
}

// Registrar salida de vehículo
async function registrarSalida(vehiculo, userId) {
    try {
        const vehiculoEncontrado = await buscarVehiculo(vehiculo.license_plate);
        if (!vehiculoEncontrado) {
            return { exito: false, mensaje: 'Vehículo no encontrado' };
        }

        const tiempoEstadia = calcularTiempoEstadia(vehiculoEncontrado.entry_date, vehiculoEncontrado.entry_time);
        const tarifa = await calcularTarifa(vehiculoEncontrado.vehicle_type, tiempoEstadia);

        const datosHistorial = {
            license_plate: vehiculoEncontrado.license_plate,
            vehicle_type: vehiculoEncontrado.vehicle_type,
            parking_space: vehiculoEncontrado.parking_space,
            entry_date: vehiculoEncontrado.entry_date,
            entry_time: vehiculoEncontrado.entry_time,
            exit_date: fechaLocalHoy(),
            exit_time: horaLocalAhora(),
            stay_time: tiempoEstadia,
            amount_paid: tarifa,
            user_id: userId
        };

        const result = await registerVehicleExit(datosHistorial);
        if (result.success) {
            await removeActiveVehicle(vehiculoEncontrado.id);
            await liberarEspacio(vehiculoEncontrado.vehicle_type, vehiculoEncontrado.parking_space);
            return { 
                exito: true, 
                mensaje: 'Salida registrada exitosamente',
                historial: result.history,
                tiempoEstadia: tiempoEstadia,
                tarifa: tarifa
            };
        }

        return { exito: false, mensaje: 'Error al registrar la salida' };
    } catch (error) {
        console.error('Error en registrarSalida:', error);
        return { exito: false, mensaje: 'Error del sistema: ' + error.message };
    }
}

// Formatear número como moneda
function formatearMoneda(valor) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(valor);
}

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

// Exportar funciones para uso global
window.obtenerVehiculosPorTipo = obtenerVehiculosPorTipo;
window.contarVehiculosPorTipo = contarVehiculosPorTipo;
window.existePlaca = existePlaca;
window.obtenerTodosEspacios = obtenerTodosEspacios;
window.ocuparEspacio = ocuparEspacio;
window.liberarEspacio = liberarEspacio;
window.registrarIngreso = registrarIngreso;
window.buscarVehiculo = buscarVehiculo;
window.calcularTiempoEstadia = calcularTiempoEstadia;
window.calcularTarifa = calcularTarifa;
window.registrarSalida = registrarSalida;
window.formatearMoneda = formatearMoneda;
window.formatearFecha = formatearFecha;
window.obtenerIconoVehiculo = obtenerIconoVehiculo;
window.obtenerColorVehiculo = obtenerColorVehiculo;

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

// Obtener color por tipo de vehículo
function obtenerColorVehiculo(tipo) {
    const colores = {
        'Carro': '#09637E',
        'Moto': '#088395',
        'Camión': '#7AB2B2',
        'Bicicleta': '#EBF4F6'
    };
    return colores[tipo] || '#09637E';
}
