using Windows.Devices.Bluetooth;
using Windows.Devices.Bluetooth.GenericAttributeProfile;
using Windows.Storage.Streams;
using SmartwatchDataCollector.Core.Entities;
using SmartwatchDataCollector.Core.Interfaces;

namespace SmartwatchDataCollector.Infrastructure.Bluetooth
{
    public class BleConnector : IBleConnector
    {
        private BluetoothLEDevice? _device;
        public event Action<GattData>? OnDataReceived;

        public async Task ConnectAsync(string macAddress)
        {
            // Convertimos la MAC de Hex String a ulong
            ulong address = Convert.ToUInt64(macAddress, 16);

            Console.WriteLine($"Conectando a {macAddress}...");
            _device = await BluetoothLEDevice.FromBluetoothAddressAsync(address);

            if (_device == null) throw new Exception("No se pudo establecer conexión.");

            Console.WriteLine("Conexión exitosa. Explorando servicios...");

            // Obtenemos los servicios del reloj
            var servicesResult = await _device.GetGattServicesAsync();

            if (servicesResult.Status == GattCommunicationStatus.Success)
            {
                foreach (var service in servicesResult.Services)
                {
                    Console.WriteLine($"Servicio encontrado: {service.Uuid}");
                    await ExploreCharacteristics(service);
                }
            }
        }

        public async Task WriteCharacteristicAsync(string serviceUuid, string charUuid, byte[] data)
        {
            if (_device == null) return;

            var services = await _device.GetGattServicesAsync();
            var service = services.Services.FirstOrDefault(s => s.Uuid.ToString() == serviceUuid);

            if (service != null)
            {
                var chars = await service.GetCharacteristicsAsync();
                var character = chars.Characteristics.FirstOrDefault(c => c.Uuid.ToString() == charUuid);

                if (character != null)
                {
                    var writer = new DataWriter();
                    writer.WriteBytes(data);
                    await character.WriteValueAsync(writer.DetachBuffer());
                    Console.WriteLine($"[TX] Comando enviado a {charUuid}: {BitConverter.ToString(data)}");
                }
            }
        }

        private async Task ExploreCharacteristics(GattDeviceService service)
        {
            var charResult = await service.GetCharacteristicsAsync();
            if (charResult.Status == GattCommunicationStatus.Success)
            {
                foreach (var character in charResult.Characteristics)
                {
                    // Intentamos leer el valor actual de cada característica
                    Console.WriteLine($"  - Característica: {character.Uuid} | Propiedades: {character.CharacteristicProperties}");

                    // Si permite notificaciones, nos suscribimos (aquí es donde llegan los datos en vivo)
                    if (character.CharacteristicProperties.HasFlag(GattCharacteristicProperties.Notify))
                    {
                        await SubscribeToCharacteristic(character);
                    }
                }
            }
        }

        private async Task SubscribeToCharacteristic(GattCharacteristic characteristic)
        {
            var status = await characteristic.WriteClientCharacteristicConfigurationDescriptorAsync(GattClientCharacteristicConfigurationDescriptorValue.Notify);
            if (status == GattCommunicationStatus.Success)
            {
                characteristic.ValueChanged += (s, args) =>
                {
                    var reader = DataReader.FromBuffer(args.CharacteristicValue);
                    byte[] input = new byte[reader.UnconsumedBufferLength];
                    reader.ReadBytes(input);

                    OnDataReceived?.Invoke(new GattData(characteristic.Service.Uuid.ToString(), characteristic.Uuid.ToString(), input));
                };
                Console.WriteLine($"    [!] Suscrito a notificaciones de: {characteristic.Uuid}");
            }
        }

        public Task SubscribeToNotificationsAsync() => Task.CompletedTask; // Implementado arriba
    }
}
