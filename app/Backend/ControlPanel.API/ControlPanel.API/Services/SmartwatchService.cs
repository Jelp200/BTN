using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using ControlPanel.API.Bluetooth;
using ControlPanel.API.Interfaces;
using ControlPanel.API.Models;

namespace ControlPanel.API.Services
{
    public class SmartwatchService : ISmartwatchService
    {
        private readonly IBleScanner _scanner;
        private readonly IBleConnector _connector;
        private readonly SessionLogger _sessionLogger;
        private readonly SemaphoreSlim _mutex = new(1, 1);
        private bool _isConnected = false;
        private readonly object _vitalsLock = new();
        private SmartwatchVitals? _latestVitals;
        private readonly List<SmartwatchVitals> _history = new();
        
        // BPM measurement control - 10 measurements over 1 minute
        private int _bpmMeasurementCount = 0;
        private DateTime _lastBpmMeasurementTime = DateTime.MinValue;
        private bool _bpmMonitoringActive = false;
        private const int MAX_BPM_MEASUREMENTS = 10;
        private const int BPM_MEASUREMENT_INTERVAL_MS = 6000; // 60s / 10 = 6s between measurements
    
        // SpO2 measurement control - 10 measurements over 1 minute
        private int _spo2MeasurementCount = 0;
        private DateTime _lastSpo2MeasurementTime = DateTime.MinValue;
        private bool _spo2MonitoringActive = false;
        private const int MAX_SPO2_MEASUREMENTS = 10;
        private const int SPO2_MEASUREMENT_INTERVAL_MS = 6000; // 60s / 10 = 6s between measurements

        public SmartwatchService(IBleScanner scanner, IBleConnector connector, SessionLogger sessionLogger)
        {
            _scanner = scanner;
            _connector = connector;
            _sessionLogger = sessionLogger;
            _connector.OnDataReceived += HandleGattData;
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
                    // Start session logging
                    _sessionLogger.StartRecording();
                    
                    await _connector.ConnectAsync(found.Address, cancellationToken);
                    _isConnected = true;
                    
                    // First, explore and log all available services to debug protocol issues
                    await _connector.ExploreAndLogAllServices(cancellationToken);
                    
                    // Start H Band BPM monitoring
                    // Command: {0xD0, 0x01} to F0030003-... UUID (UI service, not Battery)
                    await StartHeartRateMonitoringAsync(cancellationToken);
                    
                    return new SmartwatchConnectionResult(true, "Reloj conectado", found);
                }
                catch (Exception ex)
                {
                    _isConnected = false;
                    _sessionLogger.StopRecording(); // Stop logging on error
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
                    
                    // Stop session logging and save file
                    var logFile = _sessionLogger.StopRecording();
                    if (logFile != null)
                    {
                        Console.WriteLine($"\n💾 Log de sesión guardado en: {logFile}\n");
                    }
                    
                    // Esperar 2 segundos para que el dispositivo reinicie el modo advertising
                    await Task.Delay(2000, cancellationToken);
                    
                    _isConnected = false;
                    return new SmartwatchDisconnectResult(true, "Reloj desconectado");
                }
                catch (Exception ex)
                {
                    _sessionLogger.StopRecording(); // Ensure logging stops even on error
                    return new SmartwatchDisconnectResult(false, $"Error al desconectar: {ex.Message}");
                }
            }
            finally
            {
                _mutex.Release();
            }
        }

        public SmartwatchVitals? GetLatestVitals()
        {
            lock (_vitalsLock)
            {
                return _latestVitals;
            }
        }

        public IReadOnlyList<SmartwatchVitals> GetRecentVitals(int maxCount)
        {
            lock (_vitalsLock)
            {
                if (maxCount <= 0) return Array.Empty<SmartwatchVitals>();
                var skip = Math.Max(0, _history.Count - maxCount);
                return _history.Skip(skip).ToArray();
            }
        }

        private void HandleGattData(GattData data)
        {
            var receivedTime = DateTime.UtcNow;
            Console.WriteLine($"[SMARTWATCH] → Datos recibidos del reloj [{receivedTime:HH:mm:ss.fff}]");
            Console.WriteLine($"[SMARTWATCH]   Service: {data.ServiceUuid}");
            Console.WriteLine($"[SMARTWATCH]   Characteristic: {data.CharacteristicUuid}");
            Console.WriteLine($"[SMARTWATCH]   Bytes recibidos ({data.RawValue.Length}): [{string.Join(", ", data.RawValue.Select(b => $"0x{b:X2}"))}]");
            Console.WriteLine($"[SMARTWATCH]   Head byte: 0x{data.RawValue[0]:X2}");
            
            if (!_isConnected)
            {
                Console.WriteLine("[SMARTWATCH] ⚠ Ignorando datos: reloj no marcado como conectado");
                return;
            }

            if (!SmartwatchVitalsParser.TryParse(data, out var update))
            {
                Console.WriteLine("[SMARTWATCH] ⚠ El parser no pudo procesar estos datos");
                return;
            }
            
            Console.WriteLine($"[SMARTWATCH] ✓ Datos parseados correctamente!");
            
            // Control de medición BPM
            if (update.PulseBpm.HasValue)
            {
                Console.WriteLine($"[SMARTWATCH]   BPM: {update.PulseBpm.Value}");
                
                if (_bpmMonitoringActive && update.PulseBpm.Value > 0)
                {
                    var timeSinceLastMeasurement = (DateTime.UtcNow - _lastBpmMeasurementTime).TotalMilliseconds;
                    
                    if (timeSinceLastMeasurement >= BPM_MEASUREMENT_INTERVAL_MS || _bpmMeasurementCount == 0)
                    {
                        _bpmMeasurementCount++;
                        _lastBpmMeasurementTime = DateTime.UtcNow;
                        
                        Console.WriteLine($"[SMARTWATCH] 📊 Medición BPM {_bpmMeasurementCount}/{MAX_BPM_MEASUREMENTS} registrada");
                        Console.WriteLine($"[SMARTWATCH]    Valor: {update.PulseBpm.Value} bpm");
                        Console.WriteLine($"[SMARTWATCH]    Tiempo desde última: {timeSinceLastMeasurement:F0}ms");
                        
                        if (_bpmMeasurementCount >= MAX_BPM_MEASUREMENTS)
                        {
                            Console.WriteLine($"[SMARTWATCH] ✓✓✓ Completadas {MAX_BPM_MEASUREMENTS} mediciones BPM en ~60s");
                            Console.WriteLine($"[SMARTWATCH] Deteniendo monitoreo BPM para permitir otras mediciones...");
                            
                            _ = Task.Run(async () =>
                            {
                                try
                                {
                                    await StopBpmMonitoringAsync(CancellationToken.None);
                                }
                                catch (Exception ex)
                                {
                                    Console.WriteLine($"[SMARTWATCH] ⚠ Error deteniendo BPM: {ex.Message}");
                                }
                            });
                        }
                        else
                        {
                            var remaining = MAX_BPM_MEASUREMENTS - _bpmMeasurementCount;
                            var estimatedTimeRemaining = remaining * (BPM_MEASUREMENT_INTERVAL_MS / 1000);
                            Console.WriteLine($"[SMARTWATCH]    Faltan {remaining} mediciones (~{estimatedTimeRemaining}s)");
                        }
                    }
                    else
                    {
                        Console.WriteLine($"[SMARTWATCH] ⏳ BPM recibido pero esperando intervalo (faltan {BPM_MEASUREMENT_INTERVAL_MS - timeSinceLastMeasurement:F0}ms)");
                    }
                }
            }
            
            // Control de medición SpO2
            if (update.SpO2.HasValue)
            {
                Console.WriteLine($"[SMARTWATCH]   SpO2: {update.SpO2.Value}%");
                
                if (_spo2MonitoringActive && update.SpO2.Value > 0)
                {
                    var timeSinceLastMeasurement = (DateTime.UtcNow - _lastSpo2MeasurementTime).TotalMilliseconds;
                    
                    if (timeSinceLastMeasurement >= SPO2_MEASUREMENT_INTERVAL_MS || _spo2MeasurementCount == 0)
                    {
                        _spo2MeasurementCount++;
                        _lastSpo2MeasurementTime = DateTime.UtcNow;
                        
                        Console.WriteLine($"[SMARTWATCH] 📊 Medición SpO2 {_spo2MeasurementCount}/{MAX_SPO2_MEASUREMENTS} registrada");
                        Console.WriteLine($"[SMARTWATCH]    Valor: {update.SpO2.Value}%");
                        Console.WriteLine($"[SMARTWATCH]    Tiempo desde última: {timeSinceLastMeasurement:F0}ms");
                        
                        if (_spo2MeasurementCount >= MAX_SPO2_MEASUREMENTS)
                        {
                            Console.WriteLine($"[SMARTWATCH] ✓✓✓ Completadas {MAX_SPO2_MEASUREMENTS} mediciones SpO2 en ~60s");
                            Console.WriteLine($"[SMARTWATCH] Deteniendo monitoreo SpO2 para permitir otras mediciones...");
                            
                            _ = Task.Run(async () =>
                            {
                                try
                                {
                                    await StopSpo2MonitoringAsync(CancellationToken.None);
                                }
                                catch (Exception ex)
                                {
                                    Console.WriteLine($"[SMARTWATCH] ⚠ Error deteniendo SpO2: {ex.Message}");
                                }
                            });
                        }
                        else
                        {
                            var remaining = MAX_SPO2_MEASUREMENTS - _spo2MeasurementCount;
                            var estimatedTimeRemaining = remaining * (SPO2_MEASUREMENT_INTERVAL_MS / 1000);
                            Console.WriteLine($"[SMARTWATCH]    Faltan {remaining} mediciones (~{estimatedTimeRemaining}s)");
                        }
                    }
                    else
                    {
                        Console.WriteLine($"[SMARTWATCH] ⏳ SpO2 recibido pero esperando intervalo (faltan {SPO2_MEASUREMENT_INTERVAL_MS - timeSinceLastMeasurement:F0}ms)");
                    }
                }
            }
            if (update.SpO2.HasValue)
                Console.WriteLine($"[SMARTWATCH]   SpO2: {update.SpO2.Value}%");
            if (update.TemperatureC.HasValue)
                Console.WriteLine($"[SMARTWATCH]   Temp: {update.TemperatureC.Value}°C");

            lock (_vitalsLock)
            {
                var merged = _latestVitals == null
                    ? update
                    : _latestVitals with
                    {
                        PulseBpm = update.PulseBpm ?? _latestVitals.PulseBpm,
                        SpO2 = update.SpO2 ?? _latestVitals.SpO2,
                        TemperatureC = update.TemperatureC ?? _latestVitals.TemperatureC,
                        Systolic = update.Systolic ?? _latestVitals.Systolic,
                        Diastolic = update.Diastolic ?? _latestVitals.Diastolic,
                        TimestampUtc = update.TimestampUtc
                    };

                _latestVitals = merged;
                _history.Add(merged);

                if (_history.Count > 300)
                {
                    _history.RemoveRange(0, _history.Count - 300);
                }
            }
        }

        /// <summary>
        /// Send H Band authentication and then start real-time heart rate monitoring
        /// CRITICAL: Must authenticate with password BEFORE sending 0xD0 command
        /// 1. Send authentication: [0xA1, 0x00, 0x00, 0x00, timestamp+flags...]
        /// 2. Wait for response: byte[3] == 0x01 means success
        /// 3. Then send BPM command: [0xD0, 0x01]
        /// Based on PwdHandler.java + HeartHandler.java from H Band APK
        /// </summary>
        private async Task StartHeartRateMonitoringAsync(CancellationToken cancellationToken)
        {
            var startTime = DateTime.UtcNow;
            Console.WriteLine("═══════════════════════════════════════════════════════════════════");
            Console.WriteLine("[SMARTWATCH] ===== Iniciando autenticación y monitoreo BPM H Band =====");
            Console.WriteLine($"[SMARTWATCH] Timestamp: {startTime:yyyy-MM-dd HH:mm:ss.fff}");
            Console.WriteLine("═══════════════════════════════════════════════════════════════════");
            
            // H Band Battery Service UUIDs (correct ones)
            var batteryServiceUuid = new Guid("F0080001-0451-4000-B000-000000000000");
            var batteryReadUuid = new Guid("F0080002-0451-4000-B000-000000000000");      // Responses here
            var batteryConfigUuid = new Guid("F0080003-0451-4000-B000-000000000000");    // Commands here
            
            // Keep FEE7/UI services for monitoring
            var fee7ServiceUuid = new Guid("0000FEE7-0000-1000-8000-00805F9B34FB");
            var fea1NotifyUuid = new Guid("0000FEA1-0000-1000-8000-00805F9B34FB");
            var f003ServiceUuid = new Guid("F0030001-0451-4000-B000-000000000000");
            var f003NotifyUuid = new Guid("F0030002-0451-4000-B000-000000000000");
            
            Console.WriteLine($"[SMARTWATCH] ✓ CORRECCIÓN CRÍTICA: Usando Battery Service (F008) para autenticación");
            Console.WriteLine($"[SMARTWATCH] Service UUID: {batteryServiceUuid}");
            Console.WriteLine($"[SMARTWATCH]   Read (respuestas): {batteryReadUuid}");
            Console.WriteLine($"[SMARTWATCH]   Config (comandos): {batteryConfigUuid}");
            
            try
            {
                // PASO 1: Suscribirse a notificaciones de autenticación y datos
                Console.WriteLine($"[SMARTWATCH] Paso 1A: Suscribiendo a BATTERY_READ (F0080002) para respuestas...");
                await _connector.SubscribeToNotificationsAsync(batteryServiceUuid, batteryReadUuid, cancellationToken);
                Console.WriteLine("[SMARTWATCH] ✓ Suscripción a F0080002 exitosa!");
                
                // Also subscribe to FEE7/F003 for data monitoring
                Console.WriteLine($"[SMARTWATCH] Paso 1B: Suscribiendo a FEA1 (FEE7) y F0030002 para datos...");
                await _connector.SubscribeToNotificationsAsync(fee7ServiceUuid, fea1NotifyUuid, cancellationToken);
                await _connector.SubscribeToNotificationsAsync(f003ServiceUuid, f003NotifyUuid, cancellationToken);
                Console.WriteLine("[SMARTWATCH] ✓ Suscripciones de datos exitosas!");
                
                await Task.Delay(200, cancellationToken);
                
                // PASO 2: Generar y enviar comando de autenticación
                Console.WriteLine($"[SMARTWATCH] Paso 2: Generando comando de autenticación (password='0000')...");
                byte[] authCmd = GenerateAuthenticationCommand();
                Console.WriteLine($"[SMARTWATCH]   Comando: [{string.Join(", ", authCmd.Select(b => $"0x{b:X2}"))}]");
                Console.WriteLine($"[SMARTWATCH]   Enviando a BATTERY_CONFIG (F0080003)...");
                
                await _connector.WriteAsync(batteryServiceUuid, batteryConfigUuid, authCmd, cancellationToken);
                Console.WriteLine("[SMARTWATCH] ✓ Comando de autenticación enviado!");
                
                // PASO 3: Enviar comando de BPM
                Console.WriteLine($"[SMARTWATCH] Paso 3: Enviando comando START BPM {{0xD0, 0x01}}...");
                byte[] bpmCmd = { 0xD0, 0x01 };
                await _connector.WriteAsync(batteryServiceUuid, batteryConfigUuid, bpmCmd, cancellationToken);
                Console.WriteLine("[SMARTWATCH] ✓ Comando BPM enviado a BATTERY_CONFIG!");
                Console.WriteLine("[SMARTWATCH] ✓✓✓ Autenticación + BPM iniciados! Esperando datos del reloj...");
                Console.WriteLine("[SMARTWATCH] Ahora deberías ver paquetes con head byte 0xD0 contiendo BPM");
                
                // Initialize BPM measurement state
                _bpmMonitoringActive = true;
                _bpmMeasurementCount = 0;
                _lastBpmMeasurementTime = DateTime.UtcNow;
                Console.WriteLine($"[SMARTWATCH] 📊 Control de medición BPM activado: {MAX_BPM_MEASUREMENTS} mediciones en ~60s");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SMARTWATCH] ✗ ERROR en inicialización: {ex.Message}");
                Console.WriteLine($"[SMARTWATCH] Stack trace: {ex.StackTrace}");
            }
        }
        
        /// <summary>
        /// Start BPM (heart rate) monitoring by sending {0xD0, 0x01} to F0080003
        /// NOTE: Watch must be authenticated first (done during ConnectAsync)
        /// Based on HEAD_RATE_CURRENT_READ = 0xD0 from H Band protocol
        /// </summary>
        public async Task<bool> StartBpmMonitoringAsync(CancellationToken cancellationToken)
        {
            Console.WriteLine("═══════════════════════════════════════════════════════════════════");
            Console.WriteLine("[SMARTWATCH] ❤️ Iniciando monitoreo BPM (pulso cardiaco)...");
            Console.WriteLine("═══════════════════════════════════════════════════════════════════");
            
            if (!_isConnected)
            {
                Console.WriteLine("[SMARTWATCH] ✗ No hay reloj conectado");
                return false;
            }
            
            var batteryServiceUuid = new Guid("F0080001-0451-4000-B000-000000000000");
            var batteryConfigUuid = new Guid("F0080003-0451-4000-B000-000000000000");
            
            try
            {
                // Send START BPM command: {0xD0, 0x01}
                byte[] bpmStartCommand = { 0xD0, 0x01 };
                
                Console.WriteLine($"[SMARTWATCH] Enviando comando START BPM: [0xD0, 0x01]");
                Console.WriteLine($"[SMARTWATCH]   Service: {batteryServiceUuid}");
                Console.WriteLine($"[SMARTWATCH]   Characteristic: {batteryConfigUuid}");
                
                await _connector.WriteAsync(batteryServiceUuid, batteryConfigUuid, bpmStartCommand, cancellationToken);
                
                // Initialize BPM measurement state
                _bpmMonitoringActive = true;
                _bpmMeasurementCount = 0;
                _lastBpmMeasurementTime = DateTime.UtcNow;
                
                Console.WriteLine($"[SMARTWATCH] ✓ Comando START BPM enviado correctamente");
                Console.WriteLine($"[SMARTWATCH] 📊 Control de medición BPM activado: {MAX_BPM_MEASUREMENTS} mediciones en ~60s");
                Console.WriteLine($"[SMARTWATCH] Esperando datos de pulso cardiaco del reloj...");
                Console.WriteLine("═══════════════════════════════════════════════════════════════════");
                
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SMARTWATCH] ✗ Error al iniciar monitoreo BPM: {ex.Message}");
                Console.WriteLine($"[SMARTWATCH]   {ex.GetType().Name}");
                Console.WriteLine("═══════════════════════════════════════════════════════════════════");
                return false;
            }
        }
        
        /// <summary>
        /// Stop BPM monitoring by sending {0xD0, 0x00} to F0080003
        /// </summary>
        private async Task StopBpmMonitoringAsync(CancellationToken cancellationToken)
        {
            Console.WriteLine("═══════════════════════════════════════════════════════════════════");
            Console.WriteLine("[SMARTWATCH] 🛑 Deteniendo monitoreo BPM...");
            Console.WriteLine("═══════════════════════════════════════════════════════════════════");
            
            var batteryServiceUuid = new Guid("F0080001-0451-4000-B000-000000000000");
            var batteryConfigUuid = new Guid("F0080003-0451-4000-B000-000000000000");
            
            try
            {
                // Send STOP BPM command: {0xD0, 0x00}
                byte[] stopBpmCommand = { 0xD0, 0x00 };
                
                Console.WriteLine($"[SMARTWATCH] Enviando comando STOP BPM: [0xD0, 0x00]");
                Console.WriteLine($"[SMARTWATCH]   Service: {batteryServiceUuid}");
                Console.WriteLine($"[SMARTWATCH]   Characteristic: {batteryConfigUuid}");
                
                await _connector.WriteAsync(batteryServiceUuid, batteryConfigUuid, stopBpmCommand, cancellationToken);
                
                Console.WriteLine($"[SMARTWATCH] ✓ Comando STOP BPM enviado correctamente");
                Console.WriteLine($"[SMARTWATCH] El reloj ahora está disponible para medir otros signos vitales");
                
                // Reset measurement state
                _bpmMonitoringActive = false;
                _bpmMeasurementCount = 0;
                _lastBpmMeasurementTime = DateTime.MinValue;
                
                Console.WriteLine($"[SMARTWATCH] ✓ Estado de medición BPM reseteado");
                Console.WriteLine("═══════════════════════════════════════════════════════════════════");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SMARTWATCH] ✗ Error al detener monitoreo BPM: {ex.Message}");
                Console.WriteLine($"[SMARTWATCH]   {ex.GetType().Name}");
                Console.WriteLine("═══════════════════════════════════════════════════════════════════");
                throw;
            }
        }
        
        /// <summary>
        /// Start SpO2 (blood oxygen) monitoring by sending {0xD2, 0x01} to F0080003
        /// Based on HEAD_SPO2H_ORIGAL = 0xD2 from H Band protocol
        /// </summary>
        public async Task<bool> StartSpO2MonitoringAsync(CancellationToken cancellationToken)
        {
            Console.WriteLine("═══════════════════════════════════════════════════════════════════");
            Console.WriteLine("[SMARTWATCH] 🫁 Iniciando monitoreo SpO2 (oxigenación)...");
            Console.WriteLine("═══════════════════════════════════════════════════════════════════");
            
            if (!_isConnected)
            {
                Console.WriteLine("[SMARTWATCH] ✗ No hay reloj conectado");
                return false;
            }
            
            var batteryServiceUuid = new Guid("F0080001-0451-4000-B000-000000000000");
            var batteryConfigUuid = new Guid("F0080003-0451-4000-B000-000000000000");
            
            try
            {
                // Send START SpO2 command: {0x80, 0x01}
                byte[] spo2StartCommand = { 0x80, 0x01 };
                
                Console.WriteLine($"[SMARTWATCH] Enviando comando START SpO2: [0x80, 0x01]");
                Console.WriteLine($"[SMARTWATCH]   Service: {batteryServiceUuid}");
                Console.WriteLine($"[SMARTWATCH]   Characteristic: {batteryConfigUuid}");
                
                await _connector.WriteAsync(batteryServiceUuid, batteryConfigUuid, spo2StartCommand, cancellationToken);
                
                // Initialize SpO2 measurement state
                _spo2MonitoringActive = true;
                _spo2MeasurementCount = 0;
                _lastSpo2MeasurementTime = DateTime.UtcNow;
                
                Console.WriteLine($"[SMARTWATCH] ✓ Comando START SpO2 enviado correctamente");
                Console.WriteLine($"[SMARTWATCH] 📊 Control de medición SpO2 activado: {MAX_SPO2_MEASUREMENTS} mediciones en ~60s");
                Console.WriteLine($"[SMARTWATCH] Esperando datos de oxigenación del reloj...");
                Console.WriteLine("═══════════════════════════════════════════════════════════════════");
                
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SMARTWATCH] ✗ Error al iniciar monitoreo SpO2: {ex.Message}");
                Console.WriteLine($"[SMARTWATCH]   {ex.GetType().Name}");
                Console.WriteLine("═══════════════════════════════════════════════════════════════════");
                return false;
            }
        }
        
        /// <summary>
        /// Stop SpO2 monitoring by sending {0xD2, 0x00} to F0080003
        /// </summary>
        private async Task StopSpo2MonitoringAsync(CancellationToken cancellationToken)
        {
            Console.WriteLine("═══════════════════════════════════════════════════════════════════");
            Console.WriteLine("[SMARTWATCH] 🛑 Deteniendo monitoreo SpO2...");
            Console.WriteLine("═══════════════════════════════════════════════════════════════════");
            
            var batteryServiceUuid = new Guid("F0080001-0451-4000-B000-000000000000");
            var batteryConfigUuid = new Guid("F0080003-0451-4000-B000-000000000000");
            
            try
            {
                // Send STOP SpO2 command: {0xD2, 0x00}
                byte[] stopSpo2Command = { 0x80, 0x02 };
                
                Console.WriteLine($"[SMARTWATCH] Enviando comando STOP SpO2: [0x80, 0x02]");
                Console.WriteLine($"[SMARTWATCH]   Service: {batteryServiceUuid}");
                Console.WriteLine($"[SMARTWATCH]   Characteristic: {batteryConfigUuid}");
                
                await _connector.WriteAsync(batteryServiceUuid, batteryConfigUuid, stopSpo2Command, cancellationToken);
                
                Console.WriteLine($"[SMARTWATCH] ✓ Comando STOP SpO2 enviado correctamente");
                Console.WriteLine($"[SMARTWATCH] El reloj ahora está disponible para medir otros signos vitales");
                
                // Reset measurement state
                _spo2MonitoringActive = false;
                _spo2MeasurementCount = 0;
                _lastSpo2MeasurementTime = DateTime.MinValue;
                
                Console.WriteLine($"[SMARTWATCH] ✓ Estado de medición SpO2 reseteado");
                Console.WriteLine("═══════════════════════════════════════════════════════════════════");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SMARTWATCH] ✗ Error al detener monitoreo SpO2: {ex.Message}");
                Console.WriteLine($"[SMARTWATCH]   {ex.GetType().Name}");
                Console.WriteLine("═══════════════════════════════════════════════════════════════════");
                throw;
            }
        }
        
        /// <summary>
        /// Generate authentication command for H Band password "0000"
        /// Format: [0xA1, pwd_low, pwd_high, 0x00, timestamp_7bytes, 0x01, 0x01, tz_offset, manual_flag, padding_5bytes]
        /// Based on PwdHandler.getPwdCmd() from H Band APK
        /// </summary>
        private byte[] GenerateAuthenticationCommand()
        {
            byte[] cmd = new byte[20];
            
            // Header: 0xA1 = HEAD_PWD
            cmd[0] = 0xA1;
            
            // Password bytes (0000 = 0x0000)
            cmd[1] = 0x00;  // Password low byte
            cmd[2] = 0x00;  // Password high byte
            cmd[3] = 0x00;  // Command type = authenticate
            
            // Timestamp (7 bytes: YY, MM, DD, HH, mm, ss)
            var now = DateTime.Now;
            cmd[4] = (byte)((now.Year >> 8) & 0xFF); // Año MSB
            cmd[5] = (byte)(now.Year & 0xFF);        // Año LSB     // Year (2-digit)
            cmd[6] = (byte)(now.Month);
            cmd[7] = (byte)(now.Day);
            cmd[8] = (byte)(now.Hour);
            cmd[9] = (byte)(now.Minute);
            cmd[10] = (byte)(now.Second);
            cmd[11] = 0x00;  // Bandera con este valor en primer ingreso de pswd (24-hour format?)
            
            // Flags
            cmd[12] = 0x01;  // Fixed flag 
            cmd[13] = 0xE8;  // Timezone offset (CDMX CONST)
            cmd[14] = 0x00;  // Bandera con este valor en primer ingreso de pswd (Manual connect flag?) 
            
            // Padding
            cmd[15] = 0x00;
            cmd[16] = 0x00;
            cmd[17] = 0x00;
            cmd[18] = 0x00;
            cmd[19] = 0x00;
            
            Console.WriteLine($"[SMARTWATCH] [AUTH-GEN] Comando con timestamp: {now:yyyy-MM-dd HH:mm:ss}");
            
            return cmd;
        }
    }
}