/*
* #######################################################################################################################################
*      Archivo: TestingMicroC.ino
*      Proyecto: Botonera (BTN) - Simulador de tramas
*      SO: Windows 11
*      Herramienta: Visual Studio Code
*      Autor: Salvador Zavala (Raiden2121)
*      Descripción:
*          Simulador de tramas de sensores para cabinas ambientales.
*          Genera datos simulados y permite enviarlas a través del puerto serial cada 10s :
*          C#Cabina|X:#Flotante|Y:#Flotante|Z:#Flotante|T:#Flotante|H:#Flotante|UV:#Flotante|CO2:#Flotante|O3:#Flotante|dB:#Flotante|
* ######################################################################################################################################
*/

// ============================
// Cabinas: datos simulados
// ============================

const char *cabina1_data[] = {
    "C1|X:0.23|Y:0.42|Z:-0.91|T:28.10|H:48.00|UV:4.54|CO2:510.49|O3:0.10|dB:63.68|",
    "C1|X:-1.68|Y:1.31|Z:1.59|T:28.20|H:48.00|UV:4.54|CO2:510.49|O3:0.10|dB:44.29|",
    "C1|X:1.39|Y:-0.43|Z:-0.62|T:27.30|H:48.00|UV:4.54|CO2:510.49|O3:0.10|dB:43.55|",
    "C1|X:0.67|Y:-0.91|Z:0.44|T:27.40|H:48.00|UV:4.54|CO2:510.49|O3:0.10|dB:97.80|",
    "C1|X:1.23|Y:1.76|Z:1.66|T:26.50|H:48.00|UV:4.54|CO2:510.49|O3:0.10|dB:60.65|",
    "C1|X:-0.69|Y:-0.61|Z:-0.05|T:26.60|H:48.00|UV:4.54|CO2:510.49|O3:0.10|dB:40.65|",
    "C1|X:-0.50|Y:-1.26|Z:-0.27|T:27.70|H:48.00|UV:4.54|CO2:510.49|O3:0.10|dB:87.30|",
    "C1|X:-0.99|Y:0.97|Z:0.90|T:27.80|H:48.00|UV:4.54|CO2:510.49|O3:0.10|dB:62.00|",
    "C1|X:0.35|Y:0.33|Z:1.37|T:28.90|H:48.00|UV:4.54|CO2:510.49|O3:0.10|dB:72.48|",
    "C1|X:-0.67|Y:0.59|Z:-1.62|T:29.00|H:48.00|UV:4.54|CO2:510.49|O3:0.10|dB:64.04|"};

const char *cabina2_data[] = {
    "C2|X:0.27|Y:-1.88|Z:-1.40|T:25.15|H:46.26|UV:8.41|CO2:651.30|O3:0.04|dB:85.40|",
    "C2|X:1.27|Y:-0.64|Z:-1.83|T:26.15|H:46.26|UV:8.41|CO2:651.30|O3:0.04|dB:42.01|",
    "C2|X:-0.47|Y:0.14|Z:-0.04|T:27.15|H:46.26|UV:8.41|CO2:651.30|O3:0.04|dB:70.81|",
    "C2|X:-0.42|Y:-0.78|Z:-1.42|T:23.15|H:46.26|UV:8.41|CO2:651.30|O3:0.04|dB:71.51|",
    "C2|X:1.32|Y:-0.29|Z:-1.87|T:24.15|H:46.26|UV:8.41|CO2:651.30|O3:0.04|dB:69.75|",
    "C2|X:1.11|Y:0.32|Z:1.16|T:25.15|H:46.26|UV:8.41|CO2:651.30|O3:0.04|dB:36.16|",
    "C2|X:0.24|Y:-1.70|Z:-1.61|T:23.15|H:46.26|UV:8.41|CO2:651.30|O3:0.04|dB:81.37|",
    "C2|X:-1.92|Y:-1.29|Z:-0.56|T:22.15|H:46.26|UV:8.41|CO2:651.30|O3:0.04|dB:46.29|",
    "C2|X:0.72|Y:0.70|Z:0.38|T:21.15|H:46.26|UV:8.41|CO2:651.30|O3:0.04|dB:91.15|",
    "C2|X:-1.43|Y:1.45|Z:-1.53|T:20.15|H:46.26|UV:8.41|CO2:651.30|O3:0.04|dB:71.68|"};

const int cabina1_size = sizeof(cabina1_data) / sizeof(cabina1_data[0]);
const int cabina2_size = sizeof(cabina2_data) / sizeof(cabina2_data[0]);

// ============================
// Control de estado
// ============================

unsigned long lastSendTimeC1 = 0;
unsigned long lastSendTimeC2 = 0;

int indexC1 = 0;
int indexC2 = 0;

const unsigned long intervalo = 10000;   // 10 segundos
const unsigned long delayInicio = 15000; // 15 segundos

void setup()
{
    Serial.begin(9600);
    // Serial.println("Sistema iniciado. Esperando 15 segundos antes de enviar datos...");
}

void loop()
{
    unsigned long currentMillis = millis();

    // Solo empieza a mandar despuÃ©s de 15 segundos
    if (currentMillis >= delayInicio)
    {

        // Cabina 1
        if (currentMillis - lastSendTimeC1 >= intervalo && indexC1 < cabina1_size)
        {
            Serial.println(cabina1_data[indexC1]);
            indexC1++;
            lastSendTimeC1 = currentMillis;
        }

        // Cabina 2
        if (currentMillis - lastSendTimeC2 >= intervalo && indexC2 < cabina2_size)
        {
            Serial.println(cabina2_data[indexC2]);
            indexC2++;
            lastSendTimeC2 = currentMillis;
        }
    }
}