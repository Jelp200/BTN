namespace ControlPanel.API.Interfaces
{
    public interface ISmartwatchServiceFactory
    {
        ISmartwatchService GetForCabin(string? cabin);
    }
}