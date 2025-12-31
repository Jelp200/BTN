# ============================================================================
# Script de Compilación para Instalador - Panel Control GITSE
# ============================================================================
# Este script compila ControlPanel.API y HostApp en modo Release
# y prepara todos los archivos en la carpeta 'installer/dist'

param(
    [switch]$SkipBuild = $false,
    [switch]$SkipClean = $false
)

# Colores para output
$colors = @{
    Reset = "`e[0m"
    Green = "`e[32m"
    Yellow = "`e[33m"
    Red = "`e[31m"
    Blue = "`e[34m"
    Cyan = "`e[36m"
}

function Write-Status([string]$message, [string]$status) {
    $color = $colors.Blue
    if ($status -eq "success") { $color = $colors.Green }
    elseif ($status -eq "error") { $color = $colors.Red }
    elseif ($status -eq "warning") { $color = $colors.Yellow }
    
    Write-Host "$color[$(Get-Date -Format 'HH:mm:ss')] $message$($colors.Reset)"
}

function Write-Section([string]$title) {
    Write-Host ""
    Write-Host "$($colors.Cyan)╔$('=' * 68)╗$($colors.Reset)"
    Write-Host "$($colors.Cyan)║ $title$(' ' * (66 - $title.Length))║$($colors.Reset)"
    Write-Host "$($colors.Cyan)╚$('=' * 68)╝$($colors.Reset)"
    Write-Host ""
}

# Obtener ruta raíz del proyecto
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$btnPath = $scriptPath
$controlPanelPath = Join-Path $btnPath "ControlPanel.API\ControlPanel.API"
$hostAppPath = Join-Path $btnPath "HostApp\HostApp"
$clientDistPath = Join-Path $btnPath "client\dist"
$installerDistPath = Join-Path $btnPath "installer\dist"

Write-Section "🚀 COMPILADOR PARA INSTALADOR - PANEL CONTROL GITSE"
Write-Status "Ruta raíz: $btnPath" "info"
Write-Status "ControlPanel.API: $controlPanelPath" "info"
Write-Status "HostApp: $hostAppPath" "info"
Write-Status "Frontend Astro: $clientDistPath" "info"

# Verificar que existan los proyectos
if (-not (Test-Path $controlPanelPath)) {
    Write-Status "ERROR: No se encontró ControlPanel.API en $controlPanelPath" "error"
    exit 1
}

if (-not (Test-Path $hostAppPath)) {
    Write-Status "ERROR: No se encontró HostApp en $hostAppPath" "error"
    exit 1
}

if (-not (Test-Path $clientDistPath)) {
    Write-Status "ADVERTENCIA: No se encontró cliente Astro compilado en $clientDistPath" "warning"
    Write-Host "Por favor, compila primero el cliente con: cd client && npm run build"
}

# Crear carpeta dist si no existe
if (-not (Test-Path $installerDistPath)) {
    New-Item -ItemType Directory -Path $installerDistPath | Out-Null
    Write-Status "Carpeta dist creada: $installerDistPath" "success"
}

# Limpiar build anterior (opcional)
if (-not $SkipClean) {
    Write-Section "🧹 LIMPIANDO COMPILACIONES ANTERIORES"
    
    Write-Status "Limpiando ControlPanel.API..." "info"
    Push-Location $controlPanelPath
    dotnet clean -c Release | Out-Null
    Pop-Location
    Write-Status "ControlPanel.API limpiado" "success"
    
    Write-Status "Limpiando HostApp..." "info"
    Push-Location $hostAppPath
    dotnet clean -c Release | Out-Null
    Pop-Location
    Write-Status "HostApp limpiado" "success"
}

# Compilar ControlPanel.API
Write-Section "🔨 COMPILANDO CONTROLPANEL.API"
Write-Status "Compilando ControlPanel.API en modo Release (win-x64)..." "info"

Push-Location $controlPanelPath
$buildOutput = dotnet publish -c Release -r win-x64 --self-contained 2>&1
Pop-Location

if ($LASTEXITCODE -ne 0) {
    Write-Status "ERROR al compilar ControlPanel.API" "error"
    Write-Host $buildOutput
    exit 1
}
Write-Status "✅ ControlPanel.API compilado correctamente" "success"

# Compilar HostApp
Write-Section "🔨 COMPILANDO HOSTAPP"
Write-Status "Compilando HostApp en modo Release (win-x64)..." "info"

Push-Location $hostAppPath
$buildOutput = dotnet publish -c Release -r win-x64 --self-contained 2>&1
Pop-Location

if ($LASTEXITCODE -ne 0) {
    Write-Status "ERROR al compilar HostApp" "error"
    Write-Host $buildOutput
    exit 1
}
Write-Status "✅ HostApp compilado correctamente" "success"

# Copiar binarios a dist
Write-Section "📦 COPIANDO BINARIOS A CARPETA DIST"

# Rutas de los publicados
$controlPanelPublish = Join-Path $controlPanelPath "bin\Release\net8.0\win-x64\publish"
$hostAppPublish = Join-Path $hostAppPath "bin\Release\net8.0-windows\win-x64\publish"

Write-Status "Copiando ControlPanel.API.exe..." "info"
if (Test-Path (Join-Path $controlPanelPublish "ControlPanel.API.exe")) {
    Copy-Item (Join-Path $controlPanelPublish "ControlPanel.API.exe") $installerDistPath -Force
    Write-Status "✅ ControlPanel.API.exe copiado" "success"
} else {
    Write-Status "ERROR: No se encontró ControlPanel.API.exe en $controlPanelPublish" "error"
    exit 1
}

Write-Status "Copiando HostApp.exe..." "info"
if (Test-Path (Join-Path $hostAppPublish "HostApp.exe")) {
    Copy-Item (Join-Path $hostAppPublish "HostApp.exe") $installerDistPath -Force
    Write-Status "✅ HostApp.exe copiado" "success"
} else {
    Write-Status "ERROR: No se encontró HostApp.exe en $hostAppPublish" "error"
    exit 1
}

# Copiar wwwroot (frontend)
Write-Section "🌐 COPIANDO FRONTEND ASTRO"

$wwwrootSource = Join-Path $controlPanelPath "wwwroot"
$wwwrootDest = Join-Path $installerDistPath "wwwroot"

Write-Status "Copiando wwwroot desde ControlPanel.API..." "info"
if (Test-Path $wwwrootSource) {
    if (Test-Path $wwwrootDest) {
        Remove-Item $wwwrootDest -Recurse -Force
    }
    Copy-Item $wwwrootSource $wwwrootDest -Recurse -Force
    Write-Status "✅ wwwroot copiado correctamente" "success"
} else {
    Write-Status "ADVERTENCIA: No se encontró wwwroot en $wwwrootSource" "warning"
}

# Verificación final
Write-Section "✅ VERIFICACIÓN FINAL"

$filesToCheck = @(
    (Join-Path $installerDistPath "ControlPanel.API.exe"),
    (Join-Path $installerDistPath "HostApp.exe"),
    (Join-Path $installerDistPath "wwwroot")
)

$allFound = $true
foreach ($file in $filesToCheck) {
    if (Test-Path $file) {
        $itemType = if ((Get-Item $file).PSIsContainer) { "📁" } else { "📄" }
        Write-Status "$itemType $file" "success"
    } else {
        Write-Status "❌ NO ENCONTRADO: $file" "error"
        $allFound = $false
    }
}

if ($allFound) {
    Write-Host ""
    Write-Host "$($colors.Green)╔════════════════════════════════════════════════════════════════╗$($colors.Reset)"
    Write-Host "$($colors.Green)║ 🎉 COMPILACIÓN COMPLETADA EXITOSAMENTE                        ║$($colors.Reset)"
    Write-Host "$($colors.Green)║                                                                ║$($colors.Reset)"
    Write-Host "$($colors.Green)║ Todos los archivos están listos en: $installerDistPath  ║$($colors.Reset)"
    Write-Host "$($colors.Green)║                                                                ║$($colors.Reset)"
    Write-Host "$($colors.Green)║ Próximo paso: Ejecutar Inno Setup para crear el instalador     ║$($colors.Reset)"
    Write-Host "$($colors.Green)╚════════════════════════════════════════════════════════════════╝$($colors.Reset)"
    Write-Host ""
    Write-Status "Puedes ejecutar: Inno Setup > File > Open > CreateInstaller.iss" "info"
} else {
    Write-Host ""
    Write-Host "$($colors.Red)╔════════════════════════════════════════════════════════════════╗$($colors.Reset)"
    Write-Host "$($colors.Red)║ ❌ ERROR: Faltan archivos necesarios                           ║$($colors.Reset)"
    Write-Host "$($colors.Red)╚════════════════════════════════════════════════════════════════╝$($colors.Reset)"
    exit 1
}

exit 0
