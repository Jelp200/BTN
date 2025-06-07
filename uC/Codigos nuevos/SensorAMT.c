/*
** #############################################################################################
**      Archivo: SensorAMT.c
**      SO: Windows 11
**      Herramienta: Visual Studio Code
**      Microcontrolador:
**          MSP430
**      Descripción:
**          Leer los valores de dos sensores analógicos (temperatura y humedad) mediante el ADC
**          de 10 bits del MSP430, los convierte a voltaje, calcula la temperatura y humedad
**          porcentual, envía los datos en formato JSON por UART y de igual recibe los datos.
** #############################################################################################
*/
#include "io430.h"

/* °°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°
°°°°°°°°°°°°°°°°°°°°°°°°°°°°° V A R I A B L E S   G L O B A L E S °°°°°°°°°°°°°°°°°°°°°°°°°°°°°°
°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°° */
unsigned long H, T;
unsigned char Conv = 0, Tant = 0;
unsigned int Vh, Vt, Vtprom = 0;
char jsonBuffer[128];                       // Buffer para el mensaje JSON

// Variables para recepción UART
#define RX_BUFFER_SIZE 16
char rxBuffer[RX_BUFFER_SIZE];
unsigned char rxIndex = 0;
unsigned char rxState = 0; // 0: esperando 'C', 1: '1', 2: datos, 3: final

/* .............................................................................................
....................... D E C L A R A C I Ó N   D E   F U N C I O N E S ........................
............................................................................................. */
void EnteroChar(unsigned int valor, char* buffer);
void EnteroCharDecimal(unsigned int valor, char* buffer, unsigned char decimales);
unsigned int StrCopy(char* dest, const char* fnte);
void EnvioUART(char* str);
void ConstJSON(char* buffer, unsigned int Vh, unsigned int H, unsigned int Vt, unsigned int T);
void ADC_10(unsigned char Canal);
void ProcesarComando(char* cmd);

/* ---------------------------------------------------------------------------------------------
------------------------------ F U N C I O N   P R I N C I P A L -------------------------------
--------------------------------------------------------------------------------------------- */
int main(void) {
    //* Detiene el watchdog timer.
    WDTCTL = WDTPW + WDTHOLD;

    //* Configuración del reloj a 16MHz.
    BCSCTL1 = CALBC1_16MHZ;
    DCOCTL  = CALDCO_16MHZ;

    //* Configurar UART (P1.1 RX, P1.2 TX).
    P1SEL |= BIT1 + BIT2;
    P1SEL2 |= BIT1 + BIT2;
    P1DIR &= ~BIT1;                         // RX
    P1DIR |= BIT2;                          // TX
    UCA0CTL1 |= UCSSEL_2;                   // SMCLK
    // ------------------------------------- Baud rate 9600 ------------------------------------
    UCA0BR0 = 0x82; UCA0BR1 = 0x06;         //  16MHz
    UCA0MCTL = UCBRS2 + UCBRS1;             // Modulación
    // -----------------------------------------------------------------------------------------

    UCA0CTL1 &= ~UCSWRST;                   // Liberar reset
    IE2 |= UCA0RXIE;                        // Habilitar interrupción de recepción

    //* Configurar canales analógicos.
    ADC10AE0 |= BIT5;                       // Canal A5 para temperatura
    ADC10AE0 |= BIT6;                       // Canal A6 para humedad

    //* Configura salida para prueba (ej: LED en P1.3)
    P1DIR |= BIT3;                          // P1.3 como salida
    P1OUT &= ~BIT3;                         // Inicialmente apagado

    //* Habilitar interrupciones globales.
    __bis_SR_register(GIE);

    while (1) {
        //* Proceso de humedad
        ADC_10(6);                          // Canal 6
        while(Conv == 0){}                  // Esperar termino de conversión
        Conv = 0;

        //* Proceso de temperatura (promedio móvil)
        Vtprom = 0;
        for(unsigned char i = 0; i < 10; i++) {
            ADC_10(5);                      // Canal 5
            while(Conv == 0){}
            Vtprom += Vt;
            Conv = 0;
        }
        Vt = Vtprom / 10;
        Vt = (Vt + Tant) / 2;               // Promedio móvil
        Tant = Vt;

        //* Construir y enviar JSON
        ConstJSON(jsonBuffer, Vh, H, Vt, Tant);
        EnvioUART(jsonBuffer);

        //* Delay opcional entre lecturas
        __delay_cycles(500000);             // 500ms a 16MHz
    }
}

/* .............................................................................................
...................................... F U N C I O N E S .......................................
............................................................................................. */
//* CONVERSIÓN DE INT POSITIVO A ASCII.
void EnteroChar(unsigned int valor, char* buffer) {
    char *ptr = buffer;
    if (valor == 0) {
        *ptr++ = '0';
    } else {
        char temp[6];
        char i = 0;
        while (valor > 0) {
            temp[i++] = '0' + (valor % 10);
            valor /= 10;
        }
        while (i > 0)
            *ptr++ = temp[--i];
    }
    *ptr = '\0';
}

//* CONVERSIÓN DE UN INT A UNA CADENA CON DECIMALES (ej: 330 → "3.30")
void EnteroCharDecimal(unsigned int valor, char* buffer, unsigned char decimales) {
    char *ptr = buffer;
    unsigned int divisor;

    if (decimales == 2)
        divisor = 100;
    else if (decimales == 1)
        divisor = 10;
    else
        divisor = 1;

    unsigned int parteEntera = valor / divisor;
    if (parteEntera == 0) {
        *ptr++ = '0';
    } else {
        char temp[6];
        char i = 0;
        while (parteEntera > 0) {
            temp[i++] = '0' + (parteEntera % 10);
            parteEntera /= 10;
        }
        while (i > 0)
            *ptr++ = temp[--i];
    }

    if (decimales > 0) {
        *ptr++ = '.';
        unsigned int parteDecimal = valor % divisor;
        if (decimales == 2) {
            if (parteDecimal < 10) {
                *ptr++ = '0';
                *ptr++ = '0' + parteDecimal;
            } else if (parteDecimal < 100) {
                *ptr++ = '0' + (parteDecimal / 10);
                *ptr++ = '0' + (parteDecimal % 10);
            } else {
                *ptr++ = '9'; *ptr++ = '9'; // overflow
            }
        } else if (decimales == 1) {
            *ptr++ = '0' + (parteDecimal % 10);
        }
    }

    *ptr = '\0';
}

//* COPIA DE UNA CADENA Y DEVOLUCIÓN DE SU LONGITUD.
unsigned int StrCopy(char* dest, const char* fnte) {
    unsigned int lon = 0;
    while ((*dest++ = *fnte++)) {
        lon++;
    }
    return lon;
}

//* ENVIÓ DE CADENA POR UART.
void EnvioUART(char* str) {
    while (*str) {
        while (!(IFG2 & UCA0TXIFG)) {}
        UCA0TXBUF = *str++;
    }
}

//* CONSTRUCCIÓN DE JSON MANUAL.
void ConstJSON(char* buffer, unsigned int Vh, unsigned int H, unsigned int Vt, unsigned int T) {
    char vhStr[8], hStr[8], vtStr[8], tStr[8];

    EnteroCharDecimal(Vh, vhStr, 2);        // Voltaje humedad
    EnteroChar(H, hStr);                    // Humedad en %
    EnteroCharDecimal(Vt, vtStr, 2);        // Voltaje temperatura
    EnteroChar(T, tStr);                    // Temperatura en °C

    char *p = buffer;

    // {"humedad:"valor%", 
    *p++ = '{'; *p++ = '"'; *p++ = 'h'; *p++ = 'u'; *p++ = 'm'; *p++ = 'e'; *p++ = 'd'; *p++ = 'a'; *p++ = 'd'; *p++ = '"';
    *p++ = ':'; *p++ = '"'; p += StrCopy(p, hStr); *p++ = '%'; *p++ = '"'; *p++ = ',';

    // "voltaje_humedad:"valorV",
    *p++ = '"'; *p++ = 'v'; *p++ = 'o'; *p++ = 'l'; *p++ = 't'; *p++ = 'a'; *p++ = 'g'; *p++ = 'e'; *p++ = '_'; *p++ = 'h'; *p++ = 'u'; *p++ = 'm'; *p++ = 'e'; *p++ = 'd'; *p++ = 'a'; *p++ = 'd'; *p++ = '"';
    *p++ = ':'; *p++ = '"'; p += StrCopy(p, vhStr); *p++ = 'V'; *p++ = '"'; *p++ = ',';

    // "temperatura:"valorC",
    *p++ = '"'; *p++ = 't'; *p++ = 'e'; *p++ = 'm'; *p++ = 'p'; *p++ = 'e'; *p++ = 'r'; *p++ = 'a'; *p++ = 't'; *p++ = 'u'; *p++ = 'r'; *p++ = 'a'; *p++ = '"';
    *p++ = ':'; *p++ = '"'; p += StrCopy(p, tStr); *p++ = 'C'; *p++ = '"'; *p++ = ',';

    // "voltaje_temp:"valorV"
    *p++ = '"'; *p++ = 'v'; *p++ = 'o'; *p++ = 'l'; *p++ = 't'; *p++ = 'a'; *p++ = 'g'; *p++ = 'e'; *p++ = '_'; *p++ = 't'; *p++ = 'e'; *p++ = 'm'; *p++ = 'p'; *p++ = '"';
    *p++ = ':'; *p++ = '"'; p += StrCopy(p, vtStr); *p++ = 'V'; *p++ = '"'; 

    // }
    *p++ = '}'; *p++ = '\r'; *p++ = '\n'; *p = '\0';

    // Estructura JSON.
    // {"humedad:"valor%","voltaje_humedad:"valorV","temperatura:"valorC","voltaje_temp:"valorV"}
}

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
        Conv = 1;
    }
}

//* SELECCION DEL CANAL ANALOGO Y LANZAMIENTO DE CONVERSIÓN
void ADC_10 (unsigned char Canal) {
    switch (Canal) {
        case 5:
            ADC10CTL0 = SREF_0 + ADC10SHT_3 + MSC + ADC10ON + ADC10IE;
            ADC10CTL1 = INCH_5 + CONSEQ_0;
            ADC10CTL0 |= ENC + ADC10SC;
            A5 = 1;
            break;
        case 6:
            ADC10CTL0 = SREF_0 + ADC10SHT_2 + MSC + ADC10ON + ADC10IE;
            ADC10CTL1 = INCH_6 + CONSEQ_0;
            ADC10CTL0 |= ENC + ADC10SC;
            A6 = 1;
            break;
    }
}

//* INTERRUPCION DE RECEPCION UART
#pragma vector=USCIAB0RX_VECTOR
__interrupt void USCI0RX_ISR(void) {
    char c = UCA0RXBUF;

    switch(rxState) {
        case 0: // Buscando 'C'
            if(c == 'C') rxState = 1;
            break;

        case 1: // Buscando '1'
            if(c == '1') rxState = 2;
            else rxState = 0;
            break;

        case 2: // Recibir 3 dígitos
            if(rxIndex < 3) {
                rxBuffer[rxIndex++] = c;
            } else {
                rxBuffer[rxIndex] = '\0';
                rxIndex = 0;
                rxState = 3;
            }
            break;

        case 3: // Buscando 'F'
            if(c == 'F') {
                ProcesarComando(rxBuffer);
                EnvioUART("ACK"); // Confirmación
                EnvioUART(rxBuffer);
                EnvioUART("\r\n");
            }
            rxState = 0;
            break;
    }
}

//* PROCESAR COMANDO
void ProcesarComando(char* cmd) {
    int numero = 0;
    for(int i = 0; i < 3; i++) {
        numero = numero * 10 + (cmd[i] - '0');
    }

    if(numero >= 0 && numero <= 78) {
        switch(numero) {
            case 0:
                P1OUT |= BIT3; // Encender LED en P1.3
                break;
            case 1:
                P1OUT &= ~BIT3; // Apagar LED
                break;
            // Agrega más casos según tus necesidades
            default:
                break;
        }
    }
}