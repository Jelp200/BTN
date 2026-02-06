/* *********************************************************************
*************** VARIABLES, ESTADOS Y CONSTANTES GLOBALES ***************
****** Este archivo contiene todas las variables globales del app ******
********************************************************************* */

/* ==================== ESTADOS GLOBALES ==================== */
let puertoSerial;
let cabinaActiva = false;
let puertoSerialConectado = false;
let puertoPreviamenteConectado = false;
let volumenPorCabina = { "Cabina 1": 0, "Cabina 2": 0 };
let reproduciendoPorCabina = { "Cabina 1": false, "Cabina 2": false };
let botonPlayActivoPorCabina = { "Cabina 1": null, "Cabina 2": null };
let sonidoActivoPorCabina = { "Cabina 1": null, "Cabina 2": null };
let estadoCalor = "off";

/* ==================== ESTADOS BIOMÉTRICOS ==================== */
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
    bloodPressure: [],
};
let biometricUpdateInterval = null;
let biometricMonitoringStatusInterval = null;
let biometricLastMetric = "pulse";
let biometricLastBpmRequestAt = 0;
let biometricLastSpo2RequestAt = 0;
let biometricLastTemperatureRequestAt = 0;
let biometricLastBloodPressureRequestAt = 0;
let biometricCurrentActiveMeasurement = null;
let biometricPreviousActiveMeasurement = null;
let biometricMeasurementCompletionNotified = false; // Flag para evitar múltiples notificaciones

/* ==================== DATOS PERSONALES ==================== */
let personalDataStored = {
    edad: "",
    altura: "",
    peso: "",
    genero: "",
};

/* ==================== CONSTANTES ==================== */
const BIOMETRIC_REQUEST_COOLDOWN_MS = 15000;

// Códigos de botones de control
const codigoBoton = {
    FRIO: { off: "000", on: "001" },
    CALOR: { off: "002", on: "003", low: "004", medium: "005", high: "006" },
    HUMEDAD: { off: "007", on: "008" },
    VIBRACION: { off: "009", on: "010" },
    VENTILADOR: { off: "011", on: "012" },
    EXTRACTOR: { off: "013", on: "014" },
    DESHUMIDIFICADOR: { off: "015", on: "016" },
    HUMO: { off: "017", on: "018" },
    DISPARO: { off: "019", on: "020" },
};

// Códigos de control de sonido
const codigoSonidoControl = {
    PLAY: "035",
    VMAS: "036",
    VMEN: "037",
    STOP: "038",
};

// Lista de sonidos ambientales
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

// Lista de tonos de tinitus
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

// Código para detener reproducción
const TRAMA_STOP = "038";

// Configuración de sensores
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

// Ciclo de temperaturas de calor
const calorCycle = [
    "on",
    "low",
    "medium",
    "high",
    "off",
];

/* ==================== EXPOSICIÓN EN WINDOW ==================== */
// Hacer constantes disponibles globalmente
window.codigoBoton = codigoBoton;
window.codigoSonidoControl = codigoSonidoControl;
window.sonidosAmbientales = sonidosAmbientales;
window.tinitus = tinitus;
window.TRAMA_STOP = TRAMA_STOP;
window.sensorConfig = sensorConfig;
