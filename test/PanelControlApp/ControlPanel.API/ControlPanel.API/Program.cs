var builder = WebApplication.CreateBuilder(args);

// Habilita CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:4321")
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

builder.Services.AddControllers();

var app = builder.Build();

app.UseCors("AllowFrontend"); // Aplica la política globalmente

app.MapControllers();

app.Run("http://localhost:5000");
