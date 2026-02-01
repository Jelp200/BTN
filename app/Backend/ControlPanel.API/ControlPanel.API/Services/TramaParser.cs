/* ***************************************************************************
**  Archivo:   TramaParser.cs
**  Proyecto:  ControlPanel.API (Botonera)
**  Version:   2.0.0
**  Autor(es):
**             Jorge E. Peña Paz
**             Salvador A. Zavala
**  Equipo:    Deprartamento de Computo - Gradus Technologies
**  Fecha:     Enero 2026
**  Descripcion:
**              Clase que implementa la interfaz ITramaParser para parsear. Su
**              responsabilidad es interpretar las tramas de texto que envían
**              las cabinas y convertirlas en objetos SensorData.
**
**              Formato de trama: C1|X:0.23|Y:0.42|Z:0.15|T:26.5|...
*************************************************************************** */
using ControlPanel.API.Models;
using ControlPanel.API.Interfaces;
using System;
using System.Linq;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace ControlPanel.API.Services;

public class TramaParser : ITramaParser
{
    // Implementación del método definido en la interfaz
    public List<SensorData> Parse(string rawTrama)
    {
        // Elimina espacios en blanco al inicio y al final de la trama
        var tramaLimpia = rawTrama.Trim();

        // Si la trama es muy corta, se devuelve una lista vacía
        if (tramaLimpia.Length < 2) return new();

        // Los dos primeros caracteres representan la cabina ("C1" o "C2")
        var cabina = tramaLimpia.Substring(0, 2);

        // El resto de la trama contiene las lecturas de sensores
        var contenido = tramaLimpia.Substring(2);

        // Divide la trama por el delimitador "|" y descarta las partes vacías
        var partes = contenido.Split('|')
            .Where(t => !string.IsNullOrWhiteSpace(t))
            .ToArray();

        // Crea un objeto SensorData con la cabina y el timestamp actual
        var data = new SensorData { Cabina = cabina, Timestamp = DateTime.UtcNow };

        // Recorre cada parte de la trama e intenta parsear los valores
        foreach (var parte in partes)
        {
            try
            {
                if (parte.StartsWith("X:")) data.X = double.Parse(parte[2..]);
                else if (parte.StartsWith("Y:")) data.Y = double.Parse(parte[2..]);
                else if (parte.StartsWith("Z:")) data.Z = double.Parse(parte[2..]);
                else if (parte.StartsWith("T:")) data.T = double.Parse(parte[2..]);
                else if (parte.StartsWith("H:")) data.H = double.Parse(parte[2..]);
                else if (parte.StartsWith("UV:")) data.UV = double.Parse(parte[3..]);
                else if (parte.StartsWith("CO2:")) data.CO2 = double.Parse(parte[4..]);
                else if (parte.StartsWith("O3:")) data.O3 = double.Parse(parte[3..]);
                else if (parte.StartsWith("dB:")) data.dB = double.Parse(parte[3..]);
            }
            catch { /* Ignorar errores de parseo */ }
        }

        // Devuelve la lista con un único objeto SensorData
        return new List<SensorData> { data };
    }
}