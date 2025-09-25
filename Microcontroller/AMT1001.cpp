/**
 * #############################################################################################
 *      Archivo: AMT1001.cpp
 *      Microcontrolador: MSP430
 *      Descripción:
 *          Lectura de sensores de temperatura y humedad (AMT1001) mediante ADC10.
 *          Conversión a voltaje, cálculo de valores físicos, formateo y envío por UART.
 *          Código en C++ compatible con entornos embebidos (sin STL dinámico).
 * #############################################################################################
 */

#include <cstdint>
#include <cstring>

// Incluir solo en entorno real MSP430
#include "io430.h"

// Tipos seguros
using u8  = uint8_t;
using u16 = uint16_t;
using u32 = uint32_t;

// Constantes
constexpr u16 ADC_MAX = 1023;
constexpr u16 VREF_MV = 3300; // 3.3V en milivoltios
constexpr u8 NUM_SAMPLES = 10;

// Buffer para mensajes UART (estático, sin malloc)
char g_uart_buffer[64];

// Bandera global de conversión (mínimo uso)
volatile bool g_adc_conversion_done = false;
volatile u8 g_current_channel = 0xFF;

// Resultados del ADC
volatile u16 g_adc_temp_raw = 0;
volatile u16 g_adc_hum_raw = 0;

// ─────────────────────────────────────────────────────────────
// Interrupción del ADC10
// ─────────────────────────────────────────────────────────────
#pragma vector = ADC10_VECTOR
__interrupt void ADC10_ISR(void) {
    if (g_current_channel == 5) {
        g_adc_temp_raw = ADC10MEM;
    } else if (g_current_channel == 6) {
        g_adc_hum_raw = ADC10MEM;
    }
    g_adc_conversion_done = true;
    g_current_channel = 0xFF;
    ADC10CTL0 &= ~ENC; // Detener conversión
}

// ─────────────────────────────────────────────────────────────
// Iniciar conversión ADC en un canal
// ─────────────────────────────────────────────────────────────
void start_adc_conversion(u8 channel) {
    g_adc_conversion_done = false;
    g_current_channel = channel;

    ADC10CTL0 = SREF_0 | ADC10SHT_3 | MSC | ADC10ON | ADC10IE;
    ADC10CTL1 = (channel << 12) | CONSEQ_0; // INCH_x = channel
    ADC10CTL0 |= ENC | ADC10SC;
}

// ─────────────────────────────────────────────────────────────
// Convertir valor ADC a milivoltios
// ─────────────────────────────────────────────────────────────
u16 adc_to_mv(u16 adc_value) {
    return static_cast<u16>((static_cast<u32>(adc_value) * VREF_MV) / ADC_MAX);
}

// ─────────────────────────────────────────────────────────────
// Formatear número de hasta 4 dígitos en un buffer (sin sprintf)
// ─────────────────────────────────────────────────────────────
void format_uint3(u16 value, char* buf) {
    // Asegurar que value <= 999
    if (value > 999) value = 999;

    buf[0] = '0' + (value / 100);
    buf[1] = '0' + ((value % 100) / 10);
    buf[2] = '0' + (value % 10);
    buf[3] = '\0';
}

void format_uint4(u16 value, char* buf) {
    // Formato: d.ddd (ej. 3.300)
    u16 whole = value / 1000;
    u16 frac = value % 1000;

    buf[0] = '0' + whole;
    buf[1] = '.';
    buf[2] = '0' + (frac / 100);
    buf[3] = '0' + ((frac % 100) / 10);
    buf[4] = '0' + (frac % 10);
    buf[5] = '\0';
}

// ─────────────────────────────────────────────────────────────
// Enviar cadena por UART
// ─────────────────────────────────────────────────────────────
void uart_send_string(const char* str) {
    while (*str) {
        while (!(IFG2 & UCA0TXIFG));
        UCA0TXBUF = *str++;
    }
}

// ─────────────────────────────────────────────────────────────
// Función principal
// ─────────────────────────────────────────────────────────────
int main(void) {
    // Detener watchdog
    WDTCTL = WDTPW | WDTHOLD;

    // Configurar reloj a 16 MHz
    BCSCTL1 = CALBC1_16MHZ;
    DCOCTL = CALDCO_16MHZ;

    // Configurar UART (P1.1=RX, P1.2=TX)
    P1SEL |= BIT1 | BIT2;
    P1SEL2 |= BIT1 | BIT2;
    P1DIR &= ~BIT1;  // RX
    P1DIR |= BIT2;   // TX

    UCA0CTL1 |= UCSSEL_2;           // SMCLK
    UCA0BR0 = 0x82; UCA0BR1 = 0x06; // 9600 baud @ 16MHz
    UCA0MCTL = UCBRS2 | UCBRS1;     // Modulación
    UCA0CTL1 &= ~UCSWRST;           // Iniciar UART
    IE2 |= UCA0RXIE;                // Interrupción RX (aunque no se use)

    // Configurar pines analógicos A5 (P1.5) y A6 (P1.6)
    ADC10AE0 |= BIT5 | BIT6;

    // Habilitar interrupciones globales
    __bis_SR_register(GIE);

    u16 temp_mv_avg = 0;
    u16 last_temp_mv = 0;

    while (1) {
        // ──────── LECTURA DE HUMEDAD ────────
        start_adc_conversion(6);
        while (!g_adc_conversion_done);

        u16 hum_mv = adc_to_mv(g_adc_hum_raw);
        u16 hum_percent = hum_mv / 33; // Aprox. 33 mV/% (3.3V / 100%)

        // Formatear mensaje de humedad
        char hum_mv_str[6], hum_pct_str[4];
        format_uint4(hum_mv, hum_mv_str);
        format_uint3(hum_percent, hum_pct_str);

        std::snprintf(g_uart_buffer, sizeof(g_uart_buffer), "Vh=%sV | Humedad=%s%%\r\n", hum_mv_str, hum_pct_str);
        uart_send_string(g_uart_buffer);

        // ──────── LECTURA DE TEMPERATURA (promedio de 10 muestras) ────────
        u32 temp_sum = 0;
        for (u8 i = 0; i < NUM_SAMPLES; ++i) {
            start_adc_conversion(5);
            while (!g_adc_conversion_done);
            temp_sum += g_adc_temp_raw;
        }
        u16 temp_raw_avg = static_cast<u16>(temp_sum / NUM_SAMPLES);
        u16 temp_mv = adc_to_mv(temp_raw_avg);

        // Promedio móvil simple (opcional)
        if (last_temp_mv == 0) {
            temp_mv_avg = temp_mv;
        } else {
            temp_mv_avg = (temp_mv + last_temp_mv) / 2;
        }
        last_temp_mv = temp_mv_avg;

        // Suponiendo sensor lineal: 10 mV/°C, 0°C = 0V → T = mV / 10
        u16 temperature_c = temp_mv_avg / 10;

        // Formatear mensaje de temperatura
        char temp_mv_str[6], temp_c_str[4];
        format_uint4(temp_mv_avg, temp_mv_str);
        format_uint3(temperature_c, temp_c_str);

        std::snprintf(g_uart_buffer, sizeof(g_uart_buffer), "|Vt=%sV | Temperatura=%sC\r\n", temp_mv_str, temp_c_str);
        uart_send_string(g_uart_buffer);

        // Pequeña pausa (opcional, para no saturar UART)
        __delay_cycles(16000000 / 4); // ~250 ms @ 16 MHz
    }
}