/* *********************************************************************
*************** VARIABLES, ESTADOS Y CONSTANTES GLOBALES ***************
********************************************************************* */
//* Edos. globales
let puertoSerial;
let cabinaActiva = false;
let puertoSerialConectado = false;
let puertoPreviamenteConectado = false;
let volumenPorCabina = { "Cabina 1": 0, "Cabina 2": 0 };
let reproduciendoPorCabina = { "Cabina 1": false, "Cabina 2": false };
let botonPlayActivoPorCabina = { "Cabina 1": null, "Cabina 2": null };
let sonidoActivoPorCabina = { "Cabina 1": null, "Cabina 2": null };

//* Estados para gráficas biométricas
let biometricChartsEnabled = false;
let biometricWatchConnected = false;
let biometricChartInstances = {
    pulse: null,
    oxygen: null,
    temperature: null,
    glucose: null,
};
let biometricChartData = {
    pulse: [],
    oxygen: [],
    temperature: [],
    glucose: [],
};
let biometricUpdateInterval = null;

/* *********************************************************************
*************************** MAPEO DE CODIGOS ***************************
********************************************************************* */
const codigoBoton = {
    VIBRACION: { off: "006", on: "007" },
    VENTILADOR: { off: "008", on: "009" },
    EXTRACTOR: { off: "010", on: "011" },
    FRIO: { off: "000", on: "001" },
    CALOR: { off: "002", on: "003" },
    HUMEDAD: { off: "004", on: "005" },
    DESHUMIDIFICADOR: { off: "012", on: "013" },
    HUMO: { off: "014", on: "015" },
    DISPARO: { off: "016", on: "017" },
};

const codigoSonidoControl = {
    PLAY: "035",
    VMAS: "036",
    VMEN: "037",
    STOP: "038",
};

const sonidosAmbientales = [
    { nombre: "Aire acondicionado", codigo: "039" },
    { nombre: "Aspiradora", codigo: "040" },
    { nombre: "Centro comercial", codigo: "041" },
    { nombre: "Maquina de coser", codigo: "042" },
    { nombre: "Construccion", codigo: "043" },
    { nombre: "Lavadora de ropa", codigo: "044" },
    { nombre: "Martillo hidraulico", codigo: "045" },
    { nombre: "Motosierra", codigo: "046" },
    { nombre: "Secadora de cabello", codigo: "047" },
    { nombre: "Taladro", codigo: "048" },
    { nombre: "Ventilador", codigo: "049" },
    { nombre: "Ventilador industrial", codigo: "050" },
];

const tinitus = [
    { nombre: "Tinitus 1", codigo: "070" },
    { nombre: "Tinitus 2", codigo: "071" },
    { nombre: "Tinitus 3", codigo: "072" },
    { nombre: "Tinitus 4", codigo: "073" },
    { nombre: "Tinitus 5", codigo: "074" },
    { nombre: "Tinitus 6", codigo: "075" },
    { nombre: "Tinitus 7", codigo: "076" },
    { nombre: "Tinitus 8", codigo: "077" },
    { nombre: "Tinitus 9", codigo: "078" },
    { nombre: "Tinitus 10", codigo: "079" },
    { nombre: "Tinitus 11", codigo: "080" },
    { nombre: "Tinitus 12", codigo: "081" },
    { nombre: "Tono 125Hz", codigo: "082" },
    { nombre: "Tono 250Hz", codigo: "083" },
    { nombre: "Tono 500Hz", codigo: "084" },
    { nombre: "Tono 1kHz", codigo: "085" },
    { nombre: "Tono 2kHz", codigo: "086" },
    { nombre: "Tono 4kHz", codigo: "087" },
    { nombre: "Tono 6kHz", codigo: "088" },
    { nombre: "Tono 8kHz", codigo: "089" },
];

// Trama STOP
const TRAMA_STOP = "038";

const sensorConfig = {
    TEMP: { frecuencia: 60, label: "Temperatura (°C)" },
    HUM: { frecuencia: 60, label: "Humedad (%)" },
    CO2: { frecuencia: 60, label: "CO₂ (ppm)" },
    O3: { frecuencia: 60, label: "Ozono (ppb)" },
    UV: { frecuencia: 60, label: "UV (W/m²)" },
    DB: { frecuencia: 60, label: "Ruido (dB)" },
    X: { frecuencia: 1, label: "Aceleración X (m/s²)" },
    Y: { frecuencia: 1, label: "Aceleración Y (m/s²)" },
    Z: { frecuencia: 1, label: "Aceleración Z (m/s²)" },
};

// Exponer constantes en window para acceso global
window.codigoBoton = codigoBoton;
window.codigoSonidoControl = codigoSonidoControl;
window.sonidosAmbientales = sonidosAmbientales;
window.tinitus = tinitus;
window.TRAMA_STOP = TRAMA_STOP;
window.sensorConfig = sensorConfig;

/* *********************************************************************
********************** INICIALIZACIÓN DE EVENTOS ***********************
********************************************************************* */
window.addEventListener("DOMContentLoaded", () => {
    inicializarBotonesHeader();
    iniciarIntervalos();
    inicializarPaneles();
    inicializarBiometria();
});

function inicializarBotonesHeader() {
    const btnScanCom = document.getElementById("btn-scan-com");
    const btnConnectCom = document.getElementById("btn-connect-com");
    const btnDisconnectCom = document.getElementById("btn-disconnect-com");

    if (btnScanCom)
        btnScanCom.addEventListener("click", escanearPuertosCOM);
    if (btnConnectCom)
        btnConnectCom.addEventListener("click", conectarPuertoSerial);
    if (btnDisconnectCom)
        btnDisconnectCom.addEventListener("click", desconectarPuertoSerial);

    escanearPuertosCOM();
}

function iniciarIntervalos() {
    const intervalo = 10000; // 10 segundos

    // Actualizar datos de ambas cabinas cada 10 segundos
    setInterval(() => {
        fetchDatosPorCabina("C1");
        fetchDatosPorCabina("C2");
    }, intervalo);

    // Actualizar logs cada 2 segundos
    setInterval(() => {
        //fetchTramas();
    }, intervalo * 2);
    // Procesar tramas cada segundo
    setInterval(async () => {
        try {
            const res = await fetch(
                "http://localhost:5000/api/serial/procesar-trama-real",
            );
            const data = await res.json();

            if (data.tramaC1) {
                procesarTrama(data.tramaC1);
                mostrarNotificacion(data.tramaC1, "real");
            }

            if (data.tramaC2) {
                procesarTrama(data.tramaC2);
                mostrarNotificacion(data.tramaC2, "real");
            }
        } catch (error) {
            console.error("Error al procesar trama:", error);
        }
    }, intervalo);
}

function inicializarPaneles() {
    const panels = document.querySelectorAll(".panel-container");
    panels.forEach((panel) => {
        initTwoColumnsSection(panel);
        initTabs(panel);
    });
}

function inicializarBiometria() {
    // Usar delegación de eventos en el documento para mayor robustez
    document.addEventListener("click", async (event) => {
        const connectBtn = event.target.closest("[data-action='connect-watch']");
        const disconnectBtn = event.target.closest("[data-action='disconnect-watch']");
        
        if (connectBtn) {
            console.log("[Biometría] Click en botón CONECTAR");
            
            const originalText = connectBtn.innerHTML;
            connectBtn.disabled = true;
            connectBtn.innerHTML = "Conectando...";

            const requestPayload = { deviceName: "ET570", scanTimeoutMs: 15000 };
            
            // Log enviado
            console.log("[Biometría] Enviando solicitud:", requestPayload);
            window.addSentLog?.(`[SMARTWATCH] \nPOST /api/smartwatch/connect\nPayload: ${JSON.stringify(requestPayload, null, 2)}`);

            try {
                const response = await fetch("http://localhost:5000/api/smartwatch/connect", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(requestPayload),
                });

                const data = await response.json().catch(() => ({}));
                
                console.log("[Biometría] Respuesta recibida:", { status: response.status, data });
                window.addReceivedLog?.(`[SMARTWATCH] Response Status: ${response.status}\nPayload: ${JSON.stringify(data, null, 2)}`);
                
                if (!response.ok || !data.success) {
                    throw new Error(data.message || "No se pudo conectar al reloj");
                }

                const nombre = data.device?.name || "reloj";
                console.log("[Biometría] Reloj conectado:", nombre);
                window.mostrarNotificacion?.(`Reloj conectado (${nombre})`, { tipo: "success" });
                
                // ✅ MARCAR RELOJ COMO CONECTADO
                biometricWatchConnected = true;
                
                // Inicializar gráficas si el tab de biometría ya está visible
                const biometriaTab = document.querySelector("[data-tab-content='biometria']");
                if (biometriaTab && !biometriaTab.classList.contains("hidden") && !biometricChartsEnabled) {
                    console.log("[BiometricCharts] Tab de biometría ya visible. Inicializando gráficas...");
                    initBiometricCharts();
                }
            } catch (error) {
                console.error("[Biometría] Error conectando reloj:", error);
                const mensaje = error?.message || "No se pudo conectar al reloj";
                window.addReceivedLog?.(`[SMARTWATCH] ❌ Error: ${mensaje}`);
                window.mostrarNotificacion?.(mensaje, { tipo: "error" });
                alert(mensaje);
            } finally {
                connectBtn.disabled = false;
                connectBtn.innerHTML = originalText;
            }
        } 
        else if (disconnectBtn) {
            console.log("[Biometría] Click en botón DESCONECTAR");
            
            const originalHTML = disconnectBtn.innerHTML;
            disconnectBtn.disabled = true;

            // Log enviado
            console.log("[Biometría] Enviando solicitud de desconexión");
            window.addSentLog?.(`[SMARTWATCH] POST /api/smartwatch/disconnect`);

            try {
                const response = await fetch("http://localhost:5000/api/smartwatch/disconnect", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                });

                const data = await response.json().catch(() => ({}));
                
                console.log("[Biometría] Respuesta recibida:", { status: response.status, data });
                window.addReceivedLog?.(`[SMARTWATCH] Response Status: ${response.status}\nPayload: ${JSON.stringify(data)}`);
                
                if (!response.ok || !data.success) {
                    throw new Error(data.message || "No se pudo desconectar del reloj");
                }

                console.log("[Biometría] Reloj desconectado");
                window.mostrarNotificacion?.("Reloj desconectado", { tipo: "success" });
                
                // ✅ MARCAR RELOJ COMO DESCONECTADO Y DETENER GRÁFICAS
                biometricWatchConnected = false;
                stopBiometricCharts();
            } catch (error) {
                console.error("[Biometría] Error desconectando reloj:", error);
                const mensaje = error?.message || "No se pudo desconectar del reloj";
                window.addReceivedLog?.(`[SMARTWATCH] ❌ Error: ${mensaje}`);
                window.mostrarNotificacion?.(mensaje, { tipo: "error" });
                alert(mensaje);
            } finally {
                disconnectBtn.disabled = false;
                disconnectBtn.innerHTML = originalHTML;
            }
        }
    });

    console.log("[Biometría] Delegación de eventos inicializada para [data-action='connect-watch'] y [data-action='disconnect-watch']");
}

/**
 * Genera datos aleatorios ilustrativos para biometría
 */
function generateBiometricData() {
    return {
        pulse: Math.floor(Math.random() * 40) + 60, // 60-100 bpm
        oxygen: Math.floor(Math.random() * 5) + 95, // 95-100 %
        temperature: (Math.random() * 2 + 36.5).toFixed(1), // 36.5-38.5 °C
        glucose: Math.floor(Math.random() * 40) + 100, // 100-140 mg/dL
    };
}

/**
 * Inicializa la gráfica biométrica única cuando se conecta el smartwatch
 */
function initBiometricCharts() {
    if (biometricChartsEnabled) return; // Ya está activa
    
    console.log("[BiometricCharts] Inicializando gráfica biométrica");
    
    // Limpiar datos previos
    biometricChartData = {
        pulse: [],
        oxygen: [],
        temperature: [],
        glucose: [],
    };

    // Validar que Chart esté disponible
    if (typeof Chart === "undefined") {
        console.error("[BiometricCharts] ❌ Chart.js no está cargado");
        return;
    }

    // Generar timestamps para las primeras 10 muestras
    const now = new Date();
    const labels = [];
    for (let i = 9; i >= 0; i--) {
        const time = new Date(now - i * 60000);
        labels.push(time.toLocaleTimeString());
    }

    // Generar datos iniciales
    for (let i = 0; i < 10; i++) {
        const data = generateBiometricData();
        biometricChartData.pulse.push(data.pulse);
        biometricChartData.oxygen.push(data.oxygen);
        biometricChartData.temperature.push(parseFloat(data.temperature));
        biometricChartData.glucose.push(data.glucose);
    }

    // Configuración de escalas y colores
    const metricConfigs = {
        pulse: { 
            label: "Pulso (bpm)", 
            yScale: { min: 50, max: 120 }, 
            borderColor: "#e74c3c", 
            bgColor: "rgba(231, 76, 60, 0.2)" 
        },
        oxygen: { 
            label: "Oxigenación (%)", 
            yScale: { min: 90, max: 100 }, 
            borderColor: "#3498db", 
            bgColor: "rgba(52, 152, 219, 0.2)" 
        },
        temperature: { 
            label: "Temperatura (°C)", 
            yScale: { min: 35, max: 40 }, 
            borderColor: "#f39c12", 
            bgColor: "rgba(243, 156, 18, 0.2)" 
        },
        glucose: { 
            label: "Glucosa (mg/dL)", 
            yScale: { min: 80, max: 160 }, 
            borderColor: "#9b59b6", 
            bgColor: "rgba(155, 89, 182, 0.2)" 
        },
    };

    // Crear gráfica única
    try {
        const canvas = document.getElementById("biometricChart");
        console.log("[BiometricCharts] Buscando canvas...", { canvasFound: !!canvas });
        
        if (!canvas) {
            console.error("[BiometricCharts] ❌ Canvas #biometricChart no encontrado");
            console.log("[BiometricCharts] DOM en este momento:", document.body.innerHTML.substring(0, 500));
            return;
        }

        // Validar dimensiones del canvas
        console.log("[BiometricCharts] Canvas encontrado. Dimensiones:", {
            width: canvas.width,
            height: canvas.height,
            offsetWidth: canvas.offsetWidth,
            offsetHeight: canvas.offsetHeight,
            clientWidth: canvas.clientWidth,
            clientHeight: canvas.clientHeight
        });

        // Verificar que el contenedor padre tiene dimensiones
        const container = canvas.parentElement;
        console.log("[BiometricCharts] Contenedor padre:", {
            display: window.getComputedStyle(container).display,
            width: window.getComputedStyle(container).width,
            height: window.getComputedStyle(container).height,
            hidden: container.classList.contains("hidden")
        });

        console.log("[BiometricCharts] Chart.js está disponible. Creando gráfica...");
        
        const ctx = canvas.getContext("2d");
        console.log("[BiometricCharts] Contexto 2D obtenido:", !!ctx);
        const defaultMetric = "pulse";
        const config = metricConfigs[defaultMetric];

        biometricChartInstances.pulse = new Chart(ctx, {
            type: "line",
            data: {
                labels,
                datasets: [{
                    label: config.label,
                    data: biometricChartData[defaultMetric],
                    borderColor: config.borderColor,
                    backgroundColor: config.bgColor,
                    tension: 0.3,
                    pointRadius: 4,
                    pointBackgroundColor: config.borderColor,
                    fill: true,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                scales: {
                    y: { 
                        ...config.yScale, 
                        grid: { color: "#eee" },
                        title: { display: true, text: config.label }
                    },
                    x: { grid: { color: "#eee" } },
                },
                plugins: { 
                    legend: { display: true, labels: { color: "#333" } },
                    title: { display: true, text: config.label }
                },
            },
        });

        console.log("[BiometricCharts] ✓ Gráfica biométrica creada");

        // Inicializar selector de métrica
        const selector = document.getElementById("biometricMetricSelector");
        if (selector) {
            selector.addEventListener("change", (e) => {
                updateBiometricMetric(e.target.value, labels, metricConfigs);
            });
            console.log("[BiometricCharts] ✓ Selector de métrica inicializado");
        }

        biometricChartsEnabled = true;

        // Actualizar gráficas cada minuto (60000 ms)
        biometricUpdateInterval = setInterval(updateBiometricCharts, 60000);
        console.log("[BiometricCharts] ✓ Gráfica iniciada. Se actualizará cada minuto.");
    } catch (err) {
        console.error("[BiometricCharts] ❌ Error creando gráfica:", err);
    }
}

/**
 * Cambia la métrica mostrada en la gráfica
 */
function updateBiometricMetric(metric, labels, metricConfigs) {
    if (!biometricChartInstances.pulse) return;

    const config = metricConfigs[metric];
    const chart = biometricChartInstances.pulse;

    console.log(`[BiometricCharts] Cambiando métrica a: ${metric}`);

    chart.data.datasets[0].label = config.label;
    chart.data.datasets[0].data = biometricChartData[metric];
    chart.data.datasets[0].borderColor = config.borderColor;
    chart.data.datasets[0].backgroundColor = config.bgColor;
    chart.data.datasets[0].pointBackgroundColor = config.borderColor;

    // Actualizar escalas
    chart.options.scales.y.min = config.yScale.min;
    chart.options.scales.y.max = config.yScale.max;

    chart.update();
}

/**
 * Actualiza las gráficas biométricas cada minuto
 */
function updateBiometricCharts() {
    if (!biometricChartsEnabled || !biometricChartInstances.pulse) return;

    console.log("[BiometricCharts] Actualizando datos");

    // Generar nuevo dato
    const newData = generateBiometricData();
    
    // Agregar nuevo dato y eliminar el más antiguo (mantener máximo 10)
    biometricChartData.pulse.push(newData.pulse);
    biometricChartData.oxygen.push(newData.oxygen);
    biometricChartData.temperature.push(parseFloat(newData.temperature));
    biometricChartData.glucose.push(newData.glucose);

    if (biometricChartData.pulse.length > 10) {
        biometricChartData.pulse.shift();
        biometricChartData.oxygen.shift();
        biometricChartData.temperature.shift();
        biometricChartData.glucose.shift();
    }

    // Actualizar labels (timestamp) - últimos 10 minutos
    const now = new Date();
    const newLabels = [];
    for (let i = Math.min(9, biometricChartData.pulse.length - 1); i >= 0; i--) {
        const time = new Date(now - i * 60000);
        newLabels.push(time.toLocaleTimeString());
    }

    // Actualizar la gráfica única (usa pulse como principal, pero todos tienen datos)
    const chart = biometricChartInstances.pulse;
    chart.data.labels = newLabels;
    
    // Obtener métrica seleccionada actualmente
    const selector = document.getElementById("biometricMetricSelector");
    const selectedMetric = selector ? selector.value : "pulse";
    
    // Actualizar dataset con la métrica seleccionada
    chart.data.datasets[0].data = biometricChartData[selectedMetric];
    chart.update();
}

/**
 * Detiene las gráficas biométricas
 */
function stopBiometricCharts() {
    console.log("[BiometricCharts] Deteniendo gráficas");

    // Limpiar intervalo
    if (biometricUpdateInterval) {
        clearInterval(biometricUpdateInterval);
        biometricUpdateInterval = null;
    }

    // Destruir gráficas
    Object.values(biometricChartInstances).forEach(chart => {
        if (chart) chart.destroy();
    });

    biometricChartInstances = {
        pulse: null,
        oxygen: null,
        temperature: null,
        glucose: null,
    };

    biometricChartsEnabled = false;
    console.log("[BiometricCharts] Gráficas detenidas");
}

/* *********************************************************************
****************************** FUNCIONES *******************************
********************************************************************* */
// Inicializa el toggle visual de pestañas dentro de un panel
function initTabs(panel) {
    if (!panel || panel.dataset.tabsInitialized === "true") return;

    const dbg = "[Tabs]";
    console.log(dbg, "initTabs() on panel", panel);

    // Soporta botones con clase .tab-button o atributo [data-tab]
    const tabButtons = panel.querySelectorAll(".tab-button, [data-tab]");
    const tabContents = panel.querySelectorAll("[data-tab-content]");

    console.log(dbg, `found buttons=${tabButtons.length}, contents=${tabContents.length}`);

    // Si no hay pestañas, marcar como inicializado y salir
    if (!tabButtons.length || !tabContents.length) {
        panel.dataset.tabsInitialized = "true";
        return;
    }

    const norm = (s) => (s || "").toString().toLowerCase().trim();

    function activateTab(tabName) {
        const target = norm(tabName);
        console.log(dbg, `activateTab('${target}')`);

        // Actualiza estado visual de botones
        tabButtons.forEach((btn) => {
            const name = btn.dataset.tab || btn.getAttribute("data-tab");
            const nameN = norm(name);
            const isActive = nameN === target;
            btn.classList.toggle("active", isActive);
            btn.setAttribute("aria-selected", isActive ? "true" : "false");
            // Ajuste visual explícito del fondo para reflejar estado activo
            btn.classList.toggle("bg-[#d9d9d9]", isActive);
            btn.classList.toggle("bg-transparent", !isActive);
            // Gestionar tabindex para accesibilidad
            btn.setAttribute("tabindex", isActive ? "0" : "-1");
            if (isActive) console.log(dbg, "button active:", nameN);
        });

        // Muestra/oculta contenido asociado
        let matched = 0;
        tabContents.forEach((section) => {
            const name =
                section.dataset.tabContent ||
                section.getAttribute("data-tab-content");
            const nameN = norm(name);
            const show = nameN === target;
            section.classList.toggle("hidden", !show);
            if (show) {
                matched += 1;
                console.log(dbg, "showing content:", nameN, section);
            }
        });

        if (matched === 0) {
            console.warn(dbg, `no content matched for '${target}'`);
        }

        // ✅ Si se activa el tab de biometría y el reloj está conectado, inicializar gráficas
        if (target === "biometria" && biometricWatchConnected && !biometricChartsEnabled) {
            console.log("[BiometricCharts] Tab de biometría visible. Inicializando gráficas...");
            initBiometricCharts();
        }

        try {
            mostrarNotificacion?.(`Pestaña activa: ${target}`, { tipo: "info" });
        } catch {}
        console.log(dbg, `activated '${target}'`);
    }

    // Bind de eventos de click
    tabButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            const name = btn.dataset.tab || btn.getAttribute("data-tab");
            const nameN = norm(name);
            console.log(dbg, "click on tab:", nameN);
            try {
                mostrarNotificacion?.(`Click pestaña: ${nameN}`, { tipo: "info" });
            } catch {}
            if (name) activateTab(name);
        });
    });

    // Estado inicial: botón activo o primera pestaña
    const initialBtn =
        Array.from(tabButtons).find((b) => b.classList.contains("active")) ||
        tabButtons[0];
    const initialName =
        initialBtn?.dataset.tab || initialBtn?.getAttribute("data-tab");
    console.log(dbg, "initial tab:", norm(initialName));
    if (initialName) activateTab(initialName);

    panel.dataset.tabsInitialized = "true";
    console.log(dbg, "initialized for panel");
}
// Escanear puertos COM del sistema
async function escanearPuertosCOM() {
    const selector = document.getElementById("com-port-selector");
    if (!selector) return;

    try {
        const response = await fetch(
            "http://localhost:5000/api/serial/ports",
        );
        const puertos = await response.json();

        selector.innerHTML = "";
        if (puertos.length === 0) {
            selector.innerHTML = `<option disabled selected>No hay puertos disponibles</option>`;
            return;
        }

        puertos.forEach((port) => {
            const option = document.createElement("option");
            option.value = port;
            option.textContent = port;
            selector.appendChild(option);
        });
    } catch (err) {
        console.error("Error al escanear puertos:", err);
        alert("Error al escanear puertos desde backend.");
    }
}

// Función para conectar puerto COM
async function conectarPuertoSerial() {
    const selector = document.getElementById("com-port-selector");
    const port = selector?.value;
    if (!port) return alert("Seleccione un puerto.");

    try {
        const response = await fetch(
            "http://localhost:5000/api/serial/connect",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(port),
            },
        );

        const mensaje = await response.text();
        mostrarNotificacion(mensaje, "real");

        // Mostrar botón de desconectar
        const btnConnect = document.getElementById("btn-connect-com");
        const btnDisconnect = document.getElementById("btn-disconnect-com");
        if (btnConnect) btnConnect.classList.add("hidden");
        if (btnDisconnect) btnDisconnect.classList.remove("hidden");

        // Actualizar estado global
        puertoSerialConectado = true;
        puertoPreviamenteConectado = true;
        window.dispatchEvent(new Event("puertoConectado"));
    } catch (err) {
        console.error("Error al conectar:", err);
        mostrarNotificacion("Error al conectar al puerto", "error");
    }
}

// Función para desconectar puerto COM
async function desconectarPuertoSerial() {
    const selector = document.getElementById("com-port-selector");
    const port = selector?.value;

    if (!port) {
        mostrarNotificacion(
            "Puerto no seleccionado para desconexión",
            "error",
        );
        return;
    }

    try {
        const response = await fetch(
            "http://localhost:5000/api/serial/disconnect",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(port),
            },
        );

        const mensaje = await response.text();
        mostrarNotificacion(mensaje, "real");

        // Actualizar estado visual de los botones
        const btnConnect = document.getElementById("btn-connect-com");
        const btnDisconnect = document.getElementById("btn-disconnect-com");

        if (btnDisconnect) btnDisconnect.classList.add("hidden");
        if (btnConnect) btnConnect.classList.remove("hidden");

        // Limpiar selector
        if (selector) selector.value = "Seleccionar Puerto";

        // Disparar evento global
        window.dispatchEvent(new Event("puertoDesconectado"));
    } catch (err) {
        console.error("Error al desconectar:", err);
        mostrarNotificacion("Error al desconectar puerto", "error");
    }
}

// Función para obtener datos desde el backend
async function fetchDatosPorCabina(cabina) {
    try {
        const response = await fetch(
            `http://localhost:5000/api/serial/datos/${cabina.toLowerCase()}`,
        );

        if (!response.ok) {
            console.error(
                `❌ Error al obtener datos de ${cabina}:`,
                response.status,
            );
            return;
        }

        const data = await response.json();

        if (data.success == "false") return;

        if (data) {
            const datos = {};
            for (const [key, value] of Object.entries(data)) {
                if (key.toUpperCase() !== "CABINA") {
                    datos[key.toUpperCase()] = value;
                }
            }

            Object.entries(datos).forEach(([clave, valor]) => {
                updateIndicador(clave, valor, cabina);
            });
        }
    } catch (error) {
        console.error(`❌ Error en fetchDatosPorCabina(${cabina}):`, error);
    }
}

// Función única para enviar tramas (simuladas o reales)
async function enviarTrama(prefijo, codigoAccion, cabinaActiva) {
    const trama = `${prefijo}${codigoAccion}F`;
    const selector = document.getElementById("com-port-selector");
    const port = selector?.value;

    if (!port) {
        mostrarNotificacion("Puerto no seleccionado", "error");
        return;
    }

    if (!cabinaActiva) {
        window.addSentLog(`[PENDIENTE] ${trama}`);
        return;
    }

    try {
        const response = await fetch(
            "http://localhost:5000/api/serial/send",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ portName: port, trama }),
            },
        );

        const mensaje = await response.text();
        window.addSentLog(`[ENVIADA] ${trama}`);
    } catch (err) {
        console.error("Error al enviar trama:", err);
        mostrarNotificacion("Error al enviar trama", "error");
    }
}

// Función para inicializar y mantener actualizada la gráfica con nuevos datos
async function initGrafica(panel, sensor = "X") {
    const graficaCanvas = panel.querySelector("#graficaPanel");
    if (!graficaCanvas) return;

    const selectCabina = panel.querySelector("[data-select='cabina']");
    const cabina = selectCabina?.value.includes("1") ? "c1" : "c2";

    console.log("Sensor seleccionado:", sensor);

    try {
        // Obtener datos iniciales
        const response = await fetch(
            `http://localhost:5000/api/serial/datos/${cabina}`,
        );
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

        const datos = await response.json();
        if (!Array.isArray(datos) || datos.length === 0) {
            alert(`Sin datos disponibles para ${cabina.toUpperCase()}`);
            return;
        }

        // 🔹 Crear labels y valores iniciales
        const labels = datos.map((_, i) => `${i + 1}`);
        const valores = datos.map((d) => {
            switch (sensor) {
                case "T":
                    return d.t;
                case "H":
                    return d.h;
                case "UV":
                    return d.uv;
                case "CO2":
                    return d.cO2;
                case "O3":
                    return d.o3;
                case "dB":
                    return d.dB;
                case "X":
                    return d.x;
                case "Y":
                    return d.y;
                case "Z":
                    return d.z;
                default:
                    return 0;
            }
        });

        // 🔹 Si ya existe una gráfica previa, destrúyela una sola vez al inicio
        const existingChart = Chart.getChart(graficaCanvas);
        if (existingChart) existingChart.destroy();

        const ctx = graficaCanvas.getContext("2d");
        const chart = new Chart(ctx, {
            type: "line",
            data: {
                labels,
                datasets: [
                    {
                        label: `${sensorConfig[sensor]?.label || "Dato"}`,
                        data: valores,
                        borderColor: "#004aad",
                        backgroundColor: "rgba(0, 74, 173, 0.2)",
                        tension: 0.3,
                        pointRadius: 0,
                        fill: false,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false, // 🔹 evita retrasos al actualizar
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: "Muestras",
                            color: "#333",
                            font: { weight: "bold" },
                        },
                        grid: { color: "#eee" },
                    },
                    y: {
                        title: {
                            display: true,
                            text: sensorConfig[sensor]?.label || "Valor",
                            color: "#333",
                            font: { weight: "bold" },
                        },
                        grid: { color: "#eee" },
                    },
                },
                plugins: {
                    legend: { display: true, labels: { color: "#333" } },
                },
            },
        });

        // Guardar referencia
        graficaCanvas.chartInstance = chart;
        graficaCanvas.lastDataCount = datos.length; // Rastrear cantidad de datos
        graficaCanvas.sensor = sensor; // Guardar sensor actual

        // 🔁 Intervalo para actualizar cada 2 segundos
        setInterval(async () => {
            try {
                // Si el sensor cambió, reiniciar
                if (graficaCanvas.sensor !== sensor) {
                    initGrafica(panel, sensor);
                    return;
                }

                // Obtener cantidad total de datos del backend
                const countResponse = await fetch(
                    `http://localhost:5000/api/serial/count/${cabina}`,
                );
                if (!countResponse.ok)
                    throw new Error(`Error HTTP: ${countResponse.status}`);

                const data_size = await countResponse.json();
                const countActual = graficaCanvas.lastDataCount;

                // Si hay nuevos datos
                if (data_size.count > countActual) {
                    // Traer todos los datos (para asegurar que tenemos la secuencia correcta)
                    const nuevosResponse = await fetch(
                        `http://localhost:5000/api/serial/datos/${cabina}`,
                    );
                    if (!nuevosResponse.ok)
                        throw new Error(
                            `Error HTTP: ${nuevosResponse.status}`,
                        );

                    const todosDatos = await nuevosResponse.json();

                    // Extraer solo los valores del sensor seleccionado
                    const nuevosSensorValores = todosDatos.map((d) => {
                        switch (sensor) {
                            case "T":
                                return d.t;
                            case "H":
                                return d.h;
                            case "UV":
                                return d.uv;
                            case "CO2":
                                return d.cO2;
                            case "O3":
                                return d.o3;
                            case "dB":
                                return d.dB;
                            case "X":
                                return d.x;
                            case "Y":
                                return d.y;
                            case "Z":
                                return d.z;
                            default:
                                return 0;
                        }
                    });

                    // Limitar a últimos 100 puntos para evitar sobrecarga
                    const maxPuntos = 100;
                    let valoresFinales = nuevosSensorValores;
                    let indiceInicio = 0;

                    if (valoresFinales.length > maxPuntos) {
                        indiceInicio = valoresFinales.length - maxPuntos;
                        valoresFinales = valoresFinales.slice(indiceInicio);
                    }

                    // Crear labels para los datos finales
                    const nuevasLabels = valoresFinales.map(
                        (_, i) => `${indiceInicio + i + 1}`,
                    );

                    // 🔹 Actualizar datos de la gráfica
                    chart.data.labels = nuevasLabels;
                    chart.data.datasets[0].data = valoresFinales;

                    // 🔹 Actualizar contador
                    graficaCanvas.lastDataCount = todosDatos.length;

                    // 🔹 Actualizar visualmente
                    chart.update("none"); // "none" evita animaciones
                }
            } catch (error) {
                console.error("Error al actualizar la gráfica:", error);
            }
        }, 2000);
    } catch (error) {
        console.error("Error al cargar datos de sensor:", error);
        alert("No se pudieron cargar datos desde el backend.");
    }
}

// Función para verificar conexión con el backend
/*
async function verificarConexion() {
    try {
        const response = await fetch(
            "http://localhost:5000/api/serial/test-connection",
        );

        if (!response.ok) {
            throw new Error(`Desconectado del backend`);
            //Tomar acciones para intentar reiniciar el backend
        }

        const status_data = await response.json();

        if (status_data.state == "false" && puertoSerialConectado) {
            alert("❌ El puerto COM se ha desconectado inesperadamente.");
            mostrarNotificacion(
                "Puerto desconectado inesperadamente.",
                "error",
            );
            //Acciones para regresar el estado del programa a "desconectado"
            puertoSerialConectado = false;
            puertoPreviamenteConectado = false;
        }
    } catch (error) {
        console.error("Error: ", error);
    }
}
 

// Verifica el estado de la conexion cada segundo
setInterval(verificarConexion, 1000);
*/

// Función para notificar al usuario.
function mostrarNotificacion(
    contenido,
    { tipo = "info", esTrama = false } = {},
) {
    const logWindow = document.getElementById("trama-log-window");
    if (!logWindow) return;

    // Limpiar mensaje inicial si es el placeholder
    if (
        logWindow.children.length === 1 &&
        logWindow.firstElementChild.textContent.includes(
            "No hay tramas aún",
        )
    ) {
        logWindow.innerHTML = "";
    }

    // Mapeo de iconos según tipo
    const iconos = {
        info: "🔵",
        error: "❌",
        real: "🟢",
        pendiente: "🟡",
    };
    const icono = iconos[tipo] || "🔵";

    // Crear elemento
    const entry = document.createElement("div");
    entry.className = esTrama
        ? "p-1 truncate text-xs"
        : "log-entry truncate text-xs";

    // Formatear contenido según tipo
    entry.textContent = esTrama
        ? `${icono} ${contenido}` // Formato simple para tramas
        : `${icono} [${new Date().toLocaleTimeString()}] ${contenido}`; // Con hora para notificaciones

    logWindow.insertBefore(entry, logWindow.firstChild);
}

// Función para obtener unidad según medición
function getUnidad(medicion) {
    switch (medicion) {
        case "X":
            return "m";
        case "T":
            return "°C";
        case "CO2":
            return "ppm";
        case "Y":
            return "m";
        case "H":
            return "%";
        case "UV":
            return "W/m²";
        case "O3":
            return "ppb";
        case "dB":
            return "dB";
        case "Z":
            return "m";
        default:
            return "";
    }
}

// Función global para actualizar el indicador
function updateIndicador(tipo, valor, cabinaPrefijo) {
    if (tipo === "DB") tipo = "dB";

    const elementos = document.querySelectorAll(
        `[data-medicion='${tipo}']`,
    );
    elementos.forEach((el) => {
        // Obtener el panel actual
        const panel = el.closest(".panel-container");
        if (!panel) return;

        // Obtener la cabina seleccionada en este panel
        const selectCabina = panel.querySelector("[data-select='cabina']");
        const cabinaSeleccionada = selectCabina
            ? selectCabina.value
            : "Cabina 1";
        const prefijoSeleccionado =
            cabinaSeleccionada === "Cabina 1" ? "C1" : "C2";

        // Verificar si el prefijo coincide
        if (prefijoSeleccionado !== cabinaPrefijo) return;

        // Buscar el botón correspondiente en este panel
        const btn = panel.querySelector(
            `.control-btn[data-codigo='${tipo}']`,
        );
        if (!btn || !btn.classList.contains("bg-[#00bf63]")) return;

        // Actualizar display
        const display = el.querySelector(".medicion-display");
        if (display) {
            display.textContent = `${valor} ${getUnidad(tipo)}`;
        }
    });
}

// Función para actualizar estado visual de botones de volumen
function actualizarEstadoVolumen(panel, reproduciendo) {
    const btnVmas = panel.querySelector("[data-sound-codigo='VMAS']");
    const btnVmen = panel.querySelector("[data-sound-codigo='VMEN']");

    if (!btnVmas || !btnVmen) return;

    if (reproduciendo) {
        btnVmas.classList.remove("opacity-50", "cursor-not-allowed");
        btnVmen.classList.remove("opacity-50", "cursor-not-allowed");
    } else {
        btnVmas.classList.add("opacity-50", "cursor-not-allowed");
        btnVmen.classList.add("opacity-50", "cursor-not-allowed");
    }
}

// Función para actualizar la barra de volumen visual
function actualizarBarraVolumen(panel, volumen) {
    const barFill = panel.querySelector("#volume-bar-fill");
    const volumeValue = panel.querySelector("#volume-value");

    if (barFill) barFill.style.width = `${volumen}%`;
    if (volumeValue) volumeValue.textContent = volumen;
}

// Función para procesar una trama completa y actualizar indicadores
function procesarTrama(trama) {
    if (!trama.endsWith("\n")) trama += "\n";

    window.addReceivedLog(trama);

    // Validar formato
    const regex = /(\w+)\|((?:[^:]+:[^|]+\|?)+)/;
    const match = trama.match(regex);
    if (!match) {
        console.warn("Formato de trama inválido:", trama);
        return;
    }

    const [, cabinaPrefijo, datosStr] = match;
    const pares = datosStr.split("|").filter(Boolean);

    const datos = {};
    pares.forEach((par) => {
        const [clave, valor] = par.split(":");
        if (clave && valor !== undefined) {
            datos[clave.trim()] = parseFloat(valor.trim()) || valor.trim();
        }
    });

    // Actualizar indicadores por tipo
    Object.entries(datos).forEach(([clave, valor]) => {
        updateIndicador(clave, valor, cabinaPrefijo);
    });
}

// Función para restaurar el sonido activo cuando se cambia de cabina
function restaurarSonidoActivo(panel) {
    const cabinaSelector = panel.querySelector("[data-select='cabina']");
    const cabinaSeleccionada = cabinaSelector?.value || "Cabina 1";
    const contenedor = panel.querySelector(".seccion-contenido");

    if (!contenedor) return;

    // Restaurar sonido/tono activo
    const codigoActivo =
        sonidoActivoPorCabina[cabinaSeleccionada]?.getAttribute(
            "data-codigo",
        );
    const btnSonido = contenedor.querySelector(
        `button[data-codigo='${codigoActivo}']`,
    );

    if (btnSonido) {
        // Limpiar otros botones
        contenedor.querySelectorAll("button").forEach((b) => {
            b.classList.remove("bg-[#00bf63]", "text-white");
            b.classList.add("bg-[#efefef]");
            const icono = b.querySelector(".text-green-800");
            if (icono) icono.classList.add("hidden");
        });

        // Activar el botón guardado
        btnSonido.classList.remove("bg-[#efefef]");
        btnSonido.classList.add("bg-[#00bf63]", "text-white");

        const icono = btnSonido.querySelector(".text-green-800");
        if (icono && reproduciendoPorCabina[cabinaSeleccionada]) {
            icono.classList.remove("hidden");
        }
    }

    // Restaurar estado de PLAY
    const btnPlay = panel.querySelector("[data-sound-codigo='PLAY']");
    if (reproduciendoPorCabina[cabinaSeleccionada]) {
        btnPlay?.classList.remove("bg-[#d9d9d9]");
        btnPlay?.classList.add("bg-[#00bf63]", "text-white");
    } else {
        btnPlay?.classList.remove("bg-[#00bf63]", "text-white");
        btnPlay?.classList.add("bg-[#d9d9d9]");
    }

    // Restaurar estado de volumen
    actualizarEstadoVolumen(
        panel,
        reproduciendoPorCabina[cabinaSeleccionada],
    );
    actualizarBarraVolumen(panel, volumenPorCabina[cabinaSeleccionada]);
}

// Función para inicializar la sección de dos columnas
function initTwoColumnsSection(panel) {
    const contenedor = panel.querySelector(".seccion-contenido");
    const botonesSeccion = panel.querySelectorAll(".seccion-btn");
    const cabinaSelector = panel.querySelector("[data-select='cabina']");
    const panelKey =
        panel === document.querySelectorAll(".panel-container")[0]
            ? "Cabina 1"
            : "Cabina 2";

    if (!contenedor || !botonesSeccion.length || !cabinaSelector) return;

    // Botones de control de sonido
    const btnVmas = panel.querySelector("[data-sound-codigo='VMAS']");
    const btnVmen = panel.querySelector("[data-sound-codigo='VMEN']");
    const btnStop = panel.querySelector("[data-sound-codigo='STOP']");

    let cabinaSeleccionada = cabinaSelector?.value || "Cabina 1";

    // Función para mostrar botones de sonidos/tonos
    function mostrarSeccion(seccion) {
        contenedor.innerHTML = "";
        const datos = seccion === "sonidos" ? sonidosAmbientales : tinitus;
        datos.forEach((item) => {
            const btn = document.createElement("button");
            btn.className =
                "w-full flex items-center justify-between bg-[#efefef] hover:bg-[#d9d9d9] px-4 py-2 mt-1 rounded-lg transition-colors";
            btn.innerHTML = `
                    <span class="sonido-nombre">${item.nombre}</span>
                    <span id="icono-${item.codigo}" class="text-green-800 hidden text-lg">▶</span>
                `;
            btn.setAttribute("data-codigo", item.codigo);
            btn.setAttribute("data-seccion", seccion);

            btn.addEventListener("click", async () => {
                const cabinaSeleccionada =
                    cabinaSelector.value || "Cabina 1";
                const cabinaPrefijo =
                    cabinaSeleccionada === "Cabina 1" ? "C1" : "C2";
                const codigo = btn.getAttribute("data-codigo");

                const sonidoPrevio =
                    sonidoActivoPorCabina[cabinaSeleccionada];

                // === Si había un sonido activo, enviamos STOP antes de cambiar ===
                if (sonidoPrevio && sonidoPrevio !== btn) {
                    const codigoPrevio =
                        sonidoPrevio.getAttribute("data-codigo");

                    // Detener el sonido anterior
                    enviarTrama(
                        cabinaPrefijo,
                        codigoSonidoControl.STOP,
                        true,
                    );
                    window.addSentLog(
                        `[STOP] ${cabinaPrefijo}${codigoSonidoControl.STOP}F`,
                    );

                    // Desactivar visualmente el sonido anterior
                    sonidoPrevio.classList.remove(
                        "bg-[#00bf63]",
                        "text-white",
                    );
                    sonidoPrevio.classList.add("bg-[#efefef]");
                    const iconoPrevio =
                        sonidoPrevio.querySelector(".text-green-800");
                    if (iconoPrevio) iconoPrevio.classList.add("hidden");

                    // Esperar 0.5 s antes de continuar
                    await new Promise((resolve) =>
                        setTimeout(resolve, 500),
                    );
                }

                // === Activar visualmente el nuevo sonido ===
                btn.classList.remove("bg-[#efefef]");
                btn.classList.add("bg-[#00bf63]", "text-white");
                const icono = btn.querySelector(".text-green-800");
                if (icono) icono.classList.remove("hidden");

                sonidoActivoPorCabina[cabinaSeleccionada] = btn;
                reproduciendoPorCabina[cabinaSeleccionada] = true;

                // === Enviar trama del nuevo sonido ===
                enviarTrama(cabinaPrefijo, codigo, true);
                window.addSentLog(
                    `[SELECCION SONIDO] ${cabinaPrefijo}${codigo}F`,
                );

                // Esperar 0.5 s y luego enviar PLAY
                await new Promise((resolve) => setTimeout(resolve, 500));
                enviarTrama(cabinaPrefijo, codigoSonidoControl.PLAY, true);
                window.addSentLog(
                    `[PLAY] ${cabinaPrefijo}${codigoSonidoControl.PLAY}F`,
                );

                // Habilitar controles de volumen
                actualizarEstadoVolumen(panel, true);
            });

            // Restaurar estado si corresponde
            const codigoActivo =
                sonidoActivoPorCabina[panelKey]?.getAttribute(
                    "data-codigo",
                );
            const esActivo = item.codigo === codigoActivo;
            if (esActivo) {
                btn.classList.remove("bg-[#efefef]");
                btn.classList.add("bg-[#00bf63]", "text-white");
                if (reproduciendoPorCabina[panelKey]) {
                    const icono = btn.querySelector(".text-green-800");
                    if (icono) icono.classList.remove("hidden");
                }
            }

            contenedor.appendChild(btn);
        });
    }

    // Cambio de sección (sonidos / tinitus)
    botonesSeccion.forEach((btn) => {
        btn.addEventListener("click", () => {
            botonesSeccion.forEach((b) =>
                b.classList.remove("bg-[#00bf63]", "text-white"),
            );
            btn.classList.add("bg-[#00bf63]", "text-white");
            const seccion = btn.getAttribute("data-seccion");
            mostrarSeccion(seccion);
        });
    });

    // Mostrar por defecto
    window.addEventListener("DOMContentLoaded", () => {
        const btnSonidos = panel.querySelector("#btn-sonidos");
        if (btnSonidos) {
            btnSonidos.classList.add("bg-[#00bf63]", "text-white");
            mostrarSeccion("sonidos");
        }

        const reproduciendo = reproduciendoPorCabina[cabinaSeleccionada];
        actualizarEstadoVolumen(panel, reproduciendo);
        restaurarSonidoActivo(panel);
    });

    // Actualizar cabina
    if (cabinaSelector) {
        cabinaSelector.addEventListener("change", () => {
            cabinaSeleccionada = cabinaSelector.value;
            const reproduciendo =
                reproduciendoPorCabina[cabinaSeleccionada];
            actualizarEstadoVolumen(panel, reproduciendo);

            const seccionActiva = botonesSeccion[0].classList.contains(
                "bg-[#00bf63]",
            )
                ? "sonidos"
                : "tinitus";
            mostrarSeccion(seccionActiva);
            restaurarSonidoActivo(panel);
        });
    }

    // STOP
    if (btnStop) {
        btnStop.addEventListener("click", () => {
            if (!cabinaActiva) {
                mostrarNotificacion(
                    "Por favor active la cabina antes de parar.",
                    "error",
                );
                return;
            }

            const cabinaSeleccionada = cabinaSelector.value;
            const cabinaPrefijo =
                cabinaSeleccionada === "Cabina 1" ? "C1" : "C2";

            enviarTrama(cabinaPrefijo, codigoSonidoControl.STOP, true);
            window.addSentLog(
                `[STOP] ${cabinaPrefijo}${codigoSonidoControl.STOP}F`,
            );

            reproduciendoPorCabina[cabinaSeleccionada] = false;
            actualizarEstadoVolumen(panel, false);

            const btnPlayActivo =
                botonPlayActivoPorCabina[cabinaSeleccionada];
            if (btnPlayActivo) {
                btnPlayActivo.classList.remove(
                    "bg-[#00bf63]",
                    "text-white",
                );
                btnPlayActivo.classList.add("bg-[#d9d9d9]");
                botonPlayActivoPorCabina[cabinaSeleccionada] = null;
            }
        });
    }

    // VMAS (+10)
    if (btnVmas) {
        btnVmas.addEventListener("click", () => {
            const cabinaSeleccionada = cabinaSelector.value;
            if (!reproduciendoPorCabina[cabinaSeleccionada]) return;

            const nuevoVolumen = Math.min(
                100,
                volumenPorCabina[cabinaSeleccionada] + 10,
            );
            volumenPorCabina[cabinaSeleccionada] = nuevoVolumen;
            actualizarBarraVolumen(panel, nuevoVolumen);

            const cabinaPrefijo =
                cabinaSeleccionada === "Cabina 1" ? "C1" : "C2";
            enviarTrama(cabinaPrefijo, codigoSonidoControl.VMAS, true);
            window.addSentLog(
                `[VMAS] ${cabinaPrefijo}${codigoSonidoControl.VMAS}F`,
            );

            btnVmas.classList.add("opacity-50");
            setTimeout(() => btnVmas.classList.remove("opacity-50"), 150);
        });
    }

    // VMEN (-10)
    if (btnVmen) {
        btnVmen.addEventListener("click", () => {
            const cabinaSeleccionada = cabinaSelector.value;
            if (!reproduciendoPorCabina[cabinaSeleccionada]) return;

            const nuevoVolumen = Math.max(
                0,
                volumenPorCabina[cabinaSeleccionada] - 10,
            );
            volumenPorCabina[cabinaSeleccionada] = nuevoVolumen;
            actualizarBarraVolumen(panel, nuevoVolumen);

            const cabinaPrefijo =
                cabinaSeleccionada === "Cabina 1" ? "C1" : "C2";
            enviarTrama(cabinaPrefijo, codigoSonidoControl.VMEN, true);
            window.addSentLog(
                `[VMEN] ${cabinaPrefijo}${codigoSonidoControl.VMEN}F`,
            );

            btnVmen.classList.add("opacity-50");
            setTimeout(() => btnVmen.classList.remove("opacity-50"), 150);
        });
    }

    // Inicializar con "sonidos"
    const btnSonidos = panel.querySelector("#btn-sonidos");
    if (btnSonidos) {
        btnSonidos.classList.add("bg-[#00bf63]", "text-white");
        mostrarSeccion("sonidos");
    }

    // Restaurar estado inicial
    const cabinaSeleccionadaInicial = cabinaSelector.value;
    actualizarEstadoVolumen(
        panel,
        reproduciendoPorCabina[cabinaSeleccionadaInicial],
    );
    actualizarBarraVolumen(
        panel,
        volumenPorCabina[cabinaSeleccionadaInicial],
    );
    restaurarSonidoActivo(panel);
}

/* *********************************************************************
********************* MANEJO DE PANELES (C1 & C2) **********************
********************************************************************* */
document.addEventListener("DOMContentLoaded", () => {
    const panels = document.querySelectorAll(".panel-container");

    panels.forEach((panel, index) => {
        // Botón Enviar Configuración - Inicia la cabina
        const btnIniciar = panel.querySelector("#btn-enviar-configuracion");
        const btnReset = panel.querySelector("#btn-parar-reset");

        const tabButtons = panel.querySelectorAll("[data-tab]");
        const tabContents = panel.querySelectorAll("[data-tab-content]");
        const selects = panel.querySelectorAll("select");
        const controlButtons = panel.querySelectorAll(".control-btn");
        const controlSoundButtons =
            panel.querySelectorAll(".sound-control-btn");
        const ledButtons = panel.querySelectorAll(".led-button");

        const sensorButtons = panel.querySelectorAll("button[data-sensor]");

        // Elementos de tiempo
        const btnIniciarTemporizador = panel.querySelector(
            "#btn-iniciar-temporizador",
        );
        const temporizadorBtnText = panel.querySelector(
            "#temporizador-btn-text",
        );
        const tiempoMostrado = panel.querySelector("#tiempo-mostrado");
        const botonDisparo = panel.querySelector(
            'button[data-codigo="DISPARO"]',
        ); // Botón de disparo

        // Elementos de estado visual
        const estadoCabina = panel.querySelector("#estado-cabina");
        const colorCabina = panel.querySelector("#color-cabina");
        const botonHumo = panel.querySelector('button[data-codigo="HUMO"]');
        const estadoHumo = panel.querySelector("#estado-humo");

        let cabinaActiva = false;
        let humoActivado = false;
        let temporizadorActivo = false;
        let tiempoRestante = 300; // 5 minutos en segundos
        let intervalo = null;

        // Selector de cabina por panel
        const selectCabina = panel.querySelector("[data-select='cabina']");
        let cabinaPrefijo = "C1"; // Valor inicial por panel

        let ledActivo = null;

        if (selectCabina) {
            selectCabina.addEventListener("change", () => {
                cabinaPrefijo =
                    selectCabina.value === "Cabina 1" ? "C1" : "C2";
                console.log(
                    `Panel ${index + 1}: Cabina seleccionada: ${cabinaPrefijo}`,
                );
            });
        }

        // Manejo de pestañas
        tabButtons.forEach((button) => {
            button.addEventListener("click", () => {
                tabButtons.forEach((btn) => {
                    btn.classList.remove(
                        "bg-[#00bf63]",
                        "text-black",
                        "active",
                    );
                    btn.classList.add("bg-[#efefef]", "text-black");
                    btn.setAttribute("aria-selected", "false");
                    btn.setAttribute("tabindex", "-1");
                });

                button.classList.remove("bg-[#efefef]", "text-black");
                button.classList.add(
                    "bg-[#d9d9d9]",
                    "text-black",
                    "active",
                );
                button.setAttribute("aria-selected", "true");
                button.setAttribute("tabindex", "0");

                tabContents.forEach((content) =>
                    content.classList.add("hidden"),
                );

                const selectedTab = button.getAttribute("data-tab");
                const selectedContent = panel.querySelector(
                    `[data-tab-content='${selectedTab}']`,
                );
                if (selectedContent) {
                    selectedContent.classList.remove("hidden");
                    if (selectedTab === "graficas") {
                        initGrafica(panel);
                    }
                }
            });
        });

        // Función para actualizar hover en pestañas
        function updateTabHover() {
            tabButtons.forEach((btn) => {
                if (btn.classList.contains("active")) {
                    btn.classList.remove("hover:bg-[#a6a6a6]");
                } else {
                    btn.classList.add("hover:bg-[#a6a6a6]");
                }
            });
        }

        // Función para actualizar hover en selectores
        function updateSelectHover() {
            selects.forEach((select) => {
                const isActive = select.value.includes("1");
                if (isActive) {
                    select.style.transition = "none";
                    select.style.backgroundColor =
                        window.getComputedStyle(select).backgroundColor;
                    select.classList.remove("hover:bg-[#a6a6a6]");
                } else {
                    select.style.transition = "";
                    select.style.backgroundColor = "";
                    select.classList.add("hover:bg-[#a6a6a6]");
                }
            });
        }

        // Eventos de cambio en selects
        selects.forEach((select) => {
            select.addEventListener("change", updateSelectHover);
        });

        // Solo un botón de control puede estar activo a la vez
        controlButtons.forEach((btn) => {
            btn.addEventListener("click", () => {
                const codigo = btn.getAttribute("data-codigo");
                const isActive = btn.classList.contains("bg-[#00bf63]");

                // Saltar el botón de DISPARO
                if (codigo === "DISPARO") {
                    return; // no agregar evento aquí
                }

                if (isActive) {
                    btn.classList.remove("bg-[#00bf63]");
                    btn.classList.add("bg-[#d9d9d9]");
                    if (codigo && codigoBoton[codigo]) {
                        enviarTrama(
                            cabinaPrefijo,
                            codigoBoton[codigo].off,
                            cabinaActiva,
                        );
                    }
                } else {
                    controlButtons.forEach((b) => {
                        const cod = b.getAttribute("data-codigo");
                        if (
                            b.classList.contains("bg-[#00bf63]") &&
                            cod &&
                            codigoBoton[cod]
                        ) {
                            b.classList.remove("bg-[#00bf63]");
                            b.classList.add("bg-[#d9d9d9]");
                            enviarTrama(
                                cabinaPrefijo,
                                codigoBoton[cod].off,
                                cabinaActiva,
                            );
                        }
                    });

                    btn.classList.remove("bg-[#d9d9d9]");
                    btn.classList.add("bg-[#00bf63]");
                    if (codigo && codigoBoton[codigo]) {
                        enviarTrama(
                            cabinaPrefijo,
                            codigoBoton[codigo].on,
                            cabinaActiva,
                        );
                    }
                }
            });
        });

        sensorButtons.forEach((btn) => {
            btn.addEventListener("click", () => {
                const sensorSeleccionado = btn.dataset.sensor;
                /*
                const selectSensor = panel.querySelector("[data-select='sensor']");
                if (selectSensor) {
                selectSensor.value = nuevoSensor;
                }
                */
                initGrafica(panel, sensorSeleccionado); // vuelve a graficar con el nuevo sensor
            });
        });

        // Lógica de control de botones de sonido
        controlSoundButtons.forEach((btn) => {
            btn.addEventListener("click", () => {
                const codigo = btn.getAttribute("data-sound-codigo");
                const cabinaSelector = panel.querySelector(
                    "[data-select='cabina']",
                );
                const cabinaSeleccionada =
                    cabinaSelector?.value || "Cabina 1";
                const cabinaPrefijo =
                    cabinaSeleccionada === "Cabina 1" ? "C1" : "C2";
                const sonidoActivo =
                    sonidoActivoPorCabina[cabinaSeleccionada];
                const icono =
                    sonidoActivo?.querySelector(".text-green-800");

                if (codigo === "PLAY") {
                    const isPlaying =
                        btn.classList.contains("bg-[#00bf63]");
                    if (isPlaying) {
                        btn.classList.remove("bg-[#00bf63]", "text-white");
                        btn.classList.add("bg-[#d9d9d9]");
                        enviarTrama(
                            cabinaPrefijo,
                            codigoSonidoControl.STOP,
                            true,
                        );
                        window.addSentLog(
                            `[STOP] ${cabinaPrefijo}${codigoSonidoControl.STOP}F`,
                        );
                        reproduciendoPorCabina[cabinaSeleccionada] = false;
                        if (icono) icono.classList.add("hidden");
                    } else {
                        btn.classList.remove("bg-[#d9d9d9]");
                        btn.classList.add("bg-[#00bf63]", "text-white");
                        enviarTrama(
                            cabinaPrefijo,
                            codigoSonidoControl.PLAY,
                            true,
                        );
                        window.addSentLog(
                            `[PLAY] ${cabinaPrefijo}${codigoSonidoControl.PLAY}F`,
                        );
                        reproduciendoPorCabina[cabinaSeleccionada] = true;
                        if (icono) icono.classList.remove("hidden");
                    }
                } else if (codigo === "VMAS" || codigo === "VMEN") {
                    const nuevoVolumen =
                        codigo === "VMAS"
                            ? Math.min(
                                100,
                                volumenPorCabina[cabinaSeleccionada] + 3,
                            )
                            : Math.max(
                                0,
                                volumenPorCabina[cabinaSeleccionada] - 3,
                            );

                    volumenPorCabina[cabinaSeleccionada] = nuevoVolumen;
                    actualizarBarraVolumen(panel, nuevoVolumen);

                    const trama = codigoSonidoControl[codigo];
                    enviarTrama(cabinaPrefijo, trama, true);
                    window.addSentLog(
                        `[${codigo}] ${cabinaPrefijo}${trama}F`,
                    );

                    btn.classList.add("opacity-50");
                    setTimeout(
                        () => btn.classList.remove("opacity-50"),
                        150,
                    );
                } else if (codigo === "STOP") {
                    btn.classList.add("opacity-50");
                    setTimeout(
                        () => btn.classList.remove("opacity-50"),
                        150,
                    );

                    enviarTrama(
                        cabinaPrefijo,
                        codigoSonidoControl.STOP,
                        true,
                    );
                    window.addSentLog(
                        `[STOP] ${cabinaPrefijo}${codigoSonidoControl.STOP}F`,
                    );

                    reproduciendoPorCabina[cabinaSeleccionada] = false;
                    actualizarEstadoVolumen(panel, false);

                    const btnPlay = panel.querySelector(
                        "[data-sound-codigo='PLAY']",
                    );
                    if (btnPlay) {
                        btnPlay.classList.remove(
                            "bg-[#00bf63]",
                            "text-white",
                        );
                        btnPlay.classList.add("bg-[#d9d9d9]");
                    }

                    if (icono) icono.classList.add("hidden");
                }
            });
        });

        // Solo un led puede estar activo a la vez
        ledButtons.forEach((button) => {
            button.addEventListener("click", () => {
                const codigo = button.getAttribute("data-codigo");
                const isActive = button.classList.contains("active-led");

                if (!codigo) return;

                if (isActive) {
                    button.classList.remove("active-led");
                    button.style.backgroundColor = button.getAttribute(
                        "data-inactive-color",
                    );
                    colorCabina.style.backgroundColor = "#d9d9d9";

                    enviarTrama(cabinaPrefijo, codigo, cabinaActiva);
                    ledActivo = null;
                } else {
                    if (ledActivo) {
                        const codAnterior =
                            ledActivo.getAttribute("data-codigo");
                        ledActivo.classList.remove("active-led");
                        ledActivo.style.backgroundColor =
                            ledActivo.getAttribute("data-inactive-color");
                        //viarTrama(
                        //  cabinaPrefijo,
                        //  codAnterior,
                        //  cabinaActiva,
                        //);
                    }

                    button.classList.add("active-led");
                    button.style.backgroundColor =
                        button.getAttribute("data-active-color");
                    colorCabina.style.backgroundColor =
                        button.getAttribute("data-active-color");
                    enviarTrama(cabinaPrefijo, codigo, cabinaActiva);

                    ledActivo = button;
                }
            });
        });

        if (btnIniciar && estadoCabina) {
            function actualizarEstadoBotonIniciar() {
                const activo = puertoSerialConectado;
                btnIniciar.disabled = !activo;
                btnIniciar.classList.toggle("opacity-50", !activo);
                btnIniciar.classList.toggle("cursor-not-allowed", !activo);
                btnIniciar.title = activo
                    ? ""
                    : "Conecte un puerto COM para iniciar la cabina";

                // También actualizamos el botón de reset
                if (btnReset) {
                    btnReset.disabled = !activo;
                    btnReset.classList.toggle("opacity-50", !activo);
                    btnReset.classList.toggle(
                        "cursor-not-allowed",
                        !activo,
                    );
                    btnReset.title = activo
                        ? ""
                        : "Conecte un puerto COM para usar esta función";
                }
            }

            // Escuchar cambios globales de conexión
            window.addEventListener("puertoConectado", () => {
                puertoSerialConectado = true;
                actualizarEstadoBotonIniciar();
            });

            window.addEventListener("puertoDesconectado", () => {
                puertoSerialConectado = false;
                actualizarEstadoBotonIniciar();
            });

            // Llamada inicial
            actualizarEstadoBotonIniciar();

            btnIniciar.addEventListener("click", () => {
                cabinaActiva = true; // ✅ ACTIVAMOS la cabina
                estadoCabina.classList.remove("bg-[#ff5757]");
                estadoCabina.classList.add("bg-[#00bf63]");
                estadoCabina.textContent = "ACTIVA";

                mostrarNotificacion("🚀 Cabina iniciada", "real");
            });
        }

        // Botón Parar y Reset - Reinicia todo
        if (btnReset && estadoCabina) {
            btnReset.addEventListener("click", async () => {
                if (
                    !puertoSerial ||
                    !puertoSerial.readable ||
                    !puertoSerial.writable
                ) {
                    alert(
                        "⚠️ No hay un puerto COM conectado. No se puede reiniciar la cabina.",
                    );
                    return;
                }

                estadoCabina.classList.remove("bg-[#00bf63]");
                estadoCabina.classList.add("bg-[#ff4d4d]");
                estadoCabina.textContent = "INACTIVA";
                cabinaActiva = false;

                // Enviar tramas de apagado para todos los LEDs activos
                if (ledActivo) {
                    const codAnterior =
                        ledActivo.getAttribute("data-codigo");
                    if (codAnterior) {
                        await enviarTrama(cabinaPrefijo, codAnterior, true); // Envío real
                    }
                    ledActivo.classList.remove("active-led");
                    ledActivo.style.backgroundColor =
                        ledActivo.getAttribute("data-inactive-color");
                    colorCabina.style.backgroundColor = "#d9d9d9";
                    ledActivo = null;
                }

                // Enviar trama OFF para cada botón activo
                controlButtons.forEach((btn) => {
                    const codigo = btn.getAttribute("data-codigo");
                    if (
                        btn.classList.contains("bg-[#00bf63]") &&
                        codigo &&
                        codigoBoton[codigo]
                    ) {
                        btn.classList.remove("bg-[#00bf63]");
                        btn.classList.add("bg-[#d9d9d9]");
                        enviarTrama(
                            cabinaPrefijo,
                            codigoBoton[codigo].off,
                            true,
                        );
                    }
                });

                // Enviar trama STOP (038) a ambos paneles
                const panels =
                    document.querySelectorAll(".panel-container");
                panels.forEach(async (panel) => {
                    const selectCabina = panel.querySelector(
                        "[data-select='cabina']",
                    );
                    const cabinaSeleccionada =
                        selectCabina?.value || "Cabina 1";
                    const cabinaPrefijo =
                        cabinaSeleccionada === "Cabina 1" ? "C1" : "C2";

                    // Enviar trama STOP
                    const tramaStop = `${cabinaPrefijo}${TRAMA_STOP}F`;
                    enviarTrama("", "", false, tramaStop);
                    window.addSentLog(`[STOP] ${tramaStop}`);

                    // Desactivar visualmente sonidos en este panel
                    const btnActivo =
                        sonidoActivoPorCabina[cabinaSeleccionada];
                    if (btnActivo) {
                        btnActivo.classList.remove(
                            "bg-[#00bf63]",
                            "text-white",
                        );
                        btnActivo.classList.add("bg-[#efefef]");
                    }
                });

                const graficaCanvas = panel.querySelector("#graficaPanel");
                if (graficaCanvas && graficaCanvas.chartInstance) {
                    graficaCanvas.chartInstance.destroy();
                }

                const medicionTextos =
                    panel.querySelectorAll(".medicion-texto");
                medicionTextos.forEach((txt) => {
                    txt.textContent = "N/A";
                });

                ledButtons.forEach((led) => {
                    led.classList.remove("active-led");
                    led.style.backgroundColor = led.getAttribute(
                        "data-inactive-color",
                    );
                });

                if (ledActivo) {
                    ledActivo = null;
                    colorCabina.style.backgroundColor = "#d9d9d9";
                }

                // Limpiar estado de sonido
                const cabinaSeleccionada = cabinaSelector.value;
                sonidoActivoPorCabina[cabinaSeleccionada] = null;

                alert("Sistema detenido. Todo ha sido reiniciado.");
            });
        }

        // Formatea segundos a MM:SS
        const formatearTiempo = (segundos) => {
            const mins = Math.floor(segundos / 60)
                .toString()
                .padStart(2, "0");
            const secs = (segundos % 60).toString().padStart(2, "0");
            return `${mins}:${secs}`;
        };

        // Actualiza el estado visual y lógico del botón de disparo
        const actualizarEstadoBotonHumo = (activado) => {
            if (activado) {
                botonHumo.classList.remove("bg-[#d9d9d9]");
                botonHumo.classList.add("bg-[#00bf63]");
                botonHumo.setAttribute("aria-pressed", "true");
            } else {
                botonHumo.classList.remove("bg-[#00bf63]");
                botonHumo.classList.add("bg-[#d9d9d9]");
                botonHumo.setAttribute("aria-pressed", "false");
            }
        };

        // Envía la trama correspondiente al estado del botón
        const enviarTramaHumo = (encendido) => {
            const codigo = encendido
                ? codigoBoton.HUMO.on
                : codigoBoton.HUMO.off;
            enviarTrama(cabinaPrefijo, codigo, cabinaActiva);
        };

        // Desactiva calentamiento (solo si se requiere manualmente)
        const desactivarHumo = (enviarTramaAlDesactivar = true) => {
            if (!botonHumo) return;

            actualizarEstadoBotonHumo(false);

            // Solo enviar trama si se indica
            if (enviarTramaAlDesactivar) {
                enviarTramaHumo(false); // Enviar trama OFF
            }

            if (intervalo) {
                clearInterval(intervalo);
                intervalo = null;
            }

            temporizadorActivo = false;
            actualizarEstadoBoton(); // Actualiza el botón de temporizador
        };

        // Inicia el temporizador y activa el botón de disparo
        const activarHumo = () => {
            if (!cabinaActiva) {
                alert(
                    "La cabina debe estar activa antes de usar esta función.",
                );
                return false;
            }

            if (intervalo) clearInterval(intervalo);

            actualizarEstadoBotonHumo(true);
            enviarTramaHumo(true);

            tiempoRestante = 300; // 5 minutos
            tiempoMostrado.textContent = formatearTiempo(tiempoRestante);

            temporizadorActivo = true;
            actualizarEstadoBoton();

            intervalo = setInterval(() => {
                tiempoRestante--;
                tiempoMostrado.textContent =
                    formatearTiempo(tiempoRestante);

                if (tiempoRestante <= 0) {
                    clearInterval(intervalo);
                    intervalo = null;
                    temporizadorActivo = false;
                    actualizarEstadoBoton();

                    // ⚠️ No se desactiva el humo ni se envía OFF
                    // Solo se notifica que está lista
                    new Audio("/sounds/alarm.mp3").play();
                    alert("✅ Máquina de humo lista para disparar.");
                }
            }, 1000);

            return true;
        };

        // Actualiza el estado del botón de control del temporizador
        const actualizarEstadoBoton = () => {
            if (temporizadorActivo) {
                temporizadorBtnText.textContent = "Reiniciar";
            } else {
                temporizadorBtnText.textContent = "Iniciar 5 min";
            }
        };

        // Botón de control del temporizador (Iniciar/Reiniciar)
        if (btnIniciarTemporizador) {
            btnIniciarTemporizador.addEventListener("click", () => {
                if (temporizadorActivo) {
                    // Reinicia el calentamiento y el temporizador
                    desactivarHumo(false); // no apaga la máquina
                    activarHumo();
                } else {
                    activarHumo();
                }
            });
        }

        // Botón de Humo: activa el calentamiento con temporizador
        if (botonHumo) {
            botonHumo.addEventListener("click", () => {
                // Si ya está activo, no hace nada (solo puede activarse por botón de control)
                if (temporizadorActivo) return;

                // Intenta activar el disparo
                activarHumo();
            });
        }

        // Botón Disparo: controla salida de humo (solo si máquina caliente)
        if (botonDisparo && estadoHumo) {
            botonDisparo.addEventListener("click", () => {
                if (!cabinaActiva) {
                    alert(
                        "La cabina debe estar activa antes de usar esta función.",
                    );
                    return;
                }

                // Se permite disparar si el botón de humo está activo
                const humoCalentando =
                    botonHumo.getAttribute("aria-pressed") === "true";
                if (!humoCalentando) {
                    alert(
                        "Primero debes calentar la máquina de humo (botón Humo).",
                    );
                    return;
                }

                // Cambiar estado del humo (disparo)
                humoActivado = !humoActivado;

                if (humoActivado) {
                    estadoHumo.classList.remove(
                        "bg-[#ff5757]",
                        "opacity-50",
                    );
                    estadoHumo.classList.add("bg-[#00bf63]", "opacity-100");
                    enviarTrama(
                        cabinaPrefijo,
                        codigoBoton.DISPARO.on,
                        cabinaActiva,
                    );
                } else {
                    estadoHumo.classList.remove(
                        "bg-[#00bf63]",
                        "opacity-100",
                    );
                    estadoHumo.classList.add("bg-[#ff5757]", "opacity-50");
                    enviarTrama(
                        cabinaPrefijo,
                        codigoBoton.DISPARO.off,
                        cabinaActiva,
                    );
                }
            });
        }

        // Inicializar estado
        actualizarEstadoBoton();
        actualizarEstadoBotonHumo(false);

        // Manejo de botones de medición
        const medicionBotones = panel.querySelectorAll(".medicion-btn");
        const medicionTextos = panel.querySelectorAll(".medicion-texto");

        if (medicionBotones.length > 0 && medicionTextos.length > 0) {
            medicionBotones.forEach((boton, index) => {
                boton.addEventListener("click", () => {
                    if (!cabinaActiva) {
                        alert(
                            "Por favor, inicie la cabina antes de usar las mediciones.",
                        );
                        return;
                    }

                    // Desactivar otros botones de medición
                    medicionBotones.forEach((btn, i) => {
                        if (btn !== boton) {
                            btn.classList.remove("activo", "bg-[#00bf63]");
                            btn.classList.add("bg-[#d9d9d9]");
                            medicionTextos[i].textContent = "N/A";
                        }
                    });

                    // Activar este botón y mostrar dato simulado
                    boton.classList.remove("bg-[#d9d9d9]");
                    boton.classList.add("bg-[#00bf63]", "activo");

                    const nombre = boton.dataset.medicion;
                    const textoElemento = medicionTextos[index];
                    const valorSimulado = (Math.random() * 10).toFixed(1);
                    textoElemento.textContent = `${valorSimulado} ${getUnidad(nombre)}`;
                });
            });
        }

        setTimeout(updateTabHover, 0);
        setTimeout(updateSelectHover, 0);
    });
});
