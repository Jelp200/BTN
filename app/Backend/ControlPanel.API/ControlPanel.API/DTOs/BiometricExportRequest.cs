using System.ComponentModel.DataAnnotations;
using ControlPanel.API.Models;

namespace ControlPanel.API.DTOs
{
    /// <summary>
    /// Solicitud para exportar datos biométricos a Excel
    /// </summary>
    public class BiometricExportRequest
    {
        /// <summary>
        /// Lista de datos vitales a exportar
        /// </summary>
        public List<SmartwatchVitals> Vitals { get; set; } = new();

        /// <summary>
        /// Número de cabina (1 o 2)
        /// </summary>
        [RegularExpression("^[12]$", ErrorMessage = "Cabin debe ser '1' o '2'.")]
        public string? Cabin { get; set; }

        /// <summary>
        /// Tipo de medición (BPM, SpO2, Temperature, BloodPressure, Completo)
        /// </summary>
        [RegularExpression("^(BPM|SpO2|Temperature|BloodPressure|Completo)$",
            ErrorMessage = "MeasurementType no válido.")]
        public string? MeasurementType { get; set; }
    }
}
