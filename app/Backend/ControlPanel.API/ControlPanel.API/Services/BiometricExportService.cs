using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using ControlPanel.API.Models;
using ClosedXML.Excel;

namespace ControlPanel.API.Services
{
    public class BiometricExportService
    {
        private readonly string _exportsDir;

        public BiometricExportService()
        {
            // Crear directorio de exports si no existe
            _exportsDir = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Exports");
            if (!Directory.Exists(_exportsDir))
            {
                Directory.CreateDirectory(_exportsDir);
            }
        }

        /// <summary>
        /// Exporta datos biométricos a un archivo Excel
        /// </summary>
        public string ExportToExcel(List<SmartwatchVitals> vitalsData, string cabin, string measurementType)
        {
            if (vitalsData == null || !vitalsData.Any())
            {
                throw new ArgumentException("No hay datos para exportar", nameof(vitalsData));
            }

            var fileName = GenerateFileName(cabin, measurementType);
            var filePath = Path.Combine(_exportsDir, fileName);

            using (var workbook = new XLWorkbook())
            {
                var worksheet = workbook.Worksheets.Add("Datos Biométricos");

                worksheet.Cell(1, 1).Value = $"Medición: {measurementType}";
                worksheet.Cell(1, 1).Style.Font.Bold = true;
                worksheet.Cell(1, 1).Style.Font.FontSize = 14;
                
                worksheet.Cell(2, 1).Value = $"Cabina: {cabin}";
                worksheet.Cell(2, 1).Style.Font.Bold = true;

                worksheet.Cell(3, 1).Value = $"Fecha de Exportación: {DateTime.Now:dd/MM/yyyy HH:mm:ss}";
                
                // Encabezados de columnas
                int row = 5;
                worksheet.Cell(row, 1).Value = "Timestamp (UTC)";
                worksheet.Cell(row, 2).Value = "BPM";
                worksheet.Cell(row, 3).Value = "SpO2 (%)";
                worksheet.Cell(row, 4).Value = "Temperatura (°C)";
                worksheet.Cell(row, 5).Value = "Sistólica (mmHg)";
                worksheet.Cell(row, 6).Value = "Diastólica (mmHg)";

                // Estilo encabezados
                var headerRange = worksheet.Range(row, 1, row, 6);
                headerRange.Style.Font.Bold = true;
                headerRange.Style.Fill.BackgroundColor = XLColor.LightGray;
                headerRange.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

                // Llenar datos
                row = 6;
                foreach (var vital in vitalsData)
                {
                    worksheet.Cell(row, 1).Value = vital.TimestampUtc.ToString("dd/MM/yyyy HH:mm:ss.fff");
                    worksheet.Cell(row, 2).Value = vital.PulseBpm.HasValue ? vital.PulseBpm.Value : "";
                    worksheet.Cell(row, 3).Value = vital.SpO2.HasValue ? vital.SpO2.Value : "";
                    worksheet.Cell(row, 4).Value = vital.TemperatureC.HasValue ? vital.TemperatureC.Value : "";
                    worksheet.Cell(row, 5).Value = vital.Systolic.HasValue ? vital.Systolic.Value : "";
                    worksheet.Cell(row, 6).Value = vital.Diastolic.HasValue ? vital.Diastolic.Value : "";

                    for (int col = 2; col <= 6; col++)
                    {
                        worksheet.Cell(row, col).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                    }

                    row++;
                }

                worksheet.Column(1).Width = 25;
                worksheet.Column(2).Width = 12;
                worksheet.Column(3).Width = 12;
                worksheet.Column(4).Width = 15;
                worksheet.Column(5).Width = 15;
                worksheet.Column(6).Width = 15;

                // Estadísticas
                row += 2;
                worksheet.Cell(row, 1).Value = "Estadísticas:";
                worksheet.Cell(row, 1).Style.Font.Bold = true;

                row++;
                var bpmValues = vitalsData.Where(v => v.PulseBpm.HasValue && v.PulseBpm > 0).Select(v => v.PulseBpm.Value).ToList();
                if (bpmValues.Any())
                {
                    worksheet.Cell(row, 1).Value = "BPM Promedio:";
                    worksheet.Cell(row, 2).Value = bpmValues.Average();
                    row++;
                    worksheet.Cell(row, 1).Value = "BPM Máximo:";
                    worksheet.Cell(row, 2).Value = bpmValues.Max();
                    row++;
                    worksheet.Cell(row, 1).Value = "BPM Mínimo:";
                    worksheet.Cell(row, 2).Value = bpmValues.Min();
                    row++;
                }

                var spo2Values = vitalsData.Where(v => v.SpO2.HasValue && v.SpO2 > 0).Select(v => v.SpO2.Value).ToList();
                if (spo2Values.Any())
                {
                    worksheet.Cell(row, 1).Value = "SpO2 Promedio (%):";
                    worksheet.Cell(row, 2).Value = spo2Values.Average();
                    row++;
                    worksheet.Cell(row, 1).Value = "SpO2 Máximo (%):";
                    worksheet.Cell(row, 2).Value = spo2Values.Max();
                    row++;
                    worksheet.Cell(row, 1).Value = "SpO2 Mínimo (%):";
                    worksheet.Cell(row, 2).Value = spo2Values.Min();
                    row++;
                }

                var tempValues = vitalsData.Where(v => v.TemperatureC.HasValue && v.TemperatureC > 0).Select(v => v.TemperatureC.Value).ToList();
                if (tempValues.Any())
                {
                    worksheet.Cell(row, 1).Value = "Temp. Promedio (°C):";
                    worksheet.Cell(row, 2).Value = tempValues.Average();
                    row++;
                    worksheet.Cell(row, 1).Value = "Temp. Máxima (°C):";
                    worksheet.Cell(row, 2).Value = tempValues.Max();
                    row++;
                    worksheet.Cell(row, 1).Value = "Temp. Mínima (°C):";
                    worksheet.Cell(row, 2).Value = tempValues.Min();
                }

                workbook.SaveAs(filePath);
            }

            Console.WriteLine($"[EXPORT] ✅ Archivo Excel exportado: {filePath}");
            return filePath;
        }

        /// <summary>
        /// Exporta todos los datos biométricos disponibles en un único archivo
        /// </summary>
        public string ExportAllBiometrics(List<SmartwatchVitals> vitalsData, string cabin)
        {
            if (vitalsData == null || !vitalsData.Any())
            {
                throw new ArgumentException("No hay datos para exportar", nameof(vitalsData));
            }

            var fileName = $"Biometricos_Cabina{cabin}_{DateTime.Now:yyyy-MM-dd_HHmmss}.xlsx";
            var filePath = Path.Combine(_exportsDir, fileName);

            using (var workbook = new XLWorkbook())
            {
                var worksheet = workbook.Worksheets.Add("Todos los Datos");

                worksheet.Cell(1, 1).Value = "Datos Biométricos Completos";
                worksheet.Cell(1, 1).Style.Font.Bold = true;
                worksheet.Cell(1, 1).Style.Font.FontSize = 14;
                
                worksheet.Cell(2, 1).Value = $"Cabina: {cabin}";
                worksheet.Cell(2, 1).Style.Font.Bold = true;
                
                worksheet.Cell(3, 1).Value = $"Registros totales: {vitalsData.Count}";
                worksheet.Cell(4, 1).Value = $"Fecha de Exportación: {DateTime.Now:dd/MM/yyyy HH:mm:ss}";

                int row = 6;
                worksheet.Cell(row, 1).Value = "Timestamp (UTC)";
                worksheet.Cell(row, 2).Value = "BPM";
                worksheet.Cell(row, 3).Value = "SpO2 (%)";
                worksheet.Cell(row, 4).Value = "Temperatura (°C)";
                worksheet.Cell(row, 5).Value = "Sistólica (mmHg)";
                worksheet.Cell(row, 6).Value = "Diastólica (mmHg)";

                var headerRange = worksheet.Range(row, 1, row, 6);
                headerRange.Style.Font.Bold = true;
                headerRange.Style.Fill.BackgroundColor = XLColor.LightGray;
                headerRange.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

                row = 7;
                foreach (var vital in vitalsData)
                {
                    worksheet.Cell(row, 1).Value = vital.TimestampUtc.ToString("dd/MM/yyyy HH:mm:ss.fff");
                    worksheet.Cell(row, 2).Value = vital.PulseBpm.HasValue && vital.PulseBpm > 0 ? vital.PulseBpm.Value : "";
                    worksheet.Cell(row, 3).Value = vital.SpO2.HasValue && vital.SpO2 > 0 ? vital.SpO2.Value : "";
                    worksheet.Cell(row, 4).Value = vital.TemperatureC.HasValue && vital.TemperatureC > 0 ? vital.TemperatureC.Value : "";
                    worksheet.Cell(row, 5).Value = vital.Systolic.HasValue && vital.Systolic > 0 ? vital.Systolic.Value : "";
                    worksheet.Cell(row, 6).Value = vital.Diastolic.HasValue && vital.Diastolic > 0 ? vital.Diastolic.Value : "";

                    for (int col = 2; col <= 6; col++)
                    {
                        worksheet.Cell(row, col).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                    }

                    row++;
                }

                worksheet.Column(1).Width = 25;
                worksheet.Column(2).Width = 12;
                worksheet.Column(3).Width = 12;
                worksheet.Column(4).Width = 15;
                worksheet.Column(5).Width = 15;
                worksheet.Column(6).Width = 15;

                workbook.SaveAs(filePath);
            }

            Console.WriteLine($"[EXPORT] ✅ Archivo Excel completo exportado: {filePath}");
            return filePath;
        }

        private string GenerateFileName(string cabin, string measurementType)
        {
            var timestamp = DateTime.Now.ToString("yyyy-MM-dd_HHmmss");
            return $"{measurementType}_Cabina{cabin}_{timestamp}.xlsx";
        }

        public string GetExportsDirectory()
        {
            return _exportsDir;
        }
    }
}
