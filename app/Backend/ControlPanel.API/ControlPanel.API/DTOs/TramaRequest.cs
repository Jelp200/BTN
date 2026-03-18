namespace ControlPanel.API.DTOs;

// DTO (Data Transfer Object) usado para recibir solicitudes desde el cliente
// cuando se quiere enviar una trama por un puerto serial.
public class TramaRequest
{
    // Nombre del puerto serial al que se quiere enviar la trama (ej. "COM3").
    // Se inicializa con string.Empty para evitar valores nulos.
    public string PortName { get; set; } = string.Empty;

    // La trama que se desea enviar al dispositivo conectado al puerto serial.
    // También se inicializa con string.Empty como valor por defecto.
    public string Trama { get; set; } = string.Empty;
}
