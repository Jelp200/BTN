// ** =====================================================================
// ** Archivo:   UpdateAvailableForm.cs
// ** Version:   2.0.0
// **  Autor(es):
// **             Jorge E. Peña Paz
// **  Equipo:    Departamento de Computo - Gradus Technologies
// **  Fecha:     Junio 2026
// **  Descripción:
// **             Diálogo que notifica al usuario que hay una nueva versión
// **             disponible y le permite actualizar, posponer u omitir.
// ** =====================================================================

namespace HostApp
{
    internal sealed class UpdateAvailableForm : Form
    {
        private readonly UpdateInfo _info;

        public UpdateAvailableForm(UpdateInfo info)
        {
            _info = info;
            BuildUI();
        }

        private void BuildUI()
        {
            Text = "Actualización disponible - Control Panel";
            ClientSize = new Size(490, 295);
            StartPosition = FormStartPosition.CenterParent;
            FormBorderStyle = FormBorderStyle.FixedDialog;
            MaximizeBox = false;
            MinimizeBox = false;
            BackColor = Color.White;
            Font = new Font("Segoe UI", 9f);

            // ── Header ────────────────────────────────────────────────────────
            var header = new Panel
            {
                Dock = DockStyle.Top,
                Height = 68,
                BackColor = Color.FromArgb(31, 73, 125)
            };

            header.Controls.Add(new Label
            {
                Text = $"Nueva versión {_info.Version} disponible",
                ForeColor = Color.White,
                Font = new Font("Segoe UI", 12f, FontStyle.Bold),
                Left = 15, Top = 10, Width = 460, Height = 26,
                AutoSize = false
            });

            var subtitle = string.IsNullOrWhiteSpace(_info.Date)
                ? $"Versión instalada: {AutoUpdater.AppVersion}"
                : $"Versión instalada: {AutoUpdater.AppVersion}   ·   Publicada: {_info.Date}";
            header.Controls.Add(new Label
            {
                Text = subtitle,
                ForeColor = Color.FromArgb(180, 210, 240),
                Font = new Font("Segoe UI", 8.5f),
                Left = 15, Top = 38, Width = 460, Height = 20,
                AutoSize = false
            });

            // ── Novedades ─────────────────────────────────────────────────────
            var lblNotes = new Label
            {
                Text = "Novedades en esta versión:",
                Font = new Font("Segoe UI", 8.5f, FontStyle.Bold),
                Left = 15, Top = 80,
                AutoSize = true
            };

            var txtNotes = new TextBox
            {
                Multiline = true,
                ReadOnly = true,
                ScrollBars = ScrollBars.Vertical,
                Text = string.IsNullOrWhiteSpace(_info.Notes)
                    ? "Sin notas de versión."
                    : _info.Notes,
                Left = 15, Top = 100,
                Width = 460, Height = 105,
                BackColor = Color.FromArgb(245, 247, 250),
                BorderStyle = BorderStyle.FixedSingle,
                Font = new Font("Segoe UI", 8.5f)
            };

            // ── Botones ───────────────────────────────────────────────────────
            var btnUpdate = CreateButton(
                text: "Actualizar ahora",
                left: 15, top: 222,
                width: 145, height: 34,
                backColor: Color.FromArgb(31, 73, 125),
                foreColor: Color.White,
                bold: true);
            btnUpdate.Click += OnUpdateClick;

            var btnLater = CreateButton(
                text: "Recordar más tarde",
                left: 170, top: 222,
                width: 150, height: 34,
                backColor: Color.FromArgb(228, 228, 228),
                foreColor: Color.Black,
                bold: false);
            btnLater.Click += (_, __) => Close();

            var btnSkip = CreateButton(
                text: "Omitir esta versión",
                left: 330, top: 222,
                width: 145, height: 34,
                backColor: Color.White,
                foreColor: Color.FromArgb(130, 130, 130),
                bold: false);
            btnSkip.FlatAppearance.BorderColor = Color.FromArgb(200, 200, 200);
            btnSkip.Click += (_, __) =>
            {
                AutoUpdater.SkipVersion(_info.Version);
                Close();
            };

            Controls.AddRange(new Control[]
            {
                header, lblNotes, txtNotes, btnUpdate, btnLater, btnSkip
            });
        }

        private static Button CreateButton(string text, int left, int top, int width, int height,
            Color backColor, Color foreColor, bool bold)
        {
            var btn = new Button
            {
                Text = text,
                Left = left, Top = top,
                Width = width, Height = height,
                BackColor = backColor,
                ForeColor = foreColor,
                FlatStyle = FlatStyle.Flat,
                Font = new Font("Segoe UI", 9f, bold ? FontStyle.Bold : FontStyle.Regular),
                Cursor = Cursors.Hand
            };
            btn.FlatAppearance.BorderSize = 0;
            return btn;
        }

        private void OnUpdateClick(object? sender, EventArgs e)
        {
            // Desactivar botones durante la descarga
            foreach (Control c in Controls)
                if (c is Button b) b.Enabled = false;

            string? downloadedPath = null;
            try
            {
                using var dlForm = new DownloadingForm(_info);
                dlForm.ShowDialog(this);
                downloadedPath = dlForm.DownloadedPath;
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    $"Error al iniciar la descarga:\n{ex.Message}",
                    "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }

            if (downloadedPath != null)
            {
                var confirm = MessageBox.Show(
                    "Descarga completada.\n\n" +
                    "La aplicación se cerrará e instalará la nueva versión automáticamente.\n" +
                    "Una vez finalizada la instalación podrá volver a abrir Control Panel.\n\n" +
                    "¿Continuar?",
                    "Instalar actualización",
                    MessageBoxButtons.YesNo,
                    MessageBoxIcon.Question);

                if (confirm == DialogResult.Yes)
                {
                    System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
                    {
                        FileName = downloadedPath,
                        Arguments = "/SILENT /CLOSEAPPLICATIONS",
                        UseShellExecute = true
                    });
                    Application.Exit();
                    return;
                }
            }

            // Reactivar botones si el usuario cancela o falla la descarga
            foreach (Control c in Controls)
                if (c is Button b) b.Enabled = true;
        }
    }
}
