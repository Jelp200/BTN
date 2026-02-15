#define BAUD_RATE 9600

// =====================================================
// UART2 (ESP32)
// =====================================================
#define RXD2 16
#define TXD2 17

// =====================================================
// CONFIGURACIÓN DE TIEMPOS
// =====================================================
const unsigned long INTERVALO_ENVIO = 10000;
const unsigned long RETARDO_INICIAL = 5000;
const unsigned long RETRASO_CABINA2 = 3000;
const unsigned long INTERVALO_ENTRE_TRAMAS = 1000;

unsigned long lastCycleTime = 0;
bool enviandoCabina1 = false;
bool enviandoCabina2 = false;
unsigned long lastTramaTime = 0;
int indexC1 = 0;
int indexC2 = 0;

// =====================================================
// DATOS SIMULADOS
// =====================================================
const char *cabina1_data[] = {
    "C1|X:0.23|Y:0.42|Z:-0.91|T:28.10|H:48.00|",
    "C1|X:-1.68|Y:1.31|Z:1.59|T:28.20|H:48.00|",
    "C1|X:1.39|Y:-0.43|Z:-0.62|T:27.30|H:48.00|"};

const char *cabina2_data[] = {
    "C2|X:0.27|Y:-1.88|Z:-1.40|T:25.15|H:46.26|",
    "C2|X:1.27|Y:-0.64|Z:-1.83|T:26.15|H:46.26|",
    "C2|X:-0.47|Y:0.14|Z:-0.04|T:27.15|H:46.26|"};

const int cabina1_size = sizeof(cabina1_data) / sizeof(cabina1_data[0]);
const int cabina2_size = sizeof(cabina2_data) / sizeof(cabina2_data[0]);

// =====================================================
// FUNCIÓN: Mostrar en Terminal
// =====================================================
void logMsg(String msg)
{
    Serial.println("🖥 " + msg);
    Serial2.println("🖥 " + msg);
}

// =====================================================
// SETUP
// =====================================================
void setup()
{

    Serial.begin(BAUD_RATE);

    // UART2 en pines definidos
    Serial2.begin(BAUD_RATE, SERIAL_8N1, RXD2, TXD2);

    pinMode(2, OUTPUT); // LED integrado típico en ESP32 DevKit

    logMsg("ESP32 listo. Enviando tramas...");
}

// =====================================================
// LOOP
// =====================================================
void loop()
{

    unsigned long now = millis();

    recibirComandos();

    if (now < RETARDO_INICIAL)
        return;

    // Iniciar ciclo cada 10s
    if ((now - lastCycleTime) >= INTERVALO_ENVIO)
    {

        enviandoCabina1 = true;
        enviandoCabina2 = false;

        indexC1 = 0;
        indexC2 = 0;

        lastTramaTime = now;
        lastCycleTime = now;

        logMsg("→ Enviando Cabina 1");
    }

    // Cabina 1
    if (enviandoCabina1 && (now - lastTramaTime >= INTERVALO_ENTRE_TRAMAS))
    {

        enviarTrama(cabina1_data[indexC1]);
        indexC1++;
        lastTramaTime = now;

        if (indexC1 >= cabina1_size)
        {
            enviandoCabina1 = false;
            enviandoCabina2 = true;

            lastTramaTime = now + RETRASO_CABINA2;
            logMsg("→ Esperando Cabina 2");
        }
    }

    // Cabina 2
    if (enviandoCabina2 && (now - lastTramaTime >= INTERVALO_ENTRE_TRAMAS))
    {

        enviarTrama(cabina2_data[indexC2]);
        indexC2++;
        lastTramaTime = now;

        if (indexC2 >= cabina2_size)
        {
            enviandoCabina2 = false;
            logMsg("→ Ciclo finalizado");
        }
    }
}

// =====================================================
// ENVIAR TRAMA
// =====================================================
void enviarTrama(const char *trama)
{

    Serial.println(trama);
    Serial2.println(trama);

    logMsg("Trama enviada correctamente");
}

// =====================================================
// RECIBIR COMANDOS USB
// =====================================================
void recibirComandos()
{

    if (Serial.available())
    {

        // Leer comando completo
        String cmd = Serial.readStringUntil('\n');
        cmd.trim();

        if (cmd.length() > 0)
        {

            logMsg("📡 Comando recibido: " + cmd);

            // Parpadeo LED interno (cualquier comando)
            digitalWrite(2, HIGH);
            delay(500);

            digitalWrite(2, LOW);
            delay(500);

            logMsg("💡 LED parpadeó por comando recibido");
        }
    }
}