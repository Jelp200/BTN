// Controllers/ActuatorController.cs
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
public class ActuatorController : ControllerBase
{
    private static double sensorValue = 0;
    [HttpPost("{id}")]
    public IActionResult Activate(int id)
    {
        // Simulación: incrementa sensorValue y retorna estado
        sensorValue += id * 1.23;
        return Ok(new { Activated = id });
    }
    [HttpGet("sensors")]
    public IActionResult GetSensors()
    {
        return Ok(new { Value = sensorValue, Timestamp = DateTime.UtcNow });
    }
}