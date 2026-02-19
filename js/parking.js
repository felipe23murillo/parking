// parking.js - Funciones de lógica del parqueadero

// Obtener vehículos por tipo
function obtenerVehiculosPorTipo(tipo) {
    const vehiculos = obtenerDatos('vehiculosActivos') || [];
    return vehiculos.filter(v => v.tipo === tipo);
}

// Contar vehículos activos por tipo
function contarVehiculosPorTipo() {
    const vehiculos = obtenerDatos('vehiculosActivos') || [];
    return {
        Carro: vehiculos.filter(v => v.tipo === 'Carro').length,
        Moto: vehiculos.filter(v => v.tipo === 'Moto').length,
        Camión: vehiculos.filter(v => v.tipo === 'Camión').length,
        Bicicleta: vehiculos.filter(v => v.tipo === 'Bicicleta').length
    };
}

// Verificar si una placa ya existe
function existePlaca(placa) {
    const vehiculos = obtenerDatos('vehiculosActivos') || [];
    return vehiculos.some(v => v.placa.toLowerCase() === placa.toLowerCase());
}

// Obtener espacios disponibles por tipo
function obtenerEspaciosDisponibles(tipo) {
    const espacios = obtenerDatos('espacios');
    if (!espacios || !espacios[tipo]) return [];
    return espacios[tipo].filter(e => !e.ocupado);
}

// Marcar espacio como ocupado
function ocuparEspacio(tipo, numeroEspacio) {
    const espacios = obtenerDatos('espacios');
    if (!espacios || !espacios[tipo]) return false;

    const espacio = espacios[tipo].find(e => e.numero === numeroEspacio);
    if (espacio) {
        espacio.ocupado = true;
        return guardarDatos('espacios', espacios);
    }
    return false;
}

// Liberar espacio
function liberarEspacio(tipo, numeroEspacio) {
    const espacios = obtenerDatos('espacios');
    if (!espacios || !espacios[tipo]) return false;

    const espacio = espacios[tipo].find(e => e.numero === numeroEspacio);
    if (espacio) {
        espacio.ocupado = false;
        return guardarDatos('espacios', espacios);
    }
    return false;
}

// Registrar ingreso de vehículo
function registrarIngreso(placa, tipo, espacio) {
    // Validar que no exista la placa
    if (existePlaca(placa)) {
        return { exito: false, mensaje: 'Esta placa ya está registrada en el parqueadero' };
    }

    // Crear registro del vehículo
    const vehiculo = {
        id: Date.now(),
        placa: placa.toUpperCase(),
        tipo: tipo,
        espacio: espacio,
        fechaIngreso: new Date().toISOString(),
        horaIngreso: new Date().toLocaleTimeString('es-CO')
    };

    // Guardar en vehiculos activos
    if (agregarAArray('vehiculosActivos', vehiculo)) {
        // Marcar espacio como ocupado
        ocuparEspacio(tipo, espacio);
        return { exito: true, mensaje: 'Vehículo registrado exitosamente', vehiculo: vehiculo };
    }

    return { exito: false, mensaje: 'Error al registrar el vehículo' };
}

// Buscar vehículo por placa
function buscarVehiculoPorPlaca(placa) {
    const vehiculos = obtenerDatos('vehiculosActivos') || [];
    return vehiculos.find(v => v.placa.toLowerCase() === placa.toLowerCase());
}

// Calcular tiempo de estadía
function calcularTiempoEstadia(fechaIngreso) {
    const ingreso = new Date(fechaIngreso);
    const salida = new Date();
    const diferencia = salida - ingreso;

    const horas = Math.floor(diferencia / (1000 * 60 * 60));
    const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));

    return {
        horas: horas,
        minutos: minutos,
        totalHoras: Math.ceil(diferencia / (1000 * 60 * 60)) || 1, // Mínimo 1 hora
        texto: `${horas}h ${minutos}m`
    };
}

// Calcular valor a pagar
function calcularValorAPagar(tipo, fechaIngreso) {
    const tarifas = obtenerDatos('tarifas') || [];
    const tarifa = tarifas.find(t => t.tipo === tipo);
    
    if (!tarifa) return 0;

    const tiempo = calcularTiempoEstadia(fechaIngreso);
    
    // Si hay precio fijo, usar ese
    if (tarifa.precioFijo > 0) {
        return tarifa.precioFijo;
    }

    // Calcular por hora
    return tarifa.precioHora * tiempo.totalHoras;
}

// Registrar salida de vehículo
function registrarSalida(placa) {
    const vehiculo = buscarVehiculoPorPlaca(placa);
    
    if (!vehiculo) {
        return { exito: false, mensaje: 'Vehículo no encontrado' };
    }

    const tiempo = calcularTiempoEstadia(vehiculo.fechaIngreso);
    const valorPagar = calcularValorAPagar(vehiculo.tipo, vehiculo.fechaIngreso);

    // Crear registro en historial
    const registroHistorial = {
        ...vehiculo,
        fechaSalida: new Date().toISOString(),
        horaSalida: new Date().toLocaleTimeString('es-CO'),
        tiempoEstadia: tiempo.texto,
        totalHoras: tiempo.totalHoras,
        valorPagado: valorPagar
    };

    // Guardar en historial
    agregarAArray('historial', registroHistorial);

    // Liberar espacio
    liberarEspacio(vehiculo.tipo, vehiculo.espacio);

    // Eliminar de vehículos activos
    eliminarDeArray('vehiculosActivos', v => v.placa === vehiculo.placa);

    return {
        exito: true,
        mensaje: 'Salida registrada exitosamente',
        vehiculo: registroHistorial
    };
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
