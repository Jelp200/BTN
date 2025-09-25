using ControlPanel.API.Application;
using ControlPanel.API.Domain;
using System.IO.Ports;
using System.Collections.Concurrent;
using System.Threading.Tasks;
using System.Linq;

namespace ControlPanel.API.Infrastructure;

// Implementación del servicio serial que gestiona:
// - Conexión a puertos seriales
// - Recepción y almacenamiento de tramas
// - Conversión de tramas a objetos de dominio (SensorData)
public class SerialService : ISerialService
{
    // Diccionario concurrente para manejar múltiples puertos abiertos al mismo tiempo
    private static readonly ConcurrentDictionary<string, SerialPort> PuertosAbiertos = new();

    // Historial de tramas crudas (strings) recibidas
    private static readonly Queue<string> HistorialTramas = new();

    // Historial de datos ya parseados a objetos SensorData
    private static readonly Queue<SensorData> HistorialDatos = new();

    // Objeto para lock y evitar problemas de concurrencia en colecciones
    private static readonly object LockObj = new();

    // Máximo de tramas/datos que se almacenarán (evita consumo excesivo de memoria)
    private const int MaxTramas = 7200;

    // Parser para interpretar las tramas crudas y convertirlas a SensorData
    private readonly ITramaParser _parser;

    public SerialService(ITramaParser parser)
    {
        _parser = parser;
    }

    // Obtiene los puertos COM disponibles
    public async Task<string[]> GetAvailablePortsAsync()
    {
        return await Task.FromResult(SerialPort.GetPortNames());
    }

    // Conecta a un puerto y comienza a escuchar datos entrantes
    public async Task<string> ConnectAsync(string portName)
    {
        if (PuertosAbiertos.ContainsKey(portName))
            return "Ya conectado";

        var serialPort = new SerialPort(portName, 9600)
        {
            Parity = Parity.None,
            DataBits = 8,
            StopBits = StopBits.One,
            Handshake = Handshake.None
        };

        // Evento que se dispara cuando llegan datos por el puerto
        serialPort.DataReceived += (sender, e) =>
        {
            try
            {
                var serial = (SerialPort)sender!;
                string raw = serial.ReadLine()?.Trim() ?? "";
                var datosParseados = _parser.Parse(raw);

                lock (LockObj)
                {
                    // Guarda los datos parseados en historial (con límite máximo)
                    foreach (var dato in datosParseados)
                    {
                        if (HistorialDatos.Count >= MaxTramas) HistorialDatos.Dequeue();
                        HistorialDatos.Enqueue(dato);
                    }

                    // Guarda la trama cruda en historial
                    if (!string.IsNullOrEmpty(raw))
                    {
                        if (HistorialTramas.Count >= MaxTramas) HistorialTramas.Dequeue();
                        HistorialTramas.Enqueue(raw);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error al procesar trama: " + ex.Message);
            }
        };

        serialPort.Open();
        PuertosAbiertos[portName] = serialPort;

        return $"Conectado a {portName}";
    }

    // Desconecta un puerto y lo libera
    public async Task<string> DisconnectAsync(string portName)
    {
        if (string.IsNullOrWhiteSpace(portName))
            throw new ArgumentException("Nombre de puerto inválido.");

        if (PuertosAbiertos.TryRemove(portName, out var serialPort))
        {
            if (serialPort.IsOpen) serialPort.Close();
            serialPort.Dispose();
            return $"🔌 Desconectado de {portName}";
        }

        throw new InvalidOperationException($"⚠️ El puerto {portName} no estaba conectado.");
    }

    // Envía una trama al puerto especificado
    public async Task<string> SendTramaAsync(string portName, string trama)
    {
        if (!PuertosAbiertos.TryGetValue(portName, out var serialPort))
            throw new InvalidOperationException("Puerto no conectado");

        serialPort.Write(trama);
        return $"Trama enviada: {trama}";
    }

    // Devuelve la última trama cruda recibida
    public async Task<string?> GetLatestTramaAsync()
    {
        lock (LockObj)
        {
            return HistorialTramas.Count > 0 ? HistorialTramas.Last() : null;
        }
    }

    // Devuelve todas las tramas recibidas
    public async Task<List<string>> GetAllTramasAsync()
    {
        lock (LockObj)
        {
            return HistorialTramas.ToList();
        }
    }

    // Devuelve la cantidad total de tramas almacenadas
    public async Task<int> GetTramaCountAsync()
    {
        int count;
        lock (LockObj)
        {
            count = HistorialTramas.Count;
        }
        return await Task.FromResult(count);
    }

    // Devuelve la cantidad de datos pertenecientes a una cabina en particular
    public async Task<int> GetTramaCountByCabinaAsync(string cabina)
    {
        lock (LockObj)
        {
            return HistorialDatos.Count(d => d.Cabina.Equals(cabina, StringComparison.OrdinalIgnoreCase));
        }
    }

    // Devuelve todos los datos parseados (SensorData)
    public async Task<List<SensorData>> GetAllDatosAsync()
    {
        lock (LockObj)
        {
            return HistorialDatos.ToList();
        }
    }

    // Devuelve el último dato válido
    public async Task<SensorData?> GetUltimoDatoAsync()
    {
        lock (LockObj)
        {
            return HistorialDatos.Reverse().FirstOrDefault(d => d.EsValido());
        }
    }

    // Devuelve el último dato válido de una cabina específica
    public async Task<SensorData?> GetUltimoDatoPorCabinaAsync(string cabina)
    {
        lock (LockObj)
        {
            return HistorialDatos
                .Where(d => d.Cabina.Equals(cabina, StringComparison.OrdinalIgnoreCase))
                .Reverse()
                .FirstOrDefault(d => d.EsValido());
        }
    }

    // Devuelve los valores de un sensor específico (ej. temperatura, CO2, etc.) para una cabina
    public async Task<List<object>> GetDatosPorSensorAsync(string cabina, string sensor)
    {
        lock (LockObj)
        {
            var datosFiltrados = HistorialDatos
                .Where(d => d.Cabina.Equals(cabina, StringComparison.OrdinalIgnoreCase))
                .ToList();

            return datosFiltrados.Select(d => new
            {
                timestamp = d.Timestamp,
                valor = sensor.ToUpper() switch
                {
                    "X" => d.X,
                    "Y" => d.Y,
                    "Z" => d.Z,
                    "T" => d.T,
                    "H" => d.H,
                    "UV" => d.UV,
                    "CO2" => d.CO2,
                    "O3" => d.O3,
                    "DB" => d.dB,
                    _ => double.NaN // Si el sensor no coincide, devuelve NaN
                }
            }).Cast<object>().ToList();
        }
    }

    // Limpia los historiales de tramas y datos
    public async Task LimpiarHistorialAsync()
    {
        lock (LockObj)
        {
            HistorialTramas.Clear();
            HistorialDatos.Clear();
        }
    }

    // Procesa las últimas tramas reales y devuelve un objeto con resultados enriquecidos
    public async Task<object> ProcesarTramaRealAsync()
    {
        lock (LockObj)
        {
            if (HistorialTramas.Count == 0)
            {
                return new { Message = "No hay tramas reales recibidas aún", HasData = false, LastReceived = DateTime.UtcNow };
            }

            // Toma las últimas tramas de las cabinas C1 y C2
            var ultimasTramas = HistorialTramas
                .Where(t => t.Contains("C1|") || t.Contains("C2|"))
                .TakeLast(2)
                .ToList();

            if (!ultimasTramas.Any())
            {
                return new { Message = "No se encontraron tramas válidas", HasData = false, LastReceived = DateTime.UtcNow };
            }

            // Convierte cada trama en objetos con valores legibles
            var resultados = new List<object>();
            foreach (var trama in ultimasTramas)
            {
                var datos = _parser.Parse(trama);
                foreach (var dato in datos)
                {
                    resultados.Add(new
                    {
                        Cabina = dato.Cabina,
                        Timestamp = dato.Timestamp,
                        Valores = new { X = dato.X, Y = dato.Y, Z = dato.Z, T = dato.T, H = dato.H, UV = dato.UV, CO2 = dato.CO2, O3 = dato.O3, dB = dato.dB }
                    });
                }
            }

            // Devuelve un objeto anónimo con toda la información procesada
            return new
            {
                Message = "Datos reales procesados",
                HasData = true,
                Tramas = resultados,
                Count = resultados.Count,
                LastReceived = DateTime.UtcNow
            };
        }
    }
}
