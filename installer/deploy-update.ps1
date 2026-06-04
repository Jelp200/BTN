# ** =====================================================================
# ** Archivo:   deploy-update.ps1
# ** Version:   2.0.0
# **  Autor(es):
# **             Jorge E. Peña Paz
# **  Equipo:    Departamento de Computo - Gradus Technologies
# **  Fecha:     Junio 2026
# **  Descripción:
# **             Sube el instalador al VPS y actualiza version.json para
# **             activar la notificación de auto-actualización en los clientes.
# **
# **  Uso:
# **    .\deploy-update.ps1 -Version "2.1.0" -Notes "- Mejora X`n- Fix Y"
# **    .\deploy-update.ps1 -Version "2.1.0" -InstallerPath "C:\...\installer.exe"
# ** =====================================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$Version,

    [string]$Notes = "Correcciones de errores y mejoras de rendimiento.",

    [string]$InstallerPath = "",

    [string]$VpsHost = "187.77.27.8",
    [string]$VpsUser = "root",

    # Directorio en el HOST del VPS (montado en el contenedor nginx como /usr/share/nginx/html/updates)
    [string]$VpsUpdatesDir = "/srv/docker/gradustec/updates"
)

# ========== COLORES ==========
$c = @{
    Reset  = "`e[0m"
    Green  = "`e[32m"
    Yellow = "`e[33m"
    Red    = "`e[31m"
    Cyan   = "`e[36m"
}

function Write-Step([string]$msg) {
    Write-Host "$($c.Cyan)[$(Get-Date -Format 'HH:mm:ss')] $msg$($c.Reset)"
}
function Write-Ok([string]$msg) {
    Write-Host "$($c.Green)  ✅ $msg$($c.Reset)"
}
function Write-Fail([string]$msg) {
    Write-Host "$($c.Red)  ❌ $msg$($c.Reset)"
    exit 1
}

Write-Host ""
Write-Host "$($c.Cyan)╔══════════════════════════════════════════════════════════════════╗$($c.Reset)"
Write-Host "$($c.Cyan)║   DEPLOY AUTO-UPDATE → VPS $VpsHost              ║$($c.Reset)"
Write-Host "$($c.Cyan)╚══════════════════════════════════════════════════════════════════╝$($c.Reset)"
Write-Host ""

# ── Localizar el instalador ───────────────────────────────────────────────────
Write-Step "Buscando instalador para v$Version..."

if ([string]::IsNullOrWhiteSpace($InstallerPath)) {
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    $outputDir = Join-Path $scriptDir "Output"
    $candidates = Get-ChildItem $outputDir -Filter "*$Version*.exe" -ErrorAction SilentlyContinue |
                  Sort-Object LastWriteTime -Descending
    if ($candidates.Count -eq 0) {
        Write-Fail "No se encontró ningún instalador con '$Version' en $outputDir`nEspecifica -InstallerPath 'C:\ruta\al\instalador.exe'"
    }
    $InstallerPath = $candidates[0].FullName
}

if (-not (Test-Path $InstallerPath)) {
    Write-Fail "El archivo no existe: $InstallerPath"
}

$installerName = Split-Path -Leaf $InstallerPath
$installerSizeMB = [math]::Round((Get-Item $InstallerPath).Length / 1MB, 1)
Write-Ok "Instalador: $installerName ($installerSizeMB MB)"

# ── Verificar SSH disponible ──────────────────────────────────────────────────
Write-Step "Verificando conexión SSH con $VpsUser@$VpsHost..."
ssh -o ConnectTimeout=10 -o BatchMode=yes "$VpsUser@$VpsHost" "echo ok" 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Fail "No se pudo conectar al VPS via SSH.`n  Asegúrate de tener tu clave SSH configurada:`n  ssh-copy-id $VpsUser@$VpsHost"
}
Write-Ok "Conexión SSH OK"

# ── Crear directorios en VPS ──────────────────────────────────────────────────
Write-Step "Preparando directorios en el VPS..."
ssh "$VpsUser@$VpsHost" "mkdir -p $VpsUpdatesDir/installers && chmod 755 $VpsUpdatesDir $VpsUpdatesDir/installers"
if ($LASTEXITCODE -ne 0) { Write-Fail "No se pudo crear el directorio en el VPS." }
Write-Ok "Directorios OK: $VpsUpdatesDir"

# ── Subir instalador ──────────────────────────────────────────────────────────
Write-Step "Subiendo $installerName al VPS ($installerSizeMB MB)..."
scp "$InstallerPath" "${VpsUser}@${VpsHost}:${VpsUpdatesDir}/installers/$installerName"
if ($LASTEXITCODE -ne 0) { Write-Fail "Error al subir el instalador con SCP." }
Write-Ok "Instalador subido"

# ── Actualizar version.json ───────────────────────────────────────────────────
Write-Step "Actualizando version.json en el VPS..."

$today = Get-Date -Format "yyyy-MM-dd"
# URL pública — el contenedor sirve /usr/share/nginx/html/updates → /updates/
$installerUrl = "https://gradustec.com/updates/installers/$installerName"

$notesJson = $Notes -replace '\\', '\\\\' -replace '"', '\"'

$versionJson = @"
{
    "version": "$Version",
    "url": "$installerUrl",
    "notes": "$notesJson",
    "date": "$today"
}
"@

$versionJson | ssh "$VpsUser@$VpsHost" "cat > $VpsUpdatesDir/version.json && chmod 644 $VpsUpdatesDir/version.json"
if ($LASTEXITCODE -ne 0) { Write-Fail "Error al actualizar version.json." }
Write-Ok "version.json actualizado"

# ── Verificación final (vía HTTP) ─────────────────────────────────────────────
Write-Step "Verificando endpoint público..."
$checkUrl = "http://$VpsHost/updates/version.json"
try {
    $response = Invoke-WebRequest -Uri $checkUrl -TimeoutSec 10 -UseBasicParsing
    $parsed = $response.Content | ConvertFrom-Json
    if ($parsed.version -eq $Version) {
        Write-Ok "Endpoint accesible → versión publicada: $($parsed.version)"
    } else {
        Write-Host "$($c.Yellow)  ⚠️  Endpoint responde pero versión inesperada: $($parsed.version)$($c.Reset)"
        Write-Host "$($c.Yellow)      ¿El contenedor tiene el volume montado? Ejecuta en el VPS:$($c.Reset)"
        Write-Host "$($c.Yellow)      docker compose up -d web$($c.Reset)"
    }
} catch {
    Write-Host "$($c.Yellow)  ⚠️  No se pudo verificar $checkUrl$($c.Reset)"
    Write-Host "$($c.Yellow)      Si es la primera vez, asegúrate de que el volume esté en docker-compose.yml$($c.Reset)"
    Write-Host "$($c.Yellow)      y ejecuta: docker compose up -d web$($c.Reset)"
}

# ── Resumen ───────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "$($c.Green)╔══════════════════════════════════════════════════════════════════╗$($c.Reset)"
Write-Host "$($c.Green)║  ✅ DEPLOY COMPLETADO                                            ║$($c.Reset)"
Write-Host "$($c.Green)║                                                                  ║$($c.Reset)"
Write-Host "$($c.Green)║  Versión publicada: $Version                                          ║$($c.Reset)"
Write-Host "$($c.Green)║  Archivo         : $installerName$($c.Reset)"
Write-Host "$($c.Green)║                                                                  ║$($c.Reset)"
Write-Host "$($c.Green)║  Los clientes serán notificados al próximo arranque de la app.   ║$($c.Reset)"
Write-Host "$($c.Green)╚══════════════════════════════════════════════════════════════════╝$($c.Reset)"
Write-Host ""
