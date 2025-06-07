# PANEL DE CONTROL :control_knobs:

![Header](imgs/header.png)

## 📋 Indice

1. [Descripción General](#descripcion-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Aplicación de Escritorio (C#)](#aplicación-de-escritorio-c)
4. [Firmware del Microcontrolador (C)](#firmware-del-microcontrolador-c)
5. [Interfaz Web (Astro + Tailwind + JS)](#interfaz-web-astro--tailwind--js)
6. [Comunicación entre Módulos](#comunicación-entre-módulos)
7. [Autores y Licencia](#autores-y-licencia)

---

## 📌 Descripción General

Esta aplicación controla actuadores y monitorea sensores conectados a un microcontrolador (MSP430) desde una interfaz de escritorio o web. Los datos de sensores y comandos se intercambian mediante un protocolo serial entre los diferentes módulos.

---

## 🧱 Arquitectura del Sistema

```plaintext
+------------------+         UART/USB          +----------------------+
| Aplicación C#    |  <--------------------->  | Microcontrolador (C) |
| (Windows Forms)  |                          |                      |
+------------------+                          +----------------------+
         ↑                                              ↓
         |                                              |
         |      API HTTP / WebSocket (si aplica)        |
         ↓                                              ↑
+------------------+                          +----------------------+
| Interfaz Web     |                          | Backend opcional     |
| (Astro/Tailwind) |                          | (Node.js, Express)   |
+------------------+                          +----------------------+
