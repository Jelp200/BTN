/*
** #######################################################################################################################################
**      Archivo: main
**      SO: Windows 11
**      Herramienta: Visual Studio Code
**      Notas:
**          Este programa permite generar tramas de comunicación para un microcontrolador y guardar estas tramas en una archivo de texto
**          para después graficar los datos a travez de un  proceso y analisis.
**
**          Forma de la trama:
**          
**          C#Cabina|X:#Flotante|Y:#Flotante|Z:#Flotante|T:#Flotante|H:#Flotante|UV:#Flotante|CO2:#Flotante|O3:#Flotante|dB:#Flotante|\n
** ######################################################################################################################################
*/

#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <string.h>

#define DURACION_HORAS 2
#define SEGUNDOS_TOTAL (DURACION_HORAS * 60 * 60)
#define NOMBRE_ARCHIVO "tramas.txt"

float generarFloatAleatorio(float min, float max) {
    return min + ((float)rand() / RAND_MAX) * (max - min);
}

void generarTrama(FILE *archivo, int cabina, int segundo,
                  float *lastT, float *lastH, float *lastUV, float *lastCO2, float *lastO3) {
    float X = generarFloatAleatorio(-2.0, 2.0);      // acelerómetro
    float Y = generarFloatAleatorio(-2.0, 2.0);
    float Z = generarFloatAleatorio(-2.0, 2.0);
    float dB = generarFloatAleatorio(30.0, 100.0);   // sonido

    // Solo se actualizan cada minuto
    if (segundo % 60 == 0) {
        *lastT = generarFloatAleatorio(20.0, 30.0);     // temperatura
        *lastH = generarFloatAleatorio(30.0, 60.0);     // humedad
        *lastUV = generarFloatAleatorio(0.0, 15.0);     // UV
        *lastCO2 = generarFloatAleatorio(400.0, 800.0); // CO2
        *lastO3 = generarFloatAleatorio(0.0, 0.1);       // O3
    }

    fprintf(archivo, "C%d|X:%.2f|Y:%.2f|Z:%.2f|T:%.2f|H:%.2f|UV:%.2f|CO2:%.2f|O3:%.2f|dB:%.2f|\n",
            cabina, X, Y, Z, *lastT, *lastH, *lastUV, *lastCO2, *lastO3, dB);
}

int main() {
    int opcionCabina;
    printf("=== SIMULADOR DE TRAMAS ===\n");
    printf("Seleccione la cabina a simular:\n");
    printf("1. Cabina 1\n");
    printf("2. Cabina 2\n");
    printf("Opción: ");
    scanf("%d", &opcionCabina);

    if (opcionCabina != 1 && opcionCabina != 2) {
        printf("Opción inválida. Terminando programa.\n");
        return 1;
    }

    FILE *archivo = fopen(NOMBRE_ARCHIVO, "w");
    if (!archivo) {
        perror("No se pudo abrir el archivo para escritura");
        return 1;
    }

    srand((unsigned)time(NULL)); // semilla para aleatorios

    float lastT = 0, lastH = 0, lastUV = 0, lastCO2 = 0, lastO3 = 0;

    for (int segundo = 0; segundo < SEGUNDOS_TOTAL; segundo++) {
        generarTrama(archivo, opcionCabina, segundo, &lastT, &lastH, &lastUV, &lastCO2, &lastO3);
    }

    fclose(archivo);
    printf("Tramas de Cabina %d generadas y guardadas en '%s'.\n", opcionCabina, NOMBRE_ARCHIVO);
    return 0;
}

