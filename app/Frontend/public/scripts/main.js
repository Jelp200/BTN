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
            alert(`Sin datos disponibles para ${cabina.toUpperCase()}`);
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
async function getBiometricHistory() {
    try {
        const response = await fetch("http://localhost:5000/api/smartwatch/vitals/history");
        if (!response.ok) return [];
        
        const result = await response.json();
        return result.success && result.history ? result.history : [];
    } catch (error) {
        console.warn("[Excel Export] Error obteniendo historial biométrico:", error);
        return [];
    }
}

// Funciones para interactuar con el backend del smartwatch
async function fetchLatestBiometricData() {
    try {
        const response = await fetch("http://localhost:5000/api/Smartwatch/vitals/latest");
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

async function fetchBiometricHistory(limit = 10) {
    try {
        const response = await fetch(`http://localhost:5000/api/Smartwatch/vitals/history?limit=${limit}`);
        if (!response.ok) return [];

        const payload = await response.json();
        if (!payload?.success || !Array.isArray(payload?.data)) return [];

        return payload.data;
    } catch (error) {
        console.warn("[BiometricCharts] No se pudo obtener historial del backend:", error);
        return [];
    }
}

async function requestBpmMeasurement(source = "ui") {
    if (!biometricWatchConnected) {
        console.warn("[BiometricCharts] Reloj no conectado. No se puede iniciar BPM");
        return;
    }

    const now = Date.now();
    if (now - biometricLastBpmRequestAt < BIOMETRIC_REQUEST_COOLDOWN_MS) {
        console.log("[BiometricCharts] ⏳ Ignorando solicitud BPM por cooldown");
        return;
    }

    biometricLastBpmRequestAt = now;

    console.log(`[BiometricCharts] Solicitando medición BPM (source=${source})`);
    window.addSentLog?.(`[SMARTWATCH] POST /api/smartwatch/vitals/start-bpm`);

    try {
        const response = await fetch("http://localhost:5000/api/smartwatch/vitals/start-bpm", {
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

async function requestSpo2Measurement(source = "ui") {
    if (!biometricWatchConnected) {
        console.warn("[BiometricCharts] Reloj no conectado. No se puede iniciar SpO2");
        return;
    }

    const now = Date.now();
    if (now - biometricLastSpo2RequestAt < BIOMETRIC_REQUEST_COOLDOWN_MS) {
        console.log("[BiometricCharts] ⏳ Ignorando solicitud SpO2 por cooldown");
        return;
    }

    biometricLastSpo2RequestAt = now;

    console.log(`[BiometricCharts] Solicitando medición SpO2 (source=${source})`);
    window.addSentLog?.(`[SMARTWATCH] POST /api/smartwatch/vitals/start-spo2`);

    try {
        const response = await fetch("http://localhost:5000/api/smartwatch/vitals/start-spo2", {
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

async function requestTemperatureMeasurement(source = "ui") {
    if (!biometricWatchConnected) {
        console.warn("[BiometricCharts] Reloj no conectado. No se puede iniciar Temperatura");
        return;
    }

    const now = Date.now();
    if (now - biometricLastTemperatureRequestAt < BIOMETRIC_REQUEST_COOLDOWN_MS) {
        console.log("[BiometricCharts] ⏳ Ignorando solicitud Temperatura por cooldown");
        return;
    }

    biometricLastTemperatureRequestAt = now;

    console.log(`[BiometricCharts] Solicitando medición Temperatura (source=${source})`);
    window.addSentLog?.(`[SMARTWATCH] POST /api/smartwatch/vitals/start-temperature`);

    try {
        const response = await fetch("http://localhost:5000/api/smartwatch/vitals/start-temperature", {
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

async function requestBloodPressureMeasurement(source = "ui") {
    if (!biometricWatchConnected) {
        console.warn("[BiometricCharts] Reloj no conectado. No se puede iniciar Presión Arterial");
        return;
    }

    const now = Date.now();
    if (now - biometricLastBloodPressureRequestAt < BIOMETRIC_REQUEST_COOLDOWN_MS) {
        console.log("[BiometricCharts] ⏳ Ignorando solicitud Presión Arterial por cooldown");
        return;
    }

    biometricLastBloodPressureRequestAt = now;

    console.log(`[BiometricCharts] Solicitando medición Presión Arterial (source=${source})`);
    window.addSentLog?.(`[SMARTWATCH] POST /api/smartwatch/vitals/start-bloodpressure`);

    try {
        const response = await fetch("http://localhost:5000/api/smartwatch/vitals/start-bloodpressure", {
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
async function checkMonitoringStatus() {
    if (!biometricWatchConnected) return;

    try {
        const response = await fetch("http://localhost:5000/api/smartwatch/vitals/monitoring-status");
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
        
        console.log(`[BiometricCharts] Estado: previo=${biometricPreviousActiveMeasurement}, actual=${biometricCurrentActiveMeasurement}, nuevo=${activeMeasurementType}`);
        
        // Detectar cuando una medición INICIA (cambio de null a una métrica)
        if (!biometricCurrentActiveMeasurement && activeMeasurementType) {
            biometricMeasurementCompletionNotified = false; // Reset la flag cuando inicia nueva medición
            console.log(`[BiometricCharts] Nueva medición iniciada: ${activeMeasurementType}`);
        }
        
        // Detectar cuando una medición TERMINA (cambio de una métrica a null)
        // Y evitar múltiples notificaciones con la flag
        if (biometricCurrentActiveMeasurement && !activeMeasurementType && !biometricMeasurementCompletionNotified) {
            // Una medición acaba de terminar
            const measurementNames = {
                'bpm': 'Pulso',
                'spo2': 'Oxigenación',
                'temperature': 'Temperatura',
                'bloodPressure': 'Presión Arterial'
            };
            const completedName = measurementNames[biometricCurrentActiveMeasurement] || biometricCurrentActiveMeasurement;
            
            console.log(`[BiometricCharts] ✅ Medición de ${completedName} completada!`);
            biometricMeasurementCompletionNotified = true; // Marcar que ya notificamos
            
            // Mostrar notificación en el log de tramas
            mostrarNotificacion(
                `Medición de ${completedName} completada. Ahora puedes cambiar de métrica.`,
                { tipo: "info" }
            );
            
            // TAMBIÉN mostrar alert para asegurar que el usuario lo vea
            alert(`✅ Medición de ${completedName} completada!\n\nAhora puedes cambiar de métrica.`);
            
            // Actualizar TopMetricsGrid con los últimos datos medidos
            try {
                const latestData = await fetchLatestBiometricData();
                if (latestData) {
                    updateTopMetricsGrid(latestData);
                }
            } catch (error) {
                console.warn("[BiometricCharts] Error actualizando TopMetricsGrid después de medición:", error);
            }
            
            // Habilitar TODOS los selectores (ambos paneles)
            const allSelectors = document.querySelectorAll(".biometric-metric-selector");
            allSelectors.forEach(selector => {
                selector.disabled = false;
                selector.classList.remove("opacity-50", "cursor-not-allowed");
            });
        }
        
        // Actualizar estado actual (SIEMPRE)
        biometricPreviousActiveMeasurement = biometricCurrentActiveMeasurement;
        biometricCurrentActiveMeasurement = activeMeasurementType;
        
        // Deshabilitar/habilitar TODOS los selectores según haya medición activa
        const allSelectors = document.querySelectorAll(".biometric-metric-selector");
        allSelectors.forEach(selector => {
            if (activeMeasurementType) {
                selector.disabled = true;
                selector.classList.add("opacity-50", "cursor-not-allowed");
            } else {
                selector.disabled = false;
                selector.classList.remove("opacity-50", "cursor-not-allowed");
            }
        });
    } catch (error) {
        console.warn("[BiometricCharts] Error al verificar estado de monitoreo:", error);
    }
}

async function seedBiometricHistory(labels, metricConfigs) {
    const history = await fetchBiometricHistory(10);
    if (!history.length) return;

    biometricChartData.pulse = history.map((item) => item.pulseBpm ?? null);
    biometricChartData.oxygen = history.map((item) => item.spO2 ?? null);
    biometricChartData.temperature = history.map((item) => item.temperatureC ?? null);
    biometricChartData.bloodPressure = history.map((item) => item.systolic ?? null);

    // Actualizar TODAS las gráficas activas (una por canvas)
    // Las keys son: pulse_0, oxygen_1, temperature_0, etc.
    Object.keys(biometricChartInstances).forEach(key => {
        const chart = biometricChartInstances[key];
        if (!chart) return;
        
        // Extraer métrica del key (formato: "pulse_0", "oxygen_1", etc.)
        const parts = key.split('_');
        const metric = parts[0];
        
        if (!biometricChartData[metric] || !metricConfigs[metric]) return;
        
        chart.data.labels = labels;
        chart.data.datasets[0].data = [...biometricChartData[metric]];

        const config = metricConfigs[metric];
        chart.data.datasets[0].label = config.label;
        chart.data.datasets[0].borderColor = config.borderColor;
        chart.data.datasets[0].backgroundColor = config.bgColor;
        chart.options.scales.y.min = config.yScale.min;
        chart.options.scales.y.max = config.yScale.max;

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
        });
    }
}

// Función principal para exportar datos a Excel
async function exportToExcel(event) {
    if (typeof XLSX === 'undefined') {
        alert("❌ Error: Librería XLSX no está disponible");
        return;
    }

    try {
        // Obtener el botón que fue clickeado y su panel contenedor
        const btnExport = event.currentTarget;
        const panelContainer = btnExport.closest(".panel-container");
        
        // Buscar el selector de cabina dentro del MISMO panel
        const cabinaSelector = panelContainer?.querySelector('[data-select="cabina"]');
        const cabinaSeleccionada = cabinaSelector?.value || "Cabina 1";
        const cabinaCode = cabinaSeleccionada.includes("2") ? "C2" : "C1";
        
        console.log("[Excel Export] ✅ Iniciando exportación...");
        console.log("[Excel Export] Cabina seleccionada: " + cabinaSeleccionada + " (" + cabinaCode + ")");
        
        const workbook = XLSX.utils.book_new();

        // Sheet 1: Información personal
        console.log("[Excel Export] 📄 Creando Sheet 1: Información Personal");
        const sheet1Data = await createSheet1Data();
        const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);
        XLSX.utils.book_append_sheet(workbook, ws1, "Información Personal");
        console.log("[Excel Export] ✅ Sheet 1 creado (" + sheet1Data.length + " filas)");

        // Sheet 2: Controles + Logs
        console.log("[Excel Export] 📄 Creando Sheet 2: Controles y Logs");
        const sheet2Data = await createSheet2Data();
        const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
        ws2['!cols'] = [
            { wch: 25 },  // Columna A: Hora 
            { wch: 20 },  // Columna B: Estado
            { wch: 20 },  // Columna C: Trama
            { wch: 20 },   // Columna D: Tipo
            { wch: 40 }   // Columna E: Descripción
        ];
        XLSX.utils.book_append_sheet(workbook, ws2, "Controles y Logs");
        console.log("[Excel Export] ✅ Sheet 2 creado (" + sheet2Data.length + " filas)");

        // Sheet 3: Sensores (solo de la cabina seleccionada)
        console.log("[Excel Export] 📄 Creando Sheet 3: Sensores de " + cabinaSeleccionada + " (" + cabinaCode + ")");
        const sheet3Data = await createSheet3Data(cabinaCode);
        const ws3 = XLSX.utils.aoa_to_sheet(sheet3Data);
        ws3['!cols'] = [
            { wch: 20 },  // Columna A:  
            { wch: 20 },  // Columna B: 
            { wch: 20 },  // Columna C: 
            { wch: 20 },  // Columna D: 
            { wch: 20 },  // Columna E:
            { wch: 20 },  // Columna F: 
            { wch: 20 },  // Columna G: 
            { wch: 20 },  // Columna H:
            { wch: 20 },  // Columna I: 
            { wch: 20 },  // Columna J:
        ];
        XLSX.utils.book_append_sheet(workbook, ws3, "Sensores");
        console.log("[Excel Export] ✅ Sheet 3 creado (" + sheet3Data.length + " filas)");

        // Sheet 4: Biometría (solo de la cabina seleccionada)
        console.log("[Excel Export] 📄 Creando Sheet 4: Biometría de " + cabinaSeleccionada + " (" + cabinaCode + ")");
        const sheet4Data = await createSheet4Data(cabinaCode);
        const ws4 = XLSX.utils.aoa_to_sheet(sheet4Data);
        ws4['!cols'] = [
            { wch: 20 },  // Columna A:  
            { wch: 15 },  // Columna B: 
            { wch: 10 },  // Columna C: 
            { wch: 20 },  // Columna D: 
            { wch: 15 },  // Columna E:
            { wch: 10 },  // Columna F: 
            { wch: 20 },  // Columna G: 
            { wch: 15 },  // Columna H:
            { wch: 10 },  // Columna I: 
            { wch: 20 },  // Columna J: 
            { wch: 20 },  // Columna K:
            { wch: 20 },  // Columna l: 
        ];
        XLSX.utils.book_append_sheet(workbook, ws4, "Biometría");
        console.log("[Excel Export] ✅ Sheet 4 creado (" + sheet4Data.length + " filas)");

        // Escribir el archivo con nombre que incluya la cabina
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
        const filename = `ControlPanel_${cabinaSeleccionada.replace(" ", "")}_${timestamp}.xlsx`;
        
        console.log("[Excel Export] 💾 Escribiendo archivo: " + filename);
        XLSX.writeFile(workbook, filename);

        console.log("[Excel Export] ✅ ¡Archivo exportado exitosamente!");
        alert(`✅ Archivo exportado: ${filename}\n\nCabina: ${cabinaSeleccionada}\nFecha: ${timestamp}`);
    } catch (error) {
        console.error("[Excel Export] ❌ Error detallado:", error);
        console.error("[Excel Export] Stack:", error.stack);
        alert("❌ Error al exportar:\n\n" + error.message + "\n\nRevisa la consola (F12) para más detalles");
    }
}

// Sheet 1: Información Personal
async function createSheet1Data() {
    const data = [];

    // Encabezado
    data.push(["INFORMACION PERSONAL"]);
    data.push([]);

    // Usar datos guardados de Personal Data Form
    data.push(["Edad:", personalDataStored.edad || "-"]);
    data.push(["Altura (cm):", personalDataStored.altura || "-"]);
    data.push(["Peso (kg):", personalDataStored.peso || "-"]);
    data.push(["Genero:", personalDataStored.genero || "-"]);
    data.push([]);

    return data;
}

// Sheet 2: Controles y Logs del sistema
async function createSheet2Data() {
    const data = [];

    // Obtener el botón que fue clickeado y su panel contenedor
    const btnExport = event.currentTarget;
    const panelContainer = btnExport.closest(".panel-container");
        
    // Buscar el selector de cabina dentro del MISMO panel
    const cabinaSelector = panelContainer?.querySelector('[data-select="cabina"]');
    const cabinaSeleccionada = cabinaSelector?.value || "Cabina 1";
    const cabinaCode = cabinaSeleccionada.includes("2") ? "C2" : "C1";

    // Encabezado
    data.push(["CONTROLES Y LOGS DEL SISTEMA"]);
    data.push([]);

    // Sección de Controles
    data.push(["TRAMAS DE CONTROL ENVIADAS"]);
    data.push(["Hora", "Estado", "Trama", "Tipo", "Descripción"]);

    // Obtener los logs enviados y filtrar por controles
    const sentLogs = getLogsSent();
    
    // Procesar cada log para extraer informacion de control
    sentLogs.map(log => {
        // Buscar patrones de control en el mensaje
        const message = log.message;
        // Detectar estado: PENDIENTE o ENVIADA
        let estado = "PENDIENTE";
        if (message.includes("[PENDIENTE]")) {
            estado = "PENDIENTE";
        } else if (message.includes("[ENVIADA]")) {
            estado = "ENVIADA";
        };

        // Verificamos inicio de trama (C1 O C2) y validamos cabina (C1 O C2)
        if (message.toUpperCase().startsWith(cabinaCode) && cabinaCode === 'C1') {
            return data.push([log.time, estado, message, "Control", controlDescripcion[message]]);
        }; 

        if (message.toUpperCase().startsWith(cabinaCode) && cabinaCode === 'C2') {
            return data.push([log.time, estado, message, "Control", controlDescripcion[message]]);
        };
    
    });

    if (data.length === 3) {
        data.push(["Sin registros de control", "", "", "", ""]);
    }

    data.push([]);
    data.push([]);

    // Seccion de Logs del Sistema
    data.push(["LOGS DEL SISTEMA"]);
    data.push(["Tipo", "Hora", "Mensaje"]);

    // Obtener logs enviados
    sentLogs.forEach(log => {
        // Filtrar solo logs de sistema, no de controles (que no tengan codigo)
        if (!log.message.match(/\d{3}/)) {
            data.push(["ENVIADO", log.time, log.message]);
        }
    });

    // Obtener logs recibidos
    const receivedLogs = getLogsReceived();
    receivedLogs.forEach(log => {
        data.push(["RECIBIDO", log.time, log.message]);
    });

    return data;
}

// Sheet 3: Sensores de cabina seleccionada
async function createSheet3Data(cabinaCode) {
    const data = [];

    data.push(["DATOS DE SENSORES"]);
    data.push([]);
    // Map cabinaCode to display name
    const cabinaName = cabinaCode === "C1" ? "CABINA 1" : "CABINA 2";
    const cabinaNumero = cabinaCode === "C1" ? "1" : "2";
    data.push(["Carácter de inicio", "Número de cabina", "Acelerometro","Acelerometro","Acelerometro","Temperatura","Humedad","Luz UV","Calidad del aire", "Sonido"]);
    data.push(["C", cabinaNumero, "X: #String/flotante","Y: #String/flotante","Z: #String/flotante","T: #String/flotante","UV: #String/flotante", "CO2: #String/flotante","O3: #String/flotante","db: #String/flotante"]);
    
    data.push([]);
    data.push([]);
    data.push([cabinaName]);
    data.push(["Sensor", "Última Lectura", "Unidad"]);
    
    const sensorData = await getSensorData(cabinaCode);
    Object.entries(sensorData).forEach(([sensor, value]) => {
        const config = window.sensorConfig?.[sensor];
        const label = config?.label || sensor;
        const unit = extractUnit(label);
        data.push([label, value || "-", unit]);
    });

    return data;
}

// Sheet 4: Datos biométricos históricos
async function createSheet4Data() {
    const data = [];

    data.push(["DATOS BIOMÉTRICOS"]);
    data.push([]);
    data.push(["PPM (Pulsos Por Minuto)","","","Sp02 (Oxigenación)","","","°C (Temperatura)","","", "mmHg (Tensión Arterial)"]);
    data.push(["Hora","Medición","", "Hora","Medición","", "Hora","Medición","", "Hora","Medición Alta","Medición Baja"]);
    // Obtener historial biométrico
    //const biometricHistory = await getBiometricHistory();

    // if (biometricHistory && biometricHistory.length > 0) {
    //     data.push(["Pulso (BPM)", "SpO2 (%)", "Temperatura (°C)", "Presión Arterial", "Fecha y Hora"]);
        
    //     // Filter records by cabina if cabina data is available in records
    //     // Currently biometricHistory contains all data; filter if 'cabina' field exists in records
    //     const filteredHistory = biometricHistory.filter(record => {
    //         // If record has cabina field, filter by it; otherwise include all
    //         if (record.cabina) {
    //             return record.cabina === cabinaCode;
    //         }
    //         return true; // Include if no cabina field
    //     });
        
    //     filteredHistory.forEach(record => {
    //         const bp = record.systolic && record.diastolic ? `${record.systolic}/${record.diastolic}` : "-";
    //         const timestamp = new Date(record.timestamp).toLocaleString('es-ES') || "-";
    //         data.push([
    //             record.pulseBpm || "-",
    //             record.spO2 || "-",
    //             record.temperatureC || "-",
    //             bp,
    //             timestamp
    //         ]);
    //     });
        
    //     // if (filteredHistory.length === 0) {
    //     //     data.push([`Sin datos biométricos disponibles para ${cabinaCode}`]);
    //     // }
    // } else {
    //     data.push(["Sin datos biométricos disponibles"]);
    // }

    return data;
}

// Función para actualizar los datos de las gráficas biométricas
async function updateBiometricCharts() {
    if (!biometricChartsEnabled || Object.keys(biometricChartInstances).length === 0) return;

    const newData = await fetchLatestBiometricData();
    if (!newData) return;
    
    if (newData.pulse !== null) biometricChartData.pulse.push(newData.pulse);
    if (newData.oxygen !== null) biometricChartData.oxygen.push(newData.oxygen);
    if (newData.temperature !== null) biometricChartData.temperature.push(parseFloat(newData.temperature));
    if (newData.bloodPressure !== null) biometricChartData.bloodPressure.push(newData.bloodPressure);

    if (biometricChartData.pulse.length > 10) biometricChartData.pulse.shift();
    if (biometricChartData.oxygen.length > 10) biometricChartData.oxygen.shift();
    if (biometricChartData.temperature.length > 10) biometricChartData.temperature.shift();
    if (biometricChartData.bloodPressure.length > 10) biometricChartData.bloodPressure.shift();

    // Actualizar labels (timestamp) - últimos 10 registros
    const now = new Date();
    const newLabels = [];
    for (let i = Math.min(9, biometricChartData.pulse.length - 1); i >= 0; i--) {
        const time = new Date(now - i * 5000);
        newLabels.push(time.toLocaleTimeString());
    }

    // Actualizar TODAS las gráficas activas (una por canvas)
    Object.keys(biometricChartInstances).forEach(key => {
        const chart = biometricChartInstances[key];
        if (!chart) return;
        
        // Extraer métrica del key (formato: "pulse_0", "oxygen_1", etc.)
        const parts = key.split('_');
        const metric = parts[0];
        
        if (!biometricChartData[metric]) return;
        
        chart.data.labels = newLabels;
        chart.data.datasets[0].data = [...biometricChartData[metric]];
        chart.update('none'); // Update sin animación para mejor performance
    });
    
    // Actualizar TopMetricsGrid con los últimos valores
    updateTopMetricsGrid(newData);
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

// Función para manejar el ciclo de calor
function manejarCalor(btn, cabinaPrefijo, cabinaActiva, panel) {
    
    const estadoActual = codigoBoton[cabinaPrefijo];
    // Calcular siguiente estado para la cabina
    const currentIndex = calorCycle.indexOf(estadoActual);
    const nextIndex = (currentIndex + 1) % calorCycle.length;
    const nuevoEstado = calorCycle[nextIndex];

    codigoBoton[cabinaPrefijo] = nuevoEstado;
    btn.classList.remove("bg-[#d9d9d9]", "bg-[#00bf63]");

    if (nuevoEstado === '002') {
        btn.classList.add("bg-[#d9d9d9]");
        enviarTrama(
            cabinaPrefijo,
            nuevoEstado,
            cabinaActiva
        );
        actualizarLedCalor(panel, '002');
        return;
    };

    btn.classList.add("bg-[#00bf63]");
    enviarTrama(
        cabinaPrefijo,
        nuevoEstado,
        cabinaActiva
    );
    actualizarLedCalor(panel, nuevoEstado);
};

// Función para actualizar el LED de calor según el estado
function actualizarLedCalor(panel, estado) {
    const btnCalor = panel.querySelector('button[data-codigo="CALOR"]');
    if (!btnCalor) return;

    // Seleccionar LEDs por su posición
    const ledSuperior = btnCalor.querySelector(".led-superior");    // Top-2
    const ledMedio = btnCalor.querySelector(".led-medio");         // Top-7  
    const ledInferior = btnCalor.querySelector(".led-inferior");   // Top-12

    // Limpiar colores
    [ledSuperior, ledMedio, ledInferior].forEach(led => {
        if (led) {
            led.classList.remove(
                "bg-[#b4b4b4]", "bg-[#ffbd59]", 
                "bg-[#ff914d]", "bg-[#ff3131]"
            );
        }
    });

    // Aplicar según estado
    const colores = {
        off:   { inferior: "#b4b4b4", medio: "#b4b4b4", superior: "#b4b4b4" },
        '004':   { inferior: "#ffbd59", medio: "#b4b4b4", superior: "#b4b4b4" },
        '005':{ inferior: "#ffbd59", medio: "#ff914d", superior: "#b4b4b4" },
        '006':  { inferior: "#ffbd59", medio: "#ff914d", superior: "#ff3131" }
    };
    
    const config = colores[estado] || colores.off;

    if (ledSuperior) ledSuperior.classList.add(`bg-[${config.superior}]`);
    if (ledMedio) ledMedio.classList.add(`bg-[${config.medio}]`);
    if (ledInferior) ledInferior.classList.add(`bg-[${config.inferior}]`);
};

// Función para cambiar la métrica mostrada en la gráfica biométrica
function updateBiometricMetric(canvasIndex, metric, labels, metricConfigs) {
    if (Object.keys(biometricChartInstances).length === 0) return;

    const config = metricConfigs[metric];
    if (!config) return;
    
    const chartKey = `${metric}_${canvasIndex}`;
    let chart = biometricChartInstances[chartKey];
    
    // Si no existe chart para esta métrica, usar updateBiometricChart para crearlo
    if (!chart) {
        console.log(`[BiometricCharts] Creando nueva gráfica para ${metric} en canvas ${canvasIndex}`);
        updateBiometricChart(canvasIndex, metric, labels, metricConfigs, biometricChartData);
        return;
    }

    const previousMetric = biometricLastMetric;
    biometricLastMetric = metric;

    console.log(`[BiometricCharts] Cambiando métrica a: ${metric} (canvas ${canvasIndex})`);

    chart.data.datasets[0].label = config.label;
    chart.data.datasets[0].data = [...biometricChartData[metric]];
    chart.data.datasets[0].borderColor = config.borderColor;
    chart.data.datasets[0].backgroundColor = config.bgColor;
    chart.data.datasets[0].pointBackgroundColor = config.borderColor;

    // Actualizar escalas
    chart.options.scales.y.min = config.yScale.min;
    chart.options.scales.y.max = config.yScale.max;

    chart.update();

    if (metric !== previousMetric) {
        if (metric === "oxygen") {
            requestSpo2Measurement("selector");
        } else if (metric === "pulse") {
            requestBpmMeasurement("selector");
        } else if (metric === "temperature") {
            requestTemperatureMeasurement("selector");
        } else if (metric === "bloodPressure") {
            requestBloodPressureMeasurement("selector");
        }
    }
}

// Función para actualizar los valores mostrados en TopMetricsGrid
function updateTopMetricsGrid(data) {
    if (!data) return;
    
    // Actualizar BPM (Pulso) - TODOS los paneles
    if (data.pulse !== null && data.pulse !== undefined) {
        const pulseElements = document.querySelectorAll(".metric-value-pulse");
        pulseElements.forEach(el => {
            el.textContent = Math.round(data.pulse);
        });
    }
    
    // Actualizar SpO2 (Oxigenación) - TODOS los paneles
    if (data.oxygen !== null && data.oxygen !== undefined) {
        const oxygenElements = document.querySelectorAll(".metric-value-oxygen");
        oxygenElements.forEach(el => {
            el.textContent = Math.round(data.oxygen);
        });
    }
    
    // Actualizar Temperatura - TODOS los paneles
    if (data.temperature !== null && data.temperature !== undefined) {
        const temperatureElements = document.querySelectorAll(".metric-value-temperature");
        temperatureElements.forEach(el => {
            el.textContent = parseFloat(data.temperature).toFixed(1);
        });
    }
    
    // Actualizar Presión Arterial - TODOS los paneles
    if (data.bloodPressure !== null && data.bloodPressure !== undefined) {
        const bpElements = document.querySelectorAll(".metric-value-bloodpressure");
        bpElements.forEach(el => {
            // Si es un objeto con systolic y diastolic, mostrar ambos
            if (typeof data.bloodPressure === 'object' && data.bloodPressure.systolic) {
                el.textContent = `${Math.round(data.bloodPressure.systolic)}/${Math.round(data.bloodPressure.diastolic)}`;
            } else {
                // Si es solo un número (systolic), mostrar ese valor
                el.textContent = Math.round(data.bloodPressure);
            }
        });
    }
}

// Función para detener y limpiar las gráficas biométricas
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

// Función para actualizar el estado de los botones de reloj según conexión
function updateWatchButtonsState() {
    console.log("[Biometría] Actualizando estado de botones, reloj conectado:", biometricWatchConnected);
    
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
        
        if (biometricWatchConnected) {
            connectBtn.disabled = true;
            connectBtn.classList.add("opacity-50", "cursor-not-allowed", "pointer-events-none");
            connectBtn.style.filter = "grayscale(100%)";
            
            disconnectBtn.disabled = false;
            disconnectBtn.classList.remove("opacity-50", "cursor-not-allowed", "pointer-events-none");
            disconnectBtn.style.filter = "none";
        } else {
            connectBtn.disabled = false;
            connectBtn.classList.remove("opacity-50", "cursor-not-allowed", "pointer-events-none");
            connectBtn.style.filter = "none";
            
            disconnectBtn.disabled = true;
            disconnectBtn.classList.add("opacity-50", "cursor-not-allowed", "pointer-events-none");
            disconnectBtn.style.filter = "grayscale(100%)";
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

                if (codigo === "CALOR") {
                    manejarCalor(btn, cabinaPrefijo, cabinaActiva, panel);
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
                console.log(`[Gráfica] Click en botón de sensor: ${sensorSeleccionado}`);
                
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
            function actualizarEstadoBotones() {
                const puertoConectado = puertoSerialConectado;
                
                // Botón ACTIVAR CABINA
                // Solo se habilita si: puerto conectado Y cabina NO activa
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

                // Reiniciar estado de calor
                estadoCalor = "off";
                actualizarLedCalor(panel, "off");

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

                // Detener gráficas biométricas si existen
                if (typeof window.stopBiometricCharts === "function") {
                    window.stopBiometricCharts();
                }

                // Limpiar datos biométricos acumulados
                if (window.biometricChartData) {
                    window.biometricChartData = {
                        pulse: [],
                        oxygen: [],
                        temperature: [],
                        glucose: [],
                    };
                }

                // Actualizar estado de botones
                actualizarEstadoBotones();

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
