// ** =====================================================================
// ** Archivo:   AutoUpdater.cs
// ** Version:   2.0.3
// **  Autor(es):
// **             Jorge E. Peña Paz
// **  Equipo:    Departamento de Computo - Gradus Technologies
// **  Fecha:     Junio 2026
// **  Descripción:
// **             Verifica si hay una nueva versión disponible en el VPS
// **             y muestra el diálogo de actualización al usuario.
// ** =====================================================================

using System.Text.Json;

namespace HostApp
{
    internal static class AutoUpdater
    {
        // Leído del assembly — siempre en sync con <Version> en HostApp.csproj. No editar manualmente.
        internal static readonly string AppVersion =
            typeof(AutoUpdater).Assembly.GetName().Version is { } v
                ? $"{v.Major}.{v.Minor}.{v.Build}"
                : "0.0.0";

        private const string VersionJsonUrl = "https://gradustec.com/updates/version.json";

        private static readonly string SkipFilePath = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "ControlPanel", "skipped-version.txt");

        private static readonly string JustUpdatedFlagPath = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "ControlPanel", "just-updated.flag");

        /// <summary>
        /// Consulta el VPS, compara versiones y muestra el diálogo si hay actualización.
        /// Silencioso ante cualquier error de red (no bloquea el arranque).
        /// </summary>
        public static async Task CheckAsync(Form owner)
        {
            if (owner.IsDisposed) return;

            string? json = null;
            try
            {
                using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };
                json = await http.GetStringAsync(VersionJsonUrl);
            }
            catch
            {
                return; // VPS inaccesible o sin internet → silencioso
            }

            UpdateInfo? info = ParseVersionJson(json);
            if (info is null) return;
            if (!IsNewer(info.Version, AppVersion)) return;
            if (IsVersionSkipped(info.Version)) return;

            // Mostrar diálogo en el hilo de UI
            if (!owner.IsDisposed)
                owner.Invoke(() => ShowDialog(owner, info));
        }

        private static void ShowDialog(Form owner, UpdateInfo info)
        {
            using var form = new UpdateAvailableForm(info);
            form.ShowDialog(owner);
        }

        // ── Helpers ───────────────────────────────────────────────────────────

        internal static UpdateInfo? ParseVersionJson(string json)
        {
            try
            {
                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;
                return new UpdateInfo(
                    Version: root.TryGetProperty("version", out var v) ? v.GetString() ?? "" : "",
                    Url:     root.TryGetProperty("url",     out var u) ? u.GetString() ?? "" : "",
                    Notes:   root.TryGetProperty("notes",   out var n) ? n.GetString() ?? "" : "",
                    Date:    root.TryGetProperty("date",    out var d) ? d.GetString() ?? "" : ""
                );
            }
            catch { return null; }
        }

        internal static bool IsNewer(string remote, string current)
        {
            return Version.TryParse(remote,  out var r) &&
                   Version.TryParse(current, out var c) &&
                   r > c;
        }

        internal static bool IsVersionSkipped(string version)
        {
            try
            {
                return File.Exists(SkipFilePath) &&
                       File.ReadAllText(SkipFilePath).Trim() == version.Trim();
            }
            catch { return false; }
        }

        // Escribe el flag antes de cerrar la app para actualizar.
        // Al siguiente arranque, Form1 lo consume para limpiar el cache del WebView2.
        internal static void MarkJustUpdated()
        {
            try
            {
                Directory.CreateDirectory(Path.GetDirectoryName(JustUpdatedFlagPath)!);
                File.WriteAllText(JustUpdatedFlagPath, AppVersion);
            }
            catch { }
        }

        // Devuelve true y borra el flag si existe (consumo único por arranque).
        internal static bool ConsumeJustUpdatedFlag()
        {
            try
            {
                if (!File.Exists(JustUpdatedFlagPath)) return false;
                File.Delete(JustUpdatedFlagPath);
                return true;
            }
            catch { return false; }
        }

        internal static void SkipVersion(string version)
        {
            try
            {
                Directory.CreateDirectory(Path.GetDirectoryName(SkipFilePath)!);
                File.WriteAllText(SkipFilePath, version.Trim());
            }
            catch { }
        }
    }

    internal record UpdateInfo(string Version, string Url, string Notes, string Date);
}
