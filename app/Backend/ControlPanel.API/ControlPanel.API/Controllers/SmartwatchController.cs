/* ***************************************************************************
**  Archivo:   SmartwatchController.cs
**  Proyecto:  ControlPanel.API (Botonera)
**  Version:   2.0.0
**  Autor(es):
**             Jorge E. Peña Paz
**             Salvador A. Zavala
**  Equipo:    Deprartamento de Computo - Gradus Technologies
**  Fecha:     Enero 2026
**  Descripcion:
**              Controlador API REST para gestionar la comunicación con
**              smartwatches.
*************************************************************************** */
using ControlPanel.API.DTOs;
using ControlPanel.API.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace ControlPanel.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SmartwatchController : ControllerBase
    {
        private readonly ISmartwatchService _smartwatchService;

        public SmartwatchController(ISmartwatchService smartwatchService)
        {
            _smartwatchService = smartwatchService;
        }

        [HttpPost("connect")]
        public async Task<IActionResult> Connect([FromBody] SmartwatchConnectRequest? request)
        {
            var deviceName = string.IsNullOrWhiteSpace(request?.DeviceName) ? "ET570" : request.DeviceName.Trim();
            var timeout = request?.ScanTimeoutMs is > 0 ? request.ScanTimeoutMs.Value : 15000;

            var result = await _smartwatchService.ConnectAsync(deviceName, timeout, HttpContext.RequestAborted);

            var response = new SmartwatchConnectResponse
            {
                Success = result.Success,
                Message = result.Message,
                Device = result.Device
            };

            return result.Success ? Ok(response) : BadRequest(response);
        }

        [HttpPost("disconnect")]
        public async Task<IActionResult> Disconnect()
        {
            var result = await _smartwatchService.DisconnectAsync(HttpContext.RequestAborted);

            var response = new SmartwatchDisconnectResponse
            {
                Success = result.Success,
                Message = result.Message
            };

            return result.Success ? Ok(response) : BadRequest(response);
        }
    }
}