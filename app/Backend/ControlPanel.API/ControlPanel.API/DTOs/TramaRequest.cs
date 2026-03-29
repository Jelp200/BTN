using System.ComponentModel.DataAnnotations;

namespace ControlPanel.API.DTOs;

// DTO (Data Transfer Object) usado para recibir solicitudes desde el cliente
// cuando se quiere enviar una trama por un puerto serial.
public class TramaRequest
{
    // Nombre del puerto serial al que se quiere enviar la trama (ej. "COM3").
    [Required(ErrorMessage = "PortName es requerido.")]
    [MaxLength(16, ErrorMessage = "PortName no puede exceder 16 caracteres.")]
    [RegularExpression(@"^COM\d{1,3}$", ErrorMessage = "PortName debe tener el formato COMn (ej. COM3).")]
    public string PortName { get; set; } = string.Empty;

    // La trama que se desea enviar al dispositivo conectado al puerto serial.
    [Required(ErrorMessage = "Trama es requerida.")]
    [MaxLength(512, ErrorMessage = "Trama no puede exceder 512 caracteres.")]
    public string Trama { get; set; } = string.Empty;
}
