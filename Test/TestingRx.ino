// ==========================================================
// 📡 Receptor de tramas desde PC (Panel de Control)
// Formato esperado: C1039F, C2001F, etc.
// Arduino Mega – Serial (USB)
// ==========================================================

#define BAUD_RATE 9600

void setup()
{
    Serial.begin(BAUD_RATE);
    Serial.println("✅ Arduino Mega listo. Esperando tramas...");
    pinMode(13, OUTPUT); // LED de prueba
}

void loop()
{
    if (Serial.available() >= 6)
    {
        // Leer hasta 7 caracteres o hasta salto de línea
        String trama = "";
        while (Serial.available() && trama.length() < 7)
        {
            char c = Serial.read();
            if (c == '\n' || c == '\r')
                break;
            trama += c;
        }

        // Validar longitud y sufijo
        if ((trama.length() == 6 || trama.length() == 7) && trama.endsWith("F"))
        {
            String cabina = trama.substring(0, 2);    // "C1" o "C2"
            String codigoStr = trama.substring(2, 5); // 3 dígitos

            // Validar que sean solo dígitos
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

                // 🎯 Ejecutar acción según el código
                procesarComando(cabina, codigo);
            }
            else
            {
                Serial.println("⚠️ Trama inválida: formato incorrecto");
            }
        }
        // Opcional: limpiar buffer si hay basura
        while (Serial.available())
            Serial.read();
    }

    delay(10);
}

// ===================================================================
// 🧠 Lógica principal: qué hacer con cada código recibido
// ===================================================================
void procesarComando(String cabina, int codigo)
{
    // 🔧 Controles ambientales (000–017)
    if (codigo >= 0 && codigo <= 17)
    {
        if (codigo % 2 == 0)
        {
            Serial.println("🔴 Apagando dispositivo...");
        }
        else
        {
            Serial.println("🟢 Encendiendo dispositivo...");
        }
    }

    // 🔊 Sonidos (039–089)
    else if (codigo >= 39 && codigo <= 88)
    {
        Serial.print("🔊 Reproduciendo sonido: ");
        Serial.println(codigo);
    }

    // ▶️ Controles de reproducción
    else if (codigo == 35)
    {
        Serial.println("▶️ PLAY");
    }
    else if (codigo == 38)
    {
        Serial.println("⏹️ STOP");
    }

    // 🔈 Volumen
    else if (codigo == 36)
    {
        Serial.println("🔊 Volumen +10");
    }
    else if (codigo == 37)
    {
        Serial.println("🔉 Volumen -10");
    }

    // ❓ Código no reconocido
    else
    {
        Serial.print("❓ Código desconocido: ");
        Serial.println(codigo);
    }

    //* Encender LED integrado al recibir cualquier trama válida
    digitalWrite(13, HIGH);
    delay(100);
    digitalWrite(13, LOW);
}