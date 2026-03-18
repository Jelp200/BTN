/* ***************************************************************************
**  Archivo:   BleConnector.cs
**  Proyecto:  ControlPanel.API (Botonera)
**  Version:   2.0.0
**  Autor(es):
**             Jorge E. Peña Paz
**             Salvador A. Zavala
**  Equipo:    Deprartamento de Computo - Gradus Technologies
**  Fecha:     Enero 2026
**  Descripcion:
**              Clase que implementa la conexión BLE utilizando las APIs de
**              Windows.
*************************************************************************** */
using ControlPanel.API.Interfaces;
using ControlPanel.API.Models;
using Windows.Devices.Bluetooth;
using Windows.Devices.Bluetooth.GenericAttributeProfile;
using Windows.Storage.Streams;

namespace ControlPanel.API.Bluetooth
{
    public class BleConnector : IBleConnector
    {
        private BluetoothLEDevice? _device;
        private GattSession? _gattSession;
        private readonly List<GattDeviceService> _services = new();
        private readonly List<GattCharacteristic> _characteristics = new();
        public event Action<GattData>? OnDataReceived;

        public async Task ConnectAsync(string macAddress, CancellationToken cancellationToken = default)
        {
            ulong address = Convert.ToUInt64(macAddress, 16);

            _device = await BluetoothLEDevice.FromBluetoothAddressAsync(address).AsTask(cancellationToken);
            if (_device == null) throw new InvalidOperationException("No se pudo establecer conexión con el reloj.");

            _gattSession = await GattSession.FromDeviceIdAsync(_device.BluetoothDeviceId).AsTask(cancellationToken);
            if (_gattSession != null)
            {
                _gattSession.MaintainConnection = true;
                _gattSession.MaxPduSizeChanged += (s, _) => { /* solo informativo */ };
            }

            var servicesResult = await _device.GetGattServicesAsync(BluetoothCacheMode.Uncached).AsTask(cancellationToken);
            if (servicesResult.Status == GattCommunicationStatus.Success)
            {
                foreach (var service in servicesResult.Services)
                {
                    _services.Add(service);  // Guardar referencia para limpieza posterior
                    await ExploreCharacteristics(service, cancellationToken);
                }
            }
        }

        public async Task DisconnectAsync(CancellationToken cancellationToken = default)
        {
            try
            {
                // Paso 1: Deshabilitar notificaciones GATT antes de cerrar conexión
                foreach (var characteristic in _characteristics)
                {
                    try
                    {
                        await characteristic
                            .WriteClientCharacteristicConfigurationDescriptorAsync(
                                GattClientCharacteristicConfigurationDescriptorValue.None)
                            .AsTask(cancellationToken);
                    }
                    catch { /* Ignorar errores individuales */ }
                }
                _characteristics.Clear();

                // Paso 2: Liberar servicios GATT
                foreach (var service in _services)
                {
                    try { service.Dispose(); }
                    catch { /* Ignorar errores individuales */ }
                }
                _services.Clear();

                // Paso 3: Desactivar sesión GATT
                if (_gattSession != null)
                {
                    try
                    {
                        _gattSession.MaintainConnection = false;
                        await Task.Delay(150, cancellationToken);
                        _gattSession.Dispose();
                    }
                    catch { /* Ignorar errores de dispose */ }
                    finally
                    {
                        _gattSession = null;
                    }
                }

                // Paso 4: Liberar dispositivo BLE
                if (_device != null)
                {
                    try
                    {
                        // Esperar a que Windows procese las liberaciones anteriores
                        await Task.Delay(150, cancellationToken);
                        _device.Dispose();
                    }
                    catch { /* Ignorar errores de dispose */ }
                    finally
                    {
                        _device = null;
                    }
                }

                // Paso 5: Forzar recolección de basura para liberar handles COM/WinRT
                await Task.Run(() =>
                {
                    GC.Collect();
                    GC.WaitForPendingFinalizers();
                    GC.Collect();
                }, cancellationToken);

                // Paso 6: Pausa final para que Windows complete la desconexión física
                await Task.Delay(300, cancellationToken);
            }
            catch (Exception ex)
            {
                // Limpiar referencias incluso en caso de error
                _characteristics.Clear();
                _services.Clear();
                _gattSession = null;
                _device = null;
                
                throw new InvalidOperationException($"Error al desconectar: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Explore and log all available GATT services and characteristics on the connected device
        /// Useful for debugging protocol issues and discovering actual UUIDs
        /// </summary>
        public async Task ExploreAndLogAllServices(CancellationToken cancellationToken = default)
        {
            if (_device == null)
            {
                Console.WriteLine("[BLE-EXPLORE] ✗ Dispositivo no conectado");
                return;
            }

            Console.WriteLine("\n═══════════════════════════════════════════════════════════════════");
            Console.WriteLine("[BLE-EXPLORE] 🔍 DESCUBRIMIENTO COMPLETO DE SERVICIOS GATT");
            Console.WriteLine("═══════════════════════════════════════════════════════════════════");

            try
            {
                var servicesResult = await _device.GetGattServicesAsync(BluetoothCacheMode.Uncached).AsTask(cancellationToken);
                if (servicesResult.Status != GattCommunicationStatus.Success)
                {
                    Console.WriteLine($"[BLE-EXPLORE] ✗ Error al obtener servicios: {servicesResult.Status}");
                    return;
                }

                Console.WriteLine($"[BLE-EXPLORE] Total de servicios encontrados: {servicesResult.Services.Count}\n");

                foreach (var service in servicesResult.Services)
                {
                    Console.WriteLine($"[BLE-EXPLORE] 📦 Servicio: {service.Uuid}");
                    Console.WriteLine($"[BLE-EXPLORE]    UUID (normalizado): {NormalizeUuid(service.Uuid.ToString())}");

                    var charsResult = await service.GetCharacteristicsAsync(BluetoothCacheMode.Uncached).AsTask(cancellationToken);
                    if (charsResult.Status != GattCommunicationStatus.Success)
                    {
                        Console.WriteLine($"[BLE-EXPLORE]    ✗ Error al obtener características: {charsResult.Status}");
                        continue;
                    }

                    Console.WriteLine($"[BLE-EXPLORE]    Características: {charsResult.Characteristics.Count}");

                    foreach (var characteristic in charsResult.Characteristics)
                    {
                        var properties = characteristic.CharacteristicProperties;
                        var propStr = string.Empty;
                        if (properties.HasFlag(GattCharacteristicProperties.Notify)) propStr += "Notify ";
                        if (properties.HasFlag(GattCharacteristicProperties.Read)) propStr += "Read ";
                        if (properties.HasFlag(GattCharacteristicProperties.Write)) propStr += "Write ";
                        if (properties.HasFlag(GattCharacteristicProperties.WriteWithoutResponse)) propStr += "WriteNoResp ";

                        Console.WriteLine($"[BLE-EXPLORE]      • {characteristic.Uuid}");
                        Console.WriteLine($"[BLE-EXPLORE]        UUID (normalizado): {NormalizeUuid(characteristic.Uuid.ToString())}");
                        Console.WriteLine($"[BLE-EXPLORE]        Propiedades: {propStr}");
                    }

                    Console.WriteLine();
                }

                Console.WriteLine("═══════════════════════════════════════════════════════════════════\n");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[BLE-EXPLORE] ✗ Excepción: {ex.Message}");
            }
        }

        private static string NormalizeUuid(string uuid)
        {
            return uuid.Replace("-", "").ToLowerInvariant();
        }

        private async Task ExploreCharacteristics(GattDeviceService service, CancellationToken cancellationToken)
        {
            var charResult = await service.GetCharacteristicsAsync(BluetoothCacheMode.Uncached).AsTask(cancellationToken);
            if (charResult.Status != GattCommunicationStatus.Success) return;

            foreach (var character in charResult.Characteristics)
            {
                if (character.CharacteristicProperties.HasFlag(GattCharacteristicProperties.Notify))
                {
                    _characteristics.Add(character);  // Guardar para limpieza posterior
                    await SubscribeToCharacteristic(character, cancellationToken);
                }
            }
        }

        private async Task SubscribeToCharacteristic(GattCharacteristic characteristic, CancellationToken cancellationToken)
        {
            var status = await characteristic
                .WriteClientCharacteristicConfigurationDescriptorAsync(GattClientCharacteristicConfigurationDescriptorValue.Notify)
                .AsTask(cancellationToken);

            if (status != GattCommunicationStatus.Success) return;

            characteristic.ValueChanged += (s, args) =>
            {
                var reader = DataReader.FromBuffer(args.CharacteristicValue);
                byte[] input = new byte[reader.UnconsumedBufferLength];
                reader.ReadBytes(input);

                OnDataReceived?.Invoke(new GattData(s.Service.Uuid.ToString(), s.Uuid.ToString(), input));
            };
        }

        /// <summary>
        /// Subscribe to notifications from a specific characteristic UUID
        /// Used for H Band protocol to receive data on F0080002 UUID
        /// </summary>
        public async Task SubscribeToNotificationsAsync(Guid serviceUuid, Guid characteristicUuid, CancellationToken cancellationToken = default)
        {
            Console.WriteLine($"[BLE] Buscando servicio {serviceUuid}...");
            if (_device == null)
                throw new InvalidOperationException("Device not connected");

            // Find the service
            var servicesResult = await _device.GetGattServicesForUuidAsync(serviceUuid, BluetoothCacheMode.Uncached).AsTask(cancellationToken);
            Console.WriteLine($"[BLE] Resultado búsqueda servicio: {servicesResult.Status}");
            if (servicesResult.Status != GattCommunicationStatus.Success)
                throw new InvalidOperationException($"Could not find service {serviceUuid}");

            var service = servicesResult.Services.FirstOrDefault();
            Console.WriteLine($"[BLE] Servicio encontrado: {service != null}");
            if (service == null)
                throw new InvalidOperationException($"Service {serviceUuid} not found");

            // Find the characteristic
            Console.WriteLine($"[BLE] Buscando característica {characteristicUuid}...");
            var characteristicsResult = await service.GetCharacteristicsForUuidAsync(characteristicUuid, BluetoothCacheMode.Uncached).AsTask(cancellationToken);
            Console.WriteLine($"[BLE] Resultado búsqueda característica: {characteristicsResult.Status}");
            if (characteristicsResult.Status != GattCommunicationStatus.Success)
                throw new InvalidOperationException($"Could not find characteristic {characteristicUuid}");

            var characteristic = characteristicsResult.Characteristics.FirstOrDefault();
            Console.WriteLine($"[BLE] Característica encontrada: {characteristic != null}");
            if (characteristic == null)
                throw new InvalidOperationException($"Characteristic {characteristicUuid} not found");

            // Subscribe to notifications
            Console.WriteLine($"[BLE] Habilitando notificaciones...");
            var status = await characteristic
                .WriteClientCharacteristicConfigurationDescriptorAsync(GattClientCharacteristicConfigurationDescriptorValue.Notify)
                .AsTask(cancellationToken);
            Console.WriteLine($"[BLE] Resultado habilitar notificaciones: {status}");

            if (status != GattCommunicationStatus.Success)
                throw new InvalidOperationException($"Failed to enable notifications on {characteristicUuid}");

            // Track characteristic for cleanup
            if (!_characteristics.Contains(characteristic))
            {
                _characteristics.Add(characteristic);
            }

            // Attach value changed handler
            Console.WriteLine($"[BLE] Adjuntando handler ValueChanged...");
            characteristic.ValueChanged += (s, args) =>
            {
                Console.WriteLine($"[BLE] ★ ValueChanged disparado! {args.CharacteristicValue.Length} bytes");
                var reader = DataReader.FromBuffer(args.CharacteristicValue);
                byte[] input = new byte[reader.UnconsumedBufferLength];
                reader.ReadBytes(input);

                OnDataReceived?.Invoke(new GattData(s.Service.Uuid.ToString(), s.Uuid.ToString(), input));
            };
            Console.WriteLine($"[BLE] ✓ Handler adjuntado correctamente!");
        }

        /// <summary>
        /// Write data to a specific characteristic UUID
        /// Used for H Band protocol to send commands on F0080003 UUID
        /// </summary>
        public async Task WriteAsync(Guid serviceUuid, Guid characteristicUuid, byte[] data, CancellationToken cancellationToken = default)
        {
            Console.WriteLine($"[BLE] Preparando escritura a {characteristicUuid}...");
            Console.WriteLine($"[BLE] Datos a enviar: [{string.Join(", ", data.Select(b => $"0x{b:X2}"))}]");
            
            if (_device == null)
                throw new InvalidOperationException("Device not connected");

            // Find the service
            Console.WriteLine($"[BLE] Buscando servicio {serviceUuid}...");
            var servicesResult = await _device.GetGattServicesForUuidAsync(serviceUuid, BluetoothCacheMode.Uncached).AsTask(cancellationToken);
            if (servicesResult.Status != GattCommunicationStatus.Success)
                throw new InvalidOperationException($"Could not find service {serviceUuid}");

            var service = servicesResult.Services.FirstOrDefault();
            if (service == null)
                throw new InvalidOperationException($"Service {serviceUuid} not found");

            // Find the characteristic
            Console.WriteLine($"[BLE] Buscando característica {characteristicUuid}...");
            var characteristicsResult = await service.GetCharacteristicsForUuidAsync(characteristicUuid, BluetoothCacheMode.Uncached).AsTask(cancellationToken);
            if (characteristicsResult.Status != GattCommunicationStatus.Success)
                throw new InvalidOperationException($"Could not find characteristic {characteristicUuid}");

            var characteristic = characteristicsResult.Characteristics.FirstOrDefault();
            if (characteristic == null)
                throw new InvalidOperationException($"Characteristic {characteristicUuid} not found");

            // Write data
            Console.WriteLine($"[BLE] Escribiendo {data.Length} bytes...");
            var writer = new DataWriter();
            writer.WriteBytes(data);
            
            var writeResult = await characteristic.WriteValueAsync(writer.DetachBuffer()).AsTask(cancellationToken);
            Console.WriteLine($"[BLE] Resultado escritura: {writeResult}");
            if (writeResult != GattCommunicationStatus.Success)
                throw new InvalidOperationException($"Failed to write to characteristic {characteristicUuid}");
            Console.WriteLine($"[BLE] ✓ Escritura exitosa!");
        }
    }
}