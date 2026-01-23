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
        private GattSession? _gattSession; // Mantenemos la sesión activa
        public event Action<GattData>? OnDataReceived;

        public async Task ConnectAsync(string macAddress)
        {
            ulong address = Convert.ToUInt64(macAddress, 16);

            Console.WriteLine($"Conectando a {macAddress}...");
            _device = await BluetoothLEDevice.FromBluetoothAddressAsync(address);

            if (_device == null) throw new Exception("No se pudo establecer conexión.");

            // ============================================================
            // CONFIGURACIÓN DE MTU Y SESIÓN
            // ============================================================
            _gattSession = await GattSession.FromDeviceIdAsync(_device.BluetoothDeviceId);

            if (_gattSession != null)
            {
                // Mantener la conexión activa aunque no haya tráfico
                _gattSession.MaintainConnection = true;

                // Suscribirse al evento de cambio de MTU para confirmar
                _gattSession.MaxPduSizeChanged += (s, args) =>
                {
                    Console.WriteLine($"[INFO] MTU actualizado por el sistema a: {s.MaxPduSize} bytes");
                };

                // En Windows, no podemos "forzar" un número exacto como en Android,
                // pero al llamar a este método, Windows negocia el máximo posible (hasta 517).
                // Como tu reloj soporta 247, Windows aceptará ese valor automáticamente.
                Console.WriteLine("Negociando MTU con el dispositivo...");
            }
            // ============================================================

            Console.WriteLine("Conexión exitosa. Explorando servicios...");

            var servicesResult = await _device.GetGattServicesAsync(BluetoothCacheMode.Uncached);

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

                    // Usamos WriteWithoutResponse si la característica lo requiere (como vimos en tus logs para ae01)
                    var writeOption = character.CharacteristicProperties.HasFlag(GattCharacteristicProperties.WriteWithoutResponse)
                                      ? GattWriteOption.WriteWithoutResponse
                                      : GattWriteOption.WriteWithResponse;

                    await character.WriteValueAsync(writer.DetachBuffer(), writeOption);
                    Console.WriteLine($"[TX] Enviado a {charUuid}: {BitConverter.ToString(data)}");
                }
            }
        }

        private async Task ExploreCharacteristics(GattDeviceService service)
        {
            var charResult = await service.GetCharacteristicsAsync(BluetoothCacheMode.Uncached);
            if (charResult.Status == GattCommunicationStatus.Success)
            {
                foreach (var character in charResult.Characteristics)
                {
                    Console.WriteLine($"  - Característica: {character.Uuid} | Propiedades: {character.CharacteristicProperties}");

                    if (character.CharacteristicProperties.HasFlag(GattCharacteristicProperties.Notify))
                    {
                        await SubscribeToCharacteristic(character);
                    }
                }
            }
        }

        private async Task SubscribeToCharacteristic(GattCharacteristic characteristic)
        {
            try
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
                    Console.WriteLine($"    [!] Suscrito a: {characteristic.Uuid}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"    [ERROR] No se pudo suscribir a {characteristic.Uuid}: {ex.Message}");
            }
        }

        public Task SubscribeToNotificationsAsync() => Task.CompletedTask;
    }
}
