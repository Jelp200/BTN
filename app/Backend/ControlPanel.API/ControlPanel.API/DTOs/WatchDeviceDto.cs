/* ***************************************************************************
**  Archivo:   WatchDeviceDto.cs
**  Proyecto:  ControlPanel.API (Botonera)
**  Version:   2.0.0
**  Autor(es):
**             Jorge E. Peña Paz
**  Equipo:    Deprartamento de Computo - Gradus Technologies
**  Fecha:     Febrero 2026
**  Descripcion:
**              DTO serializable para exponer información del dispositivo
**              conectado en las respuestas HTTP.
*************************************************************************** */
using System.Text.Json.Serialization;

namespace ControlPanel.API.DTOs
{
    public class WatchDeviceDto
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("address")]
        public string Address { get; set; } = string.Empty;

        [JsonPropertyName("rssi")]
        public short Rssi { get; set; }
    }
}
