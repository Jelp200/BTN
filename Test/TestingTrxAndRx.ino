#define BAUD_RATE 9600

// =====================================================
// CONFIGURACIÓN
// =====================================================
const unsigned long INTERVALO_ENVIO = 10000;   // 10 s
const unsigned long RETARDO_INICIAL = 15000;   // 15 s

unsigned long lastSendTimeC1 = 0;
unsigned long lastSendTimeC2 = 0;
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
// INICIALIZACIÓN
// =====================================================
void setup()
{
    Serial.begin(BAUD_RATE);
    pinMode(13, OUTPUT);
    Serial.println("✅ Arduino Mega listo. Esperando tramas de control...");
    Serial.println("⏳ Envío de datos simulados iniciará en 15 segundos...");
}

// =====================================================
// LOOP PRINCIPAL
// =====================================================
void loop()
{
    unsigned long currentMillis = millis();

    // ---------------------------
    // 1️⃣ Recepción de comandos
    // ---------------------------
    recibirComandos();

    // ---------------------------
    // 2️⃣ Envío de tramas simuladas
    // ---------------------------
    if (currentMillis >= RETARDO_INICIAL)
    {
        if (currentMillis - lastSendTimeC1 >= INTERVALO_ENVIO && indexC1 < cabina1_size)
        {
            Serial.println(cabina1_data[indexC1++]);
            lastSendTimeC1 = currentMillis;
        }

        if (currentMillis - lastSendTimeC2 >= INTERVALO_ENVIO && indexC2 < cabina2_size)
        {
            Serial.println(cabina2_data[indexC2++]);
            lastSendTimeC2 = currentMillis;
        }

        // Reinicia ciclos
        if (indexC1 >= cabina1_size) indexC1 = 0;
        if (indexC2 >= cabina2_size) indexC2 = 0;
    }

    delay(10);
}

// =====================================================
// FUNCIÓN: Recibir comandos de control tipo C1XXXF
// =====================================================
void recibirComandos()
{
    if (Serial.available() >= 6)
    {
        String trama = "";
        while (Serial.available() && trama.length() < 7)
        {
            char c = Serial.read();
            if (c == '\n' || c == '\r')
                break;
            trama += c;
        }

        if ((trama.length() == 6 || trama.length() == 7) && trama.endsWith("F"))
        {
            String cabina = trama.substring(0, 2);
            String codigoStr = trama.substring(2, 5);

            bool valido = true;
            for (int i = 0; i < 3; i++)
            {
                if (!isDigit(codigoStr[i]))
                {
                    valido = false;
                    break;
                }
            }

            if (valido && (cabina == "C1" || cabina == "C2"))
            {
                int codigo = codigoStr.toInt();
                Serial.print("📡 Recibido → Cabina: ");
                Serial.print(cabina);
                Serial.print(" | Código: ");
                Serial.println(codigo);
                procesarComando(cabina, codigo);
            }
            else
            {
                Serial.println("⚠️ Trama inválida o formato incorrecto");
            }
        }

        while (Serial.available())
            Serial.read();
    }
}

// =====================================================
// FUNCIÓN: Procesar comando recibido
// =====================================================
void procesarComando(String cabina, int codigo)
{
    if (codigo >= 0 && codigo <= 17)
    {
        if (codigo % 2 == 0)
        {
            Serial.println("🔴 Apagando dispositivo...");
            digitalWrite(13, LOW);
        }
        else
        {
            Serial.println("🟢 Encendiendo dispositivo...");
            digitalWrite(13, HIGH);
        }
    }
    else if (codigo >= 39 && codigo <= 88)
    {
        Serial.print("🔊 Reproduciendo sonido ");
        Serial.println(codigo);
    }
    else if (codigo == 35)
    {
        Serial.println("▶️ PLAY");
        digitalWrite(13, HIGH);
    }
    else if (codigo == 38)
    {
        Serial.println("⏹️ STOP");
        digitalWrite(13, LOW);
    }
    else if (codigo == 36)
    {
        Serial.println("🔊 Volumen +10");
        digitalWrite(13, HIGH);
        delay(100);
        digitalWrite(13, LOW);
    }
    else if (codigo == 37)
    {
        Serial.println("🔉 Volumen -10");
        digitalWrite(13, HIGH);
        delay(100);
        digitalWrite(13, LOW);
    }
    else
    {
        Serial.print("Otros codigos: ");
        Serial.println(codigo);
        digitalWrite(13, LOW);
    }
}
