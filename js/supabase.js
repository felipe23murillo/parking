// Importar Supabase desde CDN para uso directo en el navegador
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Obtener variables de entorno
const SUPABASE_URL = 'https://kmksucshpldaczhjgspn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtta3N1Y3NocGxkYWN6aGpnc3BuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwODU1NDYsImV4cCI6MjA5NTY2MTU0Nn0.wag1QgVbN9u1MxcgZHlDO53gdegEk31IU0LT9u5DazA';

// Crear cliente de Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==================== USUARIOS ====================

/**
 * Autenticar usuario con usuario y contraseña
 */
export async function loginUser(usuario, password) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('usuario', usuario)
      .eq('password', password)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return { success: !!data, user: data || null };
  } catch (error) {
    console.error('Error en login:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtener todos los usuarios
 */
export async function getAllUsers() {
  try {
    const { data, error } = await supabase.from('users').select('*');
    if (error) throw error;
    return { success: true, users: data };
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Crear nuevo usuario (solo admin)
 */
export async function createUser(userData) {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select();

    if (error) throw error;
    return { success: true, user: data[0] };
  } catch (error) {
    console.error('Error creando usuario:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Actualizar usuario
 */
export async function updateUser(userId, userData) {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(userData)
      .eq('id', userId)
      .select();

    if (error) throw error;
    return { success: true, user: data[0] };
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Eliminar usuario
 */
export async function deleteUser(userId) {
  try {
    const { error } = await supabase.from('users').delete().eq('id', userId);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    return { success: false, error: error.message };
  }
}

// ==================== VEHÍCULOS ACTIVOS ====================

/**
 * Obtener todos los vehículos activos
 */
export async function getAllActiveVehicles() {
  try {
    const { data, error } = await supabase.from('vehicles_active').select('*');
    if (error) throw error;
    return { success: true, vehicles: data };
  } catch (error) {
    console.error('Error obteniendo vehículos:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Registrar ingreso de vehículo
 */
export async function registerVehicleEntry(vehicleData) {
  try {
    const { data, error } = await supabase
      .from('vehicles_active')
      .insert([vehicleData])
      .select();

    if (error) throw error;
    return { success: true, vehicle: data[0] };
  } catch (error) {
    console.error('Error registrando ingreso:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Buscar vehículo por placa
 */
export async function searchVehicleByPlate(licensePlate) {
  try {
    const { data, error } = await supabase
      .from('vehicles_active')
      .select('*')
      .eq('license_plate', licensePlate)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found
    return { success: true, vehicle: data || null };
  } catch (error) {
    console.error('Error buscando vehículo:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Eliminar vehículo activo (salida)
 */
export async function removeActiveVehicle(vehicleId) {
  try {
    const { error } = await supabase
      .from('vehicles_active')
      .delete()
      .eq('id', vehicleId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error eliminando vehículo:', error);
    return { success: false, error: error.message };
  }
}

// ==================== ESPACIOS DE PARQUEO ====================

/**
 * Obtener todos los espacios
 */
export async function getAllParkingSpaces() {
  try {
    const { data, error } = await supabase.from('parking_spaces').select('*');
    if (error) throw error;
    return { success: true, spaces: data };
  } catch (error) {
    console.error('Error obteniendo espacios:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtener espacios disponibles por tipo
 */
export async function getAvailableSpacesByType(vehicleType) {
  try {
    const { data, error } = await supabase
      .from('parking_spaces')
      .select('*')
      .eq('vehicle_type', vehicleType)
      .eq('is_occupied', false);

    if (error) throw error;
    return { success: true, spaces: data };
  } catch (error) {
    console.error('Error obteniendo espacios disponibles:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Actualizar estado de espacio
 */
export async function updateParkingSpace(spaceId, spaceData) {
  try {
    const { data, error } = await supabase
      .from('parking_spaces')
      .update(spaceData)
      .eq('id', spaceId)
      .select();

    if (error) throw error;
    return { success: true, space: data[0] };
  } catch (error) {
    console.error('Error actualizando espacio:', error);
    return { success: false, error: error.message };
  }
}

// ==================== HISTORIAL ====================

/**
 * Obtener historial completo
 */
export async function getAllHistory() {
  try {
    const { data, error } = await supabase.from('history_movements').select('*');
    if (error) throw error;
    return { success: true, history: data };
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Registrar salida (agregar a historial)
 */
export async function registerVehicleExit(historyData) {
  try {
    const { data, error } = await supabase
      .from('history_movements')
      .insert([historyData])
      .select();

    if (error) throw error;
    return { success: true, history: data[0] };
  } catch (error) {
    console.error('Error registrando salida:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Filtrar historial por rango de fechas
 */
export async function filterHistoryByDateRange(startDate, endDate) {
  try {
    const { data, error } = await supabase
      .from('history_movements')
      .select('*')
      .gte('exit_date', startDate)
      .lte('exit_date', endDate);

    if (error) throw error;
    return { success: true, history: data };
  } catch (error) {
    console.error('Error filtrando historial:', error);
    return { success: false, error: error.message };
  }
}

// ==================== TARIFAS ====================

/**
 * Obtener todas las tarifas
 */
export async function getAllRates() {
  try {
    const { data, error } = await supabase.from('rates').select('*');
    if (error) throw error;
    return { success: true, rates: data };
  } catch (error) {
    console.error('Error obteniendo tarifas:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtener tarifa por tipo de vehículo
 */
export async function getRateByVehicleType(vehicleType) {
  try {
    const { data, error } = await supabase
      .from('rates')
      .select('*')
      .eq('vehicle_type', vehicleType)
      .single();

    if (error) throw error;
    return { success: true, rate: data };
  } catch (error) {
    console.error('Error obteniendo tarifa:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Actualizar tarifa
 */
export async function updateRate(rateId, rateData) {
  try {
    const { data, error } = await supabase
      .from('rates')
      .update(rateData)
      .eq('id', rateId)
      .select();

    if (error) throw error;
    return { success: true, rate: data[0] };
  } catch (error) {
    console.error('Error actualizando tarifa:', error);
    return { success: false, error: error.message };
  }
}

// ==================== CONFIGURACIÓN ====================

/**
 * Obtener configuración del sistema
 */
export async function getSettings() {
  try {
    const { data, error } = await supabase.from('settings').select('*').limit(1);
    if (error) throw error;
    return { success: true, settings: data[0] || null };
  } catch (error) {
    console.error('Error obteniendo configuración:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Actualizar configuración
 */
export async function updateSettings(settingsData) {
  try {
    // Obtener el ID de la configuración existente
    const { data: existingData } = await supabase
      .from('settings')
      .select('id')
      .limit(1);

    if (existingData && existingData.length > 0) {
      const { data, error } = await supabase
        .from('settings')
        .update(settingsData)
        .eq('id', existingData[0].id)
        .select();

      if (error) throw error;
      return { success: true, settings: data[0] };
    }
  } catch (error) {
    console.error('Error actualizando configuración:', error);
    return { success: false, error: error.message };
  }
}
