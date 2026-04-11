# Control Panel — UPCH (Manual de Usuario)

---

## Índice

- [1. Descripción General](#1-descripción-general)
- [2. Requisitos del Sistema](#2-requisitos-del-sistema)
- [3. Inicio de la Aplicación](#3-inicio-de-la-aplicación)
  - [3.1 Pantalla de Carga](#31-pantalla-de-carga)
  - [3.2 Conexión Serial al Microcontrolador](#32-conexión-serial-al-microcontrolador)
- [4. Interfaz Principal](#4-interfaz-principal)
  - [4.1 Cabecera (Header)](#41-cabecera-header)
  - [4.2 Arquitectura de Dos Paneles](#42-arquitectura-de-dos-paneles)
  - [4.3 Navegación por Pestañas](#43-navegación-por-pestañas)
- [5. Pestaña: Controles](#5-pestaña-controles)
  - [5.1 Activación de Cabina](#51-activación-de-cabina)
  - [5.2 Control de Actuadores](#52-control-de-actuadores)
  - [5.3 Sistema de Humo](#53-sistema-de-humo)
  - [5.4 Sistema de Audio](#54-sistema-de-audio)
  - [5.5 Sistema de Iluminación RGB](#55-sistema-de-iluminación-rgb)
  - [5.6 Parar y Resetear Cabina](#56-parar-y-resetear-cabina)
- [6. Pestaña: Sensores](#6-pestaña-sensores)
  - [6.1 Indicadores de Sensores](#61-indicadores-de-sensores)
  - [6.2 Gráfica en Tiempo Real](#62-gráfica-en-tiempo-real)
  - [6.3 Indicadores de Estado de Cabina](#63-indicadores-de-estado-de-cabina)
- [7. Pestaña: Biometría](#7-pestaña-biometría)
  - [7.1 Conexión del Reloj Inteligente](#71-conexión-del-reloj-inteligente)
  - [7.2 Métricas Biométricas](#72-métricas-biométricas)
  - [7.3 Datos Personales del Sujeto](#73-datos-personales-del-sujeto)
  - [7.4 Visualización de Gráficas Biométricas](#74-visualización-de-gráficas-biométricas)
- [8. Exportación de Datos (Excel)](#8-exportación-de-datos-excel)
- [9. Herramientas de Desarrollo](#9-herramientas-de-desarrollo)
- [10. Protocolo de Comunicación Serial](#10-protocolo-de-comunicación-serial)
- [11. Solución de Problemas](#11-solución-de-problemas)
- [12. Glosario](#12-glosario)

---

## 1. Descripción General

**Control Panel** es una aplicación de escritorio diseñada para la gestión centralizada de dos cabinas de estimulación sensorial en el entorno de investigación de la UPCH. A través de una interfaz gráfica, el sistema permite:

- **Controlar actuadores** ambientales: temperatura (frío/calor), humedad, vibración, ventilación, extracción de aire y deshumidificación.
- **Gestionar estímulos sensoriales**: sistema de humo con control de temporización, iluminación RGB de tres grupos (cálida, fría, neutra) y reproducción de sonidos ambientales, tonos de tinnitus y tonos puros calibrados.
- **Monitorear sensores ambientales** en tiempo real: acelerómetro (X, Y, Z), temperatura, humedad, UV, CO₂, O₃ y nivel sonoro (dB), con visualización gráfica histórica.
- **Registrar datos biométricos** del sujeto mediante un reloj inteligente ET570: pulso (BPM), oxigenación (SpO₂), temperatura corporal y tensión arterial.
- **Exportar sesiones completas** a hojas de cálculo Excel (.xlsx) para análisis posterior.

La comunicación con el hardware se realiza mediante un protocolo serial definido a través de tramas estructuradas hacia el microcontrolador que gobierna cada cabina.

---

## 2. Requisitos del Sistema

| Componente | Requisito mínimo |
| --- | --- |
| Sistema operativo | Windows 10 / 11 (64 bits) |
| Resolución de pantalla | 1280 × 720 px (recomendado: 1920 × 1080 px) |
| Conexión al microcontrolador | Puerto COM serial (USB-Serial / Bluetooth SPP) |
| Reloj inteligente | ET570 con Bluetooth activo |
| Backend activo | ControlPanel.API (.NET 10.0) en ejecución |
| Navegador (modo web) | Chromium, Edge o Firefox actualizados |

> **Nota.** Para la conexión serial desde el navegador se requiere la API Web Serial, disponible únicamente en navegadores basados en Chromium (Google Chrome, Microsoft Edge).

---

## 3. Inicio de la Aplicación

### 3.1 Pantalla de Carga

Al iniciar la aplicación, se presenta una **pantalla de carga (splash screen)** que realiza las siguientes acciones en segundo plano:

1. Carga de configuraciones del sistema.
2. Inicialización de variables de estado de las cabinas.
3. Verificación de servicios del backend (ControlPanel.API).
4. Preparación de los sistemas de gráficas y biometría.

Una barra de progreso animada indica el avance del proceso. Una vez completada la inicialización, la pantalla de carga desaparece automáticamente y se presenta la interfaz principal.

![image-20260329170226769](C:\Users\nikob\AppData\Roaming\Typora\typora-user-images\image-20260329170226769.png)

> **Nota.** Si la pantalla de carga permanece indefinidamente, verifique que el servicio **ControlPanel.API** esté en ejecución.

---

### 3.2 Conexión Serial al Microcontrolador

Antes de operar cualquier cabina, es necesario establecer la conexión serial con el microcontrolador. Este proceso se realiza desde la **cabecera de la aplicación** (ver sección [4.1](#41-cabecera-header)).

**Pasos para conectar:**

1. Conecte el microcontrolador al equipo mediante cable USB o adaptador USB-Serial.
2. En la cabecera, despliegue el área de herramientas de desarrollo (si no es visible, consulte la sección [9](#9-herramientas-de-desarrollo)).
3. Seleccione el **tipo de microcontrolador** en el selector correspondiente (Arduino Uno, Arduino Mega, ESP32 o MSP430).
4. Haga clic en **Escanear puertos** para detectar los puertos COM disponibles.
5. Seleccione el puerto COM correspondiente al microcontrolador en la lista desplegable.
6. Haga clic en **Conectar**.

Una vez establecida la conexión, el sistema la recuerda automáticamente (mediante `localStorage`) y la restablece al reiniciar la aplicación.

> **Importante.** Sin conexión serial activa, los comandos de control serán enviados pero no llegarán al hardware de las cabinas.

---

## 4. Interfaz Principal

### 4.1 Cabecera (Header)

La parte superior de la aplicación contiene:

- **Logotipos institucionales:** UPCH y GITSe.
- **Área de herramientas de desarrollo:** Selector de microcontrolador, escáner de puertos COM y registro de tramas enviadas/recibidas (ver sección [9](#9-herramientas-de-desarrollo)).

---

### 4.2 Arquitectura de Dos Paneles

La interfaz principal está dividida en **dos paneles de control independientes**, dispuestos horizontalmente en pantalla:

| Panel | Cabina predeterminada |
| --- | --- |
| Panel izquierdo (Panel 1) | Cabina 1 |
| Panel derecho (Panel 2) | Cabina 2 |

Cada panel opera de forma completamente independiente: sus controles, sensores, datos biométricos y estado de activación son independientes entre sí. Esto permite gestionar dos sesiones de estimulación de forma simultánea.

> **Nota.** Es posible cambiar la cabina asignada a cada panel mediante el selector de cabina ubicado en la parte superior de cada panel (Modo desarrollador habilitado).
>
> ![image-20260329170826712](C:\Users\nikob\AppData\Roaming\Typora\typora-user-images\image-20260329170826712.png)

---

### 4.3 Navegación por Pestañas

Cada panel de control cuenta con **tres pestañas** de navegación:

| Pestaña | Descripción |
| --- | --- |
| **Controles** | Envío de comandos a actuadores, audio e iluminación |
| **Sensores** | Monitoreo en tiempo real de variables ambientales |
| **Biometría** | Registro y visualización de datos fisiológicos del sujeto |

Solo una pestaña puede estar activa por panel en un momento dado. Para cambiar de pestaña, haga clic en el nombre correspondiente en la barra superior del panel.

---

## 5. Pestaña: Controles

La pestaña de controles permite enviar comandos de activación y configuración a todos los actuadores de la cabina seleccionada.

![image-20260329170252998](C:\Users\nikob\AppData\Roaming\Typora\typora-user-images\image-20260329170252998.png)

---

### 5.1 Activación de Cabina

> **Requisito previo obligatorio.** Antes de interactuar con cualquier control, la cabina debe ser activada explícitamente.

**Procedimiento:**

1. Localice el botón **`ACTIVAR CABINA`** en la esquina inferior derecha del panel.
2. Haga clic en él. El indicador de estado cambiará de **`INACTIVA` (rojo)** a **`ACTIVA` (verde)**.
3. A partir de este momento, todos los controles del panel estarán habilitados y operativos.

| Estado del indicador | Significado |
| --- | --- |
| `INACTIVA` (rojo) | La cabina no está operativa; los comandos no se enviarán al hardware |
| `ACTIVA` (verde) | La cabina está operativa; todos los controles funcionan normalmente |

---

### 5.2 Control de Actuadores

Una vez activada la cabina, los actuadores pueden controlarse individualmente mediante sus botones correspondientes.

#### Lógica general de operación (ON/OFF)

La mayoría de los actuadores operan bajo un esquema **binario de alternancia**:

- **Primer clic:** Activa el actuador (estado `ON`). El botón cambia de apariencia para indicar el estado activo.
- **Segundo clic:** Desactiva el actuador (estado `OFF`). El botón regresa a su apariencia original.

Los actuadores con lógica ON/OFF simple son:

| Actuador | Descripción |
| --- | --- |
| **Frío** | Enciende/apaga el sistema de aire acondicionado de la cabina |
| **Humedad** | Activa/desactiva el sistema de humidificación |
| **Vibración** | Activa/desactiva el sistema de vibración de la cabina |
| **Ventilador** | Enciende/apaga el ventilador interno |
| **Extractor** | Activa/desactiva el extractor de aire |
| **Deshumidificador** | Activa/desactiva el sistema de deshumidificación |

#### Control de Calor (estados múltiples)

El actuador de **Calor** opera mediante una **máquina de estados cíclica** de cinco niveles, permitiendo un control más preciso de la intensidad térmica:

| Clic | Estado | Descripción |
| --- | --- | --- |
| 1° | `ON` + Nivel bajo | Calor activado en intensidad baja |
| 2° | Nivel medio | Calor en intensidad media |
| 3° | Nivel alto | Calor en intensidad alta |
| 4° | `OFF` | Calor desactivado |

El botón muestra visualmente el nivel activo en cada momento. Para avanzar al siguiente nivel, haga clic nuevamente.

---

### 5.3 Sistema de Humo

El sistema de humo requiere una **secuencia obligatoria de calentamiento** antes de poder realizar el disparo. Este procedimiento protege la máquina de humo y garantiza un disparo efectivo.

#### Procedimiento completo de operación

**Paso 1 — Iniciar calentamiento:**

1. Haga clic en el botón **`Humo`** para encender la máquina de humo y activar el temporizador de calentamiento (5 minutos por defecto).
2. El **indicador de estado de humo** mostrará color **rojo**, indicando que la máquina aún no está lista.
3. Durante el calentamiento, el temporizador contará el tiempo restante en pantalla.

**Paso 2 — Verificar disponibilidad:**

- Una vez transcurrido el tiempo de calentamiento, el indicador de estado cambiará a **verde**, confirmando que la máquina está lista para disparar.

**Paso 3 — Disparar humo:**

1. Con el indicador en verde, haga clic en el botón **`Disparo`** para liberar el humo.
2. Para detener el flujo de humo, haga clic nuevamente en **`Disparo`**.

> **Advertencia.** No intente realizar el disparo mientras el indicador permanezca en rojo. La máquina de humo requiere alcanzar su temperatura operativa para funcionar correctamente. Un disparo prematuro puede dañar el equipo o resultar en un disparo inefectivo.

---

### 5.4 Sistema de Audio

El sistema de audio permite reproducir tres categorías de estímulos sonoros: sonidos ambientales, tonos de tinnitus y tonos puros calibrados en frecuencia.

#### Categorías de sonido disponibles

**Sonidos Ambientales (12 opciones):**

| # | Sonido | # | Sonido |
| --- | --- | --- | --- |
| 1 | Aire acondicionado | 7 | Martillo neumático |
| 2 | Aspiradora | 8 | Motosierra |
| 3 | Centro comercial | 9 | Secadora de pelo |
| 4 | Máquina de coser | 10 | Taladro |
| 5 | Construcción | 11 | Ventilador |
| 6 | Lavadora | 12 | Ventilador industrial |

**Tonos de Tinnitus (12 opciones):**

- Tinnitus 1 al Tinnitus 12 (tonos de alta frecuencia para estimulación auditiva específica).

**Tonos Puros Calibrados (8 frecuencias):**

| Frecuencia | Aplicación típica |
| --- | --- |
| 125 Hz | Graves profundos |
| 250 Hz | Graves |
| 500 Hz | Medios bajos |
| 1 kHz | Medios |
| 2 kHz | Medios altos |
| 4 kHz | Agudos |
| 6 kHz | Agudos altos |
| 8 kHz | Ultra-agudos |

#### Controles de reproducción

| Control | Función |
| --- | --- |
| **Selección de sonido** | Hacer clic en el botón del sonido/tono deseado para seleccionarlo |
| **Play** | Inicia la reproducción del sonido seleccionado |
| **Volumen +** | Incrementa el volumen en la cabina |
| **Volumen −** | Reduce el volumen en la cabina |
| **Stop** | Detiene la reproducción del sonido activo |
| **Slider de volumen** | Ajuste fino del volumen (rango: 0–100%) |

> **Nota.** El volumen se gestiona de forma independiente por cabina. Cambiar el volumen en el Panel 1 no afecta el Panel 2.

---

### 5.5 Sistema de Iluminación RGB

El sistema de iluminación permite controlar tres grupos de LED independientes con paletas de colores diferenciadas por temperatura de color.

#### Grupos de iluminación

**Grupo Cálido (tonos cálidos):**

| Color | Descripción |
| --- | --- |
| Rojo | Rojo puro |
| Naranja oscuro | Naranja profundo |
| Naranja | Naranja estándar |
| Naranja claro | Naranja suave |
| Amarillo | Amarillo cálido |

**Grupo Frío (tonos fríos):**

| Color | Descripción |
| --- | --- |
| Azul oscuro | Azul profundo |
| Azul Dodger | Azul vibrante |
| Azul marino | Azul marino |
| Púrpura | Púrpura profundo |
| Violeta | Violeta |

**Grupo Neutro (tonos neutros):**

| Color | Descripción |
| --- | --- |
| Verde oscuro | Verde profundo |
| Verde claro | Verde suave |
| Verde brillante | Verde saturado |
| Verde mar | Verde azulado |
| Verde azulado (Teal) | Teal |

#### Efectos especiales y control de brillo

| Control | Función |
| --- | --- |
| **Strobo** | Activa efecto estroboscópico |
| **Flash** | Activa efecto de destello |
| **Brillo +** | Incrementa el brillo de la iluminación activa |
| **Brillo −** | Reduce el brillo de la iluminación activa |
| **Apagar todo** | Apaga todos los grupos de LED simultáneamente |

#### Procedimiento de uso

1. Seleccione el grupo de iluminación deseado (Cálido, Frío o Neutro).
2. Haga clic en el color específico dentro del grupo.
3. El indicador de color en la pestaña de Sensores se actualizará para reflejar el color activo en la cabina.
4. Para modificar el brillo, use los botones **Brillo +** / **Brillo −**.
5. Para desactivar toda la iluminación, haga clic en **Apagar todo**.

---

### 5.6 Parar y Resetear Cabina

El botón **`PARAR Y RESET`** realiza las siguientes acciones de forma simultánea:

1. Detiene todos los actuadores activos (frío, calor, humedad, etc.).
2. Detiene la reproducción de audio.
3. Apaga toda la iluminación.
4. Detiene el sistema de humo y el temporizador.
5. Regresa la cabina al estado **`INACTIVA`**.

> **Uso recomendado:** Ante cualquier situación de emergencia, incidente con el sujeto o necesidad de restablecer completamente el estado de la cabina, utilice este botón como punto de parada segura.

---

## 6. Pestaña: Sensores

La pestaña de Sensores permite monitorear en tiempo real todas las variables ambientales medidas por los sensores integrados en cada cabina.

![image-20260329170314811](C:\Users\nikob\AppData\Roaming\Typora\typora-user-images\image-20260329170314811.png)

---

### 6.1 Indicadores de Sensores

La sección presenta **9 indicadores de sensores**, cada uno con:

- **Valor actual:** Lectura numérica en tiempo real con su unidad de medida.
- **Botón de activación en gráfica:** Permite activar o desactivar la visualización del sensor en la gráfica histórica.

| Sensor | Unidad | Rango típico |
| --- | --- | --- |
| Acelerómetro X | m/s² | Varía según orientación |
| Acelerómetro Y | m/s² | Varía según orientación |
| Acelerómetro Z | m/s² | Varía según orientación |
| Temperatura | °C | 15–40 °C |
| Humedad relativa | % | 20–90 % |
| Luz ultravioleta (UV) | W/m² | 0–10 W/m² |
| Dióxido de carbono (CO₂) | ppm | 400–5000 ppm |
| Ozono (O₃) | ppb | 0–100 ppb |
| Nivel sonoro | dB | 30–120 dB |

---

### 6.2 Gráfica en Tiempo Real

La gráfica principal muestra el historial de las lecturas de los sensores seleccionados mediante Chart.js.

**Controles de la gráfica:**

| Acción | Procedimiento |
| --- | --- |
| Activar/desactivar un sensor | Hacer clic en el botón del sensor en la sección de indicadores |
| Hacer zoom en un rango | Usar la rueda del ratón sobre la gráfica o realizar un gesto de pellizco (touch) |
| Desplazarse en el tiempo | Hacer clic y arrastrar sobre la gráfica |
| Restablecer la vista | Doble clic sobre la gráfica |

> **Nota técnica.** Los datos históricos se mantienen en una ventana deslizante. Las lecturas más antiguas son descartadas automáticamente conforme llegan nuevas muestras.

---

### 6.3 Indicadores de Estado de Cabina

En la parte inferior de la sección de sensores se encuentran dos indicadores de estado:

| Indicador | Descripción |
| --- | --- |
| **Círculo de color** | Refleja el último color de iluminación activo en la cabina. Permite al operador confirmar visualmente el estímulo lumínico activo sin cambiar de pestaña. |
| **Círculo de humo** | **Rojo:** La máquina de humo no está lista (calentando o apagada). **Verde:** La máquina de humo está lista para realizar un disparo. |

---

## 7. Pestaña: Biometría

La pestaña de Biometría permite registrar, monitorear y visualizar los datos fisiológicos del sujeto en tiempo real mediante la integración con el reloj inteligente ET570.

![image-20260329170340626](C:\Users\nikob\AppData\Roaming\Typora\typora-user-images\image-20260329170340626.png)

---

### 7.1 Conexión del Reloj Inteligente

Cada panel dispone de controles independientes para gestionar la conexión del reloj ET570 asignado a cada cabina.

**Procedimiento de conexión:**

1. Asegúrese de que el reloj ET570 esté encendido y con Bluetooth activo.
2. En la pestaña de Biometría, localice la tarjeta de perfil (ProfileCard) del panel correspondiente.
3. Haga clic en el botón **`Conectar reloj`**.
4. El sistema establecerá la conexión Bluetooth con el dispositivo.
5. Una vez conectado, el indicador de estado del reloj cambiará a **activo** (verde) y comenzará la recepción de datos biométricos en tiempo real.

**Para desconectar:**

- Haga clic en el botón **`Desconectar reloj`**. El sistema dejará de recibir datos del dispositivo y el monitoreo se pausará.

> **Nota.** La conexión y desconexión del reloj es independiente por panel (Cabina 1 y Cabina 2 pueden tener relojes conectados/desconectados de forma autónoma).

---

### 7.2 Métricas Biométricas

Una vez conectado el reloj, el sistema actualiza las siguientes métricas cada **5 segundos**:

| Métrica | Unidad | Rango fisiológico normal |
| --- | --- | --- |
| **Pulso** | BPM (latidos por minuto) | 60–100 BPM (adulto en reposo) |
| **Oxigenación (SpO₂)** | % | 95–100 % |
| **Temperatura corporal** | °C | 36.1–37.2 °C |
| **Tensión arterial** | mmHg | 80–120 mmHg (sistólica/diastólica) |

Las métricas se presentan en:

- **Tarjetas de resumen (SummaryMetricsRow):** Cuatro tarjetas con el valor actual destacado de cada métrica.
- **Cuadrícula de métricas (TopMetricsGrid):** Seis tarjetas con información ampliada.

> **Aviso clínico.** Los valores mostrados son orientativos y no sustituyen el criterio médico. Ante cualquier valor fuera de rango, siga los protocolos establecidos por el personal médico responsable de la sesión.

---

### 7.3 Datos Personales del Sujeto

El formulario de datos personales permite registrar información antropométrica del sujeto para su inclusión en el reporte de exportación.

| Campo | Tipo | Rango |
| --- | --- | --- |
| **Edad** | Número entero | 0–99 años |
| **Talla** | Número | Centímetros |
| **Peso** | Número | Kilogramos |
| **Género** | Selección | Masculino / Femenino / No definido |

**Controles del formulario:**

- **`Guardar`:** Almacena los datos en memoria. Es necesario guardar antes de exportar para que los datos personales aparezcan en el archivo Excel.
- **`Limpiar`:** Borra todos los campos del formulario y elimina los datos guardados en memoria.

> **Importante.** Los datos personales no se persisten entre sesiones. Deberán ingresarse nuevamente al iniciar cada sesión de evaluación.

---

### 7.4 Visualización de Gráficas Biométricas

La sección de gráficas biométricas muestra el historial de las últimas mediciones en una ventana temporal de **10 minutos**.

**Para cambiar la métrica visualizada:**

1. Localice el menú desplegable de selección de métrica (selector encima de la gráfica).
2. Seleccione la métrica deseada: Pulso, SpO₂, Temperatura o Tensión arterial.
3. La gráfica se actualizará automáticamente para mostrar el historial de la métrica seleccionada.

Las gráficas soportan las mismas interacciones de zoom y desplazamiento que las gráficas de sensores (ver sección [6.2](#62-gráfica-en-tiempo-real)).

---

## 8. Exportación de Datos (Excel)

Al finalizar una sesión, el sistema permite exportar todos los datos registrados en un **archivo Excel (.xlsx)** con cuatro hojas de trabajo.

**Para exportar:**

1. Haga clic en el botón **`Exportar`** (ubicado en la barra de pestañas de cualquier panel).
2. El sistema generará automáticamente el archivo.
3. El archivo se descargará con el nombre: `ControlPanel_Export_YYYY-MM-DD.xlsx`

### Estructura del archivo exportado

| Hoja | Contenido |
| --- | --- |
| **Información Personal** | Datos antropométricos del sujeto (edad, talla, peso, género) y registro de eventos del sistema |
| **Controles** | Historial completo de tramas de comandos enviados, con descripción de cada acción y marca de tiempo |
| **Sensores** | Lecturas históricas de todos los sensores ambientales de ambas cabinas (Cabina 1 y Cabina 2) |
| **Biometría** | Historial de pulso, SpO₂, temperatura corporal y tensión arterial de ambas cabinas |

> **Nota.** Para que los datos personales del sujeto aparezcan en la hoja "Información Personal", asegúrese de haber guardado el formulario de datos personales antes de exportar (ver sección [7.3](#73-datos-personales-del-sujeto)).

---

## 9. Herramientas de Desarrollo

![image-20260329170421244](C:\Users\nikob\AppData\Roaming\Typora\typora-user-images\image-20260329170421244.png)

![image-20260329170633330](C:\Users\nikob\AppData\Roaming\Typora\typora-user-images\image-20260329170633330.png)

El sistema incluye un conjunto de herramientas de diagnóstico orientadas al personal técnico para facilitar la depuración del protocolo de comunicación y la verificación del hardware.

> **Nota.** Estas herramientas están ocultas por defecto en la interfaz de usuario estándar y son accesibles mediante la cabecera de la aplicación al ingresar el comando `pcdev`.

### Herramientas disponibles

| Herramienta | Descripción |
| --- | --- |
| **Selector de microcontrolador** | Permite especificar el tipo de dispositivo conectado: Arduino Uno, Arduino Mega, ESP32 o MSP430![image-20260329170714457](C:\Users\nikob\AppData\Roaming\Typora\typora-user-images\image-20260329170714457.png) |
| **Escáner de puertos COM** | Detecta y lista los puertos seriales disponibles en el sistema |
| **Selector de puerto COM** | Permite seleccionar el puerto al cual conectarse![image-20260329170725246](C:\Users\nikob\AppData\Roaming\Typora\typora-user-images\image-20260329170725246.png) |
| **Botón Conectar / Desconectar** | Establece o cierra la conexión serial con el microcontrolador seleccionado |
| **Log de tramas enviadas** | Panel con desplazamiento que muestra todas las tramas de control enviadas al hardware en tiempo real ![image-20260329170739384](C:\Users\nikob\AppData\Roaming\Typora\typora-user-images\image-20260329170739384.png) |
| **Log de tramas recibidas** | Panel con desplazamiento que muestra todas las tramas de respuesta recibidas desde el hardware ![image-20260329170747466](C:\Users\nikob\AppData\Roaming\Typora\typora-user-images\image-20260329170747466.png) |

Estos registros son especialmente útiles para:

- Verificar que los comandos lleguen correctamente al microcontrolador.
- Depurar problemas de comunicación serial.
- Validar el protocolo de tramas durante el desarrollo e integración del hardware.

---

## 10. Protocolo de Comunicación Serial

> Esta sección está orientada al personal técnico y de desarrollo.

Todos los comandos enviados a las cabinas siguen el siguiente formato de trama:

```text
[CabinaID][CódigoControl]F
```

**Ejemplo:** `C1001F` → Cabina 1, código `001` (Frío ON), carácter de fin de trama `F`.

### Tabla de códigos de control

| Rango de códigos | Actuador / Función |
| --- | --- |
| `000–001` | Frío (OFF / ON) |
| `002–006` | Calor (OFF / ON / Bajo / Medio / Alto) |
| `007–008` | Humedad (OFF / ON) |
| `009–010` | Vibración (OFF / ON) |
| `011–012` | Ventilador (OFF / ON) |
| `013–014` | Extractor (OFF / ON) |
| `015–016` | Deshumidificador (OFF / ON) |
| `017–018` | Humo (OFF / ON) |
| `019–020` | Disparo de humo (OFF / ON) |
| `035–038` | Audio: Play, Volumen+, Volumen−, Stop |
| `039–050` | Sonidos ambientales (12 sonidos) |
| `070–081` | Tonos de tinnitus (12 tonos) |
| `082–089` | Tonos puros calibrados (8 frecuencias: 125 Hz – 8 kHz) |
| `100` | Apagar toda la iluminación |
| `101–103` | Activar grupo de luces (Cálido / Frío / Neutro) |
| `104–118` | Colores LED individuales (15 colores, 5 por grupo) |
| `119–120` | Efectos: Strobo / Flash |
| `121–122` | Brillo: Incrementar / Decrementar |

---

## 11. Solución de Problemas

| Síntoma | Causa probable | Solución |
| --- | --- | --- |
| La pantalla de carga no desaparece | El servicio ControlPanel.API no está en ejecución | Inicie el servicio backend y recargue la aplicación |
| Los botones de control no responden | La cabina no está activada | Haga clic en `ACTIVAR CABINA` antes de operar |
| No se detectan puertos COM | Controlador USB-Serial no instalado o cable desconectado | Verifique la conexión del cable y los drivers del adaptador serial |
| Los sensores no muestran datos | Sin conexión serial activa o microcontrolador sin firmware | Verifique la conexión serial y el estado del microcontrolador |
| El reloj biométrico no conecta | Bluetooth desactivado en el reloj o en el equipo | Active el Bluetooth en ambos dispositivos y reintente la conexión |
| El humo no dispara | La máquina de humo no ha completado el calentamiento | Espere a que el indicador de humo cambie a verde antes de disparar |
| La exportación Excel no incluye datos personales | No se guardó el formulario de datos personales | Complete y guarde el formulario antes de exportar |
| La gráfica no muestra ningún sensor | Ningún sensor está activado en la gráfica | Haga clic en los botones de sensores para activarlos en la gráfica |
| La aplicación no recuerda el puerto COM | `localStorage` del navegador está bloqueado o limpio | Verifique que el navegador permita almacenamiento local para la aplicación |

---

## 12. Glosario

| Término | Definición |
| --- | --- |
| **Actuador** | Dispositivo que convierte una señal de control en una acción física (calor, vibración, sonido, etc.) |
| **BPM** | Latidos por minuto; métrica de frecuencia cardíaca |
| **CO₂** | Dióxido de carbono; gas indicador de calidad del aire interior |
| **COM** | Denominación de puertos serie en Windows (Communication Port) |
| **ET570** | Modelo de reloj inteligente compatible con el sistema para medición biométrica |
| **O₃** | Ozono; gas cuya concentración se monitorea como indicador de calidad del aire |
| **Panel** | Cada uno de los dos bloques de control independientes que componen la interfaz principal |
| **ppb** | Partes por billón; unidad de concentración para gases traza (O₃) |
| **ppm** | Partes por millón; unidad de concentración para CO₂ |
| **RGB** | Sistema de color aditivo basado en Rojo, Verde y Azul; base del sistema de iluminación de cabinas |
| **Serial / COM** | Protocolo de comunicación punto a punto utilizado entre el software y el microcontrolador |
| **SpO₂** | Saturación de oxígeno en sangre periférica; medida mediante pulsioximetría |
| **Tinnitus** | Percepción de sonido sin fuente externa; los tonos de tinnitus se usan para estimulación auditiva específica |
| **Tono puro** | Señal sinusoidal de una sola frecuencia, utilizada en audiometría y estimulación auditiva calibrada |
| **Trama** | Secuencia de bytes enviada por el puerto serial que codifica un comando hacia el hardware |
| **WPAN** | Wireless Personal Area Network; red inalámbrica de área personal que interconecta los módulos de las cabinas |

---

*Documento elaborado por el Departamento de Cómputo — Gradus Tech para GITSe. Versión 1.0.0 — Marzo 2026.*
