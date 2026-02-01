using Windows.Devices.Bluetooth.Advertisement;
using SmartwatchDataCollector.Core.Entities;
using SmartwatchDataCollector.Core.Interfaces;

namespace SmartwatchDataCollector.Infrastructure.Bluetooth
{
    public class BleScanner : IBleScanner
    {
        private readonly BluetoothLEAdvertisementWatcher _watcher;
        public event Action<WatchDevice>? OnDeviceDiscovered;

        public BleScanner()
        {
            _watcher = new BluetoothLEAdvertisementWatcher
            {
                ScanningMode = BluetoothLEScanningMode.Active
            };

            _watcher.Received += Watcher_Received;
        }

        public void StartScanning() => _watcher.Start();
        public void StopScanning() => _watcher.Stop();

        private void Watcher_Received(BluetoothLEAdvertisementWatcher sender, BluetoothLEAdvertisementReceivedEventArgs args)
        {
            if (!string.IsNullOrEmpty(args.Advertisement.LocalName))
            {
                var device = new WatchDevice(
                    args.Advertisement.LocalName,
                    args.BluetoothAddress.ToString("X"),
                    args.RawSignalStrengthInDBm
                );
                OnDeviceDiscovered?.Invoke(device);
            }
        }
    }
}