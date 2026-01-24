using ControlPanel.API.Smartwatch.Bluetooth;
using ControlPanel.API.Smartwatch.Interfaces;
using ControlPanel.API.Smartwatch.Models;

namespace ControlPanel.API.Smartwatch.Services
{
    public class SmartwatchService : ISmartwatchService
    {
        private readonly IBleScanner _scanner;
        private readonly IBleConnector _connector;
        private readonly SemaphoreSlim _mutex = new(1, 1);
        private bool _isConnected = false;

        public SmartwatchService()
        {
            _scanner = new BleScanner();
            _connector = new BleConnector();
        }

        public async Task<SmartwatchConnectionResult> ConnectAsync(string targetName, int scanTimeoutMs, CancellationToken cancellationToken)
        {
            await _mutex.WaitAsync(cancellationToken);
            try
            {
                // Pequeño delay para asegurar que el dispositivo esté listo para advertising
                await Task.Delay(500, cancellationToken);

                var tcsDevice = new TaskCompletionSource<WatchDevice>(TaskCreationOptions.RunContinuationsAsynchronously);
                void Handler(WatchDevice device)
                {
                    if (string.Equals(device.Name, targetName, StringComparison.OrdinalIgnoreCase))
                    {
                        tcsDevice.TrySetResult(device);
                    }
                }

                _scanner.OnDeviceDiscovered += Handler;
                _scanner.StartScanning();

                using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
                linkedCts.CancelAfter(scanTimeoutMs);

                WatchDevice? found = null;
                try
                {
                    found = await tcsDevice.Task.WaitAsync(linkedCts.Token);
                }
                catch (OperationCanceledException)
                {
                    return new SmartwatchConnectionResult(false, "No se encontró el reloj durante el escaneo.");
                }
                finally
                {
                    _scanner.OnDeviceDiscovered -= Handler;
                    _scanner.StopScanning();
                }

                try
                {
                    await _connector.ConnectAsync(found.Address, cancellationToken);
                    _isConnected = true;
                    return new SmartwatchConnectionResult(true, "Reloj conectado", found);
                }
                catch (Exception ex)
                {
                    _isConnected = false;
                    return new SmartwatchConnectionResult(false, $"Error al conectar: {ex.Message}", found);
                }
            }
            finally
            {
                _mutex.Release();
            }
        }

        public async Task<SmartwatchDisconnectResult> DisconnectAsync(CancellationToken cancellationToken)
        {
            await _mutex.WaitAsync(cancellationToken);
            try
            {
                if (!_isConnected)
                {
                    return new SmartwatchDisconnectResult(false, "No hay reloj conectado");
                }

                try
                {
                    // Desconectar del dispositivo BLE
                    await _connector.DisconnectAsync(cancellationToken);
                    
                    // Esperar 2 segundos para que el dispositivo reinicie el modo advertising
                    await Task.Delay(2000, cancellationToken);
                    
                    _isConnected = false;
                    return new SmartwatchDisconnectResult(true, "Reloj desconectado");
                }
                catch (Exception ex)
                {
                    return new SmartwatchDisconnectResult(false, $"Error al desconectar: {ex.Message}");
                }
            }
            finally
            {
                _mutex.Release();
            }
        }
    }
}
