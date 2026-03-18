/**
 * Funciones para exportar datos biométricos a Excel
 */

/**
 * Exporta datos biométricos al servidor para generar archivo Excel
 * @param {Object} biometricData - Datos de las gráficas biométricas
 * @param {string} cabin - Número de cabina (ej: "1" o "2")
 * @param {string} measurementType - Tipo de medición (BPM, SpO2, Temperature, BloodPressure, Completo)
 */
async function exportBiometricsToExcel(biometricData, cabin, measurementType = 'Completo') {
    try {
        console.log(`[EXPORT] Iniciando exportación de datos: Cabina ${cabin}, Tipo: ${measurementType}`);

        // Construir datos en formato que espera el backend
        const vitalsArray = [];

        // Si es "Completo", exportar todos los datos disponibles
        if (measurementType === 'Completo') {
            // Obtener la mayor cantidad de mediciones disponibles
            const maxLength = Math.max(
                biometricData.pulse?.length || 0,
                biometricData.oxygen?.length || 0,
                biometricData.temperature?.length || 0,
                biometricData.bloodPressure?.length || 0
            );

            // Construir array de vitals combinados
            for (let i = 0; i < maxLength; i++) {
                vitalsArray.push({
                    pulseBpm: biometricData.pulse?.[i] || null,
                    spO2: biometricData.oxygen?.[i] || null,
                    temperatureC: biometricData.temperature?.[i] || null,
                    systolic: biometricData.bloodPressure?.[i]?.systolic || null,
                    diastolic: biometricData.bloodPressure?.[i]?.diastolic || null,
                    timestampUtc: new Date().toISOString()
                });
            }
        } else {
            // Exportar solo el tipo de medición seleccionado
            let dataArray = [];
            
            switch (measurementType) {
                case 'BPM':
                    dataArray = biometricData.pulse || [];
                    break;
                case 'SpO2':
                    dataArray = biometricData.oxygen || [];
                    break;
                case 'Temperature':
                    dataArray = biometricData.temperature || [];
                    break;
                case 'BloodPressure':
                    dataArray = biometricData.bloodPressure || [];
                    break;
            }

            // Construir vitals array según el tipo
            dataArray.forEach((value, index) => {
                const vital = {
                    pulseBpm: null,
                    spO2: null,
                    temperatureC: null,
                    systolic: null,
                    diastolic: null,
                    timestampUtc: new Date().toISOString()
                };

                if (measurementType === 'BPM') vital.pulseBpm = value;
                else if (measurementType === 'SpO2') vital.spO2 = value;
                else if (measurementType === 'Temperature') vital.temperatureC = value;
                else if (measurementType === 'BloodPressure') {
                    vital.systolic = value?.systolic || value?.s || null;
                    vital.diastolic = value?.diastolic || value?.d || null;
                }

                vitalsArray.push(vital);
            });
        }

        if (vitalsArray.length === 0) {
            alert('❌ No hay datos para exportar. Por favor, ejecute primero una medición.');
            return;
        }

        // Enviar al servidor
        const response = await fetch('http://localhost:5000/api/smartwatch/export/excel', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                vitals: vitalsArray,
                cabin: cabin,
                measurementType: measurementType
            })
        });

        if (!response.ok) {
            throw new Error(`Error en exportación: ${response.statusText}`);
        }

        const result = await response.json();

        if (result.success) {
            console.log(`[EXPORT] ✅ Archivo generado: ${result.fileName}`);
            
            // Descargar automáticamente el archivo
            downloadExportFile(result.fileName);
            
            alert(`✅ Datos exportados correctamente a:\n${result.fileName}`);
        } else {
            throw new Error(result.message || 'Error desconocido en exportación');
        }
    } catch (error) {
        console.error('[EXPORT] ❌ Error al exportar:', error);
        alert(`❌ Error al exportar datos: ${error.message}`);
    }
}

/**
 * Descarga un archivo Excel desde el servidor
 * @param {string} fileName - Nombre del archivo a descargar
 */
async function downloadExportFile(fileName) {
    try {
        const response = await fetch(`http://localhost:5000/api/smartwatch/export/download?fileName=${encodeURIComponent(fileName)}`);
        
        if (!response.ok) {
            throw new Error(`Error descargando archivo: ${response.statusText}`);
        }

        // Crear blob y descargar
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);

        console.log(`[EXPORT] ✅ Archivo descargado: ${fileName}`);
    } catch (error) {
        console.error('[EXPORT] ❌ Error descargando archivo:', error);
    }
}

/**
 * Obtiene los datos de biometría desde el servidor
 */
async function fetchBiometricData() {
    try {
        const response = await fetch('http://localhost:5000/api/smartwatch/vitals/history?limit=1000');
        
        if (!response.ok) {
            throw new Error('No se pudo obtener datos biométricos');
        }

        const result = await response.json();
        return result.data || [];
    } catch (error) {
        console.error('[EXPORT] ❌ Error obteniendo datos:', error);
        return [];
    }
}

/**
 * Convierte datos del servidor (formato SmartwatchVitals) a formato para biometricChartData
 */
function convertServerDataToChartFormat(serverData) {
    const chartData = {
        pulse: [],
        oxygen: [],
        temperature: [],
        bloodPressure: []
    };

    serverData.forEach(vital => {
        if (vital.pulseBpm) chartData.pulse.push(vital.pulseBpm);
        if (vital.spO2) chartData.oxygen.push(vital.spO2);
        if (vital.temperatureC) chartData.temperature.push(vital.temperatureC);
        if (vital.systolic && vital.diastolic) {
            chartData.bloodPressure.push({
                systolic: vital.systolic,
                diastolic: vital.diastolic
            });
        }
    });

    return chartData;
}

/**
 * Crea un botón de exportación y lo devuelve como elemento DOM
 */
export function createExportButton() {
    const button = document.createElement('button');
    button.id = 'btn-export-biometrics';
    button.className = 'px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold flex items-center gap-2';
    button.title = 'Exportar datos biométricos a Excel';
    button.innerHTML = '<span>📊</span><span>Exportar a Excel</span>';

    button.addEventListener('click', async () => {
        const cabin = document.querySelector('[data-select="cabina"]')?.value || '1';
        
        // Mostrar opciones de qué exportar
        const exportType = prompt(
            'Seleccione tipo de exportación:\n' +
            '1. BPM\n' +
            '2. SpO2\n' +
            '3. Temperature\n' +
            '4. BloodPressure\n' +
            '5. Completo (todas las mediciones)\n\n' +
            'Ingrese el número (1-5) o nombre:',
            'Completo'
        );

        if (!exportType) return;

        const typeMap = {
            '1': 'BPM',
            '2': 'SpO2',
            '3': 'Temperature',
            '4': 'BloodPressure',
            '5': 'Completo'
        };

        const measurementType = typeMap[exportType] || exportType;
        
        button.disabled = true;
        button.innerHTML = '<span>⏳ Exportando...</span>';

        try {
            await exportBiometricsToExcel(window.biometricChartData || {}, cabin, measurementType);
        } finally {
            button.disabled = false;
            button.innerHTML = '<span>📊</span><span>Exportar a Excel</span>';
        }
    });

    return button;
}
