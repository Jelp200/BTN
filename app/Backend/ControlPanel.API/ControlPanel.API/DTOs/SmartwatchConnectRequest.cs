namespace ControlPanel.API.DTOs
{
    public class SmartwatchConnectRequest
    {
        public string? DeviceName { get; set; } = "ET570";
        public int? ScanTimeoutMs { get; set; } = 15000;
    }
}