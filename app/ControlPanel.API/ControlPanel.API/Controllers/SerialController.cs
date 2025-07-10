// SerialController.cs

using Microsoft.AspNetCore.Mvc;
using System.IO.Ports;
using System.Collections.Concurrent;

namespace ControlPanel.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SerialController : ControllerBase
    {
        private static readonly ConcurrentDictionary<string, SerialPort> PuertosAbiertos = new();

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

                var serialPort = new SerialPort(portName, 9600);
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
                if (PuertosAbiertos.TryRemove(portName, out var serialPort))
                {
                    serialPort.Close();
                    return Ok($"Desconectado de {portName}");
                }

                return NotFound($"Puerto {portName} no estaba conectado");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error al desconectar: {ex.Message}");
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
    }

    public class TramaRequest
    {
        public string PortName { get; set; }
        public string Trama { get; set; }
    }
}