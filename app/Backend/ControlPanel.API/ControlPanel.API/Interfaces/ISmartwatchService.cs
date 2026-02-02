using ControlPanel.API.Models;

namespace ControlPanel.API.Interfaces
{
    public interface ISmartwatchService
    {
        Task<SmartwatchConnectionResult> ConnectAsync(string targetName, int scanTimeoutMs, CancellationToken cancellationToken);
        Task<SmartwatchDisconnectResult> DisconnectAsync(CancellationToken cancellationToken);
        SmartwatchVitals? GetLatestVitals();
        IReadOnlyList<SmartwatchVitals> GetRecentVitals(int maxCount);
        
        /// <summary>
        /// Start BPM (heart rate) monitoring - will collect 10 measurements over 60 seconds
        /// </summary>
        Task<bool> StartBpmMonitoringAsync(CancellationToken cancellationToken);
        
        /// <summary>
        /// Start SpO2 (blood oxygen) monitoring - will collect 10 measurements over 60 seconds
        /// </summary>
        Task<bool> StartSpO2MonitoringAsync(CancellationToken cancellationToken);
        
        /// <summary>
        /// Start Temperature monitoring - will collect 10 measurements over 60 seconds
        /// </summary>
        Task<bool> StartTemperatureMonitoringAsync(CancellationToken cancellationToken);
    }

    public record SmartwatchConnectionResult(bool Success, string Message, WatchDevice? Device = null);
    public record SmartwatchDisconnectResult(bool Success, string Message);
}