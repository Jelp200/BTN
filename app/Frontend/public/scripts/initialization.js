/* *********************************************************************
********************** INICIALIZACIÓN DE EVENTOS ***********************
****** Este archivo maneja toda la inicialización del sistema ********
********************************************************************* */

/**
 * Función principal de inicialización
 * Se ejecuta cuando el DOM está completamente cargado
 */
function inicializarApp() {
    console.log("[Initialization] 🚀 Iniciando aplicación...");
    
    inicializarBotonesHeader();
    iniciarIntervalos();
    inicializarPaneles();
    inicializarBiometria();
    
    console.log("[Initialization] ✓ Aplicación inicializada correctamente");
}

/**
 * Inicializa los botones del header (conexión serial, exportar, etc.)
 */
function inicializarBotonesHeader() {
    const btnScanCom = document.getElementById("btn-scan-com");
    const btnConnectCom = document.getElementById("btn-connect-com");
    const btnDisconnectCom = document.getElementById("btn-disconnect-com");
    
    if (btnScanCom)
        btnScanCom.addEventListener("click", window.escanearPuertosCOM);
    if (btnConnectCom)
        btnConnectCom.addEventListener("click", window.conectarPuertoSerial);
    if (btnDisconnectCom)
        btnDisconnectCom.addEventListener("click", window.desconectarPuertoSerial);
    
    // Buscar TODOS los botones de exportar (hay uno en cada panel)
    const btnExports = document.querySelectorAll("#btn-export-csv");
    btnExports.forEach(btn => {
        btn.addEventListener("click", window.exportToExcel);
    });

    window.escanearPuertosCOM();
}

/**
 * Inicia los intervalos de actualización periódica
 * - Datos de cabinas cada 10s
 * - Procesamiento de tramas cada 10s
 */
function iniciarIntervalos() {
    const intervalo = 10000; // 10 segundos

    // Actualizar datos de ambas cabinas cada 10 segundos
    setInterval(() => {
        window.fetchDatosPorCabina("C1");
        window.fetchDatosPorCabina("C2");
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
                window.procesarTrama(data.tramaC1);
                window.mostrarNotificacion(data.tramaC1, "real");
            }

            if (data.tramaC2) {
                window.procesarTrama(data.tramaC2);
                window.mostrarNotificacion(data.tramaC2, "real");
            }
        } catch (error) {
            console.error("Error al procesar trama:", error);
        }
    }, intervalo);
}

/**
 * Inicializa los paneles de control
 * Configura tabs y secciones de dos columnas
 */
function inicializarPaneles() {
    const panels = document.querySelectorAll(".panel-container");
    panels.forEach((panel) => {
        window.initTwoColumnsSection(panel);
        window.initTabs(panel);
    });
}

/**
 * Inicializa el sistema de biometría
 * Configura eventos para conexión/desconexión de reloj y datos personales
 */
function inicializarBiometria() {
    // Inicializar estado de botones al cargar
    window.updateWatchButtonsState();
    
    // Usar delegación de eventos en el documento para mayor robustez
    document.addEventListener("click", async (event) => {
        const connectBtn = event.target.closest("[data-action='connect-watch']");
        const disconnectBtn = event.target.closest("[data-action='disconnect-watch']");
        
        if (connectBtn) {
            console.log("[Biometría] Click en botón CONECTAR");
            const panelContainer = connectBtn.closest(".panel-container");
            const panelCabin = window.getCabinFromPanel ? window.getCabinFromPanel(panelContainer) : "C1";
            
            const originalText = connectBtn.innerHTML;
            connectBtn.disabled = true;
            connectBtn.innerHTML = "Conectando...";

            const requestPayload = { cabin: panelCabin, deviceName: "ET570", scanTimeoutMs: 15000 };
            
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
                window.mostrarNotificacion?.(`Reloj ${panelCabin} conectado (${nombre})`, { tipo: "success" });
                
                // ✅ MARCAR RELOJ COMO CONECTADO (PRIMERO cambiar variable, LUEGO actualizar botones)
                biometricWatchConnectedByCabin[panelCabin] = true;
                biometricWatchConnected = Object.values(biometricWatchConnectedByCabin).some(Boolean);
                window.updateWatchButtonsState();
                
                // Inicializar gráficas si el tab de biometría ya está visible EN ESTE PANEL
                const biometriaTab = panelContainer?.querySelector("[data-tab-content='biometria']");
                const panelCanvas = panelContainer?.querySelector(".biometric-chart");
                
                if (biometriaTab && !biometriaTab.classList.contains("hidden") && panelCanvas) {
                    // Encontrar el índice de este canvas entre todos los canvas del documento
                    const allCanvases = Array.from(document.querySelectorAll(".biometric-chart"));
                    const canvasIndex = allCanvases.indexOf(panelCanvas);
                    
                    if (canvasIndex >= 0 && !biometricChartInstances[`pulse_${canvasIndex}`]) {
                        console.log(`[BiometricCharts] Tab de biometría visible en panel ${canvasIndex}. Inicializando gráfica...`);
                        window.initBiometricCharts(canvasIndex);
                    }
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
            const panelContainer = disconnectBtn.closest(".panel-container");
            const panelCabin = window.getCabinFromPanel ? window.getCabinFromPanel(panelContainer) : "C1";
            
            const originalHTML = disconnectBtn.innerHTML;
            disconnectBtn.disabled = true;

            // Log enviado
            console.log("[Biometría] Enviando solicitud de desconexión");
            window.addSentLog?.(`[SMARTWATCH][${panelCabin}] POST /api/smartwatch/disconnect`);

            try {
                const response = await fetch(`http://localhost:5000/api/smartwatch/disconnect?cabin=${panelCabin}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                });

                const data = await response.json().catch(() => ({}));
                
                console.log("[Biometría] Respuesta recibida:", { status: response.status, data });
                window.addReceivedLog?.(`[SMARTWATCH] Response Status: ${response.status}\nPayload: ${JSON.stringify(data)}`);
                
                if (!response.ok || !data.success) {
                    throw new Error(data.message || "No se pudo desconectar del reloj");
                }

                console.log("[Biometría] Reloj desconectado", panelCabin);
                window.mostrarNotificacion?.(`Reloj ${panelCabin} desconectado`, { tipo: "success" });
                
                // MARCAR RELOJ COMO DESCONECTADO (PRIMERO cambiar variable, LUEGO actualizar botones)
                biometricWatchConnectedByCabin[panelCabin] = false;
                biometricWatchConnected = Object.values(biometricWatchConnectedByCabin).some(Boolean);
                biometricMeasurementCompletionNotifiedByCabin[panelCabin] = false;
                biometricCurrentActiveMeasurementByCabin[panelCabin] = null;
                biometricPreviousActiveMeasurementByCabin[panelCabin] = null;
                window.updateWatchButtonsState();
                window.stopBiometricCharts(panelCabin);
            } catch (error) {
                console.error("[Biometria] Error desconectando reloj:", error);
                const mensaje = error?.message || "No se pudo desconectar del reloj";
                window.addReceivedLog?.(`[SMARTWATCH] Error: ${mensaje}`);
                window.mostrarNotificacion?.(mensaje, { tipo: "error" });
                alert(mensaje);
            } finally {
                disconnectBtn.disabled = false;
                disconnectBtn.innerHTML = originalHTML;
            }
        }

        // ============================================
        // Manejar botones de Datos Personales
        // ============================================
        const acceptPersonalBtn = event.target.closest("[data-action='accept-personal-data']");
        const cancelPersonalBtn = event.target.closest("[data-action='cancel-personal-data']");

        if (acceptPersonalBtn) {
            // Buscar los inputs dentro del formulario contenedor (mismo panel)
            const formContainer = acceptPersonalBtn.closest(".personal-data-form-container");
            const ageInput = formContainer?.querySelector(".personal-age");
            const heightInput = formContainer?.querySelector(".personal-height");
            const weightInput = formContainer?.querySelector(".personal-weight");
            const genderSelect = formContainer?.querySelector(".personal-gender");

            // Validar que todos los campos tengan datos
            if (!ageInput?.value || !heightInput?.value || !weightInput?.value) {
                alert("❌ Por favor completa todos los campos de datos personales");
                return;
            }

            // Guardar datos personales
            personalDataStored = {
                edad: ageInput.value,
                altura: heightInput.value,
                peso: weightInput.value,
                genero: genderSelect?.value || "",
            };

            console.log("[Personal Data] ✅ Datos guardados:", personalDataStored);
            alert("✅ Datos personales guardados correctamente");
        }

        if (cancelPersonalBtn) {
            // Limpiar campos - buscar dentro del mismo formulario contenedor
            const formContainer = cancelPersonalBtn.closest(".personal-data-form-container");
            const ageInput = formContainer?.querySelector(".personal-age");
            const heightInput = formContainer?.querySelector(".personal-height");
            const weightInput = formContainer?.querySelector(".personal-weight");
            
            if (ageInput) ageInput.value = "";
            if (heightInput) heightInput.value = "";
            if (weightInput) weightInput.value = "";

            console.log("[Personal Data] ✓ Campos limpiados");
        }
    });

    console.log("[Biometría] Delegación de eventos inicializada para [data-action='connect-watch'] y [data-action='disconnect-watch']");
}

/**
 * Inicializa las gráficas biométricas
 * @param {number|null} specificCanvasIndex - Índice específico del canvas a inicializar, o null para todos
 */
function initBiometricCharts(specificCanvasIndex = null) {
    console.log(`[BiometricCharts] Inicializando gráficas biométricas${specificCanvasIndex !== null ? ` para panel ${specificCanvasIndex}` : ' para todos los paneles'}`);
    
    // Preparar estructuras por cabina
    if (!biometricChartDataByCabin.C1) {
        biometricChartDataByCabin.C1 = { pulse: [], oxygen: [], temperature: [], bloodPressure: [] };
    }
    if (!biometricChartDataByCabin.C2) {
        biometricChartDataByCabin.C2 = { pulse: [], oxygen: [], temperature: [], bloodPressure: [] };
    }

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

    // Inicializar con datos vacíos (se llena desde backend)
    ["C1", "C2"].forEach((cabin) => {
        biometricChartDataByCabin[cabin] = {
            pulse: Array(10).fill(null),
            oxygen: Array(10).fill(null),
            temperature: Array(10).fill(null),
            bloodPressure: Array(10).fill(null),
        };
    });

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
        bloodPressure: { 
            label: "Presión Arterial (mmHg)", 
            yScale: { min: 80, max: 160 }, 
            borderColor: "#9b59b6", 
            bgColor: "rgba(155, 89, 182, 0.2)" 
        },
    };

    // Buscar canvas de biometría
    const allCanvases = document.querySelectorAll(".biometric-chart");
    console.log("[BiometricCharts] Canvas encontrados:", allCanvases.length);
    
    if (allCanvases.length === 0) {
        console.error("[BiometricCharts] ❌ No se encontraron elementos .biometric-chart");
        return;
    }

    // Filtrar canvas a inicializar
    const canvasesToInit = specificCanvasIndex !== null 
        ? [allCanvases[specificCanvasIndex]].filter(Boolean)
        : Array.from(allCanvases);
    
    if (canvasesToInit.length === 0) {
        console.error(`[BiometricCharts] ❌ Canvas índice ${specificCanvasIndex} no encontrado`);
        return;
    }

    // Inicializar gráfica para cada canvas seleccionado
    canvasesToInit.forEach((canvas) => {
        const idx = Array.from(allCanvases).indexOf(canvas);
        const panel = canvas.closest(".panel-container");
        const cabin = window.getCabinFromPanel ? window.getCabinFromPanel(panel) : "C1";
        const cabinData = biometricChartDataByCabin[cabin] || biometricChartData;
        try {
            console.log(`[BiometricCharts] Inicializando canvas ${idx}...`);
            
            // Validar dimensiones del canvas
            const container = canvas.parentElement;
            console.log(`[BiometricCharts] Canvas ${idx} - Dimensiones:`, {
                display: window.getComputedStyle(container).display,
                hidden: container.classList.contains("hidden")
            });

            const ctx = canvas.getContext("2d");
            if (!ctx) {
                console.error(`[BiometricCharts] ❌ No se pudo obtener contexto 2D para canvas ${idx}`);
                return;
            }

            const defaultMetric = "pulse";
            const config = metricConfigs[defaultMetric];

            // Guardar la instancia del chart (usar índice para múltiples paneles)
            biometricChartInstances[`pulse_${idx}`] = new Chart(ctx, {
                type: "line",
                data: {
                    labels,
                    datasets: [{
                        label: config.label,
                        data: [...(cabinData[defaultMetric] || [])],
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

            console.log(`[BiometricCharts] ✓ Gráfica ${idx} creada`);

            // Encontrar el selector de métrica más cercano a este canvas
            const chartContainer = canvas.closest(".biometric-charts-container");
            const selector = chartContainer?.querySelector(".biometric-metric-selector");
            
            if (selector) {
                // Remover listeners anteriores (si los hay)
                selector.replaceWith(selector.cloneNode(true));
                const newSelector = chartContainer.querySelector(".biometric-metric-selector");
                
                // Generar labels y configs aquí para que estén disponibles en el closure
                const now = new Date();
                const selectorLabels = [];
                for (let i = 9; i >= 0; i--) {
                    const time = new Date(now - i * 60000);
                    selectorLabels.push(time.toLocaleTimeString());
                }
                
                const selectorMetricConfigs = {
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
                    bloodPressure: { 
                        label: "Presión Arterial (mmHg)", 
                        yScale: { min: 80, max: 160 }, 
                        borderColor: "#9b59b6", 
                        bgColor: "rgba(155, 89, 182, 0.2)" 
                    },
                };
                
                newSelector.addEventListener("change", async (e) => {
                    const newMetric = e.target.value;
                    const previousMetric = biometricLastMetric;
                    
                    console.log(`[BiometricCharts] Cambiando métrica a: ${newMetric} (canvas ${idx})`);
                    
                    // Actualizar visualización de la gráfica
                    window.updateBiometricChart(idx, newMetric, selectorLabels, selectorMetricConfigs, cabinData);
                    
                    // Actualizar métrica actual
                    biometricLastMetric = newMetric;
                    
                    // Si cambió de métrica, iniciar medición correspondiente
                    if (newMetric !== previousMetric && biometricWatchConnectedByCabin[cabin]) {
                        console.log(`[BiometricCharts] Iniciando medición de ${newMetric}`);
                        
                        if (newMetric === "oxygen") {
                            await window.requestSpo2Measurement("selector", cabin);
                        } else if (newMetric === "pulse") {
                            await window.requestBpmMeasurement("selector", cabin);
                        } else if (newMetric === "temperature") {
                            await window.requestTemperatureMeasurement("selector", cabin);
                        } else if (newMetric === "bloodPressure") {
                            await window.requestBloodPressureMeasurement("selector", cabin);
                        }
                    }
                });
            }
        } catch (error) {
            console.error(`[BiometricCharts] ❌ Error inicializando canvas ${idx}:`, error);
        }
    });

    biometricChartsEnabled = true;
    console.log("[BiometricCharts] ✓ Gráficas biométricas inicializadas");
    
    // Cargar historial inicial desde backend (solo si no se ha hecho antes)
    if (!biometricUpdateInterval) {
        const now = new Date();
        const labels = [];
        for (let i = 9; i >= 0; i--) {
            const time = new Date(now - i * 60000);
            labels.push(time.toLocaleTimeString());
        }
        
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
            bloodPressure: { 
                label: "Presión Arterial (mmHg)", 
                yScale: { min: 80, max: 160 }, 
                borderColor: "#9b59b6", 
                bgColor: "rgba(155, 89, 182, 0.2)" 
            },
        };
        
        window.seedBiometricHistory(labels, metricConfigs, "C1");
        window.seedBiometricHistory(labels, metricConfigs, "C2");

        // Actualizar gráficas cada 5 segundos
        biometricUpdateInterval = setInterval(() => {
            window.updateBiometricCharts();
        }, 5000);
        
        // Monitorear estado de mediciones cada 2 segundos por cabina
        if (!biometricMonitoringStatusIntervals.C1) {
            biometricMonitoringStatusIntervals.C1 = setInterval(() => {
                window.checkMonitoringStatus("C1");
            }, 2000);
        }

        if (!biometricMonitoringStatusIntervals.C2) {
            biometricMonitoringStatusIntervals.C2 = setInterval(() => {
                window.checkMonitoringStatus("C2");
            }, 2000);
        }
        
        console.log("[BiometricCharts] ✓ Intervalos de actualización iniciados.");
    }
}

/* ==================== EXPONER FUNCIONES GLOBALMENTE ==================== */
// Exponer funciones para que puedan ser llamadas desde main.js
window.inicializarApp = inicializarApp;
window.initBiometricCharts = initBiometricCharts;
