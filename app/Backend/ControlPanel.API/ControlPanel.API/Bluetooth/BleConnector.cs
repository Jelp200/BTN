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
    }
}