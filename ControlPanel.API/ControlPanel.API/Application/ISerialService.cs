using System.Collections.Generic;
using System.Threading.Tasks;
using ControlPanel.API.Domain;

namespace ControlPanel.API.Application;

// Interfaz que define las operaciones que un servicio serial debe implementar.
// Separa el contrato (qué se puede hacer) de la implementación (cómo se hace).
public interface ISerialService
{
    // Obtiene la lista de puertos seriales disponibles en el sistema.
    Task<string[]> GetAvailablePortsAsync();

    // Conecta al puerto especificado por nombre (ej. "COM3").
    Task<string> ConnectAsync(string portName);

    // Desconecta el puerto especificado.
    Task<string> DisconnectAsync(string portName);

    // Envía una trama al puerto especificado.
    Task<string> SendTramaAsync(string portName, string trama);

    // Obtiene la última trama recibida (o null si no hay).
    Task<string?> GetLatestTramaAsync();

    // Obtiene todas las tramas recibidas.
    Task<List<string>> GetAllTramasAsync();

    // Devuelve la cantidad total de tramas recibidas.
    Task<int> GetTramaCountAsync();

    // Devuelve la cantidad de tramas asociadas a una cabina en particular.
    Task<int> GetTramaCountByCabinaAsync(string cabina);

    // Devuelve todos los datos de sensores parseados desde las tramas.
    Task<List<SensorData>> GetAllDatosAsync();

    // Devuelve el último dato válido recibido.
    Task<SensorData?> GetUltimoDatoAsync();

    // Devuelve el último dato válido de una cabina específica.
    Task<SensorData?> GetUltimoDatoPorCabinaAsync(string cabina);

    // Devuelve los valores de un sensor específico (ej. "T", "H", "CO2") para una cabina.
    Task<List<object>> GetDatosPorSensorAsync(string cabina, string sensor);

    // Limpia el historial de tramas y datos recibidos.
    Task LimpiarHistorialAsync();

    // Procesa las últimas tramas recibidas y devuelve un objeto con resultados interpretados.
    Task<object> ProcesarTramaRealAsync();
}

