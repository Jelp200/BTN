/**
 * #######################################################################################################################################
 *      Archivo: main.cpp
 *      SO: Windows 11
 *      Herramienta: Visual Studio Code
 *      Descripción:
 *          Simulador de tramas de sensores para cabinas ambientales.
 *          Genera datos simulados y los guarda en un archivo de texto con formato:
 *          C#Cabina|X:#Flotante|Y:#Flotante|Z:#Flotante|T:#Flotante|H:#Flotante|UV:#Flotante|
 *          CO2:#Flotante|O3:#Flotante|dB:#Flotante|\n
 * ######################################################################################################################################
 */

#include <iostream>
#include <fstream>
#include <random>
#include <iomanip>
#include <chrono>
#include <string>

// Constantes globales
constexpr int DURACION_HORAS = 2;
constexpr int SEGUNDOS_TOTAL = DURACION_HORAS * 60 * 60;
constexpr const char* NOMBRE_ARCHIVO = "tramas.txt";

// ─────────────────────────────────────────────────────
// Clase que representa los datos de sensores ambientales
// ─────────────────────────────────────────────────────
class SensorData {
public:
    float temperatura;   // T: 20.0 - 30.0 °C
    float humedad;       // H: 30.0 - 60.0 %
    float uv;            // UV: 0.0 - 15.0
    float co2;           // CO2: 400.0 - 800.0 ppm
    float o3;            // O3: 0.0 - 0.1 ppm

    SensorData()
        : temperatura(25.0f), humedad(45.0f), uv(5.0f), co2(600.0f), o3(0.05f) {}

    void actualizar(std::mt19937& gen) {
        std::uniform_real_distribution<float> tempDist(20.0f, 30.0f);
        std::uniform_real_distribution<float> humDist(30.0f, 60.0f);
        std::uniform_real_distribution<float> uvDist(0.0f, 15.0f);
        std::uniform_real_distribution<float> co2Dist(400.0f, 800.0f);
        std::uniform_real_distribution<float> o3Dist(0.0f, 0.1f);

        temperatura = tempDist(gen);
        humedad = humDist(gen);
        uv = uvDist(gen);
        co2 = co2Dist(gen);
        o3 = o3Dist(gen);
    }
};

// ─────────────────────────────────────────────────────
// Clase que genera una trama de datos
// ─────────────────────────────────────────────────────
class FrameGenerator {
private:
    std::mt19937 rng;
    SensorData sensores;

public:
    FrameGenerator() {
        // Semilla basada en tiempo real
        auto seed = std::chrono::high_resolution_clock::now().time_since_epoch().count();
        rng.seed(static_cast<unsigned int>(seed));
    }

    std::string generarTrama(int cabina, int segundo) {
        // Actualizar sensores cada 60 segundos
        if (segundo % 60 == 0) {
            sensores.actualizar(rng);
        }

        // Generar acelerómetro y sonido (cada segundo)
        std::uniform_real_distribution<float> accelDist(-2.0f, 2.0f);
        std::uniform_real_distribution<float> soundDist(30.0f, 100.0f);

        float X = accelDist(rng);
        float Y = accelDist(rng);
        float Z = accelDist(rng);
        float dB = soundDist(rng);

        // Construir la trama
        std::ostringstream oss;
        oss << std::fixed << std::setprecision(2);
        oss << "C" << cabina
            << "|X:" << X
            << "|Y:" << Y
            << "|Z:" << Z
            << "|T:" << sensores.temperatura
            << "|H:" << sensores.humedad
            << "|UV:" << sensores.uv
            << "|CO2:" << sensores.co2
            << "|O3:" << sensores.o3
            << "|dB:" << dB
            << "|\n";

        return oss.str();
    }
};

// ─────────────────────────────────────────────────────
// Clase principal que orquesta la simulación
// ─────────────────────────────────────────────────────
class TramaSimulator {
public:
    static void ejecutar() {
        int cabina = seleccionarCabina();
        if (cabina == -1) return;

        std::ofstream archivo(NOMBRE_ARCHIVO);
        if (!archivo.is_open()) {
            std::cerr << "Error: No se pudo abrir el archivo '" << NOMBRE_ARCHIVO << "' para escritura.\n";
            return;
        }

        FrameGenerator generador;
        for (int segundo = 0; segundo < SEGUNDOS_TOTAL; ++segundo) {
            archivo << generador.generarTrama(cabina, segundo);
        }

        archivo.close();
        std::cout << "Tramas de Cabina " << cabina << " generadas y guardadas en '" << NOMBRE_ARCHIVO << "'.\n";
    }

private:
    static int seleccionarCabina() {
        std::cout << "=== SIMULADOR DE TRAMAS ===\n";
        std::cout << "Seleccione la cabina a simular:\n";
        std::cout << "1. Cabina 1\n";
        std::cout << "2. Cabina 2\n";
        std::cout << "Opción: ";

        int opcion;
        std::cin >> opcion;

        if (opcion == 1 || opcion == 2) {
            return opcion;
        } else {
            std::cout << "Opción inválida. Terminando programa.\n";
            return -1;
        }
    }
};

// ─────────────────────────────────────────────────────
// Función principal
// ─────────────────────────────────────────────────────
int main() {
    TramaSimulator::ejecutar();
    return 0;
}