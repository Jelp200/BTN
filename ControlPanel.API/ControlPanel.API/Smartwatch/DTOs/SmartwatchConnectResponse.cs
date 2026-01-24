using ControlPanel.API.Smartwatch.Models;

namespace ControlPanel.API.Smartwatch.DTOs
{
    public class SmartwatchConnectResponse
    {
        public bool Success { get; init; }
        public string Message { get; init; } = string.Empty;
        public WatchDevice? Device { get; init; }
    }
}
