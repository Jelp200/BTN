using Microsoft.AspNetCore.Mvc;
using System.IO.Ports;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;

namespace ControlPanel.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SerialController : ControllerBase
    {
        private static readonly ConcurrentDictionary<string, SerialPort> PuertosAbiertos = new();
        private static readonly Queue<string> HistorialTramas = new();
        private static readonly Queue<SensorData> HistorialDatos = new();
        private static readonly object LockObj = new(); // Sincronización para acceso concurrente
        private const int MaxTramas = 7200;

        [HttpGet("ports")]
        public IActionResult GetAvailablePorts()
        {
            try
            {
                var ports = SerialPort.GetPortNames();
                return Ok(ports);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error al obtener puertos: {ex.Message}");
            }
        }

        [HttpPost("connect")]
        public IActionResult Connect([FromBody] string portName)
        {
            try
            {
                if (PuertosAbiertos.ContainsKey(portName))
                    return Ok("Ya conectado");

                var serialPort = new SerialPort(portName, 9600)
                {
                    Parity = Parity.None,
                    DataBits = 8,
                    StopBits = StopBits.One,
                    Handshake = Handshake.None
                };

                serialPort.DataReceived += (sender, e) =>
                {
                    try
                    {
                        var serial = (SerialPort)sender!;
                        string raw = serial.ReadLine().Trim();

                        var datosParseados = TramaParser.Parse(raw);

                        lock (LockObj)
                        {
                            foreach (var dato in datosParseados)
                            {
                                if (HistorialDatos.Count >= MaxTramas)
                                    HistorialDatos.Dequeue();

                                HistorialDatos.Enqueue(dato);
                            }

                            if (!string.IsNullOrEmpty(raw))
                            {
                                if (HistorialTramas.Count >= MaxTramas)
                                    HistorialTramas.Dequeue();

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
                return Ok($"Conectado a {portName}");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error al conectar: {ex.Message}");
            }
        }

        [HttpPost("disconnect")]
        public IActionResult Disconnect([FromBody] string portName)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(portName))
                    return BadRequest("Nombre de puerto inválido.");

                if (PuertosAbiertos.TryRemove(portName, out var serialPort))
                {
                    if (serialPort.IsOpen)
                        serialPort.Close();

                    serialPort.Dispose();
                    return Ok($"🔌 Desconectado de {portName}");
                }

                return NotFound($"⚠️ El puerto {portName} no estaba conectado.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"❌ Error al desconectar: {ex.Message}");
            }
        }

        [HttpPost("send")]
        public IActionResult SendTrama([FromBody] TramaRequest request)
        {
            try
            {
                if (!PuertosAbiertos.TryGetValue(request.PortName, out var serialPort))
                    return NotFound("Puerto no conectado");

                serialPort.Write(request.Trama);
                return Ok($"Trama enviada: {request.Trama}");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error al enviar trama: {ex.Message}");
            }
        }

        [HttpGet("latest")]
        public IActionResult GetLatestTrama()
        {
            string? ultimaTrama = null;
            lock (LockObj)
            {
                if (HistorialTramas.Count > 0)
                    ultimaTrama = HistorialTramas.Last();
            }

            return string.IsNullOrWhiteSpace(ultimaTrama) ? NoContent() : Ok(ultimaTrama);
        }

        [HttpGet("historial")]
        public IActionResult GetAllTramas()
        {
            List<string> copia;
            lock (LockObj)
            {
                copia = HistorialTramas.ToList();
            }

            return Ok(copia);
        }

        [HttpGet("count")]
        public IActionResult GetTramaCount()
        {
            int count;
            lock (LockObj)
            {
                count = HistorialTramas.Count;
            }

            return Ok(new { Count = count });
        }

        [HttpGet("datos")]
        public IActionResult GetAllDatos()
        {
            List<SensorData> copia;
            lock (LockObj)
            {
                copia = HistorialDatos.ToList();
            }

            return Ok(copia);
        }

        [HttpGet("ultimo-dato")]
        public IActionResult GetUltimoDato()
        {
            SensorData? dato = null;
            lock (LockObj)
            {
                if (HistorialDatos.Count > 0)
                    dato = HistorialDatos.Last();
            }

            return dato == null ? NoContent() : Ok(dato);
        }

        [HttpGet("datos/c1")]
        public IActionResult GetDatosCabina1()
        {
            List<SensorData> copia;
            lock (LockObj)
            {
                copia = HistorialDatos.Where(d => d.Cabina == "C1").ToList();
            }
            return Ok(copia);
        }

        [HttpGet("datos/c2")]
        public IActionResult GetDatosCabina2()
        {
            List<SensorData> copia;
            lock (LockObj)
            {
                copia = HistorialDatos.Where(d => d.Cabina == "C2").ToList();
            }
            return Ok(copia);
        }

        [HttpGet("ultimo-dato/c1")]
        public IActionResult GetUltimoDatoCabina1()
        {
            SensorData? dato = null;
            lock (LockObj)
            {
                dato = HistorialDatos.LastOrDefault(d => d.Cabina == "C1");
            }
            return dato == null ? NoContent() : Ok(dato);
        }

        [HttpGet("ultimo-dato/c2")]
        public IActionResult GetUltimoDatoCabina2()
        {
            SensorData? dato = null;
            lock (LockObj)
            {
                dato = HistorialDatos.LastOrDefault(d => d.Cabina == "C2");
            }
            return dato == null ? NoContent() : Ok(dato);
        }

        [HttpGet("datos/c1/{sensor}")]
        public IActionResult GetDatosCabina1PorSensor(string sensor)
        {
            return GetDatosPorSensor("C1", sensor);
        }

        [HttpGet("datos/c2/{sensor}")]
        public IActionResult GetDatosCabina2PorSensor(string sensor)
        {
            return GetDatosPorSensor("C2", sensor);
        }

        private IActionResult GetDatosPorSensor(string cabina, string sensor)
        {
            List<object> resultados = new();

            lock (LockObj)
            {
                var datosFiltrados = HistorialDatos.Where(d => d.Cabina == cabina).ToList();

                foreach (var dato in datosFiltrados)
                {
                    double valor = sensor.ToUpper() switch
                    {
                        "X" => dato.X,
                        "Y" => dato.Y,
                        "Z" => dato.Z,
                        "T" => dato.T,
                        "H" => dato.H,
                        "UV" => dato.UV,
                        "CO2" => dato.CO2,
                        "O3" => dato.O3,
                        "DB" => dato.dB,
                        _ => double.NaN
                    };

                    resultados.Add(new
                    {
                        timestamp = DateTime.UtcNow, // Puedes mejorar esto si agregas un timestamp real
                        valor = valor
                    });
                }
            }

            return Ok(resultados);
        }
    }

    public class TramaRequest
    {
        public string PortName { get; set; } = string.Empty;
        public string Trama { get; set; } = string.Empty;
    }

    public class SensorData
    {
        public string Cabina { get; set; } = "";  // C1 o C2
        public double X { get; set; }
        public double Y { get; set; }
        public double Z { get; set; }
        public double T { get; set; }
        public double H { get; set; }
        public double UV { get; set; }
        public double CO2 { get; set; }
        public double O3 { get; set; }
        public double dB { get; set; }
    }

    public static class TramaParser
    {
        public static List<SensorData> Parse(string rawTrama)
        {
            var dataList = new List<SensorData>();

            var tramas = rawTrama.Split('C')
                                 .Where(t => !string.IsNullOrWhiteSpace(t))
                                 .ToArray();

            foreach (var trama in tramas)
            {
                string tramaLimpia = trama.Trim();
                if (tramaLimpia.Length < 2) continue;

                string cabina = "C" + tramaLimpia.Substring(0, 1); // "C1" o "C2"
                string contenido = tramaLimpia.Substring(1);      // El resto de la trama

                var partes = contenido.Split('|');
                var data = new SensorData { Cabina = cabina };

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
                    catch { /* Ignora errores de parsing */ }
                }

                dataList.Add(data);
            }

            return dataList;
        }
    }
}