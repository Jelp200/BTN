#define BAUD_RATE 9600

// =====================================================
// CONFIGURACIÓN DE SIMULACIÓN Y TIEMPOS
// =====================================================
const unsigned long INTERVALO_ENVIO = 10000;
const unsigned long RETARDO_INICIAL = 15000;
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
    "C1|X:0.23|Y:0.42|Z:-0.91|T:28.10|H:48.00|UV:4.54|CO2:510.49|O3:0.10|dB:63.68|",
    "C1|X:-1.68|Y:1.31|Z:1.59|T:28.20|H:48.00|UV:4.54|CO2:510.49|O3:0.10|dB:44.29|",
    "C1|X:1.39|Y:-0.43|Z:-0.62|T:27.30|H:48.00|UV:4.54|CO2:510.49|O3:0.10|dB:43.55|",
    "C1|X:0.67|Y:-0.91|Z:0.44|T:27.40|H:48.00|UV:4.54|CO2:510.49|O3:0.10|dB:97.80|",
    "C1|X:1.23|Y:1.76|Z:1.66|T:26.50|H:48.00|UV:4.54|CO2:510.49|O3:0.10|dB:60.65|"
};

const char *cabina2_data[] = {
    "C2|X:0.27|Y:-1.88|Z:-1.40|T:25.15|H:46.26|UV:8.41|CO2:651.30|O3:0.04|dB:85.40|",
    "C2|X:1.27|Y:-0.64|Z:-1.83|T:26.15|H:46.26|UV:8.41|CO2:651.30|O3:0.04|dB:42.01|",
    "C2|X:-0.47|Y:0.14|Z:-0.04|T:27.15|H:46.26|UV:8.41|CO2:651.30|O3:0.04|dB:70.81|",
    "C2|X:-0.42|Y:-0.78|Z:-1.42|T:23.15|H:46.26|UV:8.41|CO2:651.30|O3:0.04|dB:71.51|",
    "C2|X:1.32|Y:-0.29|Z:-1.87|T:24.15|H:46.26|UV:8.41|CO2:651.30|O3:0.04|dB:69.75|"
};

const int cabina1_size = sizeof(cabina1_data) / sizeof(cabina1_data[0]);
const int cabina2_size = sizeof(cabina2_data) / sizeof(cabina2_data[0]);

// =====================================================
// FUNCIÓN: Mostrar en Terminal
// =====================================================
void mostrarTerminal(String mensaje) {
    Serial.println("🖥 " + mensaje);
    Serial1.println("🖥 " + mensaje);
}

// =====================================================
// INICIALIZACIÓN
// =====================================================
void setup() {
    Serial.begin(BAUD_RATE);
    Serial1.begin(BAUD_RATE);
    pinMode(13, OUTPUT);

    mostrarTerminal("Arduino Mega listo. Enviando tramas alternadas...");
}

// =====================================================
// LOOP PRINCIPAL
// =====================================================
void loop() {
    unsigned long currentMillis = millis();
    recibirComandos();

    if (currentMillis < RETARDO_INICIAL) return;

    if ((currentMillis - lastCycleTime) >= INTERVALO_ENVIO) {
        enviandoCabina1 = true;
        enviandoCabina2 = false;
        indexC1 = 0;
        indexC2 = 0;
        lastTramaTime = currentMillis;
        lastCycleTime = currentMillis;
        mostrarTerminal("→ Enviando Cabina 1");
    }

    if (enviandoCabina1 && (currentMillis - lastTramaTime >= INTERVALO_ENTRE_TRAMAS)) {
        enviarTrama(cabina1_data[indexC1]);
        indexC1++;
        lastTramaTime = currentMillis;

        if (indexC1 >= cabina1_size) {
            enviandoCabina1 = false;
            enviandoCabina2 = true;
            lastTramaTime = currentMillis + RETRASO_CABINA2;
            mostrarTerminal("→ Esperando Cabina 2");
        }
    }

    if (enviandoCabina2 && (currentMillis - lastTramaTime >= INTERVALO_ENTRE_TRAMAS)) {
        enviarTrama(cabina2_data[indexC2]);
        indexC2++;
        lastTramaTime = currentMillis;

        if (indexC2 >= cabina2_size) {
            enviandoCabina2 = false;
            mostrarTerminal("→ Ciclo finalizado");
        }
    }

    delay(10);
}

// =====================================================
// FUNCIÓN: Enviar trama
// =====================================================
void enviarTrama(const char *trama) {
    Serial.println(trama);
    Serial1.println(trama);
}

// =====================================================
// FUNCIÓN: Recibir comandos
// =====================================================
void recibirComandos() {
    if (Serial.available() >= 6) {
        String trama = "";

        while (Serial.available() && trama.length() < 7) {
            char c = Serial.read();
            if (c == '\n' || c == '\r') break;
            trama += c;
        }

        if ((trama.length() == 6 || trama.length() == 7) && trama.endsWith("F")) {
            String cabina = trama.substring(0, 2);
            String codigoStr = trama.substring(2, 5);

            int codigo = codigoStr.toInt();
            mostrarTerminal("📡 Recibido → " + trama);

            procesarComando(cabina, codigo);
        }

        while (Serial.available()) Serial.read();
    }
}

// =====================================================
// FUNCIÓN: Procesar comando recibido
// =====================================================
void procesarComando(String cabina, int codigo) {
    String mensaje = "";

    if (codigo % 2 == 0) {
        digitalWrite(13, LOW);
        mensaje = "Apagar " + cabina;
    } else {
        digitalWrite(13, HIGH);
        mensaje = "Encender " + cabina;
    }

    mostrarTerminal("⚙ Acción → " + mensaje);
}
