using ControlPanel.API.Smartwatch.Interfaces;
using ControlPanel.API.Smartwatch.Models;
using Windows.Devices.Bluetooth.Advertisement;

namespace ControlPanel.API.Smartwatch.Bluetooth
{
    public class BleScanner : IBleScanner
    {
        private BluetoothLEAdvertisementWatcher? _watcher;
        public event Action<WatchDevice>? OnDeviceDiscovered;

        public void StartScanning()
        {
            // Detener y limpiar el watcher anterior si existe
            StopScanning();

            // Crear un nuevo watcher para cada escaneo
            _watcher = new BluetoothLEAdvertisementWatcher
            {
                ScanningMode = BluetoothLEScanningMode.Active
            };

            _watcher.Received += Watcher_Received;
            _watcher.Start();
        }

        public void StopScanning()
        {
            if (_watcher != null)
            {
                _watcher.Received -= Watcher_Received;
                _watcher.Stop();
                _watcher = null;
            }
        }

        private void Watcher_Received(BluetoothLEAdvertisementWatcher sender, BluetoothLEAdvertisementReceivedEventArgs args)
        {
            if (string.IsNullOrWhiteSpace(args.Advertisement.LocalName)) return;

            var device = new WatchDevice(
                args.Advertisement.LocalName,
                args.BluetoothAddress.ToString("X"),
                args.RawSignalStrengthInDBm
            );

            OnDeviceDiscovered?.Invoke(device);
        }
    }
}
