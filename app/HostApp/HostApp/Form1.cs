using System.Diagnostics;
using Microsoft.Web.WebView2.WinForms;

namespace HostApp
{
    public partial class Form1 : Form
    {
        private Process backendProcess = null!;
        private WebView2 webView21 = null!;

        public Form1()
        {
            InitializeComponent();
            InitializeWebViewControl();
            StartBackend();
            InitializeWebView();
        }

        private void InitializeWebViewControl()
        {
            webView21 = new WebView2
            {
                Dock = DockStyle.Fill
            };
            Controls.Add(webView21);
        }

        private void StartBackend()
        {
            var projectPath = Path.Combine("..", "ControlPanel.API", "ControlPanel.API");

            var startInfo = new ProcessStartInfo
            {
                FileName = "dotnet",
                Arguments = $"run --project {projectPath}",
                WorkingDirectory = AppDomain.CurrentDomain.BaseDirectory,
                UseShellExecute = false
            };

            backendProcess = Process.Start(startInfo)
                ?? throw new InvalidOperationException("No se pudo iniciar el backend (Process.Start devolvió null).");
        }


        private async void InitializeWebView()
        {
            await webView21.EnsureCoreWebView2Async();
            webView21.CoreWebView2.Navigate("http://localhost:4321");
        }

        protected override void OnFormClosing(FormClosingEventArgs e)
        {
            base.OnFormClosing(e);
            if (!backendProcess.HasExited) backendProcess.Kill();
        }
    }
}
