/**
 * Exporta toda la información del panel a un archivo Excel con 4 sheets
 * - Sheet 1: Información personal + Logs
 * - Sheet 2: Controles (tramas enviadas)
 * - Sheet 3: Sensores (datos de ambas cabinas)
 * - Sheet 4: Biometría (datos de ambas cabinas)
 */
async function exportToExcel() {
    try {
        const workbook = XLSX.utils.book_new();

        // Sheet 1: Información personal + Logs
        const sheet1Data = await createSheet1Data();
        const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);
        XLSX.utils.book_append_sheet(workbook, ws1, "Información Personal");

        // Sheet 2: Controles
        const sheet2Data = await createSheet2Data();
        const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
        XLSX.utils.book_append_sheet(workbook, ws2, "Controles");

        // Sheet 3: Sensores
        const sheet3Data = await createSheet3Data();
        const ws3 = XLSX.utils.aoa_to_sheet(sheet3Data);
        XLSX.utils.book_append_sheet(workbook, ws3, "Sensores");

        // Sheet 4: Biometría
        const sheet4Data = await createSheet4Data();
        const ws4 = XLSX.utils.aoa_to_sheet(sheet4Data);
        XLSX.utils.book_append_sheet(workbook, ws4, "Biometría");

        // Escribir el archivo
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
        XLSX.writeFile(workbook, `ControlPanel_Export_${timestamp}.xlsx`);

        console.log("[Excel Export] ✅ Archivo exportado exitosamente");
    } catch (error) {
        console.error("[Excel Export] ❌ Error al exportar:", error);
        alert("❌ Error al exportar el archivo: " + error.message);
    }
}

/**
 * Sheet 1: Información personal + Logs del backend
 */
async function createSheet1Data() {
    const data = [];

    // Encabezado
    data.push(["INFORMACIÓN PERSONAL Y LOGS"]);
    data.push([]);

    // Obtener información personal del formulario
    const personalData = getPersonalData();
    data.push(["Nombre:", personalData.nombre || "-"]);
    data.push(["Apellido:", personalData.apellido || "-"]);
    data.push(["Edad:", personalData.edad || "-"]);
    data.push(["Email:", personalData.email || "-"]);
    data.push(["Teléfono:", personalData.telefono || "-"]);
    data.push(["Empresa:", personalData.empresa || "-"]);
    data.push(["Puesto:", personalData.puesto || "-"]);
    data.push([]);

    // Logs del backend
    data.push(["LOGS DEL SISTEMA"]);
    data.push(["Tipo", "Hora", "Mensaje"]);

    // Obtener logs enviados
    const sentLogs = getLogsSent();
    sentLogs.forEach(log => {
        data.push(["ENVIADO", log.time, log.message]);
    });

    // Obtener logs recibidos
    const receivedLogs = getLogsReceived();
    receivedLogs.forEach(log => {
        data.push(["RECIBIDO", log.time, log.message]);
    });

    return data;
}

/**
 * Sheet 2: Controles (tramas enviadas)
 */
async function createSheet2Data() {
    const data = [];

    data.push(["TRAMAS DE CONTROL ENVIADAS"]);
    data.push(["Hora", "Código", "Descripción", "Cabina"]);

    // Obtener los logs enviados y filtrar por controles
    const sentLogs = getLogsSent();
    sentLogs.forEach(log => {
        const match = log.message.match(/\[(.*?)\]/);
        const control = match ? match[1] : "Control";
        
        // Solo incluir si es un control (código numérico)
        if (/^\d+$/.test(log.message.split("]")[1]?.trim() || "")) {
            data.push([log.time, log.code || "", log.message, "Ambas"]);
        }
    });

    if (data.length === 2) {
        data.push(["Sin registros", "", "", ""]);
    }

    return data;
}

/**
 * Sheet 3: Sensores de ambas cabinas
 */
async function createSheet3Data() {
    const data = [];

    data.push(["DATOS DE SENSORES"]);
    data.push([]);

    // Cabina 1
    data.push(["CABINA 1"]);
    data.push(["Sensor", "Última Lectura", "Unidad", "Hora"]);
    const sensorDataC1 = await getSensorData("C1");
    Object.entries(sensorDataC1).forEach(([sensor, value]) => {
        const config = window.sensorConfig?.[sensor];
        const label = config?.label || sensor;
        const unit = extractUnit(label);
        data.push([label, value || "-", unit, new Date().toLocaleTimeString()]);
    });

    data.push([]);

    // Cabina 2
    data.push(["CABINA 2"]);
    data.push(["Sensor", "Última Lectura", "Unidad", "Hora"]);
    const sensorDataC2 = await getSensorData("C2");
    Object.entries(sensorDataC2).forEach(([sensor, value]) => {
        const config = window.sensorConfig?.[sensor];
        const label = config?.label || sensor;
        const unit = extractUnit(label);
        data.push([label, value || "-", unit, new Date().toLocaleTimeString()]);
    });

    return data;
}

/**
 * Sheet 4: Biometría de ambas cabinas (C1 y C2 separadas)
 */
async function createSheet4Data() {
    const data = [];

    data.push(["DATOS BIOMÉTRICOS (DUAL-CABIN)"]);
    data.push([]);

    // Procesar ambas cabinas
    for (const cabin of ["C1", "C2"]) {
        data.push([`\n=== CABINA ${cabin} ===`]);
        data.push([]);

        // Intentar obtener del historial del servidor por cabina
        const biometricHistory = await getBiometricHistory(cabin);

        if (biometricHistory && biometricHistory.length > 0) {
            data.push(["Pulso (BPM)", "SpO2 (%)", "Temperatura (°C)", "Sistólica", "Diastólica", "Hora"]);
            
            biometricHistory.forEach(record => {
                data.push([
                    record.pulseBpm || "-",
                    record.spO2 || "-",
                    record.temperatureC || "-",
                    record.systolic || "-",
                    record.diastolic || "-",
                    new Date(record.timestampUtc).toLocaleString() || "-"
                ]);
            });

            // Agregar estadísticas
            data.push([]);
            data.push(["ESTADÍSTICAS"]);
            data.push(["Métrica", "Promedio", "Máximo", "Mínimo", "Total de Registros"]);

            // Estadísticas de BPM
            const pulsesFiltered = biometricHistory.map(r => r.pulseBpm).filter(v => v);
            if (pulsesFiltered.length > 0) {
                const avg = (pulsesFiltered.reduce((a, b) => a + b, 0) / pulsesFiltered.length).toFixed(1);
                const max = Math.max(...pulsesFiltered);
                const min = Math.min(...pulsesFiltered);
                data.push(["BPM", avg, max, min, pulsesFiltered.length]);
            }

            // Estadísticas de SpO2
            const oxygenFiltered = biometricHistory.map(r => r.spO2).filter(v => v);
            if (oxygenFiltered.length > 0) {
                const avg = (oxygenFiltered.reduce((a, b) => a + b, 0) / oxygenFiltered.length).toFixed(1);
                const max = Math.max(...oxygenFiltered);
                const min = Math.min(...oxygenFiltered);
                data.push(["SpO2 (%)", avg, max, min, oxygenFiltered.length]);
            }

            // Estadísticas de Temperatura
            const temperatureFiltered = biometricHistory.map(r => r.temperatureC).filter(v => v);
            if (temperatureFiltered.length > 0) {
                const avg = (temperatureFiltered.reduce((a, b) => a + b, 0) / temperatureFiltered.length).toFixed(1);
                const max = Math.max(...temperatureFiltered);
                const min = Math.min(...temperatureFiltered);
                data.push(["Temperatura (°C)", avg, max, min, temperatureFiltered.length]);
            }
        } else {
            // Fallback: intentar con biometricChartDataByCabin (dual-cabin state map)
            const cabinData = window.biometricChartDataByCabin?.[cabin];
            
            if (cabinData && (cabinData.pulse?.length > 0 || cabinData.oxygen?.length > 0 || 
                              cabinData.temperature?.length > 0 || cabinData.bloodPressure?.length > 0)) {
                
                // Usar datos del gráfico en formato tabular
                const maxLength = Math.max(
                    cabinData.pulse?.length || 0,
                    cabinData.oxygen?.length || 0,
                    cabinData.temperature?.length || 0,
                    cabinData.bloodPressure?.length || 0
                );

                data.push(["Pulso (BPM)", "SpO2 (%)", "Temperatura (°C)", "Sistólica", "Diastólica", "Índice"]);
                
                for (let i = 0; i < maxLength; i++) {
                    const pulse = cabinData.pulse?.[i] || "-";
                    const oxygen = cabinData.oxygen?.[i] || "-";
                    const temperature = cabinData.temperature?.[i] || "-";
                    const bp = cabinData.bloodPressure?.[i];
                    // Blood pressure puede ser un objeto {systolic, diastolic} o solo un número
                    const systolic = (typeof bp === 'object' ? bp?.systolic : bp) || "-";
                    const diastolic = (typeof bp === 'object' ? bp?.diastolic : "-") || "-";

                    data.push([pulse, oxygen, temperature, systolic, diastolic, i + 1]);
                }

                // Agregar estadísticas
                data.push([]);
                data.push(["ESTADÍSTICAS"]);
                data.push(["Métrica", "Promedio", "Máximo", "Mínimo"]);

                // Estadísticas de BPM
                if (cabinData.pulse?.length > 0) {
                    const avg = (cabinData.pulse.reduce((a, b) => a + b, 0) / cabinData.pulse.length).toFixed(1);
                    const max = Math.max(...cabinData.pulse);
                    const min = Math.min(...cabinData.pulse);
                    data.push(["BPM", avg, max, min]);
                }

                // Estadísticas de SpO2
                if (cabinData.oxygen?.length > 0) {
                    const avg = (cabinData.oxygen.reduce((a, b) => a + b, 0) / cabinData.oxygen.length).toFixed(1);
                    const max = Math.max(...cabinData.oxygen);
                    const min = Math.min(...cabinData.oxygen);
                    data.push(["SpO2 (%)", avg, max, min]);
                }

                // Estadísticas de Temperatura
                if (cabinData.temperature?.length > 0) {
                    const avg = (cabinData.temperature.reduce((a, b) => a + b, 0) / cabinData.temperature.length).toFixed(1);
                    const max = Math.max(...cabinData.temperature);
                    const min = Math.min(...cabinData.temperature);
                    data.push(["Temperatura (°C)", avg, max, min]);
                }
            } else {
                data.push([`Sin datos biométricos para ${cabin}`]);
            }
        }

        data.push([]); // Separador entre cabinas
    }

    return data;
}

/**
 * Obtiene información personal del formulario
 */
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

/**
 * Obtiene los logs enviados desde el DOM
 */
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
            logs.push({ time, message, code: extractCode(message) });
        }
    });

    return logs;
}

/**
 * Obtiene los logs recibidos desde el DOM
 */
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

/**
 * Obtiene datos de sensores de una cabina específica
 */
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

/**
 * Obtiene historial biométrico por cabina
 * @param {string} cabin - Cabina (C1 o C2)
 */
async function getBiometricHistory(cabin = "C1") {
    try {
        const normalizedCabin = (cabin || "C1").toString().trim().toUpperCase();
        const response = await fetch(`http://localhost:5000/api/smartwatch/vitals/history?cabin=${normalizedCabin}`);
        if (!response.ok) return [];
        
        const result = await response.json();
        return result.success && result.data ? result.data : [];
    } catch (error) {
        console.warn(`[Excel Export] Error obteniendo historial biométrico para ${cabin}:`, error);
        return [];
    }
}

/**
 * Extrae el código de un mensaje de log
 */
function extractCode(message) {
    const match = message.match(/\d+/);
    return match ? match[0] : "";
}

/**
 * Extrae la unidad de una etiqueta de sensor
 */
function extractUnit(label) {
    const match = label.match(/\((.*?)\)/);
    return match ? match[1] : "";
}
