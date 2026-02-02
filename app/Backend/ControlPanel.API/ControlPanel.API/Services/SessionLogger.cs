using System.Text;

namespace ControlPanel.API.Services
{
    /// <summary>
    /// Captures console output to a file during smartwatch connection sessions
    /// </summary>
    public class SessionLogger : IDisposable
    {
        private StreamWriter? _fileWriter;
        private TextWriter? _originalConsoleOut;
        private readonly string _logDirectory;
        private string? _currentLogFile;
        private bool _isRecording;

        public SessionLogger()
        {
            _logDirectory = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Logs");
            Directory.CreateDirectory(_logDirectory);
        }

        public void StartRecording()
        {
            if (_isRecording)
            {
                Console.WriteLine("[SESSION-LOGGER] Ya hay una grabación en curso");
                return;
            }

            var timestamp = DateTime.Now.ToString("yyyy-MM-dd_HH-mm-ss");
            _currentLogFile = Path.Combine(_logDirectory, $"smartwatch-session-{timestamp}.txt");

            try
            {
                _fileWriter = new StreamWriter(_currentLogFile, false, Encoding.UTF8)
                {
                    AutoFlush = true
                };

                // Save original console output
                _originalConsoleOut = Console.Out;

                // Create a multi-writer that writes to both console and file
                var multiWriter = new MultiTextWriter(Console.Out, _fileWriter);
                Console.SetOut(multiWriter);

                _isRecording = true;

                Console.WriteLine("═══════════════════════════════════════════════════════════════════");
                Console.WriteLine($"[SESSION-LOGGER] 📝 GRABACIÓN DE LOGS INICIADA");
                Console.WriteLine($"[SESSION-LOGGER] Archivo: {Path.GetFileName(_currentLogFile)}");
                Console.WriteLine($"[SESSION-LOGGER] Timestamp: {DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}");
                Console.WriteLine("═══════════════════════════════════════════════════════════════════\n");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SESSION-LOGGER] ✗ Error al iniciar grabación: {ex.Message}");
            }
        }

        public string? StopRecording()
        {
            if (!_isRecording)
            {
                Console.WriteLine("[SESSION-LOGGER] No hay grabación activa");
                return null;
            }

            try
            {
                Console.WriteLine("\n═══════════════════════════════════════════════════════════════════");
                Console.WriteLine($"[SESSION-LOGGER] 🛑 GRABACIÓN DE LOGS FINALIZADA");
                Console.WriteLine($"[SESSION-LOGGER] Timestamp: {DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}");
                Console.WriteLine($"[SESSION-LOGGER] Archivo guardado: {Path.GetFileName(_currentLogFile)}");
                Console.WriteLine($"[SESSION-LOGGER] Ubicación: {_currentLogFile}");
                Console.WriteLine("═══════════════════════════════════════════════════════════════════");

                // Restore original console output
                if (_originalConsoleOut != null)
                {
                    Console.SetOut(_originalConsoleOut);
                }

                // Close file writer
                _fileWriter?.Dispose();
                _fileWriter = null;

                _isRecording = false;

                var savedFile = _currentLogFile;
                _currentLogFile = null;

                return savedFile;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SESSION-LOGGER] ✗ Error al detener grabación: {ex.Message}");
                return null;
            }
        }

        public void Dispose()
        {
            if (_isRecording)
            {
                StopRecording();
            }
        }

        /// <summary>
        /// TextWriter that writes to multiple destinations simultaneously
        /// </summary>
        private class MultiTextWriter : TextWriter
        {
            private readonly TextWriter[] _writers;

            public override Encoding Encoding => Encoding.UTF8;

            public MultiTextWriter(params TextWriter[] writers)
            {
                _writers = writers;
            }

            public override void Write(char value)
            {
                foreach (var writer in _writers)
                {
                    writer.Write(value);
                }
            }

            public override void Write(string? value)
            {
                foreach (var writer in _writers)
                {
                    writer.Write(value);
                }
            }

            public override void WriteLine(string? value)
            {
                foreach (var writer in _writers)
                {
                    writer.WriteLine(value);
                }
            }

            public override void Flush()
            {
                foreach (var writer in _writers)
                {
                    writer.Flush();
                }
            }

            protected override void Dispose(bool disposing)
            {
                if (disposing)
                {
                    foreach (var writer in _writers)
                    {
                        try
                        {
                            writer.Flush();
                        }
                        catch { }
                    }
                }
                base.Dispose(disposing);
            }
        }
    }
}
