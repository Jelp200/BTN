# Mejoras Pendientes — ControlPanel (Botonera)

**Proyecto:** ControlPanel API · Gradus Technologies
**Versión analizada:** 2.0.0
**Fecha de análisis:** 2026-03-29
**Elaborado por:** Análisis de seguridad y arquitectura previo al lanzamiento

> Este documento recoge los hallazgos y mejoras identificadas durante el análisis técnico de la aplicación que **no fueron implementados en el sprint de pre-lanzamiento**. Están organizados por categoría y priorizados para los primeros sprints post-lanzamiento.

---

## Tabla de contenido

1. [Mejoras críticas de seguridad](#1-mejoras-críticas-de-seguridad)
2. [Hallazgos de severidad alta](#2-hallazgos-de-severidad-alta)
3. [Hallazgos de severidad media](#3-hallazgos-de-severidad-media)
4. [Mejoras de funcionalidad y arquitectura](#4-mejoras-de-funcionalidad-y-arquitectura)
5. [Mejoras de UI/UX](#5-mejoras-de-uiux)

---

## 1. Mejoras críticas de seguridad

### 1.1 Autenticación y autorización en la API

**Severidad:** 🔴 Crítica
**Archivo(s):** `Program.cs`, todos los controllers

**Descripción:**
Ningún endpoint de la API requiere autenticación. Cualquier proceso local —o remoto si el puerto es expuesto— puede leer datos biométricos de pacientes, iniciar mediciones, enviar tramas seriales a actuadores o borrar el historial completo de sesión.

**Impacto:**
Acceso irrestricto a datos médicos (BPM, SpO2, presión arterial, temperatura), control total de actuadores físicos de cabina y destrucción de registros de sesión.

**Solución recomendada:**
Implementar autenticación basada en PIN de sesión usando `ASP.NET Core` con middleware de autorización. Al ser una aplicación desktop embebida (no multi-usuario en red), un PIN configurable por el operador al inicio de sesión es suficiente y no agrega fricción operativa. Se puede usar JWT con expiración corta almacenado en memoria (no en disco).

```
Sprint estimado: 1 sprint (5-8 días)
Complejidad: Media
```

---

### 1.2 Política CORS restrictiva

**Severidad:** 🔴 Crítica
**Archivo(s):** `Program.cs`, líneas 40-48

**Descripción:**
La política CORS está configurada como `AllowAnyOrigin / AllowAnyMethod / AllowAnyHeader`. Aunque la API corre en localhost, esta configuración permite que cualquier página web abierta en el navegador del sistema realice peticiones completas a la API.

**Código actual:**
```csharp
policy.AllowAnyOrigin()
      .AllowAnyMethod()
      .AllowAnyHeader();
```

**Solución recomendada:**
Restringir a los únicos orígenes legítimos. Dado que el frontend se sirve desde el mismo host, el origen debe ser exclusivamente `http://localhost:5000`.

```csharp
policy.WithOrigins("http://localhost:5000")
      .AllowAnyMethod()
      .AllowAnyHeader();
```

```
Sprint estimado: 0.5 días
Complejidad: Baja
```

---

### 1.3 HTTPS / TLS en comunicación local

**Severidad:** 🔴 Crítica
**Archivo(s):** `Program.cs`, línea 91

**Descripción:**
La API expone únicamente `http://localhost:5000`. Aunque es tráfico local, cualquier proceso en el sistema con permisos estándar (o herramientas de inspección HTTP como Fiddler/Proxyman) puede interceptar el contenido de las peticiones, incluyendo datos biométricos y comandos a actuadores.

**Impacto:**
Exposición de datos médicos en texto plano dentro del mismo equipo. Relevante en entornos con múltiples usuarios de sistema operativo.

**Solución recomendada:**
Habilitar HTTPS con un certificado autofirmado generado en instalación. .NET 10 provee herramientas para esto sin requerir una CA externa.

```bash
dotnet dev-certs https --export-path ./certs/localhost.pfx --password <password>
```

```csharp
app.Run("https://localhost:5001");
```

```
Sprint estimado: 1-2 días (incluye actualización de URLs en frontend)
Complejidad: Media
```

---

### 1.4 Contraseña Bluetooth hardcodeada

**Severidad:** 🔴 Crítica
**Archivo(s):** `SmartwatchService.cs`, línea ~712

**Descripción:**
La contraseña de autenticación BLE para el smartwatch H Band/ET570 está embebida directamente en el binario compilado como el valor `0x0000` ("0000"). Cualquier persona con el ejecutable y acceso a las UUIDs del protocolo puede autenticarse con el dispositivo en rango BLE (~10 metros) sin necesitar la aplicación.

**Impacto:**
Control no autorizado de la adquisición de datos biométricos del paciente directamente desde el reloj.

**Solución recomendada:**
Mover la contraseña a un archivo de configuración cifrado (`appsettings.json` con protección DPAPI en Windows, o un almacén seguro), configurable por el instalador o el administrador del sistema.

```json
{
  "Smartwatch": {
    "AuthPassword": "<cifrado con DPAPI>"
  }
}
```

```
Sprint estimado: 2-3 días
Complejidad: Media-Alta
```

---

## 2. Hallazgos de severidad alta

### 2.1 Sin rate limiting en endpoints de la API

**Severidad:** 🟠 Alta
**Archivo(s):** `Program.cs`

**Descripción:**
No existe ningún mecanismo de limitación de tasa. Los endpoints de escaneo BLE (`POST /api/smartwatch/connect`) y conexión serial son especialmente sensibles: un cliente malicioso puede saturarlos con llamadas repetidas, provocando que el sistema operativo no pueda completar escaneos Bluetooth legítimos o que el buffer serial se corrompa.

**Solución recomendada:**
Usar el middleware nativo de .NET 10 `Microsoft.AspNetCore.RateLimiting`:

```csharp
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("api", cfg =>
    {
        cfg.PermitLimit = 30;
        cfg.Window = TimeSpan.FromMinutes(1);
        cfg.QueueLimit = 0;
    });
});
app.UseRateLimiter();
```

```
Sprint estimado: 0.5 días
Complejidad: Baja
```

---

### 2.2 Persistencia cero de datos médicos

**Severidad:** 🟠 Alta
**Archivo(s):** `SerialService.cs`, `SmartwatchService.cs`

**Descripción:**
Todos los datos de sensores ambientales y signos vitales de pacientes existen exclusivamente en memoria RAM. Un cierre inesperado de la aplicación (fallo eléctrico, crash, reinicio del sistema), que no es infrecuente en entornos clínicos o industriales, destruye permanentemente todos los registros de la sesión.

**Impacto:**
Pérdida de datos biométricos de pacientes, imposibilidad de auditoría post-sesión, incumplimiento potencial de normativas de registro médico en varios países de Latinoamérica.

**Solución recomendada:**
Integrar SQLite embebido mediante `Microsoft.Data.Sqlite`. Es zero-config, sin servidor, y compatible con el modelo de despliegue actual (ejecutable desktop autocontenido).

```csharp
// En Program.cs
builder.Services.AddSqlite<SessionDbContext>("Data Source=session.db");
```

La migración de `ConcurrentQueue<SensorData>` y `List<SmartwatchVitals>` a tablas SQLite puede hacerse de forma incremental sin romper los contratos de la API.

```
Sprint estimado: 3-5 días
Complejidad: Media-Alta
Prioridad post-lanzamiento: #1
```

---

### 2.3 Proceso hijo sin verificación de integridad

**Severidad:** 🟠 Alta
**Archivo(s):** `HostApp/Form1.cs`

**Descripción:**
El host de escritorio (Windows Forms) lanza `ControlPanel.API.exe` como subproceso desde el directorio de instalación sin verificar la firma digital del ejecutable antes de iniciarlo. Un atacante con acceso de escritura al directorio de instalación puede reemplazar el binario.

**Impacto:**
Ejecución de código arbitrario con los privilegios del usuario que corre la aplicación, cada vez que el HostApp se inicie.

**Solución recomendada:**
Verificar la firma Authenticode del ejecutable antes de lanzarlo.

```csharp
var cert = X509Certificate.CreateFromSignedFile(apiExePath);
// Verificar thumbprint contra valor esperado hardcodeado o en config
if (cert.GetCertHashString() != ExpectedThumbprint)
    throw new SecurityException("Integridad del API comprometida.");
```

Esto requiere firmar los binarios con un certificado de código (Code Signing Certificate) en el proceso de build/release.

```
Sprint estimado: 2-3 días (incluye pipeline de firma)
Complejidad: Alta
```

---

## 3. Hallazgos de severidad media

### 3.1 Sin rotación de archivos de log

**Severidad:** 🟡 Media
**Archivo(s):** `Helpers/FileLogger.cs`

**Descripción:**
Los logs se escriben en un único archivo por sesión sin límite de tamaño ni política de retención. En sesiones largas o con alta frecuencia de eventos BLE, el archivo puede crecer varios cientos de MB. En instalaciones de uso continuo (varios días encendidas), el disco puede saturarse.

**Solución recomendada:**
Implementar rotación por tamaño (máx. 10 MB por archivo) y retención temporal (eliminar logs de más de 30 días). Alternativamente, integrar `Serilog` con su sink de archivo rodante, que maneja esto de forma nativa:

```csharp
Log.Logger = new LoggerConfiguration()
    .WriteTo.File("Logs/controlpanel-.log",
        rollingInterval: RollingInterval.Day,
        fileSizeLimitBytes: 10_000_000,
        retainedFileCountLimit: 30)
    .CreateLogger();
```

```
Sprint estimado: 1 día
Complejidad: Baja
```

---

### 3.2 Fallo silencioso en el parser de tramas seriales

**Severidad:** 🟡 Media
**Archivo(s):** `Services/TramaParser.cs`

**Descripción:**
Los errores de parseo de tramas se descartan completamente con un bloque `catch` vacío. Si un dispositivo malintencionado, con ruido eléctrico o con firmware defectuoso envía tramas malformadas de forma continua, el sistema no genera ningún rastro de ello. Esto dificulta el diagnóstico en campo y oculta posibles intentos de inyección de datos.

**Código actual:**
```csharp
catch { /* Ignorar errores de parseo */ }
```

**Solución recomendada:**
Registrar el error con el contenido de la trama inválida (sanitizado) y un contador de fallos consecutivos. Si el contador supera un umbral (ej. 10 en 60 segundos), emitir una alerta al operador.

```csharp
catch (Exception ex)
{
    FileLogger.LogWarning($"[TramaParser] Trama inválida ignorada: '{tramaLimpia[..Math.Min(50, tramaLimpia.Length)]}' — {ex.Message}");
}
```

```
Sprint estimado: 0.5 días
Complejidad: Baja
```

---

### 3.3 Sin checksums en el protocolo serial

**Severidad:** 🟡 Media
**Archivo(s):** `Services/TramaParser.cs`, firmware del microcontrolador

**Descripción:**
Las tramas seriales (`C1|X:0.23|Y:0.42|...|dB:65.2`) no incluyen ningún mecanismo de verificación de integridad (CRC, checksum XOR, etc.). Ruido eléctrico en el cable RS-232 o interferencias pueden alterar silenciosamente valores de sensores sin que el sistema lo detecte, generando datos ambientales o biométricos incorrectos que parecen válidos.

**Impacto:**
Lecturas de CO2, O3, temperatura o dB erróneas utilizadas para tomar decisiones en cabina.

**Solución recomendada:**
Agregar un campo de checksum al final de cada trama (CRC-8 o XOR simple) y validarlo en el parser antes de procesar los datos.

```
Trama propuesta: C1|X:0.23|Y:0.42|dB:65.2|CRC:A3
```

Este cambio requiere coordinación con el equipo de firmware del microcontrolador.

```
Sprint estimado: 2-3 días (backend + firmware)
Complejidad: Media
```

---

### 3.4 Información de dispositivos BLE expuesta en logs

**Severidad:** 🟡 Media
**Archivo(s):** `SmartwatchService.cs`, `SessionLogger.cs`

**Descripción:**
Los logs de sesión registran en texto plano las direcciones MAC de los dispositivos BLE escaneados y conectados, los bytes crudos de comandos GATT enviados y recibidos, y los valores de RSSI. Esta información facilita la enumeración de dispositivos y el análisis del protocolo propietario por parte de terceros con acceso a los archivos de log.

**Solución recomendada:**
Enmascarar las direcciones MAC en logs de producción (ej. `AA:BB:CC:**:**:**`) y aplicar un nivel de log diferenciado: `DEBUG` para datos GATT crudos, `INFO` para eventos de conexión. En producción, establecer nivel mínimo en `INFO`.

```
Sprint estimado: 1 día
Complejidad: Baja
```

---

## 4. Mejoras de funcionalidad y arquitectura

### 4.1 Persistencia con SQLite

**Prioridad:** 🔴 Alta
**Relacionado con:** Hallazgo 2.2

Implementar una base de datos SQLite embebida para persistir todos los datos de sensores ambientales y signos vitales entre sesiones. Permite:

- Historial completo entre reinicios del sistema.
- Exportación por rango de fechas desde la UI.
- Auditoría post-sesión.
- Consultas de tendencias por paciente/sesión.

**Tablas propuestas:**

| Tabla | Columnas clave |
|-------|---------------|
| `sessions` | `id`, `started_at`, `ended_at`, `operator_id` |
| `sensor_readings` | `id`, `session_id`, `cabin`, `timestamp`, `x`, `y`, `z`, `t`, `h`, `uv`, `co2`, `o3`, `db` |
| `vital_signs` | `id`, `session_id`, `cabin`, `timestamp`, `bpm`, `spo2`, `temp_c`, `systolic`, `diastolic` |

```
Sprint estimado: 3-5 días
```

---

### 4.2 Endpoint de salud del sistema (`/api/health`)

**Prioridad:** 🟠 Media-Alta

Agregar un endpoint `GET /api/health` que devuelva el estado agregado de todas las conexiones del sistema en tiempo real. Permite que la UI muestre un "semáforo" de estado sin necesidad de múltiples peticiones.

**Respuesta propuesta:**
```json
{
  "status": "degraded",
  "timestamp": "2026-03-29T10:30:00Z",
  "components": {
    "serial_c1": { "status": "connected", "port": "COM3" },
    "serial_c2": { "status": "disconnected" },
    "ble_c1":    { "status": "connected", "device": "ET570", "battery": 78 },
    "ble_c2":    { "status": "scanning" }
  }
}
```

```
Sprint estimado: 1-2 días
```

---

### 4.3 Reconexión automática con backoff exponencial

**Prioridad:** 🟠 Media-Alta

Si la conexión serial o BLE se pierde inesperadamente, el sistema actualmente requiere intervención manual del operador para reconectar. En entornos de monitoreo continuo esto es inaceptable.

**Comportamiento propuesto:**

```
Intento 1: esperar 2s
Intento 2: esperar 4s
Intento 3: esperar 8s
Intento 4: esperar 16s
Intento 5+: esperar 30s (tope máximo)
Notificar al operador si no se reconecta en 2 minutos.
```

```
Sprint estimado: 2-3 días
```

---

### 4.4 Sistema de alertas con umbrales configurables

**Prioridad:** 🟠 Media

Los sensores producen valores que tienen rangos de seguridad bien definidos (CO2 en interiores, SpO2 mínimo, frecuencia cardíaca, etc.). Actualmente los datos se muestran pero no se generan alertas automáticas cuando un valor cruza un umbral crítico.

**Umbrales sugeridos por defecto:**

| Sensor | Alerta amarilla | Alerta roja |
|--------|----------------|-------------|
| CO2    | > 1000 ppm     | > 2000 ppm  |
| O3     | > 0.05 ppm     | > 0.1 ppm   |
| dB     | > 80 dB        | > 100 dB    |
| BPM    | < 50 o > 120   | < 40 o > 150 |
| SpO2   | < 95%          | < 90%       |
| Temp.  | > 38.0°C       | > 39.5°C    |

Los umbrales deben ser configurables desde la UI por el operador.

```
Sprint estimado: 3-4 días
```

---

### 4.5 Sesiones de operador y registro de actividad

**Prioridad:** 🟡 Media

Implementar el concepto de "sesión de operador": al iniciar la aplicación se solicita identificación del operador (nombre, ID o PIN), y todos los eventos (conexiones, mediciones, comandos enviados, exportaciones) quedan asociados a esa sesión en los logs. Esto permite trazabilidad completa de quién operó el sistema y cuándo.

```
Sprint estimado: 2-3 días
```

---

### 4.6 Migración a configuración externalizada

**Prioridad:** 🟡 Media
**Archivo(s):** `Program.cs`

Actualmente todos los parámetros del sistema están hardcodeados: puerto de la API (5000), límites de historial, timeouts de BLE, password del smartwatch. Mover estos valores a `appsettings.json` (con perfil `Production` y `Development` separados) para que puedan ajustarse sin recompilar.

```json
{
  "Api": { "Port": 5000, "MaxHistorySize": 7200 },
  "Bluetooth": { "ScanTimeoutMs": 15000, "ReconnectMaxAttempts": 5 },
  "Serial": { "BaudRate": 9600, "MaxTramaLength": 512 }
}
```

```
Sprint estimado: 1 día
```

---

## 5. Mejoras de UI/UX

### 5.1 Indicadores de estado de conexión en tiempo real

**Prioridad:** 🔴 Alta

Los indicadores visuales de conexión (serial y BLE) no siempre reflejan el estado real del sistema en tiempo real. Si una conexión se pierde de forma inesperada, la UI puede mostrar "conectado" hasta que el usuario interactúe manualmente.

**Mejora propuesta:**
Implementar polling al endpoint `GET /api/health` cada 3-5 segundos (o WebSockets para mayor eficiencia) y actualizar los indicadores en tiempo real. Un "semáforo" visible en el header de la aplicación con tres estados:
- 🟢 Verde: todas las conexiones activas
- 🟡 Amarillo: alguna conexión degradada
- 🔴 Rojo: conexiones críticas perdidas

```
Sprint estimado: 1-2 días (depende de Fix 4.2)
```

---

### 5.2 Panel de alertas de valores fuera de rango

**Prioridad:** 🟠 Alta

Cuando un sensor (CO2, SpO2, BPM, temperatura) supera un umbral definido, la UI debe alertar visualmente al operador sin requerir que esté mirando activamente los valores numéricos.

**Comportamiento propuesto:**
- El card del sensor cambia de color (amarillo/rojo) con animación pulsante.
- Se genera automáticamente un toast de advertencia con el valor y el umbral superado.
- Los eventos de alerta quedan registrados en el log de sesión.

```
Sprint estimado: 2-3 días (depende de Fix 4.4)
```

---

### 5.3 Exportación por rango de fechas

**Prioridad:** 🟠 Media-Alta
**Relacionado con:** Mejora 4.1

Actualmente solo es posible exportar los datos que están en RAM en el momento de la exportación. Con la implementación de SQLite, la UI debe permitir:

- Selector de rango de fechas (`desde` / `hasta`).
- Selector de cabina (C1, C2 o ambas).
- Selector de tipo de datos (sensores, biometría o completo).
- Exportación en segundo plano con indicador de progreso.

```
Sprint estimado: 2-3 días (depende de Fix 4.1)
```

---

### 5.4 Auditoría de accesibilidad WCAG 2.1 AA

**Prioridad:** 🟡 Media

La aplicación no ha sido evaluada formalmente contra los criterios de accesibilidad WCAG 2.1 nivel AA. Los puntos de mayor riesgo identificados visualmente son:

- **Contraste de color:** algunos textos sobre fondos de color deben ser verificados (ratio mínimo 4.5:1 para texto normal).
- **Navegación por teclado:** verificar que todos los controles interactivos (botones de cabina, selectores, botones de medición) sean alcanzables y operables con `Tab` y `Enter`/`Space`.
- **Etiquetas ARIA:** los componentes dinámicos (estados de conexión, valores de sensores actualizados en tiempo real) deben tener `aria-live` apropiado para usuarios de lectores de pantalla.
- **Tamaño de objetivos táctiles:** mínimo 44×44 px para todos los botones interactivos.

```
Sprint estimado: 2-4 días (auditoría + correcciones)
```

---

### 5.5 Feedback visual durante operaciones largas

**Prioridad:** 🟡 Media

Algunas operaciones pueden tomar varios segundos (escaneo BLE de 15s, medición de SpO2 de 60s, exportación Excel). Actualmente el feedback es limitado. Propuestas:

- **Barra de progreso determinista** para mediciones con duración conocida (ej. "Medición SpO2: 23/60 segundos").
- **Spinner con mensaje contextual** para operaciones de duración indeterminada (escaneo BLE).
- **Cancelación explícita:** botón visible para abortar una medición o escaneo en curso sin tener que esperar el timeout.

```
Sprint estimado: 1-2 días
```

---

### 5.6 Modo de visualización compacto para pantallas pequeñas

**Prioridad:** 🟡 Baja

La aplicación está optimizada para el tamaño de pantalla del hardware de destino. Si en algún cliente se usa una pantalla de resolución diferente (especialmente menor), algunos elementos pueden solaparse o quedar fuera del viewport del WebView2.

**Acción recomendada:**
Documentar la resolución mínima soportada y agregar un media query de fallback que compacte el layout de dos columnas a una sola columna por debajo de 1280px de ancho.

```
Sprint estimado: 1-2 días
```

---

## Resumen de prioridades

| # | Mejora | Categoría | Prioridad | Esfuerzo |
|---|--------|-----------|-----------|----------|
| 1.1 | Autenticación en API | Seguridad | 🔴 Crítica | 5-8 días |
| 1.2 | CORS restrictivo | Seguridad | 🔴 Crítica | 0.5 días |
| 1.3 | HTTPS localhost | Seguridad | 🔴 Crítica | 1-2 días |
| 1.4 | Password BT en config | Seguridad | 🔴 Crítica | 2-3 días |
| 2.2 | Persistencia SQLite | Alta | 🔴 Alta | 3-5 días |
| 5.1 | Estado conexión real time | UI/UX | 🔴 Alta | 1-2 días |
| 2.1 | Rate limiting | Alta | 🟠 Alta | 0.5 días |
| 2.3 | Integridad proceso hijo | Alta | 🟠 Alta | 2-3 días |
| 4.2 | Endpoint `/api/health` | Arquitectura | 🟠 Media-Alta | 1-2 días |
| 4.3 | Reconexión automática | Arquitectura | 🟠 Media-Alta | 2-3 días |
| 5.2 | Alertas valores fuera rango | UI/UX | 🟠 Alta | 2-3 días |
| 5.3 | Exportación por fechas | UI/UX | 🟠 Media-Alta | 2-3 días |
| 3.1 | Rotación de logs | Media | 🟡 Media | 1 día |
| 3.2 | Log fallos en parser | Media | 🟡 Media | 0.5 días |
| 3.3 | Checksum en tramas serial | Media | 🟡 Media | 2-3 días |
| 3.4 | Enmascarar MACs en logs | Media | 🟡 Media | 1 día |
| 4.4 | Alertas con umbrales | Funcionalidad | 🟡 Media | 3-4 días |
| 4.5 | Sesiones de operador | Funcionalidad | 🟡 Media | 2-3 días |
| 4.6 | Config externalizada | Arquitectura | 🟡 Media | 1 día |
| 5.4 | Accesibilidad WCAG 2.1 AA | UI/UX | 🟡 Media | 2-4 días |
| 5.5 | Feedback operaciones largas | UI/UX | 🟡 Media | 1-2 días |
| 5.6 | Modo compacto responsive | UI/UX | 🟡 Baja | 1-2 días |

---

*Documento generado el 2026-03-29. Revisar y actualizar al inicio de cada sprint.*
