/**
* #######################################################################################################################################
*      Archivo: LiberarCom.cpp
*      Proyecto: Botonera (BTN) - Liberar puerto COM
*      SO: Windows 11
*      Herramienta: Visual Studio Code
*      Compilador: g++ (MinGW-W64) 12.2.0
*      Estándar: C++14
*      Autor: Jorge Peña (Jelp200)
*      Descripción:
*          Programa el cual permite el escaneo de puertos COM en uso y la libreación de los mismos.
*          Útil para liberar puertos COM bloqueados por aplicaciones que no los liberan correctamente
* ######################################################################################################################################
*/

// ─────────────────────────────────────────────────────
// Definiciones para Windows
// ─────────────────────────────────────────────────────

#define _WIN32_WINNT 0x0A00     // Windows 10 o superior

// ─────────────────────────────────────────────────────
// Inclusión de librerías
// ─────────────────────────────────────────────────────

#include <windows.h>
#include <psapi.h>
#include <tlhelp32.h>
#include <iostream>
#include <string>
#include <vector>
#include <tchar.h>

#pragma comment(lib, "psapi.lib")

// Estructura para almacenar info de puerto en uso
struct PuertoEnUso {
    std::string nombre;
    DWORD pid;
    std::string proceso;
};

std::string obtenerNombreProceso(DWORD pid) {
    HANDLE hProcess = OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, FALSE, pid);
    if (hProcess == NULL) return "Desconocido";

    TCHAR nombre[1024] = {0};
    DWORD len = GetModuleFileNameEx(hProcess, NULL, nombre, sizeof(nombre) / sizeof(TCHAR));
    CloseHandle(hProcess);

    if (len == 0) return "Desconocido";

    std::string fullPath(nombre);
    size_t pos = fullPath.find_last_of("\\/");
    if (pos != std::string::npos) {
        return fullPath.substr(pos + 1);
    }
    return fullPath;
}

// Escanear puertos COM en uso (COM1 a COM32)
std::vector<PuertoEnUso> escanearPuertosEnUso() {
    std::vector<PuertoEnUso> puertos;
    for (int i = 1; i <= 32; ++i) {
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
        if (h == INVALID_HANDLE_VALUE) {
            // Puerto NO se pudo abrir → probablemente está en uso o no existe
            DWORD error = GetLastError();
            if (error == ERROR_ACCESS_DENIED || error == ERROR_SHARING_VIOLATION) {
                // Está en uso, pero ¿por qué proceso?
                // No podemos saber el PID directamente, así que lo dejamos para el escaneo global
                // Lo detectaremos al escanear handles más abajo (opcional, complejo)
                // Por simplicidad, asumimos que si no se puede abrir, está en uso
                // Pero no sabemos el PID → solución alternativa: escanear todos los procesos
            }
        } else {
            // Puerto se abrió → está libre
            CloseHandle(h);
            continue;
        }

        // Si llegamos aquí, el puerto no se pudo abrir → asumimos "en uso"
        // Pero no sabemos el PID. Para obtener el PID, necesitamos escanear handles (complejo).
        // Alternativa práctica: el usuario reinicia la app o usa el Administrador de tareas.
        // Por ahora, solo listamos los que NO se pueden abrir.
        puertos.push_back({nombre, 0, "Desconocido (en uso)"});
    }
    return puertos;
}

// Método alternativo: escanear todos los procesos y ver si tienen handles a COM
// (Este método es más preciso pero requiere privilegios y es complejo)
// Por simplicidad, usaremos un enfoque práctico: listar procesos comunes que usan COM

int main() {
    std::cout << "\t\t=== Liberador de Puertos COM (Windows) ===\n\n";

    std::cout << "\tEscaneando puertos COM en uso (COM1-COM32)...\n";
    std::vector<PuertoEnUso> puertos = escanearPuertosEnUso();

    if (puertos.empty()) {
        std::cout << "\tTodos los puertos COM están libres.\n";
        return 0;
    }

    std::cout << "\n\tPuertos COM que no se pudieron abrir (probablemente en uso):\n";
    for (size_t i = 0; i < puertos.size(); ++i) {
        std::cout << "  [" << (i + 1) << "] " << puertos[i].nombre << " -> " << puertos[i].proceso << " (PID: " << puertos[i].pid << ")\n";
    }

    std::cout << "\n\tRecomendación:\n";
    std::cout << "\t- Cierra las aplicaciones que usen puertos serie (Arduino IDE, SerialController, etc.).\n";
    std::cout << "\t- Si es necesario, usa el 'Administrador de tareas' para finalizar el proceso.\n";
    std::cout << "\n\t¿Deseas intentar matar un proceso? (No se puede determinar PID automáticamente)\n";
    std::cout << "\tAlternativamente, reinicia tu aplicacion o la PC.\n";

    // Opción: permitir al usuario ingresar un PID manualmente
    std::cout << "\n\tIngresa un PID para terminar (0 para salir): ";
    DWORD pid;
    std::cin >> pid;

    if (pid > 0) {
        HANDLE hProcess = OpenProcess(PROCESS_TERMINATE, FALSE, pid);
        if (hProcess != NULL) {
            if (TerminateProcess(hProcess, 0)) {
                std::cout << "\tProceso " << pid << " terminado.\n";
            } else {
                std::cout << "\tError al terminar el proceso " << pid << ".\n";
            }
            CloseHandle(hProcess);
        } else {
            std::cout << "\tNo se pudo abrir el proceso " << pid << ".\n";
        }
    }

    std::cout << "\nPrograma finalizado.\n";
    return 0;
}