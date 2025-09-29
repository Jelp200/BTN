/*
* #############################################################################################
*       Archivo: main.cpp
*       Proyecto: Botonera (BTN)
*       Microcontrolador: MSP430
*       SO: Windows 11
*       Herramientas:
*           - Visual Studio Code
*      Autor:
*           - Jorge Peña (Jelp200)
*       Descripción:
*           Comunicación metiande interfaz USB/RS485 entre la MSP430 y la API en C# para poder
*           acceder a una base de datos SQL y así obtener los los comandos a recibir de la
*           botonera.
*
*       Flujo de datos:
*           uC <----> USB/RS485 <----> API C# <----> Base de datos SQL
* #############################################################################################
*/

/* --------------------------------------------------------------------------------------------
--------------------------------------- I N C L U D E S ---------------------------------------
-------------------------------------------------------------------------------------------- */
#include "io430.h"

/* --------------------------------------------------------------------------------------------
-------------------------- D E F I N I C I O N E S   D E   T I P O S --------------------------
-------------------------------------------------------------------------------------------- */
define RS485_DE BIT0;               // Pin para habilitar el driver (P1.0)
define RS485_RE BIT1;               // Pin para habilitar el receptor (P1.1)

volatile char rx_buffer[64];        // Buffer para los datos recibidos
volatile unsigned int rxIndex = 0;  // Índice para el buffer de recepción

/* --------------------------------------------------------------------------------------------
-------------------------------------- F U N C I O N E S --------------------------------------
-------------------------------------------------------------------------------------------- */
void UART_Init(void) {
    // Configuración de reloj a 16MHz
    BCSCTL1 = CALBC1_16MHZ;
    DCOCTL = CALDCO_16MHZ;

    // Configuración pines UART (P1.1=RX, P1.2=TX)
    P1SEL |= BIT1 | BIT2;
    P1SEL2 |= BIT1 | BIT2;
    P1DIR &= ~BIT1;                 // RX
    P1DIR |= BIT2;                  // TX

    // Configuración USCI_A0
    UCA0CTL1 |= UCSSEL_2;           // SMCLK
    UCA0BR0 = 0x82; UCA0BR1 = 0x06; // 9600 baud @ 16MHz
    UCA0BR1 = 0;
    UCA0MCTL = UCBRS2 | UCBRS1;     // Modulación
    UCA0CTL1 &= ~UCSWRST;           // Iniciar USCI
    IE2 |= UCA0RXIE;                // Interrupción RX (aunque no se use)
}

void RS485_EnableTX(void) {
    P1OUT |= RS485_DE;              // Driver enable
    P1OUT &= ~RS485_RE;             // Receiver disable
}

void RS485_EnableRX(void) {
    P1OUT &= ~RS485_DE;  // Driver disable
    P1OUT &= ~RS485_RE;  // Receiver enable
}

void UART_SendString(const char *str) {
    RS485_EnableTX();
    while (*str) {
        while (!(IFG2 & UCA0TXIFG));
        UCA0TXBUF = *str++;
    }
    // Esperar a que termine transmisión
    while (!(IFG2 & UCA0TXIFG));
    RS485_EnableRX();
}

#pragma vector=USCIAB0RX_VECTOR
__interrupt void USCI0RX_ISR(void) {
    char received = UCA0RXBUF;
    if (rxIndex < sizeof(rxBuffer) - 1) {
        rxBuffer[rxIndex++] = received;
        if (received == '\n') { // Fin de mensaje
            rxBuffer[rxIndex] = '\0';
            rxIndex = 0;

            //TODO: PROCESO DE EJEMPLO DE TRAMA RECIBIDA
            // Mostrar en LED si recibimos "ON"
            if (rxBuffer[0] == 'O' && rxBuffer[1] == 'N') {
                P1OUT |= BIT6; // Encender LED en P1.6
            }
            else if (rxBuffer[0] == 'O' && rxBuffer[1] == 'F') {
                P1OUT &= ~BIT6; // Apagar LED
            }
        }
    } else {
        rxIndex = 0; // Overflow -> reset
    }
}

int main(void) {
    WDTCTL = WDTPW + WDTHOLD;   // Stop watchdog

    // Configuración de pines RS485
    P1DIR |= RS485_DE + RS485_RE;
    RS485_EnableRX();

    // LED para debug
    P1DIR |= BIT6;
    P1OUT &= ~BIT6;

    UART_Init();

    __enable_interrupt();

    // Ejemplo: mandar consulta a la API
    while (1) {
        UART_SendString("GET_DATA\n"); // Solicitud al servidor
        __delay_cycles(1000000);       // Espera 1 segundo
    }
}
