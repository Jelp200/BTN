using ControlPanel.API.Models;

namespace ControlPanel.API.Interfaces
{
    public interface IBleScanner
    {
        event Action<WatchDevice> OnDeviceDiscovered;
        void StartScanning();
        void StopScanning();
    }
}