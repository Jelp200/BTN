using ControlPanel.API.Application;
using ControlPanel.API.Domain;
using ControlPanel.API.Infrastructure;
using Microsoft.Extensions.FileProviders;
using System.IO;

var builder = WebApplication.CreateBuilder(args);

// === Configuración de Clean Architecture: Inyección de Dependencias ===
builder.Services.AddSingleton<ITramaParser, TramaParser>();
builder.Services.AddSingleton<ISerialService, SerialService>();

// === Configuración existente ===

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
    throw new DirectoryNotFoundException($"La carpeta del frontend no se encontró en: {frontendDistPath}");
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