using ControlPanel.API.Smartwatch.Models;

namespace ControlPanel.API.Smartwatch.Services
{
    public interface ISmartwatchService
    {
        Task<SmartwatchConnectionResult> ConnectAsync(string targetName, int scanTimeoutMs, CancellationToken cancellationToken);
        Task<SmartwatchDisconnectResult> DisconnectAsync(CancellationToken cancellationToken);
    }

    public record SmartwatchConnectionResult(bool Success, string Message, WatchDevice? Device = null);
    public record SmartwatchDisconnectResult(bool Success, string Message);
}
