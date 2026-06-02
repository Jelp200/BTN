; ============================================================================
; Validación en Tiempo de Compilación
; ============================================================================
#if !DirExists("dist\wwwroot")
  #error "ERROR: La carpeta dist\wwwroot no existe. Ejecuta: npm run build en BTN\app\Frontend y luego .\build-installer.ps1"
#endif

[Setup]
; ============================================================================
; Información General de la Aplicación
; ============================================================================
AppId={{GITSE-PANELCONTROL-2025}}
AppName=Control Panel
AppVersion=2.0.0
AppVerName=Control Panel v2.0.0
AppPublisher=GRADUS TECHNOLOGIES
AppPublisherURL=https://www.gradus.com
AppSupportURL=https://www.gradus.com/soporte
AppUpdatesURL=https://www.gradus.com/descargas
AppCopyright=© 2025 GRADUS TECHNOLOGIES. Todos los derechos reservados.
AppComments=Sistema de control y monitoreo de cabinas de prueba ergonómica

; ============================================================================
; Configuración de Instalación
; ============================================================================
DefaultDirName={localappdata}\PanelControlGITSE
DefaultGroupName=GRADUS TECHNOLOGIES\Control Panel
AllowNoIcons=yes
OutputDir=Output
OutputBaseFilename=PanelControlGITSE-v2.0.0-Instalador
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
WizardSizePercent=100
PrivilegesRequired=lowest
ArchitecturesInstallIn64BitMode=x64
MinVersion=6.1
VersionInfoVersion=2.0.0.0
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
; Directorios a Crear
; ============================================================================
[Dirs]
; Crear carpeta Logs con permisos de escritura completos para el usuario
Name: "{app}\Logs"; Permissions: users-full

; ============================================================================
; Accesos Directos y Menú de Inicio
; ============================================================================
[Icons]
; Acceso directo en escritorio
Name: "{autodesktop}\Control Panel"; \
Filename: "{app}\HostApp.exe"; \
WorkingDir: "{app}"; \
IconFilename: "{app}\HostApp.exe"; \
IconIndex: 0; \
Comment: "Panel de Control GITSE - Sistema de Monitoreo de Cabinas"

; Acceso directo en Menú Inicio
Name: "{group}\Control Panel"; \
Filename: "{app}\HostApp.exe"; \
WorkingDir: "{app}"; \
IconFilename: "{app}\HostApp.exe"; \
Comment: "Ejecutar Panel de Control GITSE"

; Acceso directo para desinstalar
Name: "{group}\Desinstalar Control Panel"; \
Filename: "{uninstallexe}"; \
Comment: "Desinstalar Panel de Control GITSE"

; Acceso directo al directorio de instalación
Name: "{group}\Carpeta de Instalación"; \
Filename: "{app}"; \
Comment: "Abrir carpeta de instalación"

; Acceso directo a la carpeta de logs
Name: "{group}\Ver Logs"; \
Filename: "{app}\Logs"; \
Comment: "Ver archivos de registro de la aplicación"

; ============================================================================
; Ejecución Post-Instalación
; ============================================================================
[Run]
Filename: "{app}\HostApp.exe"; \
Description: "Iniciar Control Panel después de la instalación"; \
Flags: nowait postinstall skipifsilent

; ============================================================================
; Limpieza al Desinstalar
; ============================================================================
[UninstallDelete]
Type: files; Name: "{autodesktop}\Control Panel.lnk"
Type: files; Name: "{group}\Control Panel.lnk"
Type: files; Name: "{group}\Desinstalar Control Panel.lnk"
Type: files; Name: "{group}\Carpeta de Instalación.lnk"
Type: files; Name: "{group}\Ver Logs.lnk"
Type: filesandordirs; Name: "{app}\wwwroot"
; Nota: Los logs se eliminan solo si el usuario lo confirma (ver [Code])
Type: dirifempty; Name: "{app}\Logs"
Type: dirifempty; Name: "{group}"
Type: dirifempty; Name: "{app}"

; ============================================================================
; Mensajes Personalizados
; ============================================================================
[Messages]
WelcomeLabel1=Bienvenido a la instalación de Control Panel
WelcomeLabel2=Este programa instalará Control Panel v2.0.0 en su equipo.%n%nControl Panel es un sistema profesional de control y monitoreo de cabinas.%n%nLa aplicación se instalará en su carpeta de usuario para garantizar permisos de escritura completos.%n%nSe recomienda cerrar todas las aplicaciones antes de continuar.
FinishedHeadingLabel=Instalación completada
FinishedLabelNoIcons=La instalación de Control Panel se ha completado correctamente.
FinishedLabel=La instalación de Control Panel se ha completado correctamente. La aplicación se iniciará automáticamente.
ClickFinish=Haga clic en "Finalizar" para cerrar el instalador.
SelectDirLabel3=El instalador copiará los archivos de Control Panel en la siguiente carpeta de usuario.
SelectGroupLabel=Seleccione una carpeta del Menú Inicio en la que crear los accesos directos del programa.
SelectStartMenuFolder=Seleccionar Carpeta del Menú Inicio

; ============================================================================
; Código Personalizado (Validaciones)
; ============================================================================
[Code]
function InitializeUninstall(): Boolean;
var
  LogsPath: String;
  ResultCode: Integer;
begin
  { Preguntar si desea conservar los logs }
  LogsPath := ExpandConstant('{app}\Logs');
  
  if DirExists(LogsPath) then
  begin
    if MsgBox('¿Desea conservar los archivos de registro (logs)?', 
              mbConfirmation, MB_YESNO) = IDNO then
    begin
      { Eliminar carpeta Logs }
      DelTree(LogsPath, True, True, True);
    end;
  end;
  
  Result := True;
end;