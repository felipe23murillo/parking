// espacios.js - Lógica de gestión y configuración de espacios
import {
    getAllParkingSpaces,
    updateParkingSpace,
    createParkingSpace,
    deleteParkingSpace,
} from './supabase.js';

// ── Constantes ──────────────────────────────────────────────────────────────

const TIPOS = ['Carro', 'Moto', 'Camión', 'Bicicleta'];

const TIPO_META = {
    'Carro':     { prefijo: 'C',  icono: 'bi-car-front-fill',  color: 'bg-primary',  label: 'Carros'     },
    'Moto':      { prefijo: 'M',  icono: 'bi-scooter',         color: 'bg-info',     label: 'Motos'      },
    'Camión':    { prefijo: 'T',  icono: 'bi-truck',           color: 'bg-warning',  label: 'Camiones'   },
    'Bicicleta': { prefijo: 'B',  icono: 'bi-bicycle',         color: 'bg-success',  label: 'Bicicletas' },
};

const CONTAINER_IDS = {
    'Carro':     'espaciosCarros',
    'Moto':      'espaciosMotos',
    'Camión':    'espaciosCamiones',
    'Bicicleta': 'espaciosBicicletas',
};

// ── Helpers de UI ────────────────────────────────────────────────────────────

function mostrarCargando() {
    Object.values(CONTAINER_IDS).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = `
            <div class="d-flex align-items-center gap-2 text-muted py-2">
                <div class="spinner-border spinner-border-sm" role="status"></div>
                <span>Cargando espacios...</span>
            </div>`;
    });
}

function mostrarErrorGlobal(mensaje) {
    Object.values(CONTAINER_IDS).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = `
            <div class="alert alert-danger d-flex align-items-center gap-2 mb-0 py-2" role="alert">
                <i class="bi bi-exclamation-triangle-fill"></i>
                <span>${mensaje}</span>
            </div>`;
    });
}

function resetearEstadisticas() {
    ['totalEspacios', 'espaciosOcupados', 'espaciosDisponibles', 'porcentajeOcupacion'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = id === 'porcentajeOcupacion' ? '0%' : '0';
    });
}

function alertaConfig(mensaje, tipo = 'success') {
    const el = document.getElementById('alertConfiguracion');
    if (!el) return;
    el.innerHTML = `
        <div class="alert alert-${tipo} alert-dismissible fade show py-2" role="alert">
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>`;
    setTimeout(() => { if (el.firstChild) el.firstChild.remove(); }, 6000);
}

// ── Renderizar grilla de espacios ────────────────────────────────────────────

function mostrarEspaciosPorTipo(espacios, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!espacios || espacios.length === 0) {
        container.innerHTML = `
            <div class="text-center py-3 text-muted">
                <i class="bi bi-grid-3x3 fs-4"></i>
                <p class="mb-0 mt-1 small">Sin espacios configurados</p>
            </div>`;
        return;
    }

    container.innerHTML = espacios.map(espacio => {
        const ocupado = espacio.is_occupied;
        const clase   = ocupado ? 'bg-danger' : 'bg-success';
        const texto   = ocupado ? 'Ocupado'   : 'Libre';
        const titulo  = ocupado
            ? `Ocupado por: ${espacio.license_plate || 'N/A'}`
            : 'Disponible';

        return `
            <div class="espacio-item">
                <span class="badge ${clase} w-100 p-2" title="${titulo}" style="cursor:default;">
                    ${espacio.space_number}<br>
                    <small>${texto}</small>
                    ${ocupado && espacio.license_plate
                        ? `<br><small class="text-white-50" style="font-size:.65rem;">${espacio.license_plate}</small>`
                        : ''}
                </span>
            </div>`;
    }).join('');
}

function calcularEstadisticas(espacios) {
    const total       = espacios.length;
    const ocupados    = espacios.filter(e => e.is_occupied).length;
    const disponibles = total - ocupados;
    const pct         = total > 0 ? Math.round((ocupados / total) * 100) : 0;

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('totalEspacios',       total);
    set('espaciosOcupados',    ocupados);
    set('espaciosDisponibles', disponibles);
    set('porcentajeOcupacion', pct + '%');

    const porcEl = document.getElementById('porcentajeOcupacion');
    if (porcEl) {
        porcEl.className = pct >= 90 ? 'text-danger' : pct >= 70 ? 'text-warning' : 'text-success';
    }
}

async function cargarEspacios() {
    try {
        mostrarCargando();
        const result = await getAllParkingSpaces();

        if (!result.success) {
            mostrarErrorGlobal(`No se pudieron cargar los espacios. Detalle: ${result.error || 'Error desconocido'}`);
            resetearEstadisticas();
            return;
        }

        const espacios = result.spaces;
        TIPOS.forEach(tipo => {
            mostrarEspaciosPorTipo(
                espacios.filter(e => e.vehicle_type === tipo),
                CONTAINER_IDS[tipo]
            );
        });
        calcularEstadisticas(espacios);

    } catch (error) {
        console.error('Error cargando espacios:', error);
        mostrarErrorGlobal('Error inesperado al cargar los espacios. Revise la consola.');
        resetearEstadisticas();
    }
}

// ── Panel de configuración ───────────────────────────────────────────────────

/**
 * Genera el número de espacio, ej: C-01, M-05, T-12
 */
function generarNumeroEspacio(tipo, numero) {
    const prefijo = TIPO_META[tipo]?.prefijo || 'X';
    return `${prefijo}-${String(numero).padStart(2, '0')}`;
}

/**
 * Obtiene el siguiente número disponible para un tipo dado
 * Busca el mayor número existente y devuelve el siguiente.
 */
function siguienteNumero(espaciosDelTipo) {
    if (!espaciosDelTipo.length) return 1;
    const nums = espaciosDelTipo.map(e => {
        const match = e.space_number?.match(/\d+$/);
        return match ? parseInt(match[0], 10) : 0;
    });
    return Math.max(...nums) + 1;
}

/**
 * Carga el formulario de configuración con los conteos actuales
 */
async function cargarFormularioConfig() {
    const container = document.getElementById('filasTipos');
    if (!container) return;

    const result = await getAllParkingSpaces();
    const espacios = result.success ? result.spaces : [];

    container.innerHTML = TIPOS.map(tipo => {
        const meta      = TIPO_META[tipo];
        const delTipo   = espacios.filter(e => e.vehicle_type === tipo);
        const total     = delTipo.length;
        const ocupados  = delTipo.filter(e => e.is_occupied).length;

        return `
            <div class="col-sm-6 col-lg-3">
                <div class="card h-100 border-2">
                    <div class="card-body">
                        <div class="d-flex align-items-center mb-3">
                            <i class="bi ${meta.icono} fs-4 me-2 text-primary"></i>
                            <strong>${meta.label}</strong>
                        </div>
                        <div class="d-flex justify-content-between small text-muted mb-3">
                            <span>Actuales: <strong class="text-dark">${total}</strong></span>
                            <span>Ocupados: <strong class="text-danger">${ocupados}</strong></span>
                            <span>Libres: <strong class="text-success">${total - ocupados}</strong></span>
                        </div>
                        <label class="form-label small fw-semibold">Nueva cantidad</label>
                        <input
                            type="number"
                            class="form-control config-cantidad"
                            id="cant_${tipo}"
                            data-tipo="${tipo}"
                            data-actual="${total}"
                            data-ocupados="${ocupados}"
                            value="${total}"
                            min="${ocupados}"
                            max="99"
                            step="1"
                        >
                        <div class="form-text" id="msg_${tipo}">
                            Mínimo ${ocupados} (espacios ocupados)
                        </div>
                    </div>
                </div>
            </div>`;
    }).join('');

    // Evento en tiempo real para feedback visual
    container.querySelectorAll('.config-cantidad').forEach(input => {
        input.addEventListener('input', () => validarInputConfig(input));
    });
}

function validarInputConfig(input) {
    const tipo    = input.dataset.tipo;
    const actual  = parseInt(input.dataset.actual, 10);
    const ocupados = parseInt(input.dataset.ocupados, 10);
    const nuevo   = parseInt(input.value, 10);
    const msg     = document.getElementById(`msg_${tipo}`);
    if (!msg) return;

    if (isNaN(nuevo) || nuevo < 0) {
        input.classList.add('is-invalid');
        msg.textContent = 'Ingrese un número válido';
        msg.className   = 'form-text text-danger';
        return;
    }
    if (nuevo < ocupados) {
        input.classList.add('is-invalid');
        msg.textContent = `No puede ser menor que los ${ocupados} espacios ocupados`;
        msg.className   = 'form-text text-danger';
        return;
    }

    input.classList.remove('is-invalid');
    input.classList.add('is-valid');

    const diff = nuevo - actual;
    if (diff > 0) {
        msg.textContent = `Se crearán ${diff} espacio(s)`;
        msg.className   = 'form-text text-success';
    } else if (diff < 0) {
        msg.textContent = `Se eliminarán ${Math.abs(diff)} espacio(s) libre(s)`;
        msg.className   = 'form-text text-warning';
    } else {
        msg.textContent = 'Sin cambios';
        msg.className   = 'form-text text-muted';
    }
}

/**
 * Aplica los cambios de configuración para todos los tipos
 */
async function aplicarConfiguracion(e) {
    e.preventDefault();

    const btn = document.getElementById('btnGuardarConfig');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Aplicando...';
    }

    const result = await getAllParkingSpaces();
    const espacios = result.success ? result.spaces : [];

    const resumen = [];
    let hayError = false;

    for (const tipo of TIPOS) {
        const input   = document.getElementById(`cant_${tipo}`);
        if (!input) continue;

        const nuevo    = parseInt(input.value, 10);
        const ocupados = parseInt(input.dataset.ocupados, 10);
        const actual   = parseInt(input.dataset.actual, 10);

        if (isNaN(nuevo) || nuevo < 0 || nuevo < ocupados) {
            resumen.push(`<strong>${tipo}</strong>: valor inválido (ignorado)`);
            continue;
        }

        const delTipo  = espacios.filter(e => e.vehicle_type === tipo);
        const diff     = nuevo - actual;

        if (diff > 0) {
            // Crear nuevos espacios
            let siguiente = siguienteNumero(delTipo);
            for (let i = 0; i < diff; i++) {
                const numero = generarNumeroEspacio(tipo, siguiente + i);
                const r = await createParkingSpace({
                    space_number: numero,
                    vehicle_type: tipo,
                    is_occupied:  false,
                    license_plate: null,
                });
                if (!r.success) {
                    resumen.push(`<strong>${tipo}</strong>: error al crear ${numero} — ${r.error}`);
                    hayError = true;
                }
            }
            if (!hayError) resumen.push(`<strong>${tipo}</strong>: +${diff} espacio(s) creado(s) ✓`);

        } else if (diff < 0) {
            // Eliminar espacios libres (desde el final, mayor número primero)
            const libres = delTipo
                .filter(e => !e.is_occupied)
                .sort((a, b) => {
                    const na = parseInt(a.space_number?.match(/\d+$/)?.[0] || 0, 10);
                    const nb = parseInt(b.space_number?.match(/\d+$/)?.[0] || 0, 10);
                    return nb - na;
                });

            const aEliminar = libres.slice(0, Math.abs(diff));
            for (const espacio of aEliminar) {
                const r = await deleteParkingSpace(espacio.id);
                if (!r.success) {
                    resumen.push(`<strong>${tipo}</strong>: error al eliminar ${espacio.space_number} — ${r.error}`);
                    hayError = true;
                }
            }
            if (!hayError) resumen.push(`<strong>${tipo}</strong>: ${Math.abs(diff)} espacio(s) eliminado(s) ✓`);

        } else {
            resumen.push(`<strong>${tipo}</strong>: sin cambios`);
        }
    }

    if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-check-circle me-1"></i>Aplicar configuración';
    }

    const tipoAlerta = hayError ? 'warning' : 'success';
    alertaConfig(resumen.join('<br>'), tipoAlerta);

    // Recargar todo
    await cargarFormularioConfig();
    await cargarEspacios();
}

// ── Inicialización ───────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function () {
    if (typeof protegerPagina === 'function') protegerPagina();

    cargarEspacios();
    cargarFormularioConfig();

    // Botón recargar mapa
    document.getElementById('btnRecargarEspacios')
        ?.addEventListener('click', cargarEspacios);

    // Formulario de configuración
    document.getElementById('formConfiguracion')
        ?.addEventListener('submit', aplicarConfiguracion);

    // Botón cancelar: cierra el panel y resetea el formulario
    document.getElementById('btnCancelarConfig')
        ?.addEventListener('click', () => {
            const panel = document.getElementById('panelConfiguracion');
            if (panel) {
                const bsCollapse = bootstrap.Collapse.getOrCreateInstance(panel);
                bsCollapse.hide();
            }
            cargarFormularioConfig();
        });

    // Icono del acordeón
    const panelEl = document.getElementById('panelConfiguracion');
    const icono   = document.getElementById('iconoConfiguracion');
    if (panelEl && icono) {
        panelEl.addEventListener('show.bs.collapse',  () => icono.className = 'bi bi-chevron-up');
        panelEl.addEventListener('hide.bs.collapse',  () => icono.className = 'bi bi-chevron-down');
    }

    // Actualizar mapa cada 30 segundos
    setInterval(cargarEspacios, 30000);
});
