using System;
using ControlPanel.API.Models;

namespace ControlPanel.API.Services
{
    /// <summary>
    /// Parser for H Band smartwatch proprietary BLE protocol
    /// Heart rate data arrives on UI_READ_UUID (F0030002) with head byte 0xD0
    /// </summary>
    public static class SmartwatchVitalsParser
    {
        // H Band proprietary UUIDs - TRIPLE UUID support
        // 1. F0080002 = Battery Read (authentication responses + BPM data)
        private static readonly string BatteryReadUuid = NormalizeUuid("F0080002-0451-4000-B000-000000000000");
        // 2. F0030002 = UI Read (expected from APK, fallback)
        private static readonly string UiReadUuid = NormalizeUuid("F0030002-0451-4000-B000-000000000000");
        // 3. 0000FEA1 = FEE7 Data (watch sends status here)
        private static readonly string Fee7DataUuid = NormalizeUuid("0000FEA1-0000-1000-8000-00805F9B34FB");
        
        // H Band protocol head bytes (from BleProfile.java)
        private const byte HEAD_RATE_CURRENT_READ = 0xD0;  // -48 in Java = 208 unsigned ← BPM HEAD BYTE
        private const byte HEAD_SPO2_PACKET = 0x80;        // SpO2 data packet header for 0x80-based frames
        private const byte HEAD_SPO2H_ORIGAL = 0xD2;       // Legacy SpO2 head (older parser)
        private const byte HEAD_TEMPTURE_ORIGAL = 0x88;    // -120 in Java = 136 unsigned
        private const byte HEAD_BP = 0x90;                 // -112 in Java = 144 unsigned
        private const byte HEAD_AI_QA_STOP_RECORDING = 0xA1; // -95 in Java = 161 unsigned (SmartWatch AI function)
        private const byte HEAD_PWD_RESPONSE = 0xA7;       // -89 in Java = 167 unsigned (Authentication response)

        public static bool TryParse(GattData data, out SmartwatchVitals update)
        {
            Console.WriteLine($"[PARSER] Intentando parsear datos...");
            update = new SmartwatchVitals(null, null, null, null, null, DateTime.UtcNow);

            if (data.RawValue == null || data.RawValue.Length < 2)
            {
                Console.WriteLine($"[PARSER] ✗ Datos insuficientes: {data.RawValue?.Length ?? 0} bytes");
                return false;
            }

            var characteristic = NormalizeUuid(data.CharacteristicUuid);
            Console.WriteLine($"[PARSER] Characteristic normalizado: {characteristic}");
            Console.WriteLine($"[PARSER] Esperando: {BatteryReadUuid} (F0080002 Battery) o {UiReadUuid} (F0030002 UI) o {Fee7DataUuid} (FEA1)");

            // BPM data can arrive on ANY of these:
            // - F0080002 (Battery Read) - authentication responses + BPM data
            // - F0030002 (UI Read) - expected from decompiled code
            // - 0000FEA1 (FEE7) - watch status/heartbeat
            bool isValidUuid = characteristic.EndsWith(BatteryReadUuid) || 
                              characteristic.EndsWith(UiReadUuid) || 
                              characteristic.EndsWith(Fee7DataUuid);
            if (!isValidUuid)
            {
                Console.WriteLine($"[PARSER] ✗ UUID no reconocido");
                return false;
            }
            
            string uuidName = characteristic.EndsWith(BatteryReadUuid) ? "F0080002 (Battery)" :
                            characteristic.EndsWith(UiReadUuid) ? "F0030002 (UI)" : "FEA1 (FEE7)";
            Console.WriteLine($"[PARSER] ✓ UUID reconocido: {uuidName}");

            // Route by head byte (first byte in array)
            byte headByte = data.RawValue[0];
            Console.WriteLine($"[PARSER] Head byte: 0x{headByte:X2}");

            switch (headByte)
            {
                case HEAD_RATE_CURRENT_READ:
                    Console.WriteLine($"[PARSER] → Detectado head byte BPM (0xD0)");
                    var bpm = ParseHeartRate(data.RawValue);
                    if (bpm.HasValue)
                    {
                        Console.WriteLine($"[PARSER] ✓ BPM parseado: {bpm.Value}");
                        update = update with { PulseBpm = bpm, TimestampUtc = DateTime.UtcNow };
                        return true;
                    }
                    Console.WriteLine($"[PARSER] ✗ ParseHeartRate retornó null");
                    break;

                case HEAD_SPO2_PACKET:
                case HEAD_SPO2H_ORIGAL:
                    Console.WriteLine($"[PARSER] → Detectado head byte SpO2 (0x{headByte:X2})");
                    var spo2 = ParseSpO2(data.RawValue);
                    if (spo2.HasValue)
                    {
                        update = update with { SpO2 = spo2, TimestampUtc = DateTime.UtcNow };
                        return true;
                    }
                    break;

                case HEAD_TEMPTURE_ORIGAL:
                    Console.WriteLine($"[PARSER] → Detectado head byte Temperatura (0x88)");
                    var temp = ParseTemperature(data.RawValue);
                    if (temp.HasValue)
                    {
                        update = update with { TemperatureC = temp, TimestampUtc = DateTime.UtcNow };
                        return true;
                    }
                    break;

                case HEAD_BP:
                    Console.WriteLine($"[PARSER] → Detectado head byte Presión Arterial (0x90)");
                    var (sys, dia) = ParseBloodPressure(data.RawValue);
                    if (sys.HasValue || dia.HasValue)
                    {
                        update = update with { Systolic = sys, Diastolic = dia, TimestampUtc = DateTime.UtcNow };
                        return true;
                    }
                    break;

                case HEAD_AI_QA_STOP_RECORDING:
                    Console.WriteLine($"[PARSER] ℹ Paquete AI Q&A (Stop Recording, 0xA1)");
                    Console.WriteLine($"[PARSER]   Esto es un paquete de control del reloj, no datos de vitales");
                    Console.WriteLine($"[PARSER]   Datos: [{string.Join(", ", data.RawValue.Select(b => $"0x{b:X2}"))}]");
                    Console.WriteLine($"[PARSER]   El reloj finalizó grabación de voz. BPM debería empezar ahora.");
                    // Don't process as vitals - this is a control packet
                    break;
                
                case HEAD_PWD_RESPONSE:
                    Console.WriteLine($"[PARSER] ℹ Respuesta de autenticación (0xA7)");
                    if (data.RawValue.Length >= 4)
                    {
                        byte authStatus = data.RawValue[3];
                        Console.WriteLine($"[PARSER]   byte[3] = 0x{authStatus:X2} {(authStatus == 0x01 ? "✓ AUTH SUCCESS" : authStatus == 0x00 ? "✗ AUTH FAILED" : "? UNKNOWN")}");
                        if (data.RawValue.Length >= 20)
                        {
                            Console.WriteLine($"[PARSER]   Firmware: {data.RawValue[6]}.{data.RawValue[7]}.{data.RawValue[8]}");
                            Console.WriteLine($"[PARSER]   Device settings packet - reloj autenticado y listo");
                        }
                    }
                    Console.WriteLine($"[PARSER]   Datos: [{string.Join(", ", data.RawValue.Select(b => $"0x{b:X2}"))}]");
                    // Don't process as vitals - this is authentication response
                    break;
                    
                default:
                    Console.WriteLine($"[PARSER] ⚠ Head byte desconocido: 0x{headByte:X2}");
                    Console.WriteLine($"[PARSER]   Datos completos: [{string.Join(", ", data.RawValue.Select(b => $"0x{b:X2}"))}]");
                    break;
            }

            return false;
        }

        /// <summary>
        /// Parse H Band heart rate (0xD0 head byte)
        /// Based on HeartDetectNewActivity.java:
        /// - byte2HexToIntArr converts signed bytes to unsigned ints
        /// - intArray[1] = BPM value
        /// - intArray[5] = state (0,2,3 = valid)
        /// - Valid range: 30-200 bpm
        /// </summary>
        private static double? ParseHeartRate(byte[] value)
        {
            Console.WriteLine($"[PARSER] ParseHeartRate: array length = {value.Length}");
            if (value.Length < 2)
            {
                Console.WriteLine($"[PARSER] ✗ Array muy corto para BPM");
                return null;
            }

            // Convert signed bytes to unsigned ints (like Java's byte2HexToIntArr)
            int[] intArray = new int[value.Length];
            for (int i = 0; i < value.Length; i++)
            {
                intArray[i] = value[i] & 0xFF;
            }
            
            Console.WriteLine($"[PARSER] intArray: [{string.Join(", ", intArray)}]");

            int bpm = intArray[1];
            Console.WriteLine($"[PARSER] BPM raw value (intArray[1]): {bpm}");

            // Check state if available (index 5)
            if (intArray.Length >= 6)
            {
                int state = intArray[5];
                Console.WriteLine($"[PARSER] State (intArray[5]): {state}");
                // State must be 0, 2, or 3 for valid reading
                if (state != 0 && state != 2 && state != 3)
                {
                    Console.WriteLine($"[PARSER] ✗ Estado inválido: {state} (debe ser 0, 2 o 3)");
                    return null;
                }
            }

            // Special values 1 and 2 indicate errors (wear errors)
            if (bpm == 1 || bpm == 2)
            {
                Console.WriteLine($"[PARSER] ✗ Valor de error de uso: {bpm}");
                return null;
            }

            // Validate BPM range (30-200 bpm)
            if (bpm < 30 || bpm > 200)
            {
                Console.WriteLine($"[PARSER] ✗ BPM fuera de rango válido (30-200): {bpm}");
                return null;
            }

            Console.WriteLine($"[PARSER] ✓ BPM válido: {bpm}");
            return bpm;
        }

        /// <summary>
        /// Parse H Band SpO2
        /// New packet format (head 0x80):
        /// - byte[1] = spState (estado módulo SpO2)
        /// - byte[2] = watchState (estado reloj)
        /// - byte[3] = value (SpO2 % o código especial)
        /// - byte[4] = checking flag (1 o 2 -> medición en progreso)
        /// - byte[5] = checkingProgress (0-100)
        /// Legacy format (head 0xD2) is still accepted.
        /// </summary>
        private static double? ParseSpO2(byte[] value)
        {
            Console.WriteLine($"[PARSER] ParseSpO2: array length = {value.Length}");
            if (value.Length < 2)
            {
                Console.WriteLine($"[PARSER] ✗ Array muy corto para SpO2");
                return null;
            }

            bool isLegacyFormat = value[0] == HEAD_SPO2H_ORIGAL;
            if (isLegacyFormat)
            {
                // Legacy format based on intArray[1]
                int[] intArray = new int[value.Length];
                for (int i = 0; i < value.Length; i++)
                {
                    intArray[i] = value[i] & 0xFF;
                }
                
                Console.WriteLine($"[PARSER] intArray: [{string.Join(", ", intArray)}]");

                int spO2Legacy = intArray[1];
                Console.WriteLine($"[PARSER] SpO2 legacy raw value (intArray[1]): {spO2Legacy}%");

                // Check state if available (index 5) - same as BPM
                if (intArray.Length >= 6)
                {
                    int state = intArray[5];
                    Console.WriteLine($"[PARSER] State (intArray[5]): {state}");
                    if (state != 0 && state != 2 && state != 3)
                    {
                        Console.WriteLine($"[PARSER] ✗ Estado inválido: {state} (debe ser 0, 2 o 3)");
                        return null;
                    }
                }

                if (spO2Legacy < 70 || spO2Legacy > 100)
                {
                    Console.WriteLine($"[PARSER] ✗ SpO2 fuera de rango válido (70-100): {spO2Legacy}%");
                    return null;
                }

                Console.WriteLine($"[PARSER] ✓ SpO2 válido (legacy): {spO2Legacy}%");
                return spO2Legacy;
            }

            if (value.Length < 6)
            {
                Console.WriteLine($"[PARSER] ✗ Array muy corto para trama SpO2 0x80 (mínimo 6 bytes)");
                return null;
            }

            int spState = value[1] & 0xFF;
            int watchState = value[2] & 0xFF;
            int spO2 = value[3] & 0xFF;
            int checkingFlag = value[4] & 0xFF;
            int checkingProgress = value[5] & 0xFF;

            Console.WriteLine($"[PARSER] spState: {spState}, watchState: {watchState}");
            Console.WriteLine($"[PARSER] checkingFlag: {checkingFlag}, progress: {checkingProgress}%");
            Console.WriteLine($"[PARSER] SpO2 raw value (byte[3]): {spO2}%");

            if (checkingFlag == 1 || checkingFlag == 2)
            {
                Console.WriteLine($"[PARSER] ⏳ Medición en progreso ({checkingProgress}%)");
                return null;
            }

            if (spO2 < 70 || spO2 > 100)
            {
                Console.WriteLine($"[PARSER] ✗ SpO2 fuera de rango válido (70-100): {spO2}%");
                return null;
            }

            Console.WriteLine($"[PARSER] ✓ SpO2 válido: {spO2}%");
            return spO2;
        }

        /// <summary>
        /// Parse H Band temperature (0x88 head byte)
        /// Protocol TBD - placeholder
        /// </summary>
        private static double? ParseTemperature(byte[] value)
        {
            if (value.Length < 2)
                return null;

            int[] intArray = new int[value.Length];
            for (int i = 0; i < value.Length; i++)
            {
                intArray[i] = value[i] & 0xFF;
            }

            double temperatureC = intArray[1];

            // Validate range (human body: 30-45°C)
            if (temperatureC < 30 || temperatureC > 45)
                return null;

            return temperatureC;
        }

        /// <summary>
        /// Parse H Band blood pressure (0x90 head byte)
        /// Protocol TBD - placeholder
        /// </summary>
        private static (double? Systolic, double? Diastolic) ParseBloodPressure(byte[] value)
        {
            if (value.Length < 3)
                return (null, null);

            int[] intArray = new int[value.Length];
            for (int i = 0; i < value.Length; i++)
            {
                intArray[i] = value[i] & 0xFF;
            }

            double systolic = intArray[1];
            double diastolic = intArray[2];

            // Validate range (typical: 80-200 systolic, 50-120 diastolic)
            if (systolic < 80 || systolic > 200 || diastolic < 50 || diastolic > 120)
                return (null, null);

            return (systolic, diastolic);
        }

        private static string NormalizeUuid(string uuid)
        {
            return uuid.Replace("-", string.Empty).ToLowerInvariant();
        }
    }
}