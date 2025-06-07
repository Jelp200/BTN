/*
** #############################################################################################
**      Archivo: divisiones.c
**      SO: Windows 11
**      Herramienta: Visual Studio Code
**      Microcontrolador:
**          MSP430
**      Descripción:
**          Separar dígitos individuales de un numero entero de 16b y almacenarlos en variables
**          separadas (DMillar, UMillar, Centena, Decena y Unidad), convertidas al código ASCII
**          mediante la suma con '0x30' (0 en ASCII).
** #############################################################################################
*/

/* *********************************************************************************************
******************** D I R E C T I V A S   D E   P R E P R O C E S A D O R *********************
********************************************************************************************* */
#include "io430.h"          // Archivo específico para configurar registros del MSP430
#include "stdio.h"          // Para usar funciones como sprintf

/* °°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°
°°°°°°°°°°°°°°°°°°°°°°°°°°°°° V A R I A B L E S   G L O B A L E S °°°°°°°°°°°°°°°°°°°°°°°°°°°°°°
°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°° */
unsigned char DMillar, UMillar, Centena, Decena, Unidad;
unsigned int Dato_Bin;      // Número binario de 16 bits a descomponer
char Dat1[5];               // Buffer para almacenar la cadena del número

/* ---------------------------------------------------------------------------------------------
------------------------------ F U N C I O N   P R I N C I P A L -------------------------------
--------------------------------------------------------------------------------------------- */
int main(void)
{
    //* Detiene el watchdog timer.
    WDTCTL = WDTPW + WDTHOLD;

    //* Asignación del dato
    //* (Se asigna un valor constante de prueba. Este es un número de 16 bits válido).
    Dato_Bin = 64999;

    //* Desglose inicial usando división y módulo.
    DMillar = (Dato_Bin / 10000) + 0x30;
    UMillar = ((Dato_Bin % 10000) / 1000) + 0x30;
    Centena = ((Dato_Bin % 1000) / 100) + 0x30;
    Decena = ((Dato_Bin % 100) / 10) + 0x30;
    Unidad = (Dato_Bin % 10) + 0x30;

    sprintf(Dat1, "%u", Dato_Bin);

    //* Reinicialización de contadores (Valores reseteados a 0).
    DMillar = UMillar = Centena = Decena = Unidad = 0x30;

    //* Segundo desgloce (Restas sucesivas).
    while (Dato_Bin >= 10000) { Dato_Bin -= 10000; DMillar++; }
    while (Dato_Bin >= 1000) { Dato_Bin -= 1000; UMillar++; }
    while (Dato_Bin >= 100) { Dato_Bin -= 100; Centena++; }
    while (Dato_Bin >= 10) { Dato_Bin -= 10; Decena++; }

    Unidad += Dato_Bin;

    return 0;
}

/* #############################################################################################
                                    E X P L I C A C I Ó N
* Watchdog timer.
Evita que el uC se reinicie si no se refresca periodicamente el WDT.

* Desglose inicial usando división y módulo.
Se realiza la primera descomposición: Se extraen unidades, decentas, etc., convitiendose a
caracteres ASCII sumando '0' (0x30).

Dado que se tiene 'Daton_Bin = 64999', entonces:
- DMil = 6 → '6'
- UMil = 4 → '4'
- Centena = 9 → '9'
- Decena = 9 → '9'
- Unidad = 9 → '9'

* Reinicialización de contadores.
Se resetean todos los valores a '0' (ASCII 0x30). Esto sobreescribe los valores calculados
anteriormente.

* Segundo desgloce (Restas sucesivas).
Se realiza la segunda descomposición restando múltiplos de 10000, 1000, 100 y 10, e
incrementando los contadores correspondientes.

Dado que se tiene 'Daton_Bin = 64999', entonces:
- Tras restar 6 veces 10000 -> Dato_Bin = 4999
- Tras restar 4 veces 1000 -> Dato_Bin = 999
- Tras restar 9 veces 100 -> Dato_Bin = 99
- Tras restar 9 veces 10 -> Dato_Bin = 9
- Unidad = '0' + 9 = '9'

Así que al final:
- DMil = 6 → '6'
- UMil = 4 → '4'
- Centena = 9 → '9'
- Decena = 9 → '9'
- Unidad = 9 → '9'
############################################################################################# */

/* !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                            C O R E C C I O N E S   Y   M E J O R A S
* char Dat1[6]; // Cambiado a 6 para evitar desbordamiento de buffer.
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! */