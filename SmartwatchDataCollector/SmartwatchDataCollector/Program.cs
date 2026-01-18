using SmartwatchDataCollector.Infrastructure.Bluetooth;
using System;

var scanner = new BleScanner();
var connector = new BleConnector();
bool isConnected = false;

// UUIDs constantes para tu reloj ET570
string serviceUuid = "0000ae00-0000-1000-8000-00805f9b34fb";
string charWriteUuid = "0000ae01-0000-1000-8000-00805f9b34fb";

Console.WriteLine("Buscando el reloj ET570...");

connector.OnDataReceived += (data) =>
{
    string hex = BitConverter.ToString(data.RawValue);
    Console.ForegroundColor = ConsoleColor.Green;
    Console.WriteLine($"\n[!] RESPUESTA RECIBIDA en Char: {data.CharacteristicUuid}");
    Console.WriteLine($"[!] DATOS (HEX): {hex}");
    Console.ResetColor();
};

scanner.OnDeviceDiscovered += async (device) =>
{
    if (device.Name == "ET570" && !isConnected)
    {
        isConnected = true;
        scanner.StopScanning();
        Console.WriteLine($"\n¡ET570 encontrado! MAC: {device.Address}");

        try
        {
            await connector.ConnectAsync(device.Address);
            await Task.Delay(3000); // Tiempo para que las suscripciones se activen

            // ========================================================
            // ESCÁNER DE COMANDOS (BRUTE FORCE DE CABECERAS)
            // ========================================================

            var testCommands = new List<(string Name, byte[] Data)>
            {
                ("AB Standard",   new byte[] { 0xAB, 0x00, 0x03, 0xFF, 0xB1, 0x80 }),
                ("EA Protocol",   new byte[] { 0xEA, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xEC }),
                ("55 Handshake",  new byte[] { 0x55, 0x01, 0x00, 0x00, 0x00, 0x56 }),
                ("AA Handshake",  new byte[] { 0xAA, 0x01, 0x00, 0x00, 0x00, 0xAB }),
                ("EA Time Sync",  new byte[] { 0xEA, 0x01, 0x00, 0x1A, 0x01, 0x0E, 0x16, 0x00, 0x00, 0x53 }),
                ("Raw Battery",   new byte[] { 0x03, 0x01, 0x00 }),
                ("Raw HR Start",  new byte[] { 0x09, 0x01, 0x01 }),
                ("JYouPro Alt",   new byte[] { 0xAB, 0x00, 0x04, 0xFF, 0x31, 0x0A, 0x00 })
            };

            Console.WriteLine("\n--- INICIANDO ESCÁNER DE PROTOCOLO ---");

            foreach (var test in testCommands)
            {
                Console.WriteLine($"\n[TESTING] {test.Name}...");
                Console.WriteLine($"[TX] Enviando: {BitConverter.ToString(test.Data)}");

                await connector.WriteCharacteristicAsync(serviceUuid, charWriteUuid, test.Data);

                // Esperamos 3 segundos para ver si AE02 responde algo
                await Task.Delay(3000);
            }

            Console.WriteLine("\n--- Escaneo finalizado. Revisa si hubo respuestas en verde. ---");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error durante la prueba: {ex.Message}");
            isConnected = false;
            scanner.StartScanning();
        }
    }
};

scanner.StartScanning();
Console.WriteLine("Presiona una tecla para cerrar...");
Console.ReadKey();
