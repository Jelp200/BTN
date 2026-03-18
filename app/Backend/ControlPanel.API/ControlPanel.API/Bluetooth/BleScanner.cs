/* ***************************************************************************
**  Archivo:   BleScanner.cs
**  Proyecto:  ControlPanel.API (Botonera)
**  Version:   2.0.0
**  Autor(es):
**             Jorge E. Peña Paz
**             Salvador A. Zavala
**  Equipo:    Deprartamento de Computo - Gradus Technologies
**  Fecha:     Enero 2026
**  Descripcion:
**              Clase que implementa el escaneo BLE utilizando las APIs de
**              Windows.
*************************************************************************** */
using ControlPanel.API.Interfaces;
using ControlPanel.API.Models;
using Windows.Devices.Bluetooth.Advertisement;

namespace ControlPanel.API.Bluetooth
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