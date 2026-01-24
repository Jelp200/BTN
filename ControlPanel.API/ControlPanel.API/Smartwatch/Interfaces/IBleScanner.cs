using ControlPanel.API.Smartwatch.Models;

namespace ControlPanel.API.Smartwatch.Interfaces
{
    public interface IBleScanner
    {
        event Action<WatchDevice> OnDeviceDiscovered;
        void StartScanning();
        void StopScanning();
    }
}
