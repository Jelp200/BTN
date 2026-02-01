namespace ControlPanel.API.Models
{
    public record GattData(string ServiceUuid, string CharacteristicUuid, byte[] RawValue);
}