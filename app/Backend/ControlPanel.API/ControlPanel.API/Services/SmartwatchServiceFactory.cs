using ControlPanel.API.Bluetooth;
using ControlPanel.API.Interfaces;

namespace ControlPanel.API.Services
{
    public class SmartwatchServiceFactory : ISmartwatchServiceFactory
    {
        private readonly Dictionary<string, ISmartwatchService> _services;

        public SmartwatchServiceFactory()
        {
            _services = new Dictionary<string, ISmartwatchService>(StringComparer.OrdinalIgnoreCase)
            {
                ["C1"] = BuildService(),
                ["C2"] = BuildService()
            };
        }

        public ISmartwatchService GetForCabin(string? cabin)
        {
            var normalized = NormalizeCabin(cabin);
            return _services[normalized];
        }

        private static ISmartwatchService BuildService()
        {
            return new SmartwatchService(new BleScanner(), new BleConnector(), new SessionLogger());
        }

        private static string NormalizeCabin(string? cabin)
        {
            if (string.IsNullOrWhiteSpace(cabin)) return "C1";

            var normalized = cabin.Trim().ToUpperInvariant();
            return normalized switch
            {
                "C1" => "C1",
                "C2" => "C2",
                _ => "C1"
            };
        }
    }
}