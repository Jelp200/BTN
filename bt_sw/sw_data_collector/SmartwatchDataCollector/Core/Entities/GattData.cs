namespace SmartwatchDataCollector.Core.Entities
{
    public record GattData(string ServiceUuid, string CharacteristicUuid, byte[] RawValue);
}
