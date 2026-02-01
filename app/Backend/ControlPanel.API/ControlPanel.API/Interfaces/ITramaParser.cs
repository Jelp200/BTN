/* ***************************************************************************
**  Archivo:   ITramaParser.cs
**  Proyecto:  ControlPanel.API (Botonera)
**  Version:   2.0.0
**  Autor(es):
**             Jorge E. Peña Paz
**             Salvador A. Zavala
**  Equipo:    Deprartamento de Computo - Gradus Technologies
**  Fecha:     Enero 2026
**  Descripcion:
**              Interfaz que define el contrato para un parser de tramas.
**              Cualquier clase que implemente esta interfaz debe proporcionar
**              una forma de convertir una trama cruda (string) en una lista
**              de objetos SensorData.
*************************************************************************** */
using ControlPanel.API.Models;

namespace ControlPanel.API.Interfaces
{
    public interface ITramaParser
    {
        /* 
         * Método que recibe la trama en formato de texto y devuelve una lista de
         * objetos SensorData.
        */
        List<SensorData> Parse(string rawTrama);
    }
}