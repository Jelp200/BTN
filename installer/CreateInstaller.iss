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
; AppId DISTINTO al de PROD a propósito: así Windows/Inno Setup tratan UAT y PROD
; como aplicaciones independientes (pueden coexistir instaladas en la misma PC
; sin que una desinstale/sobrescriba a la otra).
AppId={{GITSE-PANELCONTROL-UAT-2025}}
AppName=Control Panel UAT
AppVersion=2.0.9
AppVerName=Control Panel UAT v2.0.9
AppPublisher=GRADUS TECHNOLOGIES
AppPublisherURL=https://www.gradus.com
AppSupportURL=https://www.gradus.com/soporte
AppUpdatesURL=https://www.gradus.com/descargas
AppCopyright=© 2025 GRADUS TECHNOLOGIES. Todos los derechos reservados.
AppComments=Sistema de control y monitoreo de cabinas de prueba ergonómica (build UAT/pruebas)

; ============================================================================
; Configuración de Instalación
; ============================================================================
; Carpeta DISTINTA a la de PROD ("ControlPanelUAT", no "ControlPanel") — mismo
; motivo que el AppId: evitar que una instalación pise los archivos de la otra.
DefaultDirName={localappdata}\ControlPanelUAT
DefaultGroupName=GRADUS TECHNOLOGIES\Control Panel UAT
AllowNoIcons=yes
OutputDir=Output
OutputBaseFilename=ControlPanel-UAT-v2.0.9-Instalador
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
WizardSizePercent=100
PrivilegesRequired=lowest
ArchitecturesInstallIn64BitMode=x64
MinVersion=6.1
VersionInfoVersion=2.0.9.0
VersionInfoCompany=GRADUS TECHNOLOGIES
VersionInfoDescription=Sistema de Control de Cabinas GITSE (UAT)
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
Name: "{autodesktop}\Control Panel UAT"; \
Filename: "{app}\HostApp.exe"; \
WorkingDir: "{app}"; \
IconFilename: "{app}\HostApp.exe"; \
IconIndex: 0; \
Comment: "Control Panel UAT - Sistema de Monitoreo de Cabinas (pruebas)"

; Acceso directo en Menú Inicio
Name: "{group}\Control Panel UAT"; \
Filename: "{app}\HostApp.exe"; \
WorkingDir: "{app}"; \
IconFilename: "{app}\HostApp.exe"; \
Comment: "Ejecutar Control Panel UAT"

; Acceso directo para desinstalar
Name: "{group}\Desinstalar Control Panel UAT"; \
Filename: "{uninstallexe}"; \
Comment: "Desinstalar Control Panel UAT"

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
; Reinicio automático cuando el instalador corre en modo silencioso (auto-actualización)
Filename: "{app}\HostApp.exe"; \
Flags: nowait skipifnotsilent

; Casilla "Iniciar la app" en la pantalla final de instalación normal (no silenciosa)
Filename: "{app}\HostApp.exe"; \
Description: "Iniciar Control Panel después de la instalación"; \
Flags: nowait postinstall skipifsilent

; ============================================================================
; Limpieza al Desinstalar
; ============================================================================
[UninstallDelete]
Type: files; Name: "{autodesktop}\Control Panel UAT.lnk"
Type: files; Name: "{group}\Control Panel UAT.lnk"
Type: files; Name: "{group}\Desinstalar Control Panel UAT.lnk"
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
WelcomeLabel1=Bienvenido a la instalación de Control Panel UAT
WelcomeLabel2=Este programa instalará Control Panel UAT v2.0.9 en su equipo.%n%nEsta es la build de PRUEBAS (UAT) de Control Panel — puede coexistir con la instalación de producción en la misma PC.%n%nLa aplicación se instalará en su carpeta de usuario para garantizar permisos de escritura completos.%n%nSe recomienda cerrar todas las aplicaciones antes de continuar.
FinishedHeadingLabel=Instalación completada
FinishedLabelNoIcons=La instalación de Control Panel UAT se ha completado correctamente.
FinishedLabel=La instalación de Control Panel UAT se ha completado correctamente. La aplicación se iniciará automáticamente.
ClickFinish=Haga clic en "Finalizar" para cerrar el instalador.
SelectDirLabel3=El instalador copiará los archivos de Control Panel UAT en la siguiente carpeta de usuario.
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