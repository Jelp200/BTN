/**
 * #############################################################################################
 *      Archivo: divisiones.cpp
 *      SO: Windows 11 (simulación); objetivo: MSP430
 *      Herramienta: Visual Studio Code + Compilador compatible con C++ embebido
 *      Descripción:
 *          Descomponer un número entero de 16 bits en sus dígitos individuales y convertirlos
 *          a caracteres ASCII ('0'-'9'). Se implementan dos métodos:
 *          1. Usando división y módulo.
 *          2. Usando restas sucesivas.
 * #############################################################################################
 */

#include <cstdint>   // Para uint16_t, uint8_t
#include <cstdio>    // sprintf (si se usa)

// Simulación de registros del MSP430 (solo para compilación en PC)
// En el entorno real, reemplazar por #include "io430.h"
#ifndef __MSP430__
    volatile uint16_t WDTCTL;
    constexpr uint16_t WDTPW = 0x5A00;
    constexpr uint16_t WDTHOLD = 0x0080;
#endif

/**
 * @brief Extrae dígitos usando división y módulo.
 * @param numero Número de 16 bits a descomponer.
 * @param digitos Arreglo de 5 chars para almacenar [DMillar, UMillar, Centena, Decena, Unidad].
 */
void extraerDigitosDivision(uint16_t numero, char digitos[5]) {
    digitos[0] = static_cast<char>((numero / 10000) + '0');
    digitos[1] = static_cast<char>(((numero % 10000) / 1000) + '0');
    digitos[2] = static_cast<char>(((numero % 1000) / 100) + '0');
    digitos[3] = static_cast<char>(((numero % 100) / 10) + '0');
    digitos[4] = static_cast<char>((numero % 10) + '0');
}

/**
 * @brief Extrae dígitos usando restas sucesivas.
 * @param numero Número de 16 bits a descomponer (se modifica internamente).
 * @param digitos Arreglo de 5 chars (inicializados a '0').
 */
void extraerDigitosRestas(uint16_t numero, char digitos[5]) {
    // Inicializar todos los dígitos a '0'
    for (int i = 0; i < 5; ++i) {
        digitos[i] = '0';
    }

    while (numero >= 10000) { numero -= 10000; digitos[0]++; }
    while (numero >= 1000)  { numero -= 1000;  digitos[1]++; }
    while (numero >= 100)   { numero -= 100;   digitos[2]++; }
    while (numero >= 10)    { numero -= 10;    digitos[3]++; }
    digitos[4] += static_cast<char>(numero); // Sumar el resto (0-9)
}

/**
 * @brief Función principal.
 */
int main(void) {
    // Detener el watchdog timer (solo en MSP430 real)
    WDTCTL = WDTPW | WDTHOLD;

    constexpr uint16_t Dato_Bin = 64999; // Valor de prueba

    char digitos1[5]; // Resultado método 1
    char digitos2[5]; // Resultado método 2

    // Método 1: división y módulo
    extraerDigitosDivision(Dato_Bin, digitos1);

    // Método 2: restas sucesivas
    extraerDigitosRestas(Dato_Bin, digitos2);

    // Imprimir resultados (solo en simulación/PC)
    #ifdef __PC_SIMULATION__
        char buffer[7]; // 5 dígitos + '\n' + '\0'
        std::sprintf(buffer, "%c%c%c%c%c\n", digitos1[0], digitos1[1], digitos1[2], digitos1[3], digitos1[4]);
        // En entorno real, enviar por UART, LCD, etc.
    #endif
    
    return 0;
}