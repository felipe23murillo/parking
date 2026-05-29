/**
 * chatbot.js - Asistente Virtual Local del Parqueadero
 * Sin APIs externas. Funciona 100% con los datos del sistema.
 */

class ParkingChatbot {
    constructor() {
        this.isLoading = false;
        this.isOpen = false;
        this.init();
    }

    // ============================
    // INICIALIZACIÓN Y UI
    // ============================

    init() {
        this.injectHTML();
        this.bindEvents();
        this.showWelcome();
    }

    injectHTML() {
        const el = document.createElement('div');
        el.innerHTML = `
        <button id="chatbot-toggle" title="Asistente Virtual">
            <i class="bi bi-chat-dots-fill" id="chatbot-icon"></i>
            <i class="bi bi-x-lg d-none" id="chatbot-close-icon"></i>
        </button>

        <div id="chatbot-panel" class="chatbot-hidden">
            <div id="chatbot-header">
                <div class="chatbot-header-info">
                    <div id="chatbot-avatar"><i class="bi bi-robot"></i></div>
                    <div>
                        <div id="chatbot-title">Asistente Virtual</div>
                        <div id="chatbot-subtitle">Sistema de Parqueadero</div>
                    </div>
                </div>
                <div class="chatbot-header-actions">
                    <button id="chatbot-clear" title="Nueva conversación">
                        <i class="bi bi-arrow-counterclockwise"></i>
                    </button>
                    <button id="chatbot-close" title="Cerrar">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
            </div>

            <div id="chatbot-messages"></div>

            <div id="chatbot-suggestions">
                <button class="chatbot-chip" data-msg="estadísticas">📊 Estadísticas</button>
                <button class="chatbot-chip" data-msg="vehículos activos">🚗 Vehículos</button>
                <button class="chatbot-chip" data-msg="espacios disponibles">📍 Espacios</button>
                <button class="chatbot-chip" data-msg="tarifas">💰 Tarifas</button>
                <button class="chatbot-chip" data-msg="historial">📋 Historial</button>
            </div>

            <div id="chatbot-input-area">
                <textarea id="chatbot-input" placeholder="Escribe tu pregunta o una placa..." rows="1"></textarea>
                <button id="chatbot-send" title="Enviar">
                    <i class="bi bi-send-fill"></i>
                </button>
            </div>
        </div>`;
        document.body.appendChild(el);
    }

    bindEvents() {
        document.getElementById('chatbot-toggle').addEventListener('click', () => this.togglePanel());
        document.getElementById('chatbot-close').addEventListener('click', () => this.closePanel());
        document.getElementById('chatbot-clear').addEventListener('click', () => this.clearConversation());
        document.getElementById('chatbot-send').addEventListener('click', () => this.handleSend());

        const input = document.getElementById('chatbot-input');
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSend();
            }
        });
        input.addEventListener('input', () => {
            input.style.height = 'auto';
            input.style.height = Math.min(input.scrollHeight, 100) + 'px';
        });

        // Chips de sugerencias
        document.querySelectorAll('.chatbot-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const msg = chip.getAttribute('data-msg');
                document.getElementById('chatbot-input').value = msg;
                this.handleSend();
            });
        });
    }

    togglePanel() { this.isOpen ? this.closePanel() : this.openPanel(); }

    openPanel() {
        document.getElementById('chatbot-panel').classList.replace('chatbot-hidden', 'chatbot-visible');
        document.getElementById('chatbot-icon').classList.add('d-none');
        document.getElementById('chatbot-close-icon').classList.remove('d-none');
        this.isOpen = true;
        setTimeout(() => document.getElementById('chatbot-input').focus(), 300);
    }

    closePanel() {
        document.getElementById('chatbot-panel').classList.replace('chatbot-visible', 'chatbot-hidden');
        document.getElementById('chatbot-icon').classList.remove('d-none');
        document.getElementById('chatbot-close-icon').classList.add('d-none');
        this.isOpen = false;
    }

    clearConversation() {
        document.getElementById('chatbot-messages').innerHTML = '';
        this.showWelcome();
    }

    showWelcome() {
        const config = JSON.parse(localStorage.getItem('configuracion') || '{}');
        const nombre = config.nombreParqueadero || 'el parqueadero';
        this.addBotMessage(
            `👋 ¡Hola! Soy el asistente de **${nombre}**.\n\n` +
            `Puedo consultarte información en tiempo real:\n` +
            `• Estadísticas y resumen general\n` +
            `• Vehículos activos y espacios\n` +
            `• Búsqueda por placa\n` +
            `• Tarifas e historial\n\n` +
            `Usa los botones de abajo o escribe tu pregunta.`
        );
    }

    // ============================
    // MENSAJES EN UI
    // ============================

    addUserMessage(text) {
        const el = document.createElement('div');
        el.className = 'chatbot-message chatbot-user-msg';
        el.textContent = text;
        document.getElementById('chatbot-messages').appendChild(el);
        this.scrollBottom();
        return el;
    }

    addBotMessage(text) {
        const el = document.createElement('div');
        el.className = 'chatbot-message chatbot-bot-msg';
        el.innerHTML = this.md(text);
        document.getElementById('chatbot-messages').appendChild(el);
        this.scrollBottom();
        return el;
    }

    addTyping() {
        const el = document.createElement('div');
        el.className = 'chatbot-message chatbot-bot-msg chatbot-typing';
        el.id = 'chatbot-typing';
        el.innerHTML = '<span></span><span></span><span></span>';
        document.getElementById('chatbot-messages').appendChild(el);
        this.scrollBottom();
    }

    removeTyping() {
        const el = document.getElementById('chatbot-typing');
        if (el) el.remove();
    }

    // Markdown básico
    md(text) {
        if (!text) return '';
        return text
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .split('\n')
            .map(line => {
                const t = line.trim();
                if (t.startsWith('• ') || t.startsWith('- ')) return `<li>${t.slice(2)}</li>`;
                if (t === '') return '<br>';
                return `<p>${t}</p>`;
            })
            .join('')
            .replace(/(<li>.*?<\/li>)+/g, m => `<ul>${m}</ul>`);
    }

    scrollBottom() {
        const el = document.getElementById('chatbot-messages');
        el.scrollTop = el.scrollHeight;
    }

    sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

    // ============================
    // PROCESAMIENTO DE MENSAJES
    // ============================

    async handleSend() {
        const input = document.getElementById('chatbot-input');
        const text = input.value.trim();
        if (!text || this.isLoading) return;

        input.value = '';
        input.style.height = 'auto';
        this.isLoading = true;
        input.disabled = true;

        this.addUserMessage(text);
        this.addTyping();

        // Pequeña pausa para simular procesamiento
        await this.sleep(400 + Math.random() * 300);

        this.removeTyping();
        const response = this.processMessage(text);
        this.addBotMessage(response);

        this.isLoading = false;
        input.disabled = false;
        input.focus();
    }

    processMessage(text) {
        const msg = text.toLowerCase().trim();

        // Saludo
        if (this.any(msg, ['hola', 'buenos días', 'buenas tardes', 'buenas noches', 'buenas', 'hey', 'hi', 'buen día'])) {
            return this.resGreeting();
        }

        // Ayuda
        if (this.any(msg, ['ayuda', 'help', 'comandos', 'que puedes', 'qué puedes', 'cómo funciona', 'como funciona'])) {
            return this.resHelp();
        }

        // Estadísticas generales
        if (this.any(msg, ['estadística', 'estadisticas', 'resumen', 'estado general', 'general', 'info', 'información', 'cuántos', 'cuantos hay', 'reporte', 'informe'])) {
            return this.resStats();
        }

        // Espacios
        if (this.any(msg, ['espacio', 'disponible', 'libre', 'capacidad', 'ocupado', 'ocupación', 'puesto'])) {
            if (this.any(msg, ['carro', 'coche', 'auto', 'car'])) return this.resSpaces('Carro');
            if (this.any(msg, ['moto', 'motocicleta'])) return this.resSpaces('Moto');
            if (this.any(msg, ['camión', 'camion', 'truck'])) return this.resSpaces('Camión');
            if (this.any(msg, ['bicicleta', 'bici', 'cicla'])) return this.resSpaces('Bicicleta');
            return this.resSpaces();
        }

        // Tarifas
        if (this.any(msg, ['tarifa', 'precio', 'costo', 'cobro', 'cuánto cuesta', 'cuanto cuesta', 'vale', 'valor hora', 'cuánto cobra', 'cuanto cobra'])) {
            return this.resTariffs();
        }

        // Historial / ingresos
        if (this.any(msg, ['historial', 'historia', 'ingreso', 'ganancia', 'recaudo', 'venta', 'total cobrado', 'salida'])) {
            return this.resHistory();
        }

        // Vehículos activos por tipo
        if (this.any(msg, ['carro', 'coche', 'auto']) && !this.extractPlate(msg)) {
            return this.resVehiclesByType('Carro');
        }
        if (this.any(msg, ['moto', 'motocicleta']) && !this.extractPlate(msg)) {
            return this.resVehiclesByType('Moto');
        }
        if (this.any(msg, ['camión', 'camion', 'truck']) && !this.extractPlate(msg)) {
            return this.resVehiclesByType('Camión');
        }
        if (this.any(msg, ['bicicleta', 'bici', 'cicla']) && !this.extractPlate(msg)) {
            return this.resVehiclesByType('Bicicleta');
        }

        // Vehículos activos general
        if (this.any(msg, ['vehículo', 'vehiculo', 'activo', 'parqueado', 'dentro'])) {
            return this.resActiveVehicles();
        }

        // Buscar por placa
        const plate = this.extractPlate(msg);
        if (plate) return this.resSearchPlate(plate);

        if (this.any(msg, ['buscar', 'busca', 'encontrar', 'placa', 'dónde está', 'donde esta'])) {
            return '🔍 Para buscar un vehículo, escribe directamente su placa.\nEjemplo: **ABC123**';
        }

        // Hora actual
        if (this.any(msg, ['hora', 'tiempo', 'fecha', 'día', 'hoy'])) {
            const now = new Date();
            return `🕐 **Fecha y hora actual:**\n${now.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n${now.toLocaleTimeString('es-CO')}`;
        }

        // Último vehículo
        if (this.any(msg, ['último', 'ultimo', 'reciente', 'nuevo', 'acaba de'])) {
            return this.resLastVehicle();
        }

        return this.resFallback(text);
    }

    any(msg, keywords) {
        return keywords.some(kw => msg.includes(kw));
    }

    extractPlate(msg) {
        // Placas colombianas: ABC123, AB-1234, ABC-123, etc.
        const m = msg.toUpperCase().match(/\b([A-Z]{2,3}[-\s]?\d{3,4}[A-Z]?)\b/);
        return m ? m[1].replace(/[\s-]/g, '') : null;
    }

    // ============================
    // RESPUESTAS
    // ============================

    resGreeting() {
        const h = new Date().getHours();
        const saludo = h < 12 ? '¡Buenos días!' : h < 18 ? '¡Buenas tardes!' : '¡Buenas noches!';
        return `${saludo} 👋\n\nEstoy listo para ayudarte. Puedes preguntarme sobre:\n• **estadísticas** — resumen del parqueadero\n• **espacios** — disponibilidad actual\n• **tarifas** — precios por tipo de vehículo\n• **historial** — registros e ingresos\n• Una **placa** para buscar un vehículo`;
    }

    resHelp() {
        return `🤖 **Comandos disponibles:**\n\n` +
            `• \`estadísticas\` — resumen general\n` +
            `• \`vehículos activos\` — lista de vehículos\n` +
            `• \`carros\` / \`motos\` / \`camiones\` / \`bicicletas\` — por tipo\n` +
            `• \`espacios\` — disponibilidad\n` +
            `• \`tarifas\` — precios actuales\n` +
            `• \`historial\` — registros e ingresos\n` +
            `• \`ABC123\` — buscar vehículo por placa\n\n` +
            `También puedes usar los botones de acceso rápido 👆`;
    }

    resStats() {
        const vehiculos = JSON.parse(localStorage.getItem('vehiculosActivos') || '[]');
        const historial = JSON.parse(localStorage.getItem('historial') || '[]');
        const espacios = JSON.parse(localStorage.getItem('espacios') || '{}');

        let totalEsp = 0, ocupados = 0;
        Object.values(espacios).forEach(lista => {
            lista.forEach(e => { totalEsp++; if (e.ocupado) ocupados++; });
        });

        const hoy = new Date().toDateString();
        const ingresosHoy = historial
            .filter(h => h.fechaSalida && new Date(h.fechaSalida).toDateString() === hoy)
            .reduce((sum, h) => sum + (h.valorPagado || 0), 0);

        const porTipo = {};
        vehiculos.forEach(v => { porTipo[v.tipo] = (porTipo[v.tipo] || 0) + 1; });

        const iconos = { 'Carro': '🚗', 'Moto': '🏍️', 'Camión': '🚛', 'Bicicleta': '🚲' };
        const pct = totalEsp > 0 ? Math.round(ocupados / totalEsp * 100) : 0;

        let r = `📊 **Resumen General**\n\n`;
        r += `🚘 **Vehículos activos: ${vehiculos.length}**\n`;

        if (Object.keys(porTipo).length > 0) {
            Object.entries(porTipo).forEach(([tipo, n]) => {
                r += `• ${iconos[tipo] || '🚘'} ${tipo}s: ${n}\n`;
            });
        } else {
            r += `• Sin vehículos parqueados\n`;
        }

        r += `\n📍 **Ocupación: ${ocupados}/${totalEsp}** (${pct}%)\n`;
        r += `✅ Espacios libres: ${totalEsp - ocupados}\n`;
        r += `\n💰 **Ingresos hoy: $${ingresosHoy.toLocaleString('es-CO')}**\n`;
        r += `📋 Total registros históricos: ${historial.length}`;

        return r;
    }

    resActiveVehicles() {
        const vehiculos = JSON.parse(localStorage.getItem('vehiculosActivos') || '[]');
        if (vehiculos.length === 0) return '🅿️ No hay vehículos parqueados en este momento.';

        const now = Date.now();
        const iconos = { 'Carro': '🚗', 'Moto': '🏍️', 'Camión': '🚛', 'Bicicleta': '🚲' };

        let r = `🚘 **${vehiculos.length} vehículo(s) activo(s):**\n\n`;
        vehiculos.slice(0, 10).forEach(v => {
            const diffMs = now - new Date(v.fechaIngreso).getTime();
            const h = Math.floor(diffMs / 3600000);
            const m = Math.floor((diffMs % 3600000) / 60000);
            r += `• ${iconos[v.tipo] || '🚘'} **${v.placa}** — ${v.espacio} — ${h}h ${m}m\n`;
        });

        if (vehiculos.length > 10) r += `\n_...y ${vehiculos.length - 10} más._`;
        return r;
    }

    resVehiclesByType(tipo) {
        const todos = JSON.parse(localStorage.getItem('vehiculosActivos') || '[]');
        const vehiculos = todos.filter(v => v.tipo === tipo);
        const iconos = { 'Carro': '🚗', 'Moto': '🏍️', 'Camión': '🚛', 'Bicicleta': '🚲' };
        const icono = iconos[tipo] || '🚘';

        if (vehiculos.length === 0) return `${icono} No hay ${tipo.toLowerCase()}s parqueados en este momento.`;

        const now = Date.now();
        let r = `${icono} **${vehiculos.length} ${tipo.toLowerCase()}(s) activo(s):**\n\n`;
        vehiculos.forEach(v => {
            const diffMs = now - new Date(v.fechaIngreso).getTime();
            const h = Math.floor(diffMs / 3600000);
            const m = Math.floor((diffMs % 3600000) / 60000);
            r += `• **${v.placa}** — ${v.espacio} — ${h}h ${m}m\n`;
        });
        return r;
    }

    resSpaces(tipo) {
        const espacios = JSON.parse(localStorage.getItem('espacios') || '{}');
        const iconos = { 'Carro': '🚗', 'Moto': '🏍️', 'Camión': '🚛', 'Bicicleta': '🚲' };

        if (tipo && espacios[tipo]) {
            const lista = espacios[tipo];
            const disp = lista.filter(e => !e.ocupado);
            const ocup = lista.filter(e => e.ocupado);
            const icono = iconos[tipo] || '📍';

            let r = `${icono} **Espacios para ${tipo}:**\n\n`;
            r += `✅ Disponibles: **${disp.length}** de ${lista.length}\n`;
            r += `🔴 Ocupados: **${ocup.length}**\n`;

            if (disp.length > 0 && disp.length <= 10) {
                r += `\nEspacios libres: ${disp.map(e => e.numero).join(', ')}`;
            } else if (disp.length === 0) {
                r += `\n⚠️ ¡No hay espacios disponibles para ${tipo.toLowerCase()}s!`;
            }
            return r;
        }

        let r = `📍 **Disponibilidad de Espacios:**\n\n`;
        let hayEspacios = false;
        Object.keys(espacios).forEach(t => {
            const lista = espacios[t];
            const disp = lista.filter(e => !e.ocupado).length;
            const icono = iconos[t] || '🚘';
            r += `${icono} ${t}s: **${disp}/${lista.length}** libres\n`;
            if (disp > 0) hayEspacios = true;
        });

        if (!hayEspacios) r += `\n⚠️ ¡El parqueadero está completamente lleno!`;
        return r;
    }

    resTariffs() {
        const tarifas = JSON.parse(localStorage.getItem('tarifas') || '[]');
        if (tarifas.length === 0) return '⚠️ No hay tarifas configuradas.';

        const iconos = { 'Carro': '🚗', 'Moto': '🏍️', 'Camión': '🚛', 'Bicicleta': '🚲' };
        let r = `💰 **Tarifas del Parqueadero:**\n\n`;
        tarifas.forEach(t => {
            const icono = iconos[t.tipo] || '🚘';
            const modalidad = t.modalidad || (Number(t.precioFijo) > 0 ? 'fijo' : 'hora');
            const precio = modalidad === 'fijo'
                ? `$${(Number(t.precioFijo) || 0).toLocaleString('es-CO')} (fijo)`
                : `$${(Number(t.precioHora) || 0).toLocaleString('es-CO')} / hora`;
            r += `• ${icono} **${t.tipo}:** ${precio}\n`;
        });
        return r;
    }

    resHistory() {
        const historial = JSON.parse(localStorage.getItem('historial') || '[]');
        if (historial.length === 0) return '📋 El historial está vacío.';

        const total = historial.length;
        const ingresos = historial.reduce((sum, h) => sum + (h.valorPagado || 0), 0);
        const promedio = Math.round(ingresos / total);

        const hoy = new Date().toDateString();
        const hoy_reg = historial.filter(h => h.fechaSalida && new Date(h.fechaSalida).toDateString() === hoy);
        const hoy_ing = hoy_reg.reduce((sum, h) => sum + (h.valorPagado || 0), 0);

        const ultimos = historial.slice(-3).reverse();

        let r = `📋 **Historial del Parqueadero:**\n\n`;
        r += `📈 Total registros: **${total}**\n`;
        r += `💵 Total ingresos: **$${ingresos.toLocaleString('es-CO')}**\n`;
        r += `📊 Promedio por vehículo: **$${promedio.toLocaleString('es-CO')}**\n`;
        r += `🌅 Hoy: **${hoy_reg.length}** vehículos — $${hoy_ing.toLocaleString('es-CO')}\n`;

        if (ultimos.length > 0) {
            r += `\n**Últimas salidas:**\n`;
            ultimos.forEach(h => {
                r += `• **${h.placa}** (${h.tipo}) — ${h.tiempoEstadia} — $${(h.valorPagado || 0).toLocaleString('es-CO')}\n`;
            });
        }
        return r;
    }

    resSearchPlate(placa) {
        const activos = JSON.parse(localStorage.getItem('vehiculosActivos') || '[]');
        const historial = JSON.parse(localStorage.getItem('historial') || '[]');
        const iconos = { 'Carro': '🚗', 'Moto': '🏍️', 'Camión': '🚛', 'Bicicleta': '🚲' };

        const activo = activos.find(v => v.placa === placa);
        const registros = historial.filter(h => h.placa === placa).slice(-3).reverse();

        if (!activo && registros.length === 0) {
            return `🔍 No se encontró ningún vehículo con la placa **${placa}**.`;
        }

        let r = `🔍 **Resultado para: ${placa}**\n\n`;

        if (activo) {
            const diffMs = Date.now() - new Date(activo.fechaIngreso).getTime();
            const h = Math.floor(diffMs / 3600000);
            const m = Math.floor((diffMs % 3600000) / 60000);
            const icono = iconos[activo.tipo] || '🚘';

            r += `${icono} **ACTUALMENTE PARQUEADO**\n`;
            r += `• Tipo: ${activo.tipo}\n`;
            r += `• Espacio: **${activo.espacio}**\n`;
            r += `• Ingresó: ${activo.horaIngreso}\n`;
            r += `• Tiempo: **${h}h ${m}m**\n`;

            // Calcular cobro actual
            const tarifas = JSON.parse(localStorage.getItem('tarifas') || '[]');
            const tarifa = tarifas.find(t => t.tipo === activo.tipo);
            if (tarifa) {
                const totalHoras = Math.max(1, Math.ceil(diffMs / 3600000));
                const modalidad = tarifa.modalidad || (Number(tarifa.precioFijo) > 0 ? 'fijo' : 'hora');
                const cobro = modalidad === 'fijo'
                    ? Number(tarifa.precioFijo) || 0
                    : totalHoras * (Number(tarifa.precioHora) || 0);
                r += `• Cobro estimado: **$${cobro.toLocaleString('es-CO')}**\n`;
            }
        }

        if (registros.length > 0) {
            if (activo) r += `\n`;
            r += `📋 **Últimas visitas:**\n`;
            registros.forEach(h => {
                r += `• ${h.fechaIngreso?.split('T')[0] || ''} — ${h.tiempoEstadia} — $${(h.valorPagado || 0).toLocaleString('es-CO')}\n`;
            });
        }

        return r;
    }

    resLastVehicle() {
        const activos = JSON.parse(localStorage.getItem('vehiculosActivos') || '[]');
        if (activos.length === 0) return '🅿️ No hay vehículos parqueados actualmente.';

        const ultimo = activos[activos.length - 1];
        const iconos = { 'Carro': '🚗', 'Moto': '🏍️', 'Camión': '🚛', 'Bicicleta': '🚲' };
        const icono = iconos[ultimo.tipo] || '🚘';

        const diffMs = Date.now() - new Date(ultimo.fechaIngreso).getTime();
        const h = Math.floor(diffMs / 3600000);
        const m = Math.floor((diffMs % 3600000) / 60000);

        return `${icono} **Último vehículo registrado:**\n\n• Placa: **${ultimo.placa}**\n• Tipo: ${ultimo.tipo}\n• Espacio: ${ultimo.espacio}\n• Ingresó: ${ultimo.horaIngreso}\n• Hace: ${h}h ${m}m`;
    }

    resFallback(text) {
        const sugerencias = ['estadísticas', 'vehículos activos', 'espacios', 'tarifas', 'historial'];
        const r = `❓ No entendí tu pregunta. Intenta con:\n\n` +
            sugerencias.map(s => `• **${s}**`).join('\n') +
            `\n\nO escribe una **placa** para buscar un vehículo.\nTambién puedes escribir **ayuda** para ver todos los comandos.`;
        return r;
    }
}

// Inicializar en páginas autenticadas
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('sidebar')) {
        window.parkingChatbot = new ParkingChatbot();
    }
});
