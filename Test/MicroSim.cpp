/**
* #######################################################################################################################################
*      Archivo: MicroSim.cpp
*      SO: Windows 11
*      Herramienta: Visual Studio Code
*      Descripción:
*          Simulador de Microcontrolador que se comunica por puerto serie (COM)
*          Recibe comandos como "C1001F" y responde con tramas de sensores.
*          Escanea puertos COM disponibles y permite conexión interactiva.
* ######################################################################################################################################
*/

// ─────────────────────────────────────────────────────
// Inclusión de librerías
// ─────────────────────────────────────────────────────

#include <iostream>
#include <sstream>
#include <string>
#include <vector>
#include <iomanip>
#include <random>
#include <windows.h>
#include <tchar.h>
#include <algorithm>

// Función para generar valores flotantes aleatorios simulando sensores
float generarFloat(float min, float max) {
    static std::mt19937 rng(std::random_device{}());
    std::uniform_real_distribution<float> dist(min, max);
    return dist(rng);
}

// Función para generar la trama de sensores
std::string generarTrama(const std::string& cabinaID) {
    std::ostringstream ss;
    ss << "C" << cabinaID
       << "|X:" << std::fixed << std::setprecision(2) << generarFloat(-2.0, 2.0)
       << "|Y:" << generarFloat(-2.0, 2.0)
       << "|Z:" << generarFloat(-2.0, 2.0)
       << "|T:" << generarFloat(20.0, 30.0)     // Temperatura
       << "|H:" << generarFloat(30.0, 70.0)     // Humedad
       << "|UV:" << generarFloat(0.0, 10.0)     // UV Index
       << "|CO2:" << generarFloat(350.0, 2000.0)// CO2 ppm
       << "|O3:" << generarFloat(0.0, 0.5)      // O3 ppm
       << "|dB:" << generarFloat(30.0, 100.0)   // Decibeles
       << "|";
    return ss.str();
}

// Función para validar comando de panel (ejemplo: C1XXXF)
bool validarComando(const std::string& cmd) {
    if (cmd.size() < 4) return false;
    if (cmd.front() != 'C' || cmd.back() != 'F') return false;
    return true;
}

// Escanear puertos COM disponibles (COM1 a COM20)
std::vector<std::string> escanearPuertosCOM() {
    std::vector<std::string> puertos;
    for (int i = 1; i <= 20; ++i) {
        std::string nombre = "COM" + std::to_string(i);
        HANDLE h = CreateFile(
            TEXT(nombre.c_str()),
            GENERIC_READ | GENERIC_WRITE,
            0,              // Sin compartir
            NULL,
            OPEN_EXISTING,
            0,
            NULL
        );
        if (h != INVALID_HANDLE_VALUE) {
            CloseHandle(h);
            puertos.push_back(nombre);
        }
    }
    return puertos;
}

// Configurar el puerto serie
bool configurarPuerto(HANDLE hSerial) {
    DCB dcbSerialParams = {0};
    dcbSerialParams.DCBlength = sizeof(dcbSerialParams);
    if (!GetCommState(hSerial, &dcbSerialParams)) {
        return false;
    }
    dcbSerialParams.BaudRate = CBR_9600;
    dcbSerialParams.ByteSize = 8;
    dcbSerialParams.StopBits = ONESTOPBIT;
    dcbSerialParams.Parity = NOPARITY;
    if (!SetCommState(hSerial, &dcbSerialParams)) {
        return false;
    }

    COMMTIMEOUTS timeouts = {0};
    timeouts.ReadIntervalTimeout = 50;
    timeouts.ReadTotalTimeoutConstant = 50;
    timeouts.ReadTotalTimeoutMultiplier = 10;
    timeouts.WriteTotalTimeoutConstant = 50;
    timeouts.WriteTotalTimeoutMultiplier = 10;
    if (!SetCommTimeouts(hSerial, &timeouts)) {
        return false;
    }

    return true;
}

int main() {
    std::cout << "=== Simulador de Microcontrolador (C++ / Puerto Serie) ===\n\n";

    // Paso 1: Escanear puertos COM
    std::cout << "Escaneando puertos COM disponibles...\n";
    std::vector<std::string> puertos = escanearPuertosCOM();

    if (puertos.empty()) {
        std::cout << "No se encontraron puertos COM disponibles.\n";
        std::cout << "Asegurate de tener un adaptador USB-Serial conectado o usa un puerto virtual (como com0com).\n";
        return 1;
    }

    std::cout << "Puertos COM disponibles:\n";
    for (size_t i = 0; i < puertos.size(); ++i) {
        std::cout << "  [" << (i + 1) << "] " << puertos[i] << "\n";
    }

    // Paso 2: Seleccionar puerto
    int seleccion;
    std::cout << "\nSelecciona un puerto (1-" << puertos.size() << "): ";
    std::cin >> seleccion;
    std::cin.ignore(); // Limpiar el buffer

    if (seleccion < 1 || seleccion > (int)puertos.size()) {
        std::cout << "Selección inválida.\n";
        return 1;
    }

    std::string puerto = puertos[seleccion - 1];
    std::cout << "\nConectando a " << puerto << "...\n";

    // Paso 3: Abrir puerto
    HANDLE hSerial = CreateFile(
        TEXT(puerto.c_str()),
        GENERIC_READ | GENERIC_WRITE,
        0,
        NULL,
        OPEN_EXISTING,
        FILE_ATTRIBUTE_NORMAL,
        NULL
    );

    if (hSerial == INVALID_HANDLE_VALUE) {
        std::cout << "Error al abrir el puerto " << puerto << ".\n";
        return 1;
    }

    if (!configurarPuerto(hSerial)) {
        std::cout << "Error al configurar el puerto " << puerto << ".\n";
        CloseHandle(hSerial);
        return 1;
    }

    std::cout << "Conectado a " << puerto << " a 9600 baudios.\n";
    std::cout << "Esperando comandos desde el controlador serial...\n";
    std::cout << "Presiona Ctrl+C para salir.\n\n";

    // Paso 4: Bucle principal de recepción (sin delimitadores, detección robusta)
    char bufferIn[256];
    DWORD bytesRead;
    std::string bufferAcumulado;

    std::cout << "Iniciando bucle de recepción (modo sin \\n, detección robusta)...\n";

    while (true) {
        if (ReadFile(hSerial, bufferIn, sizeof(bufferIn) - 1, &bytesRead, NULL) && bytesRead > 0) {
            bufferIn[bytesRead] = '\0';
            bufferAcumulado.append(bufferIn, bytesRead);

            // Depuración (puedes comentar esta sección luego)
            std::cout << "[DEBUG] Recibido: '";
            for (DWORD i = 0; i < bytesRead; ++i) {
                unsigned char c = (unsigned char)bufferIn[i];
                if (c >= 32 && c <= 126) std::cout << c;
                else std::cout << "\\x" << std::hex << (int)c << std::dec;
            }
            std::cout << "' | Buffer: '" << bufferAcumulado << "'\n";

            bool comandoEncontrado = false;
            size_t inicio = 0;

            // Buscar todos los 'C' en el buffer
            while ((inicio = bufferAcumulado.find('C', inicio)) != std::string::npos) {
                // Probar longitudes de 4 a 10 desde esta posición
                for (int len = 4; len <= 10 && (inicio + len) <= bufferAcumulado.size(); ++len) {
                    if (bufferAcumulado[inicio + len - 1] == 'F') {
                        std::string candidato = bufferAcumulado.substr(inicio, len);
                        if (validarComando(candidato)) {
                            // Comando válido encontrado
                            std::cout << "[Serial RX] Comando detectado: '" << candidato << "'\n";

                            std::string cabinaID = candidato.substr(1, 1);
                            std::string trama = generarTrama(cabinaID);

                            DWORD bytesWritten;
                            if (WriteFile(hSerial, trama.c_str(), (DWORD)trama.length(), &bytesWritten, NULL)) {
                                std::cout << "[uC TX] Trama enviada: " << trama << "\n";
                            } else {
                                std::cout << "[ERROR] Falló el envío.\n";
                            }

                            // Eliminar todo el buffer hasta el final del comando
                            bufferAcumulado.erase(0, inicio + len);
                            comandoEncontrado = true;
                            inicio = 0; // Reiniciar búsqueda desde el inicio del nuevo buffer
                            break; // Salir del for(len)
                        }
                    }
                }
                if (comandoEncontrado) break; // Salir del while si ya procesamos un comando
                inicio++; // Seguir buscando después de este 'C'
            }

            // Limpieza de seguridad: si el buffer es muy largo y no se encontró comando, limpiar
            if (!comandoEncontrado && bufferAcumulado.size() > 30) {
                std::cout << "[WARN] Buffer muy largo sin comandos válidos. Limpiando...\n";
                bufferAcumulado.clear();
            }
        }

        Sleep(10);
    }

    // Cerrar puerto
    CloseHandle(hSerial);
    std::cout << "\nSimulador finalizado.\n";
    return 0;
}
