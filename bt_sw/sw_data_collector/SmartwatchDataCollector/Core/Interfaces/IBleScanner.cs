using SmartwatchDataCollector.Core.Entities;

namespace SmartwatchDataCollector.Core.Interfaces
{
    public interface IBleScanner
    {
        event Action<WatchDevice> OnDeviceDiscovered;
        void StartScanning();
        void StopScanning();
    }
}