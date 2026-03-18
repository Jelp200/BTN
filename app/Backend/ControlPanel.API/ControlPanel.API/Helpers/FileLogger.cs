/* ***************************************************************************
**  Archivo:   FileLogger.cs
**  Proyecto:  ControlPanel.API (Botonera)
**  Version:   2.0.0
**  Autor(es):
**             Jorge E. Peña Paz
**  Equipo:    Deprartamento de Computo - Gradus Technologies
**  Fecha:     Febrero 2026
**  Descripcion:
**              Helper para escribir logs tanto a consola como a archivo
**              para facilitar diagnóstico en producción.
*************************************************************************** */
using System;
using System.IO;

namespace ControlPanel.API.Helpers
{
    public static class FileLogger
    {
        private static readonly object _lock = new object();
        private static string? _logFilePath;

        static FileLogger()
        {
            try
            {
                // Crear carpeta de logs en el directorio de la aplicación
                var appDirectory = AppDomain.CurrentDomain.BaseDirectory;
                var logsDirectory = Path.Combine(appDirectory, "Logs");
                
                if (!Directory.Exists(logsDirectory))
                {
                    Directory.CreateDirectory(logsDirectory);
                }

                // Archivo de log con timestamp
                var timestamp = DateTime.Now.ToString("yyyy-MM-dd_HH-mm-ss");
                _logFilePath = Path.Combine(logsDirectory, $"smartwatch-{timestamp}.log");

                // Escribir header
                File.WriteAllText(_logFilePath, $"=== SMARTWATCH LOG - {DateTime.Now:yyyy-MM-dd HH:mm:ss} ===\n\n");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[FileLogger] Error al inicializar: {ex.Message}");
                _logFilePath = null;
            }
        }

        public static void Log(string message)
        {
            var timestamp = DateTime.Now.ToString("HH:mm:ss.fff");
            var logMessage = $"[{timestamp}] {message}";

            // Escribir a consola
            Console.WriteLine(logMessage);

            // Escribir a archivo
            if (_logFilePath != null)
            {
                lock (_lock)
                {
                    try
                    {
                        File.AppendAllText(_logFilePath, logMessage + Environment.NewLine);
                    }
                    catch
                    {
                        // Ignorar errores de escritura para no detener la aplicación
                    }
                }
            }
        }

        public static void LogError(string message, Exception? ex = null)
        {
            Log($"ERROR: {message}");
            if (ex != null)
            {
                Log($"  Exception Type: {ex.GetType().Name}");
                Log($"  Exception Message: {ex.Message}");
                Log($"  Stack Trace: {ex.StackTrace}");
                
                if (ex.InnerException != null)
                {
                    Log($"  Inner Exception: {ex.InnerException.GetType().Name}");
                    Log($"  Inner Message: {ex.InnerException.Message}");
                }
            }
        }

        public static string? GetLogFilePath() => _logFilePath;
    }
}
