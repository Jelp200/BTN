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

/* *********************************************************************
*************************** MAPEO DE CODIGOS ***************************
********************************************************************* */
const codigosBoton = {
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

/* *********************************************************************
********************** INICIALIZACIÓN DE EVENTOS ***********************
********************************************************************* */
window.addEventListener("DOMContentLoaded", () => {
    inicializarBotonesHeader();
    iniciarIntervalos();
    inicializarPaneles();
});

// TODO: completar
function 