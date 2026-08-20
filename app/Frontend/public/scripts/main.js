/* *********************************************************************
*************** IMPORTAR VARIABLES Y CONSTANTES GLOBALES ***************
********************************************************************* */
if (!window.codigoBoton) {
    console.warn("[main.js] globals.js no se ha cargado. Cargando dinámicamente...");
    const script = document.createElement("script");
    script.src = "/scripts/globals.js";
    script.onload = () => console.log("[main.js] globals.js cargado correctamente");
    document.head.insertBefore(script, document.head.firstChild);
}

/* *********************************************************************
************************** CARGAR SCRIPTS GLOBALES **********************
********************************************************************* */
// Cargar excelExport.js dinámicamente
const scriptExcelExport = document.createElement('script');
scriptExcelExport.src = '/scripts/excelExport.js';
scriptExcelExport.type = 'text/javascript';
document.head.appendChild(scriptExcelExport);

/* *********************************************************************
********************** INICIALIZACIÓN DE EVENTOS ***********************
********************************************************************* */
window.addEventListener("DOMContentLoaded", () => {
    console.log("[main.js] DOM cargado, inicializando aplicación...");
    if (typeof window.inicializarApp === "function") {
        window.inicializarApp();
    } else {
        console.error("[main.js] window.inicializarApp no está definida");
    }

    const actualizarIndicadoresContinuo = () => {
        if (typeof window.fetchDatosPorCabina === "function") {
            window.fetchDatosPorCabina("C1");
            window.fetchDatosPorCabina("C2");
        }
    };
    
    // Ejecutar inmediatamente y luego cada 3 segundos
    actualizarIndicadoresContinuo();
    setInterval(actualizarIndicadoresContinuo, 3000);
});

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
        const panelCabin = getCabinFromPanel(panel);
        if (target === "biometria" && biometricWatchConnectedByCabin[panelCabin] && !biometricChartsEnabled) {
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

function normalizeCabin(cabin) {
    const value = (cabin || "C1").toString().trim().toUpperCase();
    return value === "C2" ? "C2" : "C1";
}

function getCabinFromPanel(panel) {
    if (!panel) return "C1";

    const selector = panel.querySelector("[data-select='cabina']");
    if (selector?.value?.includes("2")) return "C2";
    return "C1";
}

function getPanelByCabin(cabin) {
    const targetCabin = normalizeCabin(cabin);
    const panels = document.querySelectorAll(".panel-container");
    for (const panel of panels) {
        if (getCabinFromPanel(panel) === targetCabin) return panel;
    }
    return null;
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

        // Auto-reconexión: verificar si hay un puerto guardado
        const puertoGuardado = localStorage.getItem("lastConnectedPort");
        if (puertoGuardado && puertos.includes(puertoGuardado)) {
            console.log(`[Auto-reconexión] Puerto guardado encontrado: ${puertoGuardado}`);
            selector.value = puertoGuardado;
            // Conectar automáticamente después de un breve delay
            setTimeout(() => {
                conectarPuertoSerial();
            }, 500);
        }
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

        // Guardar el puerto conectado en localStorage
        localStorage.setItem("lastConnectedPort", port);
        console.log(`[Auto-reconexión] Puerto guardado: ${port}`);

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

        // Limpiar el puerto guardado al desconectar manualmente
        localStorage.removeItem("lastConnectedPort");
        console.log("[Auto-reconexión] Puerto guardado eliminado (desconexión manual)");

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

        if (data && Array.isArray(data) && data.length > 0) {
            // Tomar última lectura (la más reciente)
            const ultimaLectura = data[data.length - 1];

            // Mapear claves del backend a identificadores de sensores
            const datos = {
                X: ultimaLectura.x,
                Y: ultimaLectura.y,
                Z: ultimaLectura.z,
                T: ultimaLectura.t,
                H: ultimaLectura.h,
                UV: ultimaLectura.uv,
                CO2: ultimaLectura.cO2,
                O3: ultimaLectura.o3,
                dB: ultimaLectura.dB
            };

            Object.entries(datos).forEach(([clave, valor]) => {
                if (valor !== undefined && valor !== null) {
                    updateIndicador(clave, valor, cabina);
                }
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

    console.log(`[Gráfica] Inicializando gráfica para sensor: ${sensor}`);

    if (graficaCanvas.updateInterval) {
        clearInterval(graficaCanvas.updateInterval);
        console.log(`[Gráfica] Intervalo anterior limpiado al inicio de initGrafica`);
    }

    const selectCabina = panel.querySelector("[data-select='cabina']");
    const cabina = selectCabina?.value.includes("1") ? "c1" : "c2";

    console.log(`[Gráfica] Cabina seleccionada: ${cabina}`);

    try {
        // Obtener datos iniciales
        const response = await fetch(
            `http://localhost:5000/api/serial/datos/${cabina}`,
        );
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

        const datos = await response.json();
        if (!Array.isArray(datos) || datos.length === 0) {
            console.warn(`[Gráfica] Sin datos disponibles para ${cabina.toUpperCase()}. Usa el botón de refrescar cuando el uC esté enviando datos.`);
            return;
        }

        const maxPuntos = 10;
        const datosLimitados = datos.length > maxPuntos 
            ? datos.slice(datos.length - maxPuntos) 
            : datos;
        
        const indiceInicio = datos.length > maxPuntos 
            ? datos.length - maxPuntos 
            : 0;

        const labels = datosLimitados.map((_, i) => `${indiceInicio + i + 1}`);
        const valores = datosLimitados.map((d) => {
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

        console.log(`[Gráfica] Mostrando ${valores.length} puntos iniciales (máx: ${maxPuntos})`);

        const existingChart = Chart.getChart(graficaCanvas);
        if (existingChart) {
            existingChart.destroy();
            console.log(`[Gráfica] Chart anterior destruido`);
        }
        
        // Limpiar referencias antiguas
        if (graficaCanvas.chartInstance) {
            graficaCanvas.chartInstance = null;
        }

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
                        tension: 0,
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

        // Limpiar intervalo anterior si existe para evitar múltiples intervalos simultáneos
        if (graficaCanvas.updateInterval) {
            clearInterval(graficaCanvas.updateInterval);
            console.log(`[Gráfica] Intervalo anterior limpiado para sensor ${sensor}`);
        }

        // Intervalo para actualizar cada 2 segundos
        graficaCanvas.updateInterval = setInterval(async () => {
            try {
                // Si el sensor cambió, detener este intervalo
                if (graficaCanvas.sensor !== sensor) {
                    clearInterval(graficaCanvas.updateInterval);
                    console.log(`[Gráfica] Sensor cambió de ${sensor} a ${graficaCanvas.sensor}, deteniendo intervalo`);
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

                    // Limitar a últimos 10 puntos para evitar sobrecarga
                    const maxPuntos = 10;
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

                    console.log(`[Gráfica] Actualización: mostrando ${valoresFinales.length}/${todosDatos.length} puntos (sensor: ${sensor})`);

                    // 🔹 Actualizar contador
                    graficaCanvas.lastDataCount = todosDatos.length;

                    // 🔹 Actualizar visualmente
                    chart.update("none"); // "none" evita animaciones
                }
            } catch (error) {
                console.error("Error al actualizar la gráfica:", error);
            }
        }, 2000);

        console.log(`[Gráfica] ✅ Gráfica inicializada para sensor ${sensor}, intervalo activo cada 2s`);
    } catch (error) {
        console.error("Error al cargar datos de sensor:", error);
        alert("No se pudieron cargar datos desde el backend.");
    }
}

// Obtiene datos de sensores de una cabina específica
async function getSensorData(cabina) {
    try {
        const response = await fetch(`http://localhost:5000/api/serial/datos/${cabina}`);
        if (!response.ok) return {};
        
        const data = await response.json();
        // Normalizar claves a mayúsculas
        const normalized = {};
        if (data.datos) {
            Object.entries(data.datos).forEach(([key, value]) => {
                normalized[key.toUpperCase()] = value;
            });
        }
        return normalized;
    } catch (error) {
        console.warn("[Excel Export] Error obteniendo datos de sensores:", error);
        return {};
    }
}

// Obtiene historial biométrico
async function getBiometricHistory(cabin = "C1") {
    const normalizedCabin = normalizeCabin(cabin);
    try {
        const response = await fetch(`http://localhost:5000/api/smartwatch/vitals/history?cabin=${normalizedCabin}`);
        if (!response.ok) return [];
        
        const result = await response.json();
        return result.success && result.data ? result.data : [];
    } catch (error) {
        console.warn("[Excel Export] Error obteniendo historial biométrico:", error);
        return [];
    }
}

// Funciones para interactuar con el backend del smartwatch
async function fetchLatestBiometricData(cabin = "C1") {
    const normalizedCabin = normalizeCabin(cabin);
    try {
        const response = await fetch(`http://localhost:5000/api/Smartwatch/vitals/latest?cabin=${normalizedCabin}`);
        if (!response.ok) return null;

        const payload = await response.json();
        if (!payload?.success || !payload?.data) return null;

        // Para BP, usamos la sistólica (más importante para la gráfica)
        const bloodPressure = payload.data.systolic ?? null;

        return {
            pulse: payload.data.pulseBpm ?? null,
            oxygen: payload.data.spO2 ?? null,
            temperature: payload.data.temperatureC ?? null,
            bloodPressure: bloodPressure,
            timestampUtc: payload.data.timestampUtc ?? null,
        };
    } catch (error) {
        console.warn("[BiometricCharts] No se pudo obtener datos del backend:", error);
        return null;
    }
}

async function fetchBiometricHistory(limit = 10, cabin = "C1") {
    const normalizedCabin = normalizeCabin(cabin);
    try {
        const response = await fetch(`http://localhost:5000/api/Smartwatch/vitals/history?cabin=${normalizedCabin}&limit=${limit}`);
        if (!response.ok) return [];

        const payload = await response.json();
        if (!payload?.success || !Array.isArray(payload?.data)) return [];

        return payload.data;
    } catch (error) {
        console.warn("[BiometricCharts] No se pudo obtener historial del backend:", error);
        return [];
    }
}

async function requestBpmMeasurement(source = "ui", cabin = "C1") {
    const normalizedCabin = normalizeCabin(cabin);
    if (!biometricWatchConnectedByCabin[normalizedCabin]) {
        console.warn("[BiometricCharts] Reloj no conectado. No se puede iniciar BPM");
        return;
    }

    const now = Date.now();
    if (now - biometricLastRequestByCabin[normalizedCabin].bpm < BIOMETRIC_REQUEST_COOLDOWN_MS) {
        console.log("[BiometricCharts] ⏳ Ignorando solicitud BPM por cooldown");
        return;
    }

    biometricLastRequestByCabin[normalizedCabin].bpm = now;

    console.log(`[BiometricCharts] Solicitando medición BPM (source=${source}, cabin=${normalizedCabin})`);
    window.addSentLog?.(`[SMARTWATCH][${normalizedCabin}] POST /api/smartwatch/vitals/start-bpm`);

    try {
        const response = await fetch(`http://localhost:5000/api/smartwatch/vitals/start-bpm?cabin=${normalizedCabin}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });

        const data = await response.json().catch(() => ({}));
        window.addReceivedLog?.(`[SMARTWATCH] Response Status: ${response.status}\nPayload: ${JSON.stringify(data, null, 2)}`);

        if (!response.ok || !data.success) {
            throw new Error(data.message || "No se pudo iniciar medición de BPM");
        }

        window.mostrarNotificacion?.("Medición de BPM iniciada", { tipo: "success" });
    } catch (error) {
        const mensaje = error?.message || "No se pudo iniciar medición de BPM";
        console.warn("[BiometricCharts] Error iniciando BPM:", error);
        window.mostrarNotificacion?.(mensaje, { tipo: "error" });
    }
}

async function requestSpo2Measurement(source = "ui", cabin = "C1") {
    const normalizedCabin = normalizeCabin(cabin);
    if (!biometricWatchConnectedByCabin[normalizedCabin]) {
        console.warn("[BiometricCharts] Reloj no conectado. No se puede iniciar SpO2");
        return;
    }

    const now = Date.now();
    if (now - biometricLastRequestByCabin[normalizedCabin].spo2 < BIOMETRIC_REQUEST_COOLDOWN_MS) {
        console.log("[BiometricCharts] ⏳ Ignorando solicitud SpO2 por cooldown");
        return;
    }

    biometricLastRequestByCabin[normalizedCabin].spo2 = now;

    console.log(`[BiometricCharts] Solicitando medición SpO2 (source=${source}, cabin=${normalizedCabin})`);
    window.addSentLog?.(`[SMARTWATCH][${normalizedCabin}] POST /api/smartwatch/vitals/start-spo2`);

    try {
        const response = await fetch(`http://localhost:5000/api/smartwatch/vitals/start-spo2?cabin=${normalizedCabin}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });

        const data = await response.json().catch(() => ({}));
        window.addReceivedLog?.(`[SMARTWATCH] Response Status: ${response.status}\nPayload: ${JSON.stringify(data, null, 2)}`);

        if (!response.ok || !data.success) {
            throw new Error(data.message || "No se pudo iniciar medición de SpO2");
        }

        window.mostrarNotificacion?.("Medición de SpO2 iniciada", { tipo: "success" });
    } catch (error) {
        const mensaje = error?.message || "No se pudo iniciar medición de SpO2";
        console.warn("[BiometricCharts] Error iniciando SpO2:", error);
        window.mostrarNotificacion?.(mensaje, { tipo: "error" });
    }
}

async function requestTemperatureMeasurement(source = "ui", cabin = "C1") {
    const normalizedCabin = normalizeCabin(cabin);
    if (!biometricWatchConnectedByCabin[normalizedCabin]) {
        console.warn("[BiometricCharts] Reloj no conectado. No se puede iniciar Temperatura");
        return;
    }

    const now = Date.now();
    if (now - biometricLastRequestByCabin[normalizedCabin].temperature < BIOMETRIC_REQUEST_COOLDOWN_MS) {
        console.log("[BiometricCharts] ⏳ Ignorando solicitud Temperatura por cooldown");
        return;
    }

    biometricLastRequestByCabin[normalizedCabin].temperature = now;

    console.log(`[BiometricCharts] Solicitando medición Temperatura (source=${source}, cabin=${normalizedCabin})`);
    window.addSentLog?.(`[SMARTWATCH][${normalizedCabin}] POST /api/smartwatch/vitals/start-temperature`);

    try {
        const response = await fetch(`http://localhost:5000/api/smartwatch/vitals/start-temperature?cabin=${normalizedCabin}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });

        const data = await response.json().catch(() => ({}));
        window.addReceivedLog?.(`[SMARTWATCH] Response Status: ${response.status}\nPayload: ${JSON.stringify(data, null, 2)}`);

        if (!response.ok || !data.success) {
            throw new Error(data.message || "No se pudo iniciar medición de Temperatura");
        }

        window.mostrarNotificacion?.("Medición de Temperatura iniciada", { tipo: "success" });
    } catch (error) {
        const mensaje = error?.message || "No se pudo iniciar medición de Temperatura";
        console.warn("[BiometricCharts] Error iniciando Temperatura:", error);
        window.mostrarNotificacion?.(mensaje, { tipo: "error" });
    }
}

async function requestBloodPressureMeasurement(source = "ui", cabin = "C1") {
    const normalizedCabin = normalizeCabin(cabin);
    if (!biometricWatchConnectedByCabin[normalizedCabin]) {
        console.warn("[BiometricCharts] Reloj no conectado. No se puede iniciar Presión Arterial");
        return;
    }

    const now = Date.now();
    if (now - biometricLastRequestByCabin[normalizedCabin].bloodPressure < BIOMETRIC_REQUEST_COOLDOWN_MS) {
        console.log("[BiometricCharts] ⏳ Ignorando solicitud Presión Arterial por cooldown");
        return;
    }

    biometricLastRequestByCabin[normalizedCabin].bloodPressure = now;

    console.log(`[BiometricCharts] Solicitando medición Presión Arterial (source=${source}, cabin=${normalizedCabin})`);
    window.addSentLog?.(`[SMARTWATCH][${normalizedCabin}] POST /api/smartwatch/vitals/start-bloodpressure`);

    try {
        const response = await fetch(`http://localhost:5000/api/smartwatch/vitals/start-bloodpressure?cabin=${normalizedCabin}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });

        const data = await response.json().catch(() => ({}));
        window.addReceivedLog?.(`[SMARTWATCH] Response Status: ${response.status}\nPayload: ${JSON.stringify(data, null, 2)}`);

        if (!response.ok || !data.success) {
            throw new Error(data.message || "No se pudo iniciar medición de Presión Arterial");
        }

        window.mostrarNotificacion?.("Medición de Presión Arterial iniciada", { tipo: "success" });
    } catch (error) {
        const mensaje = error?.message || "No se pudo iniciar medición de Presión Arterial";
        console.warn("[BiometricCharts] Error iniciando Presión Arterial:", error);
        window.mostrarNotificacion?.(mensaje, { tipo: "error" });
    }
}

// Función para verificar el estado de monitoreo y mostrar notificación cuando termine
async function checkMonitoringStatus(cabin = "C1") {
    const normalizedCabin = normalizeCabin(cabin);
    if (!biometricWatchConnectedByCabin[normalizedCabin]) return;

    try {
        const response = await fetch(`http://localhost:5000/api/smartwatch/vitals/monitoring-status?cabin=${normalizedCabin}`);
        if (!response.ok) {
            console.warn("[BiometricCharts] Error en monitoring-status:", response.status);
            return;
        }

        const result = await response.json();
        if (!result.success || !result.status) {
            console.warn("[BiometricCharts] Respuesta inválida de monitoring-status");
            return;
        }

        const { activeMeasurementType } = result.status;
        const previousActive = biometricPreviousActiveMeasurementByCabin[normalizedCabin];
        const currentActive = biometricCurrentActiveMeasurementByCabin[normalizedCabin];
        const alreadyNotified = biometricMeasurementCompletionNotifiedByCabin[normalizedCabin];
        
        console.log(`[BiometricCharts] Estado (${normalizedCabin}): previo=${previousActive}, actual=${currentActive}, nuevo=${activeMeasurementType}`);
        
        // Detectar cuando una medición INICIA (cambio de null a una métrica)
        if (!currentActive && activeMeasurementType) {
            biometricMeasurementCompletionNotifiedByCabin[normalizedCabin] = false;
            console.log(`[BiometricCharts] Nueva medición iniciada: ${activeMeasurementType}`);
        }
        
        // Detectar cuando una medición TERMINA (cambio de una métrica a null)
        // Y evitar múltiples notificaciones con la flag
        if (currentActive && !activeMeasurementType && !alreadyNotified) {
            // Una medición acaba de terminar
            const measurementNames = {
                'bpm': 'Pulso',
                'spo2': 'Oxigenación',
                'temperature': 'Temperatura',
                'bloodPressure': 'Presión Arterial'
            };
            const completedName = measurementNames[currentActive] || currentActive;
            
            console.log(`[BiometricCharts] ✅ Medición de ${completedName} completada!`);
            biometricMeasurementCompletionNotifiedByCabin[normalizedCabin] = true;

            // Mostrar notificación en el log de tramas
            mostrarNotificacion(
                `Medición de ${completedName} completada en ${normalizedCabin}. Ahora puedes cambiar de métrica.`,
                { tipo: "info" }
            );

            // En modo automático NO mostrar alert para no interrumpir el ciclo;
            // en cualquier otro modo sí notificar al usuario.
            if (biometricModeByCabin[normalizedCabin] !== 'auto') {
                alert(`✅ Medición de ${completedName} completada!\n\nAhora puedes cambiar de métrica.`);
            } else {
                window.showToast?.(`✅ ${completedName} completado`, 'success');
            }

            // Re-poblar la gráfica con el historial real y sus timestamps correctos
            try {
                await window.seedBiometricHistory(null, normalizedCabin);
            } catch (error) {
                console.warn("[BiometricCharts] Error re-seeding gráfica después de medición:", error);
            }

            // Actualizar TopMetricsGrid con los últimos datos medidos
            try {
                const latestData = await fetchLatestBiometricData(normalizedCabin);
                if (latestData) {
                    updateTopMetricsGrid(latestData, normalizedCabin);
                }
            } catch (error) {
                console.warn("[BiometricCharts] Error actualizando TopMetricsGrid después de medición:", error);
            }

            // Registrar la última métrica completada para reanudar el ciclo auto desde el punto correcto
            biometricLastCompletedMetricByCabin[normalizedCabin] = currentActive;

            // Habilitar botones de modo tras la primera medición BPM completada
            if (currentActive === 'bpm' && !biometricFirstMeasurementDoneByCabin[normalizedCabin]) {
                biometricFirstMeasurementDoneByCabin[normalizedCabin] = true;
                window.enableBiometricModeButtons?.(normalizedCabin);
                window.showToast?.('✅ Primera medición lista. Puedes activar el modo Automático o Por Evento.', 'success');
            }

            // Si está en modo automático, encadenar la siguiente medición del ciclo
            if (biometricModeByCabin[normalizedCabin] === 'auto') {
                await window.runNextAutoStep?.(normalizedCabin, currentActive);
            }
            
            setBiometricSelectorEnabled(normalizedCabin, true);
        }

        // Actualizar estado actual (SIEMPRE)
        biometricPreviousActiveMeasurementByCabin[normalizedCabin] = currentActive;
        biometricCurrentActiveMeasurementByCabin[normalizedCabin] = activeMeasurementType;

        // Deshabilitar selector mientras hay una medición activa, habilitar cuando termina
        setBiometricSelectorEnabled(normalizedCabin, !activeMeasurementType);
    } catch (error) {
        console.warn("[BiometricCharts] Error al verificar estado de monitoreo:", error);
    }
}

async function seedBiometricHistory(metricConfigs, cabin = "C1") {
    const normalizedCabin = normalizeCabin(cabin);
    const history = await fetchBiometricHistory(10, normalizedCabin);
    if (!history.length) return;

    biometricChartDataByCabin[normalizedCabin].pulse = history.map((item) => item.pulseBpm ?? null);
    biometricChartDataByCabin[normalizedCabin].oxygen = history.map((item) => item.spO2 ?? null);
    biometricChartDataByCabin[normalizedCabin].temperature = history.map((item) => item.temperatureC ?? null);
    biometricChartDataByCabin[normalizedCabin].bloodPressure = history.map((item) => item.systolic ?? null);

    // Usar timestamps reales del historial en lugar de labels ficticias
    const realLabels = history.map((item) =>
        item.timestampUtc ? new Date(item.timestampUtc).toLocaleTimeString() : '—'
    );
    biometricChartDataByCabin[normalizedCabin].labels = realLabels;
    biometricLastTimestampByCabin[normalizedCabin] = history[history.length - 1]?.timestampUtc ?? null;

    // Actualizar TODAS las gráficas activas (una por canvas)
    Object.keys(biometricChartInstances).forEach(key => {
        const chart = biometricChartInstances[key];
        if (!chart) return;

        const parts = key.split('_');
        const metric = parts[0];
        const canvasIndex = Number(parts[1]);
        const canvases = document.querySelectorAll(".biometric-chart");
        const panel = canvases[canvasIndex]?.closest(".panel-container");
        const panelCabin = getCabinFromPanel(panel);
        if (panelCabin !== normalizedCabin) return;

        if (!biometricChartDataByCabin[normalizedCabin][metric]) return;

        chart.data.labels = [...realLabels];
        chart.data.datasets[0].data = [...biometricChartDataByCabin[normalizedCabin][metric]];

        // Actualizar estilos solo si se proveen metricConfigs (llamada de inicialización)
        if (metricConfigs?.[metric]) {
            const config = metricConfigs[metric];
            chart.data.datasets[0].label = config.label;
            chart.data.datasets[0].borderColor = config.borderColor;
            chart.data.datasets[0].backgroundColor = config.bgColor;
            chart.options.scales.y.min = config.yScale.min;
            chart.options.scales.y.max = config.yScale.max;
        }

        chart.update();
        console.log(`[BiometricCharts] Historial cargado para ${key}`);
    });
    
    // Actualizar TopMetricsGrid con el último valor del historial
    if (history.length > 0) {
        const latestItem = history[history.length - 1];
        updateTopMetricsGrid({
            pulse: latestItem.pulseBpm,
            oxygen: latestItem.spO2,
            temperature: latestItem.temperatureC,
            bloodPressure: latestItem.systolic
        }, normalizedCabin);
    }
}

// ── Excel: paleta de colores y estilos ───────────────────────────────────────
const _XL_THIN_BORDER = { style: 'thin', color: { rgb: 'B0BEC5' } };
const _XL_BD = { top: _XL_THIN_BORDER, bottom: _XL_THIN_BORDER, left: _XL_THIN_BORDER, right: _XL_THIN_BORDER };

const _XL_S = {
    title:   { font: { bold: true, sz: 13, color: { rgb: 'FFFFFF' }, name: 'Calibri' },
               fill: { patternType: 'solid', fgColor: { rgb: '1F497D' } },
               alignment: { horizontal: 'center', vertical: 'center' } },

    section: { font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' }, name: 'Calibri' },
               fill: { patternType: 'solid', fgColor: { rgb: '2E75B6' } },
               alignment: { horizontal: 'left', vertical: 'center' } },

    header:  { font: { bold: true, sz: 10, color: { rgb: '1F3864' }, name: 'Calibri' },
               fill: { patternType: 'solid', fgColor: { rgb: 'BDD7EE' } },
               alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
               border: _XL_BD },

    data:    { font: { sz: 10, name: 'Calibri' },
               fill: { patternType: 'solid', fgColor: { rgb: 'FFFFFF' } },
               alignment: { horizontal: 'left', vertical: 'center' },
               border: _XL_BD },

    dataalt: { font: { sz: 10, name: 'Calibri' },
               fill: { patternType: 'solid', fgColor: { rgb: 'EEF4FB' } },
               alignment: { horizontal: 'left', vertical: 'center' },
               border: _XL_BD },

    'kv-k':  { font: { bold: true, sz: 10, name: 'Calibri', color: { rgb: '1F3864' } },
               fill: { patternType: 'solid', fgColor: { rgb: 'F0F4FA' } },
               alignment: { horizontal: 'left', vertical: 'center' } },

    'kv-v':  { font: { sz: 10, name: 'Calibri' },
               fill: { patternType: 'solid', fgColor: { rgb: 'FFFFFF' } },
               alignment: { horizontal: 'left', vertical: 'center' } },
};

/**
 * Construye un worksheet XLSX con estilos aplicados.
 * @param {any[][]} rows   - Datos crudos (array de arrays)
 * @param {string[]} meta  - Tipo por fila: 'title'|'section'|'header'|'data'|'kv'|'empty'
 * @param {number[]} colWidths - Anchos de columna en caracteres
 */
function xlBuildSheet(rows, meta, colWidths) {
    const nCols = colWidths.length;
    const padded = rows.map(r => { const p = [...r]; while (p.length < nCols) p.push(''); return p; });

    const ws = XLSX.utils.aoa_to_sheet(padded);
    ws['!cols'] = colWidths.map(w => ({ wch: w }));
    ws['!rows'] = meta.map(t => {
        if (t === 'title')   return { hpt: 28 };
        if (t === 'section') return { hpt: 22 };
        if (t === 'header')  return { hpt: 20 };
        if (t === 'empty')   return { hpt: 6  };
        return { hpt: 16 };
    });

    // Merges: title y section abarcan todas las columnas
    const merges = [];
    meta.forEach((t, ri) => {
        if (t === 'title' || t === 'section')
            merges.push({ s: { r: ri, c: 0 }, e: { r: ri, c: nCols - 1 } });
    });
    ws['!merges'] = merges;

    // Estilos celda a celda
    let dataRow = 0;
    meta.forEach((t, ri) => {
        if (t === 'empty') return;
        for (let ci = 0; ci < nCols; ci++) {
            const ref = XLSX.utils.encode_cell({ r: ri, c: ci });
            if (!ws[ref]) ws[ref] = { v: '', t: 's' };
            if      (t === 'data') ws[ref].s = _XL_S[dataRow % 2 === 0 ? 'data' : 'dataalt'];
            else if (t === 'kv')   ws[ref].s = _XL_S[ci === 0 ? 'kv-k' : 'kv-v'];
            else if (_XL_S[t])     ws[ref].s = _XL_S[t];
        }
        if (t === 'data') dataRow++;
    });

    return ws;
}

// Función principal para exportar datos a Excel
async function exportToExcel(event) {
    if (typeof XLSX === 'undefined') {
        alert("❌ Error: Librería XLSX no está disponible");
        return;
    }

    try {
        const btnExport = event.currentTarget;
        const panelContainer = btnExport.closest(".panel-container");
        const cabinaSelector = panelContainer?.querySelector('[data-select="cabina"]');
        const cabinaSeleccionada = cabinaSelector?.value || "Cabina 1";
        const cabinaCode = cabinaSeleccionada.includes("2") ? "C2" : "C1";

        const wb = XLSX.utils.book_new();

        const { rows: r1, meta: m1 } = await createSheet1Data();
        XLSX.utils.book_append_sheet(wb, xlBuildSheet(r1, m1, [24, 32]), "Información Personal");

        const { rows: r2, meta: m2 } = await createSheet2Data(cabinaCode);
        XLSX.utils.book_append_sheet(wb, xlBuildSheet(r2, m2, [22, 54]), "Controles");

        const { rows: r3, meta: m3 } = await createSheet3Data(cabinaCode);
        XLSX.utils.book_append_sheet(wb, xlBuildSheet(r3, m3, [18, 10, 10, 10, 10, 10, 10, 12, 12, 12, 10]), "Sensores");

        const { rows: r4, meta: m4 } = await createSheet4Data(cabinaCode);
        XLSX.utils.book_append_sheet(wb, xlBuildSheet(r4, m4, [18, 16, 14]), "Biometría");

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
        const filename = `ControlPanel_${cabinaSeleccionada.replace(" ", "")}_${timestamp}.xlsx`;
        XLSX.writeFile(wb, filename);

        alert(`✅ Archivo exportado: ${filename}`);
    } catch (error) {
        console.error("[Excel Export] ❌ Error:", error);
        alert("❌ Error al exportar:\n\n" + error.message);
    }
}

// Sheet 1: Información Personal
async function createSheet1Data() {
    const rows = [], meta = [];
    const add = (r, m) => { rows.push(r); meta.push(m); };

    add(["INFORMACIÓN PERSONAL"], 'title');
    add([],                       'empty');
    add(["Edad:",        personalDataStored.edad    || "-"], 'kv');
    add(["Altura (cm):", personalDataStored.altura  || "-"], 'kv');
    add(["Peso (kg):",   personalDataStored.peso    || "-"], 'kv');
    add(["Género:",      personalDataStored.genero  || "-"], 'kv');

    return { rows, meta };
}

// Sheet 2: Controles
async function createSheet2Data(cabinaCode) {
    const rows = [], meta = [];
    const add = (r, m) => { rows.push(r); meta.push(m); };

    add(["CONTROLES"],                  'title');
    add([],                             'empty');
    add(["TRAMAS DE CONTROL ENVIADAS"], 'section');
    add(["Hora", "Descripción"],        'header');

    const sentLogs = getLogsSent();
    let count = 0;
    sentLogs.forEach(log => {
        if (log.message.toUpperCase().startsWith(cabinaCode)) {
            add([log.time, controlDescripcion[log.message] || log.message], 'data');
            count++;
        }
    });
    if (count === 0) add(["Sin registros de control", ""], 'data');

    return { rows, meta };
}

// Sheet 3: Sensores de cabina seleccionada
async function createSheet3Data(cabinaCode) {
    const rows = [], meta = [];
    const add = (r, m) => { rows.push(r); meta.push(m); };

    const fmtTime = ts => {
        const d = new Date(ts);
        let h = d.getHours();
        const mm = d.getMinutes().toString().padStart(2, '0');
        const ss = d.getSeconds().toString().padStart(2, '0');
        const ampm = h >= 12 ? 'p.m.' : 'a.m.';
        h = h % 12 || 12;
        return `${h.toString().padStart(2, '0')}:${mm}:${ss} ${ampm}`;
    };

    add(["DATOS DE SENSORES"], 'title');
    add([],                    'empty');
    add(["Hora", "Cabina", "X (m/s²)", "Y (m/s²)", "Z (m/s²)", "°C", "H%", "UV (W/m²)", "CO₂ (PPM)", "Lux (lm/m²)", "dB"], 'header');

    try {
        const res = await fetch(`http://localhost:5000/api/serial/datos/${cabinaCode}`);
        if (res.ok) {
            const datos = await res.json();
            if (datos && datos.length > 0) {
                datos.forEach(l => {
                    if (!l) return;
                    add([fmtTime(l.timestamp), l.cabina, l.x, l.y, l.z, l.t, l.h, l.uv, l.cO2, l.o3, l.dB], 'data');
                });
            } else {
                add(["Sin datos de sensores disponibles", "", "", "", "", "", "", "", "", "", ""], 'data');
            }
        } else {
            add(["Error al obtener datos de sensores", "", "", "", "", "", "", "", "", "", ""], 'data');
        }
    } catch (e) {
        add(["Error de conexión con el servidor", "", "", "", "", "", "", "", "", "", ""], 'data');
    }

    return { rows, meta };
}

// Sheet 4: Biometría — secciones secuenciales por métrica
async function createSheet4Data(cabin = "C1") {
    const rows = [], meta = [];
    const add = (r, m) => { rows.push(r); meta.push(m); };
    const normalizedCabin = normalizeCabin(cabin);

    const fmtTime = ts => {
        const d = new Date(ts);
        let h = d.getHours();
        const mm = d.getMinutes().toString().padStart(2, '0');
        const ss = d.getSeconds().toString().padStart(2, '0');
        const ampm = h >= 12 ? 'p.m.' : 'a.m.';
        h = h % 12 || 12;
        return `${h.toString().padStart(2, '0')}:${mm}:${ss} ${ampm}`;
    };

    add(["DATOS BIOMÉTRICOS"], 'title');
    add([],                    'empty');

    try {
        const history = await fetchBiometricHistory(50, normalizedCabin);

        if (!history || history.length === 0) {
            add(["Sin datos biométricos disponibles", "", ""], 'data');
            return { rows, meta };
        }

        // Separar mediciones por tipo
        const pulse = [], oxygen = [], temp = [], bp = [];
        history.forEach(r => {
            const ts = r.timestampUtc ? fmtTime(r.timestampUtc) : "-";
            if (r.pulseBpm     != null) pulse.push({ t: ts, v: r.pulseBpm });
            if (r.spO2         != null) oxygen.push({ t: ts, v: r.spO2 });
            if (r.temperatureC != null) temp.push({ t: ts, v: r.temperatureC });
            if (r.systolic     != null) bp.push({ t: ts, sys: r.systolic, dia: r.diastolic ?? "-" });
        });

        // Sección genérica: título de sección + encabezados + filas de datos
        const addMetric = (title, hdr, entries, mapper) => {
            add([title], 'section');
            add(hdr,     'header');
            if (entries.length === 0) {
                add(["Sin registros", ...Array(hdr.length - 1).fill("")], 'data');
            } else {
                entries.forEach(e => add(mapper(e), 'data'));
            }
            add([], 'empty');
        };

        addMetric("PULSO (BPM)",              ["Hora", "BPM"],                   pulse,  e => [e.t, e.v]);
        addMetric("OXIGENACIÓN (SpO₂)",       ["Hora", "%"],                     oxygen, e => [e.t, e.v]);
        addMetric("TEMPERATURA",              ["Hora", "°C"],                    temp,   e => [e.t, e.v]);
        addMetric("TENSIÓN ARTERIAL (mmHg)",  ["Hora", "Sistólica", "Diastólica"], bp,   e => [e.t, e.sys, e.dia]);

    } catch (err) {
        console.error("[Excel Export] ❌ Error al obtener datos biométricos:", err);
        add(["Error al cargar datos biométricos", "", ""], 'data');
    }

    return { rows, meta };
}

// Función para actualizar los datos de las gráficas biométricas
async function updateBiometricCharts() {
    if (!biometricChartsEnabled || Object.keys(biometricChartInstances).length === 0) return;

    for (const cabin of ["C1", "C2"]) {
        const normalizedCabin = normalizeCabin(cabin);
        if (!biometricWatchConnectedByCabin[normalizedCabin]) continue;

        const newData = await fetchLatestBiometricData(normalizedCabin);
        if (!newData) continue;

        // Saltar si es el mismo punto de dato que ya se graficó
        if (newData.timestampUtc && newData.timestampUtc === biometricLastTimestampByCabin[normalizedCabin]) continue;
        biometricLastTimestampByCabin[normalizedCabin] = newData.timestampUtc ?? null;

        const cabinData = biometricChartDataByCabin[normalizedCabin];
        if (newData.pulse !== null) cabinData.pulse.push(newData.pulse);
        if (newData.oxygen !== null) cabinData.oxygen.push(newData.oxygen);
        if (newData.temperature !== null) cabinData.temperature.push(parseFloat(newData.temperature));
        if (newData.bloodPressure !== null) cabinData.bloodPressure.push(newData.bloodPressure);

        // Registrar el timestamp real como label de este punto
        const newLabel = newData.timestampUtc
            ? new Date(newData.timestampUtc).toLocaleTimeString()
            : new Date().toLocaleTimeString();
        if (!cabinData.labels) cabinData.labels = [];
        cabinData.labels.push(newLabel);

        if (cabinData.pulse.length > 10) cabinData.pulse.shift();
        if (cabinData.oxygen.length > 10) cabinData.oxygen.shift();
        if (cabinData.temperature.length > 10) cabinData.temperature.shift();
        if (cabinData.bloodPressure.length > 10) cabinData.bloodPressure.shift();
        if (cabinData.labels.length > 10) cabinData.labels.shift();

        // Construir eje X con timestamps reales; rellenar con '—' si hay menos de 10
        const chartLabels = [...cabinData.labels];
        while (chartLabels.length < 10) chartLabels.unshift('—');

        Object.keys(biometricChartInstances).forEach(key => {
            const chart = biometricChartInstances[key];
            if (!chart) return;

            const parts = key.split('_');
            const metric = parts[0];
            const canvasIndex = Number(parts[1]);
            const canvases = document.querySelectorAll(".biometric-chart");
            const panel = canvases[canvasIndex]?.closest(".panel-container");
            const panelCabin = getCabinFromPanel(panel);
            if (panelCabin !== normalizedCabin) return;

            if (!cabinData[metric]) return;
            chart.data.labels = chartLabels;
            chart.data.datasets[0].data = [...cabinData[metric]];
            chart.update('none');
        });

        updateTopMetricsGrid(newData, normalizedCabin);
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
            return "lm/m²";
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

    // Buscar solo los contenedores de indicadores, no los displays internos
    const elementos = document.querySelectorAll(
        `.control-indicador[data-medicion='${tipo}']`,
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

        // Verificar si el botón del sensor está activo
        const btn = el.querySelector(`.control-btn[data-codigo='${tipo}']`);
        const display = el.querySelector(".medicion-display");
        
        if (display) {
            if (btn && btn.classList.contains("bg-[#00bf63]")) {
                // Botón activo: mostrar valor
                display.textContent = `${valor} ${getUnidad(tipo)}`;
            } else {
                // Botón inactivo: mostrar N/A
                display.textContent = "N/A";
            }
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
        const datos = seccion === "sonidos" ? sonidosAmbientales
                    : seccion === "tonos"   ? tonosPuros
                    : tinitus;
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

            btn.addEventListener("click", () => {
                const cabinaSeleccionada =
                    cabinaSelector.value || "Cabina 1";
                const cabinaPrefijo =
                    cabinaSeleccionada === "Cabina 1" ? "C1" : "C2";
                const codigo = btn.getAttribute("data-codigo");

                const sonidoPrevio = sonidoActivoPorCabina[cabinaSeleccionada];

                // Desactivar visualmente el sonido anterior (sin enviar STOP)
                if (sonidoPrevio && sonidoPrevio !== btn) {
                    sonidoPrevio.classList.remove("bg-[#00bf63]", "text-white");
                    sonidoPrevio.classList.add("bg-[#efefef]");
                    const iconoPrevio = sonidoPrevio.querySelector(".text-green-800");
                    if (iconoPrevio) iconoPrevio.classList.add("hidden");
                }

                // Activar visualmente el nuevo sonido
                btn.classList.remove("bg-[#efefef]");
                btn.classList.add("bg-[#00bf63]", "text-white");
                const icono = btn.querySelector(".text-green-800");
                if (icono) icono.classList.remove("hidden");

                sonidoActivoPorCabina[cabinaSeleccionada] = btn;
                reproduciendoPorCabina[cabinaSeleccionada] = true;

                // Enviar directamente la trama del sonido seleccionado
                enviarTrama(cabinaPrefijo, codigo, true);
                window.addSentLog(`[SELECCION SONIDO] ${cabinaPrefijo}${codigo}F`);

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

            const btnActivo = Array.from(botonesSeccion).find(b => b.classList.contains("bg-[#00bf63]"));
            const seccionActiva = btnActivo?.getAttribute("data-seccion") || "sonidos";
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

// =============================================================================
//  GESTIÓN DE MODOS DE MEDICIÓN BIOMÉTRICA (Automático / Por Evento)
// =============================================================================

const METRIC_NAMES = {
    bpm: 'Pulso', spo2: 'Oxigenación',
    temperature: 'Temperatura', bloodPressure: 'Presión Arterial',
};

// Mapeo entre los valores del <select> y los identificadores internos de métrica
const SELECTOR_TO_METRIC = {
    pulse: 'bpm', oxygen: 'spo2', temperature: 'temperature', bloodPressure: 'bloodPressure',
};
const METRIC_TO_SELECTOR = {
    bpm: 'pulse', spo2: 'oxygen', temperature: 'temperature', bloodPressure: 'bloodPressure',
};

function _getChartContainersForCabin(cabin) {
    const containers = [];
    document.querySelectorAll('.biometric-charts-container').forEach(c => {
        const panel = c.closest('.panel-container');
        if (panel && getCabinFromPanel(panel) === cabin) containers.push(c);
    });
    return containers;
}

// Actualiza la apariencia visual de los botones de modo
function updateBiometricModeButtons(cabin, mode) {
    _getChartContainersForCabin(cabin).forEach(container => {
        const autoBtn  = container.querySelector('[data-biometric-mode="auto"]');
        const eventBtn = container.querySelector('[data-biometric-mode="event"]');

        if (autoBtn) {
            const on = mode === 'auto';
            autoBtn.classList.toggle('bg-[#00bf63]', on);
            autoBtn.classList.toggle('text-white', on);
            autoBtn.classList.toggle('text-[#00bf63]', !on);
            autoBtn.classList.toggle('bg-white', !on);
        }
        if (eventBtn) {
            const on = mode === 'event';
            eventBtn.classList.toggle('bg-[#ef4444]', on);
            eventBtn.classList.toggle('text-white', on);
            eventBtn.classList.toggle('text-[#ef4444]', !on);
            eventBtn.classList.toggle('bg-white', !on);
        }
    });
}

// Actualiza la barra de estado debajo de los botones
function updateBiometricModeStatus(cabin, text, colorClass) {
    _getChartContainersForCabin(cabin).forEach(container => {
        const el = container.querySelector('.biometric-mode-status');
        if (!el) return;
        if (!text) {
            el.classList.add('hidden');
            return;
        }
        el.textContent = text;
        el.className = `biometric-mode-status text-[11px] text-center py-1 px-3 mb-2 rounded-md font-medium ${colorClass || 'bg-gray-100 text-gray-500'}`;
    });
}

// Sincroniza el <select> de métrica y actualiza la gráfica sin disparar el evento change
function updateBiometricSelectorUI(cabin, metric) {
    const selectorVal = METRIC_TO_SELECTOR[metric] || metric;
    const cabinData   = biometricChartDataByCabin[cabin] || {};
    const allCanvases = document.querySelectorAll('.biometric-chart');

    const chartMetricConfigs = {
        pulse:         { label: 'Pulso (bpm)',              yScale: { min: 50,  max: 120 }, borderColor: '#e74c3c', bgColor: 'rgba(231,76,60,0.2)'   },
        oxygen:        { label: 'Oxigenación (%)',           yScale: { min: 90,  max: 100 }, borderColor: '#3498db', bgColor: 'rgba(52,152,219,0.2)'  },
        temperature:   { label: 'Temperatura (°C)',          yScale: { min: 35,  max: 40  }, borderColor: '#f39c12', bgColor: 'rgba(243,156,18,0.2)'  },
        bloodPressure: { label: 'Presión Arterial (mmHg)',   yScale: { min: 80,  max: 160 }, borderColor: '#9b59b6', bgColor: 'rgba(155,89,182,0.2)'  },
    };

    _getChartContainersForCabin(cabin).forEach(container => {
        const sel = container.querySelector('.biometric-metric-selector');
        if (sel && sel.value !== selectorVal) sel.value = selectorVal;

        // Actualizar la gráfica para que refleje la nueva métrica
        const canvas = container.querySelector('.biometric-chart');
        if (!canvas) return;
        const idx = Array.from(allCanvases).indexOf(canvas);
        if (idx >= 0) {
            window.updateBiometricChart(idx, selectorVal, cabinData.labels ?? [], chartMetricConfigs, cabinData);
        }
    });
}

// Habilita o deshabilita el selector de métrica de una cabina
function setBiometricSelectorEnabled(cabin, enabled) {
    _getChartContainersForCabin(cabin).forEach(container => {
        const sel = container.querySelector('.biometric-metric-selector');
        if (!sel) return;
        sel.disabled = !enabled;
        if (enabled) {
            sel.classList.remove('opacity-50', 'cursor-not-allowed');
            sel.title = '';
        } else {
            sel.classList.add('opacity-50', 'cursor-not-allowed');
            sel.title = 'El selector está disponible solo en modo Por Evento';
        }
    });
}

// Habilita ambos botones de modo tras la primera medición BPM
function enableBiometricModeButtons(cabin) {
    _getChartContainersForCabin(cabin).forEach(container => {
        container.querySelectorAll('[data-biometric-mode]').forEach(btn => {
            btn.disabled = false;
            btn.classList.remove('opacity-35', 'cursor-not-allowed');
            btn.classList.add('cursor-pointer', 'hover:opacity-80', 'active:scale-95');
        });
    });
    // El selector permanece deshabilitado hasta que el usuario seleccione un modo
    setBiometricSelectorEnabled(cabin, false);
}

// ── Desactiva el modo automático sin tocar la medición en curso ──────────────
function deactivateAutoMode(cabin) {
    if (biometricAutoTimerByCabin[cabin]) {
        clearTimeout(biometricAutoTimerByCabin[cabin]);
        biometricAutoTimerByCabin[cabin] = null;
    }
    if (biometricAutoCountdownByCabin[cabin]) {
        clearInterval(biometricAutoCountdownByCabin[cabin]);
        biometricAutoCountdownByCabin[cabin] = null;
    }
    biometricModeByCabin[cabin] = null;
    updateBiometricModeButtons(cabin, null);
    updateBiometricModeStatus(cabin, null);
    setBiometricSelectorEnabled(cabin, false);
}

// ── Activa el modo automático ────────────────────────────────────────────────
async function activateAutoMode(cabin) {
    biometricModeByCabin[cabin] = 'auto';
    updateBiometricModeButtons(cabin, 'auto');
    setBiometricSelectorEnabled(cabin, false);
    window.showToast?.('🔄 Modo automático activado: BPM → SpO2 → Temperatura → Presión → 5 min de descanso', 'info');

    const currentActive = biometricCurrentActiveMeasurementByCabin[cabin];
    if (currentActive) {
        // Hay una medición en curso — esperar que termine, el encadenado lo continúa
        const name = METRIC_NAMES[currentActive] || currentActive;
        updateBiometricModeStatus(cabin, `⟳ Completando medición actual: ${name}...`, 'bg-green-50 text-green-700');
        return;
    }

    // Determinar el siguiente paso según la última métrica completada.
    // Esto evita repetir BPM justo después de que el hardware lo acaba de medir.
    const lastCompleted = biometricLastCompletedMetricByCabin[cabin];
    const lastIdx = lastCompleted ? BIOMETRIC_AUTO_CYCLE_ORDER.indexOf(lastCompleted) : -1;
    const nextIdx  = lastIdx >= 0 ? (lastIdx + 1) % BIOMETRIC_AUTO_CYCLE_ORDER.length : 0;
    const next     = BIOMETRIC_AUTO_CYCLE_ORDER[nextIdx];
    const nextName = METRIC_NAMES[next] || next;

    updateBiometricModeStatus(cabin, `⟳ Iniciando ciclo — midiendo ${nextName}...`, 'bg-green-50 text-green-700');
    updateBiometricSelectorUI(cabin, next);

    if      (next === 'bpm')          await window.requestBpmMeasurement('auto', cabin);
    else if (next === 'spo2')         await window.requestSpo2Measurement('auto', cabin);
    else if (next === 'temperature')  await window.requestTemperatureMeasurement('auto', cabin);
    else if (next === 'bloodPressure') await window.requestBloodPressureMeasurement('auto', cabin);
}

// ── Activa el modo por evento ────────────────────────────────────────────────
function activateEventMode(cabin) {
    if (biometricModeByCabin[cabin] === 'auto') {
        deactivateAutoMode(cabin);
        window.showToast?.('⚡ Modo automático cancelado. La medición actual completará normalmente.', 'warning');
    }
    biometricModeByCabin[cabin] = 'event';
    updateBiometricModeButtons(cabin, 'event');
    updateBiometricModeStatus(cabin, '⚡ Por evento — cambia el selector para iniciar una medición', 'bg-red-50 text-red-600');
    setBiometricSelectorEnabled(cabin, true);
    window.showToast?.('⚡ Modo por evento activado. Selecciona una métrica para medir.', 'info');
}

// ── Callback para los botones de modo ────────────────────────────────────────
window.onBiometricModeClick = async function(requestedMode, cabin) {
    const cab = normalizeCabin(cabin);
    const current = biometricModeByCabin[cab];

    if (requestedMode === 'auto') {
        if (current === 'auto') {
            deactivateAutoMode(cab);
            window.showToast?.('⏹ Modo automático desactivado', 'info');
        } else {
            await activateAutoMode(cab);
        }
    } else {
        if (current === 'event') {
            biometricModeByCabin[cab] = null;
            updateBiometricModeButtons(cab, null);
            updateBiometricModeStatus(cab, null);
            setBiometricSelectorEnabled(cab, false);
            window.showToast?.('⏹ Modo por evento desactivado', 'info');
        } else {
            activateEventMode(cab);
        }
    }
};

// ── Encadena la siguiente medición en el ciclo automático ────────────────────
async function runNextAutoStep(cabin, completedMetric) {
    if (biometricModeByCabin[cabin] !== 'auto') return;

    const idx     = BIOMETRIC_AUTO_CYCLE_ORDER.indexOf(completedMetric);
    const nextIdx = (idx + 1) % BIOMETRIC_AUTO_CYCLE_ORDER.length;
    const next    = BIOMETRIC_AUTO_CYCLE_ORDER[nextIdx];

    if (nextIdx === 0) {
        // Ciclo completo — iniciar descanso de 5 minutos con cuenta regresiva
        window.showToast?.('✅ Ciclo completo. Próximo ciclo en 5 minutos.', 'success');
        const restStart = Date.now();

        biometricAutoCountdownByCabin[cabin] = setInterval(() => {
            if (biometricModeByCabin[cabin] !== 'auto') {
                clearInterval(biometricAutoCountdownByCabin[cabin]);
                biometricAutoCountdownByCabin[cabin] = null;
                return;
            }
            const rem  = Math.max(0, BIOMETRIC_AUTO_REST_MS - (Date.now() - restStart));
            const mins = Math.floor(rem / 60000);
            const secs = Math.floor((rem % 60000) / 1000).toString().padStart(2, '0');
            updateBiometricModeStatus(cabin, `⏳ Próximo ciclo en ${mins}:${secs}`, 'bg-yellow-50 text-yellow-700');
        }, 1000);

        biometricAutoTimerByCabin[cabin] = setTimeout(async () => {
            clearInterval(biometricAutoCountdownByCabin[cabin]);
            biometricAutoCountdownByCabin[cabin] = null;
            if (biometricModeByCabin[cabin] !== 'auto') return;
            updateBiometricModeStatus(cabin, '⟳ Reiniciando ciclo — midiendo Pulso...', 'bg-green-50 text-green-700');
            await window.requestBpmMeasurement('auto', cabin);
            updateBiometricSelectorUI(cabin, 'bpm');
        }, BIOMETRIC_AUTO_REST_MS);

    } else {
        // Iniciar la siguiente métrica del ciclo
        const nextName = METRIC_NAMES[next];
        updateBiometricModeStatus(cabin, `⟳ Midiendo: ${nextName}...`, 'bg-green-50 text-green-700');
        updateBiometricSelectorUI(cabin, next);

        if (next === 'spo2')          await window.requestSpo2Measurement('auto', cabin);
        else if (next === 'temperature') await window.requestTemperatureMeasurement('auto', cabin);
        else if (next === 'bloodPressure') await window.requestBloodPressureMeasurement('auto', cabin);
    }
}

window.enableBiometricModeButtons = enableBiometricModeButtons;
window.runNextAutoStep             = runNextAutoStep;
window.updateBiometricModeButtons  = updateBiometricModeButtons;

// =============================================================================

// Función para cambiar la métrica mostrada en la gráfica biométrica
function updateBiometricMetric(canvasIndex, metric, labels, metricConfigs) {
    if (Object.keys(biometricChartInstances).length === 0) return;

    const config = metricConfigs[metric];
    if (!config) return;
    
    const chartKey = `${metric}_${canvasIndex}`;
    let chart = biometricChartInstances[chartKey];
    
    // Si no existe chart para esta métrica, usar updateBiometricChart para crearlo
    const canvases = document.querySelectorAll(".biometric-chart");
    const panel = canvases[canvasIndex]?.closest(".panel-container");
    const cabin = getCabinFromPanel(panel);
    const cabinData = biometricChartDataByCabin[cabin] || biometricChartData;

    if (!chart) {
        console.log(`[BiometricCharts] Creando nueva gráfica para ${metric} en canvas ${canvasIndex}`);
        updateBiometricChart(canvasIndex, metric, labels, metricConfigs, cabinData);
        return;
    }

    const previousMetric = biometricLastMetric;
    biometricLastMetric = metric;

    console.log(`[BiometricCharts] Cambiando métrica a: ${metric} (canvas ${canvasIndex})`);

    chart.data.datasets[0].label = config.label;
    chart.data.datasets[0].data = [...(cabinData[metric] || [])];
    chart.data.datasets[0].borderColor = config.borderColor;
    chart.data.datasets[0].backgroundColor = config.bgColor;
    chart.data.datasets[0].pointBackgroundColor = config.borderColor;

    // Actualizar escalas
    chart.options.scales.y.min = config.yScale.min;
    chart.options.scales.y.max = config.yScale.max;

    chart.update();

    if (metric !== previousMetric) {
        if (metric === "oxygen") {
            requestSpo2Measurement("selector", cabin);
        } else if (metric === "pulse") {
            requestBpmMeasurement("selector", cabin);
        } else if (metric === "temperature") {
            requestTemperatureMeasurement("selector", cabin);
        } else if (metric === "bloodPressure") {
            requestBloodPressureMeasurement("selector", cabin);
        }
    }
}

// Función para actualizar los valores mostrados en TopMetricsGrid
function updateTopMetricsGrid(data, cabin = "C1") {
    if (!data) return;
    const normalizedCabin = normalizeCabin(cabin);

    // Actualizar en TODOS los paneles que muestren esta cabina
    // (en modo un panel ambos paneles son C1, así que el panel de biometría también se actualiza)
    const matchingPanels = Array.from(document.querySelectorAll(".panel-container"))
        .filter(p => getCabinFromPanel(p) === normalizedCabin);

    matchingPanels.forEach(panel => {
        if (data.pulse !== null && data.pulse !== undefined) {
            panel.querySelectorAll(".metric-value-pulse").forEach(el => {
                el.textContent = Math.round(data.pulse);
            });
        }

        if (data.oxygen !== null && data.oxygen !== undefined) {
            panel.querySelectorAll(".metric-value-oxygen").forEach(el => {
                el.textContent = Math.round(data.oxygen);
            });
        }

        if (data.temperature !== null && data.temperature !== undefined) {
            panel.querySelectorAll(".metric-value-temperature").forEach(el => {
                el.textContent = parseFloat(data.temperature).toFixed(1);
            });
        }

        if (data.bloodPressure !== null && data.bloodPressure !== undefined) {
            panel.querySelectorAll(".metric-value-bloodpressure").forEach(el => {
                if (typeof data.bloodPressure === 'object' && data.bloodPressure.systolic) {
                    el.textContent = `${Math.round(data.bloodPressure.systolic)}/${Math.round(data.bloodPressure.diastolic)}`;
                } else {
                    el.textContent = Math.round(data.bloodPressure);
                }
            });
        }
    });
}

// Función para detener y limpiar las gráficas biométricas
function stopBiometricCharts(cabin = null) {
    const normalizedCabin = cabin ? normalizeCabin(cabin) : null;
    console.log("[BiometricCharts] Deteniendo gráficas", normalizedCabin || "ALL");

    // Limpiar intervalo
    if (biometricUpdateInterval) {
        clearInterval(biometricUpdateInterval);
        biometricUpdateInterval = null;
    }

    // Destruir gráficas
    Object.keys(biometricChartInstances).forEach((key) => {
        const chart = biometricChartInstances[key];
        if (!chart) return;

        if (!normalizedCabin) {
            chart.destroy();
            return;
        }

        const parts = key.split('_');
        const canvasIndex = Number(parts[1]);
        const canvases = document.querySelectorAll(".biometric-chart");
        const panel = canvases[canvasIndex]?.closest(".panel-container");
        const panelCabin = getCabinFromPanel(panel);
        if (panelCabin === normalizedCabin) {
            chart.destroy();
            delete biometricChartInstances[key];
        }
    });

    if (!normalizedCabin) {
        biometricChartInstances = {
            pulse: null,
            oxygen: null,
            temperature: null,
            glucose: null,
        };
    }

    biometricChartsEnabled = Object.keys(biometricChartInstances).length > 0;
    console.log("[BiometricCharts] Gráficas detenidas");
}

// Función para actualizar el estado de los botones de reloj según conexión
function updateWatchButtonsState() {
    biometricWatchConnected = Object.values(biometricWatchConnectedByCabin).some(Boolean);
    console.log("[Biometría] Actualizando estado de botones por cabina:", biometricWatchConnectedByCabin);
    
    // Selecciona TODOS los pares de botones por separado
    const allConnectBtns = document.querySelectorAll("[data-action='connect-watch']");
    const allDisconnectBtns = document.querySelectorAll("[data-action='disconnect-watch']");
    
    console.log("[Biometría] Botones encontrados:", { conectar: !!allConnectBtns, desconectar: !!allDisconnectBtns });

    if (!allConnectBtns || !allDisconnectBtns) {
        console.warn("[Biometría] ⚠️ No se encontraron los botones de reloj!");
        return;
    };
    
    // Actualiza cada boton individualmente
    for (let i = 0; i < allConnectBtns.length; i++) {
        const connectBtn = allConnectBtns[i];
        const disconnectBtn = allDisconnectBtns[i];
        
        if (!connectBtn || !disconnectBtn) continue;
        
        const panel = connectBtn.closest(".panel-container");
        const cabin = getCabinFromPanel(panel);
        const isConnected = !!biometricWatchConnectedByCabin[cabin];

        // LED y leyenda de estado del reloj
        const led   = panel?.querySelector('.watch-status-led');
        const label = panel?.querySelector('.watch-status-label');

        if (isConnected) {
            connectBtn.disabled = true;
            connectBtn.classList.add("opacity-50", "cursor-not-allowed", "pointer-events-none");
            connectBtn.style.filter = "grayscale(100%)";

            disconnectBtn.disabled = false;
            disconnectBtn.classList.remove("opacity-50", "cursor-not-allowed", "pointer-events-none");
            disconnectBtn.style.filter = "none";

            if (led) {
                led.classList.remove("bg-gray-400");
                led.classList.add("bg-[#00bf63]", "animate-pulse");
            }
            if (label) {
                label.textContent = "Conectado";
                label.classList.remove("text-gray-500");
                label.classList.add("text-[#00bf63]");
            }
        } else {
            connectBtn.disabled = false;
            connectBtn.classList.remove("opacity-50", "cursor-not-allowed", "pointer-events-none");
            connectBtn.style.filter = "none";

            disconnectBtn.disabled = true;
            disconnectBtn.classList.add("opacity-50", "cursor-not-allowed", "pointer-events-none");
            disconnectBtn.style.filter = "grayscale(100%)";

            if (led) {
                led.classList.remove("bg-[#00bf63]", "animate-pulse");
                led.classList.add("bg-gray-400");
            }
            if (label) {
                label.textContent = "Desconectado";
                label.classList.remove("text-[#00bf63]");
                label.classList.add("text-gray-500");
            }
        };
    };
};

//Actualiza la gráfica biométrica con una nueva métrica. Reutiliza el mismo canvas destruyendo la instancia anterior
function updateBiometricChart(canvasIndex, metric, labels, metricConfigs, data) {
    const config = metricConfigs[metric];
    if (!config) {
        console.warn(`[BiometricCharts] Config not found for metric ${metric}`);
        return;
    }

    // Buscar el canvas
    const canvases = document.querySelectorAll(".biometric-chart");
    const canvas = canvases[canvasIndex];
    if (!canvas) {
        console.warn(`[BiometricCharts] Canvas ${canvasIndex} not found`);
        return;
    }

    // Buscar cualquier instancia existente para este canvas (puede tener cualquier métrica)
    // Las keys son: pulse_0, oxygen_0, temperature_0, etc.
    const existingKey = Object.keys(biometricChartInstances).find(key => key.endsWith(`_${canvasIndex}`));
    
    if (existingKey) {
        const existingChart = biometricChartInstances[existingKey];
        
        // DESTRUIR la instancia anterior para liberar el canvas
        console.log(`[BiometricCharts] Destruyendo gráfica anterior: ${existingKey}`);
        existingChart.destroy();
        delete biometricChartInstances[existingKey];
    }

    // Crear NUEVA instancia con la métrica seleccionada
    const newKey = `${metric}_${canvasIndex}`;
    console.log(`[BiometricCharts] Creando nueva gráfica: ${newKey}`);
    
    const ctx = canvas.getContext("2d");
    biometricChartInstances[newKey] = new Chart(ctx, {
        type: "line",
        data: {
            labels,
            datasets: [{
                label: config.label,
                data: [...data[metric]],
                borderColor: config.borderColor,
                backgroundColor: config.bgColor,
                tension: 0.3,
                cubicInterpolationMode: 'monotone',
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
    
    console.log(`[BiometricCharts] ✓ Gráfica ${newKey} creada exitosamente`);
}

// Obtiene los datos personales desde el formulario del DOM
function getPersonalData() {
    return {
        nombre: document.querySelector('input[name="nombre"]')?.value || "",
        apellido: document.querySelector('input[name="apellido"]')?.value || "",
        edad: document.querySelector('input[name="edad"]')?.value || "",
        email: document.querySelector('input[name="email"]')?.value || "",
        telefono: document.querySelector('input[name="telefono"]')?.value || "",
        empresa: document.querySelector('input[name="empresa"]')?.value || "",
        puesto: document.querySelector('input[name="puesto"]')?.value || "",
    };
}

// Obtiene los logs enviados desde el DOM
function getLogsSent() {
    const logs = [];
    const container = document.getElementById("log-sent-messages");
    if (!container) return logs;

    container.querySelectorAll("div").forEach(logElement => {
        const text = logElement.textContent || "";
        const timeMatch = text.match(/\[(.*?)\]/);
        const time = timeMatch ? timeMatch[1] : "";
        const message = text.replace(/🔵|\[.*?\]/g, "").trim();
        
        if (message) {
            logs.push({ time, message });
        }
    });

    return logs;
}

// Obtiene los logs recibidos desde el DOM
function getLogsReceived() {
    const logs = [];
    const container = document.getElementById("log-received-messages");
    if (!container) return logs;

    container.querySelectorAll("div").forEach(logElement => {
        const text = logElement.textContent || "";
        const timeMatch = text.match(/\[(.*?)\]/);
        const time = timeMatch ? timeMatch[1] : "";
        const message = text.replace(/🟢|\[.*?\]/g, "").trim();
        
        if (message) {
            logs.push({ time, message });
        }
    });

    return logs;
}

// Extrae la unidad de una etiqueta de sensor
function extractUnit(label) {
    const match = label.match(/\((.*?)\)/);
    return match ? match[1] : "";
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
        // Leer el valor inicial del selector (puede ser "Cabina 1" o "Cabina 2" según el panel)
        let cabinaPrefijo = selectCabina?.value === "Cabina 2" ? "C2" : "C1";

        function setColorCabina(color) {
            document.querySelectorAll('.panel-container').forEach(p => {
                const pSelect = p.querySelector("[data-select='cabina']");
                const pCabin = pSelect?.value === "Cabina 2" ? "C2" : "C1";
                if (pCabin === cabinaPrefijo) {
                    const el = p.querySelector('#color-cabina');
                    if (el) el.style.backgroundColor = color;
                }
            });
        }

        let ledActivo = null;

        if (selectCabina) {
            // Sincronizar con el valor inicial del selector
            console.log(
                `Panel ${index + 1}: Cabina inicial: ${cabinaPrefijo} (selector: ${selectCabina.value})`
            );
            
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
                    return;
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
                    // FRIO y CALOR son mutuamente exclusivos entre sí.
                    // El resto de controles pueden estar activos simultáneamente.
                    if (codigo === "FRIO") {
                        // Desactivar cualquier nivel de calor que esté activo
                        panel.querySelectorAll('[data-calor-codigo]:not([data-calor-codigo="002"])').forEach(b => {
                            if (b.classList.contains('bg-[#00bf63]')) {
                                b.classList.remove('bg-[#00bf63]');
                                b.classList.add('bg-[#c8c8c8]');
                                enviarTrama(cabinaPrefijo, codigoBoton[`CALOR_${cabinaPrefijo}`].off, cabinaActiva);
                            }
                        });
                    }

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

        // Listeners para la matriz 2x2 de calor
        panel.querySelectorAll('[data-calor-codigo]').forEach(btn => {
            btn.addEventListener('click', () => {
                const codigo = btn.getAttribute('data-calor-codigo');

                // Si es un nivel activo (no Apagado), desactivar FRIO si estaba activo
                if (codigo !== '002') {
                    const btnFrio = panel.querySelector('button[data-codigo="FRIO"]');
                    if (btnFrio && btnFrio.classList.contains('bg-[#00bf63]')) {
                        btnFrio.classList.remove('bg-[#00bf63]');
                        btnFrio.classList.add('bg-[#d9d9d9]');
                        enviarTrama(cabinaPrefijo, codigoBoton['FRIO'].off, cabinaActiva);
                    }
                }

                // Desactivar todos los sub-botones de calor
                panel.querySelectorAll('[data-calor-codigo]').forEach(b => {
                    b.classList.remove('bg-[#00bf63]');
                    b.classList.add('bg-[#c8c8c8]');
                });

                // Marcar como activo si no es Apagado
                if (codigo !== '002') {
                    btn.classList.remove('bg-[#c8c8c8]');
                    btn.classList.add('bg-[#00bf63]');
                }

                enviarTrama(cabinaPrefijo, codigo, cabinaActiva);
            });
        });

        sensorButtons.forEach((btn) => {
            btn.addEventListener("click", () => {
                const sensorSeleccionado = btn.dataset.sensor;
                console.log(`[Gráfica] Click en botón de sensor: ${sensorSeleccionado}`);

                // Actualizar estado visual: solo el botón activo queda en verde
                sensorButtons.forEach(b => {
                    b.classList.remove("bg-[#00bf63]", "hover:bg-[#00a152]");
                    b.classList.add("bg-[#d9d9d9]", "hover:bg-[#a6a6a6]");
                });
                btn.classList.remove("bg-[#d9d9d9]", "hover:bg-[#a6a6a6]");
                btn.classList.add("bg-[#00bf63]", "hover:bg-[#00a152]");

                // Obtener el canvas de la gráfica para actualizar su sensor
                const graficaCanvas = panel.querySelector("#graficaPanel");
                if (graficaCanvas) {
                    // Limpiar el intervalo anterior antes de cambiar el sensor
                    if (graficaCanvas.updateInterval) {
                        clearInterval(graficaCanvas.updateInterval);
                        console.log(`[Gráfica] Intervalo limpiado antes de cambiar a ${sensorSeleccionado}`);
                    }
                    // Actualizar el sensor actual en el canvas
                    graficaCanvas.sensor = sensorSeleccionado;
                }

                // Volver a inicializar la gráfica con el nuevo sensor
                initGrafica(panel, sensorSeleccionado);
            });
        });

        // Botón de refrescar gráfica
        const refreshBtn = panel.querySelector('[data-action="refresh-grafica"]');
        refreshBtn?.addEventListener("click", () => {
            const graficaCanvas = panel.querySelector("#graficaPanel");
            const sensorActual = graficaCanvas?.sensor || "X";
            console.log(`[Gráfica] Refrescando gráfica para sensor: ${sensorActual}`);
            initGrafica(panel, sensorActual);
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

        const BRIGHTNESS_LED_CODES = new Set(["101", "102", "103", "104", "109", "114"]);

        function actualizarBotonesBrillo() {
            const btnUp   = panel.querySelector('.led-button[data-codigo="121"]');
            const btnDown = panel.querySelector('.led-button[data-codigo="122"]');
            if (!btnUp || !btnDown) return;

            const codigoActivo = ledActivo ? ledActivo.getAttribute("data-codigo") : null;
            const habilitado   = codigoActivo !== null && BRIGHTNESS_LED_CODES.has(codigoActivo);

            [btnUp, btnDown].forEach((btn) => {
                btn.disabled          = !habilitado;
                btn.style.opacity     = habilitado ? "1"           : "0.35";
                btn.style.cursor      = habilitado ? "pointer"     : "not-allowed";
            });
        }

        actualizarBotonesBrillo();

        // Solo un led puede estar activo a la vez
        ledButtons.forEach((button) => {
            button.addEventListener("click", (e) => {
                const codigo = button.getAttribute("data-codigo");
                const isActive = button.classList.contains("active-led");

                if (!codigo) return;

                if (codigo === "121" || codigo === "122") {
                    e.stopPropagation();

                    enviarTrama(cabinaPrefijo, codigo, cabinaActiva);

                    const ledActivoSnapshot = ledActivo;
                    const botonBrillo = button;

                    setTimeout(() => {
                        botonBrillo.classList.remove("active-led");
                        botonBrillo.style.backgroundColor =
                            botonBrillo.getAttribute("data-inactive-color");

                        if (ledActivoSnapshot) {
                            ledActivoSnapshot.classList.add("active-led");
                            ledActivoSnapshot.style.backgroundColor =
                                ledActivoSnapshot.getAttribute("data-active-color");
                            setColorCabina(ledActivoSnapshot.getAttribute("data-active-color"));
                        }

                        botonBrillo.animate(
                            [
                                { backgroundColor: botonBrillo.getAttribute("data-inactive-color") },
                                { backgroundColor: botonBrillo.getAttribute("data-active-color"), offset: 0.35 },
                                { backgroundColor: botonBrillo.getAttribute("data-inactive-color") },
                            ],
                            { duration: 380, easing: "ease-in-out", fill: "none" }
                        );
                    }, 0);

                    return;
                }

                if (isActive) {
                    button.classList.remove("active-led");
                    button.style.backgroundColor = button.getAttribute(
                        "data-inactive-color",
                    );
                    setColorCabina("#d9d9d9");

                    enviarTrama(cabinaPrefijo, codigo, cabinaActiva);
                    ledActivo = null;
                    actualizarBotonesBrillo();
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
                    setColorCabina(button.getAttribute("data-active-color"));
                    enviarTrama(cabinaPrefijo, codigo, cabinaActiva);

                    ledActivo = button;
                    actualizarBotonesBrillo();
                }
            });
        });

        // Función para actualizar estado de botones (ACTIVAR y RESET)
        // Definida fuera del scope de los botones para ser accesible desde ambos
        function actualizarEstadoBotones() {
            const puertoConectado = puertoSerialConectado;
            
            // Botón ACTIVAR CABINA
            // Solo se habilita si: puerto conectado Y cabina NO activa
            if (btnIniciar) {
                const puedeActivar = puertoConectado && !cabinaActiva;
                btnIniciar.disabled = !puedeActivar;
                btnIniciar.classList.toggle("opacity-50", !puedeActivar);
                btnIniciar.classList.toggle("cursor-not-allowed", !puedeActivar);
                
                if (!puertoConectado) {
                    btnIniciar.title = "Conecte un puerto COM para iniciar la cabina";
                } else if (cabinaActiva) {
                    btnIniciar.title = "La cabina ya está activa";
                } else {
                    btnIniciar.title = "";
                }
            }

            // Botón PARAR Y RESET
            // Solo se habilita si: puerto conectado Y cabina activa
            if (btnReset) {
                const puedeResetear = puertoConectado && cabinaActiva;
                btnReset.disabled = !puedeResetear;
                btnReset.classList.toggle("opacity-50", !puedeResetear);
                btnReset.classList.toggle("cursor-not-allowed", !puedeResetear);
                
                if (!puertoConectado) {
                    btnReset.title = "Conecte un puerto COM para usar esta función";
                } else if (!cabinaActiva) {
                    btnReset.title = "Primero debe activar la cabina";
                } else {
                    btnReset.title = "";
                }
            }
        }

        if (btnIniciar && estadoCabina) {

            // Escuchar cambios globales de conexión
            window.addEventListener("puertoConectado", () => {
                puertoSerialConectado = true;
                actualizarEstadoBotones();
            });

            window.addEventListener("puertoDesconectado", () => {
                puertoSerialConectado = false;
                actualizarEstadoBotones();
            });

            // Llamada inicial
            actualizarEstadoBotones();

            btnIniciar.addEventListener("click", () => {
                cabinaActiva = true; // ✅ ACTIVAMOS la cabina
                
                // Remover ambos tonos de rojo que pueden existir
                estadoCabina.classList.remove("bg-[#ff5757]", "bg-[#ff4d4d]");
                estadoCabina.classList.add("bg-[#00bf63]");
                estadoCabina.textContent = "";
                
                // Mantener el icono visible
                const iconoEstado = estadoCabina.querySelector("img");
                if (!iconoEstado) {
                    const img = document.createElement("img");
                    img.src = "/icons/active-inactive.svg";
                    img.alt = "Estado";
                    img.className = "w-5 h-5";
                    estadoCabina.appendChild(img);
                }
                estadoCabina.appendChild(document.createTextNode(" ACTIVA"));

                // Actualizar estado de botones
                actualizarEstadoBotones();

                mostrarNotificacion("🚀 Cabina iniciada", "real");
            });
        }

        // Botón Parar y Reset - Reinicia todo
        if (btnReset && estadoCabina) {
            btnReset.addEventListener("click", async () => {
                if (!puertoSerialConectado) {
                    alert(
                        "⚠️ No hay un puerto COM conectado. No se puede reiniciar la cabina.",
                    );
                    return;
                }

                // UX-02: Confirmación antes de acción destructiva
                const confirmado = await window.showConfirm(
                    "¿Finalizar la sesión actual?\n\nEsto apagará todos los actuadores y borrará el historial de sensores del backend.\n\nAsegúrate de haber exportado los datos del participante antes de continuar.",
                    { confirmText: "Finalizar sesión", cancelText: "Cancelar", type: "warning" }
                );
                if (!confirmado) return;

                // FUNC-03: Limpiar historial de sensores en el backend para la nueva sesión
                try {
                    await fetch("http://localhost:5000/api/serial/limpiar", { method: "POST" });
                    console.log("[Session] ✓ Historial del backend limpiado.");
                } catch (e) {
                    console.warn("[Session] No se pudo limpiar el historial del backend:", e);
                }

                // FUNC-03: Limpiar datos del participante (DOM + estado en memoria)
                if (typeof window.limpiarDatosPersonales === "function") {
                    window.limpiarDatosPersonales();
                }

                estadoCabina.classList.remove("bg-[#00bf63]");
                estadoCabina.classList.add("bg-[#ff4d4d]");
                
                // Mantener el icono visible
                estadoCabina.textContent = "";
                const iconoEstado = document.createElement("img");
                iconoEstado.src = "/icons/active-inactive.svg";
                iconoEstado.alt = "Estado";
                iconoEstado.className = "w-5 h-5";
                estadoCabina.appendChild(iconoEstado);
                estadoCabina.appendChild(document.createTextNode(" INACTIVA"));
                
                cabinaActiva = false;

                // Resetear indicador de humo a rojo (no listo)
                if (estadoHumo) {
                    estadoHumo.style.backgroundColor = "#ff4d4d";
                }

                // ── Preparar envío secuencial de tramas de paro (500ms entre cada una) ──
                const esperar = (ms) => new Promise(r => setTimeout(r, ms));
                const tramasParaEnviar = [];

                // LED activo → reset visual inmediato + encolar trama OFF
                if (ledActivo) {
                    const codAnterior = ledActivo.getAttribute("data-codigo");
                    if (codAnterior) {
                        tramasParaEnviar.push(() => enviarTrama(cabinaPrefijo, codAnterior, true));
                    }
                    ledActivo.classList.remove("active-led");
                    ledActivo.style.backgroundColor = ledActivo.getAttribute("data-inactive-color");
                    setColorCabina("#d9d9d9");
                    ledActivo = null;
                    actualizarBotonesBrillo();
                }

                // Botones de control activos → reset visual inmediato + encolar trama OFF
                controlButtons.forEach((btn) => {
                    const codigo = btn.getAttribute("data-codigo");
                    if (btn.classList.contains("bg-[#00bf63]") && codigo && codigoBoton[codigo]) {
                        btn.classList.remove("bg-[#00bf63]");
                        btn.classList.add("bg-[#d9d9d9]");
                        const off = codigoBoton[codigo].off;
                        tramasParaEnviar.push(() => enviarTrama(cabinaPrefijo, off, true));
                    }
                });

                // Sub-botones de calor → reset visual inmediato + encolar trama OFF si había calor activo
                let calorActivo = false;
                panel.querySelectorAll('[data-calor-codigo]:not([data-calor-codigo="002"])').forEach(b => {
                    if (b.classList.contains('bg-[#00bf63]')) calorActivo = true;
                    b.classList.remove('bg-[#00bf63]');
                    b.classList.add('bg-[#c8c8c8]');
                });
                if (calorActivo) {
                    tramasParaEnviar.push(() => enviarTrama(cabinaPrefijo, codigoBoton[`CALOR_${cabinaPrefijo}`].off, true));
                }

                // Resetear temporizador de humo
                if (intervalo) {
                    clearInterval(intervalo);
                    intervalo = null;
                }
                temporizadorActivo = false;
                tiempoRestante = 300;
                if (tiempoMostrado) {
                    tiempoMostrado.textContent = "05:00";
                }
                if (temporizadorBtnText) {
                    temporizadorBtnText.textContent = "Iniciar 5 min";
                }
                humoActivado = false;

                // Desactivar botón de humo visualmente
                if (botonHumo) {
                    botonHumo.classList.remove("bg-[#00bf63]");
                    botonHumo.classList.add("bg-[#d9d9d9]");
                    botonHumo.setAttribute("aria-pressed", "false");
                }

                // Desactivar botón de disparo visualmente
                if (botonDisparo) {
                    botonDisparo.classList.remove("bg-[#00bf63]");
                    botonDisparo.classList.add("bg-[#d9d9d9]");
                }

                // Trama STOP a todos los paneles → reset visual de sonidos inmediato + encolar trama
                const allPanelsStop = document.querySelectorAll(".panel-container");
                allPanelsStop.forEach((p) => {
                    const pSelect = p.querySelector("[data-select='cabina']");
                    const pCabinaSeleccionada = pSelect?.value || "Cabina 1";
                    const pCabinaPrefijo = pCabinaSeleccionada === "Cabina 1" ? "C1" : "C2";
                    const tramaStop = `${pCabinaPrefijo}${TRAMA_STOP}F`;
                    tramasParaEnviar.push(() => {
                        enviarTrama("", "", false, tramaStop);
                        window.addSentLog(`[STOP] ${tramaStop}`);
                    });
                    // Reset visual de sonido inmediato (sin esperar al delay)
                    const btnActivo = sonidoActivoPorCabina[pCabinaSeleccionada];
                    if (btnActivo) {
                        btnActivo.classList.remove("bg-[#00bf63]", "text-white");
                        btnActivo.classList.add("bg-[#efefef]");
                    }
                });

                // ── Enviar secuencialmente con 500ms entre cada trama ──
                for (const enviar of tramasParaEnviar) {
                    enviar();
                    await esperar(500);
                }

                // Limpiar gráfica de sensores y su intervalo de actualización
                const graficaCanvas = panel.querySelector("#graficaPanel");
                if (graficaCanvas) {
                    // ✅ IMPORTANTE: Detener intervalo ANTES de destruir la gráfica
                    if (graficaCanvas.updateInterval) {
                        clearInterval(graficaCanvas.updateInterval);
                        graficaCanvas.updateInterval = null;
                        console.log("[Reset] Intervalo de actualización de gráfica detenido");
                    }
                    
                    // Destruir instancia de Chart.js
                    if (graficaCanvas.chartInstance) {
                        graficaCanvas.chartInstance.destroy();
                        graficaCanvas.chartInstance = null;
                        console.log("[Reset] Gráfica de sensores destruida");
                    }
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
                    setColorCabina("#d9d9d9");
                }

                // Resetear botones de selección de gráfica de sensores a gris
                sensorButtons.forEach(b => {
                    b.classList.remove("bg-[#00bf63]", "hover:bg-[#00a152]");
                    b.classList.add("bg-[#d9d9d9]", "hover:bg-[#a6a6a6]");
                });

                // Limpiar estado de sonido
                const cabinaSeleccionada = selectCabina.value;
                sonidoActivoPorCabina[cabinaSeleccionada] = null;
                reproduciendoPorCabina[cabinaSeleccionada] = false;
                volumenPorCabina[cabinaSeleccionada] = 0;

                // Resetear barra de volumen visual
                actualizarBarraVolumen(panel, 0);

                // Resetear botón PLAY de este panel
                const btnPlay = panel.querySelector("[data-sound-codigo='PLAY']");
                if (btnPlay) {
                    btnPlay.classList.remove("bg-[#00bf63]", "text-white");
                    btnPlay.classList.add("bg-[#d9d9d9]");
                }

                // Limpiar todos los botones de sonido activos
                const sonidosButtons = panel.querySelectorAll(".sound-btn");
                sonidosButtons.forEach((btn) => {
                    btn.classList.remove("bg-[#00bf63]", "text-white");
                    btn.classList.add("bg-[#efefef]");
                    const iconoSonando = btn.querySelector(".text-green-800");
                    if (iconoSonando) {
                        iconoSonando.classList.add("hidden");
                    }
                });

                // Desconectar reloj biométrico si está conectado
                if (biometricWatchConnectedByCabin[cabinaPrefijo]) {
                    try {
                        await fetch(`http://localhost:5000/api/smartwatch/disconnect?cabin=${cabinaPrefijo}`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                        });
                        console.log(`[Reset] Reloj ${cabinaPrefijo} desconectado`);
                        window.addSentLog?.(`[SMARTWATCH][${cabinaPrefijo}] POST /api/smartwatch/disconnect (reset)`);
                    } catch (e) {
                        console.warn("[Reset] No se pudo desconectar el reloj:", e);
                    }
                    biometricWatchConnectedByCabin[cabinaPrefijo] = false;
                    biometricWatchConnected = Object.values(biometricWatchConnectedByCabin).some(Boolean);
                    biometricMeasurementCompletionNotifiedByCabin[cabinaPrefijo] = false;
                    biometricCurrentActiveMeasurementByCabin[cabinaPrefijo] = null;
                    biometricPreviousActiveMeasurementByCabin[cabinaPrefijo] = null;
                    if (biometricModeByCabin) biometricModeByCabin[cabinaPrefijo] = null;
                    window.updateWatchButtonsState?.();
                }

                // Detener gráficas biométricas si existen
                if (typeof window.stopBiometricCharts === "function") {
                    window.stopBiometricCharts(cabinaPrefijo);
                }

                // Resetear selector de métrica biométrica
                setBiometricSelectorEnabled(cabinaPrefijo, false);

                // Limpiar datos biométricos acumulados
                if (window.biometricChartDataByCabin) {
                    window.biometricChartDataByCabin[cabinaPrefijo] = {
                        pulse: [],
                        oxygen: [],
                        temperature: [],
                        bloodPressure: [],
                    };
                }

                // Actualizar estado de botones
                actualizarEstadoBotones();

                alert("✅ Sesión finalizada. Sistema listo para el siguiente participante.");
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

            // Resetear indicador de humo a rojo (no listo)
            if (estadoHumo) {
                estadoHumo.style.backgroundColor = "#ff4d4d";
            }

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

            // Poner indicador en rojo (calentando, no listo)
            if (estadoHumo) {
                estadoHumo.style.backgroundColor = "#ff4d4d";
            }

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

                    // Cambiar indicador de humo a verde (listo)
                    if (estadoHumo) {
                        estadoHumo.style.backgroundColor = "#00bf63";
                    }

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
                    // Activar botón DISPARO visualmente (verde)
                    botonDisparo.classList.remove("bg-[#d9d9d9]");
                    botonDisparo.classList.add("bg-[#00bf63]");
                    
                    // El botón DISPARO activa/desactiva la salida de humo
                    // pero NO cambia el indicador "Humo Listo"
                    enviarTrama(
                        cabinaPrefijo,
                        codigoBoton.DISPARO.on,
                        cabinaActiva,
                    );
                } else {
                    // Desactivar botón DISPARO visualmente (gris)
                    botonDisparo.classList.remove("bg-[#00bf63]");
                    botonDisparo.classList.add("bg-[#d9d9d9]");
                    
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

/* *********************************************************************
************** EXPONER FUNCIONES AL SCOPE GLOBAL **********************
*** Necesarias para que initialization.js pueda acceder a ellas *******
********************************************************************* */
window.escanearPuertosCOM = escanearPuertosCOM;
window.conectarPuertoSerial = conectarPuertoSerial;
window.desconectarPuertoSerial = desconectarPuertoSerial;
window.exportToExcel = exportToExcel;
window.fetchDatosPorCabina = fetchDatosPorCabina;
window.procesarTrama = procesarTrama;
window.mostrarNotificacion = mostrarNotificacion;
window.getCabinFromPanel = getCabinFromPanel;
window.normalizeCabin = normalizeCabin;
window.initTabs = initTabs;
window.initTwoColumnsSection = initTwoColumnsSection;
window.updateWatchButtonsState = updateWatchButtonsState;
window.stopBiometricCharts = stopBiometricCharts;
window.updateBiometricChart = updateBiometricChart;
window.requestSpo2Measurement = requestSpo2Measurement;
window.requestBpmMeasurement = requestBpmMeasurement;
window.requestTemperatureMeasurement = requestTemperatureMeasurement;
window.requestBloodPressureMeasurement = requestBloodPressureMeasurement;
window.seedBiometricHistory = seedBiometricHistory;
window.updateBiometricCharts = updateBiometricCharts;
window.checkMonitoringStatus = checkMonitoringStatus;
