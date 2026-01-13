#include <NimBLEDevice.h>

// Configuración de la pulsera (puedes ajustar el nombre si aparece distinto en tu celular)
String targetDeviceName = "VLAGHPLE"; 
static NimBLEAdvertisedDevice* advDevice;

bool doConnect = false;
uint32_t scanTime = 0; // 0 = escaneo continuo

// Callback para encontrar el dispositivo
class MyAdvertisedDeviceCallbacks: public NimBLEAdvertisedDeviceCallbacks {
    void onResult(NimBLEAdvertisedDevice* advertisedDevice) {
        Serial.printf("Dispositivo encontrado: %s \n", advertisedDevice->toString().c_str());
        
        // Filtramos por nombre
        if (advertisedDevice->haveName() && advertisedDevice->getName() == targetDeviceName.c_str()) {
            Serial.println("¡Pulsera VLAGHPLE detectada! Deteniendo escaneo...");
            NimBLEDevice::getScan()->stop();
            advDevice = advertisedDevice;
            doConnect = true;
        }
    }
};

// Callback para recibir los datos de las características
static void notifyCallback(NimBLERemoteCharacteristic* pRemoteCharacteristic, uint8_t* pData, size_t length, bool isNotify) {
    Serial.printf("Dato recibido de %s: ", pRemoteCharacteristic->getUUID().toString().c_str());
    for (int i = 0; i < length; i++) {
        Serial.printf("%02X ", pData[i]); // Imprime en Hexadecimal
    }
    Serial.println();
}

// Función para conectar y explorar servicios
bool connectToServer() {
    NimBLEClient* pClient = NimBLEDevice::createClient();
    Serial.println("Conectando a la pulsera...");

    if (!pClient->connect(advDevice)) {
        Serial.println("Fallo al conectar.");
        return false;
    }
    Serial.println("Conectado exitosamente.");

    // Listar todos los servicios para identificar cuál es el de biometría
    std::vector<NimBLERemoteService*>* services = pClient->getServices(true);
    for (auto &service : *services) {
        Serial.printf("Servicio encontrado: %s\n", service->getUUID().toString().c_str());
        
        // Listar características de cada servicio
        std::vector<NimBLERemoteCharacteristic*>* chars = service->getCharacteristics(true);
        for (auto &chr : *chars) {
            Serial.printf("  -- Característica: %s\n", chr->getUUID().toString().c_str());
            
            // Si la característica permite notificaciones, nos suscribimos automáticamente
            if (chr->canNotify()) {
                if (chr->subscribe(true, notifyCallback)) {
                    Serial.println("  [Subscrito a notificaciones]");
                }
            }
        }
    }
    return true;
}

void setup() {
    Serial.begin(115200);
    Serial.println("Iniciando Escaneo BLE...");

    NimBLEDevice::init("");
    NimBLEScan* pNimBLEScan = NimBLEDevice::getScan();
    pNimBLEScan->setAdvertisedDeviceCallbacks(new MyAdvertisedDeviceCallbacks());
    pNimBLEScan->setInterval(45);
    pNimBLEScan->setWindow(15);
    pNimBLEScan->setActiveScan(true);
    pNimBLEScan->start(scanTime);
}

void loop() {
    if (doConnect) {
        if (connectToServer()) {
            Serial.println("Exploración finalizada. Esperando datos...");
        } else {
            Serial.println("No se pudo establecer la comunicación completa.");
        }
        doConnect = false;
    }
    delay(10);
}