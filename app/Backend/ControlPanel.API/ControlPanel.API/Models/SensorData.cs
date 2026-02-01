/* ***************************************************************************
**  Archivo:   SensorData.cs
**  Proyecto:  ControlPanel.API (Botonera)
**  Version:   2.0.0
**  Autor(es):
**             Jorge E. Peña Paz
**             Salvador A. Zavala
**  Equipo:    Deprartamento de Computo - Gradus Technologies
**  Fecha:     Enero 2026
**  Descripcion:
**              Modelo que representa los datos de sensores provenientes de
**              las cabinas.
*************************************************************************** */
namespace ControlPanel.API.Models
{
    // CLASE DEL DOMINIO QUE REPRESENTA LOS DATOS DE LOS SENSORES PROVENIENTES DE LAS CABINAS
    public class SensorData
    {
        // ID de la cabina que envía los datos
        public string Cabina { get; set; } = string.Empty;

        // Coordenadas del acelerometro {X, Y, Z}
        public double X { get; set; }
        public double Y { get; set; }
        public double Z { get; set; }

        // Temperatura (T), Humedad (H), Radiación UV, CO2, Ozono (O3) y nivel de sonido (dB)
        public double T { get; set; }
        public double H { get; set; }
        public double UV { get; set; }
        public double CO2 { get; set; }
        public double O3 { get; set; }
        public double dB { get; set; }

        // Marca de tiempo en que se registró la medición.
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;  // Se asigna la hora actual en UTC al crear el objeto.

        // MÉTODO EL CUAL VALIDA SI LA INSTANCIA DE DATOS ES CONSISTENTE Y VÁLIDA
        public bool EsValido()
        {
            // La cabina no puede estar vacía o en blanco
            if (string.IsNullOrWhiteSpace(Cabina)) return false;

            // Reúne todos los valores numéricos en un arreglo
            var valores = new[] { X, Y, Z, T, H, UV, CO2, O3, dB };
            // Revisa que ninguno sea NaN (Not a Number) o infinito
            if (valores.Any(v => double.IsNaN(v) || double.IsInfinity(v))) return false;

            // Valida que el timestamp no sea demasiado "futuro" (+1 minuto) ni demasiado "pasado" (más de 1 hora atrás)
            if (Timestamp > DateTime.UtcNow.AddMinutes(1) || Timestamp < DateTime.UtcNow.AddHours(-1)) return false;

            // Si pasa todas las validaciones, se considera válido
            return true;
        }
    }
}