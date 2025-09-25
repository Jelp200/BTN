namespace ControlPanel.API.Domain
{
    /*
     * Interfaz que define el contrato para un parser de tramas. Cualquier clase
     * que implemente esta interfaz debe proporcionar una forma de convertir una
     * trama cruda (string) en una lista de objetos SensorData.
    */
    public interface ITramaParser
    {
        /* 
         * Método que recibe la trama en formato de texto y devuelve una lista de
         * objetos SensorData.
        */
        List<SensorData> Parse(string rawTrama);
    }
}
