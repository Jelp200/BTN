namespace ControlPanel.API.Models
{
    public record SmartwatchVitals(
        double? PulseBpm,
        double? SpO2,
        double? TemperatureC,
        double? Systolic,
        double? Diastolic,
        DateTime TimestampUtc
    );
}