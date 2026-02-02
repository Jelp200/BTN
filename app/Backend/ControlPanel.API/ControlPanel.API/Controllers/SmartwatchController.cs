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

        [HttpGet("vitals/latest")]
        public IActionResult GetLatestVitals()
        {
            var vitals = _smartwatchService.GetLatestVitals();
            if (vitals == null)
            {
                return Ok(new { success = false, message = "Sin datos biométricos disponibles.", data = (object?)null });
            }

            return Ok(new { success = true, data = vitals });
        }

        [HttpGet("vitals/history")]
        public IActionResult GetVitalsHistory([FromQuery] int limit = 60)
        {
            var data = _smartwatchService.GetRecentVitals(limit);
            return Ok(new { success = true, data });
        }

        /// <summary>
        /// Start SpO2 (blood oxygen) monitoring
        /// Will collect 10 measurements over 60 seconds and then automatically stop
        /// </summary>
        [HttpPost("vitals/start-spo2")]
        public async Task<IActionResult> StartSpO2Monitoring()
        {
            try
            {
                var success = await _smartwatchService.StartSpO2MonitoringAsync(HttpContext.RequestAborted);
                
                if (success)
                {
                    return Ok(new { 
                        success = true, 
                        message = "Medición de SpO2 iniciada. Se tomarán 10 mediciones durante 60 segundos." 
                    });
                }
                
                return BadRequest(new { 
                    success = false, 
                    message = "No se pudo iniciar la medición de SpO2. Verifica que el reloj esté conectado." 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = $"Error al iniciar medición de SpO2: {ex.Message}" 
                });
            }
        }

        /// <summary>
        /// Start BPM (heart rate) monitoring
        /// Will collect 10 measurements over 60 seconds and then automatically stop
        /// </summary>
        [HttpPost("vitals/start-bpm")]
        public async Task<IActionResult> StartBpmMonitoring()
        {
            try
            {
                var success = await _smartwatchService.StartBpmMonitoringAsync(HttpContext.RequestAborted);
                
                if (success)
                {
                    return Ok(new { 
                        success = true, 
                        message = "Medición de BPM iniciada. Se tomarán 10 mediciones durante 60 segundos." 
                    });
                }
                
                return BadRequest(new { 
                    success = false, 
                    message = "No se pudo iniciar la medición de BPM. Verifica que el reloj esté conectado." 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = $"Error al iniciar medición de BPM: {ex.Message}" 
                });
            }
        }

        /// <summary>
        /// Start Temperature monitoring
        /// Will collect 10 measurements over 60 seconds and then automatically stop
        /// </summary>
        [HttpPost("vitals/start-temperature")]
        public async Task<IActionResult> StartTemperatureMonitoring()
        {
            try
            {
                var success = await _smartwatchService.StartTemperatureMonitoringAsync(HttpContext.RequestAborted);
                
                if (success)
                {
                    return Ok(new { 
                        success = true, 
                        message = "Medición de Temperatura iniciada. Se tomarán 10 mediciones durante 60 segundos." 
                    });
                }
                
                return BadRequest(new { 
                    success = false, 
                    message = "No se pudo iniciar la medición de Temperatura. Verifica que el reloj esté conectado." 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = $"Error al iniciar medición de Temperatura: {ex.Message}" 
                });
            }
        }

        /// <summary>
        /// Start Blood Pressure monitoring
        /// Will collect 10 measurements over 60 seconds and then automatically stop
        /// </summary>
        [HttpPost("vitals/start-bloodpressure")]
        public async Task<IActionResult> StartBloodPressureMonitoring()
        {
            try
            {
                var success = await _smartwatchService.StartBloodPressureMonitoringAsync(HttpContext.RequestAborted);
                
                if (success)
                {
                    return Ok(new { 
                        success = true, 
                        message = "Medición de Presión Arterial iniciada. Se tomarán 10 mediciones durante 60 segundos." 
                    });
                }
                
                return BadRequest(new { 
                    success = false, 
                    message = "No se pudo iniciar la medición de Presión Arterial. Verifica que el reloj esté conectado." 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = $"Error al iniciar medición de Presión Arterial: {ex.Message}" 
                });
            }
        }
    }
}