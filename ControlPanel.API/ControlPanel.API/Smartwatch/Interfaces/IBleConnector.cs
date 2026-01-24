using ControlPanel.API.Smartwatch.Models;

namespace ControlPanel.API.Smartwatch.Interfaces
{
    public interface IBleConnector
    {
        Task ConnectAsync(string macAddress, CancellationToken cancellationToken = default);
        Task DisconnectAsync(CancellationToken cancellationToken = default);
        event Action<GattData> OnDataReceived;
    }
}
