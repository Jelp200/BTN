using System.ComponentModel.DataAnnotations;

namespace ControlPanel.API.DTOs
{
    public class SmartwatchConnectRequest
    {
        [RegularExpression("^(C1|C2)$", ErrorMessage = "Cabin debe ser 'C1' o 'C2'.")]
        public string? Cabin { get; set; } = "C1";

        [MaxLength(64, ErrorMessage = "DeviceName no puede exceder 64 caracteres.")]
        public string? DeviceName { get; set; } = "ET570";

        [Range(1000, 30000, ErrorMessage = "ScanTimeoutMs debe estar entre 1000 y 30000 ms.")]
        public int? ScanTimeoutMs { get; set; } = 15000;
    }
}