using ControlPanel.API.Models;

namespace ControlPanel.API.Interfaces
{
    public interface IBleConnector
    {
        Task ConnectAsync(string macAddress, CancellationToken cancellationToken = default);
        Task DisconnectAsync(CancellationToken cancellationToken = default);
        Task SubscribeToNotificationsAsync(Guid serviceUuid, Guid characteristicUuid, CancellationToken cancellationToken = default);
        Task WriteAsync(Guid serviceUuid, Guid characteristicUuid, byte[] data, CancellationToken cancellationToken = default);
        Task ExploreAndLogAllServices(CancellationToken cancellationToken = default);
        event Action<GattData> OnDataReceived;
    }
}