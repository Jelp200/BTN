/* ***************************************************************************
**  Archivo:   ISerialService.cs
**  Proyecto:  ControlPanel.API (Botonera)
**  Version:   2.0.0
**  Autor(es):
**             Jorge E. Peña Paz
**             Salvador A. Zavala
**  Equipo:    Deprartamento de Computo - Gradus Technologies
**  Fecha:     Enero 2026
**  Descripcion:
**              Interfaz que define las operaciones para el servicio serial.
**              Separa el contrato (qué se puede hacer) de la implementación
**              (cómo se hace).
*************************************************************************** */
using System.Collections.Generic;
using System.Threading.Tasks;
using ControlPanel.API.Models;

namespace ControlPanel.API.Interfaces;

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
