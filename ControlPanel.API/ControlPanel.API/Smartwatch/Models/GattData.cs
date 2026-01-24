namespace ControlPanel.API.Smartwatch.Models
{
    public record GattData(string ServiceUuid, string CharacteristicUuid, byte[] RawValue);
}
