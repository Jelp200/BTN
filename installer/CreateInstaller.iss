[Setup]
; ============================================================================
; Información General de la Aplicación
; ============================================================================
AppId={{GITSE-PANELCONTROL-2025}}
AppName=Panel Control GITSE
AppVersion=1.0.0
AppVerName=Panel Control GITSE v1.0.0
AppPublisher=GRADUS TECHNOLOGIES
AppPublisherURL=https://www.gradus.com
AppSupportURL=https://www.gradus.com/soporte
AppUpdatesURL=https://www.gradus.com/descargas
AppCopyright=© 2025 GRADUS TECHNOLOGIES. Todos los derechos reservados.
AppComments=Sistema de control y monitoreo de cabinas de prueba ergonómica

; ============================================================================
; Configuración de Instalación
; ============================================================================
DefaultDirName={pf}\PanelControlGITSE
DefaultGroupName=GRADUS TECHNOLOGIES\Panel Control GITSE
AllowNoIcons=yes
OutputDir=Output
OutputBaseFilename=PanelControlGITSE-v1.0.0-Instalador
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
WizardSizePercent=100
PrivilegesRequired=none
ArchitecturesInstallIn64BitMode=x64
MinVersion=6.1
VersionInfoVersion=1.0.0.0
VersionInfoCompany=GRADUS TECHNOLOGIES
VersionInfoDescription=Sistema de Control de Cabinas GITSE
VersionInfoCopyright=© 2025 GRADUS TECHNOLOGIES

; ============================================================================
; Apariencia del Instalador
; ============================================================================
SetupIconFile=app.ico
WizardImageFile=installer-logo.bmp
WizardSmallImageFile=installer-small.bmp
DisableWelcomePage=no
DisableProgramGroupPage=no
UninstallDisplayIcon={app}\HostApp.exe

; ============================================================================
; Lenguaje y Localización
; ============================================================================
ShowLanguageDialog=auto
LanguageDetectionMethod=uilanguage

; ============================================================================
; Archivos a Incluir
; ============================================================================
[Files]
; Copiar TODO el contenido publicado (exe + dlls + runtimes + assets)
Source: "dist\*"; \
DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

; Archivos estáticos (wwwroot) - asegurar copia completa
Source: "dist\wwwroot\*"; \
DestDir: "{app}\wwwroot"; Flags: ignoreversion recursesubdirs createallsubdirs

; ============================================================================
; Accesos Directos y Menú de Inicio
; ============================================================================
[Icons]
; Acceso directo en escritorio
Name: "{autodesktop}\Panel Control GITSE"; \
Filename: "{app}\HostApp.exe"; \
WorkingDir: "{app}"; \
IconFilename: "{app}\HostApp.exe"; \
IconIndex: 0; \
Comment: "Panel de Control GITSE - Sistema de Monitoreo de Cabinas"

; Acceso directo en Menú Inicio
Name: "{group}\Panel Control GITSE"; \
Filename: "{app}\HostApp.exe"; \
WorkingDir: "{app}"; \
IconFilename: "{app}\HostApp.exe"; \
Comment: "Ejecutar Panel de Control GITSE"

; Acceso directo para desinstalar
Name: "{group}\Desinstalar Panel Control GITSE"; \
Filename: "{uninstallexe}"; \
Comment: "Desinstalar Panel de Control GITSE"

; Acceso directo al directorio de instalación
Name: "{group}\Carpeta de Instalación"; \
Filename: "{app}"; \
Comment: "Abrir carpeta de instalación"

; ============================================================================
; Ejecución Post-Instalación
; ============================================================================
[Run]
Filename: "{app}\HostApp.exe"; \
Description: "Iniciar Panel Control GITSE después de la instalación"; \
Flags: nowait postinstall skipifsilent

; ============================================================================
; Limpieza al Desinstalar
; ============================================================================
; ============================================================================
; Limpieza al Desinstalar
; ============================================================================
[UninstallDelete]
Type: files; Name: "{autodesktop}\Panel Control GITSE.lnk"
Type: files; Name: "{group}\Panel Control GITSE.lnk"
Type: files; Name: "{group}\Desinstalar Panel Control GITSE.lnk"
Type: files; Name: "{group}\Carpeta de Instalación.lnk"
Type: filesandordirs; Name: "{app}\wwwroot"
Type: dirifempty; Name: "{group}"
Type: dirifempty; Name: "{app}"

; ============================================================================
; Mensajes Personalizados
; ============================================================================
[Messages]
WelcomeLabel1=Bienvenido a la instalación de Panel Control GITSE
WelcomeLabel2=Este programa instalará Panel Control GITSE v1.0.0 en su equipo.%n%nPanel Control GITSE es un sistema profesional de control y monitoreo de cabinas.%n%nSe recomienda cerrar todas las aplicaciones antes de continuar.
FinishedHeadingLabel=Instalación completada
FinishedLabelNoIcons=La instalación de Panel Control GITSE se ha completado correctamente.
FinishedLabel=La instalación de Panel Control GITSE se ha completado correctamente. La aplicación se iniciará automáticamente.
ClickFinish=Haga clic en "Finalizar" para cerrar el instalador.
SelectDirLabel3=El instalador copiará los archivos de Panel Control GITSE en la siguiente carpeta.
SelectGroupLabel=Seleccione una carpeta del Menú Inicio en la que crear los accesos directos del programa.
SelectStartMenuFolder=Seleccionar Carpeta del Menú Inicio

; ============================================================================
; Código Personalizado (Validaciones)
; ============================================================================
[Code]
function InitializeSetup(): Boolean;
begin
  { Aquí puedes añadir validaciones antes de la instalación }
  { Por ejemplo, verificar .NET Framework, etc. }
  Result := True;
end;

function InitializeUninstall(): Boolean;
begin
  { Aquí puedes añadir lógica antes de desinstalar }
  Result := True;
end;