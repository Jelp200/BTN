using System.Diagnostics;
using Microsoft.Web.WebView2.WinForms;
using System.Net.Http;
using System.Threading;

namespace HostApp
{
    public partial class Form1 : Form
    {
        // Proceso en el que se ejecutará la API (ControlPanel.API.exe)
        private Process? _apiProcess;

        // Control WebView2 para mostrar el frontend (Astro/Tailwind/JS)
        private WebView2? _webView;

        public Form1()
        {
            InitializeComponent();       // Inicializa los elementos del formulario
            InitializeWebViewControl();  // Configura el control WebView2
            StartApi();                  // Intenta iniciar la API ASP.NET Core
        }

        // Método para verificar si un puerto (ej. 5000) ya está en uso
        private bool IsPortInUse(int port)
        {
            try
            {
                // Intenta abrir un socket en localhost:port
                using (var socket = new System.Net.Sockets.Socket(
                    System.Net.Sockets.AddressFamily.InterNetwork,
                    System.Net.Sockets.SocketType.Stream,
                    System.Net.Sockets.ProtocolType.Tcp))
                {
                    socket.Bind(new System.Net.IPEndPoint(System.Net.IPAddress.Loopback, port));
                    return false; // Si pudo bindear → puerto libre
                }
            }
            catch
            {
                return true; // Si falla → puerto ya ocupado
            }
        }

        // Espera 4s y lanza la verificación de actualizaciones de forma silenciosa
        private async Task CheckForUpdatesDelayedAsync()
        {
            await Task.Delay(4000);
            await AutoUpdater.CheckAsync(this);
        }

        // Inicializa el control WebView2 dentro del formulario
        private void InitializeWebViewControl()
        {
            _webView = new WebView2
            {
                Dock = DockStyle.Fill, // Ocupar todo el formulario
                CreationProperties = new CoreWebView2CreationProperties
                {
                    // Carpeta donde WebView2 guardará datos temporales y cache
                    UserDataFolder = Path.Combine(
                        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), 
                        "ControlPanel")
                }
            };

            // Agregar el WebView2 al formulario
            Controls.Add(_webView);
        }

        // Inicia la API ASP.NET Core en un proceso externo
        private async void StartApi()
        {
            try
            {
                // Directorio donde está instalado HostApp.exe
                string appDirectory = Path.GetDirectoryName(Application.ExecutablePath)!;
                Debug.WriteLine($"📁 Directorio de aplicación: {appDirectory}");

                // Ejecutable de la API en la misma carpeta
                var apiExe = Path.Combine(appDirectory, "ControlPanel.API.exe");

                // Validar que el ejecutable exista en la misma carpeta que HostApp
                if (!File.Exists(apiExe))
                {
                    MessageBox.Show(
                        $"❌ No se encontró el archivo:\n\n{apiExe}\n\n" +
                        "Asegúrate de que 'ControlPanel.API.exe' esté en la misma carpeta que este programa.\n\n" +
                        "Este archivo es necesario para que la aplicación funcione.",
                        "Error: Archivo no encontrado",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Error);
                    Close();
                    return;
                }

                // Verificar si el puerto 5000 está ocupado
                if (IsPortInUse(5000))
                {
                    MessageBox.Show(
                        "❌ El puerto 5000 ya está en uso.\n" +
                        "Cierra otras instancias de la app o procesos que lo usen.",
                        "Error: Puerto ocupado",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Error);
                    Close();
                    return;
                }

                // Configurar el proceso que lanzará la API
                _apiProcess = new Process
                {
                    StartInfo = new ProcessStartInfo
                    {
                        FileName = apiExe,
                        Arguments = "--urls=http://localhost:5000", // La API escuchará en este puerto
                        UseShellExecute = false, // Ejecutar directamente, no vía shell
                        WorkingDirectory = appDirectory, // Asegurar directorio correcto
                        CreateNoWindow = true,
                        WindowStyle = ProcessWindowStyle.Hidden,
                        RedirectStandardOutput = true,
                        RedirectStandardError = true
                    }
                };

                // Capturar salida para diagnóstico
                _apiProcess.OutputDataReceived += (s, e) =>
                {
                    if (!string.IsNullOrEmpty(e.Data))
                        Debug.WriteLine("[API OUT] " + e.Data);
                };
                _apiProcess.ErrorDataReceived += (s, e) =>
                {
                    if (!string.IsNullOrEmpty(e.Data))
                        Debug.WriteLine("[API ERR] " + e.Data);
                };

                // Lanzar la API
                _apiProcess.Start();
                _apiProcess.BeginOutputReadLine();
                _apiProcess.BeginErrorReadLine();

                // Esperar a que la API esté lista para recibir solicitudes
                if (await WaitForServerAsync("http://localhost:5000", 30000))
                {
                    Debug.WriteLine("✅ API iniciada y respondiendo.");
                    await InitializeWebViewAsync(); // Una vez lista, carga el frontend en WebView2

                    // Verificar actualizaciones 4s después del arranque (no bloquea la UI)
                    _ = CheckForUpdatesDelayedAsync();
                }
                else
                {
                    // Si en 30 segundos no responde, mostrar error
                    var logsFolder = Path.Combine(appDirectory, "Logs");
                    MessageBox.Show(
                        "❌ No se pudo conectar al servidor después de 30 segundos.\n\n" +
                        "Posibles causas:\n" +
                        "1. El .exe está bloqueado por Windows (clic derecho → Propiedades → Desbloquear)\n" +
                        "2. El antivirus lo está bloqueando\n" +
                        "3. Fallo al iniciar el proceso\n\n" +
                        $"Revisa los logs en: {logsFolder}",
                        "Error de conexión",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Error);
                    Close();
                }
            }
            catch (Exception ex)
            {
                var appDir = Path.GetDirectoryName(Application.ExecutablePath);
                var logsFolder = Path.Combine(appDir ?? ".", "Logs");
                MessageBox.Show(
                    $"❌ Error al iniciar la API:\n\n{ex.Message}\n\n" +
                    $"Revisa los logs en: {logsFolder}", 
                    "Error", 
                    MessageBoxButtons.OK, 
                    MessageBoxIcon.Error);
                Close();
            }
        }

        // Método para esperar que el servidor responda antes de continuar
        private async Task<bool> WaitForServerAsync(string url, int timeoutMs)
        {
            using (var client = new HttpClient { Timeout = TimeSpan.FromSeconds(5) })
            {
                var sw = Stopwatch.StartNew();
                while (sw.ElapsedMilliseconds < timeoutMs)
                {
                    try
                    {
                        var response = await client.GetAsync(url);
                        // Responde OK o NotFound → está vivo el servidor
                        return response.IsSuccessStatusCode || response.StatusCode == System.Net.HttpStatusCode.NotFound;
                    }
                    catch
                    {
                        // Si lanza excepción → servidor aún no está disponible
                    }

                    await Task.Delay(250); // Esperar un poco y reintentar
                }
                return false; // Tiempo agotado
            }
        }

        // Inicializa WebView2 y navega hacia el frontend (servido por la API)
        private async Task InitializeWebViewAsync()
        {
            try
            {
                if (_webView == null)
                    return; // Si WebView no está inicializado, no hacer nada

                await _webView.EnsureCoreWebView2Async(); // Garantizar que el motor de WebView2 esté listo

                if (this.IsDisposed || _webView.IsDisposed)
                    return; // Si el formulario ya se cerró, no hacer nada

                _webView.CoreWebView2.Navigate("http://localhost:5000"); // Cargar el frontend
            }
            catch (Exception ex)
            {
                if (!this.IsDisposed && _webView != null && !_webView.IsDisposed)
                {
                    MessageBox.Show(
                        $"❌ Error al cargar el frontend: {ex.Message}", 
                        "Error", 
                        MessageBoxButtons.OK, 
                        MessageBoxIcon.Error);
                }
            }
        }

        // Evento al cerrar el formulario principal
        protected override void OnFormClosing(FormClosingEventArgs e)
        {
            base.OnFormClosing(e);

            try
            {
                // Si la API sigue ejecutándose, terminarla
                if (_apiProcess != null && !_apiProcess.HasExited)
                {
                    _apiProcess.Kill(true);
                    _apiProcess.WaitForExit(3000);
                }
            }
            catch (Exception ex)
            {
                Debug.WriteLine("Error al cerrar API: " + ex.Message);
            }
            finally
            {
                _webView?.Dispose(); // Liberar recursos del WebView2
            }
        }
    }
}
