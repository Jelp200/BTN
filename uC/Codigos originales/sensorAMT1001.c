/*
** #############################################################################################
**      Archivo: sensorAMT1001.c
**      SO: Windows 11
**      Herramienta: Visual Studio Code
**      Microcontrolador:
**          MSP430
**      Descripción:
**          Leer los valores de dos sensores analógicos (temperatura y humedad) mediante el ADC
**          de 10 bits del MSP430 , los convierte a voltaje, calcula la temperatura y humedad
**          porcentual, los desglosa en dígitos individuales y finalmente los envía por UART
**          como parte de una cadena de texto formateada.
** #############################################################################################
*/
/* *********************************************************************************************
******************** D I R E C T I V A S   D E   P R E P R O C E S A D O R *********************
********************************************************************************************* */
#include "io430.h"          // Archivo específico para configurar registros del MSP430

/* °°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°
°°°°°°°°°°°°°°°°°°°°°°°°°°°°° V A R I A B L E S   G L O B A L E S °°°°°°°°°°°°°°°°°°°°°°°°°°°°°°
°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°° */
unsigned long H, T;
unsigned char Conv = 0, Tant = 0, DMillar, UMillar, Centena, Decena, Unidad, i, A5, A6;
unsigned int Vh, Vt, Vtprom = 0;
volatile char Hum[24] = { "Vh=3.300V | Humedad=099%" };
volatile char Tem[28] = { "|Vt=3.300V | Temperatura=99C" };

/* .............................................................................................
....................... D E C L A R A C I O N   D E   F U N C I O N E S ........................
............................................................................................. */
void Digitos (unsigned int Dato);
void ADC_10 (unsigned char Canal);

/* ---------------------------------------------------------------------------------------------
------------------------------ F U N C I O N   P R I N C I P A L -------------------------------
--------------------------------------------------------------------------------------------- */
int main(void)
{
    //* Detiene el watchdog timer.
    WDTCTL = WDTPW + WDTHOLD;

    //* Configuración del reloj a 16MHz.
    BCSCTL1 = CALBC1_16MHZ;
    DCOCTL  = CALDCO_16MHZ;

    //* Configurar UART (P1.1 RX, P1.2 TX).
    P1SEL |= BIT1 + BIT2;
    P1SEL2 |= BIT1 + BIT2;
    P1DIR &= ~BIT1                      // RX
    P1DIR |= BIT2;                      // TX
    UCA0CTL1 |= UCSSEL_2;               // SMCLK
    // ------------------------------------- Baud rate 9600 ------------------------------------
    UCA0BR0 = 0x82; UCA0BR1 = 0x06;     //  16MHz
    UCA0MCTL = UCBRS2 + UCBRS1;         // Modulación
    // -----------------------------------------------------------------------------------------

    UCA0CTL1 &= ~UCSWRST;               // Liberar reset
    IE2 |= UCA0RXIE;                    // Habilitar interrupción de recepción

    //* Configurar canales analógicos.
    ADC10AE0 |= BIT5;                   // Canal A5 para temperatura
    ADC10AE0 |= BIT6;                   // Canal A6 para humedad

    //* Habilitar interrupciones globales.
    __bis_SR_register(GIE);

    while (1) {
        //* P R O C C E S O   D E   H U M E D A D *
        //* leer sensor de humedad.
        ADC_10(6);                      // Canal 6
        while(Conv == 0){}              // Esperar termino de conversión

        //* Separa en dígitos y actualiza la cadena Hum[].
        Digitos(Vh);
        Hum[3] = UMillar;
        Hum[5] = Centena;
        Hum[6] = Decena;
        Hum[7] = Unidad;
        Hum[20] = UMillar;
        Hum[21] = Centena;
        Hum[22] = Decena;

        Digitos(H);
        Hum[20]=UMillar;
        Hum[21]=Centena;
        Hum[22]=Decena;

        //* Envía la cadena Hum[] por UART.
        for(i = 0; i <= 23; i++) {
            while (!(IFG2 & UCA0TXIFG)){}
            UCA0TXBUF = Hum[i];
        }

        Conv = 0;

        //* P R O C C E S O   D E   T E M P E R A T U R A *
        //* Lectura de la temperatura x10 y promedio.
        Vtprom = 0;
        for(i = 0; i <= 9; i++) {
            ADC_10(5);                  // Canal 5
            while(Conv == 0){}
            Vtprom += Vt;
            Conv = 0;
        }
        Vt = Vtprom / 10;
        Vt = (Vt + Tant) / 2;           // Promedio móvil
        Tant = Vt;

        //* Separa en dígitos y actualiza la cadena Tem[].
        Digitos(Vt);
        Tem[4] = UMillar;
        Tem[6] = Centena;
        Tem[7] = Decena;
        Tem[8] = Unidad;
        Tem[25] = Decena;
        Tem[26] = Unidad;

        //* Envía la cadena Tem[] por UART.
        for(i = 0; i <= 27; i++) {
            while (!(IFG2 & UCA0TXIFG)){}
            UCA0TXBUF = Tem[i];
        }

        while (!(IFG2&UCA0TXIFG)){} UCA0TXBUF = '\r';
        while (!(IFG2&UCA0TXIFG)){} UCA0TXBUF = '\n';

        Conv = 0;
    }
}

/* .............................................................................................
...................................... F U N C I O N E S .......................................
............................................................................................. */
//* INTERRUPCIÓN DEL ADC
#pragma vector = ADC10_VECTOR
__interrupt void Conversion(void) {
    if(A5 == 1) {
        T = ADC10MEM;
        Vt = (T * 330) / 1023;
        ADC10CTL0 = 0x0000;
        Conv = 1;
    }
    
    if(A6 == 1) {
        H = ADC10MEM;
        Vh = (H * 3300) / 1023;
        H = Vh / 3;
        ADC10CTL0 = 0x0000;
        Conv = 1;}
}

//* CONVERSIÓN DE DATOS
void Digitos (unsigned int Dato) {
    DMillar = 0x30; UMillar = 0x30;
    Centena = 0x30; Decena =  0x30;
    Unidad =  0x30;

    while(Dato >= 10000) { Dato -= 10000; DMillar++; }
    while(Dato >= 1000)  { Dato -= 1000;  UMillar++; }
    while(Dato >= 100)   { Dato -= 100;   Centena++; }
    while(Dato >= 10)    { Dato -= 10;    Decena++; }

    Unidad = Unidad + Dato;
}

//* SELECCION DEL CANAL ANALOGO Y LANZAMIENTO DE CONVERSIÓN
void ADC_10 (unsigned char Canal) {
    switch (Canal) {
        case 0: break;
        case 1: break;
        case 5:
            ADC10CTL0 = SREF_0 + ADC10SHT_3 + MSC + ADC10ON + ADC10IE;
            ADC10CTL1 = INCH_5 + CONSEQ_0;
            ADC10CTL0 |= ENC + ADC10SC;
            A5 = 1;
            break;
        case 6:
            ADC10CTL0 = SREF_0+ADC10SHT_2+MSC+ADC10ON+ADC10IE;
            ADC10CTL1 = INCH_6+CONSEQ_0;
            ADC10CTL0 |= ENC+ADC10SC;
            A6 = 1;
            break;
    }
}

/* #############################################################################################
                                    E X P L I C A C I Ó N
* Variables globales.
- H, T: Valores brutos del ADC.
- Vh, Vt: Voltajes calculados para humedad y temperatura.
- Conv: Bandera de conversión completada.
- A5, A6: Marcadores para saber qué canal se leyó.
- Hum[] y Tem[]: Cadenas con formato fijo para mostrar datos por UART.

* Interrupción del ADC
- Se guardan los valores leídos del ADC (ADC10MEM) en T o H.
- Se convierten a voltaje (*330/1023 para temperatura, *3300/1023 para humedad).
- H = Vh / 3 aplica una fórmula específica del sensor AMT1001.
- Finalmente se limpia el control del ADC y se activa la bandera Conv.

* Selección del canal analogo y lanzamiento de conversión.
- SREF_0: Referencia interna (Vcc y GND).
- ADC10SHT_3: Sample-and-hold de 64 ciclos.
- ADC10ON: Enciende el ADC.
- ADC10IE: Habilita interrupción al terminar.
- ENC: Enable conversion.
- ADC10SC: Start conversion.
############################################################################################# */