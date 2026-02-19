// storage.js - Funciones para manejar LocalStorage

// Inicializar datos por defecto si no existen
function inicializarDatos() {
    if (!localStorage.getItem('usuarios')) {
        const usuarios = [
            {
                id: 1,
                usuario: 'admin',
                password: 'admin123',
                nombre: 'Administrador',
                rol: 'admin'
            }
        ];
        guardarDatos('usuarios', usuarios);
    }

    if (!localStorage.getItem('vehiculosActivos')) {
        guardarDatos('vehiculosActivos', []);
    }

    if (!localStorage.getItem('historial')) {
        guardarDatos('historial', []);
    }

    if (!localStorage.getItem('tarifas')) {
        const tarifas = [
            { tipo: 'Carro', precioHora: 3000, precioFijo: 0 },
            { tipo: 'Moto', precioHora: 2000, precioFijo: 0 },
            { tipo: 'Camión', precioHora: 5000, precioFijo: 0 },
            { tipo: 'Bicicleta', precioHora: 1000, precioFijo: 0 }
        ];
        guardarDatos('tarifas', tarifas);
    }

    if (!localStorage.getItem('espacios')) {
        const espacios = {
            'Carro': Array.from({ length: 20 }, (_, i) => ({ 
                numero: `C-${i + 1}`, 
                ocupado: false, 
                tipo: 'Carro' 
            })),
            'Moto': Array.from({ length: 15 }, (_, i) => ({ 
                numero: `M-${i + 1}`, 
                ocupado: false, 
                tipo: 'Moto' 
            })),
            'Camión': Array.from({ length: 5 }, (_, i) => ({ 
                numero: `T-${i + 1}`, 
                ocupado: false, 
                tipo: 'Camión' 
            })),
            'Bicicleta': Array.from({ length: 10 }, (_, i) => ({ 
                numero: `B-${i + 1}`, 
                ocupado: false, 
                tipo: 'Bicicleta' 
            }))
        };
        guardarDatos('espacios', espacios);
    }

    if (!localStorage.getItem('configuracion')) {
        const configuracion = {
            nombreParqueadero: 'Parqueadero Central',
            direccion: 'Calle Principal #123',
            telefono: '555-1234',
            email: 'info@parqueadero.com'
        };
        guardarDatos('configuracion', configuracion);
    }
}

// Guardar datos en LocalStorage
function guardarDatos(clave, datos) {
    try {
        localStorage.setItem(clave, JSON.stringify(datos));
        return true;
    } catch (error) {
        console.error('Error al guardar datos:', error);
        return false;
    }
}

// Obtener datos desde LocalStorage
function obtenerDatos(clave) {
    try {
        const datos = localStorage.getItem(clave);
        return datos ? JSON.parse(datos) : null;
    } catch (error) {
        console.error('Error al obtener datos:', error);
        return null;
    }
}

// Eliminar datos de LocalStorage
function eliminarDatos(clave) {
    try {
        localStorage.removeItem(clave);
        return true;
    } catch (error) {
        console.error('Error al eliminar datos:', error);
        return false;
    }
}

// Actualizar un elemento específico en un array
function actualizarEnArray(clave, condicion, datosNuevos) {
    try {
        const datos = obtenerDatos(clave);
        if (!datos) return false;

        const index = datos.findIndex(condicion);
        if (index !== -1) {
            datos[index] = { ...datos[index], ...datosNuevos };
            return guardarDatos(clave, datos);
        }
        return false;
    } catch (error) {
        console.error('Error al actualizar en array:', error);
        return false;
    }
}

// Eliminar un elemento de un array
function eliminarDeArray(clave, condicion) {
    try {
        const datos = obtenerDatos(clave);
        if (!datos) return false;

        const nuevosDatos = datos.filter(item => !condicion(item));
        return guardarDatos(clave, nuevosDatos);
    } catch (error) {
        console.error('Error al eliminar de array:', error);
        return false;
    }
}

// Agregar elemento a un array
function agregarAArray(clave, nuevoElemento) {
    try {
        const datos = obtenerDatos(clave) || [];
        datos.push(nuevoElemento);
        return guardarDatos(clave, datos);
    } catch (error) {
        console.error('Error al agregar a array:', error);
        return false;
    }
}

// Limpiar toda la base de datos (usar con precaución)
function limpiarTodo() {
    try {
        localStorage.clear();
        inicializarDatos();
        return true;
    } catch (error) {
        console.error('Error al limpiar datos:', error);
        return false;
    }
}

// Inicializar al cargar
inicializarDatos();
