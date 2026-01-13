#include <stdio.h>
#include "esp_log.h"
#include "nvs_flash.h"
#include "esp_nimble_ptr_utils.h"
#include "nimble/nimble_port.h"
#include "nimble/nimble_port_freertos.h"
#include "host/ble_hs.h"
#include "services/gap/ble_svc_gap.h"

static const char *TAG = "BIO_SCANNER";
static const char *TARGET_DEVICE_NAME = "VLAGHPLE";

// Identificador de la conexión
static uint16_t conn_handle;

/**
 * Evento de GAP (Generic Access Profile)
 * Maneja el escaneo y la conexión
 */
static int ble_gap_event(struct ble_gap_event *event, void *arg) {
    struct ble_hs_adv_fields fields;

    switch (event->type) {
        case BLE_GAP_EVENT_DISC:
            // Analizar campos del paquete de anuncio
            ble_hs_adv_parse_fields(&fields, event->disc.data, event->disc.length_data);
            
            if (fields.name_len > 0) {
                // Imprimir dispositivos encontrados en el monitor serial
                printf("Dispositivo: %.*s \n", fields.name_len, fields.name);

                // Comparar con el nombre de tu pulsera
                if (strncmp((char *)fields.name, TARGET_DEVICE_NAME, fields.name_len) == 0) {
                    ESP_LOGI(TAG, "¡Pulsera encontrada! Intentando conectar...");
                    ble_gap_disc_stop(); // Detener escaneo
                    
                    // Conectar a la pulsera
                    ble_gap_connect(BLE_OWN_ADDR_PUBLIC, &event->disc.addr, 30000, NULL, ble_gap_event, NULL);
                }
            }
            break;

        case BLE_GAP_EVENT_CONNECT:
            if (event->connect.status == 0) {
                ESP_LOGI(TAG, "Conexión establecida.");
                conn_handle = event->connect.conn_handle;
                // Aquí se iniciaría el descubrimiento de servicios (GATT)
            } else {
                ESP_LOGE(TAG, "Error en conexión; reintentando escaneo...");
                // Lógica de reintento de escaneo aquí
            }
            break;

        default:
            break;
    }
    return 0;
}

/**
 * TODO: Implementar impresión del dato puro para que python lo procese

static void notify_callback(...) {
    // ... lógica para procesar el valor hexadecimal de la pulsera ...
    int valor_biometrico = pData[1]; // Ejemplo: supongamos que el byte 1 es el pulso
    
    // El prefijo "DATA:" es el que busca el script de Python
    printf("DATA:%d\n", valor_biometrico); 
}
*/

/**
 * Configuración del escaneo
 */
void ble_app_scan(void) {
    struct ble_gap_disc_params disc_params;
    memset(&disc_params, 0, sizeof(disc_params));
    
    disc_params.filter_duplicates = 1;
    disc_params.passive = 0; // Escaneo activo para obtener el nombre
    
    ESP_LOGI(TAG, "Iniciando escaneo de pulsera...");
    ble_gap_disc(BLE_OWN_ADDR_PUBLIC, BLE_HS_FOREVER, &disc_params, ble_gap_event, NULL);
}

void ble_app_on_sync(void) {
    // Generar dirección aleatoria si es necesario y empezar escaneo
    ble_app_scan();
}

void host_task(void *param) {
    nimble_port_run(); // Esta función no regresa
    nimble_port_freertos_deinit();
}

void app_main(void) {
    // 1. Inicializar NVS (necesario para Bluetooth)
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        ESP_ERROR_CHECK(nvs_flash_erase());
        ret = nvs_flash_init();
    }
    ESP_ERROR_CHECK(ret);

    // 2. Inicializar el controlador y el stack NimBLE
    ESP_ERROR_CHECK(nimble_port_init());
    
    // 3. Configurar callbacks
    ble_hs_cfg.sync_cb = ble_app_on_sync;

    // 4. Iniciar tarea de NimBLE en FreeRTOS
    nimble_port_freertos_init(host_task);
}