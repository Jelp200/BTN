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
let biometricWatchConnectedByCabin = { C1: false, C2: false };
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
let biometricChartDataByCabin = {
  C1: { pulse: [], oxygen: [], temperature: [], bloodPressure: [], labels: [] },
  C2: { pulse: [], oxygen: [], temperature: [], bloodPressure: [], labels: [] },
};
let biometricLastTimestampByCabin = { C1: null, C2: null };
let biometricUpdateInterval = null;
let biometricMonitoringStatusIntervals = { C1: null, C2: null };
let biometricLastMetric = "pulse";
let biometricLastRequestByCabin = {
  C1: { bpm: 0, spo2: 0, temperature: 0, bloodPressure: 0 },
  C2: { bpm: 0, spo2: 0, temperature: 0, bloodPressure: 0 },
};
let biometricCurrentActiveMeasurementByCabin = { C1: null, C2: null };
let biometricPreviousActiveMeasurementByCabin = { C1: null, C2: null };
let biometricMeasurementCompletionNotifiedByCabin = { C1: false, C2: false };

/* ==================== ESTADOS DE MODO BIOMÉTRICO ==================== */
let biometricModeByCabin = { C1: null, C2: null };         // null | 'auto' | 'event'
let biometricAutoTimerByCabin = { C1: null, C2: null };    // setTimeout ID (descanso 5 min)
let biometricAutoCountdownByCabin = { C1: null, C2: null };// setInterval ID (contador visual)
let biometricFirstMeasurementDoneByCabin = { C1: false, C2: false }; // habilita botones de modo
let biometricLastCompletedMetricByCabin = { C1: null, C2: null };   // última métrica completada
const BIOMETRIC_AUTO_CYCLE_ORDER = ['bpm', 'spo2', 'temperature', 'bloodPressure'];
const BIOMETRIC_AUTO_REST_MS = 5 * 60 * 1000; // 5 min entre ciclos completos

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
    CALOR_C1: { off: "002", on: "003", low: "004", medium: "005", high: "006" },
    CALOR_C2: { off: "002", on: "003", low: "004", medium: "005", high: "006" },
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
    { nombre: "Tinitus 1",  codigo: "070" },
    { nombre: "Tinitus 2",  codigo: "071" },
    { nombre: "Tinitus 3",  codigo: "072" },
    { nombre: "Tinitus 4",  codigo: "073" },
    { nombre: "Tinitus 5",  codigo: "074" },
    { nombre: "Tinitus 6",  codigo: "075" },
    { nombre: "Tinitus 7",  codigo: "076" },
    { nombre: "Tinitus 8",  codigo: "077" },
    { nombre: "Tinitus 9",  codigo: "078" },
    { nombre: "Tinitus 10", codigo: "079" },
    { nombre: "Tinitus 11", codigo: "080" },
    { nombre: "Tinitus 12", codigo: "081" },
];

// Lista de tonos de frecuencia pura (audiometría)
const tonosPuros = [
    { nombre: "Tono 125Hz", codigo: "082" },
    { nombre: "Tono 250Hz", codigo: "083" },
    { nombre: "Tono 500Hz", codigo: "084" },
    { nombre: "Tono 1kHz",  codigo: "085" },
    { nombre: "Tono 2kHz",  codigo: "086" },
    { nombre: "Tono 4kHz",  codigo: "087" },
    { nombre: "Tono 6kHz",  codigo: "088" },
    { nombre: "Tono 8kHz",  codigo: "089" },
];

// Código para detener reproducción
const TRAMA_STOP = "038";

// Configuración de sensores
const sensorConfig = {
    T: { frecuencia: 60, label: "Temperatura (°C)" },
    H: { frecuencia: 60, label: "Humedad (%)" },
    CO2: { frecuencia: 60, label: "CO₂ (ppm)" },
    O3: { frecuencia: 60, label: "Iluminancia (lm/m²)" },
    UV: { frecuencia: 60, label: "UV (W/m²)" },
    dB: { frecuencia: 60, label: "Ruido (dB)" },
    X: { frecuencia: 1, label: "Aceleración X (m/s²)" },
    Y: { frecuencia: 1, label: "Aceleración Y (m/s²)" },
    Z: { frecuencia: 1, label: "Aceleración Z (m/s²)" },
};

//! Descripcion de control
const controlDescripcion = {
//! ACTUADORES
//! CABINA 1
  //? FRIO
  'C1000F': 'Apagado aire acondicionado',
  'C1001F': 'Encendido aire acondicionado',
  //? CALOR
  'C1002F': 'Apagado calefactor',
  'C1003F': 'Encendido calefactor',
  'C1004F': 'Nivel bajo calefactor',
  'C1005F': 'Nivel medio calefactor',
  'C1006F': 'Nivel alto calefactor',
  //? HUMEDAD
  'C1007F': 'Apagado humedad',
  'C1008F': 'Encendido humedad',
  //? VIBRACION
  'C1009F': 'Apagado vibración',
  'C1010F': 'Encendido vibración',
  //? VENTILADOR
  'C1011F': 'Apagado ventilador',
  'C1012F': 'Encendido ventilador',
  //? EXTRACTOR
  'C1013F': 'Apagado extractor',
  'C1014F': 'Encendido extractor',
  //? DESHUMIFICADOR
  'C1015F': 'Apagado deshumificador',
  'C1016F': 'Encendido deshumificador',
  //? HUMO
  'C1017F': 'Apagado humo',
  'C1018F': 'Encendido humo',
  //? DISPARO
  'C1019F': 'Apagado disparo',
  'C1020F': 'Encendido disparo',
//! PISTAS
  'C1035F': 'Play',
  'C1036F': 'Volumen "+"',
  'C1037F': 'Volumen "-"',
  'C1038F': 'Stop',
  'C1039F': 'Pista 1 (Aire acondicionado)',
  'C1040F': 'Pista 2 (Aspiradora)',
  'C1041F': 'Pista 3 (Centro comercial)',
  'C1042F': 'Pista 4 (Maquina de coser)',
  'C1043F': 'Pista 5 (Construcción)',
  'C1044F': 'Pista 6 (Lavadora de ropa)',
  'C1045F': 'Pista 7 (Martillo hidraulico)',
  'C1046F': 'Pista 8 (Motosierra)',
  'C1047F': 'Pista 9 (Secadora de cabello)',
  'C1048F': 'Pista 10 (Taladro)',
  'C1049F': 'Pista 11 (Ventilador)',
  'C1050F': 'Pista 12 (Ventilador industrial)',
//! SONIDOS AMBIENTALES
  'C1070F': 'Pista 13 (Tinitus 1)',
  'C1071F': 'Pista 14 (Tinitus 2)',
  'C1072F': 'Pista 15 (Tinitus 3)',
  'C1073F': 'Pista 16 (Tinitus 4)',
  'C1074F': 'Pista 17 (Tinitus 5)',
  'C1075F': 'Pista 18 (Tinitus 6)',
  'C1076F': 'Pista 19 (Tinitus 7)',
  'C1077F': 'Pista 20 (Tinitus 8)',
  'C1078F': 'Pista 21 (Tinitus 9)',
  'C1079F': 'Pista 22 (Tinitus 10)',
  'C1080F': 'Pista 23 (Tinitus 11)',
  'C1081F': 'Pista 24 (Tinitus 12)',
  'C1082F': 'Pista 25 (Tono 125Hz)',
  'C1083F': 'Pista 26 (Tono 250Hz)',
  'C1084F': 'Pista 27 (Tono 500Hz)',
  'C1085F': 'Pista 28 (Tono 1kHz)',
  'C1086F': 'Pista 29 (Tono 2kHz)',
  'C1087F': 'Pista 30 (Tono 4kHz)',
  'C1088F': 'Pista 31 (Tono 8kHz)',
//! TONOS
  'C1100F': 'Apagado total luces RGB',
  'C1101F': 'Encendido luz calida',
  'C1102F': 'Encendido luz fría',
  'C1103F': 'Encendido luz neutra',
  'C1104F': 'Encendio de luz red',
  'C1105F': 'Encendio de luz orangered',
  'C1106F': 'Encendio de luz darkorange',
  'C1107F': 'Encendio de luz orangered',
  'C1108F': 'Encendio de luz yellow',
  'C1109F': 'Encendio de luz blue',
  'C1110F': 'Encendio de luz dodgerblue',
  'C1111F': 'Encendio de luz midnightblue',
  'C1112F': 'Encendio de luz purple',
  'C1113F': 'Encendio de luz violet',
  'C1114F': 'Encendio de luz green',
  'C1115F': 'Encendio de luz lawgreen',
  'C1116F': 'Encendio de luz limegreen',
  'C1117F': 'Encendio de luz seagreen',
  'C1118F': 'Encendio de luz teal',
  'C1119F': 'Strobo',
  'C1120F': 'Flash',
  'C1121F': 'Brillo "+"',
  'C1122F': 'Brillo "-"',
//! CABINA 2
  //? FRIO
  'C2000F': 'Apagado aire acondicionado',
  'C2001F': 'Encendido aire acondicionado',
  //? CALOR
  'C2002F': 'Apagado calefactor',
  'C2003F': 'Encendido calefactor',
  'C2004F': 'Nivel bajo calefactor',
  'C2005F': 'Nivel medio calefactor',
  'C2006F': 'Nivel alto calefactor',
  //? HUMEDAD
  'C2007F': 'Apagado humedad',
  'C2008F': 'Encendido humedad',
  //? VIBRACION
  'C2009F': 'Apagado vibración',
  'C2010F': 'Encendido vibración',
  //? VENTILADOR
  'C2011F': 'Apagado ventilador',
  'C2012F': 'Encendido ventilador',
  //? EXTRACTOR
  'C2013F': 'Apagado extractor',
  'C2014F': 'Encendido extractor',
  //? DESHUMIFICADOR
  'C2015F': 'Apagado deshumificador',
  'C2016F': 'Encendido deshumificador',
  //? HUMO
  'C2017F': 'Apagado humo',
  'C2018F': 'Encendido humo',
  //? DISPARO
  'C2019F': 'Apagado disparo',
  'C2020F': 'Encendido disparo',
  //! PISTAS
  'C2035F': 'Play',
  'C2036F': 'Volumen "+"',
  'C2037F': 'Volumen "-"',
  'C2038F': 'Stop',
  'C2039F': 'Pista 1 (Aire acondicionado)',
  'C2040F': 'Pista 2 (Aspiradora)',
  'C2041F': 'Pista 3 (Centro comercial)',
  'C2042F': 'Pista 4 (Maquina de coser)',
  'C2043F': 'Pista 5 (Construcción)',
  'C2044F': 'Pista 6 (Lavadora de ropa)',
  'C2045F': 'Pista 7 (Martillo hidraulico)',
  'C2046F': 'Pista 8 (Motosierra)',
  'C2047F': 'Pista 9 (Secadora de cabello)',
  'C2048F': 'Pista 10 (Taladro)',
  'C2049F': 'Pista 11 (Ventilador)',
  'C2050F': 'Pista 12 (Ventilador industrial)',
//! SONIDOS AMBIENTALES
  'C2070F': 'Pista 13 (Tinitus 1)',
  'C2071F': 'Pista 14 (Tinitus 2)',
  'C2072F': 'Pista 15 (Tinitus 3)',
  'C2073F': 'Pista 16 (Tinitus 4)',
  'C2074F': 'Pista 17 (Tinitus 5)',
  'C2075F': 'Pista 18 (Tinitus 6)',
  'C2076F': 'Pista 19 (Tinitus 7)',
  'C2077F': 'Pista 20 (Tinitus 8)',
  'C2078F': 'Pista 21 (Tinitus 9)',
  'C2079F': 'Pista 22 (Tinitus 10)',
  'C2080F': 'Pista 23 (Tinitus 11)',
  'C2081F': 'Pista 24 (Tinitus 12)',
  'C2082F': 'Pista 25 (Tono 125Hz)',
  'C2083F': 'Pista 26 (Tono 250Hz)',
  'C2084F': 'Pista 27 (Tono 500Hz)',
  'C2085F': 'Pista 28 (Tono 1kHz)',
  'C2086F': 'Pista 29 (Tono 2kHz)',
  'C2087F': 'Pista 30 (Tono 4kHz)',
  'C2088F': 'Pista 31 (Tono 8kHz)',
//! TONOS
  'C2100F': 'Apagado total luces RGB',
  'C2101F': 'Encendido luz calida',
  'C2102F': 'Encendido luz fría',
  'C2103F': 'Encendido luz neutra',
  'C2104F': 'Encendio de luz red',
  'C2105F': 'Encendio de luz orangered',
  'C2106F': 'Encendio de luz darkorange',
  'C2107F': 'Encendio de luz orangered',
  'C2108F': 'Encendio de luz yellow',
  'C2109F': 'Encendio de luz blue',
  'C2110F': 'Encendio de luz dodgerblue',
  'C2111F': 'Encendio de luz midnightblue',
  'C2112F': 'Encendio de luz purple',
  'C2113F': 'Encendio de luz violet',
  'C2114F': 'Encendio de luz green',
  'C2115F': 'Encendio de luz lawgreen',
  'C2116F': 'Encendio de luz limegreen',
  'C2117F': 'Encendio de luz seagreen',
  'C2118F': 'Encendio de luz teal',
  'C2119F': 'Strobo',
  'C2120F': 'Flash',
  'C2121F': 'Brillo "+"',
  'C2122F': 'Brillo "-"',
};

/* ==================== EXPOSICIÓN EN WINDOW ==================== */
// Hacer constantes disponibles globalmente
window.codigoBoton = codigoBoton;
window.codigoSonidoControl = codigoSonidoControl;
window.sonidosAmbientales = sonidosAmbientales;
window.tinitus = tinitus;
window.tonosPuros = tonosPuros;
window.TRAMA_STOP = TRAMA_STOP;
window.sensorConfig = sensorConfig;
window.controlDescripcion = controlDescripcion;
