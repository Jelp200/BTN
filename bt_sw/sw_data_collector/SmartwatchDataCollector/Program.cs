using System;
using System.Linq;
using System.Threading.Tasks;
using Windows.Devices.Bluetooth;
using Windows.Devices.Bluetooth.Advertisement;
using Windows.Devices.Bluetooth.GenericAttributeProfile;
using Windows.Storage.Streams;

class Program
{
    static readonly string TARGET_NAME = "ET570";

    static readonly Guid SERVICE_UUID = Guid.Parse("F0080001-0451-4000-B000-000000000000");
    static readonly Guid WRITE_UUID = Guid.Parse("F0080002-0451-4000-B000-000000000000");
    static readonly Guid NOTIFY_UUID = Guid.Parse("F0080003-0451-4000-B000-000000000000");

    static BluetoothLEAdvertisementWatcher watcher;
    static BluetoothLEDevice device;
    static GattCharacteristic writeChar;

    static async Task Main()
    {
        Console.WriteLine("🔍 Escaneando dispositivos BLE...");

        watcher = new BluetoothLEAdvertisementWatcher
        {
            ScanningMode = BluetoothLEScanningMode.Active
        };

        watcher.Received += Watcher_Received;
        watcher.Start();

        Console.ReadLine(); // Mantiene la app viva
    }

    private static async void Watcher_Received(
        BluetoothLEAdvertisementWatcher sender,
        BluetoothLEAdvertisementReceivedEventArgs args)
    {
        if (string.IsNullOrEmpty(args.Advertisement.LocalName))
            return;

        if (!args.Advertisement.LocalName.Equals(TARGET_NAME))
            return;

        sender.Stop();

        ulong address = args.BluetoothAddress;

        Console.WriteLine($"✅ Encontrado {TARGET_NAME}");
        Console.WriteLine($"📡 MAC: {address:X}");

        device = await BluetoothLEDevice.FromBluetoothAddressAsync(address);

        if (device == null)
        {
            Console.WriteLine("❌ No se pudo conectar");
            return;
        }

        Console.WriteLine($"🔗 Conectado a {device.Name}");

        await SetupGatt();
    }

    static async Task SetupGatt()
    {
        var servicesResult = await device.GetGattServicesAsync();

        var service = servicesResult.Services
            .FirstOrDefault(s => s.Uuid == SERVICE_UUID);

        if (service == null)
        {
            Console.WriteLine("❌ Servicio BLE no encontrado");
            return;
        }

        var charsResult = await service.GetCharacteristicsAsync();

        writeChar = charsResult.Characteristics
            .First(c => c.Uuid == WRITE_UUID);

        var notifyChar = charsResult.Characteristics
            .First(c => c.Uuid == NOTIFY_UUID);

        notifyChar.ValueChanged += NotifyChar_ValueChanged;

        await notifyChar.WriteClientCharacteristicConfigurationDescriptorAsync(
            GattClientCharacteristicConfigurationDescriptorValue.Notify
        );

        Console.WriteLine("📡 NOTIFY habilitado (F0080003)");

        // Loop de escritura
        while (true)
        {
            Console.Write("\nHex a enviar (ej: A1 01 00): ");
            string input = Console.ReadLine();
            if (string.IsNullOrWhiteSpace(input)) continue;

            byte[] data = input.Split(' ')
                               .Select(h => Convert.ToByte(h, 16))
                               .ToArray();

            await WriteCommand(data);
        }
    }

    static async Task WriteCommand(byte[] data)
    {
        var writer = new DataWriter();
        writer.WriteBytes(data);

        await writeChar.WriteValueAsync(
            writer.DetachBuffer(),
            GattWriteOption.WriteWithoutResponse
        );

        Console.WriteLine("➡️ Enviado: " + BitConverter.ToString(data));
    }

    static void NotifyChar_ValueChanged(
        GattCharacteristic sender,
        GattValueChangedEventArgs args)
    {
        var reader = DataReader.FromBuffer(args.CharacteristicValue);
        byte[] data = new byte[reader.UnconsumedBufferLength];
        reader.ReadBytes(data);

        Console.WriteLine("⬅️ NOTIFY: " + BitConverter.ToString(data));
    }
}
