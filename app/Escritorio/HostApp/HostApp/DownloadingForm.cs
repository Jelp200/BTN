// ** =====================================================================
// ** Archivo:   DownloadingForm.cs
// ** Version:   2.0.0
// **  Autor(es):
// **             Jorge E. Peña Paz
// **  Equipo:    Departamento de Computo - Gradus Technologies
// **  Fecha:     Junio 2026
// **  Descripción:
// **             Diálogo con barra de progreso que descarga el instalador
// **             de la nueva versión desde el VPS.
// ** =====================================================================

namespace HostApp
{
    internal sealed class DownloadingForm : Form
    {
        /// <summary>Ruta al .exe descargado. Null si se canceló o falló.</summary>
        public string? DownloadedPath { get; private set; }

        private readonly UpdateInfo _info;
        private readonly ProgressBar _progress;
        private readonly Label _statusLabel;
        private readonly CancellationTokenSource _cts = new();

        public DownloadingForm(UpdateInfo info)
        {
            _info = info;

            Text = "Descargando actualización...";
            ClientSize = new Size(420, 145);
            StartPosition = FormStartPosition.CenterParent;
            FormBorderStyle = FormBorderStyle.FixedDialog;
            MaximizeBox = false;
            MinimizeBox = false;
            BackColor = Color.White;
            Font = new Font("Segoe UI", 9f);
            FormClosing += (_, __) => _cts.Cancel();

            _statusLabel = new Label
            {
                Text = "Conectando con el servidor...",
                Left = 15, Top = 20, Width = 390, Height = 20,
                AutoSize = false
            };

            _progress = new ProgressBar
            {
                Left = 15, Top = 50, Width = 390, Height = 22,
                Style = ProgressBarStyle.Continuous,
                Minimum = 0, Maximum = 100
            };

            var btnCancel = new Button
            {
                Text = "Cancelar",
                Left = 160, Top = 90, Width = 100, Height = 30,
                FlatStyle = FlatStyle.Flat,
                Cursor = Cursors.Hand
            };
            btnCancel.FlatAppearance.BorderColor = Color.FromArgb(180, 180, 180);
            btnCancel.Click += (_, __) => { _cts.Cancel(); Close(); };

            Controls.AddRange(new Control[] { _statusLabel, _progress, btnCancel });

            Shown += async (_, __) => await StartDownloadAsync();
        }

        private async Task StartDownloadAsync()
        {
            // Extraer nombre de archivo de la URL
            if (!Uri.TryCreate(_info.Url, UriKind.Absolute, out var uri))
            {
                ShowError("URL de descarga inválida.");
                return;
            }

            var fileName = Path.GetFileName(uri.LocalPath);
            if (string.IsNullOrWhiteSpace(fileName))
                fileName = $"PanelControlGITSE-v{_info.Version}-Instalador.exe";

            var tempPath = Path.Combine(Path.GetTempPath(), fileName);

            try
            {
                using var http = new HttpClient { Timeout = TimeSpan.FromMinutes(15) };
                using var response = await http.GetAsync(_info.Url,
                    HttpCompletionOption.ResponseHeadersRead, _cts.Token);
                response.EnsureSuccessStatusCode();

                var total  = response.Content.Headers.ContentLength ?? -1L;
                var buffer = new byte[32 * 1024]; // 32 KB chunks
                long downloaded = 0;

                await using var netStream  = await response.Content.ReadAsStreamAsync(_cts.Token);
                await using var fileStream = new FileStream(tempPath,
                    FileMode.Create, FileAccess.Write, FileShare.None, bufferSize: 4096, useAsync: true);

                while (true)
                {
                    var read = await netStream.ReadAsync(buffer, _cts.Token);
                    if (read == 0) break;

                    await fileStream.WriteAsync(buffer.AsMemory(0, read), _cts.Token);
                    downloaded += read;

                    UpdateProgress(downloaded, total);
                }

                DownloadedPath = tempPath;
                DialogResult = DialogResult.OK;
                Close();
            }
            catch (OperationCanceledException)
            {
                TryDeleteTemp(tempPath);
                // Cierre silencioso (el usuario canceló o el form se cerró)
            }
            catch (Exception ex)
            {
                TryDeleteTemp(tempPath);
                ShowError($"Error al descargar la actualización:\n{ex.Message}");
            }
        }

        private void UpdateProgress(long downloaded, long total)
        {
            var dlMb = downloaded / 1_048_576.0;

            if (total > 0)
            {
                var pct    = (int)(downloaded * 100 / total);
                var totalMb = total / 1_048_576.0;
                _progress.Value  = Math.Clamp(pct, 0, 100);
                _statusLabel.Text = $"Descargando...   {dlMb:F1} MB / {totalMb:F1} MB  ({pct}%)";
            }
            else
            {
                _statusLabel.Text = $"Descargando...   {dlMb:F1} MB";
            }
        }

        private void ShowError(string message)
        {
            if (!IsDisposed)
                MessageBox.Show(message, "Error de descarga", MessageBoxButtons.OK, MessageBoxIcon.Error);
            if (!IsDisposed)
                Close();
        }

        private static void TryDeleteTemp(string path)
        {
            try { if (File.Exists(path)) File.Delete(path); } catch { }
        }
    }
}
