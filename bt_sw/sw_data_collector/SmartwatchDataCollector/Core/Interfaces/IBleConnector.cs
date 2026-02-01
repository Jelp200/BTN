using SmartwatchDataCollector.Core.Entities;

namespace SmartwatchDataCollector.Core.Interfaces
{
    public interface IBleConnector
    {
        Task ConnectAsync(string macAddress);
        Task SubscribeToNotificationsAsync();
        event Action<GattData> OnDataReceived;
    }
}
