using ControlPanel.API.Models;

namespace ControlPanel.API.Interfaces
{
    public interface IBleConnector
    {
        Task ConnectAsync(string macAddress, CancellationToken cancellationToken = default);
        Task DisconnectAsync(CancellationToken cancellationToken = default);
        event Action<GattData> OnDataReceived;
    }
}