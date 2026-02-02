/* ***************************************************************************
**  Archivo:   Program.cs
**  Proyecto:  ControlPanel.API (Botonera)
**  Version:   2.0.0
**  Autor(es):
**             Jorge E. Peña Paz
**             Salvador A. Zavala
**  Equipo:    Deprartamento de Computo - Gradus Technologies
**  Fecha:     Enero 2026
*************************************************************************** */
using ControlPanel.API.Interfaces;
using ControlPanel.API.Services;
using ControlPanel.API.Bluetooth;
using Microsoft.Extensions.FileProviders;
using System.IO;

var builder = WebApplication.CreateBuilder(args);

// ======================= INYECCION DE DEPENDENCIAS =======================
// Serial Services
builder.Services.AddSingleton<ITramaParser, TramaParser>();
builder.Services.AddSingleton<ISerialService, SerialService>();

// Smartwatch Services
builder.Services.AddSingleton<IBleScanner, BleScanner>();
builder.Services.AddSingleton<IBleConnector, BleConnector>();
builder.Services.AddSingleton<SessionLogger>();
builder.Services.AddSingleton<ISmartwatchService, SmartwatchService>();

// ======================== CONFIGURACION EXISTENTE ========================
// Habilitar CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

builder.Services.AddControllers();

var app = builder.Build();

// Ruta a la carpeta 'dist' del frontend (wwwroot)
var frontendDistPath = Path.GetFullPath(Path.Combine(
    Directory.GetCurrentDirectory(),
    "wwwroot"
));

// Validar que la carpeta exista
if (!Directory.Exists(frontendDistPath))
{
    throw new DirectoryNotFoundException($"Carpeta frontend no se encontro en: {frontendDistPath}");
}

// Middleware en orden correcto

// 1. CORS
app.UseCors("AllowAll");

// 2. Archivos por defecto (index.html)
app.UseDefaultFiles(new DefaultFilesOptions
{
    FileProvider = new PhysicalFileProvider(frontendDistPath)
});

// 3. Archivos estáticos (CSS, JS, imágenes, etc.)
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(frontendDistPath),
    RequestPath = ""
});

// 4. Mapear controladores (API)
app.MapControllers();

// 5. Fallback para SPA
app.MapFallbackToFile("index.html");

// Ejecutar en el puerto especificado
app.Run("http://localhost:5000");