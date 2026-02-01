using ControlPanel.API.Models;

namespace ControlPanel.API.Interfaces
{
    public interface ISmartwatchService
    {
        Task<SmartwatchConnectionResult> ConnectAsync(string targetName, int scanTimeoutMs, CancellationToken cancellationToken);
        Task<SmartwatchDisconnectResult> DisconnectAsync(CancellationToken cancellationToken);
    }

    public record SmartwatchConnectionResult(bool Success, string Message, WatchDevice? Device = null);
    public record SmartwatchDisconnectResult(bool Success, string Message);
}