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
using ControlPanel.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace ControlPanel.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SmartwatchController : ControllerBase
    {
        private readonly ISmartwatchService _smartwatchService;
        private readonly BiometricExportService _exportService;

        public SmartwatchController(ISmartwatchService smartwatchService)
        {
            _smartwatchService = smartwatchService;
            _exportService = new BiometricExportService();
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
        /// Get current monitoring status - returns which measurements are currently active
        /// </summary>
        [HttpGet("vitals/monitoring-status")]
        public IActionResult GetMonitoringStatus()
        {
            var status = _smartwatchService.GetMonitoringStatus();
            return Ok(new { success = true, status });
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

        /// <summary>
        /// Exportar datos biométricos a Excel
        /// </summary>
        [HttpPost("export/excel")]
        public IActionResult ExportBiometricsToExcel([FromBody] BiometricExportRequest request)
        {
            try
            {
                if (request == null || !request.Vitals.Any())
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "No hay datos para exportar." 
                    });
                }

                var cabin = request.Cabin ?? "1";
                var measurementType = request.MeasurementType ?? "Completo";

                var filePath = measurementType == "Completo" 
                    ? _exportService.ExportAllBiometrics(request.Vitals, cabin)
                    : _exportService.ExportToExcel(request.Vitals, cabin, measurementType);

                return Ok(new { 
                    success = true, 
                    message = "Datos exportados correctamente a Excel.",
                    filePath = filePath,
                    fileName = Path.GetFileName(filePath)
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = $"Error al exportar datos: {ex.Message}" 
                });
            }
        }

        /// <summary>
        /// Descargar archivo Excel exportado
        /// </summary>
        [HttpGet("export/download")]
        public IActionResult DownloadExport([FromQuery] string fileName)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(fileName))
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "Nombre de archivo no proporcionado." 
                    });
                }

                var exportsDir = _exportService.GetExportsDirectory();
                var filePath = Path.Combine(exportsDir, fileName);

                // Validar que el archivo existe y está en el directorio correcto
                if (!System.IO.File.Exists(filePath) || !Path.GetFullPath(filePath).StartsWith(Path.GetFullPath(exportsDir)))
                {
                    return NotFound(new { 
                        success = false, 
                        message = "Archivo no encontrado." 
                    });
                }

                var fileBytes = System.IO.File.ReadAllBytes(filePath);
                return this.File(fileBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = $"Error al descargar archivo: {ex.Message}" 
                });
            }
        }
    }
}