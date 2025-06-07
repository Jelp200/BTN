# PANEL DE CONTROL :control_knobs:

![Header](imgs/header.png)

## 📋 Indice

1. [Descripción General](docs/DescripcionGeneral.md)
2. [Arquitectura del Sistema](docs/ArquitecturaDelSistema.md)
3. [Aplicación de Escritorio (C#)](docs/AplicacionEscritorio.md)
4. [Firmware del Microcontrolador (C)](docs/Firmware.md)
5. [Interfaz Web (Astro + Tailwind + JS)](docs/InterfazWeb.md)
6. [Comunicación entre Módulos](docs/ComunicacionEntreModulos.md)
7. [Autores y Licencia](docs/Autores.md)

---

## 📌 Descripción General

Esta aplicación controla actuadores y monitorea sensores conectados a un microcontrolador (MSP430) desde una interfaz de escritorio o web. Los datos de sensores y comandos se intercambian mediante un protocolo serial entre los diferentes módulos.

---

## 🧱 Arquitectura del Sistema

```plaintext
┌──────────────────┐         UART/USB          ┌──────────────────┐
│  APLICACION C#   |  <─────────────────────>  │      uC (C)      |
└──────────────────┘                           └──────────────────┘
         ↑
         |       API
         ↓
┌──────────────────┐
|   INTERFAZ WEB   |
| (Astro/Tailwind) |
└──────────────────┘
```

---

## :file_folder: Organizacion carpetas

```plaintext
src/
├── app/
├── docs/
├── imgs/
├── uC/
|   ├── Codigos nuevos/
|   └── Codigos originales/
├── LICENSE/
└── README.md/
```

---

## :shipit: Copiar proyecto

```sh
git clone https://github.com/Jelp200/BTN.git
```
