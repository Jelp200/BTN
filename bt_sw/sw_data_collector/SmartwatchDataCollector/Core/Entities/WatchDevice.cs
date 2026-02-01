namespace SmartwatchDataCollector.Core.Entities
{
    // Usamos short para el Rssi ya que es un valor numérico de potencia de señal
    public record WatchDevice(string Name, string Address, short Rssi);
}