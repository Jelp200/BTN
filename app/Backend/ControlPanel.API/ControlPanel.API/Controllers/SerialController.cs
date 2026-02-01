/* ***************************************************************************
**  Archivo:   SerialController.cs
**  Proyecto:  ControlPanel.API (Botonera)
**  Version:   2.0.0
**  Autor(es):
**             Jorge E. Peña Paz
**             Salvador A. Zavala
**  Equipo:    Deprartamento de Computo - Gradus Technologies
**  Fecha:     Enero 2026
**  Descripcion:
**              Controlador API REST para gestionar la comunicación serial.
*************************************************************************** */
using ControlPanel.API.Interfaces;
using ControlPanel.API.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace ControlPanel.API.Controllers;

// Decorador que indica que este controlador es una API REST
[ApiController]
// Define la ruta base: api/serial
[Route("api/[controller]")]
public class SerialController : ControllerBase
{
    // Servicio que encapsula la lógica de conexión y manejo del puerto serial
    private readonly ISerialService _serialService;

    // Inyección de dependencias: el controlador recibe el servicio a través del constructor
    public SerialController(ISerialService serialService)
    {
        _serialService = serialService;
    }

    // =============================================
    // PUERTOS DISPONIBLES
    // =============================================

    // GET: api/serial/ports
    // Devuelve la lista de puertos COM disponibles en el sistema
    [HttpGet("ports")]
    public async Task<IActionResult> GetAvailablePorts()
    {
        try
        {
            var ports = await _serialService.GetAvailablePortsAsync();
            return Ok(ports); // Respuesta HTTP 200 con los puertos
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error al obtener puertos: {ex.Message}");
        }
    }

    // =============================================
    // CONECTAR Y DESCONECTAR
    // =============================================

    // POST: api/serial/connect
    // Conecta un puerto serial
    [HttpPost("connect")]
    public async Task<IActionResult> Connect([FromBody] string portName)
    {
        try
        {
            var result = await _serialService.ConnectAsync(portName);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error al conectar: {ex.Message}");
        }
    }

    // POST: api/serial/disconnect
    // Desconecta un puerto serial
    [HttpPost("disconnect")]
    public async Task<IActionResult> Disconnect([FromBody] string portName)
    {
        try
        {
            var result = await _serialService.DisconnectAsync(portName);
            return Ok(result);
        }
        // Manejo de errores más específico
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(ex.Message);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"❌ Error al desconectar: {ex.Message}");
        }
    }

    // =============================================
    // ENVIAR TRAMAS
    // =============================================

    // POST: api/serial/send
    // Envía una trama a un puerto serial
    [HttpPost("send")]
    public async Task<IActionResult> SendTrama([FromBody] TramaRequest request)
    {
        // Validación de entrada
        if (string.IsNullOrWhiteSpace(request?.PortName) || string.IsNullOrWhiteSpace(request?.Trama))
        {
            return BadRequest("PortName y Trama son requeridos.");
        }

        try
        {
            var result = await _serialService.SendTramaAsync(request.PortName, request.Trama);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error al enviar trama: {ex.Message}");
        }
    }

    // =============================================
    // HISTORIAL DE TRAMAS
    // =============================================

    // GET: api/serial/latest
    // Devuelve la última trama recibida
    [HttpGet("latest")]
    public async Task<IActionResult> GetLatestTrama()
    {
        var ultimaTrama = await _serialService.GetLatestTramaAsync();
        return string.IsNullOrWhiteSpace(ultimaTrama) ? NoContent() : Ok(ultimaTrama);
    }

    // GET: api/serial/historial
    // Devuelve todas las tramas almacenadas
    [HttpGet("historial")]
    public async Task<IActionResult> GetAllTramas()
    {
        var tramas = await _serialService.GetAllTramasAsync();
        return Ok(tramas);
    }

    // GET: api/serial/count
    // Devuelve el conteo total de tramas recibidas
    [HttpGet("count")]
    public async Task<IActionResult> GetTramaCount()
    {
        var count = await _serialService.GetTramaCountAsync();
        return Ok(new { Count = count });
    }

    // GET: api/serial/count/c1
    // Devuelve el conteo de tramas solo para la cabina C1
    [HttpGet("count/c1")]
    public async Task<IActionResult> GetTramaCountCabina1()
    {
        var count = await _serialService.GetTramaCountByCabinaAsync("C1");
        return Ok(new { Count = count });
    }

    // GET: api/serial/count/c2
    // Devuelve el conteo de tramas solo para la cabina C2
    [HttpGet("count/c2")]
    public async Task<IActionResult> GetTramaCountCabina2()
    {
        var count = await _serialService.GetTramaCountByCabinaAsync("C2");
        return Ok(new { Count = count });
    }

    // GET: api/serial/count/{cabina}
    // Devuelve el conteo de datos de una cabina específica
    [HttpGet("count/{cabina}")]
    public async Task<IActionResult> GetDataCountByCabina(string cabina)
    {
        var count = await _serialService.GetTramaCountByCabinaAsync(cabina);
        return Ok(new { count = count });
    }

    // =============================================
    // DATOS DE SENSORES
    // =============================================

    // GET: api/serial/datos
    // Devuelve todos los datos de sensores almacenados
    [HttpGet("datos")]
    public async Task<IActionResult> GetAllDatos()
    {
        var datos = await _serialService.GetAllDatosAsync();
        return Ok(datos);
    }

    // GET: api/serial/ultimo-dato
    // Devuelve el último dato de sensor recibido
    [HttpGet("ultimo-dato")]
    public async Task<IActionResult> GetUltimoDato()
    {
        var dato = await _serialService.GetUltimoDatoAsync();
        return dato == null ? NotFound(new { mensaje = "VACIO" }) : Ok(dato);
    }

    // GET: api/serial/datos/c1
    // Devuelve todos los datos de la cabina C1
    [HttpGet("datos/c1")]
    public async Task<IActionResult> GetDatosCabina1()
    {
        var datos = await _serialService.GetAllDatosAsync();
        var resultado = datos.Where(d => d.Cabina == "C1").Select(d => new
        {
            cabina = d.Cabina,
            timestamp = d.Timestamp,
            x = d.X,
            y = d.Y,
            z = d.Z,
            t = d.T,
            h = d.H,
            uv = d.UV,
            cO2 = d.CO2,
            o3 = d.O3,
            dB = d.dB
        }).ToList();
        return Ok(resultado);
    }

    // GET: api/serial/datos/c2
    // Devuelve todos los datos de la cabina C2
    [HttpGet("datos/c2")]
    public async Task<IActionResult> GetDatosCabina2()
    {
        var datos = await _serialService.GetAllDatosAsync();
        var resultado = datos.Where(d => d.Cabina == "C2").Select(d => new
        {
            cabina = d.Cabina,
            timestamp = d.Timestamp,
            x = d.X,
            y = d.Y,
            z = d.Z,
            t = d.T,
            h = d.H,
            uv = d.UV,
            cO2 = d.CO2,
            o3 = d.O3,
            dB = d.dB
        }).ToList();
        return Ok(resultado);
    }

    // GET: api/serial/ultimo-dato/c1
    // Devuelve el último dato recibido de la cabina C1
    [HttpGet("ultimo-dato/c1")]
    public async Task<IActionResult> GetUltimoDatoCabina1()
    {
        var dato = await _serialService.GetUltimoDatoPorCabinaAsync("C1");
        if (dato == null)
            return NotFound(new { success = "false", message = "No hay datos válidos para la cabina C1." });

        return Ok(dato);
    }

    // GET: api/serial/ultimo-dato/c2
    // Devuelve el último dato recibido de la cabina C2
    [HttpGet("ultimo-dato/c2")]
    public async Task<IActionResult> GetUltimoDatoCabina2()
    {
        var dato = await _serialService.GetUltimoDatoPorCabinaAsync("C2");
        if (dato == null)
            return NotFound(new { success = "false", message = "No hay datos válidos para la cabina C2." });

        return Ok(dato);
    }

    // =============================================
    // FILTRAR POR SENSOR
    // =============================================

    // GET: api/serial/datos/c1/{sensor}
    // Devuelve datos de la cabina C1 filtrados por un sensor específico
    [HttpGet("datos/c1/{sensor}")]
    public async Task<IActionResult> GetDatosCabina1PorSensor(string sensor) =>
        await GetDatosPorSensorAsync("C1", sensor);

    // GET: api/serial/datos/c2/{sensor}
    // Devuelve datos de la cabina C2 filtrados por un sensor específico
    [HttpGet("datos/c2/{sensor}")]
    public async Task<IActionResult> GetDatosCabina2PorSensor(string sensor) =>
        await GetDatosPorSensorAsync("C2", sensor);

    // Método privado de apoyo para filtrar datos por cabina y sensor
    private async Task<IActionResult> GetDatosPorSensorAsync(string cabina, string sensor)
    {
        var resultados = await _serialService.GetDatosPorSensorAsync(cabina, sensor);
        return Ok(resultados);
    }

    // =============================================
    // UTILIDADES
    // =============================================

    // POST: api/serial/limpiar
    // Limpia el historial de tramas y datos almacenados
    [HttpPost("limpiar")]
    public async Task<IActionResult> LimpiarHistorial()
    {
        await _serialService.LimpiarHistorialAsync();
        return Ok("Historial limpiado");
    }

    // GET: api/serial/procesar-trama-real
    // Procesa una trama en tiempo real desde el puerto conectado
    [HttpGet("procesar-trama-real")]
    public async Task<IActionResult> ProcesarTramaReal()
    {
        var resultado = await _serialService.ProcesarTramaRealAsync();
        return Ok(resultado);
    }
}