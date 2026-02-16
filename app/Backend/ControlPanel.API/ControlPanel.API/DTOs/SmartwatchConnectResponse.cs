using System.Text.Json.Serialization;

namespace ControlPanel.API.DTOs
{
    public class SmartwatchConnectResponse
    {
        [JsonPropertyName("success")]
        public bool Success { get; init; }
        
        [JsonPropertyName("message")]
        public string Message { get; init; } = string.Empty;
        
        [JsonPropertyName("device")]
        public WatchDeviceDto? Device { get; init; }
    }
}